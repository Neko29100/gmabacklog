const math = require('mathjs');
const Ridge = require('ml-ridge');
const { plot } = require('nodeplotlib');

// Sample data
const rawData = [
    ["Date", "BouncyJello", "hschindele", "Bramspr"],
    ["01/30/2020", "1", "1", "1"],
    ["02/06/2020", "3", "11", "15"],
    ["02/13/2020", "3", "21", "15"],
    ["02/20/2020", "7", "19", "15"],
    ["02/27/2020", "8", "19", "15"],
    ["03/05/2020", "14", "15", "15"],
    ["03/12/2020", "16", "14", "14"],
    ["03/19/2020", "27", "15", "14"],
    ["03/26/2020", "37", "19", "14"],
    ["04/02/2020", "51", "25", "14"],
    ["04/09/2020", "67", "34", "14"],
    ["04/16/2020", "85", "45", "13"],
];

const headers = rawData[0];
const rows = rawData.slice(1);

// Define parameters
const alpha = 1; // Ridge regression regularization parameter
const smoothingFactor = 0.2; // Adjust for smoother tapering
const ceiling = 100; // Adjust ceiling if needed

// Function to smooth and taper predictions
function smoothTaper(predictedY, lastY, ceiling) {
    if (predictedY > ceiling) {
        predictedY = ceiling;
    }
    if (predictedY < lastY) {
        predictedY = lastY * (1 - smoothingFactor) + predictedY * smoothingFactor;
    }
    return predictedY;
}

// Prepare data for plotting
const plotData = [];

// Apply ridge regression and tapering to each column
const newRows = Array.from({ length: 4 }, () => Array(headers.length).fill('')); // Initialize new rows array

headers.slice(1).forEach((participant, participantIndex) => {
    // Extract data for ridge regression
    const lastRows = rows.slice(-4);
    const xData = lastRows.map((_, index) => [rows.length - 4 + index + 1]); // 1-based indices for X
    const yData = lastRows.map(row => parseFloat(row[participantIndex + 1]));

    // Ridge Regression
    const ridge = new Ridge(alpha);
    ridge.fit(xData, yData);

    // Predict the next four data points
    const nextPoints = [];
    let lastY = yData[yData.length - 1];
    for (let i = rows.length + 1; i < rows.length + 5; i++) {
        const predictedY = ridge.predict([[i]])[0];
        const taperedY = smoothTaper(predictedY, lastY, ceiling);
        nextPoints.push([i, taperedY]);
        lastY = taperedY; // Update lastY for the next iteration
    }

    // Add predictions to new rows
    nextPoints.forEach((point, i) => {
        const date = new Date(rows[rows.length - 1][0]);
        date.setDate(date.getDate() + (i + 1) * 7);
        const formattedDate = formatDate(date);
        newRows[i][0] = formattedDate;
        newRows[i][participantIndex + 1] = Math.round(point[1]);
    });

    // Prepare data for plotting
    const xValues = lastRows.map((_, index) => rows.length - 4 + index + 1).concat(nextPoints.map(p => p[0]));
    const yValues = yData.concat(nextPoints.map(p => p[1]));

    plotData.push(
        { x: xData.flat(), y: yData, type: 'scatter', mode: 'markers', name: `Original ${participant}` },
        { x: xValues, y: yValues, type: 'line', name: `Ridge Fit ${participant}` },
        { x: nextPoints.map(p => p[0]), y: nextPoints.map(p => p[1]), type: 'scatter', mode: 'markers', name: `Predicted ${participant}`, marker: { color: 'red' } }
    );
});

// Combine original and new rows
const updatedRows = rows.concat(newRows);

console.log([headers, ...updatedRows].map(row => row.join(', ')).join('\n'));

// Helper function to format dates
function formatDate(date) {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Plot all columns
plot(plotData, { title: 'Ridge Regression and Predictions for Each Column' });
