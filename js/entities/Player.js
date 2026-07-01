import { CONFIG } from '../data/config.js';
import { PHYS } from '../physics/constants.js';
import { Body } from '../physics/Body.js';
import { Physics } from '../physics/Physics.js';
import { blocksHorizontal } from '../world/Tile.js';

function approach(cur, target, step) {
  if (cur < target) return Math.min(cur + step, target);
  if (cur > target) return Math.max(cur - step, target);
  return target;
}

// 玩家：自动向右跑 + 全套跑酷机制（跳/二段跳/可变跳高/coyote/buffer/滑铲/墙跑蹬墙跳）。
// 本作是「自动跑酷」，故蹬墙跳统一为「向前上方vault」：撞到前方墙时按跳越过它。
export class Player {
  constructor(fx) {
    this.fx = fx; // 粒子系统，用于尘/爆裂/拖尾
    this.w = 24;
    this.fullH = 44;
    this.slideH = 22;
    this.body = new Body(0, 0, this.w, this.fullH);
    this.reset(0, 0);
  }

  reset(px, py) {
    const b = this.body;
    b.x = px; b.y = py; b.vx = 0; b.vy = 0;
    b.h = this.fullH; b.onGround = false; b.touchWall = 0; b.prevOnGround = false;
    this.jumpsLeft = 1;        // 离地后可用的空中跳次数（= 二段跳）
    this.coyote = 0;
    this.wallLock = 0;         // 蹬墙跳后锁定惯性方向的时间
    this.wallStick = 0;        // 离开墙后仍可蹬墙跳的宽容
    this.lastWallDir = 0;
    this.isSliding = false;
    this.slideTimer = 0;       // 滑铲最短剩余时长
    this.slideCd = 0;
    this.jumpCutDone = false;  // 本次跳跃是否已做可变跳高削减（防每帧重复衰减）
    this.animTime = 0;
    this.trail = [];
    this.dead = false;
  }

  get centerX() { return this.body.x + this.body.w / 2; }
  get centerY() { return this.body.y + this.body.h / 2; }

  // 每个固定步长调用一次。input 提供 consumeJump/jumpHeld/slideHeld。
  update(dt, input, world) {
    const b = this.body;
    this.animTime += dt;

    // ---- 计时器（基于上一帧的接触状态）----
    this.coyote = b.onGround ? PHYS.coyoteTime : Math.max(0, this.coyote - dt);
    if (b.touchWall !== 0 && !b.onGround) { this.wallStick = PHYS.wallStickTime; this.lastWallDir = b.touchWall; }
    else this.wallStick = Math.max(0, this.wallStick - dt);
    this.wallLock = Math.max(0, this.wallLock - dt);
    this.slideTimer = Math.max(0, this.slideTimer - dt);
    this.slideCd = Math.max(0, this.slideCd - dt);

    // ---- 水平速度 ----
    if (this.wallLock <= 0) {
      const target = PHYS.moveSpeed * (this.isSliding ? PHYS.slideSpeedMul : 1);
      b.vx = approach(b.vx, target, PHYS.speedRamp * Math.abs(target) * dt + 40 * dt);
    }
    // wallLock 期间保持蹬墙跳惯性，不改 vx（让物理自然积分，避免反复撞墙抖动）

    // ---- 滑铲 ----
    this.updateSlide(dt, input, world);

    // ---- 跳跃（含蹬墙跳/二段跳/coyote/buffer 由 input.consumeJump 统一触发）----
    if (input.consumeJump()) this.tryJump(world);

    // ---- 重力 + wall slide 封顶 ----
    b.vy += PHYS.gravity * dt;
    if (this.wallStick > 0 && b.touchWall !== 0 && b.vy > PHYS.wallSlideMaxVy && !this.isSliding) {
      b.vy = PHYS.wallSlideMaxVy;
    }
    if (b.vy > PHYS.maxFallVy) b.vy = PHYS.maxFallVy;

    // 可变跳高：松开跳跃键的「瞬间」做一次性削减（用 flag 防止每帧重复衰减导致手感发顿）
    if (!input.jumpHeld && !this.jumpCutDone && b.vy < PHYS.cutThreshold) {
      b.vy *= PHYS.cutJumpMul;
      this.jumpCutDone = true;
    }

    // ---- 积分 + 碰撞解算 ----
    Physics.moveAndCollide(b, world, dt);

    // ---- 接触后反应 ----
    if (b.onGround) {
      if (!b.prevOnGround) {           // 刚落地
        this.jumpsLeft = 1;
        this.standUpIfPossible(world);
        this.fx.dust(b.x + b.w / 2, b.y + b.h, '#c8a8ff', 7);
      }
      this.coyote = PHYS.coyoteTime;
    }

    // ---- 拖尾 ----
    if (this.trail.length === 0 || (b.x - this.trail[0].x) > 6) {
      this.trail.unshift({ x: b.x, y: b.y, w: b.w, h: b.h });
      if (this.trail.length > 8) this.trail.pop();
    }
    // 跑步扬尘
    if (b.onGround && this.wallLock <= 0 && Math.random() < dt * 18) {
      this.fx.dust(b.x, b.y + b.h, '#6a4cff', 1);
    }
  }

