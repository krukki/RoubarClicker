// Testes da Loja de Ouro e dos acontecimentos da cidade. Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/data.js');
const RC = require('../js/game.js');
const { PERKS, EVENTS } = RC.DATA;

function makeGame(randomValue, gate) {
  const clock = { t: new Date(2026, 0, 10, 15, 0, 0).getTime() };
  const game = new RC.Game({
    now: () => clock.t,
    random: () => (randomValue == null ? 0.5 : randomValue),
    eventGate: gate,
  });
  const advance = (seconds) => {
    for (let done = 0; done < seconds; done++) {
      clock.t += 1000;
      game.tick();
    }
  };
  return { game, clock, advance };
}

const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * 1e-9), (msg || '') + ' esperava ' + b + ', veio ' + a);

/* ---------- Loja de Ouro ---------- */

test('a loja gasta de um saldo à parte e o bônus de ouro não diminui', () => {
  const { game } = makeGame();
  game.s.gold = 10;
  game.recompute();
  const bonus = game.globalMult;
  assert.equal(game.goldAvailable(), 10);
  assert.ok(game.buyPerk('estimacao')); // custa 3
  assert.equal(game.goldAvailable(), 7);
  assert.equal(game.s.gold, 10);
  assert.ok(game.globalMult >= bonus, 'o bônus de produção não cai ao gastar');
  assert.equal(game.buyPerk('estimacao'), false, 'não compra duas vezes');
  assert.equal(game.buyPerk('obelisco'), false, 'não compra sem saldo');
  assert.equal(game.buyPerk('nao-existe'), false);
  assert.equal(game.goldAvailable(), 7);
});

test('Herança e Dedos de estimação valem na compra e a cada renascimento', () => {
  const { game } = makeGame();
  game.s.gold = 4;
  assert.ok(game.buyPerk('heranca'));
  assert.equal(game.s.money, 10000);
  assert.ok(game.buyPerk('estimacao'));
  assert.equal(game.s.buildings.dedo, 10);
  assert.equal(game.s.buildings.clone, 5);

  game.earn(1e12); // 10 Roubars de Ouro no total: há ouro novo para renascer
  assert.ok(game.ascend() > 0);
  assert.equal(game.s.money, 10000);
  assert.equal(game.s.buildings.dedo, 10);
  assert.equal(game.s.buildings.clone, 5);
  assert.deepEqual(game.s.perks, ['heranca', 'estimacao'], 'monumentos ficam ao renascer');
  assert.ok(game.cps > 0, 'a partida nova já começa produzindo');
});

test('Chafariz dá +10% e Dedo de platina dobra o clique', () => {
  const { game } = makeGame();
  game.s.gold = 15;
  game.recompute();
  const mult = game.globalMult;
  const click = game.clickValue;
  game.buyPerk('chafariz');
  const ach = (n) => 1 + 0.01 * n;
  // A compra também dá a conquista do primeiro monumento (+1%).
  near(game.globalMult / ach(game.s.achievements.length), (mult / ach(0)) * 1.1);
  game.buyPerk('platina');
  near(game.clickValue / game.globalMult, (click / mult) * 2);
});

test('Desconto de fundador barateia as construções em 10%', () => {
  const { game } = makeGame();
  game.s.gold = 40;
  const before = game.cost('fazenda', 10);
  game.buyPerk('fundador');
  assert.ok(Math.abs(game.cost('fazenda', 10) - before * 0.9) <= 1);
  assert.equal(game.cost('dedo'), Math.ceil(15 * 0.9));
});

test('Farol da madrugada faz o tempo fora render no ritmo inteiro', () => {
  const a = makeGame();
  a.game.s.gold = 15;
  a.game.buyPerk('farol');
  a.game.s.money = 100;
  a.game.buy('clone');
  const perSecond = a.game.baseCps;
  const code = a.game.serialize();
  const b = makeGame();
  b.clock.t = a.clock.t + 3600 * 1000;
  let report = null;
  b.game.on('offline', (o) => (report = o));
  b.game.load(code);
  assert.ok(report.full);
  near(report.gain, 3600 * perSecond);
});

