// Budget Tracker - Main JavaScript
// This file contains shared utilities and interactions

// Initialize Lucide icons after page load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Utility: Format currency in Serbian Dinar format
function formatCurrency(amount) {
  return new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' RSD';
}

// Utility: Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Toast notification system
const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info') {
    this.init();
    
    const colors = {
      success: 'bg-emerald-900 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-zinc-900 text-white',
      warning: 'bg-amber-500 text-white'
    };
    
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      info: 'info',
      warning: 'alert-triangle'
    };
    
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg ${colors[type]} 
                       transform translate-x-full opacity-0 transition-all duration-300`;
    toast.innerHTML = `
      <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
      <span class="text-sm font-medium">${message}</span>
    `;
    
    this.container.appendChild(toast);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    });
    
    // Animate out and remove
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
  
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  info(message) { this.show(message, 'info'); },
  warning(message) { this.show(message, 'warning'); }
};

// Export for use in other scripts
window.BudgetTracker = {
  formatCurrency,
  debounce,
  Toast
};

