// 物理与手感常数。基准：TILE=32px，固定步长 STEP=1000/60≈16.67ms。
// 单位除时间外均为「像素 / 秒」体系（速度 px/s，加速度 px/s²）。
export const PHYS = {
  gravity:        1800,   // 重力（降一点让弧线更柔和、滞空更长，跑酷感更好）
  moveSpeed:      330,    // 自动向右跑的基础水平速度
  speedRamp:      12,     // 起步加速到 moveSpeed 的速率（越大越快，起跑更跟手）

  jumpVel:        -660,   // 单段跳初速（约能跳 3.7 格高）
  doubleJumpVel:  -560,   // 二段跳初速
  maxFallVy:      900,    // 最大下落速度
  wallSlideMaxVy: 120,    // 贴墙下滑时的最大下落速度

  coyoteTime:     0.12,   // 离地后仍可起跳的宽容时间（秒）
  jumpBuffer:     0.15,   // 落地前提前按跳的有效窗口（秒）
  cutJumpMul:     0.5,    // 松开跳跃键时的「一次性」速度衰减（可变跳高）
  cutThreshold:   -200,   // 仅当上升速度小于该值才衰减

  slideSpeedMul:  1.35,   // 滑铲时水平速度倍率
  slideDuration:  0.55,   // 滑铲最短持续（秒）
  slideCooldown:  0.10,   // 滑铲结束后的冷却

  wallJumpX:      360,    // 蹬墙跳水平爆发速度
  wallJumpY:      -620,   // 蹬墙跳垂直爆发速度（略增以越过矮墙）
  wallLockTime:   0.22,   // 蹬墙跳后锁定「跳走方向」的时间（防被墙吸回）
  wallStickTime:  0.12,   // 离开墙后仍可蹬墙跳的宽容时间
};
