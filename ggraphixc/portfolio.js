//////////////////  for portfolio page    /////////////////////


  
$(function() {
  typed.typed({
    strings: ["Alex Smith.", "Designer.", "Developer.", "Freelancer.", "Photographer"],
    typeSpeed: 100,
    loop: true,
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-items .item');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove 'active' class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add 'active' class to the clicked button
      this.classList.add('active');
      
      // Get the filter category
      const filter = this.getAttribute('data-filter');
      
      // Show/Hide portfolio items based on the filter
      portfolioItems.forEach(item => {
        if (filter === 'all') {
          item.classList.remove('hidden');
          item.classList.add('filtered');  // Add the 'filtered' class when shown
        } else {
          if (item.classList.contains(filter)) {
            item.classList.remove('hidden');
            item.classList.add('filtered');  // Add the 'filtered' class when shown
          } else {
            item.classList.add('hidden');
            item.classList.remove('filtered');  // Remove the 'filtered' class when hidden
          }
        }
      });
    });
  });
});

