const { test, expect } = require("@playwright/test");

async function preparaPizzeria(page){
  await page.goto("/pagine/gioco.html");
  await page.waitForFunction(() =>
    window.GAME &&
    window.apriLuogo &&
    window.lavoroFirmaContratto &&
    window.ADF_WORK_EVENTS
  );

  await page.evaluate(() => {
    localStorage.clear();
    GAME.enter();

    G.year=1; G.week=1; G.day=2;
    G.timeMinutes=17*60;
    G.currentPlace="pizzeria";
    G.energy=100; G.maxEnergy=100;
    G.money=0; G.shifts=0;
    G.wellbeing=80; G.lucidita=80;
    G.skills=Object.assign({},G.skills||{},{rete:0});
    G.workplaces={};
    G.gente=[];
    G.songs=[{
      t:"Pezzo test",q:72,mixed:true,released:true,week:1,
      streams:0,last:0,seed:987654
    }];
    G.eventiV2={};

    G.job={
      id:"lavapiatti",place:"pizzeria",n:"Lavapiatti",
      pay:100,e:18,d:"Turni serali, cucina bollente.",missed:0
    };
    lavoroFirmaContratto("pizzeria",G.job);
    apriLuogo("pizzeria");
    renderLuogo();
  });
}

test("Pizzeria: la schermata completa resta navigabile in landscape mobile", async ({ page }) => {
  await page.setViewportSize({width:844,height:390});
  await preparaPizzeria(page);

  await expect(page.locator("#luogo")).toHaveClass(/on/);
  await expect(page.getByText("La cucina",{exact:true})).toBeVisible();
  await expect(page.getByText("Settimane in cucina",{exact:true})).toBeVisible();
  await expect(page.getByText("Ferie",{exact:true})).toBeVisible();
  await expect(page.getByText("Carriera",{exact:true})).toBeVisible();

  const layout=await page.locator(".lfwrap").evaluate(el=>({
    overflowY:getComputedStyle(el).overflowY,
    scrollHeight:el.scrollHeight,
    clientHeight:el.clientHeight,
    width:el.getBoundingClientRect().width,
    viewport:innerWidth
  }));

  expect(layout.overflowY).toBe("auto");
  expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);
  expect(layout.width).toBeLessThanOrEqual(layout.viewport+1);

  await page.locator(".lfwrap").evaluate(el=>{ el.scrollTop=el.scrollHeight; });
  await expect(page.locator(".lfcareer-now span")).toHaveText("Ora");
});

