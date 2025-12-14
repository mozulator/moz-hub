// ═══════════════════════════════════════════════════════════════════════════════
// SNIPER BUDDY - Ballistics Engine
// Handles weapon data, calculations, chart rendering, and reference tables
// ═══════════════════════════════════════════════════════════════════════════════

let ballisticData = {};
let currentWeapon = '';
let currentAmmo = '';
let previousWeapon = ''; // Track previous weapon for change detection
let chart = null;
let favorites = []; // Array of { distance, mils, weaponKey, ammoKey }
let annotationPluginRegistered = false;
let favoriteUiBound = false;

// API Base URL (Sniper Buddy runs under /p/sniper-buddy/)
const API_BASE = `${(window.__BASE_PATH__ || '').replace(/\/$/, '')}/api`;

// Register Chart.js annotation plugin
function registerAnnotationPlugin() {
    if (annotationPluginRegistered) return;
    if (typeof Chart === 'undefined') {
        console.warn('⚠ Chart.js not available');
        return;
    }
    
    // The plugin auto-registers when loaded via CDN script tag
    // Check if it's available
    const annotationPlugin = window['chartjs-plugin-annotation'] || 
                             window.ChartAnnotation ||
                             (Chart.registry && Chart.registry.plugins.get('annotation'));
    
    if (annotationPlugin && typeof Chart.register === 'function') {
        try {
            Chart.register(annotationPlugin);
            annotationPluginRegistered = true;
            console.log('✓ Chart.js annotation plugin registered');
        } catch (e) {
            // Plugin might already be registered
            annotationPluginRegistered = true;
            console.log('✓ Chart.js annotation plugin already registered');
        }
    } else {
        // Plugin might auto-register, check if annotations work
        annotationPluginRegistered = true;
        console.log('✓ Chart.js annotation plugin (auto-registered)');
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Favorites Management
// ─────────────────────────────────────────────────────────────────────────────────
function loadFavorites() {
    try {
        const stored = localStorage.getItem('sniperBuddy_favorites');
        favorites = stored ? JSON.parse(stored) : [];
        console.log('✓ Favorites loaded:', favorites.length);
    } catch (e) {
        console.warn('⚠ Could not load favorites:', e);
        favorites = [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('sniperBuddy_favorites', JSON.stringify(favorites));
    } catch (e) {
        console.warn('⚠ Could not save favorites:', e);
    }
}

function addFavorite(distance, mils) {
    if (!currentWeapon || !currentAmmo) return false;
    
    // Check if already favorited for this weapon/ammo combo
    const exists = favorites.some(f => 
        f.distance === distance && 
        f.weaponKey === currentWeapon && 
        f.ammoKey === currentAmmo
    );
    
    if (exists) return false;
    
    favorites.push({
        distance: distance,
        mils: mils,
        weaponKey: currentWeapon,
        ammoKey: currentAmmo
    });
    
    saveFavorites();
    updateChart();
    updateReferenceTableFavoriteStates();
    updateClearFavoritesButton();
    console.log('⭐ Added favorite:', distance + 'm');
    return true;
}

function removeFavorite(distance) {
    if (!currentWeapon || !currentAmmo) return false;
    
    const index = favorites.findIndex(f => 
        f.distance === distance && 
        f.weaponKey === currentWeapon && 
        f.ammoKey === currentAmmo
    );
    
    if (index === -1) return false;
    
    favorites.splice(index, 1);
    saveFavorites();
    updateChart();
    updateReferenceTableFavoriteStates();
    updateClearFavoritesButton();
    console.log('✖ Removed favorite:', distance + 'm');
    return true;
}

function isFavorited(distance) {
    if (!currentWeapon || !currentAmmo) return false;
    
    return favorites.some(f => 
        f.distance === distance && 
        f.weaponKey === currentWeapon && 
        f.ammoKey === currentAmmo
    );
}

function getCurrentFavorites() {
    if (!currentWeapon || !currentAmmo) return [];
    
    return favorites.filter(f => 
        f.weaponKey === currentWeapon && 
        f.ammoKey === currentAmmo
    );
}

function clearAllFavorites() {
    if (!currentWeapon || !currentAmmo) return;
    
    // Only clear favorites for current weapon/ammo combo
    favorites = favorites.filter(f => 
        !(f.weaponKey === currentWeapon && f.ammoKey === currentAmmo)
    );
    
    saveFavorites();
    updateChart();
    updateReferenceTableFavoriteStates();
    updateClearFavoritesButton();
    console.log('🗑️ Cleared all favorites for current loadout');
}

function updateReferenceTableFavoriteStates() {
    const tableBody = document.querySelector('#referenceTable tbody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr[data-distance]');
    rows.forEach(row => {
        const distance = parseInt(row.dataset.distance);
        if (isFavorited(distance)) {
            row.classList.add('row-favorited');
            const icon = row.querySelector('.fav-btn i');
            if (icon) icon.className = 'fa-solid fa-star';
        } else {
            row.classList.remove('row-favorited');
            const icon = row.querySelector('.fav-btn i');
            if (icon) icon.className = 'fa-regular fa-star';
        }
    });
}

function updateClearFavoritesButton() {
    const btn = document.getElementById('clearFavoritesBtn');
    if (!btn) return;
    
    const currentFavs = getCurrentFavorites();
    if (currentFavs.length > 0) {
        btn.classList.remove('hidden');
        btn.title = `Clear ${currentFavs.length} favorite${currentFavs.length > 1 ? 's' : ''}`;
    } else {
        btn.classList.add('hidden');
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Weapon Image Mapping
// ─────────────────────────────────────────────────────────────────────────────────
function getWeaponImagePath(weaponName) {
    // Map weapon names to their image files
    const imageMap = {
        'AXMC .338 LM': 'AXMC .338 LM.jpg',
        'ORSIS T-5000M 7.62x51': 'ORSIS T-5000M 7.62x51.jpg',
        'Lobaev Arms DVL-10 7.62x51': 'Lobaev Arms DVL-10 7.62x51.jpg',
        'Sako TRG M10 .338': 'Sako TRG M10 .338.jpg',
        'SV-98 7.62x54R': 'SV-98 7.62x54R.jpg'
    };
    
    const fileName = imageMap[weaponName];
    if (!fileName) return null;
    const base = (window.__BASE_PATH__ || '').replace(/\/$/, '');
    return encodeURI(`${base}/assets/images/${fileName}`);
}

// ─────────────────────────────────────────────────────────────────────────────────
// Ammunition Name Formatting
// ─────────────────────────────────────────────────────────────────────────────────
function getShortAmmoName(fullName) {
    const ammoMappings = {
        'Full Metal Jacket': 'FMJ',
        'Armor Piercing': 'AP',
        'Hollow Point': 'HP',
        'Boat Tail Hollow Point': 'BTHP',
        'Match Grade': 'Match',
        'Subsonic': 'Subsonic',
        'M61': 'M61',
        'M80': 'M80',
        'M118': 'M118',
        'M993': 'M993',
        'SNB': 'SNB',
        'LPS Gzh': 'LPS',
        '7N1': '7N1',
        'Lapua Magnum': 'Lapua',
        'Scenar': 'Scenar'
    };
    
    return ammoMappings[fullName] || fullName;
}

function getFullAmmoName(fullName) {
    const ammoDescriptions = {
        'Full Metal Jacket': 'Full Metal Jacket',
        'Armor Piercing': 'Armor Piercing',
        'Hollow Point': 'Hollow Point',
        'Boat Tail Hollow Point': 'Boat Tail Hollow Point',
        'Match Grade': 'Match Grade',
        'Subsonic': 'Subsonic Round',
        'M61': 'M61 Ball',
        'M80': 'M80 Ball',
        'M118': 'M118 Match',
        'M993': 'M993 Armor Piercing',
        'SNB': 'SNB Armor Piercing',
        'LPS Gzh': 'LPS Gzh',
        '7N1': '7N1 Sniper',
        'Lapua Magnum': 'Lapua Magnum',
        'Scenar': 'Scenar Match'
    };
    
    return ammoDescriptions[fullName] || fullName;
}

// ─────────────────────────────────────────────────────────────────────────────────
// Data Loading
// ─────────────────────────────────────────────────────────────────────────────────
async function loadBallisticData() {
    try {
        const response = await fetch(`${API_BASE}/ballistics`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        ballisticData = await response.json();
        window.ballisticData = ballisticData;
        console.log('✓ Ballistic data loaded:', Object.keys(ballisticData).length, 'weapons');
        populateWeaponSelect();
        setDefaultSelection();
    } catch (error) {
        console.warn('⚠ API unavailable, using fallback data:', error.message);
        ballisticData = getSampleData();
        window.ballisticData = ballisticData;
        populateWeaponSelect();
        setDefaultSelection();
    }
}

// Fallback sample data
function getSampleData() {
    return {
        "axmc": {
            "name": "AXMC .338 LM",
            "scopeMultiplier": 1.0,
            "ammunition": {
                "fmj": {
                    "name": "Full Metal Jacket",
                    "ballistics": {
                        "100": 0.5, "200": 1.2, "300": 2.1, "400": 3.2, "500": 4.5,
                        "600": 6.0, "700": 7.8, "800": 9.8, "900": 12.1, "1000": 14.7
                    }
                },
                "ap": {
                    "name": "Armor Piercing",
                    "ballistics": {
                        "100": 0.4, "200": 1.0, "300": 1.8, "400": 2.8, "500": 4.0,
                        "600": 5.4, "700": 7.0, "800": 8.8, "900": 10.8, "1000": 13.0
                    }
                }
            }
        },
        "t5000": {
            "name": "ORSIS T-5000M 7.62x51",
            "scopeMultiplier": 1.0,
            "ammunition": {
                "m61": {
                    "name": "M61",
                    "ballistics": {
                        "100": 0.6, "200": 1.4, "300": 2.4, "400": 3.6, "500": 5.0,
                        "600": 6.6, "700": 8.4, "800": 10.4, "900": 12.6, "1000": 15.0
                    }
                }
            }
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────────
// UI Population
// ─────────────────────────────────────────────────────────────────────────────────
function populateWeaponSelect() {
    const weaponSelect = document.getElementById('weaponSelect');
    if (!weaponSelect) return;
    
    weaponSelect.innerHTML = '<option value="">Select weapon...</option>';
    
    // Filter weapons with scope multiplier > 1
    const filteredWeapons = Object.entries(ballisticData)
        .filter(([key, weapon]) => weapon.scopeMultiplier > 1);
    
    for (const [key, weapon] of filteredWeapons) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${weapon.name}`;
        weaponSelect.appendChild(option);
    }
    
    console.log('✓ Weapon select populated:', filteredWeapons.length, 'weapons');
}

function populateAmmoSelect(weaponKey) {
    const ammoSelect = document.getElementById('ammoSelect');
    ammoSelect.innerHTML = '<option value="">Select ammunition...</option>';
    
    if (!weaponKey || !ballisticData[weaponKey]) return;
    
    const weapon = ballisticData[weaponKey];
    for (const [key, ammo] of Object.entries(weapon.ammunition)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = getShortAmmoName(ammo.name);
        ammoSelect.appendChild(option);
    }
    
    // Auto-select first ammo if there's only one option
    const ammoOptions = Object.keys(weapon.ammunition);
    if (ammoOptions.length === 1) {
        ammoSelect.value = ammoOptions[0];
        currentAmmo = ammoOptions[0];
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Weapon Data Updates
// ─────────────────────────────────────────────────────────────────────────────────
function updateWeaponData() {
    const weaponSelect = document.getElementById('weaponSelect');
    const ammoSelect = document.getElementById('ammoSelect');
    
    if (!weaponSelect || !ammoSelect) return;
    
    const newWeapon = weaponSelect.value;
    const selectedAmmo = ammoSelect.value;
    
    // Check if weapon changed
    const weaponChanged = newWeapon !== previousWeapon;
    
    if (weaponChanged) {
        // Weapon changed - reset ammo and repopulate
        previousWeapon = newWeapon;
        currentWeapon = newWeapon;
        currentAmmo = ''; // Reset ammo selection
        
        if (newWeapon) {
            populateAmmoSelect(newWeapon);
            
            // If ammo was auto-selected (single option), update displays
            if (currentAmmo) {
                updateWeaponInfoDisplay();
                updateChart();
                updateReferenceTable();
            } else {
                updateWeaponInfoDisplay();
                // Clear chart and table until ammo is selected
                clearChartAndTable();
            }
        } else {
            updateWeaponInfoDisplay();
            clearChartAndTable();
        }
        return;
    }
    
    // Ammo changed (weapon stayed same)
    currentWeapon = newWeapon;
    currentAmmo = selectedAmmo;
    
    if (currentWeapon && currentAmmo) {
        updateWeaponInfoDisplay();
        updateChart();
        updateReferenceTable();
    }
}

function clearChartAndTable() {
    // Clear chart
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    // Clear reference table
    const tableBody = document.querySelector('#referenceTable tbody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-tertiary">
                    Select ammunition
                </td>
            </tr>
        `;
    }
}

function updateWeaponInfoDisplay() {
    const weaponNameEl = document.getElementById('weaponDisplayName');
    const ammoNameEl = document.getElementById('ammoDisplayName');
    const scopeValueEl = document.getElementById('scopeDisplayValue');
    
    if (!currentWeapon) {
        if (weaponNameEl) weaponNameEl.textContent = 'No weapon selected';
        if (ammoNameEl) ammoNameEl.textContent = '—';
        if (scopeValueEl) scopeValueEl.textContent = '—';
        return;
    }
    
    const weapon = ballisticData[currentWeapon];
    if (!weapon) return;
    
    if (weaponNameEl) weaponNameEl.textContent = weapon.name;
    
    if (currentAmmo && weapon.ammunition[currentAmmo]) {
        const ammo = weapon.ammunition[currentAmmo];
        if (ammoNameEl) ammoNameEl.textContent = getShortAmmoName(ammo.name);
    } else {
        if (ammoNameEl) ammoNameEl.textContent = 'Select ammo...';
    }
    
    if (scopeValueEl) {
        scopeValueEl.textContent = `${weapon.scopeMultiplier}×`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Range Calculator
// ─────────────────────────────────────────────────────────────────────────────────
function calculateFromDistance() {
    const distanceInput = document.getElementById('distance');
    const resultDiv = document.getElementById('distanceResult');
    
    if (!distanceInput || !resultDiv) return;
    
    const distance = parseInt(distanceInput.value);
    
    if (!distance || !currentWeapon || !currentAmmo) {
        resultDiv.innerHTML = '<span class="result-placeholder">—</span>';
        return;
    }
    
    const ballistics = ballisticData[currentWeapon]?.ammunition[currentAmmo]?.ballistics;
    if (!ballistics) {
        resultDiv.innerHTML = '<span class="result-placeholder">No data</span>';
        return;
    }
    
    // Find exact match or interpolate
    let milAdjustment;
    if (ballistics[distance]) {
        milAdjustment = ballistics[distance];
    } else {
        milAdjustment = interpolateMils(distance, ballistics);
    }
    
    if (milAdjustment === null) {
        resultDiv.innerHTML = '<span class="result-placeholder">Out of range</span>';
        return;
    }
    
    const scopeMultiplier = ballisticData[currentWeapon]?.scopeMultiplier || 1.0;
    const adjustedMils = milAdjustment * scopeMultiplier;
    
    resultDiv.innerHTML = `
        <div class="result-value">${adjustedMils.toFixed(1)}</div>
        <div class="result-unit">mils @ ${distance}m</div>
    `;
}

// ─────────────────────────────────────────────────────────────────────────────────
// Chart Rendering - Now with 10m intervals and favorites annotations
// ─────────────────────────────────────────────────────────────────────────────────
function updateChart() {
    if (!currentWeapon || !currentAmmo) return;
    
    const ballistics = ballisticData[currentWeapon]?.ammunition[currentAmmo]?.ballistics;
    if (!ballistics) return;
    
    const ctx = document.getElementById('ballisticChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (chart) {
        chart.destroy();
    }
    
    const scopeMultiplier = ballisticData[currentWeapon]?.scopeMultiplier || 1.0;
    
    // Generate data at 10m intervals for smooth chart hover
    const rawDistances = Object.keys(ballistics).map(Number).sort((a, b) => a - b);
    const minDistance = Math.min(...rawDistances);
    const maxDistance = Math.max(...rawDistances);
    
    const distances = [];
    const mils = [];
    
    for (let d = minDistance; d <= maxDistance; d += 10) {
        distances.push(d);
        const milValue = interpolateMils(d, ballistics);
        mils.push(milValue !== null ? milValue * scopeMultiplier : null);
    }
    
    // Build favorite annotations
    const currentFavs = getCurrentFavorites();
    const annotations = {};
    
    console.log('Building annotations for', currentFavs.length, 'favorites');
    
    currentFavs.forEach((fav, index) => {
        // Point annotation (marker)
        annotations[`favPoint${index}`] = {
            type: 'point',
            xValue: fav.distance,
            yValue: fav.mils,
            backgroundColor: '#0066FF',
            borderColor: '#FFFFFF',
            borderWidth: 2,
            radius: 7
        };
        
        // Label annotation
        annotations[`favLabel${index}`] = {
            type: 'label',
            xValue: fav.distance,
            yValue: fav.mils,
            content: [`${fav.distance}m`, `${fav.mils.toFixed(1)}`],
            backgroundColor: '#0066FF',
            color: '#FFFFFF',
            font: {
                family: "'Fira Code', monospace",
                size: 11,
                weight: '500'
            },
            padding: { x: 8, y: 4 },
            borderRadius: 6,
            yAdjust: -26
        };
        
        console.log('Added annotation for', fav.distance + 'm at', fav.mils, 'mils');
    });
    
    // Build data points as x,y pairs for linear scale (needed for annotations)
    const dataPoints = distances.map((d, i) => ({ x: d, y: mils[i] }));
    
    // Chart.js configuration with clean bright theme styling
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Mil Adjustment',
                data: dataPoints,
                borderColor: '#0066FF',
                backgroundColor: 'rgba(0, 102, 255, 0.06)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#0066FF',
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8E8E8',
                    borderWidth: 1,
                    titleFont: {
                        family: "'Plus Jakarta Sans', sans-serif",
                        size: 12,
                        weight: '500'
                    },
                    titleColor: '#888888',
                    bodyFont: {
                        family: "'Fira Code', monospace",
                        size: 14,
                        weight: '600'
                    },
                    bodyColor: '#0066FF',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `${context[0].parsed.x}m`;
                        },
                        label: function(context) {
                            return `${context.parsed.y.toFixed(1)} mils`;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: minDistance,
                    max: maxDistance,
                    title: {
                        display: true,
                        text: 'Distance (m)',
                        color: '#888888',
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11,
                            weight: '500'
                        },
                        padding: { top: 12 }
                    },
                    ticks: {
                        color: '#888888',
                        font: {
                            family: "'Fira Code', monospace",
                            size: 11
                        },
                        maxRotation: 0,
                        stepSize: 100,
                        callback: function(value) {
                            return value % 100 === 0 ? value : '';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.04)',
                        drawBorder: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Mil Adjustment',
                        color: '#888888',
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11,
                            weight: '500'
                        },
                        padding: { bottom: 12 }
                    },
                    ticks: {
                        color: '#888888',
                        font: {
                            family: "'Fira Code', monospace",
                            size: 11
                        },
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.04)',
                        drawBorder: false
                    },
                    beginAtZero: true
                }
            }
        }
    });
    
    window.chart = chart;
    console.log('✓ Chart updated with 10m intervals and', currentFavs.length, 'favorites');
}

// ─────────────────────────────────────────────────────────────────────────────────
// Reference Table
// ─────────────────────────────────────────────────────────────────────────────────
function updateReferenceTable() {
    if (!currentWeapon || !currentAmmo) return;
    
    const ballistics = ballisticData[currentWeapon]?.ammunition[currentAmmo]?.ballistics;
    if (!ballistics) return;
    
    const tableBody = document.querySelector('#referenceTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Filter distances to start from 450m and up
    const allDistances = Object.keys(ballistics).map(Number).sort((a, b) => a - b);
    const filteredDistances = allDistances.filter(distance => distance >= 450);
    const scopeMultiplier = ballisticData[currentWeapon]?.scopeMultiplier || 1.0;
    
    // Create rows with 10m increments
    for (let i = 0; i < filteredDistances.length; i++) {
        const currentDistance = filteredDistances[i];
        const nextDistance = filteredDistances[i + 1];
        
        // Main distance row
        const rawMils = ballistics[currentDistance];
        const adjustedMils = rawMils * scopeMultiplier;
        
        const isMajor = currentDistance % 50 === 0;
        const isFav = isFavorited(currentDistance);
        const row = document.createElement('tr');
        row.className = (isMajor ? 'row-major' : '') + (isFav ? ' row-favorited' : '');
        row.dataset.distance = currentDistance;
        row.dataset.mils = adjustedMils.toFixed(1);
        row.innerHTML = `
            <td class="fav-cell">
                <button class="fav-btn" type="button" title="${isFav ? 'Unfavorite' : 'Favorite'}">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                </button>
            </td>
            <td>${currentDistance}m</td>
            <td>${adjustedMils.toFixed(1)}</td>
        `;
        tableBody.appendChild(row);
        
        // Interpolated rows
        if (nextDistance) {
            for (let dist = currentDistance + 10; dist < nextDistance; dist += 10) {
                const interpolatedMils = interpolateMils(dist, ballistics) * scopeMultiplier;
                const isFavInterpolated = isFavorited(dist);
                const interpolatedRow = document.createElement('tr');
                interpolatedRow.className = 'row-minor' + (isFavInterpolated ? ' row-favorited' : '');
                interpolatedRow.dataset.distance = dist;
                interpolatedRow.dataset.mils = interpolatedMils.toFixed(1);
                interpolatedRow.innerHTML = `
                    <td class="fav-cell">
                        <button class="fav-btn" type="button" title="${isFavInterpolated ? 'Unfavorite' : 'Favorite'}">
                            <i class="${isFavInterpolated ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                        </button>
                    </td>
                    <td>${dist}m</td>
                    <td>${interpolatedMils.toFixed(1)}</td>
                `;
                tableBody.appendChild(interpolatedRow);
            }
        }
    }
    
    console.log('✓ Reference table updated');
    updateClearFavoritesButton();
    
    // Sync snipe mode table
    if (typeof window.syncSnipeModeTable === 'function') {
        window.syncSnipeModeTable();
    }
}

function initializeFavoriteUI() {
    if (favoriteUiBound) return;
    favoriteUiBound = true;

    // Click-to-favorite: star button toggles the distance as a favorite
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.fav-btn');
        if (!btn) return;
        const row = btn.closest('tr[data-distance]');
        if (!row) return;

        const distance = parseInt(row.dataset.distance);
        const mils = parseFloat(row.dataset.mils);
        if (!distance || Number.isNaN(mils)) return;

        if (isFavorited(distance)) {
            removeFavorite(distance);
        } else {
            addFavorite(distance, mils);
        }

        updateReferenceTableFavoriteStates();
        updateClearFavoritesButton();
    });
}

// ─────────────────────────────────────────────────────────────────────────────────
// Interpolation
// ─────────────────────────────────────────────────────────────────────────────────
function interpolateMils(targetDistance, ballistics) {
    const distances = Object.keys(ballistics).map(Number).sort((a, b) => a - b);
    
    // Exact match
    if (ballistics[targetDistance] !== undefined) {
        return ballistics[targetDistance];
    }
    
    // Find bounds
    let lower = null, upper = null;
    for (const d of distances) {
        if (d < targetDistance) lower = d;
        if (d > targetDistance && upper === null) upper = d;
    }
    
    if (lower !== null && upper !== null) {
        const lowerMils = ballistics[lower];
        const upperMils = ballistics[upper];
        const ratio = (targetDistance - lower) / (upper - lower);
        return lowerMils + (upperMils - lowerMils) * ratio;
    } else if (lower !== null) {
        return ballistics[lower];
    } else if (upper !== null) {
        return ballistics[upper];
    }
    
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────────
// Default Selection
// ─────────────────────────────────────────────────────────────────────────────────
function setDefaultSelection() {
    const weaponSelect = document.getElementById('weaponSelect');
    if (weaponSelect && weaponSelect.options.length > 1) {
        weaponSelect.selectedIndex = 1;
        // Don't set previousWeapon here - let updateWeaponData detect the change
        updateWeaponData();
    }
}

// ─────────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚡ Sniper Buddy initializing...');
    registerAnnotationPlugin();
    loadFavorites();
    initializeFavoriteUI();
    loadBallisticData();
});

// Global exports
window.ballisticData = ballisticData;
window.updateWeaponData = updateWeaponData;
window.calculateFromDistance = calculateFromDistance;
window.getShortAmmoName = getShortAmmoName;
window.getFullAmmoName = getFullAmmoName;
window.getWeaponImagePath = getWeaponImagePath;
window.currentWeapon = () => currentWeapon;
window.currentAmmo = () => currentAmmo;
window.chart = chart;

// Favorites exports
window.addFavorite = addFavorite;
window.removeFavorite = removeFavorite;
window.isFavorited = isFavorited;
window.clearAllFavorites = clearAllFavorites;
window.getCurrentFavorites = getCurrentFavorites;
