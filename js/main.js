import { Game } from './core/Game.js';
import { Renderer } from './render/Renderer.js';
import { UI } from './ui/UI.js';
import { $ } from './ui/dom.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);

const game = new Game(canvas);
const ui = new UI(game);
game.ui = ui;

// HUD 轮询刷新（轻量，每帧一次）
function pollHUD() {
  if (game.state === 'playing' || game.state === 'paused') {
    const d = game.hudData();
    ui.setHUD(d.score, d.coins, d.best, d.label);
  }
  requestAnimationFrame(pollHUD);
}

// 渲染循环（独立于物理，由 RAF 驱动）
function render() {
  renderer.render(game);
  requestAnimationFrame(render);
}

addEventListener('resize', () => renderer.resize());

game.start();
render();
pollHUD();
