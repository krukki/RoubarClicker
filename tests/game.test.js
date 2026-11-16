// Testes das regras do jogo. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/data.js');
const RC = require('../js/game.js');
const { BUILDINGS, UPGRADES, ACHIEVEMENTS } = RC.DATA;

// Jogo com relógio e sorte controlados pelo teste.
function makeGame(randomValue) {
  const clock = { t: new Date(2026, 0, 10, 15, 0, 0).getTime() };
  const game = new RC.Game({ now: () => clock.t, random: () => (randomValue == null ? 0.5 : randomValue) });
  const advance = (seconds, step) => {
    step = step || 1;
    for (let done = 0; done < seconds; done += step) {
      clock.t += step * 1000;
      game.tick();
    }
  };
  return { game, clock, advance };
}

test('formata números em português', () => {
  assert.equal(RC.fmt(0), '0');
  assert.equal(RC.fmt(0.1), '0,1');
  assert.equal(RC.fmt(1.01), '1,01');
  assert.equal(RC.fmt(1), '1');
  assert.equal(RC.fmt(19.96), '19,9');
  assert.equal(RC.fmt(150.7), '150');
  assert.equal(RC.fmtTime(60), '1 min');
  assert.equal(RC.fmtTime(7200), '2 h');
  assert.equal(RC.fmtTime(3725), '1 h 2 min');
  assert.equal(RC.fmt(15), '15');
  assert.equal(RC.fmt(1100), '1.100');
  assert.equal(RC.fmt(999999), '999.999');
  assert.equal(RC.fmt(1e6), '1 milhão');
  assert.equal(RC.fmt(1.5e6), '1,5 milhão');
  assert.equal(RC.fmt(2.5e6), '2,5 milhões');
  assert.equal(RC.fmt(1e9), '1 bilhão');
  assert.equal(RC.fmt(1.7e14), '170 trilhões');
  assert.equal(RC.fmt(1e15), '1 quatrilhão');
  assert.equal(RC.fmt(2.5e6, true), '2,500 milhões');
  assert.equal(RC.money(1234), 'R$ 1.234');
});

test('os dados não têm ids repetidos', () => {
  const unique = (list) => new Set(list.map((x) => x.id)).size === list.length;
  assert.ok(unique(BUILDINGS));
  assert.ok(unique(UPGRADES));
  assert.ok(unique(ACHIEVEMENTS));
  assert.equal(BUILDINGS.length, 13);
});

test('clicar rende dinheiro', () => {
  const { game } = makeGame();
  assert.equal(game.click(), 1);
  assert.equal(game.s.money, 1);
  assert.equal(game.s.clicks, 1);
  assert.ok(game.s.achievements.includes('clique-1'));
});

test('cada construção custa 15% a mais', () => {
  const { game } = makeGame();
  assert.equal(game.cost('dedo'), 15);
  game.s.money = 1000;
  assert.ok(game.buy('dedo'));
  assert.equal(game.s.money, 985);
  assert.equal(game.cost('dedo'), Math.ceil(15 * 1.15));
  // Comprar 10 de uma vez custa o mesmo que comprar 10 vezes seguidas.
  const bulk = game.cost('dedo', 10);
  let oneByOne = 0;
  for (let i = 0; i < 10; i++) oneByOne += 15 * Math.pow(1.15, 1 + i);
  assert.ok(Math.abs(bulk - oneByOne) <= 1);
});

test('não compra sem dinheiro', () => {
  const { game } = makeGame();
  game.s.money = 14;
  assert.equal(game.buy('dedo'), false);
  assert.equal(game.s.buildings.dedo, 0);
  assert.equal(game.s.money, 14);
});

test('construções produzem ao longo do tempo', () => {
  const { game, advance } = makeGame();
  game.s.money = 100;
  game.buy('clone');
  // R$ 1 por segundo, mais 1% por conquista já ganha.
  assert.ok(Math.abs(game.cps - (1 + 0.01 * game.s.achievements.length)) < 1e-9);
  advance(10);
  assert.ok(game.s.money > 9.9 && game.s.money < 10.5, 'esperava cerca de R$ 10, veio ' + game.s.money);
});

test('melhoria dobra a produção da construção', () => {
  const { game } = makeGame();
  game.s.money = 1e6;
  game.buy('clone');
  const before = game.cps;
  assert.ok(game.availableUpgrades().some((u) => u.id === 'clone-1'));
  assert.ok(game.buyUpgrade('clone-1'));
  assert.ok(Math.abs(game.cps - before * 2) < 1e-9);
  assert.equal(game.buyUpgrade('clone-1'), false, 'não compra duas vezes');
  assert.equal(game.buyUpgrade('clone-2'), false, 'não compra sem ter 10 clones');
});

test('conquistas dão 1% de produção cada', () => {
  const { game } = makeGame();
  game.s.money = 100;
  game.buy('clone');
  const count = game.s.achievements.length;
  assert.ok(Math.abs(game.globalMult - (1 + 0.01 * count)) < 1e-9);
  game.grant('batizado');
  assert.ok(Math.abs(game.globalMult - (1 + 0.01 * (count + 1))) < 1e-9);
  assert.ok(Math.abs(game.cps - game.globalMult) < 1e-9, 'um clone rende R$ 1 vezes o bônus');
  assert.equal(game.grant('batizado'), false, 'não repete conquista');
});

