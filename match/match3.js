// 消消乐游戏逻辑
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');

// 游戏参数
const GRID_SIZE = 50;
const BOARD_SIZE = 8;
const COLORS = [
    '#FF9999', // 柔和的红色
    '#99FF99', // 柔和的绿色
    '#9999FF', // 柔和的蓝色
    '#FFFF99', // 柔和的黄色
    '#FF99FF'  // 柔和的紫色
];
const GAME_TIME = 60;

// 游戏状态
let board = [];
let score = 0;
let timeLeft = GAME_TIME;
let isSwapping = false;
let selectedTile = null;
let gameTimer = null;
let isProcessing = false; // 添加处理中状态标志

// 添加动画参数
const ANIMATION_SPEED = 8;
const SWAP_DURATION = 200;
let animatingTiles = [];

// 初始化游戏
function initGame() {
    // 初始化棋盘
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = {
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                x: j * GRID_SIZE,
                y: i * GRID_SIZE
            };
        }
    }
    
    // 重置游戏状态
    score = 0;
    timeLeft = GAME_TIME;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    
    // 开始计时
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(updateTimer, 1000);
    
    // 绘制游戏
    drawBoard();
}

// 绘制棋盘
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制棋盘背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, BOARD_SIZE * GRID_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(BOARD_SIZE * GRID_SIZE, i * GRID_SIZE);
        ctx.stroke();
    }
    
    // 绘制所有非动画方块
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const tile = board[i][j];
            if (tile.color !== null && !animatingTiles.some(t => t.row === i && t.col === j)) {
                drawTile(tile, i, j);
            }
        }
    }
    
    // 绘制动画中的方块
    animatingTiles.forEach(tile => {
        drawTile(tile, tile.row, tile.col);
    });
}

