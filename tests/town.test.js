// Testes da distribuição da cidade. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/data.js');
require('../js/game.js');
require('../js/town-art.js');
const RC = require('../js/town.js');
const { layout, phaseFor, CAP, CLONE_CAP, PLANET_CAP, LOT_IDS } = RC.Town;
const { BUILDINGS } = RC.DATA;

test('todo tipo de construção tem desenho', () => {
  BUILDINGS.forEach((b) => {
    const art = RC.TOWN_ART[b.id];
    assert.ok(art, 'falta o desenho de ' + b.id);
    assert.ok(art.w > 0 && art.h > 0, b.id);
    assert.equal(typeof art.svg, 'string');
    assert.ok(art.svg.length > 50, b.id);
  });
});

test('terreno vazio antes da primeira compra', () => {
  const L = layout({});
  assert.deepEqual(L.lots, []);
  assert.equal(L.width, 0);
  assert.equal(L.clones, 0);
  assert.equal(L.planets, 0);
});

test('construções em fila na ordem da loja, sem clones nem Roubarversos', () => {
  const counts = {};
  BUILDINGS.forEach((b) => (counts[b.id] = 1));
  const L = layout(counts);
  assert.deepEqual(L.lots.map((l) => l.id), LOT_IDS);
  assert.ok(!LOT_IDS.includes('clone'));
  assert.ok(!LOT_IDS.includes('multiverso'));
  assert.equal(LOT_IDS.length, BUILDINGS.length - 2);
});

test('grupos não se sobrepõem e a largura cobre todos', () => {
  const counts = { dedo: 3, fazenda: 20, banco: 1, maquina: 9 };
  const L = layout(counts);
  for (let i = 1; i < L.lots.length; i++) {
    const prev = L.lots[i - 1];
    assert.ok(L.lots[i].x > prev.x + prev.w, 'grupo ' + L.lots[i].id + ' encosta no anterior');
  }
  const last = L.lots[L.lots.length - 1];
  assert.ok(L.width > last.x + last.w);
});

test('no máximo 8 desenhos por tipo, com plaquinha do total', () => {
  const L = layout({ fazenda: 37, dedo: 8 });
  const farm = L.lots.find((l) => l.id === 'fazenda');
  assert.equal(CAP, 8);
  assert.equal(farm.shown, 8);
  assert.equal(farm.total, 37);
  assert.equal(farm.plaque, true);
  const dedo = L.lots.find((l) => l.id === 'dedo');
  assert.equal(dedo.shown, 8);
  assert.equal(dedo.plaque, false, 'com exatamente 8 não precisa de plaquinha');
  // A largura não cresce depois do limite.
  assert.equal(layout({ fazenda: 9 }).width, layout({ fazenda: 900 }).width);
});

test('clones e planetas têm limite', () => {
  const L = layout({ clone: 500, multiverso: 40 });
  assert.equal(L.clones, CLONE_CAP);
  assert.equal(L.planets, PLANET_CAP);
  assert.deepEqual(L.lots, [], 'clones e planetas não ocupam a fila');
  assert.equal(layout({ clone: 3 }).clones, 3);
});

test('hora do dia vira fase do céu', () => {
  assert.equal(phaseFor(0), 'night');
  assert.equal(phaseFor(4), 'night');
  assert.equal(phaseFor(5), 'dawn');
  assert.equal(phaseFor(7), 'day');
  assert.equal(phaseFor(12), 'day');
  assert.equal(phaseFor(17), 'dusk');
  assert.equal(phaseFor(19), 'night');
  assert.equal(phaseFor(23), 'night');
});

test('a conquista do Roubar Dourado escondido existe e é secreta', () => {
  const a = RC.DATA.ACHIEVEMENTS.find((x) => x.id === 'escondido');
  assert.ok(a);
  assert.equal(a.secret, true);
});
