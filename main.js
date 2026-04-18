(function() {
    'use strict';

    // Game metadata - add new games by adding entries to this array
    const GAMES = [
        { name: 'Snake', description: 'Classic grid-based snake. Eat food, grow longer.', folder: 'snake' },
        { name: 'Tetris', description: 'Stack falling tetrominoes and clear lines.', folder: 'tetris' },
        { name: 'Pong', description: 'Two-player paddle battle or vs AI.', folder: 'pong' },
        { name: 'Breakout', description: 'Destroy bricks with a bouncing ball.', folder: 'breakout' },
        { name: 'Pac-Man', description: 'Navigate maze, eat dots, avoid ghosts.', folder: 'pacman' },
        { name: 'Space Invaders', description: 'Shoot descending aliens before they reach you.', folder: 'space-invaders' },
        { name: 'Asteroids', description: 'Destroy asteroids in your vector ship.', folder: 'asteroids' },
        { name: 'Chrome Dino', description: 'Endless runner avoiding cacti and birds.', folder: 'chrome-dino' },
        { name: 'Boulder Dash', description: 'Dig through dirt, collect diamonds, avoid boulders.', folder: 'boulder-dash' },
        { name: 'Lode Runner', description: 'Collect gold while avoiding enemies.', folder: 'lode-runner' },
        { name: 'Bomb Jack', description: 'Collect bombs in sequence on platforms.', folder: 'bomb-jack' },
        { name: 'Bubble Bobble', description: 'Trap enemies in bubbles and pop them.', folder: 'bubble-bobble' },
        { name: 'Pinball', description: 'Classic pinball with flippers and bumpers.', folder: 'pinball' },
        { name: 'Top-Down Racing', description: 'Race around a track, beat your best lap.', folder: 'top-down-racing' },
        { name: 'Mini Golf', description: 'Sink the ball in 5 holes with style.', folder: 'mini-golf' },
        { name: 'Platform Jumper', description: 'Bounce off platforms, reach new heights.', folder: 'platform-jumper' },
        { name: 'Helicopter Flyer', description: 'Navigate through a scrolling cave.', folder: 'helicopter-flyer' },
        { name: 'Grid Tactics', description: 'Turn-based tactical combat on a grid.', folder: 'grid-tactics' },
        { name: 'Puzzle Block Pusher', description: 'Push blocks onto target squares.', folder: 'puzzle-pusher' },
        { name: 'Endless Runner', description: 'Auto-running platformer with jumps and slides.', folder: 'endless-runner' }
    ];

    // DOM elements
    const gameGrid = document.getElementById('gameGrid');
    const searchInput = document.getElementById('searchInput');
    const muteToggle = document.getElementById('muteToggle');
    const gameModal = document.getElementById('gameModal');
    const exitBtn = document.getElementById('exitBtn');
    const gameFrame = document.getElementById('gameFrame');

    // State
    let isMuted = false;
    let currentGame = null;

    // Initialize
    function init() {
        renderGameGrid(GAMES);
        setupEventListeners();
    }

    // Render game cards
    function renderGameGrid(games) {
        gameGrid.innerHTML = '';
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.name = game.name.toLowerCase();
            card.innerHTML = `
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <button class="play-btn" data-folder="${game.folder}">PLAY</button>
            `;
            gameGrid.appendChild(card);
        });

        // Add click listeners to play buttons
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const folder = btn.dataset.folder;
                launchGame(folder);
            });
        });
    }

    // Filter games by search term
    function filterGames(term) {
        const filtered = GAMES.filter(game => 
            game.name.toLowerCase().includes(term.toLowerCase()) ||
            game.description.toLowerCase().includes(term.toLowerCase())
        );
        renderGameGrid(filtered);
    }

    // Launch game in modal
    function launchGame(folder) {
        currentGame = folder;
        gameFrame.src = `games/${folder}/index.html`;
        gameModal.hidden = false;
        document.body.style.overflow = 'hidden';
        
        // Send mute state to game after it loads
        gameFrame.addEventListener('load', () => {
            if (isMuted) {
                gameFrame.contentWindow.postMessage('mute', '*');
            }
        }, { once: true });
    }

    // Exit game - destroy iframe completely
    function exitGame() {
        gameFrame.src = 'about:blank';
        gameModal.hidden = true;
        document.body.style.overflow = '';
        currentGame = null;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search input
        searchInput.addEventListener('input', (e) => {
            filterGames(e.target.value.trim());
        });

        // Mute toggle
        muteToggle.addEventListener('click', () => {
            isMuted = !isMuted;
            muteToggle.classList.toggle('muted', isMuted);
            muteToggle.querySelector('.mute-icon').textContent = isMuted ? '🔇' : '🔊';
            
            if (currentGame) {
                gameFrame.contentWindow.postMessage(isMuted ? 'mute' : 'unmute', '*');
            }
        });

        // Exit button
        exitBtn.addEventListener('click', exitGame);

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && !gameModal.hidden) {
                exitGame();
            }
        });

        // Click on backdrop to close
        gameModal.querySelector('.modal-backdrop').addEventListener('click', exitGame);
    }

    // Start
    init();
})();
