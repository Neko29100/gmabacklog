const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const sheets = google.sheets({ version: 'v4', auth: 'AIzaSyAbBLHfjrG_a-_J164or-Fea_tqAKewdao' });

function calculateRange(sheetName) {
    const START_DATE = new Date('2020-02-01');
    const now = new Date(); 


    START_DATE.setHours(0, 0, 0, 0);

    let daysPassed = Math.floor((now - START_DATE) / (24 * 60 * 60 * 1000));

    let endRow = daysPassed + 1;

    if (sheetName == "20k total" || sheetName == "20k HS") {
        endRow = 1665;
    } 

    return `A1:AR${endRow}`;
    
}



async function fetchData(sheetName) {
    let range = calculateRange(sheetName); 
    console.log(range);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1rr-A067YWZbvrAE5_axiwtsC3gXg88xOl53C4NuhNCc',
        range: `${sheetName}!${range}`, 
    });
    return response.data.values;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/data', async (req, res) => {
    
    try {
        const sheetName = req.query.sheet || '30k total'; 
        const data = await fetchData(sheetName);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
