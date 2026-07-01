// 物理与手感常数。基准：TILE=32px，固定步长 STEP=1000/60≈16.67ms。
// 单位除时间外均为「像素 / 秒」体系（速度 px/s，加速度 px/s²）。
export const PHYS = {
  gravity:        2000,   // 重力加速度
  moveSpeed:      330,    // 自动向右跑的基础水平速度
  speedRamp:      8,      // 起步加速到 moveSpeed 的速率（越大越快）

  jumpVel:        -640,   // 单段跳初速（约能跳 2.5 格高）
  doubleJumpVel:  -540,   // 二段跳初速
  maxFallVy:      920,    // 最大下落速度
  wallSlideMaxVy: 130,    // 贴墙下滑时的最大下落速度（约终速度 14%）

  coyoteTime:     0.10,   // 离地后仍可起跳的宽容时间（秒）
  jumpBuffer:     0.12,   // 落地前提前按跳的有效窗口（秒）
  cutJumpMul:     0.45,   // 松开跳跃键时的速度衰减（可变跳高）
  cutThreshold:   -180,   // 仅当上升速度小于该值才衰减

  slideSpeedMul:  1.35,   // 滑铲时水平速度倍率
  slideDuration:  0.55,   // 滑铲最短持续（秒）
  slideCooldown:  0.10,   // 滑铲结束后的冷却

  wallJumpX:      360,    // 蹬墙跳水平爆发速度
  wallJumpY:      -580,   // 蹬墙跳垂直爆发速度
  wallLockTime:   0.22,   // 蹬墙跳后锁定「跳走方向」的时间（防被墙吸回）
  wallStickTime:  0.12,   // 离开墙后仍可蹬墙跳的宽容时间
};
