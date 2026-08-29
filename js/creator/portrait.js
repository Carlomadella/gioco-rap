/* Ritratto parametrico 3/4 in SVG, disegnato come un'illustrazione: volume sul viso,
   luce da sinistra, luce di taglio fredda sul bordo lontano, occhi con palpebre e ciglia,
   capelli a ciocche, catene a maglie.

   Le morbidezze sono tutte gradienti, non filtri di sfocatura: un blur costa caro e in
   pagina ce ne stanno anche ottanta di questi ritratti in miniatura. */
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

function portrait(soloTesta, mini){
  const U = "p" + (++uidRitratto);
  const f = fit();
  const skin = A.skin;
  const sh   = shade(skin,-0.30);   // ombra media
  const sh2  = shade(skin,-0.52);   // ombra piena
  const sh3  = shade(skin,-0.70);   // solchi e narici
  const hi   = shade(skin, 0.26);
  const luce = shade(skin, 0.40);   // dove batte la luce
  const ink  = shade(skin,-0.78);   // il segno di contorno
  const cloth = A.clothCol || (f.accent ? A.color : f.top);
  const clothD = shade(cloth,-0.34), clothL = shade(cloth,0.16), clothDD = shade(cloth,-0.58);
  const hairCol = A.hairCol || "#100D0C";
  const hairHi = shade(hairCol, 0.34), hairD = shade(hairCol, -0.45);
  const girth = 0.86 + (A.w - 45) / 95 * 0.34;
  /* la luce di taglio: fredda, appena tinta del tuo colore. Se la si tinge troppo
     lascia una chiazza colorata sulla guancia invece di un bordo di luce. */
  const rimCol = shade(A.color, 0.74);

  /* --- proiettore parametrico della rotazione (yaw) --- */
  const YAW = (typeof A.yaw === "number") ? A.yaw : 0.22;   // + = testa girata verso destra schermo
  const R = 58, S = Math.sin(YAW), CX0 = R * Math.sin(YAW);
  const PX = (x, prot) => {
    const r = Math.max(-1, Math.min(1, x / R));
    return R * Math.sin(Math.asin(r) + YAW) - CX0 + (prot || 0) * S;
  };
  const sxAt = x => Math.max(0.34, (PX(x+1.2) - PX(x-1.2)) / 2.4);  // compressione orizz. locale

  /* --- modello parametrico del cranio --- */
  const FP = {
    ovale:    {jaw:31, cheek:47, chinY:-2},
    squadrato:{jaw:39, cheek:49, chinY:-1},
    tondo:    {jaw:35, cheek:50, chinY:-5},
    affilato: {jaw:26, cheek:44, chinY:0}
  }[A.face] || {jaw:31, cheek:47, chinY:-2};
  const cheek = FP.cheek, jaw = FP.jaw;
  const C0 = FP.chinY;
  const LV = [
    [C0, 0],
    [C0-8,  jaw*0.58],
    [C0-17, jaw*0.9],
    [C0-25, jaw],            /* angolo della mandibola: qui il viso deve avere uno spigolo */
    [-46, (jaw+cheek*1.06)/2],
    [-64, cheek],            /* zigomo: il punto più largo */
    [-86, cheek*0.97],
    [-106, cheek*0.84],
    [-121, cheek*0.54],
    [-130, 0]
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

  /* macchie morbide: un'ellisse riempita con un gradiente che sfuma nel nulla.
     Fa il lavoro di una sfocatura senza costare come una sfocatura. */
  const macchia = (grad, cx, cy, rx, ry, op, rot) =>
    '<ellipse cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+
    '" fill="url(#'+grad+U+')" opacity="'+op+'"' +
    (rot ? ' transform="rotate('+rot+','+cx.toFixed(1)+','+cy.toFixed(1)+')"' : '') + '/>';

  /* ---- CAPELLI PARAMETRICI (generati dalla calotta proiettata) ---- */
  const capArc = k => {
    const lv=[[-79,cheek*1.0],[-100,cheek*0.9],[-118,cheek*0.62],[-129,cheek*0.18]];
    const p=[];
    for(let i=0;i<lv.length;i++) p.push([PX(-lv[i][1]*k), lv[i][0]]);
    for(let i=lv.length-2;i>=0;i--) p.push([PX(lv[i][1]*k), lv[i][0]]);
    return p;
  };
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
  /* il lucido sulla calotta: la luce viene da sinistra, quindi il riflesso sta a sinistra */
  const capLuce = k =>
    '<path d="M'+PX(-cheek*0.86*k)+',-98 C'+PX(-cheek*0.7*k)+',-118 '+PX(-cheek*0.24*k)+',-128 '+PX(cheek*0.1*k)+',-127'+
    ' C'+PX(-cheek*0.22*k)+',-122 '+PX(-cheek*0.6*k)+',-112 '+PX(-cheek*0.74*k)+',-96 Z" fill="'+hairHi+'" opacity=".34"/>';
  /* radici scure sull'attaccatura: stacca i capelli dalla fronte */
  const capOmbra = (hlY) =>
    '<path d="M'+PX(cheek*0.9)+','+(hlY+22)+' C'+PX(cheek*0.5)+','+(hlY+12)+' '+PX(-cheek*0.5)+','+(hlY+12)+' '+PX(-cheek*0.9)+','+(hlY+22)+
    ' C'+PX(-cheek*0.5)+','+(hlY+4)+' '+PX(cheek*0.5)+','+(hlY+4)+' '+PX(cheek*0.9)+','+(hlY+22)+' Z" fill="'+sh2+'" opacity=".32"/>';
  /* ciocca: un fuso disegnato dalla radice alla punta */
  const ciocca = (x0,y0,x1,y1,w,col,op) =>
    '<path d="M'+x0.toFixed(1)+','+y0.toFixed(1)+' C'+(x0+(x1-x0)*0.2).toFixed(1)+','+(y0+(y1-y0)*0.5).toFixed(1)+
    ' '+(x1-w).toFixed(1)+','+(y1-(y1-y0)*0.2).toFixed(1)+' '+x1.toFixed(1)+','+y1.toFixed(1)+
    ' C'+(x1-w*1.4).toFixed(1)+','+(y1-(y1-y0)*0.3).toFixed(1)+' '+(x0+(x1-x0)*0.25-w).toFixed(1)+','+(y0+(y1-y0)*0.5).toFixed(1)+
    ' '+(x0-w).toFixed(1)+','+y0.toFixed(1)+' Z" fill="'+col+'"'+(op!=null?' opacity="'+op+'"':'')+'/>';

  const HAIR = {
    corti: cap(-100,-74,1.06) + capLuce(1.06)
      + '<g opacity=".5">' + [-0.6,-0.3,0.02,0.34,0.62].map(t =>
          ciocca(PX(cheek*t*0.95), -84, PX(cheek*t*0.4), -122, 3.4, hairHi, .55)).join('') + '</g>',
    rasati: cap(-103,-64,1.0, hairCol, 0.62)
      + '<g fill="'+hairHi+'" opacity=".3">' + [-0.62,-0.3,0.04,0.36,0.66].map(t =>
          '<circle cx="'+PX(cheek*t*0.85)+'" cy="-112" r="8"/>').join('') + '</g>',
    fade: cap(-99,-56,1.0)
      + '<path d="'+smoothPath(capArc(1.0).concat([[PX(cheek*0.9),-56],[PX(cheek*0.5),-99],[PX(0),-101],[PX(-cheek*0.5),-99],[PX(-cheek*0.9),-56]]),true)+'" fill="'+shade(hairCol,0.30)+'" opacity=".22"/>'
      + capLuce(1.0)
      + '<path d="M'+PX(-cheek*0.98)+',-58 C'+PX(-cheek*0.6)+',-72 '+PX(cheek*0.6)+',-72 '+PX(cheek*0.98)+',-58" stroke="'+hairD+'" stroke-width="3" fill="none" opacity=".45"/>',
    spazzola: cap(-102,-70,1.02) + capLuce(1.02)
      + '<g stroke="'+hairHi+'" stroke-width="2.6" stroke-linecap="round" opacity=".55">'
      + [-0.6,-0.3,0,0.3,0.6].map(t=>'<path d="M'+PX(cheek*t)+',-113 v-13"/>').join('') + '</g>',
    treccine: cap(-100,-76,1.06)
      + '<g>' + [-0.72,-0.44,-0.15,0.15,0.44,0.72].map(t =>
          ciocca(PX(cheek*t*0.92), -80, PX(cheek*t*0.2), -128, 3.6, hairD, .85)).join('') + '</g>'
      + '<g fill="none" stroke="'+hairHi+'" stroke-width="2.2" stroke-linecap="round" opacity=".7">'
      + [-0.72,-0.44,-0.15,0.15,0.44,0.72].map(t=>'<path d="M'+PX(cheek*t*0.9)+',-86 C'+PX(cheek*t*0.68)+',-106 '+PX(cheek*t*0.38)+',-120 '+PX(cheek*t*0.16)+',-127"/>').join('') + '</g>',
    dread: cap(-97,-78,1.1) + capLuce(1.1)
      + '<g>' + [-0.66,-0.34,0.0,0.34,0.66].map((t,i) =>
          ciocca(PX(cheek*t*0.92), -78, PX(cheek*t*1.05), -132+(i%2)*6, 5.2, hairCol) +
          ciocca(PX(cheek*t*0.92), -80, PX(cheek*t*1.0), -126+(i%2)*6, 2.0, hairHi, .45)).join('') + '</g>'
      + '<g fill="'+hairCol+'">'
      + '<path d="M'+PX(-cheek*1.02)+',-82 C'+PX(-cheek*1.16)+',-58 '+PX(-cheek*1.1)+',-36 '+PX(-cheek*1.0)+',-28 L'+PX(-cheek*0.84)+',-32 C'+PX(-cheek*0.96)+',-54 '+PX(-cheek*0.96)+',-70 '+PX(-cheek*0.9)+',-80 Z"/></g>',
    afro: cap(-95,-82,1.5)
      + '<g fill="'+hairHi+'" opacity=".22">'+[[-0.55,-118],[-0.2,-130],[0.2,-126]].map(c=>'<ellipse cx="'+PX(cheek*c[0])+'" cy="'+c[1]+'" rx="16" ry="11"/>').join('')+'</g>'
      + '<g fill="'+hairD+'" opacity=".35">'+[[0.6,-104],[0.72,-80]].map(c=>'<ellipse cx="'+PX(cheek*c[0]*1.3)+'" cy="'+c[1]+'" rx="14" ry="12"/>').join('')+'</g>',
    ricci: cap(-96,-80,1.2)
      + '<g fill="'+hairCol+'">'+[[-0.86,-84,12],[-0.78,-104,14],[-0.5,-122,15],[-0.12,-130,15],[0.28,-126,14],[0.62,-110,14],[0.8,-88,12]]
          .map(c=>'<circle cx="'+PX(cheek*c[0]*1.24)+'" cy="'+c[1]+'" r="'+c[2]+'"/>').join('')+'</g>'
      + '<g fill="'+hairHi+'" opacity=".45">'+[[-0.62,-112,6],[-0.24,-124,6.5],[0.14,-120,5]]
          .map(c=>'<circle cx="'+PX(cheek*c[0]*1.1)+'" cy="'+c[1]+'" r="'+c[2]+'"/>').join('')+'</g>'
      + '<g fill="'+hairD+'" opacity=".45">'+[[0.5,-106,8],[0.68,-86,8]]
          .map(c=>'<circle cx="'+PX(cheek*c[0]*1.2)+'" cy="'+c[1]+'" r="'+c[2]+'"/>').join('')+'</g>',
    lunghi: '<path d="M'+PX(-cheek*0.98)+',-82 C'+PX(-cheek*1.16)+',-52 '+PX(-cheek*1.12)+',-16 '+PX(-cheek*1.0)+',6 L'+PX(-cheek*0.7)+',4 C'+PX(-cheek*0.82)+',-22 '+PX(-cheek*0.86)+',-54 '+PX(-cheek*0.82)+',-80 Z" fill="'+hairCol+'"/>'
      + '<path d="M'+PX(cheek*0.98)+',-82 C'+PX(cheek*1.12)+',-52 '+PX(cheek*1.08)+',-16 '+PX(cheek*0.98)+',6 L'+PX(cheek*0.72)+',4 C'+PX(cheek*0.8)+',-22 '+PX(cheek*0.84)+',-54 '+PX(cheek*0.8)+',-80 Z" fill="'+hairCol+'"/>'
      + cap(-100,-78,1.03) + capLuce(1.03)
      + '<path d="M'+PX(-cheek*0.92)+',-76 C'+PX(-cheek*1.02)+',-48 '+PX(-cheek*1.0)+',-20 '+PX(-cheek*0.92)+',2" stroke="'+hairHi+'" stroke-width="2.6" fill="none" opacity=".4"/>',
    coda: cap(-101,-72,1.02) + capLuce(1.02)
      + '<path d="M'+PX(cheek*0.9)+',-92 C'+PX(cheek*1.4)+',-88 '+PX(cheek*1.55)+',-62 '+PX(cheek*1.42)+',-42 C'+PX(cheek*1.34)+',-32 '+PX(cheek*1.14)+',-28 '+PX(cheek*1.0)+',-28 L'+PX(cheek*0.94)+',-42 C'+PX(cheek*1.14)+',-46 '+PX(cheek*1.2)+',-62 '+PX(cheek*1.08)+',-76 Z" fill="'+hairCol+'"/>'
      + '<g stroke="'+hairHi+'" stroke-width="2" fill="none" opacity=".45"><path d="M'+PX(cheek*1.0)+',-86 C'+PX(cheek*1.34)+',-80 '+PX(cheek*1.4)+',-58 '+PX(cheek*1.28)+',-42"/></g>',
    durag: cap(-97,-62,1.0, shade(A.color,-0.22))
      + '<path d="M'+PX(cheek*0.92)+',-88 C'+PX(cheek*1.5)+',-78 '+PX(cheek*1.7)+',-64 '+PX(cheek*1.55)+',-54 L'+PX(cheek*0.9)+',-70 Z" fill="'+shade(A.color,-0.42)+'"/>'
      + '<path d="M'+PX(-cheek*0.7)+',-96 C'+PX(-cheek*0.3)+',-104 '+PX(cheek*0.4)+',-104 '+PX(cheek*0.75)+',-94" stroke="'+shade(A.color,0.30)+'" stroke-width="3" fill="none" opacity=".7"/>'
      + '<path d="M'+PX(-cheek*0.84)+',-92 C'+PX(-cheek*0.6)+',-114 '+PX(-cheek*0.1)+',-124 '+PX(cheek*0.16)+',-124 C'+PX(-cheek*0.2)+',-118 '+PX(-cheek*0.6)+',-106 '+PX(-cheek*0.74)+',-90 Z" fill="#fff" opacity=".16"/>',
    buzz: cap(-101,-70,1.02, hairCol, 0.9)
      + '<g fill="'+hairHi+'" opacity=".2">' + [-0.52,-0.22,0.1,0.42].map(t =>
          '<ellipse cx="'+PX(cheek*t*0.9)+'" cy="-113" rx="12" ry="7"/>').join('') + '</g>'
      + '<path d="M'+PX(-cheek*0.96)+',-74 C'+PX(-cheek*0.62)+',-98 '+PX(cheek*0.62)+',-98 '+PX(cheek*0.96)+',-74" stroke="'+hairD+'" stroke-width="2.2" fill="none" opacity=".45"/>',
    cornrows: cap(-101,-74,1.02, hairD)
      + '<g>' + [-0.78,-0.52,-0.26,0,0.26,0.52,0.78].map(t =>
          ciocca(PX(cheek*t*0.94), -78, PX(cheek*t*0.52), -126, 3.0, hairCol)).join('') + '</g>'
      + '<g fill="none" stroke="'+hairHi+'" stroke-width="1.4" stroke-linecap="round" opacity=".5">'
      + [-0.78,-0.52,-0.26,0,0.26,0.52,0.78].map(t =>
          '<path d="M'+PX(cheek*t*0.9)+',-84 C'+PX(cheek*t*0.76)+',-104 '+PX(cheek*t*0.6)+',-118 '+PX(cheek*t*0.5)+',-125"/>').join('') + '</g>',
    twist: (() => {
      const nodi = [[-0.84,-86],[-0.74,-106],[-0.44,-121],[-0.08,-128],[0.28,-124],[0.58,-108],[0.76,-88]];
      return cap(-98,-78,1.14)
      + '<g fill="'+hairCol+'">' + nodi.map(c =>
          '<ellipse cx="'+PX(cheek*c[0]*1.16)+'" cy="'+c[1]+'" rx="8.4" ry="11"/>').join('') + '</g>'
      /* il serpeggiare che fa leggere il twist: due curve strette su ogni ciuffo */
      + '<g fill="none" stroke="'+hairHi+'" stroke-width="2" stroke-linecap="round" opacity=".48">'
      + nodi.map(c => { const x = PX(cheek*c[0]*1.16);
          return '<path d="M'+(x-4)+','+(c[1]+7)+' C'+(x+4)+','+(c[1]+3)+' '+(x-4)+','+(c[1]-2)+' '+(x+4)+','+(c[1]-7)+'"/>';
        }).join('') + '</g>';
    })(),
    dreadcorte: cap(-100,-74,1.06) + capLuce(1.06)
      + '<g>' + [-0.72,-0.42,-0.12,0.18,0.48,0.74].map((t,i) =>
          ciocca(PX(cheek*t*0.86), -104, PX(cheek*t*1.14), -132-(i%2)*5, 4.4, hairCol) +
          ciocca(PX(cheek*t*0.86), -106, PX(cheek*t*1.08), -128-(i%2)*5, 1.8, hairHi, .42)).join('') + '</g>',
    dreadlunghe: '<g fill="'+hairCol+'">'
      + [[-1.04,2],[-0.86,12],[1.0,0],[0.84,10]].map(c =>
          '<path d="M'+PX(cheek*c[0]*0.86)+',-80 C'+PX(cheek*c[0]*1.2)+',-44 '+PX(cheek*c[0]*1.18)+',-16 '+PX(cheek*c[0]*1.04)+','+c[1]+
          ' L'+PX(cheek*c[0]*0.8)+','+(c[1]-8)+' C'+PX(cheek*c[0]*0.94)+',-40 '+PX(cheek*c[0]*0.96)+',-60 '+PX(cheek*c[0]*0.7)+',-78 Z"/>').join('')
      + '</g>'
      + cap(-97,-78,1.1) + capLuce(1.1)
      + '<g>' + [-0.66,-0.34,0.0,0.34,0.66].map((t,i) =>
          ciocca(PX(cheek*t*0.92), -78, PX(cheek*t*1.05), -132+(i%2)*6, 5.2, hairCol) +
          ciocca(PX(cheek*t*0.92), -80, PX(cheek*t*1.0), -126+(i%2)*6, 2.0, hairHi, .45)).join('') + '</g>',
    mullet: '<path d="M'+PX(cheek*0.9)+',-84 C'+PX(cheek*1.24)+',-58 '+PX(cheek*1.2)+',-20 '+PX(cheek*1.02)+',-6 L'+PX(cheek*0.74)+',-12 C'+PX(cheek*0.9)+',-38 '+PX(cheek*0.94)+',-62 '+PX(cheek*0.86)+',-80 Z" fill="'+hairD+'"/>'
      + '<path d="M'+PX(-cheek*0.92)+',-84 C'+PX(-cheek*1.2)+',-56 '+PX(-cheek*1.16)+',-22 '+PX(-cheek*1.0)+',-8 L'+PX(-cheek*0.72)+',-14 C'+PX(-cheek*0.88)+',-40 '+PX(-cheek*0.92)+',-62 '+PX(-cheek*0.84)+',-80 Z" fill="'+hairCol+'"/>'
      + cap(-101,-72,1.03) + capLuce(1.03)
      + '<g opacity=".5">' + [-0.5,-0.15,0.2,0.5].map(t =>
          ciocca(PX(cheek*t*0.95), -86, PX(cheek*t*0.5), -120, 3, hairHi, .5)).join('') + '</g>'
      + '<path d="M'+PX(-cheek*0.9)+',-78 C'+PX(-cheek*1.02)+',-46 '+PX(-cheek*1.0)+',-24 '+PX(-cheek*0.9)+',-10" stroke="'+hairHi+'" stroke-width="2.4" fill="none" opacity=".35"/>',
    cappuccio:''
  }[A.hair] || "";

  const conCappello = A.hat && A.hat !== "no";
  const basette = '<path d="M'+PX(-cheek*0.98)+',-80 C'+PX(-cheek)+',-70 '+PX(-cheek*0.98)+',-62 '+PX(-cheek*0.9)+',-58 L'+PX(-cheek*0.8)+',-62 C'+PX(-cheek*0.86)+',-70 '+PX(-cheek*0.86)+',-76 '+PX(-cheek*0.86)+',-80 Z" fill="'+hairCol+'"/>'
    + '<path d="M'+PX(cheek*0.98)+',-80 C'+PX(cheek)+',-70 '+PX(cheek*0.98)+',-62 '+PX(cheek*0.9)+',-58 L'+PX(cheek*0.8)+',-62 C'+PX(cheek*0.86)+',-70 '+PX(cheek*0.86)+',-76 '+PX(cheek*0.86)+',-80 Z" fill="'+hairCol+'"/>';
  const cadono = {
    dread:'<g fill="'+hairCol+'"><path d="M'+PX(-cheek*1.02)+',-82 C'+PX(-cheek*1.18)+',-56 '+PX(-cheek*1.12)+',-30 '+PX(-cheek*1.0)+',-24 L'+PX(-cheek*0.84)+',-30 C'+PX(-cheek*0.96)+',-52 '+PX(-cheek*0.96)+',-70 '+PX(-cheek*0.88)+',-80 Z"/>'
      +'<path d="M'+PX(cheek*1.0)+',-82 C'+PX(cheek*1.16)+',-56 '+PX(cheek*1.1)+',-30 '+PX(cheek*0.98)+',-24 L'+PX(cheek*0.82)+',-30 C'+PX(cheek*0.94)+',-52 '+PX(cheek*0.94)+',-70 '+PX(cheek*0.86)+',-80 Z"/></g>',
    ricci:'<g fill="'+hairCol+'">'+[[-0.78,-72],[-0.72,-52],[0.78,-70],[0.72,-50]].map(c=>'<circle cx="'+PX(cheek*c[0]*1.1)+'" cy="'+c[1]+'" r="10"/>').join('')+'</g>',
    treccine:'<g>'+[-0.9,0.9].map(t=>ciocca(PX(cheek*t*0.98),-76,PX(cheek*t*1.02),-30,3.2,hairCol)).join('')+'</g>',
    lunghi:'<path d="M'+PX(-cheek*0.98)+',-80 C'+PX(-cheek*1.14)+',-50 '+PX(-cheek*1.1)+',-16 '+PX(-cheek*0.98)+',6 L'+PX(-cheek*0.7)+',4 C'+PX(-cheek*0.82)+',-22 '+PX(-cheek*0.86)+',-54 '+PX(-cheek*0.82)+',-78 Z" fill="'+hairCol+'"/>'
      +'<path d="M'+PX(cheek*0.98)+',-80 C'+PX(cheek*1.1)+',-50 '+PX(cheek*1.06)+',-16 '+PX(cheek*0.96)+',6 L'+PX(cheek*0.72)+',4 C'+PX(cheek*0.8)+',-22 '+PX(cheek*0.84)+',-54 '+PX(cheek*0.8)+',-78 Z" fill="'+hairCol+'"/>',
    coda:'<path d="M'+PX(cheek*0.9)+',-90 C'+PX(cheek*1.4)+',-86 '+PX(cheek*1.55)+',-60 '+PX(cheek*1.42)+',-40 C'+PX(cheek*1.34)+',-30 '+PX(cheek*1.14)+',-26 '+PX(cheek*1.0)+',-26 L'+PX(cheek*0.94)+',-40 C'+PX(cheek*1.14)+',-44 '+PX(cheek*1.2)+',-60 '+PX(cheek*1.08)+',-74 Z" fill="'+hairCol+'"/>'
  ,
    cornrows:'<g>'+[-0.92,-0.6,0.6,0.92].map(t=>ciocca(PX(cheek*t*0.98),-74,PX(cheek*t*1.0),-34,2.8,hairCol)).join('')+'</g>',
    twist:'<g fill="'+hairCol+'">'+[[-0.9,-70],[-0.82,-50],[0.88,-68],[0.8,-48]].map(c=>'<ellipse cx="'+PX(cheek*c[0]*1.08)+'" cy="'+c[1]+'" rx="8" ry="10"/>').join('')+'</g>',
    dreadcorte:'<g>'+[-0.94,0.94].map(t=>ciocca(PX(cheek*t*0.98),-74,PX(cheek*t*1.06),-40,4,hairCol)).join('')+'</g>',
    dreadlunghe:'<g fill="'+hairCol+'">'+[[-1.02,4],[-0.84,14],[0.98,2],[0.82,12]].map(c=>'<path d="M'+PX(cheek*c[0]*0.84)+',-76 C'+PX(cheek*c[0]*1.2)+',-42 '+PX(cheek*c[0]*1.18)+',-14 '+PX(cheek*c[0]*1.04)+','+c[1]+' L'+PX(cheek*c[0]*0.8)+','+(c[1]-8)+' C'+PX(cheek*c[0]*0.94)+',-38 '+PX(cheek*c[0]*0.96)+',-58 '+PX(cheek*c[0]*0.7)+',-74 Z"/>').join('')+'</g>',
    mullet:'<path d="M'+PX(cheek*0.9)+',-82 C'+PX(cheek*1.24)+',-56 '+PX(cheek*1.2)+',-18 '+PX(cheek*1.02)+',-4 L'+PX(cheek*0.74)+',-10 C'+PX(cheek*0.9)+',-36 '+PX(cheek*0.94)+',-60 '+PX(cheek*0.86)+',-78 Z" fill="'+hairD+'"/>'
      +'<path d="M'+PX(-cheek*0.92)+',-82 C'+PX(-cheek*1.2)+',-54 '+PX(-cheek*1.16)+',-20 '+PX(-cheek*1.0)+',-6 L'+PX(-cheek*0.72)+',-12 C'+PX(-cheek*0.88)+',-38 '+PX(-cheek*0.92)+',-60 '+PX(-cheek*0.84)+',-78 Z" fill="'+hairCol+'"/>'
  };
  const capelli = conCappello
    ? ((cadono[A.hair] || "") + (A.hair === "durag" || A.hair === "cappuccio" || A.hair === "rasati" || A.hair === "buzz" ? "" : basette))
    : HAIR;

  const capp3 = A.hair === "cappuccio" && f.hood;
  const hoodDietro = capp3
    ? '<path d="M-66,-70 C-66,-134 -35,-154 0,-154 C35,-154 66,-134 66,-70 C66,-26 46,-2 22,8 L-22,8 C-46,-2 -66,-26 -66,-70 Z" fill="'+clothD+'"/>'
      +'<path d="M-54,-72 C-54,-124 -28,-142 0,-142 C28,-142 54,-124 54,-72 C54,-34 40,-14 20,-4 L-20,-4 C-40,-14 -54,-34 -54,-72 Z" fill="#000" opacity=".55"/>'
    : "";
  const hoodUp = capp3
    ? '<path d="M-66,-70 C-66,-134 -35,-154 0,-154 L-46,-154 C-58,-138 -62,-104 -60,-70 C-58,-34 -46,-8 -30,4 L-22,8 C-46,-2 -66,-26 -66,-70 Z" fill="'+clothD+'" opacity=".95"/>'
      +'<path d="M66,-70 C66,-134 35,-154 0,-154 L46,-154 C58,-138 62,-104 60,-70 C58,-34 46,-8 30,4 L22,8 C46,-2 66,-26 66,-70 Z" fill="'+clothDD+'" opacity=".95"/>'
      +'<path d="M-46,-96 C-40,-118 -22,-128 0,-128 C22,-128 40,-118 46,-96 C36,-112 -36,-112 -46,-96 Z" fill="#000" opacity=".4"/>'
      +'<path d="M-58,-118 C-48,-138 -26,-148 -4,-149" stroke="'+clothL+'" stroke-width="3" fill="none" opacity=".45"/>'
    : "";

  /* ---- OCCHI: orbita, sclera in ombra, iride, ciglia, palpebre ---- */
  const iride = A.eyeCol || "#3A2A1A";
  const eyeL = PX(-17), eyeR = PX(17), sxL = sxAt(-17), sxR = sxAt(17);
  const CY = -71.4;
  const unOcchio = (cx, sx, spec, vicino) => {
    const rx = 8.2, ry = 4.5;
    const ir = 3.4;                       // iride: piccola come in un viso vero
    const px = cx + spec*0.7;
    return '<g transform="translate('+cx.toFixed(2)+','+CY+') scale('+sx.toFixed(3)+',1) translate('+(-cx).toFixed(2)+','+(-CY)+')">'
      /* bulbo */
      + '<path d="M'+(cx-rx)+','+CY+' C'+(cx-5.2)+','+(CY-5.2)+' '+(cx+5.2)+','+(CY-5.2)+' '+(cx+rx)+','+CY
      +   ' C'+(cx+5.2)+','+(CY+4.2)+' '+(cx-5.2)+','+(CY+4.2)+' '+(cx-rx)+','+CY+' Z" fill="#E8E0D7"/>'
      /* la palpebra proietta ombra sulla sclera: e' questa che copre lo sguardo */
      + '<path d="M'+(cx-rx)+','+CY+' C'+(cx-5.2)+','+(CY-5.2)+' '+(cx+5.2)+','+(CY-5.2)+' '+(cx+rx)+','+CY
      +   ' C'+(cx+4.8)+','+(CY-1.4)+' '+(cx-4.8)+','+(CY-1.4)+' '+(cx-rx)+','+CY+' Z" fill="#5F5249" opacity=".5"/>'
      /* iride, anello scuro, pupilla, luce */
      + '<circle cx="'+px+'" cy="'+(CY+0.3)+'" r="'+ir+'" fill="url(#iride'+U+')"/>'
      + '<circle cx="'+px+'" cy="'+(CY+0.3)+'" r="'+ir+'" fill="none" stroke="'+shade(iride,-0.66)+'" stroke-width="1"/>'
      + '<circle cx="'+px+'" cy="'+(CY+0.3)+'" r="1.55" fill="#0A0806"/>'
      + '<circle cx="'+(px-1.3)+'" cy="'+(CY-1.4)+'" r="1.25" fill="#fff"/>'
      + '<circle cx="'+(px+1.5)+'" cy="'+(CY+1.6)+'" r="0.6" fill="#fff" opacity=".55"/>'
      /* ciglia: un fuso pieno, sottile all'interno e spesso all'esterno */
      + '<path d="M'+(cx-rx-0.4)+','+(CY+0.2)+' C'+(cx-5.2)+','+(CY-5.6)+' '+(cx+5.2)+','+(CY-5.6)+' '+(cx+rx+0.4)+','+(CY-0.4)+
        ' C'+(cx+5)+','+(CY-2.8)+' '+(cx-4.4)+','+(CY-3.4)+' '+(cx-rx-0.4)+','+(CY+0.2)+' Z" fill="#1C1611"/>'
      /* piega della palpebra */
      + '<path d="M'+(cx-rx+0.6)+','+(CY-2.8)+' C'+(cx-5)+','+(CY-8.6)+' '+(cx+5)+','+(CY-8.6)+' '+(cx+rx-0.4)+','+(CY-2.4)+'" '
      +   'stroke="'+sh2+'" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/>'
      /* la piega si riempie d'ombra: da' la palpebra pesante */
      + '<path d="M'+(cx-rx+0.6)+','+(CY-2.8)+' C'+(cx-5)+','+(CY-8.6)+' '+(cx+5)+','+(CY-8.6)+' '+(cx+rx-0.4)+','+(CY-2.4)+
        ' C'+(cx+5)+','+(CY-5.6)+' '+(cx-5)+','+(CY-5.6)+' '+(cx-rx+0.6)+','+(CY-2.8)+' Z" fill="'+sh+'" opacity=".45"/>'
      /* palpebra inferiore: una riga di luce e sotto l'ombra */
      + '<path d="M'+(cx-6)+','+(CY+3.8)+' C'+(cx-3)+','+(CY+5.6)+' '+(cx+3)+','+(CY+5.6)+' '+(cx+6)+','+(CY+3.8)+'" '
      +   'stroke="'+luce+'" stroke-width="1.1" fill="none" opacity=".55"/>'
      + '<path d="M'+(cx-6.4)+','+(CY+5)+' C'+(cx-3)+','+(CY+7)+' '+(cx+3)+','+(CY+7)+' '+(cx+6.4)+','+(CY+5)+'" '
      +   'stroke="'+sh+'" stroke-width="1.4" fill="none" opacity=".5"/>'
      /* angolo interno */
      + '<circle cx="'+(cx + (vicino?rx-0.6:-rx+0.6))+'" cy="'+(CY+0.8)+'" r="1.1" fill="#9A6A62" opacity=".5"/>'
      + '</g>';
  };
  const MD = MOODS.find(m => m.id === (window.__MOOD || A.mood)) || MOODS[0];
  /* la forma scelta a mano vince sull'espressione; "auto" lascia decidere l'umore */
  const T = (A.eyes && A.eyes !== "auto")
    ? ({normali:"normale", stretti:"stretti", spalancati:"spalancati",
        socchiusi:"socchiusi", sicuri:"sicuri", freddi:"freddi"}[A.eyes] || "normale")
    : MD.occhi;
  const palpebra = (cx, sx, lato) => {
    const wrap = inner => '<g transform="translate('+cx.toFixed(2)+','+CY+') scale('+sx.toFixed(3)+',1) translate('+(-cx).toFixed(2)+','+(-CY)+')">'+inner+'</g>';
    const coperchio = (y, spess) =>
      '<path d="M'+(cx-9.6)+','+y+' C'+(cx-6)+','+(y-4)+' '+(cx+6)+','+(y-4)+' '+(cx+9.6)+','+y+' L'+(cx+9.6)+',-80 L'+(cx-9.6)+',-80 Z" fill="'+skin+'"/>'
      + '<path d="M'+(cx-9.6)+','+y+' C'+(cx-6)+','+(y-4)+' '+(cx+6)+','+(y-4)+' '+(cx+9.6)+','+y+'" stroke="#211A15" stroke-width="'+spess+'" fill="none" stroke-linecap="round"/>'
      + '<path d="M'+(cx-8.4)+','+(y-2.6)+' C'+(cx-5)+','+(y-7.2)+' '+(cx+5)+','+(y-7.2)+' '+(cx+8.4)+','+(y-2.4)+'" stroke="'+sh2+'" stroke-width="1.2" fill="none" opacity=".6"/>';
    if(T === "chiusi")
      return wrap('<rect x="'+(cx-11)+'" y="-80" width="22" height="18" fill="'+skin+'"/>'
        + '<path d="M'+(cx-8.6)+',-70 C'+(cx-4)+',-75.8 '+(cx+4)+',-75.8 '+(cx+8.6)+',-70" stroke="#211A15" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
        + '<path d="M'+(cx-8.6)+',-70 C'+(cx-5)+',-67.6 '+(cx+5)+',-67.6 '+(cx+8.6)+',-70" stroke="'+sh+'" stroke-width="1.1" fill="none" opacity=".5"/>');
    if(T === "stretti")    return wrap(coperchio(-73.6, 2.2));
    if(T === "socchiusi")  return wrap(coperchio(-72.4, 2.0));
    if(T === "storti" && lato < 0) return wrap(coperchio(-73.8, 2.2));
    /* sicuro: sguardo calato da sotto, un occhio appena più chiuso dell'altro */
    if(T === "sicuri") return wrap(coperchio(lato < 0 ? -74.2 : -75.2, 2.2));
    /* di ghiaccio: la palpebra scende dritta, senza arco. E' l'assenza di curva che raffredda. */
    if(T === "freddi")
      return wrap('<rect x="'+(cx-10)+'" y="-82" width="20" height="8.6" fill="'+skin+'"/>'
        + '<path d="M'+(cx-9.6)+',-73.4 h19.2" stroke="#211A15" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
        + '<path d="M'+(cx-8.6)+',-76.2 h17.2" stroke="'+sh2+'" stroke-width="1.2" fill="none" opacity=".6"/>');
    return "";
  };
  const apertura = T === "spalancati" ? 1.28 : 1;
  const occhi = '<g transform="translate(0,' + (4.6 - MD.lift) + ')">'
    /* incavo dell'orbita: dà profondità sopra l'occhio */
    + macchia("ombraG", eyeL, CY-6, 12*sxL, 8, .38)
    + macchia("ombraG", eyeR, CY-6, 12*sxR, 8, .44)
    + '<g transform="scale(1,' + apertura + ') translate(0,' + ((1-apertura)*-71.4/apertura).toFixed(2) + ')">'
    + unOcchio(eyeL, sxL, 1, true) + unOcchio(eyeR, sxR, -1, false) + '</g>'
    + palpebra(eyeL, sxL, -1) + palpebra(eyeR, sxR, 1) + '</g>';

  /* ---- SOPRACCIGLIA: massa piena che si assottiglia sulla coda, più i peli ---- */
  const BW = {naturali:4.8, folte:6.2, sottili:3.2, taglio:5.2}[A.brow] || 4.8;
  const sopracciglio = (verso, rot) => {
    /* verso -1 = quello vicino (sinistra schermo). Coda all'esterno, testa verso il naso. */
    const est = 30 * verso, med = 18 * verso, int = 6 * verso;
    /* bordo di sopra quasi dritto, coda che scende: e' quello che fa lo sguardo duro */
    const d = 'M'+int+',-83.6 C'+(med*0.62)+',-86.6 '+(med*1.24)+',-86.9 '+est+',-83.2'
            + ' L'+(est*0.94)+','+(-83.2+BW*0.62)+' C'+(med*1.18)+','+(-85.4+BW*0.5)+' '+(med*0.62)+','+(-85.2+BW*0.7)+' '+int+','+(-83.6+BW)+' Z';
    const peli = '<g stroke="'+hairD+'" stroke-width="0.9" opacity=".55" stroke-linecap="round">'
      + [0.25,0.45,0.65,0.85].map(t => {
          const x = int + (est-int)*t;
          return '<path d="M'+x+','+(-83.6-BW*0.1)+' l'+(-1.6*verso)+',-2.6"/>';
        }).join('') + '</g>';
    const px = PX(18*verso), sx = sxAt(18*verso), pivot = 18*verso;
    return '<g transform="translate('+px.toFixed(2)+',-85) scale('+sx.toFixed(3)+',1) translate('+(-px).toFixed(2)+',85)">'
      + '<g transform="translate('+(px-pivot).toFixed(2)+',0)">'
      + '<g transform="rotate(' + rot + ',' + pivot + ',-85)">'
      + '<path d="'+d+'" fill="'+hairCol+'"/>' + peli
      + '<path d="'+d+'" fill="'+hairD+'" opacity=".4" transform="translate(0,1.1)" clip-path="none"/>'
      + '</g></g></g>';
  };
  const browEspr = '<g transform="translate(0,' + (5.4 - MD.lift*1.4) + ')">'
    + sopracciglio(-1, -MD.brow) + sopracciglio(1, MD.brow) + '</g>';

  /* ---- NASO di 3/4: massa d'ombra, dorso in luce, ali, narici ---- */
  const nx = PX(0, 9), nasoY = -43, nw = 9.2;
  const naso =
      '<path d="M'+(nx+1.5*S)+',-64 C'+(nx+5*S+3)+',-58 '+(nx+6*S+4)+',-50 '+(nx+5.2)+','+(nasoY-2)
    +   ' C'+(nx+7)+','+(nasoY+2)+' '+(nx+2)+','+(nasoY+3.6)+' '+(nx-0.6)+','+(nasoY+2.6)
    +   ' C'+(nx+2.4)+','+(nasoY-3)+' '+(nx+3)+',-56 '+(nx+1)+',-68 Z" fill="'+sh+'" opacity=".55"/>'
    + '<path d="M'+(nx-2.6)+',-62 C'+(nx-1.8)+',-54 '+(nx-2)+',-48 '+(nx-3)+','+(nasoY-3)+'" '
    +   'stroke="'+luce+'" stroke-width="3.8" fill="none" opacity=".45" stroke-linecap="round"/>'
    /* la punta: una massa tonda, non una linea */
    + macchia("luceG", nx-0.4, nasoY-3.4, 6.4, 4.6, .55)
    + macchia("ombraG", nx+4.4, nasoY-1.6, 4.4, 3.4, .38)
    /* ali */
    + '<path d="M'+(nx-nw*0.5)+','+(nasoY+2.4)+' C'+(nx-nw)+','+(nasoY+1.6)+' '+(nx-nw*0.98)+','+(nasoY-3.4)+' '+(nx-3.6)+','+(nasoY-4.6)+'" '
    +   'stroke="'+shade(skin,-0.5)+'" stroke-width="1.9" fill="none" stroke-linecap="round"/>'
    + '<path d="M'+(nx+nw*0.46)+','+(nasoY+2.4)+' C'+(nx+nw*0.9)+','+(nasoY+1.4)+' '+(nx+nw*0.86)+','+(nasoY-3.4)+' '+(nx+3.4)+','+(nasoY-4.6)+'" '
    +   'stroke="'+shade(skin,-0.5)+'" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    /* narici */
    + '<ellipse cx="'+(nx-5)+'" cy="'+(nasoY+0.6)+'" rx="2.4" ry="1.4" fill="'+sh3+'" opacity=".82" transform="rotate(-16,'+(nx-5)+','+(nasoY+0.6)+')"/>'
    + '<ellipse cx="'+(nx+5)+'" cy="'+(nasoY+0.6)+'" rx="2.1" ry="1.2" fill="'+sh3+'" opacity=".74" transform="rotate(16,'+(nx+5)+','+(nasoY+0.6)+')"/>'
    /* ombra sotto il naso */
    + macchia("ombraG", nx, nasoY+5.5, 9, 4, .4);

  /* ---- BOCCA: labbro superiore in ombra, inferiore in luce, solco netto ---- */
  const mx = PX(0, 3), mSX = sxAt(0);
  const wrapM = inner => '<g transform="translate('+mx.toFixed(2)+',-2.6) scale('+mSX.toFixed(3)+',1)">'+inner+'</g>';
  const lipD = shade(skin,-0.20), lipU = shade(skin,-0.36), lipHi = shade(skin,0.36);
  const labbra = (w, up, dn) => {
    const y = -26.4;
    const massa = 'M'+(-w)+','+y+' C'+(-w*0.62)+','+(y-up)+' '+(-w*0.2)+','+(y-up*0.72)+' 0,'+(y-up*0.42)
      + ' C'+(w*0.2)+','+(y-up*0.72)+' '+(w*0.62)+','+(y-up)+' '+w+','+y
      + ' C'+(w*0.6)+','+(y+dn)+' '+(-w*0.6)+','+(y+dn)+' '+(-w)+','+y+' Z';
    return '<path d="'+massa+'" fill="'+lipD+'"/>'
      /* labbro di sopra, più scuro */
      + '<path d="M'+(-w)+','+y+' C'+(-w*0.62)+','+(y-up)+' '+(-w*0.2)+','+(y-up*0.72)+' 0,'+(y-up*0.42)
      +   ' C'+(w*0.2)+','+(y-up*0.72)+' '+(w*0.62)+','+(y-up)+' '+w+','+y
      +   ' C'+(w*0.5)+','+(y-1)+' '+(-w*0.5)+','+(y-1)+' '+(-w)+','+y+' Z" fill="'+lipU+'"/>'
      /* luce sul labbro di sotto */
      + '<path d="M'+(-w*0.5)+','+(y+dn*0.34)+' C'+(-w*0.2)+','+(y+dn*0.62)+' '+(w*0.2)+','+(y+dn*0.62)+' '+(w*0.5)+','+(y+dn*0.3)+'" '
      +   'stroke="'+lipHi+'" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>'
      /* solco */
      + '<path d="M'+(-w)+','+y+' C'+(-w*0.45)+','+(y-1.4)+' '+(w*0.45)+','+(y-1.4)+' '+w+','+y+'" '
      +   'stroke="'+sh3+'" stroke-width="1.35" fill="none" opacity=".85" stroke-linecap="round"/>'
      /* ombra sotto il labbro */
      + macchia("ombraG", 0, y+dn+2.6, w*0.8, 3.2, .45)
      /* filtro sopra il labbro */
      + '<path d="M-2.4,'+(y-up-2.4)+' L2.4,'+(y-up-2.4)+' L1.4,'+(y-up*0.5)+' L-1.4,'+(y-up*0.5)+' Z" fill="'+sh+'" opacity=".28"/>';
  };
  const bocca = {
    normale: labbra(12.6, 6.2, 8),
    carnosa: labbra(14.2, 7.6, 10.4),
    sottile: labbra(11, 4.2, 5.2),
    seria:   labbra(12, 4.6, 6)
  }[A.mouth] || labbra(12.6, 6.2, 8);
  const boccaEspr = {
    normale:"",
    mezzo: labbra(11, 4.4, 5.4) + '<path d="M-11,-25.6 C-6,-28.4 6,-28.4 11,-27.4" stroke="'+sh3+'" stroke-width="1.3" fill="none" opacity=".7"/>',
    serrata: labbra(11.5, 3.4, 4.2) + '<path d="M-11.5,-25.6 C-6,-24.4 6,-24.4 11.5,-25.6" stroke="'+sh3+'" stroke-width="1.7" fill="none"/>',
    giu: '<path d="M-11,-22.6 C-6,-27.8 6,-27.8 11,-22.6 C6,-25 -6,-25 -11,-22.6 Z" fill="'+lipD+'"/>'
      +'<path d="M-11,-22.6 C-6,-27.6 6,-27.6 11,-22.6" stroke="'+sh3+'" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
      + macchia("ombraG", 0, -18.6, 9, 3, .4),
    su:'<path d="M-12.4,-28.4 C-6,-19.4 6,-19.4 12.4,-28.4 C6,-23 -6,-23 -12.4,-28.4 Z" fill="#4A2220"/>'
      +'<path d="M-10.6,-27 C-6,-21.4 6,-21.4 10.6,-27 C6,-25.6 -6,-25.6 -10.6,-27 Z" fill="#F2EDE6"/>'
      +'<path d="M-10.6,-27 C-6,-26 6,-26 10.6,-27" stroke="#C9BFB4" stroke-width="0.8" fill="none"/>'
      +'<path d="M-12.4,-28.4 C-6,-19.4 6,-19.4 12.4,-28.4" stroke="'+sh3+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
      + macchia("ombraG", 0, -17.6, 10, 3.4, .4),
    ghigno:'<path d="M-11,-24 C-5,-21 5,-25.4 12.4,-29.4 C7,-21.2 -5,-19.4 -11,-24 Z" fill="#4A2220"/>'
      +'<path d="M-8,-24.4 C-4,-22.6 4,-25.2 9.8,-27.8 C5,-22.8 -4,-22 -8,-24.4 Z" fill="#F2EDE6"/>'
      +'<path d="M-11,-24 C-5,-21 5,-25.4 12.4,-29.4" stroke="'+sh3+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    o:'<ellipse cx="0" cy="-24" rx="6" ry="7.4" fill="#3F1D1C"/>'
      +'<ellipse cx="0" cy="-27.6" rx="4.6" ry="2" fill="#F2EDE6"/>'
      +'<ellipse cx="0" cy="-24" rx="6" ry="7.4" fill="none" stroke="'+sh3+'" stroke-width="1.4"/>'
      +'<ellipse cx="0" cy="-24" rx="8.6" ry="10" fill="none" stroke="'+lipD+'" stroke-width="3" opacity=".8"/>',
    piatta: labbra(11, 2.6, 3.2) + '<path d="M-10.6,-25.6 h21.2" stroke="'+sh3+'" stroke-width="1.9" stroke-linecap="round"/>'
  }[MD.bocca] || "";
  const boccaFin = wrapM(boccaEspr ? boccaEspr : bocca);

  /* ---- GRILLZ ---- */
  const grillz = wrapM({
    no:"",
    oro:'<path d="M-8,-25 C-4,-22.6 4,-22.6 8,-25 L7,-21.6 C3,-19.4 -3,-19.4 -7,-21.6 Z" fill="url(#oro'+U+')"/>'
      +'<g stroke="'+shade("#8A6516",0)+'" stroke-width=".7" opacity=".7"><path d="M-4,-23.4 v3M0,-23 v3.2M4,-23.4 v3"/></g>',
    diamanti:'<path d="M-8,-25 C-4,-22.6 4,-22.6 8,-25 L7,-21.6 C3,-19.4 -3,-19.4 -7,-21.6 Z" fill="url(#arg'+U+')"/>'
      +'<g fill="#fff"><circle cx="-4" cy="-22.4" r=".95"/><circle cx="0" cy="-22" r=".95"/><circle cx="4" cy="-22.4" r=".95"/></g>'
  }[A.grillz] || "");

  /* ---- BARBA: massa sulla mascella + peli corti ---- */
  const peluria = (op) => '<g clip-path="url(#jaw'+U+')">'
    + '<path d="'+headPath+'" fill="'+hairCol+'" opacity="'+op+'"/>'
    + '<g stroke="'+hairD+'" stroke-width="0.8" opacity=".3">'
    + [-24,-16,-8,0,8,16,24].map(x => '<path d="M'+PX(x)+',-14 v6M'+PX(x+4)+',-6 v6"/>').join('') + '</g></g>';
  const baffiPath = '<path d="M-14.6,-32 C-8,-37.4 -2,-35.6 0,-33.2 C2,-35.6 8,-37.4 14.6,-32 C11,-27 4,-29.6 0,-30.8 C-4,-29.6 -11,-27 -14.6,-32 Z" fill="'+hairCol+'"/>'
    + '<path d="M-13.4,-31.6 C-8,-35.4 -3,-34 0,-32.2" stroke="'+hairHi+'" stroke-width="1" fill="none" opacity=".35"/>';
  const beard = {
    no:"",
    baffi: wrapM(baffiPath),
    corta: peluria(.6) + wrapM(baffiPath),
    ombra: peluria(.3),
    pizzetto: wrapM('<path d="M-10,-20 C-5,-13 5,-13 10,-20 C10,-8 6,0 0,1.6 C-6,0 -10,-8 -10,-20 Z" fill="'+hairCol+'" opacity=".92"/>'
      + '<path d="M-6.4,-16 C-3,-11 3,-11 6.4,-16 C6.4,-7 3.6,-1.6 0,-0.6 C-3.6,-1.6 -6.4,-7 -6.4,-16 Z" fill="'+hairD+'" opacity=".4"/>'
      + baffiPath),
    piena: peluria(.88) + wrapM(baffiPath)
  }[A.beard] || "";

  /* ---- OCCHIALI ---- */
  const glasses = (() => {
    if(!A.glasses || A.glasses === "no") return "";
    const gg = i => '<g transform="translate(0,5)">' + i + '</g>';
    const lw = 24*sxL, rw = 24*sxR, gy = -82, gh = 19;
    if(A.glasses === "vista")
      return gg('<g fill="url(#lente'+U+')" opacity=".9">'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6"/></g>'
        +'<g fill="none" stroke="#1B1D24" stroke-width="2.6">'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6"/>'
        +'<path d="M'+(eyeL+lw/2)+',-74 h'+(eyeR-rw/2-eyeL-lw/2)+'"/></g>');
    if(A.glasses === "scuri")
      return gg('<g><rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="5" fill="url(#nero'+U+')"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="5" fill="url(#nero'+U+')"/>'
        +'<rect x="'+(eyeL+lw/2)+'" y="-76" width="'+(eyeR-rw/2-eyeL-lw/2)+'" height="3.6" rx="1.8" fill="#15161B"/>'
        +'<path d="M'+(eyeL-lw/3)+','+(gy+2)+' l'+(7*sxL)+',14" stroke="#fff" stroke-width="2.6" opacity=".34" stroke-linecap="round"/>'
        +'<path d="M'+(eyeR-rw/6)+','+(gy+2)+' l'+(7*sxR)+',14" stroke="#fff" stroke-width="2.6" opacity=".3" stroke-linecap="round"/>'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="5" fill="none" stroke="#2C2E36" stroke-width="1.6"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="5" fill="none" stroke="#2C2E36" stroke-width="1.6"/></g>');
    /* le lenti grandi mangiano il ponte: se non lo tengo positivo il naselo si rovescia */
    const LW = 27*sxL, RW = 27*sxR, GY = -87, GH = 26;
    const ponte = Math.max(2, (eyeR - RW/2) - (eyeL + LW/2));
    if(A.glasses === "grandi")
      return gg('<g><rect x="'+(eyeL-LW/2)+'" y="'+GY+'" width="'+LW+'" height="'+GH+'" rx="8" fill="url(#nero'+U+')" opacity=".94"/>'
        +'<rect x="'+(eyeR-RW/2)+'" y="'+GY+'" width="'+RW+'" height="'+GH+'" rx="8" fill="url(#nero'+U+')" opacity=".94"/>'
        +'<path d="M'+(eyeL-LW/3)+','+(GY+4)+' l'+(11*sxL)+',19" stroke="#fff" stroke-width="3.2" opacity=".3" stroke-linecap="round"/>'
        +'<path d="M'+(eyeR-RW/6)+','+(GY+4)+' l'+(11*sxR)+',19" stroke="#fff" stroke-width="3.2" opacity=".26" stroke-linecap="round"/>'
        +'<rect x="'+(eyeL-LW/2)+'" y="'+GY+'" width="'+LW+'" height="'+GH+'" rx="8" fill="none" stroke="#20222A" stroke-width="3.4"/>'
        +'<rect x="'+(eyeR-RW/2)+'" y="'+GY+'" width="'+RW+'" height="'+GH+'" rx="8" fill="none" stroke="#20222A" stroke-width="3.4"/>'
        +'<rect x="'+(eyeL+LW/2)+'" y="-78" width="'+ponte+'" height="4.4" rx="2.2" fill="#20222A"/></g>');
    if(A.glasses === "colorati"){
      const tinta = A.color, mont = shade(tinta,-0.56);
      return gg('<g><rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6" fill="'+tinta+'" opacity=".58"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6" fill="'+tinta+'" opacity=".58"/>'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+(gh/2)+'" rx="5" fill="'+shade(tinta,0.32)+'" opacity=".4"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+(gh/2)+'" rx="5" fill="'+shade(tinta,0.32)+'" opacity=".34"/>'
        +'<path d="M'+(eyeL-lw/3)+','+(gy+2)+' l'+(7*sxL)+',14" stroke="#fff" stroke-width="2.4" opacity=".4" stroke-linecap="round"/>'
        +'<rect x="'+(eyeL-lw/2)+'" y="'+gy+'" width="'+lw+'" height="'+gh+'" rx="6" fill="none" stroke="'+mont+'" stroke-width="2.4"/>'
        +'<rect x="'+(eyeR-rw/2)+'" y="'+gy+'" width="'+rw+'" height="'+gh+'" rx="6" fill="none" stroke="'+mont+'" stroke-width="2.4"/>'
        +'<path d="M'+(eyeL+lw/2)+',-76 h'+Math.max(2,(eyeR-rw/2)-(eyeL+lw/2))+'" stroke="'+mont+'" stroke-width="2.4"/></g>');
    }
    if(A.glasses === "piccoli")
      return gg('<g><circle cx="'+eyeL+'" cy="-72" r="'+(9.4*sxL)+'" fill="url(#nero'+U+')"/><circle cx="'+eyeR+'" cy="-72" r="'+(9.4*sxR)+'" fill="url(#nero'+U+')"/>'
        +'<circle cx="'+eyeL+'" cy="-72" r="'+(9.4*sxL)+'" fill="none" stroke="#B99A46" stroke-width="1.6"/>'
        +'<circle cx="'+eyeR+'" cy="-72" r="'+(9.4*sxR)+'" fill="none" stroke="#B99A46" stroke-width="1.6"/>'
        +'<path d="M'+(eyeL+9.4*sxL)+',-72 L'+(eyeR-9.4*sxR)+',-72" stroke="#B99A46" stroke-width="2"/>'
        +'<path d="M'+(eyeL-4)+',-76 l4,-2" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/></g>');
    return "";
  })();

  /* ---- ORECCHIE + ORECCHINI ---- */
  const earNX = PX(-cheek+5), earFX = PX(cheek-4), farVis = Math.cos(YAW) > 0.15;
  const orecchie = '<g transform="translate(0,-2)">' +
      (farVis ? '<ellipse cx="'+earFX+'" cy="-57" rx="3.8" ry="9" fill="'+shade(skin,-0.10)+'"/>' : "")
    + '<ellipse cx="'+earNX+'" cy="-58" rx="6.2" ry="10.8" fill="'+shade(skin,-0.06)+'"/>'
    + '<ellipse cx="'+(earNX-0.6)+'" cy="-58" rx="5" ry="9" fill="'+sh+'" opacity=".38"/>' + '</g>';
  const piegheOrecchie = '<g transform="translate(0,-2)">' +
      '<path d="M'+(earNX+4)+',-64 C'+(earNX+8)+',-61 '+(earNX+8)+',-53 '+(earNX+4)+',-50" fill="none" stroke="'+shade(skin,-0.40)+'" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>'
    + '<path d="M'+(earNX+2)+',-49 C'+(earNX+5)+',-47 '+(earNX+7)+',-50 '+(earNX+7)+',-53" fill="none" stroke="'+shade(skin,-0.40)+'" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>'
    + '<path d="M'+(earNX-4)+',-66 C'+(earNX-7)+',-60 '+(earNX-7)+',-52 '+(earNX-4)+',-48" fill="none" stroke="'+luce+'" stroke-width="1.6" stroke-linecap="round" opacity=".4"/>' + '</g>';
  const orecchino = '<g transform="translate(0,-4)">' + ({
    no:"",
    cerchio:'<circle cx="'+earNX+'" cy="-44" r="5.2" fill="none" stroke="url(#oro'+U+')" stroke-width="2.6"/>'
      +(farVis?'<circle cx="'+earFX+'" cy="-45" r="3.4" fill="none" stroke="url(#oro'+U+')" stroke-width="2"/>':""),
    brillante:'<circle cx="'+earNX+'" cy="-47" r="3.1" fill="url(#arg'+U+')"/><circle cx="'+(earNX-1)+'" cy="-48.2" r="1.2" fill="#fff"/>'
      +(farVis?'<circle cx="'+earFX+'" cy="-47" r="2.2" fill="url(#arg'+U+')"/>':""),
    doppio:'<g fill="url(#oro'+U+')"><circle cx="'+earNX+'" cy="-53" r="2.7"/><circle cx="'+earNX+'" cy="-44" r="2.7"/></g>'
  }[A.ear] || "") + '</g>';

  /* ---- CAPPELLI ---- */
  const capp = A.clothCol || A.color;
  /* la calotta a sei spicchi con la visiera: la usano snapback, NY e LA */
  const snapback = (col, logo) =>
      '<path d="M-48,-96 C-48,-126 -26,-138 0,-138 C26,-138 48,-126 48,-96 L48,-91 L-48,-91 Z" fill="'+col+'"/>'
    + '<path d="M-45,-96 C-45,-118 -32,-130 -14,-134 C-28,-126 -36,-112 -37,-92 L-45,-92 Z" fill="'+shade(col,0.22)+'" opacity=".55"/>'
    + '<path d="M45,-96 C45,-120 30,-132 12,-135 C30,-126 37,-112 38,-92 L45,-92 Z" fill="'+shade(col,-0.34)+'"/>'
    + '<g stroke="'+shade(col,-0.34)+'" stroke-width="1.6" fill="none" opacity=".6"><path d="M-18,-134 C-24,-120 -26,-106 -26,-92"/><path d="M18,-134 C24,-120 26,-106 26,-92"/></g>'
    + (logo || "")
    + '<rect x="-48" y="-97" width="96" height="6.4" rx="3.2" fill="'+shade(col,-0.3)+'"/>'
    + '<path d="M-48,-93 L-78,-80 C-73,-70 -32,-74 -22,-88 Z" fill="'+shade(col,-0.4)+'"/>'
    + '<path d="M-48,-93 L-76,-81 C-64,-78 -40,-82 -32,-89 Z" fill="'+shade(col,-0.18)+'" opacity=".6"/>'
    + '<circle cx="0" cy="-135" r="3.4" fill="'+shade(col,-0.44)+'"/>';
  /* il ricamo sul davanti: due lettere di filo, niente di più */
  const ricamo = d => '<g fill="none" stroke="#F3F1EC" stroke-width="3.2" stroke-linecap="round" '
    + 'stroke-linejoin="round" opacity=".95">'+d+'</g>';
  const cappello = {
    no:"",
    cappellino: snapback(capp),
    ny: snapback(capp, ricamo('<path d="M-13,-105 v-15 l9,15 v-15"/><path d="M2,-120 l5,8 l5,-8 M7,-112 v7"/>')),
    la: snapback(capp, ricamo('<path d="M-12,-120 v15 h8"/><path d="M1,-105 l6,-15 l6,15 M3.6,-110 h6.8"/>')),
    lato:'<g transform="rotate(-14)"><path d="M-48,-96 C-48,-126 -26,-138 0,-138 C26,-138 48,-126 48,-96 L48,-91 L-48,-91 Z" fill="'+capp+'"/>'
      +'<path d="M-45,-96 C-45,-120 -30,-132 -12,-135 C-28,-126 -37,-112 -38,-92 L-45,-92 Z" fill="'+shade(capp,0.2)+'" opacity=".5"/>'
      +'<path d="M46,-94 L72,-86 C68,-78 32,-80 22,-90 Z" fill="'+shade(capp,-0.4)+'"/>'
      +'<circle cx="0" cy="-134" r="3.4" fill="'+shade(capp,-0.44)+'"/></g>',
    dietro:'<path d="M-48,-96 C-48,-126 -26,-138 0,-138 C26,-138 48,-126 48,-96 L48,-91 L-48,-91 Z" fill="'+capp+'"/>'
      +'<path d="M-45,-96 C-45,-124 -25,-136 0,-136 L0,-92 L-45,-92 Z" fill="'+shade(capp,0.14)+'" opacity=".5"/>'
      +'<rect x="-13" y="-104" width="26" height="11" rx="3" fill="'+shade(capp,-0.46)+'"/>'
      +'<rect x="-48" y="-97" width="96" height="6.4" rx="3.2" fill="'+shade(capp,-0.3)+'"/>',
    beanie:'<path d="M-47,-94 C-49,-126 -26,-140 0,-140 C26,-140 49,-126 47,-94 Z" fill="'+capp+'"/>'
      +'<path d="M-47,-94 C-49,-126 -26,-140 0,-140 C-16,-133 -31,-117 -33,-94 Z" fill="'+shade(capp,0.22)+'" opacity=".4"/>'
      +'<path d="M47,-94 C49,-126 26,-140 0,-140 C18,-132 34,-116 35,-94 Z" fill="'+shade(capp,-0.32)+'" opacity=".55"/>'
      +'<path d="M-48,-104 L48,-104 L48,-89 C24,-95 -24,-95 -48,-89 Z" fill="'+shade(capp,-0.24)+'"/>'
      +'<path d="M-48,-104 L48,-104 L48,-100 L-48,-100 Z" fill="'+shade(capp,0.14)+'" opacity=".55"/>'
      +'<g stroke="'+shade(capp,-0.44)+'" stroke-width="1.6" opacity=".45">'
      +[-36,-24,-12,0,12,24,36].map(function(x){return '<path d="M'+x+',-104 v14"/>';}).join('')+'</g>',
    /* bucket: calotta bassa e tesa che cade tutt'intorno */
    bucket:'<path d="M-41,-96 C-41,-128 -22,-139 0,-139 C22,-139 41,-128 41,-96 Z" fill="'+capp+'"/>'
      +'<path d="M-41,-96 C-41,-128 -22,-139 0,-139 C-14,-131 -28,-117 -29,-96 Z" fill="'+shade(capp,0.2)+'" opacity=".45"/>'
      +'<path d="M41,-96 C41,-128 22,-139 0,-139 C14,-131 29,-117 30,-96 Z" fill="'+shade(capp,-0.3)+'" opacity=".5"/>'
      +'<path d="M-36,-114 C-14,-121 14,-121 36,-114" stroke="'+shade(capp,-0.4)+'" stroke-width="1.6" fill="none" opacity=".5"/>'
      +'<path d="M-58,-97 C-58,-83 -30,-76 0,-76 C30,-76 58,-83 58,-97 C40,-90 -40,-90 -58,-97 Z" fill="'+shade(capp,-0.3)+'"/>'
      +'<path d="M-58,-97 C-40,-90 40,-90 58,-97" stroke="'+shade(capp,-0.5)+'" stroke-width="2" fill="none" opacity=".7"/>'
      +'<path d="M-56,-95 C-42,-88 -20,-84 -2,-83" stroke="'+shade(capp,0.24)+'" stroke-width="2" fill="none" opacity=".4"/>',
    bandana:'<path d="M-44,-102 C-44,-118 -24,-126 0,-126 C24,-126 44,-118 44,-102 L44,-94 C24,-102 -24,-102 -44,-94 Z" fill="'+capp+'"/>'
      +'<path d="M-44,-102 C-44,-118 -24,-126 0,-126 C-16,-120 -30,-112 -34,-97 Z" fill="'+shade(capp,0.22)+'" opacity=".4"/>'
      +'<g fill="'+shade(capp,0.42)+'" opacity=".8"><circle cx="-28" cy="-110" r="3"/><circle cx="-10" cy="-116" r="3"/><circle cx="10" cy="-116" r="3"/><circle cx="28" cy="-110" r="3"/></g>'
      +'<path d="M44,-102 L62,-94 L58,-80 L42,-92 Z" fill="'+shade(capp,-0.26)+'"/>'
  }[A.hat] || "";

  /* ---- CUFFIE: archetto sopra la testa, o appoggiate sul collo ---- */
  const cuffCol = shade(capp,-0.14), cuffD = shade(capp,-0.5), cuffL = shade(capp,0.3);
  const padiglione = (x, y, w, h, col) =>
      '<rect x="'+(x-w/2)+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(w/2).toFixed(1)+'" fill="'+col+'"/>'
    + '<rect x="'+(x-w/2+3)+'" y="'+(y+3)+'" width="'+(w-6)+'" height="'+(h-6)+'" rx="'+((w-6)/2).toFixed(1)+'" fill="'+shade(col,-0.42)+'"/>';
  const cuffieTesta = A.cuffie === "cuffie"
    ? turn('<path d="M-45,-94 C-45,-133 -24,-147 0,-147 C24,-147 45,-133 45,-94" stroke="'+cuffCol+'" stroke-width="8" fill="none" stroke-linecap="round"/>'
         + '<path d="M-42,-98 C-42,-130 -22,-143 0,-143" stroke="'+cuffL+'" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".5"/>')
      + padiglione(earNX, -76, 21, 33, cuffCol)
      + (farVis ? padiglione(earFX, -75, 15, 30, cuffD) : "")
    : "";
  const cuffieCollo = A.cuffie === "collo"
    ? '<path d="M-27,16 C-27,-4 -13,-13 0,-13 C13,-13 27,-4 27,16" stroke="'+cuffCol+'" stroke-width="7" fill="none" stroke-linecap="round"/>'
      + padiglione(-30, 8, 18, 27, cuffCol)
      + padiglione(30, 8, 18, 27, cuffD)
    : "";

  /* ---- TATUAGGI ---- */
  const tattoo = turn({
    no:"",
    collo:'<g fill="'+sh2+'" opacity=".78"><path d="M-13,14 l5,10 l-5,10 l-4,-10z"/><circle cx="9" cy="20" r="3.4"/><path d="M4,30 h12" stroke="'+sh2+'" stroke-width="2.6"/></g>',
    lacrima:'<path d="M-21,-62 l3,7 l-3,4 l-3,-4z" fill="'+sh3+'" opacity=".8"/>',
    stelle:'<g fill="'+sh3+'" opacity=".72"><path d="M-30,-56 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1z"/>'
      +'<path d="M-24,-44 l1.4,3 l3,.7 l-2.2,2.2 l.7,3 l-2.9,-1.5 l-2.9,1.5 l.7,-3 l-2.2,-2.2 l3,-.7z"/>'
      +'<path d="M30,-52 l1.6,3.4 l3.4,.8 l-2.5,2.5 l.8,3.4 l-3.3,-1.7 l-3.3,1.7 l.8,-3.4 l-2.5,-2.5 l3.4,-.8z"/></g>',
    croce:'<g fill="'+sh3+'" opacity=".78"><rect x="-24.5" y="-60" width="3" height="14" rx="1.4"/><rect x="-29" y="-55.5" width="12" height="3" rx="1.4"/></g>',
    rosa:'<g fill="none" stroke="'+sh2+'" stroke-width="2" opacity=".72" stroke-linecap="round">'
      +'<path d="M-13,6 C-3.4,7 -1.6,17 -13,22 C-24,18.4 -23,7.8 -13,6"/>'
      +'<path d="M-13,10 C-7.6,10.6 -6.6,16 -13,18.6 C-19.2,16.6 -19,10.8 -13,10"/>'
      +'<circle cx="-13" cy="14.2" r="2.6"/>'
      +'<path d="M-13,22 v10 M-13,26 c-5,-1.2 -8,-3.6 -9.2,-6.4 M-13,29.6 c5,-1.2 8,-3.6 9.2,-6.4"/></g>',
    corona:'<g fill="'+sh2+'" opacity=".7"><path d="M-13,20 l3.5,-11 l5,6.5 l4.5,-11 l4.5,11 l5,-6.5 l3.5,11 Z"/>'
      +'<rect x="-13" y="20.4" width="26" height="3" rx="1.4"/></g>',
    fullneck:'<path d="M-19,-2 C-10,10 10,10 19,-2 L21,22 C12,32 -12,32 -21,22 Z" fill="'+sh3+'" opacity=".26"/>'
      +'<g fill="none" stroke="'+sh3+'" stroke-width="1.6" opacity=".62" stroke-linecap="round">'
      +'<path d="M-16,4 C-8,14 8,14 16,4"/><path d="M-18,12 C-9,23 9,23 18,12"/>'
      +'<path d="M-12,0 v26 M0,2 v28 M12,0 v26"/>'
      +'<path d="M-6,6 l6,6 l6,-6 M-6,20 l6,6 l6,-6"/></g>',
    scritta:'<g stroke="'+sh3+'" stroke-width="1.6" opacity=".72" fill="none" stroke-linecap="round"><path d="M-33,-48 c3,-4 5,2 8,-2 M-33,-42 c4,-3 7,1 10,-3 M-33,-36 c3,-3 6,1 9,-2"/></g>'
  }[A.tattoo] || "");

  /* ---- CATENA: maglie vere, non una riga ---- */
  const catena = (w, dip, y0, grad, r, passo) => {
    let s = "";
    for(let i = 0; i <= passo; i++){
      const t = i/passo, x = -w + 2*w*t;
      const k = 1 - Math.pow(x/w, 2);
      const y = y0 + dip*k;
      const ang = Math.atan2(dip * (-2*x/(w*w)) * 1, 1) * 180/Math.PI;
      const vert = i % 2 === 0;
      s += '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="'+(vert?r*0.72:r)+'" ry="'+(vert?r:r*0.72)+
        '" fill="none" stroke="url(#'+grad+U+')" stroke-width="'+(r*0.62).toFixed(1)+
        '" transform="rotate('+ang.toFixed(1)+','+x.toFixed(1)+','+y.toFixed(1)+')"/>';
    }
    return s;
  };
  const chain = {
    no:"",
    sottile: catena(26, 20, 40, "oro", 2.6, 13),
    grossa: catena(32, 30, 40, "oro", 4.4, 13)
      + '<circle cx="0" cy="72" r="9.6" fill="url(#oro'+U+')"/>'
      + '<circle cx="0" cy="72" r="5.4" fill="'+shade(A.color,-0.2)+'"/>'
      + '<circle cx="-2.6" cy="69" r="2.2" fill="#fff" opacity=".4"/>',
    doppia: catena(28, 18, 38, "oro", 3, 13)
      + catena(34, 30, 44, "arg", 3.2, 15)
      + '<circle cx="0" cy="76" r="7.4" fill="url(#arg'+U+')"/>'
      + '<circle cx="-2" cy="74" r="1.8" fill="#fff" opacity=".5"/>'
  }[A.chain] || "";

  /* ---- BUSTO: spalle, colletto, pieghe ---- */
  const sw = 96 * girth;
  const collar = {
    crew:'<path d="M-20,26 C-10,40 10,40 20,26 L26,32 C14,50 -14,50 -26,32 Z" fill="'+clothD+'"/>'
      +'<path d="M-20,26 C-10,40 10,40 20,26" stroke="'+clothDD+'" stroke-width="1.6" fill="none" opacity=".7"/>'
      +'<path d="M-24,31 C-12,46 12,46 24,31" stroke="'+clothL+'" stroke-width="1.4" fill="none" opacity=".4"/>',
    zip:'<rect x="-3.4" y="26" width="6.8" height="74" fill="'+clothD+'"/><rect x="-1.4" y="26" width="2.8" height="74" fill="'+clothL+'"/>'
      +'<g stroke="'+clothDD+'" stroke-width="1.2" opacity=".5"><path d="M-3.6,26 v74M3.6,26 v74"/></g>',
    lapel:'<path d="M-24,28 L-6,34 L-16,100 L-46,100 Z" fill="'+clothD+'"/><path d="M24,28 L6,34 L16,100 L46,100 Z" fill="'+clothDD+'"/>'
      +'<path d="M-6,34 L6,34 L10,100 L-10,100 Z" fill="'+shade(cloth,0.30)+'"/>'
      +'<path d="M-24,28 L-6,34" stroke="'+clothL+'" stroke-width="1.4" opacity=".5"/>',
    /* t-shirt: costina sottile e niente peso sulle spalle */
    tee:'<path d="M-19,26 C-10,38 10,38 19,26 L24,30 C13,46 -13,46 -24,30 Z" fill="'+clothD+'"/>'
      +'<path d="M-19,26 C-10,38 10,38 19,26" stroke="'+clothDD+'" stroke-width="1.4" fill="none" opacity=".6"/>'
      +'<path d="M-23,29 C-12,44 12,44 23,29" stroke="'+clothL+'" stroke-width="1.2" fill="none" opacity=".4"/>'
      +'<path d="M'+(-sw*0.52)+',62 C'+(-sw*0.3)+',52 '+(sw*0.3)+',52 '+(sw*0.52)+',62" stroke="'+clothDD+'" stroke-width="1.6" fill="none" opacity=".22"/>',
    /* bomber: collo a costine e zip corta */
    bomber:'<path d="M-24,27 C-11,42 11,42 24,27 L29,40 C15,59 -15,59 -29,40 Z" fill="'+clothDD+'"/>'
      +'<path d="M-24,27 C-11,42 11,42 24,27" stroke="'+shade(cloth,-0.72)+'" stroke-width="1.6" fill="none" opacity=".6"/>'
      +'<g stroke="'+clothL+'" stroke-width="1.1" opacity=".18">'
      +[-20,-13,-6,1,8,15,22].map(function(x){return '<path d="M'+x+',36 l-1.4,15"/>';}).join('')+'</g>'
      +'<rect x="-3.2" y="46" width="6.4" height="54" fill="'+clothD+'"/>'
      +'<rect x="-1.2" y="46" width="2.4" height="54" fill="'+clothL+'" opacity=".7"/>'
      +'<circle cx="0" cy="52" r="2.8" fill="'+clothL+'" opacity=".6"/>',
    /* varsity: busto colorato, maniche chiare, bottoni a pressione */
    varsity:'<path d="M'+(-sw*0.5)+',44 C'+(-sw*0.58)+',66 '+(-sw*0.62)+',84 '+(-sw*0.64)+',100 L'+(-sw*1.06)+',100 C'+(-sw*0.99)+',72 '+(-sw*0.8)+',52 '+(-sw*0.58)+',40 Z" fill="#E4E4E8"/>'
      +'<path d="M'+(sw*0.5)+',44 C'+(sw*0.58)+',66 '+(sw*0.62)+',84 '+(sw*0.64)+',100 L'+(sw*1.06)+',100 C'+(sw*0.99)+',72 '+(sw*0.8)+',52 '+(sw*0.58)+',40 Z" fill="#C6C6CC"/>'
      +'<path d="M-25,25 C-12,40 12,40 25,25 L29,37 C15,55 -15,55 -29,37 Z" fill="'+shade(cloth,-0.62)+'"/>'
      +'<path d="M-27,31 C-13,47 13,47 27,31" stroke="#EDEDEF" stroke-width="2.4" fill="none" opacity=".65"/>'
      +'<g fill="#EDEDEF" opacity=".85">'+[48,62,76,90].map(function(y){return '<circle cx="0" cy="'+y+'" r="2.6"/>';}).join('')+'</g>',
    tank:'<path d="M-30,40 C-20,30 -12,28 -8,26 L8,26 C12,28 20,30 30,40 L30,100 L-30,100 Z" fill="'+cloth+'"/>'
      +'<path d="M-30,40 C-20,30 -12,28 -8,26" stroke="'+clothD+'" stroke-width="1.6" fill="none" opacity=".7"/>',
    puffer:'<g fill="'+clothDD+'" opacity=".45"><rect x="'+(-sw/2)+'" y="46" width="'+sw+'" height="4" rx="2"/>'
      +'<rect x="'+(-sw/2)+'" y="64" width="'+sw+'" height="4" rx="2"/><rect x="'+(-sw/2)+'" y="82" width="'+sw+'" height="4" rx="2"/></g>'
      +'<g fill="'+clothL+'" opacity=".3"><rect x="'+(-sw/2)+'" y="52" width="'+sw+'" height="3" rx="1.5"/>'
      +'<rect x="'+(-sw/2)+'" y="70" width="'+sw+'" height="3" rx="1.5"/></g>'
  }[f.collar] || "";
  /* pieghe sulle spalle: due colpi scuri e uno di luce */
  const pieghe = '<g fill="none" stroke="'+clothDD+'" stroke-width="2.2" opacity=".35" stroke-linecap="round">'
    + '<path d="M'+(-sw*0.62)+',96 C'+(-sw*0.5)+',72 '+(-sw*0.38)+',58 '+(-sw*0.2)+',48"/>'
    + '<path d="M'+(sw*0.6)+',96 C'+(sw*0.48)+',74 '+(sw*0.36)+',60 '+(sw*0.2)+',48"/></g>'
    + '<path d="M'+(-sw*0.78)+',96 C'+(-sw*0.66)+',68 '+(-sw*0.5)+',52 '+(-sw*0.32)+',42" stroke="'+clothL+'" stroke-width="3" fill="none" opacity=".22" stroke-linecap="round"/>';

  /* ---- clip mascella per la barba ---- */
  const jawClip = 'M'+PX(-cheek*0.92)+',-40 C'+PX(-cheek*0.86)+',-14 '+PX(-jaw*0.6)+',10 '+chinX+','+FP.chinY
    +' C'+PX(jaw*0.6)+',10 '+PX(cheek*0.86)+',-14 '+PX(cheek*0.92)+',-40 L'+PX(cheek)+',18 L'+PX(-cheek)+',18 Z';

  const DEFS = '<defs>'
  +   '<radialGradient id="skinG'+U+'" cx="'+(34-YAW*26).toFixed(0)+'%" cy="22%" r="86%">'
  +     '<stop offset="0" stop-color="'+shade(skin,0.34)+'"/><stop offset="0.38" stop-color="'+skin+'"/>'
  +     '<stop offset="0.76" stop-color="'+shade(skin,-0.20)+'"/><stop offset="1" stop-color="'+sh2+'"/>'
  +   '</radialGradient>'
  /* macchia d'ombra che sfuma nel nulla: fa il lavoro di una sfocatura, a costo zero */
  +   '<radialGradient id="ombraG'+U+'" cx="50%" cy="50%" r="50%">'
  +     '<stop offset="0" stop-color="'+sh2+'" stop-opacity=".95"/>'
  +     '<stop offset="0.55" stop-color="'+sh2+'" stop-opacity=".5"/>'
  +     '<stop offset="1" stop-color="'+sh2+'" stop-opacity="0"/></radialGradient>'
  +   '<radialGradient id="luceG'+U+'" cx="50%" cy="50%" r="50%">'
  +     '<stop offset="0" stop-color="'+luce+'" stop-opacity=".9"/>'
  +     '<stop offset="0.55" stop-color="'+luce+'" stop-opacity=".42"/>'
  +     '<stop offset="1" stop-color="'+luce+'" stop-opacity="0"/></radialGradient>'
  /* luce di taglio sul bordo lontano e chiave sul vicino */
  +   '<linearGradient id="rim'+U+'" x1="0.74" y1="0" x2="1" y2="0">'
  +     '<stop offset="0" stop-color="'+rimCol+'" stop-opacity="0"/>'
  +     '<stop offset="0.78" stop-color="'+rimCol+'" stop-opacity=".14"/>'
  +     '<stop offset="1" stop-color="'+rimCol+'" stop-opacity=".62"/></linearGradient>'
  +   '<radialGradient id="iride'+U+'" cx="42%" cy="32%" r="68%">'
  +     '<stop offset="0" stop-color="'+shade(iride,0.46)+'"/><stop offset="0.55" stop-color="'+iride+'"/>'
  +     '<stop offset="1" stop-color="'+shade(iride,-0.56)+'"/></radialGradient>'
  +   '<linearGradient id="clothG'+U+'" x1="0.1" y1="0" x2="0.9" y2="1">'
  +     '<stop offset="0" stop-color="'+shade(cloth,0.16)+'"/><stop offset="0.55" stop-color="'+cloth+'"/>'
  +     '<stop offset="1" stop-color="'+clothDD+'"/></linearGradient>'
  +   '<linearGradient id="oro'+U+'" x1="0" y1="0" x2="0.4" y2="1">'
  +     '<stop offset="0" stop-color="#FFE9A8"/><stop offset="0.45" stop-color="#E9B93C"/>'
  +     '<stop offset="1" stop-color="#8A6516"/></linearGradient>'
  +   '<linearGradient id="arg'+U+'" x1="0" y1="0" x2="0.4" y2="1">'
  +     '<stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#C9CFD8"/>'
  +     '<stop offset="1" stop-color="#6E757F"/></linearGradient>'
  +   '<linearGradient id="nero'+U+'" x1="0" y1="0" x2="0.6" y2="1">'
  +     '<stop offset="0" stop-color="#2A2C33"/><stop offset="0.5" stop-color="#0D0E12"/>'
  +     '<stop offset="1" stop-color="#191B21"/></linearGradient>'
  +   '<linearGradient id="lente'+U+'" x1="0" y1="0" x2="0.6" y2="1">'
  +     '<stop offset="0" stop-color="#CFE2F2" stop-opacity=".34"/><stop offset="1" stop-color="#9FB6CC" stop-opacity=".12"/></linearGradient>'
  +   '<clipPath id="jaw'+U+'"><path d="'+jawClip+'"/></clipPath>'
  +   '<clipPath id="testa'+U+'"><path d="'+headPath+'"/></clipPath>'
  + '</defs>';

  /* ---- il collo: cilindro con l'ombra della mascella sopra ---- */
  const collo =
      '<path d="M-20,-24 L20,-24 L23,26 C13,34 -13,34 -23,26 Z" fill="'+shade(skin,-0.16)+'"/>'
    + '<path d="M-20,-24 L-6,-24 L-8,30 C-15,31 -20,28 -23,26 Z" fill="'+skin+'" opacity=".55"/>'
    /* l'ombra che il mento butta sul collo: e' quella che stacca la testa dal corpo */
    + '<path d="M-21,-24 L21,-24 L20,-4 C10,8 -10,8 -20,-4 Z" fill="'+shade(skin,-0.62)+'" opacity=".78"/>'
    + '<path d="M-20,-2 C-10,10 10,10 20,-2" stroke="'+shade(skin,-0.5)+'" stroke-width="2" fill="none" opacity=".35"/>'
    /* i tendini del collo */
    + (mini ? "" :
        '<path d="M-10,-2 C-9,12 -7,20 -3,28" stroke="'+shade(skin,-0.44)+'" stroke-width="1.8" fill="none" opacity=".32" stroke-linecap="round"/>'
      + '<path d="M10,-2 C9,12 7,20 3,28" stroke="'+shade(skin,-0.44)+'" stroke-width="1.4" fill="none" opacity=".22" stroke-linecap="round"/>');

  const BUSTO = hoodDietro
  + '<path d="M'+(-sw*1.14)+',100 C'+(-sw*1.1)+',66 '+(-sw*0.62)+',42 -28,34 C-15,31 15,31 28,34 C'+(sw*0.62)+',42 '+(sw*1.1)+',66 '+(sw*1.14)+',100 Z" fill="url(#clothG'+U+')"/>'
  /* il trapezio: la riga che scende dal collo alla spalla */
  + '<path d="M-26,33 C'+(-sw*0.5)+',42 '+(-sw*0.82)+',66 '+(-sw*0.94)+',100" stroke="'+clothDD+'" stroke-width="1.6" fill="none" opacity=".3"/>'
  + '<path d="M26,33 C'+(sw*0.5)+',42 '+(sw*0.82)+',66 '+(sw*0.94)+',100" stroke="'+clothDD+'" stroke-width="1.6" fill="none" opacity=".3"/>'
  + (mini ? "" : pieghe)
  + collar
  + collo
  + tattoo
  + cuffieCollo
  + chain;

  /* ---- il volume del viso: ombre e luci, tutte dentro la sagoma della testa ---- */
  const modellato = mini ? '<g clip-path="url(#testa'+U+')">'
      + macchia("ombraG", PX(cheek*1.02), -62, cheek*0.42, 58, .5)
      + '<path d="'+headPath+'" fill="url(#rim'+U+')"/></g>'
    : '<g clip-path="url(#testa'+U+')">'
    /* lato lontano in ombra: stretta e sul bordo, se no il viso si assottiglia */
    + macchia("ombraG", PX(cheek*1.02), -62, cheek*0.42, 58, .5)
    /* tempia */
    + macchia("ombraG", PX(-cheek*0.86), -94, 13, 15, .24)
    /* il solco sotto lo zigomo: e' questo che da' gli zigomi */
    + macchia("ombraG", PX(-cheek*0.58), -42, 17, 11, .38, -14)
    + macchia("ombraG", PX(cheek*0.56), -40, 15, 10, .32, 14)
    /* ombra ai lati del mento */
    + macchia("ombraG", chinX, C0-9, jaw*0.66, 7, .3)
    /* luci: fronte, zigomo vicino, mento */
    + macchia("luceG", PX(-14), -100, 26, 13, .5)
    + macchia("luceG", PX(-cheek*0.62), -60, 16, 10, .55)
    + macchia("luceG", chinX+1, C0-9, 8, 6, .42)
    /* la luce di taglio che stacca il profilo dal fondo */
    + '<path d="'+headPath+'" fill="url(#rim'+U+')"/>'
    + '</g>';

  const TESTA = orecchie
  + '<path d="'+headPath+'" fill="url(#skinG'+U+')"/>'
  + modellato
  + piegheOrecchie
  + '<g clip-path="url(#testa'+U+')">'
  +   naso
  +   boccaFin
  +   grillz
  +   beard
  +   occhi
  +   browEspr
  + '</g>'
  + orecchino
  + glasses
  + capelli
  + turn(cappello)
  + cuffieTesta
  + (conCappello ? '' : capOmbra(-101))
  + hoodUp
  /* il segno di contorno: leggero davanti, più carico sotto e sul lato in ombra */
  + '<path d="'+headPath+'" fill="none" stroke="'+ink+'" stroke-width="1.6" opacity=".5"/>';

  if(soloTesta) return {defs:DEFS, testa:TESTA, cloth:cloth, clothD:clothD, clothL:clothL,
    skin:skin, sh:sh, sh2:sh2, hi:hi, U:U};
  /* mini === "testa": il riquadro inquadra solo la faccia, il busto non si vede.
     Non disegnarlo taglia meta' del markup, e in barra ce ne stanno ottantaquattro. */
  return '<svg class="portrait" viewBox="-100 -155 200 255" xmlns="http://www.w3.org/2000/svg" aria-label="ritratto del personaggio">'
    + DEFS + (mini === "testa" ? collo : BUSTO) + TESTA + '</svg>';
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
