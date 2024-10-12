// Define the elements to be animated (img, p, h1, h2, a, etc.)
const elementsToAnimate = document.querySelectorAll('p, h1, h2, h3, h4');

// Create an observer to detect when elements come into view
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Add the animation class when the element comes into view
      entry.target.classList.add('animated');
      observer.unobserve(entry.target); // Stop observing once animated
    }
  });
}, { threshold: 0.3 }); // Trigger the animation when 40% of the element is in view

// Observe all the selected elements
elementsToAnimate.forEach(element => {
  observer.observe(element);
});



function resizeSections() {
  const sections = document.querySelectorAll('section, div');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  sections.forEach(section => {
    section.style.width = `${viewportWidth * 0.9}px`;  // Set width to 90% of viewport width
    section.style.height = `${viewportHeight * 0.8}px`; // Set height to 80% of viewport height
  });
}

//////////////////// blocking webpage inspection///////////////////////////
document.onkeydown = function(e) {
  if (e.keyCode === 123 || 
      (e.ctrlKey && e.shiftKey && (e.keyCode === 'I'.charCodeAt(0) || e.keyCode === 'J'.charCodeAt(0))) || 
      (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0))) {
      return false;
  }
};

// document.addEventListener('contextmenu', (e) => {
//   e.preventDefault();
//   alert('Right-click is disabled on this page.');
// });

const devtools = { isOpen: false };

setInterval(() => {
    const threshold = 160; // px
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (!devtools.isOpen && (widthThreshold || heightThreshold)) {
        devtools.isOpen = true;
        alert('Please close developer tools to continue.');
    } else if (devtools.isOpen && !widthThreshold && !heightThreshold) {
        devtools.isOpen = false;
    }
}, 500);


///////////// for header//////////

const navMenu = document.getElementById('navContainer');
const navToggle = document.getElementById('menu-btn');
const navClose = document.getElementById('close-btn');

// menu show //
navToggle.addEventListener('click', () => {
    navMenu.classList.add('show-menu')
})
// hide menu //
navClose.addEventListener('click', () => {
    navMenu.classList.remove('show-menu')
})



//////////// for the pen click & Rotation ////////
    const image = document.getElementById('Dpen');
    let isRotated = false;

    image.addEventListener('click', () => {
      if (isRotated) {
        image.style.transform = 'rotateZ(0deg)'; // Reset to default
      } else {
        image.style.transform = 'rotateZ(180deg)'; // Rotate 180 degrees
      }
      isRotated = !isRotated; // Toggle state
    });








