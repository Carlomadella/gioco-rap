# Cinematica iniziale LTX — Pacchetto produzione completo

> Stato: piano operativo verificato sulla `main` del 2026-10-01  
> Main verificata: `38b103d19b05ea78977424234692cdd671946abf`  
> Obiettivo: sostituire l'attuale intro carriera a diapositive con una cinematica LTX di circa 40–50 secondi, costruita come clip singole da massimo 5 secondi, mantenendo il flusso creator → intro → città già esistente.

---

## 0. Decisione di produzione

La cinematica sarà un **montaggio di 10 clip** da circa **4,7 secondi** ciascuna, totale circa **47 secondi**.

Tre blocchi narrativi:

1. **Scrittura / punto di partenza** — 3 clip
2. **Studio / registrazione nel booth** — 3 clip
3. **Corsa / città** — 4 clip

Ogni clip è un **singolo continuous take**. Tutta la regia usa un linguaggio da drone: camera alta, flottante, fluida, con tracking, orbit e rise. Negli interni va inteso come **virtual compact cinewhoop / floating aerial camera**: il drone non deve mai essere visibile.

Non generare i 47 secondi in un colpo unico. Le tre ambientazioni cambiano con **hard cut o match cut in montaggio**, non con morphing AI.

---

## 1. Coerenza con Anni di Fame — reference verificate in repository

### Casa / punto di partenza

Reference principali:

- `frontend/media/photo/schermate_luoghi/schermate_luoghi_con_elementi_HTML/casa_di provincia_definitiva.png`
- `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/casa_divano_sera.png`
- `frontend/media/photo/pagina di landing/landing_a_provincia_urban.jpg`

La scena deve sembrare una stanza reale di provincia: modesta, vissuta, niente loft, niente mansione da producer professionista, niente lusso.

### Studio

Reference principali:

- `frontend/media/photo/schermate_luoghi/schermate luoghi_senza_HTML/studio_cabina.png`
- `frontend/concept/booth_registrazione_notturno.png`
- `frontend/media/video/Transizioni di scena/01_studio_definitivo.mp4`
- `frontend/media/video/Transizioni di scena/05_registra_pezzo_definitivo.mp4`

Lo Studio attuale è scuro, realistico, con vetro, booth e luci calde/fredde contenute. Evitare studio da videoclip americano, neon futuristici o regia ultralussuosa.

### Città

Reference principali:

- `frontend/media/photo/pagina di gioco/mappa_citta_tramonto.png`
- `frontend/media/photo/pagina di gioco/mappa_citta_notte.png`
- `frontend/media/photo/pagina di landing/landing_a_provincia_urban.jpg`
- `frontend/concept/schermata_di_gioco_città_iniziale.png`

L'identità è **città italiana/provinciale densa e vissuta**: palazzi bassi/medi, intonaco consumato, balconi, muri segnati, campetti, strade strette, tetti, eventuali colline/montagne in lontananza. Niente Manhattan, grattacieli, palme, downtown americana o cyberpunk.

### Personaggio

Per questa intro il protagonista resta soprattutto **di spalle o a 3/4 posteriore**. È la scelta più robusta perché il gioco permette avatar diversi e un filmato prerenderizzato non può replicare ogni volto creato dal giocatore.

Reference da estrarre dalle cinematiche già approvate:

- `frontend/media/video/Transizioni di scena/01_studio_definitivo.mp4`
- `frontend/media/video/Transizioni di scena/05_registra_pezzo_definitivo.mp4`
- opzionale: `frontend/media/video/Transizioni di scena/08_ingresso_club_definitivo.mp4`
- opzionale: `frontend/media/video/Transizioni di scena/11_live_definitivo.mp4`

Il personaggio della nuova intro deve sembrare appartenere allo stesso mondo visivo di queste transizioni.

---

## 2. Character Bible — BLOCCATA

Usare la stessa descrizione in tutte le clip:

