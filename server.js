const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets API setup
const sheets = google.sheets({ version: 'v4', auth: 'AIzaSyAbBLHfjrG_a-_J164or-Fea_tqAKewdao' });

const START_DATE = new Date('2020-01-02'); // Set your reference start date

function calculateRange() {
    const today = new Date();
    const weeksPassed = Math.floor((today - START_DATE) / (7 * 24 * 60 * 60 * 1000));
    const endRow = weeksPassed - 2; // Start from row 241 and add the number of weeks passed
    return `A1:AR${endRow}`;
}

async function fetchData(sheetName) {
    const range = calculateRange(); // Calculate the range dynamically
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1rr-A067YWZbvrAE5_axiwtsC3gXg88xOl53C4NuhNCc',
        range: `${sheetName}!${range}`, // Use the dynamically calculated range
    });
    return response.data.values;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', async (req, res) => {
    const sheetName = req.query.sheet || '30k total clean'; 
    try {
        const data = await fetchData(sheetName);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
