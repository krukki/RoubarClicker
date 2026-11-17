// Testes da cidade: lotes, melhorias visuais e dia/noite. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/data.js');
require('../js/game.js');
require('../js/town-art.js');
const RC = require('../js/town.js');
const { layout, phaseFor, upgradesOf, plotOf, CAP, CLONE_CAP, PLANET_CAP, PLOT_IDS, CIVIC } = RC.Town;
const { BUILDINGS, UPGRADES } = RC.DATA;

const CSS = require('node:fs').readFileSync(require('node:path').join(__dirname, '../css/style.css'), 'utf8');
const CSS_RULES = {
  'clone-4': '.town-clones.has-4 .clone .mini',
  'fabrica-3': '.plot-fabrica.has-3 .body',
  'multiverso-4': '.town-planets.has-4 .ring',
  'multiverso-5': '.town.tudo-roubar .skyface',
};

// Conta quantas partes "t1", "t2"... existem num desenho.
const tiersIn = (svg) => new Set((svg.match(/class="t(\d)"/g) || []).map((m) => Number(m.match(/\d/)[0])));

test('todo lote tem desenho', () => {
  PLOT_IDS.forEach((id) => {
    const art = RC.TOWN_ART[id === 'clone' ? 'dorm' : id];
    assert.ok(art && art.w > 0 && art.h > 0 && art.svg.length > 50, 'falta o desenho de ' + id);
  });
  assert.ok(RC.TOWN_ART.multiverso && RC.TOWN_ART.clone);
});

test('toda melhoria tem um efeito descrito na cidade', () => {
  UPGRADES.forEach((u) => {
    assert.equal(typeof u.look, 'string', u.id);
    assert.ok(u.look.length > 10, u.id);
  });
});

test('toda melhoria de construção tem uma peça no desenho', () => {
  BUILDINGS.forEach((b) => {
    const ups = upgradesOf(b.id);
    const art = RC.TOWN_ART[b.id];
    const tiers = tiersIn(art.svg);
    const art2 = b.id === 'clone' ? RC.TOWN_ART.clone : art;
    const tiers2 = tiersIn(art2.svg);
    ups.forEach((uid, i) => {
      // Sem peça nova no desenho, a mudança tem de estar no CSS (material, cor, miniclone, sol com rosto).
      if (tiers.has(i + 1) || tiers2.has(i + 1)) return;
      const rule = CSS_RULES[uid];
      assert.ok(rule, uid + ' não muda nada na cidade');
      assert.ok(CSS.includes(rule), uid + ': regra "' + rule + '" não está no CSS');
    });
    assert.ok(ups.length >= 5, b.id + ' tem ' + ups.length + ' melhorias');
  });
});

test('as melhorias cívicas mudam o lote delas e as obras mudam a cidade', () => {
  assert.equal(plotOf('clique-2'), 'praca');
  assert.equal(plotOf('fatia-5'), 'receita');
  assert.equal(plotOf('decreto-3'), 'palacio');
  assert.equal(plotOf('dourado-1'), 'fonte');
  assert.equal(plotOf('fazenda-4'), 'fazenda');
  assert.equal(plotOf('dedo-7'), 'dedo');
  assert.equal(plotOf('obra-5'), null);
  assert.equal(plotOf('farol'), 'memorial');
  assert.equal(layout({}, ['heranca']).plots[0].id, 'memorial', 'o Memorial aparece com o primeiro monumento');
  Object.keys(CIVIC).forEach((id) => {
    const tiers = tiersIn(RC.TOWN_ART[id].svg);
    CIVIC[id].ups.forEach((uid, i) => {
      assert.ok(UPGRADES.concat(RC.DATA.PERKS).some((u) => u.id === uid), uid + ' existe');
      if (id !== 'palacio' || i !== 2) assert.ok(tiers.has(i + 1) || i === 0, uid + ' tem peça no desenho');
    });
  });
});

test('o dedo tem 7 melhorias e há 8 obras', () => {
  assert.equal(upgradesOf('dedo').length, 7);
  assert.equal(UPGRADES.filter((u) => u.id.startsWith('obra-')).length, 8);
});

test('terreno vazio antes da primeira compra', () => {
  const L = layout({}, []);
  assert.deepEqual(L.plots, []);
  assert.equal(L.width, 0);
  assert.equal(L.clones, 0);
  assert.equal(L.planets, 0);
});

test('cada tipo tem o próprio lote, na ordem, sem encostar no vizinho', () => {
  const counts = {};
  BUILDINGS.forEach((b) => (counts[b.id] = 3));
  const L = layout(counts, []);
  assert.deepEqual(L.plots.map((p) => p.id), BUILDINGS.map((b) => b.id).filter((id) => id !== 'multiverso'));
  for (let i = 1; i < L.plots.length; i++) {
    const prev = L.plots[i - 1];
    assert.ok(L.plots[i].x >= prev.x + prev.w + 40, 'lote ' + L.plots[i].id + ' encosta no anterior');
  }
  const last = L.plots[L.plots.length - 1];
  assert.ok(L.width > last.x + last.w);
  // Unidades do mesmo lote não se sobrepõem.
  L.plots.forEach((p) => {
    const art = RC.TOWN_ART[p.id === 'clone' ? 'dorm' : p.id];
    assert.ok(p.ux >= 0 && p.ux * 2 + p.shown * art.w <= p.w + 0.001, p.id);
  });
});

test('no máximo 5 desenhos por lote; clones ganham um alojamento', () => {
  const L = layout({ fazenda: 37, clone: 40 }, []);
  const farm = L.plots.find((p) => p.id === 'fazenda');
  assert.equal(CAP, 5);
  assert.equal(farm.shown, 5);
  assert.equal(farm.total, 37);
  const dorm = L.plots.find((p) => p.id === 'clone');
  assert.equal(dorm.kind, 'dorm');
  assert.equal(dorm.shown, 1);
  assert.equal(L.clones, CLONE_CAP);
  assert.equal(layout({ fazenda: 6 }, []).width, layout({ fazenda: 600 }, []).width);
});

test('lotes cívicos aparecem com a primeira melhoria do grupo', () => {
  assert.equal(layout({}, ['clique-1']).plots[0].id, 'praca');
  assert.equal(layout({}, ['decreto-4']).plots[0].id, 'palacio');
  assert.equal(layout({}, ['obra-1']).plots.length, 0, 'obras não ocupam lote');
  const ids = layout({ dedo: 1 }, ['fatia-1', 'dourado-2', 'clique-3']).plots.map((p) => p.id);
  assert.deepEqual(ids, ['praca', 'receita', 'fonte', 'dedo']);
});

test('planetas têm limite e não ocupam lote', () => {
  const L = layout({ multiverso: 40 }, []);
  assert.equal(L.planets, PLANET_CAP);
  assert.deepEqual(L.plots, []);
});

test('hora do dia vira fase do céu', () => {
  assert.equal(phaseFor(0), 'night');
  assert.equal(phaseFor(5), 'dawn');
  assert.equal(phaseFor(7), 'day');
  assert.equal(phaseFor(12), 'day');
  assert.equal(phaseFor(17), 'dusk');
  assert.equal(phaseFor(19), 'night');
});

test('a conquista do Roubar Dourado escondido existe e é secreta', () => {
  const a = RC.DATA.ACHIEVEMENTS.find((x) => x.id === 'escondido');
  assert.ok(a && a.secret);
});
