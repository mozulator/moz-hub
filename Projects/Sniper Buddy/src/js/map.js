// Map Interaction JavaScript
let isSnipingMode = false;
let snipingSpots = [];
let targetSpots = [];
let selectedSpot = null;
let mapContainer = null;

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
});

// Initialize map functionality
function initializeMap() {
    mapContainer = document.getElementById('interactiveMap');
    if (!mapContainer) return;
    
    // Hide loading indicator after a short delay
    setTimeout(() => {
        const loadingElement = document.getElementById('mapLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }, 1000);
    
    // Add click event listener to map
    mapContainer.addEventListener('click', handleMapClick);
    
    // Add mouse move event for dragging
    mapContainer.addEventListener('mousemove', handleMouseMove);
    mapContainer.addEventListener('mouseup', handleMouseUp);
    
    // Prevent context menu on right click
    mapContainer.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Toggle sniping mode
function toggleSnipingMode() {
    isSnipingMode = !isSnipingMode;
    const button = document.getElementById('snipingModeBtn');
    
    if (isSnipingMode) {
        button.textContent = 'Place Target';
        button.classList.add('btn-success');
        button.classList.remove('btn-primary');
        mapContainer.style.cursor = 'crosshair';
    } else {
        button.innerHTML = '<i class="fas fa-crosshairs"></i> Place Sniping Spot';
        button.classList.remove('btn-success');
        button.classList.add('btn-primary');
        mapContainer.style.cursor = 'crosshair';
    }
}

// Handle map clicks
function handleMapClick(event) {
    if (!mapContainer) return;
    
    const rect = mapContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to percentage coordinates for responsive positioning
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    if (isSnipingMode) {
        // Place target spot
        placeTargetSpot(xPercent, yPercent);
    } else {
        // Place sniping spot
        placeSnipingSpot(xPercent, yPercent);
    }
}

// Place sniping spot
function placeSnipingSpot(x, y) {
    // Clear existing sniping spots (only one at a time)
    clearSnipingSpots();
    
    const spot = createSpotElement('sniping-spot', x, y);
    spot.style.backgroundColor = '#ff6600';
    spot.style.border = '2px solid #ffffff';
    
    snipingSpots.push({
        element: spot,
        x: x,
        y: y,
        type: 'sniping'
    });
    
    mapContainer.appendChild(spot);
    
    // Make spot draggable
    makeSpotDraggable(spot);
    
    // Update distance calculations
    updateDistanceCalculations();
}

// Place target spot
function placeTargetSpot(x, y) {
    const spot = createSpotElement('target-spot', x, y);
    spot.style.backgroundColor = '#ff0000';
    spot.style.border = '2px solid #ffffff';
    
    targetSpots.push({
        element: spot,
        x: x,
        y: y,
        type: 'target'
    });
    
    mapContainer.appendChild(spot);
    
    // Make spot draggable
    makeSpotDraggable(spot);
    
    // Update distance calculations
    updateDistanceCalculations();
}

// Create spot element
function createSpotElement(className, x, y) {
    const spot = document.createElement('div');
    spot.className = className;
    spot.style.position = 'absolute';
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    spot.style.width = className === 'sniping-spot' ? '20px' : '15px';
    spot.style.height = className === 'sniping-spot' ? '20px' : '15px';
    spot.style.borderRadius = '50%';
    spot.style.cursor = 'move';
    spot.style.zIndex = className === 'sniping-spot' ? '50' : '40';
    spot.style.transform = 'translate(-50%, -50%)';
    
    return spot;
}

// Make spot draggable
function makeSpotDraggable(spot) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    spot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDragging = true;
        selectedSpot = spot;
        startX = e.clientX;
        startY = e.clientY;
        spot.style.opacity = '0.7';
        spot.classList.add('dragging');
        
        // Add selected class to sniping spots
        if (spot.classList.contains('sniping-spot')) {
            document.querySelectorAll('.sniping-spot').forEach(s => s.classList.remove('selected'));
            spot.classList.add('selected');
        }
    });
    
    // Handle mouse move for dragging
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || selectedSpot !== spot) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to percentage
        const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));
        
        spot.style.left = `${xPercent}%`;
        spot.style.top = `${yPercent}%`;
        
        // Update spot data
        const spotData = [...snipingSpots, ...targetSpots].find(s => s.element === spot);
        if (spotData) {
            spotData.x = xPercent;
            spotData.y = yPercent;
        }
        
        // Update distance calculations
        updateDistanceCalculations();
    });
    
    // Handle mouse up
    window.addEventListener('mouseup', (e) => {
        if (!isDragging || selectedSpot !== spot) return;
        
        isDragging = false;
        selectedSpot = null;
        spot.style.opacity = '1';
        spot.classList.remove('dragging');
    });
}

