// 获取随机数
function getRandom(n, m) {
  return Math.floor(Math.random() * (m - n + 1)) + n;
}
// 获取游戏开始按键
const go = document.querySelector(".go");
// 获取游戏主体
const table = document.querySelector("table");
// 获取容器
const box = document.querySelector(".box");
// 动画帧ID
let animationFrameId;
// 分数
let score = 0;
// 当前位置（使用变量存储，避免频繁读取DOM）
let currentPosition = 0;
// 获取一行的高度（容器高度的25%）
function getRowHeight() {
  return box.offsetHeight * 0.25;
}
// 游戏开始
function start() {
  // 游戏开始按钮添加事件（支持点击和触摸）
  const startGame = () => {
    // 点击后隐藏按钮
    go.style.display = "none";
    // 调用移动函数让table动起来
    move();
  };
  go.addEventListener("click", startGame);
  go.addEventListener("touchend", (e) => {
    e.preventDefault();
    startGame();
  });
}
// 执行游戏函数
start();
// 移动
function move() {
  // 取消之前的动画帧
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // 获取初始位置（一行高度的负值）
  const initialPosition = -getRowHeight();
  currentPosition = initialPosition;
  
  // 根据容器高度计算移动速度（自适应，单位：px/帧）
  const speedPerFrame = Math.max(1.5, box.offsetHeight * 0.006);
  
  // 上次动画时间
  let lastTime = performance.now();
  
  // 使用 requestAnimationFrame 实现流畅动画
  function animate(currentTime) {
    // 计算时间差，确保不同帧率下速度一致
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // 根据时间差调整移动距离（60fps 为基准）
    const frameMultiplier = deltaTime / 16.67; // 16.67ms = 60fps
    currentPosition += speedPerFrame * frameMultiplier;
    
    // 使用 transform 替代 top，性能更好
    table.style.transform = `translateY(${currentPosition}px)`;
    
    // 如果回到原位就重新再返回初始位置
    if (currentPosition >= 0) {
      currentPosition = initialPosition;
      table.style.transform = `translateY(${currentPosition}px)`;
      // 之后返回顶部后才会创建标签
      createTr();
    }
    
    // 如果当前容器里面达到6个就删除最后一个
    if (table.children.length >= 6) {
      // 如果要删除的行中有一个没点击的，游戏结束
      if (Array.from(table.lastElementChild.children).some((ele) => +ele.dataset.index == 1)) {
        // 取消动画帧
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // 弹出游戏结束
        alert(`游戏结束，您的分数是：${score}`);
        // 清空整个table
        table.innerHTML = "";
        // 移除事件委托
        table.removeEventListener("click", clickFk);
        table.removeEventListener("touchend", touchFk);
        // 重新让开始游戏显示出来
        go.style.display = "block";
        return;
      }
      // 由于我在上方加了结束游戏后清空table
      // 清空后table没有东西，还运行下面代码的话会报错，所以用if判断table里是否还有东西
      if (table.children.length > 0) {
        // 删除最后一个元素
        table.children[table.children.length - 1].remove();
      }
    }
    
    // 继续下一帧动画
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // 开始动画
  animationFrameId = requestAnimationFrame(animate);
  
  // 添加事件委托（支持点击和触摸）
  table.addEventListener("click", clickFk);
  table.addEventListener("touchend", touchFk);
}
// 创建方块
function createTr() {
  // 创建行
  let tr = document.createElement("tr");
  // 创建随机数，随机让一个成为点击对象
  const random = getRandom(0, 3);
  // 循环4次让一行有4个方块
  for (let i = 0; i < 4; i++) {
    // 一次循环创建一个td
    let td = document.createElement("td");
    // 将td插入tr
    tr.appendChild(td);
  }
  // 让随机一个方块变成黑色
  tr.children[random].style.backgroundColor = "black";
  // 给要点击的方块设置一个index
  tr.children[random].dataset.index = 1;
  // 循环完后在table的最前面插入
  table.insertBefore(tr, table.childNodes[0]);
}
// 处理方块点击/触摸的通用函数
function handleBlockClick(target) {
  // 判断点击的方块index是否为1
  if (target.dataset.index == 1) {
    // 点击后改变颜色
    target.style.backgroundColor = "gray";
    // 将index设置为0
    target.dataset.index = 0;
    // 分数+1
    score++;
  } else {
    // 如果点击的不是需要点击的方块，那么游戏直接结束
    // 取消动画帧
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    // 弹出游戏结束
    alert(`游戏结束，您的分数是：${score}`);
    // 清空整个table
    table.innerHTML = "";
    // 移除事件委托
    table.removeEventListener("click", clickFk);
    table.removeEventListener("touchend", touchFk);
    // 重新让开始游戏显示出来
    go.style.display = "block";
  }
}

// 点击方块事件
function clickFk(e) {
  // 使用事件委托
  if (e.target.tagName === "TD") {
    handleBlockClick(e.target);
  }
}

// 触摸方块事件（移动端优化）
function touchFk(e) {
  e.preventDefault();
  // 使用事件委托
  const target = e.target;
  if (target.tagName === "TD") {
    handleBlockClick(target);
  }
}