test('Trevo eterno adianta o Roubar Dourado e o Obelisco cresce a cada renascimento', () => {
  const { game } = makeGame();
  game.s.gold = 200;
  game.recompute();
  const freq = game.goldenFreq;
  game.buyPerk('trevo');
  near(game.goldenFreq, freq / 1.3);

  // Compara sem o bônus das conquistas, que também muda durante a compra.
  const noAch = () => game.globalMult / (1 + 0.01 * game.s.achievements.length);
  game.s.ascensions = 5;
  game.recompute();
  const before = noAch();
  game.buyPerk('obelisco');
  near(noAch(), before * 1.1, 'cinco renascimentos = +10%:');
  game.s.ascensions = 500;
  game.recompute();
  const capped = game.globalMult;
  game.s.ascensions = 50;
  game.recompute();
  near(capped, game.globalMult, 'o bônus para em +100%:');
});

test('monumentos são salvos e o saldo é recalculado ao carregar', () => {
  const a = makeGame();
  a.game.s.gold = 20;
  a.game.buyPerk('heranca');
  a.game.buyPerk('chafariz');
  const b = makeGame();
  assert.ok(b.game.load(a.game.serialize()));
  assert.deepEqual(b.game.s.perks, ['heranca', 'chafariz']);
  assert.equal(b.game.goldAvailable(), 14);
  assert.equal(b.game.s.money, a.game.s.money, 'carregar não dá a Herança de novo');

  // Um arquivo mexido não cria ouro: o gasto vem dos monumentos, não do arquivo.
  const c = makeGame();
  c.game.load(JSON.stringify({ money: 0, gold: 2, goldSpent: -999, perks: ['obelisco', 'obelisco', 'falso'] }));
  assert.deepEqual(c.game.s.perks, ['obelisco']);
  assert.equal(c.game.goldAvailable(), 0);

  // Um save antigo, sem esses campos, carrega normalmente.
  const d = makeGame();
  assert.ok(d.game.load(JSON.stringify({ money: 5, gold: 3 })));
  assert.deepEqual(d.game.s.perks, []);
  assert.equal(d.game.goldAvailable(), 3);
  assert.equal(d.game.s.events, 0);
});

test('todos os monumentos dão a conquista do Memorial completo', () => {
  const { game } = makeGame();
  game.s.gold = 1000;
  PERKS.forEach((p) => assert.ok(game.buyPerk(p.id), p.id));
  assert.ok(game.s.achievements.includes('monumento-1'));
  assert.ok(game.s.achievements.includes('monumento-2'));
  assert.equal(game.goldAvailable(), 1000 - 174);
});

/* ---------- Acontecimentos da cidade ---------- */

function withProduction(randomValue, gate) {
  const g = makeGame(randomValue, gate);
  g.game.s.money = 1e7;
  g.game.buy('clone', 10);
  g.game.buy('fazenda', 5);
  return g;
}

test('acontecimentos começam sozinhos, só com a cidade à vista e com construções', () => {
  const empty = makeGame(0.1);
  let started = 0;
  empty.game.on('eventStart', () => started++);
  empty.advance(200);
  assert.equal(started, 0, 'cidade vazia não tem acontecimento');

  let visible = false;
  const g = withProduction(0.1, () => visible);
  g.game.on('eventStart', () => started++);
  g.advance(200);
  assert.equal(started, 0, 'cidade fora da tela não tem acontecimento');
  visible = true;
  g.advance(10);
  assert.equal(started, 1);
  assert.equal(g.game.townEvent.type, 'ladrao');
});

