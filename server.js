const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const sheets = google.sheets({ version: 'v4', auth: 'AIzaSyAbBLHfjrG_a-_J164or-Fea_tqAKewdao' });

const HIGHEST_SCORES_FILE = path.join(__dirname, 'highestScores.json');

// Middleware to parse JSON bodies
app.use(express.json());

// Function to load the highest scores from the JSON file
function loadHighestScores() {
    if (fs.existsSync(HIGHEST_SCORES_FILE)) {
        const data = fs.readFileSync(HIGHEST_SCORES_FILE);
        return JSON.parse(data);
    }
    return {};
}

// Function to save the highest scores to the JSON file
function saveHighestScores(highestScores) {
    fs.writeFileSync(HIGHEST_SCORES_FILE, JSON.stringify(highestScores, null, 2));
}

// Function to update the highest scores
function updateHighestScores(currentDeltas) {
    const highestScores = loadHighestScores();

    currentDeltas.forEach(player => {
        const currentBest = highestScores[player.name]?.bestScore || 0;
        if (player.delta > currentBest) {
            highestScores[player.name] = { bestScore: player.delta };
        }
    });

    saveHighestScores(highestScores);
}

// Calculate the range based on the sheet name
function calculateRange(sheetName) {
    const START_DATE = new Date('2020-02-01');
    const now = new Date(); 

    START_DATE.setHours(0, 0, 0, 0);
    let daysPassed = Math.floor((now - START_DATE) / (24 * 60 * 60 * 1000));
    let endRow = daysPassed + 1;

    if (sheetName === "20k total" || sheetName === "20k HS") {
        endRow = 1665;
    } 

    return `A1:AR${endRow}`;
}

// Fetch data from Google Sheets
async function fetchData(sheetName) {
    let range = calculateRange(sheetName); 
    console.log(range);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1rr-A067YWZbvrAE5_axiwtsC3gXg88xOl53C4NuhNCc',
        range: `${sheetName}!${range}`, 
    });
    return response.data.values;
}

// Route to fetch highest scores
app.get('/highest-scores', (req, res) => {
    try {
        const highestScores = loadHighestScores();
        res.json(highestScores);
    } catch (error) {
        console.error("Error fetching highest scores:", error);
        res.status(500).json({ error: "Error fetching highest scores" });
    }
});

app.post('/save-highest-scores', (req, res) => {
    const updatedScores = req.body;

    // Specify the path to the JSON file
    const filePath = path.join(__dirname, 'highestScores.json');

    // Write the updated scores to the file
    fs.writeFile(filePath, JSON.stringify(updatedScores, null, 2), (err) => {
        if (err) {
            console.error("Error saving highest scores:", err);
            return res.status(500).send("Internal Server Error");
        }
        console.log("Highest scores updated successfully.");
        res.status(200).send("Scores saved successfully.");
    });
});


// Route to save highest scores based on incoming deltas
app.post('/update-highest-scores', (req, res) => {
    const currentDeltas = req.body;

    if (!Array.isArray(currentDeltas)) {
        return res.status(400).json({ error: "Invalid data format. Expected an array of deltas." });
    }

    try {
        updateHighestScores(currentDeltas);
        res.sendStatus(200); // Respond with a success status
    } catch (error) {
        console.error("Error updating highest scores:", error);
        res.status(500).json({ error: "Error updating highest scores" });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch data from the specified sheet
app.get('/data', async (req, res) => {
    try {
        const sheetName = req.query.sheet || '30k total'; 
        const data = await fetchData(sheetName);
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send('Error fetching data');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
