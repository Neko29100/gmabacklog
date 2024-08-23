const math = require('mathjs');

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
];

// Extract headers and rows
const headers = rawData[0];
const rows = rawData.slice(1);

// Function to fit a power-law model and return parameters alpha and beta
function fitPowerLawModel(xData, yData) {
    const logX = xData.map(x => Math.log(x));
    const logY = yData.map(y => Math.log(y));

    // Prepare the design matrix X and vector Y
    const X = math.matrix([logX, Array(logX.length).fill(1)]);
    const Y = math.matrix(logY);

    // Perform matrix operations to solve for the coefficients
    const Xt = math.transpose(X);
    const XtX = math.multiply(Xt, X);
    const XtX_inv = math.inv(XtX);
    const XtY = math.multiply(Xt, Y);
    const coeffs = math.multiply(XtX_inv, XtY);

    const beta = coeffs._data[1]; // Intercept
    const alpha = -coeffs._data[0]; // Slope (negative of the coefficient for logX)

    return { alpha, beta };
}

// Function to predict using power-law model
function predictPowerLaw(x, params) {
    const { alpha, beta } = params;
    return Math.exp(beta) * Math.pow(x, alpha);
}

// Function to format a Date object to MM/DD/YYYY
function formatDate(date) {
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Step 2: Loop through each participant and process last four values
const newRows = Array.from({ length: 4 }, () => Array(headers.length).fill('')); // Initialize new rows array

headers.slice(1).forEach((participant, participantIndex) => {
    // Extract the last four values
    const lastFourRows = rows.slice(-4);
    const xData = lastFourRows.map((_, index) => rows.length - 4 + index + 1); // 1-based indices for X
    const yData = lastFourRows.map(row => parseFloat(row[participantIndex + 1]));

    // Fit the power-law model
    const params = fitPowerLawModel(xData, yData);

    // Predict the next four values
    const futureX = Array.from({ length: 4 }, (_, i) => rows.length + i + 1);
    const predictions = futureX.map(x => Math.round(predictPowerLaw(x, params))); // Round to the nearest integer

    // Add predictions to new rows
    predictions.forEach((prediction, i) => {
        const date = new Date(rows[rows.length - 1][0]);
        date.setDate(date.getDate() + (i + 1) * 7); // Increment date by 7 days for each new row
        const formattedDate = formatDate(date); // Format as MM/DD/YYYY
        newRows[i][0] = formattedDate; // Set the date for each new row
        newRows[i][participantIndex + 1] = prediction; // Set the prediction for the current participant
    });
});

// Add new rows to the end of existing rows
const updatedRows = rows.concat(newRows);

// Output the result
console.log([headers, ...updatedRows].map(row => row.join(', ')).join('\n'));
