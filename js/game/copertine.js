/* Copertina caricata dall'utente e scelta del titolo del pezzo. */
"use strict";

/* ==================== LA COPERTINA LA METTI TU ==================== */
/* l'immagine viene ridotta a 360px e compressa, così sta nel salvataggio del browser */
function caricaCopertina(file, ok, ko){
  if(!file || !/^image\//.test(file.type)) return ko && ko("Non è un'immagine.");
  if(file.size > 12 * 1024 * 1024) return ko && ko("Immagine troppo pesante (max 12 MB).");
  const fr = new FileReader();
  fr.onerror = () => ko && ko("Non sono riuscito a leggere il file.");
  fr.onload = () => {
    const im = new Image();
    im.onerror = () => ko && ko("Immagine non valida.");
    im.onload = () => {
      const L = 360;
      const c = document.createElement("canvas"); c.width = L; c.height = L;
      const x = c.getContext("2d");
      const lato = Math.min(im.width, im.height);
      x.drawImage(im, (im.width-lato)/2, (im.height-lato)/2, lato, lato, 0, 0, L, L);
      let out = "";
      try{ out = c.toDataURL("image/jpeg", 0.72); }catch(e){ return ko && ko("Immagine non convertibile."); }
      ok(out);
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}
/* se il salvataggio non ci sta, la copertina caricata è la prima cosa che si sacrifica */
function salvaConCopertine(){
  try{ localStorage.setItem(CHIAVE_PARTITA(), JSON.stringify(G)); return true; }
  catch(e){
    const conFoto = G.songs.filter(x => x.img);
    if(!conFoto.length) return false;
    delete conFoto[0].img;
    pushLog("La memoria del browser è piena: ho tolto la copertina più vecchia che avevi caricato.", "bad");
    return salvaConCopertine();
  }
}

/* ==================== IL TITOLO LO SCEGLI TU ==================== */
function chiediTitolo(suggerito, onOk, pezzo){
  $("m-k").textContent = "Come lo chiami";
  $("m-t").textContent = "Il titolo del pezzo";
  const st = {titolo:suggerito, seed:(pezzo && pezzo.seed) || Math.floor(Math.random()*1e9), img:(pezzo && pezzo.img) || ""};
  $("m-d").innerHTML = '<p style="margin:0 0 10px;font-size:14px;color:var(--soft)">' +
    'Il titolo e la copertina restano attaccati a questo pezzo: li vedrai in classifica e nel catalogo.</p>' +
    '<div class="copbox"><div class="cop" id="tt-cop"></div>' +
    '<div class="copaz">' +
      '<button class="copbtn" id="tt-carica">Carica una copertina</button>' +
      '<button class="copbtn alt" id="tt-altra">Generane un\'altra</button>' +
      '<button class="copbtn alt" id="tt-togli">Togli la foto</button>' +
      '<span class="copnota" id="tt-nota">JPG o PNG. La ritaglio quadrata io.</span>' +
    '</div></div>' +
    '<div class="titolo"><input id="tt-in" maxlength="26" placeholder="' + suggerito + '" autocomplete="off">' +
    '<button class="dado" id="tt-dado" title="Dammene uno tu">🎲</button></div>' +
    '<input type="file" id="tt-file" accept="image/*" style="display:none">';
  const w = $("m-opts"); w.innerHTML = "";
  const b = document.createElement("button");
  b.className = "opt2";
  b.innerHTML = '<span class="n">Registra il pezzo</span><span class="d">Con questo titolo si va in sala</span>';
  const ridisegna = () => {
    const t = ($("tt-in") && $("tt-in").value.trim()) || suggerito;
    $("tt-cop").innerHTML = cover(st.seed, t, (window.ARTIST||{}).name || "", st.img);
    $("tt-togli").style.display = st.img ? "" : "none";
    $("tt-altra").style.display = st.img ? "none" : "";
  };
  const chiudi = () => {
    const v = ($("tt-in").value || "").trim() || suggerito;
    azioneFatta();
    MODALE_ANNULLA = null;
    $("modal").classList.remove("on");
    onOk(v.slice(0,26), st.seed, st.img);
  };
  b.onclick = chiudi;
  w.appendChild(b);
  /* la sala si puo' lasciare stare: strofa e beat non sono ancora stati consumati */
  MODALE_ANNULLA = () => annullaAzione();
  $("m-x").hidden = false;
  $("modal").classList.add("on");
  setTimeout(() => {
    const inp = $("tt-in"); if(!inp) return;
    inp.focus();
    inp.oninput = ridisegna;
    inp.onkeydown = e => { if(e.key === "Enter"){ e.preventDefault(); chiudi(); } };
    $("tt-dado").onclick = () => { $("tt-in").value = title(); ridisegna(); };
    $("tt-altra").onclick = () => { st.seed = Math.floor(Math.random()*1e9); ridisegna(); };
    $("tt-togli").onclick = () => { st.img = ""; $("tt-nota").textContent = "Copertina generata dal gioco."; ridisegna(); };
    $("tt-carica").onclick = () => $("tt-file").click();
    $("tt-file").onchange = ev => {
      const f = ev.target.files && ev.target.files[0]; if(!f) return;
      $("tt-nota").textContent = "Sto preparando l\'immagine…";
      caricaCopertina(f,
        dataUrl => { st.img = dataUrl; $("tt-nota").textContent = "Copertina tua, ritagliata a 360×360."; SFX.publish(); ridisegna(); },
        err => { $("tt-nota").textContent = err; SFX.fail(); });
    };
    ridisegna();
  }, 60);
}
