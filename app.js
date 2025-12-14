// ========================================
// Theme System
// ========================================
let currentTheme = localStorage.getItem('battleship-theme') || 'original';

// Apply theme to body
function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('battleship-theme', theme);
    
    // Remove all theme classes
    document.body.classList.remove('theme-original', 'theme-space', 'theme-pirate');
    
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Update dropdown to match
    const themeDropdown = document.getElementById('theme-dropdown');
    if (themeDropdown) {
        themeDropdown.value = theme;
    }
    
    // Update theme label
    const themeLabel = document.querySelector('.theme-label');
    if (themeLabel) {
        const themeNames = {
            'original': 'Original',
            'space': 'Outer Space',
            'pirate': 'Pirate'
        };
        themeLabel.textContent = themeNames[theme] || 'Original';
    }
    
    // Update ship names and visuals in placement tray
    updatePlacementTrayShipNames();
    updateTrayShipVisuals();
}

// Update ship names in placement tray based on current theme
function updatePlacementTrayShipNames() {
    const trayShips = document.querySelectorAll('.tray-ship');
    if (trayShips.length === 0) return; // DOM not ready yet
    
    trayShips.forEach(trayShip => {
        const shipName = trayShip.dataset.ship;
        const nameSpan = trayShip.querySelector('.ship-name');
        if (nameSpan) {
            nameSpan.textContent = getShipDisplayName(shipName);
        }
    });
}

// Update ship visuals in placement tray based on current theme
function updateTrayShipVisuals() {
    const trayShips = document.querySelectorAll('.tray-ship');
    if (trayShips.length === 0) return; // DOM not ready yet
    
    trayShips.forEach(trayShip => {
        const shipName = trayShip.dataset.ship;
        const shipSize = parseInt(trayShip.dataset.size);
        
        // Remove ALL existing ship-visual elements (there may be multiple from HTML)
        const existingVisuals = trayShip.querySelectorAll('.ship-visual');
        const wasVertical = Array.from(existingVisuals).some(v => v.classList.contains('vertical'));
        existingVisuals.forEach(visual => visual.remove());
        
        // Generate theme-specific SVG (always horizontal in tray, isForTray=true)
        const svgHTML = getShipSVG(shipName, shipSize, true, true);
        
        // Create the new SVG element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgHTML;
        const newSVG = tempDiv.querySelector('svg');
        
        if (newSVG) {
            // Add ship-visual class
            newSVG.classList.add('ship-visual');
            
            // Preserve vertical orientation if it was set
            if (wasVertical) {
                newSVG.classList.add('vertical');
            }
            
            // Append the new SVG to the tray ship
            trayShip.appendChild(newSVG);
        }
    });
}

// Apply theme class immediately (before DOM load for styling)
document.body.classList.add(`theme-${currentTheme}`);

// ========================================
// Background Music System - MP3 Audio
// ========================================
const bgMusic = new Audio('assets/naval-theme.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.25;

let musicEnabled = false;

// Start playing background music
function startMusic() {
    // Attempt to play (handle autoplay policy)
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            // Autoplay was prevented - will start on next user gesture
            console.log('Music autoplay prevented, waiting for user interaction');
        });
    }
}

// Stop/pause background music
function stopMusic() {
    bgMusic.pause();
}

// Toggle music on/off
function toggleMusic() {
    musicEnabled = !musicEnabled;
    
    // Update all music toggle buttons (home screen and game screen)
    const musicBtns = document.querySelectorAll('.music-toggle-btn');
    
    musicBtns.forEach(musicBtn => {
        const musicIcon = musicBtn.querySelector('.music-icon');
        const musicText = musicBtn.querySelector('.music-text');
        
        if (musicEnabled) {
            musicBtn.classList.add('music-on');
            musicIcon.textContent = '🔊';
            musicText.textContent = 'Music: On';
        } else {
            musicBtn.classList.remove('music-on');
            musicIcon.textContent = '🔇';
            musicText.textContent = 'Music: Off';
        }
    });
    
    if (musicEnabled) {
        startMusic();
    } else {
        stopMusic();
    }
}

// Attempt to start music if enabled (called after user gestures)
function tryStartMusic() {
    if (musicEnabled && bgMusic.paused) {
        startMusic();
    }
}

// ========================================
// Game state
// ========================================
const GRID_SIZE = 10;
const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
];

// Theme-specific ship display names
const PIRATE_SHIP_NAMES = {
    'Carrier': 'Galleon',
    'Battleship': 'Frigate',
    'Cruiser': 'Brigantine',
    'Submarine': 'Ketch',
    'Destroyer': 'Sloop'
};

const SPACE_SHIP_NAMES = {
    'Carrier': 'Star Carrier',
    'Battleship': 'Battlecruiser',
    'Cruiser': 'Interceptor',
    'Submarine': 'Stealth Frigate',
    'Destroyer': 'Scout Skiff'
};

// Get display name based on current theme
function getShipDisplayName(shipName) {
    const currentTheme = document.body.className.match(/theme-(\w+)/)?.[1] || 'original';
    if (currentTheme === 'pirate' && PIRATE_SHIP_NAMES[shipName]) {
        return PIRATE_SHIP_NAMES[shipName];
    }
    if (currentTheme === 'space' && SPACE_SHIP_NAMES[shipName]) {
        return SPACE_SHIP_NAMES[shipName];
    }
    return shipName;
}

let gameState = {
    playerBoard: [],
    aiBoard: [],
    playerShips: [],
    aiShips: [],
    gameActive: false,
    playerTurn: true,
    placementPhase: false,
    currentOrientation: 'horizontal',
    placedShips: new Set(),
    difficulty: null,
    aiTargetMode: false,
    aiLastHit: null,
    aiTargetQueue: [],
    aiHitSequence: [],
    playerShotsTaken: 0,
    playerHits: 0,
    aiShotsTaken: 0,
    aiHits: 0
};

// DOM elements
const playerGridEl = document.getElementById('player-grid');
const placementGridEl = document.getElementById('placement-grid');
const aiGridEl = document.getElementById('ai-grid');
const statusMessageEl = document.getElementById('status-message');
const newGameBtn = document.getElementById('new-game-btn');
const playerShipsListEl = document.getElementById('player-ships-list');
const aiShipsListEl = document.getElementById('ai-ships-list');
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const playNowBtn = document.getElementById('play-now-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsBtn = document.getElementById('close-instructions-btn');
const placementPhaseEl = document.getElementById('placement-phase');
const rotateBtn = document.getElementById('rotate-btn');
const gameContainerEl = document.querySelector('.game-container');
const trayShips = document.querySelectorAll('.tray-ship');
const placementConfirmationModal = document.getElementById('placement-confirmation-modal');
const keepEditingBtn = document.getElementById('keep-editing-btn');
const startGameBtn = document.getElementById('start-game-btn');
const randomBtn = document.getElementById('random-btn');
const resetBtn = document.getElementById('reset-btn');
const closeBtn = document.getElementById('close-btn');
const difficultyModal = document.getElementById('difficulty-modal');
const easyModeBtn = document.getElementById('easy-mode-btn');
const mediumModeBtn = document.getElementById('medium-mode-btn');
const hardModeBtn = document.getElementById('hard-mode-btn');
const difficultyIndicator = document.getElementById('difficulty-indicator');
// Music toggle buttons (both home screen and game screen)
const musicToggleBtns = document.querySelectorAll('.music-toggle-btn');
// Theme dropdown
const themeDropdown = document.getElementById('theme-dropdown');

// Event listeners will be attached in DOMContentLoaded

// ========================================
// Game Logic Functions
// ========================================

// Keyboard R for rotation
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.placementPhase) {
            toggleOrientation();
        }
    }
});

function startPlacementPhase() {
    // Get DOM elements (they exist now since this is called after DOMContentLoaded)
    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const placementPhaseEl = document.getElementById('placement-phase');
    const gameContainerEl = document.querySelector('.game-container');
    const trayShips = document.querySelectorAll('.tray-ship');
    const placementGridEl = document.getElementById('placement-grid');
    const difficultyIndicator = document.getElementById('difficulty-indicator');
    
    // Reset game state
    gameState = {
        playerBoard: createEmptyBoard(),
        aiBoard: createEmptyBoard(),
        playerShips: [],
        aiShips: [],
        gameActive: false,
        playerTurn: true,
        placementPhase: true,
        currentOrientation: 'horizontal',
        placedShips: new Set(),
        difficulty: gameState.difficulty, // Preserve difficulty selection
        aiTargetMode: false,
        aiLastHit: null,
        aiTargetQueue: [],
        aiHitSequence: [],
        playerShotsTaken: 0,
        playerHits: 0,
        aiShotsTaken: 0,
        aiHits: 0
    };

    // Place AI ships based on difficulty
    if (gameState.difficulty === 'hard') {
        gameState.aiShips = placeAllShipsHardMode(gameState.aiBoard);
    } else {
        gameState.aiShips = placeAllShips(gameState.aiBoard);
    }

    // Hide home screen, show game screen
    homeScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // Show placement phase, hide game container
    placementPhaseEl.style.display = 'block';
    gameContainerEl.style.display = 'none';
    
    // Show difficulty indicator
    const difficultyNames = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard'
    };
    difficultyIndicator.textContent = `Difficulty: ${difficultyNames[gameState.difficulty]}`;
    difficultyIndicator.style.display = 'block';

    // Reset tray ships and orientation visuals
    trayShips.forEach(ship => {
        ship.classList.remove('placed');
        ship.draggable = true;
        
        // Reset visual orientation to match initial state (horizontal)
        const visual = ship.querySelector('.ship-visual');
        visual.classList.remove('vertical');
    });

    // Render empty placement grid
    renderGrid(placementGridEl, gameState.playerBoard, true, true);

    // Update status with orientation info
    updateStatus('Place your ships on the grid. Click placed ships to remove them. Orientation: horizontal. Press R or click Rotate to change.');

    // Setup drag and drop
    setupShipTrayDrag();
    attachGridDropListeners();
}

function startGameplay() {
    // Get DOM elements
    const placementPhaseEl = document.getElementById('placement-phase');
    const gameContainerEl = document.querySelector('.game-container');
    const playerGridEl = document.getElementById('player-grid');
    const aiGridEl = document.getElementById('ai-grid');
    const playerShipsListEl = document.getElementById('player-ships-list');
    const aiShipsListEl = document.getElementById('ai-ships-list');
    
    gameState.placementPhase = false;
    gameState.gameActive = true;

    // Hide placement phase, show game container
    placementPhaseEl.style.display = 'none';
    gameContainerEl.style.display = 'flex';

    // Render both grids
    renderGrid(playerGridEl, gameState.playerBoard, true);
    renderGrid(aiGridEl, gameState.aiBoard, false);

    // Update ship lists
    updateShipsList(playerShipsListEl, gameState.playerShips);
    updateShipsList(aiShipsListEl, gameState.aiShips);

    // Update status
    updateStatus('Your turn! Click on the enemy grid to fire.');
}

