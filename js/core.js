/* Helper condivisi da creatore e gioco.
   Caricato per primo: tutto il resto dà per scontato che $ e pick esistano. */
"use strict";

const $ = i => document.getElementById(i);
const pick = a => a[Math.floor(Math.random()*a.length)];
