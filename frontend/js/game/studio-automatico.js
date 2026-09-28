/* ==================== IL RESTO IN AUTOMATICO ====================
   CARLO, «Studio (16/09/2026)»: «l'utente deve poter fare solo le sezioni
   Beat, Testo e Cabina, poi il resto in automatico, però questo porta dei
   malus».

   Dopo la Cabina il pezzo sta sul banco, e Mix e Uscita si aprono su di lui.
   Chi non li vuole fare li lascia al gioco con un tocco: il gioco lo mixa «della
   casa» e lo mette in coda per venerdì. Non costa energia né una mossa, e
   questo è il vantaggio. I malus sono due, e sono scritti sul pezzo:

     mix della casa   +STUDIO_AUTO_MIX invece del mix vero (6 + flow, il fonico
                      e i cursori, che di solito fanno +7…+15), e niente flow
     venerdì secco    esce venerdì come chi aspetta apposta, ma senza l'hype
                      dell'attesa (STUDIO_VENERDI_HYPE): non l'hai aspettato tu

   Un pezzo già mixato a mano perde solo il secondo: il gioco fa l'Uscita.
   La copertina resta quella che il pezzo ha già; una proposta non confermata
   si lascia cadere, come «Lascia com'era». */

const STUDIO_AUTO_MIX = 3;

/* il pezzo che si può chiudere in automatico: quello sul banco, inciso, non
   ancora in coda (in coda l'Uscita è già decisa) */
function studioAutoPezzo(){
  if(typeof studioSulBanco !== "function") return null;
  const s = studioSulBanco();
  return s && !s.released && !s.tenuto && s.esce == null ? s : null;
}

/* La riga che lo propone, sotto al pannello di Cabina e di Mix. Dice il prezzo
   prima del tocco: quanto rende il mix della casa contro il tuo, e che il
   venerdì non porta hype. */
function studioAutoRiga(){
  const s = studioAutoPezzo();
  if(!s) return "";
  const tuo = typeof mixGain === "function" ? mixGain() : 0;
  const mix = s.mixed ? "" :
    ' il mix della casa dà <b>+' + STUDIO_AUTO_MIX + '</b>' +
    (tuo > STUDIO_AUTO_MIX ? ' (il tuo +' + tuo + ')' : '') + ',';
  return '<div class="stauto">' +
    '<p class="stnota">Il resto lo può chiudere il gioco:' + mix +
      ' «' + studioEsc(s.t) + '» esce <b>venerdì</b> ma senza l\'hype dell\'attesa. ' +
      'Niente energia, niente mossa.</p>' +
    '<p class="stazlink"><button type="button" class="stlink" data-auto="1">' +
      stIco("spunta") + (s.mixed ? 'fai uscire tu venerdì' : 'chiudi tu il resto: mix e uscita') +
    '</button></p>' +
  '</div>';
}

function studioRestoAutomatico(){
  const s = studioAutoPezzo();
  if(!s) return;
  if(!s.mixed){
    s.q = clamp(s.q + STUDIO_AUTO_MIX, 5, 100);
    s.mixed = true;
    s.car = "della casa";
    if(s.parti) s.parti.mix = STUDIO_AUTO_MIX;
  }
  /* segnato sul pezzo: l'uscita di venerdì lo legge e non dà l'hype
     (studioUscitePronte, studio-elementi.js) */
  s.esceAuto = true;
  if(G.studio && G.studio.coverProva && G.studio.coverProva.per === s.seed) G.studio.coverProva = null;
  const g = typeof studioGiorniAVenerdi === "function" ? studioGiorniAVenerdi() : 0;
  s.esce = studioOggiAssoluto() + g;
  delete s.tenuto;
  /* il banco si libera: si torna al Beat per il pezzo dopo. Il pezzo resta in
     lista, con «in coda per venerdì», e da lì si rimette sul banco */
  studioSvuotaBanco(s);
  studioDati().quando = "subito";
  STUDIO_SEZ = "beat";
  pushLog("«" + s.t + "» lo chiude il gioco: mix della casa, qualità " + s.q +
    ", in coda per venerdì" + (g ? " — " + studioVenerdiTesto() : ", cioè stanotte") + ".", "");
  toast("«" + s.t + "» esce venerdì, chiuso dal gioco", "good", "▶",
    typeof TINTA_SUONO !== "undefined" ? TINTA_SUONO : undefined);
  SFX.tap(); save(); renderStudio(); renderGioco();
}

if(typeof $ === "function" && $("studio")){
  $("studio").addEventListener("click", e => {
    if(e.target.closest("[data-auto]")) studioRestoAutomatico();
  });
}
