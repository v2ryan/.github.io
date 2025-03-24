// JSDOS: 四子连珠游戏逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 游戏常量
    const ROWS = 6;
    const COLS = 7;
    const EMPTY = 0;
    const RED = 1;
    const YELLOW = 2;
    
    // 游戏变量
    let gameMode = ''; // 'pve' 或 'pvp'
    let currentPlayer = RED;
    let board = [];
    let gameActive = false;
    let redScore = 0;
    let yellowScore = 0;
    let tieScore = 0;
    let hoveredColumn = -1;
    let isAnimating = false;
    
    // 获取DOM元素
    const modeSelectionElement = document.getElementById('mode-selection');
    const gameBoardContainer = document.getElementById('game-board-container');
    const gameBoardElement = document.getElementById('game-board');
    const columnPreviewElement = document.getElementById('column-preview');
    const currentPlayerElement = document.getElementById('current-player');
    const gameMessageElement = document.getElementById('game-message');
    const resetBtn = document.getElementById('reset-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');
    const pveBtn = document.getElementById('pve-btn');
    const pvpBtn = document.getElementById('pvp-btn');
    const redScoreElement = document.getElementById('red-score');
    const yellowScoreElement = document.getElementById('yellow-score');
    const tieScoreElement = document.getElementById('tie-score');
    const gameOverModal = document.getElementById('game-over-modal');
    const winnerTextElement = document.getElementById('winner-text');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');
    
    // 游戏模式选择
    pveBtn.addEventListener('click', () => {
        gameMode = 'pve';
        initGame();
    });
    
    pvpBtn.addEventListener('click', () => {
        gameMode = 'pvp';
        initGame();
    });
    
    // 初始化游戏
    function initGame() {
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        
        // 初始化棋盘
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        
        // 更新显示
        updatePlayerDisplay();
        gameMessageElement.textContent = '请选择一列放置棋子';
        
        // 创建游戏棋盘
        createGameBoard();
        
        // 创建预览棋子
        createPreviewDisc();
        
        // 如果是人机模式且电脑先手（黄方），则执行电脑回合
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            setTimeout(computerMove, 700);
        }
    }
    
    // 创建游戏棋盘
    function createGameBoard() {
        gameBoardElement.innerHTML = '';
        
        // 添加列点击事件监听
        for (let col = 0; col < COLS; col++) {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'column';
            columnDiv.dataset.col = col;
            
            // 添加鼠标悬停事件
            columnDiv.addEventListener('mouseenter', () => {
                if (!isAnimating && gameActive) {
                    hoveredColumn = col;
                    updatePreviewDisc();
                }
            });
            
            columnDiv.addEventListener('mouseleave', () => {
                hoveredColumn = -1;
                updatePreviewDisc();
            });
            
            columnDiv.addEventListener('click', () => {
                if (!isAnimating && gameActive) {
                    makeMove(col);
                }
            });
            
            // 为每列创建单元格
            for (let row = ROWS - 1; row >= 0; row--) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 如果格子已有棋子，显示棋子
                if (board[row][col] !== EMPTY) {
                    const disc = document.createElement('div');
                    disc.className = 'disc ' + (board[row][col] === RED ? 'red-disc' : 'yellow-disc');
                    cell.appendChild(disc);
                }
                
                columnDiv.appendChild(cell);
            }
            
            gameBoardElement.appendChild(columnDiv);
        }
    }
    
    // 创建预览棋子
    function createPreviewDisc() {
        columnPreviewElement.innerHTML = '';
        const previewDisc = document.createElement('div');
        previewDisc.className = 'preview-disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        previewDisc.style.display = 'none'; // 初始隐藏
        columnPreviewElement.appendChild(previewDisc);
    }
    
    // 更新预览棋子位置
    function updatePreviewDisc() {
        const previewDisc = columnPreviewElement.querySelector('.preview-disc');
        if (hoveredColumn >= 0 && isValidMove(hoveredColumn)) {
            previewDisc.style.display = 'block';
            previewDisc.className = 'preview-disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc');
            // 计算预览棋子的位置
            const cellWidth = gameBoardElement.offsetWidth / COLS;
            previewDisc.style.left = (hoveredColumn * cellWidth + (cellWidth - previewDisc.offsetWidth) / 2) + 'px';
        } else {
            previewDisc.style.display = 'none';
        }
    }
    
    // 检查是否可以在该列放置棋子
    function isValidMove(col) {
        // 检查最顶行是否为空
        return board[0][col] === EMPTY;
    }
    
    // 执行移动
    function makeMove(col) {
        // 如果该列已满，则不处理
        if (!isValidMove(col)) {
            return;
        }
        
        // 如果不是玩家回合，则不处理
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            return;
        }
        
        // 找到棋子应该落在的行
        let row = ROWS - 1;
        while (row >= 0 && board[row][col] !== EMPTY) {
            row--;
        }
        
        if (row < 0) return; // 该列已满
        
        // 更新棋盘
        board[row][col] = currentPlayer;
        
        // 添加动画效果
        isAnimating = true;
        animateDiscFall(row, col, () => {
            // 检查游戏状态
            checkGameState(row, col);
            
            // 如果游戏仍在进行，切换玩家
            if (gameActive) {
                currentPlayer = currentPlayer === RED ? YELLOW : RED;
                updatePlayerDisplay();
                
                // 如果是人机模式且轮到电脑，执行电脑回合
                if (gameMode === 'pve' && currentPlayer === YELLOW) {
                    setTimeout(computerMove, 700);
                }
            }
        });
    }
    
    // 棋子下落动画
    function animateDiscFall(row, col, callback) {
        const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const disc = document.createElement('div');
        disc.className = 'disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc') + ' fall-animation';
        cell.appendChild(disc);
        
        // 动画完成后执行回调
        setTimeout(() => {
            isAnimating = false;
            callback();
        }, 500); // 动画持续时间
    }
    
    // 更新当前玩家显示
    function updatePlayerDisplay() {
        currentPlayerElement.textContent = currentPlayer === RED ? '红方' : '黄方';
        currentPlayerElement.style.color = currentPlayer === RED ? '#e53935' : '#f57f17';
    }
    
    // 电脑移动
    function computerMove() {
        if (!gameActive) return;
        
        // 获取最佳移动
        const col = getBestMove();
        makeMove(col);
    }
    
    // 电脑AI - 获取最佳移动
    function getBestMove() {
        // 1. 检查是否可以直接获胜
        for (let col = 0; col < COLS; col++) {
            if (!isValidMove(col)) continue;
            
            // 模拟落子
            let row = getLowestEmptyRow(col);
            board[row][col] = YELLOW;
            
            // 检查是否获胜
            if (checkWin(row, col, YELLOW)) {
                board[row][col] = EMPTY; // 恢复
                return col; // 可以获胜，选择这一列
            }
            
            board[row][col] = EMPTY; // 恢复
        }
        
        // 2. 阻止玩家直接获胜
        for (let col = 0; col < COLS; col++) {
            if (!isValidMove(col)) continue;
            
            // 模拟玩家落子
            let row = getLowestEmptyRow(col);
            board[row][col] = RED;
            
            // 检查玩家是否会获胜
            if (checkWin(row, col, RED)) {
                board[row][col] = EMPTY; // 恢复
                return col; // 阻止玩家获胜
            }
            
            board[row][col] = EMPTY; // 恢复
        }
        
        // 3. 优先选择中间列
        const middleCol = 3;
        if (isValidMove(middleCol)) {
            return middleCol;
        }
        
        // 4. 随机选择一个有效列
        let validCols = [];
        for (let col = 0; col < COLS; col++) {
            if (isValidMove(col)) {
                validCols.push(col);
            }
        }
        
        if (validCols.length > 0) {
            return validCols[Math.floor(Math.random() * validCols.length)];
        }
        
        // 默认返回第一列（理论上不应该到这里）
        return 0;
    }
    
    // 获取某列最低的空位置
    function getLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === EMPTY) {
                return row;
            }
        }
        return -1; // 该列已满
    }
    
    // 检查游戏状态
    function checkGameState(row, col) {
        // 检查是否有玩家获胜
        if (checkWin(row, col, currentPlayer)) {
            gameActive = false;
            
            // 高亮获胜棋子
            highlightWinningDiscs();
            
            // 更新得分
            if (currentPlayer === RED) {
                redScore++;
                redScoreElement.textContent = redScore;
                winnerTextElement.textContent = '红方获胜！';
            } else {
                yellowScore++;
                yellowScoreElement.textContent = yellowScore;
                winnerTextElement.textContent = '黄方获胜！';
            }
            
            gameMessageElement.textContent = currentPlayer === RED ? '红方获胜！' : '黄方获胜！';
            
            // 显示游戏结束弹窗
            setTimeout(() => {
                gameOverModal.style.display = 'block';
            }, 1000);
            
            return;
        }
        
        // 检查是否平局（棋盘已满）
        let isFull = true;
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === EMPTY) {
                isFull = false;
                break;
            }
        }
        
        if (isFull) {
            gameActive = false;
            tieScore++;
            tieScoreElement.textContent = tieScore;
            gameMessageElement.textContent = '游戏平局！';
            
            // 显示游戏结束弹窗
            winnerTextElement.textContent = '游戏平局！';
            setTimeout(() => {
                gameOverModal.style.display = 'block';
            }, 1000);
        }
    }
    
    // 检查是否获胜
    function checkWin(row, col, player) {
        // 获取所有需要检查的方向
        const directions = [
            [0, 1],  // 水平
            [1, 0],  // 垂直
            [1, 1],  // 对角线 /
            [1, -1]  // 对角线 \
        ];
        
        for (const [dr, dc] of directions) {
            // 检查正方向
            let count = 1;
            let winningCells = [[row, col]]; // 存储获胜的棋子位置
            
            // 正向检查
            for (let i = 1; i < 4; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                
                if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) {
                    break;
                }
                
                count++;
                winningCells.push([r, c]);
            }
            
            // 反向检查
            for (let i = 1; i < 4; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                
                if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) {
                    break;
                }
                
                count++;
                winningCells.push([r, c]);
            }
            
            // 如果有四个或更多相连的棋子
            if (count >= 4) {
                // 存储获胜棋子的位置，用于高亮显示
                window.winningCells = winningCells;
                return true;
            }
        }
        
        return false;
    }
    
    // 高亮显示获胜棋子
    function highlightWinningDiscs() {
        if (!window.winningCells) return;
        
        window.winningCells.forEach(([row, col]) => {
            const cell = gameBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            const disc = cell.querySelector('.disc');
            if (disc) {
                disc.classList.add('winning-disc');
            }
        });
    }
    
    // 重置游戏
    function resetGame() {
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        hoveredColumn = -1;
        window.winningCells = null;
        
        // 更新界面
        updatePlayerDisplay();
        gameMessageElement.textContent = '请选择一列放置棋子';
        
        // 重建棋盘
        createGameBoard();
        createPreviewDisc();
        
        // 隐藏弹窗
        gameOverModal.style.display = 'none';
        
        // 如果是人机模式且电脑先手，执行电脑回合
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            setTimeout(computerMove, 700);
        }
    }
    
    // 返回菜单
    function returnToMenu() {
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
        gameOverModal.style.display = 'none';
    }
    
    // 按钮事件监听
    resetBtn.addEventListener('click', resetGame);
    returnMenuBtn.addEventListener('click', returnToMenu);
    playAgainBtn.addEventListener('click', resetGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    // 窗口大小变化时更新预览棋子位置
    window.addEventListener('resize', updatePreviewDisc);
}); 