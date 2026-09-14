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
    /* prima ancora delle copertine sui pezzi va via la **proposta** della
       Cover (`G.studio.coverProva`), che una foto ce l'ha ma non e' ancora
       di nessuno: sacrificare una confermata per tenere una in sospeso
       sarebbe al contrario */
    if(G.studio && G.studio.coverProva && G.studio.coverProva.img){
      G.studio.coverProva = null;
      pushLog("La memoria del browser è piena: ho lasciato la copertina che avevi proposto e non confermato.", "bad");
      return salvaConCopertine();
    }
    const conFoto = G.songs.filter(x => x.img);
    if(!conFoto.length) return false;
    delete conFoto[0].img;
    pushLog("La memoria del browser è piena: ho tolto la copertina più vecchia che avevi caricato.", "bad");
    return salvaConCopertine();
  }
}

/* ==================== IL TITOLO LO SCEGLI TU ====================
   Punto 3 del foglio «LUOGO: STUDIO»: quando tieni la take, il container
   chiede **solo il nome**. La copertina qui non c'e' piu' — si mette dopo,
   nella sezione Cover dello Studio, dove c'e' anche il tasto che la conferma.
   Il pezzo nasce con la copertina generata dal suo seed, come prima; chi
   passa `pezzo` (la rinomina dalla plancia) si riprende seed e foto intatti. */
function chiediTitolo(suggerito, onOk, pezzo){
  $("m-k").textContent = "Come lo chiami";
  $("m-t").textContent = "Il titolo del pezzo";
  const st = {seed:(pezzo && pezzo.seed) || Math.floor(Math.random()*1e9), img:(pezzo && pezzo.img) || ""};
  $("m-d").innerHTML = '<p style="margin:0 0 10px;font-size:14px;color:var(--soft)">' +
    'Il titolo resta attaccato a questo pezzo: lo vedrai in classifica e nel catalogo. ' +
    'La copertina la scegli dopo, nello Studio, alla sezione <b>Cover</b>.</p>' +
    '<div class="titolo"><input id="tt-in" maxlength="26" placeholder="' + suggerito + '" autocomplete="off">' +
    '<button class="dado" id="tt-dado" title="Dammene uno tu">🎲</button></div>';
  const w = $("m-opts"); w.innerHTML = "";
  const b = document.createElement("button");
  b.className = "opt2";
  b.innerHTML = pezzo
    ? '<span class="n">Cambia titolo</span><span class="d">La copertina resta quella</span>'
    : '<span class="n">Registra il pezzo</span><span class="d">Con questo titolo si va in sala</span>';
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
    inp.onkeydown = e => { if(e.key === "Enter"){ e.preventDefault(); chiudi(); } };
    $("tt-dado").onclick = () => { $("tt-in").value = title(); };
  }, 60);
}