- giovane uomo, circa 20–24 anni;
- corporatura normale/slim, non bodybuilder;
- capelli scuri corti o medio-corti;
- felpa scura semplice senza marchi;
- pantaloni streetwear scuri;
- sneakers semplici;
- nessun gioiello vistoso;
- nessun logo leggibile;
- outfit identico per tutta la cinematica;
- volto quasi mai frontale;
- movimenti realistici, niente pose da modello.

**Regola:** non cambiare outfit fra stanza, Studio e strada. La cinematica è un montage simbolico, non serve giustificare ogni passaggio temporale.

---

## 3. Direzione visiva globale

Tono: realistico, contemporaneo, italiano, urbano, provinciale, intimo, leggermente ruvido.

Palette:

- neri profondi;
- ambra/oro caldo negli interni;
- blu/grigio nei passaggi notturni;
- strada umida o leggermente riflettente;
- alba fredda nella parte finale, così il filmato può consegnare naturalmente il giocatore alla città delle 08:00.

Look:

- cinematic realism;
- subtle film grain;
- natural depth of field;
- practical lighting;
- niente glow eccessivo;
- niente videoclip patinato;
- niente estetica pubblicitaria;
- niente testo generato dentro le immagini.

Composizione:

- personaggio e azione importante nel **60% centrale del frame**;
- deve sopravvivere a `object-fit: cover` e crop mobile;
- nessun elemento narrativo essenziale ai bordi.

---

## 4. Camera Bible — “tutto drone shot”

In ogni prompt usare una variante di:

> invisible compact cinewhoop-style camera, smooth elevated floating movement, stabilized aerial glide, the drone itself is never visible

Movimenti ammessi:

- elevated push-in;
- slow overhead orbit;
- lateral aerial glide;
- high rear tracking;
- top-down tracking;
- gradual drone rise;
- reveal pull-back.

Movimenti da evitare:

- handheld;
- shoulder camera;
- whip pan;
- crash zoom;
- shake;
- camera teleport;
- rapid 360;
- close-up frontale del volto.

---

## 5. Timeline definitiva

| Clip | Durata finale | Blocco | Azione | Camera |
|---|---:|---|---|---|
| 01 | 4.7 s | Scrittura | ragazzo di spalle scrive barre a setup minimo | elevated push-in |
| 02 | 4.7 s | Scrittura | continua a scrivere, reveal della stanza povera | slow orbit + pull-back |
| 03 | 4.7 s | Scrittura | camera passa sopra la scrivania, lui resta concentrato | overhead glide |
| 04 | 4.7 s | Studio | wide della regia, booth visibile, lui dentro | high aerial reveal |
| 05 | 4.7 s | Studio | lui registra nel booth | slow elevated orbit |
| 06 | 4.7 s | Studio | passaggio sopra console verso booth, performance continua | forward aerial glide |
| 07 | 4.7 s | Città | esce/è già in strada e comincia a correre | high rear follow |
| 08 | 4.7 s | Città | corsa in strada provinciale | top-down tracking |
| 09 | 4.7 s | Città | corsa verso quartieri più aperti, città visibile | rising chase |
| 10 | 4.7 s | Città | grande reveal finale della città mentre continua | drone rise + pull-back |

Totale nominale: **47,0 secondi**.

---

# 6. Prompt LTX pronti — uno per clip

## CLIP 01 — SCRITTURA / PUSH-IN

**File finale:** `intro_01_scrittura_push.mp4`

