const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets API setup
const sheets = google.sheets({ version: 'v4', auth: 'AIzaSyAbBLHfjrG_a-_J164or-Fea_tqAKewdao' });

async function fetchData() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1rr-A067YWZbvrAE5_axiwtsC3gXg88xOl53C4NuhNCc',
    range: 'RAWWR!A1:AO239',
  });
  return response.data.values;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
