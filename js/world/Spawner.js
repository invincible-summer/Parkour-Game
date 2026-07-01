import { CONFIG } from '../data/config.js';
import { TILE } from './Tile.js';
import { TileMap } from './TileMap.js';
import { Coin } from '../entities/Coin.js';
import { Obstacle } from '../entities/Obstacle.js';
import { PowerUp } from '../entities/PowerUp.js';
import { Random } from '../core/Random.js';
import { PHYS } from '../physics/constants.js';

const T = CONFIG.TILE;
const CHUNK_W_TILES = 20;              // 每个 chunk 宽 20 tile = 640px
const WORLD_H_TILES = 17;              // 视口 tile 高度
const GROUND_Y = WORLD_H_TILES - 2;    // 主地面行（倒数第 2 行）
const VIEW_MARGIN = 4 * T;             // 镜头外生成/回收余量

// ---- 段落类型库 ----
// 地面行(GROUND_Y/GROUND_Y+1)始终连续铺设；段落描述「地面之上的结构」。
//   flat   : 平地（仅地面），偶尔放尖刺
//   step   : 地面之上堆一个高台（玩家跑上去或跳过），高台前后有坡
//   pit    : 地面断开一个小坑（≤5 格，可单段跳越过），坑底即死亡
//   wall   : 地面之上立一根可蹬墙竖墙，玩家蹬墙跳越过
//   raised : 一段抬高的连续地面（用 SOLID 堆高 2-3 格），前后用坡衔接
// 不变量：pit 宽≤5（单段跳可达），高台高度≤3（二段跳可达）。
const SEGMENTS = ['flat', 'step', 'pit', 'wall', 'raised'];

// 简单难度曲线：difficulty 每 1000px 升 1 级。提升 gap 偏大、宽偏小、墙/障碍概率升。
function diffParams(diff) {
  return {
    spikeP:  Math.min(0.45, 0.05 + diff * 0.04),
    powerP:  Math.max(0.06, 0.16 - diff * 0.01),
    wallBias: Math.min(1, diff * 0.12), // 高难度更倾向墙段
  };
}

export class Spawner {
  constructor(seed = (Math.random() * 1e9 | 0)) {
    this.rng = new Random(seed);
    this.seed = seed;
    this.lastRightTx = 0;   // 上一个平台右沿 tile x
    this.lastTopY = GROUND_Y; // 上一个平台顶部 tile y
    this.totalSpawned = 0;
  }

  reset(px) {
    this.rng = new Random(this.seed);
    this.lastRightTx = Math.floor(px / T);
    this.totalSpawned = 0;
  }

  // 铺设起始安全平台（出生用）：连续地面，给玩家缓冲。
  buildStart(txMap, entities, fromPx) {
    const startTx = Math.floor(fromPx / T);
    for (let x = startTx; x < startTx + 14; x++) this.putGround(txMap, x);
    this.lastRightTx = startTx + 14;
  }

  // 铺一格地面（GROUND_Y + 其下一格做厚度）
  putGround(txMap, x) {
    txMap.set(x, GROUND_Y, TILE.SOLID);
    txMap.set(x, GROUND_Y + 1, TILE.SOLID);
  }

  // 在镜头右侧需要生成时调用，可能一次生成多个 chunk 直到够远。
  generate(tileMap, entities, upToPx) {
    while (this.lastRightTx * T < upToPx) {
      this.generateChunk(tileMap, entities);
    }
  }