function toggleOrientation() {
    // Get DOM elements
    const trayShips = document.querySelectorAll('.tray-ship');
    
    gameState.currentOrientation = gameState.currentOrientation === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Update visual orientation of ships in tray
    trayShips.forEach(ship => {
        const visual = ship.querySelector('.ship-visual');
        if (gameState.currentOrientation === 'vertical') {
            visual.classList.add('vertical');
        } else {
            visual.classList.remove('vertical');
        }
    });
    
    updateStatus(`Orientation: ${gameState.currentOrientation}. Drag ships to place them.`);
}

let draggedShip = null;
let previewCells = [];
let previewShipOverlay = null;

function getShipSVG(shipName, size, horizontal, isForTray = false) {
    const cellSize = 40;
    const width = horizontal ? size * (cellSize + 2) - 2 : cellSize;
    const height = horizontal ? cellSize : size * (cellSize + 2) - 2;
    
    // Check current theme
    const currentTheme = document.body.className.match(/theme-(\w+)/)?.[1] || 'original';
    const isPirateTheme = currentTheme === 'pirate';
    const isSpaceTheme = currentTheme === 'space';
    
    let svgContent = '';
    
    if (isSpaceTheme) {
        // Space-themed ship visuals matching home screen spacecraft style
        if (shipName === 'Carrier') {
            // Star Carrier - large capital ship (5 cells)
            if (horizontal) {
                svgContent = `
                    <ellipse cx="${width/2}" cy="20" rx="${width/2-4}" ry="8" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="14" rx="${width/4}" ry="6" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="13" rx="${width/5}" ry="4" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="${width/2-15}" cy="13" rx="2" ry="1.5" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="${width/2}" cy="13" rx="2" ry="1.5" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="${width/2+15}" cy="13" rx="2" ry="1.5" fill="#667eea" opacity="0.8"/>
                    <rect x="${cellSize*0.5}" y="21" width="8" height="5" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${cellSize*0.5+4}" cy="24" rx="3" ry="2" fill="#667eea" opacity="0.6"/>
                    <rect x="${width-cellSize*0.5-8}" y="21" width="8" height="5" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${width-cellSize*0.5-4}" cy="24" rx="3" ry="2" fill="#667eea" opacity="0.6"/>
                    <line x1="${cellSize*1}" y1="20" x2="${cellSize*4}" y2="20" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="${cellSize*1.5}" cy="18" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="${cellSize*2.5}" cy="18" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="${cellSize*3.5}" cy="18" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <path d="M ${width-4},20 Q ${width},20 ${width+1},22 Q ${width},24 ${width-4},24 Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <ellipse cx="20" cy="${height/2}" rx="8" ry="${height/2-4}" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="14" cy="${height/2}" rx="6" ry="${height/4}" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="13" cy="${height/2}" rx="4" ry="${height/5}" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="13" cy="${height/2-15}" rx="1.5" ry="2" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="13" cy="${height/2}" rx="1.5" ry="2" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="13" cy="${height/2+15}" rx="1.5" ry="2" fill="#667eea" opacity="0.8"/>
                    <rect x="21" y="${cellSize*0.5}" width="5" height="8" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="24" cy="${cellSize*0.5+4}" rx="2" ry="3" fill="#667eea" opacity="0.6"/>
                    <rect x="21" y="${height-cellSize*0.5-8}" width="5" height="8" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="24" cy="${height-cellSize*0.5-4}" rx="2" ry="3" fill="#667eea" opacity="0.6"/>
                    <line x1="20" y1="${cellSize*1}" x2="20" y2="${cellSize*4}" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="18" cy="${cellSize*1.5}" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="18" cy="${cellSize*2.5}" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="18" cy="${cellSize*3.5}" r="0.8" fill="#a78bfa" opacity="0.8"/>
                    <path d="M 20,${height-4} Q 20,${height} 22,${height+1} Q 24,${height} 24,${height-4} Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Battleship') {
            // Battlecruiser - heavy combat ship (4 cells)
            if (horizontal) {
                svgContent = `
                    <ellipse cx="${width/2}" cy="20" rx="${width/2-4}" ry="7" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="15" rx="${width/4}" ry="5" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="14" rx="${width/5}" ry="3.5" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="${width/2-10}" cy="14" rx="1.5" ry="1" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="${width/2+10}" cy="14" rx="1.5" ry="1" fill="#667eea" opacity="0.8"/>
                    <rect x="${cellSize*0.6}" y="21" width="7" height="4" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${cellSize*0.6+3.5}" cy="23.5" rx="2.5" ry="1.5" fill="#667eea" opacity="0.6"/>
                    <rect x="${width-cellSize*0.6-7}" y="21" width="7" height="4" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${width-cellSize*0.6-3.5}" cy="23.5" rx="2.5" ry="1.5" fill="#667eea" opacity="0.6"/>
                    <line x1="${cellSize*1}" y1="20" x2="${cellSize*3}" y2="20" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="${cellSize*1.5}" cy="18" r="0.7" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="${cellSize*2.5}" cy="18" r="0.7" fill="#a78bfa" opacity="0.8"/>
                    <path d="M ${width-4},20 Q ${width},20 ${width+1},22 Q ${width},24 ${width-4},24 Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <ellipse cx="20" cy="${height/2}" rx="7" ry="${height/2-4}" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="15" cy="${height/2}" rx="5" ry="${height/4}" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="14" cy="${height/2}" rx="3.5" ry="${height/5}" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="14" cy="${height/2-10}" rx="1" ry="1.5" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="14" cy="${height/2+10}" rx="1" ry="1.5" fill="#667eea" opacity="0.8"/>
                    <rect x="21" y="${cellSize*0.6}" width="4" height="7" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="23.5" cy="${cellSize*0.6+3.5}" rx="1.5" ry="2.5" fill="#667eea" opacity="0.6"/>
                    <rect x="21" y="${height-cellSize*0.6-7}" width="4" height="7" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="23.5" cy="${height-cellSize*0.6-3.5}" rx="1.5" ry="2.5" fill="#667eea" opacity="0.6"/>
                    <line x1="20" y1="${cellSize*1}" x2="20" y2="${cellSize*3}" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="18" cy="${cellSize*1.5}" r="0.7" fill="#a78bfa" opacity="0.8"/>
                    <circle cx="18" cy="${cellSize*2.5}" r="0.7" fill="#a78bfa" opacity="0.8"/>
                    <path d="M 20,${height-4} Q 20,${height} 22,${height+1} Q 24,${height} 24,${height-4} Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Cruiser') {
            // Interceptor - sleek fighter (3 cells)
            if (horizontal) {
                svgContent = `
                    <ellipse cx="${width/2}" cy="20" rx="${width/2-3}" ry="6" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="16" rx="${width/4}" ry="4" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="15" rx="${width/5}" ry="3" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="${width/2-8}" cy="15" rx="1.2" ry="0.8" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="${width/2+8}" cy="15" rx="1.2" ry="0.8" fill="#667eea" opacity="0.8"/>
                    <path d="M ${cellSize*0.3},20 Q ${cellSize*0.2},18 ${cellSize*0.1},20 L ${cellSize*0.2},23 Q ${cellSize*0.25},21 ${cellSize*0.3},23 Z" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <path d="M ${width-cellSize*0.3},20 Q ${width-cellSize*0.2},18 ${width-cellSize*0.1},20 L ${width-cellSize*0.2},23 Q ${width-cellSize*0.25},21 ${width-cellSize*0.3},23 Z" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <rect x="${cellSize*0.7}" y="21" width="6" height="3" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${cellSize*0.7+3}" cy="23" rx="2" ry="1" fill="#667eea" opacity="0.6"/>
                    <rect x="${width-cellSize*0.7-6}" y="21" width="6" height="3" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${width-cellSize*0.7-3}" cy="23" rx="2" ry="1" fill="#667eea" opacity="0.6"/>
                    <line x1="${cellSize*0.8}" y1="20" x2="${cellSize*2.2}" y2="20" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="${cellSize*1.5}" cy="18" r="0.6" fill="#a78bfa" opacity="0.8"/>
                    <path d="M ${width-3},20 Q ${width},20 ${width+1},22 Q ${width},24 ${width-3},24 Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <ellipse cx="20" cy="${height/2}" rx="6" ry="${height/2-3}" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="16" cy="${height/2}" rx="4" ry="${height/4}" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="15" cy="${height/2}" rx="3" ry="${height/5}" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="15" cy="${height/2-8}" rx="0.8" ry="1.2" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="15" cy="${height/2+8}" rx="0.8" ry="1.2" fill="#667eea" opacity="0.8"/>
                    <path d="M 20,${cellSize*0.3} Q 18,${cellSize*0.2} 20,${cellSize*0.1} L 23,${cellSize*0.2} Q 21,${cellSize*0.25} 23,${cellSize*0.3} Z" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <path d="M 20,${height-cellSize*0.3} Q 18,${height-cellSize*0.2} 20,${height-cellSize*0.1} L 23,${height-cellSize*0.2} Q 21,${height-cellSize*0.25} 23,${height-cellSize*0.3} Z" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <rect x="21" y="${cellSize*0.7}" width="3" height="6" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="23" cy="${cellSize*0.7+3}" rx="1" ry="2" fill="#667eea" opacity="0.6"/>
                    <rect x="21" y="${height-cellSize*0.7-6}" width="3" height="6" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="23" cy="${height-cellSize*0.7-3}" rx="1" ry="2" fill="#667eea" opacity="0.6"/>
                    <line x1="20" y1="${cellSize*0.8}" x2="20" y2="${cellSize*2.2}" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="18" cy="${cellSize*1.5}" r="0.6" fill="#a78bfa" opacity="0.8"/>
                    <path d="M 20,${height-3} Q 20,${height} 22,${height+1} Q 24,${height} 24,${height-3} Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Submarine') {
            // Stealth Frigate - stealthy design (3 cells)
            if (horizontal) {
                svgContent = `
                    <ellipse cx="${width/2}" cy="20" rx="${width/2-3}" ry="6" fill="#2d3748" stroke="#1a202c" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="16" rx="${width/4}" ry="4" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="15" rx="${width/5}" ry="3" fill="#5a67d8" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="${width/2-8}" cy="15" rx="1.2" ry="0.8" fill="#667eea" opacity="0.7"/>
                    <ellipse cx="${width/2+8}" cy="15" rx="1.2" ry="0.8" fill="#667eea" opacity="0.7"/>
                    <rect x="${cellSize*0.7}" y="21" width="6" height="3" rx="1" fill="#2d3748" stroke="#1a202c" stroke-width="0.5"/>
                    <ellipse cx="${cellSize*0.7+3}" cy="23" rx="2" ry="1" fill="#667eea" opacity="0.5"/>
                    <rect x="${width-cellSize*0.7-6}" y="21" width="6" height="3" rx="1" fill="#2d3748" stroke="#1a202c" stroke-width="0.5"/>
                    <ellipse cx="${width-cellSize*0.7-3}" cy="23" rx="2" ry="1" fill="#667eea" opacity="0.5"/>
                    <line x1="${cellSize*0.8}" y1="20" x2="${cellSize*2.2}" y2="20" stroke="#4a5568" stroke-width="0.5" opacity="0.4"/>
                    <circle cx="${cellSize*1.5}" cy="18" r="0.6" fill="#a78bfa" opacity="0.7"/>
                    <path d="M ${width-3},20 Q ${width},20 ${width+1},22 Q ${width},24 ${width-3},24 Z" fill="#667eea" opacity="0.7" stroke="#1a202c" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <ellipse cx="20" cy="${height/2}" rx="6" ry="${height/2-3}" fill="#2d3748" stroke="#1a202c" stroke-width="1"/>
                    <ellipse cx="16" cy="${height/2}" rx="4" ry="${height/4}" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="15" cy="${height/2}" rx="3" ry="${height/5}" fill="#5a67d8" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="15" cy="${height/2-8}" rx="0.8" ry="1.2" fill="#667eea" opacity="0.7"/>
                    <ellipse cx="15" cy="${height/2+8}" rx="0.8" ry="1.2" fill="#667eea" opacity="0.7"/>
                    <rect x="21" y="${cellSize*0.7}" width="3" height="6" rx="1" fill="#2d3748" stroke="#1a202c" stroke-width="0.5"/>
                    <ellipse cx="23" cy="${cellSize*0.7+3}" rx="1" ry="2" fill="#667eea" opacity="0.5"/>
                    <rect x="21" y="${height-cellSize*0.7-6}" width="3" height="6" rx="1" fill="#2d3748" stroke="#1a202c" stroke-width="0.5"/>
                    <ellipse cx="23" cy="${height-cellSize*0.7-3}" rx="1" ry="2" fill="#667eea" opacity="0.5"/>
                    <line x1="20" y1="${cellSize*0.8}" x2="20" y2="${cellSize*2.2}" stroke="#4a5568" stroke-width="0.5" opacity="0.4"/>
                    <circle cx="18" cy="${cellSize*1.5}" r="0.6" fill="#a78bfa" opacity="0.7"/>
                    <path d="M 20,${height-3} Q 20,${height} 22,${height+1} Q 24,${height} 24,${height-3} Z" fill="#667eea" opacity="0.7" stroke="#1a202c" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Destroyer') {
            // Scout Skiff - small nimble craft (2 cells)
            if (horizontal) {
                svgContent = `
                    <ellipse cx="${width/2}" cy="20" rx="${width/2-2}" ry="5" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="17" rx="${width/4}" ry="3.5" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="${width/2}" cy="16" rx="${width/5}" ry="2.5" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="${width/2-5}" cy="16" rx="1" ry="0.7" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="${width/2+5}" cy="16" rx="1" ry="0.7" fill="#667eea" opacity="0.8"/>
                    <rect x="${cellSize*0.8}" y="21" width="5" height="3" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="${cellSize*0.8+2.5}" cy="23" rx="1.5" ry="1" fill="#667eea" opacity="0.6"/>
                    <line x1="${cellSize*0.5}" y1="20" x2="${cellSize*1.5}" y2="20" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="${cellSize*1}" cy="18" r="0.5" fill="#a78bfa" opacity="0.8"/>
                    <path d="M ${width-3},20 Q ${width},20 ${width+1},22 Q ${width},24 ${width-3},24 Z" fill="#667eea" opacity="0.8" stroke="#2d3748" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <ellipse cx="20" cy="${height/2}" rx="5" ry="${height/2-2}" fill="#4a5568" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="17" cy="${height/2}" rx="3.5" ry="${height/4}" fill="#5a67d8" stroke="#2d3748" stroke-width="1"/>
                    <ellipse cx="16" cy="${height/2}" rx="2.5" ry="${height/5}" fill="#667eea" opacity="0.6" stroke="#4a5568" stroke-width="0.5"/>
                    <ellipse cx="16" cy="${height/2-5}" rx="0.7" ry="1" fill="#667eea" opacity="0.8"/>
                    <ellipse cx="16" cy="${height/2+5}" rx="0.7" ry="1" fill="#667eea" opacity="0.8"/>
                    <rect x="21" y="${cellSize*0.8}" width="3" height="5" rx="1" fill="#4a5568" stroke="#2d3748" stroke-width="0.5"/>
                    <ellipse cx="23" cy="${cellSize*0.8+2.5}" rx="1" ry="1.5" fill="#667eea" opacity="0.6"/>
                    <line x1="20" y1="${cellSize*0.5}" x2="20" y2="${cellSize*1.5}" stroke="#4a5568" stroke-width="0.5" opacity="0.5"/>
                    <circle cx="18" cy="${cellSize*1}" r="0.5" fill="#a78bfa" opacity="0.8"/>
                    <path d="M 20,${height-3} Q 20,${height} 22,${height+1} Q 24,${height} 24,${height-3} Z" fill="#667eea" opacity="0.7" stroke="#2d3748" stroke-width="0.5"/>
                `;
            }
        }
    } else if (isPirateTheme) {
        // Pirate-themed ship visuals
        if (shipName === 'Carrier') {
            // Galleon - 3 masts
            if (horizontal) {
                svgContent = `
                    <path d="M 2,18 L 6,14 L ${width-6},14 L ${width-2},18 L ${width-2},26 L 2,26 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="${cellSize*0.6}" y="4" width="2" height="12" fill="#5d4037"/>
                    <path d="M ${cellSize*0.6+1},5 L ${cellSize*0.6+8},8 L ${cellSize*0.6+8},14 L ${cellSize*0.6+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="${cellSize*2.2}" y="2" width="2" height="14" fill="#5d4037"/>
                    <path d="M ${cellSize*2.2+1},3 L ${cellSize*2.2+10},7 L ${cellSize*2.2+10},14 L ${cellSize*2.2+1},11 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="${cellSize*3.8}" y="4" width="2" height="12" fill="#5d4037"/>
                    <path d="M ${cellSize*3.8+1},5 L ${cellSize*3.8+8},8 L ${cellSize*3.8+8},14 L ${cellSize*3.8+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <path d="M 18,2 L 14,6 L 14,${height-6} L 18,${height-2} L 26,${height-2} L 26,2 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="4" y="${cellSize*0.6}" width="12" height="2" fill="#5d4037"/>
                    <path d="M 5,${cellSize*0.6+1} L 8,${cellSize*0.6+8} L 14,${cellSize*0.6+8} L 12,${cellSize*0.6+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="2" y="${cellSize*2.2}" width="14" height="2" fill="#5d4037"/>
                    <path d="M 3,${cellSize*2.2+1} L 7,${cellSize*2.2+10} L 14,${cellSize*2.2+10} L 11,${cellSize*2.2+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="4" y="${cellSize*3.8}" width="12" height="2" fill="#5d4037"/>
                    <path d="M 5,${cellSize*3.8+1} L 8,${cellSize*3.8+8} L 14,${cellSize*3.8+8} L 12,${cellSize*3.8+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Battleship') {
            // Frigate - 2 masts
            if (horizontal) {
                svgContent = `
                    <path d="M 2,18 L 6,14 L ${width-6},14 L ${width-2},18 L ${width-2},26 L 2,26 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="${cellSize*0.8}" y="4" width="2" height="12" fill="#5d4037"/>
                    <path d="M ${cellSize*0.8+1},5 L ${cellSize*0.8+10},9 L ${cellSize*0.8+10},14 L ${cellSize*0.8+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="${cellSize*2.8}" y="4" width="2" height="12" fill="#5d4037"/>
                    <path d="M ${cellSize*2.8+1},5 L ${cellSize*2.8+10},9 L ${cellSize*2.8+10},14 L ${cellSize*2.8+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <path d="M 18,2 L 14,6 L 14,${height-6} L 18,${height-2} L 26,${height-2} L 26,2 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="4" y="${cellSize*0.8}" width="12" height="2" fill="#5d4037"/>
                    <path d="M 5,${cellSize*0.8+1} L 9,${cellSize*0.8+10} L 14,${cellSize*0.8+10} L 12,${cellSize*0.8+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="4" y="${cellSize*2.8}" width="12" height="2" fill="#5d4037"/>
                    <path d="M 5,${cellSize*2.8+1} L 9,${cellSize*2.8+10} L 14,${cellSize*2.8+10} L 12,${cellSize*2.8+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Cruiser') {
            // Brigantine - 2 masts
            if (horizontal) {
                svgContent = `
                    <path d="M 2,18 L 6,14 L ${width-6},14 L ${width-2},18 L ${width-2},26 L 2,26 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="${cellSize*0.7}" y="5" width="2" height="11" fill="#5d4037"/>
                    <path d="M ${cellSize*0.7+1},6 L ${cellSize*0.7+7},9 L ${cellSize*0.7+7},14 L ${cellSize*0.7+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="${cellSize*1.9}" y="5" width="2" height="11" fill="#5d4037"/>
                    <path d="M ${cellSize*1.9+1},6 L ${cellSize*1.9+7},9 L ${cellSize*1.9+7},14 L ${cellSize*1.9+1},12 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <path d="M 18,2 L 14,6 L 14,${height-6} L 18,${height-2} L 26,${height-2} L 26,2 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="5" y="${cellSize*0.7}" width="11" height="2" fill="#5d4037"/>
                    <path d="M 6,${cellSize*0.7+1} L 9,${cellSize*0.7+7} L 14,${cellSize*0.7+7} L 12,${cellSize*0.7+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="5" y="${cellSize*1.9}" width="11" height="2" fill="#5d4037"/>
                    <path d="M 6,${cellSize*1.9+1} L 9,${cellSize*1.9+7} L 14,${cellSize*1.9+7} L 12,${cellSize*1.9+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Submarine') {
            // Ketch - 2 masts, different config
            if (horizontal) {
                svgContent = `
                    <path d="M 2,18 L 6,14 L ${width-6},14 L ${width-2},18 L ${width-2},26 L 2,26 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="${cellSize*0.6}" y="6" width="2" height="10" fill="#5d4037"/>
                    <path d="M ${cellSize*0.6+1},7 L ${cellSize*0.6+6},9 L ${cellSize*0.6+6},14 L ${cellSize*0.6+1},13 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="${cellSize*2}" y="8" width="2" height="8" fill="#5d4037"/>
                    <path d="M ${cellSize*2+1},9 L ${cellSize*2+5},11 L ${cellSize*2+5},14 L ${cellSize*2+1},13 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <path d="M 18,2 L 14,6 L 14,${height-6} L 18,${height-2} L 26,${height-2} L 26,2 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="6" y="${cellSize*0.6}" width="10" height="2" fill="#5d4037"/>
                    <path d="M 7,${cellSize*0.6+1} L 9,${cellSize*0.6+6} L 14,${cellSize*0.6+6} L 13,${cellSize*0.6+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                    <rect x="8" y="${cellSize*2}" width="8" height="2" fill="#5d4037"/>
                    <path d="M 9,${cellSize*2+1} L 11,${cellSize*2+5} L 14,${cellSize*2+5} L 13,${cellSize*2+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            }
        } else if (shipName === 'Destroyer') {
            // Sloop - 1 mast
            if (horizontal) {
                svgContent = `
                    <path d="M 2,18 L 6,14 L ${width-6},14 L ${width-2},18 L ${width-2},26 L 2,26 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="${cellSize*0.85}" y="6" width="2" height="10" fill="#5d4037"/>
                    <path d="M ${cellSize*0.85+1},7 L ${cellSize*0.85+8},10 L ${cellSize*0.85+8},14 L ${cellSize*0.85+1},13 Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            } else {
                svgContent = `
                    <path d="M 18,2 L 14,6 L 14,${height-6} L 18,${height-2} L 26,${height-2} L 26,2 Z" fill="#8b4513" stroke="#5d4037" stroke-width="1"/>
                    <rect x="6" y="${cellSize*0.85}" width="10" height="2" fill="#5d4037"/>
                    <path d="M 7,${cellSize*0.85+1} L 10,${cellSize*0.85+8} L 14,${cellSize*0.85+8} L 13,${cellSize*0.85+1} Z" fill="#f5deb3" stroke="#8b7355" stroke-width="0.5"/>
                `;
            }
        }
    } else {
        // Default battleship visuals for Original and Space themes
        if (shipName === 'Carrier') {
            if (horizontal) {
            svgContent = `
                <rect x="0" y="12" width="${width}" height="16" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="${width-8},12 ${width},18 ${width},22 ${width-8},28" fill="#1a252f"/>
                <rect x="${cellSize*0.2}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*0.25}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*0.35}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*2}" y="6" width="${cellSize*0.5}" height="14" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*2.1}" y="3" width="${cellSize*0.3}" height="6" fill="#2c3e50"/>
                <rect x="${cellSize*3}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*3.05}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*3.15}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*4}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*4.05}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*4.15}" y="5" width="3" height="8" fill="#2c3e50"/>
            `;
        } else {
            svgContent = `
                <rect x="12" y="0" width="16" height="${height}" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="12,${height-8} 18,${height} 22,${height} 28,${height-8}" fill="#1a252f"/>
                <rect x="8" y="${cellSize*0.2}" width="10" height="${cellSize*0.3}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="5" y="${cellSize*0.25}" width="8" height="3" fill="#2c3e50"/>
                <rect x="5" y="${cellSize*0.35}" width="8" height="3" fill="#2c3e50"/>
                <rect x="6" y="${cellSize*2}" width="14" height="${cellSize*0.5}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="3" y="${cellSize*2.1}" width="6" height="${cellSize*0.3}" fill="#2c3e50"/>
            `;
        }
    } else if (shipName === 'Battleship') {
        if (horizontal) {
            svgContent = `
                <rect x="0" y="12" width="${width}" height="16" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="${width-8},12 ${width},18 ${width},22 ${width-8},28" fill="#1a252f"/>
                <rect x="${cellSize*0.3}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*0.35}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*0.45}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*1.75}" y="6" width="${cellSize*0.5}" height="14" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*1.85}" y="3" width="${cellSize*0.3}" height="6" fill="#2c3e50"/>
                <rect x="${cellSize*3}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*3.05}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*3.15}" y="5" width="3" height="8" fill="#2c3e50"/>
            `;
        } else {
            svgContent = `
                <rect x="12" y="0" width="16" height="${height}" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="12,${height-8} 18,${height} 22,${height} 28,${height-8}" fill="#1a252f"/>
                <rect x="8" y="${cellSize*0.3}" width="10" height="${cellSize*0.3}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="5" y="${cellSize*0.35}" width="8" height="3" fill="#2c3e50"/>
                <rect x="5" y="${cellSize*0.45}" width="8" height="3" fill="#2c3e50"/>
                <rect x="6" y="${cellSize*1.75}" width="14" height="${cellSize*0.5}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
            `;
        }
    } else if (shipName === 'Cruiser') {
        if (horizontal) {
            svgContent = `
                <rect x="0" y="12" width="${width}" height="16" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="${width-8},12 ${width},18 ${width},22 ${width-8},28" fill="#1a252f"/>
                <rect x="${cellSize*0.4}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*0.45}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*0.55}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*1.4}" y="6" width="${cellSize*0.45}" height="14" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*1.5}" y="3" width="${cellSize*0.25}" height="6" fill="#2c3e50"/>
            `;
        } else {
            svgContent = `
                <rect x="12" y="0" width="16" height="${height}" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="12,${height-8} 18,${height} 22,${height} 28,${height-8}" fill="#1a252f"/>
                <rect x="8" y="${cellSize*0.4}" width="10" height="${cellSize*0.3}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="5" y="${cellSize*0.45}" width="8" height="3" fill="#2c3e50"/>
                <rect x="6" y="${cellSize*1.4}" width="14" height="${cellSize*0.45}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
            `;
        }
    } else if (shipName === 'Submarine') {
        if (horizontal) {
            svgContent = `
                <ellipse cx="${width/2}" cy="20" rx="${width/2-2}" ry="10" fill="#34495e" stroke="#1a252f" stroke-width="1"/>
                <rect x="${width/2-8}" y="12" width="16" height="10" fill="#2c3e50" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${width/2-4}" y="8" width="8" height="6" fill="#2c3e50" stroke="#1a252f" stroke-width="0.5"/>
                <circle cx="${width/2}" cy="7" r="3" fill="#e74c3c"/>
                <ellipse cx="${width-10}" cy="20" rx="8" ry="7" fill="#1a252f"/>
            `;
        } else {
            svgContent = `
                <ellipse cx="20" cy="${height/2}" rx="10" ry="${height/2-2}" fill="#34495e" stroke="#1a252f" stroke-width="1"/>
                <rect x="12" y="${height/2-8}" width="10" height="16" fill="#2c3e50" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="8" y="${height/2-4}" width="6" height="8" fill="#2c3e50" stroke="#1a252f" stroke-width="0.5"/>
                <circle cx="7" cy="${height/2}" r="3" fill="#e74c3c"/>
                <ellipse cx="20" cy="${height-10}" rx="7" ry="8" fill="#1a252f"/>
            `;
        }
    } else if (shipName === 'Destroyer') {
        if (horizontal) {
            svgContent = `
                <rect x="0" y="12" width="${width}" height="16" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="${width-8},12 ${width},18 ${width},22 ${width-8},28" fill="#1a252f"/>
                <rect x="${cellSize*0.6}" y="8" width="${cellSize*0.3}" height="10" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*0.65}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*0.75}" y="5" width="3" height="8" fill="#2c3e50"/>
                <rect x="${cellSize*0.85}" y="6" width="${cellSize*0.4}" height="14" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="${cellSize*0.95}" y="3" width="${cellSize*0.2}" height="6" fill="#2c3e50"/>
            `;
        } else {
            svgContent = `
                <rect x="12" y="0" width="16" height="${height}" fill="#2c3e50" stroke="#1a252f" stroke-width="1"/>
                <polygon points="12,${height-8} 18,${height} 22,${height} 28,${height-8}" fill="#1a252f"/>
                <rect x="8" y="${cellSize*0.6}" width="10" height="${cellSize*0.3}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
                <rect x="5" y="${cellSize*0.65}" width="8" height="3" fill="#2c3e50"/>
                <rect x="6" y="${cellSize*0.85}" width="14" height="${cellSize*0.4}" fill="#34495e" stroke="#1a252f" stroke-width="0.5"/>
            `;
        }
        }
    }
    
    // Only use absolute positioning for grid ships, not tray ships
    const positionStyle = isForTray ? '' : 'position: absolute; ';
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="${positionStyle}pointer-events: none;">${svgContent}</svg>`;
}

function setupShipTrayDrag() {
    // Drag start - only setup once for ship tray
    trayShips.forEach(ship => {
        ship.addEventListener('dragstart', (e) => {
            if (ship.classList.contains('placed')) {
                e.preventDefault();
                return;
            }
            draggedShip = {
                name: ship.dataset.ship,
                size: parseInt(ship.dataset.size),
                element: ship
            };
            ship.classList.add('dragging');
        });

        ship.addEventListener('dragend', () => {
            ship.classList.remove('dragging');
            clearPreview();
        });
    });
}

function attachGridDropListeners() {
    // Grid cell drag over and drop - re-attach after each render
    const cells = placementGridEl.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedShip) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            showPreview(row, col);
        });

        cell.addEventListener('dragleave', (e) => {
            // Only clear if leaving the grid entirely
            if (!placementGridEl.contains(e.relatedTarget)) {
                clearPreview();
            }
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedShip) return;

            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const horizontal = gameState.currentOrientation === 'horizontal';

            if (canPlaceShip(gameState.playerBoard, row, col, draggedShip.size, horizontal)) {
                placePlayerShip(row, col, draggedShip.name, draggedShip.size, horizontal);
                draggedShip.element.classList.add('placed');
                draggedShip.element.draggable = false;
                gameState.placedShips.add(draggedShip.name);

                updateStatus(`${getShipDisplayName(draggedShip.name)} placed! ${5 - gameState.placedShips.size} ships remaining. Click placed ships to move them.`);
                
                // Re-attach listeners after placing (already done in placePlayerShip)

                // Check if all ships placed
                if (gameState.placedShips.size === 5) {
                    setTimeout(() => {
                        updateStatus('All ships placed!');
                        placementConfirmationModal.style.display = 'flex';
                    }, 500);
                }
            } else {
                updateStatus(`Invalid placement for ${getShipDisplayName(draggedShip.name)}! Try another location.`);
            }

            clearPreview();
            draggedShip = null;
        });
    });
}

