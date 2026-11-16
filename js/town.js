/*
 * Roubar Clicker: a cidadezinha embaixo da moeda.
 * Mostra as construções compradas, os clones andando, os planetas do
 * Roubarverso, o dia e a noite, e o cartão de detalhes ao tocar.
 * As funções layout() e phaseFor() não usam a página e têm testes.
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const ART = RC.TOWN_ART;
  const { BUILDINGS } = RC.DATA;
  const BY_ID = {};
  BUILDINGS.forEach((b) => (BY_ID[b.id] = b));

  const CAP = 8; // desenhos por tipo de construção
  const CLONE_CAP = 12;
  const PLANET_CAP = 8;
  const PAD = 28; // margem nas pontas da paisagem
  const GAP = 34; // espaço entre grupos
  const HIDE_CHANCE = 0.35; // Roubar Dourado escondido na cidade
  // Os clones andam na rua e os Roubarversos ficam no céu; o resto vai em fila.
  const LOT_IDS = BUILDINGS.map((b) => b.id).filter((id) => id !== 'clone' && id !== 'multiverso');

  // Número "aleatório" fixo para cada índice: o desenho não muda a cada atualização.
  function rand(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function layout(counts) {
    counts = counts || {};
    const lots = [];
    let x = PAD;
    LOT_IDS.forEach((id) => {
      const total = Math.max(0, Math.floor(counts[id] || 0));
      if (!total) return;
      const art = ART[id];
      const shown = Math.min(total, CAP);
      const w = art.w + (shown - 1) * art.step;
      lots.push({ id, total, shown, x, w, h: art.h, plaque: total > CAP });
      x += w + GAP;
    });
    return {
      lots,
      width: lots.length ? x - GAP + PAD : 0,
      clones: Math.min(Math.max(0, Math.floor(counts.clone || 0)), CLONE_CAP),
      planets: Math.min(Math.max(0, Math.floor(counts.multiverso || 0)), PLANET_CAP),
    };
  }

  function phaseFor(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  }

  const reducedMotion = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function unitHTML(art, cls, style) {
    return '<svg class="unit ' + cls + '" width="' + art.w + '" height="' + art.h + '" viewBox="0 0 ' + art.w + ' ' + art.h +
      '" style="' + style + '" aria-hidden="true" focusable="false">' + art.svg + '</svg>';
  }

  function fromHTML(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  const Town = {
    CAP, CLONE_CAP, PLANET_CAP, LOT_IDS, layout, phaseFor,
    hourOverride: null,

    init(game) {
      this.game = game;
      this.lots = {};
      this.cloneEls = [];
      this.planetEls = [];
      this.sig = null;
      this.visible = true;
      this.L = layout({});

      const rootEl = (this.root = document.getElementById('town'));
      rootEl.innerHTML =
        RC.TOWN_DEFS +
        '<div class="town-sky" aria-hidden="true"><div class="stars"></div>' + RC.TOWN_SUN + RC.TOWN_MOON + '</div>' +
        '<div class="town-scroll"><div class="town-world">' +
        '<div class="town-hills" aria-hidden="true"></div>' +
        '<div class="town-planets"></div>' +
        '<div class="town-ground" aria-hidden="true"></div>' +
        '<div class="town-lots"></div>' +
        '<div class="town-clones"></div>' +
        '</div></div>' +
        '<div class="town-empty"><strong>Terreno da República</strong><span>Compre construções para povoar.</span></div>' +
        '<div class="town-card" aria-live="polite" hidden></div>';

      this.scroll = rootEl.querySelector('.town-scroll');
      this.world = rootEl.querySelector('.town-world');
      this.lotsBox = rootEl.querySelector('.town-lots');
      this.clonesBox = rootEl.querySelector('.town-clones');
      this.planetsBox = rootEl.querySelector('.town-planets');
      this.card = rootEl.querySelector('.town-card');

      // Botões invisíveis para quem usa teclado ou leitor de tela.
      this.cloneBtn = el('button', 'sr-only');
      this.cloneBtn.type = 'button';
      this.cloneBtn.dataset.id = 'clone';
      this.planetBtn = el('button', 'sr-only');
      this.planetBtn.type = 'button';
      this.planetBtn.dataset.id = 'multiverso';
      this.clonesBox.appendChild(this.cloneBtn);
      this.planetsBox.appendChild(this.planetBtn);

      this.world.addEventListener('click', (e) => {
        const t = e.target.closest('[data-id]');
        if (t && this.world.contains(t)) this.showCard(t.dataset.id, t);
      });
      document.addEventListener('pointerdown', (e) => {
        if (!this.card.hidden && !this.card.contains(e.target) && !e.target.closest('.town [data-id]')) this.hideCard();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.hideCard();
      });
      // Rolar a cidade fecha o cartão (menos a rolagem que o próprio toque provoca).
      this.scroll.addEventListener('scroll', () => {
        if (Date.now() - (this.cardShownAt || 0) > 500) this.hideCard();
      }, { passive: true });

      // Pausa as animações quando a cidade sai da tela.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          this.visible = entry.intersectionRatio >= 0.6;
          rootEl.classList.toggle('paused', !entry.isIntersecting);
        }, { threshold: [0, 0.6, 1] }).observe(rootEl);
      }

      let lastWidth = window.innerWidth;
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return; // celular muda a altura ao rolar
        lastWidth = window.innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.render(true), 300);
      });

      this.updatePhase();
      setInterval(() => this.updatePhase(), 60000);
      this.render(true);
    },

    /* ----- dia e noite ----- */
    updatePhase() {
      const hour = this.hourOverride != null ? this.hourOverride : new Date().getHours();
      this.root.dataset.phase = phaseFor(hour);
    },

    // Para testar: RC.Town.setHour(22) mostra a noite; RC.Town.setHour(null) volta ao relógio.
    setHour(hour) {
      this.hourOverride = hour;
      this.updatePhase();
    },

    /* ----- desenho ----- */
    worldWidth() {
      return Math.max(this.L.width, this.scroll.clientWidth || 0);
    },

    render(force) {
      if (!this.root) return;
      const counts = this.game.s.buildings;
      const sig = BUILDINGS.map((b) => counts[b.id]).join(',');
      if (!force && sig === this.sig) return;
      this.sig = sig;

      if (force) {
        Object.keys(this.lots).forEach((id) => this.lots[id].el.remove());
        this.lots = {};
        this.cloneEls.forEach((c) => c.remove());
        this.cloneEls = [];
        this.planetEls.forEach((p) => p.remove());
        this.planetEls = [];
        this.hideCard();
      }

      const L = (this.L = layout(counts));
      this.world.style.width = L.width + 'px';
      const seen = {};
      L.lots.forEach((lot) => {
        seen[lot.id] = true;
        this.syncLot(lot);
      });
      Object.keys(this.lots).forEach((id) => {
        if (!seen[id]) {
          this.lots[id].el.remove();
          delete this.lots[id];
        }
      });

      const W = this.worldWidth();
      this.syncClones(L.clones, W);
      this.syncPlanets(L.planets, W);
      this.root.classList.toggle('is-empty', L.lots.length + L.clones + L.planets === 0);
    },

    syncLot(lot) {
      const art = ART[lot.id];
      const b = BY_ID[lot.id];
      let rec = this.lots[lot.id];
      if (!rec) {
        const btn = el('button', 'lot lot-' + lot.id);
        btn.type = 'button';
        btn.dataset.id = lot.id;
        const plaque = el('span', 'plaque');
        plaque.setAttribute('aria-hidden', 'true');
        btn.appendChild(plaque);
        this.lotsBox.appendChild(btn);
        rec = this.lots[lot.id] = { el: btn, plaque, units: [], added: null };
      }
      rec.el.style.left = lot.x + 'px';
      rec.el.style.width = lot.w + 'px';
      rec.el.style.height = lot.h + 'px';
      const seed = LOT_IDS.indexOf(lot.id) * 31;
      while (rec.units.length < lot.shown) {
        const i = rec.units.length;
        const delay = (-rand(seed + i) * 6).toFixed(2);
        const unit = fromHTML(unitHTML(art, 'u-' + lot.id, 'left:' + i * art.step + 'px;--d:' + delay + 's'));
        rec.el.insertBefore(unit, rec.plaque);
        rec.units.push(unit);
        rec.added = unit;
      }
      while (rec.units.length > lot.shown) rec.units.pop().remove();
      rec.plaque.textContent = '×' + RC.fmt(lot.total);
      rec.plaque.hidden = !lot.plaque;
      rec.el.setAttribute('aria-label', b.name + ': ' + RC.fmt(lot.total) + '. Ver detalhes');
    },

    syncClones(n, W) {
      while (this.cloneEls.length < n) {
        const i = this.cloneEls.length;
        const range = Math.max(60, Math.min(W - 70, 120 + rand(i * 7 + 1) * 260));
        const start = 12 + rand(i * 7 + 2) * Math.max(0, W - range - 50);
        const speed = 18 + rand(i * 7 + 3) * 16; // pixels por segundo
        const lap = ((range * 2) / speed).toFixed(1);
        const lift = Math.round(rand(i * 7 + 4) * 9);
        const scale = (0.88 + rand(i * 7 + 5) * 0.2).toFixed(2);
        const clone = el('div', 'clone');
        clone.dataset.id = 'clone';
        clone.style.cssText =
          'left:' + start.toFixed(0) + 'px;bottom:' + lift + 'px;z-index:' + (20 - lift) +
          ';--dist:' + range.toFixed(0) + 'px;--t:' + lap + 's;--d:' + (-rand(i * 7 + 6) * lap).toFixed(1) + 's;--s:' + scale;
        clone.appendChild(fromHTML(unitHTML(ART.clone, 'u-clone', '--d:' + (-rand(i) * 2).toFixed(2) + 's')));
        this.clonesBox.appendChild(clone);
        this.cloneEls.push(clone);
      }
      while (this.cloneEls.length > n) this.cloneEls.pop().remove();
      const total = this.game.s.buildings.clone;
      this.cloneBtn.hidden = total <= 0;
      this.cloneBtn.textContent = 'Clones do Roubar: ' + RC.fmt(total) + '. Ver detalhes';
    },

    syncPlanets(n, W) {
      while (this.planetEls.length < n) {
        const i = this.planetEls.length;
        const planet = el('div', 'planet');
        planet.dataset.id = 'multiverso';
        planet.style.setProperty('--s', (0.65 + rand(i + 40) * 0.45).toFixed(2));
        planet.appendChild(fromHTML(unitHTML(ART.multiverso, 'u-planet', '--d:' + (-rand(i + 60) * 6).toFixed(2) + 's')));
        this.planetsBox.appendChild(planet);
        this.planetEls.push(planet);
      }
      while (this.planetEls.length > n) this.planetEls.pop().remove();
      const slot = (W - PAD * 2) / Math.max(1, n);
      this.planetEls.forEach((p, i) => {
        p.style.left = Math.max(4, PAD + slot * (i + 0.5) - 23 + (rand(i + 80) - 0.5) * 30).toFixed(0) + 'px';
        p.style.top = (6 + rand(i + 90) * 36).toFixed(0) + 'px';
      });
      const total = this.game.s.buildings.multiverso;
      this.planetBtn.hidden = total <= 0;
      this.planetBtn.textContent = 'Roubarversos: ' + RC.fmt(total) + '. Ver detalhes';
    },

    pop(node) {
      if (!node || !node.animate || reducedMotion()) return;
      node.animate(
        [
          { transform: 'translateY(16px) scale(.6)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1.06)', opacity: 1, offset: 0.6 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 450, easing: 'ease-out' }
      );
    },

    // Depois de uma compra: mostra a construção nova surgindo.
    onBuy(id) {
      if (!this.root) return;
      Object.keys(this.lots).forEach((k) => (this.lots[k].added = null));
      this.render();
      const behavior = reducedMotion() ? 'auto' : 'smooth';
      if (id === 'clone') {
        const c = this.cloneEls[this.cloneEls.length - 1];
        if (c) this.pop(c.firstChild);
        return;
      }
      if (id === 'multiverso') {
        const p = this.planetEls[this.planetEls.length - 1];
        if (p) this.pop(p.firstChild);
        return;
      }
      const rec = this.lots[id];
      const lot = this.L.lots.find((l) => l.id === id);
      if (!rec || !lot) return;
      const focusX = rec.added ? lot.x + parseFloat(rec.added.style.left) + ART[id].w / 2 : lot.x + lot.w / 2;
      this.scroll.scrollTo({ left: Math.max(0, focusX - this.scroll.clientWidth / 2), behavior });
      if (rec.added) this.pop(rec.added);
      else if (rec.plaque.animate && !reducedMotion()) {
        rec.plaque.animate([{ transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
      }
      rec.added = null;
    },

    /* ----- cartão de detalhes ----- */
    showCard(id, anchor) {
      const b = BY_ID[id];
      if (!b) return;
      const g = this.game;
      const owned = g.s.buildings[id];
      const unit = g.unitCps[id];
      const total = unit * owned;
      const share = g.baseCps > 0 ? (total / g.baseCps) * 100 : 0;
      const pct = share > 0 && share < 0.1 ? 'menos de 0,1' : share.toFixed(share < 10 ? 1 : 0).replace('.', ',');

      const card = this.card;
      card.textContent = '';
      const head = el('div', 'card-head');
      head.appendChild(el('strong', null, b.name));
      const close = el('button', 'card-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Fechar');
      close.addEventListener('click', () => this.hideCard());
      head.appendChild(close);
      card.appendChild(head);
      card.appendChild(el('p', 'card-desc', b.desc));
      const dl = el('dl');
      [
        ['Você tem', RC.fmt(owned)],
        ['Cada um rende', RC.money(unit) + '/s'],
        ['Todos juntos', RC.money(total) + '/s (' + pct + '% da produção)'],
      ].forEach(([k, v]) => {
        dl.appendChild(el('dt', null, k));
        dl.appendChild(el('dd', null, v));
      });
      card.appendChild(dl);

      card.hidden = false;
      this.cardShownAt = Date.now();
      const rr = this.root.getBoundingClientRect();
      const ar = anchor.getBoundingClientRect();
      const cw = card.offsetWidth;
      const center = ar.width ? ar.left + ar.width / 2 - rr.left : rr.width / 2;
      card.style.left = Math.max(8, Math.min(center - cw / 2, rr.width - cw - 8)) + 'px';
    },

    hideCard() {
      if (this.card && !this.card.hidden) this.card.hidden = true;
    },

    /* ----- Roubar Dourado escondido ----- */
    shouldHideGolden() {
      return !!this.root && this.visible && Object.keys(this.lots).length > 0 && !document.hidden && Math.random() < HIDE_CHANCE;
    },

    // Põe o botão do Roubar Dourado entre os prédios, na parte da cidade que está à vista.
    adoptGolden(btn) {
      const view = Math.min(this.scroll.clientWidth, this.worldWidth());
      const x = this.scroll.scrollLeft + 16 + Math.random() * Math.max(0, view - 90);
      btn.classList.add('in-town');
      btn.style.left = x.toFixed(0) + 'px';
      btn.style.bottom = (44 + Math.random() * 40).toFixed(0) + 'px';
      this.world.appendChild(btn);
    },
  };

  RC.Town = Town;
  if (typeof module !== 'undefined' && module.exports) module.exports = RC;
})(typeof window !== 'undefined' ? window : globalThis);
