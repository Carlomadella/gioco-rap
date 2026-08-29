/* renderArtista(): ridisegna anteprima, riepilogo e barra del creatore. */
"use strict";

/* ================= RENDER ================= */
let vistaCorpo = false;
const chipRow = (list, key) => list.map(x =>
  '<button class="chip' + (x.id === A[key] ? " on" : "") + '" data-k="' + key + '" data-v="' + x.id + '">' + x.n + '</button>').join("");

function renderArtista(){
  const sc = scene(), g = genre(), f = fit();

  $("stage").style.setProperty("--c1", A.color);
  $("stagebg").innerHTML = bgSvg(A.bg);
  window.__POSE = "fermo";
  $("figure").innerHTML = vistaCorpo
    ? '<svg class="intero" viewBox="-150 -470 300 500" xmlns="http://www.w3.org/2000/svg">' + window.ARTIST_BODY() + '</svg>'
    : portrait();
  document.querySelectorAll(".vb").forEach(v => v.classList.toggle("on",
    (v.dataset.vista === "intero") === vistaCorpo));
  $("silh").innerHTML = silhouette();
  $("silh-txt").innerHTML = "<b>" + A.h + " cm · " + A.w + " kg</b>Statura " + statureLabel() +
    ", corporatura " + buildLabel() + ".";

  const nm = A.name.trim() || "Senza Nome";
  const cityName = A.city.trim() || sc.n;
  $("pv-name").textContent = nm;
  $("pv-sub").textContent = cityName + " · " + g.n;
  $("pv-h").textContent = A.h + " cm";
  $("pv-w").textContent = A.w + " kg";
  $("pv-build").textContent = buildLabel();
  $("pv-fit").textContent = f.n;
  $("pv-desc").textContent = "In giro ti vedono con la " + f.n.toLowerCase() +
    (A.chain !== "no" ? ", catena " + (CHAINS.find(c=>c.id===A.chain)||{n:""}).n.toLowerCase() : "") + ".";

  $("bar-name").textContent = nm;
  $("bar-sub").textContent = A.name.trim() ? cityName + " · " + g.n + " · " + f.n
    : "Completa il nome per iniziare";
  $("save").disabled = !A.name.trim();

  $("scenes").innerHTML  = chipRow(SCENES, "scene");
  $("faces").innerHTML   = chipRow(FACES, "face");
  $("mouths").innerHTML  = chipRow(MOUTHS, "mouth");
  $("moods").innerHTML   = chipRow(MOODS, "mood");

  $("skins").innerHTML = SKINS.map(x =>
    '<button class="sw-btn' + (x === A.skin ? " on" : "") + '" data-k="skin" data-v="' + x + '" style="background:' + x + '" aria-label="carnagione"></button>').join("");
  $("colors").innerHTML = COLORS.map(x =>
    '<button class="sw-btn' + (x === A.color ? " on" : "") + '" data-k="color" data-v="' + x + '" style="background:' + x + '" aria-label="colore"></button>').join("");

  $("genres").innerHTML = GENRES.map(x =>
    '<button class="gcard' + (x.id === A.genre ? " on" : "") + '" data-k="genre" data-v="' + x.id + '">' +
    '<span class="gn">' + x.n + '</span><span class="gd">' + x.d + '</span><span class="gb">' + x.b + '</span></button>').join("");

  $("effects").innerHTML =
    ['<div class="eff"><span class="dot"></span><span><b>' + cityName + '</b> — ' + sc.d + '</span></div>']
    .concat(sc.eff.map(e => '<div class="eff"><span class="dot"></span><span>' + e + '</span></div>'))
    .concat(['<div class="eff"><span class="dot"></span><span><b>' + g.n + '</b> — ' + g.d + '</span></div>'])
    .concat(g.eff.map(e => '<div class="eff"><span class="dot"></span><span>' + e + '</span></div>'))
    .join("");
}
