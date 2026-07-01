// 瓦片类型枚举与判定。
export const TILE = {
  EMPTY:   0,
  SOLID:   1, // 实心方块
  WALL:    2, // 可蹬墙的竖墙（也是实心，但视觉与墙跳判定不同）
  ONE_WAY: 3, // 单向平台：仅从上方踩实，可从下方穿过、可下穿
};

export function isSolid(t)  { return t === TILE.SOLID || t === TILE.WALL || t === TILE.ONE_WAY; }
export function isWall(t)   { return t === TILE.WALL; }
export function isOneWay(t) { return t === TILE.ONE_WAY; }

// 用于水平碰撞：单向平台不挡水平方向（否则会卡住侧面）
export function blocksHorizontal(t) { return t === TILE.SOLID || t === TILE.WALL; }
