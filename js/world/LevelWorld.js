import { CONFIG } from '../data/config.js';
import { loadLevel } from './Level.js';

// 关卡世界：持有一份解析好的关卡，不动态生成。实现 World 接口。
export class LevelWorld {
  constructor(levelData) {
    this.data = loadLevel(levelData);
    this.tileMap = this.data.tileMap;
    this.entities = this.data.entities;
    this._pw = this.data.width * CONFIG.TILE;
    this._ph = this.data.height * CONFIG.TILE;
  }
  getTile(tx, ty) { return this.tileMap.get(tx, ty); }
  getActiveEntities() { return this.entities; }
  update(dt, game) {} // 关卡静态
  getGoalX() { return this.data.goalX; }
  isEndless() { return false; }
  get pixelWidth() { return this._pw; }
  get pixelHeight() { return this._ph; }
  get spawn() { return this.data.spawn; }
  get name() { return this.data.name; }
}