test("Pizzeria: 24 servizi non diventano una raffica di popup o contatti musicali", async ({ page }) => {
  test.setTimeout(90000);
  await preparaPizzeria(page);

  const risultato=await page.evaluate(async () => {
    const originaleShow=window.showEvent;
    const originaleRandom=Math.random;
    const popup=[];
    let decisioni=0, contattiPopup=0, socialPopup=0;

    /* Valore deterministico scelto apposta:
       - passa la chance rete Pizzeria (>= .22);
       - passa social/ruolo/fisico;
       - NON forza le coperture extra (.14/.16). */
    let rngState=123456789;
    Math.random=()=>{
      rngState=(Math.imul(rngState,1664525)+1013904223)>>>0;
      return .17+(rngState/4294967296)*.045;
    };

    window.showEvent=e=>{
      const voce={
        k:String(e&&e.k||""),
        t:String(e&&e.t||""),
        opzioni:Array.isArray(e&&e.opts)?e.opts.length:0
      };
      popup.push(voce);

      const opts=Array.isArray(e&&e.opts)?e.opts:[];
      let scelta=opts[0]||null;

      if(voce.k.includes("Contatti")){
        contattiPopup++;
        /* Primo incontro: parlate. Secondo: numero. In questo modo il test
           produce sia reincontri sia nuovi contatti senza crearli a mano. */
        scelta=contattiPopup%2===1
          ? (opts.find(x=>x&&x.n==="Parlate un po'")||scelta)
          : (opts.find(x=>x&&x.n==="Scambiatevi il numero")||scelta);
      }else if(voce.k==="Pizzeria · Due minuti"){
        socialPopup++;
        scelta=opts.find(x=>x&&x.n==="Fermati a parlare")||scelta;
      }else{
        /* Non accettiamo automaticamente promozioni/coperture: questo test
           misura il ritmo normale della Pizzeria, non la carriera perfetta. */
        scelta=opts.find(x=>x&&(
          x.n==="Saluta e vai" ||
          x.n==="Non adesso" ||
          x.n==="Lascia stare" ||
          x.n==="Resta nel ruolo attuale" ||
          x.n==="Rifiuta" ||
          x.n==="Non posso"
        ))||scelta;
      }

      if(scelta&&typeof scelta.run==="function"){
        decisioni++;
        try{ scelta.run(); }catch(_){}
      }
      return true;
    };

    const turno=ACTIONS.find(x=>x.id==="turno");
    const giorni=[2,3,4,5];

    for(let settimana=1;settimana<=6;settimana++){
      for(const giorno of giorni){
        G.year=1; G.week=settimana; G.day=giorno;
        G.timeMinutes=17*60;
        G.currentPlace="pizzeria";
        G.energy=100;
        turno.run();
        /* eventi-v2 incarta ACTIONS e completa i hook dopo il run. */
        await new Promise(r=>setTimeout(r,120));
      }
      if(typeof lavoroChiudiSettimana==="function")
        lavoroChiudiSettimana("pizzeria");
    }

    const sede=G.workplaces.pizzeria||{};
    const network=sede.network||{};
    const history=Array.isArray(network.history)?network.history:[];
    const persone=(G.gente||[]).filter(p=>p&&p.origineLuogo==="pizzeria");
    const ids=history.map(x=>x.personId).filter(Boolean);
    const unici=new Set(ids);
    const ruoliMusicali=new Set(["rapper","promoter","fonico","beatmaker","videomaker"]);
    const musicali=persone.filter(p=>ruoliMusicali.has(p.ruolo)).length;

    const out={
      shifts:Number(G.shifts||0),
      money:Number(G.money||0),
      popup:popup.length,
      decisioni,
      socialPopup,
      contattiPopup,
      incontri:history.length,
      persone:persone.length,
      personeUniche:unici.size,
      idPersoneUnici:new Set(persone.map(p=>p.id)).size,
      reincontri:Math.max(0,history.length-unici.size),
      musicali,
      rete:Number(G.skills&&G.skills.rete||0),
      ruolo:G.job&&G.job.id,
      warnings:sede.career&&Number(sede.career.warnings||0)
    };

    window.showEvent=originaleShow;
    Math.random=originaleRandom;
    return out;
  });

  expect(risultato.shifts).toBe(24);
  expect(risultato.money).toBe(2400);
  expect(risultato.ruolo).toBe("lavapiatti");
  expect(risultato.warnings).toBe(0);

  expect(risultato.incontri).toBeGreaterThan(1);
  expect(risultato.persone).toBeGreaterThan(1);
  expect(risultato.persone).toBeLessThanOrEqual(5);
  expect(risultato.idPersoneUnici).toBe(risultato.persone);
  expect(risultato.personeUniche).toBe(risultato.persone);
  expect(risultato.reincontri).toBeGreaterThan(0);

  /* La maggioranza delle persone persistenti deve restare normale. */
  expect(risultato.musicali).toBeLessThan(risultato.persone/2);

  /* Su 24 servizi non vogliamo un click obbligatorio dopo ogni turno. */
  expect(risultato.popup).toBeLessThan(24);
  expect(risultato.decisioni).toBeLessThan(24);
  expect(risultato.socialPopup).toBeLessThanOrEqual(8);
});

