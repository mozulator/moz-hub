// ═══════════════════════════════════════════════════════════════════════════════
// SNIPER BUDDY - UI Controller
// Handles modals, snipe mode, animations, and keyboard shortcuts
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────────
let isSnipeModeActive = false;
let activeContextMenu = null;

// ─────────────────────────────────────────────────────────────────────────────────
// Build Modal
// ─────────────────────────────────────────────────────────────────────────────────
function showBuildModal() {
    const modal = document.getElementById('buildModal');
    const buildContent = document.getElementById('buildContent');
    
    if (!modal || !buildContent) return;
    
    const weaponSelect = document.getElementById('weaponSelect');
    const ammoSelect = document.getElementById('ammoSelect');
    
    const weaponKey = weaponSelect?.value;
    const ammoKey = ammoSelect?.value;
    
    if (!weaponKey) {
        buildContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Please select a weapon first.</span>
            </div>
        `;
    } else {
        const weaponData = window.ballisticData?.[weaponKey];
        
        if (weaponData) {
            const ammoData = ammoKey ? weaponData.ammunition?.[ammoKey] : null;
            buildContent.innerHTML = generateBuildContent(weaponData, ammoData, weaponKey);
        } else {
            buildContent.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-times-circle"></i>
                    <span>Unable to load weapon build data.</span>
                </div>
            `;
        }
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBuildModal() {
    const modal = document.getElementById('buildModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function generateBuildContent(weaponData, ammoData, weaponKey) {
    // Get weapon image path
    const imagePath = window.getWeaponImagePath ? window.getWeaponImagePath(weaponData.name) : null;
    
    // Build weapon image section
    const imageSection = imagePath ? `
        <div class="build-section">
            <div class="build-weapon-image">
                <img src="${imagePath}" alt="${weaponData.name}" onerror="this.parentElement.style.display='none'">
            </div>
        </div>
    ` : '';
    
    // Build stats section (only if ammo is selected)
    let statsSection = '';
    let quickRefSection = '';
    let tipsSection = '';
    
    if (ammoData) {
        const ballisticsEntries = Object.entries(ammoData.ballistics);
        const maxRange = Math.max(...ballisticsEntries.map(([distance]) => parseInt(distance)));
        const maxMils = Math.max(...ballisticsEntries.map(([, mils]) => mils * weaponData.scopeMultiplier));
        const shortAmmo = window.getShortAmmoName ? window.getShortAmmoName(ammoData.name) : ammoData.name;
        const fullAmmo = window.getFullAmmoName ? window.getFullAmmoName(ammoData.name) : ammoData.name;
        
        statsSection = `
            <!-- Weapon & Ammo Overview -->
            <div class="build-section">
                <h3 class="build-section-title">
                    <i class="fas fa-info-circle"></i>
                    Configuration
                </h3>
                <div class="build-grid">
                    <div class="build-stat">
                        <div class="build-stat-label">Weapon</div>
                        <div class="build-stat-value">${weaponData.name}</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Scope Multiplier</div>
                        <div class="build-stat-value accent">${weaponData.scopeMultiplier}×</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Ammunition</div>
                        <div class="build-stat-value">${shortAmmo}</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Ammo Type</div>
                        <div class="build-stat-value">${fullAmmo}</div>
                    </div>
                </div>
            </div>
            
            <!-- Performance Stats -->
            <div class="build-section">
                <h3 class="build-section-title">
                    <i class="fas fa-chart-bar"></i>
                    Performance
                </h3>
                <div class="build-grid">
                    <div class="build-stat">
                        <div class="build-stat-label">Max Effective Range</div>
                        <div class="build-stat-value accent">${maxRange}m</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Max Mil Adjustment</div>
                        <div class="build-stat-value accent">${maxMils.toFixed(1)}</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Data Points</div>
                        <div class="build-stat-value">${ballisticsEntries.length}</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Precision</div>
                        <div class="build-stat-value">10m intervals</div>
                    </div>
                </div>
            </div>
        `;
        
        quickRefSection = `
            <!-- Quick Reference -->
            <div class="build-section">
                <h3 class="build-section-title">
                    <i class="fas fa-list-ol"></i>
                    Quick Reference
                </h3>
                <div class="build-quick-ref">
                    ${ballisticsEntries.slice(0, 8).map(([distance, mils]) => {
                        const adjustedMils = (mils * weaponData.scopeMultiplier).toFixed(1);
                        return `
                            <div class="build-quick-ref-item">
                                <span>${distance}m</span>
                                <span>${adjustedMils}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        tipsSection = `
            <!-- Tips -->
            <div class="build-section">
                <div class="build-tip">
                    <div class="build-tip-title">
                        <i class="fas fa-lightbulb"></i>
                        Pro Tips
                    </div>
                    <div class="build-tip-content">
                        All mil values are pre-adjusted for the ${weaponData.scopeMultiplier}× scope multiplier.
                        Use the Range Calculator for distances between data points.
                        Press <strong>S</strong> to enter Snipe Mode for fullscreen reference.
                    </div>
                </div>
            </div>
        `;
    } else {
        // No ammo selected - show basic weapon info
        statsSection = `
            <div class="build-section">
                <h3 class="build-section-title">
                    <i class="fas fa-info-circle"></i>
                    Weapon Info
                </h3>
                <div class="build-grid">
                    <div class="build-stat">
                        <div class="build-stat-label">Weapon</div>
                        <div class="build-stat-value">${weaponData.name}</div>
                    </div>
                    <div class="build-stat">
                        <div class="build-stat-label">Scope Multiplier</div>
                        <div class="build-stat-value accent">${weaponData.scopeMultiplier}×</div>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-info mt-4">
                <i class="fas fa-info-circle"></i>
                <span>Select ammunition to view ballistic data and performance stats.</span>
            </div>
        `;
    }
    
    return `
        ${imageSection}
        ${statsSection}
        ${quickRefSection}
        ${tipsSection}
    `;
}

// ─────────────────────────────────────────────────────────────────────────────────
// Snipe Mode
// ─────────────────────────────────────────────────────────────────────────────────
function toggleSnipeMode() {
    isSnipeModeActive = !isSnipeModeActive;
    
    const overlay = document.getElementById('snipeModeOverlay');
    const fab = document.getElementById('snipeModeBtn');
    
    if (isSnipeModeActive) {
        // Enter snipe mode
        overlay.classList.add('active');
        fab.style.display = 'none';
        document.body.style.overflow = 'hidden';
        
        syncSnipeModeTable();
        updateSnipeModeHeader();
        
        console.log('🎯 Snipe Mode: ACTIVATED');
    } else {
        // Exit snipe mode
        overlay.classList.remove('active');
        fab.style.display = 'flex';
        document.body.style.overflow = '';
        
        console.log('🎯 Snipe Mode: DEACTIVATED');
    }
}

function syncSnipeModeTable() {
    const originalTable = document.querySelector('#referenceTable tbody');
    const snipeModeTable = document.querySelector('#snipeModeTable tbody');
    
    if (originalTable && snipeModeTable) {
        // Clone the rows to preserve data attributes
        snipeModeTable.innerHTML = '';
        const rows = originalTable.querySelectorAll('tr');
        rows.forEach(row => {
            const clonedRow = row.cloneNode(true);
            snipeModeTable.appendChild(clonedRow);
        });
    }
}

function updateSnipeModeHeader() {
    const weaponNameEl = document.getElementById('snipeModeWeaponName');
    if (!weaponNameEl) return;
    
    const weaponSelect = document.getElementById('weaponSelect');
    const ammoSelect = document.getElementById('ammoSelect');
    
    if (weaponSelect?.value && ammoSelect?.value && window.ballisticData) {
        const weapon = window.ballisticData[weaponSelect.value];
        const ammo = weapon?.ammunition?.[ammoSelect.value];
        
        if (weapon && ammo) {
            const shortAmmo = window.getShortAmmoName ? window.getShortAmmoName(ammo.name) : ammo.name;
            weaponNameEl.textContent = `${weapon.name} • ${shortAmmo} • ${weapon.scopeMultiplier}×`;
        }
    } else {
        weaponNameEl.textContent = '—';
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Keyboard Shortcuts
// ─────────────────────────────────────────────────────────────────────────────────
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape closes modal or exits snipe mode
        if (e.key === 'Escape') {
            if (isSnipeModeActive) {
                toggleSnipeMode();
            } else {
                closeBuildModal();
            }
            return;
        }
        
        // 'S' toggles snipe mode (when not in input)
        if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
            const isInput = e.target.matches('input, textarea, select');
            if (!isInput) {
                e.preventDefault();
                toggleSnipeMode();
            }
        }
        
        // 'B' opens build modal
        if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey) {
            const isInput = e.target.matches('input, textarea, select');
            if (!isInput && !isSnipeModeActive) {
                e.preventDefault();
                showBuildModal();
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────────
// Click Outside Modal to Close
// ─────────────────────────────────────────────────────────────────────────────────
function initializeModalClickOutside() {
    const modal = document.getElementById('buildModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeBuildModal();
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Animation Initialization
// ─────────────────────────────────────────────────────────────────────────────────
function initializeAnimations() {
    // Trigger staggered animations on load
    const staggerElements = document.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4');
    staggerElements.forEach(el => {
        el.classList.add('animate-slide-up');
    });
}

// ─────────────────────────────────────────────────────────────────────────────────
// Input Focus Enhancement
// ─────────────────────────────────────────────────────────────────────────────────
function initializeInputEnhancements() {
    const distanceInput = document.getElementById('distance');
    if (distanceInput) {
        // Select all on focus
        distanceInput.addEventListener('focus', () => {
            distanceInput.select();
        });
        
        // Enter key triggers calculation
        distanceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof calculateFromDistance === 'function') {
                    calculateFromDistance();
                }
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Context Menu for Favorites
// ─────────────────────────────────────────────────────────────────────────────────
function showContextMenu(e, distance, mils) {
    e.preventDefault();
    hideContextMenu();
    
    const isFav = window.isFavorited ? window.isFavorited(distance) : false;
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <button class="context-menu-item" data-action="${isFav ? 'unfavorite' : 'favorite'}">
            <i class="fas fa-star${isFav ? '' : '-o'}"></i>
            <span>${isFav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </button>
    `;
    
    // Position menu
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    
    document.body.appendChild(menu);
    activeContextMenu = menu;
    
    // Adjust position if off screen
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        menu.style.left = (e.pageX - menuRect.width) + 'px';
    }
    if (menuRect.bottom > window.innerHeight) {
        menu.style.top = (e.pageY - menuRect.height) + 'px';
    }
    
    // Handle menu item click
    menu.addEventListener('click', (evt) => {
        const item = evt.target.closest('.context-menu-item');
        if (!item) return;
        
        const action = item.dataset.action;
        if (action === 'favorite') {
            if (window.addFavorite) {
                window.addFavorite(distance, parseFloat(mils));
            }
        } else if (action === 'unfavorite') {
            if (window.removeFavorite) {
                window.removeFavorite(distance);
            }
        }
        
        hideContextMenu();
    });
}

function hideContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

function initializeContextMenu() {
    // Close context menu on click outside
    document.addEventListener('click', (e) => {
        if (activeContextMenu && !activeContextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeContextMenu) {
            hideContextMenu();
        }
    });
    
    // Right-click on reference table rows
    const referenceBody = document.querySelector('#referenceTable tbody');
    if (referenceBody) {
        referenceBody.addEventListener('contextmenu', (e) => {
            const row = e.target.closest('tr[data-distance]');
            if (row) {
                const distance = parseInt(row.dataset.distance);
                const mils = row.dataset.mils;
                showContextMenu(e, distance, mils);
            }
        });
    }
    
    // Also support snipe mode table
    const snipeModeBody = document.querySelector('#snipeModeTable tbody');
    if (snipeModeBody) {
        snipeModeBody.addEventListener('contextmenu', (e) => {
            const row = e.target.closest('tr[data-distance]');
            if (row) {
                const distance = parseInt(row.dataset.distance);
                const mils = row.dataset.mils;
                showContextMenu(e, distance, mils);
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    initializeKeyboardShortcuts();
    initializeModalClickOutside();
    initializeAnimations();
    initializeInputEnhancements();
    initializeContextMenu();
    
    console.log('✓ UI initialized');
});

// ─────────────────────────────────────────────────────────────────────────────────
// Global Exports
// ─────────────────────────────────────────────────────────────────────────────────
window.showBuildModal = showBuildModal;
window.closeBuildModal = closeBuildModal;
window.toggleSnipeMode = toggleSnipeMode;
window.syncSnipeModeTable = syncSnipeModeTable;
window.hideContextMenu = hideContextMenu;
