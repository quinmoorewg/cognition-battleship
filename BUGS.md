# Bug Report Template

Bug: Enemy grid colors and hit/miss markers were hard to see  
Cause: Enemy grid used a bright background color and low-contrast symbols  
Fix: Updated CSS to use higher-contrast colors and clearer visual indicators

Bug: Home screen battleship graphic did not clearly resemble a battleship
Cause: Initial graphic was too generic and lacked recognizable features
Fix: Replaced with a clearer battleship silhouette (long hull and turrets)

Bug: Drag-and-drop ship placement could not be completed because no placement grid was visible
Cause: The player grid was not rendered or enabled during the ship placement phase
Fix: Updated the placement phase to render and activate the player grid before gameplay so ships can be dropped onto valid cells

Bug: Only one ship could be placed during drag-and-drop placement; remaining ships could not be placed
Cause: Placement state was not advancing correctly after the first successful drop (remaining ships were disabled or not tracked properly)
Fix: Updated placement state to track each ship independently and allow sequential placement of all 5 ships before starting the game

Bug: During ship placement, the preview orientation defaulted to vertical but ships placed horizontally until Rotate was pressed
Cause: Orientation state was not being reset/initialized consistently on New Game; preview and placement logic started out of sync
Fix: Reset orientation to a consistent default on New Game and ensure preview + placement both reference the same orientation state

Bug: Home screen “floating on water” effect does not read as water; ship still appears to be hovering
Cause: Water layer was placed above/away from the ship and lacks a clear waterline + contact cues (reflection/shadow/ripples at the hull)
Fix: Reposition the waterline directly at the ship’s hull and add clear contact cues (waterline overlap, reflection/shadow, and ripples) so the ship visibly sits in water

Bug: Home screen ocean waterline remains perfectly straight and does not resemble natural waves
Cause: The boundary between sky and ocean is rendered as a static horizontal edge instead of a wavy surface
Fix: Replace the straight waterline with a wavy surface (e.g., animated SVG or CSS wave mask) so the ocean edge appears natural and moving

Bug: During ship placement, ships cannot be moved or re-placed after being dropped; placement is permanently locked
Cause: Once a ship is placed, it is marked as placed/disabled and there is no “remove/move” interaction to undo placement
Fix: Allow ships to be picked up and re-positioned during the placement phase (unplace/remove and re-drop) until the user confirms they are ready; after all ships are placed, show a “Ready to play?” popup and start the game on confirmation

Bug: Ship placement is broken after the re-place change — only one ship can be placed; additional ships cannot be placed and the placed ship cannot be moved/removed
Cause: Placement state/drag-drop handlers are not correctly tracking multiple ships and/or the placed-ship removal/re-drag logic is disabling further drops
Fix: Rework placement state so all ships remain placeable, and placed ships can be removed/moved reliably until confirmation; ensure drop targets and ship-tray state update correctly after every place/remove

Bug: Enemy ship hits/sinks are hard to recognize — player hits on the AI grid are not styled consistently (not red), and sunk ships are not visually distinguished or revealed
Cause: Hit/sunk styling is applied differently between player and AI boards, and the AI board does not render a distinct “sunk ship” visual state
Fix: Apply consistent hit/sunk styling on BOTH grids (hit = red, sunk = darker red) and reveal the full sunk enemy ship shape on the AI grid once sunk

Bug: In Hard mode, after the AI gets a hit it sometimes switches back to random shots instead of continuing to target adjacent cells to finish the ship
Cause: The Hard-mode targeting state/queue is being cleared or not persisted correctly between turns (hit follow-up candidates aren’t reliably carried over), so the AI falls back to hunt mode prematurely
Fix: Persist a target queue/state across turns in Hard mode; when there is at least one unresolved hit cluster, always choose from the best adjacent candidates until the ship is sunk, then return to hunt mode

Bug: Music toggle button scrolls with the page instead of staying pinned in the top-right
Cause: The Music toggle is inside a scrolling container and/or a parent element has CSS transform/filter/perspective applied, which causes `position: fixed` to behave like `absolute` within that container
Fix: Move the Music toggle element to be a direct child of `<body>` (outside any transformed/scrolling wrappers) and apply `position: fixed; top: …; right: …; z-index: …;` so it is anchored to the viewport

Bug: Original theme home screen ocean visuals broke after adding themes — the ocean/waterline is no longer a clean continuous ocean and the moving waterline visibly “ends” on screen
Cause: Theme refactor replaced the original ocean layer with a shorter/incorrectly repeating waterline element (wrong width/repeat/positioning), so the animation doesn’t tile seamlessly across the viewport
Fix: Restore the original theme’s ocean layers:
- Use a full-width (100vw) ocean section that clearly reads as water
- Make the waterline a seamless repeating pattern that tiles horizontally (repeat-x) and animates by background-position so it never shows an “end”
- Ensure the ocean fills across the entire screen and the ship sits on the waterline

Bug: Pirate theme home screen “pirate ship” hero visual does not read as a pirate ship (looks like a flat raft/board with minimal details)
Cause: The Pirate theme is using an overly simplistic SVG/shape (missing key pirate-ship cues like hull shape, masts, sails, rigging, and recognizable silhouette)
Fix: Replace the Pirate theme hero ship with a properly detailed inline SVG pirate ship (wooden hull, at least 1–2 masts, sails, rigging lines, crow’s nest, and a small flag). Keep it tasteful and consistent with the current UI.

Bug: Theme background update accidentally changed the grid square colors in Pirate and Outer Space modes
Cause: Theme CSS selectors are too broad and are overriding grid/cell styles (e.g., .cell, .grid, .board, or tile classes) when applying theme backgrounds
Fix: Restrict theme styling to page/background containers only (body/app background), and explicitly preserve grid/tile colors by:
- Scoping theme backgrounds to a dedicated wrapper (e.g., body/theme class → background only)
- Preventing theme rules from targeting grid/cell classes
- Re-asserting grid/cell background/border colors so they are identical across all themes

Bug: Pirate theme ship visuals revert to the Original (battleship) visuals after placement, even though the pirate ship names are correct
Cause: The themed visuals are only applied to the ship tray (or only to pre-placement state), but placed ships are rendered using the default/original renderer/classes
Fix: Ensure the ship rendering pipeline uses the current theme for BOTH:
- tray ships (unplaced)
- placed ships on the grid (including rotated state)
Apply pirate-specific classes/SVG rendering when theme === 'pirate' at placement time and on every re-render

Bug: Home page controls stopped working — “Play Now”, “How to Play”, and “Music On/Off” do nothing (theme dropdown still works)
Cause: Recent theme/home refactor likely broke event listeners (missing/changed IDs/classes, duplicate elements, or listeners attached before DOM exists). Theme dropdown still works because it’s the only element correctly wired.
Fix: Reconnect all home page buttons to their handlers by:
- Ensuring each button has a unique, stable id
- Attaching listeners after DOMContentLoaded
- Removing duplicate/overlay elements that intercept clicks
- Verifying the handlers still reference the correct elements/functions

Bug: Enemy Waters hit/sunk visuals no longer update — hits are not turning red and sunk ships are not turning darker red on the enemy grid
Cause: Recent styling/render changes likely only apply hit/sunk classes to the player grid, or enemy grid cells are missing the correct class updates/CSS selectors after theme work
Fix: Ensure enemy grid cells receive the same hit/miss/sunk state classes as before, and ensure CSS targets both grids consistently so:
- hit = red
- sunk = darker red
while keeping enemy ships hidden until sunk/revealed


