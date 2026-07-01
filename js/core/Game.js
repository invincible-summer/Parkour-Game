import { CONFIG } from '../data/config.js';
import { PHYS } from '../physics/constants.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Storage } from './Storage.js';
import { Player } from '../entities/Player.js';
import { Particles } from '../render/particles.js';
import { LevelWorld } from '../world/LevelWorld.js';
import { EndlessWorld } from '../world/EndlessWorld.js';
import { LEVELS } from '../data/levels.js';

const STEP = 1000 / 60; // 固定物理步长 ms

// 玩家的临时道具状态
function freshPower() { return { shield: 0, magnet: 0, speed: 0 }; }

export class Game {
  constructor(canvas) {
    this.input = new Input();
    this.camera = new Camera();
    this.particles = new Particles();
    this.fx = this.particles; // 实体（Coin/PowerUp 等）通过 game.fx 访问粒子
    this.player = new Player(this.particles);
    this.ui = null;            // 由 main 注入
    this.world = null;
    this.state = 'menu';       // menu | playing | paused | gameover | done
    this.mode = null;          // 'endless' | 'level'
    this.levelIndex = 0;
    this.score = 0;
    this.coins = 0;
    this.startX = 0;
    this.debug = false;
    this.muted = false;

    // 循环状态
    this._last = 0;
    this._acc = 0;
    this.fps = 60;
    this._fpsT = 0; this._fpsN = 0;
    this.menuScroll = 0;

    this._loop = this._loop.bind(this);
  }

  // ---- 开局 ----
  startEndless() {
    this.mode = 'endless';
    this.world = new EndlessWorld();
    this._beginRun();
  }
  startLevel(i) {
    if (i < 0 || i >= LEVELS.length) { this.ui.showMenu(); return; }
    this.mode = 'level';
    this.levelIndex = i;
    this.world = new LevelWorld(LEVELS[i]);
    this._beginRun();
  }
  _beginRun() {
    this.player.power = freshPower();
    const s = this.world.spawn;
    this.player.reset(s.x, s.y - this.player.fullH);
    this.startX = this.player.body.x;
    this.score = 0;
    this.coins = 0;
    this.particles.clear();
    this.camera.snap(this.player.body, this.world);
    this.state = 'playing';
    this.ui.hideAll();
    this.ui.showHUD();
  }

  restart() {
    if (this.mode === 'endless') this.startEndless();
    else this.startLevel(this.levelIndex);
  }
  toMenu() { this.state = 'menu'; this.world = null; this.ui.hideAll(); this.ui.showMenu(); }
  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; this.ui.showPause(); }
    else if (this.state === 'paused') { this.state = 'playing'; this.ui.hidePause(); }
  }

  // ---- 主循环（固定步长累积器）----
  start() {
    this.ui.showMenu();
    this._last = performance.now();
    requestAnimationFrame(this._loop);
  }
  _loop(now) {
    const dt = Math.min(now - this._last, 250);
    this._last = now;
    this._acc += dt;
    let steps = 0;
    while (this._acc >= STEP && steps < 5) {
      this.fixedUpdate(STEP / 1000);
      this._acc -= STEP;
      steps++;
    }
    // FPS
    this._fpsT += dt; this._fpsN++;
    if (this._fpsT >= 500) { this.fps = (this._fpsN * 1000) / this._fpsT; this._fpsT = 0; this._fpsN = 0; }

    // 边沿事件
    const e = this.input.takeEdges();
    if (e.debug) this.debug = !this.debug;
    if (e.pause) this.togglePause();
    if (e.restart && (this.state === 'gameover' || this.state === 'paused')) this.restart();

    // 渲染由 main 调用 renderer.render(this)
    requestAnimationFrame(this._loop);
  }

  fixedUpdate(dt) {
    this.input.tick(dt);
    if (this.state === 'menu') { this.menuScroll += dt * 60; return; }
    if (this.state !== 'playing') return;

    // 道具计时
    const p = this.player.power;
    if (p.magnet > 0) p.magnet = Math.max(0, p.magnet - dt);
    if (p.speed  > 0) p.speed  = Math.max(0, p.speed  - dt);

    // 速度加成
    const baseSpeed = PHYS.moveSpeed;
    PHYS.moveSpeed = baseSpeed * (p.speed > 0 ? 1.4 : 1);

    this.world.update(dt, this);
    // 实体（金币/道具）更新用真实 dt
    for (const e of this.world.getActiveEntities()) { if (!e.dead) e.update(dt, this); }
    this.player.update(dt, this.input, this.world);
    this.particles.update(dt);
    this.camera.follow(this.player.body, this.world, dt);
    PHYS.moveSpeed = baseSpeed;

    this.checkCollisions();
    this.checkDeath();
    this.updateScore();

    // 通关
    if (this.mode === 'level' && this.world.getGoalX() != null &&
        this.player.body.x + this.player.body.w > this.world.getGoalX()) {
      this.state = 'done';
      const unlocked = Storage.getUnlocked();
      if (this.levelIndex + 2 > unlocked) Storage.setUnlocked(this.levelIndex + 2);
      this.ui.showLevelComplete(LEVELS[this.levelIndex].name, this.levelIndex + 1 < LEVELS.length);
    }
  }

  checkCollisions() {
    const pb = this.player.body;
    for (const e of this.world.getActiveEntities()) {
      if (e.dead) continue;
      if (!e.overlaps(pb)) continue;
      if (e.type === 'coin') e.collect(this);
      else if (e.type === 'obstacle') {
        if (this.player.power.shield > 0) {
          this.player.power.shield = 0;
          this.camera.shake(8, 0.3);
          this.particles.burst(pb.x + pb.w / 2, pb.y + pb.h / 2, '#19e7ff', 18, 260);
          e.dead = true;
        } else {
          this.die();
        }
      } else if (e.type === 'powerup') e.apply(this);
    }
  }

  updateScore() {
    if (this.mode === 'endless') {
      this.score = Math.max(this.score, (this.player.body.x - this.startX));
    } else {
      this.score = (this.player.body.x - this.startX);
    }
  }

  checkDeath() {
    // 掉出镜头下方一定距离即死（适用于无尽坑与关卡深渊）
    const limit = this.camera.y + CONFIG.VIEW_H + CONFIG.DEATH_MARGIN;
    if (this.player.body.y > limit) this.die();
  }

  die() {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.camera.shake(14, 0.5);
    this.particles.burst(this.player.body.x + this.player.body.w / 2,
      this.player.body.y + this.player.body.h / 2, '#ff3b6b', 24, 320);
    if (this.mode === 'endless') {
      const best = Storage.getBest();
      const final = Math.floor(this.score);
      const isNew = final > best;
      if (isNew) Storage.setBest(final);
      this.ui.showGameOver(final, this.coins, Math.max(best, final), isNew);
    } else {
      // 关卡死亡：等同 game over（无最高分）
      this.ui.showGameOver(Math.floor(this.score), this.coins, 0, false);
    }
  }

  // 给 UI 轮询用
  hudData() {
    const best = this.mode === 'endless' ? Storage.getBest() : 0;
    const label = this.mode === 'endless' ? '无尽模式' : `关卡 ${this.levelIndex + 1}`;
    return { score: Math.floor(this.score), coins: this.coins, best, label };
  }
}
