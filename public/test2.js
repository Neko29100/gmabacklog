// readColorJson.js
const fs = require('fs');
const path = require('path');

// Path to the JSON file
const filePath = path.join(__dirname, 'colors.json');

// Function to read and parse the JSON file
function readJsonFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    try {
      const jsonData = JSON.parse(data);
      console.log('JSON data:', jsonData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  });
}

// Execute the function
readJsonFile(filePath);
