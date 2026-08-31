/* La città di provincia vista dall'alto, di notte: il fondale dell'hub.

   È disegnata, non fotografata — stesso metodo delle copertine e delle scene:
   un seme, e da lì colline, isolati, finestre accese, strade e lampioni.
   Il seme è fisso, così la tua città è sempre quella e non cambia faccia a
   ogni schermata. Passandone uno diverso esce un'altra provincia. */
"use strict";

const CITTA_SEME = 20260831;

/* generatore ripetibile: stesso seme, stessa città */
function semeRnd(s){
  let a = (s >>> 0) || 1;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- */
function arteCitta(seme){
  const R = semeRnd(seme || CITTA_SEME);
  const rr = (a, b) => a + R() * (b - a);
  const cap = (v, a, b) => Math.max(a, Math.min(b, v));
  const n1 = v => Math.round(v * 10) / 10;

  const W = 1000, H = 720, ORIZZ = 236;

  /* ---- la strada grande: entra in fondo a destra ed esce in basso a sinistra,
     allargandosi man mano che si avvicina. Tutto il paese le sta intorno. ---- */
  const t = y => cap((y - ORIZZ) / (H + 90 - ORIZZ), 0, 1);
  const stX = y => 654 - 392 * Math.pow(t(y), 1.18);          /* centro corsia */
  const stW = y => 11 + 132 * Math.pow(t(y), 1.55);           /* larghezza */
  /* la traversa che taglia il paese: una fascia orizzontale in mezzo */
  const TRAV_Y = 512, TRAV_H = 34;

  let s = "";

  /* ================= CIELO ================= */
  s += '<defs>' +
    '<linearGradient id="ci-cielo" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#191430"/><stop offset=".45" stop-color="#2A1E3E"/>' +
      '<stop offset=".82" stop-color="#4A2B44"/><stop offset="1" stop-color="#6B3B45"/></linearGradient>' +
    '<linearGradient id="ci-colle" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#221A33"/><stop offset="1" stop-color="#140F21"/></linearGradient>' +
    '<linearGradient id="ci-asf" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#221D2E"/><stop offset="1" stop-color="#3A3145"/></linearGradient>' +
    '<radialGradient id="ci-lamp" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#FFD79A" stop-opacity=".95"/>' +
      '<stop offset=".45" stop-color="#FFB25E" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ci-alone" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#FFB765" stop-opacity=".30"/>' +
      '<stop offset="1" stop-color="#FFB765" stop-opacity="0"/></radialGradient>' +
    /* la foschia calda che sta sopra ai lampioni del centro */
    '<linearGradient id="ci-caldo" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FFA34A" stop-opacity="0"/>' +
      '<stop offset=".42" stop-color="#FF9A3C" stop-opacity=".16"/>' +
      '<stop offset="1" stop-color="#FF7A2E" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="ci-grade" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2B1E52" stop-opacity=".45"/>' +
      '<stop offset=".52" stop-color="#170F24" stop-opacity=".08"/>' +
      '<stop offset="1" stop-color="#07060C" stop-opacity=".52"/></linearGradient>' +
    '<radialGradient id="ci-vig" cx="50%" cy="46%" r="72%">' +
      '<stop offset="55%" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".5"/></radialGradient>' +
    '</defs>';

  s += '<rect width="' + W + '" height="' + (ORIZZ + 40) + '" fill="url(#ci-cielo)"/>';

  /* stelle: poche, solo in alto dove il cielo è ancora scuro */
  for(let i = 0; i < 46; i++){
    const x = n1(rr(0, W)), y = n1(rr(4, 150));
    s += '<circle cx="' + x + '" cy="' + y + '" r="' + n1(rr(.5, 1.3)) +
      '" fill="#EDE6FF" opacity="' + n1(rr(.18, .6)) + '"/>';
  }
  /* nuvole basse, lunghe, appoggiate all'orizzonte */
  for(let i = 0; i < 9; i++){
    const y = n1(rr(56, 210)), x = n1(rr(-60, W + 60));
    const rx = n1(rr(90, 250)), ry = n1(rr(9, 22));
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry +
      '" fill="#6B4E74" opacity="' + n1(rr(.10, .26)) + '"/>';
  }

  /* ================= COLLINE ================= */
  const colle = (base, amp, tinta, op) => {
    let p = "M-20," + base;
    for(let x = -20; x <= W + 20; x += 40)
      p += " L" + x + "," + n1(base - amp * (0.45 + 0.55 * Math.sin(x / 150 + R() * 0.6)) - rr(0, amp * .25));
    p += " L" + (W + 20) + "," + (ORIZZ + 60) + " L-20," + (ORIZZ + 60) + " Z";
    return '<path d="' + p + '" fill="' + tinta + '" opacity="' + op + '"/>';
  };
  s += colle(ORIZZ - 34, 54, "#3B2B4E", .55);
  s += colle(ORIZZ - 12, 40, "url(#ci-colle)", 1);

  /* le luci del paese di là dalla valle: puntini caldi sulla linea dell'orizzonte */
  for(let i = 0; i < 130; i++){
    const x = n1(rr(0, W)), y = n1(rr(ORIZZ - 26, ORIZZ + 8));
    s += '<rect x="' + x + '" y="' + y + '" width="1.6" height="1.4" fill="' +
      (R() < .22 ? "#BFD8FF" : "#FFC98A") + '" opacity="' + n1(rr(.25, .85)) + '"/>';
  }
  /* alone caldo sopra il centro abitato */
  s += '<ellipse cx="520" cy="' + (ORIZZ + 6) + '" rx="420" ry="86" fill="url(#ci-alone)"/>';

  /* ================= STRADE ================= */
  /* asfalto: un nastro che si allarga, disegnato per fasce */
  let sx = "", dx = "";
  for(let y = ORIZZ - 6; y <= H + 90; y += 12){
    sx += (sx ? " L" : "M") + n1(stX(y) - stW(y) / 2) + "," + y;
    dx = " L" + n1(stX(y) + stW(y) / 2) + "," + y + dx;
  }
  s += '<path d="' + sx + dx + ' Z" fill="url(#ci-asf)"/>';
  /* la traversa */
  s += '<path d="M-20,' + TRAV_Y + ' L' + (W + 20) + ',' + (TRAV_Y - 16) +
    ' L' + (W + 20) + ',' + (TRAV_Y - 16 + TRAV_H) + ' L-20,' + (TRAV_Y + TRAV_H + 6) + ' Z" fill="#1F1A29"/>';
  /* righe di mezzeria: tratteggio che si allunga avvicinandosi */
  for(let y = ORIZZ + 30; y < H + 60; y += 26 + t(y) * 40){
    const l = 8 + t(y) * 26;
    s += '<rect x="' + n1(stX(y) - stW(y) * .035) + '" y="' + n1(y) + '" width="' +
      n1(1.4 + t(y) * 4) + '" height="' + n1(l) + '" fill="#E8D9A8" opacity="' + n1(.18 + t(y) * .3) + '"/>';
  }

  /* ================= IL PAESE ================= */
  /* Nove fasce, dalla più lontana alla più vicina: dentro ogni fascia gli
     edifici stanno in fila e si saltano dove passa la strada. Le finestre
     accese sono la cosa che fa il paese vivo, quindi non sono tutte uguali:
     qualche televisore azzurro in mezzo al giallo delle cucine. */
  const casette = [];
  for(let r = 0; r < 13; r++){
    const q = r / 12;
    /* le fasce si allargano piano: con una curva più ripida il davanti
       restava vuoto, e un paese con un buco davanti non è un paese */
    const y0r = ORIZZ + 14 + Math.pow(q, 1.12) * 510;
    const sc = .28 + q * 1.30;
    /* il centro del paese è il più acceso, ma sotto casa la luce non finisce:
       le finestre vicine restano calde, se no il davanti diventa un muro nero */
    const luce = cap(1 - Math.abs(q - .48) * .95, .42, 1);
    for(let x = -70; x < W + 70; ){
      /* due tipi di edificio: la palazzina alta e stretta, e il capannone
         basso e largo del bordo paese. Mischiati fanno un paese, in fila
         fanno una scacchiera. */
      const alta = R() < .46;
      const w = n1((alta ? rr(26, 52) : rr(52, 108)) * sc);
      const h = n1((alta ? rr(34, 74) : rr(16, 34)) * sc);
      const y = y0r + rr(-7, 7) * sc;
      const cx = x + w / 2;
      const sopra = Math.abs(cx - stX(y)) < stW(y) / 2 + 16 * sc;
      const traversa = y > TRAV_Y - 18 && y < TRAV_Y + TRAV_H + 2;
      if(!sopra && !traversa)
        casette.push({x:x, y:y, w:w, h:h, sc:sc, luce:luce, alta:alta, r:R(), c:R()});
      x += w + rr(4, 22) * sc;
    }
  }
  casette.sort((a, b) => a.y - b.y);

  for(const c of casette){
    const p = c.luce;
    const base = 23 + p * 26;                              /* quanto è chiara la facciata */
    /* intonaco di paese: qualche facciata tira al caldo, qualcuna al freddo */
    const caldo = c.c < .55;
    const f = "rgb(" + Math.round(base + (caldo ? 16 : 6)) + "," + Math.round(base + (caldo ? 9 : 7)) +
      "," + Math.round(base + (caldo ? 6 : 20)) + ")";
    const lato = "rgb(" + Math.round(base * .5) + "," + Math.round(base * .48) + "," + Math.round(base * .66) + ")";
    /* i tetti presi dall'alto sono la cosa che si vede di più: coppi scuri,
       lamiera dove ci sono i capannoni */
    const tetto = c.alta
      ? "rgb(" + Math.round(base * 1.15 + 14) + "," + Math.round(base * .82 + 8) + "," + Math.round(base * .78 + 10) + ")"
      : "rgb(" + Math.round(base * .95 + 8) + "," + Math.round(base * .95 + 9) + "," + Math.round(base * 1.05 + 16) + ")";
    const x0 = n1(c.x), y0 = n1(c.y - c.h), w = c.w, h = c.h;
    /* più si viene avanti più il tetto si vede: è una veduta dall'alto */
    const dx2 = n1((c.alta ? 10 : 16) * c.sc), dy2 = n1((c.alta ? 8 : 12) * c.sc);

    s += '<g>' +
      '<polygon points="' + x0 + ',' + y0 + ' ' + n1(x0 + dx2) + ',' + n1(y0 - dy2) + ' ' +
        n1(x0 + w + dx2) + ',' + n1(y0 - dy2) + ' ' + n1(x0 + w) + ',' + y0 + '" fill="' + tetto + '"/>' +
      '<polygon points="' + n1(x0 + w) + ',' + y0 + ' ' + n1(x0 + w + dx2) + ',' + n1(y0 - dy2) + ' ' +
        n1(x0 + w + dx2) + ',' + n1(y0 + h - dy2) + ' ' + n1(x0 + w) + ',' + n1(y0 + h) + '" fill="' + lato + '"/>' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + n1(h) + '" fill="' + f + '"/>';

    /* finestre */
    const passo = 7.5 * c.sc;
    if(passo > 3){
      const col = Math.max(1, Math.floor((w - 4 * c.sc) / passo));
      const rig = Math.max(1, Math.floor((h - 5 * c.sc) / passo));
      const fw = n1(passo * .46), fh = n1(passo * .5);
      for(let i = 0; i < col; i++) for(let j = 0; j < rig; j++){
        const on = R() < .40 + p * .30;
        if(!on && R() < .5) continue;
        const fx = n1(x0 + 3 * c.sc + i * passo), fy = n1(y0 + 4 * c.sc + j * passo);
        const tin = !on ? "#0E0C15" : R() < .14 ? "#9FD0FF" : R() < .5 ? "#FFD79A" : "#FFB255";
        s += '<rect x="' + fx + '" y="' + fy + '" width="' + fw + '" height="' + fh +
          '" fill="' + tin + '" opacity="' + (on ? n1(rr(.62, 1)) : .9) + '"/>';
      }
      /* un alone caldo per edificio, invece di uno per finestra: la luce si
         vede lo stesso e il disegno resta leggero */
      if(c.sc > .7 && p > .6)
        s += '<ellipse cx="' + n1(x0 + w / 2) + '" cy="' + n1(y0 + h * .6) + '" rx="' + n1(w * .9) +
          '" ry="' + n1(h * .8) + '" fill="url(#ci-alone)" opacity="' + n1(rr(.3, .7)) + '"/>';
    }
    /* roba sul tetto: cisterne, antenne, uno scatolone del condizionatore */
    if(c.sc > .8 && c.r < .5){
      const rx = n1(x0 + w * rr(.15, .7)), ry = n1(y0 - dy2);
      if(c.r < .22) s += '<rect x="' + rx + '" y="' + n1(ry - 7 * c.sc) + '" width="' + n1(7 * c.sc) +
        '" height="' + n1(7 * c.sc) + '" fill="' + lato + '"/>';
      else s += '<rect x="' + rx + '" y="' + n1(ry - 12 * c.sc) + '" width="1.6" height="' +
        n1(12 * c.sc) + '" fill="#3A3346"/><circle cx="' + n1(rx + .8) + '" cy="' + n1(ry - 12 * c.sc) +
        '" r="1.5" fill="#FF5A5A" opacity=".8"/>';
    }
    s += '</g>';
  }

  /* ================= IL CAMPETTO ================= */
  /* Sotto a sinistra, come nelle piazzole di tutti i paesi: un rettangolo
     verde consumato, due canestri, le righe bianche mezze cancellate. */
  const CX = 300, CY = 606, CW = 208, CH = 94;
  s += '<g opacity=".95">' +
    '<rect x="' + CX + '" y="' + CY + '" width="' + CW + '" height="' + CH + '" rx="4" fill="#22493F"/>' +
    '<rect x="' + CX + '" y="' + CY + '" width="' + CW + '" height="' + CH + '" rx="4" fill="none" stroke="#DCE7E0" stroke-width="1.6" opacity=".5"/>' +
    '<line x1="' + (CX + CW / 2) + '" y1="' + CY + '" x2="' + (CX + CW / 2) + '" y2="' + (CY + CH) +
      '" stroke="#DCE7E0" stroke-width="1.4" opacity=".45"/>' +
    '<circle cx="' + (CX + CW / 2) + '" cy="' + (CY + CH / 2) + '" r="20" fill="none" stroke="#DCE7E0" stroke-width="1.4" opacity=".45"/>' +
    '<rect x="' + (CX + 6) + '" y="' + (CY + CH / 2 - 18) + '" width="26" height="36" fill="none" stroke="#DCE7E0" stroke-width="1.2" opacity=".38"/>' +
    '<rect x="' + (CX + CW - 32) + '" y="' + (CY + CH / 2 - 18) + '" width="26" height="36" fill="none" stroke="#DCE7E0" stroke-width="1.2" opacity=".38"/>' +
    '<rect x="' + (CX + 2) + '" y="' + (CY + CH / 2 - 9) + '" width="3" height="9" fill="#C9D6CE" opacity=".7"/>' +
    '<rect x="' + (CX + CW - 5) + '" y="' + (CY + CH / 2 - 9) + '" width="3" height="9" fill="#C9D6CE" opacity=".7"/>' +
    '</g>';
  /* i due fari che lo tengono acceso */
  s += '<ellipse cx="' + (CX + 10) + '" cy="' + (CY + 6) + '" rx="110" ry="76" fill="url(#ci-lamp)" opacity=".75"/>' +
       '<ellipse cx="' + (CX + CW - 10) + '" cy="' + (CY + CH - 6) + '" rx="110" ry="76" fill="url(#ci-lamp)" opacity=".6"/>';

  /* ================= IL NEGOZIO DI BEAT ================= */
  /* L'unico posto in paese dove si compra musica: insegna storta, luce al neon. */
  const BX = 214, BY = 366;
  s += '<g>' +
    '<rect x="' + BX + '" y="' + BY + '" width="132" height="54" fill="#221D2C"/>' +
    '<polygon points="' + BX + ',' + BY + ' ' + (BX + 10) + ',' + (BY - 7) + ' ' +
      (BX + 142) + ',' + (BY - 7) + ' ' + (BX + 132) + ',' + BY + '" fill="#2E2739"/>' +
    '<rect x="' + (BX + 8) + '" y="' + (BY + 30) + '" width="116" height="24" fill="#120F1A"/>' +
    '<rect x="' + (BX + 14) + '" y="' + (BY + 34) + '" width="30" height="16" fill="#FFC978" opacity=".75"/>' +
    '<rect x="' + (BX + 52) + '" y="' + (BY + 34) + '" width="30" height="16" fill="#FFB25E" opacity=".6"/>' +
    '<rect x="' + (BX + 90) + '" y="' + (BY + 34) + '" width="22" height="16" fill="#8FC6FF" opacity=".45"/>' +
    '<text x="' + (BX + 66) + '" y="' + (BY + 22) + '" text-anchor="middle" ' +
      'font-family="Barlow Condensed, Impact, sans-serif" font-size="21" font-weight="700" ' +
      'letter-spacing="3" fill="#F3E9FF" opacity=".82">BEATS</text>' +
    '<ellipse cx="' + (BX + 66) + '" cy="' + (BY + 44) + '" rx="120" ry="52" fill="url(#ci-lamp)" opacity=".45"/>' +
    '</g>';

  /* ================= LAMPIONI E MACCHINE ================= */
  for(let y = ORIZZ + 40; y < H + 40; y += 46 + t(y) * 90){
    const lato = R() < .5 ? -1 : 1;
    const x = stX(y) + lato * (stW(y) / 2 + 10 + t(y) * 16);
    const g = 22 + t(y) * 76;
    s += '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="' + n1(g) + '" ry="' + n1(g * .62) + '" fill="url(#ci-lamp)"/>' +
      '<rect x="' + n1(x - .8) + '" y="' + n1(y - 14 - t(y) * 22) + '" width="' + n1(1.4 + t(y) * 2) +
      '" height="' + n1(14 + t(y) * 22) + '" fill="#2B2536"/>' +
      '<circle cx="' + n1(x) + '" cy="' + n1(y - 14 - t(y) * 22) + '" r="' + n1(1.6 + t(y) * 2.4) + '" fill="#FFD79A"/>';
    /* dall'altra parte della strada, ogni tanto */
    if(R() < .45){
      const x2 = stX(y) - lato * (stW(y) / 2 + 10 + t(y) * 16);
      s += '<ellipse cx="' + n1(x2) + '" cy="' + n1(y) + '" rx="' + n1(g * .8) + '" ry="' + n1(g * .5) + '" fill="url(#ci-lamp)" opacity=".7"/>';
    }
  }
  /* tre macchine sulla discesa, con i fari accesi */
  [[.32, 1], [.58, -1], [.86, 1]].forEach(([q, verso]) => {
    const y = ORIZZ + 40 + q * (H - ORIZZ);
    const x = stX(y) + verso * stW(y) * .22;
    const l = 6 + t(y) * 16, w2 = 3.4 + t(y) * 9;
    s += '<g>' +
      '<rect x="' + n1(x - w2 / 2) + '" y="' + n1(y - l / 2) + '" width="' + n1(w2) + '" height="' + n1(l) +
        '" rx="' + n1(w2 * .35) + '" fill="#15121C"/>' +
      '<rect x="' + n1(x - w2 / 2 + .6) + '" y="' + n1(y - l / 2 + l * .18) + '" width="' + n1(w2 - 1.2) +
        '" height="' + n1(l * .3) + '" rx="1" fill="#3A3448" opacity=".8"/>' +
      '<ellipse cx="' + n1(x) + '" cy="' + n1(y + (verso > 0 ? l * .8 : -l * .8)) + '" rx="' + n1(w2 * 1.5) +
        '" ry="' + n1(l * .9) + '" fill="' + (verso > 0 ? "#FFE1AE" : "#FF6B6B") + '" opacity=".28"/>' +
      '</g>';
  });

  /* ================= ALBERI ================= */
  for(let i = 0; i < 34; i++){
    const y = n1(rr(ORIZZ + 40, H + 30));
    const q = t(y);
    let x = n1(rr(-20, W + 20));
    if(Math.abs(x - stX(y)) < stW(y) / 2 + 6) x += stW(y);
    const r2 = n1(4 + q * 16);
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r2 + '" ry="' + n1(r2 * .82) +
      '" fill="#101A16" opacity="' + n1(rr(.55, .9)) + '"/>';
  }

  /* ================= FINITURE ================= */
  s += '<rect y="' + (ORIZZ - 30) + '" width="' + W + '" height="430" fill="url(#ci-caldo)"/>';
  s += '<rect width="' + W + '" height="' + H + '" fill="url(#ci-grade)"/>';
  s += '<rect width="' + W + '" height="' + H + '" fill="url(#ci-vig)"/>';

  return '<svg class="cittasvg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" ' +
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + s + '</svg>';
}