// 绘制方块
function drawTile(tile, row, col) {
    const x = tile.x;
    const y = tile.y;
    const scale = tile.scale !== undefined ? tile.scale : 1;
    
    if (scale <= 0) return;
    
    const centerX = x + GRID_SIZE / 2;
    const centerY = y + GRID_SIZE / 2;
    const size = GRID_SIZE * scale;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    
    // 绘制方块阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 绘制方块背景
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 8);
    ctx.fillStyle = tile.color;
    ctx.fill();
    
    // 绘制方块边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制高光效果
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 6);
    ctx.lineTo(x + GRID_SIZE - 6, y + 6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    
    // 绘制选中效果
    if (selectedTile && selectedTile.row === row && selectedTile.col === col) {
        ctx.beginPath();
        ctx.roundRect(x, y, GRID_SIZE, GRID_SIZE, 8);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 添加闪光动画
        const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 修改点击事件处理
canvas.addEventListener('click', (e) => {
    if (isSwapping || timeLeft <= 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);
    
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return;
    
    if (!selectedTile) {
        // 第一次点击，选中方块
        selectedTile = { row, col };
        drawBoard();
    } else {
        // 第二次点击
        const dx = Math.abs(selectedTile.col - col);
        const dy = Math.abs(selectedTile.row - row);
        
        if (row === selectedTile.row && col === selectedTile.col) {
            // 点击同一个方块，取消选中
            selectedTile = null;
            drawBoard();
        } else if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // 相邻方块，尝试交换
            const prevSelected = { ...selectedTile };
            selectedTile = null;
            swapTiles(prevSelected.row, prevSelected.col, row, col);
        } else {
            // 点击其他方块，更新选中
            selectedTile = { row, col };
            drawBoard();
        }
    }
});

// 修改交换方块函数
function swapTiles(row1, col1, row2, col2) {
    if (isSwapping) return;
    isSwapping = true;
    
    const tile1 = board[row1][col1];
    const tile2 = board[row2][col2];
    
    // 创建动画对象
    const animTile1 = {
        ...tile1,
        targetX: tile2.x,
        targetY: tile2.y,
        row: row1,
        col: col1,
        x: tile1.x,
        y: tile1.y,
        color: tile1.color
    };
    
    const animTile2 = {
        ...tile2,
        targetX: tile1.x,
        targetY: tile1.y,
        row: row2,
        col: col2,
        x: tile2.x,
        y: tile2.y,
        color: tile2.color
    };
    
    // 开始动画
    animatingTiles = [animTile1, animTile2];
    
    // 使用 requestAnimationFrame 处理动画
    let startTime = null;
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / SWAP_DURATION;
        
        if (progress < 1) {
            // 更新位置
            animTile1.x = tile1.x + (tile2.x - tile1.x) * progress;
            animTile1.y = tile1.y + (tile2.y - tile1.y) * progress;
            animTile2.x = tile2.x + (tile1.x - tile2.x) * progress;
            animTile2.y = tile2.y + (tile1.y - tile2.y) * progress;
            
            drawBoard();
            requestAnimationFrame(animate);
        } else {
            // 动画完成
            animatingTiles = [];
            
            // 交换颜色
            const tempColor = tile1.color;
            tile1.color = tile2.color;
            tile2.color = tempColor;
            
            // 检查是否有匹配
            if (!checkMatches()) {
                // 没有匹配，开始反向动画
                startTime = null;
                animatingTiles = [
                    { ...animTile1, targetX: tile1.x, targetY: tile1.y },
                    { ...animTile2, targetX: tile2.x, targetY: tile2.y }
                ];
                
                function animateBack(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = (timestamp - startTime) / SWAP_DURATION;
                    
                    if (progress < 1) {
                        // 更新位置
                        animatingTiles[0].x = tile2.x + (tile1.x - tile2.x) * progress;
                        animatingTiles[0].y = tile2.y + (tile1.y - tile2.y) * progress;
                        animatingTiles[1].x = tile1.x + (tile2.x - tile1.x) * progress;
                        animatingTiles[1].y = tile1.y + (tile2.y - tile1.y) * progress;
                        
                        drawBoard();
                        requestAnimationFrame(animateBack);
                    } else {
                        // 反向动画完成
                        animatingTiles = [];
                        tile1.color = tempColor;
                        tile2.color = tile2.color;
                        isSwapping = false;
                        drawBoard();
                    }
                }
                
                requestAnimationFrame(animateBack);
            } else {
                // 有匹配，处理消除
                processMatches().then(() => {
                    isSwapping = false;
                    drawBoard();
                });
            }
        }
    }
    
    requestAnimationFrame(animate);
}

// 检查匹配
function checkMatches() {
    let hasMatches = false;
    
    // 检查水平匹配
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE - 2; j++) {
            if (board[i][j].color === board[i][j+1].color && 
                board[i][j].color === board[i][j+2].color) {
                hasMatches = true;
            }
        }
    }
    
    // 检查垂直匹配
    for (let i = 0; i < BOARD_SIZE - 2; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j].color === board[i+1][j].color && 
                board[i][j].color === board[i+2][j].color) {
                hasMatches = true;
            }
        }
    }
    
    return hasMatches;
}

