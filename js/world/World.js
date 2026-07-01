// World 接口契约（JS 无 interface，靠实现遵循）。
// EndlessWorld 与 LevelWorld 都实现它，让 Player/Physics/Renderer/UI 完全模式无关。
//
//   getTile(tx, ty): number            —— 瓦片类型（见 world/Tile.js）
//   getActiveEntities(): Entity[]      —— 当前可碰撞/可拾取的实体（金币/障碍/道具）
//   update(dt, game): void             —— spawner 在此生成/回收；level 通常空实现
//   getGoalX(): number | null          —— 关卡终点像素 x；无尽返回 null
//   isEndless(): boolean
//   get pixelWidth(): number           —— 世界像素宽（镜头/死亡判定）
//   get pixelHeight(): number
//   get spawn(): {x, y}                —— 玩家出生像素坐标（脚底对齐）
//
export class World {}
