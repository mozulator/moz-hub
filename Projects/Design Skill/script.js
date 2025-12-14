// Sidebar Functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const collapseToggles = document.querySelectorAll('.sidebar-collapse-toggle');
    
    // Toggle collapsible sections
    collapseToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            const content = document.querySelector(`[data-content="${section}"]`);
            
            if (content) {
                content.classList.toggle('collapsed');
                this.classList.toggle('collapsed');
            }
        });
    });
    
    // Sidebar is always visible and cannot be closed
    
    // Add smooth interactions to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.1);
                transform: scale(0);
                animation: ripple 400ms ease-out;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 400);
        });
    });
    
    // Add CSS animation for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Form input focus animations
    const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Sidebar item active state management
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items in the same section
            const section = this.closest('.sidebar-section');
            if (section) {
                section.querySelectorAll('.sidebar-item').forEach(i => {
                    i.classList.remove('active');
                });
            }
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Tree View Functionality
    const treeToggles = document.querySelectorAll('.tree-toggle');
    treeToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const treeItem = this.closest('.tree-item');
            const treeChildren = treeItem.querySelector('.tree-children');
            
            if (treeChildren) {
                const isCollapsed = treeChildren.classList.toggle('collapsed');
                // Update chevron rotation based on collapsed state
                const chevron = this.querySelector('i');
                if (chevron) {
                    if (isCollapsed) {
                        chevron.style.transform = 'rotate(0deg)';
                    } else {
                        chevron.style.transform = 'rotate(90deg)';
                    }
                }
            }
        });
        
        // Initialize chevron rotation based on initial state
        const treeItem = toggle.closest('.tree-item');
        const treeChildren = treeItem?.querySelector('.tree-children');
        const chevron = toggle.querySelector('i');
        if (chevron && treeChildren) {
            if (!treeChildren.classList.contains('collapsed')) {
                chevron.style.transform = 'rotate(90deg)';
            }
        }
    });
    
    // Tree node click handler (optional - can be used for selection)
    const treeNodes = document.querySelectorAll('.tree-node');
    treeNodes.forEach(node => {
        node.addEventListener('click', function(e) {
            // Don't trigger if clicking the toggle button
            if (e.target.closest('.tree-toggle')) {
                return;
            }
            
            // Remove active state from all nodes
            document.querySelectorAll('.tree-node').forEach(n => {
                n.classList.remove('active');
            });
            
            // Add active state to clicked node
            this.classList.add('active');
        });
    });
    
    // Console log for demonstration (can be removed)
    console.log('Notion-style UI components loaded successfully!');
});

