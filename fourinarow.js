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
    let winningCells = [];
    
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
        console.log('初始化游戏...');
        
        // 隐藏模式选择
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        
        // 重置游戏状态
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        isAnimating = false;
        winningCells = [];
        hoveredColumn = -1;
        
        // 更新玩家显示
        updatePlayerDisplay();
        
        // 创建游戏棋盘
        createGameBoard();
        
        // 创建预览棋子
        createPreviewDisc();
        
        // 清除消息
        gameMessageElement.textContent = '游戏开始！';
        
        console.log('游戏初始化完成');
        
        // 如果是人机模式且电脑先手（黄方），则执行电脑回合
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            setTimeout(computerMove, 700);
        }
    }
    
    // 创建游戏棋盘
    function createGameBoard() {
        console.log('创建游戏棋盘...');
        
        // 清空棋盘
        gameBoardElement.innerHTML = '';
        
        // 创建表格
        const table = document.createElement('table');
        table.className = 'game-table';
        
        // 从上到下创建行（从0开始，这是最顶行）
        for (let row = 0; row < ROWS; row++) {
            const tr = document.createElement('tr');
            
            for (let col = 0; col < COLS; col++) {
                const td = document.createElement('td');
                td.className = 'cell';
                td.dataset.row = row;
                td.dataset.col = col;
                
                // 单独为每个单元格添加点击事件，按列处理
                td.addEventListener('click', function() {
                    if (!gameActive || isAnimating) {
                        console.log('游戏不活跃或正在动画中，忽略点击');
                        return;
                    }
                    
                    // 获取列号，触发该列的落子
                    const clickedCol = parseInt(this.dataset.col);
                    console.log(`点击列: ${clickedCol}`);
                    makeMove(clickedCol);
                });
                
                // 悬停事件
                td.addEventListener('mouseenter', function() {
                    if (!gameActive) return;
                    const hoverCol = parseInt(this.dataset.col);
                    if (hoveredColumn !== hoverCol) {
                        hoveredColumn = hoverCol;
                        updatePreviewDisc();
                    }
                });
                
                td.addEventListener('mouseleave', function() {
                    hoveredColumn = -1;
                    updatePreviewDisc();
                });
                
                tr.appendChild(td);
            }
            
            table.appendChild(tr);
        }
        
        gameBoardElement.appendChild(table);
        console.log('游戏棋盘创建完成');
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
        if (!previewDisc) return;
        
        // 更新颜色
        previewDisc.className = 'preview-disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        
        if (hoveredColumn >= 0 && isValidMove(hoveredColumn)) {
            previewDisc.style.display = 'block';
            // 计算预览棋子的位置
            const cellWidth = gameBoardElement.offsetWidth / COLS;
            previewDisc.style.left = (hoveredColumn * cellWidth + (cellWidth - previewDisc.offsetWidth) / 2) + 'px';
        } else {
            previewDisc.style.display = 'none';
        }
    }
    
    // 检查是否可以在该列放置棋子
    function isValidMove(col) {
        if (col < 0 || col >= COLS) return false;
        return board[0][col] === EMPTY; // 检查最顶行是否为空
    }
    
    // 修改makeMove函数，使用更简单的方法找到目标单元格
    function makeMove(col) {
        console.log(`尝试在第${col}列落子...`);
        
        // 检查是否可以在该列落子
        if (!isValidMove(col)) {
            console.log(`列${col}已满，无法落子`);
            return false;
        }
        
        // 防止动画期间重复点击
        if (isAnimating) {
            console.log('正在动画中，忽略点击');
            return false;
        }
        
        isAnimating = true;
        console.log('设置动画状态: true');
        
        // 找到该列最底部的空位置
        let row = ROWS - 1;
        while (row >= 0) {
            if (board[row][col] === EMPTY) {
                break;
            }
            row--;
        }
        
        console.log(`找到空位置: 行=${row}, 列=${col}`);
        
        // 更新游戏状态
        board[row][col] = currentPlayer;
        console.log(`更新游戏状态: board[${row}][${col}] = ${currentPlayer}`);
        
        // 显示动画
        // 直接在表格中找到单元格并添加棋子
        const cell = document.querySelector(`td.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) {
            console.error(`找不到单元格: row=${row}, col=${col}`);
            isAnimating = false;
            return false;
        }
        
        // 创建棋子元素
        const disc = document.createElement('div');
        disc.className = 'disc fall-animation';
        disc.classList.add(currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        cell.appendChild(disc);
        
        console.log('添加棋子到单元格');
        
        // 检查是否获胜
        let gameOver = false;
        
        // 动画结束后检查游戏状态
        setTimeout(function() {
            console.log('动画结束');
            
            // 检查是否获胜
            if (checkWin(row, col)) {
                gameOver = true;
                console.log('检测到获胜');
                
                // 更新分数
                if (currentPlayer === RED) {
                    redScore++;
                    redScoreElement.textContent = redScore;
                } else {
                    yellowScore++;
                    yellowScoreElement.textContent = yellowScore;
                }
                
                // 高亮获胜棋子
                highlightWinningDiscs();
                
                // 显示获胜消息
                const winner = currentPlayer === RED ? '红方' : '黄方';
                gameMessageElement.textContent = `${winner}获胜！`;
                
                setTimeout(() => {
                    gameActive = false;
                    winnerTextElement.textContent = `${winner}获胜！`;
                    gameOverModal.style.display = 'block';
                }, 1000);
            } else if (isBoardFull()) {
                gameOver = true;
                console.log('棋盘已满，平局');
                
                // 更新平局次数
                tieScore++;
                tieScoreElement.textContent = tieScore;
                gameMessageElement.textContent = '平局！';
                
                setTimeout(() => {
                    gameActive = false;
                    winnerTextElement.textContent = '平局！';
                    gameOverModal.style.display = 'block';
                }, 1000);
            }
            
            // 关键修复：确保在游戏结束检查后再切换玩家
            if (!gameOver) {
                // 切换玩家
                currentPlayer = currentPlayer === RED ? YELLOW : RED;
                updatePlayerDisplay();
                console.log(`切换玩家: ${currentPlayer === RED ? '红方' : '黄方'}`);
                
                // 更新预览棋子颜色
                updatePreviewDisc();
                
                // 如果是人机模式且当前是电脑回合，执行电脑移动
                if (gameMode === 'pve' && currentPlayer === YELLOW && gameActive) {
                    console.log('电脑回合，准备移动');
                    setTimeout(computerMove, 700);
                }
            }
            
            // 重置动画状态 - 确保这一行总是执行
            isAnimating = false;
            console.log('重置动画状态: false');
        }, 500);
        
        return true;
    }
    
    // 更新当前玩家显示
    function updatePlayerDisplay() {
        currentPlayerElement.textContent = currentPlayer === RED ? '红方' : '黄方';
        currentPlayerElement.style.color = currentPlayer === RED ? '#e53935' : '#f57f17';
    }
    
    // 更新电脑移动函数，使用makeMove
    function computerMove() {
        if (!gameActive) return;
        console.log('电脑开始思考...');
        
        // 获取最佳移动列
        const col = getBestMove();
        console.log(`电脑选择第${col}列`);
        
        // 执行落子
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
    
    // 辅助函数：获取最低空行
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
    function checkWin(row, col, player = null) {
        // 如果没有指定玩家，使用当前玩家
        const currentDisc = player || board[row][col];
        console.log(`检查获胜: 行=${row}, 列=${col}, 玩家=${currentDisc}`);
        
        // 检查获胜方向：水平，垂直，两个斜向
        const directions = [
            [{dr: 0, dc: -1}, {dr: 0, dc: 1}],  // 水平
            [{dr: -1, dc: 0}, {dr: 1, dc: 0}],  // 垂直
            [{dr: -1, dc: -1}, {dr: 1, dc: 1}], // 对角线 /
            [{dr: -1, dc: 1}, {dr: 1, dc: -1}]  // 对角线 \
        ];
        
        for (const dirPair of directions) {
            // 重置连接计数和获胜单元格
            let count = 1;
            winningCells = [{row, col}];
            
            // 在两个方向上检查
            for (const dir of dirPair) {
                for (let i = 1; i < 4; i++) {
                    const r = row + dir.dr * i;
                    const c = col + dir.dc * i;
                    
                    // 检查边界
                    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
                        break;
                    }
                    
                    // 检查是否与当前棋子相同
                    if (board[r][c] === currentDisc) {
                        count++;
                        winningCells.push({row: r, col: c});
                    } else {
                        break;
                    }
                }
            }
            
            // 检查是否有4个相连
            if (count >= 4) {
                console.log(`找到获胜组合: ${JSON.stringify(winningCells)}`);
                return true;
            } else {
                winningCells = []; // 重置获胜单元格
            }
        }
        
        return false;
    }
    
    // 高亮显示获胜棋子
    function highlightWinningDiscs() {
        if (!winningCells || winningCells.length === 0) return;
        
        console.log('高亮获胜棋子:', winningCells);
        winningCells.forEach(({row, col}) => {
            const cell = document.querySelector(`td.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                const disc = cell.querySelector('.disc');
                if (disc) {
                    disc.classList.add('winning-disc');
                }
            }
        });
    }
    
    // 重置游戏
    function resetGame() {
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        hoveredColumn = -1;
        winningCells = [];
        
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

    // 添加辅助函数检查棋盘是否已满
    function isBoardFull() {
        for (let col = 0; col < COLS; col++) {
            if (board[0][col] === EMPTY) {
                return false;
            }
        }
        return true;
    }
}); 