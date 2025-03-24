// JSDOS: 井字棋游戏逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 游戏变量
    let gameMode = ''; // 'pve' 或 'pvp'
    let currentPlayer = 'X';
    let board = ['', '', '', '', '', '', '', '', ''];
    let gameActive = false;
    let xScore = 0;
    let oScore = 0;
    let tieScore = 0;
    
    // 获取DOM元素
    const modeSelectionElement = document.getElementById('mode-selection');
    const gameBoardContainer = document.getElementById('game-board-container');
    const gameBoardElement = document.getElementById('game-board');
    const currentPlayerElement = document.getElementById('current-player');
    const gameMessageElement = document.getElementById('game-message');
    const resetBtn = document.getElementById('reset-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');
    const pveBtn = document.getElementById('pve-btn');
    const pvpBtn = document.getElementById('pvp-btn');
    const xScoreElement = document.getElementById('x-score');
    const oScoreElement = document.getElementById('o-score');
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
        
        // 清空游戏棋盘
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        
        // 更新显示
        currentPlayerElement.textContent = currentPlayer;
        gameMessageElement.textContent = '游戏开始！';
        
        // 创建游戏棋盘
        createGameBoard();
        
        // 如果是人机模式且电脑先手（O），则执行电脑回合
        if (gameMode === 'pve' && currentPlayer === 'O') {
            setTimeout(computerMove, 700);
        }
    }
    
    // 创建游戏棋盘
    function createGameBoard() {
        gameBoardElement.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            
            // 如果格子已有内容，显示X或O
            if (board[i]) {
                cell.textContent = board[i];
                cell.classList.add(board[i].toLowerCase());
            }
            
            // 添加点击事件
            cell.addEventListener('click', handleCellClick);
            
            gameBoardElement.appendChild(cell);
        }
    }
    
    // 处理格子点击
    function handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        
        // 如果游戏未激活或格子已填写，则不处理
        if (!gameActive || board[index] !== '') {
            return;
        }
        
        // 如果不是玩家回合，则不处理
        if (gameMode === 'pve' && currentPlayer === 'O') {
            return;
        }
        
        // 执行玩家移动
        makeMove(index);
        
        // 如果是人机模式且游戏仍在进行，执行电脑回合
        if (gameMode === 'pve' && gameActive && currentPlayer === 'O') {
            setTimeout(computerMove, 700);
        }
    }
    
    // 执行移动
    function makeMove(index) {
        board[index] = currentPlayer;
        
        // 检查游戏状态
        checkGameState();
        
        // 如果游戏仍在进行，切换玩家
        if (gameActive) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            currentPlayerElement.textContent = currentPlayer;
            
            // 设置当前玩家颜色
            currentPlayerElement.style.color = currentPlayer === 'X' ? '#e74c3c' : '#3498db';
            
            gameMessageElement.textContent = `轮到玩家 ${currentPlayer} 的回合`;
        }
        
        // 更新游戏棋盘
        createGameBoard();
    }
    
    // 电脑移动
    function computerMove() {
        // 如果游戏已结束，则不执行
        if (!gameActive) return;
        
        // 电脑AI - 使用简单的策略
        // 1. 如果能赢，则获胜
        // 2. 如果玩家下一步能赢，则阻止
        // 3. 选择中心
        // 4. 选择角落
        // 5. 选择边
        
        let index = -1;
        
        // 寻找能赢的移动
        index = findWinningMove('O');
        if (index !== -1) {
            makeMove(index);
            return;
        }
        
        // 阻止玩家获胜
        index = findWinningMove('X');
        if (index !== -1) {
            makeMove(index);
            return;
        }
        
        // 选择中心
        if (board[4] === '') {
            makeMove(4);
            return;
        }
        
        // 选择角落
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(i => board[i] === '');
        if (emptyCorners.length > 0) {
            const randomCorner = emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
            makeMove(randomCorner);
            return;
        }
        
        // 选择边
        const edges = [1, 3, 5, 7];
        const emptyEdges = edges.filter(i => board[i] === '');
        if (emptyEdges.length > 0) {
            const randomEdge = emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
            makeMove(randomEdge);
            return;
        }
    }
    
    // 寻找能赢的移动
    function findWinningMove(player) {
        // 尝试每个空格
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                // 模拟在此格子放置标记
                board[i] = player;
                
                // 检查是否获胜
                if (checkWin(player)) {
                    // 复原并返回该位置
                    board[i] = '';
                    return i;
                }
                
                // 复原
                board[i] = '';
            }
        }
        
        return -1;
    }
    
    // 检查游戏状态
    function checkGameState() {
        // 检查是否有玩家获胜
        if (checkWin(currentPlayer)) {
            gameActive = false;
            
            // 更新得分
            if (currentPlayer === 'X') {
                xScore++;
                xScoreElement.textContent = xScore;
            } else {
                oScore++;
                oScoreElement.textContent = oScore;
            }
            
            // 显示获胜消息
            gameMessageElement.textContent = `玩家 ${currentPlayer} 获胜！`;
            
            // 显示弹窗
            winnerTextElement.textContent = `玩家 ${currentPlayer} 获胜！`;
            gameOverModal.style.display = 'block';
            
            return;
        }
        
        // 检查是否平局
        if (!board.includes('')) {
            gameActive = false;
            tieScore++;
            tieScoreElement.textContent = tieScore;
            
            gameMessageElement.textContent = '游戏平局！';
            
            // 显示弹窗
            winnerTextElement.textContent = '游戏平局！';
            gameOverModal.style.display = 'block';
            
            return;
        }
    }
    
    // 检查是否获胜
    function checkWin(player) {
        // 定义获胜组合
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // 行
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // 列
            [0, 4, 8], [2, 4, 6]             // 对角线
        ];
        
        // 检查是否满足任一获胜条件
        return winConditions.some(condition => {
            return condition.every(index => board[index] === player);
        });
    }
    
    // 重置游戏
    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        
        currentPlayerElement.textContent = currentPlayer;
        currentPlayerElement.style.color = '#e74c3c';
        gameMessageElement.textContent = '游戏已重置！';
        
        createGameBoard();
        
        gameOverModal.style.display = 'none';
        
        // 如果是人机模式且电脑先手（O），则执行电脑回合
        if (gameMode === 'pve' && currentPlayer === 'O') {
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
}); 