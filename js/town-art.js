/*
 * Roubar Clicker: desenhos da cidade (SVG em traço de gravura de cédula).
 * Cada desenho tem largura (w), altura (h) e o passo (step) entre uma unidade
 * e a próxima na fila. O chão fica sempre na base do desenho (y = h).
 * Classes usadas nos desenhos (o visual fica em css/style.css):
 *   n = sem preenchimento | g = ouro | gs = traço de ouro | r = vermelho
 *   w = janela (acende à noite) | k = tinta | a-* = animação
 */
(function (root) {
  'use strict';
  const RC = (root.RC = root.RC || {});
  const FACE = 'assets/roubar-face.webp';

  // Rosto do Roubar recortado em círculo, com contorno.
  const face = (x, y, s) =>
    '<image href="' + FACE + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s +
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

  // Espiral do portal.
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

  // Raios em volta de um ponto.
  function rays(cx, cy, r0, r1, count) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      d += 'M' + (cx + Math.cos(a) * r0).toFixed(1) + ' ' + (cy + Math.sin(a) * r0).toFixed(1) +
        'L' + (cx + Math.cos(a) * r1).toFixed(1) + ' ' + (cy + Math.sin(a) * r1).toFixed(1);
    }
    return d;
  }

  function wheat(xs) {
    return xs.map((x) => '<path class="n" d="M' + x + ' 72V57"/><ellipse class="g" cx="' + x + '" cy="54" rx="1.8" ry="4"/>').join('');
  }

  const ART = {
    dedo: {
      w: 44, h: 66, step: 34,
      svg:
        '<rect x="7" y="46" width="30" height="20" fill="url(#tw-h)"/>' +
        '<rect x="3" y="42" width="38" height="5" rx="1.5" fill="url(#tw-hd)"/>' +
        '<ellipse class="r" cx="22" cy="41" rx="8" ry="3"/>' +
        '<g class="a-tap">' +
        '<rect x="14" y="0" width="16" height="13" rx="2" fill="url(#tw-hd)"/>' +
        '<path d="M17 13h10v16a5 5 0 0 1-10 0z"/>' +
        '<path class="n" d="M19.5 27.5h5"/>' +
        '</g>',
    },

    fazenda: {
      w: 94, h: 72, step: 88,
      svg:
        '<path d="M10 72V32L32 14L54 32V72Z" fill="url(#tw-h)"/>' +
        '<path class="n" d="M5 34L32 10L59 34" stroke-width="2.6"/>' +
        '<rect x="21" y="46" width="22" height="26" fill="url(#tw-hd)"/>' +
        '<path class="n" d="M21 46L43 72M43 46L21 72"/>' +
        face(26, 19, 12) +
        '<rect x="56" y="28" width="14" height="44" fill="url(#tw-v)"/>' +
        '<path d="M56 28a7 7 0 0 1 14 0z" fill="url(#tw-hd)"/>' +
        '<g class="a-sway">' + wheat([74, 82, 90]) + '</g>' +
        '<g class="a-sway s2">' + wheat([78, 86]) + '</g>',
    },

    fabrica: {
      w: 100, h: 96, step: 94,
      svg:
        '<circle class="sm a-smoke" style="--i:0" cx="86" cy="13" r="6"/>' +
        '<circle class="sm a-smoke" style="--i:1" cx="86" cy="13" r="6"/>' +
        '<circle class="sm a-smoke" style="--i:2" cx="86" cy="13" r="6"/>' +
        '<rect x="6" y="44" width="70" height="52" fill="url(#tw-h)"/>' +
        '<path d="M6 44V32L24 44V32L42 44V32L60 44V32L76 44Z" fill="url(#tw-hd)"/>' +
        windows(12, 54, 4, 1, 10, 12, 16, 0, 1) +
        '<rect x="33" y="76" width="16" height="20" fill="url(#tw-hd)"/>' +
        '<rect x="80" y="24" width="12" height="72" fill="url(#tw-x)"/>' +
        '<rect x="78" y="20" width="16" height="5"/>',
    },

    escola: {
      w: 88, h: 96, step: 82,
      svg:
        '<rect x="6" y="50" width="76" height="46" fill="url(#tw-h)"/>' +
        '<path d="M2 52L44 40L86 52Z" fill="url(#tw-hd)"/>' +
        '<rect x="32" y="30" width="24" height="20" fill="url(#tw-h)"/>' +
        '<path d="M28 32L44 18L60 32Z" fill="url(#tw-hd)"/>' +
        '<circle cx="44" cy="40" r="5.5"/>' +
        '<path class="n" d="M44 40V36.5M44 40h2.5"/>' +
        '<path class="n" d="M44 18V2"/>' +
        '<path class="a-flag g" d="M44 2h15l-3.5 4.5 3.5 4.5h-15z"/>' +
        windows(12, 58, 2, 2, 7, 10, 10, 16, 2) +
        windows(59, 58, 2, 2, 7, 10, 10, 16, 7) +
        '<path d="M38 96V80a6 6 0 0 1 12 0v16z" fill="url(#tw-hd)"/>',
    },

    banco: {
      w: 94, h: 84, step: 90,
      svg:
        '<rect x="4" y="78" width="86" height="6" fill="url(#tw-hd)"/>' +
        '<rect x="8" y="73" width="78" height="5"/>' +
        '<rect x="10" y="40" width="74" height="33"/>' +
        [14, 26, 38, 50, 62, 74].map((x) => '<rect x="' + x + '" y="40" width="7" height="33" fill="url(#tw-v)"/>').join('') +
        '<rect x="8" y="34" width="78" height="6" fill="url(#tw-hd)"/>' +
        '<path d="M4 34L47 10L90 34Z" fill="url(#tw-h)"/>' +
        '<circle class="g" cx="47" cy="25" r="8"/>' +
        face(41, 19, 12) +
        '<circle class="n gs a-glint" cx="47" cy="25" r="9.5"/>',
    },

    laboratorio: {
      w: 92, h: 92, step: 86,
      svg:
        '<rect x="4" y="52" width="56" height="40" fill="url(#tw-h)"/>' +
        '<path d="M8 52a24 22 0 0 1 48 0z" fill="url(#tw-x)"/>' +
        '<path class="n" d="M32 31v21" stroke-width="3"/>' +
        '<circle class="w" cx="16" cy="66" r="4.5"/><circle class="w" cx="48" cy="66" r="4.5"/>' +
        '<rect x="26" y="76" width="12" height="16" fill="url(#tw-hd)"/>' +
        '<path d="M68 44V58L60 80Q57 92 68 92H80Q91 92 88 80L80 58V44Z"/>' +
        '<path class="lq" d="M62.5 76H85.5L87.5 82Q89 90 80 90H68Q59 90 60.5 82Z"/>' +
        '<rect x="65" y="40" width="18" height="5" rx="1"/>' +
        '<circle class="bb a-bubble" style="--i:0" cx="72" cy="84" r="2.2"/>' +
        '<circle class="bb a-bubble" style="--i:1" cx="77" cy="84" r="1.6"/>' +
        '<circle class="bb a-bubble" style="--i:2" cx="69" cy="84" r="1.3"/>',
    },

    templo: {
      w: 96, h: 104, step: 92,
      svg:
        '<path class="n gs a-rays" d="' + rays(48, 13, 12, 19, 14) + '" stroke-width="1.6"/>' +
        '<rect x="2" y="96" width="92" height="8" fill="url(#tw-hd)"/>' +
        '<rect x="7" y="90" width="82" height="6"/>' +
        '<rect x="14" y="56" width="68" height="34"/>' +
        [17, 30, 44, 58, 71].map((x) => '<rect x="' + x + '" y="56" width="7" height="34" fill="url(#tw-v)"/>').join('') +
        '<rect x="10" y="50" width="76" height="6" fill="url(#tw-hd)"/>' +
        '<path d="M18 50a30 22 0 0 1 60 0z" fill="url(#tw-x)"/>' +
        '<path class="n" d="M48 28V23"/>' +
        '<circle class="g" cx="48" cy="13" r="10"/>' +
        face(40, 5, 16),
    },

    cidade: {
      w: 104, h: 128, step: 98,
      svg:
        '<rect x="4" y="54" width="26" height="74" fill="url(#tw-h)"/>' +
        windows(8, 60, 3, 7, 4, 5, 7, 9, 3) +
        '<path class="n" d="M48 12V2"/><circle class="r" cx="48" cy="2" r="2"/>' +
        '<rect x="32" y="12" width="32" height="116" fill="url(#tw-x)"/>' +
        windows(36, 42, 4, 9, 4, 6, 7, 9.5, 11) +
        '<rect class="board" x="35" y="16" width="26" height="20"/>' +
        '<image href="' + FACE + '" x="37" y="17.5" width="22" height="17" preserveAspectRatio="xMidYMid slice"/>' +
        '<rect class="n" x="35" y="16" width="26" height="20"/>' +
        '<rect x="66" y="38" width="22" height="90" fill="url(#tw-h)"/>' +
        windows(70, 44, 2, 9, 5, 6, 9, 9, 5) +
        '<rect x="88" y="78" width="14" height="50" fill="url(#tw-hd)"/>' +
        windows(91, 84, 2, 5, 3, 4, 5, 9, 8),
    },

    foguete: {
      w: 58, h: 124, step: 52,
      svg:
        '<rect x="2" y="114" width="54" height="10" fill="url(#tw-hd)"/>' +
        '<path class="n" d="M42 114V34M52 114V34M42 34H52M42 114L52 104L42 94L52 84L42 74L52 64L42 54L52 44L42 34M42 62H36" stroke-width="1"/>' +
        '<path class="n" d="M18 114L21 104M38 114L35 104"/>' +
        '<g class="a-rocket">' +
        '<path class="g a-flame" d="M23 104Q28 124 33 104Z"/>' +
        '<path class="r" d="M14 106L21 90V104Z"/><path class="r" d="M42 106L35 90V104Z"/>' +
        '<path d="M21 104V50Q21 36 28 26Q35 36 35 50V104Z" fill="url(#tw-h)"/>' +
        '<rect class="g" x="21" y="78" width="14" height="4"/>' +
        face(22.5, 52, 11) +
        '</g>',
    },

    portal: {
      w: 82, h: 100, step: 78,
      svg:
        '<path class="pt" d="M20 100V44a21 21 0 0 1 42 0V100Z"/>' +
        '<path class="n gs a-swirl" d="' + spiral(41, 62, 1, 19, 2.6, 0) + '" stroke-width="2"/>' +
        '<path class="n sw2 a-swirl s2" d="' + spiral(41, 62, 1, 16, 2, Math.PI) + '" stroke-width="1.4"/>' +
        '<path d="M6 100V42a35 35 0 0 1 70 0V100H62V44a21 21 0 0 0-42 0V100Z" fill="url(#tw-x)"/>' +
        '<path class="n" d="M6 70H20M62 70H76M6 86H20M62 86H76M12 24L23 32M70 24L59 32"/>' +
        '<path class="g" d="M35 7h12l-2.5 15h-7z"/>',
    },

    maquina: {
      w: 80, h: 96, step: 76,
      svg:
        '<g class="a-gear"><circle class="n" cx="8" cy="80" r="6" stroke-width="3.5" stroke-dasharray="2.4 2.2"/><circle cx="8" cy="80" r="3"/></g>' +
        '<rect x="14" y="44" width="52" height="52" fill="url(#tw-h)"/>' +
        '<rect class="w" x="24" y="56" width="32" height="30" rx="3"/>' +
        '<image class="ghost" href="' + FACE + '" x="28" y="58" width="24" height="26" preserveAspectRatio="xMidYMid slice"/>' +
        '<rect class="n" x="24" y="56" width="32" height="30" rx="3"/>' +
        '<path class="n" d="M14 44L8 37M66 44L72 37"/><circle class="g" cx="8" cy="36" r="2.4"/><circle class="g" cx="72" cy="36" r="2.4"/>' +
        '<circle cx="40" cy="24" r="20" stroke-width="2"/>' +
        '<path class="n" d="' + rays(40, 24, 16, 18.5, 12) + '"/>' +
        '<path class="n a-hand-h" d="M40 24V14" stroke-width="2.4"/>' +
        '<path class="n a-hand-m" d="M40 24V8" stroke-width="1.4"/>' +
        '<circle class="k" cx="40" cy="24" r="1.8"/>' +
        '<g class="a-gear s2"><circle class="n" cx="72" cy="86" r="5" stroke-width="3" stroke-dasharray="2 2"/><circle cx="72" cy="86" r="2.4"/></g>',
    },

    // Roubarverso: planetas no céu.
    multiverso: {
      w: 46, h: 46, step: 0,
      svg:
        '<path class="n gs" d="M4.4 27A19 6 -12 0 1 41.6 19" stroke-width="2"/>' +
        '<circle cx="23" cy="23" r="14"/>' +
        face(9, 9, 28) +
        '<circle class="n" cx="23" cy="23" r="14" fill="url(#tw-h)" opacity=".35"/>' +
        '<path class="n gs" d="M41.6 19A19 6 -12 0 1 4.4 27" stroke-width="2"/>',
    },

    // Clone do Roubar: boneco de terno com o rosto dele.
    clone: {
      w: 24, h: 46, step: 0,
      svg:
        '<g class="a-bob">' +
        '<path class="n a-leg" d="M10 33L9.5 45" stroke-width="2.4"/>' +
        '<path class="n a-leg l2" d="M14 33L14.5 45" stroke-width="2.4"/>' +
        '<path class="n" d="M6.5 24L3.5 33M17.5 24L20.5 33" stroke-width="2"/>' +
        '<path d="M5.5 34L7 22Q12 19.5 17 22L18.5 34Z" fill="url(#tw-hd)"/>' +
        '<path class="r" d="M12 22.5l-1.6 2 1.6 7 1.6-7z"/>' +
        face(2, 1, 20) +
        '</g>',
    },
  };

  // Hachuras e recorte redondo, usados por todos os desenhos.
  const DEFS =
    '<svg class="town-defs" aria-hidden="true" focusable="false"><defs>' +
    '<pattern id="tw-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<rect width="4" height="4" class="pw"/><line x1="0" y1="0" x2="0" y2="4" class="pl"/></pattern>' +
    '<pattern id="tw-hd" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">' +
    '<rect width="2.6" height="2.6" class="pw"/><line x1="0" y1="0" x2="0" y2="2.6" class="pl pd"/></pattern>' +
    '<pattern id="tw-x" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<rect width="4" height="4" class="pw"/><path d="M0 0V4M0 0H4" class="pl"/></pattern>' +
    '<pattern id="tw-v" width="3" height="3" patternUnits="userSpaceOnUse">' +
    '<rect width="3" height="3" class="pw"/><line x1="1.5" y1="0" x2="1.5" y2="3" class="pl"/></pattern>' +
    '<clipPath id="tw-round" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>' +
    '</defs></svg>';

  const SUN =
    '<svg class="sun" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path class="n" d="' + rays(24, 24, 14, 21, 16) + '"/>' +
    '<circle cx="24" cy="24" r="11" fill="url(#tw-h)"/></svg>';

  const MOON =
    '<svg class="moon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<path d="M30 8a16 16 0 1 0 10 28A13 13 0 1 1 30 8z" fill="url(#tw-h)"/></svg>';

  RC.TOWN_ART = ART;
  RC.TOWN_DEFS = DEFS;
  RC.TOWN_SUN = SUN;
  RC.TOWN_MOON = MOON;
})(typeof window !== 'undefined' ? window : globalThis);