```text
A single continuous cinematic shot in the grounded visual world of a contemporary Italian rap career game. A young male rapper, around 20 to 24 years old, slim-average build, short dark hair, wearing a plain dark hoodie, dark streetwear trousers and simple sneakers, sits with his back to camera at a small cheap desk in a modest provincial bedroom at night. He writes rap lyrics by hand in a notebook beside a minimal low-budget computer setup, inexpensive headphones and only the essentials; the room feels lived-in and humble, never luxurious. Warm practical lamp light falls across the desk while the rest of the room stays dark and slightly cool, with worn realistic surfaces and subtle cinematic grain. An invisible compact cinewhoop-style camera floats from a high rear angle and slowly pushes toward him, smoothly stabilized, keeping him and the desk in the center of frame; the drone itself is never visible. He keeps writing naturally, briefly pauses to think, then resumes. Only quiet room ambience, pen on paper and a faint distant city hum; no dialogue, no music, no readable text.
```

## CLIP 02 — SCRITTURA / REVEAL STANZA

**File finale:** `intro_02_scrittura_reveal.mp4`

```text
A single continuous cinematic shot continuing the same grounded Italian provincial bedroom and the same young male rapper: 20 to 24 years old, slim-average build, short dark hair, plain dark hoodie, dark streetwear trousers and simple sneakers. He remains seated with his back or three-quarter rear view to camera, quietly writing lyrics at the same small low-budget desk with a notebook, basic computer and inexpensive headphones. The room is modest and believable, with simple furniture, slightly worn plaster, ordinary objects and no luxury decoration. Warm desk light contrasts with cool darkness toward the edges of the room. An invisible compact cinewhoop-style camera begins high behind his left shoulder, makes a very slow elevated arc around the rear of the desk and gently pulls back to reveal the humble room around him, always smooth and stabilized; the drone itself is never visible. His movement remains subtle and natural and the writing never stops for long. Only room tone, pen scratches and distant traffic; no dialogue, no music, no readable text.
```

## CLIP 03 — SCRITTURA / OVERHEAD PASS

**File finale:** `intro_03_scrittura_overhead.mp4`

```text
A single continuous cinematic overhead shot in the exact same modest bedroom, with the same young male rapper wearing the same plain dark hoodie, dark trousers and simple sneakers. He is still writing rap lyrics at the minimal desk, focused and slightly hunched forward, surrounded only by a notebook, pen, cheap computer setup and headphones. The lighting remains warm at the desk and cool in the rest of the room, with realistic provincial apartment textures and restrained cinematic contrast. An invisible compact cinewhoop-style camera starts behind and above him, glides smoothly over the desk in a slow diagonal overhead pass, then continues toward a dark doorway or shadowed wall so the final frame becomes darker and visually simple for a clean match cut into the recording studio. Keep his body and desk in the central 60 percent of frame and never reveal the drone. Natural pen and room sounds only; no dialogue, no music, no readable text.
```

## CLIP 04 — STUDIO / WIDE REVEAL

**File finale:** `intro_04_studio_reveal.mp4`

```text
A single continuous cinematic shot inside a believable contemporary recording studio that matches a grounded Italian rap career game: dark control room, realistic mixing console, computer monitors without readable text, acoustic treatment, warm amber practical lights, subtle cool blue-black shadows, and a vocal booth visible through glass. The same young male rapper from the previous scene, same age, build, short dark hair and exact same plain dark hoodie, dark streetwear trousers and simple sneakers, is already inside the booth wearing simple studio headphones. An invisible compact cinewhoop-style camera begins from a high wide angle over the control room and slowly glides forward toward the booth, revealing the studio layout while keeping the performer visible through the glass. The studio is professional but not luxurious or futuristic. The rapper prepares to deliver a take, breathing once and leaning toward the microphone. Smooth stabilized aerial movement only, drone never visible. Ambient studio hum and subtle headphone leakage only; no intelligible lyrics, no music bed, no readable text.
```

## CLIP 05 — STUDIO / BOOTH ORBIT

**File finale:** `intro_05_studio_orbit.mp4`

