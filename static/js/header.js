document.addEventListener('DOMContentLoaded', function() {
    const hamburgerInput = document.querySelector('.hamburger-input');
    const header = document.querySelector('.header');
    
    if (hamburgerInput) {
      hamburgerInput.addEventListener('change', function() {
        if (this.checked) {
          header.classList.add('menu-open');
        } else {
          header.classList.remove('menu-open');
        }
      });
    }
  
    // (Optional) Existing scroll logic for header state:
    let scrollTimeout;
    function handleScroll() {
      const currentScroll = window.pageYOffset;
      clearTimeout(scrollTimeout);
      if (currentScroll > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      scrollTimeout = setTimeout(() => {
        header.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }, 100);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  });
  