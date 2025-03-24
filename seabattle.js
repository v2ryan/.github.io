// JSDOS: 海战棋游戏逻辑
document.addEventListener('DOMContentLoaded', function() {
    // API地址 - 替换为您的Hostinger地址
    const API_URL = 'https://your-domain.com/api.php';
    
    // 游戏常量
    const GRID_SIZE = 10;
    const SHIPS = [
        { name: '航空母舰', size: 5 },
        { name: '战列舰', size: 4 },
        { name: '巡洋舰', size: 3 },
        { name: '驱逐舰', size: 3 },
        { name: '潜艇', size: 2 }
    ];
    
    // 游戏变量
    let gameStarted = false;
    let playerTurn = true;
    let playerGrid = createEmptyGrid();
    let enemyGrid = createEmptyGrid();
    let playerShips = [];
    let enemyShips = [];
    let placingShipIndex = 0;
    let isHorizontal = true;
    let playerScore = 0;
    let computerScore = 0;
    let shipPlacementMode = true;
    let hoveredCells = [];
    let playerHasBonus = false;
    
    // DOM 元素
    const playerGridElement = document.getElementById('player-grid');
    const enemyGridElement = document.getElementById('enemy-grid');
    const shipSelectionElement = document.getElementById('ship-selection');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const randomBtn = document.getElementById('random-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const gameStatusText = document.getElementById('game-status-text');
    const currentPlayerText = document.getElementById('current-player');
    const gameMessage = document.getElementById('game-message');
    const playerScoreElement = document.getElementById('player-score');
    const computerScoreElement = document.getElementById('computer-score');
    const gameOverModal = document.getElementById('game-over-modal');
    const winnerText = document.getElementById('winner-text');
    const finalScoreElement = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');
    
    // 初始化游戏
    initGame();
    
    // 事件监听器
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    randomBtn.addEventListener('click', randomPlacement);
    rotateBtn.addEventListener('click', rotateShip);
    playAgainBtn.addEventListener('click', resetGame);
    returnMenuBtn.addEventListener('click', () => window.location.href = 'index.html');
    
    // 初始化游戏
    function initGame() {
        // 创建玩家和敌人网格
        createGrid(playerGridElement, playerGrid, true);
        createGrid(enemyGridElement, enemyGrid, false);
        
        // 初始化舰船选择
        initShipSelection();
        
        // 设置按钮状态
        startBtn.disabled = true;
        
        // 设置游戏状态
        gameStatusText.textContent = '放置舰船';
        currentPlayerText.textContent = '玩家';
        gameMessage.textContent = '请放置所有舰船后开始游戏';
    }
    
    // 创建空网格
    function createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            grid[i] = [];
            for (let j = 0; j < GRID_SIZE; j++) {
                grid[i][j] = {
                    hasShip: false,
                    isHit: false,
                    shipIndex: -1
                };
            }
        }
        return grid;
    }
    
    // 创建HTML网格
    function createGrid(gridElement, gridData, isPlayer) {
        gridElement.innerHTML = '';
        
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                if (isPlayer) {
                    if (gridData[i][j].hasShip) {
                        cell.classList.add('ship');
                    }
                    
                    cell.addEventListener('click', () => handlePlayerGridClick(i, j));
                    cell.addEventListener('mouseover', () => handlePlayerGridHover(i, j));
                    cell.addEventListener('mouseout', () => clearHoveredCells());
                } else {
                    cell.addEventListener('click', () => handleEnemyGridClick(i, j));
                }
                
                if (gridData[i][j].isHit) {
                    cell.classList.add(gridData[i][j].hasShip ? 'hit' : 'miss');
                }
                
                gridElement.appendChild(cell);
            }
        }
    }
    
    // 初始化舰船选择
    function initShipSelection() {
        shipSelectionElement.innerHTML = '';
        
        // 只显示未放置的舰船
        for (let i = placingShipIndex; i < SHIPS.length; i++) {
            const ship = SHIPS[i];
            const shipElement = document.createElement('div');
            shipElement.className = 'ship-selection-item';
            shipElement.style.margin = '10px';
            shipElement.style.display = 'inline-block';
            
            // 显示舰船名称
            const nameElement = document.createElement('div');
            nameElement.textContent = ship.name;
            nameElement.style.marginBottom = '5px';
            shipElement.appendChild(nameElement);
            
            // 显示舰船图形
            const shipDisplay = document.createElement('div');
            shipDisplay.style.display = 'flex';
            shipDisplay.style.flexDirection = isHorizontal ? 'row' : 'column';
            
            for (let j = 0; j < ship.size; j++) {
                const segment = document.createElement('div');
                segment.className = 'ship';
                segment.style.width = '25px';
                segment.style.height = '25px';
                shipDisplay.appendChild(segment);
            }
            
            shipElement.appendChild(shipDisplay);
            shipSelectionElement.appendChild(shipElement);
        }
        
        // 如果所有舰船已放置，显示提示
        if (placingShipIndex >= SHIPS.length) {
            const message = document.createElement('div');
            message.textContent = '所有舰船已放置完毕';
            message.style.padding = '10px';
            shipSelectionElement.appendChild(message);
        }
    }
    
    // 处理玩家网格点击（放置舰船）
    function handlePlayerGridClick(row, col) {
        // 如果游戏已经开始或不在舰船放置模式，则不处理
        if (gameStarted || !shipPlacementMode) return;
        
        // 如果已经放置了所有舰船，则不处理
        if (placingShipIndex >= SHIPS.length) {
            gameMessage.textContent = '所有舰船已放置完毕，点击"开始游戏"开始';
            return;
        }
        
        // 获取当前要放置的舰船
        const ship = SHIPS[placingShipIndex];
        
        // 检查是否可以放置
        if (canPlaceShip(playerGrid, row, col, ship.size, isHorizontal)) {
            // 放置舰船
            placeShip(playerGrid, row, col, ship.size, isHorizontal, placingShipIndex);
            
            // 记录舰船信息
            playerShips.push({
                type: placingShipIndex,
                size: ship.size,
                hits: 0,
                coordinates: getShipCoordinates(row, col, ship.size, isHorizontal)
            });
            
            // 更新网格显示
            createGrid(playerGridElement, playerGrid, true);
            
            // 移动到下一艘舰船
            placingShipIndex++;
            
            // 更新舰船选择显示
            initShipSelection();
            
            // 更新游戏信息
            if (placingShipIndex < SHIPS.length) {
                gameMessage.textContent = `请放置${SHIPS[placingShipIndex].name}（${SHIPS[placingShipIndex].size}格）`;
            } else {
                gameMessage.textContent = '所有舰船已放置完毕，点击"开始游戏"开始';
                startBtn.disabled = false;
            }
        } else {
            gameMessage.textContent = `无法在此位置放置舰船，请选择其他位置`;
        }
    }
    
    // 处理玩家网格悬停
    function handlePlayerGridHover(row, col) {
        if (gameStarted || !shipPlacementMode) return;
        
        clearHoveredCells();
        
        const ship = SHIPS[placingShipIndex];
        const coordinates = getShipCoordinates(row, col, ship.size, isHorizontal);
        const validPlacement = canPlaceShip(playerGrid, row, col, ship.size, isHorizontal);
        
        coordinates.forEach(([r, c]) => {
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                const cellIndex = r * GRID_SIZE + c;
                const cell = playerGridElement.children[cellIndex];
                
                cell.style.backgroundColor = validPlacement ? '#90EE90' : '#FF6347';
                hoveredCells.push(cell);
            }
        });
    }
    
    // 清除悬停单元格
    function clearHoveredCells() {
        hoveredCells.forEach(cell => {
            cell.style.backgroundColor = '';
        });
        hoveredCells = [];
    }
    
    // 处理敌人网格点击
    function handleEnemyGridClick(row, col) {
        if (!gameStarted || !playerTurn) return;
        
        // 检查是否已经攻击过该位置
        if (enemyGrid[row][col].isHit) {
            gameMessage.textContent = '您已经攻击过这个位置，请选择其他位置';
            return;
        }
        
        // 标记为已攻击
        enemyGrid[row][col].isHit = true;
        
        // 检查是否击中
        if (enemyGrid[row][col].hasShip) {
            // 更新界面
            const cell = enemyGridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('hit');
            
            // 查找被击中的舰船
            const shipIndex = enemyGrid[row][col].shipIndex;
            const ship = enemyShips[shipIndex];
            ship.hits++;
            
            // 检查是否击沉
            if (ship.hits === ship.size) {
                playerScore++;
                playerScoreElement.textContent = playerScore;
                gameMessage.textContent = `您击沉了敌方的${SHIPS[ship.type].name}！获得额外攻击机会！`;
                
                // 检查是否获胜
                if (checkAllShipsSunk(enemyShips)) {
                    endGame(true);
                    return;
                }
                
                // 给予额外攻击机会
                playerTurn = true;
                currentPlayerText.textContent = '玩家 (额外攻击)';
            } else {
                gameMessage.textContent = '击中敌方舰船！获得额外攻击机会！';
                // 给予额外攻击机会
                playerTurn = true;
                currentPlayerText.textContent = '玩家 (额外攻击)';
            }
        } else {
            // 未击中
            const cell = enemyGridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('miss');
            gameMessage.textContent = '未击中任何舰船，轮到电脑回合';
            
            // 切换到电脑回合
            playerTurn = false;
            currentPlayerText.textContent = '电脑';
            
            // 延迟电脑攻击
            setTimeout(computerTurn, 1000);
        }
        
        // 更新网格
        createGrid(enemyGridElement, enemyGrid, false);
    }
    
    // 电脑回合
    function computerTurn() {
        if (gameStarted && !playerTurn) {
            // 智能选择攻击位置
            const attackCoordinates = chooseAttackPosition();
            const [row, col] = attackCoordinates;
            
            // 标记为已攻击
            playerGrid[row][col].isHit = true;
            
            // 更新界面
            createGrid(playerGridElement, playerGrid, true);
            
            // 检查是否击中
            if (playerGrid[row][col].hasShip) {
                gameMessage.textContent = `电脑击中了您的舰船位置 (${row+1},${col+1})！`;
                
                // 查找被击中的舰船
                const shipIndex = playerGrid[row][col].shipIndex;
                const ship = playerShips[shipIndex];
                ship.hits++;
                
                // 检查是否击沉
                if (ship.hits === ship.size) {
                    computerScore++;
                    computerScoreElement.textContent = computerScore;
                    gameMessage.textContent = `电脑击沉了您的${SHIPS[ship.type].name}！电脑获得额外攻击机会！`;
                    
                    // 检查是否失败
                    if (checkAllShipsSunk(playerShips)) {
                        endGame(false);
                        return;
                    }
                    
                    // 电脑获得额外攻击机会
                    setTimeout(computerTurn, 1000);
                    return;
                } else {
                    gameMessage.textContent += ' 电脑获得额外攻击机会！';
                    // 电脑获得额外攻击机会
                    setTimeout(computerTurn, 1000);
                    return;
                }
            } else {
                gameMessage.textContent = `电脑攻击了位置 (${row+1},${col+1})，但未击中。轮到您的回合`;
                
                // 轮到玩家
                playerTurn = true;
                currentPlayerText.textContent = '玩家';
            }
        }
    }
    
    // 结束游戏
    function endGame(playerWon) {
        gameStarted = false;
        
        // 更新游戏状态
        gameStatusText.textContent = '游戏结束';
        
        // 显示游戏结束对话框
        winnerText.textContent = playerWon ? '恭喜，您赢了！' : '很遗憾，您输了！';
        finalScoreElement.textContent = `您的得分: ${playerScore} | 电脑得分: ${computerScore}`;
        gameOverModal.style.display = 'block';
        
        // 保存分数
        saveScore(playerWon ? playerScore : -computerScore);
    }
    
    // 保存分数
    async function saveScore(score) {
        try {
            const username = sessionStorage.getItem('username');
            if (!username) return;
            
            const response = await fetch(`${API_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    score,
                    game: 'seabattle'
                })
            });
            
            const result = await response.json();
            console.log('分数保存结果:', result);
        } catch (error) {
            console.error('保存分数失败:', error);
        }
    }
    
    // 重置游戏
    function resetGame() {
        // 重置游戏变量
        gameStarted = false;
        playerTurn = true;
        playerGrid = createEmptyGrid();
        enemyGrid = createEmptyGrid();
        playerShips = [];
        enemyShips = [];
        placingShipIndex = 0;
        isHorizontal = true;
        playerScore = 0;
        computerScore = 0;
        shipPlacementMode = true;
        playerHasBonus = false;
        
        // 更新DOM
        playerScoreElement.textContent = '0';
        computerScoreElement.textContent = '0';
        
        // 隐藏游戏结束对话框
        gameOverModal.style.display = 'none';
        
        // 重置游戏状态
        gameStatusText.textContent = '放置舰船';
        currentPlayerText.textContent = '玩家';
        gameMessage.textContent = '请放置所有舰船后开始游戏';
        
        // 重新初始化
        createGrid(playerGridElement, playerGrid, true);
        createGrid(enemyGridElement, enemyGrid, false);
        initShipSelection();
        
        // 按钮状态
        startBtn.disabled = true;
        randomBtn.disabled = false;
        rotateBtn.disabled = false;
    }
    
    // 检查是否可以放置舰船 - 简化版本
    function canPlaceShip(grid, row, col, size, horizontal) {
        // 检查是否超出边界
        if (horizontal) {
            if (col + size > GRID_SIZE) return false;
        } else {
            if (row + size > GRID_SIZE) return false;
        }
        
        // 只检查舰船要占用的格子
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            
            // 如果该格子已经有舰船，则无法放置
            if (grid[r][c].hasShip) {
                return false;
            }
        }
        
        return true;
    }
    
    // 放置舰船
    function placeShip(grid, row, col, size, horizontal, shipIndex) {
        for (let i = 0; i < size; i++) {
            const r = horizontal ? row : row + i;
            const c = horizontal ? col + i : col;
            grid[r][c].hasShip = true;
            grid[r][c].shipIndex = shipIndex;
        }
    }
    
    // 获取舰船坐标
    function getShipCoordinates(row, col, size, horizontal) {
        const coordinates = [];
        
        for (let i = 0; i < size; i++) {
            if (horizontal) {
                coordinates.push([row, col + i]);
            } else {
                coordinates.push([row + i, col]);
            }
        }
        
        return coordinates;
    }
    
    // 检查所有舰船是否被击沉
    function checkAllShipsSunk(ships) {
        return ships.every(ship => ship.hits === ship.size);
    }
    
    // 旋转舰船
    function rotateShip() {
        if (gameStarted) return;
        
        isHorizontal = !isHorizontal;
        initShipSelection();
        gameMessage.textContent = `舰船方向已切换为${isHorizontal ? '水平' : '垂直'}`;
    }
    
    // 随机放置舰船
    function randomPlacement() {
        if (gameStarted) return;
        
        // 重置玩家网格和舰船
        playerGrid = createEmptyGrid();
        playerShips = [];
        
        // 随机放置所有舰船
        for (let i = 0; i < SHIPS.length; i++) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!placed && attempts < maxAttempts) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const horizontal = Math.random() > 0.5;
                
                if (canPlaceShip(playerGrid, row, col, SHIPS[i].size, horizontal)) {
                    placeShip(playerGrid, row, col, SHIPS[i].size, horizontal, i);
                    
                    playerShips.push({
                        type: i,
                        size: SHIPS[i].size,
                        hits: 0,
                        coordinates: getShipCoordinates(row, col, SHIPS[i].size, horizontal)
                    });
                    
                    placed = true;
                }
                
                attempts++;
            }
            
            if (!placed) {
                // 如果无法放置所有舰船，重置并重试
                return randomPlacement();
            }
        }
        
        // 更新网格显示
        createGrid(playerGridElement, playerGrid, true);
        
        // 更新舰船选择
        initShipSelection();
        
        // 启用开始按钮
        startBtn.disabled = false;
        shipPlacementMode = false;
        gameMessage.textContent = '所有舰船已随机放置，点击"开始游戏"按钮开始游戏';
    }
    
    // 开始游戏
    function startGame() {
        if (playerShips.length !== SHIPS.length) {
            gameMessage.textContent = '请先放置所有舰船';
            return;
        }
        
        gameStarted = true;
        playerTurn = true;
        
        // 随机生成敌方舰船
        enemyGrid = createEmptyGrid();
        enemyShips = [];
        
        for (let i = 0; i < SHIPS.length; i++) {
            let placed = false;
            
            while (!placed) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const horizontal = Math.random() > 0.5;
                
                if (canPlaceShip(enemyGrid, row, col, SHIPS[i].size, horizontal)) {
                    placeShip(enemyGrid, row, col, SHIPS[i].size, horizontal, i);
                    
                    enemyShips.push({
                        type: i,
                        size: SHIPS[i].size,
                        hits: 0,
                        coordinates: getShipCoordinates(row, col, SHIPS[i].size, horizontal)
                    });
                    
                    placed = true;
                }
            }
        }
        
        // 更新网格显示 (隐藏敌方舰船)
        createGrid(enemyGridElement, enemyGrid, false);
        
        // 更新UI和状态
        gameStatusText.textContent = '游戏中';
        currentPlayerText.textContent = '玩家';
        gameMessage.textContent = '游戏开始！请选择敌方海域位置进行攻击';
        startBtn.disabled = true;
        randomBtn.disabled = true;
        rotateBtn.disabled = true;
    }
    
    // 电脑选择攻击位置的函数
    function chooseAttackPosition() {
        // 检查是否有已经被击中但未击沉的舰船，优先攻击其周围
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (playerGrid[r][c].isHit && playerGrid[r][c].hasShip) {
                    // 找到一个已击中的舰船格子
                    const shipIndex = playerGrid[r][c].shipIndex;
                    // 如果舰船尚未击沉
                    if (playerShips[shipIndex].hits < playerShips[shipIndex].size) {
                        // 尝试攻击四个方向的相邻格子
                        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                        for (const [dr, dc] of directions) {
                            const newRow = r + dr;
                            const newCol = c + dc;
                            // 检查位置是否有效且未攻击过
                            if (newRow >= 0 && newRow < GRID_SIZE && 
                                newCol >= 0 && newCol < GRID_SIZE && 
                                !playerGrid[newRow][newCol].isHit) {
                                return [newRow, newCol];
                            }
                        }
                    }
                }
            }
        }
        
        // 如果没有找到优先攻击的位置，随机选择一个未攻击的位置
        let validMoves = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!playerGrid[r][c].isHit) {
                    validMoves.push([r, c]);
                }
            }
        }
        
        // 从有效位置中随机选择一个
        if (validMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            return validMoves[randomIndex];
        }
        
        // 如果没有有效位置（不太可能发生），返回[0,0]
        return [0, 0];
    }
}); 