// 种子化 PRNG（mulberry32）。无尽模式可用种子复现；关卡也可播种。
export class Random {
  constructor(seed = 1) {
    this.seed = seed >>> 0;
  }
  // 返回 [0,1)
  next() {
    this.seed |= 0;
    this.seed = (this.seed + 0x6D2B79F5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // [min, max] 整数闭区间
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  // [min, max) 浮点
  range(min, max) {
    return min + this.next() * (max - min);
  }
  // 按权重选索引
  weighted(weights) {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }
}
