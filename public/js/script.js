let chart;
let labels = [];
let allData = [];
let showLabels = true;
let areAllNamesHidden = false;
let sortByLatest = false; 
let savedColors = {};
let sheetChange;
const colors = {};
const visibilityState = {};

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
  const [startLabel, endLabel] = slider.noUiSlider.get();
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);
  sheetChange = true;
});

document.getElementById("sortToggle").addEventListener("click", () => {
  sortByLatest = !sortByLatest;
  document.getElementById("sortToggle").textContent = sortByLatest
    ? "Sorting by Cumulative"
    : "Sorting by Latest";

  const [startLabel, endLabel] = slider.noUiSlider.get();
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);
});

let sheetName;

async function fetchChartData() {
  try {
    sheetName = document.getElementById("sheetSelect").value;
    const response = await fetch(`/data?sheet=${sheetName}`);
    const data = await response.json();

    labels = data.slice(1).map((row) => row[0]);
    allData = data;

    try {
        const response = await fetch('data/colors.json');
        const data = await response.json();
        savedColors = data; 
      } catch (error) {
        console.error("Error fetching colors:", error);
      }

    initializeColorPickers();

    if (slider.noUiSlider) {
      slider.noUiSlider.updateOptions({
        range: {
          min: 0,
          max: labels.length - 1,
        },
      });

      slider.noUiSlider.set([0, labels.length - 1]);
    } else {
      noUiSlider.create(slider, {
        start: [0, labels.length - 1],
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
    }

    const cutoffInput = document.getElementById("cutoff");
    cutoffInput.value = 1;
    cutoffInput.dispatchEvent(new Event("input"));

    slider.noUiSlider.on("update", debounce((values) => {
        const startLabel = values[0];
        const endLabel = values[1];
        const start = labels.indexOf(startLabel);
        const end = labels.indexOf(endLabel);
        updateChart(start, end);
        console.log("slider");
      }, 100));

    cutoffInput.addEventListener("input", debounce(() => {
        const [startLabel, endLabel] = slider.noUiSlider.get();
        const start = labels.indexOf(startLabel);
        const end = labels.indexOf(endLabel);
        updateChart(start, end);
        console.log("cutoff");
      }, 100));

    const dotsToggle = document.getElementById("dotsToggle");
    dotsToggle.addEventListener("change", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get(); 
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    const labelsToggle = document.getElementById("labelsToggle");
    labelsToggle.addEventListener("change", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get(); 
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    let numNamesInput = document.getElementById("numNames");
    numNamesInput.addEventListener("input", () => {
      const [startLabel, endLabel] = slider.noUiSlider.get();
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
    });

    document.getElementById("exportJPG").addEventListener("click", () => {
      const canvas = document.getElementById("myChart");
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;

      const scaleFactor = 2;
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      tempCanvas.width = originalWidth * scaleFactor;
      tempCanvas.height = originalHeight * scaleFactor;

      tempCtx.scale(scaleFactor, scaleFactor);

      tempCtx.drawImage(canvas, 0, 0);

      tempCtx.save();
      tempCtx.globalCompositeOperation = "destination-over";
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.restore();

      const dataURL = tempCanvas.toDataURL("image/png", 1.0);

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "chart-high-quality.png";
      link.click();

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
        const [startLabel, endLabel] = slider.noUiSlider.get();
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
        console.log(`Color for ${name}: ${color}`);
      });

      const [startLabel, endLabel] = slider.noUiSlider.get();
      const start = labels.indexOf(startLabel);
      const end = labels.indexOf(endLabel);
      updateChart(start, end);
}

function initializeColorPickers(startIndex, endIndex) {
  const colorPickerContainer = document.getElementById("colorPickerContainer");
  colorPickerContainer.innerHTML = "";

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
    const color = savedColors[name] || getRandomColor(name);
    colors[name] = color;

    const visibility = visibilityState[name] === false ? "hidden" : "visible";

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

  document.querySelectorAll(".color-picker").forEach((picker) => {
    picker.addEventListener("change", (event) => {
      const name = event.target.getAttribute("data-name");
      const newColor = event.target.value;
      colors[name] = newColor;
      updateChart(startIndex, endIndex);
    });
  });

  document.querySelectorAll(".name-label").forEach((label) => {
    label.addEventListener("click", (event) => {
      const name = event.target.getAttribute("data-name");
      visibilityState[name] = !visibilityState[name]; 
      updateChart(startIndex, endIndex);
    });
  });
}

function getRandomColor(name) {
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
  const names = allData[0].slice(1);

  if (areAllNamesHidden) {
    names.forEach((name) => {
      visibilityState[name] = true;
    });
    document.getElementById("toggleNamesButton").textContent = "Hide All"; 
  } else {
    // Hide all names
    names.forEach((name) => {
      visibilityState[name] = false;
    });
    document.getElementById("toggleNamesButton").textContent = "Show All";
  }

  const [startLabel, endLabel] = document
    .getElementById("slider")
    .noUiSlider.get();
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);

  areAllNamesHidden = !areAllNamesHidden;
}

function getWeeklyData(data, labels, startIndex, endIndex) {
  const filteredLabels = [];
  const filteredData = [];

  for (let i = startIndex; i <= endIndex; i += 7) {
    filteredLabels.push(labels[i]);
    filteredData.push(data[i]);
  }

  return { filteredLabels, filteredData };
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("intervalSelect").addEventListener("change", function() {
    const [startLabel, endLabel] = slider.noUiSlider.get(); 
    const start = labels.indexOf(startLabel);
    const end = labels.indexOf(endLabel);
    updateChart(start, end);
  });

  const [startLabel, endLabel] = slider.noUiSlider.get(); 
  const start = labels.indexOf(startLabel);
  const end = labels.indexOf(endLabel);
  updateChart(start, end);
});

function updateChart(startIndex, endIndex) {
  const intervalSelectElement = document.getElementById("intervalSelect");


  if (!intervalSelectElement) {
    console.error("Interval select element not found.");
    return;
  }

  const selectedInterval = intervalSelectElement.value;
  const cutoffValue = parseFloat(document.getElementById("cutoff").value) || 0;
  const showDots = !document.getElementById("dotsToggle").checked;
  showLabels = document.getElementById("labelsToggle").checked;
  let numNames = parseInt(document.getElementById("numNames").value) || Infinity;
  const datasets = [];
  const names = allData[0].slice(1);

  //console.log(sheetName);

  if (sheetName == "WRs -" && sheetChange) {
    console.log("Meow");
    document.getElementById('numNames').value = 20;
    numNames = parseInt(document.getElementById("numNames").value) || Infinity;
    sheetChange = false;
  } else if (sheetName != "WRs -" && sheetChange) {
    document.getElementById('numNames').value = 10;
    numNames = parseInt(document.getElementById("numNames").value) || Infinity;
    sheetChange = false;
  }

  let topNames;
  const filteredLabels = [];
  const filteredData = [];

  if (!sortByLatest) {
    const lastPoints = {};
    names.forEach((name, index) => {
      const dataSlice = allData.slice(1).map((row) => row[index + 1]).slice(startIndex, endIndex + 1);
      lastPoints[name] = parseFloat(dataSlice[dataSlice.length - 1]) || 0;
    });

    const sortedNames = Object.keys(lastPoints).sort((a, b) => lastPoints[b] - lastPoints[a]);
    topNames = sortedNames.slice(0, numNames);
  } else {
    const totalPoints = {};
    names.forEach((name, index) => {
      const dataSlice = allData.slice(1).map((row) => row[index + 1]).slice(startIndex, endIndex + 1);
      totalPoints[name] = dataSlice.reduce((acc, val) => acc + parseFloat(val) || 0, 0);
    });

    const sortedNames = Object.keys(totalPoints).sort((a, b) => totalPoints[b] - totalPoints[a]);
    topNames = sortedNames.slice(0, numNames);
  }

  // Apply interval selection (daily or weekly)
  const labels = allData.slice(1).map((row) => row[0]).slice(startIndex, endIndex + 1);

  switch (selectedInterval){
    case "daily":
      filteredLabels.push(...labels);
      break;
    case "weekly":
      for (let i = 0; i < labels.length; i += 7) {
        filteredLabels.push(labels[i]); 
      }
      break;
    case "monthly":
      for (let i = 0; i < labels.length; i += 30) {
        filteredLabels.push(labels[i]);
      }
    break;
  }



  topNames.forEach((name) => {
    let dataSlice = allData.slice(1).map((row) => row[names.indexOf(name) + 1]).slice(startIndex, endIndex + 1);

    const filteredDataSlice = [];

    switch (selectedInterval){
      case "weekly":

      for (let i = 0; i < dataSlice.length; i += 7) {
        filteredDataSlice.push(dataSlice[i]);
      }
      dataSlice = filteredDataSlice;
        break;
      case "monthly":
        
        for (let i = 0; i < labels.length; i += 30) {
          filteredDataSlice.push(dataSlice[i]);
      }
      dataSlice = filteredDataSlice;
      break;
    }

    const filteredDataPoints = dataSlice.map((value, idx) => value >= cutoffValue ? { x: filteredLabels[idx], y: value } : null).filter((v) => v !== null);

    if (filteredDataPoints.length > 0) {
      datasets.push({
        label: showLabels ? name : "",
        data: filteredDataPoints,
        borderColor: colors[name] || getRandomColor(name),
        backgroundColor: showDots ? colors[name] || getRandomColor(name) : "transparent",
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
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "black", 
                font: {
                  size: 12, 
                  weight: "bold", 
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

document.addEventListener("DOMContentLoaded", fetchChartData);
