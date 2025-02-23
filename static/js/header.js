document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    let lastScroll = 0;

    // Handle scroll effects
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow and opacity when scrolling down
        if (currentScroll > 20) {
            header.style.background = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(237, 41, 57, 0.2)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(237, 41, 57, 0.1)';
        }

        lastScroll = currentScroll;
    });
});
