/*
 * Roubar Clicker: a cidadezinha embaixo da moeda.
 *
 * Cada tipo de construção tem o próprio lote (cerca, chão e placa). As
 * melhorias mudam o desenho do lote delas; as melhorias de clique, imposto,
 * decreto e Roubar Dourado ganham lotes próprios (Praça do Clique, Receita,
 * Palácio e Fonte da Sorte); as obras da República mudam a cidade inteira.
 * As funções layout() e phaseFor() não usam a página e têm testes.
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const ART = RC.TOWN_ART;
  const OBRA = RC.TOWN_OBRA;
  const { BUILDINGS, UPGRADES } = RC.DATA;
  const BY_ID = {};
  BUILDINGS.forEach((b) => (BY_ID[b.id] = b));
  const UP_BY_ID = {};
  UPGRADES.forEach((u) => (UP_BY_ID[u.id] = u));

  const CAP = 5; // desenhos por lote
  const CLONE_CAP = 12;
  const PLANET_CAP = 8;
  const PAD = 28; // margem nas pontas da paisagem
  const GAP = 50; // caminho entre lotes (cabe um poste e uma árvore)
  const PADIN = 14; // margem dentro do lote
  const UNIT_GAP = 12; // espaço entre unidades do mesmo lote
  const MIN_PLOT = 176; // cabe a placa com o nome
  const STREET = 44;
  const HIDE_CHANCE = 0.35;

  const range = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + '-' + (i + 1));

  // Lotes cívicos: aparecem com a primeira melhoria do grupo.
  const CIVIC = {
    praca: { name: 'Praça do Clique', desc: 'Cada melhoria de clique muda a praça.', ups: range('clique', 5) },
    palacio: { name: 'Palácio da República', desc: 'Cada decreto muda o palácio. O Feriado enfeita a cidade inteira.', ups: range('decreto', 6) },
    receita: { name: 'Receita do Roubar', desc: 'Cada imposto sobre o clique muda a Receita.', ups: range('fatia', 5) },
    fonte: { name: 'Fonte da Sorte', desc: 'Cada melhoria do Roubar Dourado muda a fonte.', ups: range('dourado', 3) },
  };
  const PLOT_IDS = Object.keys(CIVIC).concat(BUILDINGS.map((b) => b.id).filter((id) => id !== 'multiverso'));
  const OBRAS = UPGRADES.filter((u) => u.id.indexOf('obra-') === 0).map((u) => u.id);

  // Melhorias que mudam cada lote, na ordem.
  function upgradesOf(id) {
    if (CIVIC[id]) return CIVIC[id].ups;
    return UPGRADES.filter((u) => u.id.indexOf(id + '-') === 0).map((u) => u.id);
  }

  // Lote que uma melhoria muda (null = a cidade inteira).
  function plotOf(upgradeId) {
    const prefix = upgradeId.split('-')[0];
    for (const id in CIVIC) if (CIVIC[id].ups.indexOf(upgradeId) !== -1) return id;
    if (prefix === 'obra') return null;
    return prefix;
  }

  const artOf = (id) => ART[id === 'clone' ? 'dorm' : id];

  function rand(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function layout(counts, owned) {
    counts = counts || {};
    const has = new Set(owned || []);
    const plots = [];
    let x = PAD;
    PLOT_IDS.forEach((id) => {
      let total;
      let shown;
      let kind;
      if (CIVIC[id]) {
        if (!CIVIC[id].ups.some((u) => has.has(u))) return;
        kind = 'civic';
        total = 1;
        shown = 1;
      } else {
        total = Math.max(0, Math.floor(counts[id] || 0));
        if (!total) return;
        kind = id === 'clone' ? 'dorm' : 'building';
        shown = kind === 'dorm' ? 1 : Math.min(total, CAP);
      }
      const art = artOf(id);
      const inner = shown * art.w + (shown - 1) * UNIT_GAP;
      const w = Math.max(MIN_PLOT, inner + PADIN * 2);
      plots.push({ id, kind, total, shown, x, w, h: art.h, ux: (w - inner) / 2 });
      x += w + GAP;
    });
    return {
      plots,
      width: plots.length ? x - GAP + PAD : 0,
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

  // Liga as classes has-1, has-2... conforme as melhorias compradas.
  function setTiers(node, ids, owned) {
    let count = 0;
    ids.forEach((uid, i) => {
      const on = owned.has(uid);
      if (on) count++;
      node.classList.toggle('has-' + (i + 1), on);
    });
    node.classList.toggle('has-all', ids.length > 0 && count === ids.length);
    return count;
  }

  const Town = {
    CAP, CLONE_CAP, PLANET_CAP, PLOT_IDS, CIVIC, layout, phaseFor, upgradesOf, plotOf,
    hourOverride: null,

    init(game) {
      this.game = game;
      this.plots = {};
      this.cloneEls = [];
      this.planetEls = [];
      this.sig = null;
      this.visible = true;
      this.L = layout({}, []);

      const rootEl = (this.root = document.getElementById('town'));
      let confetti = '';
      for (let i = 0; i < 26; i++) {
        confetti += '<i style="left:' + (rand(i + 200) * 100).toFixed(1) + '%;--d:' + (-rand(i + 300) * 6).toFixed(2) +
          's;--t:' + (4 + rand(i + 400) * 4).toFixed(1) + 's;--c:' + (i % 4) + '"></i>';
      }
      rootEl.innerHTML =
        RC.TOWN_DEFS +
        '<div class="town-sky" aria-hidden="true"><div class="stars"></div>' + RC.TOWN_SUN + RC.TOWN_MOON + '</div>' +
        '<div class="town-fx" aria-hidden="true">' +
        '<svg class="cable" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="18" x2="100" y2="34" vector-effect="non-scaling-stroke"/></svg>' +
        '<div class="gondola">' + OBRA.gondola + '</div>' +
        '<div class="blimp">' + OBRA.blimp + '</div>' +
        '<div class="burst b1">' + OBRA.burst + '</div><div class="burst b2">' + OBRA.burst + '</div><div class="burst b3">' + OBRA.burst + '</div>' +
        '<div class="confetti">' + confetti + '</div>' +
        '</div>' +
        '<div class="town-scroll"><div class="town-world">' +
        '<div class="town-hills" aria-hidden="true"></div>' +
        '<div class="town-planets"></div>' +
        '<div class="town-ground" aria-hidden="true"></div>' +
        '<div class="bunting" aria-hidden="true"></div>' +
        '<div class="town-deco" aria-hidden="true"></div>' +
        '<div class="town-plots"></div>' +
        '<div class="town-clones"><div class="bus" aria-hidden="true">' + OBRA.bus + '</div></div>' +
        '</div></div>' +
        '<div class="town-empty"><strong>Terreno da República</strong><span>Compre construções para povoar.</span></div>' +
        '<div class="town-card" aria-live="polite" hidden></div>';

      this.scroll = rootEl.querySelector('.town-scroll');
      this.world = rootEl.querySelector('.town-world');
      this.plotsBox = rootEl.querySelector('.town-plots');
      this.decoBox = rootEl.querySelector('.town-deco');
      this.clonesBox = rootEl.querySelector('.town-clones');
      this.planetsBox = rootEl.querySelector('.town-planets');
      this.bus = rootEl.querySelector('.bus');
      this.card = rootEl.querySelector('.town-card');

      this.planetBtn = el('button', 'sr-only');
      this.planetBtn.type = 'button';
      this.planetBtn.dataset.id = 'multiverso';
      this.planetsBox.appendChild(this.planetBtn);

      this.world.addEventListener('click', (e) => {
        if (this.dragged) return;
        const t = e.target.closest('[data-id]');
        if (t && this.world.contains(t)) this.showCard(t.dataset.id, t);
      });
      document.addEventListener('pointerdown', (e) => {
        if (!this.card.hidden && !this.card.contains(e.target) && !e.target.closest('.town [data-id]')) this.hideCard();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.hideCard();
      });
      this.scroll.addEventListener('scroll', () => {
        if (Date.now() - (this.cardShownAt || 0) > 500) this.hideCard();
      }, { passive: true });

      // No PC: a roda do mouse e arrastar com o mouse rolam a cidade para o lado.
      this.scroll.addEventListener('wheel', (e) => {
        const sc = this.scroll;
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || sc.scrollWidth <= sc.clientWidth) return;
        const before = sc.scrollLeft;
        sc.scrollLeft += e.deltaY;
        if (sc.scrollLeft !== before) e.preventDefault();
      }, { passive: false });
      let drag = null;
      this.scroll.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        drag = { x: e.clientX, left: this.scroll.scrollLeft, moved: false };
        this.dragged = false;
      });
      window.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        if (Math.abs(dx) > 5) drag.moved = true;
        if (drag.moved) {
          this.scroll.scrollLeft = drag.left - dx;
          this.root.classList.add('dragging');
        }
      });
      window.addEventListener('pointerup', () => {
        if (!drag) return;
        this.dragged = drag.moved;
        drag = null;
        this.root.classList.remove('dragging');
        setTimeout(() => (this.dragged = false), 0);
      });

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
        if (window.innerWidth === lastWidth) return;
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
      const s = this.game.s;
      const sig = BUILDINGS.map((b) => s.buildings[b.id]).join(',') + '|' + s.upgrades.join(',');
      if (!force && sig === this.sig) return;
      this.sig = sig;
      const owned = new Set(s.upgrades);

      if (force) {
        Object.keys(this.plots).forEach((id) => this.plots[id].el.remove());
        this.plots = {};
        this.cloneEls.forEach((c) => c.remove());
        this.cloneEls = [];
        this.planetEls.forEach((p) => p.remove());
        this.planetEls = [];
        this.hideCard();
      }

      const L = (this.L = layout(s.buildings, s.upgrades));
      this.world.style.width = L.width + 'px';
      const seen = {};
      L.plots.forEach((plot) => {
        seen[plot.id] = true;
        this.syncPlot(plot, owned);
      });
      Object.keys(this.plots).forEach((id) => {
        if (!seen[id]) {
          this.plots[id].el.remove();
          delete this.plots[id];
        }
      });

      const W = this.worldWidth();
      this.syncClones(L.clones, W, owned);
      this.syncPlanets(L.planets, W, owned);
      this.syncCity(L, W, owned);
      this.root.classList.toggle('is-empty', L.plots.length + L.clones + L.planets === 0);
    },

    syncPlot(plot, owned) {
      const art = artOf(plot.id);
      let rec = this.plots[plot.id];
      if (!rec) {
        const btn = el('button', 'plot plot-' + plot.id + ' kind-' + plot.kind);
        btn.type = 'button';
        btn.dataset.id = plot.id;
        btn.appendChild(el('span', 'plot-patch'));
        btn.appendChild(el('span', 'fence'));
        const label = el('span', 'plot-label');
        const name = el('span', 'pl-name');
        const stars = el('span', 'pl-stars');
        label.appendChild(name);
        label.appendChild(stars);
        btn.appendChild(label);
        this.plotsBox.appendChild(btn);
        rec = this.plots[plot.id] = { el: btn, label, name, stars, units: [], added: null };
      }
      const btn = rec.el;
      btn.style.left = plot.x + 'px';
      btn.style.width = plot.w + 'px';
      btn.style.height = STREET + plot.h + 'px';

      const seed = PLOT_IDS.indexOf(plot.id) * 31;
      while (rec.units.length < plot.shown) {
        const i = rec.units.length;
        const unit = fromHTML(unitHTML(art, 'u-' + plot.id, '--d:' + (-rand(seed + i) * 6).toFixed(2) + 's'));
        btn.insertBefore(unit, rec.label);
        rec.units.push(unit);
        rec.added = unit;
      }
      while (rec.units.length > plot.shown) rec.units.pop().remove();
      rec.units.forEach((u, i) => (u.style.left = plot.ux + i * (art.w + UNIT_GAP) + 'px'));

      const ups = upgradesOf(plot.id);
      const count = setTiers(btn, ups, owned);
      const b = BY_ID[plot.id];
      let title;
      if (plot.kind === 'civic') title = CIVIC[plot.id].name;
      else title = b.name + ' ×' + RC.fmt(plot.total);
      rec.name.textContent = title;
      rec.stars.textContent = '★'.repeat(count) + '☆'.repeat(ups.length - count);
      btn.setAttribute('aria-label', title + '. ' + count + ' de ' + ups.length + ' melhorias. Ver detalhes');
    },

    syncClones(n, W, owned) {
      while (this.cloneEls.length < n) {
        const i = this.cloneEls.length;
        const span = Math.max(60, Math.min(W - 70, 120 + rand(i * 7 + 1) * 260));
        const start = 12 + rand(i * 7 + 2) * Math.max(0, W - span - 50);
        const speed = 18 + rand(i * 7 + 3) * 16;
        const lap = ((span * 2) / speed).toFixed(1);
        const lift = Math.round(rand(i * 7 + 4) * 9);
        const scale = (0.88 + rand(i * 7 + 5) * 0.2).toFixed(2);
        const clone = el('div', 'clone');
        clone.dataset.id = 'clone';
        clone.style.cssText =
          'left:' + start.toFixed(0) + 'px;bottom:' + lift + 'px;z-index:' + (20 - lift) +
          ';--dist:' + span.toFixed(0) + 'px;--t:' + lap + 's;--d:' + (-rand(i * 7 + 6) * lap).toFixed(1) + 's;--s:' + scale;
        clone.appendChild(fromHTML(unitHTML(ART.clone, 'u-clone', '--d:' + (-rand(i) * 2).toFixed(2) + 's')));
        clone.appendChild(fromHTML(unitHTML(ART.clone, 'u-clone mini', '--d:' + (-rand(i + 9) * 2).toFixed(2) + 's')));
        this.clonesBox.appendChild(clone);
        this.cloneEls.push(clone);
      }
      while (this.cloneEls.length > n) this.cloneEls.pop().remove();
      setTiers(this.clonesBox, upgradesOf('clone'), owned);
    },

    syncPlanets(n, W, owned) {
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
        p.style.top = (6 + rand(i + 90) * 30).toFixed(0) + 'px';
      });
      setTiers(this.planetsBox, upgradesOf('multiverso'), owned);
      const total = this.game.s.buildings.multiverso;
      this.planetBtn.hidden = total <= 0;
      this.planetBtn.textContent = 'Roubarversos: ' + RC.fmt(total) + '. Ver detalhes';
    },

    // Obras e decretos que mudam a cidade inteira.
    syncCity(L, W, owned) {
      const r = this.root;
      OBRAS.forEach((id, i) => r.classList.toggle('ob-' + (i + 1), owned.has(id)));
      r.classList.toggle('festa', owned.has('decreto-3'));
      r.classList.toggle('tudo-roubar', owned.has('multiverso-5'));

      // Postes e árvores nos caminhos entre os lotes.
      const gaps = [];
      if (L.plots.length) gaps.push(4);
      L.plots.forEach((p) => gaps.push(p.x + p.w));
      const key = gaps.join(',') + '|' + owned.has('obra-1') + owned.has('obra-2');
      if (key !== this.decoKey) {
        this.decoKey = key;
        let html = '';
        gaps.forEach((x, i) => {
          if (owned.has('obra-1')) html += '<div class="deco" style="left:' + (x + 6) + 'px">' + OBRA.lamp + '</div>';
          if (owned.has('obra-2') && i > 0) html += '<div class="deco" style="left:' + (x + 18) + 'px">' + OBRA.tree + '</div>';
        });
        this.decoBox.innerHTML = html;
      }
      this.bus.style.setProperty('--dist', W + 90 + 'px');
      this.bus.style.setProperty('--t', Math.max(12, (W + 90) / 70).toFixed(0) + 's');
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

    flash(node) {
      if (!node) return;
      node.classList.remove('flash');
      void node.offsetWidth;
      node.classList.add('flash');
      setTimeout(() => node.classList.remove('flash'), 1400);
    },

    scrollToPlot(id) {
      const plot = this.L.plots.find((p) => p.id === id);
      if (!plot) return;
      const left = Math.max(0, plot.x + plot.w / 2 - this.scroll.clientWidth / 2);
      this.scroll.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
    },

    // Depois de comprar uma construção: mostra a nova surgindo no lote dela.
    onBuy(id) {
      if (!this.root) return;
      Object.keys(this.plots).forEach((k) => (this.plots[k].added = null));
      this.render();
      if (id === 'multiverso') {
        const p = this.planetEls[this.planetEls.length - 1];
        if (p) this.pop(p.firstChild);
        return;
      }
      if (id === 'clone') {
        const c = this.cloneEls[this.cloneEls.length - 1];
        if (c) this.pop(c.firstChild);
      }
      const rec = this.plots[id];
      if (!rec) return;
      this.scrollToPlot(id);
      if (rec.added && id !== 'clone') this.pop(rec.added);
      else if (rec.label.animate && !reducedMotion()) {
        rec.label.animate([{ transform: 'translateX(-50%) scale(1.25)' }, { transform: 'translateX(-50%)' }], { duration: 300, easing: 'ease-out' });
      }
      rec.added = null;
    },

    // Depois de comprar uma melhoria: vai até o lote que mudou e faz brilhar.
    onUpgrade(upgradeId) {
      if (!this.root) return;
      this.render();
      const target = plotOf(upgradeId);
      if (!target) {
        this.flash(this.root);
        return;
      }
      if (target === 'multiverso') {
        this.flash(this.planetsBox);
        return;
      }
      if (target === 'clone') this.flash(this.clonesBox);
      const rec = this.plots[target];
      if (!rec) return;
      this.scrollToPlot(target);
      this.flash(rec.el);
    },

    /* ----- cartão de detalhes ----- */
    showCard(id, anchor) {
      const g = this.game;
      const card = this.card;
      card.textContent = '';
      const head = el('div', 'card-head');
      const close = el('button', 'card-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', 'Fechar');
      close.addEventListener('click', () => this.hideCard());

      const b = BY_ID[id];
      if (CIVIC[id]) {
        head.appendChild(el('strong', null, CIVIC[id].name));
        head.appendChild(close);
        card.appendChild(head);
        card.appendChild(el('p', 'card-desc', CIVIC[id].desc));
      } else if (b) {
        const owned = g.s.buildings[id];
        const unit = g.unitCps[id];
        const total = unit * owned;
        const share = g.baseCps > 0 ? (total / g.baseCps) * 100 : 0;
        const pct = share > 0 && share < 0.1 ? 'menos de 0,1' : share.toFixed(share < 10 ? 1 : 0).replace('.', ',');
        head.appendChild(el('strong', null, b.name));
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
      } else {
        return;
      }

      // Melhorias deste lote: compradas e a próxima.
      const ups = upgradesOf(id);
      const have = new Set(g.s.upgrades);
      const list = el('ul', 'card-ups');
      let next = null;
      ups.forEach((uid) => {
        const u = UP_BY_ID[uid];
        const got = have.has(uid);
        if (!got && !next) next = u;
        const li = el('li', got ? 'got' : '');
        li.appendChild(el('span', 'mark', got ? '✓' : '○'));
        li.appendChild(el('span', null, u.name));
        list.appendChild(li);
      });
      card.appendChild(el('p', 'card-sub', 'Melhorias: ' + ups.filter((u) => have.has(u)).length + ' de ' + ups.length));
      card.appendChild(list);
      if (next) card.appendChild(el('p', 'card-next', 'Próxima, ' + next.name + ': ' + next.look));

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
      return !!this.root && this.visible && Object.keys(this.plots).length > 0 && !document.hidden && Math.random() < HIDE_CHANCE;
    },

    adoptGolden(btn) {
      const view = Math.min(this.scroll.clientWidth, this.worldWidth());
      const x = this.scroll.scrollLeft + 16 + Math.random() * Math.max(0, view - 90);
      btn.classList.add('in-town');
      btn.style.left = x.toFixed(0) + 'px';
      btn.style.bottom = (STREET + Math.random() * 40).toFixed(0) + 'px';
      this.world.appendChild(btn);
    },
  };

  RC.Town = Town;
  if (typeof module !== 'undefined' && module.exports) module.exports = RC;
})(typeof window !== 'undefined' ? window : globalThis);
