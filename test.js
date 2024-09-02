const numeric = require('numeric');
const { plot } = require('nodeplotlib');

// Updated datasets with new values
const datasets = [
    [
        [1629670, 0, 3643876, 6372990, 822757, 6455560, 3336373, 6643415, 2581414, 1227527],
        [1629670, 0, 3643478, 6429432, 823137, 6475344, 3336065, 6647019, 2581414, 1227527],
        [1628974, 0, 3642537, 6441753, 823590, 6553198, 3335822, 6717391, 2581414, 1227527],
        [1628974, 0, 3640982, 6584046, 823590, 6577439, 3335386, 6708573, 2581414, 1227527]
    ]
];

// Define parameters
const numPredictions = 4; // Number of future points to predict
const ceiling = 8000000; // Set the ceiling value

// Logistic function
function logistic(t, C, k, t0) {
    return C / (1 + Math.exp(-k * (t - t0)));
}

// Cost function for optimization
function costFunction(params, data) {
    const [C, k, t0] = params;
    return data.reduce((sum, [t, y]) => {
        const yPred = logistic(t, C, k, t0);
        return sum + Math.pow(y - yPred, 2);
    }, 0);
}

// Optimize parameters for the logistic model
function fitLogisticModel(data) {
    const initialParams = [ceiling, 1, data.length / 2]; // Initial guess
    const result = numeric.uncmin(params => costFunction(params, data), initialParams);
    return result.solution;
}

// Prepare data for plotting
const plotData = [];

// Process each dataset
datasets.forEach((dataset, datasetIndex) => {
    // Transpose the dataset to get columns
    const columns = dataset[0].map((_, colIndex) => dataset.map(row => row[colIndex]));

    columns.forEach((columnData, colIndex) => {
        // Prepare data for logistic regression
        const formattedData = columnData.map((value, idx) => [idx, value]);

        // Fit logistic model
        const [C, k, t0] = fitLogisticModel(formattedData);

        // Predict the next data points
        const nextPoints = [];
        for (let i = columnData.length; i < columnData.length + numPredictions; i++) {
            let predictedY = logistic(i, C, k, t0);
            predictedY = Math.min(predictedY, ceiling); // Clamp to ceiling
            nextPoints.push([i, predictedY]);
        }

        // Combine the original and predicted data for plotting
        const fullX = formattedData.map(p => p[0]).concat(nextPoints.map(p => p[0]));
        const fullY = formattedData.map(p => p[1]).concat(nextPoints.map(p => p[1]));

        // Prepare data for plotting
        plotData.push(
            { x: columnData.map((_, i) => i), y: columnData, type: 'scatter', mode: 'lines+markers', name: `Dataset ${datasetIndex + 1} - Column ${colIndex + 1} - Original` },
            { x: fullX, y: fullY, type: 'line', name: `Dataset ${datasetIndex + 1} - Column ${colIndex + 1} - Logistic Fit` },
            { x: nextPoints.map(p => p[0]), y: nextPoints.map(p => p[1]), type: 'scatter', mode: 'markers', name: `Dataset ${datasetIndex + 1} - Column ${colIndex + 1} - Predicted`, marker: { color: 'red' } }
        );
    });
});

// Plot all columns
plot(plotData, { title: 'Logistic Regression and Predictions for Each Column' });