function showPreview(row, col) {
    clearPreview();
    if (!draggedShip) return;

    const horizontal = gameState.currentOrientation === 'horizontal';
    const size = draggedShip.size;
    const isValid = canPlaceShip(gameState.playerBoard, row, col, size, horizontal);

    previewCells = [];
    for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            const cell = placementGridEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
                previewCells.push(cell);
            }
        }
    }
    
    // Add ship-shaped overlay
    if (previewCells.length > 0) {
        const firstCell = previewCells[0];
        const rect = firstCell.getBoundingClientRect();
        const gridRect = placementGridEl.getBoundingClientRect();
        
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.left = (rect.left - gridRect.left) + 'px';
        overlay.style.top = (rect.top - gridRect.top) + 'px';
        overlay.style.opacity = '0.7';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        overlay.innerHTML = getShipSVG(draggedShip.name, size, horizontal);
        
        placementGridEl.style.position = 'relative';
        placementGridEl.appendChild(overlay);
        previewShipOverlay = overlay;
    }
}

function clearPreview() {
    previewCells.forEach(cell => {
        cell.classList.remove('preview-valid', 'preview-invalid');
    });
    previewCells = [];
    
    if (previewShipOverlay) {
        previewShipOverlay.remove();
        previewShipOverlay = null;
    }
}

