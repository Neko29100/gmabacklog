async function fetchAndCalculateDelta() {
    const response = await fetch(`/data?sheet=30k total`);
    const data = await response.json();

    // Ensure there is data
    if (!data || data.length < 2) {
        console.log("No sufficient data found.");
        return;
    }

    // Get today's date and determine the day index
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the index for the second-to-last row
    const secondLastIndex = dayIndex === 0 ? 2 : dayIndex + 1; // Sunday: -2, Saturday: -1, etc.
    const lastRow = data[data.length - 1]; // Last row
    const secondLastRow = data[data.length - secondLastIndex]; // Adjusted second-to-last row

    if (!secondLastRow) {
        console.log("No data found for the second-to-last row.");
        return;
    }

    // Gather player names from the first row
    const playerNames = data[0].slice(1); // Assuming first column is 'Date'

    // Create an array to hold players and their deltas
    const deltaResults = [];

    // Iterate over each player (column), excluding 'Date'
    playerNames.forEach((name, index) => {
        const lastValue = parseInt(lastRow[index + 1], 10); // +1 to skip the 'Date' column
        const secondLastValue = parseInt(secondLastRow[index + 1], 10);

        const delta = lastValue - secondLastValue; // Calculate delta
        
        if (delta !== 0) { // Ignore zeros
            deltaResults.push({ name, delta });
        }
    });

    // Sort the results by delta from largest to smallest
    deltaResults.sort((a, b) => b.delta - a.delta);

    // Emoji lists
    const positiveEmojis = ['🌟', '✨', '⭐', '🏆', '🥉', '🥈', '🥇', '👑'];
    const negativeEmojis = ['😬', '🤡', '💩', '🐢', '😵', '👻', '💀'];

    // Calculate the max and min deltas for color gradient scaling
    const maxPositiveDelta = 500000;
    const maxNegativeDelta = Math.min(...deltaResults.filter(p => p.delta < 0).map(p => p.delta));

    // Function to calculate color based on delta (gradient)
    function calculateColor(delta) {
        if (delta > 0) {
            const greenIntensity = Math.round((delta / maxPositiveDelta) * 255);
            return `rgb(0, ${greenIntensity}, 0)`; // More green with larger positive deltas
        } else {
            const redIntensity = Math.round((delta / maxNegativeDelta) * 255);
            return `rgb(${redIntensity}, 0, 0)`; // More red with larger negative deltas
        }
    }

    // Prepare the leaderboard table
    let leaderboardHTML = `<table>
                               <tr>
                                   <th>Rank</th>
                                   <th>Name</th>
                                   <th>Score</th>
                               </tr>`;

    // Populate the leaderboard with sorted results, assign emojis, and apply colors
    deltaResults.forEach((player, index) => {
        let emoji = '';
        
        // Choose emoji based on positive or negative delta
        if (player.delta > 0) {
            // Assign positive emojis based on delta
            const posIndex = Math.min(Math.floor((player.delta / maxPositiveDelta) * positiveEmojis.length), positiveEmojis.length - 1);
            emoji = positiveEmojis[posIndex]; 
        } else {
            // Assign negative emojis based on delta
            const negIndex = Math.min(Math.floor((player.delta / maxNegativeDelta) * negativeEmojis.length), negativeEmojis.length - 1);
            emoji = negativeEmojis[Math.abs(negIndex)]; // Use absolute value for negative deltas
        }

        // Calculate the color based on the delta
        const deltaColor = calculateColor(player.delta);

        leaderboardHTML += `<tr>
                                <td>${index + 1}</td>
                                <td>${emoji} ${player.name}</td>
                                <td style="color:${deltaColor};">${player.delta.toLocaleString()}</td> <!-- Format number with commas -->
                            </tr>`;
    });

    leaderboardHTML += '</table>';

    // Display the leaderboard in the specified element
    document.getElementById('leaderboard-output').innerHTML = leaderboardHTML;
}

// Call the function when needed
fetchAndCalculateDelta();
