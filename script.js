const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Leaderboard Elements
const leaderboardList = document.getElementById('leaderboard-list');
const newHighScoreSection = document.getElementById('new-high-score-section');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');

// Game Constants
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100; // ms

// Game State
let score = 0;
let highScore = 0; // Will be updated from leaderboard
let snake = [];
let food = { x: 0, y: 0 };
let velocity = { x: 0, y: 0 };
let gameLoopId = null;
let isGameRunning = false;
let lastRenderTime = 0;

// Leaderboard Data
let leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];

// Initialize
updateLeaderboardUI();
updateHighScoreDisplay();

// Input Handling
document.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
saveScoreBtn.addEventListener('click', saveScore);

function handleInput(e) {
    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (velocity.y !== 1) velocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (velocity.y !== -1) velocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (velocity.x !== 1) velocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (velocity.x !== -1) velocity = { x: 1, y: 0 };
            break;
    }
}

function startGame() {
    // Reset State
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    velocity = { x: 0, y: -1 }; // Start moving up
    score = 0;
    scoreElement.textContent = score;
    isGameRunning = true;

    // Hide Overlays
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    newHighScoreSection.classList.add('hidden'); // Ensure this is hidden

    // Place initial food
    placeFood();

    // Start Loop
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    lastRenderTime = 0;
    requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!isGameRunning) return;

    gameLoopId = requestAnimationFrame(gameLoop);

    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < GAME_SPEED / 1000) return;

    lastRenderTime = currentTime;

    update();
    draw();
}

function update() {
    // Move Snake
    const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Check Collisions
    if (isCollision(head)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Check Food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
        }
        placeFood();
    } else {
        snake.pop();
    }
}

function isCollision(position) {
    // Wall Collision
    if (position.x < 0 || position.x >= TILE_COUNT ||
        position.y < 0 || position.y >= TILE_COUNT) {
        return true;
    }

    // Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (position.x === snake[i].x && position.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function placeFood() {
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };

        validPosition = true;
        // Make sure food doesn't spawn on snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                validPosition = false;
                break;
            }
        }
    }
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoopId);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');

    checkLeaderboard();
}

function draw() {
    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = '#00ff9d';

        // Head is slightly different color or just same
        if (index === 0) {
            ctx.fillStyle = '#ccffeb';
            // Add glow to head
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff9d';
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );

        ctx.shadowBlur = 0; // Reset shadow
    });

    // Draw Food
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Leaderboard Functions
function updateHighScoreDisplay() {
    if (leaderboard.length > 0) {
        highScore = leaderboard[0].score;
    } else {
        highScore = 0;
    }
    highScoreElement.textContent = highScore;
}

function updateLeaderboardUI() {
    leaderboardList.innerHTML = '';

    // Sort just in case
    leaderboard.sort((a, b) => b.score - a.score);

    // Take top 5
    const top5 = leaderboard.slice(0, 5);

    if (top5.length === 0) {
        leaderboardList.innerHTML = '<li class="leaderboard-item" style="justify-content:center; color:rgba(255,255,255,0.3)">暫無紀錄</li>';
        return;
    }

    top5.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        li.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        leaderboardList.appendChild(li);
    });
}

function checkLeaderboard() {
    // Check if score qualifies for top 5
    const isHighScore = leaderboard.length < 5 || (leaderboard.length > 0 && score > leaderboard[leaderboard.length - 1].score);

    if (isHighScore && score > 0) {
        newHighScoreSection.classList.remove('hidden');
        playerNameInput.value = '';
        playerNameInput.focus();
        restartBtn.classList.add('hidden'); // Hide restart until saved
    } else {
        newHighScoreSection.classList.add('hidden');
        restartBtn.classList.remove('hidden');
    }
}

function saveScore() {
    const name = playerNameInput.value.trim() || '無名氏';

    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5); // Keep top 5

    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));

    updateLeaderboardUI();
    updateHighScoreDisplay();

    newHighScoreSection.classList.add('hidden');
    restartBtn.classList.remove('hidden');

    // Show start screen to see leaderboard
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}
