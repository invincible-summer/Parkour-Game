import { CONFIG } from '../data/config.js';
import { TILE } from './Tile.js';

// 稀疏瓦片容器：用 Map<"x|y"> 存储，回收时 delete，避免大数组与越界。
export class TileMap {
  constructor() {
    this.tiles = new Map();
    this.width = 0;   // tile 列数（用于边界/渲染）
    this.height = 0;  // tile 行数
  }
  key(x, y) { return x + '|' + y; }
  get(x, y) { return this.tiles.get(this.key(x, y)) ?? TILE.EMPTY; }
  set(x, y, t) {
    this.tiles.set(this.key(x, y), t);
    if (x >= this.width) this.width = x + 1;
    if (y >= this.height) this.height = y + 1;
  }
  remove(x, y) { this.tiles.delete(this.key(x, y)); }

  // 遍历某像素矩形内的所有非空瓦片（渲染用）
  *inRect(px, py, pw, ph) {
    const T = CONFIG.TILE;
    const minTx = Math.floor(px / T);
    const maxTx = Math.floor((px + pw) / T);
    const minTy = Math.floor(py / T);
    const maxTy = Math.floor((py + ph) / T);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.get(tx, ty);
        if (t !== TILE.EMPTY) yield { tx, ty, t };
      }
    }
  }
}
