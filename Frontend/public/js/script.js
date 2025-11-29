// Initialize Icons
lucide.createIcons();

// Data Configuration
const tips = [
    "Tip: Drinking water improves focus and reduces fatigue.",
    "Tip: A consistent sleep schedule is key to academic success.",
    "Tip: Taking short breaks can actually increase your productivity.",
    "Tip: Physical activity helps burn off stress hormones.",
    "Reminder: You are doing your best, and that is enough."
];

// DOM Elements
const progressBarWrapper = document.querySelector('[role="progressbar"]');
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');
const percentText = document.getElementById('percent-text');
const tipText = document.getElementById('tip-text');
const tipCard = document.getElementById('tip-card');

// Animation State
let progress = 0;
let tipIndex = 0;
const totalDuration = 4500; // 4.5 seconds total load time
const intervalTime = 50;
const steps = totalDuration / intervalTime;
let currentStep = 0;

// Function to rotate tips with animation
function updateTip() {
    // Reset animation
    tipCard.classList.remove('fade-in-up');
    void tipCard.offsetWidth; // Trigger reflow to restart CSS animation
    tipCard.classList.add('fade-in-up');
    
    // Update text
    tipIndex = (tipIndex + 1) % tips.length;
    tipText.textContent = `"${tips[tipIndex]}"`;
}

// Main Loading Timer
const timer = setInterval(() => {
    currentStep++;
    progress = Math.min((currentStep / steps) * 100, 100);

    // Update Progress Bar Width, Percent Text & ARIA Attribute
    progressBar.style.width = `${progress}%`;
    progressBarWrapper.setAttribute('aria-valuenow', Math.round(progress));
    percentText.textContent = `${Math.round(progress)}%`;

    // Update Loading Status Text based on progress
    if (progress < 20) loadingText.textContent = "Connecting to student profile...";
    else if (progress < 40) loadingText.textContent = "Syncing hydration data...";
    else if (progress < 60) loadingText.textContent = "Analyzing sleep patterns...";
    else if (progress < 80) loadingText.textContent = "Calibrating stress monitors...";
    else if (progress < 95) loadingText.textContent = "Preparing your dashboard...";
    else loadingText.textContent = "Welcome to UniStress";

    // Rotate Tips periodically (every 30 ticks = ~1.5 seconds)
    if (currentStep % 30 === 0) {
        updateTip();
    }

    // Completion Logic
    if (currentStep >= steps) {
        clearInterval(timer);
        
        // Final state adjustments
        percentText.textContent = "Ready";
        loadingText.classList.add('text-teal-400'); // Highlight 'Welcome' text
        
        console.log("Loading complete.");
    }
}, intervalTime);