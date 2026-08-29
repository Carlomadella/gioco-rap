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
  /* le anteprime delle opzioni mostrano la tua faccia: cambiata quella, vanno rifatte */
  if(typeof renderOpzioni === "function"){ renderOpzioni(); renderFondali(); }
});

/* uno degli otto pronti: riempie tutto l'aspetto in un colpo */
document.addEventListener("click", e => {
  const c = e.target.closest("[data-preset]");
  if(!c) return;
  usaPreset(+c.dataset.preset);
  renderArtista(); renderOpzioni(); renderFondali();
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
  A.eyes = Math.random() < .35 ? pick(EYES).id : "auto";
  A.cuffie = Math.random() < .2 ? pick(CUFFIE).id : "no";
  A.beard = pick(BEARDS).id; A.tattoo = pick(TATTOOS).id;
  A.bg = Math.floor(Math.random()*BGS.length);
  A.h = 158 + Math.floor(Math.random()*45);
  A.w = 50 + Math.floor(Math.random()*70);
  $("name").value = A.name; $("city").value = A.city;
  $("h").value = A.h; $("w").value = A.w;
  $("hv").textContent = A.h + " cm"; $("wv").textContent = A.w + " kg";
  renderArtista(); renderOpzioni(); renderFondali();
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
  document.querySelector(".avhead p").textContent = firstRun
    ? "Parti da uno degli otto e cambia ogni elemento: capelli, cappelli, occhi, accessori, vestiti, tatuaggi."
    : "Cambia quello che vuoi, elemento per elemento. Resta tutto modificabile, tranne da dove vieni.";
}

