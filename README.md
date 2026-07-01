# 霓虹跑者 · Neon Runner

一个横版 2D 霓虹/合成波风格的跑酷小游戏。纯 Web（HTML5 Canvas + 原生 JS，ES Modules），无构建步骤、无外部依赖。

## 玩法

- 角色**自动向前奔跑**，你只管跳、滑铲、蹬墙跳。
- **无尽模式**：随机无限生成、难度随距离递增，追求最高距离分。
- **关卡模式**：4 关手工关卡，含终点、通关解锁下一关，进度本地保存。
- 机制：单跳 / 二段跳 / 可变跳高 / coyote time / jump buffer / 滑铲（压低身位钻低通道）/ 蹬墙跳。
- 道具：🛡 护盾（挡一次致命）、🧲 磁铁（吸金币）、⚡ 加速。金币与障碍（尖刺）。

## 操作

| 键 | 作用 |
|----|------|
| `空格` / `↑` / `W` | 跳跃（按住更高、空中再按=二段跳、贴墙按=蹬墙跳） |
| `↓` / `S` | 滑铲 |
| `P` / `Esc` | 暂停 |
| `R` | 重开（死亡/暂停时） |
| `F1` | 调试覆盖层（hitbox / 速度 / 状态） |

## 运行

需要本地服务器（ES Modules 在 `file://` 下受 CORS 限制）：

```bash
cd Parkour-Game
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 目录结构

```
js/
  main.js            入口
  core/              Game(状态机+固定步长循环) / Input / Camera / Storage / Random
  physics/           Physics(分轴AABB) / Body / constants
  entities/          Player / Coin / Obstacle / PowerUp / Entity
  world/             Tile / TileMap / World / LevelWorld / EndlessWorld / Level / Spawner
  render/            Renderer(DPR+调试层) / assets(过程化霓虹绘制) / particles
  ui/                UI(DOM浮层) / dom
  data/              config(调参) / levels(关卡数据)
```

## 架构要点

- **固定步长物理**：`requestAnimationFrame` 给可变 dt，物理用固定 `1000/60ms` 步长 + 累积器，避免高刷新率屏游戏变快。
- **`World` 接口**：`EndlessWorld` 与 `LevelWorld` 实现同一契约，Player/Physics/Renderer/UI 完全模式无关。
- **分轴 AABB**：先 X 后 Y，单向平台仅从上方踩实；滑铲压 hitbox 后站立前检测头顶空间防穿墙。
- **蹬墙跳**：撞前方墙时按跳给前上方爆发速度，并设 `wallLock` 锁定惯性方向若干帧，防止被墙重新吸回。
- **无尽生成**：有限可达性模板库 + 高度/间距钳制，保证随机平台一定跳得到；镜头前方生成、后方回收。

调参只动 `js/physics/constants.js` 与 `js/data/config.js`。
