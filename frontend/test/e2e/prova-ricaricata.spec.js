const { test, expect } = require("@playwright/test");

/* Giro del 27/09/2026, voce 63: una prova di passaggio si segna come fatta
   quando si apre. Ricaricando prima di scegliere non tornava più, e la
   carriera restava ferma in quella fase. */
test("una prova rimasta aperta torna dopo un ricaricamento, una volta sola", async ({ page }) => {
  const errori = [];
  page.on("pageerror", e => errori.push(e.message));
  await page.goto("/pagine/gioco.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);
  /* com'è la partita salvata con la prova aperta a schermo */
  await page.evaluate(() => { G.phase = 0; G.trialsDone = {0:true}; G.trialCd = 0; save(); });
  await page.reload();
  await page.waitForFunction(() => window.GAME && window.ADF_TIME_SKIP);

  await page.evaluate(() => { GAME.enter(); GAME.enter(); });
  await expect(page.locator("#m-t")).toHaveText("Il contest del quartiere");
  expect(await page.evaluate(() => MODALE_CODA.length)).toBe(0);

  /* «Non ti presenti»: la prova si chiude, e al prossimo ingresso non torna */
  await page.locator("#m-opts button").last().click();
  await page.evaluate(() => GAME.enter());
  await page.waitForTimeout(200);
  const dopo = await page.evaluate(() => ({aperta:document.getElementById("modal").classList.contains("on") &&
    document.getElementById("m-t").textContent === "Il contest del quartiere", segnata:!!G.trialsDone[0]}));
  expect(dopo).toEqual({aperta:false, segnata:false});
  expect(errori).toEqual([]);
});
