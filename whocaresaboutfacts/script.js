// Initialize Chart.js with a bar chart
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('aiChart').getContext('2d');

    // Sample data for AI performances (fictional or real metrics)
    const aiData = {
        labels: ['Grok 3', 'ChatGPT', 'Claude', 'Gemini'],
        datasets: [{
            label: 'AI Performance (Your Opinion)',
            data: [85, 80, 75, 70], // Initial values (0-100 scale)
            backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6'],
            borderColor: ['#2980b9', '#c0392b', '#27ae60', '#8e44ad'],
            borderWidth: 1
        }]
    };

    // Chart configuration
    const chart = new Chart(ctx, {
        type: 'bar',
        data: aiData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Performance Score (%)' }
                },
                x: { title: { display: true, text: 'AI Models' } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}% (Your Opinion)`
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    enableDrag(index, chart);
                }
            }
        }
    });

    // Function to enable dragging on a specific bar
    function enableDrag(index, chart) {
        const meta = chart.getDatasetMeta(0);
        const bar = meta.data[index];
        let isDragging = false;
        let startY = 0;

        bar.element.addEventListener('mousedown', (event) => {
            isDragging = true;
            startY = event.clientY;
            event.preventDefault(); // Prevent default behavior
        });

        document.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaY = startY - event.clientY;
                const height = bar.height;
                const currentValue = chart.data.datasets[0].data[index];
                const newValue = Math.min(Math.max(currentValue + (deltaY / height) * 50, 0), 100); // Scale drag to 0-100
                chart.data.datasets[0].data[index] = newValue;
                chart.update();
                startY = event.clientY;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Prevent text selection while dragging
        bar.element.addEventListener('selectstart', (event) => event.preventDefault());
    }
});