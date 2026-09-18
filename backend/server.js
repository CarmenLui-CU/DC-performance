const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Public Google Sheet CSV Export URL
const SHEET_ID = '10QwbD_iQuL2iL4HAkhZ61uAIiXcvSOT6j1EcswRO-lY';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Simple in-memory cache to avoid rate limiting
let cachedData = null;
let lastFetchTime = 0;
let cachedEdmData = null;
let lastEdmFetchTime = 0;

let cachedVisualsSummary = null;
let lastVisualsSummaryTime = 0;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const EDM_CSV_URL = 'https://docs.google.com/spreadsheets/d/1uhlxFpYAuOXO4A1BhKVWp56dKskzq6Oh8HTee8kfaiM/gviz/tq?tqx=out:csv&sheet=CUHK%20Focus%20eDM';
const VISUALS_LOG_CSV_URL = 'https://docs.google.com/spreadsheets/d/1uhlxFpYAuOXO4A1BhKVWp56dKskzq6Oh8HTee8kfaiM/export?format=csv&gid=470175709';

// Text cleaning for Mojibake characters
function cleanString(str) {
  if (!str) return '';
  return str
    .replace(/‰∏≠Â§ßË¶ñÈáé/g, '中大視野')
    .replace(/‰∏≠Â§ßËßÜÈáé/g, '中大視界')
    .replace(/Ê¥ªÂä®Á¥†Êùê‰∏äËΩΩ/g, '活動素材上載')
    .replace(/Ë¨õÂ∫ßË´ñÊñáÈõÜ/g, '講座論文集')
    .replace(/Á¨¨ÂçÅÊúüÈô¢Â£´ÂºÄËÆ≤/g, '第七屆期頤學人開講');
}

// Parse filename and size from content string (e.g., "Landmarks.png(2.76MB)")
function parseFileNameAndSize(content) {
  if (!content) return { name: '', size: '' };
  const clean = cleanString(content);
  const match = clean.match(/^(.*?)\(([^)]+)\)$/);
  if (match) {
    return { name: match[1].trim(), size: match[2].trim() };
  }
  return { name: clean.trim(), size: '' };
}

// Convert date like "9/17/26 14:57" to "Sep '26"
function getMonthYearStr(dateStr) {
  if (!dateStr) return 'Unknown';
  let date;
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[2], 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      date = new Date(fullYear, month - 1, 1);
    }
  } else if (dateStr.includes('-')) {
    date = new Date(dateStr);
  }
  
  if (date && !isNaN(date.getTime())) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} '${date.getFullYear().toString().substring(2)}`;
  }
  return 'Unknown';
}

