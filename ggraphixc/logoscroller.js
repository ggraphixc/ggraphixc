const logomover = document.querySelectorAll('.logoscroler');

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  addAnimation();
}

function addAnimation() {
  logomover.forEach(logoscroler => {
    logoscroler.setAttribute('data-animated', true); 

    const scrollerInner = logoscroler.querySelector('.logosSwip-card');
    const scrollerContent = Array.from(scrollerInner.children);

    // Clone elements to fill the container and ensure smooth scrolling
    while (scrollerInner.scrollWidth < logoscroler.clientWidth * 8) {
      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        duplicatedItem.setAttribute("aria-hidden", true);
        scrollerInner.appendChild(duplicatedItem);
      });
    }
  });
}
