document.addEventListener('DOMContentLoaded', function() {
    const inlineCodes = document.querySelectorAll('.content p code, .content li code, .content td code');

    inlineCodes.forEach(code => {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'code-tooltip-wrapper';
        code.parentNode.insertBefore(wrapper, code);
        wrapper.appendChild(code);

        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'code-tooltip';
        
        const content = document.createElement('div');
        content.className = 'code-tooltip-content';
        content.textContent = code.textContent.trim();
        
        const actions = document.createElement('div');
        actions.className = 'code-tooltip-actions';
        
        const copyButton = document.createElement('button');
        copyButton.className = 'code-tooltip-copy';
        copyButton.innerHTML = `
            <span class="material-icons-round" style="font-size: 16px">content_copy</span>
            <span>Copy</span>
        `;
        
        actions.appendChild(copyButton);
        tooltip.appendChild(content);
        tooltip.appendChild(actions);
        wrapper.appendChild(tooltip);

        // Show/hide tooltip (both hover and click will work)
        wrapper.addEventListener('mouseenter', () => {
            tooltip.classList.add('show');
        });
        
        wrapper.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });

        // Copy functionality
        copyButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(code.textContent.trim());
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
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });
});
