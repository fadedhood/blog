document.addEventListener('DOMContentLoaded', function() {
    const hamburgerInput = document.querySelector('.hamburger-input');
    const mobileMenu = document.querySelector('.menu-main-mobile');
    
    if (!hamburgerInput || !mobileMenu) return;

    const menuItems = mobileMenu.querySelectorAll('li');
    
    // Reset initial states
    hamburgerInput.checked = false;
    mobileMenu.classList.remove('open');
    
    hamburgerInput.addEventListener('change', function(e) {
        mobileMenu.classList.toggle('open', this.checked);
        
        // Simple stagger animation
        if (this.checked) {
            menuItems.forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.05}s`;
            });
        } else {
            menuItems.forEach(item => {
                item.style.transitionDelay = '0s';
            });
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !e.target.closest('.hamburger-button')) {
            hamburgerInput.checked = false;
            mobileMenu.classList.remove('open');
            menuItems.forEach(item => {
                item.style.transitionDelay = '0s';
            });
        }
    });
});
