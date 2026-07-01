// 刚体数据：位置/速度/尺寸 + 本帧接触状态。无逻辑，由 Player 写、Physics 解算。
export class Body {
  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.onGround = false;   // 本帧脚是否踩到实心
    this.touchWall = 0;      // -1 左侧贴墙, 1 右侧贴墙, 0 无
    this.prevOnGround = false;
  }
  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
}