  generateChunk(tileMap, entities) {
    const rng = this.rng;
    const diff = (this.lastRightTx * T) / 1000;
    const dp = diffParams(diff);

    // 选段落（前两段强制 flat，给起步缓冲；pit 低频以留反应时间）
    let seg;
    if (this.totalSpawned < 2) seg = 'flat';
    else {
      const weights = [3, 2, 1, 2, 1]; // flat, step, pit, wall, raised
      seg = SEGMENTS[rng.weighted(weights)];
      if (seg === 'pit' && this.totalSpawned < 5) seg = 'flat'; // 前 5 段不出坑
    }
    const width = rng.int(6, 11);
    const leftTx = this.lastRightTx;
    const rightTx = leftTx + width;

    if (seg === 'pit') {
      // 致命坑：地面断开 pitW 格（≤4，单段跳可达），玩家必须主动跳过，否则坠落死亡。
      // 前后留 pad 格平地做反应缓冲；坑上方悬金币奖励跳跃路径。
      const pitW = Math.min(width - 4, rng.int(3, 4));
      const pad = Math.floor((width - pitW) / 2);
      for (let x = leftTx; x < leftTx + pad; x++) this.putGround(tileMap, x);
      for (let x = leftTx + pad + pitW; x < rightTx; x++) this.putGround(tileMap, x);
      for (let i = 0; i < pitW; i++)
        entities.push(new Coin((leftTx + pad + i) * T + T / 2, (GROUND_Y - 2) * T + T / 2));
    } else {
      // 其余段落：地面连续
      for (let x = leftTx; x < rightTx; x++) this.putGround(tileMap, x);

      if (seg === 'step') {
        // 地面之上堆一个高台（高 1-2 格，单段跳即可上）
        const h = rng.int(1, 2);
        const sw = rng.int(2, 4);
        const sx = leftTx + rng.int(1, Math.max(1, width - sw - 1));
        for (let x = sx; x < sx + sw; x++)
          for (let y = GROUND_Y - 1; y >= GROUND_Y - h; y--) tileMap.set(x, y, TILE.SOLID);
      } else if (seg === 'wall') {
        // 矮墙/低障碍（1 格高）：自动跑酷中单段跳即可越过；高难度时 2 格需二段跳。
        const wallH = diff >= 2 ? 2 : 1;
        const wtx = leftTx + rng.int(2, Math.max(2, width - 3));
        for (let y = GROUND_Y - 1; y >= GROUND_Y - wallH; y--) tileMap.set(wtx, y, TILE.SOLID);
        // 矮墙后放金币奖励跳跃
        entities.push(new Coin((wtx + 2) * T + T / 2, (GROUND_Y - 2) * T + T / 2));
      } else if (seg === 'raised') {
        // 低台阶段（仅 1 格高，可跑上/跳上）：用斜过渡避免立面卡墙
        const h = 1;
        const rx = leftTx + 1;
        const rw = width - 2;
        for (let x = rx; x < rx + rw; x++)
          for (let y = GROUND_Y - 1; y >= GROUND_Y - h; y--) tileMap.set(x, y, TILE.SOLID);
      } else {
        // flat：仅放悬空金币串（自动跑酷中纯平地不裸放尖刺，避免必死）
        if (rng.next() < 0.6) {
          const n = rng.int(2, 4);
          const cx0 = leftTx + rng.int(1, Math.max(1, width - n - 1));
          for (let i = 0; i < n; i++)
            entities.push(new Coin((cx0 + i) * T + T / 2, (GROUND_Y - 2) * T + T / 2));
        }
      }

      // 通用：金币串
      if (rng.next() < 0.5) {
        const n = rng.int(2, 4);
        const cx0 = leftTx + rng.int(1, Math.max(1, width - n - 1));
        for (let i = 0; i < n; i++)
          entities.push(new Coin((cx0 + i) * T + T / 2, (GROUND_Y - 2) * T + T / 2));
      }
      // 通用：道具
      if (rng.next() < dp.powerP) {
        const kinds = ['shield', 'magnet', 'speed'];
        entities.push(new PowerUp(
          (leftTx + (width >> 1)) * T + T / 2,
          (GROUND_Y - 3) * T + T / 2,
          kinds[rng.int(0, 2)]));
      }
    }

    this.lastRightTx = rightTx;
    this.totalSpawned++;
  }
}

export { CHUNK_W_TILES, WORLD_H_TILES, GROUND_Y, VIEW_MARGIN };
