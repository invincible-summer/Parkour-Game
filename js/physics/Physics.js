import { CONFIG } from '../data/config.js';
import { blocksHorizontal, isSolid, isOneWay } from '../world/Tile.js';

// 纯解算：给定 body + world(需提供 getTile(tx,ty))，按「先 X 后 Y」分轴积分并解算碰撞。
// 每帧由 Player 调一次。world 不关心「玩家是谁」，故无尽/关卡可复用。
const T = CONFIG.TILE;

export class Physics {
  static moveAndCollide(body, world, dt) {
    body.prevOnGround = body.onGround;
    body.onGround = false;
    body.touchWall = 0;

    // ---- X 轴 ----
    body.x += body.vx * dt;
    resolveX(body, world);

    // ---- Y 轴 ----
    body.y += body.vy * dt;
    resolveY(body, world, dt);
  }
}

function resolveX(body, world) {
  const minTy = Math.floor(body.y / T);
  const maxTy = Math.floor((body.y + body.h - 1) / T);
  if (body.vx > 0) {
    const tx = Math.floor((body.x + body.w) / T); // 右沿所在列
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (blocksHorizontal(world.getTile(tx, ty))) {
        body.x = tx * T - body.w;
        body.vx = 0;
        body.touchWall = 1;
        break;
      }
    }
  } else if (body.vx < 0) {
    const tx = Math.floor(body.x / T); // 左沿所在列
    for (let ty = minTy; ty <= maxTy; ty++) {
      if (blocksHorizontal(world.getTile(tx, ty))) {
        body.x = (tx + 1) * T;
        body.vx = 0;
        body.touchWall = -1;
        break;
      }
    }
  }
}

function resolveY(body, world, dt) {
  const minTx = Math.floor(body.x / T);
  const maxTx = Math.floor((body.x + body.w - 1) / T);
  if (body.vy > 0) {
    // 下落：脚部所在行
    const ty = Math.floor((body.y + body.h) / T);
    const prevBottom = (body.y + body.h) - body.vy * dt; // 移动前脚底
    for (let tx = minTx; tx <= maxTx; tx++) {
      const t = world.getTile(tx, ty);
      if (isSolid(t)) {
        // 单向平台：仅当此前脚底在平台顶之上时才落地
        if (isOneWay(t) && prevBottom > ty * T + 1) continue;
        body.y = ty * T - body.h;
        body.vy = 0;
        body.onGround = true;
        break;
      }
    }
  } else if (body.vy < 0) {
    // 上升：头部所在行；单向平台不挡头顶（从下方穿过）
    const ty = Math.floor(body.y / T);
    for (let tx = minTx; tx <= maxTx; tx++) {
      const t = world.getTile(tx, ty);
      if (isOneWay(t)) continue;
      if (isSolid(t)) {
        body.y = (ty + 1) * T;
        body.vy = 0;
        break;
      }
    }
  }
}
