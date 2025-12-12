const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const newRecordElement = document.getElementById('newRecord');

// 游戏配置
const GRID_SIZE = 20;
let CELL_SIZE = 20;
let gridWidth, gridHeight;

// 游戏状态
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;

// 初始化画布大小
function initCanvas() {
    let maxWidth;
    if (window.innerWidth <= 480) {
        // 小屏幕手机
        maxWidth = Math.min(320, window.innerWidth - 20);
    } else if (window.innerWidth <= 768) {
        // 平板或大屏手机
        maxWidth = Math.min(400, window.innerWidth - 30);
    } else {
        // 桌面端
        maxWidth = Math.min(600, window.innerWidth - 40);
    }
    CELL_SIZE = Math.floor(maxWidth / GRID_SIZE);
    const actualWidth = CELL_SIZE * GRID_SIZE;
    
    canvas.width = actualWidth;
    canvas.height = actualWidth;
    
    gridWidth = GRID_SIZE;
    gridHeight = GRID_SIZE;
}

// 加载最高分
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) {
        highScore = parseInt(saved);
        highScoreElement.textContent = highScore;
    }
}

// 保存最高分
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore.toString());
        highScoreElement.textContent = highScore;
        return true;
    }
    return false;
}

// 初始化游戏
function initGame() {
    snake = [
        { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    draw();
}

// 生成食物
function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // 绘制食物
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            // 蛇头
            ctx.fillStyle = '#4ecdc4';
            const headX = segment.x * CELL_SIZE + 2;
            const headY = segment.y * CELL_SIZE + 2;
            const headSize = CELL_SIZE - 4;
            
            // 绘制蛇头身体
            ctx.fillRect(headX, headY, headSize, headSize);
            
            // 绘制眼睛
            ctx.fillStyle = '#fff';
            const eyeSize = Math.max(3, CELL_SIZE / 8);
            const eyeOffset = CELL_SIZE / 4;
            const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
            
            // 根据移动方向确定眼睛位置
            if (direction.x === 1) {
                // 向右移动，眼睛在右侧
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.x === -1) {
                // 向左移动，眼睛在左侧
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === -1) {
                // 向上移动，眼睛在上方
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === 1) {
                // 向下移动，眼睛在下方
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制眼珠（黑色小点）
            ctx.fillStyle = '#000';
            const pupilSize = Math.max(2, eyeSize / 2);
            if (direction.x === 1) {
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY - eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY + eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.x === -1) {
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY - eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY + eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === -1) {
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY - eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY - eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === 1) {
                ctx.beginPath();
                ctx.arc(centerX - eyeOffset, centerY + eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + eyeOffset, centerY + eyeOffset, pupilSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 蛇身
            ctx.fillStyle = '#45b7aa';
        }
        
        if (index > 0) {
            ctx.fillRect(
                segment.x * CELL_SIZE + 2,
                segment.y * CELL_SIZE + 2,
                CELL_SIZE - 4,
                CELL_SIZE - 4
            );
        }
    });
}

// 移动蛇
function moveSnake() {
    direction = { ...nextDirection };
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // 检查碰撞
    if (
        head.x < 0 || head.x >= gridWidth ||
        head.y < 0 || head.y >= gridHeight ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }

    draw();
}

// 游戏循环
function gameStep() {
    if (!gamePaused && gameRunning) {
        moveSnake();
    }
}

// 开始游戏
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        gameLoop = setInterval(gameStep, 150);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
        pauseBtn.textContent = '继续';
    } else if (gameRunning && gamePaused) {
        gamePaused = false;
        pauseBtn.textContent = '暂停';
    }
}

// 重置游戏
function resetGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    gameRunning = false;
    gamePaused = false;
    gameOverModal.style.display = 'none';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    initGame();
}

// 游戏结束
function gameOver() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    gameRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';

    const isNewRecord = saveHighScore();
    finalScoreElement.textContent = score;
    if (isNewRecord) {
        newRecordElement.classList.add('show');
    } else {
        newRecordElement.classList.remove('show');
    }
    gameOverModal.style.display = 'flex';
}

// 改变方向
function changeDirection(newDirection) {
    // 防止反向移动
    if (
        (newDirection.x === -direction.x && newDirection.x !== 0) ||
        (newDirection.y === -direction.y && newDirection.y !== 0)
    ) {
        return;
    }
    nextDirection = newDirection;
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            changeDirection({ x: 0, y: -1 });
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            changeDirection({ x: 0, y: 1 });
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            changeDirection({ x: -1, y: 0 });
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            changeDirection({ x: 1, y: 0 });
            break;
    }
});

// 移动端方向键控制
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!gameRunning || gamePaused) return;
        const direction = btn.dataset.direction;
        switch (direction) {
            case 'up':
                changeDirection({ x: 0, y: -1 });
                break;
            case 'down':
                changeDirection({ x: 0, y: 1 });
                break;
            case 'left':
                changeDirection({ x: -1, y: 0 });
                break;
            case 'right':
                changeDirection({ x: 1, y: 0 });
                break;
        }
    });
});

// 触摸滑动控制
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                changeDirection({ x: 1, y: 0 }); // 右
            } else {
                changeDirection({ x: -1, y: 0 }); // 左
            }
        }
    } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                changeDirection({ x: 0, y: 1 }); // 下
            } else {
                changeDirection({ x: 0, y: -1 }); // 上
            }
        }
    }
});

// 按钮事件
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', resetGame);

// 检测移动设备
function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const desktopInstructions = document.getElementById('desktop-instructions');
    const mobileInstructions = document.getElementById('mobile-instructions');
    if (isMobile || window.innerWidth <= 768) {
        desktopInstructions.classList.add('hide-desktop');
        mobileInstructions.classList.add('show-mobile');
    } else {
        desktopInstructions.classList.remove('hide-desktop');
        mobileInstructions.classList.remove('show-mobile');
    }
}

// 窗口大小改变时重新初始化
window.addEventListener('resize', () => {
    initCanvas();
    initGame();
});

// 初始化
window.addEventListener('load', () => {
    initCanvas();
    loadHighScore();
    initGame();
    detectMobile();
});

