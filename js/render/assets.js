import { CONFIG } from '../data/config.js';
import { TILE } from '../world/Tile.js';
import { Random } from '../core/Random.js';

const T = CONFIG.TILE;
const THEME = CONFIG.THEME;

// 预生成视差天际线（远/近两层），用种子保证每次刷新一致。
const PERIOD = 1400;
const farBld = buildSkyline(42, 90, 26, 70, 1234);
const nearBld = buildSkyline(30, 150, 60, 180, 5678);

function buildSkyline(count, minW, minH, maxH, seed) {
  const rng = new Random(seed);
  const arr = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    const w = rng.int(minW, minW + 40);
    const h = rng.int(minH, maxH);
    const wins = [];
    for (let wy = 8; wy < h - 6; wy += 12) {
      for (let wx = 4; wx < w - 4; wx += 9) {
        if (rng.next() < 0.4) wins.push({ x: wx, y: wy });
      }
    }
    arr.push({ x, w, h, wins });
    x += w + rng.int(6, 30);
  }
  return { arr, period: x };
}

// 背景：合成波渐变天空 + 落日 + 视差天际线 + 地平线辉光。
export function drawBackground(ctx, camX) {
  const W = CONFIG.VIEW_W, H = CONFIG.VIEW_H;
  const horizon = H * 0.74;

  // 天空渐变
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, THEME.skyTop);
  g.addColorStop(0.6, THEME.skyMid);
  g.addColorStop(1, THEME.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, horizon);

  // 落日
  const sunX = W * 0.5 - (camX * 0.02) % W;
  const sunY = horizon - 80;
  const sun = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 120);
  sun.addColorStop(0, '#fff2c4');
  sun.addColorStop(0.4, THEME.sun);
  sun.addColorStop(1, 'rgba(255,94,138,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();
  // 落日横纹（合成波经典）
  ctx.fillStyle = THEME.skyMid;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(sunX - 110, sunY + 10 + i * 14, 220, 5);
  }

  // 地面（地平线以下）
  ctx.fillStyle = THEME.nearBld;
  ctx.fillRect(0, horizon, W, H - horizon);

  // 视差天际线
  drawSkyline(ctx, farBld, 0.12, camX, horizon, THEME.farBld, true);
  drawSkyline(ctx, nearBld, 0.28, camX, horizon, THEME.nearBld, false);

  // 地平线辉光
  const hg = ctx.createLinearGradient(0, horizon - 6, 0, horizon + 6);
  hg.addColorStop(0, 'rgba(255,94,138,0)');
  hg.addColorStop(0.5, THEME.grid);
  hg.addColorStop(1, 'rgba(255,94,138,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, horizon - 6, W, 12);
}

function drawSkyline(ctx, skyline, factor, camX, horizon, color, far) {
  const { arr, period } = skyline;
  const shift = ((camX * factor) % period + period) % period;
  ctx.fillStyle = color;
  for (let rep = -1; rep <= 1; rep++) {
    for (const b of arr) {
      const x = b.x - shift + rep * period;
      if (x > CONFIG.VIEW_W || x + b.w < 0) continue;
      ctx.fillRect(x, horizon - b.h, b.w, b.h);
      if (!far) {
        ctx.fillStyle = 'rgba(255,210,120,0.5)';
        for (const w of b.wins) ctx.fillRect(x + w.x, horizon - b.h + w.y, 3, 4);
        ctx.fillStyle = color;
      }
    }
  }
}

// 绘制可见范围内的瓦片。
export function drawTiles(ctx, tileMap, x, y, w, h) {
  for (const t of tileMap.inRect(x, y, w, h)) drawTile(ctx, t.tx, t.ty, t.t);
}

export function drawTile(ctx, tx, ty, t) {
  const px = tx * T, py = ty * T;
  if (t === TILE.SOLID) {
    ctx.fillStyle = THEME.solid;
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = THEME.solidEdge;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(px, py, T, 3);                 // 顶面霓虹边
    ctx.globalAlpha = 0.25;
    ctx.fillRect(px, py, 2, T);                 // 左侧微光
    ctx.globalAlpha = 1;
  } else if (t === TILE.WALL) {
    ctx.fillStyle = THEME.wall;
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = THEME.wallEdge;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(px, py, 3, T);
    ctx.fillRect(px + T - 3, py, 3, T);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < T; i += 8) ctx.fillRect(px + 6, py + i, T - 12, 2);
    ctx.globalAlpha = 1;
  } else if (t === TILE.ONE_WAY) {
    ctx.fillStyle = THEME.oneWay;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(px, py + T - 6, T, 5);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(px, py + T - 10, T, 2);
    ctx.globalAlpha = 1;
  }
}

// 终点线
export function drawGoal(ctx, x, h) {
  const seg = 16;
  ctx.save();
  ctx.shadowColor = THEME.wallEdge;
  ctx.shadowBlur = 20;
  for (let y = 0; y < h; y += seg) {
    ctx.fillStyle = ((y / seg) | 0) % 2 === 0 ? '#e8fbff' : THEME.wallEdge;
    ctx.fillRect(x - 5, y, 10, seg);
  }
  ctx.restore();
}
