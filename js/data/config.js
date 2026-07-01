// 全局配置：视图尺寸、瓦片、主题色。调参与主题只动这里。
export const CONFIG = {
  TILE: 32,
  VIEW_W: 960,   // 逻辑画布宽（= 30 tile）
  VIEW_H: 544,   // 逻辑画布高（= 17 tile）
  DEATH_MARGIN: 320, // 掉出屏幕下方多远算死亡

  // 霓虹 / 合成波 主题色
  THEME: {
    skyTop:    '#1a0b3d',
    skyMid:    '#3b1d6e',
    skyBot:    '#ff5e8a',
    sun:       '#ffd36e',
    grid:      '#ff4d8d',
    farBld:    '#2a1750',
    nearBld:   '#120a2e',
    solid:     '#241247',
    solidEdge: '#7a3cff',
    wall:      '#241247',
    wallEdge:  '#19e7ff',
    oneWay:    '#19e7ff',
    player:    '#19f0ff',
    playerGlow:'#19e7ff',
    trail:     '#ff4d8d',
    coin:      '#ffd84d',
    coinEdge:  '#ffae00',
    danger:    '#ff3b6b',
    text:      '#e8e0ff',
  },
};

export const TILE = CONFIG.TILE;