function placePlayerShip(row, col, name, size, horizontal) {
    const ship = {
        name: name,
        size: size,
        hits: 0,
        sunk: false,
        positions: [],
        row: row,
        col: col,
        horizontal: horizontal
    };

    for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        gameState.playerBoard[r][c].ship = ship;
        ship.positions.push({ row: r, col: c });
    }

    gameState.playerShips.push(ship);
    renderGrid(placementGridEl, gameState.playerBoard, true, true);
    attachGridDropListeners();
    attachPlacedShipClickListeners();
}

function attachPlacedShipClickListeners() {
    if (!gameState.placementPhase) return;
    
    const cells = placementGridEl.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellData = gameState.playerBoard[row][col];
        
        if (cellData.ship) {
            cell.style.cursor = 'pointer';
            cell.title = `Click to remove ${cellData.ship.name}`;
            
            // Add click listener without cloning (preserve drop listeners)
            cell.addEventListener('click', (e) => {
                // Prevent if dragging
                if (draggedShip) return;
                
                if (gameState.placementPhase && cellData.ship) {
                    removeShip(cellData.ship);
                }
            }, { once: true }); // Use once: true to auto-remove after click
        } else {
            cell.style.cursor = 'default';
            cell.title = '';
        }
    });
}

function removeShip(ship) {
    // Remove ship from board
    ship.positions.forEach(pos => {
        gameState.playerBoard[pos.row][pos.col].ship = null;
    });
    
    // Remove ship from playerShips array
    const shipIndex = gameState.playerShips.findIndex(s => s.name === ship.name);
    if (shipIndex !== -1) {
        gameState.playerShips.splice(shipIndex, 1);
    }
    
    // Remove from placedShips set
    gameState.placedShips.delete(ship.name);
    
    // Re-enable ship in tray
    trayShips.forEach(trayShip => {
        if (trayShip.dataset.ship === ship.name) {
            trayShip.classList.remove('placed');
            trayShip.draggable = true;
        }
    });
    
    // Re-render grid
    renderGrid(placementGridEl, gameState.playerBoard, true, true);
    attachGridDropListeners();
    attachPlacedShipClickListeners();
    
    // Update status
    updateStatus(`${getShipDisplayName(ship.name)} removed. ${5 - gameState.placedShips.size} ships remaining to place.`);
    
    // Hide confirmation modal if it was showing
    placementConfirmationModal.style.display = 'none';
}