// Reusable scope-level aggregator to partition CUHK Visuals and DAM
function aggregateScope(recordsList) {
  let totalPreviews = 0;
  let totalDownloads = 0;
  let totalShares = 0;
  let totalRequests = 0;
  let totalApprovals = 0;

  let totalSettings = 0;
  let totalUpdates = 0;
  let totalRemovals = 0;

  const locationStats = {};
  const monthlyStats = {};
  const fileStats = {};
  const userStats = {};

  recordsList.forEach((r) => {
    const op = r.Operation || '';
    const loc = cleanString(r.Location || 'Unknown');
    const content = r.Content || '';
    const dateStr = r['Date and Time'] || '';
    const user = cleanString(r.User || 'anonymous');

    let type = 'other';
    const opLower = op.toLowerCase();
    if (opLower.includes('preview')) {
      type = 'preview';
      totalPreviews++;
    } else if (opLower.includes('download')) {
      type = 'download';
      totalDownloads++;
    } else if (opLower.includes('share')) {
      type = 'share';
      totalShares++;
    } else if (opLower.includes('request')) {
      type = 'request';
      totalRequests++;
    } else if (opLower.includes('approve')) {
      type = 'approve';
      totalApprovals++;
    }

    // Pre-publishing pipeline classification
    if (opLower.includes('upload') || opLower.includes('assign') || opLower.includes('pending to approved') || opLower.includes('add multiple files')) {
      totalSettings++;
    } else if (opLower.includes('update') || opLower.includes('edited tag') || opLower.includes('edited keyword') || opLower.includes('edit metadata')) {
      totalUpdates++;
    } else if (opLower.includes('delete') || opLower.includes('remove') || opLower.includes('approved to restricted') || opLower.includes('pending to restricted')) {
      totalRemovals++;
    }

    // Group by Location/Platform
    if (!locationStats[loc]) {
      locationStats[loc] = { location: loc, total: 0, preview: 0, download: 0, share: 0 };
    }
    locationStats[loc].total++;
    if (type === 'preview') locationStats[loc].preview++;
    if (type === 'download') locationStats[loc].download++;
    if (type === 'share') locationStats[loc].share++;

    // Trend over time
    const monthStr = getMonthYearStr(dateStr);
    if (!monthlyStats[monthStr]) {
      monthlyStats[monthStr] = { name: monthStr, preview: 0, download: 0, share: 0 };
    }
    if (type === 'preview') monthlyStats[monthStr].preview++;
    if (type === 'download') monthlyStats[monthStr].download++;
    if (type === 'share') monthlyStats[monthStr].share++;

    // File-level journey details
    if (content) {
      const { name, size } = parseFileNameAndSize(content);
      if (name) {
        if (!fileStats[name]) {
          fileStats[name] = { file: name, size: size, preview: 0, download: 0, share: 0, request: 0, approve: 0, total: 0 };
        }
        fileStats[name].total++;
        if (size && !fileStats[name].size) fileStats[name].size = size;

        if (type === 'preview') fileStats[name].preview++;
        if (type === 'download') fileStats[name].download++;
        if (type === 'share') fileStats[name].share++;
        if (type === 'request') fileStats[name].request++;
        if (type === 'approve') fileStats[name].approve++;
      }
    }

    // User stats tracking
    if (!userStats[user]) {
      userStats[user] = 0;
    }
    userStats[user]++;
  });

  const sortedLocations = Object.values(locationStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const sortedTrend = Object.values(monthlyStats);

  const topDownloads = Object.values(fileStats)
    .sort((a, b) => b.download - a.download)
    .slice(0, 30);

  const topPreviews = Object.values(fileStats)
    .sort((a, b) => b.preview - a.preview)
    .slice(0, 30);

  const journeyOfInfluence = Object.values(fileStats)
    .map(f => {
      const score = f.download * 3 + f.share * 5 + f.preview;
      const conversionRate = f.preview > 0 ? (((f.download + f.share) / f.preview) * 100).toFixed(1) + '%' : '0.0%';
      return { ...f, score, conversionRate };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  const sortedUsers = Object.entries(userStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topUsers = sortedUsers.slice(0, 7);
  if (sortedUsers.length > 7) {
    const othersValue = sortedUsers.slice(7).reduce((acc, curr) => acc + curr.value, 0);
    topUsers.push({ name: 'Others', value: othersValue });
  }

  return {
    summary: {
      totalEvents: recordsList.length,
      totalPreviews,
      totalDownloads,
      totalShares,
      totalRequests,
      totalApprovals,
      conversionRate: totalPreviews > 0 ? ((totalDownloads / totalPreviews) * 100).toFixed(2) + '%' : '0.00%'
    },
    pipeline: {
      setting: totalSettings,
      updating: totalUpdates,
      removing: totalRemovals,
      totalPipelineEvents: totalSettings + totalUpdates + totalRemovals
    },
    locations: sortedLocations,
    users: topUsers,
    monthlyTrend: sortedTrend.reverse(),
    topDownloads,
    topPreviews,
    journeyOfInfluence
  };
}

app.get('/api/edm-stats', async (req, res) => {
  try {
    const now = Date.now();
    // Use cached data if available and fresh
    if (cachedEdmData && (now - lastEdmFetchTime < CACHE_TTL_MS)) {
      return res.json({ source: 'cache', data: cachedEdmData });
    }

    // Fetch the CSV directly from the public URL
    const response = await axios.get(EDM_CSV_URL);
    const csvContent = response.data;

    // Parse CSV into array of objects
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Update Cache
    cachedEdmData = records;
    lastEdmFetchTime = now;

    res.json({ source: 'live', data: records });
  } catch (error) {
    console.error('Error fetching/parsing EDM Google Sheet:', error.message);
    res.status(500).json({ error: 'Failed to fetch EDM spreadsheet data' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const now = Date.now();
    // Use cached data if available and fresh
    if (cachedData && (now - lastFetchTime < CACHE_TTL_MS)) {
      return res.json({ source: 'cache', data: cachedData });
    }

    // Fetch the CSV directly from the public URL
    const response = await axios.get(CSV_URL);
    const csvContent = response.data;

    // Parse CSV into array of objects
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Update Cache
    cachedData = records;
    lastFetchTime = now;

    res.json({ source: 'live', data: records });
  } catch (error) {
    console.error('Error fetching/parsing Google Sheet:', error.message);
    res.status(500).json({ error: 'Failed to fetch spreadsheet data' });
  }
});

app.get('/api/visuals-summary', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedVisualsSummary && (now - lastVisualsSummaryTime < CACHE_TTL_MS)) {
      return res.json({ source: 'cache', data: cachedVisualsSummary });
    }

    console.log('Fetching live CUHK Visuals Log data from Google Sheet...');
    const response = await axios.get(VISUALS_LOG_CSV_URL);
    const csvContent = response.data;

    console.log('Parsing CUHK Visuals Log CSV...');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Partitioning and aggregating ${records.length} records...`);
    const cuhkVisualsRecords = [];
    const damRecords = [];

    records.forEach((r) => {
      const loc = cleanString(r.Location || 'Unknown');
      const isCUHKVisuals = loc === 'CUHK Visuals' || loc === '中大視野' || loc === '中大視界';
      if (isCUHKVisuals) {
        cuhkVisualsRecords.push(r);
      } else {
        damRecords.push(r);
      }
    });

    const summaryData = {
      totalEvents: records.length,
      cuhkVisuals: aggregateScope(cuhkVisualsRecords),
      dam: aggregateScope(damRecords)
    };

    cachedVisualsSummary = summaryData;
    lastVisualsSummaryTime = now;

    res.json({ source: 'live', data: summaryData });
  } catch (error) {
    console.error('Error fetching/parsing Visuals Log Google Sheet:', error.message);
    res.status(500).json({ error: 'Failed to fetch and aggregate Visuals Log data' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
