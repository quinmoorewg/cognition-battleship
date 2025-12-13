# Battleship Game

A classic Battleship game built with vanilla HTML, CSS, and JavaScript. Battle against an AI opponent in this naval warfare strategy game!

## Features

- **Two 10x10 Grids**: Your fleet and enemy waters
- **5 Ships**: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
- **Random Ship Placement**: Ships are randomly placed at the start of each game
- **Turn-Based Gameplay**: Player fires first, then AI responds
- **Visual Feedback**: Clear indicators for hits, misses, and sunk ships
- **Ship Status Tracking**: See which ships are still afloat
- **Win/Loss Detection**: Game ends when all ships of one side are destroyed

## How to Run Locally

1. **Download the files**: Ensure you have all files in the same directory:
   - `index.html`
   - `style.css`
   - `app.js`

2. **Open the game**: 
   - Simply double-click `index.html` to open it in your default browser
   - Or right-click `index.html` and select "Open with" your preferred browser

3. **No server required**: This game runs entirely in the browser with no dependencies or build steps.

## How to Play

### Starting a Game

1. Click the **"New Game"** button to start
2. Ships will be randomly placed on both grids
3. Your ships are visible on the left grid (blue cells)
4. Enemy ships are hidden on the right grid

### Gameplay

1. **Your Turn**: Click any cell on the enemy grid (right side) to fire
   - **Hit** (red X): You hit an enemy ship
   - **Miss** (gray circle): You missed
   - **Sunk**: When all cells of a ship are hit, you'll see "Sunk [Ship Name]"

2. **AI Turn**: After you fire, the AI automatically fires at your grid
   - Watch your grid (left side) for AI attacks
   - The AI chooses random untried cells

3. **Winning**: Sink all 5 enemy ships before the AI sinks yours

4. **Status Messages**: The top bar shows current game status:
   - "Your turn"
   - "Hit!" / "Miss!"
   - "Sunk [Ship Name]"
   - "You win!" / "You lose!"

### Game Rules

- You cannot fire at the same cell twice
- Ships may touch each other but cannot overlap
- Ships are placed horizontally or vertically (not diagonally)
- The game ends immediately when all ships of one side are sunk
- Click "New Game" anytime to restart with new random ship placements

### Ship Information

| Ship Name  | Size (Cells) |
|------------|--------------|
| Carrier    | 5            |
| Battleship | 4            |
| Cruiser    | 3            |
| Submarine  | 3            |
| Destroyer  | 2            |

## Game Interface

- **Your Fleet (Left Grid)**: Shows your ships (blue), hits (red X), and misses (gray circle)
- **Enemy Waters (Right Grid)**: Shows only your hits and misses (enemy ships are hidden)
- **Ship Status Lists**: Below each grid, see which ships are still active or sunk
- **Status Bar**: Displays current game state and messages

## Tips

- Remember where you've already fired to avoid wasting shots
- When you hit a ship, try firing at adjacent cells to sink it completely
- Watch the ship status list to see which enemy ships are still active

## Technical Details

- **No frameworks or libraries**: Pure HTML, CSS, and JavaScript
- **Responsive design**: Works on desktop and mobile devices
- **Browser compatibility**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)

## Enjoy the Game!

Good luck, Admiral! May your aim be true and your fleet victorious! 🚢⚓