  tryJump(world) {
    const b = this.body;
    // 记录起跳前的水平速度，跳跃时保持（跑酷中跳起不丢向前惯性）
    const keepVx = b.vx;

    // 蹬墙跳：贴墙且（不在地面或 coyote 已过）时，向前上方 vault
    if (!b.onGround && this.coyote <= 0 && this.wallStick > 0 && this.lastWallDir !== 0) {
      b.vx = PHYS.wallJumpX;          // 自动跑酷：永远向前
      b.vy = PHYS.wallJumpY;
      this.wallLock = PHYS.wallLockTime;
      this.jumpsLeft = 1;
      this.jumpCutDone = false;
      this.isSliding = false;
      this.standUpIfPossible(world);
      this.fx.burst(b.x + b.w / 2, b.y + b.h / 2, '#19e7ff', 14, 240);
      return;
    }

    // 地面 / coyote 跳
    if (b.onGround || this.coyote > 0) {
      b.vy = PHYS.jumpVel;
      b.vx = Math.max(keepVx, PHYS.moveSpeed);  // 起跳保持向前速度
      this.jumpsLeft = 1;
      this.jumpCutDone = false;
      this.coyote = 0;
      this.isSliding = false;
      this.standUpIfPossible(world);
      this.fx.dust(b.x + b.w / 2, b.y + b.h, '#ffd0a0', 6);
      return;
    }

    // 二段跳
    if (this.jumpsLeft > 0) {
      this.jumpsLeft--;
      b.vy = PHYS.doubleJumpVel;
      b.vx = Math.max(keepVx, PHYS.moveSpeed);  // 二段跳也保持向前惯性
      this.jumpCutDone = false;
      this.isSliding = false;
      this.standUpIfPossible(world);
      this.fx.burst(b.x + b.w / 2, b.y + b.h, '#19f0ff', 10, 160);
      return;
    }
  }

  updateSlide(dt, input, world) {
    const b = this.body;
    if (input.slideHeld && b.onGround && !this.isSliding && this.slideCd <= 0 && this.wallLock <= 0) {
      this.isSliding = true;
      this.slideTimer = PHYS.slideDuration;
      b.h = this.slideH;
      b.y += (this.fullH - this.slideH);   // 保持脚底不悬空
      this.fx.dust(b.x + b.w / 2, b.y + b.h, '#ff4d8d', 5);
    }
    if (this.isSliding && b.onGround && !input.slideHeld && this.slideTimer <= 0) {
      this.standUpIfPossible(world);
    }
  }

  // 仅当头顶有空间才恢复全高，防止钻进低通道后站起穿墙
  standUpIfPossible(world) {
    const b = this.body;
    if (b.h >= this.fullH) { this.isSliding = false; return; }
    if (this.canStand(world)) {
      b.y -= (this.fullH - b.h);
      b.h = this.fullH;
      this.isSliding = false;
      this.slideCd = PHYS.slideCooldown;
    } else {
      this.isSliding = true; // 头顶被挡，继续保持滑铲姿态
    }
  }

  canStand(world) {
    const b = this.body;
    const T = CONFIG.TILE;
    const topAfter = b.y - (this.fullH - b.h);
    const minTx = Math.floor(b.x / T);
    const maxTx = Math.floor((b.x + b.w - 1) / T);
    const minTy = Math.floor(topAfter / T);
    const maxTy = Math.floor((b.y - 1) / T);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (blocksHorizontal(world.getTile(tx, ty))) return false;
      }
    }
    return true;
  }

  draw(ctx) {
    const b = this.body;
    const T = CONFIG.THEME;

    // 拖尾
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const t = this.trail[i];
      ctx.globalAlpha = (1 - i / this.trail.length) * 0.25;
      ctx.fillStyle = T.trail;
      ctx.fillRect(t.x, t.y, t.w, t.h);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowColor = T.playerGlow;
    ctx.shadowBlur = 16;

    if (this.isSliding) {
      // 滑铲：扁长
      ctx.fillStyle = T.player;
      roundRect(ctx, b.x, b.y, b.w, b.h, 6);
      ctx.fill();
      // 朝向高亮条
      ctx.fillStyle = '#e8fbff';
      ctx.fillRect(b.x + b.w - 8, b.y + 4, 5, b.h - 8);
    } else {
      ctx.fillStyle = T.player;
      roundRect(ctx, b.x, b.y, b.w, b.h, 7);
      ctx.fill();
      // 面甲
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b2a33';
      ctx.fillRect(b.x + 4, b.y + 6, b.w - 8, 7);
      ctx.fillStyle = '#e8fbff';
      ctx.fillRect(b.x + b.w - 9, b.y + 7, 4, 5);
      // 腿（跑步摆动 / 空中收起）
      const air = !b.onGround;
      const swing = air ? 0 : Math.sin(this.animTime * 16) * 4;
      ctx.fillStyle = T.player;
      ctx.fillRect(b.x + 4, b.y + b.h, 5, air ? 3 : 6 + swing);
      ctx.fillRect(b.x + b.w - 9, b.y + b.h, 5, air ? 3 : 6 - swing);
    }
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