test('salvar e carregar devolve o mesmo jogo', () => {
  const a = makeGame();
  a.game.s.money = 5000;
  a.game.buy('dedo', 10);
  a.game.buy('clone');
  a.game.buyUpgrade('dedo-1');
  a.game.rename('Império do Zé ✨');
  const code = a.game.serialize();

  const b = makeGame();
  assert.ok(b.game.load(code));
  assert.equal(b.game.s.name, 'Império do Zé ✨');
  assert.equal(b.game.s.buildings.dedo, 10);
  assert.equal(b.game.s.buildings.clone, 1);
  assert.deepEqual(b.game.s.upgrades, ['dedo-1']);
  assert.equal(b.game.s.money, a.game.s.money);
  assert.ok(Math.abs(b.game.cps - a.game.cps) < 1e-9);
});

test('código inválido não mexe no jogo', () => {
  const { game } = makeGame();
  game.s.money = 42;
  assert.equal(game.load('isto não é um código'), false);
  assert.equal(game.load(''), false);
  assert.equal(game.load('{"money":"muito"}'), false);
  assert.equal(game.s.money, 42);
});

test('carregar ignora dados estranhos', () => {
  const { game } = makeGame();
  const ok = game.load(JSON.stringify({
    money: 10, clicks: -5, buildings: { dedo: 3.7, invasor: 99 }, upgrades: ['dedo-1', 'dedo-1', 'nao-existe'],
  }));
  assert.ok(ok);
  assert.equal(game.s.clicks, 0);
  assert.equal(game.s.buildings.dedo, 3);
  assert.equal(game.s.buildings.invasor, undefined);
  assert.deepEqual(game.s.upgrades, ['dedo-1']);
});

test('ganhos offline: metade da produção, no máximo 8 horas', () => {
  const a = makeGame();
  a.game.s.money = 100;
  a.game.buy('clone'); // cerca de R$ 1 por segundo
  const code = a.game.serialize();
  const perSecond = a.game.baseCps;

  const b = makeGame();
  b.clock.t = a.clock.t + 3600 * 1000; // 1 hora depois
  let report = null;
  b.game.on('offline', (o) => (report = o));
  b.game.load(code);
  assert.ok(report);
  assert.ok(Math.abs(report.gain - 3600 * 0.5 * perSecond) < 1e-6, 'esperava metade de 1 hora, veio ' + report.gain);

  const c = makeGame();
  c.clock.t = a.clock.t + 20 * 3600 * 1000; // 20 horas depois
  c.game.on('offline', (o) => (report = o));
  c.game.load(code);
  assert.ok(report.capped);
  assert.ok(Math.abs(report.gain - 8 * 3600 * 0.5 * perSecond) < 1e-6);
  assert.ok(c.game.s.achievements.includes('bom-filho'));
});

test('Roubar Dourado aparece, some e dá bônus', () => {
  const { game, advance } = makeGame(0.1); // sorte 0,1: Frenesi
  game.s.money = 100;
  game.buy('clone');
  let spawned = 0;
  game.on('golden', () => spawned++);
  advance(80);
  assert.equal(spawned, 1);
  const result = game.clickGolden();
  assert.equal(result.kind, 'frenzy');
  assert.ok(Math.abs(game.cps - game.baseCps * 7) < 1e-9);
  assert.equal(game.s.golden, 1);
  advance(61);
  assert.equal(game.cps, game.baseCps, 'o Frenesi acaba depois de 60 segundos');
  assert.equal(game.clickGolden(), null, 'sem Roubar Dourado na tela, nada acontece');
});

test('Roubar Dourado ignorado vai embora', () => {
  const { game, advance } = makeGame(0.1);
  let gone = 0;
  game.on('goldenGone', () => gone++);
  advance(90);
  assert.equal(gone, 1);
  assert.ok(game.s.achievements.includes('deixou-passar'));
});

test('renascer troca o progresso por Roubars de Ouro', () => {
  const { game } = makeGame();
  assert.equal(game.prestigeGain(), 0);
  assert.equal(game.ascend(), 0, 'sem Roubars de Ouro, não renasce');

  game.s.money = 5000;
  game.buy('dedo', 10);
  game.buyUpgrade('dedo-1');
  game.earn(8e9); // 8 bilhões no total: raiz cúbica de 8 = 2
  assert.equal(game.prestigeGain(), 2);
  const achievements = game.s.achievements.length;

  assert.equal(game.ascend(), 2);
  assert.equal(game.s.gold, 2);
  assert.equal(game.s.money, 0);
  assert.equal(game.s.buildings.dedo, 0);
  assert.deepEqual(game.s.upgrades, []);
  assert.ok(game.s.achievements.length >= achievements, 'conquistas ficam');
  assert.ok(game.s.earnedAll >= 8e9, 'o total de todas as partidas fica');
  assert.equal(game.prestigeGain(), 0);

  // Cada Roubar de Ouro vale +2%.
  const perAch = 1 + 0.01 * game.s.achievements.length;
  assert.ok(Math.abs(game.globalMult - perAch * 1.04) < 1e-9);
});

test('uma pausa longa da aba conta como tempo fora', () => {
  const { game, clock } = makeGame();
  game.s.money = 100;
  game.buy('clone');
  const before = game.s.money;
  const perSecond = game.baseCps;
  clock.t += 3600 * 1000;
  game.tick();
  assert.ok(Math.abs(game.s.money - before - 1800 * perSecond) < 1e-6);
});

test('construções aparecem na loja aos poucos', () => {
  const { game } = makeGame();
  assert.ok(game.isRevealed(0));
  assert.ok(game.isRevealed(1));
  assert.equal(game.isRevealed(2), false);
  game.earn(400);
  assert.ok(game.isRevealed(2));
});
