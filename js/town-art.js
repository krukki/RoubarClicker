/*
 * Roubar Clicker: desenhos da cidade (SVG em traço de gravura de cédula).
 *
 * Cada desenho tem largura (w) e altura (h); o chão fica na base (y = h).
 * Partes que dependem de melhorias:
 *   <g class="t3"> aparece quando a 3ª melhoria daquele lote foi comprada;
 *   <g class="x3"> some quando a 3ª melhoria foi comprada (é substituída).
 * Materiais (madeira, tijolo, mármore, ouro...) mudam pelo CSS nas peças com
 * classes como "body", "finger", "pedi".
 * Outras classes: n = sem preenchimento | g = ouro | gs = traço de ouro |
 * r = vermelho | w = janela (acende à noite) | k = tinta | a-* = animação.
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const FACE = 'assets/roubar-face.webp';

  const T = (n, s) => '<g class="t' + n + '">' + s + '</g>';
  const X = (n, s) => '<g class="x' + n + '">' + s + '</g>';

  // Rosto do Roubar recortado em círculo, com contorno.
  const face = (x, y, s, cls) =>
    '<image' + (cls ? ' class="' + cls + '"' : '') + ' href="' + FACE + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s +
    '" clip-path="url(#tw-round)" preserveAspectRatio="xMidYMid slice"/>' +
    '<circle class="n" cx="' + (x + s / 2) + '" cy="' + (y + s / 2) + '" r="' + s / 2 + '"/>';

  // Grade de janelas; algumas piscam.
  function windows(x0, y0, cols, rows, w, h, gx, gy, seed) {
    let s = '';
    let k = seed || 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        k++;
        const blink = (k * 7 + r * 3) % 5 === 0;
        s += '<rect class="w' + (blink ? ' a-blink' : '') + '" style="--i:' + (k % 6) + '" x="' + (x0 + c * gx) +
          '" y="' + (y0 + r * gy) + '" width="' + w + '" height="' + h + '"/>';
      }
    }
    return s;
  }

  function spiral(cx, cy, r0, r1, turns, phase) {
    const pts = [];
    const n = 70;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = phase + t * turns * Math.PI * 2;
      const r = r0 + (r1 - r0) * t;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return 'M' + pts.join(' L');
  }

  function rays(cx, cy, r0, r1, count) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      d += 'M' + (cx + Math.cos(a) * r0).toFixed(1) + ' ' + (cy + Math.sin(a) * r0).toFixed(1) +
        'L' + (cx + Math.cos(a) * r1).toFixed(1) + ' ' + (cy + Math.sin(a) * r1).toFixed(1);
    }
    return d;
  }

  // Trigo: hastes com espiga dourada.
  const wheat = (xs, top) =>
    xs.map((x) => '<path class="n" d="M' + x + ' 72V' + (top + 3) + '"/><ellipse class="g" cx="' + x + '" cy="' + top + '" rx="1.8" ry="4"/>').join('');

  // Brilho de quatro pontas.
  const sparkle = (x, y, s, i) =>
    '<path class="n gs a-twinkle" style="--i:' + (i || 0) + '" d="M' + x + ' ' + (y - s) + 'V' + (y + s) + 'M' + (x - s) + ' ' + y + 'H' + (x + s) + '" stroke-width="1.4"/>';

  // Pilha de moedas.
  function coins(x, yBase, n) {
    let s = '';
    for (let i = 0; i < n; i++) s += '<rect class="g" x="' + x + '" y="' + (yBase - (i + 1) * 2.4) + '" width="8" height="2.4" rx="1"/>';
    return s;
  }

  // Nota musical.
  const note = (x, y, i) =>
    '<g class="a-note" style="--i:' + i + '"><path class="n" d="M' + (x + 3) + ' ' + y + 'V' + (y - 8) + 'l4 1.5" stroke-width="1.2"/>' +
    '<ellipse class="k" cx="' + (x + 1.6) + '" cy="' + y + '" rx="2" ry="1.5"/></g>';

  // Dedo gigante da Praça do Clique.
  function bigFinger(x, top, scale, cls) {
    const cw = 20 * scale;
    const fw = 14 * scale;
    const fx = x + (cw - fw) / 2;
    const ch = 18 * scale;
    const fl = 34 * scale;
    const r = fw / 2;
    return '<g class="' + cls + '">' +
      '<rect class="cuff" x="' + x + '" y="' + top + '" width="' + cw + '" height="' + ch + '" rx="2" fill="url(#tw-hd)"/>' +
      '<path class="bigfinger" d="M' + fx + ' ' + (top + ch) + 'h' + fw + 'v' + fl + 'a' + r + ' ' + r + ' 0 0 1-' + fw + ' 0z"/>' +
      '<path class="n" d="M' + (fx + 3) + ' ' + (top + ch + fl - 2) + 'h' + (fw - 6) + '"/>' +
      // luva (3ª melhoria de clique)
      T(3, '<path class="n" d="M' + (x + 4) + ' ' + (top + 4) + 'v' + (ch - 8) + 'M' + (x + cw / 2) + ' ' + (top + 4) + 'v' + (ch - 8) + 'M' + (x + cw - 4) + ' ' + (top + 4) + 'v' + (ch - 8) + '" stroke-width=".8"/>') +
      // faixa e gelo (4ª)
      T(4, '<rect class="band" x="' + (fx - 0.5) + '" y="' + (top + ch + fl * 0.35) + '" width="' + (fw + 1) + '" height="' + 5 * scale + '"/>' +
        '<rect class="ice" x="' + (x + 2) + '" y="' + (top - 6 * scale) + '" width="' + (cw - 4) + '" height="' + 7 * scale + '" rx="3"/>') +
      '</g>';
  }

  const ART = {
    /* ----- Dedo Nervoso: 7 melhorias ----- */
    dedo: {
      w: 44, h: 66,
      svg:
        '<rect class="body" x="7" y="46" width="30" height="20" fill="url(#tw-h)"/>' +
        '<rect x="3" y="42" width="38" height="5" rx="1.5" fill="url(#tw-hd)"/>' +
        '<ellipse class="r btn" cx="16" cy="41" rx="7" ry="2.8"/>' +
        T(2, '<ellipse class="r btn" cx="31" cy="41" rx="6" ry="2.6"/>' +
          '<g class="a-tap tap2"><rect x="25" y="2" width="12" height="11" rx="2" fill="url(#tw-hd)"/>' +
          '<path class="finger" d="M27 13h8v17a4 4 0 0 1-8 0z"/>' +
          T(1, '<path class="g" d="M28.5 29.5h5a2.5 2.5 0 0 1-5 0z"/>') + '</g>') +
        '<g class="a-tap">' +
        X(5, '<rect x="9" y="0" width="14" height="13" rx="2" fill="url(#tw-hd)"/>') +
        T(5, '<path class="finger" d="M6 14V6Q6 1 11 1H22Q26 1 26 5V14Z"/><path class="n" d="M11 1.5V9M16 1.5V9M21 1.5V9"/>' +
          '<path class="finger" d="M6 8Q0 9 2 14H8Z"/>') +
        '<path class="finger" d="M11 13h10v16a5 5 0 0 1-10 0z"/>' +
        '<path class="n" d="M13.5 27.5h5"/>' +
        T(1, '<path class="g" d="M13 28h6a3 3 0 0 1-6 0z"/>' + sparkle(25, 31, 2.5, 1)) +
        T(3, '<rect class="band" x="10.5" y="18" width="11" height="4"/>') +
        T(4, '<circle class="k" cx="13" cy="16" r=".9"/><circle class="k" cx="19" cy="16" r=".9"/><circle class="k" cx="13" cy="24" r=".9"/><circle class="k" cx="19" cy="24" r=".9"/>' +
          '<path class="n gs" d="M17 3l-3 4.5h3.5l-3 4.5" stroke-width="1.4"/>') +
        T(6, '<rect class="g" x="10.5" y="22.5" width="11" height="2.6"/><circle class="r" cx="16" cy="22.5" r="2"/>') +
        T(7, '<path class="n" d="M11 15L21 23M21 15L11 25M16 13V33" stroke-width=".7"/>' + sparkle(6, 24, 2.5, 2) + sparkle(27, 18, 2, 3)) +
        '</g>',
    },

    /* ----- Alojamento dos Clones (um prédio por lote) ----- */
    dorm: {
      w: 72, h: 92,
      svg:
        '<rect class="body" x="6" y="22" width="60" height="70" fill="url(#tw-h)"/>' +
        '<rect x="2" y="16" width="68" height="7" fill="url(#tw-hd)"/>' +
        windows(12, 30, 4, 5, 8, 7, 13, 11, 4) +
        '<image href="' + FACE + '" x="25" y="30" width="8" height="7" preserveAspectRatio="xMidYMid slice"/>' +
        '<image href="' + FACE + '" x="51" y="52" width="8" height="7" preserveAspectRatio="xMidYMid slice"/>' +
        '<image href="' + FACE + '" x="12" y="63" width="8" height="7" preserveAspectRatio="xMidYMid slice"/>' +
        '<path d="M30 92V80a6 6 0 0 1 12 0v12z" fill="url(#tw-hd)"/>' +
        T(5, '<rect class="r" x="8" y="4" width="56" height="10"/><path class="n" d="M8 4V16M64 4V16"/>' +
          '<text class="tw-t light" x="36" y="11.8">GREVE</text>'),
    },

    /* ----- Fazenda ----- */
    fazenda: {
      w: 110, h: 72,
      svg:
        T(4, '<circle class="hay" cx="5" cy="66" r="5.5"/><circle class="n" cx="5" cy="66" r="2.2"/>') +
        '<path class="body" d="M10 72V32L32 14L54 32V72Z" fill="url(#tw-plank)"/>' +
        '<path class="n" d="M5 34L32 10L59 34" stroke-width="2.6"/>' +
        '<rect x="21" y="46" width="22" height="26" fill="url(#tw-hd)"/>' +
        '<path class="n" d="M21 46L43 72M43 46L21 72"/>' +
        face(26, 19, 12) +
        '<rect x="56" y="28" width="14" height="44" fill="url(#tw-v)"/>' +
        '<path d="M56 28a7 7 0 0 1 14 0z" fill="url(#tw-hd)"/>' +
        X(1, '<g class="a-sway">' + wheat([76, 86, 96, 106], 56) + '</g><g class="a-sway s2">' + wheat([81, 91, 101], 58) + '</g>') +
        T(1, '<g class="a-sway">' + wheat([74, 84, 94, 104], 46) + '</g><g class="a-sway s2">' + wheat([79, 89, 99, 109], 50) + '</g>') +
        T(5, '<path class="n" d="M76 72V30M96 72V24" stroke-width="1.6"/>' +
          '<circle class="g" cx="76" cy="27" r="8" stroke-dasharray="2 1.4"/>' + face(71, 22, 10) +
          '<circle class="g" cx="96" cy="21" r="8" stroke-dasharray="2 1.4"/>' + face(91, 16, 10)) +
        T(2, '<path class="n" d="M103 72V46M97 53H109" stroke-width="1.8"/>' +
          '<path d="M99 53L103 62L107 53Z" fill="url(#tw-plank)"/>' + face(98, 36, 10) +
          '<rect class="g" x="96" y="36" width="14" height="2"/><path class="g" d="M99 36L100.5 31H105.5L107 36Z"/>') +
        T(3, '<path class="n" d="M86 72V63"/><circle cx="86" cy="62" r="1.6"/>' +
          '<path class="n water a-water" d="M86 62Q92 50 99 60M86 62Q80 50 73 60" stroke-width="1.4"/>'),
    },

    /* ----- Fábrica ----- */
    fabrica: {
      w: 100, h: 96,
      svg:
        '<circle class="sm a-smoke" style="--i:0" cx="86" cy="13" r="6"/>' +
        '<circle class="sm a-smoke" style="--i:1" cx="86" cy="13" r="6"/>' +
        '<circle class="sm a-smoke" style="--i:2" cx="86" cy="13" r="6"/>' +
        T(5, '<circle class="sm gold a-smoke" style="--i:0.5" cx="67" cy="20" r="5"/><circle class="sm gold a-smoke" style="--i:1.5" cx="67" cy="20" r="5"/>' +
          '<rect x="63" y="26" width="8" height="18" fill="url(#tw-x)"/><rect class="g" x="62" y="24" width="10" height="3"/>') +
        '<rect class="body" x="6" y="44" width="70" height="52" fill="url(#tw-h)"/>' +
        '<path d="M6 44V32L24 44V32L42 44V32L60 44V32L76 44Z" fill="url(#tw-hd)"/>' +
        windows(12, 54, 4, 1, 10, 12, 16, 0, 1) +
        '<rect x="33" y="76" width="16" height="20" fill="url(#tw-hd)"/>' +
        '<rect x="80" y="24" width="12" height="72" fill="url(#tw-x)"/>' +
        '<rect x="78" y="20" width="16" height="5"/>' +
        T(2, '<circle class="seal" cx="64" cy="80" r="6.5"/><path class="n" d="M60.5 80l2.5 2.6 4.5-5" stroke-width="1.8"/>') +
        T(4, '<rect x="45" y="31" width="8" height="4"/><g class="a-arm"><path class="n" d="M49 32L55 21L64 25" stroke-width="2.6"/>' +
          '<circle class="g" cx="64" cy="25" r="2"/><circle class="k" cx="55" cy="21" r="1.4"/></g>') +
        T(1, '<rect class="belt" x="1" y="89" width="78" height="6" rx="3"/>' +
          '<rect class="box a-belt" style="--i:0" x="4" y="83" width="7" height="6"/>' +
          '<rect class="box a-belt" style="--i:1" x="4" y="83" width="7" height="6"/>' +
          '<rect class="box a-belt" style="--i:2" x="4" y="83" width="7" height="6"/>'),
    },

    /* ----- Escola ----- */
    escola: {
      w: 88, h: 96,
      svg:
        '<rect class="body" x="6" y="50" width="76" height="46" fill="url(#tw-h)"/>' +
        '<path d="M2 52L44 40L86 52Z" fill="url(#tw-hd)"/>' +
        '<rect class="body" x="32" y="30" width="24" height="20" fill="url(#tw-h)"/>' +
        X(5, '<path d="M28 32L44 18L60 32Z" fill="url(#tw-hd)"/>') +
        T(5, '<path class="g" d="M29 31a15 14 0 0 1 30 0z"/><path class="n" d="M34 31a10 12 0 0 1 20 0" stroke-width=".8"/>') +
        '<circle cx="44" cy="40" r="5.5"/>' +
        '<path class="n" d="M44 40V36.5M44 40h2.5"/>' +
        '<path class="n" d="M44 17V2"/>' +
        '<path class="a-flag g" d="M44 2h15l-3.5 4.5 3.5 4.5h-15z"/>' +
        windows(12, 58, 2, 2, 7, 10, 10, 16, 2) +
        windows(59, 58, 2, 2, 7, 10, 10, 16, 7) +
        '<path d="M38 96V80a6 6 0 0 1 12 0v16z" fill="url(#tw-hd)"/>' +
        T(1, '<circle class="r" cx="44" cy="65" r="5"/><path class="n" d="M44 60.5q1-3 3.5-3.5"/><path class="leaf" d="M44.5 60q3-3 5 -1q-3 2.5-5 1z"/>') +
        T(2, '<rect class="board" x="24" y="84" width="11" height="8"/><path class="n chalk" d="M26 87h4M26 89.5h6" stroke-width=".8"/>' +
          '<path class="n" d="M25 92l-1.5 4M34 92l1.5 4"/>') +
        T(3, '<path d="M54 96L55 88Q58.5 86.5 62 88L63 96Z" fill="url(#tw-hd)"/>' + face(54, 77, 9) +
          '<path class="n" d="M55 81.4h3M60 81.4h3M58 81.4h2" stroke-width=".9"/>') +
        T(4, '<g transform="translate(36 32)"><path class="k a-cap" style="--i:0" d="M-5 0L0-2.5L5 0L0 2.5Z"/></g>' +
          '<g transform="translate(52 30)"><path class="k a-cap" style="--i:1" d="M-5 0L0-2.5L5 0L0 2.5Z"/></g>' +
          '<g transform="translate(44 34)"><path class="k a-cap" style="--i:2" d="M-5 0L0-2.5L5 0L0 2.5Z"/></g>'),
    },

    /* ----- Banco ----- */
    banco: {
      w: 96, h: 84,
      svg:
        T(4, '<path class="n" d="M7 34V12M89 34V12" stroke-width="1.4"/><path class="r a-flag" d="M7 12h10l-2.5 3.5 2.5 3.5h-10z"/>' +
          '<path class="g a-flag" d="M89 12h-10l2.5 3.5-2.5 3.5h10z"/>') +
        '<rect x="4" y="78" width="86" height="6" fill="url(#tw-hd)"/>' +
        '<rect x="8" y="73" width="78" height="5"/>' +
        '<rect x="10" y="40" width="74" height="33"/>' +
        T(1, '<circle class="g" cx="47" cy="57" r="12"/><circle class="n" cx="47" cy="57" r="8"/><path class="n" d="M47 49V65M39 57H55"/>') +
        [14, 26, 38, 50, 62, 74].map((x) => '<rect class="body" x="' + x + '" y="40" width="7" height="33" fill="url(#tw-v)"/>').join('') +
        '<rect x="8" y="34" width="78" height="6" fill="url(#tw-hd)"/>' +
        '<path class="pedi" d="M4 34L47 10L90 34Z" fill="url(#tw-h)"/>' +
        '<circle class="g" cx="47" cy="25" r="8"/>' +
        face(41, 19, 12) +
        '<circle class="n gs a-glint" cx="47" cy="25" r="9.5"/>' +
        T(2, coins(11, 73, 3) + coins(20, 73, 5) + coins(66, 73, 4) + coins(75, 73, 2)) +
        T(3, '<rect class="atm" x="86" y="56" width="10" height="22" rx="1"/><rect class="screen" x="87.5" y="58" width="7" height="5"/>' +
          '<rect class="g" x="88" y="66" width="6" height="2"/>') +
        T(5, sparkle(30, 18, 3, 0) + sparkle(64, 16, 2.5, 2)),
    },

    /* ----- Laboratório ----- */
    laboratorio: {
      w: 92, h: 92,
      svg:
        T(4, '<g class="a-dna"><path class="n gs" d="M27 4Q37 9 27 14Q17 19 27 24Q37 29 27 30" stroke-width="1.6"/>' +
          '<path class="n" d="M27 4Q17 9 27 14Q37 19 27 24Q17 29 27 30" stroke-width="1.6"/>' +
          '<path class="n" d="M23 9H31M23 19H31" stroke-width=".9"/></g>') +
        '<rect class="body" x="4" y="52" width="56" height="40" fill="url(#tw-h)"/>' +
        '<path d="M8 52a24 22 0 0 1 48 0z" fill="url(#tw-x)"/>' +
        X(2, '<path class="n" d="M32 31v21" stroke-width="3"/>') +
        T(2, '<path class="g" d="M30 38L46 24L49.5 27.5L33.5 41.5Z"/><circle cx="32" cy="40" r="3"/>') +
        '<circle class="w" cx="16" cy="66" r="4.5"/><circle class="w" cx="48" cy="66" r="4.5"/>' +
        '<rect x="26" y="76" width="12" height="16" fill="url(#tw-hd)"/>' +
        T(1, '<path class="n" d="M14 72V70"/><path class="coat" d="M14 72L9 75L8 88H20L19 75Z"/><path class="n" d="M14 72V88" stroke-width=".7"/>') +
        T(5, '<path class="r" d="M29 56l3 4 3-4z"/><circle class="g" cx="32" cy="63" r="4.5"/>' + sparkle(39, 60, 2, 1)) +
        T(3, '<rect x="41" y="86" width="16" height="3"/>' +
          '<rect class="tube1" x="43" y="78" width="3" height="10" rx="1.5"/><rect class="tube2" x="48" y="77" width="3" height="11" rx="1.5"/>' +
          '<rect class="tube3" x="53" y="79" width="3" height="9" rx="1.5"/>') +
        '<path d="M68 44V58L60 80Q57 92 68 92H80Q91 92 88 80L80 58V44Z"/>' +
        '<path class="lq" d="M62.5 76H85.5L87.5 82Q89 90 80 90H68Q59 90 60.5 82Z"/>' +
        '<rect x="65" y="40" width="18" height="5" rx="1"/>' +
        '<circle class="bb a-bubble" style="--i:0" cx="72" cy="84" r="2.2"/>' +
        '<circle class="bb a-bubble" style="--i:1" cx="77" cy="84" r="1.6"/>' +
        '<circle class="bb a-bubble" style="--i:2" cx="69" cy="84" r="1.3"/>',
    },

    /* ----- Templo ----- */
    templo: {
      w: 96, h: 104,
      svg:
        T(5, '<ellipse class="shadow" cx="48" cy="102" rx="40" ry="2.5"/>') +
        '<g class="lev">' +
        '<path class="n gs a-rays" d="' + rays(48, 13, 12, 19, 14) + '" stroke-width="1.6"/>' +
        '<rect x="2" y="96" width="92" height="8" fill="url(#tw-hd)"/>' +
        '<rect x="7" y="90" width="82" height="6"/>' +
        '<rect x="14" y="56" width="68" height="34"/>' +
        [17, 28, 61, 72].map((x) => '<rect class="body" x="' + x + '" y="56" width="7" height="34" fill="url(#tw-v)"/>').join('') +
        '<rect x="42" y="78" width="12" height="12" fill="url(#tw-hd)"/>' +
        T(3, '<circle class="vit" cx="48" cy="67" r="9"/><path class="vit2" d="M48 67L48 58A9 9 0 0 1 56.8 65Z"/>' +
          '<path class="vit3" d="M48 67L40 71A9 9 0 0 1 39.2 65Z"/>' + face(43, 62, 10)) +
        '<rect x="10" y="50" width="76" height="6" fill="url(#tw-hd)"/>' +
        '<path class="dome" d="M18 50a30 22 0 0 1 60 0z" fill="url(#tw-x)"/>' +
        '<path class="n" d="M48 28V23"/>' +
        '<circle class="g" cx="48" cy="13" r="10"/>' +
        face(40, 5, 16) +
        T(2, note(22, 40, 0) + note(70, 36, 1) + note(30, 30, 2)) +
        T(4, '<g><circle cx="33" cy="80" r="2.4"/><path d="M30.5 90L31.5 83H34.5L35.5 90Z" fill="url(#tw-hd)"/><path class="n" d="M36.5 90V78"/></g>' +
          '<g><circle cx="63" cy="80" r="2.4"/><path d="M60.5 90L61.5 83H64.5L65.5 90Z" fill="url(#tw-hd)"/><path class="n" d="M59.5 90V78"/></g>') +
        '</g>' +
        T(1, '<rect class="candle" x="4" y="90" width="2.6" height="6"/><ellipse class="g a-flicker" cx="5.3" cy="88.5" rx="1.4" ry="2.2"/>' +
          '<rect class="candle" x="89.4" y="90" width="2.6" height="6"/><ellipse class="g a-flicker" style="--i:1" cx="90.7" cy="88.5" rx="1.4" ry="2.2"/>' +
          '<rect class="candle" x="10" y="84" width="2.6" height="6"/><ellipse class="g a-flicker" style="--i:2" cx="11.3" cy="82.5" rx="1.4" ry="2.2"/>' +
          '<rect class="candle" x="83.4" y="84" width="2.6" height="6"/><ellipse class="g a-flicker" style="--i:3" cx="84.7" cy="82.5" rx="1.4" ry="2.2"/>'),
    },

    /* ----- Roubarópolis ----- */
    cidade: {
      w: 104, h: 128,
      svg:
        '<rect class="body" x="4" y="54" width="26" height="74" fill="url(#tw-h)"/>' +
        windows(8, 60, 3, 7, 4, 5, 7, 9, 3) +
        T(3, '<path class="n" d="M17 54V38" stroke-width="1.4"/><path class="r a-flag" d="M17 38h11l-2.5 3.5 2.5 3.5h-11z"/>') +
        X(5, '<path class="n" d="M48 12V2"/><circle class="r" cx="48" cy="2" r="2"/>') +
        '<rect class="bodyB" x="32" y="12" width="32" height="116" fill="url(#tw-x)"/>' +
        windows(36, 42, 4, 9, 4, 6, 7, 9.5, 11) +
        T(5, '<path class="g" d="M33 12L35 3L41 8L48 -1L55 8L61 3L63 12Z"/>') +
        '<rect class="board" x="35" y="16" width="26" height="20"/>' +
        '<image href="' + FACE + '" x="37" y="17.5" width="22" height="17" preserveAspectRatio="xMidYMid slice"/>' +
        '<rect class="n" x="35" y="16" width="26" height="20"/>' +
        '<rect class="body" x="66" y="38" width="22" height="90" fill="url(#tw-h)"/>' +
        windows(70, 44, 2, 9, 5, 6, 9, 9, 5) +
        X(4, '<rect x="88" y="78" width="14" height="50" fill="url(#tw-hd)"/>' + windows(91, 84, 2, 5, 3, 4, 5, 9, 8)) +
        T(4, '<rect x="89" y="72" width="10" height="56" fill="url(#tw-hd)"/>' + windows(91, 78, 2, 5, 2, 4, 4, 9, 2) +
          '<circle class="body" cx="94" cy="62" r="11" fill="url(#tw-h)"/>' + face(85, 53, 18)) +
        T(2, '<rect class="k" x="40" y="118" width="14" height="10"/><circle class="r" cx="47" cy="111" r="5"/>' +
          '<path class="n light" d="M44.3 113.5V108.5L47 111.5L49.7 108.5V113.5" stroke-width="1.2"/>') +
        T(1, '<g class="a-car"><rect class="r" x="0" y="121" width="12" height="5" rx="2"/><rect class="w" x="3" y="119" width="6" height="3" rx="1"/>' +
          '<circle class="k" cx="3" cy="126.5" r="1.5"/><circle class="k" cx="9" cy="126.5" r="1.5"/></g>' +
          '<g class="a-car c2"><rect class="g" x="0" y="121" width="12" height="5" rx="2"/><rect class="w" x="3" y="119" width="6" height="3" rx="1"/>' +
          '<circle class="k" cx="3" cy="126.5" r="1.5"/><circle class="k" cx="9" cy="126.5" r="1.5"/></g>'),
    },

    /* ----- Foguete ----- */
    foguete: {
      w: 60, h: 124,
      svg:
        T(3, '<circle cx="9" cy="12" r="7"/><circle class="n" cx="7" cy="10" r="1.6"/><circle class="n" cx="11" cy="14" r="1.2"/>' +
          '<path class="n" d="M9 5V-3" stroke-width="1"/><path class="r" d="M9 -3h6l-1.5 2 1.5 2h-6z"/>') +
        T(4, '<circle class="mars" cx="51" cy="12" r="6"/><path class="dome2" d="M47 9a3 3 0 0 1 6 0z"/>') +
        '<rect x="2" y="114" width="56" height="10" fill="url(#tw-hd)"/>' +
        '<path class="n" d="M42 114V34M52 114V34M42 34H52M42 114L52 104L42 94L52 84L42 74L52 64L42 54L52 44L42 34M42 62H36" stroke-width="1"/>' +
        '<path class="n" d="M18 114L21 104M38 114L35 104"/>' +
        T(1, '<rect class="tank" x="2" y="86" width="9" height="28" rx="4.5"/><path class="n" d="M2 96H11M2 104H11" stroke-width="1.6"/>') +
        T(5, '<path class="g" d="M54 114V103Q54 97 56.5 93Q59 97 59 103V114Z"/>') +
        '<g class="a-rocket">' +
        '<path class="g a-flame" d="M23 104Q28 124 33 104Z"/>' +
        '<path class="r" d="M14 106L21 90V104Z"/><path class="r" d="M42 106L35 90V104Z"/>' +
        '<path class="rbody" d="M21 104V50Q21 36 28 26Q35 36 35 50V104Z" fill="url(#tw-h)"/>' +
        '<rect class="g" x="21" y="78" width="14" height="4"/>' +
        face(22.5, 52, 11) +
        T(2, '<circle class="helmet" cx="28" cy="57.5" r="7.5"/><path class="n light" d="M23.5 53.5a6 6 0 0 1 4-2.4" stroke-width="1.3"/>' +
          '<path class="n" d="M28 50V46" stroke-width="1"/><circle class="r" cx="28" cy="45.5" r="1.4"/>') +
        '</g>',
    },

    /* ----- Portal ----- */
    portal: {
      w: 82, h: 100,
      svg:
        '<path class="pt" d="M20 100V44a21 21 0 0 1 42 0V100Z"/>' +
        '<path class="n gs a-swirl" d="' + spiral(41, 62, 1, 19, 2.6, 0) + '" stroke-width="2"/>' +
        '<path class="n sw2 a-swirl s2" d="' + spiral(41, 62, 1, 16, 2, Math.PI) + '" stroke-width="1.4"/>' +
        T(4, '<circle class="n gs a-swirl s3" cx="41" cy="62" r="12" stroke-width="2.6" stroke-dasharray="6 4"/>') +
        T(5, '<g class="a-popface" style="--i:0;--px:-12px;--py:-12px">' + face(35, 56, 12) + '</g>' +
          '<g class="a-popface" style="--i:1;--px:12px;--py:-6px">' + face(35, 56, 12) + '</g>' +
          '<g class="a-popface" style="--i:2;--px:0px;--py:14px">' + face(35, 56, 12) + '</g>') +
        '<path class="body" d="M6 100V42a35 35 0 0 1 70 0V100H62V44a21 21 0 0 0-42 0V100Z" fill="url(#tw-x)"/>' +
        '<path class="n" d="M6 70H20M62 70H76M6 86H20M62 86H76M12 24L23 32M70 24L59 32"/>' +
        '<path class="g" d="M35 7h12l-2.5 15h-7z"/>' +
        T(3, sparkle(14, 50, 3, 0) + sparkle(68, 56, 2.5, 2)) +
        T(2, '<rect x="18" y="80" width="4" height="20"/><path class="gate a-gate" d="M20 82H62" stroke-width="3.4"/>') +
        T(1, '<path class="g" d="M0 100V92H8V100Z"/><path class="n" d="M8 93L13 89" stroke-width="1.4"/><path class="n" d="M2 92V89H6V92"/>'),
    },

    /* ----- Máquina do Tempo ----- */
    maquina: {
      w: 80, h: 96,
      svg:
        T(5, '<circle class="n gs a-ripple" style="--i:0" cx="40" cy="24" r="20" stroke-width="1.6"/>' +
          '<circle class="n gs a-ripple" style="--i:1" cx="40" cy="24" r="20" stroke-width="1.6"/>') +
        '<g class="a-gear"><circle class="n" cx="8" cy="80" r="6" stroke-width="3.5" stroke-dasharray="2.4 2.2"/><circle cx="8" cy="80" r="3"/></g>' +
        '<rect class="body" x="14" y="44" width="52" height="52" fill="url(#tw-h)"/>' +
        '<rect class="w" x="24" y="56" width="32" height="30" rx="3"/>' +
        T(2, '<image class="ghost" href="' + FACE + '" x="28" y="58" width="24" height="26" preserveAspectRatio="xMidYMid slice"/>') +
        '<rect class="n" x="24" y="56" width="32" height="30" rx="3"/>' +
        T(3, '<rect class="k" x="56.5" y="46" width="8" height="8" rx="1"/>' +
          '<image class="neon" href="' + FACE + '" x="57" y="46.5" width="7" height="7" preserveAspectRatio="xMidYMid slice"/>') +
        T(1, '<g class="a-pend"><path class="n" d="M40 86V92"/><circle class="g" cx="40" cy="93" r="2.4"/></g>') +
        '<path class="n" d="M14 44L8 37M66 44L72 37"/><circle class="g" cx="8" cy="36" r="2.4"/><circle class="g" cx="72" cy="36" r="2.4"/>' +
        '<circle class="clockface" cx="40" cy="24" r="20" stroke-width="2"/>' +
        '<path class="n" d="' + rays(40, 24, 16, 18.5, 12) + '"/>' +
        '<path class="n a-hand-h" d="M40 24V14" stroke-width="2.4"/>' +
        '<path class="n a-hand-m" d="M40 24V8" stroke-width="1.4"/>' +
        '<circle class="k" cx="40" cy="24" r="1.8"/>' +
        T(4, '<path class="n gs a-glow" d="M3 16C3 12 8 12 10 16C12 20 17 20 17 16C17 12 12 12 10 16C8 20 3 20 3 16Z" stroke-width="1.6"/>' +
          '<path class="n gs a-glow" d="M63 16C63 12 68 12 70 16C72 20 77 20 77 16C77 12 72 12 70 16C68 20 63 20 63 16Z" stroke-width="1.6"/>') +
        '<g class="a-gear s2"><circle class="n" cx="72" cy="86" r="5" stroke-width="3" stroke-dasharray="2 2"/><circle cx="72" cy="86" r="2.4"/></g>',
    },

    /* ----- Roubarverso: planetas no céu ----- */
    multiverso: {
      w: 46, h: 46,
      svg:
        T(1, '<ellipse class="n orbit" cx="23" cy="23" rx="22" ry="10" stroke-dasharray="2 3"/>') +
        '<path class="n gs ring" d="M4.4 27A19 6 -12 0 1 41.6 19" stroke-width="2"/>' +
        '<circle cx="23" cy="23" r="14"/>' +
        face(9, 9, 28) +
        '<circle class="n" cx="23" cy="23" r="14" fill="url(#tw-h)" opacity=".35"/>' +
        '<path class="n gs ring" d="M41.6 19A19 6 -12 0 1 4.4 27" stroke-width="2"/>' +
        T(2, '<g class="a-orbit"><circle class="moonlet" cx="23" cy="1" r="3"/></g>') +
        T(3, sparkle(3, 6, 2.5, 0) + sparkle(43, 40, 2.5, 1) + sparkle(42, 4, 2, 2)),
    },

    /* ----- Clone do Roubar ----- */
    clone: {
      w: 24, h: 46,
      svg:
        '<g class="a-bob">' +
        T(5, '<path class="n" d="M3.5 33V6" stroke-width="1.4"/><rect class="sign" x="-6" y="-2" width="19" height="10"/>' +
          '<text class="tw-t light" x="3.5" y="5.4">+R$</text>') +
        '<path class="n a-leg" d="M10 33L9.5 45" stroke-width="2.4"/>' +
        '<path class="n a-leg l2" d="M14 33L14.5 45" stroke-width="2.4"/>' +
        '<path class="n" d="M6.5 24L3.5 33M17.5 24L20.5 33" stroke-width="2"/>' +
        '<path d="M5.5 34L7 22Q12 19.5 17 22L18.5 34Z" fill="url(#tw-hd)"/>' +
        '<path class="r" d="M12 22.5l-1.6 2 1.6 7 1.6-7z"/>' +
        T(1, '<rect class="badge" x="14" y="25" width="3.6" height="4.6"/>') +
        T(2, '<rect class="cup" x="19" y="30" width="4.4" height="5" rx="1"/><path class="n steam a-steam" d="M21 29q-1.5-2 0-4" stroke-width=".9"/>') +
        face(2, 1, 20) +
        T(3, '<path class="r" d="M2.6 8Q4 -1 12 -1Q20 -1 21.4 8Z"/><path class="r" d="M12 7h12v2h-12z"/>') +
        '</g>',
    },

    /* ----- Praça do Clique (melhorias de clique) ----- */
    praca: {
      w: 100, h: 124,
      svg:
        T(1, '<g class="a-heat"><path class="n heat" d="M34 70q-4-6 0-12t0-12M66 70q4-6 0-12t0-12" stroke-width="1.6"/></g>') +
        X(5, '<rect class="body" x="22" y="100" width="56" height="24" fill="url(#tw-stone)"/><rect x="16" y="94" width="68" height="7" fill="url(#tw-hd)"/>') +
        T(5, '<rect class="g" x="38" y="94" width="24" height="30"/><text class="tw-t" x="50" y="114">1</text>' +
          '<rect class="body" x="10" y="106" width="28" height="18" fill="url(#tw-stone)"/><text class="tw-t" x="24" y="119">2</text>' +
          '<rect class="body" x="62" y="110" width="28" height="14" fill="url(#tw-stone)"/><text class="tw-t" x="76" y="121">3</text>' +
          '<path class="g" d="M17 106V98Q17 92 24 92Q31 92 31 98V106Z"/><path class="n" d="M17 96h-3v4h3M31 96h3v4h-3" />' +
          '<rect class="g" x="21" y="88" width="6" height="4"/>' + sparkle(84, 96, 3, 1)) +
        '<ellipse class="r btn" cx="50" cy="93" rx="13" ry="3.5"/>' +
        T(2, '<ellipse class="r btn" cx="74" cy="93" rx="8" ry="2.6"/>' + bigFinger(65, 42, 0.85, 'a-tap slow tap2')) +
        bigFinger(40, 26, 1, 'a-tap slow') +
        T(5, '<path class="r" d="M46 26l4 8 4-8z"/><circle class="g" cx="50" cy="37" r="4"/>'),
    },

    /* ----- Receita do Roubar (melhorias de imposto) ----- */
    receita: {
      w: 96, h: 96,
      svg:
        X(5, '<rect class="body" x="16" y="50" width="40" height="46" fill="url(#tw-h)"/>' +
          '<path d="M12 52L36 36L60 52Z" fill="url(#tw-hd)"/>' +
          '<rect class="w" x="22" y="60" width="28" height="15"/>' + face(30, 61, 13) +
          '<rect x="20" y="75" width="32" height="3"/><circle class="g" cx="36" cy="46" r="4.4"/><text class="tw-t" x="36" y="48.2" style="font-size:6px">%</text>') +
        T(5, '<rect x="4" y="88" width="66" height="8" fill="url(#tw-hd)"/><rect x="8" y="50" width="58" height="38"/>' +
          [11, 24, 43, 56].map((x) => '<rect class="body" x="' + x + '" y="50" width="7" height="38" fill="url(#tw-v)"/>').join('') +
          '<rect class="w" x="31" y="62" width="12" height="15"/>' + face(31, 63, 12) +
          '<rect x="6" y="44" width="62" height="6" fill="url(#tw-hd)"/><path class="g" d="M4 44L37 24L70 44Z"/>' +
          '<circle class="n" cx="37" cy="36" r="4.5"/><text class="tw-t" x="37" y="38.2" style="font-size:6px">%</text>') +
        T(2, '<path d="M38 75V67H50V75Z" fill="url(#tw-metal)"/><rect class="k" x="40" y="68.5" width="8" height="3"/>' +
          '<rect class="g a-drawer" x="39" y="75" width="10" height="3"/>') +
        T(3, '<rect class="post" x="72" y="68" width="5" height="28"/><path class="gate a-gate g2" d="M74.5 70H96" stroke-width="3.4"/>') +
        T(4, '<rect class="chest" x="0" y="84" width="14" height="12"/><path class="g" d="M0 84Q7 77 14 84Z"/>' + face(3.5, 86, 7) + sparkle(14, 80, 2, 1)),
    },

    /* ----- Palácio da República (decretos) ----- */
    palacio: {
      w: 152, h: 170,
      svg:
        T(6, '<rect x="38" y="26" width="76" height="8" rx="4" fill="url(#tw-stone)"/>' +
          '<path class="body" d="M68 28L84 28L90 114L62 114Z" fill="url(#tw-stone)"/>' +
          '<path class="n" d="M70 40L82 40M66 70L86 70" stroke-width=".8"/>' + face(66, 4, 20) +
          '<path class="n gs a-rays" d="' + rays(76, 14, 13, 18, 12) + '" stroke-width="1.2"/>') +
        T(5, '<path class="n" d="M40 112V100M110 112V100" stroke-width="2"/>' +
          '<rect class="note200" x="30" y="76" width="90" height="26"/><rect class="n" x="33" y="79" width="84" height="20" stroke-width=".8"/>' +
          '<text class="tw-t" x="52" y="94" style="font-size:12px">200</text>' + face(92, 79, 20)) +
        '<rect x="2" y="160" width="138" height="10" fill="url(#tw-hd)"/>' +
        '<rect class="glassb" x="14" y="118" width="114" height="42" fill="url(#tw-glass)"/>' +
        '<rect class="body" x="6" y="112" width="130" height="6" fill="url(#tw-stone)"/>' +
        [12, 34, 56, 78, 100, 122].map((x) => '<path class="n" d="M' + x + ' 118Q' + (x + 7) + ' 139 ' + x + ' 160" stroke-width="2.4"/>').join('') +
        T(1, '<path class="n" d="M142 160V96" stroke-width="1.6"/><g class="a-flag"><rect class="flag" x="142" y="96" width="10" height="14"/>' +
          '<circle class="g" cx="147" cy="103" r="3.4"/></g>') +
        T(2, '<path class="n" d="M4 160V104" stroke-width="1.4"/><path class="g" d="M4 104L12 99V111Z"/>' + note(10, 96, 0) + note(18, 90, 1)) +
        T(4, '<path class="n" d="M66 160V150M86 160V150" stroke-width="1.6"/>' +
          '<path class="book" d="M58 150Q67 144 76 150Q85 144 94 150V136Q85 130 76 136Q67 130 58 136Z"/>' +
          '<path class="n" d="M76 136V150M62 139Q67 136 72 139M62 143Q67 140 72 143M80 139Q85 136 90 139M80 143Q85 140 90 143" stroke-width=".7"/>'),
    },

    /* ----- Fonte da Sorte (melhorias do Roubar Dourado) ----- */
    fonte: {
      w: 84, h: 92,
      svg:
        T(2, '<path class="magnet" d="M30 38V22A12 12 0 0 1 54 22V38H47V22A5 5 0 0 0 37 22V38Z"/>' +
          '<rect class="tip" x="30" y="32" width="7" height="6"/><rect class="tip" x="47" y="32" width="7" height="6"/>' +
          '<path class="n gs a-glow" d="M26 30l-4-2M58 30l4-2M42 6V2" stroke-width="1.4"/>') +
        '<path class="n jet a-water" d="M42 44Q30 40 20 70M42 44Q54 40 64 70" stroke-width="1.6"/>' +
        '<rect class="body" x="38" y="44" width="8" height="32" fill="url(#tw-stone)"/>' +
        '<path class="body" d="M28 44H56L52 50H32Z" fill="url(#tw-stone)"/>' +
        '<path class="body" d="M4 74Q42 90 80 74V84Q42 100 4 84Z" fill="url(#tw-stone)"/>' +
        '<ellipse class="water-s" cx="42" cy="76" rx="36" ry="5"/>' +
        T(3, '<circle class="g a-coinfall" style="--i:0;--cx:-20px" cx="42" cy="44" r="2.6"/>' +
          '<circle class="g a-coinfall" style="--i:1;--cx:20px" cx="42" cy="44" r="2.6"/>' +
          '<circle class="g a-coinfall" style="--i:2;--cx:-12px" cx="42" cy="44" r="2.2"/>' + sparkle(70, 60, 2.5, 1)) +
        T(1, ['M6 90', 'M24 92', 'M60 92', 'M78 90'].map((m, i) => {
          const x = [6, 24, 60, 78][i];
          const y = [86, 88, 88, 86][i];
          return '<g class="clover"><circle cx="' + (x - 2) + '" cy="' + (y - 2) + '" r="2"/><circle cx="' + (x + 2) + '" cy="' + (y - 2) + '" r="2"/>' +
            '<circle cx="' + (x - 2) + '" cy="' + (y + 2) + '" r="2"/><circle cx="' + (x + 2) + '" cy="' + (y + 2) + '" r="2"/></g>';
        }).join('')),
    },
  };

  // Elementos das obras da República.
  const OBRA = {
    lamp:
      '<svg class="obj lamp" width="16" height="64" viewBox="0 0 16 64" aria-hidden="true" focusable="false">' +
      '<path class="n" d="M8 64V10M8 10Q8 4 14 4" stroke-width="1.8"/><path d="M10 4H16L14.5 8H11.5Z"/>' +
      '<ellipse class="bulb" cx="13" cy="9" rx="2" ry="1.4"/></svg>',
    tree:
      '<svg class="obj tree" width="30" height="58" viewBox="0 0 30 58" aria-hidden="true" focusable="false">' +
      '<path d="M13 58V34H17V58Z" fill="url(#tw-plank)"/>' +
      '<circle class="leafy" cx="15" cy="22" r="13"/><circle class="leafy" cx="8" cy="28" r="7"/><circle class="leafy" cx="22" cy="28" r="7"/>' +
      '<circle class="n" cx="15" cy="22" r="13" fill="url(#tw-h)" opacity=".4"/></svg>',
    bus:
      '<svg class="bus-svg" width="76" height="34" viewBox="0 0 76 34" aria-hidden="true" focusable="false">' +
      '<rect class="busbody" x="2" y="4" width="72" height="24" rx="5"/><rect class="g" x="2" y="20" width="72" height="3"/>' +
      [8, 22, 36, 50].map((x) => '<rect class="w" x="' + x + '" y="8" width="11" height="9" rx="1"/>' +
        '<image href="' + FACE + '" x="' + (x + 1.5) + '" y="8.5" width="8" height="8" clip-path="url(#tw-round)"/>').join('') +
      '<rect class="w" x="64" y="8" width="8" height="12" rx="1"/>' +
      '<circle class="k" cx="16" cy="29" r="4"/><circle class="k" cx="58" cy="29" r="4"/>' +
      '<circle class="n light" cx="16" cy="29" r="1.6"/><circle class="n light" cx="58" cy="29" r="1.6"/></svg>',
    blimp:
      '<svg class="blimp-svg" width="104" height="44" viewBox="0 0 104 44" aria-hidden="true" focusable="false">' +
      '<path d="M8 18L0 8V28Z" fill="url(#tw-hd)"/>' +
      '<ellipse cx="50" cy="18" rx="42" ry="15" fill="url(#tw-h)"/>' +
      '<path class="n" d="M14 18H86M50 3V33" stroke-width=".6"/>' + face(56, 6, 24) +
      '<rect x="40" y="33" width="16" height="7" rx="2"/><path class="n" d="M44 33V30M52 33V30"/>' +
      '<path class="g" d="M92 18Q98 14 104 18Q98 22 92 18Z"/></svg>',
    gondola:
      '<svg class="gondola-svg" width="34" height="40" viewBox="0 0 34 40" aria-hidden="true" focusable="false">' +
      '<path class="n" d="M17 0V10" stroke-width="1.4"/><circle class="k" cx="17" cy="2" r="2.4"/>' +
      '<rect class="busbody" x="3" y="10" width="28" height="26" rx="5"/><rect class="w" x="7" y="15" width="20" height="12" rx="2"/>' +
      '<image href="' + FACE + '" x="11" y="15" width="12" height="12" clip-path="url(#tw-round)"/></svg>',
    burst:
      '<svg class="burst-svg" width="70" height="70" viewBox="0 0 70 70" aria-hidden="true" focusable="false">' +
      '<path class="n" d="' + rays(35, 35, 8, 32, 16) + '" stroke-width="2"/>' +
      '<g class="burst-dots">' + Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return '<circle cx="' + (35 + Math.cos(a) * 33).toFixed(1) + '" cy="' + (35 + Math.sin(a) * 33).toFixed(1) + '" r="2"/>';
      }).join('') + '</g></svg>',
  };

  // Hachuras, materiais e recorte redondo, usados por todos os desenhos.
  const pat = (id, w, h, rot, bgCls, lines) =>
    '<pattern id="' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse"' +
    (rot ? ' patternTransform="rotate(' + rot + ')"' : '') + '><rect width="' + w + '" height="' + h + '" class="' + bgCls + '"/>' + lines + '</pattern>';

  const DEFS =
    '<svg class="town-defs" aria-hidden="true" focusable="false"><defs>' +
    pat('tw-h', 4, 4, 45, 'pw', '<line x1="0" y1="0" x2="0" y2="4" class="pl"/>') +
    pat('tw-hd', 2.6, 2.6, -45, 'pw', '<line x1="0" y1="0" x2="0" y2="2.6" class="pl pd"/>') +
    pat('tw-x', 4, 4, 45, 'pw', '<path d="M0 0V4M0 0H4" class="pl"/>') +
    pat('tw-v', 3, 3, 0, 'pw', '<line x1="1.5" y1="0" x2="1.5" y2="3" class="pl"/>') +
    pat('tw-plank', 6, 12, 0, 'pwood', '<path d="M0 0V12" class="pl pd"/><path d="M3 4h.01" class="pl"/>') +
    pat('tw-red', 4, 4, 45, 'pred', '<line x1="0" y1="0" x2="0" y2="4" class="pl"/>') +
    pat('tw-brick', 10, 6, 0, 'pbrick', '<path d="M0 0H10M0 3H10M0 0V3M5 3V6" class="pl pd"/>') +
    pat('tw-stone', 14, 8, 0, 'pw', '<path d="M0 0H14M0 4H14M0 0V4M7 4V8" class="pl"/>') +
    pat('tw-marble', 24, 24, 0, 'pmarble', '<path d="M0 6Q6 2 12 8T24 10M4 24Q10 16 18 18" class="pl pv"/>') +
    pat('tw-gold', 4, 4, 45, 'pgold', '<line x1="0" y1="0" x2="0" y2="4" class="pl pgl"/>') +
    pat('tw-glass', 6, 8, 0, 'pglass', '<path d="M0 0H6M0 0V8" class="pl"/><path d="M1 6L4 2" class="pl pv"/>') +
    pat('tw-metal', 3, 3, 0, 'pmetal', '<line x1="0" y1="1.5" x2="3" y2="1.5" class="pl"/>') +
    '<clipPath id="tw-round" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>' +
    '</defs></svg>';

  const SUN =
    '<svg class="sun" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path class="n" d="' + rays(24, 24, 14, 21, 16) + '"/>' +
    '<circle cx="24" cy="24" r="11" fill="url(#tw-h)"/><g class="skyface">' + face(14, 14, 20) + '</g></svg>';

  const MOON =
    '<svg class="moon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path class="crescent" d="M30 8a16 16 0 1 0 10 28A13 13 0 1 1 30 8z" fill="url(#tw-h)"/>' +
    '<g class="skyface">' + face(10, 10, 28) + '</g></svg>';

  RC.TOWN_ART = ART;
  RC.TOWN_OBRA = OBRA;
  RC.TOWN_DEFS = DEFS;
  RC.TOWN_SUN = SUN;
  RC.TOWN_MOON = MOON;
})(typeof window !== 'undefined' ? window : globalThis);
