import { database, ref, push, set, onValue, query, orderByChild, limitToLast } from './firebase-config.js';

// Game constants
const CANVAS_SIZE = 500;
const GRID_SIZE = 25;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

// Game state
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = 0;
let gameLoop = null;
let isPaused = false;
let gameSpeed = INITIAL_SPEED;

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Load high score from localStorage
    highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
    updateScoreDisplay();

    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('submitScore').addEventListener('click', submitScore);

    // Load leaderboard
    loadLeaderboard();

    // Start game
    initGame();
    gameLoop = setInterval(updateGame, gameSpeed);
});

function initGame() {
    // Initialize snake in the middle
    snake = [
        { x: 12, y: 12 },
        { x: 11, y: 12 },
        { x: 10, y: 12 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    updateScoreDisplay();
    spawnFood();
}

function spawnFood() {
    let newFood;
    let isOnSnake;

    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };

        // Check if food spawned on snake
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);

    food = newFood;
}

function handleKeyPress(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        return;
    }

    if (isPaused) return;

    const key = e.key;

    // Prevent opposite direction
    if (key === 'ArrowUp' && direction !== 'down') nextDirection = 'up';
    if (key === 'ArrowDown' && direction !== 'up') nextDirection = 'down';
    if (key === 'ArrowLeft' && direction !== 'right') nextDirection = 'left';
    if (key === 'ArrowRight' && direction !== 'left') nextDirection = 'right';
}

function togglePause() {
    isPaused = !isPaused;
}

function updateGame() {
    if (isPaused) return;

    direction = nextDirection;

    // Calculate new head position
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScoreDisplay();
        spawnFood();

        // Increase speed slightly
        if (score % 50 === 0) {
            gameSpeed = Math.max(50, gameSpeed - SPEED_INCREMENT);
            clearInterval(gameLoop);
            gameLoop = setInterval(updateGame, gameSpeed);
        }
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(5, 8, 22, 0.8)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw food with glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake with gradient
    snake.forEach((segment, index) => {
        const opacity = 1 - (index / snake.length) * 0.5;

        if (index === 0) {
            // Head - brighter
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff';
        } else {
            ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.shadowBlur = 5;
        }

        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
        ctx.shadowBlur = 0;
    });

    // Draw pause indicator
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 48px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暫停', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
}

function gameOver() {
    clearInterval(gameLoop);

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateScoreDisplay();
    }

    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.add('active');
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('playerName').value = '';
    initGame();
    clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, gameSpeed);
}

function submitScore() {
    const playerName = document.getElementById('playerName').value.trim();

    if (!playerName) {
        alert('請輸入你的名字！');
        return;
    }

    if (!database) {
        alert('Firebase 資料庫尚未啟用。分數已儲存在本地。');
        restartGame();
        return;
    }

    // Save to Firebase
    const scoresRef = ref(database, 'scores');
    const newScoreRef = push(scoresRef);

    set(newScoreRef, {
        name: playerName,
        score: score,
        timestamp: Date.now()
    }).then(() => {
        console.log('Score saved successfully!');
        document.getElementById('submitScore').textContent = '✓ 已提交';
        document.getElementById('submitScore').disabled = true;

        setTimeout(() => {
            restartGame();
            document.getElementById('submitScore').textContent = '提交分數';
            document.getElementById('submitScore').disabled = false;
        }, 1500);
    }).catch((error) => {
        console.error('Error saving score:', error);
        alert('儲存分數時發生錯誤。請檢查網路連線。');
    });
}

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');

    if (!database) {
        leaderboardList.innerHTML = '<div class="no-scores">請先啟用 Firebase Realtime Database</div>';
        return;
    }

    const scoresRef = ref(database, 'scores');
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(10));

    onValue(topScoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push(childSnapshot.val());
        });

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        if (scores.length === 0) {
            leaderboardList.innerHTML = '<div class="no-scores">還沒有分數記錄</div>';
            return;
        }

        leaderboardList.innerHTML = scores.map((scoreData, index) => {
            const rank = index + 1;
            const topClass = rank <= 3 ? `top-${rank}` : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            return `
                <div class="leaderboard-item ${topClass}">
                    <div class="player-info">
                        <span class="rank">${medal || rank}</span>
                        <span class="player-name">${scoreData.name}</span>
                    </div>
                    <span class="player-score">${scoreData.score}</span>
                </div>
            `;
        }).join('');
    }, (error) => {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<div class="no-scores">載入排行榜時發生錯誤</div>';
    });
}
