// 简易粒子系统（带数量上限）。Player/实体通过 fx 引用调用。
const MAX = 500;

export class Particles {
  constructor() { this.list = []; }
  clear() { this.list.length = 0; }

  spawn(p) {
    if (this.list.length >= MAX) return;
    this.list.push(p);
  }

  // 小尘云（跳跃/落地/跑步）
  dust(x, y, color = '#ffd0a0', n = 6) {
    for (let i = 0; i < n; i++) {
      this.spawn({
        x, y,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 120 - 20,
        grav: 600, life: 0.35, max: 0.35,
        size: 2 + Math.random() * 3, color,
      });
    }
  }

  // 放射爆裂（蹬墙跳/受击/金币）
  burst(x, y, color = '#19e7ff', n = 12, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const s = speed * (0.5 + Math.random() * 0.6);
      this.spawn({
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        grav: 300, life: 0.45, max: 0.45,
        size: 2 + Math.random() * 3, color,
      });
    }
  }

  // 拖尾点
  trail(x, y, color = '#19e7ff') {
    this.spawn({
      x, y, vx: 0, vy: 0, grav: 0,
      life: 0.25, max: 0.25, size: 6, color,
    });
  }

  update(dt) {
    const l = this.list;
    for (let i = 0; i < l.length; i++) {
      const p = l[i];
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    // 移除死亡粒子（反向覆盖，避免 splice 抖动）
    let w = 0;
    for (let i = 0; i < l.length; i++) {
      if (l[i].life > 0) l[w++] = l[i];
    }
    l.length = w;
  }

  draw(ctx) {
    for (const p of this.list) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
