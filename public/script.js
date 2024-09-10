let chart;
let labels = [];
let allData = [];
let showLabels = true; // Track whether labels should be shown
let areAllNamesHidden = false;
let sortByLatest = false; // Track the current sorting method
let savedColors = {}; // To store colors from color.json

const colors = {}; // Store colors for each name
const visibilityState = {}; // Tracks the visibility of each dataset (name)

let debounceTimer;
function debounce(func, delay) {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
}


const sheetSelect = document.getElementById("sheetSelect");
sheetSelect.addEventListener("change", async () => {
  await fetchChartData();
  const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);
});

document.getElementById("sortToggle").addEventListener("click", () => {
  sortByLatest = !sortByLatest; // Toggle the sorting method
  document.getElementById("sortToggle").textContent = sortByLatest
    ? "Sorting by Cumulative"
    : "Sorting by Latest"; // Update button text

  const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end); // Update the chart with the new sorting method
});


async function fetchChartData() {
  try {
    const sheetName = document.getElementById("sheetSelect").value;
    const response = await fetch(`/data?sheet=${sheetName}`);
    const data = await response.json();

    labels = data.slice(1).map((row) => row[0]);
    allData = data;

    try {
        const response = await fetch('colors.json'); // Update the path to your color.json file
        const data = await response.json();
        savedColors = data; // Assume the data is a key-value map of name-color pairs
      } catch (error) {
        console.error("Error fetching colors:", error);
      }

    // Initialize colors and color pickers
    initializeColorPickers();

    // Initialize the slider with the start handles positioned at the full range
    const slider = document.getElementById("slider");
    noUiSlider.create(slider, {
      start: [0, labels.length - 1], // Set the initial positions of the handles
      connect: true,
      range: {
        min: 0,
        max: labels.length - 1,
      },
      tooltips: [true, true],
      format: {
        to: (value) => labels[Math.round(value)],
        from: (value) => Math.round(value),
      },
    });

    // Set default cutoff value
    const cutoffInput = document.getElementById("cutoff");
    cutoffInput.value = 1; // Set default cutoff value
    cutoffInput.dispatchEvent(new Event("input")); // Trigger initial update

    // Initialize the chart with the full range
    //updateChart(0, labels.length - 1);

    // Update the chart when the slider values change
    slider.noUiSlider.on("update", debounce((values) => {
        const startLabel = values[0];
        const endLabel = values[1];
        const start = labels.indexOf(startLabel);
        const end = labels.indexOf(endLabel);
        updateChart(start, end);
        console.log("slider");
      }, 100));

    // Update the chart when the cutoff value changes
    cutoffInput.addEventListener("input", debounce(() => {
        const [startLabel, endLabel] = slider.noUiSlider.get();
        const start = labels.indexOf(startLabel);
        const end = labels.indexOf(endLabel);
        updateChart(start, end);
        console.log("cutoff");
      }, 100));

    // Toggle dots visibility
    const dotsToggle = document.getElementById("dotsToggle");
    dotsToggle.addEventListener("change", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    const labelsToggle = document.getElementById("labelsToggle");
    labelsToggle.addEventListener("change", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    // Update the chart when the number of names to display changes
    const numNamesInput = document.getElementById("numNames");
    numNamesInput.addEventListener("input", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    document.getElementById("exportJPG").addEventListener("click", () => {
      const canvas = document.getElementById("myChart");
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;

      // Scale factor for higher resolution
      const scaleFactor = 2; // Increase to improve quality

      // Create a temporary canvas to scale up the chart
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      tempCanvas.width = originalWidth * scaleFactor;
      tempCanvas.height = originalHeight * scaleFactor;

      // Scale up and redraw the chart
      tempCtx.scale(scaleFactor, scaleFactor);

      // Draw chart on the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Fill the canvas with white background
      tempCtx.save();
      tempCtx.globalCompositeOperation = "destination-over";
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.restore();

      // Convert to JPG Data URL
      const dataURL = tempCanvas.toDataURL("image/png", 1.0); // Quality (0.0 to 1.0)

      // Create a link to download the image
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "chart-high-quality.png"; // Set default file name
      link.click(); // Trigger the download

      // Clean up the temporary canvas
      tempCanvas.remove();
    });

    document
      .getElementById("toggleNamesButton")
      .addEventListener("click", toggleAllNames);

    document
    .getElementById("refreshColors")
    .addEventListener("click", () => {
        const names = allData[0].slice(1);
        const totalPoints = {};
        const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
        const start = labels.indexOf(startLabel);
        const end = labels.indexOf(endLabel);
      
        names.forEach((name, index) => {
          const dataSlice = allData
            .slice(1)
            .map((row) => row[index + 1])
            .slice(start, end + 1);
          totalPoints[name] = dataSlice.reduce(
            (acc, val) => acc + parseFloat(val) || 0,
            0
          );
        });
      
        const sortedNames = Object.keys(totalPoints).sort(
          (a, b) => totalPoints[b] - totalPoints[a]
        );
     toggleRefresh(sortedNames)});

     console.log('Color Data:', savedColors);

     if (savedColors.colors) {
        Object.keys(savedColors.colors).forEach((name) => {
          colors[name] = savedColors.colors[name];
        });
      }

  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function toggleRefresh (sortedNames) {
    Object.keys(colors).forEach((name) => {
        if(!savedColors[name]) {
            delete colors[name]
        }
        
    });
      sortedNames.forEach((name) => {
        const color = savedColors[name] || getRandomColor(name);
        console.log(`Color for ${name}: ${color}`); // Debugging line
      });

      const [startLabel, endLabel] = slider.noUiSlider.get(); // Get current slider positions
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
}

function initializeColorPickers(startIndex, endIndex) {
  const colorPickerContainer = document.getElementById("colorPickerContainer");
  colorPickerContainer.innerHTML = ""; // Clear existing color pickers

    // Fetch saved colors before initializing color pickers
   // await fetchColors();

  const names = allData[0].slice(1);
  const totalPoints = {};

  names.forEach((name, index) => {
    const dataSlice = allData
      .slice(1)
      .map((row) => row[index + 1])
      .slice(startIndex, endIndex + 1);
    totalPoints[name] = dataSlice.reduce(
      (acc, val) => acc + parseFloat(val) || 0,
      0
    );
  });

  const sortedNames = Object.keys(totalPoints).sort(
    (a, b) => totalPoints[b] - totalPoints[a]
  );

  sortedNames.forEach((name) => {
    // Use saved color if available, otherwise get a random color
    const color = savedColors[name] || getRandomColor(name);
    colors[name] = color; // Store color for this name

    const visibility = visibilityState[name] === false ? "hidden" : "visible"; // Ensure default visibility

    const colorPickerHtml = `
            <div class="color-picker-item" data-name="${name}">
                <span class="name-label" style="color: ${
                  visibility === "visible" ? "black" : "gray"
                }; text-decoration: ${
      visibility === "visible" ? "none" : "line-through"
    };" data-name="${name}">${name}</span>
                <input type="color" class="color-picker" data-name="${name}" value="${color}" style="margin-left: 10px;">
            </div>
        `;
    colorPickerContainer.insertAdjacentHTML("beforeend", colorPickerHtml);
  });

  // Add event listeners for color pickers
  document.querySelectorAll(".color-picker").forEach((picker) => {
    picker.addEventListener("change", (event) => {
      const name = event.target.getAttribute("data-name");
      const newColor = event.target.value;
      colors[name] = newColor;
      updateChart(startIndex, endIndex); // Update chart with new colors
    });
  });

  // Add event listeners for toggling visibility by clicking the name
  document.querySelectorAll(".name-label").forEach((label) => {
    label.addEventListener("click", (event) => {
      const name = event.target.getAttribute("data-name");
      visibilityState[name] = !visibilityState[name]; // Toggle visibility state
      updateChart(startIndex, endIndex); // Update chart to reflect the change
    });
  });
}

function getRandomColor(name) {
  // Assign a consistent random color for each name if it doesn't have one
  if (!colors[name]) {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    colors[name] = color;
  }
  return colors[name];
}

function toggleAllNames() {
  const names = allData[0].slice(1); // Get all names from the data

  if (areAllNamesHidden) {
    // Show all names
    names.forEach((name) => {
      visibilityState[name] = true;
    });
    document.getElementById("toggleNamesButton").textContent = "Hide All"; // Update button text
  } else {
    // Hide all names
    names.forEach((name) => {
      visibilityState[name] = false;
    });
    document.getElementById("toggleNamesButton").textContent = "Show All"; // Update button text
  }

  // Update the chart with the current range
  const [startLabel, endLabel] = document
    .getElementById("slider")
    .noUiSlider.get();
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);

  // Toggle the state
  areAllNamesHidden = !areAllNamesHidden;
}

function updateChart(startIndex, endIndex) {
  const filteredLabels = labels.slice(startIndex, endIndex + 1);
  const cutoffValue = parseFloat(document.getElementById("cutoff").value) || 0;
  const showDots = !document.getElementById("dotsToggle").checked;
  showLabels = document.getElementById("labelsToggle").checked;

  const numNames =
    parseInt(document.getElementById("numNames").value) || Infinity;
  const datasets = [];
  const names = allData[0].slice(1);

  let topNames;

  if (!sortByLatest) {
    const lastPoints = {};
    names.forEach((name, index) => {
      const dataSlice = allData
        .slice(1)
        .map((row) => row[index + 1])
        .slice(startIndex, endIndex + 1);
      // Get the last data point
      lastPoints[name] = parseFloat(dataSlice[dataSlice.length - 1]) || 0;
    });

    // Sort names based on the last data point in descending order
    const sortedNames = Object.keys(lastPoints).sort(
      (a, b) => lastPoints[b] - lastPoints[a]
    );

    // Get the top names based on the sorted order
    topNames = sortedNames.slice(0, numNames);
  } else {
    const totalPoints = {};
    names.forEach((name, index) => {
      const dataSlice = allData
        .slice(1)
        .map((row) => row[index + 1])
        .slice(startIndex, endIndex + 1);
      totalPoints[name] = dataSlice.reduce(
        (acc, val) => acc + parseFloat(val) || 0,
        0
      );
    });

    const sortedNames = Object.keys(totalPoints).sort(
      (a, b) => totalPoints[b] - totalPoints[a]
    );
    topNames = sortedNames.slice(0, numNames);
  }

  console.log(topNames);

  topNames.forEach((name) => {
    const dataSlice = allData
      .slice(1)
      .map((row) => row[names.indexOf(name) + 1])
      .slice(startIndex, endIndex + 1);
    const filteredDataSlice = dataSlice
      .map((value, idx) =>
        value >= cutoffValue ? { x: filteredLabels[idx], y: value } : null
      )
      .filter((v) => v !== null);

    if (filteredDataSlice.length > 0) {
      datasets.push({
        label: showLabels ? name : "",
        data: filteredDataSlice,
        borderColor: colors[name] || getRandomColor(name),
        backgroundColor: showDots
          ? colors[name] || getRandomColor(name)
          : "transparent",
        borderWidth: 2,
        pointRadius: showDots ? 0 : 2,
        hidden: visibilityState[name] === false,
      });
    }
  });

  if (chart) {
    chart.destroy();
  }

  const ctx = document.getElementById("myChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: filteredLabels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Value",
          },
        },
      },
      plugins: {
        legend: {
          display: showLabels,
        },
        annotation: {
          annotations: {
            flagDate: {
              type: "line",
              xMin: "09/25/2021",
              xMax: "09/25/2021",
              borderColor: "grey",
              borderWidth: 1,
              label: {
                text: "Date",
                enabled: true,
                position: "center",
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Background color for readability
                color: "black", // Text color
                font: {
                  size: 12, // Font size
                  weight: "bold", // Font weight
                },
              },
            },
          },
        },
      },
    },
  });
  
  initializeColorPickers(startIndex, endIndex);
}

// Ensure the chart data is fetched and the chart is initialized when the page loads
document.addEventListener("DOMContentLoaded", fetchChartData);
