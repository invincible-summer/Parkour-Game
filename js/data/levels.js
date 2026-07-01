// 关卡数据：地形由辅助函数程序化构建，保证「每行宽度一致、地面连续、结构可达」。
// 字符：. 空   # 实心   | 可蹬墙(竖墙)   ^ 单向平台（仅从上方踩实，可下穿）
// 坐标单位 = tile。GROUND=15 为地面行，玩家踩其顶面（start.y=GROUND）。
const W = 62, H = 17, GROUND = 15;

function grid() { return Array.from({ length: H }, () => new Array(W).fill('.')); }
function toRows(g) { return g.map(r => r.join('')); }
function fillGround(g) {
  for (let x = 0; x < W; x++) { g[GROUND][x] = '#'; g[GROUND + 1][x] = '#'; }
}
function clearGround(g, x0, x1) {            // 挖坑 x0..x1-1
  for (let x = x0; x < x1; x++) if (x >= 0 && x < W) { g[GROUND][x] = '.'; g[GROUND + 1][x] = '.'; }
}
function rect(g, x0, y0, w, h, c = '#') {     // 实心矩形
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
    if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c;
}
function oneway(g, x0, y, len) {              // 单向平台
  for (let i = 0; i < len; i++) if (y >= 0 && y < H && x0 + i >= 0 && x0 + i < W) g[y][x0 + i] = '^';
}
function wall(g, x0, yTop, yBot) {            // 竖墙（可蹬墙）yTop..yBot
  for (let y = yTop; y <= yBot; y++) if (y >= 0 && y < H && x0 >= 0 && x0 < W) g[y][x0] = '|';
}

// ---- 关卡 1：教学关（连续地面 + 单向平台 + 矮墙教「撞墙跳」）----
function level1() {
  const g = grid(); fillGround(g);
  oneway(g, 8, 12, 4);
  oneway(g, 16, 11, 4);
  oneway(g, 24, 12, 3);
  wall(g, 33, 14, 14);                        // 矮墙：撞住后按跳越过
  wall(g, 41, 14, 14);
  return {
    id: 1, name: '霓虹起跑 · 教学关', rows: toRows(g),
    coins:   [{ x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 },
              { x: 17, y: 10 }, { x: 18, y: 10 }, { x: 19, y: 10 },
              { x: 25, y: 11 }, { x: 26, y: 11 },
              { x: 35, y: 13 }, { x: 43, y: 13 }],
    powerups: [], obstacles: [],
    start: { x: 4, y: GROUND }, goal: { x: W - 2, y: GROUND },
  };
}

// ---- 关卡 2：二段跳（坑 + 单向平台，高位金币鼓励二段跳）----
function level2() {
  const g = grid(); fillGround(g);
  clearGround(g, 14, 18);                     // 坑
  oneway(g, 22, 12, 4);                       // 单向平台
  wall(g, 30, 14, 14);                        // 矮墙
  clearGround(g, 36, 40);                     // 坑
  oneway(g, 44, 11, 4);                       // 高位单向平台（二段跳拿金币）
  return {
    id: 2, name: '跃迁 · 二段跳', rows: toRows(g),
    coins:   [{ x: 15, y: 13 }, { x: 16, y: 13 },
              { x: 23, y: 11 }, { x: 24, y: 11 },
              { x: 37, y: 13 }, { x: 38, y: 13 },
              { x: 45, y: 10 }],
    powerups: [], obstacles: [],
    start: { x: 4, y: GROUND }, goal: { x: W - 2, y: GROUND },
  };
}

// ---- 关卡 3：蹬墙跳（连续矮墙反复「撞→跳」）----
function level3() {
  const g = grid(); fillGround(g);
  for (const x of [10, 18, 26, 34, 42, 50]) wall(g, x, 14, 14);
  oneway(g, 14, 12, 2);
  oneway(g, 22, 12, 2);
  oneway(g, 30, 12, 2);
  oneway(g, 38, 12, 2);
  oneway(g, 46, 12, 2);
  return {
    id: 3, name: '立面 · 蹬墙跳', rows: toRows(g),
    coins:   [{ x: 12, y: 13 }, { x: 20, y: 13 }, { x: 28, y: 13 },
              { x: 36, y: 13 }, { x: 44, y: 13 }, { x: 52, y: 13 }],
    powerups: [], obstacles: [],
    start: { x: 4, y: GROUND }, goal: { x: W - 2, y: GROUND },
  };
}

// ---- 关卡 4：综合挑战（坑/墙交替，每个障碍前留足平地助跑）----
function level4() {
  const g = grid(); fillGround(g);
  clearGround(g, 10, 14);                     // 坑
  wall(g, 20, 14, 14);                        // 矮墙
  clearGround(g, 28, 32);                     // 坑
  wall(g, 38, 14, 14);                        // 矮墙
  clearGround(g, 46, 50);                     // 坑
  oneway(g, 52, 11, 4);                       // 终点前高位平台（拿盾）
  return {
    id: 4, name: '夜行 · 综合挑战', rows: toRows(g),
    coins:   [{ x: 11, y: 13 }, { x: 12, y: 13 },
              { x: 29, y: 13 }, { x: 30, y: 13 },
              { x: 47, y: 13 }, { x: 48, y: 13 }],
    powerups: [{ x: 30, y: 12, type: 'magnet' }, { x: 53, y: 10, type: 'shield' }],
    obstacles: [],
    start: { x: 4, y: GROUND }, goal: { x: W - 2, y: GROUND },
  };
}

export const LEVELS = [level1(), level2(), level3(), level4()];
