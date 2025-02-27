// Mock AI responses
const responses = [
    'Error 404: Brain Not Found',
    'Output: “Beep Boop Oops”',
    'Your IQ: Slightly Above a Potato!',
    'Processing… Nah, Just Kidding, We’re Clueless!',
    'AI Says: “Why Are We Here?”'
];

// Mock job application responses
const jobResponses = [
    'Thanks… We’ll Get Back to You (Never)!',
    'Sorry, Our AI Ate Your Application!',
    'You’re Hired… To Make Coffee (Maybe)!',
    'Error: Application Overloaded—Try Again in 2026!'
];

function tryFeature(type) {
    const output = document.querySelector('.output');
    const speechBubble = document.querySelector('.speech-bubble');
    const processing = document.createElement('div');
    processing.className = 'processing';
    processing.innerHTML = '<div class="loader"></div><p>Thinking Really Hard… (This Might Take Forever)</p>';

    // Show processing animation
    output.style.display = 'none';
    document.querySelector('main').appendChild(processing);

    // Simulate processing delay
    setTimeout(() => {
        document.querySelector('main').removeChild(processing);
        output.style.display = 'block';
        speechBubble.textContent = responses[Math.floor(Math.random() * responses.length)];
    }, 3000); // 3-second delay
}

function applyJob() {
    const output = document.querySelector('.output');
    const speechBubble = document.querySelector('.speech-bubble');
    const processing = document.createElement('div');
    processing.className = 'processing';
    processing.innerHTML = '<div class="loader"></div><p>Processing Application… (Good Luck!)</p>';

    // Show processing animation
    output.style.display = 'none';
    document.querySelector('main').appendChild(processing);

    // Simulate processing delay
    setTimeout(() => {
        document.querySelector('main').removeChild(processing);
        output.style.display = 'block';
        speechBubble.textContent = jobResponses[Math.floor(Math.random() * jobResponses.length)];
    }, 3000); // 3-second delay
}

// Reset for new try (optional, triggered by clicking output)
document.querySelector('.output').addEventListener('click', () => {
    const output = document.querySelector('.output');
    output.style.display = 'none';
});