function resetPlacement() {
    // Get DOM elements
    const trayShips = document.querySelectorAll('.tray-ship');
    const placementConfirmationModal = document.getElementById('placement-confirmation-modal');
    const placementGridEl = document.getElementById('placement-grid');
    
    // Clear all placed ships from the player board
    gameState.playerBoard = createEmptyBoard();
    gameState.playerShips = [];
    gameState.placedShips.clear();
    
    // Restore all tray ships to unplaced state
    trayShips.forEach(ship => {
        ship.classList.remove('placed');
        ship.draggable = true;
        const visual = ship.querySelector('.ship-visual');
        visual.classList.remove('vertical');
    });
    
    // Reset orientation to default
    gameState.currentOrientation = 'horizontal';
    
    // Clear any preview highlights
    clearPreview();
    
    // Hide confirmation modal if showing
    placementConfirmationModal.style.display = 'none';
    
    // Re-render the placement grid (empty)
    renderGrid(placementGridEl, gameState.playerBoard, true, true);
    
    // Re-attach drop listeners
    attachGridDropListeners();
    
    // Update status
    updateStatus('Place your ships on the grid. Drag from the tray or click Random.');
}

function randomPlaceAllPlayerShips() {
    // Clear any existing placements
    gameState.playerShips.forEach(ship => {
        ship.positions.forEach(pos => {
            gameState.playerBoard[pos.row][pos.col].ship = null;
        });
    });
    gameState.playerShips = [];
    gameState.placedShips.clear();
    
    // Place all ships randomly
    for (const shipTemplate of SHIPS) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            const horizontal = Math.random() < 0.5;

            if (canPlaceShip(gameState.playerBoard, row, col, shipTemplate.size, horizontal)) {
                const ship = {
                    name: shipTemplate.name,
                    size: shipTemplate.size,
                    hits: 0,
                    sunk: false,
                    positions: [],
                    row: row,
                    col: col,
                    horizontal: horizontal
                };

                // Place ship on board
                for (let i = 0; i < shipTemplate.size; i++) {
                    const r = horizontal ? row : row + i;
                    const c = horizontal ? col + i : col;
                    gameState.playerBoard[r][c].ship = ship;
                    ship.positions.push({ row: r, col: c });
                }

                gameState.playerShips.push(ship);
                gameState.placedShips.add(shipTemplate.name);
                placed = true;
            }
            attempts++;
        }
        
        if (!placed) {
            updateStatus('Failed to place all ships randomly. Try again.');
            return;
        }
    }
    
    // Update tray to show all ships as placed
    trayShips.forEach(trayShip => {
        trayShip.classList.add('placed');
        trayShip.draggable = false;
    });
    
    // Re-render grid with all ships
    renderGrid(placementGridEl, gameState.playerBoard, true, true);
    attachGridDropListeners();
    attachPlacedShipClickListeners();
    
    // Update status and show confirmation modal
    updateStatus('All ships placed randomly! Click any ship to move it, or confirm to start.');
    setTimeout(() => {
        placementConfirmationModal.style.display = 'flex';
    }, 500);
}

// Create empty board (10x10 grid)
function createEmptyBoard() {
    const board = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            board[row][col] = {
                ship: null,
                hit: false,
                miss: false
            };
        }
    }
    return board;
}

// Place all ships randomly on a board
function placeAllShips(board) {
    const ships = [];
    
    for (const shipTemplate of SHIPS) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!placed && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            const horizontal = Math.random() < 0.5;

            if (canPlaceShip(board, row, col, shipTemplate.size, horizontal)) {
                const ship = {
                    name: shipTemplate.name,
                    size: shipTemplate.size,
                    hits: 0,
                    sunk: false,
                    positions: []
                };

                // Place ship on board
                for (let i = 0; i < shipTemplate.size; i++) {
                    const r = horizontal ? row : row + i;
                    const c = horizontal ? col + i : col;
                    board[r][c].ship = ship;
                    ship.positions.push({ row: r, col: c });
                }

                ships.push(ship);
                placed = true;
            }
            attempts++;
        }
    }

    return ships;
}

// Hard Mode: Place ships with difficult-to-guess strategy (randomized heuristics)
function placeAllShipsHardMode(board) {
    const ships = [];
    
    // Randomly select and weight heuristics for this game
    const heuristics = {
        preferInterior: Math.random() > 0.3,        // 70% chance
        avoidParallel: Math.random() > 0.2,         // 80% chance
        spreadQuadrants: Math.random() > 0.25,      // 75% chance
        avoidSymmetry: Math.random() > 0.3          // 70% chance
    };
    
    const quadrantCounts = [0, 0, 0, 0]; // Track ships per quadrant
    
    for (const shipTemplate of SHIPS) {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200;
        let bestPlacement = null;
        let bestScore = -Infinity;

        while (!placed && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            const horizontal = Math.random() < 0.5;

            if (canPlaceShip(board, row, col, shipTemplate.size, horizontal)) {
                // Calculate placement score based on active heuristics
                let score = Math.random() * 10; // Base randomness
                
                // Heuristic 1: Prefer interior cells (avoid edges/corners)
                if (heuristics.preferInterior) {
                    const positions = [];
                    for (let i = 0; i < shipTemplate.size; i++) {
                        const r = horizontal ? row : row + i;
                        const c = horizontal ? col + i : col;
                        positions.push({ r, c });
                    }
                    
                    const interiorScore = positions.reduce((sum, pos) => {
                        const distFromEdge = Math.min(pos.r, pos.c, GRID_SIZE - 1 - pos.r, GRID_SIZE - 1 - pos.c);
                        return sum + distFromEdge;
                    }, 0);
                    score += interiorScore * 2;
                }
                
                // Heuristic 2: Avoid parallel adjacent ships
                if (heuristics.avoidParallel && ships.length > 0) {
                    let hasParallelAdjacent = false;
                    for (let i = 0; i < shipTemplate.size; i++) {
                        const r = horizontal ? row : row + i;
                        const c = horizontal ? col + i : col;
                        
                        // Check adjacent cells for parallel ships
                        const adjacentOffsets = horizontal ? 
                            [[-1, 0], [1, 0]] : // Check above/below for horizontal ships
                            [[0, -1], [0, 1]];  // Check left/right for vertical ships
                        
                        for (const [dr, dc] of adjacentOffsets) {
                            const checkR = r + dr;
                            const checkC = c + dc;
                            if (checkR >= 0 && checkR < GRID_SIZE && checkC >= 0 && checkC < GRID_SIZE) {
                                if (board[checkR][checkC].ship) {
                                    hasParallelAdjacent = true;
                                    break;
                                }
                            }
                        }
                        if (hasParallelAdjacent) break;
                    }
                    if (!hasParallelAdjacent) {
                        score += 15;
                    } else {
                        score -= 10;
                    }
                }
                
                // Heuristic 3: Spread ships across quadrants
                if (heuristics.spreadQuadrants) {
                    const midRow = row + (horizontal ? 0 : Math.floor(shipTemplate.size / 2));
                    const midCol = col + (horizontal ? Math.floor(shipTemplate.size / 2) : 0);
                    const quadrant = (midRow < 5 ? 0 : 2) + (midCol < 5 ? 0 : 1);
                    
                    // Prefer less-populated quadrants
                    const quadrantPenalty = quadrantCounts[quadrant] * 5;
                    score -= quadrantPenalty;
                }
                
                // Heuristic 4: Avoid symmetry (check if placement mirrors existing ships)
                if (heuristics.avoidSymmetry && ships.length > 0) {
                    let isSymmetric = false;
                    const centerRow = 4.5;
                    const centerCol = 4.5;
                    
                    for (const existingShip of ships) {
                        const existingPos = existingShip.positions[0];
                        const existingHorizontal = existingShip.positions[0].row === existingShip.positions[existingShip.positions.length - 1].row;
                        
                        // Check for mirror symmetry across center
                        const mirrorRow = Math.round(2 * centerRow - existingPos.row);
                        const mirrorCol = Math.round(2 * centerCol - existingPos.col);
                        
                        if (Math.abs(mirrorRow - row) <= 1 && Math.abs(mirrorCol - col) <= 1 && 
                            existingHorizontal === horizontal) {
                            isSymmetric = true;
                            break;
                        }
                    }
                    if (!isSymmetric) {
                        score += 10;
                    } else {
                        score -= 15;
                    }
                }
                
                // Track best placement
                if (score > bestScore) {
                    bestScore = score;
                    bestPlacement = { row, col, horizontal };
                }
                
                // Accept good placements early to add variety
                if (score > 20 && Math.random() > 0.3) {
                    bestPlacement = { row, col, horizontal };
                    break;
                }
            }
            attempts++;
        }
        
        // Place the best found placement
        if (bestPlacement) {
            const ship = {
                name: shipTemplate.name,
                size: shipTemplate.size,
                hits: 0,
                sunk: false,
                positions: []
            };

            for (let i = 0; i < shipTemplate.size; i++) {
                const r = bestPlacement.horizontal ? bestPlacement.row : bestPlacement.row + i;
                const c = bestPlacement.horizontal ? bestPlacement.col + i : bestPlacement.col;
                board[r][c].ship = ship;
                ship.positions.push({ row: r, col: c });
            }

            // Update quadrant count
            if (heuristics.spreadQuadrants) {
                const midRow = bestPlacement.row + (bestPlacement.horizontal ? 0 : Math.floor(shipTemplate.size / 2));
                const midCol = bestPlacement.col + (bestPlacement.horizontal ? Math.floor(shipTemplate.size / 2) : 0);
                const quadrant = (midRow < 5 ? 0 : 2) + (midCol < 5 ? 0 : 1);
                quadrantCounts[quadrant]++;
            }

            ships.push(ship);
            placed = true;
        }
    }

    return ships;
}

