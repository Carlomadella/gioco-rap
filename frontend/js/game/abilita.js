/* L'ALBERO DELLE ABILITÀ — punto 13 di `implementazioni.md`, la schermata.

   Arriva tale e quale da `abilita(11).html`, il mock a pagina intera. Il
   disegno del concept è lo strato visivo vero
   (`media/photo/pagina_skill_tree/albero-abilita.png`, 1672×793): sopra ci
   stanno solo i 32 nodi da toccare, la colonna di destra e due pezze che
   coprono i comandi finti disegnati dentro alla foto. Non è una imitazione in
   CSS del disegno: è il disegno.

   **Qui c'è la schermata, non ancora il gioco.** I talenti non toccano niente
   della carriera — nessuna delle frasi in `effect` è collegata al codice che
   la eseguirebbe, e le PT non le guadagna nessuno. Per questo lo stato sta in
   un oggetto suo (`ABILITA_CHIAVE` nel localStorage) e **non dentro a `G`**:
   finché l'albero non muove davvero un numero, scrivere `pt` e `talenti` nel
   salvataggio vero vorrebbe dire sporcare la partita con un sistema che non
   fa ancora niente, e ritrovarselo lì il giorno che lo si collega sul serio.
   Il mock la stessa scelta ce l'aveva già dentro: `hasRealGame` cadeva sul
   ramo demo appena `window.G` non c'era. Qui quel ramo è l'unico che resta.

   Quando il punto 13 si chiude davvero, il pezzo da cambiare è uno solo:
   `stato()`. Tutto il resto — requisiti, bivi, fasi, costi — è già scritto.

   Le uniche cose cambiate rispetto al mock:
   - i dati dei nodi erano un `<script type="application/json">` dentro alla
     pagina, qui sono `ABILITA_DATI` (in casa i dati stanno nei .js: vedi
     `crime-backgrounds.js`, `content.js`);
   - `#toast` e `#confirmDialog` si chiamano `#ab-toast` e `#ab-confirm`. Sono
     nomi troppo generici per stare in un index.html da settecento righe, e
     due id uguali in due punti diversi si rompono in silenzio;
   - il tasto «indietro» chiude il pannello invece di fare `history.back()`.

   Si apre dalla linguetta **Abilità** della plancia (`hub.js`). */
"use strict";

/* I quattro rami e i loro 32 nodi. Stessi id, stessi costi, stessi testi del
   mock: se cambiano qui, cambiano nella schermata e basta. */
