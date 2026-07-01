// localStorage 读写，全部 try/catch 降级到内存（隐私模式/iframe 安全）。
const K_BEST = 'nr_best_endless';
const K_UNLOCK = 'nr_unlocked_levels';

const mem = {};
function get(k, def) {
  try {
    const v = localStorage.getItem(k);
    return v == null ? def : JSON.parse(v);
  } catch (e) { return k in mem ? mem[k] : def; }
}
function set(k, v) {
  mem[k] = v;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
}

export const Storage = {
  getBest() { return get(K_BEST, 0); },
  setBest(v) { set(K_BEST, v); },
  // 已解锁的关卡数量（从第 1 关起算）
  getUnlocked() { return get(K_UNLOCK, 1); },
  setUnlocked(v) { set(K_UNLOCK, v); },
};
