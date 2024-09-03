document.addEventListener('DOMContentLoaded', function() {
    const svg = d3.select("#chart");
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const margin = { top: 20, right: 30, bottom: 60, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleBand().range([0, innerHeight]).padding(0.1);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = d3.axisTop(x).ticks(5);
    const yAxis = d3.axisLeft(y);

    let colorMapping = {};
    const defaultColors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b',
        '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#f4a582', '#92c5de',
        '#11098A', '#e41a1c', '#377eb8', '#4daf4a', '#ff7f00', '#ffff33',
        '#a65628', '#f781bf', '#999999'
      ];
    
    async function loadColors() {
        try {
            const response = await fetch('colors.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            colorMapping = data;
        } catch (error) {
            console.error('Error loading color data:', error);
        }
    }
    
    loadColors();

    let fixedXDomain = [0, 6900000]; // Default domain
    let index = 0;
    let isPaused = true;
    let timeoutId = null;
    let currentData = [];
    let headers = [];
    let updateInterval = 500;

    let showLabels = true;

    document.getElementById("labelToggle").addEventListener('change', function() {
        showLabels = this.checked;
        updateChart();
    });


    async function fetchChartData() {
        try {
            const sheetSelect = document.getElementById("sheetSelect");
            if (!sheetSelect) {
                throw new Error('Element with id "sheetSelect" is not found.');
            }

            const sheetName = sheetSelect.value;
            console.log(`Fetching data for sheet: ${sheetName}`);

            // Adjust fixedXDomain based on sheet selection
            switch (sheetName) {
                case "WR clean":
                    fixedXDomain = [0, 160];

                    break;
                case "30k HS clean":
                case "mixed HS clean":
                    fixedXDomain = [0, 2200000];

                    break;
                case "20k HS clean":
                    fixedXDomain = [0, 1500000]
                    break;
                case "30k total clean":
                case "mixed total clean":
                    fixedXDomain = [0, 6900000];
        
                    break;
                case "20k total clean":
                    fixedXDomain = [0, 6500000]
                    break;
                case "TT clean":
                    fixedXDomain = [0, 5600000]
                    break;
            }

            const response = await fetch(`/data?sheet=${sheetName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Loaded data:", data);

            if (!data || !data.length) {
                console.error("No data available from the fetch.");
                return;
            }

            headers = data[0].slice(1); // Headers excluding the date
            const rawData = data.slice(1); // Excludes headers

            currentData = rawData.map(row => [row[0], ...row.slice(1)]);

            updateSlider();
            updateChart(); // Call updateChart after data is fetched and updated

        } catch (error) {
            console.error('Error loading or parsing data:', error);
        }
    }

    function updateChart() {
        if (!currentData || currentData.length === 0 || !headers || headers.length === 0) {
            console.error("No data available for the chart.");
            return;
        }
    
        const data = currentData[index];
        const date = data[0];
        const values = data.slice(1);
    
        const combinedData = headers
            .map((label, i) => ({
                label: label,
                value: values[i],
                color: colorMapping[label] || defaultColors[i % defaultColors.length] // Use color from mapping or default
            }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    
        if (combinedData.length === 0) {
            console.error("All values are zero or there is no data to display.");
            return;
        }
    
        y.domain(combinedData.map(d => d.label)).range([0, innerHeight]);
        x.domain(fixedXDomain);
    
        g.selectAll(".x-axis").remove();
        g.append("g").attr("class", "x-axis").call(xAxis);
    
        g.selectAll(".y-axis").remove();
        g.append("g").attr("class", "y-axis").call(yAxis);
    
        const bars = g.selectAll(".bar").data(combinedData, d => d.label);
    
        // Enter phase
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.label))
            .attr("width", 0) // Start with width 0 for smooth animation
            .attr("height", y.bandwidth())
            .attr("fill", d => d.color)
            .merge(bars)
            .transition()
            .duration(400)
            .attr("width", d => x(d.value)) // Animate width
            .attr("y", d => y(d.label))
            .attr("height", y.bandwidth());
    
        // Exit phase
        bars.exit().transition().duration(400).attr("width", 0).remove();
    
        // Update labels
        g.selectAll(".label").remove(); // Remove existing labels
    
        if (showLabels) {
            g.selectAll(".label")
                .data(combinedData)
                .enter().append("text")
                .attr("class", "chart-label") // Apply the CSS class
                .attr("class", "label") // Apply the CSS class
                .attr("x", d => x(d.value) + 5)
                .attr("y", d => y(d.label) + y.bandwidth() / 2)
                .attr("dy", ".35em")
                .text(d => d.value);
        }
        
    
        document.getElementById("dateDisplay").textContent = `Date: ${date}`;
    
        if (!isPaused) {
            index++;
            if (index >= currentData.length) {
                clearTimeout(timeoutId); // Stop the update loop when reaching the end
                return; // Exit the function
            }
            const slider = document.getElementById("dateSlider");
            if (slider) slider.value = index;
    
            timeoutId = setTimeout(updateChart, updateInterval);
        }
    }
    
    
    

    function handleSliderChange(event) {
        index = parseInt(event.target.value, 10);
        updateChart(); // Update the chart based on slider value
    }

    function handlePauseButtonClick() {
        isPaused = !isPaused;
        const button = document.getElementById("pauseButton");
        button.textContent = isPaused ? "Play" : "Pause";

        if (isPaused) {
            clearTimeout(timeoutId);
        } else {
            updateChart(); // Resume chart updates
        }
    }

    function handleTimeSliderChange(event) {
        updateInterval = parseInt(event.target.value, 10);
        document.getElementById("timeDisplay").textContent = `${updateInterval}ms`;

        if (!isPaused) {
            clearTimeout(timeoutId);
            updateChart(); // Restart the update with the new interval
        }
    }

    function updateSlider() {
        const slider = document.getElementById("dateSlider");
        if (slider) {
            slider.max = currentData.length - 1; // Set max value to the last index of data
            slider.value = index; // Set slider value to current index
            document.getElementById("dateDisplay").textContent = `Date: ${currentData[index][0]}`;
        }
    }

    function resetGraph(){
        index = 0;
        updateChart();
    }

    // Attach event listeners
    const sheetSelect = document.getElementById("sheetSelect");
    if (sheetSelect) {
        sheetSelect.addEventListener("change", fetchChartData); // Fetch new data on change
    } else {
        console.error('Element with id "sheetSelect" not found.');
    }

    const pauseButton = document.getElementById("pauseButton");
    if (pauseButton) {
        pauseButton.addEventListener('click', handlePauseButtonClick);
    }

    const restartButton = document.getElementById("restart");
    if (restartButton) {
        restartButton.addEventListener('click', resetGraph);
    }

    const dateSlider = document.getElementById("dateSlider");
    if (dateSlider) {
        dateSlider.addEventListener('input', handleSliderChange);
    }

    const timeSlider = document.getElementById("timeSlider");
    if (timeSlider) {
        timeSlider.addEventListener('input', handleTimeSliderChange);
    }

    

    // Fetch initial data
    fetchChartData();
});
