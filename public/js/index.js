async function fetchAndCalculateDelta() {
    // Show the loading logo and hide the leaderboard while fetching data
    document.getElementById('loading-logo').style.display = 'block';
    document.getElementById('leaderboard-output').style.display = 'none';

    try {
        console.log("Fetching data from the server...");
        const response = await fetch(`/data?sheet=30k total`);
        const data = await response.json();

        // Ensure there is data
        if (!data || data.length < 2) {
            console.log("No sufficient data found.");
            return;
        }

        console.log("Data fetched successfully:", data);
        
        const today = new Date();
        const dayIndex = today.getDay();
        const secondLastIndex = dayIndex;
        const lastRow = data[data.length - 1];
        const secondLastRow = data[data.length - secondLastIndex - 1];

        console.log("Last Row:", lastRow);
        console.log("Second Last Row:", secondLastRow);

        if (!secondLastRow) {
            console.log("No data found for the second-to-last row.");
            return;
        }

        const playerNames = data[0].slice(1);
        const deltaResults = [];

        playerNames.forEach((name, index) => {
            const lastValue = parseInt(lastRow[index + 1], 10);
            const secondLastValue = parseInt(secondLastRow[index + 1], 10);
            const delta = lastValue - secondLastValue;

            console.log(`Processing player: ${name}, Last Value: ${lastValue}, Second Last Value: ${secondLastValue}, Delta: ${delta}`);

            if (delta !== 0) {
                deltaResults.push({ name, delta, currentScore: lastValue });
            }
        });

        console.log("Delta Results:", deltaResults);
        deltaResults.sort((a, b) => b.delta - a.delta);

        // Fetch highest scores from JSON
        console.log("Fetching highest scores from JSON...");
        const highestScoresResponse = await fetch('/highest-scores');
        const highestScores = await highestScoresResponse.json();

        console.log("Highest Scores:", highestScores);

        // Calculate maxPositiveDelta from the highest scores
        const maxPositiveDelta = Math.max(...Object.values(highestScores).map(scoreData => scoreData.bestScore));
        const maxNegativeDelta = Math.min(...deltaResults.filter(p => p.delta < 0).map(p => p.delta));

        console.log("Max Positive Delta from highest scores:", maxPositiveDelta);
        console.log("Max Negative Delta:", maxNegativeDelta);

        deltaResults.forEach(player => {
            const currentBest = highestScores[player.name]?.bestScore || 0;

            // Check if the new score is a PB
            if (player.delta > currentBest) {
                highestScores[player.name] = {
                    bestScore: player.delta,
                    timestamp: new Date().toISOString() // Store the current date as a timestamp
                };
                console.log(`Updated ${player.name} with new best score: ${player.delta}`);
            } else if (player.delta === currentBest) {
                console.log(`${player.name} achieved a PB with score: ${player.delta}`);
            } else {
                console.log(`${player.name} did not achieve a new best score. Current: ${currentBest}, New: ${player.delta}`);
            }
        });

        // Save the updated highest scores back to the server
        console.log("Saving updated highest scores to the server...");
        await fetch('/save-highest-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(highestScores)
        });

        const positiveEmojis = ['🌟', '✨', '⭐', '🏆', '🥉', '🥈', '🥇', '👑'];
        const negativeEmojis = ['😬', '🤡', '💩', '🐢', '😵', '👻', '💀'];

        function calculateColor(delta) {
            if (delta > 0) {
                const greenIntensity = Math.round((delta / maxPositiveDelta) * 255);
                return `rgb(0, ${greenIntensity}, 0)`;
            } else {
                const redIntensity = Math.round((delta / maxNegativeDelta) * 255);
                return `rgb(${redIntensity}, 0, 0)`;
            }
        }

        let leaderboardHTML = `<table>
                                   <tr>
                                       <th>Rank</th>
                                       <th>Name</th>
                                       <th>Score</th>
                                   </tr>`;

        // Calculate the maximum score from the highest scores
const maxScoreInJSON = Math.max(...Object.values(highestScores).map(scoreData => scoreData.bestScore));

// Update the deltaResults for each player
deltaResults.forEach((player, index) => {
    let emoji = '';

    // Emoji assignment based on delta
    if (player.delta > 0) {
        const posIndex = Math.min(Math.floor((player.delta / maxPositiveDelta) * positiveEmojis.length), positiveEmojis.length - 1);
        emoji = positiveEmojis[posIndex];
    } else {
        const negIndex = Math.min(Math.floor((player.delta / maxNegativeDelta) * negativeEmojis.length), negativeEmojis.length - 1);
        emoji = negativeEmojis[Math.abs(negIndex)];
    }

    const deltaColor = calculateColor(player.delta);
    
    // Check if the current score is a PB with tabulation
    const label = player.delta === highestScores[player.name]?.bestScore ? '&nbsp;(PB)' : '';
    
    // Check if the player's score is equal to or greater than the max score in JSON
    const maxLabel = player.delta >= maxScoreInJSON ? '&nbsp;(WR)' : '';

    leaderboardHTML += `<tr>
                            <td>${index + 1}</td>
                            <td>${emoji} ${player.name} ${label} ${maxLabel}</td>
                            <td style="color:${deltaColor};">${player.delta.toLocaleString()}</td>
                        </tr>`;
});


        leaderboardHTML += '</table>';

        // Insert the leaderboard into the page
        document.getElementById('leaderboard-output').innerHTML = leaderboardHTML;
        console.log("Leaderboard generated and displayed.");

    } catch (error) {
        console.error("Error fetching or processing data:", error);
    } finally {
        // Hide the loading logo and show the leaderboard
        document.getElementById('loading-logo').style.display = 'none';
        document.getElementById('leaderboard-output').style.display = 'block';
    }
}



document.getElementById('show-scores-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/highest-scores'); // Endpoint to fetch highest scores
        const highestScores = await response.json();
        
        // Convert the scores into an array for sorting
        const scoresArray = Object.entries(highestScores).map(([name, data]) => ({
            name,
            bestScore: data.bestScore,
            timestamp: data.timestamp ? new Date(data.timestamp).toLocaleDateString() : 'N/A'
        }));

        // Sort the scores array from highest to lowest
        scoresArray.sort((a, b) => b.bestScore - a.bestScore);
        
        // Create table HTML
        let tableHTML = `<table>
                             <tr>
                                 <th>Rank</th>
                                 <th>Name</th>
                                 <th>Best Score</th>
                                 <th>Timestamp</th>
                             </tr>`;
        
        scoresArray.forEach((player, index) => {
            tableHTML += `<tr>
                             <td>${index + 1}</td>
                             <td>${player.name}</td>
                             <td>${player.bestScore.toLocaleString()}</td>
                             <td>${player.timestamp}</td>
                           </tr>`;
        });

        tableHTML += '</table>';

        // Insert the table HTML into the placeholder
        document.getElementById('scores-table').innerHTML = tableHTML;

    } catch (error) {
        console.error("Error fetching highest scores:", error);
    }
});


fetchAndCalculateDelta();
