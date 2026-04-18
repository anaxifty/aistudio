You are a senior full-stack web developer with 15+ years of experience building
production-grade, public-facing web applications. You write clean, modular,
well-commented code that any junior developer can maintain.

## PROJECT OVERVIEW

Build a complete, self-contained retro gaming website called "PIXEL ARCADE" — a
public-facing HTML/CSS/JavaScript application that hosts 20 classic 8-bit style
games in a browser. The entire site must run as static files (no backend, no
build tools, no npm, no bundlers) so it can be deployed on any free-tier static
host (Netlify, GitHub Pages, Cloudflare Pages, etc.) with zero configuration.

---

## ARCHITECTURE REQUIREMENTS (read this first — it drives everything else)

The architecture must follow the ISOLATION PRINCIPLE: every game is an
independent module. A runtime error, infinite loop, or crash inside any single
game must NEVER affect the site shell, the navigation, or any other game. Achieve
this by:

1. Each game lives in its own folder: `/games/snake/`, `/games/tetris/`, etc.
2. Each game folder contains exactly: `index.html`, `game.js`, `style.css`.
3. The main site shell (`/index.html`) loads each game inside a sandboxed
   `<iframe sandbox="allow-scripts allow-same-origin">` element.
4. The site shell communicates with iframes ONLY through `postMessage` (for
   pause/resume/mute signals). Games never write to the parent window.
5. Every game wraps its entire logic in an IIFE or ES module — no global variable
   pollution even within its own iframe.
6. Every game catches its own unhandled errors with `window.onerror` and displays
   a friendly "Game failed to load — try refreshing" message inside its own iframe
   without throwing to the parent.

Think of the site shell as an operating system and each game as a sandboxed app.
The OS must keep running even if an app crashes.

---

## VISUAL DESIGN — AESTHETIC AND CONSTRAINTS

The look must be: retro, 8-bit, pixelated, professional, clean, and minimal.
"Professional" here means: no clutter, no gradients, no shadows, no animations
that serve no purpose. Think the aesthetic of a well-maintained dev tool, not a
gaudy arcade flyer.

**Color palette (strict — use ONLY these):**
- Background: #0a0a0a (near black)
- Surface / card backgrounds: #111111
- Border / grid lines: #2a2a2a
- Primary text: #e0e0e0 (off-white)
- Secondary text / labels: #888888
- Accent (for active states, highlights, logo): #00ff88 (retro green)
- Danger / error state: #ff4444
- No other colors anywhere on the site shell. Individual games may use up to
  3 additional colors internally, but must default to the palette above where
  possible.

**Typography:**
- Use the Google Font "Press Start 2P" (import via Google Fonts CDN) for all
  headings, labels, and UI text — this gives the pixel-font look without
  requiring a custom font file.
- Body/description text may use monospace system font (`font-family: 'Courier
  New', monospace`) at small sizes for readability.
- All font sizes must be defined in `rem` so the user can change the root font
  size to scale the entire UI.

**Pixel aesthetic implementation:**
- Use `image-rendering: pixelated` on all canvas elements and images.
- All game canvases must render at a low internal resolution (e.g., 320×240 or
  256×224) and be CSS-scaled up to fill their container — this creates the
  authentic pixelated look without performance overhead.
- Use CSS `outline` instead of `box-shadow` for borders (shadow is not retro).
- Game grid cards on the homepage use a consistent card size and a hover state
  that shifts the accent border from `#2a2a2a` to `#00ff88` with no transition
  delay (instant, not animated — retro feel).

**Logo:**
- Text-based logo: "PIXEL ARCADE" rendered in Press Start 2P, color #00ff88,
  all caps, followed by a blinking cursor character implemented in pure CSS
  (`animation: blink 1s step-end infinite`). No image file needed. Maximum 3
  colors including background.

---

## SITE STRUCTURE
/
├── index.html              ← Site shell: game library homepage
├── style.css               ← Global styles (palette, typography, layout)
├── main.js                 ← Site shell logic (game launching, iframe management)
├── games/
│   ├── snake/
│   │   ├── index.html
│   │   ├── game.js
│   │   └── style.css
│   ├── tetris/
│   │   └── ... (same pattern)
│   ├── pong/
│   ├── breakout/
│   ├── pacman/
│   ├── space-invaders/
│   ├── asteroids/
│   ├── chrome-dino/
│   ├── boulder-dash/
│   ├── lode-runner/
│   ├── bomb-jack/
│   ├── bubble-bobble/
│   ├── pinball/
│   ├── top-down-racing/
│   ├── mini-golf/
│   ├── platform-jumper/
│   ├── helicopter-flyer/
│   ├── grid-tactics/
│   ├── puzzle-pusher/
│   └── endless-runner/
└── CODEBASE.md             ← Developer documentation (see spec below)

