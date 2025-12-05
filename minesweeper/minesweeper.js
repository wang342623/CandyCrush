// 游戏配置
const DIFFICULTIES = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

// 游戏状态
let gameState = {
    board: [],
    revealed: [],
    flagged: [],
    mineCount: 0,  // 地雷数量
    minePositions: [],  // 地雷位置数组
    difficulty: 'easy',
    gameOver: false,
    gameWon: false,
    firstClick: true,
    timer: 0,
    timerInterval: null
};

// 初始化游戏
function initGame(difficulty = 'easy') {
    const config = DIFFICULTIES[difficulty];
    gameState.difficulty = difficulty;
    gameState.rows = config.rows;
    gameState.cols = config.cols;
    gameState.mineCount = config.mines;
    gameState.board = [];
    gameState.revealed = [];
    gameState.flagged = [];
    gameState.minePositions = [];
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.firstClick = true;
    gameState.timer = 0;
    
    // 重置计时器
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // 初始化棋盘
    for (let i = 0; i < gameState.rows; i++) {
        gameState.board[i] = [];
        gameState.revealed[i] = [];
        gameState.flagged[i] = [];
        for (let j = 0; j < gameState.cols; j++) {
            gameState.board[i][j] = 0;
            gameState.revealed[i][j] = false;
            gameState.flagged[i][j] = false;
        }
    }
    
    updateUI();
    document.getElementById('statusMessage').textContent = '';
    document.getElementById('statusMessage').className = 'status-message';
    document.getElementById('timer').textContent = '0';
    document.getElementById('mineCount').textContent = gameState.mineCount;
    document.getElementById('flagCount').textContent = '0';
}

// 生成地雷（在第一次点击后）
function placeMines(excludeRow, excludeCol) {
    // 清空地雷数组
    gameState.minePositions = [];
    
    // 创建可用位置列表（排除第一次点击及其周围）
    const availablePositions = [];
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            // 确保不在第一次点击的位置及其周围放置地雷
            if (Math.abs(i - excludeRow) > 1 || Math.abs(j - excludeCol) > 1) {
                availablePositions.push({row: i, col: j});
            }
        }
    }
    
    // 随机打乱可用位置
    for (let i = availablePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }
    
    // 放置地雷
    const minesToPlace = Math.min(gameState.mineCount, availablePositions.length);
    for (let i = 0; i < minesToPlace; i++) {
        const pos = availablePositions[i];
        gameState.board[pos.row][pos.col] = -1;
        gameState.minePositions.push({row: pos.row, col: pos.col});
    }
    
    // 计算每个格子的数字
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            if (gameState.board[i][j] !== -1) {
                gameState.board[i][j] = countAdjacentMines(i, j);
            }
        }
    }
}

// 计算相邻地雷数量
function countAdjacentMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < gameState.rows && 
                newCol >= 0 && newCol < gameState.cols) {
                if (gameState.board[newRow][newCol] === -1) {
                    count++;
                }
            }
        }
    }
    return count;
}

// 更新UI
function updateUI() {
    const boardElement = document.getElementById('minesweeperBoard');
    boardElement.innerHTML = '';
    // boardElement.style.width = (gameState.cols * 34 + 10) + 'px';
    
    for (let i = 0; i < gameState.rows; i++) {
        // 为每一行创建容器
        const rowElement = document.createElement('div');
        rowElement.className = 'board-row';
        
        for (let j = 0; j < gameState.cols; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            if (gameState.flagged[i][j]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    toggleFlag(i, j);
                };
            } else if (gameState.revealed[i][j]) {
                cell.classList.add('revealed');
                if (gameState.board[i][j] === -1) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (gameState.board[i][j] > 0) {
                    cell.classList.add('number-' + gameState.board[i][j]);
                    cell.textContent = gameState.board[i][j];
                }
            } else {
                cell.onclick = () => revealCell(i, j);
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    toggleFlag(i, j);
                };
            }
            
            rowElement.appendChild(cell);
        }
        
        boardElement.appendChild(rowElement);
    }
    
    // 更新标记数量
    let flagCount = 0;
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            if (gameState.flagged[i][j]) flagCount++;
        }
    }
    document.getElementById('flagCount').textContent = flagCount;
    document.getElementById('mineCount').textContent = gameState.mineCount - flagCount;
}

