/* Ritratto parametrico 3/4 in SVG: cranio, capelli, occhi, accessori, silhouette. */
"use strict";

/* ================= RITRATTO PARAMETRICO 3/4 ================= */
let uidRitratto = 0;
function smoothPath(p, closed){
  const n = p.length; let d = "M" + p[0][0].toFixed(1) + "," + p[0][1].toFixed(1);
  const end = closed ? n : n - 1;
  for(let i = 0; i < end; i++){
    const p0 = p[(i-1+n)%n], p1 = p[i], p2 = p[(i+1)%n], p3 = p[(i+2)%n];
    const c1x = p1[0] + (p2[0]-p0[0])/6, c1y = p1[1] + (p2[1]-p0[1])/6;
    const c2x = p2[0] - (p3[0]-p1[0])/6, c2y = p2[1] - (p3[1]-p1[1])/6;
    d += "C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1)
       + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
  }
  return d + (closed ? "Z" : "");
}
function portrait(soloTesta){
  const U = "p" + (++uidRitratto);
  const f = fit();
  const skin = A.skin;
  const sh = shade(skin,-0.30), sh2 = shade(skin,-0.52), hi = shade(skin,0.26);
  const cloth = A.clothCol || (f.accent ? A.color : f.top);
  const clothD = shade(cloth,-0.34), clothL = shade(cloth,0.16);
  const hairCol = A.hairCol || "#100D0C", hairHi = shade(hairCol, 0.22);
  const girth = 0.86 + (A.w - 45) / 95 * 0.34;
  const rim = A.color;

  /* --- proiettore parametrico della rotazione (yaw) --- */
  const YAW = (typeof A.yaw === "number") ? A.yaw : 0.22;   // + = testa girata verso destra schermo (leggera)
  const R = 58, S = Math.sin(YAW), CX0 = R * Math.sin(YAW);
  const PX = (x, prot) => {
    const r = Math.max(-1, Math.min(1, x / R));
    return R * Math.sin(Math.asin(r) + YAW) - CX0 + (prot || 0) * S;
  };
  const sxAt = x => Math.max(0.34, (PX(x+1.2) - PX(x-1.2)) / 2.4);  // compressione orizz. locale

  /* --- modello parametrico del cranio --- */
  const FP = {
    ovale:    {jaw:30, cheek:44, chinY:8},
    squadrato:{jaw:37, cheek:47, chinY:9},
    tondo:    {jaw:34, cheek:48, chinY:6},
    affilato: {jaw:24, cheek:40, chinY:10}
  }[A.face] || {jaw:30, cheek:44, chinY:8};
  const cheek = FP.cheek, jaw = FP.jaw, FW = cheek;
  const LV = [
    [FP.chinY, 0],
    [-5,  jaw*0.68],
    [-20, jaw],
    [-40, (jaw+cheek)/2],
    [-60, cheek],
    [-82, cheek*0.96],
    [-102, cheek*0.85],
    [-120, cheek*0.58],
    [-132, 0]
  ];
  const chinX = PX(0) - 3;
  const ring = [[chinX, FP.chinY]];
  for(let i = 1; i < LV.length; i++) ring.push([PX(-LV[i][1]), LV[i][0]]);         // lato vicino (sx) su
  for(let i = LV.length-2; i >= 1; i--) ring.push([PX(LV[i][1]), LV[i][0]]);        // lato lontano (dx) giu
  const headPath = smoothPath(ring, true);

  /* wrapper "turn": porta un disegno simmetrico (capelli, cappelli) sulla testa girata */
  const HEADCX = (PX(-cheek) + PX(cheek)) / 2;
  const HEADSX = (PX(cheek) - PX(-cheek)) / (2*cheek);
  const turn = inner => '<g transform="translate('+HEADCX.toFixed(1)+',0) scale('+HEADSX.toFixed(3)+',1)">'+inner+'</g>';

  /* ---- CAPELLI PARAMETRICI (generati dalla calotta proiettata: sempre incollati alla testa) ---- */
  // arco della calotta: tempia sx -> corona -> tempia dx, leggermente fuori dalla pelle (k)
  const capArc = k => {
    const lv=[[-79,cheek*1.0],[-100,cheek*0.9],[-118,cheek*0.62],[-129,cheek*0.18]];
    const p=[];
    for(let i=0;i<lv.length;i++) p.push([PX(-lv[i][1]*k), lv[i][0]]);
    for(let i=lv.length-2;i>=0;i--) p.push([PX(lv[i][1]*k), lv[i][0]]);
    return p;
  };
  // calotta piena con attaccatura: hlY altezza fronte al centro, sideY quanto scende ai lati
  const cap = (hlY, sideY, k, col, op) => {
    const front=[
      [PX(cheek*0.92*k), sideY],
      [PX(cheek*0.52), hlY+8],
      [PX(0), hlY],
      [PX(-cheek*0.52), hlY+8],
      [PX(-cheek*0.92*k), sideY]
    ];
    return '<path d="'+smoothPath(capArc(k).concat(front), true)+'" fill="'+(col||hairCol)+'"'
      +(op!=null?' opacity="'+op+'"':'')+'/>';
  };
  const hlHi = '<path d="M'+PX(-cheek*0.5)+',-104 C'+PX(-cheek*0.2)+',-112 '+PX(cheek*0.3)+',-112 '+PX(cheek*0.55)+',-104" stroke="'+hairHi+'" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>';
  // capello laterale (basetta) sul lato vicino, per quando c'e' un cappello
  const basette = '<path d="M'+PX(-cheek*0.98)+',-80 C'+PX(-cheek)+',-70 '+PX(-cheek*0.98)+',-62 '+PX(-cheek*0.9)+',-58 L'+PX(-cheek*0.8)+',-62 C'+PX(-cheek*0.86)+',-70 '+PX(-cheek*0.86)+',-76 '+PX(-cheek*0.86)+',-80 Z" fill="'+hairCol+'"/>'
    + '<path d="M'+PX(cheek*0.98)+',-80 C'+PX(cheek)+',-70 '+PX(cheek*0.98)+',-62 '+PX(cheek*0.9)+',-58 L'+PX(cheek*0.8)+',-62 C'+PX(cheek*0.86)+',-70 '+PX(cheek*0.86)+',-76 '+PX(cheek*0.86)+',-80 Z" fill="'+hairCol+'"/>';

  const HAIR = {
    corti: cap(-101,-72,1.03),
    rasati: cap(-103,-64,1.0, hairCol, 0.55),
    fade: cap(-99,-56,1.0) + '<path d="'+smoothPath(capArc(1.0).concat([[PX(cheek*0.9),-56],[PX(cheek*0.5),-99],[PX(0),-101],[PX(-cheek*0.5),-99],[PX(-cheek*0.9),-56]]),true)+'" fill="'+shade(hairCol,0.18)+'" opacity=".25"/>',
    spazzola: cap(-102,-70,1.02)
      + '<g stroke="'+hairHi+'" stroke-width="2.4" stroke-linecap="round" opacity=".5">'
      + [-0.55,-0.28,0,0.28,0.55].map(t=>'<path d="M'+PX(cheek*t)+',-116 v-9"/>').join('') + '</g>',
    treccine: cap(-100,-74,1.02)
      + '<g fill="none" stroke="'+hairHi+'" stroke-width="3.6" stroke-linecap="round" opacity=".8">'
      + [-0.7,-0.35,0,0.35,0.7].map(t=>'<path d="M'+PX(cheek*t*0.9)+',-92 C'+PX(cheek*t*0.7)+',-112 '+PX(cheek*t*0.4)+',-124 '+PX(cheek*t*0.15)+',-129"/>').join('') + '</g>',
    dread: cap(-99,-76,1.05)
      + '<g fill="'+hairCol+'">'
      + [-0.62,-0.3,0.02,0.34,0.64].map(t=>'<ellipse cx="'+PX(cheek*t*0.9)+'" cy="-128" rx="5" ry="10"/>').join('')
      + '<path d="M'+PX(-cheek*1.02)+',-82 C'+PX(-cheek*1.15)+',-60 '+PX(-cheek*1.1)+',-38 '+PX(-cheek*1.0)+',-30 L'+PX(-cheek*0.86)+',-34 C'+PX(-cheek*0.96)+',-54 '+PX(-cheek*0.96)+',-70 '+PX(-cheek*0.9)+',-80 Z"/></g>',
    afro: cap(-97,-80,1.42)
      + '<g fill="'+hairHi+'" opacity=".18">'+[-0.4,0.1].map(t=>'<ellipse cx="'+PX(cheek*t)+'" cy="-124" rx="15" ry="10"/>').join('')+'</g>',
    ricci: cap(-98,-78,1.16)
      + '<g fill="'+hairCol+'">'+[[-0.6,-92],[-0.3,-118],[0.05,-124],[0.4,-116],[0.62,-96]].map(c=>'<circle cx="'+PX(cheek*c[0])+'" cy="'+c[1]+'" r="12"/>').join('')+'</g>'
      + '<g fill="'+hairHi+'" opacity=".35">'+[[-0.2,-116],[0.2,-112]].map(c=>'<circle cx="'+PX(cheek*c[0])+'" cy="'+c[1]+'" r="4"/>').join('')+'</g>',
    lunghi: '<path d="M'+PX(-cheek*0.98)+',-82 C'+PX(-cheek*1.16)+',-52 '+PX(-cheek*1.12)+',-16 '+PX(-cheek*1.0)+',6 L'+PX(-cheek*0.7)+',4 C'+PX(-cheek*0.82)+',-22 '+PX(-cheek*0.86)+',-54 '+PX(-cheek*0.82)+',-80 Z" fill="'+hairCol+'"/>'
      + '<path d="M'+PX(cheek*0.98)+',-82 C'+PX(cheek*1.12)+',-52 '+PX(cheek*1.08)+',-16 '+PX(cheek*0.98)+',6 L'+PX(cheek*0.72)+',4 C'+PX(cheek*0.8)+',-22 '+PX(cheek*0.84)+',-54 '+PX(cheek*0.8)+',-80 Z" fill="'+hairCol+'"/>'
      + cap(-100,-78,1.03),
    coda: cap(-101,-72,1.02)
      + '<path d="M'+PX(cheek*0.9)+',-92 C'+PX(cheek*1.4)+',-88 '+PX(cheek*1.55)+',-62 '+PX(cheek*1.42)+',-42 C'+PX(cheek*1.34)+',-32 '+PX(cheek*1.14)+',-28 '+PX(cheek*1.0)+',-28 L'+PX(cheek*0.94)+',-42 C'+PX(cheek*1.14)+',-46 '+PX(cheek*1.2)+',-62 '+PX(cheek*1.08)+',-76 Z" fill="'+hairCol+'"/>',
    durag: cap(-97,-62,1.0, shade(A.color,-0.22))
      + '<path d="M'+PX(cheek*0.92)+',-88 C'+PX(cheek*1.5)+',-78 '+PX(cheek*1.7)+',-64 '+PX(cheek*1.55)+',-54 L'+PX(cheek*0.9)+',-70 Z" fill="'+shade(A.color,-0.38)+'"/>'
      + '<path d="M'+PX(-cheek*0.7)+',-96 C'+PX(-cheek*0.3)+',-104 '+PX(cheek*0.4)+',-104 '+PX(cheek*0.75)+',-94" stroke="'+shade(A.color,0.24)+'" stroke-width="3" fill="none"/>',
    cappuccio:''
  }[A.hair] || "";

  const conCappello = A.hat && A.hat !== "no";
  const cadono = {
    dread:'<g fill="'+hairCol+'"><path d="M'+PX(-cheek*1.02)+',-82 C'+PX(-cheek*1.18)+',-56 '+PX(-cheek*1.12)+',-30 '+PX(-cheek*1.0)+',-24 L'+PX(-cheek*0.84)+',-30 C'+PX(-cheek*0.96)+',-52 '+PX(-cheek*0.96)+',-70 '+PX(-cheek*0.88)+',-80 Z"/>'
      +'<path d="M'+PX(cheek*1.0)+',-82 C'+PX(cheek*1.16)+',-56 '+PX(cheek*1.1)+',-30 '+PX(cheek*0.98)+',-24 L'+PX(cheek*0.82)+',-30 C'+PX(cheek*0.94)+',-52 '+PX(cheek*0.94)+',-70 '+PX(cheek*0.86)+',-80 Z"/></g>',
    lunghi:HAIR===''?'':'<path d="M'+PX(-cheek*0.98)+',-80 C'+PX(-cheek*1.14)+',-50 '+PX(-cheek*1.1)+',-16 '+PX(-cheek*0.98)+',6 L'+PX(-cheek*0.7)+',4 C'+PX(-cheek*0.82)+',-22 '+PX(-cheek*0.86)+',-54 '+PX(-cheek*0.82)+',-78 Z" fill="'+hairCol+'"/>'
      +'<path d="M'+PX(cheek*0.98)+',-80 C'+PX(cheek*1.1)+',-50 '+PX(cheek*1.06)+',-16 '+PX(cheek*0.96)+',6 L'+PX(cheek*0.72)+',4 C'+PX(cheek*0.8)+',-22 '+PX(cheek*0.84)+',-54 '+PX(cheek*0.8)+',-78 Z" fill="'+hairCol+'"/>',
    coda:'<path d="M'+PX(cheek*0.9)+',-90 C'+PX(cheek*1.4)+',-86 '+PX(cheek*1.55)+',-60 '+PX(cheek*1.42)+',-40 C'+PX(cheek*1.34)+',-30 '+PX(cheek*1.14)+',-26 '+PX(cheek*1.0)+',-26 L'+PX(cheek*0.94)+',-40 C'+PX(cheek*1.14)+',-44 '+PX(cheek*1.2)+',-60 '+PX(cheek*1.08)+',-74 Z" fill="'+hairCol+'"/>'
  };
  const capelli = conCappello
    ? ((cadono[A.hair] || "") + (A.hair === "durag" || A.hair === "cappuccio" || A.hair === "rasati" ? "" : basette))
    : HAIR;

  const capp3 = A.hair === "cappuccio" && f.hood;
  const hoodDietro = capp3
    ? '<path d="M-66,-70 C-66,-134 -35,-154 0,-154 C35,-154 66,-134 66,-70 C66,-26 46,-2 22,8 L-22,8 C-46,-2 -66,-26 -66,-70 Z" fill="'+clothD+'"/>'
      +'<path d="M-54,-72 C-54,-124 -28,-142 0,-142 C28,-142 54,-124 54,-72 C54,-34 40,-14 20,-4 L-20,-4 C-40,-14 -54,-34 -54,-72 Z" fill="#000" opacity=".5"/>'
    : "";
  const hoodUp = capp3
    ? '<path d="M-66,-70 C-66,-134 -35,-154 0,-154 L-46,-154 C-58,-138 -62,-104 -60,-70 C-58,-34 -46,-8 -30,4 L-22,8 C-46,-2 -66,-26 -66,-70 Z" fill="'+clothD+'" opacity=".92"/>'
      +'<path d="M66,-70 C66,-134 35,-154 0,-154 L46,-154 C58,-138 62,-104 60,-70 C58,-34 46,-8 30,4 L22,8 C46,-2 66,-26 66,-70 Z" fill="'+shade(cloth,-0.2)+'" opacity=".92"/>'
      +'<path d="M-46,-96 C-40,-118 -22,-128 0,-128 C22,-128 40,-118 46,-96 C36,-112 -36,-112 -46,-96 Z" fill="#000" opacity=".35"/>'
    : "";

  /* ---- OCCHI, SOPRACCIGLIA, ESPRESSIONE ---- */
  const iride = A.eyeCol || "#3A2A1A";
  const eyeL = PX(-17), eyeR = PX(17), sxL = sxAt(-17), sxR = sxAt(17);
  const unOcchio = (cx, sx, spec) => {
    const rx = 9.4, ry = 5.6, cy = -71.4;
    return '<g transform="translate('+cx.toFixed(2)+','+cy+') scale('+sx.toFixed(3)+',1) translate('+(-cx).toFixed(2)+','+(-cy)+')">'
    + '<path d="M'+(cx-rx)+','+cy+' C'+(cx-6)+','+(cy-6)+' '+(cx+6)+','+(cy-6)+' '+(cx+rx)+','+cy
    +   ' C'+(cx+6)+','+(cy+5)+' '+(cx-6)+','+(cy+5)+' '+(cx-rx)+','+cy+' Z" fill="#F6F1EC"/>'
    + '<circle cx="'+(cx+spec*0.6)+'" cy="'+cy+'" r="4.1" fill="url(#iride'+U+')"/>'
    + '<circle cx="'+(cx+spec*0.6)+'" cy="'+cy+'" r="1.9" fill="#0C0906"/>'
    + '<circle cx="'+(cx+spec*0.6-1.5)+'" cy="'+(cy-1.8)+'" r="1.4" fill="#fff" opacity=".95"/>'
    + '<path d="M'+(cx-rx)+','+cy+' C'+(cx-6)+','+(cy-6)+' '+(cx+6)+','+(cy-6)+' '+(cx+rx)+','+cy+'" '
    +   'stroke="#241B14" stroke-width="1.9" fill="none" stroke-linecap="round"/>'
    + '<path d="M'+(cx-7)+','+(cy+4.8)+' C'+(cx-4)+','+(cy+6.8)+' '+(cx+4)+','+(cy+6.8)+' '+(cx+7)+','+(cy+4.8)+'" '
    +   'stroke="'+shade(skin,-0.42)+'" stroke-width="1" fill="none" opacity=".6"/></g>';
  };
  const MD = MOODS.find(m => m.id === (window.__MOOD || A.mood)) || MOODS[0];
  const palpebra = (cx, sx, lato) => {
    const T = MD.occhi; const cy = -71.4;
    const wrap = inner => '<g transform="translate('+cx.toFixed(2)+','+cy+') scale('+sx.toFixed(3)+',1) translate('+(-cx).toFixed(2)+','+(-cy)+')">'+inner+'</g>';
    if(T === "chiusi")
      return wrap('<rect x="'+(cx-11)+'" y="-80" width="22" height="18" fill="'+skin+'"/>'
        + '<path d="M'+(cx-8)+',-70 C'+(cx-4)+',-75.6 '+(cx+4)+',-75.6 '+(cx+8)+',-70" stroke="#241B14" stroke-width="2.2" fill="none" stroke-linecap="round"/>');
    if(T === "stretti")
      return wrap('<path d="M'+(cx-9.6)+',-73.6 C'+(cx-6)+',-77.6 '+(cx+6)+',-77.6 '+(cx+9.6)+',-73.6 L'+(cx+9.6)+',-79 L'+(cx-9.6)+',-79 Z" fill="'+skin+'"/>'
        + '<path d="M'+(cx-9.4)+',-73.4 C'+(cx-6)+',-77.4 '+(cx+6)+',-77.4 '+(cx+9.4)+',-73.4" stroke="#241B14" stroke-width="2" fill="none" stroke-linecap="round"/>');
    if(T === "socchiusi")
      return wrap('<path d="M'+(cx-9.6)+',-72.4 C'+(cx-6)+',-76.4 '+(cx+6)+',-76.4 '+(cx+9.6)+',-72.4 L'+(cx+9.6)+',-79 L'+(cx-9.6)+',-79 Z" fill="'+skin+'"/>'
        + '<path d="M'+(cx-9.4)+',-72.2 C'+(cx-6)+',-76.2 '+(cx+6)+',-76.2 '+(cx+9.4)+',-72.2" stroke="#241B14" stroke-width="2" fill="none" stroke-linecap="round"/>');
    if(T === "storti" && lato < 0)
      return wrap('<path d="M'+(cx-9.6)+',-73.8 C'+(cx-6)+',-77.8 '+(cx+6)+',-77.8 '+(cx+9.6)+',-73.8 L'+(cx+9.6)+',-79 L'+(cx-9.6)+',-79 Z" fill="'+skin+'"/>');
    return "";
  };
  const apertura = MD.occhi === "spalancati" ? 1.28 : 1;
  const occhi = '<g transform="translate(0,' + (-MD.lift) + ')">'
    + '<g transform="scale(1,' + apertura + ') translate(0,' + ((1-apertura)*-71.4/apertura).toFixed(2) + ')">'
    + unOcchio(eyeL, sxL, 1) + unOcchio(eyeR, sxR, -1) + '</g>'
    + palpebra(eyeL, sxL, -1) + palpebra(eyeR, sxR, 1) + '</g>';
  const BRW = {
    naturali:[4,   'M-29,-84 C-23,-89 -11,-89 -6,-85',  'M6,-85 C11,-89 23,-89 29,-84'],
    folte:   [6.4, 'M-30,-84 C-23,-90 -11,-90 -5,-85',  'M5,-85 C11,-90 23,-90 30,-84'],
    sottili: [2.4, 'M-28,-84 C-22,-88 -12,-88 -7,-85',  'M7,-85 C12,-88 22,-88 28,-84'],
    taglio:  [4.6, 'M-29,-84 C-25,-88 -20,-89 -17,-88 M-11,-88 C-8,-87 -6,-86 -5,-85', 'M5,-85 C11,-90 23,-90 30,-84']
  }[A.brow] || [4, 'M-29,-84 C-23,-89 -11,-89 -6,-85', 'M6,-85 C11,-89 23,-89 29,-84'];
  const browOne = (d, rot, pivotCanon) => {
    const px = PX(pivotCanon), sx = sxAt(pivotCanon);
    return '<g transform="translate('+px.toFixed(2)+',-85) scale('+sx.toFixed(3)+',1) translate('+(-px).toFixed(2)+',85)">'
      + '<g transform="translate('+(px-pivotCanon).toFixed(2)+',0)">'
      + '<g transform="rotate(' + rot + ',' + pivotCanon + ',-85)"><path d="' + d + '" stroke="' + hairCol
      + '" stroke-width="' + BRW[0] + '" fill="none" stroke-linecap="round"/></g></g></g>';
  };
  const browEspr = '<g transform="translate(0,' + (-MD.lift*1.4) + ')">'
    + browOne(BRW[1], -MD.brow, -18) + browOne(BRW[2], MD.brow, 18) + '</g>';

  /* ---- NASO di 3/4 ---- */
  const nx = PX(0, 9);
  // naso fumetto: una linea pulita del profilo/punta + base morbida
  const naso =
     '<path d="M'+(nx+3*S)+',-60 C'+(nx+6*S+2)+',-53 '+(nx+7*S+2)+',-48 '+(nx+6*S+1)+',-45 '
    +   'C'+(nx+3)+',-43 '+(nx-3)+',-43 '+(nx-6)+',-44" '
    +   'stroke="'+shade(skin,-0.4)+'" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>'
    + '<ellipse cx="'+(nx-3.5)+'" cy="-44" rx="1.5" ry="1.1" fill="'+shade(skin,-0.55)+'" opacity=".6"/>'
    + '<ellipse cx="'+(nx+3.5)+'" cy="-44" rx="1.3" ry="1" fill="'+shade(skin,-0.55)+'" opacity=".55"/>';

  /* ---- BOCCA + espressione ---- */
  const mx = PX(0, 3), mSX = sxAt(0);
  const wrapM = inner => '<g transform="translate('+mx.toFixed(2)+',0) scale('+mSX.toFixed(3)+',1)">'+inner+'</g>';
  const bocca = {
    normale:'<path d="M-11.5,-26.4 C-7,-31 -2,-28.6 0,-27.6 C2,-28.6 7,-31 11.5,-26.4 C7,-19.6 -7,-19.6 -11.5,-26.4 Z" fill="'+shade(skin,-0.44)+'"/>'
      +'<path d="M-11.5,-26.4 C-7,-31 -2,-28.6 0,-27.6 C2,-28.6 7,-31 11.5,-26.4 C7,-27.6 -7,-27.6 -11.5,-26.4 Z" fill="'+shade(skin,-0.6)+'" opacity=".55"/>'
      +'<path d="M-6,-22.6 C-3,-21.4 3,-21.4 6,-22.6 C3,-20.6 -3,-20.6 -6,-22.6 Z" fill="'+shade(skin,0.3)+'" opacity=".35"/>'
      +'<path d="M-11.5,-26.4 C-6,-25 6,-25 11.5,-26.4" stroke="'+shade(skin,-0.66)+'" stroke-width="1.2" fill="none" opacity=".7"/>',
    carnosa:'<path d="M-13,-27 C-6,-33 6,-33 13,-27 C6,-16 -6,-16 -13,-27 Z" fill="'+shade(skin,-0.46)+'"/>'
      +'<path d="M-13,-27 C-6,-24 6,-24 13,-27" stroke="'+sh2+'" stroke-width="1.6" fill="none" opacity=".65"/>',
    sottile:'<path d="M-10,-26 C-5,-28 5,-28 10,-26 C5,-22 -5,-22 -10,-26 Z" fill="'+shade(skin,-0.4)+'"/>'
      +'<path d="M-10,-26 h20" stroke="'+sh2+'" stroke-width="1.3" opacity=".6"/>',
    seria:'<path d="M-11,-25 C-5,-27 5,-27 11,-25 C5,-22 -5,-22 -11,-25 Z" fill="'+shade(skin,-0.44)+'"/>'
      +'<path d="M-11,-25 C-5,-21 5,-21 11,-25" stroke="'+sh2+'" stroke-width="1.5" fill="none" opacity=".7"/>'
  }[A.mouth] || "";
  const boccaEspr = {
    normale:"",
    mezzo:'<path d="M-11,-25.6 C-6,-27.6 6,-27.6 11,-25.6 C7,-19.4 -5,-19.4 -11,-25.6 Z" fill="'+shade(skin,-0.5)+'"/>'
      +'<path d="M-11,-25.6 C-6,-24 6,-24 11,-25.6" stroke="'+shade(skin,-0.7)+'" stroke-width="1.2" fill="none"/>',
    serrata:'<path d="M-11.5,-25 C-6,-27 6,-27 11.5,-25 C6,-22.6 -6,-22.6 -11.5,-25 Z" fill="'+shade(skin,-0.5)+'"/>'
      +'<path d="M-11.5,-25 C-6,-23.6 6,-23.6 11.5,-25" stroke="'+shade(skin,-0.72)+'" stroke-width="1.6" fill="none"/>',
    giu:'<path d="M-11,-22.6 C-6,-27.6 6,-27.6 11,-22.6 C6,-25 -6,-25 -11,-22.6 Z" fill="'+shade(skin,-0.55)+'"/>'
      +'<path d="M-11,-22.6 C-6,-27.4 6,-27.4 11,-22.6" stroke="'+shade(skin,-0.74)+'" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    su:'<path d="M-12,-28 C-6,-20 6,-20 12,-28 C6,-23 -6,-23 -12,-28 Z" fill="#5A2A28"/>'
      +'<path d="M-10.4,-26.6 C-6,-21.6 6,-21.6 10.4,-26.6 C6,-25.6 -6,-25.6 -10.4,-26.6 Z" fill="#F4F1EC"/>'
      +'<path d="M-12,-28 C-6,-20 6,-20 12,-28" stroke="'+shade(skin,-0.7)+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    ghigno:'<path d="M-11,-24 C-5,-21 5,-25 12,-29 C7,-21.4 -5,-19.6 -11,-24 Z" fill="#5A2A28"/>'
      +'<path d="M-8,-24.4 C-4,-22.6 4,-25 9.6,-27.6 C5,-22.8 -4,-22 -8,-24.4 Z" fill="#F4F1EC"/>'
      +'<path d="M-11,-24 C-5,-21 5,-25 12,-29" stroke="'+shade(skin,-0.72)+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
    o:'<ellipse cx="0" cy="-24" rx="6" ry="7.4" fill="#4E2422"/>'
      +'<ellipse cx="0" cy="-27.4" rx="4.6" ry="2" fill="#F4F1EC"/>'
      +'<ellipse cx="0" cy="-24" rx="6" ry="7.4" fill="none" stroke="'+shade(skin,-0.7)+'" stroke-width="1.3"/>',
    piatta:'<path d="M-10.5,-25 L10.5,-25" stroke="'+shade(skin,-0.72)+'" stroke-width="2.4" stroke-linecap="round"/>'
      +'<path d="M-10.5,-23.4 C-5,-22.4 5,-22.4 10.5,-23.4" stroke="'+shade(skin,-0.4)+'" stroke-width="1.2" fill="none" opacity=".6"/>'
  }[MD.bocca] || "";
  const boccaFin = wrapM(boccaEspr ? boccaEspr : bocca);

  /* ---- GRILLZ ---- */
  const grillz = wrapM({
    no:"",
    oro:'<path d="M-8,-25 C-4,-23 4,-23 8,-25 L7,-22 C3,-20 -3,-20 -7,-22 Z" fill="#F0C24A"/>',
    diamanti:'<path d="M-8,-25 C-4,-23 4,-23 8,-25 L7,-22 C3,-20 -3,-20 -7,-22 Z" fill="#DDE3EA"/>'
      +'<g fill="#fff"><circle cx="-4" cy="-22.6" r=".9"/><circle cx="0" cy="-22.2" r=".9"/><circle cx="4" cy="-22.6" r=".9"/></g>'
  }[A.grillz] || "");

  /* ---- BARBA ---- */
  const beard = {
    no:"",
    baffi:wrapM('<path d="M-14,-30 C-8,-34 -2,-33 0,-31 C2,-33 8,-34 14,-30 C10,-27 4,-28 0,-29 C-4,-28 -10,-27 -14,-30 Z" fill="'+hairCol+'" opacity=".92"/>'),
    corta:'<path d="'+headPath+'" fill="'+hairCol+'" opacity=".55" clip-path="url(#jaw'+U+')"/>'+wrapM('<path d="M-14,-30 C-8,-34 -2,-33 0,-31 C2,-33 8,-34 14,-30 C10,-27 4,-28 0,-29 C-4,-28 -10,-27 -14,-30 Z" fill="'+hairCol+'" opacity=".85"/>'),
    ombra:'<path d="'+headPath+'" fill="'+sh+'" opacity=".30" clip-path="url(#jaw'+U+')"/>',
    pizzetto:wrapM('<path d="M-13,-22 C-6,-14 6,-14 13,-22 C13,-6 7,4 0,6 C-7,4 -13,-6 -13,-22 Z" fill="'+hairCol+'" opacity=".9"/>'),
    piena:'<path d="'+headPath+'" fill="'+hairCol+'" opacity=".82" clip-path="url(#jaw'+U+')"/>'
  }[A.beard] || "";

  /* ---- OCCHIALI (lenti sugli occhi proiettati) ---- */
  const glasses = (() => {
    if(!A.glasses || A.glasses === "no") return "";
    const lw = 24*sxL, rw = 24*sxR, gy = -82, gh = 19;
    if(A.glasses === "vista")
      return '<g fill="none" stroke="#20222A" stroke-width="2.6">'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6"/>'
        +'<path d="M'+(eyeL+lw/2)+',-74 h'+(eyeR-rw/2-eyeL-lw/2)+'"/></g>'
        +'<g fill="#BFD6E8" opacity=".18"><rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6"/></g>';
    if(A.glasses === "scuri")
      return '<g><rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6" fill="#0C0C0F"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6" fill="#0C0C0F"/>'
        +'<rect x="'+(eyeL+lw/2)+'" y="-76" width="'+(eyeR-rw/2-eyeL-lw/2)+'" height="4" fill="#0C0C0F"/>'
        +'<path d="M'+(eyeL-lw/3)+','+(gy+2)+' l'+(6*sxL)+',13" stroke="#fff" stroke-width="2.4" opacity=".28"/>'
        +'<path d="M'+(eyeR-rw/6)+','+(gy+2)+' l'+(6*sxR)+',13" stroke="#fff" stroke-width="2.4" opacity=".28"/></g>';
    if(A.glasses === "piccoli")
      return '<g><circle cx="'+eyeL+'" cy="-72" r="'+(10*sxL)+'" fill="#14161A" opacity=".9"/><circle cx="'+eyeR+'" cy="-72" r="'+(10*sxR)+'" fill="#14161A" opacity=".9"/>'
        +'<path d="M'+(eyeL+10*sxL)+',-72 L'+(eyeR-10*sxR)+',-72" stroke="#8A8A93" stroke-width="2.4"/>'
        +'<circle cx="'+(eyeL-3)+'" cy="-75" r="2.4" fill="#fff" opacity=".5"/><circle cx="'+(eyeR-3)+'" cy="-75" r="2.4" fill="#fff" opacity=".5"/></g>';
    return "";
  })();

  /* ---- ORECCHIE (vicino piena, lontano accennata) + ORECCHINI ---- */
  const earNX = PX(-cheek+2), earFX = PX(cheek-2), farVis = Math.cos(YAW) > 0.15;
  const orecchie =
      (farVis ? '<ellipse cx="'+earFX+'" cy="-57" rx="4.6" ry="10.5" fill="'+shade(skin,-0.02)+'"/>' : "")
    + '<ellipse cx="'+earNX+'" cy="-58" rx="7.8" ry="12.5" fill="'+shade(skin,-0.12)+'"/>';
  const piegheOrecchie =
      '<path d="M'+(earNX+4)+',-64 C'+(earNX+8)+',-61 '+(earNX+8)+',-53 '+(earNX+4)+',-50" fill="none" stroke="'+shade(skin,-0.34)+'" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>'
    + '<path d="M'+(earNX+2)+',-49 C'+(earNX+5)+',-47 '+(earNX+7)+',-50 '+(earNX+7)+',-53" fill="none" stroke="'+shade(skin,-0.34)+'" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>';
  const orecchino = {
    no:"",
    cerchio:'<g fill="none" stroke="#F0C24A" stroke-width="2.4"><circle cx="'+earNX+'" cy="-44" r="5.2"/></g>'
      +(farVis?'<circle cx="'+earFX+'" cy="-45" r="3.4" fill="none" stroke="#F0C24A" stroke-width="2"/>':""),
    brillante:'<circle cx="'+earNX+'" cy="-47" r="3" fill="#EAF0F6"/><circle cx="'+(earNX-1)+'" cy="-48" r="1.1" fill="#fff"/>',
    doppio:'<g fill="#F0C24A"><circle cx="'+earNX+'" cy="-53" r="2.6"/><circle cx="'+earNX+'" cy="-44" r="2.6"/></g>'
  }[A.ear] || "";

  /* ---- CAPPELLI ---- */
  const capp = A.clothCol || A.color;
  const cappello = {
    no:"",
    cappellino:'<path d="M-45,-96 C-45,-124 -25,-136 0,-136 C25,-136 45,-124 45,-96 L45,-92 L-45,-92 Z" fill="'+capp+'"/>'
      +'<path d="M-45,-96 C-45,-118 -32,-130 -14,-134 C-28,-126 -36,-112 -37,-92 L-45,-92 Z" fill="'+shade(capp,-0.16)+'"/>'
      +'<g stroke="'+shade(capp,-0.3)+'" stroke-width="1.6" fill="none" opacity=".7"><path d="M-18,-134 C-24,-120 -26,-106 -26,-92"/><path d="M18,-134 C24,-120 26,-106 26,-92"/></g>'
      +'<rect x="-45" y="-97" width="90" height="6" rx="3" fill="'+shade(capp,-0.28)+'"/>'
      +'<path d="M-45,-93 L-72,-82 C-68,-73 -30,-76 -20,-88 Z" fill="'+shade(capp,-0.34)+'"/>'
      +'<circle cx="0" cy="-135" r="3.4" fill="'+shade(capp,-0.4)+'"/>',
    lato:'<g transform="rotate(-14)"><path d="M-45,-96 C-45,-124 -25,-136 0,-136 C25,-136 45,-124 45,-96 L45,-92 L-45,-92 Z" fill="'+capp+'"/>'
      +'<path d="M46,-94 L72,-86 C68,-78 32,-80 22,-90 Z" fill="'+shade(capp,-0.34)+'"/>'
      +'<circle cx="0" cy="-134" r="3.4" fill="'+shade(capp,-0.4)+'"/></g>',
    dietro:'<path d="M-45,-96 C-45,-124 -25,-136 0,-136 C25,-136 45,-124 45,-96 L45,-92 L-45,-92 Z" fill="'+capp+'"/>'
      +'<path d="M-45,-96 C-45,-124 -25,-136 0,-136 L0,-92 L-45,-92 Z" fill="'+shade(capp,-0.18)+'"/>'
      +'<rect x="-13" y="-104" width="26" height="11" rx="3" fill="'+shade(capp,-0.42)+'"/>',
    beanie:'<path d="M-44,-92 C-46,-124 -24,-138 0,-138 C24,-138 46,-124 44,-92 Z" fill="'+capp+'"/>'
      +'<rect x="-45" y="-100" width="90" height="13" rx="5" fill="'+shade(capp,-0.26)+'"/>'
      +'<g stroke="'+shade(capp,-0.4)+'" stroke-width="2" opacity=".6"><path d="M-30,-136 v40M-10,-140 v44M10,-140 v44M30,-136 v40"/></g>',
    bandana:'<path d="M-44,-102 C-44,-118 -24,-126 0,-126 C24,-126 44,-118 44,-102 L44,-94 C24,-102 -24,-102 -44,-94 Z" fill="'+capp+'"/>'
      +'<g fill="'+shade(capp,0.35)+'" opacity=".75"><circle cx="-28" cy="-110" r="3"/><circle cx="-10" cy="-116" r="3"/><circle cx="10" cy="-116" r="3"/><circle cx="28" cy="-110" r="3"/></g>'
      +'<path d="M44,-102 L62,-94 L58,-80 L42,-92 Z" fill="'+shade(capp,-0.2)+'"/>'
  }[A.hat] || "";

  /* ---- TATUAGGI ---- */
  const tattoo = turn({
    no:"",
    collo:'<g fill="'+sh2+'" opacity=".8"><path d="M-13,14 l5,10 l-5,10 l-4,-10z"/><circle cx="9" cy="20" r="3.4"/><path d="M4,30 h12" stroke="'+sh2+'" stroke-width="2.6"/></g>',
    lacrima:'<path d="M-21,-62 l3,7 l-3,4 l-3,-4z" fill="'+sh2+'" opacity=".85"/>',
    stelle:'<g fill="'+sh2+'" opacity=".8"><path d="M-30,-56 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1z"/>'
      +'<path d="M-24,-44 l1.4,3 l3,.7 l-2.2,2.2 l.7,3 l-2.9,-1.5 l-2.9,1.5 l.7,-3 l-2.2,-2.2 l3,-.7z"/>'
      +'<path d="M30,-52 l1.6,3.4 l3.4,.8 l-2.5,2.5 l.8,3.4 l-3.3,-1.7 l-3.3,1.7 l.8,-3.4 l-2.5,-2.5 l3.4,-.8z"/></g>',
    croce:'<g fill="'+sh2+'" opacity=".85"><rect x="-24.5" y="-60" width="3" height="14" rx="1.4"/><rect x="-29" y="-55.5" width="12" height="3" rx="1.4"/></g>',
    scritta:'<g stroke="'+sh2+'" stroke-width="1.6" opacity=".8" fill="none" stroke-linecap="round"><path d="M-33,-48 c3,-4 5,2 8,-2 M-33,-42 c4,-3 7,1 10,-3 M-33,-36 c3,-3 6,1 9,-2"/></g>'
  }[A.tattoo] || "");

  /* ---- CATENA (busto frontale) ---- */
  const chain = {
    no:"",
    sottile:'<path d="M-26,40 C-14,62 14,62 26,40" stroke="#FFD35C" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
    grossa:'<path d="M-32,40 C-16,72 16,72 32,40" stroke="#FFD35C" stroke-width="7" fill="none" stroke-linecap="round"/>'
      +'<circle cx="0" cy="66" r="9" fill="#FFD35C"/><circle cx="0" cy="66" r="4" fill="'+shade(A.color,-0.1)+'"/>',
    doppia:'<path d="M-28,38 C-14,58 14,58 28,38" stroke="#FFD35C" stroke-width="4" fill="none" stroke-linecap="round"/>'
      +'<path d="M-34,44 C-17,74 17,74 34,44" stroke="#E9E9EE" stroke-width="4" fill="none" stroke-linecap="round"/>'
      +'<circle cx="0" cy="70" r="7" fill="#E9E9EE"/>'
  }[A.chain] || "";

  const sw = 96 * girth;
  const collar = {
    crew:'<path d="M-20,26 C-10,40 10,40 20,26 L26,32 C14,50 -14,50 -26,32 Z" fill="'+clothD+'"/>',
    zip:'<rect x="-3.4" y="26" width="6.8" height="74" fill="'+clothD+'"/><rect x="-1.4" y="26" width="2.8" height="74" fill="'+clothL+'"/>',
    lapel:'<path d="M-24,28 L-6,34 L-16,100 L-46,100 Z" fill="'+clothD+'"/><path d="M24,28 L6,34 L16,100 L46,100 Z" fill="'+clothD+'"/>'
      +'<path d="M-6,34 L6,34 L10,100 L-10,100 Z" fill="'+shade(cloth,0.30)+'"/>',
    tank:'<path d="M-30,40 C-20,30 -12,28 -8,26 L8,26 C12,28 20,30 30,40 L30,100 L-30,100 Z" fill="'+cloth+'"/>',
    puffer:'<g fill="'+clothL+'" opacity=".5"><rect x="'+(-sw/2)+'" y="46" width="'+sw+'" height="5" rx="2.5"/>'
      +'<rect x="'+(-sw/2)+'" y="62" width="'+sw+'" height="5" rx="2.5"/><rect x="'+(-sw/2)+'" y="78" width="'+sw+'" height="5" rx="2.5"/></g>'
  }[f.collar] || "";

  /* ---- clip mascella per la barba (riproiettata) ---- */
  const jawRing = [];
  [[-24,-jaw],[-40,-cheek*0.86],[-52,-cheek*0.5]].forEach(()=>{});
  const jawClip = 'M'+PX(-cheek*0.92)+',-40 C'+PX(-cheek*0.86)+',-14 '+PX(-jaw*0.6)+',10 '+chinX+','+FP.chinY
    +' C'+PX(jaw*0.6)+',10 '+PX(cheek*0.86)+',-14 '+PX(cheek*0.92)+',-40 L'+PX(cheek)+',18 L'+PX(-cheek)+',18 Z';

  const DEFS = '<defs>'
  +   '<radialGradient id="skinG'+U+'" cx="'+(38-YAW*26).toFixed(0)+'%" cy="24%" r="84%">'
  +     '<stop offset="0" stop-color="'+shade(skin,0.30)+'"/><stop offset="0.42" stop-color="'+skin+'"/>'
  +     '<stop offset="0.82" stop-color="'+shade(skin,-0.16)+'"/><stop offset="1" stop-color="'+sh+'"/>'
  +   '</radialGradient>'
  +   '<radialGradient id="iride'+U+'" cx="42%" cy="34%" r="66%">'
  +     '<stop offset="0" stop-color="'+shade(iride,0.34)+'"/><stop offset="0.6" stop-color="'+iride+'"/>'
  +     '<stop offset="1" stop-color="'+shade(iride,-0.5)+'"/></radialGradient>'
  +   '<filter id="morb'+U+'" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>'
  +   '<filter id="morb2'+U+'" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>'
  +   '<linearGradient id="clothG'+U+'" x1="0" y1="0" x2="0.6" y2="1">'
  +     '<stop offset="0" stop-color="'+shade(cloth,0.10)+'"/><stop offset="1" stop-color="'+clothD+'"/></linearGradient>'
  +   '<clipPath id="jaw'+U+'"><path d="'+jawClip+'"/></clipPath>'
  + '</defs>';

  const BUSTO = hoodDietro
  + '<path d="M'+(-sw)+',100 C'+(-sw)+',52 -34,32 0,32 C34,32 '+sw+',52 '+sw+',100 Z" fill="url(#clothG'+U+')"/>'
  + collar
  + '<path d="M-16,-14 L16,-14 L18,26 C10,34 -10,34 -18,26 Z" fill="'+sh+'"/>'
  + '<path d="M-16,-14 L16,-14 L17,4 C8,12 -8,12 -17,4 Z" fill="'+sh2+'" opacity=".55"/>'
  + tattoo
  + chain;

  // ombra piatta sul lato lontano (fumetto): un solo tono, niente sfocature
  const ombraLato = '<path d="M'+PX(cheek*0.99)+',-86 C'+PX(cheek*1.02)+',-56 '+PX(jaw*0.9)+',-26 '+chinX+','+FP.chinY
    +' L'+PX(jaw*0.34)+',-6 C'+PX(cheek*0.5)+',-32 '+PX(cheek*0.7)+',-58 '+PX(cheek*0.72)+',-86 Z" fill="'+sh+'" opacity=".16"/>';
  const TESTA = orecchie
  + '<path d="'+headPath+'" fill="'+skin+'"/>'
  + ombraLato
  + piegheOrecchie
  + naso
  + boccaFin
  + grillz
  + beard
  + occhi
  + browEspr
  + orecchino
  + glasses
  + capelli
  + turn(cappello)
  + hoodUp
  + '<path d="'+headPath+'" fill="none" stroke="'+shade(skin,-0.62)+'" stroke-width="1.6" opacity=".9"/>';

  if(soloTesta) return {defs:DEFS, testa:TESTA, cloth:cloth, clothD:clothD, clothL:clothL,
    skin:skin, sh:sh, sh2:sh2, hi:hi, U:U};
  return '<svg class="portrait" viewBox="-100 -155 200 255" xmlns="http://www.w3.org/2000/svg" aria-label="ritratto del personaggio">'
    + DEFS + BUSTO + TESTA + '</svg>';
}

function silhouette(){
  const hS = 0.78 + (A.h - 155) / 50 * 0.36;
  const g = 0.80 + (A.w - 45) / 95 * 0.62;
  const bw = 15 * g, sw = 21 * g, lw = 7 * g;
  return '<svg viewBox="-32 0 64 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<g transform="translate(0,150) scale(1,'+hS.toFixed(3)+') translate(0,-150)" fill="'+A.color+'" opacity=".92">'
    + '<circle cx="0" cy="16" r="10"/>'
    + '<rect x="'+(-sw/2)+'" y="27" width="'+sw+'" height="10" rx="5"/>'
    + '<rect x="'+(-bw/2)+'" y="33" width="'+bw+'" height="46" rx="6"/>'
    + '<rect x="'+(-sw/2-5)+'" y="33" width="6" height="44" rx="3"/>'
    + '<rect x="'+(sw/2-1)+'" y="33" width="6" height="44" rx="3"/>'
    + '<rect x="'+(-lw-1.5)+'" y="76" width="'+lw+'" height="62" rx="3.5"/>'
    + '<rect x="1.5" y="76" width="'+lw+'" height="62" rx="3.5"/>'
    + '</g></svg>';
}