```text
A single continuous cinematic performance shot in the same recording studio and the same vocal booth. The same young male rapper, 20 to 24 years old, slim-average build, short dark hair, wearing the same plain dark hoodie, dark trousers and simple sneakers, records into a professional microphone with pop filter while wearing headphones. He performs with believable restrained rap gestures: one hand marks the rhythm, his head moves slightly with the beat, his body leans toward the microphone, energetic but never exaggerated. The booth glass carries subtle reflections from the control room. An invisible compact cinewhoop-style camera makes a slow elevated orbit outside and partly around the booth, always smooth, stabilized and physically plausible, keeping him mostly in rear or three-quarter view; the drone itself is never visible. Warm amber practical light and deep blue-black shadows match the existing Anni di Fame studio mood. Booth ambience, soft breath, cloth movement and muted room sound only; no intelligible lyrics, no generated song, no readable text.
```

## CLIP 06 — STUDIO / CONSOLE TO BOOTH

**File finale:** `intro_06_studio_glide.mp4`

```text
A single continuous cinematic shot in the same grounded recording studio. The same young male rapper in the exact same dark hoodie, trousers and sneakers continues recording in the booth, still wearing headphones and performing naturally into the microphone. The shot starts high above the rear portion of the realistic mixing console, with faders and controls visible but no readable labels, while the booth sits beyond the glass. An invisible compact cinewhoop-style camera glides smoothly forward over the console toward the glass and rises slightly, ending with the rapper centered inside the booth as he completes a line and lowers one hand. Keep the camera motion elegant, slow and aerial, with no handheld shake and no visible drone. Warm practical studio lighting, dark cinematic contrast, natural reflections and subtle film grain. Only studio ambience and indistinct muffled vocal energy without understandable words; no music bed, no captions, no readable text.
```

## CLIP 07 — CITTÀ / INIZIO CORSA

**File finale:** `intro_07_corsa_start.mp4`

```text
A single continuous cinematic exterior shot at very early dawn in a dense, believable Italian provincial city that matches the Anni di Fame game world: worn low- and mid-rise apartment buildings, balconies, narrow streets, patched walls, ordinary parked compact cars, scattered graffiti and slightly wet pavement reflecting a few amber streetlights. No skyscrapers and no American downtown. The same young male rapper, same build, short dark hair and exact same plain dark hoodie, dark streetwear trousers and simple sneakers, begins running forward along the street, seen mostly from behind. An invisible compact cinewhoop-style camera follows from a high rear angle, floating above and behind him with a smooth stabilized drone-like movement as he gains pace. The sky is moving from night blue toward dawn, making this feel like the start of a long road rather than a sports commercial. Natural footsteps, breathing, distant traffic and early-morning city ambience only; no dialogue, no music, no readable signage.
```

## CLIP 08 — CITTÀ / TOP-DOWN TRACKING

**File finale:** `intro_08_corsa_topdown.mp4`

```text
A single continuous top-down cinematic tracking shot in the same Italian provincial city at dawn. The same young male rapper in the same dark hoodie, dark trousers and simple sneakers keeps running at a steady realistic pace along a narrow lived-in street bordered by worn apartment blocks, small courtyards, parked compact cars, balconies and occasional graffiti. The street surface is slightly wet and catches the fading amber streetlights while cool morning light increases. An invisible compact cinewhoop-style camera tracks directly above and slightly behind him, maintaining smooth stabilized motion and gradually moving from a steep overhead angle to a slightly shallower aerial perspective so more of the street ahead becomes visible. The runner stays within the central 60 percent of frame and the drone is never visible. Natural footsteps, breathing, wind and distant city ambience only; no dialogue, no music, no readable text.
```

## CLIP 09 — CITTÀ / RISING CHASE

**File finale:** `intro_09_corsa_rise.mp4`

