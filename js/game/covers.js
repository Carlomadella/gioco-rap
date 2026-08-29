/* Copertine generate proceduralmente da un seed. */
"use strict";

/* ==================== COPERTINE GENERATE ==================== */
function rng(seed){ let x = (seed>>>0) || 7; return () => (x = (x*1664525 + 1013904223) >>> 0) / 4294967296; }
const PALCOV = [
  ["#FF5A36","#2B0B18"], ["#B026FF","#0E0620"], ["#FFC53D","#241505"], ["#3DC7FF","#03141F"],
  ["#FF4D9D","#1E0416"], ["#57C98B","#031A12"], ["#EDEDEF","#0B0B0D"], ["#FF7A1A","#140A04"],
  ["#7A5CFF","#0A0620"], ["#E8452F","#160303"], ["#2BE0C0","#04201C"], ["#F2E205","#1A1A02"]
];
function shade2(hex, amt){
  const n = parseInt(hex.slice(1),16); let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  if(amt >= 0){ r+=(255-r)*amt; g+=(255-g)*amt; b+=(255-b)*amt; } else { r*=(1+amt); g*=(1+amt); b*=(1+amt); }
  return "#" + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
}
/* copertina quadrata deterministica dal seed: 8 impaginazioni diverse, con grana */
function cover(seed, titolo, artista, img){
  if(img) return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
    '<image href="' + img + '" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>' +
    '<defs><linearGradient id="vi' + (seed>>>0) + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></linearGradient></defs>' +
    '<rect width="100" height="100" fill="url(#vi' + (seed>>>0) + ')"/>' +
    '<text x="7" y="90" font-family="Figtree,sans-serif" font-weight="900" font-size="' +
      (String(titolo||"").length <= 9 ? 13 : Math.max(6.4, 13 - (String(titolo||"").length-9)*0.55)).toFixed(1) +
      '" fill="#fff" letter-spacing="-0.6">' + String(titolo||"").toUpperCase().slice(0,22)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</text></svg>';
  const r = rng(seed);
  const pal = PALCOV[Math.floor(r()*PALCOV.length)];
  const A1 = pal[0], B1 = pal[1], A2 = shade2(A1, -0.35), L = shade2(A1, 0.4);
  const tipo = Math.floor(r()*8);
  const id = "c" + (seed>>>0);
  let art = "";
  if(tipo === 0)
    art = '<path d="M0,64 L100,18 L100,44 L0,90 Z" fill="' + A1 + '"/>' +
          '<path d="M0,84 L100,38 L100,50 L0,96 Z" fill="' + A2 + '" opacity=".8"/>';
  else if(tipo === 1)
    art = '<circle cx="50" cy="44" r="30" fill="' + A1 + '"/>' +
          '<circle cx="50" cy="44" r="30" fill="none" stroke="' + L + '" stroke-width="1" opacity=".7"/>' +
          '<rect x="0" y="44" width="100" height="56" fill="' + B1 + '" opacity=".55"/>';
  else if(tipo === 2)
    art = '<rect x="10" y="12" width="80" height="60" fill="none" stroke="' + A1 + '" stroke-width="2"/>' +
          '<path d="M10,72 L50,12 L90,72 Z" fill="' + A1 + '" opacity=".85"/>';
  else if(tipo === 3){
    for(let i=0;i<9;i++) art += '<rect x="' + (6+i*10.4) + '" y="' + (14 + r()*30) + '" width="6" height="' +
      (18 + r()*46) + '" fill="' + (i%3 ? A1 : L) + '" opacity="' + (0.55 + r()*0.45).toFixed(2) + '"/>';
  }
  else if(tipo === 4)
    art = '<ellipse cx="50" cy="52" rx="44" ry="30" fill="' + A1 + '" opacity=".9"/>' +
          '<ellipse cx="50" cy="52" rx="26" ry="17" fill="' + B1 + '"/>' +
          '<ellipse cx="50" cy="52" rx="9" ry="6" fill="' + L + '"/>';
  else if(tipo === 5){
    for(let i=0;i<26;i++) art += '<circle cx="' + (r()*100).toFixed(1) + '" cy="' + (r()*100).toFixed(1) +
      '" r="' + (0.8 + r()*4.4).toFixed(1) + '" fill="' + A1 + '" opacity="' + (0.25 + r()*0.7).toFixed(2) + '"/>';
  }
  else if(tipo === 6)
    art = '<path d="M-6,100 C24,52 40,86 62,40 C76,12 92,26 106,4 L106,100 Z" fill="' + A1 + '" opacity=".92"/>' +
          '<path d="M-6,100 C24,64 40,94 62,56 C76,32 92,44 106,26" fill="none" stroke="' + L + '" stroke-width="1.4" opacity=".8"/>';
  else
    art = '<rect x="0" y="0" width="100" height="52" fill="' + A1 + '"/>' +
          '<rect x="14" y="30" width="72" height="46" fill="' + A2 + '"/>' +
          '<rect x="28" y="52" width="44" height="34" fill="' + L + '" opacity=".9"/>';

  const t = (titolo || "").toUpperCase().slice(0, 22);
  const grande = t.length <= 9;
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
    '<defs><filter id="g' + id + '"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>' +
    '<linearGradient id="v' + id + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></linearGradient></defs>' +
    '<rect width="100" height="100" fill="' + B1 + '"/>' + art +
    '<rect width="100" height="100" fill="url(#v' + id + ')"/>' +
    '<rect width="100" height="100" filter="url(#g' + id + ')" opacity=".13"/>' +
    '<text x="7" y="' + (grande ? 88 : 89) + '" font-family="Figtree,sans-serif" font-weight="900" ' +
      'font-size="' + (grande ? 13 : Math.max(6.4, 13 - (t.length-9)*0.55)).toFixed(1) + '" fill="#fff" ' +
      'letter-spacing="-0.6">' + t.replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</text>' +
    (artista ? '<text x="7" y="' + (grande ? 95.5 : 96) + '" font-family="Figtree,sans-serif" font-weight="700" font-size="4.6" ' +
      'fill="#fff" opacity=".72" letter-spacing="0.4">' + artista.toUpperCase().slice(0,24).replace(/&/g,"&amp;").replace(/</g,"&lt;") + '</text>' : "") +
    '</svg>';
}