// 揭示格子
function revealCell(row, col) {
    if (gameState.gameOver || gameState.gameWon || gameState.flagged[row][col]) {
        return;
    }
    
    // 第一次点击时生成地雷
    if (gameState.firstClick) {
        placeMines(row, col);
        gameState.firstClick = false;
        startTimer();
    }
    
    if (gameState.revealed[row][col]) {
        return;
    }
    
    gameState.revealed[row][col] = true;
    
    // 如果点到地雷，游戏结束
    if (gameState.board[row][col] === -1) {
        gameOver(false);
        return;
    }
    
    // 如果格子是0，自动揭示周围的格子
    if (gameState.board[row][col] === 0) {
        revealAdjacentCells(row, col);
    }
    
    updateUI();
    checkWin();
}

// 递归揭示相邻的空格子
function revealAdjacentCells(row, col) {
    // 使用队列而不是递归，避免一次性展开过多
    const queue = [{row, col}];
    const processed = new Set();
    
    while (queue.length > 0) {
        const current = queue.shift();
        const key = `${current.row},${current.col}`;
        
        // 如果已经处理过，跳过
        if (processed.has(key)) continue;
        processed.add(key);
        
        // 检查当前格子是否应该被揭示
        if (current.row < 0 || current.row >= gameState.rows ||
            current.col < 0 || current.col >= gameState.cols ||
            gameState.revealed[current.row][current.col] ||
            gameState.flagged[current.row][current.col]) {
            continue;
        }
        
        // 揭示当前格子
        gameState.revealed[current.row][current.col] = true;
        
        // 如果当前格子是0，继续展开相邻的格子
        if (gameState.board[current.row][current.col] === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue; // 跳过自己
                    
                    const newRow = current.row + i;
                    const newCol = current.col + j;
                    const newKey = `${newRow},${newCol}`;
                    
                    // 只添加未处理且有效的相邻格子
                    if (newRow >= 0 && newRow < gameState.rows &&
                        newCol >= 0 && newCol < gameState.cols &&
                        !processed.has(newKey) &&
                        !gameState.revealed[newRow][newCol] &&
                        !gameState.flagged[newRow][newCol]) {
                        queue.push({row: newRow, col: newCol});
                    }
                }
            }
        }
    }
}

// 切换标记
function toggleFlag(row, col) {
    if (gameState.gameOver || gameState.gameWon || gameState.revealed[row][col]) {
        return;
    }
    
    gameState.flagged[row][col] = !gameState.flagged[row][col];
    updateUI();
}

// 检查是否获胜
function checkWin() {
    // 如果游戏已经结束，不再检查
    if (gameState.gameOver || gameState.gameWon) {
        return;
    }
    
    let revealedCount = 0;
    for (let i = 0; i < gameState.rows; i++) {
        for (let j = 0; j < gameState.cols; j++) {
            if (gameState.revealed[i][j]) {
                revealedCount++;
            }
        }
    }
    
    const totalCells = gameState.rows * gameState.cols;
    // 只有当所有非地雷格子都被揭示时才获胜
    if (revealedCount === totalCells - gameState.mineCount && gameState.minePositions.length > 0) {
        gameOver(true);
    }
}

// 游戏结束
function gameOver(won) {
    gameState.gameOver = true;
    gameState.gameWon = won;
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // 揭示所有地雷
    if (!won) {
        for (let mine of gameState.minePositions) {
            gameState.revealed[mine.row][mine.col] = true;
        }
    }
    
    updateUI();
    
    const statusMessage = document.getElementById('statusMessage');
    if (won) {
        statusMessage.textContent = '🎉 恭喜你，扫雷成功！';
        statusMessage.className = 'status-message win';
    } else {
        statusMessage.textContent = '💥 游戏结束，你踩到地雷了！';
        statusMessage.className = 'status-message lose';
    }
}

// 开始计时器
function startTimer() {
    gameState.timer = 0;
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        document.getElementById('timer').textContent = gameState.timer;
    }, 1000);
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 难度选择
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const difficulty = btn.dataset.difficulty;
            initGame(difficulty);
        });
    });
    
    // 重新开始按钮
    document.getElementById('restartBtn').addEventListener('click', () => {
        initGame(gameState.difficulty);
    });
    
    // 初始化游戏
    initGame('easy');
});
