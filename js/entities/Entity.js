// 实体基类：金币/障碍/道具共用。Player 不继承它（生命周期不同）。
export class Entity {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.dead = false;
    this.type = 'entity';
  }
  overlaps(b) {
    return this.x < b.x + b.w && this.x + this.w > b.x &&
           this.y < b.y + b.h && this.y + this.h > b.y;
  }
  update(dt, game) {}
  draw(ctx) {}
}
