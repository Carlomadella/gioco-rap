/* Illustrazioni SVG delle azioni e delle scenette. */
"use strict";

/* ==================== INTERFACCIA ==================== */

/* punto 67: la schermata di gioco aveva un colore diverso per ognuna delle
   dodici mosse — un arcobaleno a confronto del menù, che tiene un'unica
   identità (nero e oro). Qui sotto le due tinte di ogni scena (il bordo
   della card e lo sfondo dietro al disegno, non il disegno stesso) sono
   raggruppate in quattro famiglie con un senso: viola per chi scrive e
   produce in studio, oro per chi fa muovere soldi e occasioni, ciano per il
   suono e il palco, verde per la vita fuori dalla musica. Dichiarate fuori
   dalla IIFE qui sotto: le usa anche ART in ui.js, per i toast. */
const TINTA_STUDIO = ["#8B5CF6","#1D1030"];
const TINTA_HUSTLE = ["#FFB020","#241A08"];
const TINTA_SUONO  = ["#3DC7FF","#0E2033"];
const TINTA_VITA   = ["#57C98B","#0E1F17"];

const SC = (() => {
/* ---- mattoni comuni delle scenette: tutto disegnato, niente icone piatte ---- */
const cielo = (a,b) => '<rect width="200" height="128" fill="url(#sk)"/>' +
  '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'"/>' +
  '<stop offset="1" stop-color="'+b+'"/></linearGradient></defs>';
const vign = '<rect width="200" height="128" fill="url(#vg)"/>';
const grana = '<rect width="200" height="128" filter="url(#grn)" opacity=".16"/>';
const skyline = (y,c,o) => {
  let d = "M0," + y;
  let x = 0;
  const alt = [16,26,10,32,20,38,14,28,18,34,12];
  let i = 0;
  while(x < 200){ const w = 14 + (i%3)*7; const h = alt[i % alt.length];
    d += " L" + x + "," + (y-h) + " L" + (x+w) + "," + (y-h); x += w; i++; }
  d += " L200," + y + " Z";
  return '<path d="' + d + '" fill="' + c + '" opacity="' + o + '"/>';
};
const finestre = (y,c) => {
  let g = '<g fill="' + c + '" opacity=".75">';
  for(let i=0;i<14;i++){ const x = 6 + i*14 + (i%2)*4, yy = y - 8 - (i%4)*9;
    g += '<rect x="' + x + '" y="' + yy + '" width="4" height="5"/>'; }
  return g + '</g>';
};
/* figura umana stilizzata di lato o di fronte */
const figura = (x,y,sc,col,skin,braccio) => '<g transform="translate(' + x + ',' + y + ') scale(' + sc + ')">' +
  '<ellipse cx="0" cy="1" rx="13" ry="3.4" fill="#000" opacity=".45"/>' +
  '<path d="M-6,-30 L-8,-2 L-2,-2 L-1,-30 Z" fill="#14161C"/>' +
  '<path d="M6,-30 L8,-2 L2,-2 L1,-30 Z" fill="#1B1E26"/>' +
  '<path d="M-10,-28 C-11,-44 -9,-52 -6,-55 L6,-55 C9,-52 11,-44 10,-28 Z" fill="' + col + '"/>' +
  (braccio === "alto"
    ? '<path d="M9,-53 C15,-51 17,-62 15,-69 L11,-68 C12,-63 10,-58 6,-57 Z" fill="' + col + '"/>' +
      '<circle cx="13" cy="-70" r="2.4" fill="' + skin + '"/>'
    : '<path d="M9,-52 C14,-48 15,-40 14,-33 L10,-33 C11,-40 10,-45 6,-48 Z" fill="' + col + '"/>' +
      '<circle cx="12" cy="-32" r="2.4" fill="' + skin + '"/>') +
  '<rect x="-2" y="-58" width="4" height="5" fill="' + skin + '"/>' +
  '<ellipse cx="0" cy="-64" rx="7" ry="7.6" fill="' + skin + '"/>' +
  '<path d="M-7,-65 C-7,-73 -3,-76 0,-76 C3,-76 7,-73 7,-65 C5,-70 -5,-70 -7,-65 Z" fill="#100D0C"/>' +
  '</g>';

const S = {};

/* SCRIVI BARRE — la stanza, il tavolo, la lampada */
S.scrivi = [...TINTA_STUDIO,
  cielo("#2A1B3D","#140E1E") +
  '<rect x="112" y="14" width="74" height="52" rx="3" fill="#0B0A14"/>' +
  '<rect x="116" y="18" width="66" height="44" fill="#191233"/>' +
  skyline(62,"#0A0812",".95").replace('width="200"','') +
  finestre(60,"#FFC96B") +
  '<rect x="112" y="14" width="74" height="52" rx="3" fill="none" stroke="#2B2438" stroke-width="3"/>' +
  '<path d="M114,40 L184,40 M148,16 L148,64" stroke="#2B2438" stroke-width="2.5"/>' +
  '<path d="M18,30 L34,30 L30,46 L22,46 Z" fill="#3B3348"/>' +
  '<rect x="24" y="46" width="4" height="26" fill="#2A2436"/>' +
  '<path d="M6,120 L46,52 L86,120 Z" fill="#FFD98A" opacity=".16"/>' +
  '<rect x="0" y="86" width="200" height="10" fill="#241C33"/>' +
  '<rect x="0" y="96" width="200" height="32" fill="#171125"/>' +
  '<rect x="14" y="74" width="66" height="12" rx="2" fill="#F2E9D8"/>' +
  '<g stroke="#B9AE9A" stroke-width="1.6"><path d="M22,78 h48M22,82 h34"/></g>' +
  figura(126,86,1.02,"#2B3242","#D8A87C","alto") +
  '<rect width="200" height="128" fill="url(#vg)"/>' + grana];

/* CERCA UN BEAT — il produttore, il laptop, i monitor */
S.beat = [...TINTA_SUONO,
  cielo("#1B1440","#0C0A1C") +
  '<rect x="0" y="88" width="200" height="40" fill="#141026"/>' +
  '<rect x="0" y="84" width="200" height="5" fill="#221B3E"/>' +
  '<rect x="10" y="40" width="30" height="46" rx="3" fill="#0E0C1A"/>' +
  '<circle cx="25" cy="56" r="9" fill="#1B1730"/><circle cx="25" cy="56" r="4" fill="#3DC7FF" opacity=".55"/>' +
  '<circle cx="25" cy="76" r="4.5" fill="#1B1730"/>' +
  '<rect x="160" y="40" width="30" height="46" rx="3" fill="#0E0C1A"/>' +
  '<circle cx="175" cy="56" r="9" fill="#1B1730"/><circle cx="175" cy="56" r="4" fill="#3DC7FF" opacity=".55"/>' +
  '<circle cx="175" cy="76" r="4.5" fill="#1B1730"/>' +
  '<path d="M74,84 L126,84 L132,58 L68,58 Z" fill="#191532"/>' +
  '<rect x="72" y="34" width="56" height="26" rx="2" fill="#0A0918"/>' +
  '<rect x="75" y="37" width="50" height="20" fill="#12224A"/>' +
  '<g stroke="#54E0FF" stroke-width="1.6" fill="none" opacity=".9">' +
    '<path d="M78,47 l4,-7 l4,12 l4,-9 l4,6 l4,-11 l4,14 l4,-8 l4,5 l4,-6 l4,9 l4,-4"/></g>' +
  '<ellipse cx="100" cy="30" rx="66" ry="26" fill="#3DC7FF" opacity=".10"/>' +
  figura(100,88,0.92,"#2E2748","#B0774A") +
  vign + grana];

/* REGISTRA — la cabina, il microfono, la luce rossa */
S.registra = [...TINTA_STUDIO,
  cielo("#2E1119","#120609") +
  '<rect x="0" y="0" width="200" height="128" fill="#170A10"/>' +
  '<rect x="8" y="8" width="184" height="112" rx="4" fill="#1F0E15"/>' +
  '<g fill="#2A141C">' +
    '<path d="M8,8 l24,0 l-24,24 z"/><path d="M192,8 l-24,0 l24,24 z"/>' +
    '<path d="M8,120 l24,0 l-24,-24 z"/><path d="M192,120 l-24,0 l24,-24 z"/></g>' +
  '<circle cx="100" cy="10" r="26" fill="#FF3B30" opacity=".22"/>' +
  '<rect x="86" y="4" width="28" height="10" rx="3" fill="#7A1710"/>' +
  '<rect x="88" y="6" width="24" height="6" rx="2" fill="#FF4436"/>' +
  '<ellipse cx="100" cy="118" rx="70" ry="18" fill="#FF7A5C" opacity=".12"/>' +
  '<rect x="96" y="98" width="8" height="24" fill="#25272E"/>' +
  '<rect x="80" y="120" width="40" height="5" rx="2.5" fill="#2E313A"/>' +
  '<path d="M92,46 h16 v34 h-16 z" fill="#3A3F4B"/>' +
  '<rect x="88" y="34" width="24" height="26" rx="12" fill="#5A6270"/>' +
  '<rect x="91" y="37" width="18" height="20" rx="9" fill="#2A2E38"/>' +
  '<g stroke="#767E8E" stroke-width="1.2"><path d="M91,41 h18M91,45 h18M91,49 h18M91,53 h18"/></g>' +
  '<ellipse cx="128" cy="47" rx="9" ry="16" fill="#9AA3B4" opacity=".22"/>' +
  '<path d="M120,31 v32" stroke="#4B5160" stroke-width="2"/>' +
  vign + grana];

/* MIXA — il banco, i fader, i led */
S.mixa = [...TINTA_STUDIO,
  cielo("#2A1030","#100613") +
  '<ellipse cx="100" cy="24" rx="80" ry="30" fill="#FF4D9D" opacity=".13"/>' +
  '<rect x="0" y="52" width="200" height="76" fill="#171021"/>' +
  '<path d="M0,52 L200,52 L200,60 L0,66 Z" fill="#221630"/>' +
  '<rect x="16" y="16" width="72" height="30" rx="3" fill="#0C0912"/>' +
  '<rect x="19" y="19" width="66" height="24" fill="#150E22"/>' +
  '<g fill="#FF4D9D" opacity=".85">' +
    '<rect x="22" y="33" width="4" height="8"/><rect x="28" y="27" width="4" height="14"/>' +
    '<rect x="34" y="30" width="4" height="11"/><rect x="40" y="22" width="4" height="19"/>' +
    '<rect x="46" y="28" width="4" height="13"/><rect x="52" y="34" width="4" height="7"/>' +
    '<rect x="58" y="25" width="4" height="16"/><rect x="64" y="31" width="4" height="10"/>' +
    '<rect x="70" y="27" width="4" height="14"/><rect x="76" y="35" width="4" height="6"/></g>' +
  '<rect x="104" y="16" width="80" height="30" rx="3" fill="#0C0912"/>' +
  '<g fill="#57C98B" opacity=".8"><circle cx="116" cy="26" r="3"/><circle cx="128" cy="26" r="3"/>' +
    '<circle cx="140" cy="26" r="3" fill="#FFC53D"/><circle cx="152" cy="26" r="3" fill="#FFC53D"/>' +
    '<circle cx="164" cy="26" r="3" fill="#FF5A36"/><circle cx="176" cy="26" r="3" fill="#3A2028"/></g>' +
  '<g stroke="#2E2440" stroke-width="1.4"><path d="M116,36 h60"/></g>' +
  '<g>' +
    '<g stroke="#0B0812" stroke-width="3">' +
      '<path d="M24,68 v46M46,68 v46M68,68 v46M90,68 v46M112,68 v46M134,68 v46M156,68 v46M178,68 v46"/></g>' +
    '<g fill="#E8E8F0">' +
      '<rect x="18" y="94" width="12" height="7" rx="2"/><rect x="40" y="76" width="12" height="7" rx="2"/>' +
      '<rect x="62" y="88" width="12" height="7" rx="2"/><rect x="84" y="70" width="12" height="7" rx="2"/>' +
      '<rect x="106" y="99" width="12" height="7" rx="2"/><rect x="128" y="80" width="12" height="7" rx="2"/>' +
      '<rect x="150" y="92" width="12" height="7" rx="2"/><rect x="172" y="74" width="12" height="7" rx="2"/></g>' +
  '</g>' +
  vign + grana];

/* PUBBLICA — il telefono, la copertina che esce, le notifiche */
S.pubblica = [...TINTA_STUDIO,
  cielo("#2A0F4A","#0E0620") +
  '<ellipse cx="100" cy="70" rx="74" ry="52" fill="#B026FF" opacity=".16"/>' +
  '<g opacity=".55" fill="#D9A6FF">' +
    '<circle cx="34" cy="26" r="3"/><circle cx="52" cy="14" r="2"/><circle cx="164" cy="22" r="3"/>' +
    '<circle cx="146" cy="12" r="2"/><circle cx="24" cy="60" r="2"/><circle cx="176" cy="58" r="2.4"/></g>' +
  '<rect x="72" y="16" width="56" height="104" rx="10" fill="#0A0814"/>' +
  '<rect x="76" y="20" width="48" height="96" rx="7" fill="#150E28"/>' +
  '<rect x="90" y="17" width="20" height="4" rx="2" fill="#0A0814"/>' +
  '<rect x="82" y="30" width="36" height="36" rx="4" fill="#FF5A36"/>' +
  '<path d="M82,52 L118,36 L118,66 L82,66 Z" fill="#B026FF" opacity=".9"/>' +
  '<rect x="82" y="72" width="26" height="4" rx="2" fill="#3B3350"/>' +
  '<rect x="82" y="80" width="18" height="3" rx="1.5" fill="#2B2440"/>' +
  '<g fill="#fff" opacity=".9"><circle cx="88" cy="98" r="5"/><path d="M86,95.5 l5,2.5 l-5,2.5 z" fill="#150E28"/></g>' +
  '<rect x="98" y="95" width="20" height="3" rx="1.5" fill="#3B3350"/>' +
  '<rect x="98" y="101" width="14" height="3" rx="1.5" fill="#2B2440"/>' +
  '<g fill="#FF4D9D"><path d="M34,84 c0-5 7-7 7-2 0-5 7-3 7 2 0 6-7 11-7 11s-7-5-7-11z" opacity=".9"/>' +
    '<path d="M152,94 c0-4 5-5 5-1.5 0-4 5-2 5 1.5 0 4.5-5 8-5 8s-5-3.5-5-8z" opacity=".7"/></g>' +
  vign + grana];

/* PROMO — la ring light, il telefono, i cuori che salgono */
S.promo = [...TINTA_HUSTLE,
  cielo("#15325C","#08111F") +
  '<circle cx="100" cy="52" r="40" fill="none" stroke="#EAF6FF" stroke-width="7" opacity=".92"/>' +
  '<circle cx="100" cy="52" r="40" fill="#9FE0FF" opacity=".10"/>' +
  '<rect x="97" y="92" width="6" height="30" fill="#2A3346"/>' +
  '<rect x="84" y="120" width="32" height="5" rx="2.5" fill="#333C50"/>' +
  '<rect x="86" y="34" width="28" height="48" rx="5" fill="#0B1220"/>' +
  '<rect x="89" y="37" width="22" height="42" rx="3" fill="#16243D"/>' +
  figura(46,116,0.86,"#2C3A52","#C68A5C","alto") +
  '<g fill="#FF4D9D" opacity=".9">' +
    '<path d="M150,86 c0-4 5-5 5-1.5 0-4 5-2 5 1.5 0 4.5-5 8-5 8s-5-3.5-5-8z"/>' +
    '<path d="M164,62 c0-3 4-4 4-1 0-3 4-1.5 4 1 0 3.5-4 6.5-4 6.5s-4-3-4-6.5z" opacity=".75"/>' +
    '<path d="M142,46 c0-2.5 3.4-3.4 3.4-.9 0-2.5 3.4-1.2 3.4.9 0 3-3.4 5.5-3.4 5.5s-3.4-2.5-3.4-5.5z" opacity=".55"/></g>' +
  vign + grana];

/* FREESTYLE — la piazza in miniatura */
S.free = [...TINTA_SUONO,
  cielo("#241A33","#0D0A14") +
  '<path d="M171,14 A9,9 0 1 0 171,30 A7,7 0 1 1 171,14 Z" fill="#F3EAD3" opacity=".85"/>' +
  skyline(72,"#0B0A11","1") +
  finestre(70,"#FFC96B") +
  '<rect x="0" y="72" width="200" height="56" fill="#141220"/>' +
  '<path d="M0,72 L200,72 L200,76 L0,76 Z" fill="#000" opacity=".45"/>' +
  '<path d="M40,44 L26,124 L64,124 Z" fill="#FFD98A" opacity=".13"/>' +
  '<path d="M24,124 L24,42 L40,42" stroke="#08080C" stroke-width="3" fill="none"/>' +
  '<circle cx="40" cy="44" r="3" fill="#FFE7B4"/>' +
  figura(104,108,1.0,"#33384A","#E8B991","alto") +
  figura(60,116,0.62,"#232733","#C68A5C") +
  figura(150,114,0.66,"#2A2E3A","#9A6238") +
  figura(176,104,0.5,"#232733","#F2CBA8") +
  vign + grana];

/* LIVE — il palco, i fari, le mani */
S.live = [...TINTA_SUONO,
  cielo("#2B0C3A","#0C0412") +
  '<path d="M54,0 L28,120 L86,120 Z" fill="#FF4D9D" opacity=".16"/>' +
  '<path d="M146,0 L114,120 L172,120 Z" fill="#3DC7FF" opacity=".14"/>' +
  '<rect x="0" y="96" width="200" height="32" fill="#0C0812"/>' +
  '<rect x="18" y="88" width="164" height="10" rx="2" fill="#1A1424"/>' +
  '<rect x="18" y="86" width="164" height="4" rx="2" fill="#2A2036"/>' +
  figura(100,88,1.06,"#3A2540","#DDA679","alto") +
  '<g fill="#0A0810">' +
    '<circle cx="16" cy="118" r="9"/><circle cx="40" cy="122" r="10"/><circle cx="66" cy="119" r="9"/>' +
    '<circle cx="134" cy="120" r="10"/><circle cx="160" cy="118" r="9"/><circle cx="184" cy="122" r="10"/></g>' +
  '<g stroke="#0A0810" stroke-width="4" stroke-linecap="round">' +
    '<path d="M28,116 v-14M52,118 v-18M78,114 v-12M124,116 v-16M150,113 v-13M174,117 v-15"/></g>' +
  vign + grana];

/* TURNO — il magazzino, i bancali, la luce fredda */
S.turno = [...TINTA_HUSTLE,
  cielo("#16241F","#080D0B") +
  '<rect x="0" y="92" width="200" height="36" fill="#101815"/>' +
  '<path d="M0,92 L200,92 L200,96 L0,96 Z" fill="#000" opacity=".4"/>' +
  '<g fill="#1E2A24">' +
    '<rect x="8" y="52" width="44" height="40"/><rect x="8" y="30" width="44" height="20"/>' +
    '<rect x="150" y="46" width="44" height="46"/><rect x="150" y="24" width="44" height="20"/></g>' +
  '<g fill="#C98A4B" opacity=".9">' +
    '<rect x="14" y="58" width="15" height="13"/><rect x="32" y="58" width="15" height="13"/>' +
    '<rect x="14" y="74" width="15" height="13"/><rect x="32" y="74" width="15" height="13"/>' +
    '<rect x="156" y="52" width="15" height="13"/><rect x="174" y="52" width="15" height="13"/>' +
    '<rect x="156" y="68" width="15" height="13"/><rect x="174" y="68" width="15" height="13"/></g>' +
  '<g stroke="#0A100D" stroke-width="1.4">' +
    '<path d="M14,64 h15M32,64 h15M14,80 h15M32,80 h15M156,58 h15M174,58 h15M156,74 h15M174,74 h15"/></g>' +
  '<rect x="86" y="10" width="28" height="5" rx="2" fill="#2B3B34"/>' +
  '<path d="M78,15 L122,15 L134,60 L66,60 Z" fill="#DFF6EA" opacity=".10"/>' +
  figura(100,92,0.96,"#3E4F47","#B0774A") +
  vign + grana];

/* CERCA LAVORO — la bacheca, gli annunci */
S.cercalavoro = [...TINTA_HUSTLE,
  cielo("#2A2113","#100C06") +
  '<rect x="0" y="96" width="200" height="32" fill="#171208"/>' +
  '<rect x="26" y="14" width="148" height="76" rx="3" fill="#3B2B18"/>' +
  '<rect x="30" y="18" width="140" height="68" fill="#5A452A"/>' +
  '<g fill="#EFE6D2">' +
    '<rect x="38" y="26" width="30" height="22" transform="rotate(-3 53 37)"/>' +
    '<rect x="78" y="24" width="34" height="26" transform="rotate(2 95 37)"/>' +
    '<rect x="124" y="28" width="30" height="20" transform="rotate(-2 139 38)"/>' +
    '<rect x="44" y="56" width="34" height="22" transform="rotate(2 61 67)"/>' +
    '<rect x="92" y="58" width="30" height="20" transform="rotate(-3 107 68)"/>' +
    '<rect x="132" y="56" width="28" height="24" transform="rotate(3 146 68)"/></g>' +
  '<g stroke="#A79A84" stroke-width="1.3">' +
    '<path d="M42,32 h20M42,36 h14M84,30 h24M84,35 h18M84,40 h12M130,34 h20M130,39 h12' +
      'M50,62 h22M50,67 h16M98,64 h18M98,69 h12M138,62 h16M138,67 h18"/></g>' +
  '<g fill="#FF5A36"><circle cx="53" cy="26" r="2.4"/><circle cx="95" cy="24" r="2.4"/>' +
    '<circle cx="139" cy="28" r="2.4"/><circle cx="61" cy="56" r="2.4"/><circle cx="107" cy="58" r="2.4"/></g>' +
  figura(168,124,0.78,"#2E2A22","#82502D") +
  vign + grana];

/* STACCA — il divano, la tv accesa, la notte fuori */
S.stacca = [...TINTA_VITA,
  cielo("#1B1838","#0A0916") +
  '<rect x="0" y="88" width="200" height="40" fill="#151329"/>' +
  '<rect x="0" y="84" width="200" height="5" fill="#221E42"/>' +
  '<rect x="12" y="20" width="58" height="42" rx="3" fill="#0A0918"/>' +
  '<rect x="16" y="24" width="50" height="34" fill="#2B4E7A"/>' +
  '<path d="M16,58 L66,24 L66,58 Z" fill="#3E6EA8" opacity=".7"/>' +
  '<path d="M70,10 L142,44 L70,78 Z" fill="#9FD8FF" opacity=".10"/>' +
  '<rect x="112" y="46" width="76" height="30" rx="6" fill="#2B2450"/>' +
  '<rect x="106" y="56" width="12" height="26" rx="5" fill="#221C42"/>' +
  '<rect x="182" y="56" width="12" height="26" rx="5" fill="#221C42"/>' +
  '<rect x="116" y="60" width="30" height="18" rx="4" fill="#3A3168"/>' +
  '<rect x="150" y="60" width="30" height="18" rx="4" fill="#3A3168"/>' +
  '<circle cx="140" cy="46" r="11" fill="#DDA679"/>' +
  '<path d="M130,47 C130,39 134,36 140,36 C146,36 150,39 150,47 C147,42 133,42 130,47 Z" fill="#100D0C"/>' +
  '<path d="M124,60 C124,52 132,50 140,50 C148,50 156,52 156,60 Z" fill="#4A3F7A"/>' +
  '<g fill="#FFC53D" opacity=".8"><circle cx="86" cy="34" r="1.6"/><circle cx="94" cy="26" r="1.2"/>' +
    '<circle cx="100" cy="38" r="1.4"/></g>' +
  vign + grana];

/* PALESTRA — i pesi, lo specchio, la luce dura */
S.palestra = [...TINTA_VITA,
  cielo("#16241C","#080D0A") +
  '<rect x="0" y="94" width="200" height="34" fill="#101815"/>' +
  '<rect x="20" y="10" width="70" height="84" rx="2" fill="#0C1410"/>' +
  '<rect x="24" y="14" width="62" height="76" fill="#1A2A22"/>' +
  '<path d="M24,90 L86,14" stroke="#2E4438" stroke-width="2" opacity=".6"/>' +
  figura(56,90,0.7,"#22322A","#B0774A") +
  '<rect x="116" y="70" width="70" height="8" rx="4" fill="#1B2620"/>' +
  '<circle cx="120" cy="74" r="13" fill="#0C1410"/><circle cx="182" cy="74" r="13" fill="#0C1410"/>' +
  '<circle cx="120" cy="74" r="7" fill="#232E28"/><circle cx="182" cy="74" r="7" fill="#232E28"/>' +
  '<rect x="108" y="34" width="6" height="46" rx="3" fill="#2E4438"/>' +
  '<rect x="98" y="30" width="26" height="8" rx="4" fill="#3E5A48"/>' +
  '<g fill="#57C98B" opacity=".16"><circle cx="150" cy="26" r="30"/></g>' +
  vign + grana];
/* punto 9: due mosse (pesi/cardio), stessa palestra — stesso disegno */
S.palestra_pesi = S.palestra;
S.palestra_cardio = S.palestra;

return S;
})();


