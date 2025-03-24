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
        
        // 创建游戏网格
        createGameBoard();
        
        // 生成第一个食物
        generateFood();
        
        // 更新分数显示
        updateScore();
        
        // 开始游戏循环
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
    }
    
    // 创建游戏网格
    function createGameBoard() {
        gameBoardElement.innerHTML = '';
        gameBoardElement.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
        gameBoardElement.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.style.width = `${CELL_SIZE}px`;
                cell.style.height = `${CELL_SIZE}px`;
                gameBoardElement.appendChild(cell);
            }
        }
    }
    
    // 生成食物
    function generateFood() {
        // 获取可用空间（不被蛇占用的单元格）
        const availableCells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (!snake.some(segment => segment.x === x && segment.y === y)) {
                    availableCells.push({x, y});
                }
            }
        }
        
        // 随机选择一个可用空间
        if (availableCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            food = availableCells[randomIndex];
        }
    }
    
    // 更新游戏界面
    function updateGameBoard() {
        // 重置所有单元格
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('snake', 'snake-head', 'food');
        });
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            const cell = document.querySelector(`.cell[data-x="${segment.x}"][data-y="${segment.y}"]`);
            if (cell) {
                if (index === 0) {
                    cell.classList.add('snake-head');
                } else {
                    cell.classList.add('snake');
                }
            }
        });
        
        // 绘制食物
        const foodCell = document.querySelector(`.cell[data-x="${food.x}"][data-y="${food.y}"]`);
        if (foodCell) {
            foodCell.classList.add('food');
        }
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || !gameActive) return;
        
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头当前位置
        const head = {...snake[0]};
        
        // 根据方向移动蛇头
        const dir = directionMap[direction];
        head.x += dir.dx;
        head.y += dir.dy;
        
        // 检查是否撞墙（根据难度决定行为）
        if (difficulty === 'hard') {
            // 困难模式：撞墙结束游戏
            if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
                gameOver();
                return;
            }
        } else {
            // 简单和普通模式：穿墙
            if (head.x < 0) head.x = cols - 1;
            if (head.x >= cols) head.x = 0;
            if (head.y < 0) head.y = rows - 1;
            if (head.y >= rows) head.y = 0;
        }
        
        // 检查是否撞到自己（除了尾巴尖，因为它会移走）
        for (let i = 0; i < snake.length - 1; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }
        
        // 将新头部添加到蛇身数组前面
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += difficulty === 'easy' ? 1 : (difficulty === 'normal' ? 2 : 3);
            updateScore();
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除尾部
            snake.pop();
        }
        
        // 更新游戏界面
        updateGameBoard();
    }
    
    // 更新分数显示
    function updateScore() {
        scoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        highScoreElement.textContent = highScore;
    }
    
    // 游戏结束
    function gameOver() {
        gameActive = false;
        clearInterval(gameInterval);
        
        // 显示游戏结束弹窗
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'block';
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
    
    // 移动设备控制
    upBtn.addEventListener('click', () => {
        if (direction !== 'down') nextDirection = 'up';
    });
    
    downBtn.addEventListener('click', () => {
        if (direction !== 'up') nextDirection = 'down';
    });
    
    leftBtn.addEventListener('click', () => {
        if (direction !== 'right') nextDirection = 'left';
    });
    
    rightBtn.addEventListener('click', () => {
        if (direction !== 'left') nextDirection = 'right';
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