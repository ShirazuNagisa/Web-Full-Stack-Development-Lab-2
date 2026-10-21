# 实验二 寻宝游戏 —— 说明文档

## 一、运行方式

- **动画页面**:直接双击打开 `index.html`(或用 VS Code Live Server),点击「启程寻宝」。
- **命令行验证**:`node treasure.js`,以纯文本日志跑完整个异步流程(无需浏览器)。

## 二、任务 1:运行理解原始代码

原始附件备份为 `treasure-original.js`。它的流程是一条 Promise 回调链:

```
getInitialClue(1s) → decodeAncientScript(1.5s) → searchTemple(2s, 50% 随机失败) → openTreasureBox(1s)
```

每一步 `.then` 里手动 `return` 下一个 Promise,最后的 `.catch` 统一接住任何一步的失败。

阅读时发现的两个小问题(重写版已修正):

1. `decodeAncientScript` / `searchTemple` 在 `reject(...)` 后没有 `return`,后面的 `resolve(...)` 仍会执行。Promise 以先到者为准,结果碰巧正确,但属于隐患;
2. `.then` 长链每一步都要手动 `return`,容易漏;`async/await` 可以把整条链写成顺序代码,错误用 `try/catch` 接住。

## 三、任务 2:新增的异步寻宝情节

| 新情节 | 剧情设计 | 异步手法 |
| --- | --- | --- |
| 收集地图碎片 | 三块碎片散落在遗迹各处,分头并行寻找 | `Promise.all`:三路同时出发,全部到手才拼出完整地图 |
| 渡忘川之河 | 老船夫稳但慢(2.6s),独木桥快但可能塌(40%) | `Promise.any`:两条路同时出发,谁先成功走谁;桥塌自动等船夫 |
| 神庙守卫与谜语 | 搜索神庙有 50% 概率被守卫发现 | `await` + `while` 重试:被拦下就猜谜换一次重试机会,谜语再失败(15%)整场才失败 |

新增 API:`collectMapFragments()`、`crossRiver()`、`solveGuardRiddle()`;重试逻辑封装在 `sneakIntoTemple()` 中。

## 四、任务 3:async/await 重写要点

- `findTreasure` 声明为 `async`,七个站点全部用 `await` 串成顺序剧情,替代原来的 `.then` 长链;
- 一个 `try/catch` 接管原 `.catch`:任何一步失败都会跳到 `catch`,发布「任务失败」事件;
- 守卫环节 `sneakIntoTemple` 用 `async` 循环 + `try/catch` 实现「失败→猜谜→重试」,是 `await` 与异常处理结合的典型用法;
- `onEvent` 回调本身也被 `await`,保证页面动画节奏与剧情严格同步;
- `Promise.all` / `Promise.any` 与 `await` 组合:并行竞速的结果作为一次 `await` 的返回值融入主线。

## 五、任务 4:动画页面设计

页面分为左右两栏:左侧「寻宝地图」,右侧「冒险日志」。

- `index.html`:夜色地图上六个站点(图书馆 → 石碑 → 遗迹 → 忘川河 → 神庙 → 宝箱),虚线路线串联;右侧为日志面板、进度点和开始按钮。
- `style.css`:星空闪烁、迷雾漂移、路线虚线行进、站点脉冲、探险家行进过渡、守卫震屏、金色闪光、金币迸发、打字机光标、结算弹层弹性缩放;并支持 `prefers-reduced-motion`。
- `main.js`:接收 `findTreasure` 的每一步事件 → 移动探险家、点亮进度点、打字机输出日志、触发对应特效;结局弹出成功/失败卡片,可一键再来一次。

## 六、文件清单

| 文件 | 说明 |
| --- | --- |
| `treasure-original.js` | 原始附件备份(未改动) |
| `treasure.js` | 重写版:扩展 API + async/await 主流程,可在 Node 直接运行 |
| `index.html` / `style.css` / `main.js` | 动画页面三件套 |
| `README.md` | 本说明文档 |
