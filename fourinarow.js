// JSDOS: 四子連珠遊戲邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 遊戲常量
    const ROWS = 6;
    const COLS = 7;
    const EMPTY = 0;
    const RED = 1;
    const YELLOW = 2;
    
    // 遊戲變量
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
    
    // 獲取DOM元素
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
    
    // 遊戲模式選擇
    pveBtn.addEventListener('click', () => {
        gameMode = 'pve';
        initGame();
    });
    
    pvpBtn.addEventListener('click', () => {
        gameMode = 'pvp';
        initGame();
    });
    
    // 初始化遊戲
    function initGame() {
        console.log('初始化遊戲...');
        
        // 隱藏模式選擇
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        
        // 重置遊戲狀態
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        isAnimating = false;
        winningCells = [];
        hoveredColumn = -1;
        
        // 更新玩家顯示
        updatePlayerDisplay();
        
        // 創建遊戲棋盤
        createGameBoard();
        
        // 創建預覽棋子
        createPreviewDisc();
        
        // 清除消息
        gameMessageElement.textContent = '遊戲開始！';
        
        console.log('遊戲初始化完成');
        
        // 如果是人機模式且電腦先手（黃方），則執行電腦回合
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            setTimeout(computerMove, 700);
        }
    }
    
    // 創建遊戲棋盤
    function createGameBoard() {
        console.log('創建遊戲棋盤...');
        
        // 清空棋盤
        gameBoardElement.innerHTML = '';
        
        // 創建表格
        const table = document.createElement('table');
        table.className = 'game-table';
        
        // 從上到下創建行（從0開始，這是最頂行）
        for (let row = 0; row < ROWS; row++) {
            const tr = document.createElement('tr');
            
            for (let col = 0; col < COLS; col++) {
                const td = document.createElement('td');
                td.className = 'cell';
                td.dataset.row = row;
                td.dataset.col = col;
                
                // 單獨為每個單元格添加點擊事件，按列處理
                td.addEventListener('click', function() {
                    if (!gameActive || isAnimating) {
                        console.log('遊戲不活躍或正在動畫中，忽略點擊');
                        return;
                    }
                    
                    // 獲取列號，觸發該列的落子
                    const clickedCol = parseInt(this.dataset.col);
                    console.log(`點擊列: ${clickedCol}`);
                    makeMove(clickedCol);
                });
                
                // 懸停事件
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
        console.log('遊戲棋盤創建完成');
    }
    
    // 創建預覽棋子
    function createPreviewDisc() {
        columnPreviewElement.innerHTML = '';
        const previewDisc = document.createElement('div');
        previewDisc.className = 'preview-disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        previewDisc.style.display = 'none'; // 初始隱藏
        columnPreviewElement.appendChild(previewDisc);
    }
    
    // 更新預覽棋子位置
    function updatePreviewDisc() {
        const previewDisc = columnPreviewElement.querySelector('.preview-disc');
        if (!previewDisc) return;
        
        // 更新顏色
        previewDisc.className = 'preview-disc ' + (currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        
        if (hoveredColumn >= 0 && isValidMove(hoveredColumn)) {
            previewDisc.style.display = 'block';
            // 計算預覽棋子的位置
            const cellWidth = gameBoardElement.offsetWidth / COLS;
            previewDisc.style.left = (hoveredColumn * cellWidth + (cellWidth - previewDisc.offsetWidth) / 2) + 'px';
        } else {
            previewDisc.style.display = 'none';
        }
    }
    
    // 檢查是否可以在該列放置棋子
    function isValidMove(col) {
        if (col < 0 || col >= COLS) return false;
        return board[0][col] === EMPTY; // 檢查最頂行是否為空
    }
    
    // 修改makeMove函數，使用更簡單的方法找到目標單元格
    function makeMove(col) {
        console.log(`嘗試在第${col}列落子...`);
        
        // 檢查是否可以在該列落子
        if (!isValidMove(col)) {
            console.log(`列${col}已滿，無法落子`);
            return false;
        }
        
        // 防止動畫期間重複點擊
        if (isAnimating) {
            console.log('正在動畫中，忽略點擊');
            return false;
        }
        
        isAnimating = true;
        console.log('設置動畫狀態: true');
        
        // 找到該列最底部的空位置
        let row = ROWS - 1;
        while (row >= 0) {
            if (board[row][col] === EMPTY) {
                break;
            }
            row--;
        }
        
        console.log(`找到空位置: 行=${row}, 列=${col}`);
        
        // 更新遊戲狀態
        board[row][col] = currentPlayer;
        console.log(`更新遊戲狀態: board[${row}][${col}] = ${currentPlayer}`);
        
        // 顯示動畫
        // 直接在表格中找到單元格並添加棋子
        const cell = document.querySelector(`td.cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) {
            console.error(`找不到單元格: row=${row}, col=${col}`);
            isAnimating = false;
            return false;
        }
        
        // 創建棋子元素
        const disc = document.createElement('div');
        disc.className = 'disc fall-animation';
        disc.classList.add(currentPlayer === RED ? 'red-disc' : 'yellow-disc');
        cell.appendChild(disc);
        
        console.log('添加棋子到單元格');
        
        // 檢查是否獲勝
        let gameOver = false;
        
        // 動畫結束後檢查遊戲狀態
        setTimeout(function() {
            console.log('動畫結束');
            
            // 檢查是否獲勝
            if (checkWin(row, col)) {
                gameOver = true;
                console.log('檢測到獲勝');
                
                // 更新分數
                if (currentPlayer === RED) {
                    redScore++;
                    redScoreElement.textContent = redScore;
                } else {
                    yellowScore++;
                    yellowScoreElement.textContent = yellowScore;
                }
                
                // 高亮獲勝棋子
                highlightWinningDiscs();
                
                // 顯示獲勝消息
                const winner = currentPlayer === RED ? '紅方' : '黃方';
                gameMessageElement.textContent = `${winner}獲勝！`;
                
                setTimeout(() => {
                    gameActive = false;
                    winnerTextElement.textContent = `${winner}獲勝！`;
                    gameOverModal.style.display = 'block';
                }, 1000);
            } else if (isBoardFull()) {
                gameOver = true;
                console.log('棋盤已滿，平局');
                
                // 更新平局次數
                tieScore++;
                tieScoreElement.textContent = tieScore;
                gameMessageElement.textContent = '平局！';
                
                setTimeout(() => {
                    gameActive = false;
                    winnerTextElement.textContent = '平局！';
                    gameOverModal.style.display = 'block';
                }, 1000);
            }
            
            // 關鍵修復：確保在遊戲結束檢查後再切換玩家
            if (!gameOver) {
                // 切換玩家
                currentPlayer = currentPlayer === RED ? YELLOW : RED;
                updatePlayerDisplay();
                console.log(`切換玩家: ${currentPlayer === RED ? '紅方' : '黃方'}`);
                
                // 更新預覽棋子顏色
                updatePreviewDisc();
                
                // 如果是人機模式且當前是電腦回合，執行電腦移動
                if (gameMode === 'pve' && currentPlayer === YELLOW && gameActive) {
                    console.log('電腦回合，準備移動');
                    setTimeout(computerMove, 700);
                }
            }
            
            // 重置動畫狀態 - 確保這一行總是執行
            isAnimating = false;
            console.log('重置動畫狀態: false');
        }, 500);
        
        return true;
    }
    
    // 更新玩家顯示
    function updatePlayerDisplay() {
        const playerText = currentPlayer === RED ? '紅方' : '黃方';
        currentPlayerElement.textContent = playerText;
        currentPlayerElement.style.color = currentPlayer === RED ? '#e53935' : '#f57f17';
    }
    
    // 電腦移動
    function computerMove() {
        if (!gameActive) return;
        console.log('電腦開始思考...');
        
        // 獲取最佳移動列
        const col = getBestMove();
        console.log(`電腦選擇第${col}列`);
        
        // 執行落子
        makeMove(col);
    }
    
    // 獲取電腦的最佳移動
    function getBestMove() {
        // 這裡實現一個簡單的AI：
        // 1. 首先檢查是否有能贏的一步
        for (let col = 0; col < COLS; col++) {
            if (!isValidMove(col)) continue;
            
            const row = getLowestEmptyRow(col);
            if (row === -1) continue;
            
            // 嘗試放置棋子
            board[row][col] = YELLOW;
            
            // 檢查是否能贏
            if (checkWin(row, col, YELLOW)) {
                // 撤銷嘗試
                board[row][col] = EMPTY;
                return col;
            }
            
            // 撤銷嘗試
            board[row][col] = EMPTY;
        }
        
        // 2. 其次，阻止對手贏的一步
        for (let col = 0; col < COLS; col++) {
            if (!isValidMove(col)) continue;
            
            const row = getLowestEmptyRow(col);
            if (row === -1) continue;
            
            // 嘗試放置棋子
            board[row][col] = RED;
            
            // 檢查對手是否能贏
            if (checkWin(row, col, RED)) {
                // 撤銷嘗試
                board[row][col] = EMPTY;
                return col;
            }
            
            // 撤銷嘗試
            board[row][col] = EMPTY;
        }
        
        // 3. 優先選擇中間的列
        if (isValidMove(3)) return 3;
        
        // 4. 隨機選擇一個有效列
        let validCols = [];
        for (let col = 0; col < COLS; col++) {
            if (isValidMove(col)) {
                validCols.push(col);
            }
        }
        
        if (validCols.length > 0) {
            return validCols[Math.floor(Math.random() * validCols.length)];
        }
        
        // 默認返回第一列（理論上不應該到這裡）
        return 0;
    }
    
    // 輔助函數：獲取最低空行
    function getLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === EMPTY) {
                return row;
            }
        }
        return -1; // 該列已滿
    }
    
    // 檢查遊戲狀態
    function checkGameState(row, col) {
        // 檢查是否有玩家獲勝
        if (checkWin(row, col, currentPlayer)) {
            gameActive = false;
            
            // 高亮獲勝棋子
            highlightWinningDiscs();
            
            // 更新得分
            if (currentPlayer === RED) {
                redScore++;
                redScoreElement.textContent = redScore;
                winnerTextElement.textContent = '紅方獲勝！';
            } else {
                yellowScore++;
                yellowScoreElement.textContent = yellowScore;
                winnerTextElement.textContent = '黃方獲勝！';
            }
            
            gameMessageElement.textContent = currentPlayer === RED ? '紅方獲勝！' : '黃方獲勝！';
            
            // 顯示遊戲結束彈窗
            setTimeout(() => {
                gameOverModal.style.display = 'block';
            }, 1000);
            
            return;
        }
        
        // 檢查是否平局（棋盤已滿）
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
            gameMessageElement.textContent = '遊戲平局！';
            
            // 顯示遊戲結束彈窗
            winnerTextElement.textContent = '遊戲平局！';
            setTimeout(() => {
                gameOverModal.style.display = 'block';
            }, 1000);
        }
    }
    
    // 檢查是否獲勝
    function checkWin(row, col, player = null) {
        // 如果沒有指定玩家，使用當前玩家
        const currentDisc = player || board[row][col];
        console.log(`檢查獲勝: 行=${row}, 列=${col}, 玩家=${currentDisc}`);
        
        // 檢查獲勝方向：水平，垂直，兩個斜向
        const directions = [
            [{dr: 0, dc: -1}, {dr: 0, dc: 1}],  // 水平
            [{dr: -1, dc: 0}, {dr: 1, dc: 0}],  // 垂直
            [{dr: -1, dc: -1}, {dr: 1, dc: 1}], // 對角線 /
            [{dr: -1, dc: 1}, {dr: 1, dc: -1}]  // 對角線 \
        ];
        
        for (const dirPair of directions) {
            // 重置連接計數和獲勝單元格
            let count = 1;
            winningCells = [{row, col}];
            
            // 在兩個方向上檢查
            for (const dir of dirPair) {
                for (let i = 1; i < 4; i++) {
                    const r = row + dir.dr * i;
                    const c = col + dir.dc * i;
                    
                    // 檢查邊界
                    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
                        break;
                    }
                    
                    // 檢查是否與當前棋子相同
                    if (board[r][c] === currentDisc) {
                        count++;
                        winningCells.push({row: r, col: c});
                    } else {
                        break;
                    }
                }
            }
            
            // 檢查是否有4個相連
            if (count >= 4) {
                console.log(`找到獲勝組合: ${JSON.stringify(winningCells)}`);
                return true;
            } else {
                winningCells = []; // 重置獲勝單元格
            }
        }
        
        return false;
    }
    
    // 高亮顯示獲勝棋子
    function highlightWinningDiscs() {
        if (!winningCells || winningCells.length === 0) return;
        
        console.log('高亮獲勝棋子:', winningCells);
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
    
    // 重置遊戲
    function resetGame() {
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        currentPlayer = RED;
        gameActive = true;
        hoveredColumn = -1;
        winningCells = [];
        
        // 更新界面
        updatePlayerDisplay();
        gameMessageElement.textContent = '請選擇一列放置棋子';
        
        // 重建棋盤
        createGameBoard();
        createPreviewDisc();
        
        // 隱藏彈窗
        gameOverModal.style.display = 'none';
        
        // 如果是人機模式且電腦先手，執行電腦回合
        if (gameMode === 'pve' && currentPlayer === YELLOW) {
            setTimeout(computerMove, 700);
        }
    }
    
    // 返回菜單
    function returnToMenu() {
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
        gameOverModal.style.display = 'none';
    }
    
    // 按鈕事件監聽
    resetBtn.addEventListener('click', resetGame);
    returnMenuBtn.addEventListener('click', returnToMenu);
    playAgainBtn.addEventListener('click', resetGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    // 窗口大小變化時更新預覽棋子位置
    window.addEventListener('resize', updatePreviewDisc);

    // 添加輔助函數檢查棋盤是否已滿
    function isBoardFull() {
        for (let col = 0; col < COLS; col++) {
            if (board[0][col] === EMPTY) {
                return false;
            }
        }
        return true;
    }
}); 