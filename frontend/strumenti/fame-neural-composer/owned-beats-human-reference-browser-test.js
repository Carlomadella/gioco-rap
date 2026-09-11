"use strict";
const assert = require('node:assert/strict');
const http = require('node:http');
const { chromium } = require('playwright');
const { renderHtml } = require('./owned-beats/human-reference-pack');
const protocol = require('./owned-beats/audio-analysis-v2-protocol.json');
(async () => {
  const families = [0,1].map(i => ({sourceRecordId:'FAME'+i,compositionFamilyId:'family'+i,
    sourceSha256:'a'.repeat(64),decodedDurationSeconds:60,fullTrackPath:'audio.wav',
    beatReference:{referenceBpm:120,metricLevel:'PRIMARY_MUSICAL_BEAT',reviewed:true,
      windows:[{position:'EARLY',startSeconds:5,durationSeconds:12,audioPath:'clip.wav',
        beatTimesSeconds:[0.25,0.75,1.29,1.75,2.25],rawTapTimesSeconds:[],
        coverage:'COMPLETE',coverageNotes:'',reviewed:true}]},
    meter:{value:'4/4',reviewed:true},sections:{boundariesSeconds:[],reviewed:true},reviewCostSeconds:0}));
  const html=renderHtml({reviewId:'browser-regression',families},protocol);
  const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html)}else{res.statusCode=404;res.end()}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.FAME_BROWSER_EXECUTABLE || undefined});
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.locator('#wa0').dispatchEvent('ended');
    assert.deepEqual(await page.evaluate(()=>state.families[0].beatReference.windows[0].beatTimesSeconds),[0.25,0.75,1.29,1.75,2.25]);
    await page.locator('.quantize').click();
    assert.equal(await page.evaluate(()=>state.families[0].beatReference.reviewed),false);
    assert.equal(await page.locator('.wreview').isChecked(),false);
    assert.equal(await page.evaluate(()=>state.families[0].beatReference.windows[0].quantizationHistory[0].input[2]),1.29);
    await page.locator('.wreview').check();await page.locator('#beatReviewed').check();
    await page.locator('.beat-marker').nth(2).click();
    await page.locator('.nudge[data-step="0.001"]').click();
    assert.equal(await page.locator('.wreview').isChecked(),false);
    assert.equal(await page.locator('#beatReviewed').isChecked(),false);
    await page.evaluate(()=>{window.testNow=1000;Object.defineProperty(performance,'now',{value:()=>window.testNow})});
    await page.locator('#timerStart').click();
    await page.evaluate(()=>window.testNow=4000);
    await page.locator('#familyList button').nth(1).click();
    assert.deepEqual(await page.evaluate(()=>state.families.map(f=>f.reviewCostSeconds)),[3,0]);
    assert.equal(await page.evaluate(()=>timerStarted),null);
    assert.deepEqual(errors,[]);
    console.log('HUMAN REFERENCE BROWSER: PASS (replay, quantize, provenance, review invalidation, timer)');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
