(function() {
    'use strict';
    const CONFIG = { CANVAS_WIDTH: 320, CANVAS_HEIGHT: 240, FPS: 60 };
    let canvas, ctx, gameState = 'start', score = 0, highScore = 0, lastTime = 0, accumulator = 0;
    const STEP = 1000 / CONFIG.FPS;
    
    function init() {
        canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS_WIDTH; canvas.height = CONFIG.CANVAS_HEIGHT;
        try { const s = localStorage.getItem('pixelarcade.pacman.highscore'); if (s) highScore = parseInt(s); } catch(e){}
        setupInput(); window.onerror = () => { drawErrorScreen(); return true; };
        window.addEventListener('message', e => { if(e.data==='pause'&&gameState==='playing')gameState='paused'; if(e.data==='resume'&&gameState==='paused')gameState='playing'; });
        requestAnimationFrame(gameLoop);
    }
    
    function setupInput() {
        document.addEventListener('keydown', e => {
            if ((gameState === 'start' || gameState === 'gameover') && (e.code === 'Space' || e.code === 'Enter')) {
                gameState = 'playing'; score = 0; return;
            }
            if (gameState !== 'playing') return;
            // Add game controls here
        });
    }
    
    function update() {
        if (gameState !== 'playing') return;
        // Game logic here
    }
    
    function gameOver() { 
        gameState = 'gameover'; 
        if(score>highScore){highScore=score;try{localStorage.setItem('pixelarcade.pacman.highscore',highScore);}catch(e){}} 
    }
    
    function render() {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);
        if (gameState === 'start') {
            ctx.fillStyle = '#00ff88'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('PACMAN', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 30);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '8px "Press Start 2P"';
            ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 10);
            ctx.fillStyle = '#888888'; ctx.fillText('HI: ' + highScore, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT - 20);
        } else if (gameState === 'playing' || gameState === 'paused') {
            ctx.fillStyle = '#e0e0e0'; ctx.font = '10px "Press Start 2P"'; ctx.textAlign = 'left';
            ctx.fillText('SCORE: ' + score, 5, 15);
            if(gameState==='paused'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);ctx.fillStyle='#00ff88';ctx.textAlign='center';ctx.fillText('PAUSED',CONFIG.CANVAS_WIDTH/2,CONFIG.CANVAS_HEIGHT/2);}
        } else if (gameState === 'gameover') {
            ctx.fillStyle = '#ff4444'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 20);
            ctx.fillStyle = '#e0e0e0'; ctx.font = '10px "Press Start 2P"';
            ctx.fillText('SCORE: ' + score, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 10);
            ctx.fillText('HI: ' + highScore, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 30);
            ctx.fillText('PRESS SPACE', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 50);
        }
    }
    
    function drawErrorScreen() {
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,CONFIG.CANVAS_WIDTH,CONFIG.CANVAS_HEIGHT);
        ctx.fillStyle = '#ff4444'; ctx.font = '10px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('Game failed to load', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 10);
        ctx.fillText('Try refreshing', CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 + 10);
    }
    
    function gameLoop(ts) { const delta = ts - lastTime; lastTime = ts; accumulator += delta; while(accumulator>=STEP){update();accumulator-=STEP;} render(); requestAnimationFrame(gameLoop); }
    init();
})();