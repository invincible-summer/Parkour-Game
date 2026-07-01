import { Entity } from './Entity.js';
import { CONFIG } from '../data/config.js';
import { TILE } from '../world/Tile.js';

const T = CONFIG.TILE;

export class Coin extends Entity {
  constructor(x, y) {
    super(x - 9, y - 9, 18, 18);
    this.type = 'coin';
    this.cx = x; this.cy = y;
    this.t = Math.random() * Math.PI * 2;
    this.collected = false;
  }
  update(dt, game) {
    this.t += dt * 6;
    // 磁铁吸引
    if (game.player.power.magnet > 0) {
      const p = game.player.body;
      const dx = (p.x + p.w / 2) - this.cx;
      const dy = (p.y + p.h / 2) - this.cy;
      const d = Math.hypot(dx, dy);
      if (d < 220) {
        this.cx += dx / d * 600 * dt;
        this.cy += dy / d * 600 * dt;
      }
    }
    this.x = this.cx - 9; this.y = this.cy - 9;
  }
  collect(game) {
    if (this.collected) return;
    this.collected = true;
    this.dead = true;
    game.coins++;
    game.fx.burst(this.cx, this.cy, CONFIG.THEME.coin, 8, 140);
  }
  draw(ctx) {
    if (this.dead) return;
    const w = Math.abs(Math.cos(this.t)) * 7 + 2;
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.shadowColor = CONFIG.THEME.coinEdge;
    ctx.shadowBlur = 10;
    ctx.fillStyle = CONFIG.THEME.coin;
    ctx.beginPath();
    ctx.ellipse(0, 0, w, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
