
let currentSlide = 0;
const slides = document.querySelectorAll('.firstcarousel');
const totalSlides = slides.length;
const intervalTime = 3000; // Time between slides in milliseconds
let slideInterval = setInterval(autoSlide, intervalTime);

function moveSlide(direction) {
  clearInterval(slideInterval); // Stop auto sliding when manually navigating
  slideInterval = setInterval(autoSlide, intervalTime); // Restart auto sliding
  
  currentSlide += direction;

  // If the current slide is greater than the total slides, loop back to the first slide
  if (currentSlide >= totalSlides) {
    currentSlide = 0;
  }

  // If the current slide is less than 0, loop back to the last slide
  if (currentSlide < 0) {
    currentSlide = totalSlides - 1;
  }

  updateSlidePosition();
}

function autoSlide() {
  moveSlide(1); // Move to the next slide automatically
}

function updateSlidePosition() {
  // Hide all slides
  slides.forEach((slide, index) => {
    slide.style.transform = `translateX(${(index - currentSlide) * 100}%)`;
  });
}

// Initial positioning of slides
updateSlidePosition();










const scrollers = document.querySelectorAll('.scrooler');

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addAnimation();
}

function addAnimation() {
  scrollers.forEach(scrooler => {
    scrooler.setAttribute('data-animated', true); 

    const scrollerInner = scrooler.querySelector('.testimonial-slider')
    const scrollerContent = Array.from(scrollerInner.children);

    scrollerContent.forEach((item) =>{
      const duplicatedItem = item.cloneNode(true);
      duplicatedItem.setAttribute("aria-hidden", true);
      scrollerInner.appendChild(duplicatedItem);
      
    });
  });
}




