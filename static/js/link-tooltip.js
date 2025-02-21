document.addEventListener('DOMContentLoaded', function() {
  const isMobile = window.innerWidth < 768; // for some mobile-specific behavior

  const createTooltip = (url) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'cyber-tooltip';
    
    const content = document.createElement('div');
    content.className = 'cyber-tooltip-content';
    
    const urlSpan = document.createElement('span');
    urlSpan.className = 'cyber-tooltip-url';
    urlSpan.textContent = url;
    
    const actions = document.createElement('div');
    actions.className = 'cyber-tooltip-actions';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'cyber-tooltip-copy';
    // Using Material Icons
    copyButton.innerHTML = `
      <span class="material-icons-round" style="font-size: 16px">content_copy</span>
      <span>Copy</span>
    `;
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => {
        copyButton.innerHTML = `
          <span class="material-icons-round" style="font-size: 16px">check</span>
          <span>Copied</span>
        `;
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.innerHTML = `
            <span class="material-icons-round" style="font-size: 16px">content_copy</span>
            <span>Copy</span>
          `;
          copyButton.classList.remove('copied');
        }, 2000);
      });
    });
    actions.appendChild(copyButton);

    // Always add the "Visit" button (removed viewport check)
    const visitButton = document.createElement('button');
    visitButton.className = 'cyber-tooltip-visit';
    visitButton.innerHTML = `
      <span class="material-icons-round" style="font-size: 16px">open_in_new</span>
      <span>Visit</span>
    `;
    visitButton.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = url;
    });
    actions.appendChild(visitButton);
    
    content.appendChild(urlSpan);
    content.appendChild(actions);
    
    tooltip.appendChild(content);
    return tooltip;
  };

  const checkTooltipPosition = (tooltip) => {
    return new Promise(resolve => {
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
      tooltip.classList.add('show');
      
      // Force layout recalculation
      const forceReflow = tooltip.offsetHeight;
  
      requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const padding = 10;
  
        tooltip.style.left = '50%';
        tooltip.style.right = 'auto';
        tooltip.style.transform = 'translate(-50%, 5px)';
        tooltip.classList.remove('edge-left', 'edge-right');
  
        if (tooltipRect.left < padding) {
          tooltip.style.left = '0';
          tooltip.style.transform = 'translateY(5px)';
          tooltip.classList.add('edge-left');
        } else if (tooltipRect.right > (viewportWidth - padding)) {
          tooltip.style.left = 'auto';
          tooltip.style.right = '0';
          tooltip.style.transform = 'translateY(5px)';
          tooltip.classList.add('edge-right');
        }
  
        tooltip.style.visibility = '';
        tooltip.style.opacity = '';
        tooltip.classList.remove('show');
        
        resolve();
      });
    });
  };

  document.querySelectorAll('a').forEach(link => {
    // Skip tooltips for navigation, header, and other excluded areas
    if (link.href && 
        !link.classList.contains('no-tooltip') && 
        !link.closest('.toc-container') &&
        !link.closest('.pagination') &&     
        !link.closest('.summary') &&     
        !link.closest('.summaries') &&
        !link.closest('.main-menu') &&      // Exclude hamburger menu
        !link.closest('.header') &&         // Exclude header
        !link.closest('.mobile-menu')) {    // Exclude mobile menu
      
      const container = document.createElement('div');
      container.className = 'cyber-tooltip-container';
      
      // On mobile, prevent default link click
      if (isMobile) {
        link.addEventListener('click', (e) => { e.preventDefault(); });
      }
      
      link.parentNode.insertBefore(container, link);
      container.appendChild(link);
      const tooltip = createTooltip(link.href);
      container.appendChild(tooltip);
      
      container.addEventListener('mouseenter', async () => {
        await checkTooltipPosition(tooltip);
        tooltip.classList.add('show');
      });
      container.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
      
      if (window.innerWidth < 1024) {
        container.addEventListener('touchstart', async (e) => {
          if (e.target.closest('.cyber-tooltip-copy') || e.target.closest('.cyber-tooltip-visit')) {
            return;
          }
          e.stopPropagation();
          
          const isShowing = tooltip.classList.contains('show');
          if (!isShowing) {
            await checkTooltipPosition(tooltip);
            tooltip.classList.add('show');
          } else {
            tooltip.classList.remove('show');
          }
        });
      }
    }
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.cyber-tooltip.show').forEach(async tooltip => {
      await checkTooltipPosition(tooltip);
      tooltip.classList.add('show');
    });
  });
});
