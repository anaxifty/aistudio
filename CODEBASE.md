# PIXEL ARCADE - CODEBASE DOCUMENTATION

## 1. Project Overview

PIXEL ARCADE is a static, self-contained retro gaming website that hosts 20 classic 8-bit style games in a browser. The entire site runs as static files with no backend, no build tools, and no external dependencies beyond Google Fonts.

### Structure
```
/
├── index.html              # Site shell: game library homepage
├── style.css               # Global styles (palette, typography, layout)
├── main.js                 # Site shell logic (game launching, iframe management)
├── games/                  # All game modules
│   ├── snake/
│   ├── tetris/
│   └── ... (20 games total)
└── CODEBASE.md             # This documentation file
```

### Architectural Decisions

- **Iframe Sandbox Pattern**: Each game runs in an isolated iframe to prevent any single game from crashing the entire site. This follows the ISOLATION PRINCIPLE where the site shell acts as an "operating system" and games are "sandboxed apps."

- **Static Files Only**: No build process means anyone can deploy by simply uploading files to any static host.

- **Canvas-Based Rendering**: All games use the HTML5 Canvas 2D API for authentic retro graphics without requiring image assets.

- **CSS Custom Properties**: Colors and design tokens are defined as CSS variables for easy theming.

## 2. How the Isolation System Works

### Iframe Sandbox Pattern

Each game loads inside a sandboxed iframe with restricted permissions:
```html
<iframe sandbox="allow-scripts allow-same-origin">
```

This allows the game to run JavaScript but prevents it from:
- Accessing the parent window's DOM
- Opening popups
- Submitting forms
- Navigating the parent page

### Game Lifecycle Management

When a user clicks PLAY:
1. A modal overlay is created
2. An iframe is dynamically inserted pointing to `/games/<name>/index.html`
3. The game starts running independently

When a user clicks EXIT:
1. The iframe is **destroyed** (not hidden)
2. All memory is released
3. The game loop stops completely

This destruction pattern is critical — it ensures stopped games don't consume CPU or memory.

### PostMessage Communication

The site shell communicates with games using `window.postMessage()`:
- **Pause**: Sent when modal is hidden or another game launches
- **Resume**: Sent when modal becomes visible again
- **Mute**: Sent when global mute toggle is activated

Games listen for these messages and respond accordingly without ever writing to the parent window.

### Error Handling

Each game wraps its code in an IIFE (Immediately Invoked Function Expression) and implements:
```javascript
window.onerror = function(msg, url, line) {
    // Display friendly error inside game canvas
    return true; // Prevent error from bubbling to parent
};
```

## 3. How to Add a New Game

### Step 1: Create the Game Folder

Create a new folder under `/games/` with the game name (lowercase, hyphenated):
```
/games/my-new-game/
```

### Step 2: Create the Three Required Files

**games/my-new-game/index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My New Game</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <canvas id="gameCanvas"></canvas>
    </div>
    <script src="game.js"></script>
</body>
</html>
```

**games/my-new-game/style.css**
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #0a0a0a;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Press Start 2P', cursive;
}

.game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

#gameCanvas {
    image-rendering: pixelated;
    width: 100%;
    max-width: 640px;
    aspect-ratio: 4/3;
}
```