test('pegar o ladrão devolve a sacola; deixar fugir custa pouco', () => {
  const g = withProduction();
  const game = g.game;
  game.startEvent('ladrao');
  const before = game.s.money;
  const perSecond = game.baseCps; // o prêmio usa a produção de antes das conquistas novas
  const result = game.resolveEvent();
  assert.equal(result.type, 'ladrao');
  assert.ok(result.done);
  near(game.s.money - before, perSecond * 180 + 15);
  near(result.gain, perSecond * 180 + 15);
  assert.equal(game.townEvent, null);
  assert.equal(game.s.events, 1);
  assert.ok(game.s.achievements.includes('xerife'));
  assert.equal(game.resolveEvent(), null, 'sem acontecimento, nada acontece');

  // Fuga: perde 1 minuto de produção...
  game.startEvent('ladrao');
  let gone = null;
  game.on('eventGone', (e) => (gone = e));
  const money = game.s.money;
  g.advance(15);
  assert.ok(gone && gone.missed);
  near(gone.loss, game.baseCps * 60);
  assert.ok(game.s.money < money + game.cps * 15);

  // ...mas nunca mais que 2% do dinheiro em caixa.
  game.s.money = 100;
  game.startEvent('ladrao');
  game.expireEvent(false);
  near(gone.loss, 2);
  near(game.s.money, 98);
});

test('disco voador e desfile dão bônus temporários que acabam', () => {
  const g = withProduction();
  const game = g.game;
  game.startEvent('ovni');
  game.resolveEvent();
  near(game.cps, game.baseCps * 2);
  assert.ok(game.s.achievements.includes('contato'));
  g.clock.t += 31000;
  game.tick();
  near(game.cps, game.baseCps);

  game.townEvent = null;
  game.startEvent('desfile');
  const click = game.clickValue;
  game.resolveEvent();
  near(game.clickValue, click * 5);
});

test('chuva e Roubar original pagam em produção', () => {
  const { game } = withProduction();
  game.startEvent('chuva');
  let before = game.s.money;
  let perSecond = game.baseCps;
  game.resolveEvent();
  near(game.s.money - before, perSecond * 120 + 10);

  game.startEvent('original');
  before = game.s.money;
  perSecond = game.baseCps;
  game.resolveEvent();
  near(game.s.money - before, perSecond * 900 + 100);
  assert.ok(game.s.achievements.includes('autografo'));
});

test('carro-forte tem cinco moedas e conta como um acontecimento', () => {
  const { game } = withProduction();
  game.startEvent('carro');
  let total = 0;
  for (let i = 0; i < 4; i++) {
    const expected = game.baseCps * 30 + 5;
    const r = game.resolveEvent();
    assert.equal(r.done, false);
    near(r.gain, expected);
    total += r.gain;
  }
  assert.ok(game.townEvent, 'ainda falta uma moeda');
  const before = game.s.money;
  const last = game.resolveEvent();
  assert.equal(last.done, true);
  near(game.s.money - before, last.gain);
  assert.ok(total > 0);
  assert.equal(game.s.events, 1);
  assert.equal(game.townEvent, null);

  // Moedas não recolhidas somem sem custo.
  game.startEvent('carro');
  game.resolveEvent();
  const money = game.s.money;
  game.expireEvent(false);
  assert.equal(game.s.money, money);
});

test('só acontece o que a cidade comporta', () => {
  const { game } = makeGame();
  game.s.money = 100;
  game.buy('dedo'); // sem clones nem fazendas
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    game.random = () => i / 200;
    seen.add(game.pickEvent());
  }
  assert.ok(!seen.has('ovni') && !seen.has('chuva'));
  assert.ok(seen.has('ladrao') && seen.has('desfile') && seen.has('carro') && seen.has('original'));
  assert.equal(EVENTS.length, 6);
});

test('renascer e pausas longas encerram o acontecimento sem roubo', () => {
  const g = withProduction();
  const game = g.game;
  game.startEvent('ladrao');
  const money = game.s.money;
  g.clock.t += 3600 * 1000; // a aba ficou parada uma hora
  game.tick();
  assert.equal(game.townEvent, null);
  assert.ok(game.s.money >= money, 'o ladrão não rouba com a aba parada');
});
