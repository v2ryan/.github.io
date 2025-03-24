// JSDOS: 贪吃蛇游戏逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 游戏常量
    const GRID_SIZE = 20; // 网格大小
    const CELL_SIZE = 20; // 单元格大小（像素）
    
    // 游戏变量
    let rows = GRID_SIZE;
    let cols = GRID_SIZE;
    let snake = []; // 蛇身坐标数组
    let food = {}; // 食物坐标
    let direction = 'right'; // 移动方向
    let nextDirection = 'right'; // 下一步方向
    let gameInterval; // 游戏循环定时器
    let speed = 150; // 移动速度（毫秒）
    let score = 0; // 当前得分
    let highScore = localStorage.getItem('snakeHighScore') || 0; // 最高分
    let isPaused = false; // 是否暂停
    let gameActive = false; // 游戏是否进行中
    let difficulty = 'easy'; // 游戏难度
    
    // 移动方向映射
    const directionMap = {
        'up': { dx: 0, dy: -1 },
        'down': { dx: 0, dy: 1 },
        'left': { dx: -1, dy: 0 },
        'right': { dx: 1, dy: 0 }
    };
    
    // 获取DOM元素
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
    
    // 游戏难度选择
    easyBtn.addEventListener('click', () => {
        difficulty = 'easy';
        speed = 150;
        difficultyElement.textContent = '简单';
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
        difficultyElement.textContent = '困难';
        initGame();
    });
    
    // 初始化游戏
    function initGame() {
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        
        // 重置游戏状态
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
        pauseBtn.textContent = '暂停';
        
        // 更新分数显示
        scoreElement.textContent = score;
        
        // 创建游戏网格
        createGameGrid();
        
        // 生成食物
        generateFood();
        
        // 启动游戏循环
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
        
        // 调整网格大小
        resizeGameBoard();
    }
    
    // 创建游戏网格
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
    
    // 更新游戏显示
    function updateGameDisplay() {
        // 清除所有单元格的类
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('snake', 'snake-head', 'food');
        });
        
        // 显示蛇身
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
        
        // 显示食物
        const foodCell = document.querySelector(`.cell[data-row="${food.y}"][data-col="${food.x}"]`);
        if (foodCell) {
            foodCell.classList.add('food');
        }
    }
    
    // 生成食物
    function generateFood() {
        while (true) {
            food = {
                x: Math.floor(Math.random() * cols),
                y: Math.floor(Math.random() * rows)
            };
            
            // 确保食物不会生成在蛇身上
            let onSnake = false;
            for (const segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    onSnake = true;
                    break;
                }
            }
            
            if (!onSnake) break;
        }
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || !gameActive) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 移动蛇
        moveSnake();
        
        // 检查游戏状态（碰撞等）
        checkGameState();
        
        // 更新显示
        updateGameDisplay();
    }
    
    // 移动蛇
    function moveSnake() {
        // 获取蛇头位置
        const head = { x: snake[0].x, y: snake[0].y };
        
        // 根据方向移动蛇头
        const move = directionMap[direction];
        head.x += move.dx;
        head.y += move.dy;
        
        // 处理边界，根据难度决定是否允许穿墙
        if (difficulty === 'hard') {
            // 困难模式：撞墙游戏结束
            if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
                gameActive = false;
                showGameOver();
                return;
            }
        } else {
            // 简单/普通模式：允许穿墙
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;
        }
        
        // 将新头部添加到蛇身数组前面
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score++;
            scoreElement.textContent = score;
            
            // 如果超过最高分，更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除蛇尾
            snake.pop();
        }
    }
    
    // 检查游戏状态
    function checkGameState() {
        // 获取蛇头
        const head = snake[0];
        
        // 检查是否撞到自己
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameActive = false;
                showGameOver();
                return;
            }
        }
    }
    
    // 显示游戏结束
    function showGameOver() {
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'block';
        clearInterval(gameInterval);
    }
    
    // 暂停/继续游戏
    pauseBtn.addEventListener('click', function() {
        if (!gameActive) return;
        
        isPaused = !isPaused;
        this.textContent = isPaused ? '继续' : '暂停';
    });
    
    // 重置游戏
    resetBtn.addEventListener('click', resetGame);
    
    function resetGame() {
        gameOverModal.style.display = 'none';
        initGame();
    }
    
    // 返回菜单
    returnMenuBtn.addEventListener('click', returnToMenu);
    menuBtn.addEventListener('click', returnToMenu);
    
    function returnToMenu() {
        clearInterval(gameInterval);
        gameOverModal.style.display = 'none';
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
    }
    
    // 再玩一次
    playAgainBtn.addEventListener('click', resetGame);
    
    // 键盘控制
    document.addEventListener('keydown', function(e) {
        if (!gameActive) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                // 空格键暂停/继续
                pauseBtn.click();
                break;
        }
    });
    
    // 移动设备控制 - 确保按钮正常工作
    // 为了防止重复触发，使用触摸事件
    upBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默认行为
        if (direction !== 'down' && gameActive && !isPaused) {
            nextDirection = 'up';
        }
    });
    
    downBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默认行为
        if (direction !== 'up' && gameActive && !isPaused) {
            nextDirection = 'down';
        }
    });
    
    leftBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默认行为
        if (direction !== 'right' && gameActive && !isPaused) {
            nextDirection = 'left';
        }
    });
    
    rightBtn.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止默认行为
        if (direction !== 'left' && gameActive && !isPaused) {
            nextDirection = 'right';
        }
    });
    
    // 同时支持鼠标点击
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
    
    // 设置高分
    highScoreElement.textContent = highScore;
    
    // 适配窗口大小
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