// Check if a ship can be placed at the given position
function canPlaceShip(board, row, col, size, horizontal) {
    // Check if ship goes out of bounds
    if (horizontal) {
        if (col + size > GRID_SIZE) return false;
    } else {
        if (row + size > GRID_SIZE) return false;
    }

    // Check if any cell is already occupied
    for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        if (board[r][c].ship !== null) {
            return false;
        }
    }

    return true;
}

// Render a grid
function renderGrid(gridEl, board, showShips, isPlacementPhase = false) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    gridEl.style.position = 'relative';

    // Track which ships have been rendered to avoid duplicates
    const renderedShips = new Set();

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const cellData = board[row][col];

            // Show ships on player grid only (not AI grid unless sunk)
            if (showShips && cellData.ship && !cellData.hit) {
                cell.classList.add('ship');
            }
            
            // On AI grid, reveal sunk ships (all cells of sunk ship)
            if (!showShips && cellData.ship && cellData.ship.sunk) {
                cell.classList.add('sunk');
            }

            // Show hits (consistent on both grids)
            if (cellData.hit) {
                cell.classList.add('hit');
                // Sunk ships get darker red styling
                if (cellData.ship && cellData.ship.sunk) {
                    cell.classList.add('sunk');
                }
            }

            // Show misses
            if (cellData.miss) {
                cell.classList.add('miss');
            }

            // Add click handler for AI grid only (not during placement phase)
            if (!showShips && !isPlacementPhase) {
                cell.addEventListener('click', () => handlePlayerShot(row, col));
            }

            gridEl.appendChild(cell);
        }
    }

    // Render ship graphics on top of grid
    // For player grid: show all ships
    // For AI grid: show only sunk ships
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cellData = board[row][col];
            
            // Render ship if: (player grid) OR (AI grid AND ship is sunk)
            const shouldRenderShip = cellData.ship && !renderedShips.has(cellData.ship) && 
                                     (showShips || cellData.ship.sunk);
            
            if (shouldRenderShip) {
                renderedShips.add(cellData.ship);
                
                // Find the starting position of the ship
                const positions = cellData.ship.positions;
                const startPos = positions[0];
                const endPos = positions[positions.length - 1];
                const horizontal = startPos.row === endPos.row;
                
                // Get the first cell position
                const firstCell = gridEl.querySelector(`[data-row="${startPos.row}"][data-col="${startPos.col}"]`);
                if (firstCell) {
                    const rect = firstCell.getBoundingClientRect();
                    const gridRect = gridEl.getBoundingClientRect();
                    
                    const shipOverlay = document.createElement('div');
                    shipOverlay.style.position = 'absolute';
                    shipOverlay.style.left = (rect.left - gridRect.left) + 'px';
                    shipOverlay.style.top = (rect.top - gridRect.top) + 'px';
                    shipOverlay.style.pointerEvents = 'none';
                    shipOverlay.style.zIndex = '5';
                    
                    // For sunk ships on BOTH grids, add opacity to show through red cells
                    if (cellData.ship.sunk) {
                        shipOverlay.style.opacity = '0.7';
                    }
                    
                    shipOverlay.innerHTML = getShipSVG(cellData.ship.name, cellData.ship.size, horizontal);
                    
                    gridEl.appendChild(shipOverlay);
                }
            }
        }
    }
}

// Handle player's shot
function handlePlayerShot(row, col) {
    if (!gameState.gameActive) {
        updateStatus('Game is over! Click "New Game" to play again.');
        return;
    }

    if (!gameState.playerTurn) {
        updateStatus('Wait for AI turn to complete!');
        return;
    }

    const cell = gameState.aiBoard[row][col];

    // Check if cell already fired upon
    if (cell.hit || cell.miss) {
        updateStatus('Already fired at this location! Choose another cell.');
        return;
    }

    // Process shot
    gameState.playerTurn = false;
    gameState.playerShotsTaken++;

    if (cell.ship) {
        // Hit!
        cell.hit = true;
        cell.ship.hits++;
        gameState.playerHits++;

        // Check if ship is sunk
        if (cell.ship.hits === cell.ship.size) {
            cell.ship.sunk = true;
            updateStatus(`Hit! You sunk the enemy's ${getShipDisplayName(cell.ship.name)}!`);
            updateShipsList(aiShipsListEl, gameState.aiShips);

            // Check for win
            if (checkAllShipsSunk(gameState.aiShips)) {
                gameState.gameActive = false;
                renderGrid(aiGridEl, gameState.aiBoard, false);
                showEndGameModal(true);
                return;
            }
        } else {
            updateStatus('Hit!');
        }
    } else {
        // Miss
        cell.miss = true;
        updateStatus('Miss!');
    }

    // Re-render AI grid
    renderGrid(aiGridEl, gameState.aiBoard, false);

    // AI turn after a short delay
    setTimeout(handleAITurn, 1000);
}

// Handle AI's turn
function handleAITurn() {
    if (!gameState.gameActive) return;

    let target;
    
    if (gameState.difficulty === 'hard') {
        target = getHardModeProbabilityTarget();
    } else if (gameState.difficulty === 'medium') {
        target = getMediumModeTarget();
    } else {
        target = getEasyModeTarget();
    }
    
    if (!target) return;
    
    const cell = gameState.playerBoard[target.row][target.col];
    gameState.aiShotsTaken++;

    if (cell.ship) {
        // AI hit
        cell.hit = true;
        cell.ship.hits++;
        gameState.aiHits++;
        
        // Medium mode: track hit for targeting (hunt/target strategy)
        if (gameState.difficulty === 'medium') {
            gameState.aiTargetMode = true;
            gameState.aiLastHit = { row: target.row, col: target.col };
            gameState.aiHitSequence.push({ row: target.row, col: target.col });
            
            // Add adjacent cells to target queue using Medium mode logic
            addAdjacentTargets(target.row, target.col);
        }

        // Check if ship is sunk
        if (cell.ship.hits === cell.ship.size) {
            cell.ship.sunk = true;
            updateStatus(`AI sunk your ${getShipDisplayName(cell.ship.name)}!`);
            updateShipsList(playerShipsListEl, gameState.playerShips);
            
            // Medium mode: reset targeting after sinking ship ONLY if no other unresolved hits
            if (gameState.difficulty === 'medium') {
                // Check if there are any other unresolved hits
                const unresolvedHits = findUnresolvedHits();
                if (unresolvedHits.length === 0) {
                    // No more unresolved hits - safe to reset
                    gameState.aiTargetMode = false;
                    gameState.aiLastHit = null;
                    gameState.aiTargetQueue = [];
                    gameState.aiHitSequence = [];
                } else {
                    // Still have unresolved hits - rebuild queue for remaining targets
                    gameState.aiHitSequence = gameState.aiHitSequence.filter(hit => {
                        const cell = gameState.playerBoard[hit.row][hit.col];
                        return cell.ship && !cell.ship.sunk;
                    });
                    rebuildTargetQueue(unresolvedHits);
                }
            }

            // Check for loss
            if (checkAllShipsSunk(gameState.playerShips)) {
                gameState.gameActive = false;
                renderGrid(playerGridEl, gameState.playerBoard, true);
                showEndGameModal(false);
                return;
            }
        } else {
            updateStatus('AI hit your ship!');
        }
    } else {
        // AI miss
        cell.miss = true;
        updateStatus('AI missed!');
    }

    // Re-render player grid
    renderGrid(playerGridEl, gameState.playerBoard, true);

    // Player's turn again
    setTimeout(() => {
        if (gameState.gameActive) {
            gameState.playerTurn = true;
            updateStatus('Your turn! Click on the enemy grid to fire.');
        }
    }, 1000);
}

// Check if all ships are sunk
function checkAllShipsSunk(ships) {
    return ships.every(ship => ship.sunk);
}

// Easy mode: random targeting
function getEasyModeTarget() {
    const availableCells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = gameState.playerBoard[row][col];
            if (!cell.hit && !cell.miss) {
                availableCells.push({ row, col });
            }
        }
    }
    
    if (availableCells.length === 0) return null;
    return availableCells[Math.floor(Math.random() * availableCells.length)];
}