```text
A single continuous cinematic aerial chase shot continuing the same dawn run through the Anni di Fame provincial city. The same young male rapper in the exact same dark hoodie, trousers and sneakers runs forward along a broader street as the urban fabric opens up: dense low-rise rooftops, a neighborhood sports field or small football pitch, ordinary residential blocks, industrial edges and distant hills or mountains consistent with an Italian provincial setting. An invisible compact cinewhoop-style camera follows from high behind, then gradually climbs while maintaining forward motion, revealing more of the city around him without losing the runner. The movement is smooth, controlled and cinematic, never fast or acrobatic; the drone itself is never visible. Dawn light becomes slightly brighter and cooler while remaining natural. Footsteps, breathing, faint traffic and morning birds only; no dialogue, no music, no readable text.
```

## CLIP 10 — CITTÀ / GRANDE REVEAL FINALE

**File finale:** `intro_10_citta_finale.mp4`

```text
A single continuous final cinematic drone-style shot in the same realistic Italian provincial city at early morning. The same young male rapper in the same dark hoodie, dark trousers and sneakers continues running forward along the street, small but still clearly readable in the composition. An invisible aerial camera begins high behind him, then rises smoothly and pulls backward into a wide expansive reveal of the surrounding city: dense weathered residential blocks, neighborhood streets, rooftops, a small sports field, ordinary urban infrastructure and distant hills or mountains, with early sunlight beginning to touch the skyline. The city must feel lived-in, imperfect and ambitious rather than glamorous. The camera climb is slow, stable and emotionally open, ending on a broad city view with enough negative space for the game's HTML title and player identity overlay; the drone itself is never visible. Natural morning ambience and distant city sound only; no dialogue, no generated music, no readable signage or text.
```

---

## 7. Negative prompt / esclusioni globali

Se l'interfaccia espone un negative prompt, usare:

```text
visible drone, visible camera rig, handheld camera, shaky camera, whip pan, crash zoom, front-facing beauty shot, identity drift, different person, different clothes, outfit change, age change, hairstyle change, extra limbs, duplicated body parts, deformed hands, floating objects, wardrobe morphing, cartoon, anime, illustration, glossy commercial, luxury mansion, luxury penthouse, supercar, futuristic studio, cyberpunk, neon city, American downtown, Manhattan skyline, skyscrapers, palm trees, Los Angeles, readable text, captions, subtitles, logos, brand names, watermarks, crowds blocking the subject, chaotic motion, impossible physics
```

Se non esiste un campo negative prompt, inserire alla fine del prompt:

> Keep the scene grounded and realistic. No visible drone, no camera rig, no text, no logos, no outfit or identity changes, no American skyline, no cyberpunk or luxury aesthetic.

---

## 8. Strategia LTX corretta

### Metodo raccomandato

**Image-to-video**, non text-to-video puro.

Per ogni blocco creare/approvare prima un'immagine anchor coerente col gioco:

- Anchor A — stanza + protagonista alla scrivania
- Anchor B — Studio + protagonista nel booth
- Anchor C — strada/città + protagonista pronto alla corsa

Poi:

- clip 01 usa Anchor A;
- clip 02 usa l'ultimo frame buono della 01 come partenza, oppure Anchor A se il chaining peggiora;
- clip 03 usa l'ultimo frame buono della 02;
- clip 04 riparte da Anchor B con hard cut;
- clip 05 usa l'ultimo frame buono della 04;
- clip 06 usa l'ultimo frame buono della 05;
- clip 07 riparte da Anchor C con hard cut;
- clip 08 usa l'ultimo frame buono della 07;
- clip 09 usa l'ultimo frame buono della 08;
- clip 10 usa l'ultimo frame buono della 09.

Non tentare di trasformare via AI la stanza nello Studio o lo Studio nella strada: i cambi ambiente vanno fatti in montaggio.

### Perché

LTX lavora meglio su single-shot focalizzati, con soggetto, azione, camera e illuminazione descritti chiaramente. Le clip brevi e concatenate con reference riducono il drift di persona, outfit e ambiente.

---

## 9. Impostazioni consigliate

### Output di gioco