test("Pizzeria: musica, spostamento e conflitto serale convivono nello stesso giorno", async ({ page }) => {
  test.setTimeout(60000);
  await preparaPizzeria(page);

  const out=await page.evaluate(async () => {
    G.day=3;
    G.timeMinutes=16*60;
    G.energy=100;
    G.fans=100;
    G.hype=10;

    const promoPlace=GAME_TRAVEL.requiredPlaceForAction("promo");
    if(promoPlace) G.currentPlace=promoPlace;

    const tempoPrima=GAME_TIME.now();
    const promoOk=avviaAzioneDiretta("promo");
    await new Promise(r=>setTimeout(r,80));
    const dopoPromo=GAME_TIME.now();

    let viaggio=GAME_TRAVEL.go("pizzeria");
    let atteseApertura=0;
    while(viaggio && !viaggio.ok && viaggio.reason==="arrival-closed" && atteseApertura<8){
      GAME_TIME.advance(15,"wait-for-pizzeria");
      atteseApertura++;
      viaggio=GAME_TRAVEL.go("pizzeria");
    }
    const dopoViaggio=GAME_TIME.now();
    if(GAME_TIME.now()<17*60) GAME_TIME.advance(17*60-GAME_TIME.now(),"wait-for-shift");
    const inizioTurno=GAME_TIME.now();

    const appuntamento={id:"live",n:"Serata live",ic:"microfono",k:"#fff",ora:"21:00"};
    AGENDA.segna(appuntamento,"azione");

    const originaleShow=window.showEvent;
    let conflitti=0;
    const scelte=[];

    window.showEvent=e=>{
      const opts=Array.isArray(e&&e.opts)?e.opts:[];
      if(String(e&&e.k||"").includes("Conflitto")){
        conflitti++;
        const nome=conflitti===1 ? "Tieni l'appuntamento" : "Vai al turno";
        const opt=opts.find(x=>x&&x.n===nome);
        scelte.push(nome);
        if(opt&&typeof opt.run==="function") opt.run();
        return true;
      }

      const innocua=opts.find(x=>x&&[
        "Saluta e vai","Non adesso","Lascia stare","Resta nel ruolo attuale",
        "Rifiuta","Non posso","Va bene"
      ].includes(x.n)) || opts[0];
      if(innocua&&typeof innocua.run==="function"){
        try{ innocua.run(); }catch(_){}
      }
      return true;
    };

    const primo=avviaAzioneDiretta("turno");
    await new Promise(r=>setTimeout(r,120));
    const dopoRifiuto={
      shifts:Number(G.shifts||0),
      money:Number(G.money||0),
      time:GAME_TIME.now()
    };

    const secondo=avviaAzioneDiretta("turno");
    await new Promise(r=>setTimeout(r,500));

    const sede=G.workplaces.pizzeria||{};
    const state=sede.workEvents||{};
    const conflittoLavoro=(state.history||[]).find(x=>
      x&&x.family==="conflict"&&x.choice==="work"&&x.appointmentId==="live"
    );

    const result={
      tempoPrima,dopoPromo,dopoViaggio,inizioTurno,
      promoOk:promoOk!==false,
      viaggioOk:!!(viaggio&&viaggio.ok),
      atteseApertura,
      primo,
      secondo,
      conflitti,scelte,
      dopoRifiuto,
      shifts:Number(G.shifts||0),
      money:Number(G.money||0),
      time:GAME_TIME.now(),
      missed:!!(conflittoLavoro&&conflittoLavoro.missed),
      appointmentStillThere:AGENDA.conflittiTra(17*60,22*60).some(x=>x.id==="live")
    };

    window.showEvent=originaleShow;
    return result;
  });

  expect(out.promoOk).toBe(true);
  expect(out.dopoPromo-out.tempoPrima).toBe(45);
  expect(out.viaggioOk).toBe(true);
  expect(out.atteseApertura).toBeGreaterThanOrEqual(0);
  expect(out.dopoViaggio).toBeGreaterThanOrEqual(out.dopoPromo);
  expect(out.inizioTurno).toBeGreaterThanOrEqual(17*60);

  expect(out.conflitti).toBe(2);
  expect(out.scelte).toEqual(["Tieni l'appuntamento","Vai al turno"]);
  expect(out.dopoRifiuto.shifts).toBe(0);
  expect(out.dopoRifiuto.money).toBe(0);

  expect(out.shifts).toBe(1);
  expect(out.money).toBe(100);
  expect(out.time).toBe(out.inizioTurno+300);
  expect(out.missed).toBe(true);
  expect(out.appointmentStillThere).toBe(false);
});

