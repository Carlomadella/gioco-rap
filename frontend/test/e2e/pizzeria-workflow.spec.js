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
  await expect(page.getByText("Grado attuale",{exact:true})).toBeVisible();
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
    Math.random=()=>.17;

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
  expect(risultato.persone).toBeGreaterThan(0);
  expect(risultato.persone).toBeLessThanOrEqual(5);
  expect(risultato.reincontri).toBeGreaterThan(0);

  /* La maggioranza delle persone persistenti deve restare normale. */
  expect(risultato.musicali).toBeLessThan(risultato.persone/2);

  /* Su 24 servizi non vogliamo un click obbligatorio dopo ogni turno. */
  expect(risultato.popup).toBeLessThan(24);
  expect(risultato.decisioni).toBeLessThan(24);
  expect(risultato.socialPopup).toBeLessThanOrEqual(8);
});
