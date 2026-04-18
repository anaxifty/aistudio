(function() {
    'use strict';

    const CONFIG = {
        CANVAS_WIDTH: 240,
        CANVAS_HEIGHT: 320,
        GRID_SIZE: 16,
        COLS: 10,
        ROWS: 20,
        FPS: 60,
        GRAVITY_INITIAL: 1000,
        LEVEL_SPEED_MULTIPLIER: 0.85
    };

    const TETROMINOES = {
        I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00ffff' },
        O: { shape: [[1,1],[1,1]], color: '#ffff00' },
        T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#ff00ff' },
        S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00ff00' },
        Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ff0000' },
        J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#0000ff' },
        L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#ffa500' }
    };

    let canvas, ctx;
    let gameState = 'start';
    let score = 0;
    let highScore = 0;
    let level = 1;
    let lines = 0;
    let board = [];
    let currentPiece = null;
    let nextPiece = null;
    let dropTimer = 0;
    let gravityInterval = CONFIG.GRAVITY_INITIAL;
    let lastTime = 0;
    let accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS_WIDTH;
        canvas.height = CONFIG.CANVAS_HEIGHT;

        loadHighScore();
        setupInput();
        setupTouchControls();
        window.onerror = handleError;
        window.addEventListener('message', handleMessage);
        document.addEventListener('visibilitychange', handleVisibility);

        resetGame();
        requestAnimationFrame(gameLoop);
    }

    function loadHighScore() {
        try {
            const saved = localStorage.getItem('pixelarcade.tetris.highscore');
            if (saved) highScore = parseInt(saved, 10);
        } catch (e) {}
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            try { localStorage.setItem('pixelarcade.tetris.highscore', highScore); } catch (e) {}
        }
    }

    function createBoard() {
        return Array(CONFIG.ROWS).fill(null).map(() => Array(CONFIG.COLS).fill(0));
    }

    function resetGame() {
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        gravityInterval = CONFIG.GRAVITY_INITIAL;
        currentPiece = randomPiece();
        nextPiece = randomPiece();
        dropTimer = 0;
    }

    function randomPiece() {
        const keys = Object.keys(TETROMINOES);
        const key = keys[Math.floor(Math.random() * keys.length)];
        const tetro = TETROMINOES[key];
        return {
            shape: tetro.shape.map(row => [...row]),
            color: tetro.color,
            x: Math.floor((CONFIG.COLS - tetro.shape[0].length) / 2),
            y: 0
        };
    }

    function rotate(matrix) {
        const N = matrix.length;
        const rotated = matrix.map((row, i) =>
            row.map((val, j) => matrix[N - 1 - j][i])
        );
        return rotated;
    }

    function isValid(piece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    if (newX < 0 || newX >= CONFIG.COLS || newY >= CONFIG.ROWS) return false;
                    if (newY >= 0 && board[newY][newX]) return false;
                }
            }
        }
        return true;
    }

    function merge() {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                    const boardY = currentPiece.y + y;
                    if (boardY >= 0) {
                        board[boardY][currentPiece.x + x] = currentPiece.color;
                    }
                }
            });
        });
    }

    function clearLines() {
        let cleared = 0;
        for (let y = CONFIG.ROWS - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                board.splice(y, 1);
                board.unshift(Array(CONFIG.COLS).fill(0));
                cleared++;
                y++;
            }
        }
        if (cleared > 0) {
            lines += cleared;
            const points = [0, 100, 300, 500, 800];
            score += points[cleared] * level;
            const newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                gravityInterval *= CONFIG.LEVEL_SPEED_MULTIPLIER;
            }
        }
    }

    function getGhostY() {
        let ghostY = currentPiece.y;
        while (isValid(currentPiece, 0, ghostY - currentPiece.y + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    function setupInput() {
        document.addEventListener('keydown', (e) => {
            if (gameState === 'start' || gameState === 'gameover') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    gameState = 'playing';
                    resetGame();
                }
                return;
            }
            if (gameState !== 'playing') return;

            switch (e.code) {
                case 'ArrowLeft':
                    if (isValid(currentPiece, -1, 0)) currentPiece.x--;
                    break;
                case 'ArrowRight':
                    if (isValid(currentPiece, 1, 0)) currentPiece.x++;
                    break;
                case 'ArrowDown':
                    if (isValid(currentPiece, 0, 1)) currentPiece.y++;
                    break;
                case 'ArrowUp':
                case 'KeyX':
                    const rotated = rotate(currentPiece.shape);
                    const oldShape = currentPiece.shape;
                    currentPiece.shape = rotated;
                    if (!isValid(currentPiece)) {
                        if (isValid(currentPiece, -1, 0)) currentPiece.x--;
                        else if (isValid(currentPiece, 1, 0)) currentPiece.x++;
                        else if (isValid(currentPiece, -2, 0)) currentPiece.x -= 2;
                        else if (isValid(currentPiece, 2, 0)) currentPiece.x += 2;
                        else currentPiece.shape = oldShape;
                    }
                    break;
                case 'Space':
                    while (isValid(currentPiece, 0, 1)) currentPiece.y++;
                    lockPiece();
                    break;
                case 'Escape':
                case 'KeyP':
                    gameState = gameState === 'paused' ? 'playing' : 'paused';
                    break;
            }
        });
    }

    function setupTouchControls() {
        const buttons = document.querySelectorAll('.touch-btn');
        buttons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (gameState === 'start' || gameState === 'gameover') {
                    gameState = 'playing';
                    resetGame();
                    return;
                }
                if (gameState !== 'playing') return;

                const action = btn.dataset.action;
                const dir = btn.dataset.dir;
                if (action === 'rotate') {
                    const rotated = rotate(currentPiece.shape);
                    const oldShape = currentPiece.shape;
                    currentPiece.shape = rotated;
                    if (!isValid(currentPiece)) {
                        if (isValid(currentPiece, -1, 0)) currentPiece.x--;
                        else if (isValid(currentPiece, 1, 0)) currentPiece.x++;
                        else currentPiece.shape = oldShape;
                    }
                } else if (action === 'drop') {
                    while (isValid(currentPiece, 0, 1)) currentPiece.y++;
                    lockPiece();
                } else if (dir === 'left' && isValid(currentPiece, -1, 0)) {
                    currentPiece.x--;
                } else if (dir === 'right' && isValid(currentPiece, 1, 0)) {
                    currentPiece.x++;
                } else if (dir === 'down' && isValid(currentPiece, 0, 1)) {
                    currentPiece.y++;
                }
            });
        });
    }

    function handleMessage(e) {
        if (e.data === 'pause' && gameState === 'playing') gameState = 'paused';
        else if (e.data === 'resume' && gameState === 'paused') gameState = 'playing';
    }

    function handleVisibility() {
        if (document.hidden && gameState === 'playing') gameState = 'paused';
    }

    function handleError(msg, url, line) { drawErrorScreen(); return true; }

    function gameLoop(timestamp) {
        const delta = timestamp - lastTime;
        lastTime = timestamp;
        accumulator += delta;
        while (accumulator >= STEP) { update(); accumulator -= STEP; }
        render();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        if (gameState !== 'playing') return;
        dropTimer += STEP;
        if (dropTimer >= gravityInterval) {
            dropTimer = 0;
            if (isValid(currentPiece, 0, 1)) {
                currentPiece.y++;
            } else {
                lockPiece();
            }
        }
    }

    function lockPiece() {
        merge();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = randomPiece();
        if (!isValid(currentPiece)) {
            gameOver();
        }
    }

    function gameOver() {
        gameState = 'gameover';
        saveHighScore();
    }

    function render() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (gameState === 'start') { drawStartScreen(); }
        else if (gameState === 'playing' || gameState === 'paused') { drawGame(); if (gameState === 'paused') drawPauseOverlay(); }
        else if (gameState === 'gameover') { drawGameOverScreen(); }
    }

    function drawBlock(x, y, color) {
        const size = CONFIG.GRID_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    }

    function drawStartScreen() {
        ctx.fillStyle = '#00ff88';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('TETRIS', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 40);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        ctx.fillText('ARROWS to move/rotate', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        ctx.fillText('SPACE for hard drop', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 35);
        ctx.fillStyle = '#888888';
        ctx.fillText('HI: ' + highScore, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 15);
    }

    function drawGame() {
        const offsetX = (CONFIG.CANVAS_WIDTH - CONFIG.COLS * CONFIG.GRID_SIZE) / 2;
        ctx.save();
        ctx.translate(offsetX, 10);

        // Draw board
        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) drawBlock(x, y, cell);
            });
        });

        // Draw ghost
        const ghostY = getGhostY();
        currentPiece.shape.forEach((row, py) => {
            row.forEach((val, px) => {
                if (val) {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect((currentPiece.x + px) * CONFIG.GRID_SIZE + 1, (ghostY + py) * CONFIG.GRID_SIZE + 1, CONFIG.GRID_SIZE - 2, CONFIG.GRID_SIZE - 2);
                }
            });
        });

        // Draw current piece
        currentPiece.shape.forEach((row, py) => {
            row.forEach((val, px) => {
                if (val) drawBlock(currentPiece.x + px, currentPiece.y + py, currentPiece.color);
            });
        });

        ctx.restore();

        // UI
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 5, 12);
        ctx.fillText(score, 5, 24);
        ctx.fillText('LEVEL', 5, 40);
        ctx.fillText(level, 5, 52);
        ctx.fillText('LINES', 5, 68);
        ctx.fillText(lines, 5, 80);
        ctx.textAlign = 'right';
        ctx.fillText('NEXT', CONFIG.CANVAS_WIDTH - 5, 12);
        
        // Draw next piece preview
        if (nextPiece) {
            const previewX = CONFIG.CANVAS_WIDTH - 70;
            const previewY = 20;
            nextPiece.shape.forEach((row, py) => {
                row.forEach((val, px) => {
                    if (val) {
                        ctx.fillStyle = nextPiece.color;
                        ctx.fillRect(previewX + px * 12, previewY + py * 12, 10, 10);
                    }
                });
            });
        }
    }

    function drawPauseOverlay() {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = '#00ff88';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    }

    function drawGameOverScreen() {
        ctx.fillStyle = '#ff4444';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('SCORE: ' + score, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        ctx.fillText('HI: ' + highScore, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);
    }

    function drawErrorScreen() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = '#ff4444';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Game failed to load', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 10);
        ctx.fillText('Try refreshing', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
    }

    init();
})();
