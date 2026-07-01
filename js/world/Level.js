import { CONFIG } from '../data/config.js';
import { TILE } from './Tile.js';
import { TileMap } from './TileMap.js';
import { Coin } from '../entities/Coin.js';
import { Obstacle } from '../entities/Obstacle.js';
import { PowerUp } from '../entities/PowerUp.js';

const T = CONFIG.TILE;
const CHAR = {
  '.': TILE.EMPTY, '#': TILE.SOLID, '|': TILE.WALL, '^': TILE.ONE_WAY,
};

// 解析关卡数据 → { tileMap, entities, goalX, spawn, width, height, name }
export function loadLevel(data) {
  const rows = data.rows;
  const width = Math.max(...rows.map(r => r.length));
  const height = rows.length;

  const tileMap = new TileMap();
  // rows[0] 是画面顶部 → tile 行 y=0；rows 自顶向下已对应 y 增大，直接铺。
  for (let y = 0; y < height; y++) {
    const line = rows[y] || '';
    for (let x = 0; x < width; x++) {
      const t = CHAR[line[x] ?? '.'] ?? TILE.EMPTY;
      if (t !== TILE.EMPTY) tileMap.set(x, y, t);
    }
  }

  const entities = [];
  for (const c of data.coins || []) entities.push(new Coin(c.x * T + T / 2, c.y * T + T / 2));
  for (const o of data.obstacles || [])
    entities.push(new Obstacle(o.x * T, o.y * T, o.type));
  for (const p of data.powerups || [])
    entities.push(new PowerUp(p.x * T + T / 2, p.y * T + T / 2, p.type));

  const spawn = { x: data.start.x * T, y: data.start.y * T };
  const goalX = data.goal.x * T;
  tileMap.width = width;
  tileMap.height = height;

  return { tileMap, entities, goalX, spawn, width, height, name: data.name, id: data.id };
}
