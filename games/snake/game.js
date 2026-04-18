(function() {
    'use strict';

    const CONFIG = {
        CANVAS_WIDTH: 320,
        CANVAS_HEIGHT: 240,
        GRID_SIZE: 16,
        FPS: 60,
        INITIAL_SPEED: 8,
        SPEED_INCREMENT: 1,
        FOOD_PER_SPEEDUP: 5,
        WRAP_WALLS: true
    };

    let canvas, ctx;
    let gameState = 'start'; // start, playing, paused, gameover
    let score = 0;
    let highScore = 0;
    let lastTime = 0;
    let accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;

    // Game entities
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let foodEaten = 0;
    let currentSpeed = CONFIG.INITIAL_SPEED;
    let moveTimer = 0;
    const MOVE_INTERVAL = 1000 / CONFIG.INITIAL_SPEED;

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
            const saved = localStorage.getItem('pixelarcade.snake.highscore');
            if (saved) highScore = parseInt(saved, 10);
        } catch (e) {}
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            try {
                localStorage.setItem('pixelarcade.snake.highscore', highScore);
            } catch (e) {}
        }
    }

    function resetGame() {
        const gridWidth = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE);
        const gridHeight = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE);
        const startX = Math.floor(gridWidth / 2);
        const startY = Math.floor(gridHeight / 2);

        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        foodEaten = 0;
        currentSpeed = CONFIG.INITIAL_SPEED;
        moveTimer = 0;
        spawnFood();
    }

    function spawnFood() {
        const gridWidth = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE);
        const gridHeight = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE);
        let valid = false;

        while (!valid) {
            food.x = Math.floor(Math.random() * gridWidth);
            food.y = Math.floor(Math.random() * gridHeight);
            valid = !snake.some(seg => seg.x === food.x && seg.y === food.y);
        }
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

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
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
                const dir = btn.dataset.dir;
                if (gameState === 'start' || gameState === 'gameover') {
                    gameState = 'playing';
                    resetGame();
                    return;
                }
                switch (dir) {
                    case 'up': if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
                    case 'down': if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
                    case 'left': if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
                    case 'right': if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
                }
            });
        });
    }

    function handleMessage(e) {
        if (e.data === 'pause' && gameState === 'playing') {
            gameState = 'paused';
        } else if (e.data === 'resume' && gameState === 'paused') {
            gameState = 'playing';
        }
    }

    function handleVisibility() {
        if (document.hidden && gameState === 'playing') {
            gameState = 'paused';
        }
    }

    function handleError(msg, url, line) {
        drawErrorScreen();
        return true;
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

        moveTimer += STEP;
        if (moveTimer < MOVE_INTERVAL) return;
        moveTimer = 0;

        direction = nextDirection;

        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        const gridWidth = Math.floor(CONFIG.CANVAS_WIDTH / CONFIG.GRID_SIZE);
        const gridHeight = Math.floor(CONFIG.CANVAS_HEIGHT / CONFIG.GRID_SIZE);

        if (CONFIG.WRAP_WALLS) {
            if (head.x < 0) head.x = gridWidth - 1;
            if (head.x >= gridWidth) head.x = 0;
            if (head.y < 0) head.y = gridHeight - 1;
            if (head.y >= gridHeight) head.y = 0;
        } else {
            if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
                gameOver();
                return;
            }
        }

        if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            foodEaten++;
            if (foodEaten % CONFIG.FOOD_PER_SPEEDUP === 0) {
                currentSpeed += CONFIG.SPEED_INCREMENT;
            }
            spawnFood();
        } else {
            snake.pop();
        }
    }

    function gameOver() {
        gameState = 'gameover';
        saveHighScore();
    }

    function render() {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'playing' || gameState === 'paused') {
            drawGame();
            if (gameState === 'paused') drawPauseOverlay();
        } else if (gameState === 'gameover') {
            drawGameOverScreen();
        }
    }

    function drawStartScreen() {
        ctx.fillStyle = '#00ff88';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
        ctx.fillText('USE ARROW KEYS TO MOVE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);

        ctx.fillStyle = '#888888';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('HIGH SCORE: ' + highScore, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 20);
    }

    function drawGame() {
        // Draw food
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(
            food.x * CONFIG.GRID_SIZE + 1,
            food.y * CONFIG.GRID_SIZE + 1,
            CONFIG.GRID_SIZE - 2,
            CONFIG.GRID_SIZE - 2
        );

        // Draw snake
        ctx.fillStyle = '#00ff88';
        snake.forEach((seg, i) => {
            if (i === 0) {
                ctx.fillStyle = '#00ff88';
            } else {
                ctx.fillStyle = '#00cc66';
            }
            ctx.fillRect(
                seg.x * CONFIG.GRID_SIZE + 1,
                seg.y * CONFIG.GRID_SIZE + 1,
                CONFIG.GRID_SIZE - 2,
                CONFIG.GRID_SIZE - 2
            );
        });

        // Draw score
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE: ' + score, 5, 15);
        ctx.textAlign = 'right';
        ctx.fillText('HI: ' + highScore, CONFIG.CANVAS_WIDTH - 5, 15);
    }

    function drawPauseOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = '#00ff88';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    }

    function drawGameOverScreen() {
        ctx.fillStyle = '#ff4444';
        ctx.font = '20px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('SCORE: ' + score, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
        ctx.fillText('HIGH SCORE: ' + highScore, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);
        ctx.fillText('PRESS SPACE TO RESTART', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 50);
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

    init();
})();
