/*
 * Roubar Clicker: tela, animações e sons.
 */
(function (root) {
  'use strict';
  const RC = root.RC;
  const { BUILDINGS, UPGRADES, ACHIEVEMENTS, NEWS } = RC.DATA;
  const { fmt, money, fmtTime, CONST } = RC;

  const $ = (id) => document.getElementById(id);

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function setText(node, text) {
    if (node.textContent !== text) node.textContent = text;
  }

  /* ---------- Moeda ---------- */
  function coinSVG(uid) {
    return (
      '<svg viewBox="0 0 400 400" aria-hidden="true" focusable="false">' +
      '<defs>' +
      '<radialGradient id="' + uid + '-g" cx="34%" cy="26%" r="90%">' +
      '<stop offset="0" stop-color="#fdeeb4"/><stop offset=".42" stop-color="#e3b23c"/><stop offset="1" stop-color="#93610f"/>' +
      '</radialGradient>' +
      '<clipPath id="' + uid + '-c"><circle cx="200" cy="200" r="136"/></clipPath>' +
      '<path id="' + uid + '-t" d="M38,200 a162,162 0 1,1 324,0 a162,162 0 1,1 -324,0"/>' +
      '</defs>' +
      '<circle cx="200" cy="200" r="198" fill="url(#' + uid + '-g)"/>' +
      '<circle cx="200" cy="200" r="193" fill="none" stroke="#6d450a" stroke-width="7" stroke-dasharray="2 4.5" opacity=".5"/>' +
      '<circle cx="200" cy="200" r="186" fill="none" stroke="#fff3c4" stroke-width="1.5" opacity=".8"/>' +
      '<text class="coin-legend" dy="8"><textPath href="#' + uid + '-t" textLength="1004" lengthAdjust="spacing">' +
      'REPÚBLICA DO ROUBAR ★ ORDEM E CLIQUE ★</textPath></text>' +
      '<circle cx="200" cy="200" r="142" fill="#6d450a"/>' +
      '<image class="coin-face" href="assets/roubar.webp" x="64" y="64" width="272" height="272" clip-path="url(#' + uid + '-c)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="200" cy="200" r="136" fill="none" stroke="#3c2300" stroke-opacity=".5" stroke-width="5"/>' +
      '</svg>'
    );
  }

  // Rosácea de cédula atrás da moeda.
  function rosetteSVG() {
    let shapes = '';
    for (let i = 0; i < 36; i++) {
      shapes += '<ellipse rx="240" ry="92" transform="rotate(' + i * 5 + ')"/>';
    }
    for (let i = 0; i < 24; i++) {
      shapes += '<ellipse rx="150" ry="118" transform="rotate(' + i * 7.5 + ')"/>';
    }
    return '<svg viewBox="-250 -250 500 500" fill="none" stroke="currentColor" stroke-width=".7">' + shapes + '</svg>';
  }

  /* ---------- Sons (gerados na hora, sem arquivos) ---------- */
  const Sound = {
    ctx: null,
    enabled: true,
    tone(freq, dur, type, vol, delay, slideTo) {
      if (!this.enabled) return;
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime + (delay || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch (e) { /* sem áudio, sem problema */ }
    },
    click() { this.tone(560 + Math.random() * 140, 0.07, 'triangle', 0.09, 0, 280); },
    buy() { this.tone(660, 0.08, 'square', 0.04); this.tone(990, 0.14, 'square', 0.04, 0.07); },
    deny() { this.tone(150, 0.12, 'sawtooth', 0.04); },
    golden() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.08, i * 0.07)); },
    achievement() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.08, i * 0.09)); },
    ascend() { [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.07, i * 0.11)); },
  };

  const UI = {
    init(game, store) {
      this.game = game;
      this.store = store;
      this.rows = {};
      this.upgradeSig = null;
      this.upgradeNodes = [];
      this.lastNews = -1;
      this.pendingOffline = null;
      this.dirty = true;

      $('coin').innerHTML = coinSVG('coin');
      $('rosette').innerHTML = rosetteSVG();

      this.buildStore();
      this.bindCoin();
      this.bindStore();
      this.bindDialogs();
      this.bindOptions();
      this.bindGame();
      this.syncSettings();
      this.nextNews();

      setInterval(() => this.nextNews(), 12000);
      setInterval(() => this.slowRender(), 250);
      setInterval(() => { document.title = money(game.s.money) + ' | Roubar Clicker'; }, 2000);

      const frame = () => {
        this.renderCounter();
        if (this.dirty) { this.dirty = false; this.slowRender(); }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },

    /* ----- contador ----- */
    renderCounter() {
      const g = this.game;
      setText($('money'), money(g.s.money, true));
      setText($('cps'), money(g.cps) + ' por segundo');
    },

    slowRender() {
      const g = this.game;
      setText($('click-value'), money(g.clickValue) + ' por clique');
      setText($('serial'), String(g.s.clicks).padStart(7, '0'));
      setText($('empire-name-text'), g.s.name);
      this.renderBuffs();
      this.renderUpgrades();
      this.renderStore();
      this.renderPrestigeBadge();
      if ($('dlg-stats').open) this.renderStats();
      if ($('dlg-prestige').open) this.renderPrestige();
    },

    renderBuffs() {
      const g = this.game;
      const box = $('buffs');
      const now = g.now();
      const sig = g.buffs.map((b) => b.id).join(',');
      if (box.dataset.sig !== sig) {
        box.dataset.sig = sig;
        box.textContent = '';
        g.buffs.forEach((b) => {
          const chip = el('div', 'buff');
          chip.appendChild(el('strong', null, b.name));
          chip.appendChild(el('span', 'buff-desc', b.desc));
          chip.appendChild(el('span', 'buff-time'));
          chip.appendChild(el('i'));
          box.appendChild(chip);
        });
        document.body.classList.toggle('frenzy', g.buffs.some((b) => b.kind === 'cps'));
        document.body.classList.toggle('finger', g.buffs.some((b) => b.kind === 'click'));
      }
      g.buffs.forEach((b, i) => {
        const chip = box.children[i];
        if (!chip) return;
        const left = Math.max(0, (b.until - now) / 1000);
        setText(chip.children[2], Math.ceil(left) + ' s');
        chip.children[3].style.width = Math.min(100, (left / b.seconds) * 100) + '%';
      });
    },

    /* ----- loja ----- */
    buildStore() {
      const list = $('buildings');
      BUILDINGS.forEach((b) => {
        const li = el('li');
        const btn = el('button', 'building');
        btn.type = 'button';
        const icon = el('span', 'b-icon', b.icon);
        icon.setAttribute('aria-hidden', 'true');
        const main = el('span', 'b-main');
        const name = el('span', 'b-name', b.name);
        const desc = el('span', 'b-desc', b.desc);
        const rate = el('span', 'b-rate');
        main.appendChild(name);
        main.appendChild(desc);
        main.appendChild(rate);
        const side = el('span', 'b-side');
        const count = el('span', 'b-count', '0');
        const cost = el('span', 'b-cost');
        side.appendChild(count);
        side.appendChild(cost);
        btn.appendChild(icon);
        btn.appendChild(main);
        btn.appendChild(side);
        btn.addEventListener('click', () => this.buyBuilding(b.id));
        li.appendChild(btn);
        list.appendChild(li);
        this.rows[b.id] = { li, btn, icon, name, desc, rate, count, cost };
      });
    },

    renderStore() {
      const g = this.game;
      const amount = g.s.settings.buyAmount;
      let mysteryShown = false;
      BUILDINGS.forEach((b, i) => {
        const r = this.rows[b.id];
        const revealed = g.isRevealed(i);
        if (!revealed && mysteryShown) {
          r.li.hidden = true;
          return;
        }
        r.li.hidden = false;
        r.btn.classList.toggle('mystery', !revealed);
        if (!revealed) {
          mysteryShown = true;
          setText(r.icon, '❔');
          setText(r.name, 'Construção desconhecida');
          setText(r.desc, 'Junte mais dinheiro para descobrir.');
          setText(r.rate, '');
          setText(r.count, '');
          setText(r.cost, money(b.baseCost));
          r.btn.setAttribute('aria-disabled', 'true');
          r.btn.classList.remove('can');
          return;
        }
        const price = g.cost(b.id, amount);
        const can = g.s.money >= price;
        setText(r.icon, b.icon);
        setText(r.name, b.name);
        setText(r.desc, b.desc);
        setText(r.rate, money(g.unitCps[b.id]) + ' por segundo cada');
        setText(r.count, fmt(g.s.buildings[b.id]));
        setText(r.cost, money(price) + (amount > 1 ? ' por ' + amount : ''));
        r.btn.classList.toggle('can', can);
        r.btn.setAttribute('aria-disabled', can ? 'false' : 'true');
      });
    },

    renderUpgrades() {
      const g = this.game;
      const list = g.availableUpgrades();
      const sig = list.map((u) => u.id).join(',');
      const box = $('upgrades');
      if (sig !== this.upgradeSig) {
        this.upgradeSig = sig;
        box.textContent = '';
        this.upgradeNodes = list.map((u) => {
          const btn = el('button', 'upgrade');
          btn.type = 'button';
          const icon = el('span', 'u-icon', u.icon);
          icon.setAttribute('aria-hidden', 'true');
          btn.appendChild(icon);
          btn.appendChild(el('span', 'u-name', u.name));
          btn.appendChild(el('span', 'u-desc', u.desc));
          btn.appendChild(el('span', 'u-cost', money(u.cost)));
          btn.addEventListener('click', () => this.buyUpgrade(u.id));
          box.appendChild(btn);
          return { u, btn };
        });
        $('upgrades-empty').hidden = list.length > 0;
      }
      this.upgradeNodes.forEach(({ u, btn }) => {
        const can = g.s.money >= u.cost;
        btn.classList.toggle('can', can);
        btn.setAttribute('aria-disabled', can ? 'false' : 'true');
      });
    },

    buyBuilding(id) {
      const g = this.game;
      if (g.buy(id, g.s.settings.buyAmount)) {
        Sound.buy();
        this.pulse(this.rows[id].count);
      } else {
        Sound.deny();
      }
      this.dirty = true;
    },

    buyUpgrade(id) {
      if (this.game.buyUpgrade(id)) Sound.buy();
      else Sound.deny();
      this.dirty = true;
    },

    pulse(node) {
      if (!node.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      node.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    },

    bindStore() {
      document.querySelectorAll('[data-amount]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.game.s.settings.buyAmount = Number(btn.dataset.amount);
          this.syncSettings();
          this.dirty = true;
        });
      });
    },

    /* ----- moeda ----- */
    bindCoin() {
      const coin = $('coin');
      const hit = (x, y) => {
        const value = this.game.click();
        Sound.click();
        this.floatText(x, y, '+' + fmt(value), '');
        if (coin.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          coin.animate(
            [{ transform: 'scale(.94) rotate(-1.5deg)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }],
            { duration: 180, easing: 'ease-out' }
          );
        }
      };
      coin.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        hit(e.clientX, e.clientY);
      });
      // Teclado (Enter/Espaço) dispara "click" sem ponteiro.
      coin.addEventListener('click', (e) => {
        if (e.detail !== 0) return;
        const box = coin.getBoundingClientRect();
        hit(box.left + box.width / 2, box.top + box.height / 3);
      });
      coin.addEventListener('keydown', (e) => {
        if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
      });
      coin.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    floatText(x, y, text, cls) {
      if (!this.game.s.settings.fx) return;
      const layer = $('fx');
      if (layer.childElementCount > 40) layer.firstChild.remove();
      const node = el('span', 'float ' + (cls || ''), text);
      node.style.left = x + 'px';
      node.style.top = y + 'px';
      node.style.setProperty('--dx', Math.round(Math.random() * 70 - 35) + 'px');
      node.addEventListener('animationend', () => node.remove());
      layer.appendChild(node);
    },

    /* ----- Roubar Dourado ----- */
    showGolden(spawn) {
      this.hideGolden();
      const btn = el('button', 'golden');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Roubar Dourado. Clique para ganhar um bônus.');
      btn.innerHTML = coinSVG('gold');
      const size = 104;
      const top = 130;
      const bottom = 90;
      btn.style.left = Math.round(12 + spawn.x * Math.max(0, window.innerWidth - size - 24)) + 'px';
      btn.style.top = Math.round(top + spawn.y * Math.max(0, window.innerHeight - size - top - bottom)) + 'px';
      btn.addEventListener('click', () => {
        const box = btn.getBoundingClientRect();
        const result = this.game.clickGolden();
        this.hideGolden();
        if (!result) return;
        Sound.golden();
        this.toast(result.name, result.text, '🌟', 'gold');
        this.floatText(box.left + box.width / 2, box.top, result.name + '!', 'gold');
        this.dirty = true;
      });
      document.body.appendChild(btn);
      this.goldenNode = btn;
    },

    hideGolden() {
      if (this.goldenNode) {
        this.goldenNode.remove();
        this.goldenNode = null;
      }
    },

    /* ----- avisos ----- */
    toast(title, text, icon, cls) {
      const box = $('toasts');
      while (box.childElementCount >= 3) box.firstChild.remove();
      const node = el('div', 'toast ' + (cls || ''));
      const ic = el('span', 't-icon', icon || '');
      ic.setAttribute('aria-hidden', 'true');
      const body = el('div');
      body.appendChild(el('strong', null, title));
      if (text) body.appendChild(el('span', null, text));
      node.appendChild(ic);
      node.appendChild(body);
      box.appendChild(node);
      setTimeout(() => node.remove(), 4500);
    },

    nextNews() {
      const g = this.game;
      const pool = [];
      NEWS.forEach((n, i) => {
        if (i !== this.lastNews && (!n.req || g.reqMet(n.req))) pool.push(i);
      });
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.lastNews = pick;
      const node = $('ticker-text');
      node.classList.remove('in');
      void node.offsetWidth; // reinicia a animação
      node.textContent = NEWS[pick].text;
      node.classList.add('in');
    },

    /* ----- janelas ----- */
    bindDialogs() {
      document.querySelectorAll('[data-open]').forEach((btn) => {
        btn.addEventListener('click', () => this.open(btn.dataset.open));
      });
      document.querySelectorAll('dialog').forEach((dlg) => {
        dlg.addEventListener('click', (e) => {
          if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
        });
      });
      $('ticker').addEventListener('click', () => this.nextNews());

      $('empire-name').addEventListener('click', () => {
        $('name-input').value = this.game.s.name;
        this.open('dlg-name');
        $('name-input').select();
      });
      $('name-form').addEventListener('submit', () => {
        if (this.game.rename($('name-input').value)) this.store.save();
        this.dirty = true;
      });

      $('btn-ascend').addEventListener('click', () => {
        const btn = $('btn-ascend');
        if (this.game.prestigeGain() <= 0) return;
        if (btn.dataset.armed !== '1') {
          btn.dataset.armed = '1';
          this.renderPrestige();
          return;
        }
        btn.dataset.armed = '';
        const gain = this.game.ascend();
        Sound.ascend();
        this.store.save();
        this.hideGolden();
        this.upgradeSig = null;
        $('dlg-prestige').close();
        this.toast('Você renasceu', '+' + fmt(gain) + (gain === 1 ? ' Roubar de Ouro' : ' Roubars de Ouro'), '🔥', 'gold');
        this.dirty = true;
      });
      $('dlg-prestige').addEventListener('close', () => { $('btn-ascend').dataset.armed = ''; });
    },

    open(id) {
      const dlg = $(id);
      if (id === 'dlg-achievements') this.renderAchievements();
      if (id === 'dlg-stats') this.renderStats();
      if (id === 'dlg-prestige') this.renderPrestige();
      if (id === 'dlg-options') {
        $('import-error').hidden = true;
        $('save-code').value = '';
        $('storage-warning').hidden = this.store.ok;
      }
      if (!dlg.open) dlg.showModal();
    },

    renderAchievements() {
      const g = this.game;
      const have = g.s.achievements;
      $('ach-summary').textContent =
        have.length + ' de ' + ACHIEVEMENTS.length + ' conquistas. Cada uma aumenta a produção em 1%: você está com +' + have.length + '%.';
      const list = $('ach-list');
      list.textContent = '';
      ACHIEVEMENTS.forEach((a) => {
        const got = have.indexOf(a.id) !== -1;
        const hidden = a.secret && !got;
        const li = el('li', 'medal' + (got ? ' got' : ''));
        const icon = el('span', 'm-icon', hidden ? '❔' : a.icon);
        icon.setAttribute('aria-hidden', 'true');
        const body = el('div');
        body.appendChild(el('strong', null, hidden ? 'Conquista secreta' : a.name));
        body.appendChild(el('span', null, hidden ? 'Continue jogando para descobrir.' : a.desc));
        if (got) body.appendChild(el('span', 'm-state', 'Conquistada'));
        li.appendChild(icon);
        li.appendChild(body);
        list.appendChild(li);
      });
    },

    statRows(target, rows) {
      // Atualiza só o texto quando a lista já existe (evita piscar a cada segundo).
      if (target.children.length !== rows.length * 2) {
        target.textContent = '';
        rows.forEach(([label]) => {
          target.appendChild(el('dt', null, label));
          target.appendChild(el('dd'));
        });
      }
      rows.forEach(([, value], i) => setText(target.children[i * 2 + 1], String(value)));
    },

    renderStats() {
      const g = this.game;
      const s = g.s;
      this.statRows($('stats-body'), [
        ['Dinheiro em caixa', money(s.money)],
        ['Ganho nesta partida', money(s.earned)],
        ['Ganho em todas as partidas', money(s.earnedAll)],
        ['Produção por segundo', money(g.cps)],
        ['Valor do clique', money(g.clickValue)],
        ['Cliques', fmt(s.clicks)],
        ['Ganho só com cliques', money(s.handMade)],
        ['Construções', fmt(g.totalBuildings())],
        ['Melhorias compradas', s.upgrades.length + ' de ' + UPGRADES.length],
        ['Conquistas', s.achievements.length + ' de ' + ACHIEVEMENTS.length],
        ['Roubars Dourados clicados', fmt(s.golden)],
        ['Roubars de Ouro', fmt(s.gold) + ' (+' + fmt(s.gold * CONST.GOLD_BONUS * 100) + '% de produção)'],
        ['Vezes que renasceu', fmt(s.ascensions)],
        ['Tempo de jogo', fmtTime(s.playtime)],
        ['Jogando desde', new Date(s.startedAt).toLocaleDateString('pt-BR')],
      ]);
    },

    renderPrestige() {
      const g = this.game;
      const s = g.s;
      const gain = g.prestigeGain();
      const total = s.gold + gain;
      const prev = Math.pow(total, 3) * CONST.GOLD_UNIT;
      const next = g.nextGoldAt();
      const pct = Math.max(0, Math.min(1, (s.earnedAll - prev) / (next - prev)));
      this.statRows($('prestige-body'), [
        ['Roubars de Ouro que você tem', fmt(s.gold) + ' (+' + fmt(s.gold * CONST.GOLD_BONUS * 100) + '% de produção)'],
        ['Você recebe se renascer agora', fmt(gain)],
      ]);
      $('prestige-meter').style.width = pct * 100 + '%';
      $('prestige-hint').textContent = 'Faltam ' + money(Math.max(0, next - s.earnedAll)) + ' para o próximo Roubar de Ouro.';
      const btn = $('btn-ascend');
      btn.disabled = gain <= 0;
      if (gain <= 0) btn.dataset.armed = '';
      setText(btn,
        gain <= 0 ? 'Ainda não há Roubars de Ouro para receber'
          : btn.dataset.armed === '1' ? 'Confirmar: zerar tudo e renascer'
            : 'Renascer e receber ' + fmt(gain) + (gain === 1 ? ' Roubar de Ouro' : ' Roubars de Ouro'));
    },

    renderPrestigeBadge() {
      const gain = this.game.prestigeGain();
      const badge = $('prestige-badge');
      badge.hidden = gain <= 0;
      if (gain > 0) setText(badge, '+' + fmt(gain));
    },

    /* ----- opções ----- */
    bindOptions() {
      const g = this.game;
      const setSound = (on) => {
        g.s.settings.sound = on;
        this.syncSettings();
        this.store.save();
      };
      $('btn-sound').addEventListener('click', () => setSound(!g.s.settings.sound));
      $('opt-sound').addEventListener('change', (e) => setSound(e.target.checked));
      $('opt-fx').addEventListener('change', (e) => {
        g.s.settings.fx = e.target.checked;
        this.store.save();
      });

      $('btn-save').addEventListener('click', () => {
        if (this.store.save()) this.toast('Progresso salvo', null, '💾');
        else this.toast('Não foi possível salvar', 'Use o código abaixo para guardar o progresso.', '⚠️', 'warn');
        $('storage-warning').hidden = this.store.ok;
      });

      $('btn-export').addEventListener('click', () => {
        const area = $('save-code');
        area.value = g.serialize();
        area.select();
        $('import-error').hidden = true;
        const done = () => this.toast('Código copiado', 'Cole no outro aparelho em Opções.', '📋');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(area.value).then(done, () => this.toast('Código gerado', 'Copie o texto da caixa.', '📋'));
        } else {
          this.toast('Código gerado', 'Copie o texto da caixa.', '📋');
        }
      });

      $('btn-import').addEventListener('click', () => {
        const code = $('save-code').value.trim();
        if (!code || !g.load(code)) {
          $('import-error').hidden = false;
          return;
        }
        $('import-error').hidden = true;
        this.afterStateSwap();
        this.store.save();
        $('dlg-options').close();
        this.toast('Progresso carregado', null, '✅');
      });

      const wipe = $('btn-wipe');
      wipe.addEventListener('click', () => {
        if (wipe.dataset.armed !== '1') {
          wipe.dataset.armed = '1';
          wipe.textContent = 'Clique de novo para apagar tudo';
          setTimeout(() => {
            wipe.dataset.armed = '';
            wipe.textContent = 'Apagar todo o progresso';
          }, 5000);
          return;
        }
        wipe.dataset.armed = '';
        wipe.textContent = 'Apagar todo o progresso';
        g.reset();
        this.store.clear();
        this.afterStateSwap();
        $('dlg-options').close();
        this.toast('Progresso apagado', 'A República começa de novo.', '🧹');
      });
    },

    // Depois de carregar um código ou apagar tudo: o estado inteiro mudou.
    afterStateSwap() {
      this.hideGolden();
      this.upgradeSig = null;
      this.syncSettings();
      this.dirty = true;
    },

    syncSettings() {
      const st = this.game.s.settings;
      Sound.enabled = st.sound;
      const btn = $('btn-sound');
      btn.textContent = st.sound ? '🔊' : '🔇';
      btn.setAttribute('aria-pressed', st.sound ? 'true' : 'false');
      btn.setAttribute('aria-label', st.sound ? 'Som ligado' : 'Som desligado');
      $('opt-sound').checked = st.sound;
      $('opt-fx').checked = st.fx;
      document.querySelectorAll('[data-amount]').forEach((b) => {
        b.setAttribute('aria-pressed', Number(b.dataset.amount) === st.buyAmount ? 'true' : 'false');
      });
    },

    /* ----- eventos do jogo ----- */
    bindGame() {
      const g = this.game;
      g.on('change', () => { this.dirty = true; });
      g.on('achievement', (a) => {
        Sound.achievement();
        this.toast('Conquista: ' + a.name, a.desc, a.icon, 'gold');
        if ($('dlg-achievements').open) this.renderAchievements();
      });
      g.on('golden', (spawn) => this.showGolden(spawn));
      g.on('goldenGone', () => this.hideGolden());
      g.on('offline', (o) => this.showOffline(o));
    },

    showOffline(o) {
      $('offline-text').textContent =
        'Você ficou ' + fmtTime(o.seconds) + ' fora. A República continuou trabalhando pela metade do ritmo' +
        (o.capped ? ' (contam só as primeiras 8 horas).' : '.');
      $('offline-gain').textContent = '+' + money(o.gain);
      const dlg = $('dlg-offline');
      if (!dlg.open) {
        // Não abre por cima de outra janela.
        if (document.querySelector('dialog[open]')) this.toast('Enquanto você estava fora', '+' + money(o.gain), '💤', 'gold');
        else dlg.showModal();
      }
    },
  };

  RC.UI = UI;
})(window);
