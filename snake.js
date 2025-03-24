// JSDOS: 貪吃蛇遊戲邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 遊戲常量
    const GRID_SIZE = 20; // 網格大小
    const CELL_SIZE = 20; // 單元格大小（像素）
    
    // 遊戲變量
    let rows = GRID_SIZE;
    let cols = GRID_SIZE;
    let snake = []; // 蛇身坐標數組
    let food = {}; // 食物坐標
    let direction = 'right'; // 移動方向
    let nextDirection = 'right'; // 下一步方向
    let gameInterval; // 遊戲循環定時器
    let speed = 150; // 移動速度（毫秒）
    let score = 0; // 當前得分
    let highScore = localStorage.getItem('snakeHighScore') || 0; // 最高分
    let isPaused = false; // 是否暫停
    let gameActive = false; // 遊戲是否進行中
    let difficulty = 'easy'; // 遊戲難度
    
    // 移動方向映射
    const directionMap = {
        'up': { dx: 0, dy: -1 },
        'down': { dx: 0, dy: 1 },
        'left': { dx: -1, dy: 0 },
        'right': { dx: 1, dy: 0 }
    };
    
    // 獲取DOM元素
    const modeSelectionElement = document.getElementById('mode-selection');
    const gameBoardContainer = document.getElementById('game-board-container');
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const difficultyElement = document.getElementById('difficulty');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');
    const mobileControls = document.getElementById('mobile-controls');
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // 遊戲模式選擇按鈕
    easyBtn.addEventListener('click', () => {
        difficulty = 'easy';
        speed = 150;
        difficultyElement.textContent = '簡單';
        initGame();
    });
    
    normalBtn.addEventListener('click', () => {
        difficulty = 'normal';
        speed = 100;
        difficultyElement.textContent = '普通';
        initGame();
    });
    
    hardBtn.addEventListener('click', () => {
        difficulty = 'hard';
        speed = 70;
        difficultyElement.textContent = '困難';
        initGame();
    });
    
    // 初始化遊戲
    function initGame() {
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        
        // 重置遊戲狀態
        snake = [
            {x: Math.floor(cols / 2), y: Math.floor(rows / 2)},
            {x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2)},
            {x: Math.floor(cols / 2) - 2, y: Math.floor(rows / 2)}
        ];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        isPaused = false;
        gameActive = true;
        pauseBtn.textContent = '暫停';
        
        // 更新分數顯示
        scoreElement.textContent = score;
        
        // 創建遊戲網格
        createGameGrid();
        
        // 生成食物
        generateFood();
        
        // 啟動遊戲循環
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
        
        // 調整遊戲面板大小
        resizeGameBoard();
    }
    
    // 創建遊戲網格
    function createGameGrid() {
        gameBoardElement.innerHTML = '';
        gameBoardElement.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
        gameBoardElement.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gameBoardElement.appendChild(cell);
            }
        }
    }
    
    // 遊戲主循環
    function gameLoop() {
        if (isPaused || !gameActive) return;
        
        // 更新蛇的方向
        direction = nextDirection;
        
        // 獲取蛇頭位置
        const head = {...snake[0]};
        
        // 根據方向移動蛇頭
        head.x += directionMap[direction].dx;
        head.y += directionMap[direction].dy;
        
        // 檢查是否撞牆（困難模式）
        if (difficulty === 'hard') {
            if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
                gameOver();
                return;
            }
        } else {
            // 簡單和普通模式：穿牆
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;
        }
        
        // 檢查是否撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver();
                return;
            }
        }
        
        // 將新頭部加入蛇身
        snake.unshift(head);
        
        // 檢查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分數
            score++;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新食物
            generateFood();
            
            // 加快速度（可選）
            if (score % 5 === 0) {
                clearInterval(gameInterval);
                speed = Math.max(speed - 5, 50);
                gameInterval = setInterval(gameLoop, speed);
            }
        } else {
            // 如果沒吃到食物，移除尾部
            snake.pop();
        }
        
        // 更新遊戲界面
        updateGameDisplay();
    }
    
    // 生成食物
    function generateFood() {
        let validPosition = false;
        
        while (!validPosition) {
            food = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
            
            validPosition = true;
            
            // 確保食物不會出現在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === food.x && snake[i].y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        // 標記食物單元格
        const foodCell = document.querySelector(`.cell[data-row="${food.y}"][data-col="${food.x}"]`);
        if (foodCell) {
            foodCell.classList.add('food');
        }
    }
    
    // 更新遊戲界面
    function updateGameDisplay() {
        // 清除所有標記
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('snake', 'snake-head', 'food');
        });
        
        // 標記蛇身
        snake.forEach((segment, index) => {
            const cell = document.querySelector(`.cell[data-row="${segment.y}"][data-col="${segment.x}"]`);
            if (cell) {
                if (index === 0) {
                    cell.classList.add('snake-head');
                } else {
                    cell.classList.add('snake');
                }
            }
        });
        
        // 標記食物
        const foodCell = document.querySelector(`.cell[data-row="${food.y}"][data-col="${food.x}"]`);
        if (foodCell) {
            foodCell.classList.add('food');
        }
    }
    
    // 遊戲結束
    function gameOver() {
        gameActive = false;
        clearInterval(gameInterval);
        
        // 顯示遊戲結束彈窗
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'block';
    }
    
    // 暫停/繼續遊戲
    pauseBtn.addEventListener('click', () => {
        if (!gameActive) return;
        
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? '繼續' : '暫停';
    });
    
    // 重新開始遊戲
    resetBtn.addEventListener('click', () => {
        clearInterval(gameInterval);
        initGame();
    });
    
    // 返回選單
    returnMenuBtn.addEventListener('click', () => {
        clearInterval(gameInterval);
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
    });
    
    // 彈窗按鈕
    playAgainBtn.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        initGame();
    });
    
    menuBtn.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
    });
    
    // 鍵盤控制
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowUp':
                if (direction !== 'down' && gameActive && !isPaused) {
                    nextDirection = 'up';
                }
                break;
            case 'ArrowDown':
                if (direction !== 'up' && gameActive && !isPaused) {
                    nextDirection = 'down';
                }
                break;
            case 'ArrowLeft':
                if (direction !== 'right' && gameActive && !isPaused) {
                    nextDirection = 'left';
                }
                break;
            case 'ArrowRight':
                if (direction !== 'left' && gameActive && !isPaused) {
                    nextDirection = 'right';
                }
                break;
            case ' ':
                // 空格鍵暫停/繼續
                if (gameActive) {
                    isPaused = !isPaused;
                    pauseBtn.textContent = isPaused ? '繼續' : '暫停';
                }
                break;
        }
    });
    
    // 移動設備控制 - 確保按鈕正常工作
    // 為了防止重複觸發，使用觸摸事件
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默認行為
        if (direction !== 'down' && gameActive && !isPaused) {
            nextDirection = 'up';
        }
    });
    
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默認行為
        if (direction !== 'up' && gameActive && !isPaused) {
            nextDirection = 'down';
        }
    });
    
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默認行為
        if (direction !== 'right' && gameActive && !isPaused) {
            nextDirection = 'left';
        }
    });
    
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默認行為
        if (direction !== 'left' && gameActive && !isPaused) {
            nextDirection = 'right';
        }
    });
    
    // 同時支持鼠標點擊
    upBtn.addEventListener('click', function() {
        if (direction !== 'down' && gameActive && !isPaused) {
            nextDirection = 'up';
        }
    });
    
    downBtn.addEventListener('click', function() {
        if (direction !== 'up' && gameActive && !isPaused) {
            nextDirection = 'down';
        }
    });
    
    leftBtn.addEventListener('click', function() {
        if (direction !== 'right' && gameActive && !isPaused) {
            nextDirection = 'left';
        }
    });
    
    rightBtn.addEventListener('click', function() {
        if (direction !== 'left' && gameActive && !isPaused) {
            nextDirection = 'right';
        }
    });
    
    // 設置高分
    highScoreElement.textContent = highScore;
    
    // 適配窗口大小
    function resizeGameBoard() {
        const maxSize = Math.min(window.innerWidth - 40, 400);
        const cellSize = Math.floor(maxSize / cols);
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
        });
        
        gameBoardElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gameBoardElement.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    }
    
    window.addEventListener('resize', resizeGameBoard);
}); 