// Medium mode: hunt/target strategy (parity + target adjacent after hit)
function getMediumModeTarget() {
    // First, check if we have any unresolved hit clusters (hits on unsunk ships)
    const unresolvedHits = findUnresolvedHits();
    
    // If we have unresolved hits, we MUST be in target mode
    if (unresolvedHits.length > 0) {
        gameState.aiTargetMode = true;
        
        // If queue is empty but we have unresolved hits, rebuild the queue
        if (gameState.aiTargetQueue.length === 0) {
            rebuildTargetQueue(unresolvedHits);
        }
        
        // Try targets from queue
        while (gameState.aiTargetQueue.length > 0) {
            const target = gameState.aiTargetQueue.shift();
            const cell = gameState.playerBoard[target.row][target.col];
            if (!cell.hit && !cell.miss) {
                return target;
            }
        }
        
        // If queue exhausted but still have unresolved hits, rebuild and try again
        if (unresolvedHits.length > 0) {
            rebuildTargetQueue(unresolvedHits);
            while (gameState.aiTargetQueue.length > 0) {
                const target = gameState.aiTargetQueue.shift();
                const cell = gameState.playerBoard[target.row][target.col];
                if (!cell.hit && !cell.miss) {
                    return target;
                }
            }
        }
    } else {
        // No unresolved hits - safe to return to hunt mode
        gameState.aiTargetMode = false;
        gameState.aiHitSequence = [];
    }
    
    // Hunt mode: use checkerboard pattern for efficiency
    const availableCells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = gameState.playerBoard[row][col];
            if (!cell.hit && !cell.miss) {
                // Checkerboard pattern: prioritize cells where (row + col) is even
                const isCheckerboard = (row + col) % 2 === 0;
                availableCells.push({ row, col, priority: isCheckerboard ? 1 : 0 });
            }
        }
    }
    
    if (availableCells.length === 0) return null;
    
    // Sort by priority (checkerboard cells first)
    availableCells.sort((a, b) => b.priority - a.priority);
    
    // Pick from high priority cells
    const highPriorityCells = availableCells.filter(c => c.priority === availableCells[0].priority);
    return highPriorityCells[Math.floor(Math.random() * highPriorityCells.length)];
}

// Hard Mode: Probability-based targeting (global best next shot with strict finish-ship priority)
function getHardModeProbabilityTarget() {
    // Get remaining unsunk player ships
    const remainingShips = gameState.playerShips.filter(ship => !ship.sunk);
    
    if (remainingShips.length === 0) return null;
    
    // Find all unresolved hit clusters (STRICT PRIORITY: must finish these first)
    const unresolvedHits = findUnresolvedHits();
    const hasActiveHits = unresolvedHits.length > 0;
    
    // Create weighted score map for each cell
    const scoreMap = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    
    // For each remaining ship, enumerate all valid placements
    for (const ship of remainingShips) {
        const shipSize = ship.size;
        
        // Try all possible positions and orientations
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                // Try horizontal
                if (col + shipSize <= GRID_SIZE) {
                    const placementInfo = isValidPlacementForProbabilityWithInfo(row, col, shipSize, true, unresolvedHits);
                    if (placementInfo.valid) {
                        // Base weight for valid placement
                        let weight = 1;
                        
                        // CRITICAL: If we have active hits, ONLY count placements that include them
                        if (hasActiveHits) {
                            if (placementInfo.includesHits) {
                                // Heavy weight for placements that include known hits
                                weight = 100 * placementInfo.hitCount;
                            } else {
                                // Zero weight for placements that don't include hits when we have active clusters
                                weight = 0;
                            }
                        }
                        
                        // Apply weight to all cells in this placement
                        if (weight > 0) {
                            for (let i = 0; i < shipSize; i++) {
                                scoreMap[row][col + i] += weight;
                            }
                        }
                    }
                }
                
                // Try vertical
                if (row + shipSize <= GRID_SIZE) {
                    const placementInfo = isValidPlacementForProbabilityWithInfo(row, col, shipSize, false, unresolvedHits);
                    if (placementInfo.valid) {
                        // Base weight for valid placement
                        let weight = 1;
                        
                        // CRITICAL: If we have active hits, ONLY count placements that include them
                        if (hasActiveHits) {
                            if (placementInfo.includesHits) {
                                // Heavy weight for placements that include known hits
                                weight = 100 * placementInfo.hitCount;
                            } else {
                                // Zero weight for placements that don't include hits when we have active clusters
                                weight = 0;
                            }
                        }
                        
                        // Apply weight to all cells in this placement
                        if (weight > 0) {
                            for (let i = 0; i < shipSize; i++) {
                                scoreMap[row + i][col] += weight;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // If we have aligned hits (2+ in a line), heavily boost the line extension endpoints
    if (unresolvedHits.length >= 2) {
        const alignedLines = findAlignedHitLines(unresolvedHits);
        for (const line of alignedLines) {
            // Boost both endpoints of the line
            for (const endpoint of line.endpoints) {
                if (endpoint.row >= 0 && endpoint.row < GRID_SIZE && 
                    endpoint.col >= 0 && endpoint.col < GRID_SIZE) {
                    const cell = gameState.playerBoard[endpoint.row][endpoint.col];
                    if (!cell.hit && !cell.miss) {
                        // Massive boost for line extensions (most likely to finish ship)
                        scoreMap[endpoint.row][endpoint.col] += 10000;
                    }
                }
            }
        }
    }
    
    // Bonus for cells adjacent to unresolved hits (but lower priority than line extensions)
    if (hasActiveHits) {
        for (const hit of unresolvedHits) {
            const adjacentCells = [
                { row: hit.row - 1, col: hit.col },
                { row: hit.row + 1, col: hit.col },
                { row: hit.row, col: hit.col - 1 },
                { row: hit.row, col: hit.col + 1 }
            ];
            
            for (const adj of adjacentCells) {
                if (adj.row >= 0 && adj.row < GRID_SIZE && 
                    adj.col >= 0 && adj.col < GRID_SIZE) {
                    const cell = gameState.playerBoard[adj.row][adj.col];
                    if (!cell.hit && !cell.miss) {
                        // Moderate bonus for adjacency (if not already boosted by line extension)
                        scoreMap[adj.row][adj.col] += 500;
                    }
                }
            }
        }
    }
    
    // Find cells with highest score that haven't been tried
    let maxScore = 0;
    const bestCells = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = gameState.playerBoard[row][col];
            
            // Skip already tried cells
            if (cell.hit || cell.miss) continue;
            
            const score = scoreMap[row][col];
            
            if (score > maxScore) {
                maxScore = score;
                bestCells.length = 0;
                bestCells.push({ row, col });
            } else if (score === maxScore && score > 0) {
                bestCells.push({ row, col });
            }
        }
    }
    
    // Return random cell from best cells (tie-breaking)
    if (bestCells.length > 0) {
        return bestCells[Math.floor(Math.random() * bestCells.length)];
    }
    
    // If no scored cells found (shouldn't happen), find any untried cell
    // This ensures Hard mode NEVER falls back to Easy mode random logic
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = gameState.playerBoard[row][col];
            if (!cell.hit && !cell.miss) {
                return { row, col };
            }
        }
    }
    
    return null; // No valid moves left
}

// Check if a ship placement is valid for probability calculation (with detailed info)
function isValidPlacementForProbabilityWithInfo(row, col, size, horizontal, unresolvedHits) {
    const result = {
        valid: false,
        includesHits: false,
        hitCount: 0
    };
    
    // Check all cells in the placement
    const placementCells = [];
    for (let i = 0; i < size; i++) {
        const r = horizontal ? row : row + i;
        const c = horizontal ? col + i : col;
        placementCells.push({ row: r, col: c });
        
        const cell = gameState.playerBoard[r][c];
        
        // If cell is a miss, this placement is invalid
        if (cell.miss) return result;
        
        // If cell is a hit on a sunk ship, this placement is invalid
        if (cell.hit && cell.ship && cell.ship.sunk) return result;
    }
    
    // Check if placement includes hits from unresolved hit clusters
    const hitsInPlacement = [];
    for (const placementCell of placementCells) {
        const cell = gameState.playerBoard[placementCell.row][placementCell.col];
        if (cell.hit && cell.ship && !cell.ship.sunk) {
            hitsInPlacement.push({ row: placementCell.row, col: placementCell.col, ship: cell.ship });
        }
    }
    
    // If this placement includes hits from multiple different ships, it's invalid
    if (hitsInPlacement.length > 0) {
        const firstShip = hitsInPlacement[0].ship;
        if (!hitsInPlacement.every(hit => hit.ship === firstShip)) {
            return result;
        }
        
        result.includesHits = true;
        result.hitCount = hitsInPlacement.length;
    }
    
    result.valid = true;
    return result;
}

// Find all hits on unsunk ships (unresolved hit clusters)
function findUnresolvedHits() {
    const unresolvedHits = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = gameState.playerBoard[row][col];
            // Hit cell that belongs to an unsunk ship
            if (cell.hit && cell.ship && !cell.ship.sunk) {
                unresolvedHits.push({ row, col, ship: cell.ship });
            }
        }
    }
    return unresolvedHits;
}

// Find aligned hit lines (2+ hits in a row/column) and return their extension endpoints
function findAlignedHitLines(unresolvedHits) {
    const lines = [];
    
    // Group hits by ship
    const hitsByShip = new Map();
    for (const hit of unresolvedHits) {
        if (!hitsByShip.has(hit.ship)) {
            hitsByShip.set(hit.ship, []);
        }
        hitsByShip.get(hit.ship).push(hit);
    }
    
    // For each ship with multiple hits, check for alignment
    for (const [ship, hits] of hitsByShip) {
        if (hits.length < 2) continue;
        
        // Check for horizontal alignment
        const rows = hits.map(h => h.row);
        const cols = hits.map(h => h.col);
        const allSameRow = rows.every(r => r === rows[0]);
        const allSameCol = cols.every(c => c === cols[0]);
        
        if (allSameRow) {
            // Horizontal line
            const row = rows[0];
            const minCol = Math.min(...cols);
            const maxCol = Math.max(...cols);
            
            // Check if hits are contiguous or have gaps
            const sortedCols = [...cols].sort((a, b) => a - b);
            let isContiguous = true;
            for (let i = 1; i < sortedCols.length; i++) {
                if (sortedCols[i] - sortedCols[i-1] > 1) {
                    isContiguous = false;
                    break;
                }
            }
            
            // Add endpoints
            const endpoints = [];
            if (minCol > 0) {
                endpoints.push({ row, col: minCol - 1 });
            }
            if (maxCol < GRID_SIZE - 1) {
                endpoints.push({ row, col: maxCol + 1 });
            }
            
            if (endpoints.length > 0) {
                lines.push({
                    ship,
                    orientation: 'horizontal',
                    hits,
                    endpoints,
                    isContiguous
                });
            }
        } else if (allSameCol) {
            // Vertical line
            const col = cols[0];
            const minRow = Math.min(...rows);
            const maxRow = Math.max(...rows);
            
            // Check if hits are contiguous or have gaps
            const sortedRows = [...rows].sort((a, b) => a - b);
            let isContiguous = true;
            for (let i = 1; i < sortedRows.length; i++) {
                if (sortedRows[i] - sortedRows[i-1] > 1) {
                    isContiguous = false;
                    break;
                }
            }
            
            // Add endpoints
            const endpoints = [];
            if (minRow > 0) {
                endpoints.push({ row: minRow - 1, col });
            }
            if (maxRow < GRID_SIZE - 1) {
                endpoints.push({ row: maxRow + 1, col });
            }
            
            if (endpoints.length > 0) {
                lines.push({
                    ship,
                    orientation: 'vertical',
                    hits,
                    endpoints,
                    isContiguous
                });
            }
        }
    }
    
    return lines;
}