**games/my-new-game/game.js**
```javascript
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        CANVAS_WIDTH: 320,
        CANVAS_HEIGHT: 240,
        FPS: 60
    };

    // Game state
    let canvas, ctx;
    let gameState = 'start'; // start, playing, gameover
    let score = 0;
    let highScore = 0;
    let lastTime = 0;
    let accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;

    // Initialize
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS_WIDTH;
        canvas.height = CONFIG.CANVAS_HEIGHT;

        // Load high score
        const saved = localStorage.getItem('pixelarcade.mynewgame.highscore');
        if (saved) highScore = parseInt(saved, 10);

        // Error handling
        window.onerror = function(msg, url, line) {
            drawErrorScreen();
            return true;
        };

        // Listen for pause/resume from parent
        window.addEventListener('message', handleMessage);
        document.addEventListener('visibilitychange', handleVisibility);

        // Start game loop
        requestAnimationFrame(gameLoop);
    }

    function handleMessage(e) {
        if (e.data === 'pause') gameState = 'paused';
        if (e.data === 'resume') gameState = 'start';
        if (e.data === 'mute') { /* handle mute */ }
    }

    function handleVisibility() {
        if (document.hidden && gameState === 'playing') {
            // Pause logic
        }
    }

    function gameLoop(timestamp) {
        const delta = timestamp - lastTime;
        lastTime = timestamp;
        accumulator += delta;

        while (accumulator >= STEP) {
            update();
            accumulator -= STEP;
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        if (gameState !== 'playing') return;
        // Game logic here
    }

    function render() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'playing') {
            drawGame();
        } else if (gameState === 'gameover') {
            drawGameOverScreen();
        }
    }

    function drawStartScreen() {
        ctx.fillStyle = '#00ff88';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('MY NEW GAME', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
    }

    function drawGame() {
        // Draw game elements
    }

    function drawGameOverScreen() {
        ctx.fillStyle = '#ff4444';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('SCORE: ' + score, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
        ctx.fillText('PRESS SPACE TO RESTART', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);
    }

    function drawErrorScreen() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Game failed to load', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 10);
        ctx.fillText('Try refreshing', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('pixelarcade.mynewgame.highscore', highScore);
        }
    }

    // Keyboard input
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            if (gameState === 'start' || gameState === 'gameover') {
                gameState = 'playing';
                score = 0;
            }
        }
    });

    // Start
    init();
})();
```

### Step 3: Register the Game

Add an entry to the `GAMES` array in `main.js`:
```javascript
const GAMES = [
    // ... existing games ...
    {
        name: 'My New Game',
        description: 'Description of the game',
        folder: 'my-new-game'
    }
];
```

That's it! The game will appear on the homepage automatically.

## 4. How to Change the Color Palette

Open `style.css` and modify the CSS custom properties in the `:root` selector:

```css
:root {
    --color-bg: #0a0a0a;           /* Background */
    --color-surface: #111111;      /* Card backgrounds */
    --color-border: #2a2a2a;       /* Borders and grid lines */
    --color-text: #e0e0e0;         /* Primary text */
    --color-text-secondary: #888888; /* Secondary text */
    --color-accent: #00ff88;       /* Highlights, active states */
    --color-danger: #ff4444;       /* Error states */
}
```

Change these values to instantly theme the entire site. All components reference these variables.

## 5. How to Deploy

### Netlify (Drag and Drop)

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Deploy manually"
3. Drag the entire project folder onto the upload area
4. Done! Your site is live

### GitHub Pages

1. Create a new repository on GitHub
2. Push all project files to the `main` branch
3. Go to Settings → Pages
4. Select "Deploy from branch" → `main` → `/ (root)`
5. Save and wait ~2 minutes
6. Your site is live at `https://<username>.github.io/<repo>`

### Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click "Create a project"
3. Connect your GitHub account and select the repository
4. Keep default build settings (no build command needed)
5. Click "Deploy"
6. Your site is live

## 6. Game-by-Game Reference

