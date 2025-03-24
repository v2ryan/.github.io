// JSDOS: 海戰棋遊戲邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 遊戲常量
    const BOARD_SIZE = 10;
    const EMPTY = 0;
    const SHIP = 1;
    const HIT = 2;
    const MISS = 3;
    
    // 艦艇定義
    const SHIPS = [
        { name: '戰艦', size: 5 },
        { name: '巡洋艦', size: 4 },
        { name: '驅逐艦', size: 3 },
        { name: '潛艇', size: 3 },
        { name: '巡邏艇', size: 2 }
    ];
    
    // 遊戲變量
    let gameMode = ''; // 'pve' 或 'pvp'
    let currentPlayer = 1; // 1 或 2
    let playerBoard = [];
    let opponentBoard = [];
    let playerView = []; // 玩家看到的敵方板子
    let opponentView = []; // 對手看到的玩家板子
    let gameActive = false;
    let player1Score = 0;
    let player2Score = 0;
    let tieScore = 0;
    let currentShipIndex = 0;
    let isHorizontal = true;
    let placingShips = false;
    let computerMoves = [];
    
    // 獲取DOM元素
    const modeSelectionElement = document.getElementById('mode-selection');
    const gameBoardContainer = document.getElementById('game-board-container');
    const playerBoardElement = document.getElementById('player-board');
    const opponentBoardElement = document.getElementById('opponent-board');
    const currentPlayerElement = document.getElementById('current-player');
    const gameMessageElement = document.getElementById('game-message');
    const resetBtn = document.getElementById('reset-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');
    const pveBtn = document.getElementById('pve-btn');
    const pvpBtn = document.getElementById('pvp-btn');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const tieScoreElement = document.getElementById('tie-score');
    const gameOverModal = document.getElementById('game-over-modal');
    const winnerTextElement = document.getElementById('winner-text');
    const playAgainBtn = document.getElementById('play-again-btn');
    const menuBtn = document.getElementById('menu-btn');
    const shipPlacementModal = document.getElementById('ship-placement-modal');
    const placementBoardElement = document.getElementById('placement-board');
    const placementMessageElement = document.getElementById('placement-message');
    const rotateBtn = document.getElementById('rotate-btn');
    const confirmPlacementBtn = document.getElementById('confirm-placement-btn');
    
    // 遊戲模式選擇
    pveBtn.addEventListener('click', () => {
        gameMode = 'pve';
        startPlacingShips();
    });
    
    pvpBtn.addEventListener('click', () => {
        gameMode = 'pvp';
        startPlacingShips();
    });
    
    // 初始化棋盤
    function initBoards() {
        playerBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
        opponentBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
        playerView = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
        opponentView = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
        createGameBoards();
    }
    
    // 開始放置艦艇
    function startPlacingShips() {
        initBoards();
        placingShips = true;
        currentShipIndex = 0;
        isHorizontal = true;
        
        // 顯示放置艦艇彈窗
        shipPlacementModal.style.display = 'block';
        
        // 創建放置棋盤
        createPlacementBoard();
        
        // 更新提示消息
        updatePlacementMessage();
    }
    
    // 創建放置棋盤
    function createPlacementBoard() {
        placementBoardElement.innerHTML = '';
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 懸停顯示預覽
                cell.addEventListener('mouseover', function() {
                    if (!placingShips) return;
                    showShipPreview(row, col);
                });
                
                cell.addEventListener('mouseout', function() {
                    if (!placingShips) return;
                    clearShipPreview();
                });
                
                // 點擊放置艦艇
                cell.addEventListener('click', function() {
                    if (!placingShips) return;
                    placeShip(row, col);
                });
                
                placementBoardElement.appendChild(cell);
            }
        }
    }
    
    // 創建遊戲棋盤
    function createGameBoards() {
        // 玩家棋盤
        playerBoardElement.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 更新單元格樣式
                updateCellStyle(cell, playerBoard[row][col]);
                
                playerBoardElement.appendChild(cell);
            }
        }
        
        // 對手棋盤
        opponentBoardElement.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 點擊攻擊
                cell.addEventListener('click', function() {
                    if (!gameActive || currentPlayer !== 1) return;
                    attack(row, col, 'opponent');
                });
                
                // 更新單元格樣式
                updateCellStyle(cell, playerView[row][col]);
                
                opponentBoardElement.appendChild(cell);
            }
        }
    }
    
    // 更新單元格樣式
    function updateCellStyle(cell, value) {
        cell.classList.remove('ship', 'hit', 'miss');
        
        if (value === SHIP) {
            cell.classList.add('ship');
        } else if (value === HIT) {
            cell.classList.add('hit');
        } else if (value === MISS) {
            cell.classList.add('miss');
        }
    }
    
    // 顯示艦艇預覽
    function showShipPreview(row, col) {
        clearShipPreview();
        
        const ship = SHIPS[currentShipIndex];
        const cells = [];
        
        if (isHorizontal) {
            if (col + ship.size > BOARD_SIZE) return;
            
            for (let i = 0; i < ship.size; i++) {
                const cell = placementBoardElement.querySelector(`[data-row="${row}"][data-col="${col + i}"]`);
                if (playerBoard[row][col + i] === SHIP) return;
                cells.push(cell);
            }
        } else {
            if (row + ship.size > BOARD_SIZE) return;
            
            for (let i = 0; i < ship.size; i++) {
                const cell = placementBoardElement.querySelector(`[data-row="${row + i}"][data-col="${col}"]`);
                if (playerBoard[row + i][col] === SHIP) return;
                cells.push(cell);
            }
        }
        
        // 顯示預覽
        cells.forEach(cell => {
            cell.style.backgroundColor = '#aaa';
        });
        
        // 啟用確認按鈕
        confirmPlacementBtn.disabled = false;
    }
    
    // 清除艦艇預覽
    function clearShipPreview() {
        const cells = placementBoardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (playerBoard[row][col] === SHIP) {
                cell.style.backgroundColor = '#555';
            } else {
                cell.style.backgroundColor = '';
            }
        });
        
        confirmPlacementBtn.disabled = true;
    }
    
    // 放置艦艇
    function placeShip(row, col) {
        const ship = SHIPS[currentShipIndex];
        
        // 檢查是否可以放置
        if (isHorizontal) {
            if (col + ship.size > BOARD_SIZE) return;
            
            for (let i = 0; i < ship.size; i++) {
                if (playerBoard[row][col + i] === SHIP) return;
            }
            
            // 放置艦艇
            for (let i = 0; i < ship.size; i++) {
                playerBoard[row][col + i] = SHIP;
            }
        } else {
            if (row + ship.size > BOARD_SIZE) return;
            
            for (let i = 0; i < ship.size; i++) {
                if (playerBoard[row + i][col] === SHIP) return;
            }
            
            // 放置艦艇
            for (let i = 0; i < ship.size; i++) {
                playerBoard[row + i][col] = SHIP;
            }
        }
        
        // 更新棋盤顯示
        clearShipPreview();
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = placementBoardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (playerBoard[r][c] === SHIP) {
                    cell.style.backgroundColor = '#555';
                }
            }
        }
        
        // 進入下一艘艦艇或開始遊戲
        currentShipIndex++;
        if (currentShipIndex < SHIPS.length) {
            updatePlacementMessage();
        } else {
            finishPlacement();
        }
    }
    
    // 旋轉艦艇
    function rotateShip() {
        isHorizontal = !isHorizontal;
        clearShipPreview();
    }
    
    // 更新放置提示消息
    function updatePlacementMessage() {
        if (currentShipIndex < SHIPS.length) {
            const ship = SHIPS[currentShipIndex];
            placementMessageElement.textContent = `放置${ship.name} (${ship.size}格)`;
        }
    }
    
    // 完成艦艇放置
    function finishPlacement() {
        shipPlacementModal.style.display = 'none';
        placingShips = false;
        
        // 如果是PVE模式，自動放置電腦的艦艇
        if (gameMode === 'pve') {
            placeComputerShips();
        } else {
            // 如果是PVP模式，切換玩家並重新開始放置
            currentPlayer = 2;
            currentPlayerElement.textContent = '玩家2';
            alert('玩家2開始放置艦艇');
            startPlacingShips();
            return;
        }
        
        // 開始遊戲
        startGame();
    }
    
    // 自動放置電腦的艦艇
    function placeComputerShips() {
        for (const ship of SHIPS) {
            let placed = false;
            
            while (!placed) {
                const isHorizontal = Math.random() < 0.5;
                let row, col;
                
                if (isHorizontal) {
                    row = Math.floor(Math.random() * BOARD_SIZE);
                    col = Math.floor(Math.random() * (BOARD_SIZE - ship.size + 1));
                    
                    // 檢查是否可以放置
                    let canPlace = true;
                    for (let i = 0; i < ship.size; i++) {
                        if (opponentBoard[row][col + i] === SHIP) {
                            canPlace = false;
                            break;
                        }
                    }
                    
                    // 放置艦艇
                    if (canPlace) {
                        for (let i = 0; i < ship.size; i++) {
                            opponentBoard[row][col + i] = SHIP;
                        }
                        placed = true;
                    }
                } else {
                    row = Math.floor(Math.random() * (BOARD_SIZE - ship.size + 1));
                    col = Math.floor(Math.random() * BOARD_SIZE);
                    
                    // 檢查是否可以放置
                    let canPlace = true;
                    for (let i = 0; i < ship.size; i++) {
                        if (opponentBoard[row + i][col] === SHIP) {
                            canPlace = false;
                            break;
                        }
                    }
                    
                    // 放置艦艇
                    if (canPlace) {
                        for (let i = 0; i < ship.size; i++) {
                            opponentBoard[row + i][col] = SHIP;
                        }
                        placed = true;
                    }
                }
            }
        }
        
        // 初始化電腦可用的移動
        computerMoves = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                computerMoves.push({row, col});
            }
        }
        // 打亂順序
        computerMoves.sort(() => Math.random() - 0.5);
    }
    
    // 開始遊戲
    function startGame() {
        modeSelectionElement.style.display = 'none';
        gameBoardContainer.style.display = 'block';
        gameActive = true;
        currentPlayer = 1;
        
        // 更新界面
        updateGameBoards();
        updatePlayerDisplay();
        gameMessageElement.textContent = '遊戲開始！選擇一個位置攻擊';
    }
    
    // 更新遊戲棋盤
    function updateGameBoards() {
        // 更新玩家棋盤
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = playerBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (playerBoard[row][col] === SHIP && opponentView[row][col] === EMPTY) {
                    cell.classList.add('ship');
                } else {
                    updateCellStyle(cell, opponentView[row][col] || playerBoard[row][col]);
                }
            }
        }
        
        // 更新對手棋盤
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = opponentBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                updateCellStyle(cell, playerView[row][col]);
            }
        }
    }
    
    // 更新玩家顯示
    function updatePlayerDisplay() {
        currentPlayerElement.textContent = currentPlayer === 1 ? '玩家1' : (gameMode === 'pve' ? '電腦' : '玩家2');
    }
    
    // 攻擊
    function attack(row, col, target) {
        let board, view;
        
        if (target === 'opponent') {
            board = opponentBoard;
            view = playerView;
            
            // 檢查是否已經攻擊過
            if (view[row][col] !== EMPTY) return;
            
            // 攻擊
            if (board[row][col] === SHIP) {
                view[row][col] = HIT;
                gameMessageElement.textContent = '命中！';
            } else {
                view[row][col] = MISS;
                gameMessageElement.textContent = '未命中！';
            }
        } else {
            board = playerBoard;
            view = opponentView;
            
            // 檢查是否已經攻擊過
            if (view[row][col] !== EMPTY) return;
            
            // 攻擊
            if (board[row][col] === SHIP) {
                view[row][col] = HIT;
                gameMessageElement.textContent = '電腦命中了！';
            } else {
                view[row][col] = MISS;
                gameMessageElement.textContent = '電腦未命中！';
            }
        }
        
        // 更新棋盤顯示
        updateGameBoards();
        
        // 檢查是否獲勝
        if (checkWin(view)) {
            gameOver(currentPlayer);
            return;
        }
        
        // 切換玩家
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updatePlayerDisplay();
        
        // 如果是PVE模式且當前是電腦回合，執行電腦攻擊
        if (gameMode === 'pve' && currentPlayer === 2) {
            setTimeout(computerAttack, 1000);
        }
    }
    
    // 電腦攻擊
    function computerAttack() {
        if (!gameActive || computerMoves.length === 0) return;
        
        // 選擇一個隨機位置
        const index = Math.floor(Math.random() * computerMoves.length);
        const {row, col} = computerMoves[index];
        computerMoves.splice(index, 1);
        
        // 執行攻擊
        attack(row, col, 'player');
    }
    
    // 檢查是否獲勝
    function checkWin(view) {
        let hitCount = 0;
        const totalShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (view[row][col] === HIT) {
                    hitCount++;
                }
            }
        }
        
        return hitCount >= totalShipCells;
    }
    
    // 遊戲結束
    function gameOver(winner) {
        gameActive = false;
        
        // 顯示所有艦艇
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (opponentBoard[row][col] === SHIP && playerView[row][col] === EMPTY) {
                    const cell = opponentBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add('ship');
                }
            }
        }
        
        // 更新得分
        if (winner === 1) {
            player1Score++;
            player1ScoreElement.textContent = player1Score;
            winnerTextElement.textContent = gameMode === 'pve' ? '玩家獲勝！' : '玩家1獲勝！';
        } else {
            player2Score++;
            player2ScoreElement.textContent = player2Score;
            winnerTextElement.textContent = gameMode === 'pve' ? '電腦獲勝！' : '玩家2獲勝！';
        }
        
        // 顯示遊戲結束彈窗
        setTimeout(() => {
            gameOverModal.style.display = 'block';
        }, 1000);
    }
    
    // 重置遊戲
    function resetGame() {
        initBoards();
        gameActive = false;
        
        if (gameMode === 'pve') {
            startPlacingShips();
        } else {
            currentPlayer = 1;
            startPlacingShips();
        }
        
        gameOverModal.style.display = 'none';
    }
    
    // 返回菜單
    function returnToMenu() {
        gameBoardContainer.style.display = 'none';
        modeSelectionElement.style.display = 'block';
        gameOverModal.style.display = 'none';
    }
    
    // 按鈕事件
    resetBtn.addEventListener('click', resetGame);
    returnMenuBtn.addEventListener('click', returnToMenu);
    playAgainBtn.addEventListener('click', resetGame);
    menuBtn.addEventListener('click', returnToMenu);
    rotateBtn.addEventListener('click', rotateShip);
    confirmPlacementBtn.addEventListener('click', finishPlacement);
    
    // 鍵盤控制
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            if (placingShips) rotateShip();
        }
    });
}); 