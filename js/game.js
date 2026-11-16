/*
 * Roubar Clicker: regras do jogo (sem nada de tela).
 * Custos, produção, salvar/carregar, Roubar Dourado, renascer e ganhos offline.
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const { BUILDINGS, UPGRADES, ACHIEVEMENTS, GOLDEN } = RC.DATA;

  const SAVE_VERSION = 1;
  const COST_GROWTH = 1.15;
  const ACH_BONUS = 0.01; // +1% de produção por conquista
  const GOLD_BONUS = 0.02; // +2% de produção por Roubar de Ouro
  const GOLD_UNIT = 1e9; // dinheiro total para o primeiro Roubar de Ouro
  const OFFLINE_RATE = 0.5;
  const OFFLINE_CAP = 8 * 3600; // segundos
  const OFFLINE_MIN = 60; // segundos fora para contar como offline
  const GAP_AS_OFFLINE = 300; // um salto maior que isso num tick vira offline
  const GOLDEN_MIN = 60;
  const GOLDEN_RANGE = 90;
  const GOLDEN_STAY = 12;
  const DEFAULT_NAME = 'República do Roubar';

  const BY_ID = {};
  BUILDINGS.forEach((b) => (BY_ID[b.id] = b));
  const UP_BY_ID = {};
  UPGRADES.forEach((u) => (UP_BY_ID[u.id] = u));
  const ACH_BY_ID = {};
  ACHIEVEMENTS.forEach((a) => (ACH_BY_ID[a.id] = a));

  /* ---------- Números ---------- */
  const SCALES = [
    ['milhão', 'milhões'], ['bilhão', 'bilhões'], ['trilhão', 'trilhões'],
    ['quatrilhão', 'quatrilhões'], ['quintilhão', 'quintilhões'], ['sextilhão', 'sextilhões'],
    ['septilhão', 'septilhões'], ['octilhão', 'octilhões'], ['nonilhão', 'nonilhões'],
    ['decilhão', 'decilhões'],
  ];

  function groupThousands(intStr) {
    return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // 1234.5 -> "1.234" | 0.1 -> "0,1" | 2500000 -> "2,5 milhões"
  // fixed: mantém 3 casas nas quantias grandes (o contador não fica pulando).
  function fmt(n, fixed) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n, fixed);
    if (n < 1e6) {
      // Quantias pequenas mostram centavos (0,1 por segundo; 1,01 por clique).
      const places = n < 10 ? 2 : n < 100 ? 1 : 0;
      const scale = Math.pow(10, places);
      const parts = (Math.floor(n * scale + 1e-9) / scale).toFixed(places).split('.');
      const cents = (parts[1] || '').replace(/0+$/, '');
      return groupThousands(parts[0]) + (cents ? ',' + cents : '');
    }
    let idx = Math.floor(Math.log10(n) / 3) - 2;
    let v = n / Math.pow(10, (idx + 2) * 3);
    if (v >= 1000) { idx++; v /= 1000; }
    if (v < 1) { idx--; v *= 1000; }
    if (idx >= SCALES.length) return n.toExponential(2).replace('.', ',').replace('e+', ' × 10^');
    v = Math.floor(v * 1000 + 1e-6) / 1000;
    let s = v.toFixed(3);
    if (!fixed) s = s.replace(/\.?0+$/, '');
    const parts = s.split('.');
    s = groupThousands(parts[0]) + (parts[1] ? ',' + parts[1] : '');
    return s + ' ' + SCALES[idx][v >= 2 ? 1 : 0];
  }

  const money = (n, fixed) => 'R$ ' + fmt(n, fixed);

  function fmtTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return d + ' d' + (h ? ' ' + h + ' h' : '');
    if (h > 0) return h + ' h' + (m ? ' ' + m + ' min' : '');
    if (m > 0) return m + ' min' + (s ? ' ' + s + ' s' : '');
    return s + ' s';
  }

  /* ---------- Código de salvamento ---------- */
  function encode(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function decode(code) {
    const bin = atob(code);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const num = (v, fallback) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : fallback);

  function defaultState(now) {
    const buildings = {};
    BUILDINGS.forEach((b) => (buildings[b.id] = 0));
    return {
      version: SAVE_VERSION,
      name: DEFAULT_NAME,
      money: 0,
      earned: 0, // ganho nesta partida
      earnedAll: 0, // ganho em todas as partidas
      handMade: 0, // ganho só com cliques (todas as partidas)
      clicks: 0,
      buildings,
      upgrades: [],
      achievements: [],
      golden: 0, // Roubars Dourados clicados
      goldenKinds: [], // bônus já recebidos
      gold: 0, // Roubars de Ouro (prestígio)
      ascensions: 0,
      playtime: 0, // segundos
      startedAt: now,
      runStartedAt: now,
      lastSaved: now,
      settings: { sound: true, fx: true, buyAmount: 1 },
    };
  }

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.now = opts.now || (() => Date.now());
      this.random = opts.random || Math.random;
      this.listeners = {};
      this.reset();
    }

    /* ----- eventos ----- */
    on(event, fn) {
      (this.listeners[event] = this.listeners[event] || []).push(fn);
    }

    emit(event, payload) {
      (this.listeners[event] || []).forEach((fn) => fn(payload));
    }

    /* ----- estado ----- */
    reset() {
      const now = this.now();
      this.s = defaultState(now);
      this.buffs = [];
      this.goldenSpawn = null;
      this.clickTimes = [];
      this.lastTick = now;
      this.achTimer = 0;
      this.recompute();
      this.scheduleGolden();
    }

    has(upgradeId) {
      return this.s.upgrades.indexOf(upgradeId) !== -1;
    }

    totalBuildings() {
      let t = 0;
      BUILDINGS.forEach((b) => (t += this.s.buildings[b.id]));
      return t;
    }

    /* ----- produção ----- */
    recompute() {
      const s = this.s;
      const bMult = {};
      BUILDINGS.forEach((b) => (bMult[b.id] = 1));
      let global = 1;
      let clickMult = 1;
      let clickPct = 0;
      this.goldenFreq = 1;
      this.goldenStay = 1;
      this.goldenBuff = 1;

      s.upgrades.forEach((id) => {
        const e = UP_BY_ID[id] && UP_BY_ID[id].effect;
        if (!e) return;
        if (e.type === 'building') bMult[e.building] *= e.mult;
        else if (e.type === 'global') global *= e.mult;
        else if (e.type === 'click') clickMult *= e.mult;
        else if (e.type === 'clickCps') clickPct += e.pct;
        else if (e.type === 'goldenFreq') this.goldenFreq *= e.mult;
        else if (e.type === 'goldenStay') this.goldenStay *= e.mult;
        else if (e.type === 'goldenBuff') this.goldenBuff *= e.mult;
      });

      global *= 1 + ACH_BONUS * s.achievements.length;
      global *= 1 + GOLD_BONUS * s.gold;

      let cpsBuff = 1;
      let clickBuff = 1;
      this.buffs.forEach((b) => {
        if (b.kind === 'cps') cpsBuff *= b.mult;
        else clickBuff *= b.mult;
      });

      this.unitCps = {};
      let base = 0;
      BUILDINGS.forEach((b) => {
        this.unitCps[b.id] = b.baseCps * bMult[b.id] * global;
        base += this.unitCps[b.id] * s.buildings[b.id];
      });

      this.globalMult = global;
      this.baseCps = base; // sem bônus temporários
      this.cps = base * cpsBuff;
      this.clickValue = (clickMult * global + clickPct * this.cps) * clickBuff;
    }

    earn(amount) {
      this.s.money += amount;
      this.s.earned += amount;
      this.s.earnedAll += amount;
    }

    /* ----- clique ----- */
    click() {
      const s = this.s;
      const value = this.clickValue;
      this.earn(value);
      s.handMade += value;
      s.clicks++;

      const now = this.now();
      this.clickTimes.push(now);
      while (this.clickTimes.length && now - this.clickTimes[0] > 1000) this.clickTimes.shift();
      if (this.clickTimes.length >= 12) this.grant('metralhadora');
      if (s.clicks === 1 || s.clicks === 100 || s.clicks % 1000 === 0) this.checkAchievements();
      return value;
    }

    /* ----- construções ----- */
    cost(id, amount) {
      amount = amount || 1;
      const b = BY_ID[id];
      const owned = this.s.buildings[id];
      const total = b.baseCost * Math.pow(COST_GROWTH, owned) * (Math.pow(COST_GROWTH, amount) - 1) / (COST_GROWTH - 1);
      return Math.ceil(total - 1e-9);
    }

    buy(id, amount) {
      amount = amount || 1;
      if (!BY_ID[id]) return false;
      const price = this.cost(id, amount);
      if (this.s.money < price) return false;
      this.s.money -= price;
      this.s.buildings[id] += amount;
      if (amount >= 100) this.grant('atacado');
      this.recompute();
      this.checkAchievements();
      this.emit('change');
      return true;
    }

    // Uma construção aparece na loja quando o jogador chega perto de poder pagar.
    isRevealed(index) {
      const b = BUILDINGS[index];
      return index < 2 || this.s.buildings[b.id] > 0 || this.s.earned >= b.baseCost * 0.3;
    }

    /* ----- melhorias ----- */
    reqMet(req) {
      const s = this.s;
      switch (req.type) {
        case 'building': return s.buildings[req.building] >= req.n;
        case 'clicks': return s.clicks >= req.n;
        case 'earned': return s.earned >= req.n;
        case 'earnedAll': return s.earnedAll >= req.n;
        case 'handMade': return s.handMade >= req.n;
        case 'cps': return this.baseCps >= req.n;
        case 'golden': return s.golden >= req.n;
        case 'ascensions': return s.ascensions >= req.n;
        case 'gold': return s.gold >= req.n;
        case 'upgrades': return s.upgrades.length >= req.n;
        case 'achievements': return s.achievements.length >= req.n;
        case 'playtime': return s.playtime >= req.n;
        case 'totalBuildings': return this.totalBuildings() >= req.n;
        case 'eachBuilding': return BUILDINGS.every((b) => s.buildings[b.id] >= req.n);
        default: return false;
      }
    }

    availableUpgrades() {
      return UPGRADES
        .filter((u) => !this.has(u.id) && this.reqMet(u.req))
        .sort((a, b) => a.cost - b.cost);
    }

    buyUpgrade(id) {
      const u = UP_BY_ID[id];
      if (!u || this.has(id) || !this.reqMet(u.req) || this.s.money < u.cost) return false;
      this.s.money -= u.cost;
      this.s.upgrades.push(id);
      this.recompute();
      this.checkAchievements();
      this.emit('change');
      return true;
    }

    /* ----- conquistas ----- */
    grant(id) {
      if (!ACH_BY_ID[id] || this.s.achievements.indexOf(id) !== -1) return false;
      this.s.achievements.push(id);
      this.recompute();
      this.emit('achievement', ACH_BY_ID[id]);
      return true;
    }

    checkAchievements() {
      ACHIEVEMENTS.forEach((a) => {
        if (a.cond.type !== 'special' && this.s.achievements.indexOf(a.id) === -1 && this.reqMet(a.cond)) {
          this.grant(a.id);
        }
      });
    }

    rename(name) {
      name = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 32);
      if (!name) return false;
      this.s.name = name;
      if (name !== DEFAULT_NAME) this.grant('batizado');
      this.emit('change');
      return true;
    }

    /* ----- Roubar Dourado ----- */
    scheduleGolden() {
      const wait = (GOLDEN_MIN + this.random() * GOLDEN_RANGE) * this.goldenFreq;
      this.nextGoldenAt = this.now() + wait * 1000;
    }

    addBuff(id, kind, def) {
      const seconds = def.seconds * this.goldenBuff;
      this.buffs = this.buffs.filter((b) => b.id !== id);
      this.buffs.push({ id, kind, name: def.name, desc: def.desc, mult: def.mult, seconds, until: this.now() + seconds * 1000 });
      this.recompute();
    }

    clickGolden() {
      if (!this.goldenSpawn) return null;
      this.goldenSpawn = null;
      this.scheduleGolden();
      const s = this.s;
      s.golden++;

      const roll = this.random();
      let kind;
      if (roll < GOLDEN.frenzy.chance) kind = 'frenzy';
      else if (roll < GOLDEN.frenzy.chance + GOLDEN.lucky.chance) kind = 'lucky';
      else kind = 'finger';

      const result = { kind, name: GOLDEN[kind].name };
      if (kind === 'frenzy') {
        this.addBuff('frenzy', 'cps', GOLDEN.frenzy);
        result.text = 'Produção x7 por ' + fmtTime(GOLDEN.frenzy.seconds * this.goldenBuff);
      } else if (kind === 'finger') {
        this.addBuff('finger', 'click', GOLDEN.finger);
        result.text = 'Clique x777 por ' + fmtTime(GOLDEN.finger.seconds * this.goldenBuff);
      } else {
        const gain = Math.min(s.money * 0.15, this.baseCps * 900) + 13;
        this.earn(gain);
        result.gain = gain;
        result.text = 'Você ganhou ' + money(gain);
      }

      if (s.goldenKinds.indexOf(kind) === -1) s.goldenKinds.push(kind);
      if (s.goldenKinds.length >= 3) this.grant('trinca');
      this.checkAchievements();
      this.emit('goldenClicked', result);
      this.emit('change');
      return result;
    }

    /* ----- renascer ----- */
    goldFor(earnedAll) {
      return Math.floor(Math.cbrt(earnedAll / GOLD_UNIT) + 1e-9);
    }

    prestigeGain() {
      return Math.max(0, this.goldFor(this.s.earnedAll) - this.s.gold);
    }

    // Quanto falta ganhar para o próximo Roubar de Ouro.
    nextGoldAt() {
      const next = Math.max(this.goldFor(this.s.earnedAll), this.s.gold) + 1;
      return Math.pow(next, 3) * GOLD_UNIT;
    }

    ascend() {
      const gain = this.prestigeGain();
      if (gain <= 0) return 0;
      const s = this.s;
      const now = this.now();
      s.gold += gain;
      s.ascensions++;
      s.money = 0;
      s.earned = 0;
      BUILDINGS.forEach((b) => (s.buildings[b.id] = 0));
      s.upgrades = [];
      s.runStartedAt = now;
      this.buffs = [];
      this.goldenSpawn = null;
      this.recompute();
      this.scheduleGolden();
      this.checkAchievements();
      this.emit('ascend', { gain });
      this.emit('change');
      return gain;
    }

    /* ----- tempo ----- */
    applyOffline(seconds) {
      const counted = Math.min(seconds, OFFLINE_CAP);
      const gain = this.baseCps * counted * OFFLINE_RATE;
      if (seconds >= OFFLINE_CAP) this.grant('bom-filho');
      if (gain > 0) {
        this.earn(gain);
        this.emit('offline', { seconds, counted, gain, capped: seconds > OFFLINE_CAP });
      }
      return gain;
    }

    tick() {
      const now = this.now();
      let dt = (now - this.lastTick) / 1000;
      this.lastTick = now;
      if (dt <= 0) return;

      const s = this.s;
      if (dt > GAP_AS_OFFLINE) {
        // A aba ficou parada (celular bloqueado, computador dormindo).
        this.buffs = [];
        this.recompute();
        this.applyOffline(dt);
        this.goldenSpawn = null;
        this.scheduleGolden();
        this.emit('goldenGone', { missed: false });
        this.checkAchievements();
        return;
      }

      s.playtime += dt;

      // Bônus que acabaram no meio do intervalo rendem só até acabarem.
      const expired = this.buffs.filter((b) => b.until <= now);
      if (expired.length) {
        const cut = Math.max(0, Math.min(dt, (Math.min.apply(null, expired.map((b) => b.until)) - (now - dt * 1000)) / 1000));
        this.earn(this.cps * cut);
        this.buffs = this.buffs.filter((b) => b.until > now);
        this.recompute();
        this.earn(this.cps * (dt - cut));
        this.emit('change');
      } else {
        this.earn(this.cps * dt);
      }

      if (!this.goldenSpawn && now >= this.nextGoldenAt) {
        this.goldenSpawn = {
          x: this.random(),
          y: this.random(),
          until: now + GOLDEN_STAY * this.goldenStay * 1000,
        };
        this.emit('golden', this.goldenSpawn);
      } else if (this.goldenSpawn && now >= this.goldenSpawn.until) {
        this.goldenSpawn = null;
        this.scheduleGolden();
        this.grant('deixou-passar');
        this.emit('goldenGone', { missed: true });
      }

      this.achTimer += dt;
      if (this.achTimer >= 1) {
        this.achTimer = 0;
        const hour = new Date(now).getHours();
        if (hour >= 2 && hour < 5) this.grant('coruja');
        this.checkAchievements();
      }
    }

    /* ----- salvar e carregar ----- */
    serialize() {
      this.s.lastSaved = this.now();
      return encode(JSON.stringify(this.s));
    }

    // Aceita o código exportado. Devolve false (sem mexer no jogo) se for inválido.
    load(code) {
      let data;
      try {
        const text = String(code).trim();
        data = JSON.parse(text.charAt(0) === '{' ? text : decode(text));
      } catch (e) {
        return false;
      }
      if (!data || typeof data !== 'object' || typeof data.money !== 'number') return false;

      const now = this.now();
      const s = defaultState(now);
      ['money', 'earned', 'earnedAll', 'handMade', 'clicks', 'golden', 'gold', 'ascensions', 'playtime', 'startedAt', 'runStartedAt', 'lastSaved']
        .forEach((k) => (s[k] = num(data[k], s[k])));
      ['clicks', 'golden', 'gold', 'ascensions'].forEach((k) => (s[k] = Math.floor(s[k])));
      s.earnedAll = Math.max(s.earnedAll, s.earned);
      if (typeof data.name === 'string' && data.name.trim()) s.name = data.name.trim().slice(0, 32);
      if (data.buildings && typeof data.buildings === 'object') {
        BUILDINGS.forEach((b) => (s.buildings[b.id] = Math.floor(num(data.buildings[b.id], 0))));
      }
      const uniq = (list, table) =>
        Array.isArray(list) ? list.filter((id, i) => table[id] && list.indexOf(id) === i) : [];
      s.upgrades = uniq(data.upgrades, UP_BY_ID);
      s.achievements = uniq(data.achievements, ACH_BY_ID);
      s.goldenKinds = uniq(data.goldenKinds, GOLDEN);
      if (data.settings && typeof data.settings === 'object') {
        s.settings.sound = data.settings.sound !== false;
        s.settings.fx = data.settings.fx !== false;
        s.settings.buyAmount = [1, 10, 100].indexOf(data.settings.buyAmount) !== -1 ? data.settings.buyAmount : 1;
      }

      this.s = s;
      this.buffs = [];
      this.goldenSpawn = null;
      this.clickTimes = [];
      this.lastTick = now;
      this.recompute();
      this.scheduleGolden();

      const away = (now - s.lastSaved) / 1000;
      if (away >= OFFLINE_MIN) this.applyOffline(away);
      this.checkAchievements();
      this.emit('change');
      return true;
    }
  }

  RC.Game = Game;
  RC.fmt = fmt;
  RC.money = money;
  RC.fmtTime = fmtTime;
  RC.CONST = { ACH_BONUS, GOLD_BONUS, GOLD_UNIT, OFFLINE_RATE, OFFLINE_CAP, DEFAULT_NAME };

  if (typeof module !== 'undefined' && module.exports) module.exports = RC;
})(typeof window !== 'undefined' ? window : globalThis);