---

## HOMEPAGE (index.html + style.css + main.js)

The homepage is a game library. Layout:

- Full-width header containing the logo (left) and a mute-all toggle (right).
- Below the header: a single search/filter input (placeholder: "SEARCH GAMES...")
  that filters the game grid in real-time by game name, no page reload.
- A responsive CSS grid of game cards. Each card shows:
  - Game name in Press Start 2P (small, ~10px equivalent).
  - A short one-line description in monospace.
  - A "PLAY" button that opens the game.
- Clicking PLAY opens the game in a fullscreen overlay modal that contains a
  sandboxed iframe pointing to `/games/<name>/index.html`. The overlay has a
  clearly labeled "✕ EXIT" button in the top-right corner that destroys the
  iframe on close (do NOT just hide it — destroy it, so the game fully stops and
  releases memory).
- The overlay dims the rest of the page with a semi-transparent backdrop
  (`rgba(0,0,0,0.92)`).
- Overlay must be keyboard accessible: pressing Escape closes it.
- The modal must be responsive and work on mobile (touch controls are handled
  inside each game individually).

---

## GAME SPECIFICATIONS

Build all 20 games. Each must:
- Run entirely on `<canvas>` using the 2D Context API. No WebGL, no libraries,
  no external dependencies — pure vanilla JS only.
- Target 60fps using `requestAnimationFrame` with a fixed timestep pattern
  (`accumulator += delta; while (accumulator >= STEP) { update(); accumulator
  -= STEP; }`) to decouple game logic speed from frame rate.
- Display current score and high score (stored in `localStorage` namespaced to
  that game, e.g., `pixelarcade.snake.highscore`).
- Show a start screen before the game begins and a game-over screen after death,
  so the user does not need to reload the iframe.
- Support keyboard input. Where applicable, also support on-screen touch buttons
  (rendered on canvas below the game area) for mobile.
- Never use `alert()`, `confirm()`, or `prompt()`.

Here are the 20 games with key implementation notes:

1.  **Snake** — Classic grid-based snake. Wrapping walls optional (add a toggle).
    Speed increases every 5 food items eaten.

2.  **Tetris** — Standard 10×20 grid. Implement: gravity, line clearing, 7-piece
    tetrominoes (I, O, T, S, Z, J, L), wall kicks, ghost piece (shown in dim
    color), and level-based speed increase.

3.  **Pong** — Two-player on same keyboard (W/S vs Up/Down) OR single-player vs
    simple AI. AI difficulty scales with score.

4.  **Breakout** — Brick grid, ball physics, paddle, power-ups (wide paddle, multi-
    ball, slow ball) that drop from destroyed bricks.

5.  **Pac-Man** — Simplified but faithful: a maze, 4 ghost AI states (chase,
    scatter, frightened, eaten), power pellets, fruit bonus items. Use a
    simplified maze (can be hand-coded as a 2D array — no need for the exact
    original layout).

6.  **Space Invaders** — Classic grid of descending aliens, shields that erode
    from player and alien fire, UFO bonus ship across the top.

7.  **Asteroids** — Vector-style ship (drawn with canvas lines, not sprites),
    thrust physics, asteroid splitting (large → medium → small), wrap-around
    edges, screen hyperspace button.

8.  **Chrome Dino** — Endless runner: dino jumps over cacti and ducks under
    pterodactyls. Speed increases over time. Day/night cycle after score
    milestones.

9.  **Boulder Dash** — Grid-based dig game: player digs through dirt, boulders
    fall with gravity, collect all diamonds to open exit, enemies patrol.
    Build 3 hand-crafted levels.

10. **Lode Runner** — Platformer on a fixed grid: player runs on platforms,
    climbs ladders, burns holes in brick floors (temporary), collect all gold
    to advance. 3 levels.

11. **Bomb Jack** — Fixed-screen platformer: collect bombs in sequence for bonus,
    enemies patrol platforms. 3 levels.

12. **Bubble Bobble** — Two-platform levels, player shoots bubbles that trap
    enemies, pop bubbles to defeat them, fruit score bonuses. Single character
    (no co-op needed). 5 levels.

13. **Pinball** — Canvas pinball: two flippers (Z/X keys), plunger launch, bumpers
    that score on contact, ball physics with realistic gravity and flipper
    physics. No need for a full physics engine — implement simplified ball-
    flipper and ball-circle collision math manually.

14. **Top-Down Racing** — Single player racing on a looping tile-based track,
    simple car physics (acceleration, steering, friction), lap timer, best lap
    stored. One track is sufficient.

15. **Mini Golf** — Click-and-drag to aim and set power, ball physics on a canvas
    course with walls and a hole. 5 holes. Stroke counter per hole and total.

