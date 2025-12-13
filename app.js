// Game state
const GRID_SIZE = 10;
const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 }
];

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
    aiHitSequence: []
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
const closeBtn = document.getElementById('close-btn');
const difficultyModal = document.getElementById('difficulty-modal');
const easyModeBtn = document.getElementById('easy-mode-btn');
const hardModeBtn = document.getElementById('hard-mode-btn');
const difficultyIndicator = document.getElementById('difficulty-indicator');

// Home screen - Play Now button
playNowBtn.addEventListener('click', () => {
    // Show difficulty selection modal
    difficultyModal.style.display = 'flex';
});

// Difficulty selection buttons
easyModeBtn.addEventListener('click', () => {
    selectDifficulty('easy');
});

hardModeBtn.addEventListener('click', () => {
    selectDifficulty('hard');
});

function selectDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    difficultyModal.style.display = 'none';
    homeScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    
    // Show difficulty indicator
    difficultyIndicator.textContent = `Difficulty: ${difficulty === 'easy' ? 'Easy' : 'Hard'}`;
    difficultyIndicator.style.display = 'block';
    
    startPlacementPhase();
}

// Home screen - How to Play button
howToPlayBtn.addEventListener('click', () => {
    instructionsModal.style.display = 'flex';
});

// Instructions modal - Close button
closeInstructionsBtn.addEventListener('click', () => {
    instructionsModal.style.display = 'none';
});

// Close modal when clicking outside the content
instructionsModal.addEventListener('click', (e) => {
    if (e.target === instructionsModal) {
        instructionsModal.style.display = 'none';
    }
});

// Placement confirmation modal buttons
keepEditingBtn.addEventListener('click', () => {
    placementConfirmationModal.style.display = 'none';
    updateStatus('Continue placing ships. Click a placed ship to remove it.');
});

startGameBtn.addEventListener('click', () => {
    placementConfirmationModal.style.display = 'none';
    startGameplay();
});

// Initialize game
newGameBtn.addEventListener('click', () => {
    startPlacementPhase();
});

// Rotate button
rotateBtn.addEventListener('click', toggleOrientation);

// Random button
randomBtn.addEventListener('click', randomPlaceAllPlayerShips);

// Close button - return to home screen
closeBtn.addEventListener('click', () => {
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
        aiHitSequence: []
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

// Keyboard R for rotation
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.placementPhase) {
            toggleOrientation();
        }
    }
});

function startPlacementPhase() {
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
        aiHitSequence: []
    };

    // Place AI ships randomly
    gameState.aiShips = placeAllShips(gameState.aiBoard);

    // Show placement phase, hide game container
    placementPhaseEl.style.display = 'block';
    gameContainerEl.style.display = 'none';

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

