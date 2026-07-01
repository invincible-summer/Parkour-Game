import { Entity } from './Entity.js';
import { CONFIG } from '../data/config.js';

const COLORS = {
  shield: '#19e7ff', magnet: '#ff4d8d', speed: '#ffd36e',
};
const LABEL = { shield: 'S', magnet: 'M', speed: 'A' };

export class PowerUp extends Entity {
  constructor(x, y, type) {
    super(x - 12, y - 12, 24, 24);
    this.type = 'powerup';
    this.kind = type;
    this.cx = x; this.cy = y;
    this.t = 0;
  }
  update(dt) { this.t += dt; this.y = this.cy - 12 + Math.sin(this.t * 3) * 3; }
  apply(game) {
    this.dead = true;
    const p = game.player.power;
    if (this.kind === 'shield') p.shield = 1;
    else if (this.kind === 'magnet') p.magnet = 6;
    else if (this.kind === 'speed') p.speed = 4;
    game.fx.burst(this.cx, this.cy, COLORS[this.kind], 14, 200);
  }
  draw(ctx) {
    const T = CONFIG.THEME, c = COLORS[this.kind];
    ctx.save();
    ctx.translate(this.cx, this.cy + 12);
    ctx.shadowColor = c;
    ctx.shadowBlur = 14;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b0b1a';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABEL[this.kind], 0, 1);
    ctx.restore();
  }
}
