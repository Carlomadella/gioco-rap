ANNI DI FAME — MAKEHUMAN EDITOR V1

OBIETTIVO
Editor parallelo, da zero, basato sul runtime MakeHuman browser reale.
Non modifica Avaturn, creator.html, local-editor.html o altri editor già esistenti.

COSA INCLUDE
- Base uomo / neutra / donna tramite macrodetails/Gender.
- Tutti i modifier esposti dal runtime MakeHuman generati dinamicamente.
- Ricerca e filtro per gruppi morph.
- Macro body: età, altezza, massa, muscolo, proporzioni.
- Modifier phenotype/ethnicity disponibili nel runtime.
- Preset che impostano gli stessi modifier e restano editabili.
- Tutti i proxy presenti nel catalogo: clothes, hair, eyebrows, eyelashes,
  eyes, teeth, tongue, genitals e altri gruppi trovati nei dati.
- Refit dei proxy demandato al ProxyEngine MakeHuman originale.
- Skin MakeHuman presenti in resources.json.
- Salvataggio locale, export/import JSON.
- Camera intero/volto/fronte/profilo/retro e rotazione.
- Layout desktop/mobile.

SCELTE TECNICHE
- Il runtime viene installato dal commit:
  781728cc11efc0322d51ab9be12e6b3fab893c4b
  di HippocampusEvolve/makehuman-js-new.
- Non viene patchato makehuman.js.
- La UI legge min/max/defaultValue dai Modifier reali.
- Il guardaroba usa Proxy.toggle(), quindi fitting, ref_verts/weights/offsets
  e deleteVerts restano gestiti dal runtime.
- Nessun GridHelper: il fork documenta un difetto upstream che può corrompere
  geometrie non correlate durante il caricamento dei proxy.
- Le pose non sono esposte nella V1: il fork documenta un difetto upstream
  che lacera polsi/dita. Morph e guardaroba non dipendono dalle pose.

LICENZA
Il codice makehuman-js-new è AGPL-3.0. Gli asset MakeHuman core sono CC0
secondo la licenza attuale MakeHuman. Prima di distribuire commercialmente
questa specifica soluzione runtime nel gioco, va valutato il vincolo AGPL.
Gli asset esterni/community possono avere licenze diverse.

AVVIO
Dopo installazione, dal frontend:
  npm.cmd run dev

Poi:
  http://localhost:8000/media/makehuman-editor-v1/

VERIFICA MIRATA
Dentro frontend/media/makehuman-editor-v1:
  node --check app.js
  node verify-editor.cjs