16. **Platform Jumper** — Infinite procedurally generated platforms scrolling
    upward (like Doodle Jump). Player bounces off platforms, avoid gaps, score
    is height reached.

17. **Helicopter Flyer** — Click/tap to rise, gravity pulls down, scroll a
    procedurally generated cave (ceiling and floor) that narrows over time.
    Classic "Copter" style.

18. **Grid Tactics** — Turn-based: player controls 3 units on a grid vs. 3 AI
    units. Each unit can move N squares and attack adjacent squares per turn.
    Simple health/attack system. No story needed.

19. **Puzzle Block Pusher** — Sokoban-style: push blocks onto target squares.
    5 hand-designed levels. Undo last move with Z key. Level select after
    completion.

20. **Endless Runner** — Side-scrolling runner: character auto-runs, jump (Space)
    and slide (Down) to avoid obstacles. Procedurally generated obstacle
    patterns. Coin collectibles for score multiplier.

---

## PERFORMANCE REQUIREMENTS

These constraints ensure the site runs well on free-tier servers and low-end
devices:

- Total site weight (all files combined, uncompressed): target under 500KB.
  No images, no sprite sheets — draw everything procedurally on canvas.
- Each game's canvas internal resolution must not exceed 480×360. Scale up
  with CSS transform or canvas CSS width/height. This keeps pixel fill rate low.
- Use `cancelAnimationFrame` whenever the iframe is hidden or paused (listen for
  `visibilitychange` and for a `postMessage` pause signal from the parent).
- Avoid memory leaks: event listeners inside each game must be removed when the
  game resets. Prefer `{ once: true }` where applicable.
- Do not use `setInterval` for game loops — always use `requestAnimationFrame`.
- localStorage reads/writes: only on game start (read high score) and game over
  (write high score). Never during the game loop.

---

## CUSTOMIZATION HOOKS

To make the site easy to customize later, implement these specific patterns:

- All colors in `style.css` must be defined as CSS custom properties on `:root`
  (e.g., `--color-bg: #0a0a0a;`). A future maintainer changes the whole palette
  by editing one block.
- All game metadata (name, description, folder path) lives in a single JS array
  at the top of `main.js` called `GAMES`. Adding a new game means adding one
  object to this array — nothing else changes.
- Each game reads its config (e.g., starting speed, grid size) from a `CONFIG`
  object defined at the top of its `game.js`. These are the only values a
  maintainer needs to touch to tune a game.
- Font size is set only on the `html` element in `style.css`. All other sizes
  use `rem`. Changing one value scales the entire UI.

---

## MARKDOWN DOCUMENTATION (CODEBASE.md)

Generate a `CODEBASE.md` file at the project root. It must cover:

1. **Project Overview** — What this project is, how it's structured, and the
   one-sentence reason for each major architectural decision.

2. **How the Isolation System Works** — Explain the iframe sandbox pattern, why
   games are destroyed (not hidden) on close, and how `postMessage` is used.

3. **How to Add a New Game** — Step-by-step: create the folder, write the three
   files, add one entry to the `GAMES` array in `main.js`. Include a minimal
   game template (a canvas that renders a "GAME NAME" placeholder screen).

4. **How to Change the Color Palette** — Show the exact lines to edit in
   `style.css`.

5. **How to Deploy** — Instructions for Netlify (drag-and-drop), GitHub Pages,
   and Cloudflare Pages. Since it's static files, each is 3 steps or fewer.

6. **Game-by-Game Reference** — A table: Game Name | Folder | Key Controls |
   CONFIG variables available | Known Limitations.

7. **Performance Tuning** — How to lower canvas resolution, how to disable
   effects, what to do if a specific game is slow on old hardware.

8. **Troubleshooting** — Common issues: game shows blank screen (iframe sandbox
   error), localStorage not saving (private browsing), mobile touch not working.

---

## OUTPUT INSTRUCTIONS

Generate ALL files completely — do not truncate, do not use placeholder comments
like `// ... rest of game logic here`. Every function must be fully implemented.
Output files in this order:

1. `CODEBASE.md`
2. `index.html`
3. `style.css`
4. `main.js`
5. Then each game folder in this order: snake, tetris, pong, breakout, pacman,
   space-invaders, asteroids, chrome-dino, boulder-dash, lode-runner, bomb-jack,
   bubble-bobble, pinball, top-down-racing, mini-golf, platform-jumper,
   helicopter-flyer, grid-tactics, puzzle-pusher, endless-runner.
6. For each game folder, output: `games/<name>/index.html`, then `game.js`,
   then `style.css`.

Label each file clearly with its path as a markdown heading before the code
block, like:

## games/snake/game.js
```js
... full file content ...
```

Do not skip any file. Do not abbreviate any game's logic.
