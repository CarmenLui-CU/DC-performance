const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const VISUALS_LOG_CSV_URL = 'https://docs.google.com/spreadsheets/d/1uhlxFpYAuOXO4A1BhKVWp56dKskzq6Oh8HTee8kfaiM/export?format=csv&gid=470175709';
const OUTPUT_PATH = './frontend/public/visuals-summary.json';

function cleanString(str) {
  if (!str) return '';
  return str
    .replace(/‰∏≠Â§ßË¶ñÈáé/g, '中大視野')
    .replace(/‰∏≠Â§ßËßÜÈáé/g, '中大視界')
    .replace(/Ê¥ªÂä®Á¥†Êùê‰∏äËΩΩ/g, '活動素材上載')
    .replace(/Ë¨õÂ∫ßË´ñÊñáÈõÜ/g, '講座論文集')
    .replace(/Á¨¨ÂçÅÊúüÈô¢Â£´ÂºÄËÆ≤/g, '第七屆期頤學人開講');
}

function parseFileNameAndSize(content) {
  if (!content) return { name: '', size: '' };
  const clean = cleanString(content);
  const match = clean.match(/^(.*?)\(([^)]+)\)$/);
  if (match) {
    return { name: match[1].trim(), size: match[2].trim() };
  }
  return { name: clean.trim(), size: '' };
}

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
      const conversionRate = f.preview > 0 ? ((f.download / f.preview) * 100).toFixed(1) + '%' : '0.0%';
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

async function run() {
  console.log('Fetching live CUHK Visuals Log data from Google Sheet...');
  try {
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
      const isCUHKVisuals = loc === 'CUHK Visuals' || loc === '中大視野' || loc === '中大視界' || loc === '活動素材上載';
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

    // Ensure output directory exists
    const dir = require('path').dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ source: 'static', data: summaryData }, null, 2), 'utf8');
    console.log(`Successfully generated static aggregated summary and saved to ${OUTPUT_PATH}!`);
  } catch (err) {
    console.error('Error generating static aggregated summary:', err.message);
    process.exit(1);
  }
}

run();
