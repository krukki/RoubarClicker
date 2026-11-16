/*
 * Roubar Clicker: liga as regras, a tela e o salvamento.
 */
(function () {
  'use strict';
  const RC = window.RC;
  const SAVE_KEY = 'roubarclicker.save';
  const game = new RC.Game();

  // Salvamento no navegador. Se o navegador bloquear (aba anônima, por
  // exemplo), o jogo continua e a tela de opções avisa.
  const store = {
    ok: true,
    save() {
      try {
        localStorage.setItem(SAVE_KEY, game.serialize());
        this.ok = true;
      } catch (e) {
        this.ok = false;
      }
      return this.ok;
    },
    read() {
      try {
        return localStorage.getItem(SAVE_KEY);
      } catch (e) {
        this.ok = false;
        return null;
      }
    },
    clear() {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch (e) {
        this.ok = false;
      }
    },
  };

  RC.UI.init(game, store);

  const saved = store.read();
  if (saved) {
    game.load(saved);
    RC.UI.afterStateSwap();
  }

  setInterval(() => game.tick(), 50);
  setInterval(() => store.save(), 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.save();
  });
  window.addEventListener('pagehide', () => store.save());

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  RC.game = game; // útil para depurar no console
})();