| Game Name | Folder | Key Controls | CONFIG Variables | Known Limitations |
|-----------|--------|--------------|------------------|-------------------|
| Snake | snake | Arrow Keys | SPEED, GRID_SIZE, WRAP_WALLS | Walls wrap optionally |
| Tetris | tetris | Arrow Keys, Space | GRAVITY, LEVEL_SPEED | Ghost piece visual only |
| Pong | pong | W/S or Up/Down | AI_DIFFICULTY, WIN_SCORE | Single player vs AI |
| Breakout | breakout | Left/Right Arrows | BALL_SPEED, BRICK_ROWS | Power-ups random |
| Pac-Man | pacman | Arrow Keys | GHOST_SPEED, POWER_DURATION | Simplified ghost AI |
| Space Invaders | space-invaders | Left/Right, Space | ALIEN_SPEED, UFO_CHANCE | Fixed alien patterns |
| Asteroids | asteroids | Rotate, Thrust, Fire | THRUST_POWER, ASTEROID_COUNT | Vector graphics only |
| Chrome Dino | chrome-dino | Space, Down | JUMP_FORCE, SPEED_INCREMENT | Day/night visual only |
| Boulder Dash | boulder-dash | Arrow Keys | BOULDER_GRAVITY, ENEMY_SPEED | 3 hand-crafted levels |
| Lode Runner | lode-runner | Arrow Keys, Z, X | DIG_TIME, ENEMY_AI | 3 hand-crafted levels |
| Bomb Jack | bomb-jack | Arrow Keys, Space | JUMP_HEIGHT, BOMB_TIMER | 3 hand-crafted levels |
| Bubble Bobble | bubble-bobble | Arrow Keys, Space | BUBBLE_SPEED, POP_TIME | 5 hand-crafted levels |
| Pinball | pinball | Z/X (Flippers), Space | FLIPPER_POWER, GRAVITY | Simplified physics |
| Top-Down Racing | top-down-racing | Arrow Keys | MAX_SPEED, FRICTION | Single track |
| Mini Golf | mini-golf | Mouse/Touch drag | POWER_SCALE, FRICTION | 5 holes |
| Platform Jumper | platform-jumper | Left/Right Arrows | JUMP_FORCE, SCROLL_SPEED | Procedural platforms |
| Helicopter Flyer | helicopter-flyer | Space/Hold | GRAVITY, LIFT, SCROLL | Procedural cave |
| Grid Tactics | grid-tactics | Arrow Keys, Space | MOVE_RANGE, ATTACK_RANGE | Simple AI |
| Puzzle Block Pusher | puzzle-pusher | Arrow Keys, Z (undo) | PUSH_LIMIT | 5 hand-crafted levels |
| Endless Runner | endless-runner | Space, Down | RUN_SPEED, JUMP_FORCE | Procedural obstacles |

## 7. Performance Tuning

### Lower Canvas Resolution

In each game's `game.js`, reduce `CONFIG.CANVAS_WIDTH` and `CONFIG.CANVAS_HEIGHT`:
```javascript
const CONFIG = {
    CANVAS_WIDTH: 256,  // Was 320
    CANVAS_HEIGHT: 192, // Was 240
    FPS: 60
};
```

Lower resolution = fewer pixels to render = better performance on old devices.

### Disable Effects

Some games may have particle effects or animations. These can be disabled by:
1. Finding the effect rendering code (usually in `render()` or `draw*()` functions)
2. Commenting out or adding a config flag to skip them

Example:
```javascript
const CONFIG = {
    PARTICLES_ENABLED: false, // Toggle off for performance
    // ...
};

function render() {
    // ...
    if (CONFIG.PARTICLES_ENABLED) {
        drawParticles();
    }
}
```

### Reduce Game Loop Frequency

For very slow devices, reduce FPS in config:
```javascript
const CONFIG = {
    FPS: 30  // Was 60
};
```

Note: This makes gameplay less smooth but reduces CPU usage significantly.

### Memory Optimization

If a specific game causes memory issues:
1. Check for event listeners not being removed on reset
2. Ensure arrays (particles, entities) are cleared between levels
3. Avoid creating objects inside the game loop

## 8. Troubleshooting

### Game Shows Blank Screen

**Cause**: Iframe sandbox error or script loading failure.

**Solution**:
1. Open browser DevTools Console
2. Look for errors related to the game's iframe
3. Check that `game.js` path is correct in `index.html`
4. Verify no CORS issues (shouldn't happen with same-origin iframes)

### LocalStorage Not Saving

**Cause**: Private/incognito browsing mode disables localStorage.

**Solution**:
- Inform users that high scores won't persist in private mode
- Or use a try/catch around localStorage operations:
```javascript
try {
    localStorage.setItem('key', value);
} catch (e) {
    // Storage unavailable, continue without saving
}
```

### Mobile Touch Not Working

**Cause**: Game only listens for keyboard events.

**Solution**:
1. Check if the game has touch controls implemented
2. Touch buttons should be rendered on canvas below the game area
3. Ensure `touchstart` events are handled, not just `click`
4. Test on actual mobile device (browser emulators can be unreliable)

### Game Runs Too Slow

**Cause**: Complex rendering or too many entities.

**Solution**:
1. Reduce entity count in CONFIG
2. Lower canvas resolution
3. Simplify collision detection (use grid-based instead of per-pixel)
4. Reduce particle effects

### Audio Issues (Future Enhancement)

If audio is added later:
- Use Web Audio API with proper cleanup
- Mute via postMessage from parent
- Respect browser autoplay policies (require user interaction first)

---

## License

This project is provided as-is for educational purposes. Individual games may have copyright restrictions — this implementation is for learning and personal use only.
