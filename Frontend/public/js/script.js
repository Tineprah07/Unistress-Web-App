document.addEventListener('DOMContentLoaded', () => {

    // Cache DOM elements used for the loading animation
    const lettersContainer = document.getElementById('lettersContainer');
    const letters = document.querySelectorAll('.letters-container span');
    const progressBar = document.getElementById('progressBar');
    const loadingText = document.getElementById('loadingText');
    const percentText = document.getElementById('percentText');

    let progress = 0;
    let hasCollapsed = false;

    // Letter reveal sequence (appears one by one)
    setTimeout(() => {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                if (!hasCollapsed) {
                    letter.classList.add('reveal');
                }
            }, index * 120);
        });
    }, 500);

    // Main loading progress loop
    const interval = setInterval(() => {

        // Simulate loading progress
        progress += Math.random() * 1.5;

        // Collapse letters at midpoint to centre the logo
        if (progress > 50 && !hasCollapsed) {
            hasCollapsed = true;
            lettersContainer.classList.add('collapse');
            loadingText.textContent = "Loading...";
        }

        // Finish loading
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            finishLoading();
        }

        // Update progress bar and percentage
        const rounded = Math.floor(progress);
        progressBar.style.width = rounded + '%';
        percentText.textContent = rounded + '%';

        if (!hasCollapsed) {
            updateText(rounded);
        }

    }, 20);

    // Update loading message based on progress
    function updateText(pct) {
        if (pct < 20) loadingText.textContent = "Initializing...";
        else if (pct < 40) loadingText.textContent = "Optimizing Interface...";
    }

    // Final state once loading completes
    function finishLoading() {
        loadingText.textContent = "Welcome.";
        loadingText.style.color = "#4e54c8";
        // Future redirect logic can be placed here
        window.location.href = '/views/auth.html';
    }

});
