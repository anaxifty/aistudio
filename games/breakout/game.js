(function() {
    'use strict';
    const CONFIG = { CANVAS_WIDTH: 320, CANVAS_HEIGHT: 240, FPS: 60, PADDLE_WIDTH: 60, PADDLE_HEIGHT: 10, BALL_SIZE: 8, BRICK_ROWS: 5, BRICK_COLS: 8, BRICK_WIDTH: 36, BRICK_HEIGHT: 15 };
    let canvas, ctx, gameState = 'start', score = 0, highScore = 0, lives = 3, lastTime = 0, accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;
    let paddle = { x: 130, y: 220 }, ball = { x: 160, y: 200, vx: 3, vy: -3 }, bricks = [];
    
    function init() {
        canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS_WIDTH; canvas.height = CONFIG.CANVAS_HEIGHT;
        try { const s = localStorage.getItem('pixelarcade.breakout.highscore'); if (s) highScore = parseInt(s); } catch(e){}
        setupInput(); window.onerror = () => { drawErrorScreen(); return true; };
        window.addEventListener('message', e => { if(e.data==='pause'&&gameState==='playing')gameState='paused'; if(e.data==='resume'&&gameState==='paused')gameState='playing'; });
        resetBricks(); requestAnimationFrame(gameLoop);
    }
    
    function resetBricks() { bricks = []; for(let r=0;r<CONFIG.BRICK_ROWS;r++) for(let c=0;c<CONFIG.BRICK_COLS;c++) bricks.push({x:c*(CONFIG.BRICK_WIDTH+4)+4,y:r*(CONFIG.BRICK_HEIGHT+4)+30,w:CONFIG.BRICK_WIDTH,h:CONFIG.BRICK_HEIGHT,active:true}); }
    
    function setupInput() {
        document.addEventListener('keydown', e => {
            if ((gameState === 'start' || gameState === 'gameover') && (e.code === 'Space' || e.code === 'Enter')) {
                gameState = 'playing'; resetBall(); score = 0; lives = 3; resetBricks(); return;
            }
            if (gameState !== 'playing') return;
            if (e.code === 'ArrowLeft' && paddle.x > 0) paddle.x -= 25;
            if (e.code === 'ArrowRight' && paddle.x < CONFIG.CANVAS_WIDTH - CONFIG.PADDLE_WIDTH) paddle.x += 25;
        });
    }
    
    function resetBall() { ball.x = paddle.x + CONFIG.PADDLE_WIDTH/2; ball.y = paddle.y - CONFIG.BALL_SIZE; ball.vx = 3*(Math.random()>0.5?1:-1); ball.vy = -3; }
    
    function update() {
        if (gameState !== 'playing') return;
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x <= 0 || ball.x >= CONFIG.CANVAS_WIDTH - CONFIG.BALL_SIZE) ball.vx = -ball.vx;
        if (ball.y <= 0) ball.vy = -ball.vy;
        if (ball.y >= CONFIG.CANVAS_HEIGHT - CONFIG.BALL_SIZE) { lives--; if(lives<=0)gameOver(); else resetBall(); return; }
        
        // Paddle collision
        if (ball.y + CONFIG.BALL_SIZE >= paddle.y && ball.x + CONFIG.BALL_SIZE >= paddle.x && ball.x <= paddle.x + CONFIG.PADDLE_WIDTH) {
            ball.vy = -Math.abs(ball.vy); ball.vx += (ball.x - (paddle.x + CONFIG.PADDLE_WIDTH/2)) * 0.1;
        }
        
        // Brick collision
        bricks.forEach(b => { if(b.active && ball.x+CONFIG.BALL_SIZE>=b.x && ball.x<=b.x+b.w && ball.y+CONFIG.BALL_SIZE>=b.y && ball.y<=b.y+b.h) { b.active=false; ball.vy=-ball.vy; score+=10; }});
    }
    
    function gameOver() { gameState = 'gameover'; if(score>highScore){highScore=score;try{localStorage.setItem('pixelarcade.breakout.highscore',highScore);}catch(e){}} }
    
    function render() {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);
        if (gameState === 'start') {
            ctx.fillStyle = '#00ff88'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('BREAKOUT', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 30);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '8px "Press Start 2P"';
            ctx.fillText('ARROWS to move', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2);
            ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 20);
        } else if (gameState === 'playing' || gameState === 'paused') {
            ctx.fillStyle = '#00ff88'; ctx.fillRect(paddle.x,paddle.y,CONFIG.PADDLE_WIDTH,CONFIG.PADDLE_HEIGHT);
            ctx.fillRect(ball.x,ball.y,CONFIG.BALL_SIZE,CONFIG.BALL_SIZE);
            ['#ff4444','#ffa500','#ffff00','#00ff00','#00ffff'].forEach((col,i) => {
                bricks.filter(b=>b.active&&Math.floor(b.y/20)===i).forEach(b => { ctx.fillStyle=col; ctx.fillRect(b.x,b.y,b.w,b.h); });
            });
            ctx.fillStyle = '#e0e0e0'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'left';
            ctx.fillText('SCORE:'+score, 5, 15); ctx.textAlign = 'right'; ctx.fillText('LIVES:'+lives, CONFIG.CANVAS_WIDTH-5, 15);
            if(gameState==='paused'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);ctx.fillStyle='#00ff88';ctx.textAlign='center';ctx.fillText('PAUSED',CONFIG.CANVAS_WIDTH/2,CONFIG.CANVAS_HEIGHT/2);}
        } else if (gameState === 'gameover') {
            ctx.fillStyle = '#ff4444'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 20);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '10px "Press Start 2P"';
            ctx.fillText('SCORE: '+score, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 10);
            ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 30);
        }
    }
    
    function gameLoop(ts) { const delta = ts - lastTime; lastTime = ts; accumulator += delta; while(accumulator>=STEP){update();accumulator-=STEP;} render(); requestAnimationFrame(gameLoop); }
    init();
})();