const ABILITA_DATI = {
    "branches": [
      {
        "id": "penna",
        "name": "PENNA",
        "subtitle": "foglio · barre · temi",
        "icon": "✎",
        "color": "#b55cff",
        "slots": [
          {
            "id": "quaderno",
            "row": 1,
            "cost": 1,
            "kind": "R",
            "name": "Quaderno sempre in tasca",
            "effect": "Nel foglio parti con 6 righe invece di 4, e il massimo sale da 10 a 12."
          },
          {
            "id": "orecchio",
            "row": 1,
            "cost": 1,
            "kind": "I",
            "name": "Orecchio per le rime",
            "effect": "Mentre scrivi, le finali che rimano tra loro si colorano dello stesso colore."
          },
          {
            "id": "metrica",
            "row": 2,
            "cost": 2,
            "kind": "I",
            "name": "Metrica a memoria",
            "effect": "Il contasillabe mostra anche il bersaglio, cioè la media delle righe vive, non solo il numero."
          },
          {
            "id": "vocabolario",
            "row": 2,
            "cost": 2,
            "kind": "N",
            "name": "Vocabolario sporco",
            "effect": "La penalità per le parole ripetute pesa il 40% in meno."
          },
          {
            "id": "doppiotempo",
            "row": 3,
            "cost": 2,
            "kind": "R",
            "name": "Doppio tempo",
            "effect": "Le barre oltre le 16 sillabe non vengono più punite dalla metrica: diventano una scelta."
          },
          {
            "id": "notte",
            "row": 3,
            "cost": 2,
            "kind": "R",
            "name": "Scrivi di notte",
            "effect": "Scrivere non toglie più benessere, ma il benessere naturale scende di 4 in permanenza."
          },
          {
            "id": "pezzoresta",
            "row": 4,
            "cost": 3,
            "kind": "R",
            "name": "Il pezzo che resta",
            "effect": "Un pezzo nato da una barra q80+ non decade mai sotto il 25% dei suoi stream di picco."
          },
          {
            "id": "bivio-penna",
            "row": 4,
            "cost": 2,
            "kind": "R",
            "type": "choice",
            "name": "Bivio della Penna",
            "effect": "Scegli che rapporto vuoi avere con la tua scrittura. L'altra strada si chiude per sempre.",
            "options": [
              {
                "id": "ghostwriter",
                "name": "Ghostwriter",
                "cost": 2,
                "effect": "L'evento «scrivere per un altro» paga 2.200 € e ricorre spesso; la tua Scrittura non cresce più oltre 70.",
                "excludes": "solorobamia"
              },
              {
                "id": "solorobamia",
                "name": "Solo roba mia",
                "cost": 2,
                "effect": "Nessun ghostwriting; le barre scritte a mano valgono ×1,8 invece di ×1,5.",
                "excludes": "ghostwriter"
              }
            ]
          }
        ]
      },
      {
        "id": "palco",
        "name": "PALCO",
        "subtitle": "piazza · live · folla",
        "icon": "★",
        "color": "#edbe58",
        "slots": [
          {
            "id": "pocket",
            "row": 1,
            "cost": 1,
            "kind": "N",
            "name": "Pocket",
            "effect": "La finestra «perfetto» in piazza si allarga del 25%."
          },
          {
            "id": "occhio",
            "row": 1,
            "cost": 1,
            "kind": "I",
            "name": "Occhio sul pubblico",
            "effect": "In piazza vedi il peso di ogni risposta prima di sceglierla."
          },
          {
            "id": "botta",
            "row": 2,
            "cost": 2,
            "kind": "N",
            "name": "Botta e risposta",
            "effect": "Le risposte da 1.0 valgono il doppio in folla."
          },
          {
            "id": "fiato",
            "row": 2,
            "cost": 2,
            "kind": "R",
            "name": "Fiato",
            "effect": "La piazza dura 44 battute invece di 34: più bottino, più occasioni di perderla."
          },
          {
            "id": "primafila",
            "row": 3,
            "cost": 2,
            "kind": "N",
            "name": "Prima fila",
            "effect": "Open mic: +40% fan se l'hype è almeno 40."
          },
          {
            "id": "faccia",
            "row": 3,
            "cost": 2,
            "kind": "R",
            "name": "Non ti scordi la faccia",
            "effect": "I fan presi dal vivo e in piazza sono immuni al churn settimanale."
          },
          {
            "id": "palcocasa",
            "row": 4,
            "cost": 3,
            "kind": "R",
            "name": "Il palco è casa",
            "effect": "Una volta a settimana «Freestyle in piazza» costa 0 energia.",
            "gate": {
              "key": "piazza",
              "need": 8,
              "label": "Aver giocato la piazza almeno 8 volte"
            }
          },
          {
            "id": "bivio-palco",
            "row": 4,
            "cost": 2,
            "kind": "R",
            "type": "choice",
            "name": "Bivio del Palco",
            "effect": "Scegli come vuoi stare davanti alla gente. L'altra strada si chiude per sempre.",
            "options": [
              {
                "id": "provocatore",
                "name": "Provocatore",
                "cost": 2,
                "effect": "Ogni live e ogni piazza dà +50% hype e −4 benessere.",
                "excludes": "rispetto"
              },
              {
                "id": "rispetto",
                "name": "Rispetto",
                "cost": 2,
                "effect": "I tuoi fan non ti lasciano mai, ma l'hype cresce del 30% più lento.",
                "excludes": "provocatore"
              }
            ]
          }
        ]
      },
      {
        "id": "strada",
        "name": "STRADA",
        "subtitle": "beat · contratti · rivali",
        "icon": "↗",
        "color": "#3aa8ff",
        "slots": [
          {
            "id": "numeri",
            "row": 1,
            "cost": 1,
            "kind": "R",
            "name": "Numeri giusti",
            "effect": "«Cerca un beat» porta 3 beat sul tavolo invece di 2."
          },
          {
            "id": "contratta",
            "row": 1,
            "cost": 1,
            "kind": "N",
            "name": "Sai contrattare",
            "effect": "I beat costano il 20% in meno."
          },
          {
            "id": "contrattochiaro",
            "row": 2,
            "cost": 2,
            "kind": "I",
            "name": "Non firmi al buio",
            "effect": "Nella scheda contratto vedi la stima a tre anni e quanto ti costa uscirne, non solo il primo anno."
          },
          {
            "id": "favore",
            "row": 2,
            "cost": 2,
            "kind": "R",
            "name": "Uno che ti deve un favore",
            "effect": "Una volta per fase puoi ritentare una prova fallita senza aspettare il trialCd."
          },
          {
            "id": "featuring",
            "row": 3,
            "cost": 3,
            "kind": "R",
            "name": "Featuring",
            "effect": "Nuova azione: registri con un rivale della top 10. La qualità è la media delle due, i fan si dividono, il rivale cresce anche lui."
          },
          {
            "id": "giro",
            "row": 3,
            "cost": 2,
            "kind": "N",
            "name": "Ti conoscono in giro",
            "effect": "Gli eventi con esito buono sono il 30% più probabili."
          },
          {
            "id": "stanze",
            "row": 4,
            "cost": 3,
            "kind": "R",
            "name": "Le stanze giuste",
            "effect": "Le offerte di contratto arrivano a metà dei fan richiesti.",
            "gate": {
              "key": "contrattiRifiutati",
              "need": 1,
              "label": "Aver rifiutato almeno un contratto"
            }
          },
          {
            "id": "bivio-strada",
            "row": 4,
            "cost": 2,
            "kind": "R",
            "type": "choice",
            "name": "Bivio della Strada",
            "effect": "Scegli quanto vuoi esporti. L'altra strada si chiude per sempre.",
            "options": [
              {
                "id": "facciapubblica",
                "name": "Ci metti la faccia",
                "cost": 2,
                "effect": "+25% fan da tutto, ma gli eventi cattivi ti trovano il doppio più spesso.",
                "excludes": "ombra"
              },
              {
                "id": "ombra",
                "name": "Resti nell'ombra",
                "cost": 2,
                "effect": "Nessun evento cattivo legato alla notorietà, ma il tetto di fase è più basso del 15%.",
                "excludes": "facciapubblica"
              }
            ]
          }
        ]
      },
      {
        "id": "schiena",
        "name": "SCHIENA",
        "subtitle": "benessere · energia · resistenza",
        "icon": "◆",
        "color": "#67d49a",
        "slots": [
          {
            "id": "dormi",
            "row": 1,
            "cost": 1,
            "kind": "N",
            "name": "Dormi quando puoi",
            "effect": "«Stacca la spina» dà 8 benessere in più."
          },
          {
            "id": "mangi",
            "row": 1,
            "cost": 1,
            "kind": "N",
            "name": "Mangi poco",
            "effect": "Le spese settimanali calano del 15%."
          },
          {
            "id": "schienadritta",
            "row": 2,
            "cost": 2,
            "kind": "N",
            "name": "Schiena dritta",
            "effect": "I turni di lavoro tolgono 2 benessere invece di 4."
          },
          {
            "id": "rosso",
            "row": 2,
            "cost": 2,
            "kind": "R",
            "name": "Sai stare in rosso",
            "effect": "Il malus −12 al benessere naturale per il conto in negativo sparisce.",
            "gate": {
              "key": "rosso",
              "need": 10,
              "label": "Aver chiuso almeno 10 settimane con soldi sotto zero"
            }
          },
          {
            "id": "quartoturno",
            "row": 3,
            "cost": 3,
            "kind": "R",
            "name": "Quarto turno",
            "effect": "+1 energia massima."
          },
          {
            "id": "testadura",
            "row": 3,
            "cost": 2,
            "kind": "R",
            "name": "Testa dura",
            "effect": "Il moltiplicatore benessere in qFactors() non scende mai sotto 0,85."
          },
          {
            "id": "quintoturno",
            "row": 4,
            "cost": 3,
            "kind": "R",
            "name": "Quinto turno",
            "effect": "+1 energia massima. Richiede Quarto turno.",
            "req": [
              "quartoturno"
            ]
          },
          {
            "id": "bivio-schiena",
            "row": 4,
            "cost": 2,
            "kind": "R",
            "type": "choice",
            "name": "Bivio della Schiena",
            "effect": "Scegli come vuoi reggere la pressione. L'altra strada si chiude per sempre.",
            "options": [
              {
                "id": "famevera",
                "name": "Fame vera",
                "cost": 2,
                "effect": "Sotto 35 di benessere il moltiplicatore qualità diventa 1,15 invece che 0,58; inoltre −1 energia massima.",
                "excludes": "ordinata",
                "gate": {
                  "key": "fondo",
                  "need": 1,
                  "label": "Aver toccato 20 di benessere almeno una volta"
                }
              },
              {
                "id": "ordinata",
                "name": "Vita ordinata",
                "cost": 2,
                "effect": "Sopra 70 di benessere +1 energia; sotto 40 non puoi registrare.",
                "excludes": "famevera"
              }
            ]
          }
        ]
      }
    ]
  };

