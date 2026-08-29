/* Gli otto avatar pronti e i fondali dietro al ritratto.
   Ogni fondale è un SVG che sta dietro alla figura, nella card come nell'anteprima grande. */
"use strict";

/* ================= FONDALI ================= */
/* viewBox condiviso 0 0 200 200: la figura ci sta sopra, centrata in basso. */
const BGS = [
  {id:0, n:"Muro scritto", c:"#1A1A1E", svg:
    '<rect width="200" height="200" fill="#17171B"/>' +
    '<g stroke="#2E2E36" stroke-width="9" fill="none" stroke-linecap="round">' +
      '<path d="M14 74 L44 46 L44 104 L74 66"/><path d="M96 112 L126 60 L150 112"/>' +
      '<path d="M164 52 L188 52 L172 82 L192 106"/></g>' +
    '<circle cx="100" cy="96" r="72" fill="none" stroke="#3A3A44" stroke-width="3"/>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:1, n:"Skyline", c:"#23272E", svg:
    '<rect width="200" height="200" fill="#20242B"/>' +
    '<circle cx="100" cy="92" r="74" fill="#282D36"/>' +
    '<g fill="#171A20">' +
      '<rect x="4" y="112" width="26" height="88"/><rect x="34" y="88" width="20" height="112"/>' +
      '<rect x="58" y="126" width="30" height="74"/><rect x="92" y="72" width="22" height="128"/>' +
      '<rect x="118" y="108" width="28" height="92"/><rect x="150" y="84" width="18" height="116"/>' +
      '<rect x="172" y="120" width="26" height="80"/></g>' +
    '<g fill="#3E444F" opacity=".8">' +
      '<rect x="40" y="98" width="4" height="5"/><rect x="98" y="84" width="4" height="5"/>' +
      '<rect x="155" y="96" width="4" height="5"/><rect x="124" y="120" width="4" height="5"/></g>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:2, n:"Graffiti viola", c:"#3A1550", svg:
    '<rect width="200" height="200" fill="#2A1038"/>' +
    '<g stroke="#5B1E7E" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 60 L44 100 L70 56 L70 116"/><path d="M112 58 L112 118 M112 58 L146 58 L146 88 L112 88"/></g>' +
    '<g fill="#5B1E7E"><rect x="42" y="116" width="6" height="26" rx="3"/>' +
      '<rect x="126" y="88" width="6" height="30" rx="3"/></g>' +
    '<circle cx="100" cy="94" r="72" fill="none" stroke="#7A34A2" stroke-width="3" opacity=".7"/>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:3, n:"Studio al neon", c:"#2B0F42", svg:
    '<rect width="200" height="200" fill="#1C0B2C"/>' +
    '<g fill="#160822"><rect x="6" y="70" width="40" height="124" rx="5"/>' +
      '<rect x="154" y="70" width="40" height="124" rx="5"/></g>' +
    '<g fill="#0E0518"><circle cx="26" cy="100" r="12"/><circle cx="26" cy="150" r="16"/>' +
      '<circle cx="174" cy="100" r="12"/><circle cx="174" cy="150" r="16"/></g>' +
    '<g stroke="#C64BFF" stroke-width="4" stroke-linecap="round" opacity=".85">' +
      '<path d="M60 26 L60 96"/><path d="M140 26 L140 96"/></g>' +
    '<g stroke="#3DC7FF" stroke-width="3" stroke-linecap="round" opacity=".7">' +
      '<path d="M78 20 L78 74"/><path d="M122 20 L122 74"/></g>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:4, n:"Tramonto", c:"#5A1327", svg:
    '<defs><linearGradient id="bgsun" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#8A1B33"/><stop offset="1" stop-color="#2A0A18"/></linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#bgsun)"/>' +
    '<circle cx="100" cy="96" r="70" fill="none" stroke="#C2415C" stroke-width="3" opacity=".55"/>' +
    '<g fill="#3A0B1C">' +
      '<rect x="0" y="128" width="24" height="72"/><rect x="26" y="112" width="18" height="88"/>' +
      '<rect x="150" y="120" width="22" height="80"/><rect x="176" y="104" width="24" height="96"/></g>' +
    '<g stroke="#3A0B1C" stroke-width="5" fill="none" stroke-linecap="round">' +
      '<path d="M46 200 L46 132"/><path d="M46 132 C34 120 24 122 20 132"/><path d="M46 132 C58 120 68 122 72 132"/>' +
      '<path d="M46 132 C40 118 32 112 24 112"/><path d="M46 132 C52 118 60 112 68 112"/>' +
      '<path d="M162 200 L162 142"/><path d="M162 142 C152 132 144 134 140 142"/><path d="M162 142 C172 132 180 134 184 142"/></g>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:5, n:"Sala prove", c:"#0F3A38", svg:
    '<defs><linearGradient id="bgte" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#12474A"/><stop offset="1" stop-color="#07201F"/></linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#bgte)"/>' +
    '<g stroke="#0A2E2E" stroke-width="6" opacity=".9">' +
      '<path d="M22 0 L22 200"/><path d="M58 0 L58 200"/><path d="M142 0 L142 200"/><path d="M178 0 L178 200"/></g>' +
    '<circle cx="100" cy="92" r="72" fill="#0D3B3B" opacity=".55"/>' +
    '<g fill="#061A1A"><rect x="24" y="96" width="12" height="104" rx="6"/>' +
      '<ellipse cx="30" cy="94" rx="13" ry="18"/></g>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:6, n:"Vicolo di notte", c:"#111C2E", svg:
    '<rect width="200" height="200" fill="#0C1521"/>' +
    '<g fill="#141F30"><path d="M0 0 L64 44 L64 200 L0 200Z"/><path d="M200 0 L136 44 L136 200 L200 200Z"/></g>' +
    '<g fill="#1D2C42"><rect x="8" y="60" width="18" height="26"/><rect x="8" y="104" width="18" height="26"/>' +
      '<rect x="174" y="60" width="18" height="26"/><rect x="174" y="104" width="18" height="26"/></g>' +
    '<circle cx="100" cy="46" r="34" fill="#24405F" opacity=".5"/>' +
    '<circle cx="100" cy="46" r="13" fill="#5E86B5" opacity=".55"/>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'},

  {id:7, n:"Corona", c:"#3B2A16", svg:
    '<defs><linearGradient id="bgbr" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4A3620"/><stop offset="1" stop-color="#1B120A"/></linearGradient></defs>' +
    '<rect width="200" height="200" fill="url(#bgbr)"/>' +
    '<path d="M118 96 L128 58 L146 82 L162 50 L172 96 Z" fill="none" stroke="#C99A3C" stroke-width="6" ' +
      'stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>' +
    '<circle cx="100" cy="94" r="72" fill="none" stroke="#6B5330" stroke-width="3" opacity=".6"/>' +
    '<rect width="200" height="200" fill="url(#bgv)"/>'}
];