- rapporto: **16:9**
- master finale: **1920×1080**
- frame rate: **24 fps**
- codec finale: **H.264**
- pixel format: **yuv420p**
- audio: meglio un'unica colonna sonora/ambience aggiunta in montaggio, non 10 musiche AI separate.

### Generazione

Per le prove:
- 720p o 1080p;
- variante veloce/distilled se disponibile.

Per i finali:
- variante quality/pro se disponibile;
- image-to-video;
- camera motion coerente con il prompt;
- mantenere lo stesso reference character/environment.

### Durata

Il target di montaggio è 4,7 s per clip.

Se la UI permette 5 s:
- genera 5 s;
- taglia a 4,7 s.

Se usi l'API LTX-2.5 corrente:
- la durata minima disponibile è 6 s;
- genera 6 s;
- taglia ogni clip a 4,7 s in post.

### Audio LTX

Per questa intro è preferibile **video silenzioso** o solo ambience temporanea, perché dieci generazioni separate producono inevitabilmente discontinuità musicali.

Se l'interfaccia/API permette `generate_audio: false`, usarlo. La musica di Anni di Fame resta una traccia unica sopra tutto il montaggio.

---

## 10. Nota hardware locale

La macchina con RTX 5070 Ti 16 GB può essere usata per esperimenti, ma **non è il target ufficialmente raccomandato per il workflow ComfyUI LTX-2.x completo**.

La documentazione ufficiale ComfyUI-LTXVideo indica oggi:

- GPU CUDA;
- **32 GB+ VRAM**;
- circa **100 GB+ di spazio** per modelli/cache;
- i loader low-VRAM sono pensati per far rientrare il workflow in circa 32 GB, non garantiscono 16 GB.

Quindi:

- produzione affidabile: LTX Studio / servizio LTX / macchina con più VRAM;
- 5070 Ti 16 GB: solo prova locale con distilled/quantizzato/offload, senza basare il piano su questa strada finché non passa un test reale.

---

## 11. Preparazione reference dal repository — PowerShell

Dalla root di `gioco-rap`:

```powershell
New-Item -ItemType Directory -Force "frontend\media\video\intro\refs" | Out-Null
New-Item -ItemType Directory -Force "frontend\media\video\intro\raw" | Out-Null
New-Item -ItemType Directory -Force "frontend\media\video\intro\final" | Out-Null
```

Copia le reference statiche:

```powershell
Copy-Item "frontend\media\photo\schermate_luoghi\schermate_luoghi_con_elementi_HTML\casa_di provincia_definitiva.png" "frontend\media\video\intro\refs\ref_casa.png"
Copy-Item "frontend\media\photo\schermate_luoghi\schermate luoghi_senza_HTML\studio_cabina.png" "frontend\media\video\intro\refs\ref_studio.png"
Copy-Item "frontend\media\photo\pagina di gioco\mappa_citta_tramonto.png" "frontend\media\video\intro\refs\ref_citta_tramonto.png"
Copy-Item "frontend\media\photo\pagina di gioco\mappa_citta_notte.png" "frontend\media\video\intro\refs\ref_citta_notte.png"
Copy-Item "frontend\media\photo\pagina di landing\landing_a_provincia_urban.jpg" "frontend\media\video\intro\refs\ref_provincia.jpg"
```

### Contact sheet per scegliere il character reference dalle cinematiche esistenti

Richiede `ffmpeg`.

```powershell
ffmpeg -y -i "frontend\media\video\Transizioni di scena\01_studio_definitivo.mp4" -vf "fps=1,scale=480:-1,tile=5x2" -frames:v 1 "frontend\media\video\intro\refs\sheet_studio.jpg"
ffmpeg -y -i "frontend\media\video\Transizioni di scena\05_registra_pezzo_definitivo.mp4" -vf "fps=1,scale=480:-1,tile=5x2" -frames:v 1 "frontend\media\video\intro\refs\sheet_registra.jpg"
```

