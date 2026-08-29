/* La barra delle categorie: capelli, cappelli, occhi, accessori, vestiti, tatuaggi.
   Ogni opzione è un ritratto vero della tua faccia con quel solo elemento cambiato,
   tagliato sul punto che conta. Niente icone generiche: vedi quello che scegli. */
"use strict";

/* Ritaglia il ritratto su una finestra: serve per mostrare solo la testa,
   solo gli occhi o solo il petto a seconda della categoria. */
function cropRitratto(chiavi, box){
  const vecchi = {};
  for(const k in chiavi){ vecchi[k] = A[k]; A[k] = chiavi[k]; }
  /* via le sfocature: in un riquadro da 52 pixel non si vedono, e centosessanta
     filtri gaussiani in pagina inchiodano il browser */
  const svg = portrait()
    .replace('class="portrait" viewBox="-100 -155 200 255"', 'class="mini" viewBox="' + box + '"')
    .replace(' aria-label="ritratto del personaggio"', ' aria-hidden="true"')
    .replace(/<filter id="morb[\s\S]*?<\/filter>/g, "")
    .replace(/ filter="url\(#morb[^"]*\)"/g, "");
  for(const k in vecchi) A[k] = vecchi[k];
  return svg;
}

/* le finestre di ritaglio, una per categoria */
const CROP = {
  testa:  "-72 -152 144 112",   /* calotta e capelli */
  occhi:  "-56 -112 112 58",    /* sopracciglia e occhi */
  faccia: "-74 -116 148 148",   /* dagli occhi al collo: barba, tatuaggi, orecchini */
  collo:  "-84 -52 168 132",    /* mento e petto: le catene */
  busto:  "-100 -34 200 134"    /* spalle e torace: i vestiti */
};

/* Le sei categorie della barra. Ogni riga è un elenco di opzioni:
   `k` è il campo dell'artista, `list` le scelte, `crop` dove si guarda. */
const CATEGORIE = [
  {id:"capelli", n:"Capelli", righe:[
    {k:"hair", list:HAIRS, crop:"testa"},
    {k:"hairCol", list:HAIRCOLS.map(x => ({id:x.c, n:x.n})), crop:"testa", tinta:true}
  ]},
  {id:"cappelli", n:"Cappelli", righe:[
    {k:"hat", list:HATS, crop:"testa"}
  ]},
  {id:"occhi", n:"Occhi", righe:[
    {k:"eyeCol", list:EYECOLS.map(x => ({id:x.c, n:x.n})), crop:"occhi", tinta:true},
    {k:"brow", list:BROWS, crop:"occhi"},
    {k:"glasses", list:GLASSES, crop:"occhi"}
  ]},
  {id:"accessori", n:"Accessori", righe:[
    {k:"chain", list:CHAINS, crop:"collo"},
    {k:"ear", list:EARS, crop:"faccia"},
    {k:"grillz", list:GRILLZ, crop:"faccia"}
  ]},
  {id:"vestiti", n:"Vestiti", righe:[
    {k:"fit", list:FITS, crop:"busto"},
    {k:"clothCol", list:[{id:"", n:"Come lo stile"}].concat(
      ["#2E3440","#0E0E11","#EDEDEF","#2B6CF0","#E8452F","#57C98B","#FFC53D","#B026FF","#8A5A2B","#26313F"]
      .map(c => ({id:c, n:"Tinta"}))), crop:"busto", tinta:true}
  ]},
  {id:"tatuaggi", n:"Tatuaggi", righe:[
    {k:"tattoo", list:TATTOOS, crop:"faccia"},
    {k:"beard", list:BEARDS, crop:"faccia"}
  ]}
];

/* ================= la galleria degli otto ================= */
/* Le card non cambiano mai: si disegnano una volta sola e restano lì. */
let GALLERIA_HTML = "";
function costruisciGalleria(){
  const salvato = {};
  const campi = Object.keys(PRESETS[0].look).concat(["bg"]);
  campi.forEach(k => salvato[k] = A[k]);
  GALLERIA_HTML = PRESETS.map((p, i) => {
    Object.assign(A, p.look);
    const pt = portrait().replace('class="portrait"', 'class="cardport"');
    return '<button class="avcard" data-preset="' + i + '" title="' + p.n + '">' +
      '<span class="num">' + (i+1) + '</span>' +
      '<span class="bgw">' + bgSvg(p.bg) + '</span>' +
      '<span class="ptw">' + pt + '</span>' +
      '<span class="cn">' + p.n + '</span></button>';
  }).join("");
  campi.forEach(k => A[k] = salvato[k]);
}

function renderGalleria(){
  if(!GALLERIA_HTML) costruisciGalleria();
  const g = $("galleria");
  if(g.innerHTML !== GALLERIA_HTML) g.innerHTML = GALLERIA_HTML;
  const att = presetAttivo();
  g.querySelectorAll(".avcard").forEach((c, i) => c.classList.toggle("on", i === att));
}

/* ================= la barra delle categorie ================= */
/* Ridisegnare ottantaquattro ritratti costa un decimo di secondo: al clic
   sposto subito il bordo sull'opzione scelta e rifaccio le anteprime dopo,
   così il tocco risponde all'istante. */
let opzTimer = 0;
function renderOpzioni(){
  renderGalleria();
  if(!$("catbar").children.length){ costruisciCatbar(); return; }
  segnaOpzioni();
  clearTimeout(opzTimer);
  opzTimer = setTimeout(costruisciCatbar, 90);
}
function segnaOpzioni(){
  $("catbar").querySelectorAll(".opt").forEach(b =>
    b.classList.toggle("on", (A[b.dataset.k] || "") === (b.dataset.v || "")));
}
function costruisciCatbar(){
  $("catbar").innerHTML = CATEGORIE.map(cat =>
    '<div class="catbox" data-cat="' + cat.id + '">' +
      '<div class="cathead">' + cat.n + '</div>' +
      cat.righe.map(r => {
        const box = CROP[r.crop] || CROP.testa;
        return '<div class="optrow">' + r.list.map(o => {
          const on = (A[r.k] || "") === (o.id || "") ? " on" : "";
          const chiavi = {}; chiavi[r.k] = o.id;
          const dentro = r.tinta
            ? '<span class="tint" style="background:' +
                (o.id || "linear-gradient(135deg,#FF5A36,#B026FF)") + '"></span>'
            : cropRitratto(chiavi, box);
          return '<button class="opt' + on + '" data-k="' + r.k + '" data-v="' + o.id +
            '" title="' + o.n + '">' + dentro + '</button>';
        }).join("") + '</div>';
      }).join("") +
    '</div>').join("");
}

/* i fondali: si scelgono come tutto il resto */
function renderFondali(){
  $("fondali").innerHTML = BGS.map((b, i) =>
    '<button class="bgpick' + ((A.bg|0) === i ? " on" : "") + '" data-k="bg" data-v="' + i +
    '" title="' + b.n + '">' + bgSvg(i) + '<span class="bn">' + b.n + '</span></button>').join("");
}
