// Select the Dpen element and aboutusSec
let dpen = document.getElementById('Dpen');
let aboutusSec = document.getElementById('aboutusSec');

// Variables to track rotation, scale, and zigzag movement
let rotation = 0;
let scale = 1;
let lockedRotation = false;
let lockedAt = 92;
let zigzagDirection = 1; // 1 for right, -1 for left
let maxZigzagOffset = 30; // Maximum horizontal shift for zigzag

// Scroll event listener
window.addEventListener('scroll', function() {
    let scrollPos = window.scrollY;
    let viewHeight = window.innerHeight;
    let docHeight = document.documentElement.scrollHeight;

    // Calculate the current percentage of scrolling progress
    let scrollPercent = scrollPos / (docHeight - viewHeight);

    // Handle rotation: Rotate 1.5 times (540deg)
    if (!lockedRotation && scrollPos < aboutusSec.offsetTop) {
        rotation = Math.min(scrollPercent * 800, lockedAt);
    }

    // Lock rotation at 92deg when scroll position reaches 80vh
    if (scrollPos >= 0.3 * viewHeight && !lockedRotation) {
        rotation = lockedAt;
        lockedRotation = true;
    }

    // Unlock rotation if scrolling back up
    if (scrollPos < 0.3 * viewHeight) {
        lockedRotation = false;
    }

    // Zigzag movement: Move right and left alternately
    let zigzagOffset = Math.sin(scrollPos * 0.05) * maxZigzagOffset * zigzagDirection;

    // Change zigzag direction at intervals (e.g., every 300px)
    if (scrollPos % 300 < 10) {
        zigzagDirection *= -1;
    }

    // Scale the Dpen element slightly based on scroll position
    scale = 1 - 0.5 * scrollPercent; // Scale between 1x and 1.5x

    // Rough movement: Dpen moves down in zigzag and scales when scrolling past 80vh
    if (scrollPos >= 0.3 * viewHeight && scrollPos < aboutusSec.offsetTop) {
        dpen.style.transform = `translate(${zigzagOffset}px, ${(scrollPos - 0.3 * viewHeight) * 0.3}px) 
                                rotate(${rotation}deg) scale(${scale})`;
    }

    // Stop at aboutusSec
    if (scrollPos >= aboutusSec.offsetTop) {
        dpen.style.transform = `translate(${zigzagOffset}px, ${aboutusSec.offsetTop - 0.3 * viewHeight}px) 
                                rotate(${rotation}deg) scale(${scale})`;
    }

    // Handle upward movement with zigzag and scaling motion
    if (scrollPos < aboutusSec.offsetTop && lockedRotation) {
        dpen.style.transform = `translate(${zigzagOffset}px, ${(scrollPos - 0.3 * viewHeight) * 0.3}px) 
                                rotate(${lockedAt}deg) scale(${scale})`;
    }
});
