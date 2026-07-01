import { CONFIG } from '../data/config.js';
import { $, show, hide } from './dom.js';
import { Storage } from '../core/Storage.js';
import { LEVELS } from '../data/levels.js';

// DOM 浮层：主菜单 / 关卡选择 / HUD / 暂停 / 结束 / 通关。
export class UI {
  constructor(game) {
    this.game = game;
    this.bind();
  }

  bind() {
    $('btn-endless').onclick = () => this.game.startEndless();
    $('btn-levels').onclick  = () => this.showLevels();
    $('btn-resume').onclick  = () => this.game.togglePause();
    $('btn-restart').onclick = () => this.game.restart();
    $('btn-next').onclick    = () => this.game.startLevel(this.game.levelIndex + 1);
    $('btn-replay').onclick  = () => this.game.restart();
    $('btn-menu-pause').onclick = () => this.game.toMenu();
    $('btn-menu-over').onclick  = () => this.game.toMenu();
    $('btn-menu-done').onclick  = () => this.game.toMenu();
    $('levels-back').onclick = () => this.showMenu();
  }

  showMenu() {
    hide($('game-ui')); hide($('level-ui'));
    show($('menu'));
    $('best-score').textContent = Storage.getBest();
    const unlocked = Storage.getUnlocked();
    $('menu-unlocked').textContent = `已解锁 ${unlocked}/${LEVELS.length} 关`;
  }

  showLevels() {
    hide($('menu'));
    show($('level-ui'));
    const list = $('level-list');
    list.innerHTML = '';
    const unlocked = Storage.getUnlocked();
    LEVELS.forEach((lv, i) => {
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (i + 1 > unlocked ? ' locked' : '');
      btn.textContent = `${i + 1}. ${lv.name}` + (i + 1 > unlocked ? '  🔒' : '');
      btn.disabled = i + 1 > unlocked;
      btn.onclick = () => this.game.startLevel(i);
      list.appendChild(btn);
    });
  }

  showHUD() { hide($('menu')); hide($('level-ui')); show($('game-ui')); }
  hideAll() { hide($('menu')); hide($('level-ui')); hide($('pause-ui')); hide($('over-ui')); hide($('done-ui')); }

  setHUD(score, coins, best, modeLabel) {
    $('hud-score').textContent = Math.floor(score);
    $('hud-coins').textContent = coins;
    $('hud-best').textContent = best;
    $('hud-mode').textContent = modeLabel;
  }

  showPause() { show($('pause-ui')); }
  hidePause() { hide($('pause-ui')); }

  showGameOver(score, coins, best, isNewBest) {
    $('over-score').textContent = Math.floor(score);
    $('over-coins').textContent = coins;
    $('over-best').textContent = best;
    $('over-newbest').classList.toggle('hidden', !isNewBest);
    show($('over-ui'));
  }

  showLevelComplete(name, nextExists) {
    $('done-name').textContent = name;
    $('btn-next').classList.toggle('hidden', !nextExists);
    show($('done-ui'));
  }
}
