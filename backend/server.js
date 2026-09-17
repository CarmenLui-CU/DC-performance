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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

    // Parse CSV into array of objects (using the first row as headers)
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

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
