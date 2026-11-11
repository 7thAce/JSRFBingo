const scoreToWin = 16;
const ctx = document.getElementById('scoreChart').getContext('2d');

const scoreChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Team A',
            data: [{x: 0, y: 0}, {x: 5, y: 1}, {x: 10, y: 2}, {x: 15, y: 3}, {x: 20, y: 4}, {x: 25, y: 5}, {x: 30, y: 6}, {x: 35, y: 7}, {x: 40, y: 8}, {x: 45, y: 9}, {x: 50, y: 10}, {x: 55, y: 11}, {x: 60, y: 12}, {x: 65, y: 13}, {x: 70, y: 14}, {x: 75, y: 15}],
            borderColor: '#ff6384',
            borderWidth: 2,
            stepped: true, // This creates the "instant jump" look
            pointRadius: 0 // Removes the dots for a cleaner line
        }, {
            label: 'Team B',
            data: [{x: 0, y: 0}, {x: 4, y: 1}, {x: 8, y: 2}, {x: 12, y: 3}, {x: 24, y: 6}, {x: 28, y: 7}, {x: 32, y: 8}, {x: 36, y: 9}, {x: 40, y: 10}, {x: 44, y: 11}, {x: 48, y: 12}, {x: 52, y: 13}, {x: 56, y: 14}, {x: 60, y: 15}],
            borderColor: '#36a2eb',
            borderWidth: 2,
            stepped: true,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false } // Removes the Team A/B legend
        },
        scales: {
            x: {
                type: 'linear',
                min: 0,
                display: false, // Removes the entire X-axis (labels/titles/line)
            },
            y: {
                min: 0,
                max: scoreToWin,
                display: false, // Removes the entire Y-axis
            }
        },
        elements: {
            line: {
                tension: 0 // Ensures no smoothing is applied
            }
        },
        animation: false // Highly recommended for real-time updates to reduce CPU usage
    }
});