function getShipSVG(shipName, size, horizontal) {
    const cellSize = 40;
    const width = horizontal ? size * (cellSize + 2) - 2 : cellSize;
    const height = horizontal ? cellSize : size * (cellSize + 2) - 2;
    
    let svgContent = '';
    
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
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="position: absolute; pointer-events: none;">${svgContent}</svg>`;
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

                updateStatus(`${draggedShip.name} placed! ${5 - gameState.placedShips.size} ships remaining. Click placed ships to move them.`);
                
                // Re-attach listeners after placing (already done in placePlayerShip)

                // Check if all ships placed
                if (gameState.placedShips.size === 5) {
                    setTimeout(() => {
                        updateStatus('All ships placed!');
                        placementConfirmationModal.style.display = 'flex';
                    }, 500);
                }
            } else {
                updateStatus(`Invalid placement for ${draggedShip.name}! Try another location.`);
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
    updateStatus(`${ship.name} removed. ${5 - gameState.placedShips.size} ships remaining to place.`);
    
    // Hide confirmation modal if it was showing
    placementConfirmationModal.style.display = 'none';
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
                    
                    // For sunk ships on AI grid, add opacity to show through red cells
                    if (!showShips && cellData.ship.sunk) {
                        shipOverlay.style.opacity = '0.6';
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

    if (cell.ship) {
        // Hit!
        cell.hit = true;
        cell.ship.hits++;

        // Check if ship is sunk
        if (cell.ship.hits === cell.ship.size) {
            cell.ship.sunk = true;
            updateStatus(`Hit! You sunk the enemy's ${cell.ship.name}!`);
            updateShipsList(aiShipsListEl, gameState.aiShips);

            // Check for win
            if (checkAllShipsSunk(gameState.aiShips)) {
                gameState.gameActive = false;
                updateStatus('🎉 You win! All enemy ships destroyed!');
                renderGrid(aiGridEl, gameState.aiBoard, false);
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
        target = getHardModeTarget();
    } else {
        target = getEasyModeTarget();
    }
    
    if (!target) return;
    
    const cell = gameState.playerBoard[target.row][target.col];

    if (cell.ship) {
        // AI hit
        cell.hit = true;
        cell.ship.hits++;
        
        // Hard mode: track hit for targeting
        if (gameState.difficulty === 'hard') {
            gameState.aiTargetMode = true;
            gameState.aiLastHit = { row: target.row, col: target.col };
            gameState.aiHitSequence.push({ row: target.row, col: target.col });
            
            // Add adjacent cells to target queue
            addAdjacentCellsToQueue(target.row, target.col);
        }

        // Check if ship is sunk
        if (cell.ship.hits === cell.ship.size) {
            cell.ship.sunk = true;
            updateStatus(`AI sunk your ${cell.ship.name}!`);
            updateShipsList(playerShipsListEl, gameState.playerShips);
            
            // Hard mode: reset targeting after sinking ship
            if (gameState.difficulty === 'hard') {
                gameState.aiTargetMode = false;
                gameState.aiLastHit = null;
                gameState.aiTargetQueue = [];
                gameState.aiHitSequence = [];
            }

            // Check for loss
            if (checkAllShipsSunk(gameState.playerShips)) {
                gameState.gameActive = false;
                updateStatus('💀 You lose! All your ships were destroyed!');
                renderGrid(playerGridEl, gameState.playerBoard, true);
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

// Hard mode: hunt/target strategy
function getHardModeTarget() {
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

// Add adjacent cells to target queue for hard mode
function addAdjacentCellsToQueue(row, col) {
    const directions = [
        { row: row - 1, col: col },  // up
        { row: row + 1, col: col },  // down
        { row: row, col: col - 1 },  // left
        { row: row, col: col + 1 }   // right
    ];
    
    // If we have multiple hits in sequence, prioritize the line direction
    if (gameState.aiHitSequence.length >= 2) {
        const lastTwo = gameState.aiHitSequence.slice(-2);
        const rowDiff = lastTwo[1].row - lastTwo[0].row;
        const colDiff = lastTwo[1].col - lastTwo[0].col;
        
        // Continue in the same direction
        if (rowDiff !== 0) {
            // Vertical line - prioritize up/down
            const nextRow = lastTwo[1].row + rowDiff;
            if (nextRow >= 0 && nextRow < GRID_SIZE) {
                const cell = gameState.playerBoard[nextRow][col];
                if (!cell.hit && !cell.miss) {
                    gameState.aiTargetQueue.unshift({ row: nextRow, col: col });
                }
            }
            // Also try opposite direction
            const prevRow = lastTwo[0].row - rowDiff;
            if (prevRow >= 0 && prevRow < GRID_SIZE) {
                const cell = gameState.playerBoard[prevRow][col];
                if (!cell.hit && !cell.miss) {
                    gameState.aiTargetQueue.push({ row: prevRow, col: col });
                }
            }
        } else if (colDiff !== 0) {
            // Horizontal line - prioritize left/right
            const nextCol = lastTwo[1].col + colDiff;
            if (nextCol >= 0 && nextCol < GRID_SIZE) {
                const cell = gameState.playerBoard[row][nextCol];
                if (!cell.hit && !cell.miss) {
                    gameState.aiTargetQueue.unshift({ row: row, col: nextCol });
                }
            }
            // Also try opposite direction
            const prevCol = lastTwo[0].col - colDiff;
            if (prevCol >= 0 && prevCol < GRID_SIZE) {
                const cell = gameState.playerBoard[row][prevCol];
                if (!cell.hit && !cell.miss) {
                    gameState.aiTargetQueue.push({ row: row, col: prevCol });
                }
            }
        }
    } else {
        // First hit - add all adjacent cells
        for (const dir of directions) {
            if (dir.row >= 0 && dir.row < GRID_SIZE && dir.col >= 0 && dir.col < GRID_SIZE) {
                const cell = gameState.playerBoard[dir.row][dir.col];
                if (!cell.hit && !cell.miss) {
                    gameState.aiTargetQueue.push({ row: dir.row, col: dir.col });
                }
            }
        }
    }
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
        shipName.textContent = ship.name;

        const shipSize = document.createElement('span');
        shipSize.className = 'ship-size';
        shipSize.textContent = ship.sunk ? 'SUNK' : `${ship.size} cells`;

        shipItem.appendChild(shipName);
        shipItem.appendChild(shipSize);
        listEl.appendChild(shipItem);
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    updateStatus('Click "New Game" to start!');
});
