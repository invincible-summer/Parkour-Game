import { CONFIG } from '../data/config.js';
import { TILE } from './Tile.js';
import { TileMap } from './TileMap.js';
import { Spawner, GROUND_Y, WORLD_H_TILES, VIEW_MARGIN } from './Spawner.js';

const T = CONFIG.TILE;

// 无尽世界：持 Spawner，update 时按镜头右沿生成、按左沿回收。
export class EndlessWorld {
  constructor(seed) {
    this.tileMap = new TileMap();
    this.entities = [];
    this.spawner = new Spawner(seed);
    this._pw = Infinity;
    this._ph = WORLD_H_TILES * T;
    // 出生平台
    this.spawner.buildStart(this.tileMap, this.entities, 0);
    this.spawn = { x: 4 * T, y: (GROUND_Y - 1) * T }; // 脚底踩在地面上
  }
  getTile(tx, ty) { return this.tileMap.get(tx, ty); }
  getActiveEntities() { return this.entities; }
  getGoalX() { return null; }
  isEndless() { return true; }
  get pixelWidth() { return this._pw; }
  get pixelHeight() { return this._ph; }

  update(dt, game) {
    const camRight = game.camera.x + CONFIG.VIEW_W + VIEW_MARGIN;
    this.spawner.generate(this.tileMap, this.entities, camRight);

    // 回收：实体越出镜头左侧即销毁；瓦片按 chunk 区间清理（稀疏 Map，遍历可见范围即可不删也行，
    // 但长时间游玩会无限增长，故按左沿回收）。
    const recycleX = game.camera.x - VIEW_MARGIN * 2;
    const e = this.entities;
    let w = 0;
    for (let i = 0; i < e.length; i++) {
      if (e[i].dead || (e[i].x + e[i].w < recycleX)) { /* drop */ }
      else e[w++] = e[i];
    }
    e.length = w;
    // 瓦片回收：删掉左沿以左的瓦片（key 形如 "x|y"，取 x 比较）
    const recycleTx = Math.floor(recycleX / T);
    for (const key of [...this.tileMap.tiles.keys()]) {
      const tx = parseInt(key, 10);
      if (tx < recycleTx) this.tileMap.tiles.delete(key);
    }
  }
}
