// ============================================================
// 实验二 寻宝游戏 —— main.js(动画页面脚本)
//
// 职责:订阅 treasure.js 中 async/await 寻宝流程的每一步剧情
//       (findTreasure 的 onEvent 回调),渲染成
//       「地图行进 + 打字机日志 + 特效」的页面动画。
// ============================================================

// ---------- 页面元素 ----------
const mapEl = document.getElementById("map");
const explorerEl = document.getElementById("explorer");
const guardEl = document.getElementById("guard");
const flashEl = document.getElementById("flash");
const logEl = document.getElementById("log");
const dotsEl = document.getElementById("dots");
const startBtn = document.getElementById("start");
const overlayEl = document.getElementById("overlay");
const overlayIconEl = document.getElementById("overlay-icon");
const overlayTitleEl = document.getElementById("overlay-title");
const overlaySubEl = document.getElementById("overlay-sub");
const againBtn = document.getElementById("again");
const coinsEl = document.getElementById("coins");

// ---------- 站点坐标(与 index.html 中节点的 --x / --y 一致)----------
const SPOTS = {
  library: [10, 74],
  stele: [24, 40],
  ruins: [42, 66],
  river: [58, 32],
  temple: [74, 62],
  chest: [89, 34],
};

let running = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- 地图动画 ----------
function moveExplorer(nodeKey) {
  const [x, y] = SPOTS[nodeKey];
  explorerEl.style.left = `${x}%`;
  explorerEl.style.top = `${y}%`;
}

function setActiveNode(nodeKey) {
  mapEl.querySelectorAll(".node.active").forEach((n) => n.classList.remove("active"));
  mapEl.querySelector(`.node[data-node="${nodeKey}"]`)?.classList.add("active");
  dotsEl.querySelector(`.dot[data-node="${nodeKey}"]`)?.classList.add("lit");
}

// 移除再强制重排,让同名 CSS 动画可以重复触发
function retrigger(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function shakeTemple() {
  retrigger(mapEl.querySelector('.node[data-node="temple"]'), "shake");
  guardEl.classList.add("show");
}

function goldenFlash() {
  retrigger(flashEl, "go");
}

// ---------- 日志:打字机效果 ----------
async function typewrite(el, text) {
  for (const ch of text) {
    el.textContent += ch;
    await sleep(20);
  }
}

const TAGS = { info: "剧情", success: "进展", warning: "危机", danger: "失败", final: "结局" };

async function addLog(type, text) {
  const entry = document.createElement("div");
  entry.className = `entry ${type} typing`;
  entry.innerHTML = `<span class="tag">${TAGS[type] ?? "剧情"}</span><span class="text"></span>`;
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
  await typewrite(entry.querySelector(".text"), text);
  entry.classList.remove("typing");
}

// ---------- 结算 ----------
function coinBurst() {
  coinsEl.innerHTML = "";
  for (let i = 0; i < 26; i++) {
    const coin = document.createElement("span");
    coin.className = "coin";
    coin.textContent = Math.random() < 0.3 ? "💎" : "🪙";
    coin.style.left = `${15 + Math.random() * 70}%`;
    coin.style.setProperty("--dx", `${(Math.random() - 0.5) * 280}px`);
    coin.style.setProperty("--dy", `${-60 - Math.random() * 160}px`);
    coin.style.setProperty("--fall", `${220 + Math.random() * 220}px`);
    coin.style.animationDelay = `${Math.random() * 0.6}s`;
    coinsEl.appendChild(coin);
  }
}

function showOverlay(success) {
  overlayEl.classList.toggle("fail", !success);
  overlayIconEl.textContent = success ? "🏆" : "😵";
  overlayTitleEl.textContent = success ? "寻宝成功!" : "任务失败";
  overlaySubEl.textContent = success
    ? "失落宝藏重见天日,金币和宝石堆成了小山。"
    : "守卫没有再给机会,冒险到此为止……点下面的按钮再试一次。";
  overlayEl.classList.add("show");
}

// ---------- 剧情事件 → 页面动画 ----------
// treasure.js 的每一步都会 await 这里,动画节奏与剧情严格同步
async function onEvent(type, text, node) {
  switch (type) {
    case "info":
      await addLog("info", text);
      break;

    case "success":
      if (node) {
        moveExplorer(node);
        setActiveNode(node);
        await sleep(1400); // 等探险家走到站点,再讲述剧情
      }
      await addLog("success", text);
      break;

    case "warning":
      shakeTemple();
      await addLog("warning", text);
      break;

    case "danger":
      guardEl.classList.remove("show");
      await addLog("danger", text);
      showOverlay(false);
      finish();
      break;

    case "final":
      guardEl.classList.remove("show");
      goldenFlash();
      coinBurst();
      await addLog("final", text);
      showOverlay(true);
      finish();
      break;
  }
}

// ---------- 开始 / 重置 ----------
function resetUI() {
  logEl.innerHTML = "";
  dotsEl.querySelectorAll(".dot.lit").forEach((d) => d.classList.remove("lit"));
  mapEl.querySelectorAll(".node").forEach((n) => n.classList.remove("active", "shake"));
  guardEl.classList.remove("show");
  overlayEl.classList.remove("show");
  coinsEl.innerHTML = "";
  moveExplorer("library");
  setActiveNode("library");
}

function finish() {
  running = false;
  startBtn.disabled = false;
  startBtn.textContent = "再来一次";
}

startBtn.addEventListener("click", () => {
  if (running) return;
  running = true;
  startBtn.disabled = true;
  startBtn.textContent = "寻宝进行中……";
  resetUI();
  findTreasure(onEvent);
});

againBtn.addEventListener("click", () => {
  if (running) return;
  startBtn.click();
});