// Clear all spots
function clearAllSpots() {
    clearSnipingSpots();
    clearTargetSpots();
    clearDistanceLines();
}

// Clear sniping spots
function clearSnipingSpots() {
    snipingSpots.forEach(spot => {
        if (spot.element && spot.element.parentNode) {
            spot.element.parentNode.removeChild(spot.element);
        }
    });
    snipingSpots = [];
}

// Clear target spots
function clearTargetSpots() {
    targetSpots.forEach(spot => {
        if (spot.element && spot.element.parentNode) {
            spot.element.parentNode.removeChild(spot.element);
        }
    });
    targetSpots = [];
}

// Clear distance lines
function clearDistanceLines() {
    const lines = mapContainer.querySelectorAll('.snipe-line, .line-distance');
    lines.forEach(line => {
        if (line.parentNode) {
            line.parentNode.removeChild(line);
        }
    });
}

// Update distance calculations and draw lines
function updateDistanceCalculations() {
    clearDistanceLines();
    
    if (snipingSpots.length === 0 || targetSpots.length === 0) return;
    
    const snipingSpot = snipingSpots[0];
    
    targetSpots.forEach(targetSpot => {
        drawSnipeLine(snipingSpot, targetSpot);
    });
}

// Draw snipe line between sniping spot and target
function drawSnipeLine(snipingSpot, targetSpot) {
    const dx = targetSpot.x - snipingSpot.x;
    const dy = targetSpot.y - snipingSpot.y;
    
    // Calculate distance (approximate, not to scale)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const realDistance = Math.round(distance * 10); // Arbitrary scaling
    
    // Calculate angle
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Create line element
    const line = document.createElement('div');
    line.className = 'snipe-line';
    line.style.position = 'absolute';
    line.style.left = `${snipingSpot.x}%`;
    line.style.top = `${snipingSpot.y}%`;
    line.style.width = `${distance}%`;
    line.style.height = '2px';
    line.style.backgroundColor = '#00d4ff';
    line.style.transformOrigin = 'left center';
    line.style.transform = `rotate(${angle}deg)`;
    line.style.zIndex = '30';
    
    mapContainer.appendChild(line);
    
    // Create distance label
    const label = document.createElement('div');
    label.className = 'line-distance';
    label.style.position = 'absolute';
    label.style.left = `${snipingSpot.x + dx / 2}%`;
    label.style.top = `${snipingSpot.y + dy / 2}%`;
    label.style.transform = 'translate(-50%, -50%)';
    label.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    label.style.color = '#00d4ff';
    label.style.padding = '2px 6px';
    label.style.fontSize = '0.7em';
    label.style.border = '1px solid #00d4ff';
    label.style.borderRadius = '2px';
    label.style.zIndex = '35';
    label.textContent = `${realDistance}m`;
    
    mapContainer.appendChild(label);
}

// Handle mouse move (for global dragging)
function handleMouseMove(event) {
    // This is handled by individual spot event listeners
}

// Handle mouse up (for global dragging)
function handleMouseUp(event) {
    // This is handled by individual spot event listeners
}

// Make functions globally available
window.toggleSnipingMode = toggleSnipingMode;
window.clearAllSpots = clearAllSpots; 