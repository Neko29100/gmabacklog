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
    const defaultColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#f4a582', '#92c5de', '#11098A', '#e41a1c', '#377eb8', '#4daf4a', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'];

    async function loadColors() {
        try {
            const response = await fetch('data/colors.json');
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

    let fixedXDomain = [0, 6900000]; 
    let index = 0;
    let isPaused = true;
    let timeoutId = null;
    let currentData = [];
    let headers = [];
    let updateInterval = 50;
    let transitionInterval = 150;
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

            switch (sheetName) {
                case "WRs -":
                    fixedXDomain = [0, 160];
                    break;
                case "30k HS -":
                case "mixed HS -":
                    fixedXDomain = [0, 2200000];
                    break;
                case "20k HS -":
                    fixedXDomain = [0, 1500000]
                    break;
                case "30k total":
                case "mixed total":
                    fixedXDomain = [0, 7500000];
                    break;
                case "20k total":
                    fixedXDomain = [0, 6500000]
                    break;
                case "TT":
                    fixedXDomain = [0, 5600000]
                    break;
            }

            const response = await fetch(`/data?sheet=${sheetName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.length) {
                return;
            }

            headers = data[0].slice(1);
            const rawData = data.slice(1); 

            currentData = rawData.map(row => [row[0], ...row.slice(1)]);

            updateSlider();
            updateChart(); 

        } catch (error) {
            console.error('Error loading or parsing data:', error);
        }
    }

    function updateChart() {
        if (!currentData || currentData.length === 0 || !headers || headers.length === 0) {
            return;
        }
    
        const data = currentData[index];
        const date = data[0];
        const values = data.slice(1);
    
        const combinedData = headers.map((label, i) => ({
            label: label,
            value: values[i],
            color: colorMapping[label] || defaultColors[i % defaultColors.length]
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    
        if (combinedData.length === 0) {
            return;
        }
    
        y.domain(combinedData.map(d => d.label)).range([0, innerHeight]);
        x.domain(fixedXDomain);
    
        g.selectAll(".x-axis").remove();
        g.append("g").attr("class", "x-axis").call(xAxis);
    
        g.selectAll(".y-axis").remove();
        g.append("g").attr("class", "y-axis").call(yAxis);
    
        const bars = g.selectAll(".bar").data(combinedData, d => d.label);
    
        bars.enter().append("rect").attr("class", "bar").attr("x", 0).attr("y", d => y(d.label)).attr("width", 0).attr("height", y.bandwidth()).attr("fill", d => d.color).merge(bars).transition().duration(transitionInterval).attr("width", d => x(d.value)).attr("y", d => y(d.label)).attr("height", y.bandwidth());
    
        bars.exit().transition().duration(50).attr("width", 0).remove();
    
        g.selectAll(".label").remove();
    
        if (showLabels) {
            g.selectAll(".label").data(combinedData).enter().append("text").attr("class", "chart-label").attr("class", "label").attr("x", d => x(d.value) + 5).attr("y", d => y(d.label) + y.bandwidth() / 2).attr("dy", ".35em").text(d => Math.round(d.value));
        }
    
        document.getElementById("dateDisplay").textContent = `Date: ${date}`;
    
        if (!isPaused) {
            index++;
            if (index >= currentData.length) {
                clearTimeout(timeoutId);
                return;
            }
            const slider = document.getElementById("dateSlider");
            if (slider) slider.value = index;
    
            timeoutId = setTimeout(updateChart, updateInterval);
        }
    }

    function handleSliderChange(event) {
        index = parseInt(event.target.value, 10);
        updateChart();
    }

    function handlePauseButtonClick() {
        isPaused = !isPaused;
        const button = document.getElementById("pauseButton");
        button.textContent = isPaused ? "Play" : "Pause";

        if (isPaused) {
            clearTimeout(timeoutId);
        } else {
            updateChart();
        }
    }

    function handleTimeSliderChange(event) {
        updateInterval = parseInt(event.target.value, 10);
        document.getElementById("timeDisplay").textContent = `${updateInterval}ms`;
        
        switch (updateInterval) {
            case 10:
                transitionInterval = 50;
                break;
            case 20:
                transitionInterval = 60;
                break;
            case 30:
                transitionInterval = 100;
                break;
            case 40:
                transitionInterval = 120;
                break;
            case 50:
                transitionInterval = 150;
                break;
            case 60:
                transitionInterval = 160;
                break;
            case 70:
                transitionInterval = 160;
                break;
            case 80:
                transitionInterval = 170;
                break;
            case 90:
                transitionInterval = 190;
                break;
            case 100:
                transitionInterval = 200;
                break;
        }

        if (!isPaused) {
            clearTimeout(timeoutId);
            updateChart();
        }
    }

    function updateSlider() {
        const slider = document.getElementById("dateSlider");
        if (slider) {
            slider.max = currentData.length - 1;
            slider.value = index;
            document.getElementById("dateDisplay").textContent = `Date: ${currentData[index][0]}`;
        }
    }

    function resetGraph(){
        index = 0;
        updateChart();
    }

    const sheetSelect = document.getElementById("sheetSelect");
    if (sheetSelect) {
        sheetSelect.addEventListener("change", fetchChartData);
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

    fetchChartData();
});
