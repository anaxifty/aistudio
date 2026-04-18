(function() {
    'use strict';
    const CONFIG = { CANVAS_WIDTH: 320, CANVAS_HEIGHT: 240, FPS: 60, PADDLE_HEIGHT: 40, PADDLE_WIDTH: 8, BALL_SIZE: 8, AI_DIFFICULTY: 0.7, WIN_SCORE: 5 };
    let canvas, ctx, gameState = 'start', score = 0, highScore = 0, lastTime = 0, accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;
    let paddle1 = { x: 10, y: 100, score: 0 }, paddle2 = { x: 302, y: 100, score: 0 }, ball = { x: 160, y: 120, vx: 3, vy: 2 };
    
    function init() {
        canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS_WIDTH; canvas.height = CONFIG.CANVAS_HEIGHT;
        try { const s = localStorage.getItem('pixelarcade.pong.highscore'); if (s) highScore = parseInt(s); } catch(e){}
        setupInput(); window.onerror = () => { drawErrorScreen(); return true; };
        window.addEventListener('message', e => { if(e.data==='pause'&&gameState==='playing')gameState='paused'; if(e.data==='resume'&&gameState==='paused')gameState='playing'; });
        requestAnimationFrame(gameLoop);
    }
    
    function setupInput() {
        document.addEventListener('keydown', e => {
            if ((gameState === 'start' || gameState === 'gameover') && (e.code === 'Space' || e.code === 'Enter')) {
                gameState = 'playing'; resetBall(); paddle1.score = 0; paddle2.score = 0; return;
            }
            if (gameState !== 'playing') return;
            if (e.code === 'KeyW' && paddle1.y > 0) paddle1.y -= 20;
            if (e.code === 'KeyS' && paddle1.y < CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT) paddle1.y += 20;
        });
    }
    
    function resetBall() { ball.x = CONFIG.CANVAS_WIDTH/2; ball.y = CONFIG.CANVAS_HEIGHT/2; ball.vx = (Math.random()>0.5?3:-3); ball.vy = (Math.random()*4-2); }
    
    function update() {
        if (gameState !== 'playing') return;
        // AI
        const targetY = ball.y - CONFIG.PADDLE_HEIGHT/2;
        if (targetY > paddle2.y + 10) paddle2.y += 4 * CONFIG.AI_DIFFICULTY;
        else if (targetY < paddle2.y - 10) paddle2.y -= 4 * CONFIG.AI_DIFFICULTY;
        paddle2.y = Math.max(0, Math.min(CONFIG.CANVAS_HEIGHT - CONFIG.PADDLE_HEIGHT, paddle2.y));
        
        // Ball movement
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.y <= 0 || ball.y >= CONFIG.CANVAS_HEIGHT - CONFIG.BALL_SIZE) ball.vy = -ball.vy;
        
        // Paddle collision
        if (ball.x <= paddle1.x + CONFIG.PADDLE_WIDTH && ball.y + CONFIG.BALL_SIZE >= paddle1.y && ball.y <= paddle1.y + CONFIG.PADDLE_HEIGHT) {
            ball.vx = Math.abs(ball.vx) + 0.2; ball.vy += (ball.y - (paddle1.y + CONFIG.PADDLE_HEIGHT/2)) * 0.1;
        }
        if (ball.x + CONFIG.BALL_SIZE >= paddle2.x && ball.y + CONFIG.BALL_SIZE >= paddle2.y && ball.y <= paddle2.y + CONFIG.PADDLE_HEIGHT) {
            ball.vx = -Math.abs(ball.vx) - 0.2; ball.vy += (ball.y - (paddle2.y + CONFIG.PADDLE_HEIGHT/2)) * 0.1;
        }
        
        // Scoring
        if (ball.x < 0) { paddle2.score++; if(paddle2.score>=CONFIG.WIN_SCORE)gameOver(); else resetBall(); }
        if (ball.x > CONFIG.CANVAS_WIDTH) { paddle1.score++; score = paddle1.score; if(paddle1.score>=CONFIG.WIN_SCORE)gameOver(); else resetBall(); }
    }
    
    function gameOver() { gameState = 'gameover'; if(score>highScore){highScore=score;try{localStorage.setItem('pixelarcade.pong.highscore',highScore);}catch(e){}} }
    
    function render() {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);
        if (gameState === 'start') {
            ctx.fillStyle = '#00ff88'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('PONG', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 30);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '8px "Press Start 2P"';
            ctx.fillText('W/S or UP/DOWN', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2);
            ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 20);
        } else if (gameState === 'playing') {
            ctx.fillStyle = '#2a2a2a'; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(CONFIG.CANVAS_WIDTH/2,0); ctx.lineTo(CONFIG.CANVAS_WIDTH/2,CONFIG.CANVAS_HEIGHT); ctx.stroke();
            ctx.fillStyle = '#00ff88'; ctx.fillRect(paddle1.x,paddle1.y,CONFIG.PADDLE_WIDTH,CONFIG.PADDLE_HEIGHT);
            ctx.fillRect(paddle2.x,paddle2.y,CONFIG.PADDLE_WIDTH,CONFIG.PADDLE_HEIGHT);
            ctx.fillRect(ball.x,ball.y,CONFIG.BALL_SIZE,CONFIG.BALL_SIZE);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText(paddle1.score, CONFIG.CANVAS_WIDTH/2 - 40, 30);
            ctx.fillText(paddle2.score, CONFIG.CANVAS_WIDTH/2 + 40, 30);
        } else if (gameState === 'gameover') {
            ctx.fillStyle = '#ff4444'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 20);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '10px "Press Start 2P"';
            ctx.fillText('SCORE: '+paddle1.score, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 10);
            ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 30);
        }
    }
    
    function gameLoop(ts) { const delta = ts - lastTime; lastTime = ts; accumulator += delta; while(accumulator>=STEP){update();accumulator-=STEP;} render(); requestAnimationFrame(gameLoop); }
    init();
})();