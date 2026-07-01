import { PHYS } from '../physics/constants.js';

// 输入：原始事件 → 语义动作。jump buffer 放这里，Player 只消费布尔。
export class Input {
  constructor() {
    this._jumpHeld = false;
    this._slideHeld = false;
    this.jumpBuffered = 0;          // 缓冲的跳跃剩余时间（秒）
    this.edges = { pause: false, restart: false, debug: false, mute: false };
    this._bind();
  }

  _bind() {
    addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.code;
      if (this.isJump(k))  { this._jumpHeld = true;  this.jumpBuffered = PHYS.jumpBuffer; }
      if (this.isSlide(k)) { this._slideHeld = true; }
      if (k === 'Escape' || k === 'KeyP') this.edges.pause = true;
      if (k === 'KeyR') this.edges.restart = true;
      if (k === 'F1') { this.edges.debug = true; e.preventDefault(); }
      if (k === 'KeyM') this.edges.mute = true;
      if (this.isJump(k) || this.isSlide(k) || k === 'Space') e.preventDefault();
    });
    addEventListener('keyup', (e) => {
      const k = e.code;
      if (this.isJump(k))  this._jumpHeld = false;
      if (this.isSlide(k)) this._slideHeld = false;
    });
    // 失焦时清空，避免按键卡住
    addEventListener('blur', () => { this._jumpHeld = false; this._slideHeld = false; });
  }

  isJump(k)  { return k === 'Space' || k === 'ArrowUp' || k === 'KeyW'; }
  isSlide(k) { return k === 'ArrowDown' || k === 'KeyS'; }

  get jumpHeld()  { return this._jumpHeld; }
  get slideHeld() { return this._slideHeld; }

  consumeJump() {
    if (this.jumpBuffered > 0) { this.jumpBuffered = 0; return true; }
    return false;
  }
  tick(dt) { if (this.jumpBuffered > 0) this.jumpBuffered -= dt; }
  takeEdges() { const e = this.edges; this.edges = { pause: false, restart: false, debug: false, mute: false }; return e; }
}
