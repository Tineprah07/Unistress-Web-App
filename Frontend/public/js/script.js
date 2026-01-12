document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const lettersContainer = document.getElementById('lettersContainer');
    const letters = document.querySelectorAll('.letters-container span');
    const progressBar = document.getElementById('progressBar');
    const loadingText = document.getElementById('loadingText');
    const percentText = document.getElementById('percentText');

    let progress = 0;
    let hasCollapsed = false;

    // 1. SEQUENCE: Reveal letters one by one
    setTimeout(() => {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                // Only reveal if we haven't hit the collapse phase yet
                if (!hasCollapsed) {
                    letter.classList.add('reveal');
                }
            }, index * 120); 
        });
    }, 500);

    // 2. LOADING LOOP
    const interval = setInterval(() => {
        // Increment progress
        progress += Math.random() * 1.5;

        // --- THE MAGIC MOMENT (50%) ---
        if (progress > 50 && !hasCollapsed) {
            hasCollapsed = true;
            
            // This triggers the CSS transition:
            // Width goes to 0 -> U slides to center
            lettersContainer.classList.add('collapse');
            
            // Optional: Update text to indicate change
            loadingText.textContent = "Optimizing Interface...";
        }

        // --- END ---
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            finishLoading();
        }

        // Update UI
        const rounded = Math.floor(progress);
        progressBar.style.width = rounded + '%';
        percentText.textContent = rounded + '%';
        
        if(!hasCollapsed) {
             updateText(rounded);
        }

    }, 20); // Speed

    function updateText(pct) {
        if (pct < 20) loadingText.textContent = "Initializing...";
        else if (pct < 40) loadingText.textContent = "Loading Assets...";
    }

    function finishLoading() {
        loadingText.textContent = "Welcome.";
        loadingText.style.color = "#4e54c8";
        // Logic to redirect
        // window.location.href = '/home.html';
    }
});