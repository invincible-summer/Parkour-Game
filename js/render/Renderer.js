import { CONFIG } from '../data/config.js';
import { drawBackground, drawTiles, drawGoal } from './assets.js';

// Canvas 渲染入口：DPR 处理、背景、世界、实体、玩家、粒子、调试覆盖层。
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
  }
  resize() {
    this.canvas.width = Math.round(CONFIG.VIEW_W * this.dpr);
    this.canvas.height = Math.round(CONFIG.VIEW_H * this.dpr);
  }

  render(game) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const cam = game.camera;
    drawBackground(ctx, game.state === 'menu' ? game.menuScroll : cam.x);

    ctx.save();
    ctx.translate(-Math.round(cam.x + cam.offX), -Math.round(cam.y + cam.offY));

    const world = game.world;
    if (world) {
      const T = CONFIG.TILE;
      const pad = T;
      drawTiles(ctx, world.tileMap, cam.x - pad, cam.y - pad,
        CONFIG.VIEW_W + pad * 2, CONFIG.VIEW_H + pad * 2);
      for (const e of world.getActiveEntities()) e.draw(ctx);
      if (world.getGoalX() != null) drawGoal(ctx, world.getGoalX(), world.pixelHeight);
      if (game.state !== 'menu') game.player.draw(ctx);
      game.particles.draw(ctx);
    }
    ctx.restore();

    if (game.debug) this.drawDebug(ctx, game);
  }

  drawDebug(ctx, game) {
    const p = game.player, b = p.body;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.beginPath();
    ctx.moveTo(b.x + b.w / 2, b.y + b.h / 2);
    ctx.lineTo(b.x + b.w / 2 + b.vx * 0.05, b.y + b.h / 2 + b.vy * 0.05);
    ctx.stroke();
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    const lines = [
      `fps ${game.fps.toFixed(0)}`,
      `pos ${b.x.toFixed(0)},${b.y.toFixed(0)}`,
      `vel ${b.vx.toFixed(0)},${b.vy.toFixed(0)}`,
      `ground ${b.onGround} wall ${b.touchWall}`,
      `jumps ${p.jumpsLeft} coyote ${p.coyote.toFixed(2)}`,
      `wallLock ${p.wallLock.toFixed(2)} stick ${p.wallStick.toFixed(2)} slide ${p.isSliding}`,
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 8, 14 + i * 14);
    }
  }
}