/* Lo stato dell'albero: suo, non quello della partita. Vedi il commento in
   cima al file — il giorno che i talenti contano davvero, questa è la riga
   da cambiare. */
const ABILITA_CHIAVE = "adf-minimal-aaa-abilita";
const ABILITA_PARTENZA = {
  phase: 3, pt: 42, lvlVisto: 50, talenti: {},
  conta: { rosso: 10, piazza: 8, contrattiRifiutati: 1, fondo: 1 },
  skills: { scrittura: 75, flow: 75, presenza: 75, rete: 75 },
  artistName: "ALBERO"
};

(() => {
  const DATA = ABILITA_DATI;
  function stato(){
    try{ return Object.assign({}, ABILITA_PARTENZA, JSON.parse(localStorage.getItem(ABILITA_CHIAVE) || "{}")); }
    catch(e){ return JSON.parse(JSON.stringify(ABILITA_PARTENZA)); }
  }
  const game = stato();
  game.talenti ||= {}; game.conta ||= {};
  if(typeof game.pt !== "number") game.pt = 42;
  if(typeof game.phase !== "number") game.phase = 3;

  const branches = Object.fromEntries(DATA.branches.map(b => [b.id, b]));
  const slots = DATA.branches.flatMap(b => b.slots.map(s => ({...s, branch: b.id, color: b.color})));
  const byId = Object.fromEntries(slots.map(s => [s.id, s]));
  const choices = slots.filter(s => s.type === "choice")
    .flatMap(s => s.options.map(o => ({...o, parent: s.id, branch: s.branch, row: s.row, color: s.color})));
  const choiceById = Object.fromEntries(choices.map(o => [o.id, o]));
  let selectedId = null, pending = null, selectedChoice = null;

  /* Le ricerche stanno dentro al pannello: fuori di lì questo file non guarda. */
  const radice = () => document.getElementById("abilita");
  const q = s => radice().querySelector(s), qa = s => [...radice().querySelectorAll(s)];
  const visualName = {palco:"RAP", penna:"SCRITTURA", schiena:"CARISMA", strada:"NETWORKING"};
  const visualColor = {palco:"#b557ff", penna:"#ef4dcc", schiena:"#f0c54f", strada:"#27a9ff"};

  function owns(id){ return !!game.talenti[id] }
  function save(){
    try{ localStorage.setItem(ABILITA_CHIAVE, JSON.stringify(game)); }catch(e){}
    window.dispatchEvent(new CustomEvent("adf:talenti-change", {detail:{talenti:{...game.talenti}, pt:game.pt}}));
  }
  function visible(item){ return (game.phase + 1) >= item.row }
  function gateOk(item){ return !item.gate || (game.conta[item.gate.key] || 0) >= item.gate.need }
  function excluded(item){ return !!(item.excludes && owns(item.excludes)) }
  function reason(item){
    if(owns(item.id)) return "Già acquisito";
    if(!visible(item)) return `Serve la fase ${item.row}`;
    if(excluded(item)) return "Hai scelto l’altra strada";
    const miss = (item.req || []).find(id => !owns(id));
    if(miss) return `Manca ${choiceById[miss]?.name || byId[miss]?.name || miss}`;
    if(!gateOk(item)) return item.gate.label;
    if(game.pt < item.cost) return `Servono ${item.cost} pagine`;
    return null;
  }
  function status(item){
    const list = [];
    list.push({ok:visible(item), label:`Fase ${item.row} raggiunta`});
    (item.req || []).forEach(id => list.push({ok:owns(id), label:`Talento: ${byId[id]?.name || id}`}));
    if(item.gate) list.push({ok:gateOk(item), label:item.gate.label});
    if(item.excludes) list.push({ok:!owns(item.excludes), label:"Alternativa ancora libera"});
    list.push({ok:game.pt >= item.cost, label:`${item.cost} pagine disponibili`});
    return list;
  }
  function slotOwned(slot){ return slot.type === "choice" ? slot.options.some(o => owns(o.id)) : owns(slot.id) }
  function slotReason(slot){
    if(slot.type === "choice") return slot.options.every(o => !!reason({...o, row:slot.row})) ? "Bivio non disponibile" : null;
    return reason(slot);
  }
  function renderHotspots(){
    qa(".skill-hotspot").forEach(el => {
      const slot = byId[el.dataset.nodeId];
      const isOwned = slotOwned(slot);
      const why = slotReason(slot);
      const isReady = !isOwned && !why;
      el.style.setProperty("--node-accent", visualColor[slot.branch] || slot.color || "#b557ff");
      el.classList.toggle("owned", isOwned);
      el.classList.toggle("ready", isReady);
      el.classList.toggle("blocked", !!why && !isOwned);
      el.classList.toggle("selected", selectedId === slot.id);
      el.setAttribute("aria-pressed", isOwned ? "true" : "false");
      el.setAttribute("aria-disabled", !isOwned && !!why ? "true" : "false");
      el.dataset.status = isOwned ? "owned" : isReady ? "ready" : "locked";
    });
    q("#livePages").textContent = `${game.pt} PT`;
    q("#livePages").classList.toggle("on", game.pt !== 42);
  }
  function reqHtml(item){
    return status(item).map(r => `<div class="reqline ${r.ok?"ok":"no"}"><i>${r.ok?"✓":"×"}</i><span>${r.label}</span></div>`).join("");
  }
  function setSidebarMeta(slot){
    const idx = slots.findIndex(s => s.id === slot.id) + 1;
    q("#rightSidebarIndex").textContent = `${String(idx).padStart(2,"0")} / ${slots.length}`;
    q("#rightSidebar").style.setProperty("--accent", visualColor[slot.branch]);
    q("#rightSidebarBadge").textContent = branches[slot.branch]?.icon || "◆";
  }
  function renderSidebarBuy(label, cost, disabled, handler){
    const buy = q("#buyTalent"), costEl = q("#rightSidebarCost");
    buy.textContent = label; buy.disabled = !!disabled;
    costEl.textContent = cost == null ? "—" : `${cost} P`;
    buy.onclick = !disabled && handler ? handler : null;
  }
  function detail(slot){
    selectedId = slot.id; selectedChoice = null; renderHotspots(); setSidebarMeta(slot);
    if(slot.type === "choice"){ renderChoice(slot); return }
    const why = reason(slot), owned = owns(slot.id);
    q("#rightSidebarBody").innerHTML =
      `<div class="eyebrow"><span>${visualName[slot.branch]} · ${slot.kind}</span><span>NODO ${slot.row}/4</span></div>` +
      `<h2>${slot.name}</h2>` +
      `<p class="kind-copy">${slot.kind==="R"?"Cambia una regola concreta della carriera.":slot.kind==="I"?"Rende visibile prima un’informazione utile.":"Modifica un valore del sistema."}</p>` +
      `<div class="effect"><strong>${slot.effect}</strong></div>` +
      `<div class="req"><h3>Requisiti</h3>${reqHtml(slot)}</div>`;
    renderSidebarBuy(owned ? "Acquisito" : why || "Sblocca nodo", slot.cost, !!why, () => ask(slot, false));
  }
  function renderChoice(slot){
    const bought = slot.options.find(o => owns(o.id));
    q("#rightSidebarBody").innerHTML =
      `<div class="eyebrow"><span>${visualName[slot.branch]} · BIVIO</span><span>SCELTA</span></div>` +
      `<h2>${slot.name}</h2><p class="kind-copy">${slot.effect}</p>` +
      `<div class="choicebox">${slot.options.map(o =>
        `<button class="choice ${owns(o.id)?"on":""}" data-choice="${o.id}" type="button" ${excluded(o)?"disabled":""}>` +
        `<strong>${o.name}</strong><small>${o.effect}</small></button>`).join("")}</div>` +
      `<div class="req" id="choiceReq"><h3>Requisiti</h3><div class="reqline"><i>·</i><span>Seleziona una delle due strade.</span></div></div>`;
    renderSidebarBuy(bought ? "Scelta fissata" : "Seleziona una strada", 2, true, null);
    qa("#rightSidebarBody [data-choice]").forEach(btn => btn.onclick = () => {
      selectedChoice = btn.dataset.choice;
      const item = choiceById[selectedChoice];
      qa("#rightSidebarBody .choice").forEach(c => c.classList.toggle("on", c.dataset.choice === selectedChoice));
      q("#choiceReq").innerHTML = `<h3>Requisiti</h3>${reqHtml(item)}`;
      const why = reason(item);
      renderSidebarBuy(why || `Scegli ${item.name}`, item.cost, !!why, () => ask(item, true));
    });
  }
  function ask(item, isChoice){
    pending = {item, isChoice};
    q("#ab-confirm-titolo").textContent = item.name;
    q("#ab-confirm-testo").textContent = isChoice
      ? "Questa scelta bloccherà per sempre l’alternativa. Non esiste respec."
      : `Spendi ${item.cost} ${item.cost===1?"pagina":"pagine"} per acquisire questo talento in modo permanente?`;
    q("#ab-confirm").showModal();
  }
  function confermaAcquisto(){
    if(!pending) return;
    const item = pending.item, why = reason(item);
    if(why){ flash(why); q("#ab-confirm").close(); pending = null; return }
    game.pt -= item.cost; game.talenti[item.id] = true; save();
    q("#ab-confirm").close(); pending = null;
    flash("Talento acquisito"); renderHotspots();
    const parent = item.parent ? byId[item.parent] : byId[item.id];
    if(parent) detail(parent);
  }
  function flash(msg){
    const t = q("#ab-toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(flash.t);
    flash.t = setTimeout(() => t.classList.remove("on"), 1400);
  }

  qa(".skill-hotspot").forEach(el => el.addEventListener("click", () => detail(byId[el.dataset.nodeId])));
  q("#returnToMap").addEventListener("click", () => chiudiAbilita());
  q("#ab-annulla").onclick = () => { pending = null; q("#ab-confirm").close() };
  q("#ab-conferma").onclick = confermaAcquisto;

  /* Apertura e chiusura: stessa famiglia della Sala e dello Studio. */
  function apriAbilita(nodo){
    radice().classList.add("on");
    renderHotspots();
    detail(byId[nodo] || slots[0]);
  }
  function chiudiAbilita(){
    if(q("#ab-confirm").open) q("#ab-confirm").close();
    pending = null;
    radice().classList.remove("on");
    window.dispatchEvent(new CustomEvent("adf:abilities-close"));
  }
  window.apriAbilita = apriAbilita;
  window.chiudiAbilita = chiudiAbilita;
  window.ADF_ABILITA_API = {
    data: DATA, state: game,
    openTalent: id => byId[id] && detail(byId[id]),
    owns, reason, render: renderHotspots, close: chiudiAbilita
  };

  renderHotspots();
  if(slots.length) detail(slots[0]);
})();
