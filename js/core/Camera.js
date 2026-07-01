import { CONFIG } from '../data/config.js';

// 横向跟随 + 轻微前瞻 + Y 钳制 + 屏幕抖动。
export class Camera {
  constructor() {
    this.x = 0; this.y = 0;
    this.shakeT = 0; this.shakeMag = 0;
    this._t = 0;
  }
  snap(target, world) {
    this.x = Math.max(0, target.x - CONFIG.VIEW_W * 0.34);
    this.y = clampY(target.y - CONFIG.VIEW_H * 0.55, world);
  }
  follow(target, world, dt) {
    this._t += dt;
    const desiredX = Math.max(0, target.x - CONFIG.VIEW_W * 0.34);
    this.x += (desiredX - this.x) * 0.18;
    const desiredY = clampY(target.y - CONFIG.VIEW_H * 0.55, world);
    this.y += (desiredY - this.y) * 0.12;
    if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeMag = 0; }
  }
  shake(mag, time = 0.25) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeT = Math.max(this.shakeT, time);
  }
  get offX() { return this.shakeT > 0 ? Math.sin(this._t * 97) * this.shakeMag : 0; }
  get offY() { return this.shakeT > 0 ? Math.cos(this._t * 83) * this.shakeMag : 0; }
}

function clampY(y, world) {
  const max = Math.max(0, world.pixelHeight - CONFIG.VIEW_H);
  if (y < 0) return 0;
  if (y > max) return max;
  return y;
}
