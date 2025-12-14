# Battleship Game

A classic Battleship game built with HTML, CSS, and JavaScript. Battle against an AI opponent in this naval warfare strategy game! Features multiple themes, difficulty levels, and strategic gameplay.

## Features

### Core Gameplay
- **Two 10x10 Grids**: Your fleet and enemy waters
- **5 Ships**: Varying sizes (5, 4, 3, 3, 2 cells) with theme-specific names
- **Manual Ship Placement**: Drag and drop ships onto your grid with rotation support
- **Random Placement Option**: Automatically place all ships randomly
- **Turn-Based Gameplay**: Player fires first, then AI responds
- **Visual Feedback**: Clear indicators for hits, misses, and sunk ships
- **Ship Status Tracking**: See which ships are still afloat
- **Win/Loss Detection**: Game ends when all ships of one side are destroyed

### Themes
- **Original Theme**: Classic naval battleship with traditional ship names (Carrier, Battleship, Cruiser, Submarine, Destroyer)
- **Pirate Theme**: High seas adventure with pirate ship names (Galleon, Frigate, Brigantine, Ketch, Sloop)
- **Outer Space Theme**: Sci-fi theme with space ship names (Star Carrier, Battlecruiser, Interceptor, Stealth Frigate, Scout Skiff)

### AI Difficulty Levels
- **Easy Mode**: AI fires randomly with no strategy
- **Medium Mode**: AI uses hunt/target strategy with checkerboard pattern and finishes ships it finds
- **Hard Mode**: AI uses advanced probability-based targeting, strategic ship placement, and ruthlessly efficient ship finishing

### Additional Features
- **Background Music**: Toggle atmospheric music on/off
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Persistence**: Your selected theme is saved between sessions
- **Statistics Tracking**: View shots taken, hits, and accuracy at game end

## How to Run Locally

1. **Download the files**: Ensure you have all files in the same directory:
   - `index.html`
   - `style.css`
   - `themes.css`
   - `app.js`
   - `battleship-music.mp3` (optional, for background music)

2. **Open the game**: 
   - Simply double-click `index.html` to open it in your default browser
   - Or right-click `index.html` and select "Open with" your preferred browser

3. **No server required**: This game runs entirely in the browser with no dependencies or build steps.

## How to Play

### Starting a Game

1. **Select a Theme**: Choose from Original, Pirate, or Outer Space themes on the home screen
2. **Click "Play Now"**: Opens the difficulty selection modal
3. **Choose Difficulty**: Select Easy, Medium, or Hard mode (or close the modal with X to return home)
4. **Place Your Ships**: 
   - Drag ships from the tray onto your grid
   - Press **R** key or click **Rotate** button to change orientation
   - Click placed ships to remove and reposition them
   - Use **Random** button to auto-place all ships
   - Use **Reset** button to clear all placements
5. **Start Game**: Once all 5 ships are placed, click **Start Game** in the confirmation modal

### Gameplay

1. **Your Turn**: Click any cell on the enemy grid (right side) to fire
   - **Hit** (red X): You hit an enemy ship
   - **Miss** (gray circle): You missed
   - **Sunk**: When all cells of a ship are hit, the full ship shape is revealed in darker red

2. **AI Turn**: After you fire, the AI automatically fires at your grid
   - Watch your grid (left side) for AI attacks
   - AI strategy varies by difficulty level

3. **Winning**: Sink all 5 enemy ships before the AI sinks yours

4. **Status Messages**: The top bar shows current game status with theme-specific ship names:
   - "Your turn"
   - "Hit!" / "Miss!"
   - "Hit! You sunk the enemy's [Ship Name]!"
   - Victory/Defeat modal with detailed statistics

### Game Rules

- You cannot fire at the same cell twice
- Ships may touch each other but cannot overlap
- Ships are placed horizontally or vertically (not diagonally)
- The game ends immediately when all ships of one side are sunk
- Click "New Game" anytime to restart with new random ship placements

### Ship Information

**Ship Sizes**: 5, 4, 3, 3, 2 cells

**Ship Names by Theme**:

| Size | Original Theme | Pirate Theme | Outer Space Theme |
|------|---------------|--------------|-------------------|
| 5    | Carrier       | Galleon      | Star Carrier      |
| 4    | Battleship    | Frigate      | Battlecruiser     |
| 3    | Cruiser       | Brigantine   | Interceptor       |
| 3    | Submarine     | Ketch        | Stealth Frigate   |
| 2    | Destroyer     | Sloop        | Scout Skiff       |

## Game Interface

- **Home Screen**: Theme selector, Play Now button, How to Play button, and Music toggle
- **Placement Phase**: Ship tray (left), placement grid (center), Rotate/Random/Reset buttons
- **Your Fleet (Left Grid)**: Shows your ships with theme-specific visuals, hits (red X), and misses (gray circle)
- **Enemy Waters (Right Grid)**: Shows only your hits and misses (enemy ships are hidden until sunk)
- **Ship Status Lists**: Below each grid, see which ships are still active or sunk with theme-specific names
- **Status Bar**: Displays current game state and messages with theme-specific ship names
- **Difficulty Indicator**: Shows selected difficulty level during gameplay
- **Music Toggle**: Button in top-right corner to control background music

## Tips

- **Strategic Placement**: Spread ships out or cluster them based on your strategy
- **Pattern Recognition**: On higher difficulties, the AI uses patterns - vary your ship placement
- **Adjacent Targeting**: When you hit a ship, try firing at adjacent cells to sink it completely
- **Ship Status**: Watch the ship status list to see which enemy ships are still active
- **Theme Selection**: Choose themes based on your preference - they're purely cosmetic!
- **Difficulty Progression**: Start with Easy to learn, then challenge yourself with Medium and Hard

## Technical Details

- **No frameworks or libraries**: Pure HTML, CSS, and JavaScript
- **Responsive design**: Works on desktop and mobile devices
- **Browser compatibility**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Local storage**: Theme preference persisted between sessions
- **Audio support**: Background music using HTML5 Audio API
- **SVG graphics**: Theme-specific ship visuals rendered with inline SVG
- **Drag and drop**: HTML5 drag and drop API for ship placement

## Enjoy the Game!

Good luck, Admiral! May your aim be true and your fleet victorious! 🚢⚓
