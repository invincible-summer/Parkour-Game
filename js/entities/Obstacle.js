import { Entity } from './Entity.js';
import { CONFIG } from '../data/config.js';

const T = CONFIG.TILE;

export class Obstacle extends Entity {
  constructor(px, py, type = 'spike') {
    super(px, py + T * 0.35, T, T * 0.65);
    this.type = 'obstacle';
    this.kind = type;
  }
  // 是否对玩家致命（破盾则免死）
  isLethal() { return true; }
  draw(ctx) {
    const T = CONFIG.THEME;
    ctx.save();
    ctx.shadowColor = T.danger;
    ctx.shadowBlur = 12;
    ctx.fillStyle = T.danger;
    const n = 4;
    const seg = this.w / n;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.h);
    for (let i = 0; i < n; i++) {
      ctx.lineTo(this.x + seg * (i + 0.5), this.y);
      ctx.lineTo(this.x + seg * (i + 1), this.y + this.h);
    }
    ctx.fill();
    ctx.restore();
  }
}