Dalle due sheet scegliere il frame in cui il protagonista è più leggibile **di spalle o a 3/4**, non quello con il volto più frontale.

---

## 12. Naming obbligatorio dei raw

Mettere le generazioni approvate in:

`frontend/media/video/intro/raw/`

con questi nomi:

```text
intro_01_scrittura_push_raw.mp4
intro_02_scrittura_reveal_raw.mp4
intro_03_scrittura_overhead_raw.mp4
intro_04_studio_reveal_raw.mp4
intro_05_studio_orbit_raw.mp4
intro_06_studio_glide_raw.mp4
intro_07_corsa_start_raw.mp4
intro_08_corsa_topdown_raw.mp4
intro_09_corsa_rise_raw.mp4
intro_10_citta_finale_raw.mp4
```

Non sovrascrivere i raw quando si fa una nuova prova: usare suffissi `_v02`, `_v03` fino alla scelta.

---

## 13. Normalizzazione e trim — PowerShell + ffmpeg

Tutti i finali devono diventare 1920×1080, 24 fps, 4,7 s, H.264, senza audio AI.

Esempio per la clip 01:

```powershell
ffmpeg -y -i "frontend\media\video\intro\raw\intro_01_scrittura_push_raw.mp4" -t 4.7 -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24,format=yuv420p" -c:v libx264 -preset slow -crf 18 -an "frontend\media\video\intro\final\intro_01_scrittura_push.mp4"
```

Ripetere per le dieci clip cambiando input/output.

---

## 14. Montaggio finale

Creare `frontend/media/video/intro/final/concat.txt`:

```text
file 'intro_01_scrittura_push.mp4'
file 'intro_02_scrittura_reveal.mp4'
file 'intro_03_scrittura_overhead.mp4'
file 'intro_04_studio_reveal.mp4'
file 'intro_05_studio_orbit.mp4'
file 'intro_06_studio_glide.mp4'
file 'intro_07_corsa_start.mp4'
file 'intro_08_corsa_topdown.mp4'
file 'intro_09_corsa_rise.mp4'
file 'intro_10_citta_finale.mp4'
```

Poi:

```powershell
Push-Location "frontend\media\video\intro\final"
ffmpeg -y -f concat -safe 0 -i "concat.txt" -c copy "intro_iniziale_definitiva_senza_audio.mp4"
Pop-Location
```

Se `-c copy` segnala incompatibilità fra clip, ricodificare il master:

```powershell
Push-Location "frontend\media\video\intro\final"
ffmpeg -y -f concat -safe 0 -i "concat.txt" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -an "intro_iniziale_definitiva_senza_audio.mp4"
Pop-Location
```

---

## 15. Audio finale

Non usare dieci musiche generate separatamente.

Mix consigliato:

- una sola traccia musicale per tutti i 47 s;
- room tone nella scena 1;
- studio hum / cuffie / booth nella scena 2;
- passi + respiro + città nella scena 3;
- nessuna voce intelligibile;
- crescendo leggero durante la corsa;
- lasciare spazio negli ultimi 4–6 secondi all'overlay HTML del gioco.

Il sistema audio esistente entra già in modalità `cinematic` quando riceve `adf-rpg-v24-career-intro-start`: non va duplicato.

---

## 16. QC — una clip è approvata solo se passa tutto

### Continuità personaggio

- stessa corporatura;
- stessi capelli;
- stesso outfit;
- niente cambio età;
- niente volto completamente diverso;
- nessun artefatto evidente su mani/gambe.

### Ambienti

- stanza coerente con il mondo provinciale di Anni di Fame;
- Studio riconoscibile come lo Studio del gioco;
- città coerente con mappa/landing;
- niente estetica americana generica;
- niente lusso;
- niente futurismo.

### Camera

- ogni clip sembra una ripresa aerea/flottante;
- nessun drone visibile;
- niente shake;
- niente movimenti impossibili;
- soggetto resta leggibile dopo crop 16:9/mobile.