// Rebuild target queue from unresolved hits
function rebuildTargetQueue(unresolvedHits) {
    gameState.aiTargetQueue = [];
    
    // Check if hits are aligned (same ship, multiple hits)
    if (unresolvedHits.length >= 2) {
        // Check for horizontal or vertical alignment
        const firstHit = unresolvedHits[0];
        const sameShipHits = unresolvedHits.filter(h => h.ship === firstHit.ship);
        
        if (sameShipHits.length >= 2) {
            // Sort hits to find alignment
            const rows = sameShipHits.map(h => h.row);
            const cols = sameShipHits.map(h => h.col);
            const allSameRow = rows.every(r => r === rows[0]);
            const allSameCol = cols.every(c => c === cols[0]);
            
            if (allSameRow) {
                // Horizontal line - target ends
                const row = rows[0];
                const minCol = Math.min(...cols);
                const maxCol = Math.max(...cols);
                
                // Try left end
                if (minCol > 0) {
                    addTargetIfValid(row, minCol - 1);
                }
                // Try right end
                if (maxCol < GRID_SIZE - 1) {
                    addTargetIfValid(row, maxCol + 1);
                }
            } else if (allSameCol) {
                // Vertical line - target ends
                const col = cols[0];
                const minRow = Math.min(...rows);
                const maxRow = Math.max(...rows);
                
                // Try top end
                if (minRow > 0) {
                    addTargetIfValid(minRow - 1, col);
                }
                // Try bottom end
                if (maxRow < GRID_SIZE - 1) {
                    addTargetIfValid(maxRow + 1, col);
                }
            } else {
                // Not aligned - add adjacent cells for all hits
                unresolvedHits.forEach(hit => {
                    addAdjacentTargets(hit.row, hit.col);
                });
            }
        } else {
            // Different ships - add adjacent cells for all hits
            unresolvedHits.forEach(hit => {
                addAdjacentTargets(hit.row, hit.col);
            });
        }
    } else if (unresolvedHits.length === 1) {
        // Single hit - add all adjacent cells
        addAdjacentTargets(unresolvedHits[0].row, unresolvedHits[0].col);
    }
}

// Helper to add a target if valid (in bounds and not tried)
function addTargetIfValid(row, col) {
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        const cell = gameState.playerBoard[row][col];
        if (!cell.hit && !cell.miss) {
            // Avoid duplicates
            const exists = gameState.aiTargetQueue.some(t => t.row === row && t.col === col);
            if (!exists) {
                gameState.aiTargetQueue.push({ row, col });
            }
        }
    }
}

// Helper to add all adjacent cells as targets
function addAdjacentTargets(row, col) {
    addTargetIfValid(row - 1, col);  // up
    addTargetIfValid(row + 1, col);  // down
    addTargetIfValid(row, col - 1);  // left
    addTargetIfValid(row, col + 1);  // right
}

// Update status message
function updateStatus(message) {
    statusMessageEl.textContent = message;
}

// Update ships list display
function updateShipsList(listEl, ships) {
    listEl.innerHTML = '';
    
    ships.forEach(ship => {
        const shipItem = document.createElement('div');
        shipItem.className = 'ship-item';
        if (ship.sunk) {
            shipItem.classList.add('sunk');
        }

        const shipName = document.createElement('span');
        shipName.className = 'ship-name';
        shipName.textContent = getShipDisplayName(ship.name);

        const shipSize = document.createElement('span');
        shipSize.className = 'ship-size';
        shipSize.textContent = ship.sunk ? 'SUNK' : `${ship.size} cells`;

        shipItem.appendChild(shipName);
        shipItem.appendChild(shipSize);
        listEl.appendChild(shipItem);
    });
}

// Show end-of-game modal with stats
function showEndGameModal(playerWon) {
    const modal = document.getElementById('end-game-modal');
    const title = document.getElementById('end-game-title');
    const subtitle = document.getElementById('end-game-subtitle');
    
    // Set title and subtitle based on win/loss
    if (playerWon) {
        title.textContent = 'Victory';
        title.style.color = '#27ae60';
        subtitle.textContent = 'All enemy ships sunk!';
    } else {
        title.textContent = 'Defeat';
        title.style.color = '#e74c3c';
        subtitle.textContent = 'Your fleet was destroyed!';
    }
    
    // Calculate and display stats
    const playerAccuracy = gameState.playerShotsTaken > 0 
        ? Math.round((gameState.playerHits / gameState.playerShotsTaken) * 100) 
        : 0;
    const aiAccuracy = gameState.aiShotsTaken > 0 
        ? Math.round((gameState.aiHits / gameState.aiShotsTaken) * 100) 
        : 0;
    
    document.getElementById('player-shots').textContent = gameState.playerShotsTaken;
    document.getElementById('player-hits').textContent = gameState.playerHits;
    document.getElementById('player-accuracy').textContent = playerAccuracy + '%';
    
    document.getElementById('ai-shots').textContent = gameState.aiShotsTaken;
    document.getElementById('ai-hits').textContent = gameState.aiHits;
    document.getElementById('ai-accuracy').textContent = aiAccuracy + '%';
    
    // Show modal
    modal.style.display = 'flex';
}

// Play Again button handler
document.getElementById('play-again-btn').addEventListener('click', () => {
    // Hide end-game modal
    document.getElementById('end-game-modal').style.display = 'none';
    
    // Show difficulty modal to start new game
    difficultyModal.style.display = 'flex';
});

// Back to Home button handler
document.getElementById('back-home-btn').addEventListener('click', () => {
    // Hide end-game modal
    document.getElementById('end-game-modal').style.display = 'none';
    
    // Hide game screen
    gameScreen.style.display = 'none';
    
    // Show home screen
    homeScreen.style.display = 'flex';
    
    // Reset game state completely
    gameState = {
        playerBoard: createEmptyBoard(),
        aiBoard: createEmptyBoard(),
        playerShips: [],
        aiShips: [],
        gameActive: false,
        playerTurn: true,
        placementPhase: false,
        currentOrientation: 'horizontal',
        placedShips: new Set(),
        difficulty: null,
        aiTargetMode: false,
        aiLastHit: null,
        aiTargetQueue: [],
        aiHitSequence: [],
        playerShotsTaken: 0,
        playerHits: 0,
        aiShotsTaken: 0,
        aiHits: 0
    };
    
    // Hide placement phase and game container
    placementPhaseEl.style.display = 'none';
    gameContainerEl.style.display = 'none';
    
    // Hide confirmation modal if showing
    placementConfirmationModal.style.display = 'none';
    
    // Reset tray ships
    trayShips.forEach(ship => {
        ship.classList.remove('placed');
        ship.draggable = true;
        const visual = ship.querySelector('.ship-visual');
        visual.classList.remove('vertical');
    });
    
    // Reset status message
    updateStatus('Click "New Game" to start!');
    
    // Hide difficulty indicator
    difficultyIndicator.style.display = 'none';
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Initialize theme fully now that DOM is ready
    applyTheme(currentTheme);
    
    // Re-select all DOM elements to ensure they exist
    const playNowBtn = document.getElementById('play-now-btn');
    const howToPlayBtn = document.getElementById('how-to-play-btn');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions-btn');
    const difficultyModal = document.getElementById('difficulty-modal');
    const closeDifficultyBtn = document.getElementById('close-difficulty-btn');
    const easyModeBtn = document.getElementById('easy-mode-btn');
    const mediumModeBtn = document.getElementById('medium-mode-btn');
    const hardModeBtn = document.getElementById('hard-mode-btn');
    const themeDropdown = document.getElementById('theme-dropdown');
    const musicToggleBtns = document.querySelectorAll('.music-toggle-btn');
    
    // Home screen - Play Now button
    if (playNowBtn) {
        playNowBtn.addEventListener('click', () => {
            difficultyModal.style.display = 'flex';
            // Try to start music if enabled
            if (musicEnabled) {
                bgMusic.play().catch(err => console.log('Music autoplay prevented'));
            }
        });
    }
    
    // Home screen - How to Play button
    if (howToPlayBtn) {
        howToPlayBtn.addEventListener('click', () => {
            instructionsModal.style.display = 'flex';
        });
    }
    
    // Close instructions modal
    if (closeInstructionsBtn) {
        closeInstructionsBtn.addEventListener('click', () => {
            instructionsModal.style.display = 'none';
        });
    }
    
    // Close difficulty modal (X button)
    if (closeDifficultyBtn) {
        closeDifficultyBtn.addEventListener('click', () => {
            difficultyModal.style.display = 'none';
        });
    }
    
    // Difficulty selection
    if (easyModeBtn) {
        easyModeBtn.addEventListener('click', () => {
            gameState.difficulty = 'easy';
            difficultyModal.style.display = 'none';
            startPlacementPhase();
        });
    }
    
    if (mediumModeBtn) {
        mediumModeBtn.addEventListener('click', () => {
            gameState.difficulty = 'medium';
            difficultyModal.style.display = 'none';
            startPlacementPhase();
        });
    }
    
    if (hardModeBtn) {
        hardModeBtn.addEventListener('click', () => {
            gameState.difficulty = 'hard';
            difficultyModal.style.display = 'none';
            startPlacementPhase();
        });
    }
    
    // Theme dropdown
    if (themeDropdown) {
        // Set dropdown to current theme
        themeDropdown.value = currentTheme;
        
        themeDropdown.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }
    
    // Music toggle buttons
    musicToggleBtns.forEach(btn => {
        btn.addEventListener('click', toggleMusic);
    });
    
    // Placement confirmation modal buttons
    const keepEditingBtn = document.getElementById('keep-editing-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    
    if (keepEditingBtn) {
        keepEditingBtn.addEventListener('click', () => {
            const placementConfirmationModal = document.getElementById('placement-confirmation-modal');
            placementConfirmationModal.style.display = 'none';
            updateStatus('Continue placing ships. Click a placed ship to remove it.');
        });
    }
    
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            const placementConfirmationModal = document.getElementById('placement-confirmation-modal');
            placementConfirmationModal.style.display = 'none';
            startGameplay();
        });
    }
    
    // New Game button
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            startPlacementPhase();
        });
    }
    
    // Rotate button
    const rotateBtn = document.getElementById('rotate-btn');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', toggleOrientation);
    }
    
    // Random button
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', randomPlaceAllPlayerShips);
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPlacement);
    }
    
    // Close button - return to home screen
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const homeScreen = document.getElementById('home-screen');
            const gameScreen = document.getElementById('game-screen');
            const difficultyIndicator = document.getElementById('difficulty-indicator');
            
            homeScreen.style.display = 'flex';
            gameScreen.style.display = 'none';
            updateStatus('Click "New Game" to start!');
            difficultyIndicator.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the content
    if (instructionsModal) {
        instructionsModal.addEventListener('click', (e) => {
            if (e.target === instructionsModal) {
                instructionsModal.style.display = 'none';
            }
        });
    }
    
    updateStatus('Click "New Game" to start!');
});
