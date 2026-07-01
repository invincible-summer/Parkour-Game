// DOM 操作辅助：按 id 取元素、隐藏/显示、设文本。
export function $(id) { return document.getElementById(id); }
export function show(el) { if (el) el.classList.remove('hidden'); }
export function hide(el) { if (el) el.classList.add('hidden'); }