// 修改处理匹配函数
async function processMatches() {
    let matchFound = true;
    while (matchFound) {
        matchFound = false;
        
        // 标记要消除的方块
        const toRemove = [];
        
        // 检查水平匹配
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE - 2; j++) {
                if (board[i][j].color === board[i][j+1].color && 
                    board[i][j].color === board[i][j+2].color) {
                    toRemove.push({row: i, col: j});
                    toRemove.push({row: i, col: j+1});
                    toRemove.push({row: i, col: j+2});
                    matchFound = true;
                }
            }
        }
        
        // 检查垂直匹配
        for (let i = 0; i < BOARD_SIZE - 2; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j].color === board[i+1][j].color && 
                    board[i][j].color === board[i+2][j].color) {
                    toRemove.push({row: i, col: j});
                    toRemove.push({row: i+1, col: j});
                    toRemove.push({row: i+2, col: j});
                    matchFound = true;
                }
            }
        }
        
        if (matchFound) {
            // 更新分数
            score += toRemove.length * 10;
            scoreElement.textContent = score;
            
            // 消除匹配的方块（添加消除动画）
            animatingTiles = toRemove.map(pos => ({
                ...board[pos.row][pos.col],
                row: pos.row,
                col: pos.col,
                scale: 1
            }));
            
            // 消除动画
            let startTime = null;
            await new Promise(resolve => {
                function animateRemove(timestamp) {
                    if (!startTime) startTime = timestamp;
                    const progress = (timestamp - startTime) / 300;
                    
                    if (progress < 1) {
                        animatingTiles.forEach(tile => {
                            tile.scale = 1 - progress;
                        });
                        drawBoard();
                        requestAnimationFrame(animateRemove);
                    } else {
                        animatingTiles = [];
                        resolve();
                    }
                }
                requestAnimationFrame(animateRemove);
            });
            
            // 标记要消除的方块
            toRemove.forEach(pos => {
                board[pos.row][pos.col].color = null;
            });
            
            // 准备下落动画
            const fallingTiles = [];
            
            // 计算每列的下落距离
            for (let j = 0; j < BOARD_SIZE; j++) {
                let emptyRow = BOARD_SIZE - 1;
                for (let i = BOARD_SIZE - 1; i >= 0; i--) {
                    if (board[i][j].color !== null) {
                        if (i !== emptyRow) {
                            fallingTiles.push({
                                fromRow: i,
                                toRow: emptyRow,
                                col: j,
                                color: board[i][j].color,
                                startY: i * GRID_SIZE,
                                targetY: emptyRow * GRID_SIZE
                            });
                            board[emptyRow][j].color = board[i][j].color;
                            board[i][j].color = null;
                        }
                        emptyRow--;
                    }
                }
                
                // 添加新方块（从上方落下）
                for (let i = emptyRow; i >= 0; i--) {
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    fallingTiles.push({
                        fromRow: -1,
                        toRow: i,
                        col: j,
                        color: color,
                        startY: -GRID_SIZE,
                        targetY: i * GRID_SIZE
                    });
                    board[i][j].color = color;
                }
            }
            
            // 执行下落动画
            if (fallingTiles.length > 0) {
                animatingTiles = fallingTiles.map(tile => ({
                    x: tile.col * GRID_SIZE,
                    y: tile.startY,
                    targetY: tile.targetY,
                    color: tile.color,
                    row: tile.toRow,
                    col: tile.col
                }));
                
                startTime = null;
                await new Promise(resolve => {
                    function animateFall(timestamp) {
                        if (!startTime) startTime = timestamp;
                        const progress = (timestamp - startTime) / 500; // 下落动画时间
                        
                        if (progress < 1) {
                            animatingTiles.forEach(tile => {
                                const startY = tile.y;
                                const distance = tile.targetY - startY;
                                // 使用缓动函数使动画更自然
                                tile.y = startY + distance * Math.pow(progress, 2);
                            });
                            drawBoard();
                            requestAnimationFrame(animateFall);
                        } else {
                            animatingTiles = [];
                            resolve();
                        }
                    }
                    requestAnimationFrame(animateFall);
                });
            }
            
            drawBoard();
        }
    }
}

// 更新计时器
function updateTimer() {
    timeLeft--;
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        clearInterval(gameTimer);
        showMessage('游戏结束', `最终得分: ${score}`);
    }
}

// 显示消息
function showMessage(title, message) {
    const modal = document.getElementById('messageModal');
    const titleEl = document.getElementById('messageTitle');
    const textEl = document.getElementById('messageText');
    
    titleEl.textContent = title;
    textEl.textContent = message;
    modal.style.display = 'block';
    
    document.getElementById('messageConfirm').onclick = () => {
        modal.style.display = 'none';
        if (timeLeft <= 0) {
            initGame();
        }
    };
}

// 重新开始按钮
document.getElementById('restartBtn').addEventListener('click', () => {
    if (timeLeft > 0) {
        showMessage('确认重新开始', '当前游戏尚未结束，确定要重新开始吗？', () => {
            initGame();
        });
    } else {
        initGame();
    }
});

// 初始化游戏
initGame(); 