### Gameplay / leggibilità

- nessun testo AI;
- niente marchi;
- nessun dettaglio narrativo importante ai bordi;
- ultimo shot lascia spazio per titolo e identità HTML.

Se uno solo di questi punti fallisce, rigenerare quella clip: non correggere il difetto montando più veloce.

---

# 17. Integrazione nel gioco — stato attuale verificato

L'intro carriera corrente è dentro:

`frontend/media/creator-rpg-v24/creator.html`

Attualmente:

- `#careerIntroF1` usa `creator-00-e2c2866ee5ea.png`;
- `#careerIntroF2` usa `creator-01-6778b410cbf1.png`;
- `#careerIntroF3` usa `creator-02-e28be96a4a22.png`;
- `#careerIntroF4` usa `creator-03-intro-clean.png`;
- `playCareerIntro()` dura oggi **17.000 ms**;
- al termine invia `adf-rpg-v24-complete`;
- `frontend/js/creator/rpg-v24-bridge.js` riceve quell'evento, salva l'artista e chiama `__ADF_DOPO_CREAZIONE`;
- `frontend/js/gioco-ingresso.js` ha già impostato `__ADF_DOPO_CREAZIONE = entraInCitta`.

Quindi la nuova cinematica **non deve cambiare il flusso**.

### Integrazione prevista dopo approvazione del master

Asset finale previsto:

`frontend/media/video/intro/intro_iniziale_definitiva.mp4`

Modifica minima:

1. aggiungere un `<video>` dentro `#careerIntro`;
2. mantenere sopra il video l'HTML dinamico già esistente:
   - nome artista;
   - città;
   - profilo;
   - badge/titolo se ancora desiderato;
3. mantenere l'evento `adf-rpg-v24-career-intro-start`;
4. completare la carriera sull'evento `ended` del video invece che su un timer fisso da 17 s;
5. mantenere un timeout di sicurezza;
6. se il video manca o non parte, fallback alla intro a immagini attuale;
7. rispettare reduced-motion;
8. mantenere replay/skip senza duplicare il salvataggio.

**Non applicare questa modifica finché il master MP4 definitivo non esiste.**

---

## 18. Nota importante sul testo finale

Non chiedere a LTX di generare:

- “Anni di Fame”;
- nome artista;
- città;
- profilo;
- titoli.

Il gioco possiede già questi dati e li renderizza in HTML. Il testo generato nel video è meno affidabile e soprattutto non potrebbe adattarsi al personaggio creato dal giocatore.

L'ultimo shot deve quindi essere un **clean plate** abbastanza aperto da permettere all'overlay esistente di comparire sopra la città.

---

## 19. Ordine di lavoro definitivo

1. creare cartelle reference/raw/final;
2. estrarre contact sheet dalle cinematiche Studio/Registra;
3. scegliere character reference;
4. preparare tre anchor: stanza, Studio, città;
5. generare clip 01;
6. approvarla prima di propagare la continuità;
7. generare 02–03 concatenate;
8. hard cut e generare 04–06 concatenate;
9. hard cut e generare 07–10 concatenate;
10. normalizzare tutte le clip a 4,7 s / 1080p / 24 fps;
11. montare il master da circa 47 s;
12. aggiungere una sola colonna sonora/ambience;
13. verificare desktop e crop mobile;
14. solo a quel punto sostituire la visuale della intro nel creator mantenendo il flusso attuale.

---

## 20. Criterio di successo

La cinematica è pronta solo se, guardandola senza UI, racconta chiaramente:

**scrive perché non ha ancora niente → entra nel luogo dove prova a trasformarlo in musica → corre dentro la città che dovrà conquistarsi.**

E guardandola dentro il gioco deve sembrare appartenere allo stesso mondo di **Casa, Studio, Mappa e cinematiche esistenti**, non un trailer generico generato da AI.
