/* Input del creatore: campi, slider, chip, salvataggio, casuale. */
"use strict";

/* ================= EVENTI ================= */
$("name").value = A.name; $("city").value = A.city;
$("h").value = A.h; $("w").value = A.w;
$("hv").textContent = A.h + " cm"; $("wv").textContent = A.w + " kg";

$("name").addEventListener("input", e => { A.name = e.target.value; renderArtista(); });
$("city").addEventListener("input", e => { A.city = e.target.value; renderArtista(); });
$("h").addEventListener("input", e => { A.h = +e.target.value; $("hv").textContent = A.h + " cm"; renderArtista(); });
$("w").addEventListener("input", e => { A.w = +e.target.value; $("wv").textContent = A.w + " kg"; renderArtista(); });

document.addEventListener("click", e => {
  const b = e.target.closest("[data-k]");
  if(!b) return;
  A[b.dataset.k] = b.dataset.v;
  renderArtista();
});

$("rand").onclick = () => {
  const NOMI = ["Ali","Zero","Kobra","Nino","Sette","Lupo","Ghiaccio","Trenta","Vetro","Fame","Neve","Ferro"];
  const SUF  = ["Fame","Zero","93","Uno","Nero","Sette","OG","Vento","Boy"];
  const CIT  = ["Milano","Roma","Napoli","Torino","Bologna","Palermo","Bari","Brescia","Sesto San Giovanni"];
  A.name = pick(NOMI) + " " + pick(SUF);
  A.city = pick(CIT);
  A.scene = pick(SCENES).id; A.genre = pick(GENRES).id; A.fit = pick(FITS).id;
  A.skin = pick(SKINS); A.hair = pick(HAIRS).id; A.color = pick(COLORS);
  A.hairCol = pick(HAIRCOLS).c; A.face = pick(FACES).id; A.eyeCol = pick(EYECOLS).c;
  A.brow = pick(BROWS).id; A.mouth = pick(MOUTHS).id; A.mood = pick(MOODS).id;
  A.hat = Math.random() < .45 ? pick(HATS).id : "no";
  A.ear = Math.random() < .4 ? pick(EARS).id : "no";
  A.grillz = Math.random() < .25 ? pick(GRILLZ).id : "no";
  A.clothCol = "";
  A.glasses = pick(GLASSES).id; A.chain = pick(CHAINS).id;
  A.beard = pick(BEARDS).id; A.tattoo = pick(TATTOOS).id;
  A.h = 158 + Math.floor(Math.random()*45);
  A.w = 50 + Math.floor(Math.random()*70);
  $("name").value = A.name; $("city").value = A.city;
  $("h").value = A.h; $("w").value = A.w;
  $("hv").textContent = A.h + " cm"; $("wv").textContent = A.w + " kg";
  renderArtista();
};

let firstRun = !A.name.trim();

$("save").onclick = () => {
  if(!A.name.trim()) return;
  try{ localStorage.setItem(ART_KEY, JSON.stringify(A)); }catch(e){}
  if(firstRun){
    firstRun = false;
    applyMode();
    goto("menu");
    return;
  }
  const el = $("saved");
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 2200);
};

function applyMode(){
  $("save").textContent = firstRun ? "Crea l'artista" : "Salva modifiche";
  document.querySelector(".top h1").textContent = firstRun ? "Crea il tuo artista" : "Il tuo artista";
  document.querySelector(".top p").textContent = firstRun
    ? "Benvenuto. Prima di tutto: chi sei. Puoi cambiare quasi tutto anche dopo, tranne da dove vieni."
    : "Chi sei prima ancora del primo pezzo. Tutto modificabile in qualsiasi momento, tranne la città.";
}

