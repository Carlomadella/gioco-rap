const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 59: ogni «Fine giornata» scriveva «1 giorno
   saltato. Benessere +0, lucidità +0.» nel diario, che ne tiene 80 righe e
   perdeva i conti delle settimane. */
test("sette fine giornata non riempiono il diario di «giorno saltato»", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  const r = await page.evaluate(async () => {
    GAME.enter();
    for(let i = 0; i < 7; i++){
      await new Promise(res => setTimeout(res, 120));
      const b = document.querySelector("#modal.on #m-opts button"); if(b) b.click();
      for(const id of ["report", "recap", "adf-result-overlay"]){ const el = document.getElementById(id); if(el) el.classList.remove("on"); }
      ADF_TIME_SKIP(1);
    }
    const righe = G.log.map(l => l.t.replace(/<[^>]+>/g, ""));
    return {saltati:righe.filter(t => /giorn[oi] saltat/.test(t)).length,
      settimana:righe.some(t => /stream|Nessun pezzo fuori/.test(t))};
  });

  expect(r.saltati).toBe(0);
  expect(r.settimana).toBe(true);
  expect(errori).toEqual([]);
});