/* la vignetta la usano tutti: sta una volta sola, richiamata per id */
const BG_DEFS =
  '<defs><radialGradient id="bgv" cx="50%" cy="42%" r="76%">' +
    '<stop offset="52%" stop-color="#000" stop-opacity="0"/>' +
    '<stop offset="100%" stop-color="#000" stop-opacity=".72"/>' +
  '</radialGradient></defs>';

const bgById = i => BGS[(i|0) % BGS.length] || BGS[0];
const bgSvg = i => '<svg class="bgart" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" ' +
  'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + BG_DEFS + bgById(i).svg + '</svg>';

/* ================= GLI OTTO AVATAR ================= */
/* Otto look completi, uno per fondale. Cliccarne uno riempie tutte le scelte:
   da lì cambi quello che vuoi, elemento per elemento. */
const PRESETS = [
  {n:"Il ricciolo", bg:0, look:{
    skin:"#C68A5C", hair:"ricci", hairCol:"#100D0C", face:"ovale", eyeCol:"#3A2A1A",
    brow:"folte", mouth:"carnosa", mood:"neutro", beard:"pizzetto", hat:"no",
    glasses:"no", chain:"grossa", ear:"brillante", grillz:"no", tattoo:"lacrima",
    fit:"felpa", clothCol:"#0E0E11", color:"#FFC53D"}},

  {n:"Il beanie", bg:1, look:{
    skin:"#B0774A", hair:"treccine", hairCol:"#1B1310", face:"squadrato", eyeCol:"#6B4E2A",
    brow:"folte", mouth:"normale", mood:"freddo", beard:"pizzetto", hat:"beanie",
    glasses:"no", chain:"doppia", ear:"brillante", grillz:"no", tattoo:"no",
    fit:"felpa", clothCol:"#0E0E11", color:"#EDEDEF"}},

  {n:"Il cappellino", bg:2, look:{
    skin:"#DDA679", hair:"fade", hairCol:"#100D0C", face:"ovale", eyeCol:"#3A2A1A",
    brow:"naturali", mouth:"normale", mood:"sicuro", beard:"pizzetto", hat:"cappellino",
    glasses:"no", chain:"sottile", ear:"brillante", grillz:"no", tattoo:"lacrima",
    fit:"canotta", clothCol:"#EDEDEF", color:"#B026FF"}},

  {n:"I dread", bg:3, look:{
    skin:"#9A6238", hair:"dread", hairCol:"#B98A3C", face:"ovale", eyeCol:"#3A2A1A",
    brow:"naturali", mouth:"carnosa", mood:"sfida", beard:"corta", hat:"bandana",
    glasses:"scuri", chain:"doppia", ear:"brillante", grillz:"oro", tattoo:"no",
    fit:"piumino", clothCol:"#0E0E11", color:"#B026FF"}},

  {n:"Il rasato", bg:4, look:{
    skin:"#C68A5C", hair:"rasati", hairCol:"#100D0C", face:"squadrato", eyeCol:"#3A2A1A",
    brow:"taglio", mouth:"seria", mood:"determinato", beard:"ombra", hat:"no",
    glasses:"no", chain:"sottile", ear:"brillante", grillz:"no", tattoo:"no",
    fit:"canotta", clothCol:"#EDEDEF", color:"#FF5A36"}},

  {n:"Il fonico", bg:5, look:{
    skin:"#DDA679", hair:"spazzola", hairCol:"#3A2418", face:"ovale", eyeCol:"#3B6B4A",
    brow:"naturali", mouth:"normale", mood:"neutro", beard:"corta", hat:"no",
    glasses:"no", chain:"sottile", ear:"no", grillz:"no", tattoo:"scritta",
    fit:"felpa", clothCol:"#1E3A2A", color:"#57C98B"}},

  {n:"Il notturno", bg:6, look:{
    skin:"#B0774A", hair:"corti", hairCol:"#100D0C", face:"tondo", eyeCol:"#1A1414",
    brow:"folte", mouth:"normale", mood:"freddo", beard:"pizzetto", hat:"bandana",
    glasses:"no", chain:"doppia", ear:"cerchio", grillz:"no", tattoo:"collo",
    fit:"black", clothCol:"#0E0E11", color:"#3DC7FF"}},

  {n:"La corona", bg:7, look:{
    skin:"#9A6238", hair:"treccine", hairCol:"#100D0C", face:"affilato", eyeCol:"#6B4E2A",
    brow:"sottili", mouth:"normale", mood:"sicuro", beard:"pizzetto", hat:"no",
    glasses:"piccoli", chain:"grossa", ear:"brillante", grillz:"oro", tattoo:"collo",
    fit:"pelle", clothCol:"#141416", color:"#FFC53D"}}
];

/* applica un avatar pronto: tocca solo l'aspetto, non nome, città, scena o genere */
function usaPreset(i){
  const p = PRESETS[i]; if(!p) return;
  Object.assign(A, p.look);
  A.bg = p.bg;
}
/* quanto un avatar pronto somiglia a quello che hai adesso: serve a segnare quello attivo */
function presetAttivo(){
  return PRESETS.findIndex(p => p.bg === (A.bg|0) &&
    Object.keys(p.look).every(k => A[k] === p.look[k]));
}
