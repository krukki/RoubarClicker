/*
 * Roubar Clicker: dados do jogo.
 * Todos os textos (nomes, descrições, piadas, notícias) ficam neste arquivo.
 * Para trocar uma piada, edite só aqui.
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});

  /* ---------- Construções ---------- */
  // upgrades: nomes das melhorias (ao ter 1, 10, 25, 50, 100, 150 e 200 unidades).
  // looks: o que cada melhoria muda na cidade.
  // feat: nome da conquista por ter 50 unidades.
  const BUILDINGS = [
    {
      id: 'dedo', name: 'Dedo Nervoso', plural: 'Dedos Nervosos', icon: '👆',
      baseCost: 15, baseCps: 0.1,
      desc: 'Clica na cara do Roubar sem pedir licença.',
      upgrades: ['Unha cortada', 'Dedo indicador reserva', 'Calo profissional', 'Dedo biônico', 'Mão inteira', 'Anel de formatura', 'Dedo de diamante'],
      looks: ['as unhas dos dedos ficam douradas e brilham.', 'cada pedestal ganha um segundo dedo apertando junto.', 'os dedos ganham curativo e o pedestal vira tijolo.', 'os dedos viram metal com rebites e apertam mais rápido.', 'aparece a mão inteira em cima do dedo e o botão vira ouro.', 'cada dedo ganha um anel com pedra vermelha.', 'os dedos viram cristal e soltam brilhos.'],
      feat: 'Mão cheia',
    },
    {
      id: 'clone', name: 'Clone do Roubar', plural: 'Clones do Roubar', icon: '👥',
      baseCost: 100, baseCps: 1,
      desc: 'Idêntico ao original. Ninguém sabe mais qual é qual.',
      upgrades: ['Crachá de identificação', 'Clone com café', 'Clone que acorda cedo', 'Clone do clone', 'Sindicato dos clones'],
      looks: ['os clones andam com crachá no peito.', 'os clones carregam um copinho de café fumegante.', 'os clones usam boné vermelho e andam mais rápido.', 'cada clone anda com um miniclone atrás.', 'os clones marcham com plaquinhas de protesto.'],
      feat: 'Crise de identidade',
    },
    {
      id: 'fazenda', name: 'Fazenda de Roubars', plural: 'Fazendas de Roubars', icon: '🌾',
      baseCost: 1100, baseCps: 8,
      desc: 'Roubars plantados, regados e colhidos na safra.',
      upgrades: ['Adubo de primeira', 'Espantalho de Roubar', 'Irrigação automática', 'Safra recorde', 'Roubar transgênico'],
      looks: ['a plantação cresce mais alta e mais cheia.', 'cada fazenda ganha um espantalho com a cara dele.', 'um irrigador molha a plantação.', 'o celeiro fica vermelho e aparecem fardos de feno.', 'nascem girassóis gigantes com o rosto do Roubar.'],
      feat: 'Agro é Roubar',
    },
    {
      id: 'fabrica', name: 'Fábrica de Roubars', plural: 'Fábricas de Roubars', icon: '🏭',
      baseCost: 12000, baseCps: 47,
      desc: 'Linha de montagem em três turnos.',
      upgrades: ['Esteira mais rápida', 'Controle de qualidade', 'Turno da madrugada', 'Robôs na linha', 'Fábrica que fabrica fábricas'],
      looks: ['uma esteira com caixas passa na frente da fábrica.', 'a fábrica ganha o selo verde de qualidade.', 'as janelas ficam acesas o tempo todo e o prédio vira tijolo.', 'um braço robótico trabalha no telhado.', 'surge uma segunda chaminé soltando fumaça dourada.'],
      feat: 'Revolução industrial',
    },
    {
      id: 'escola', name: 'Escola de Roubars', plural: 'Escolas de Roubars', icon: '🏫',
      baseCost: 130000, baseCps: 260,
      desc: 'Forma Roubars com diploma e tudo.',
      upgrades: ['Merenda reforçada', 'Aula de reforço', 'Professor substituto', 'Formatura antecipada', 'Doutorado em Roubar'],
      looks: ['uma maçã gigante aparece na fachada.', 'um quadro-negro fica na porta da escola.', 'um clone professor de óculos espera na porta.', 'capelos de formatura voam do telhado.', 'a escola vira universidade de mármore com cúpula dourada.'],
      feat: 'Pátria educadora',
    },
    {
      id: 'banco', name: 'Banco Roubar', plural: 'Bancos Roubar', icon: '🏦',
      baseCost: 1.4e6, baseCps: 1400,
      desc: 'O nome assusta, mas é só o nome do dono.',
      upgrades: ['Cofre maior', 'Juros compostos', 'Cartão Roubar Platinum', 'Agência em cada esquina', 'Banco Central do Roubar'],
      looks: ['um cofre redondo aparece atrás das colunas.', 'pilhas de moedas crescem na escadaria.', 'cada banco ganha um caixa eletrônico.', 'o banco vira mármore e ganha bandeiras.', 'o frontão vira ouro maciço.'],
      feat: 'Grande demais para quebrar',
    },
    {
      id: 'laboratorio', name: 'Laboratório de Clonagem', plural: 'Laboratórios de Clonagem', icon: '🧬',
      baseCost: 2e7, baseCps: 7800,
      desc: 'Ciência séria a serviço de mais Roubars.',
      upgrades: ['Jaleco limpo', 'Microscópio novo', 'Tubo de ensaio gigante', 'DNA aprimorado', 'Prêmio Nobel de Roubar'],
      looks: ['um jaleco branco fica pendurado na parede.', 'a cúpula ganha um telescópio dourado.', 'aparece uma estante de tubos de ensaio coloridos.', 'uma hélice de DNA gira em cima do laboratório.', 'o líquido do frasco vira ouro e a fachada ganha medalha.'],
      feat: 'Ovelha Dolly quem?',
    },
    {
      id: 'templo', name: 'Templo do Roubar', plural: 'Templos do Roubar', icon: '🛕',
      baseCost: 3.3e8, baseCps: 44000,
      desc: 'Os fiéis clicam de joelhos.',
      upgrades: ['Velas aromáticas', 'Coral afinado', 'Vitral com o rosto dele', 'Peregrinação anual', 'Milagre comprovado'],
      looks: ['velas acesas tremulam na escadaria.', 'notas musicais flutuam saindo do templo.', 'um vitral colorido com o rosto dele aparece na fachada.', 'peregrinos sobem a escadaria.', 'o templo flutua e a cúpula vira ouro.'],
      feat: 'Fé inabalável',
    },
    {
      id: 'cidade', name: 'Roubarópolis', plural: 'Roubarópolis', icon: '🏙️',
      baseCost: 5.1e9, baseCps: 260000,
      desc: 'Uma cidade inteira onde todo mundo é o Roubar.',
      upgrades: ['Asfalto novo', 'Metrô de Roubarópolis', 'Prefeito Roubar', 'Arranha-céu em forma de rosto', 'Capital federal'],
      looks: ['carrinhos passam na frente dos prédios.', 'aparece a entrada do metrô.', 'a bandeira do prefeito tremula no alto do prédio.', 'nasce um prédio redondo com a cara dele.', 'o prédio mais alto vira vidro com coroa dourada.'],
      feat: 'Êxodo urbano',
    },
    {
      id: 'foguete', name: 'Foguete Roubar', plural: 'Foguetes Roubar', icon: '🚀',
      baseCost: 7.5e10, baseCps: 1.6e6,
      desc: 'Leva Roubars para onde nenhum Roubar jamais esteve.',
      upgrades: ['Combustível premium', 'Traje espacial sob medida', 'Base na Lua', 'Colônia em Marte', 'Frota interestelar'],
      looks: ['aparece um tanque de combustível e o foguete decola mais vezes.', 'o Roubar na janela ganha capacete de astronauta.', 'uma lua com bandeira aparece sobre a base.', 'Marte com uma cúpula aparece no céu da base.', 'o foguete vira ouro e ganha um foguetinho reserva.'],
      feat: 'Houston, temos um Roubar',
    },
    {
      id: 'portal', name: 'Portal Interdimensional', plural: 'Portais Interdimensionais', icon: '🌀',
      baseCost: 1e12, baseCps: 1e7,
      desc: 'Traz Roubars de dimensões onde ele deu ainda mais certo.',
      upgrades: ['Portal lubrificado', 'Alfândega dimensional', 'Dimensão espelhada', 'Portal dentro do portal', 'Dimensão só de Roubars'],
      looks: ['o redemoinho gira mais rápido e aparece uma lata de óleo.', 'uma cancela de alfândega controla a entrada.', 'o portal fica roxo e espelhado.', 'um anel dourado gira dentro do portal.', 'rostos do Roubar saem do portal.'],
      feat: 'Vizinhos de dimensão',
    },
    {
      id: 'maquina', name: 'Máquina do Tempo', plural: 'Máquinas do Tempo', icon: '⏳',
      baseCost: 1.4e13, baseCps: 6.5e7,
      desc: 'Busca Roubars de ontem para trabalhar hoje.',
      upgrades: ['Relógio acertado', 'Roubar do passado', 'Roubar do futuro', 'Paradoxo resolvido', 'Linha do tempo privatizada'],
      looks: ['o relógio ganha aro de ouro e um pêndulo.', 'o Roubar em sépia aparece na janela.', 'uma tela neon mostra o Roubar do futuro.', 'símbolos do infinito brilham ao lado do relógio.', 'a máquina vira ouro e solta ondas de tempo.'],
      feat: 'De volta para o Roubar',
    },
    {
      id: 'multiverso', name: 'Roubarverso', plural: 'Roubarversos', icon: '🌌',
      baseCost: 1.7e14, baseCps: 4.3e8,
      desc: 'Todos os universos, todos com a cara dele.',
      upgrades: ['Mapa do multiverso', 'Universo de bolso', 'Big Bang sob encomenda', 'Realidade alternativa VIP', 'Tudo é Roubar'],
      looks: ['os planetas ganham órbitas tracejadas.', 'luazinhas giram em volta de cada planeta.', 'estrelas piscam em volta dos planetas.', 'os anéis dos planetas viram ouro.', 'o sol e a lua ganham o rosto do Roubar.'],
      feat: 'Em todo lugar ao mesmo tempo',
    },
  ];

  /* ---------- Melhorias ---------- */
  const TIER_COUNTS = [1, 10, 25, 50, 100, 150, 200];
  const TIER_COST_MULT = [10, 50, 500, 5e4, 5e6, 5e8, 5e10];
  const UPGRADES = [];

  BUILDINGS.forEach((b) => {
    b.upgrades.forEach((name, i) => {
      UPGRADES.push({
        id: b.id + '-' + (i + 1),
        name,
        icon: b.icon,
        desc: b.plural + ' rendem o dobro.',
        look: b.looks[i],
        cost: b.baseCost * TIER_COST_MULT[i],
        effect: { type: 'building', building: b.id, mult: 2 },
        req: { type: 'building', building: b.id, n: TIER_COUNTS[i] },
      });
    });
  });

  // Clique em dobro (liberadas pelo total de cliques).
  [
    ['Dedo aquecido', 50, 500],
    ['Clique duplo', 500, 25e3],
    ['Luva de clicar', 2500, 2.5e6],
    ['Tendinite controlada', 10000, 2.5e8],
    ['Dedo de campeão', 50000, 2.5e10],
  ].forEach(([name, clicks, cost], i) => {
    UPGRADES.push({
      id: 'clique-' + (i + 1), name, icon: '🖱️',
      desc: 'Cada clique rende o dobro.',
      cost,
      effect: { type: 'click', mult: 2 },
      req: { type: 'clicks', n: clicks },
    });
  });

  // Clique ganha uma fatia da produção (liberadas pelo dinheiro ganho na partida).
  [
    ['Imposto sobre o clique', 5e4, 1e5],
    ['Taxa de conveniência', 5e6, 1e7],
    ['Pedágio no dedo', 5e8, 1e9],
    ['Tributo ao rosto', 5e10, 1e11],
    ['Reforma tributária', 5e12, 1e13],
  ].forEach(([name, earned, cost], i) => {
    UPGRADES.push({
      id: 'fatia-' + (i + 1), name, icon: '🧾',
      desc: 'Cada clique rende mais 1% da produção por segundo.',
      cost,
      effect: { type: 'clickCps', pct: 0.01 },
      req: { type: 'earned', n: earned },
    });
  });

  // Produção geral.
  [
    ['Decreto nº 1', 10, 1e5, 5e5],
    ['Hino nacional do Roubar', 10, 1e7, 5e7],
    ['Feriado do Roubar', 15, 1e9, 5e9],
    ['Constituição do Roubar', 15, 1e11, 5e11],
    ['Roubar na nota de R$ 200', 20, 1e13, 5e13],
    ['Estátua do Roubar no Planalto', 25, 1e15, 5e15],
  ].forEach(([name, pct, earned, cost], i) => {
    UPGRADES.push({
      id: 'decreto-' + (i + 1), name, icon: '📜',
      desc: 'Toda a produção rende ' + pct + '% a mais.',
      cost,
      effect: { type: 'global', mult: 1 + pct / 100 },
      req: { type: 'earned', n: earned },
    });
  });

  // Roubar Dourado.
  UPGRADES.push(
    {
      id: 'dourado-1', name: 'Trevo de quatro Roubars', icon: '🍀',
      desc: 'O Roubar Dourado aparece duas vezes mais.',
      cost: 777777,
      effect: { type: 'goldenFreq', mult: 0.5 },
      req: { type: 'golden', n: 3 },
    },
    {
      id: 'dourado-2', name: 'Ímã de sorte', icon: '🧲',
      desc: 'O Roubar Dourado fica na tela o dobro do tempo.',
      cost: 7.77e7,
      effect: { type: 'goldenStay', mult: 2 },
      req: { type: 'golden', n: 7 },
    },
    {
      id: 'dourado-3', name: 'Ouro que não acaba', icon: '⏱️',
      desc: 'Os bônus do Roubar Dourado duram o dobro.',
      cost: 7.77e10,
      effect: { type: 'goldenBuff', mult: 2 },
      req: { type: 'golden', n: 27 },
    }
  );

  // Obras da República: melhorias que mudam a cidade inteira.
  [
    ['Postes de luz', '💡', 'Toda a produção rende 5% a mais.', { type: 'global', mult: 1.05 }, { type: 'totalBuildings', n: 15 }, 2e4,
      'postes iluminam a rua e acendem à noite.'],
    ['Árvores na calçada', '🌳', 'Toda a produção rende 5% a mais.', { type: 'global', mult: 1.05 }, { type: 'totalBuildings', n: 40 }, 3e5,
      'árvores crescem entre os lotes.'],
    ['Ônibus dos Clones', '🚌', 'Clones do Roubar rendem o dobro.', { type: 'building', building: 'clone', mult: 2 }, { type: 'building', building: 'clone', n: 25 }, 2e5,
      'um ônibus cheio de clones passa pela rua.'],
    ['Calçadão de pedra portuguesa', '🌊', 'Toda a produção rende 5% a mais.', { type: 'global', mult: 1.05 }, { type: 'totalBuildings', n: 80 }, 4e6,
      'a rua vira um calçadão com ondas pretas e brancas.'],
    ['Dirigível do Roubar', '🎈', 'Toda a produção rende 10% a mais.', { type: 'global', mult: 1.1 }, { type: 'earned', n: 1e9 }, 5e9,
      'um dirigível com o rosto dele cruza o céu.'],
    ['Fogos de artifício', '🎆', 'Toda a produção rende 10% a mais.', { type: 'global', mult: 1.1 }, { type: 'earned', n: 1e11 }, 5e11,
      'fogos estouram no céu (mais bonitos à noite).'],
    ['Bondinho do Pão de Roubar', '🚡', 'Toda a produção rende 15% a mais.', { type: 'global', mult: 1.15 }, { type: 'earned', n: 1e13 }, 5e13,
      'um bondinho com o rosto dele atravessa o céu.'],
    ['Carnaval da República', '🎉', 'Toda a produção rende 20% a mais.', { type: 'global', mult: 1.2 }, { type: 'earned', n: 1e15 }, 5e15,
      'confetes caem do céu e os clones dançam.'],
  ].forEach(([name, icon, desc, effect, req, cost, look], i) => {
    UPGRADES.push({ id: 'obra-' + (i + 1), name, icon, desc, look, cost, effect, req });
  });

  // O que as outras melhorias mudam na cidade.
  const LOOKS = {
    'clique-1': 'aparece a Praça do Clique, com um dedo gigante soltando calor.',
    'clique-2': 'um segundo dedo gigante chega à praça.',
    'clique-3': 'os dedos gigantes ganham luvas brancas.',
    'clique-4': 'os dedos gigantes ganham faixa e bolsa de gelo.',
    'clique-5': 'a praça vira um pódio com troféu dourado.',
    'fatia-1': 'abre a Receita do Roubar, uma cabine de impostos.',
    'fatia-2': 'a cabine ganha uma caixa registradora.',
    'fatia-3': 'uma cancela de pedágio sobe e desce na frente da Receita.',
    'fatia-4': 'um baú de moedas com o rosto dele fica na frente.',
    'fatia-5': 'a cabine vira um ministério com colunas.',
    'decreto-1': 'nasce o Palácio da República, com bandeira.',
    'decreto-2': 'alto-falantes tocam o hino no palácio.',
    'decreto-3': 'a cidade inteira ganha bandeirinhas de festa.',
    'decreto-4': 'um livro gigante da Constituição fica na frente do palácio.',
    'decreto-5': 'um outdoor com a nota de R$ 200 dele aparece no palácio.',
    'decreto-6': 'uma estátua gigante do Roubar de braços abertos surge atrás do palácio.',
    'dourado-1': 'nasce a Fonte da Sorte, cercada de trevos.',
    'dourado-2': 'um ímã gigante fica em cima da fonte.',
    'dourado-3': 'a fonte jorra moedas de ouro.',
  };
  UPGRADES.forEach((u) => {
    if (!u.look && LOOKS[u.id]) u.look = LOOKS[u.id];
  });

  /* ---------- Conquistas ---------- */
  // cond.type: earnedAll, clicks, handMade, cps, building, eachBuilding,
  // totalBuildings, golden, ascensions, gold, upgrades, playtime, special.
  const ACHIEVEMENTS = [];
  const ach = (id, name, desc, icon, cond, secret) =>
    ACHIEVEMENTS.push({ id, name, desc, icon, cond, secret: !!secret });

  [
    [1, 'Primeiro centavo', 'Ganhe R$ 1.'],
    [1e3, 'Mil é pouco', 'Ganhe R$ 1 mil no total.'],
    [1e6, 'Primeiro milhão', 'Ganhe R$ 1 milhão no total.'],
    [1e9, 'Bilionário', 'Ganhe R$ 1 bilhão no total.'],
    [1e12, 'PIB de país pequeno', 'Ganhe R$ 1 trilhão no total.'],
    [1e15, 'Dono do Tesouro', 'Ganhe R$ 1 quatrilhão no total.'],
    [1e18, 'Dinheiro perdeu o sentido', 'Ganhe R$ 1 quintilhão no total.'],
    [1e21, 'Inflação é com você', 'Ganhe R$ 1 sextilhão no total.'],
  ].forEach(([n, name, desc], i) => ach('ganho-' + (i + 1), name, desc, '💰', { type: 'earnedAll', n }));

  [
    [1, 'Encostou', 'Clique no Roubar pela primeira vez.'],
    [100, 'Cem na cara', 'Clique 100 vezes.'],
    [1000, 'Mil na cara', 'Clique 1.000 vezes.'],
    [10000, 'Dedo calejado', 'Clique 10.000 vezes.'],
    [100000, 'A cara aguenta', 'Clique 100.000 vezes.'],
  ].forEach(([n, name, desc], i) => ach('clique-' + (i + 1), name, desc, '👆', { type: 'clicks', n }));

  ach('manual-1', 'Trabalho manual', 'Ganhe R$ 1 milhão só clicando.', '✋', { type: 'handMade', n: 1e6 });
  ach('manual-2', 'Artesão do clique', 'Ganhe R$ 1 bilhão só clicando.', '✋', { type: 'handMade', n: 1e9 });

  [
    [1, 'Renda passiva', 'Produza R$ 1 por segundo.'],
    [100, 'Bico', 'Produza R$ 100 por segundo.'],
    [1500, 'Salário mínimo por segundo', 'Produza R$ 1.500 por segundo.'],
    [1e6, 'Milhão por segundo', 'Produza R$ 1 milhão por segundo.'],
    [1e9, 'Máquina de imprimir dinheiro', 'Produza R$ 1 bilhão por segundo.'],
    [1e12, 'Economia fora de controle', 'Produza R$ 1 trilhão por segundo.'],
  ].forEach(([n, name, desc], i) => ach('producao-' + (i + 1), name, desc, '📈', { type: 'cps', n }));

  BUILDINGS.forEach((b) =>
    ach('tem-' + b.id, b.feat, 'Tenha 50 unidades de ' + b.name + '.', b.icon, { type: 'building', building: b.id, n: 50 })
  );

  [
    [10, 'Começo de governo', 'Tenha 10 construções.'],
    [100, 'Estado inchado', 'Tenha 100 construções.'],
    [500, 'Máquina pública', 'Tenha 500 construções.'],
    [1000, 'Burocracia infinita', 'Tenha 1.000 construções.'],
  ].forEach(([n, name, desc], i) => ach('obras-' + (i + 1), name, desc, '🏗️', { type: 'totalBuildings', n }));

  ach('colecao', 'Coleção completa', 'Tenha pelo menos uma construção de cada tipo.', '🗂️', { type: 'eachBuilding', n: 1 });
  ach('centenario', 'Tudo em dobro e mais um pouco', 'Tenha 100 unidades de cada construção.', '💯', { type: 'eachBuilding', n: 100 });
  ach('atacado', 'Atacadista', 'Compre 100 construções de uma vez.', '📦', { type: 'special' });

  [
    [1, 'Sorte de principiante', 'Clique em 1 Roubar Dourado.'],
    [7, 'Pé-quente', 'Clique em 7 Roubars Dourados.'],
    [27, 'Caçador de ouro', 'Clique em 27 Roubars Dourados.'],
    [77, 'Midas', 'Clique em 77 Roubars Dourados.'],
  ].forEach(([n, name, desc], i) => ach('dourado-' + (i + 1), name, desc, '🌟', { type: 'golden', n }));

  ach('renascer-1', 'Renascido', 'Renasça pela primeira vez.', '🔥', { type: 'ascensions', n: 1 });
  ach('renascer-2', 'Fênix', 'Renasça 5 vezes.', '🔥', { type: 'ascensions', n: 5 });
  ach('ouro-100', 'Reserva de ouro', 'Acumule 100 Roubars de Ouro.', '🥇', { type: 'gold', n: 100 });

  ach('melhorias-1', 'Reformista', 'Compre 10 melhorias.', '🛠️', { type: 'upgrades', n: 10 });
  ach('melhorias-2', 'Plano de governo cumprido', 'Compre 40 melhorias.', '🛠️', { type: 'upgrades', n: 40 });
  ach('melhorias-3', 'Nada mais a melhorar', 'Compre todas as melhorias.', '🛠️', { type: 'upgrades', n: UPGRADES.length });

  ach('tempo-1', 'Uma horinha só', 'Jogue por 1 hora no total.', '🕐', { type: 'playtime', n: 3600 });
  ach('tempo-2', 'Um dia inteiro', 'Jogue por 24 horas no total.', '🕛', { type: 'playtime', n: 86400 });

  ach('batizado', 'Com nome e sobrenome', 'Dê um nome ao seu império.', '✍️', { type: 'special' });
  ach('metralhadora', 'Metralhadora', 'Clique 12 vezes em um segundo.', '⚡', { type: 'special' }, true);
  ach('coruja', 'Coruja', 'Jogue entre 2h e 5h da manhã.', '🦉', { type: 'special' }, true);
  ach('deixou-passar', 'Deixou passar', 'Deixe um Roubar Dourado ir embora.', '💨', { type: 'special' }, true);
  ach('bom-filho', 'Bom filho à casa torna', 'Volte depois de 8 horas fora.', '🏠', { type: 'special' }, true);
  ach('trinca', 'Trinca', 'Receba os três bônus do Roubar Dourado.', '🎰', { type: 'special' }, true);
  ach('escondido', 'Esconde-esconde', 'Ache um Roubar Dourado escondido na cidade.', '🙈', { type: 'special' }, true);

  /* ---------- Notícias ---------- */
  // req (opcional): mesma forma das condições acima.
  const NEWS = [
    { text: 'Diário Oficial: fica instituída a República do Roubar. Revogam-se as disposições em contrário.' },
    { text: 'Banco Central confirma: a moeda oficial agora tem a cara do Roubar.' },
    { text: 'Roubar declara que não sente nada quando clicam na cara dele. Médicos discordam.' },
    { text: 'Pesquisa aponta que 9 em cada 10 cidadãos já clicaram no Roubar hoje. O décimo é o Roubar.' },
    { text: 'Previsão do tempo: sol, com pancadas de clique à tarde.' },
    { text: 'Ministério da Fazenda avisa: clicar no Roubar não é crime, é dever cívico.' },
    { text: 'Cidadão clica no Roubar pela primeira vez e relata "sensação de riqueza".', req: { type: 'clicks', n: 1 } },
    { text: 'Dedos Nervosos entram em greve por melhores condições. Voltam a clicar dois segundos depois.', req: { type: 'building', building: 'dedo', n: 1 } },
    { text: 'Clone do Roubar é confundido com o original e recebe o salário dele.', req: { type: 'building', building: 'clone', n: 1 } },
    { text: 'Reunião de clones termina sem acordo: todos concordaram com tudo.', req: { type: 'building', building: 'clone', n: 10 } },
    { text: 'Safra de Roubars bate recorde. Produtores comemoram, vizinhos reclamam do barulho.', req: { type: 'building', building: 'fazenda', n: 1 } },
    { text: 'Fábrica de Roubars anuncia recall: lote saiu sério demais.', req: { type: 'building', building: 'fabrica', n: 1 } },
    { text: 'Escola de Roubars registra 100% de aprovação. A prova era clicar.', req: { type: 'building', building: 'escola', n: 1 } },
    { text: 'Banco Roubar lança campanha: "Seu dinheiro em boas mãos, apesar do nome".', req: { type: 'building', building: 'banco', n: 1 } },
    { text: 'Laboratório garante que o último clone não tem defeitos novos, só os de sempre.', req: { type: 'building', building: 'laboratorio', n: 1 } },
    { text: 'Templo do Roubar recebe romaria. Fiéis pedem mais cliques por segundo.', req: { type: 'building', building: 'templo', n: 1 } },
    { text: 'Roubarópolis elege prefeito. O candidato único, Roubar, venceu no segundo turno.', req: { type: 'building', building: 'cidade', n: 1 } },
    { text: 'Foguete Roubar pousa em Marte. Marcianos já estão clicando.', req: { type: 'building', building: 'foguete', n: 1 } },
    { text: 'Portal abre para dimensão onde o Roubar clica em você. Autoridades fecham às pressas.', req: { type: 'building', building: 'portal', n: 1 } },
    { text: 'Roubar do futuro volta para avisar: "comprem mais Máquinas do Tempo".', req: { type: 'building', building: 'maquina', n: 1 } },
    { text: 'Cientistas confirmam: em todos os universos conhecidos, alguém está clicando no Roubar.', req: { type: 'building', building: 'multiverso', n: 1 } },
    { text: 'PIB da República do Roubar passa de R$ 1 milhão. Economistas não sabem explicar.', req: { type: 'earnedAll', n: 1e6 } },
    { text: 'Revista elege o Roubar "rosto mais valioso do país" pelo terceiro ano seguido.', req: { type: 'earnedAll', n: 1e9 } },
    { text: 'República do Roubar compra a dívida externa de três países só para ter o que fazer.', req: { type: 'earnedAll', n: 1e12 } },
    { text: 'Faltam números: Casa da Moeda pede novos nomes para as quantias do Tesouro.', req: { type: 'earnedAll', n: 1e15 } },
    { text: 'Avistado Roubar Dourado no céu da capital. Especialistas recomendam clicar rápido.', req: { type: 'golden', n: 1 } },
    { text: 'Garimpeiros abandonam o ouro e passam a procurar Roubars Dourados.', req: { type: 'golden', n: 7 } },
    { text: 'República renasce das cinzas. Roubar jura que desta vez vai ser diferente.', req: { type: 'ascensions', n: 1 } },
    { text: 'Historiadores divergem sobre quantas vezes a República já recomeçou.', req: { type: 'ascensions', n: 3 } },
    { text: 'Fisioterapeutas alertam para surto de dedo cansado na população.', req: { type: 'clicks', n: 1000 } },
    { text: 'Produção nacional passa de R$ 1.000 por segundo. Ninguém mais lembra como era trabalhar.', req: { type: 'cps', n: 1000 } },
    { text: 'Museu Nacional inaugura ala de conquistas. A fila dá a volta no quarteirão.', req: { type: 'achievements', n: 10 } },
    { text: 'Clones do Roubar são vistos passeando pela cidade. Ninguém sabe para onde eles vão.', req: { type: 'building', building: 'clone', n: 3 } },
    { text: 'Moradores relatam um rosto dourado espiando entre os prédios. A prefeitura pede calma.', req: { type: 'golden', n: 3 } },
  ];

  /* ---------- Efeitos do Roubar Dourado ---------- */
  const GOLDEN = {
    frenzy: { name: 'Frenesi', desc: 'Produção x7', mult: 7, seconds: 60, chance: 0.48 },
    lucky: { name: 'Sortudo', chance: 0.42 },
    finger: { name: 'Dedo de Ouro', desc: 'Clique x777', mult: 777, seconds: 13, chance: 0.10 },
  };

  RC.DATA = { BUILDINGS, UPGRADES, ACHIEVEMENTS, NEWS, GOLDEN, TIER_COUNTS };
})(typeof window !== 'undefined' ? window : globalThis);
