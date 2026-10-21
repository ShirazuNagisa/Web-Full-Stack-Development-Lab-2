// ============================================================
// 实验二 寻宝游戏 —— treasure.js(async/await 重写版)
//
// 对照实验要求:
//   ① 原始附件已备份为 treasure-original.js。本文件保留其
//      「宝藏地图 API」契约(方法名、等待时长、随机失败),
//      并修正了原版 reject(...) 后未 return 的小隐患。
//   ② 新增三个异步寻宝情节:
//        - collectMapFragments  三块地图碎片并行寻找       → Promise.all
//        - crossRiver           忘川之河二选一路线竞速     → Promise.any
//        - solveGuardRiddle     被守卫拦下时猜谜换重试机会 → await + 循环重试
//   ③ 寻宝过程 findTreasure 全部用 async/await 编排;
//   ④ 动画页面由 index.html + style.css + main.js 完成,
//      页面通过 findTreasure(onEvent) 的回调逐步拿到剧情。
//
// 在命令行运行 `node treasure.js`,可用纯文本日志验证整个异步流程。
// ============================================================

// Promise 版 sleep,让每个 API 的等待时长一目了然
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟宝藏地图 API(扩展版)
class TreasureMap {
  // 第 1 站:古老图书馆,找到初始线索
  static getInitialClue() {
    return new Promise((resolve) => {
      setTimeout(() => resolve("在古老的图书馆里找到了第一个线索..."), 1000);
    });
  }

  // 第 2 站:解读石碑上的古老文字
  static decodeAncientScript(clue) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!clue) {
          reject("没有线索可以解码!");
          return; // 原版漏了这行:reject 之后代码仍会继续执行到 resolve
        }
        resolve("解码成功!宝藏藏在一座古老的神庙中...");
      }, 1500);
    });
  }

  // 第 3 站(新情节):三块地图碎片散落在遗迹各处,分头并行寻找
  static collectMapFragments() {
    const digFragment = (name, ms) =>
      new Promise((resolve) => setTimeout(() => resolve(name), ms));

    // Promise.all:三路同时出发,全部到手才能拼出完整地图
    return Promise.all([
      digFragment("青铜碎片", 1200),
      digFragment("羊皮碎片", 1500),
      digFragment("星象碎片", 900),
    ]).then(
      (parts) => `拼合${parts.join("、")},完整地图浮现:要去神庙,得先渡过忘川之河!`
    );
  }

  // 第 4 站(新情节):渡忘川之河——老船夫稳但慢,独木桥快但可能塌
  static crossRiver() {
    const oldFerry = new Promise((resolve) =>
      setTimeout(() => resolve("老船夫慢悠悠却稳稳地把你渡过了忘川之河"), 2600)
    );

    const logBridge = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.4) {
          reject("独木桥中途断裂!你狼狈地爬回了岸边");
          return;
        }
        resolve("你飞奔冲过摇摇晃晃的独木桥,抢先过了河!");
      }, 1400);
    });

    // Promise.any:两条路同时出发,谁先成功就走谁;桥塌了自动等船夫来接
    return Promise.any([oldFerry, logBridge]);
  }

  // 第 5 站:搜索神庙,有概率撞上守卫(保留原版 50% 随机失败)
  static searchTemple(location) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.5) {
          reject("糟糕!被神庙守卫发现了!");
          return;
        }
        resolve("在神庙深处找到了一个神秘的箱子...");
      }, 2000);
    });
  }

  // 第 6 站(新情节):守卫给出谜语,答对就放行一次
  static solveGuardRiddle() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.15) {
          reject("谜语没能答上来,守卫把你轰出了神庙!");
          return;
        }
        resolve("你答对了守卫的谜语,他嘀咕着退回了阴影里...");
      }, 1300);
    });
  }

  // 第 7 站:打开宝箱
  static openTreasureBox() {
    return new Promise((resolve) => {
      setTimeout(() => resolve("恭喜!你找到了传说中的宝藏!金币在箱子里闪闪发光!"), 1000);
    });
  }
}

// 守卫环节:反复尝试潜入神庙,被抓住就猜谜换一次重试机会;
// 连谜语也失败时把异常抛给最外层,整场寻宝宣告失败。
async function sneakIntoTemple(location, emit) {
  while (true) {
    try {
      return await TreasureMap.searchTemple(location);
    } catch (guardError) {
      await emit("warning", guardError, "temple");
      await emit("info", "只能赌一把:接受守卫的谜语挑战...", "temple");
      const riddleResult = await TreasureMap.solveGuardRiddle(); // 谜语失败会向上抛出
      await emit("success", riddleResult, "temple");
    }
  }
}

// 寻宝主流程:async/await 版本(替代原版的 .then 长链)
// onEvent(type, text, node) 把每一步剧情交给页面(或控制台)展示
async function findTreasure(onEvent = async () => {}) {
  const emit = (type, text, node) => onEvent(type, text, node);

  try {
    await emit("info", "寻宝之旅开始!目标:传说中的失落宝藏");

    const clue = await TreasureMap.getInitialClue(); // 站点:图书馆
    await emit("success", clue, "library");

    const location = await TreasureMap.decodeAncientScript(clue); // 站点:石碑
    await emit("success", location, "stele");

    const mapReady = await TreasureMap.collectMapFragments(); // 站点:遗迹(并行找碎片)
    await emit("success", mapReady, "ruins");

    const crossing = await TreasureMap.crossRiver(); // 站点:忘川之河(二选一竞速)
    await emit("success", crossing, "river");

    const box = await sneakIntoTemple(location, emit); // 站点:神庙(可能反复与守卫周旋)
    await emit("success", box, "temple");

    const treasure = await TreasureMap.openTreasureBox(); // 站点:宝箱
    await emit("final", treasure, "chest");
    return treasure;
  } catch (error) {
    await emit("danger", `任务失败:${error}`);
    return null;
  }
}

// 在 Node 环境里直接运行时,用纯文本日志跑一遍完整流程,便于验证
if (typeof document === "undefined") {
  const marks = { info: "·", success: "✔", warning: "!", danger: "✘", final: "★" };
  findTreasure((type, text) => {
    console.log(`[${marks[type] ?? "·"}] ${text}`);
  }).then((result) => {
    if (result) console.log(`—— 本次寻宝收获:${result}`);
  });
}
