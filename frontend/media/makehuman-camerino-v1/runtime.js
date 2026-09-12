import {
  WARDROBE_SLOT_IDS,
  createWardrobeItem,
  canEquipCandidate,
  resolveWardrobeConflicts,
  normalizeWardrobeSelections
} from './wardrobe-rules.mjs';

async function loadThreeModule() {
  const status=document.getElementById('status');
  /* ADF_MAKEHUMAN_LOCAL_THREE_V2_1
     Three.js è parte del runtime locale del camerino.
     I CDN restano fallback di emergenza, non un requisito di avvio. */
  const urls=[
    './vendor/three-r179/three.module.js',
    'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js',
    'https://unpkg.com/three@0.179.1/build/three.module.js?module'
  ];
  const errors=[];

  for(const url of urls) {
    try {
      if(status) {
        status.className='status';
        status.textContent=`BOOT CAMERINO V2.13.6\nCarico Three.js 0.179.1…\n${url}`;
      }

      const mod=await import(url);
      if(!mod?.WebGLRenderer || !mod?.Scene || !mod?.Vector3) {
        throw new Error('modulo Three.js incompleto');
      }

      window.__ADF_THREE_SOURCE=url;
      return mod;
    } catch(err) {
      errors.push(`${url} -> ${err?.message||err}`);
    }
  }

  const message=
    'Impossibile caricare Three.js 0.179.1 locale o dai fallback.\n' +
    errors.join('\n');

  window.__ADF_MH_SHOW_BOOT_ERROR?.(message);
  throw new Error(message);
}

const THREE=await loadThreeModule();
window.__ADF_MH_THREE_READY=true;

/**
 * Controller orbitale minimale e locale.
 * Serve solo al probe/lab e non modifica alcuna semantica MakeHuman.
 * Evita una seconda dipendenza CDN (OrbitControls).
 */
class OrbitControls {
  constructor(camera,domElement) {
    this.object=camera;
    this.domElement=domElement;
    this.target=new THREE.Vector3();
    this.enableDamping=true;
    this.enablePan=false;
    this.enabled=true;

    this._drag=false;
    this._lastX=0;
    this._lastY=0;

    this._onPointerDown=e=>{
      if(!this.enabled || e.button!==0) return;
      resetWheelZoomBridge();
      this._drag=true;
      this._lastX=e.clientX;
      this._lastY=e.clientY;
      this.domElement.setPointerCapture?.(e.pointerId);
    };

    this._onPointerMove=e=>{
      if(!this.enabled || !this._drag) return;

      const dx=e.clientX-this._lastX;
      this._lastX=e.clientX;
      this._lastY=e.clientY;

      cancelCameraTransition();

      const offset=this.object.position.clone().sub(this.target);
      const spherical=new THREE.Spherical().setFromVector3(offset);

      // ADF camerino: rotazione SOLO orizzontale.
      // Il tilt verticale resta bloccato dal nostro editor, non da MakeHuman.
      spherical.theta-=dx*0.006;
      spherical.phi=Math.PI/2;

      offset.setFromSpherical(spherical);
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
    };

    this._onPointerUp=e=>{
      this._drag=false;
      this.domElement.releasePointerCapture?.(e.pointerId);
    };

    this._onWheel=e=>{
      if(!this.enabled) return;
      e.preventDefault();

      const deltaY=Number(e.deltaY)||0;
      if(deltaY===0) return;

      const zoomIn=deltaY<0;
      const zoomOut=deltaY>0;
      const step=wheelTargetStep(deltaY);

      /* Bridge già avviato: la rotellina cambia solo la destinazione.
         Se inverti subito lo scroll, il target cambia verso opposto ma
         posizione e velocità correnti restano continue. */
      if(wheelZoomBridgeActive && wheelZoomBridgeOriginView){
        wheelZoomBridgeTarget=clamp01(
          wheelZoomBridgeTarget+(zoomIn?step:-step)
        );
        return;
      }

      /* Volto -> vista precedente.
         Se siamo più vicini del default Volto, prima torniamo normalmente
         al default; appena lo raggiungiamo parte il damping al contrario. */
      if(currentCameraView==='face' && zoomOut){
        const faceDest=cameraDestination('face');
        const originView=wheelZoomBridgeOriginView || lastNonFaceCameraView || 'full';

        if(faceDest){
          const offset=this.object.position.clone().sub(this.target);
          const currentDistance=offset.length();
          const faceDistance=faceDest.position.distanceTo(faceDest.target);
          const requested=currentDistance*Math.exp(deltaY*0.001);

          if(currentDistance<faceDistance*0.997){
            cancelCameraTransition();
            offset.setLength(Math.min(faceDistance,requested));
            this.object.position.copy(this.target).add(offset);
            this.object.lookAt(this.target);
            return;
          }

          beginWheelZoomBridge(originView,1);
          wheelZoomBridgeTarget=clamp01(1-step);
          return;
        }
      }

      /* Intero/Profilo -> Volto.
         Sopra la distanza default lo zoom resta normale. Dal default in poi
         entra nel percorso continuo, quindi non si finisce più sul torso. */
      if((currentCameraView==='full' || currentCameraView==='profile') && zoomIn){
        const originView=currentCameraView;
        const bridgeOrigin=cameraBridgeOriginDestination(originView);

        if(bridgeOrigin){
          const offset=this.object.position.clone().sub(this.target);
          const currentDistance=offset.length();
          const bridgeStartDistance=bridgeOrigin.position.distanceTo(bridgeOrigin.target);
          const requested=currentDistance*Math.exp(deltaY*0.001);

          if(currentDistance<=bridgeStartDistance*1.004 || requested<=bridgeStartDistance){
            beginWheelZoomBridge(originView,0);
            wheelZoomBridgeTarget=clamp01(step);
            return;
          }
        }
      }

      /* Zoom ordinario al di fuori del bridge. */
      cancelCameraTransition();

      const offset=this.object.position.clone().sub(this.target);
      const factor=Math.exp(deltaY*0.001);
      let min=Number(cameraZoomLimits?.min)||0.25;
      const max=Number(cameraZoomLimits?.max)||120;

      /* Non lasciamo Intero/Profilo oltrepassare il proprio default:
         da lì deve iniziare il bridge verso la testa. */
      if((currentCameraView==='full' || currentCameraView==='profile') && zoomIn){
        const bridgeOrigin=cameraBridgeOriginDestination(currentCameraView);
        if(bridgeOrigin) min=Math.max(
          min,
          bridgeOrigin.position.distanceTo(bridgeOrigin.target)
        );
      }

      const next=Math.max(min,Math.min(max,offset.length()*factor));
      const spherical=new THREE.Spherical().setFromVector3(offset);
      spherical.phi=Math.PI/2;
      offset.setFromSpherical(spherical).setLength(next);
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
    };

    domElement.addEventListener('pointerdown',this._onPointerDown);
    domElement.addEventListener('pointermove',this._onPointerMove);
    domElement.addEventListener('pointerup',this._onPointerUp);
    domElement.addEventListener('pointercancel',this._onPointerUp);
    domElement.addEventListener('wheel',this._onWheel,{passive:false});
  }

  update() {
    this.object.lookAt(this.target);
  }

  dispose() {
    const d=this.domElement;
    d.removeEventListener('pointerdown',this._onPointerDown);
    d.removeEventListener('pointermove',this._onPointerMove);
    d.removeEventListener('pointerup',this._onPointerUp);
    d.removeEventListener('pointercancel',this._onPointerUp);
    d.removeEventListener('wheel',this._onWheel);
  }
}

window.__ADF_PROBE_BOOTED=true;

const E = id => document.getElementById(id);

const URLS = {
  body:'/media/makehuman-editor-v1/data/models/human_full_size.json',
  resources:'/media/makehuman-editor-v1/data/resources.json',
  catalog:'/media/makehuman-editor-v1/runtime-v24-browser-catalog.json',
  customTargets:'/media/makehuman-editor-v1/data/custom-targets.json',
  uiCatalog:'/media/makehuman-editor-v1/makehuman-ui-catalog-v29.json',
  uiOverrides:'./ui-overrides-v2135.json'
};

const SLOT_DEFS = [
  // Aspetto
  {id:'hair',       uiGroup:'hair',       label:'Stile capelli', defaultNone:false},
  {id:'eyes',       uiGroup:'eyes',       label:'Occhi', defaultNone:false},
  {id:'eyebrows',   uiGroup:'eyebrows',   label:'Sopracciglia', defaultNone:false},
  {id:'eyelashes',  uiGroup:'eyelashes',  label:'Ciglia', defaultNone:false},
  {id:'facialHair', uiGroup:'facialHair', label:'Barba e baffi', defaultNone:true},

  // Dettagli tecnici/personaggio
  {id:'teeth',      uiGroup:'teeth',      label:'Dentatura', defaultNone:false},
  {id:'tongue',     uiGroup:'tongue',     label:'Lingua', defaultNone:false},
  {id:'genitals',   uiGroup:'genitals',   label:'Genitali', defaultNone:true},
  {id:'bodyDetail', uiGroup:'bodyDetail', label:'Dettagli corpo', defaultNone:true},

  // Guardaroba
  {id:'tops',       uiGroup:'tops',       label:'Parte alta', defaultNone:true},
  {id:'bottoms',    uiGroup:'bottoms',    label:'Parte bassa', defaultNone:true},
  {id:'dresses',    uiGroup:'dresses',    label:'Vestiti interi', defaultNone:true},
  {id:'underwear',  uiGroup:'underwear',  label:'Intimo', defaultNone:true},
  {id:'shoes',      uiGroup:'shoes',      label:'Scarpe', defaultNone:true},
  {id:'outerwear',  uiGroup:'outerwear',  label:'Capospalla', defaultNone:true},
  {id:'clothesOther',uiGroup:'clothesOther',label:'Altro abbigliamento',defaultNone:true},

  // Accessori
  {id:'armsleeves', uiGroup:'armsleeves', label:'Maniche / braccia', defaultNone:true},
  {id:'glasses',    uiGroup:'glasses',    label:'Occhiali', defaultNone:true},
  {id:'hats',       uiGroup:'hats',       label:'Cappelli', defaultNone:true},
  {id:'gloves',     uiGroup:'gloves',     label:'Guanti', defaultNone:true},
  {id:'masks',      uiGroup:'masks',      label:'Maschere', defaultNone:true},
  {id:'jewelry',    uiGroup:'jewelry',    label:'Gioielli', defaultNone:true},
  {id:'equipment',  uiGroup:'equipment',  label:'Altri accessori', defaultNone:true}
]

const WARDROBE_SLOT_SET=new Set(WARDROBE_SLOT_IDS);
let wardrobeNoticeTimer=null;

const stage = E('stage');
const statusEl = E('status');
const auditEl = E('auditSummary');
const skinSelect = E('skinSelect');
const targetSelect = E('targetSelect');
const targetStrength = E('targetStrength');
const targetValue = E('targetValue');

let scene, camera, renderer, controls;
let bodyJson = null;
let resources = {};
let audit = null;
let customTargets = {targets:[]};
let uiCatalog = {assets:[],skins:[],targets:[],summary:{}};
let uiOverrides = {skins:{},targets:{},assets:{}};

let bodyMesh = null;
let activeProxyMeshes = [];
let bodyMaterials = [];
let currentSkin = null;

let resourceEntries = [];
let assetByPath = new Map();
let jsonCache = new Map();
let rebuildId = 0;

let visualAuditRunning = false;
let visualAuditCancelRequested = false;
let lastVisualAudit = null;

let visualQaRenderer = null;
let visualQaSelfTest = null;
const VISUAL_QA_SIZE = 256;

const COLOR_CUSTOMIZABLE_GROUPS = new Set(['hair','eyes','eyebrows']);

const appearanceColorState = {
  hair:     {enabled:false, color:'#6b3d26'},
  eyes:     {enabled:false, color:'#4d82b8'},
  eyebrows: {enabled:false, color:'#4b3026'}
};

const COLOR_SWATCHES = {
  hair:[
    '#171311','#3a2418','#6b3d26','#9a5e34','#c28d58',
    '#d6b27a','#7c231d','#24201f','#3e364f','#243c5a'
  ],
  eyes:[
    '#4a78a8','#2e9a8d','#5d7f45','#8a6a3c','#7b5a35',
    '#8c8f93','#6679b8','#6f4b86','#a56a38','#3f342c'
  ],
  eyebrows:[
    '#171311','#2c1d18','#4b3026','#6e4531','#8b5b3c',
    '#aa7952','#6d2924','#55504c'
  ]
};

let activeColorCustomizerGroup = 'hair';


const DEFAULT_EYES_RAW='eyes/HighPolyEyes/HighPolyEyes.json#Eye_brown';

const EDITOR_SECTION_CAMERA={
  identity:'full',
  face:'face',
  body:'full',
  hair:'face',
  wardrobe:'full',
  skin:'full',
  customization:'face',
  confirm:'full'
};

let currentEditorSection='identity';
let currentCameraView='full';
let previewMode=false;
let cameraTransition=null;

/* ADF_MAKEHUMAN_ZOOM_DAMPING_V4
   La rotellina aggiorna soltanto una destinazione 0..1.
   La camera la rincorre ogni frame con damping critico: niente tween
   per-evento, niente reset quando si inverte lo scroll. */
let wheelZoomBridgeOriginView=null;
let wheelZoomBridgeProgress=0;
let wheelZoomBridgeTarget=0;
let wheelZoomBridgeVelocity=0;
let wheelZoomBridgeLastTime=0;
let wheelZoomBridgeActive=false;
let lastNonFaceCameraView='full';

let cameraZoomLimits={min:1,max:100};
let runtimeReady=false;
let pendingRestoreState=null;
let initialCharacterState=null;
let allTargetOptions=[];

let nativeModifierFrame=null;
let nativeModifierMeta=[];
let nativeModifierValues={};
let nativeModifierDefaults={};
let nativeEngineBase=null;
let nativeMorphedBody=null;
let nativeCalibration=null;
let nativeEngineReady=false;
let nativeEngineReadyResolve=null;
let nativeEngineReadyReject=null;
let nativeRequestCounter=0;
const nativePendingRequests=new Map();
let nativeRebuildQueued=false;
let customTargetValues={};
const modifierControls=new Map();
const symmetricModifierControls=[];

const FACE_MODIFIER_GROUPS=new Set([
  'head','forehead','eyebrows','eyes','nose','mouth','ears','cheek','chin','neck'
]);

const IDENTITY_MACROS=new Set([
  'macrodetails/Gender',
  'macrodetails/Age',
  'macrodetails/African',
  'macrodetails/Asian',
  'macrodetails/Caucasian',
  'macrodetails-universal/Muscle',
  'macrodetails-universal/Weight',
  'macrodetails-height/Height',
  'macrodetails-proportions/BodyProportions'
]);

function modifierSection(meta) {
  if(IDENTITY_MACROS.has(meta.fullName)) return 'identity';
  if(FACE_MODIFIER_GROUPS.has(meta.groupName)) return 'face';
  return 'body';
}

function sideFromName(name='') {
  if(/(^|[-/])r-/.test(name)) return 'right';
  if(/(^|[-/])l-/.test(name)) return 'left';
  return '';
}

function modifierUiGroup(meta) {
  const f=String(meta.fullName||'');
  const g=String(meta.groupName||'');
  const n=String(meta.name||'').toLowerCase();
  const side=sideFromName(f);

  if(IDENTITY_MACROS.has(f)) {
    if(/Gender|Age/.test(f)) return 'Base fisica';
    if(/African|Asian|Caucasian/.test(f)) return 'Tratti di origine';
    return 'Struttura del corpo';
  }

  if(g==='head') return /scale|trans/.test(n)?'Dimensioni e posizione testa':'Forma della testa';
  if(g==='forehead') return 'Fronte';
  if(g==='eyebrows') return 'Sopracciglia';
  if(g==='neck') return 'Collo';
  if(g==='eyes') return 'Occhi';

  if(g==='nose') {
    if(/trans|scale/.test(n)) return 'Naso · dimensioni e posizione';
    if(/width[123]|nostril-width|point-width|height/.test(n)) return 'Naso · proporzioni';
    return 'Naso · forma';
  }

  if(g==='mouth') {
    if(/trans|scale-(horiz|vert|depth)/.test(n)) return 'Bocca · dimensioni e posizione';
    if(/lowerlip|upperlip|cupidsbow|philtrum/.test(n)) return 'Labbra';
    return 'Bocca · dettagli';
  }

  if(g==='ears') return 'Orecchie';
  if(g==='chin') return 'Mento e mandibola';
  if(g==='cheek') return 'Guance';

  if(g==='torso') return 'Torace';
  if(g==='hip') return 'Fianchi';
  if(g==='stomach') return 'Addome';
  if(g==='buttocks') return 'Glutei';
  if(g==='pelvis') return 'Bacino';
  if(g==='breast') return 'Petto / seno';
  if(g==='genitals') return 'Genitali';
  if(g==='legs') return 'Proporzioni gambe';

  if(g==='armslegs') {
    if(/hand|finger/.test(n)) return 'Mani';
    if(/foot/.test(n)) return 'Piedi';
    if(/upperarm|lowerarm/.test(n)) return 'Braccia';
    if(/upperleg|lowerleg|leg-genu/.test(n)) return 'Gambe';
    return 'Braccia e gambe';
  }

  if(g==='measure') {
    if(/neck/.test(n)) return 'Misure · collo';
    if(/upperarm|lowerarm|wrist/.test(n)) return 'Misure · braccia';
    if(/chest|bust|waist|shoulder|nape/.test(n)) return 'Misure · busto';
    if(/hips/.test(n)) return 'Misure · fianchi';
    if(/leg|thigh|calf|knee|ankle/.test(n)) return 'Misure · gambe';
    return 'Misure corporee';
  }

  return MODIFIER_GROUP_LABELS[g] || 'Altri controlli';
}

const MODIFIER_GROUP_LABELS={
  'macrodetails':'Base fisica',
  'macrodetails-universal':'Struttura del corpo',
  'macrodetails-height':'Altezza',
  'macrodetails-proportions':'Proporzioni',
  'head':'Testa','forehead':'Fronte','eyebrows':'Sopracciglia','eyes':'Occhi',
  'nose':'Naso','mouth':'Bocca e labbra','ears':'Orecchie','cheek':'Guance',
  'chin':'Mento e mandibola','neck':'Collo','armslegs':'Braccia e gambe',
  'breast':'Petto / seno','torso':'Torace','hip':'Fianchi','pelvis':'Bacino',
  'buttocks':'Glutei','stomach':'Addome','genitals':'Genitali',
  'legs':'Proporzioni gambe','measure':'Misure corporee'
};


const ASSET_UI_GROUP_INFO={
  eyes:{section:'Aspetto',prefix:'Occhi'},
  eyebrows:{section:'Aspetto',prefix:'Sopracciglia'},
  eyelashes:{section:'Aspetto',prefix:'Ciglia'},
  hair:{section:'Aspetto',prefix:'Capelli'},
  facialHair:{section:'Aspetto',prefix:'Barba / baffi'},
  bodyDetail:{section:'Aspetto',prefix:'Dettaglio corpo'},
  genitals:{section:'Dettagli',prefix:'Genitali'},
  teeth:{section:'Dettagli',prefix:'Dentatura'},
  tongue:{section:'Dettagli',prefix:'Lingua'},
  glasses:{section:'Accessori',prefix:'Occhiali'},
  hats:{section:'Accessori',prefix:'Cappello'},
  gloves:{section:'Accessori',prefix:'Guanti'},
  masks:{section:'Accessori',prefix:'Maschera'},
  jewelry:{section:'Accessori',prefix:'Gioiello'},
  equipment:{section:'Accessori',prefix:'Accessorio'},
  tops:{section:'Guardaroba',prefix:'Parte alta'},
  bottoms:{section:'Guardaroba',prefix:'Parte bassa'},
  dresses:{section:'Guardaroba',prefix:'Completo / vestito'},
  underwear:{section:'Guardaroba',prefix:'Intimo'},
  shoes:{section:'Guardaroba',prefix:'Scarpe'},
  outerwear:{section:'Guardaroba',prefix:'Capospalla'},
  clothesOther:{section:'Guardaroba',prefix:'Altro'},
  armsleeves:{section:'Accessori',prefix:'Manica'}
};

function normalizedAssetName(asset){
  return String(asset?.originalName||asset?.raw||'')
    .replace(/\.json(?:#.*)?$/i,'')
    .split('/').pop()
    .replace(/^(?:elvs?|o4saken|sagerfrog_s|tbm|mindfront|jujube|rehmanpolanski)[_-]+/i,'')
    .replace(/[_-]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function assetNameTokens(asset){
  return normalizedAssetName(asset).toLowerCase();
}

function inferAssetUiGroup(asset){
  if(String(asset?.nativeCategory||'')!=='clothes') return asset?.group||'clothesOther';

  const n=assetNameTokens(asset);
  const raw=String(asset?.raw||'').toLowerCase();
  const hay=`${n} ${raw}`;

  if(/\b(beard|moustache|mustache|goatee|facial hair)\b/.test(hay)) return 'facialHair';
  if(/\b(glasses|sunglass|sunglasses|goggles|spectacle|eyewear)\b/.test(hay)) return 'glasses';
  if(/\b(mask|respirator|balaclava)\b/.test(hay) || /bandana[_ -]?mask/.test(hay)) return 'masks';
  if(/\b(armsleeve|arm sleeve)\b/.test(hay)) return 'armsleeves';
  if(/\b(glove|gloves|gauntlet)\b/.test(hay)) return 'gloves';
  if(/\b(hat|cap|beanie|beret|fedora|bowler|cloche|sombrero|crown|headband|visor)\b/.test(hay)) return 'hats';
  if(/\b(ring|necklace|bracelet|earring|jewel|jewelry|chain|pendant|choker)\b/.test(hay)) return 'jewelry';
  if(/\b(handbag|shopping bag|purse|backpack|bag|quiver|scuba rig|briefcase)\b/.test(hay)) return 'equipment';

  if(/\b(bra|panties|panty|underwear|lingerie|briefs|boxers|string|teddy)\b/.test(hay)) return 'underwear';
  if(/\b(shoe|shoes|boot|boots|bootie|booties|sneaker|sneakers|sandal|sandals|slipper|slippers|stiletto|heel|heels|loafer|oxford|moccasin)\b/.test(hay)) return 'shoes';

  if(/\b(cape|cloak|overcoat)\b/.test(hay)) return 'outerwear';

  const top=/\b(shirt|tshirt|t shirt|tee|top|blouse|sweater|jumper|hoodie|jacket|coat|tunic|bodice|camisole|vest|tank|jersey|cardigan)\b/.test(hay);
  const bottom=/\b(pants|trousers|jeans|shorts|skirt|leggings|slacks|bottom)\b/.test(hay);

  if(/\b(dress|gown|jumpsuit|overall|overalls|bodysuit|unitard|wetsuit|swimsuit)\b/.test(hay) || (top&&bottom)) return 'dresses';
  if(bottom) return 'bottoms';
  if(top) return 'tops';

  return asset?.group||'clothesOther';
}

const ASSET_WORD_REPLACEMENTS=[
  [/\bsunglasses?\b/gi,'occhiali da sole'],
  [/\bgoggles?\b/gi,'occhiali protettivi'],
  [/\bglasses?\b/gi,'occhiali'],
  [/\bcurly\b/gi,'ricci'],[/\bstraight\b/gi,'lisci'],[/\bmessy\b/gi,'spettinati'],
  [/\blong\b/gi,'lunghi'],[/\bshort\b/gi,'corti'],[/\bbangs?\b/gi,'frangia'],
  [/\bbraid\b/gi,'treccia'],[/\bbraids\b/gi,'trecce'],[/\bbun\b/gi,'chignon'],
  [/\bponytail\b/gi,'coda di cavallo'],[/\bhair\b/gi,'capelli'],
  [/\bbeard\b/gi,'barba'],[/\bmoustache\b/gi,'baffi'],[/\bmustache\b/gi,'baffi'],
  [/\bgloves?\b/gi,'guanti'],[/\bhat\b/gi,'cappello'],[/\bcap\b/gi,'berretto'],
  [/\bmask\b/gi,'maschera'],[/\bring\b/gi,'anello'],[/\bnecklace\b/gi,'collana'],
  [/\bbracelet\b/gi,'bracciale'],[/\bchain\b/gi,'catena'],
  [/\bhandbag\b/gi,'borsa'],[/\bpurse\b/gi,'borsa'],[/\bshopping bag\b/gi,'borsa shopping'],
  [/\bshirt\b/gi,'camicia'],[/\btshirt\b/gi,'t-shirt'],[/\bsweater\b/gi,'maglione'],
  [/\bblouse\b/gi,'blusa'],[/\bjacket\b/gi,'giacca'],[/\bcoat\b/gi,'cappotto'],
  [/\bpants\b/gi,'pantaloni'],[/\btrousers\b/gi,'pantaloni'],[/\bshorts\b/gi,'pantaloncini'],
  [/\bskirt\b/gi,'gonna'],[/\bdress\b/gi,'vestito'],[/\bgown\b/gi,'abito lungo'],
  [/\bbra\b/gi,'reggiseno'],[/\bpanties\b/gi,'slip'],
  [/\bshoes?\b/gi,'scarpe'],[/\bboots?\b/gi,'stivali'],[/\bsneakers?\b/gi,'sneaker'],
  [/\bsandals?\b/gi,'sandali'],[/\bstiletto\b/gi,'tacco a spillo'],
  [/\bfemale\b/gi,'donna'],[/\bmale\b/gi,'uomo']
];

const UI_VARIANT_LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function uiVariantLetters(index){
  let n=index;
  let out='';
  do{
    out=UI_VARIANT_LETTERS[n%26]+out;
    n=Math.floor(n/26)-1;
  }while(n>=0);
  return out;
}

function sanitizeVisibleAssetName(name){
  return String(name||'')
    .replace(/3\s*d/gi,'tridimensionale')
    .replace(/\b(?:19)?(?:50|60)s?\b/gi,'vintage')
    .replace(/\b(?:19)?(?:70|80|90)s?\b/gi,'rétro')
    .replace(/([A-Za-zÀ-ÿ])(\d+)/g,'$1 $2')
    .replace(/(\d+)([A-Za-zÀ-ÿ])/g,'$1 $2')
    .replace(/\b\d+\b/g,'')
    .replace(/\d+/g,'')
    .replace(/\b(?:alpha|version|versione|model|modello)\b/gi,'')
    .replace(/\s+/g,' ')
    .replace(/\s+([,.;:])/g,'$1')
    .trim();
}

function descriptiveAssetLabel(asset){
  const manual=uiOverrides?.assets?.[String(asset?.raw||'')];
  if(manual?.label) return sanitizeVisibleAssetName(manual.label);

  let name=normalizedAssetName(asset)
    .replace(/3d/gi,' tridimensionale ')
    .replace(/(?:19)?80s/gi,' rétro ')
    .replace(/(?:19)?50s/gi,' vintage ');

  for(const [re,to] of ASSET_WORD_REPLACEMENTS) name=name.replace(re,to);

  name=name
    .replace(/\bbob\b/gi,'caschetto')
    .replace(/\bupdo\b/gi,'raccolto')
    .replace(/\bcornrows?\b/gi,'treccine')
    .replace(/\b(?:mh|uni|elv|elvbhp|elvmuscle)\b/gi,'')
    .replace(/\s+/g,' ')
    .trim();

  name=sanitizeVisibleAssetName(name);
  if(!name) return ASSET_UI_GROUP_INFO[asset?.group]?.prefix||'Elemento';
  return name.charAt(0).toUpperCase()+name.slice(1);
}

function dedupeAssetLabelsWithoutNumbers(){
  const buckets=new Map();

  for(const asset of (uiCatalog?.assets||[])){
    const key=`${asset.group}|${String(asset.uiLabel||'').toLocaleLowerCase('it')}`;
    if(!buckets.has(key)) buckets.set(key,[]);
    buckets.get(key).push(asset);
  }

  for(const list of buckets.values()){
    if(list.length<2) continue;
    list.sort((a,b)=>String(a.raw).localeCompare(String(b.raw),'it'));

    let autoIndex=0;
    for(const asset of list){
      const explicit=uiOverrides?.assets?.[String(asset.raw||'')]?.label;
      if(explicit) continue;
      asset.uiLabel=`${asset.uiLabel} · ${uiVariantLetters(autoIndex++)}`;
    }
  }
}

function buildUiLabelConversionReport(){
  const rows=[];

  for(const asset of (uiCatalog?.assets||[])){
    if(asset.uiSourceLabel && asset.uiSourceLabel!==asset.uiLabel){
      rows.push({kind:'asset',raw:asset.raw,before:asset.uiSourceLabel,after:asset.uiLabel,group:asset.group});
    }
  }
  for(const skin of (uiCatalog?.skins||[])){
    if(skin.uiSourceLabel && skin.uiSourceLabel!==skin.uiLabel){
      rows.push({kind:'skin',raw:skin.relativePath,before:skin.uiSourceLabel,after:skin.uiLabel,group:skin.uiFamily||'Pelli'});
    }
  }
  for(const target of (uiCatalog?.targets||[])){
    if(target.uiSourceLabel && target.uiSourceLabel!==target.uiLabel){
      rows.push({kind:'target',raw:target.id,before:target.uiSourceLabel,after:target.uiLabel,group:target.uiGroup||target.group});
    }
  }
  return rows;
}

function auditUiVisibleNames(){
  const rows=[];

  const inspect=(kind,id,item)=>{
    const visibleFields={
      label:item?.uiLabel,
      description:item?.uiDescription,
      section:item?.section,
      group:item?.uiGroup||item?.group,
      family:item?.uiFamily
    };

    for(const [field,value] of Object.entries(visibleFields)){
      if(value==null || value==='') continue;
      if(/\d/.test(String(value))){
        rows.push({kind,id,field,value:String(value)});
      }
    }
  };

  for(const asset of (uiCatalog?.assets||[])) inspect('asset',asset.raw,asset);
  for(const skin of (uiCatalog?.skins||[])) inspect('skin',skin.relativePath,skin);
  for(const target of (uiCatalog?.targets||[])) inspect('target',target.id,target);

  const assetCount=(uiCatalog?.assets||[]).length;
  const skinCount=(uiCatalog?.skins||[]).length;
  const targetCount=(uiCatalog?.targets||[]).length;

  return {
    schema:'adf.makehuman.ui-name-audit.v1',
    build:'V2.13.6',
    total:assetCount+skinCount+targetCount,
    counts:{assets:assetCount,skins:skinCount,targets:targetCount},
    visibleFieldsChecked:['uiLabel','uiDescription','section','group/uiGroup','uiFamily'],
    issues:rows.length,
    pass:rows.length===0,
    rows
  };
}

// Exportato subito: evita che DevTools lo perda prima/durante l'inizializzazione.
window.adfMakeHumanUiAudit=auditUiVisibleNames;

function applyUiPresentationOverrides(){
  let recategorized=0;

  for(const asset of (uiCatalog?.assets||[])){
    asset.uiSourceLabel=asset.uiLabel;
    const manual=uiOverrides?.assets?.[String(asset.raw||'')];
    const inferred=manual?.group||inferAssetUiGroup(asset);
    const info=ASSET_UI_GROUP_INFO[inferred]||ASSET_UI_GROUP_INFO.clothesOther;

    if(inferred!==asset.group) recategorized++;
    asset.group=inferred;
    asset.section=manual?.section||info.section||asset.section;
    asset.prefix=info.prefix||asset.prefix;
    asset.uiLabel=manual?.label||descriptiveAssetLabel(asset);
    asset.uiDescription=manual?.description||`Elemento: ${sanitizeVisibleAssetName(asset.uiLabel)}`;
  }

  for(const skin of (uiCatalog?.skins||[])){
    skin.uiSourceLabel=skin.uiLabel;
    const o=uiOverrides?.skins?.[String(skin.relativePath||'')];
    if(!o) continue;
    skin.uiLabel=o.label||skin.uiLabel;
    skin.uiDescription=o.description||'';
    skin.uiFamily=o.family||'Altre';
  }

  for(const target of (uiCatalog?.targets||[])){
    target.uiSourceLabel=target.uiLabel;
    const o=uiOverrides?.targets?.[String(target.id||'')];
    if(!o) continue;
    target.uiLabel=o.label||target.uiLabel;
    target.uiDescription=o.description||'';
    target.uiGroup=o.group||target.group;
  }

  dedupeAssetLabelsWithoutNumbers();

  // Garanzia finale V2.13.6: nessuna cifra nei nomi mostrati al giocatore.
  for(const asset of (uiCatalog?.assets||[])) asset.uiLabel=sanitizeVisibleAssetName(asset.uiLabel);
  for(const skin of (uiCatalog?.skins||[])) skin.uiLabel=sanitizeVisibleAssetName(skin.uiLabel);
  for(const target of (uiCatalog?.targets||[])) target.uiLabel=sanitizeVisibleAssetName(target.uiLabel);

  window.adfMakeHumanUiConversions=buildUiLabelConversionReport;

  const uiNameAudit=auditUiVisibleNames();
  if(uiNameAudit.pass){
    console.info(`[ADF MakeHuman] Audit nomi UI PASS — ${uiNameAudit.total} elementi, 0 campi visibili con cifre.`);
  }else{
    console.error('[ADF MakeHuman] Audit nomi UI FAIL',uiNameAudit);
  }

  if(uiCatalog?.summary){
    uiCatalog.summary.adfRecategorized=recategorized;
    uiCatalog.summary.adfVisibleLabelsWithDigits=[
      ...(uiCatalog.assets||[]).map(x=>x.uiLabel),
      ...(uiCatalog.skins||[]).map(x=>x.uiLabel),
      ...(uiCatalog.targets||[]).map(x=>x.uiLabel)
    ].filter(x=>/\d/.test(String(x))).length;
    uiCatalog.summary.adfUiNameAudit=uiNameAudit;
    uiCatalog.summary.adfRemainingOther=(uiCatalog.assets||[]).filter(a=>a.group==='clothesOther').length;
  }
}

function skinInfoByPath(relativePath){
  const s=(uiCatalog?.skins||[]).find(x=>x.relativePath===relativePath);
  return s||null;
}

function updateSkinDescription(){
  const box=E('skinDescription');
  if(!box) return;
  if(!skinSelect.value){
    box.textContent='Pelle base del personaggio MakeHuman.';
    return;
  }
  const skin=skinInfoByPath(skinSelect.value);
  box.textContent=skin?.uiDescription||skin?.uiLabel||'Pelle MakeHuman.';
}



function cancelCameraTransition(){ cameraTransition=null; }

THREE.Cache.enabled = true;

function setStatus(lines, cls='') {
  statusEl.className = 'status ' + cls;
  statusEl.textContent = Array.isArray(lines) ? lines.join('\n') : String(lines);
}

async function fetchJson(url, label='JSON', timeoutMs=60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      cache:'default',
      signal:controller.signal
    });

    if (!r.ok) throw new Error(`${label}: HTTP ${r.status} — ${url}`);

    const text = await r.text();
    if (!text.trim()) throw new Error(`${label}: risposta vuota — ${url}`);

    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`${label}: JSON non valido (${err.message}) — ${url}`);
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`${label}: timeout dopo ${Math.round(timeoutMs/1000)}s — ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function headWithTimeout(url, label, timeoutMs=6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const r = await fetch(url, {
      method:'HEAD',
      cache:'no-store',
      signal:controller.signal
    });

    if (!r.ok) throw new Error(`${label}: HEAD HTTP ${r.status} — ${url}`);

    return {
      ok:true,
      length:Number(r.headers.get('content-length') || 0)
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`${label}: server localhost non risponde al preflight — ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCoreJson(url, label) {
  // Il body MakeHuman può essere grande. V2.4/V2.5 imponevano un timeout
  // arbitrario durante il download; questo poteva abortire un file locale sano.
  // Prima verifichiamo che il server risponda, poi lasciamo completare il GET.
  const preflight = await headWithTimeout(url, label);

  const sizeText = preflight.length
    ? ` (${(preflight.length / 1024 / 1024).toFixed(1)} MB)`
    : '';

  setStatus(`${label}: server OK${sizeText}\nCaricamento dati…`);

  const r = await fetch(url, {cache:'default'});
  if (!r.ok) throw new Error(`${label}: HTTP ${r.status} — ${url}`);

  const text = await r.text();
  if (!text.trim()) throw new Error(`${label}: risposta vuota — ${url}`);

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${label}: JSON non valido (${err.message}) — ${url}`);
  }
}

async function fetchJsonCached(url, label='JSON') {
  if (jsonCache.has(url)) return jsonCache.get(url);
  const promise = fetchJson(url, label).catch(err => {
    jsonCache.delete(url);
    throw err;
  });
  jsonCache.set(url, promise);
  return promise;
}

function initScene() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, .01, 300);
  camera.position.set(0, 7, 22);

  renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  stage.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight(0xffead5, 0x251c28, 2.1));

  const key = new THREE.DirectionalLight(0xffd1a0, 3);
  key.position.set(6,12,8);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7564ff,1.5);
  rim.position.set(-7,9,-8);
  scene.add(rim);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    applyVisualCenter();
  });

  renderer.setAnimationLoop((time) => {
    updateCameraTransition(time);
    updateWheelZoomDamping(time);
    controls.update();
    renderer.render(scene,camera);
  });
}

function scaledVertices(json) {
  const factor = Number(json.scale) ? 1 / Number(json.scale) : 1;
  const out = new Float32Array(json.vertices.length);
  for (let i=0;i<json.vertices.length;i++) out[i] = Number(json.vertices[i]) * factor;
  return out;
}

function axisValue(flat, idx, axis) {
  return flat[idx * 3 + axis];
}

function hasAnyTMatrixData(data) {
  return Array.isArray(data) && data.some(v => v != null);
}

function requireTMatrixAxisTriplet(data, label) {
  if (!Array.isArray(data) || data.length !== 3 || data.some(v => !Array.isArray(v))) {
    throw new Error(`TMatrix ${label} incompleta: MakeHuman richiede 3 assi.`);
  }
  return data;
}

function invert4x4(matrix) {
  const a = matrix.map((row, r) => [
    ...row.map(Number),
    ...[0,1,2,3].map(c => r === c ? 1 : 0)
  ]);

  for (let col = 0; col < 4; col++) {
    let pivot = col;
    for (let r = col + 1; r < 4; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }

    if (Math.abs(a[pivot][col]) < 1e-12) {
      throw new Error('TMatrix shear degenerata: matrice affine non invertibile.');
    }

    [a[col], a[pivot]] = [a[pivot], a[col]];

    const div = a[col][col];
    for (let c = 0; c < 8; c++) a[col][c] /= div;

    for (let r = 0; r < 4; r++) {
      if (r === col) continue;
      const factor = a[r][col];
      if (!factor) continue;
      for (let c = 0; c < 8; c++) a[r][c] -= factor * a[col][c];
    }
  }

  return a.map(row => row.slice(4));
}

function multiplyMatrices(a, b) {
  const rows = a.length;
  const cols = b[0].length;
  const inner = b.length;
  const out = Array.from({length: rows}, () => Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) sum += a[r][k] * b[k][c];
      out[r][c] = sum;
    }
  }

  return out;
}

/**
 * Equivalent to MakeHuman transformations.affine_matrix_from_points()
 * for the exact 8-point source/target boxes constructed by Proxy.TMatrix.
 *
 * MakeHuman uses SVD/pseudoinverse. The 8 box correspondences have a full-rank
 * exact affine solution, so solving the same least-squares system through
 * (X^T X)^-1 X^T Y yields the same affine transform (within FP tolerance).
 */
function affineMatrixFromPointsMakeHuman(sourcePoints, targetPoints) {
  if (sourcePoints.length !== targetPoints.length || sourcePoints.length < 4) {
    throw new Error('TMatrix shear: set di punti affine non valido.');
  }

  const x = sourcePoints.map(p => [Number(p[0]), Number(p[1]), Number(p[2]), 1]);
  const y = targetPoints.map(p => [Number(p[0]), Number(p[1]), Number(p[2])]);

  const xt = Array.from({length:4}, (_, r) => x.map(row => row[r]));
  const xtx = multiplyMatrices(xt, x);
  const xty = multiplyMatrices(xt, y);
  const beta = multiplyMatrices(invert4x4(xtx), xty); // 4x3

  // target(row) = source(row) * beta.
  // fitProxy applies a column-vector style row-major mat3, hence transpose 3x3.
  return [
    beta[0][0], beta[1][0], beta[2][0],
    beta[0][1], beta[1][1], beta[2][1],
    beta[0][2], beta[1][2], beta[2][2]
  ];
}

function matrixFromShearMakeHuman(shearData, bodyVertices) {
  const shear = requireTMatrixAxisTriplet(shearData, 'shear');

  // MakeHuman proxy.py::TMatrix.matrixFromShear:
  // sfaces = original proxy bounding-box coordinates
  // tfaces = corresponding coordinates on the current morphed human.
  const sfaces = Array.from({length:3}, () => [0,0]);
  const tfaces = Array.from({length:3}, () => [0,0]);

  for (let axis = 0; axis < 3; axis++) {
    const e = shear[axis];
    if (e.length < 4) throw new Error(`TMatrix shear asse ${axis} non valido.`);

    const vn1 = Number(e[0]);
    const vn2 = Number(e[1]);

    sfaces[axis][0] = Number(e[2]);
    sfaces[axis][1] = Number(e[3]);
    tfaces[axis][0] = axisValue(bodyVertices, vn1, axis);
    tfaces[axis][1] = axisValue(bodyVertices, vn2, axis);
  }

  const sourcePoints = [];
  const targetPoints = [];

  for (const i of [0,1]) {
    for (const [j,k] of [[0,0],[0,1],[1,1],[1,0]]) {
      sourcePoints.push([sfaces[0][i], sfaces[1][j], sfaces[2][k]]);
      targetPoints.push([tfaces[0][i], tfaces[1][j], tfaces[2][k]]);
    }
  }

  return affineMatrixFromPointsMakeHuman(sourcePoints, targetPoints);
}

function computeOffsetMatrix(metadata, bodyVertices) {
  const tm = metadata?.tmatrix;
  if (!tm) return [1,0,0, 0,1,0, 0,0,1];

  // Precedenza identica a MakeHuman proxy.py::TMatrix.getMatrix().
  if (hasAnyTMatrixData(tm.scaleData)) {
    const scaleData = requireTMatrixAxisTriplet(tm.scaleData, 'scaleData');
    const scales = [1,1,1];

    for (let axis = 0; axis < 3; axis++) {
      const e = scaleData[axis];
      if (e.length < 3) throw new Error(`TMatrix scaleData asse ${axis} non valido.`);

      const den = Number(e[2]);
      if (!Number.isFinite(den) || den === 0) {
        throw new Error(`TMatrix scaleData asse ${axis}: denominatore non valido.`);
      }

      const num = Math.abs(
        axisValue(bodyVertices, Number(e[0]), axis) -
        axisValue(bodyVertices, Number(e[1]), axis)
      );

      scales[axis] = num / den;
    }

    return [scales[0],0,0, 0,scales[1],0, 0,0,scales[2]];
  }

  if (hasAnyTMatrixData(tm.shearData)) {
    return matrixFromShearMakeHuman(tm.shearData, bodyVertices);
  }
  if (hasAnyTMatrixData(tm.lShearData)) {
    return matrixFromShearMakeHuman(tm.lShearData, bodyVertices);
  }
  if (hasAnyTMatrixData(tm.rShearData)) {
    return matrixFromShearMakeHuman(tm.rShearData, bodyVertices);
  }

  return [1,0,0, 0,1,0, 0,0,1];
}

function fitProxy(json, bodyVertices) {
  const md = json.metadata || {};
  const refs = md.ref_vIdxs;
  const weights = md.weights;
  const offsets = md.offsets;
  const count = Math.floor((json.vertices?.length || 0) / 3);

  if (!Array.isArray(refs) || !Array.isArray(weights) || !Array.isArray(offsets)) {
    return {
      vertices:scaledVertices(json),
      fitted:false,
      invalidRefs:0,
      invalidRows:0,
      vertexCount:count
    };
  }

  const m = computeOffsetMatrix(md, bodyVertices);
  const out = new Float32Array(count * 3);
  let invalidRefs = 0;
  let invalidRows = 0;

  for (let i=0;i<count;i++) {
    const r=refs[i], w=weights[i], o=offsets[i];

    if (!Array.isArray(r)||!Array.isArray(w)||!Array.isArray(o)||
        r.length<3||w.length<3||o.length<3) {
      invalidRows++;
      continue;
    }

    let x=Number(o[0])*m[0]+Number(o[1])*m[1]+Number(o[2])*m[2];
    let y=Number(o[0])*m[3]+Number(o[1])*m[4]+Number(o[2])*m[5];
    let z=Number(o[0])*m[6]+Number(o[1])*m[7]+Number(o[2])*m[8];

    for (let j=0;j<3;j++) {
      const idx=Number(r[j]);
      const ww=Number(w[j]);
      const base=idx*3;

      if (!Number.isInteger(idx)||base<0||base+2>=bodyVertices.length||!Number.isFinite(ww)) {
        invalidRefs++;
        continue;
      }

      x += ww*bodyVertices[base];
      y += ww*bodyVertices[base+1];
      z += ww*bodyVertices[base+2];
    }

    out[i*3]=x;
    out[i*3+1]=y;
    out[i*3+2]=z;
  }

  return {vertices:out,fitted:true,invalidRefs,invalidRows,vertexCount:count};
}

function deleteMask(json, bodyCount) {
  const raw=json?.metadata?.deleteVerts;
  const mask=new Uint8Array(bodyCount);
  let count=0;

  if (!Array.isArray(raw)) return {mask,count,sourceLength:0};

  for (let i=0;i<Math.min(raw.length,bodyCount);i++) {
    const v=raw[i];
    const on=Array.isArray(v)?v.some(x=>Number(x)>0):Number(v)>0;
    if (on) {
      mask[i]=1;
      count++;
    }
  }

  return {mask,count,sourceLength:raw.length};
}

/**
 * Port semantico di MakeHuman proxy.transferVertexMaskToProxy().
 *
 * bodyVisible: 1 = mostra, 0 = maschera.
 * - mapping esatto (w1=w2=0): eredita la visibilità del primo ref vertex;
 * - mapping a 3 ref: nasconde il proxy vertex se meno di 2 ref sono visibili.
 */
function transferVertexMaskToProxyMakeHuman(bodyVisible, proxyJson) {
  const md=proxyJson?.metadata||{};
  const refs=md.ref_vIdxs;
  const weights=md.weights;

  if (!Array.isArray(refs) || !Array.isArray(weights)) {
    throw new Error('Clothes mask: proxy senza ref_vIdxs/weights MakeHuman.');
  }

  const proxyVisible=new Uint8Array(refs.length);
  proxyVisible.fill(1);

  for (let i=0;i<refs.length;i++) {
    const p=refs[i];
    const w=weights[i];

    if (!Array.isArray(p)||p.length<3||!Array.isArray(w)||w.length<3) {
      throw new Error(`Clothes mask: mapping proxy vertex ${i} non valido.`);
    }

    const p0=Number(p[0]), p1=Number(p[1]), p2=Number(p[2]);
    const exact=(Number(w[1])===0 && Number(w[2])===0);

    if (exact) {
      proxyVisible[i]=bodyVisible[p0]?1:0;
    } else {
      const visibleRefs=
        Number(Boolean(bodyVisible[p0]))+
        Number(Boolean(bodyVisible[p1]))+
        Number(Boolean(bodyVisible[p2]));

      if (visibleRefs < 2) proxyVisible[i]=0;
    }
  }

  return proxyVisible;
}

function proxyUuidMakeHuman(item) {
  return String(
    item?.json?.metadata?.uuid ??
    item?.json?.uuid ??
    item?.entry?.raw ??
    ''
  );
}

function proxyZDepthMakeHuman(item) {
  const raw=item?.json?.metadata?.z_depth ?? item?.json?.z_depth ?? -1;
  const z=Number(raw);
  return Number.isFinite(z)?z:-1;
}

/**
 * MakeHuman clothes chooser:
 * - ordina (z_depth, uuid) crescente e poi lo attraversa al contrario;
 * - la mask accumulata dei layer superiori viene trasferita al clothes corrente;
 * - solo dopo aggiunge deleteVerts del clothes corrente alla mask base;
 * - al termine la stessa mask accumulata viene applicata al body.
 */
function buildClothesMasksMakeHuman(loadedItems, bodyVertexCount, enabled=true) {
  const bodyVisible=new Uint8Array(bodyVertexCount);
  bodyVisible.fill(1);

  const proxyVisibleByItem=new Map();

  if (!enabled) {
    return {bodyVisible,proxyVisibleByItem,hiddenBodyVertices:0,ordered:[]};
  }

  const clothes=loadedItems
    .filter(item=>item.entry.category==='clothes')
    .slice()
    .sort((a,b)=>{
      const za=proxyZDepthMakeHuman(a);
      const zb=proxyZDepthMakeHuman(b);
      if (za!==zb) return za-zb;
      return proxyUuidMakeHuman(a).localeCompare(proxyUuidMakeHuman(b));
    })
    .reverse();

  for (const item of clothes) {
    proxyVisibleByItem.set(
      item,
      transferVertexMaskToProxyMakeHuman(bodyVisible,item.json)
    );

    const del=item.del?.mask;
    if (del) {
      for (let i=0;i<Math.min(del.length,bodyVisible.length);i++) {
        if (del[i]) bodyVisible[i]=0;
      }
    }
  }

  let hiddenBodyVertices=0;
  for (const visible of bodyVisible) if (!visible) hiddenBodyVertices++;

  return {bodyVisible,proxyVisibleByItem,hiddenBodyVertices,ordered:clothes};
}

function faceHiddenByVertexVisibility(vertexIndices, visibleMask) {
  if (!visibleMask) return false;
  // MakeHuman getFaceMaskForVertices(): una faccia resta visibile se almeno
  // uno dei suoi vertici è visibile. Quindi la nascondiamo SOLO se sono tutti masked.
  return vertexIndices.every(i=>!visibleMask[i]);
}

function bit(value,pos) {
  return (value&(1<<pos))!==0;
}

function legacyNormal(json, index) {
  const n = json.normals;
  if (!Array.isArray(n) || index == null) return null;
  const p = Number(index) * 3;
  if (p < 0 || p + 2 >= n.length) return null;
  return [Number(n[p]), Number(n[p+1]), Number(n[p+2])];
}

/**
 * Parser compatibilità THREE.JSONLoader:
 * - preserva UV seams;
 * - preserva materialIndex;
 * - usa le normali originali quando presenti;
 * - fallback smooth-by-source-vertex per il body MakeHuman.
 */
function geometryFromLegacy(json, verts, options={}) {
  const faces=json.faces||[];
  const uvLayers=Array.isArray(json.uvs)
    ? json.uvs.filter(x=>Array.isArray(x)&&x.length)
    : [];

  const positions=[];
  const uvs=[];
  const normals=[];
  const sourceVertexIds=[];
  const groups=[];

  let normalsComplete=true;
  let offset=0;
  let originalFaces=0;
  let skippedFaces=0;

  const read=i=>[verts[i*3],verts[i*3+1],verts[i*3+2]];

  const tri=(vi,uv,normalSet,mi)=>{
    const start=positions.length/3;

    for(let i=0;i<3;i++) {
      positions.push(...read(vi[i]));
      uvs.push(...(uv?.[i]||[0,0]));
      sourceVertexIds.push(vi[i]);

      const nn = normalSet?.[i] || null;
      if (nn) normals.push(...nn);
      else {
        normals.push(0,0,0);
        normalsComplete=false;
      }
    }

    groups.push({start,count:3,materialIndex:mi});
  };

  while(offset<faces.length) {
    const type=faces[offset++];
    const quad=bit(type,0);
    const hasMat=bit(type,1);
    const faceUv=bit(type,2);
    const vertUv=bit(type,3);
    const faceN=bit(type,4);
    const vertN=bit(type,5);
    const faceC=bit(type,6);
    const vertC=bit(type,7);

    const n=quad?4:3;
    const vi=[];

    for(let i=0;i<n;i++) vi.push(faces[offset++]);

    let mi=hasMat?faces[offset++]:0;

    if(faceUv) {
      for(let l=0;l<uvLayers.length;l++) offset++;
    }

    let perUv=null;
    if(vertUv) {
      const layers=[];
      for(let l=0;l<uvLayers.length;l++) {
        const layer=[];
        const src=uvLayers[l];
        for(let i=0;i<n;i++) {
          const ui=faces[offset++];
          layer.push([src[ui*2],src[ui*2+1]]);
        }
        layers.push(layer);
      }
      perUv=layers[0]||null;
    }

    let faceNormalIndex=null;
    if(faceN) faceNormalIndex=faces[offset++];

    let vertexNormalIndices=null;
    if(vertN) {
      vertexNormalIndices=[];
      for(let i=0;i<n;i++) vertexNormalIndices.push(faces[offset++]);
    }

    if(faceC) offset++;
    if(vertC) offset+=n;

    originalFaces++;

    if(options.skipFace?.(vi)) {
      skippedFaces++;
      continue;
    }

    if(options.forceMaterialIndex!=null) mi=options.forceMaterialIndex;

    let perNormal=null;
    if(vertexNormalIndices) {
      perNormal=vertexNormalIndices.map(idx=>legacyNormal(json,idx));
    } else if(faceNormalIndex!=null) {
      const fn=legacyNormal(json,faceNormalIndex);
      if(fn) perNormal=Array.from({length:n},()=>fn);
    }

    if(quad) {
      tri(
        [vi[0],vi[1],vi[3]],
        perUv?[perUv[0],perUv[1],perUv[3]]:null,
        perNormal?[perNormal[0],perNormal[1],perNormal[3]]:null,
        mi
      );
      tri(
        [vi[1],vi[2],vi[3]],
        perUv?[perUv[1],perUv[2],perUv[3]]:null,
        perNormal?[perNormal[1],perNormal[2],perNormal[3]]:null,
        mi
      );
    } else {
      tri(vi,perUv,perNormal,mi);
    }
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));

  // aoMap su Three moderno cerca un UV secondario. Tenere entrambe le alias
  // ci permette di aggiungere AO in seguito senza ricostruire la geometria.
  g.setAttribute('uv1',new THREE.Float32BufferAttribute(uvs,2));
  g.setAttribute('uv2',new THREE.Float32BufferAttribute(uvs,2));

  if(normalsComplete && normals.length===positions.length) {
    g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  } else if(options.smoothBySourceVertex) {
    const sourceCount=Math.floor(verts.length/3);
    const acc=new Float64Array(sourceCount*3);

    for(let i=0;i<positions.length;i+=9) {
      const ax=positions[i], ay=positions[i+1], az=positions[i+2];
      const bx=positions[i+3], by=positions[i+4], bz=positions[i+5];
      const cx=positions[i+6], cy=positions[i+7], cz=positions[i+8];

      const abx=bx-ax, aby=by-ay, abz=bz-az;
      const acx=cx-ax, acy=cy-ay, acz=cz-az;

      const nx=aby*acz-abz*acy;
      const ny=abz*acx-abx*acz;
      const nz=abx*acy-aby*acx;

      const outVertex=i/3;
      for(let k=0;k<3;k++) {
        const source=sourceVertexIds[outVertex+k];
        const p=source*3;
        acc[p]+=nx;
        acc[p+1]+=ny;
        acc[p+2]+=nz;
      }
    }

    const smooth=new Float32Array(sourceVertexIds.length*3);

    for(let i=0;i<sourceVertexIds.length;i++) {
      const source=sourceVertexIds[i];
      const p=source*3;
      let nx=acc[p], ny=acc[p+1], nz=acc[p+2];
      const len=Math.hypot(nx,ny,nz)||1;
      smooth[i*3]=nx/len;
      smooth[i*3+1]=ny/len;
      smooth[i*3+2]=nz/len;
    }

    g.setAttribute('normal',new THREE.BufferAttribute(smooth,3));
  } else {
    g.computeVertexNormals();
  }

  g.computeBoundingBox();
  g.computeBoundingSphere();

  for(const gr of groups) g.addGroup(gr.start,gr.count,gr.materialIndex);

  return {geometry:g,originalFaces,skippedFaces};
}

function resolveUrl(baseUrl,ref) {
  try { return new URL(ref,baseUrl).href; }
  catch { return ref; }
}

async function texture(url,srgb=false) {
  return new Promise(resolve =>
    new THREE.TextureLoader().load(
      url,
      t => {
        if(srgb) t.colorSpace=THREE.SRGBColorSpace;
        t.wrapS=t.wrapT=THREE.RepeatWrapping;
        resolve(t);
      },
      undefined,
      () => resolve(null)
    )
  );
}

function firstDefined(object, keys, fallback=undefined) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) return object[key];
  }
  return fallback;
}

function mhBool(def, keys, fallback) {
  const value=firstDefined(def,keys,undefined);
  if (value===undefined) return fallback;
  if (typeof value==='boolean') return value;
  if (typeof value==='string') {
    if (value.toLowerCase()==='true') return true;
    if (value.toLowerCase()==='false') return false;
  }
  return Boolean(value);
}

function mhNumber(def, keys, fallback) {
  const value=Number(firstDefined(def,keys,fallback));
  return Number.isFinite(value)?value:fallback;
}

function mhColor(def, keys, fallback) {
  const value=firstDefined(def,keys,fallback);
  if (!Array.isArray(value) || value.length<3) return fallback;
  return [Number(value[0]),Number(value[1]),Number(value[2])];
}

async function materialFromDef(def,jsonUrl,category='proxy') {
  // Defaults taken from MakeHuman Material.__init__, not from asset category.
  const diffuse=mhColor(def,['colorDiffuse','diffuseColor'],[1,1,1]);
  const specular=mhColor(def,['colorSpecular','specularColor'],[1,1,1]);
  const emissive=mhColor(def,['colorEmissive','emissiveColor'],[0,0,0]);

  const shadeless=mhBool(def,['shadeless'],false);
  const transparent=mhBool(def,['transparent'],false);
  const backfaceCull=mhBool(def,['backfaceCull','adfBackfaceCull'],true);
  const alphaToCoverage=mhBool(def,['alphaToCoverage','adfAlphaToCoverage'],true);
  const depthless=mhBool(def,['depthless'],false);
  const wireframe=mhBool(def,['wireframe'],false);
  const opacity=mhNumber(def,['opacity'],1);
  const shininess=mhNumber(def,['shininess','specularCoef'],0.2);

  const common={
    color:new THREE.Color(diffuse[0],diffuse[1],diffuse[2]),
    opacity,
    transparent:false,
    side:backfaceCull?THREE.FrontSide:THREE.DoubleSide,
    depthTest:!depthless,
    depthWrite:!depthless,
    wireframe
  };

  // MakeHuman "shadeless" disables lighting.
  const mat=shadeless
    ? new THREE.MeshBasicMaterial(common)
    : new THREE.MeshPhongMaterial({
        ...common,
        specular:new THREE.Color(specular[0],specular[1],specular[2]),
        emissive:new THREE.Color(emissive[0],emissive[1],emissive[2]),
        shininess
      });

  mat.name=String(firstDefined(def,['DbgName','name'],''));

  // MakeHuman glmodule.py semantics for transparent primitives:
  //   glEnable(GL_ALPHA_TEST)
  //   glAlphaFunc(GL_GREATER, 0.0)
  // plus GL_SAMPLE_ALPHA_TO_COVERAGE when requested and multisampling exists.
  //
  // Three.js has no fixed-function GL_ALPHA_TEST, so the semantic equivalent
  // is a tiny positive alphaTest. This is DATA-DRIVEN by material.transparent,
  // never by asset category.
  mat.userData.mhTransparent = Boolean(transparent);
  mat.userData.mhAlphaToCoverage = Boolean(alphaToCoverage);
  mat.userData.mhBackfaceCull = Boolean(backfaceCull);

  if (transparent) {
    mat.alphaTest = 1 / 255;

    // MakeHuman glmodule.py:
    // A2C path => GL_SAMPLE_ALPHA_TO_COVERAGE ON + GL_BLEND OFF.
    if (alphaToCoverage) {
      mat.transparent = false;
      mat.alphaToCoverage = true;
      mat.depthWrite = !depthless;
    } else {
      // Non-A2C path => normal alpha blending + depth mask OFF.
      mat.transparent = true;
      mat.alphaToCoverage = false;
      mat.depthWrite = false;
    }
  } else {
    mat.transparent = false;
    mat.alphaTest = 0;
    mat.alphaToCoverage = false;
    mat.depthWrite = !depthless;
  }

  const base=new URL('./',new URL(jsonUrl,location.href)).href;

  const mapDiffuse=firstDefined(def,['mapDiffuse','diffuseTexture']);
  const mapNormal=firstDefined(def,['mapNormal','normalmapTexture','normalMapTexture']);
  const mapBump=firstDefined(def,['mapBump','bumpTexture','bumpMapTexture']);
  const mapAlpha=firstDefined(def,['mapAlpha','transparencyMapTexture','transparencymapTexture']);
  const mapAO=firstDefined(def,['mapAO','aoMapTexture','aomapTexture']);
  const mapDisplacement=firstDefined(def,['mapDisplacement','displacementMapTexture','displacementmapTexture']);
  const mapSpecular=firstDefined(def,['mapSpecular','specularMapTexture','specularmapTexture']);

  if(mapDiffuse) {
    const t=await texture(resolveUrl(base,mapDiffuse),true);
    if(t) mat.map=t;
  }

  if(!shadeless && mapNormal) {
    const t=await texture(resolveUrl(base,mapNormal));
    if(t) {
      mat.normalMap=t;
      const intensity=mhNumber(def,['normalmapIntensity','normalMapIntensity'],1);
      mat.normalScale=new THREE.Vector2(intensity,intensity);
    }
  }

  if(!shadeless && mapBump) {
    const t=await texture(resolveUrl(base,mapBump));
    if(t) {
      mat.bumpMap=t;
      mat.bumpScale=mhNumber(def,['bumpmapIntensity','bumpMapIntensity','bumpScale'],1);
    }
  }

  if(mapAlpha) {
    const t=await texture(resolveUrl(base,mapAlpha));
    if(t) mat.alphaMap=t;
  }

  if(!shadeless && mapAO) {
    const t=await texture(resolveUrl(base,mapAO));
    if(t) {
      mat.aoMap=t;
      mat.aoMapIntensity=mhNumber(def,['aomapIntensity','aoMapIntensity'],1);
    }
  }

  if(!shadeless && mapDisplacement) {
    const t=await texture(resolveUrl(base,mapDisplacement));
    if(t) {
      mat.displacementMap=t;
      mat.displacementScale=mhNumber(
        def,
        ['displacementmapIntensity','displacementMapIntensity'],
        1
      );
    }
  }

  if(!shadeless && mapSpecular && 'specularMap' in mat) {
    const t=await texture(resolveUrl(base,mapSpecular));
    if(t) mat.specularMap=t;
  }

  // Nessuna soglia inventata per hair/clothes:
  // alphaTest minimo deriva esclusivamente da material.transparent,
  // come GL_ALPHA_TEST > 0 nel renderer MakeHuman originale.
  mat.needsUpdate=true;
  return mat;
}


function applyAppearanceColorToMaterial(mat, uiGroup) {
  const state=appearanceColorState[uiGroup];
  if(!state?.enabled || !COLOR_CUSTOMIZABLE_GROUPS.has(uiGroup)) return mat;

  const tint=new THREE.Color(state.color);
  const selectiveEye=uiGroup==='eyes';

  mat.userData.adfAppearanceColor={
    group:uiGroup,
    color:state.color,
    mode:selectiveEye?'iris-selective':'luminance-tint'
  };

  const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=shader=>{
    previous?.(shader);

    shader.uniforms.adfCustomTint={value:tint.clone()};
    shader.uniforms.adfCustomTintMode={value:selectiveEye?1:0};

    shader.fragmentShader=shader.fragmentShader.replace(
      'void main() {',
      `uniform vec3 adfCustomTint;
uniform float adfCustomTintMode;

void main() {`
    );

    shader.fragmentShader=shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>

{
  // Editor-only color customization.
  // RGB only: alpha/alphaMap/A2C semantics remain MakeHuman-driven.
  float adfMaxC=max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b);
  float adfMinC=min(min(diffuseColor.r,diffuseColor.g),diffuseColor.b);
  float adfChroma=adfMaxC-adfMinC;
  float adfLum=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));

  float adfMask=1.0;

  // Occhi: evita di colorare tutta la sclera.
  // L'iride ha cromaticità maggiore; bianco/grigio/nero restano molto meno coinvolti.
  if(adfCustomTintMode>0.5){
    float chromaMask=smoothstep(0.035,0.16,adfChroma);
    float whiteReject=1.0-smoothstep(0.80,0.98,adfLum);
    adfMask=clamp(chromaMask*whiteReject,0.0,1.0);
  }

  // Mantiene luci/ombre della texture invece di appiattirla a tinta unita.
  vec3 adfTinted=clamp(adfCustomTint*(0.20+adfLum*1.10),0.0,1.0);
  diffuseColor.rgb=mix(diffuseColor.rgb,adfTinted,0.92*adfMask);
}`
    );
  };

  mat.customProgramCacheKey=()=>`adf-appearance-color-v210-${selectiveEye?'eye':'full'}`;
  mat.needsUpdate=true;
  return mat;
}

function applyAppearanceColorToMaterials(materials, uiGroup) {
  if(!COLOR_CUSTOMIZABLE_GROUPS.has(uiGroup)) return materials;
  for(const mat of materials||[]) applyAppearanceColorToMaterial(mat,uiGroup);
  return materials;
}

async function materialsFromJson(json,jsonUrl,category) {
  const defs=Array.isArray(json.materials)?json.materials:[];
  if(!defs.length) return [await materialFromDef({},jsonUrl,category)];

  const out=[];
  for(const d of defs) out.push(await materialFromDef(d,jsonUrl,category));

  if(category==='body') {
    // MakeHuman bodyPartOpacity(0): helper/joint remain available for fitting/rig
    // but are never rendered.
    for(const mat of out) {
      const n=String(mat.name||'').toLowerCase();
      if(n.startsWith('helper')||n.startsWith('joint')) {
        mat.visible=false;
        mat.opacity=0;
        mat.transparent=true;
        mat.depthWrite=false;
      }
    }
  }

  return out;
}

function applyMakeHumanMeshFlags(mesh,json) {
  const defs=Array.isArray(json?.materials)?json.materials:[];

  // MakeHuman material defaults: castShadows/receiveShadows = true.
  // Three exposes them on Object3D instead of per-material; preserve the
  // restrictive interpretation if any active material explicitly disables it.
  mesh.castShadow=!defs.some(d=>mhBool(d,['castShadows'],true)===false);
  mesh.receiveShadow=!defs.some(d=>mhBool(d,['receiveShadows'],true)===false);
}

function disposeMaterials(materials) {
  for(const m of materials||[]) {
    if(!m) continue;
    for(const k of ['map','normalMap','bumpMap','alphaMap','aoMap','displacementMap','specularMap']) {
      m[k]?.dispose?.();
    }
    m.dispose?.();
  }
}

function disposeMesh(mesh) {
  if(!mesh) return;
  scene.remove(mesh);
  mesh.geometry?.dispose?.();
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  disposeMaterials(mats);
}

function applyCustomTargetStack(base) {
  const out=new Float32Array(base);
  if(!customTargets?.targets?.length) return out;

  for(const target of customTargets.targets) {
    const strength=Number(customTargetValues[String(target.id)]||0);
    if(!strength) continue;

    for(const d of target.vertices||[]) {
      const i=Number(d[0]);
      const p=i*3;
      if(p<0||p+2>=out.length) continue;
      out[p]+=Number(d[1])*strength;
      out[p+1]+=Number(d[2])*strength;
      out[p+2]+=Number(d[3])*strength;
    }
  }
  return out;
}

function activeCustomTargetCount() {
  return Object.values(customTargetValues).filter(v=>Math.abs(Number(v)||0)>1e-8).length;
}

const MODIFIER_LABEL_OVERRIDES={
  'macrodetails/Gender':'Sesso / struttura sessuata',
  'macrodetails/Age':'Età fisica',
  'macrodetails/African':'Tratti africani',
  'macrodetails/Asian':'Tratti asiatici',
  'macrodetails/Caucasian':'Tratti caucasici',
  'macrodetails-universal/Muscle':'Muscolatura generale',
  'macrodetails-universal/Weight':'Corporatura / peso',
  'macrodetails-height/Height':'Altezza',
  'macrodetails-proportions/BodyProportions':'Proporzioni del corpo',
  'breast/BreastSize':'Volume del petto / seno',
  'breast/BreastFirmness':'Tono del petto / seno'
};

function prettyModifierText(meta) {
  const full=String(meta.fullName||'');
  if(MODIFIER_LABEL_OVERRIDES[full]) return MODIFIER_LABEL_OVERRIDES[full];

  let n=String(meta.name||full.split('/').pop()||'').toLowerCase();
  let side='';
  if(/^r-/.test(n)){ side=' · destro'; n=n.replace(/^r-/,''); }
  else if(/^l-/.test(n)){ side=' · sinistro'; n=n.replace(/^l-/,''); }

  const group=String(meta.groupName||'').toLowerCase();
  if(group && n.startsWith(group+'-')) n=n.slice(group.length+1);

  const exact=[
    [/^age-less\|more$/,'Età della testa'],[/^angle-in\|out$/,'Inclinazione della testa'],
    [/^skinny\|fat$/,'Volume'],[/^oval$/,'Forma ovale'],[/^round$/,'Forma rotonda'],
    [/^rectangular$/,'Forma rettangolare'],[/^square$/,'Forma quadrata'],
    [/^triangular$/,'Forma triangolare'],[/^invertedtriangular$/,'Forma triangolare inversa'],
    [/^diamond$/,'Forma a diamante'],[/^double-less\|more$/,'Doppio mento / collo'],
    [/^bag-min\|max$/,'Volume borse sotto gli occhi'],[/^bag-in\|out$/,'Sporgenza borse sotto gli occhi'],
    [/^bag-height-min\|max$/,'Altezza borse sotto gli occhi'],[/^eyefold-angle-down\|up$/,'Inclinazione piega palpebrale'],
    [/^epicanthus-in\|out$/,'Epicanto'],[/^eyefold-concave\|convex$/,'Volume piega palpebrale'],
    [/^eyefold-down\|up$/,'Posizione piega palpebrale'],[/^height1-min\|max$/,'Altezza occhio · zona 1'],
    [/^height2-min\|max$/,'Altezza occhio · zona 2'],[/^height3-min\|max$/,'Altezza occhio · zona 3'],
    [/^push1-in\|out$/,'Angolo esterno · posizione orizzontale'],[/^push2-out\|in$/,'Angolo interno · posizione orizzontale'],
    [/^move-in\|out$/,'Posizione orizzontale'],[/^move-down\|up$/,'Posizione verticale'],
    [/^size-small\|big$/,'Dimensione'],[/^corner1-down\|up$/,'Angolo esterno · posizione verticale'],
    [/^corner2-down\|up$/,'Angolo interno · posizione verticale'],[/^compression-compress\|uncompress$/,'Compressione'],
    [/^curve-concave\|convex$/,'Curvatura'],[/^greek-lessgreek\|moregreek$/,'Profilo greco'],
    [/^hump-lesshump\|morehump$/,'Gibbo nasale'],[/^volume-potato\|point$/,'Forma della punta'],
    [/^nostrils-angle-down\|up$/,'Inclinazione narici'],[/^septumangle-decr\|incr$/,'Angolo del setto'],
    [/^flaring-decr\|incr$/,'Apertura narici'],[/^dimples-in\|out$/,'Fossette'],
    [/^laugh-lines-in\|out$/,'Linee del sorriso'],[/^angles-down\|up$/,'Angoli della bocca'],
    [/^cleft-in\|out$/,'Fossetta del mento'],[/^prominent-less\|more$/,'Sporgenza del mento'],
    [/^prognathism-less\|more$/,'Prognatismo'],[/^jaw-drop-less\|more$/,'Linea mandibolare'],
    [/^navel-in\|out$/,'Profondità ombelico'],[/^navel-down\|up$/,'Posizione ombelico'],
    [/^tone-decr\|incr$/,'Tono'],[/^pregnant-decr\|incr$/,'Volume addome'],
    [/^vshape-less\|more$/,'Forma a V del torso'],[/^bulge-decr\|incr$/,'Volume inguinale'],
    [/^genu-varun\|valgus$/,'Allineamento ginocchio'],[/^fingers-distance-decr\|incr$/,'Distanza tra le dita'],
    [/^fingers-diameter-decr\|incr$/,'Spessore dita'],[/^fingers-length-decr\|incr$/,'Lunghezza dita'],
    [/^shoulder-muscle-decr\|incr$/,'Muscolatura spalla'],[/^muscle-decr\|incr$/,'Muscolatura'],
    [/^nipple-size-min\|max$/,'Dimensione capezzolo'],[/^nipple-point-in\|out$/,'Sporgenza capezzolo'],
    [/^penis-length-min\|max$/,'Lunghezza'],[/^penis-circ-min\|max$/,'Circonferenza'],
    [/^penis-testicles-min\|max$/,'Volume testicoli']
  ];
  for(const [re,label] of exact) if(re.test(n)) return label+side;

  const rules=[
    [/^trans-depth-(?:backward\|forward|forward\|backward)$/,'Posizione in profondità'],
    [/^trans-horiz-in\|out$/,'Posizione orizzontale'],[/^trans-vert-down\|up$/,'Posizione verticale'],
    [/^trans-(?:backward\|forward|forward\|backward)$/,'Posizione in profondità'],
    [/^trans-in\|out$/,'Posizione orizzontale'],[/^trans-down\|up$/,'Posizione verticale'],
    [/^scale-depth-(?:less\|more|decr\|incr)$/,'Profondità'],
    [/^scale-horiz-(?:less\|more|decr\|incr)$/,'Larghezza'],
    [/^scale-vert-(?:less\|more|decr\|incr)$/,'Altezza'],[/^scale-decr\|incr$/,'Dimensione'],
    [/^width([123])?-min\|max$/,m=>m[1]?`Larghezza · zona ${m[1]}`:'Larghezza'],
    [/^height-min\|max$/,'Altezza'],[/^nostril-width-min\|max$/,'Larghezza narici'],
    [/^point-width-less\|more$/,'Larghezza punta'],[/^point-down\|up$/,'Posizione verticale della punta'],
    [/^lowerlip-height-min\|max$/,'Altezza labbro inferiore'],[/^lowerlip-width-min\|max$/,'Larghezza labbro inferiore'],
    [/^upperlip-height-min\|max$/,'Altezza labbro superiore'],[/^upperlip-width-min\|max$/,'Larghezza labbro superiore'],
    [/^cupidsbow-width-min\|max$/,"Larghezza arco di Cupido"],[/^cupidsbow-decr\|incr$/,"Forma arco di Cupido"],
    [/^lowerlip-ext-up\|down$/,'Curvatura labbro inferiore'],[/^upperlip-ext-down\|up$/,'Curvatura labbro superiore'],
    [/^lowerlip-middle-up\|down$/,'Centro labbro inferiore'],[/^upperlip-middle-down\|up$/,'Centro labbro superiore'],
    [/^lowerlip-volume-deflate\|inflate$/,'Volume labbro inferiore'],[/^upperlip-volume-deflate\|inflate$/,'Volume labbro superiore'],
    [/^philtrum-volume-increase\|decrease$/,'Volume filtro labiale'],[/^lobe-min\|max$/,'Dimensione lobo'],
    [/^shape1-pointed\|triangle$/,'Forma · appuntita / triangolare'],[/^shape2-square\|round$/,'Forma · squadrata / rotonda'],
    [/^rot-backward\|forward$/,'Rotazione'],[/^wing-in\|out$/,'Apertura padiglione'],[/^flap-in\|out$/,'Sporgenza padiglione'],
    [/^volume-deflate\|inflate$/,'Volume'],[/^bones-in\|out$/,'Prominenza ossea'],[/^inner-deflate\|inflate$/,'Volume interno'],
    [/^waist-down\|up$/,'Posizione vita'],[/^dist-min\|max$/,'Distanza'],[/^point-min\|max$/,'Sporgenza'],
    [/^volume-vert-up\|down$/,'Distribuzione verticale volume'],[/^upperlegheight-decr\|incr$/,'Lunghezza coscia'],
    [/^lowerlegheight-decr\|incr$/,'Lunghezza gamba']
  ];
  for(const [re,label] of rules){
    const m=n.match(re);
    if(m) return (typeof label==='function'?label(m):label)+side;
  }

  if(/^measure-/.test(n)){
    const key=n.replace(/^measure-/,'').replace(/-(decrease|increase)$/,'');
    const measures={
      neckcirc:'Circonferenza collo',neckheight:'Altezza collo',upperarm:'Circonferenza braccio',
      upperarmlenght:'Lunghezza braccio',lowerarmlenght:'Lunghezza avambraccio',wrist:'Circonferenza polso',
      frontchest:'Larghezza torace',bust:'Circonferenza torace',underbust:'Circonferenza sottotorace',
      waist:'Circonferenza vita',napetowaist:'Nuca → vita',waisttohip:'Vita → fianchi',
      shoulder:'Larghezza spalle',hips:'Circonferenza fianchi',upperlegheight:'Lunghezza coscia',
      thighcirc:'Circonferenza coscia',lowerlegheight:'Lunghezza gamba',calf:'Circonferenza polpaccio',
      kneecirc:'Circonferenza ginocchio',ankle:'Circonferenza caviglia'
    };
    return (measures[key]||'Misura corporea')+side;
  }

  const tokens={
    back:'posteriore',temple:'tempia',angle:'angolo',height:'altezza',width:'larghezza',size:'dimensione',
    corner:'angolo',nose:'naso',nostril:'narice',nostrils:'narici',point:'punta',septum:'setto',
    mouth:'bocca',lowerlip:'labbro inferiore',upperlip:'labbro superiore',philtrum:'filtro labiale',
    cupidsbow:'arco di Cupido',ear:'orecchio',chin:'mento',jaw:'mandibola',cheek:'guancia',
    torso:'torace',hip:'fianco',stomach:'addome',buttocks:'glutei',pelvis:'bacino',hand:'mano',
    fingers:'dita',foot:'piede',lowerarm:'avambraccio',upperarm:'braccio',shoulder:'spalla',
    lowerleg:'gamba',upperleg:'coscia',leg:'gamba',breast:'petto',nipple:'capezzolo',
    penis:'pene',testicles:'testicoli',muscle:'muscolatura',tone:'tono',volume:'volume',
    scale:'dimensione',trans:'posizione',horiz:'orizzontale',vert:'verticale',depth:'profondità',
    distance:'distanza',diameter:'spessore',length:'lunghezza',curve:'curvatura',
    compression:'compressione',greek:'profilo greco',hump:'gibbo',flaring:'apertura',
    pregnant:'volume',navel:'ombelico',bones:'ossa',prominent:'sporgenza',circ:'circonferenza',
    down:'basso',up:'alto',in:'interno',out:'esterno',backward:'indietro',forward:'avanti',
    less:'meno',more:'più',min:'minimo',max:'massimo',decr:'meno',incr:'più',
    skinny:'magro',fat:'robusto',small:'piccolo',big:'grande',concave:'concavo',convex:'convesso',
    deflate:'meno',inflate:'più',increase:'più',decrease:'meno',pointed:'appuntito',
    triangle:'triangolare',square:'quadrato',round:'rotondo'
  };
  const parts=n.replaceAll('|','-').split('-').filter(Boolean);
  const translated=parts.map(x=>tokens[x]||(/^\d+$/.test(x)?x:'regolazione')).join(' ');
  const cleaned=translated.replace(/\bregolazione(?: regolazione)+\b/g,'regolazione').trim();
  return (cleaned?cleaned[0].toUpperCase()+cleaned.slice(1):'Regolazione')+side;
}

function groupTitle(group) { return String(group||'Altri controlli'); }

function deriveNativeCalibration(engineBase,currentBase) {
  if(!engineBase || engineBase.length!==currentBase.length) {
    throw new Error(`Vertici MakeHuman incompatibili: engine=${engineBase?.length||0}, renderer=${currentBase.length}`);
  }

  const axes=[];
  for(let axis=0;axis<3;axis++) {
    let n=0,sx=0,sy=0,sxx=0,sxy=0;
    for(let i=axis;i<engineBase.length;i+=3) {
      const x=Number(engineBase[i]), y=Number(currentBase[i]);
      if(!Number.isFinite(x)||!Number.isFinite(y)) continue;
      n++; sx+=x; sy+=y; sxx+=x*x; sxy+=x*y;
    }
    const denom=n*sxx-sx*sx;
    const a=Math.abs(denom)>1e-12 ? (n*sxy-sx*sy)/denom : 1;
    const b=n ? (sy-a*sx)/n : 0;
    axes.push({a,b});
  }

  let err2=0,count=0,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<currentBase.length;i++) {
    const axis=i%3;
    const expected=axes[axis].a*engineBase[i]+axes[axis].b;
    const d=expected-currentBase[i];
    err2+=d*d; count++;
    min[axis]=Math.min(min[axis],currentBase[i]);
    max[axis]=Math.max(max[axis],currentBase[i]);
  }
  const rms=Math.sqrt(err2/Math.max(1,count));
  const diag=Math.hypot(max[0]-min[0],max[1]-min[1],max[2]-min[2])||1;
  const ratio=rms/diag;

  if(ratio>0.005) {
    throw new Error(`Calibrazione body MakeHuman incoerente (RMS ${(ratio*100).toFixed(3)}%).`);
  }

  return {axes,rms,ratio};
}

function mapNativeVertices(flat) {
  if(!nativeCalibration) return new Float32Array(flat);
  const out=new Float32Array(flat.length);
  for(let i=0;i<flat.length;i++) {
    const c=nativeCalibration.axes[i%3];
    out[i]=c.a*flat[i]+c.b;
  }
  return out;
}

function nativeEnginePost(type,payload={}) {
  if(!nativeModifierFrame?.contentWindow) throw new Error('Modifier engine non disponibile');
  nativeModifierFrame.contentWindow.postMessage({type,...payload},'*');
}

function setModifierEngineStatus(text,bad=false) {
  const el=E('modifierEngineStatus');
  if(!el) return;
  el.innerHTML=`<b>Controlli MakeHuman</b><br>${escapeHtml(text)}`;
  el.style.borderColor=bad?'rgba(255,80,80,.35)':'rgba(211,170,94,.18)';
}

function syncGenderQuick() {
  const value=Number(nativeModifierValues['macrodetails/Gender']);
  document.querySelectorAll('[data-gender-value]').forEach(btn=>{
    const v=Number(btn.dataset.genderValue);
    btn.classList.toggle('active',Math.abs(value-v)<0.12);
  });
}

function syncModifierControls() {
  for(const [name,controls] of modifierControls.entries()) {
    const value=Number(nativeModifierValues[name]);
    for(const item of controls) {
      if(item.input && Number.isFinite(value)) item.input.value=String(value);
      if(item.output && Number.isFinite(value)) item.output.textContent=value.toFixed(2);
    }
  }

  for(const item of symmetricModifierControls) {
    const values=item.names
      .map(name=>Number(nativeModifierValues[name]))
      .filter(Number.isFinite);
    if(!values.length) continue;

    const average=values.reduce((sum,value)=>sum+value,0)/values.length;
    if(item.input) item.input.value=String(average);
    if(item.output) item.output.textContent=average.toFixed(2);

    const asymmetric=values.length===2 && Math.abs(values[0]-values[1])>0.0005;
    if(item.input) item.input.dataset.asymmetric=asymmetric?'true':'false';
  }

  syncGenderQuick();
}

function scheduleNativeRebuild() {
  if(nativeRebuildQueued) return;
  nativeRebuildQueued=true;
  requestAnimationFrame(async()=>{
    nativeRebuildQueued=false;
    await rebuildAll(true);
  });
}

function handleNativeEngineMessage(e) {
  if(!nativeModifierFrame || e.source!==nativeModifierFrame.contentWindow) return;
  const msg=e.data||{};

  if(msg.type==='adf-mh-engine-error') {
    const err=new Error(msg.message||'Modifier engine MakeHuman non avviato');
    setModifierEngineStatus(err.message,true);
    nativeEngineReadyReject?.(err);
    return;
  }

  if(msg.type==='adf-mh-engine-request-error') {
    const pending=nativePendingRequests.get(msg.requestId);
    if(pending) {
      nativePendingRequests.delete(msg.requestId);
      pending.reject(new Error(msg.message||'Errore modifier MakeHuman'));
    }
    return;
  }

  if(msg.type!=='adf-mh-engine-ready' && msg.type!=='adf-mh-engine-update') return;

  nativeModifierValues={...(msg.values||{})};

  if(msg.type==='adf-mh-engine-ready') {
    nativeModifierMeta=Array.isArray(msg.modifiers)?msg.modifiers:[];
    nativeModifierDefaults=Object.fromEntries(nativeModifierMeta.map(m=>[m.fullName,Number(m.defaultValue)||0]));
    nativeEngineBase=new Float32Array(msg.baseVertices||[]);
    nativeCalibration=deriveNativeCalibration(nativeEngineBase,scaledVertices(bodyJson));
    nativeMorphedBody=mapNativeVertices(new Float32Array(msg.vertices||[]));
    nativeEngineReady=true;
    buildNativeModifierUi();
    setModifierEngineStatus(
      `${nativeModifierMeta.length} controlli · ${msg.targetCount} forme native · ${msg.vertexCount} vertici · calibrazione ${(nativeCalibration.ratio*100).toFixed(4)}%`
    );
    nativeEngineReadyResolve?.(true);
  } else {
    nativeMorphedBody=mapNativeVertices(new Float32Array(msg.vertices||[]));
    syncModifierControls();
    scheduleNativeRebuild();
  }

  if(msg.requestId && nativePendingRequests.has(msg.requestId)) {
    const pending=nativePendingRequests.get(msg.requestId);
    nativePendingRequests.delete(msg.requestId);
    pending.resolve(true);
  }
}

function requestNativeModifier(fullName,value) {
  if(!nativeEngineReady) return Promise.reject(new Error('Modifier engine non pronto'));
  const requestId=`mh-${++nativeRequestCounter}`;
  return new Promise((resolve,reject)=>{
    nativePendingRequests.set(requestId,{resolve,reject});
    nativeEnginePost('adf-mh-engine-set',{requestId,fullName,value:Number(value)});
  });
}

function requestNativeModifiers(values) {
  if(!nativeEngineReady) return Promise.reject(new Error('Modifier engine non pronto'));
  const requestId=`mh-${++nativeRequestCounter}`;
  return new Promise((resolve,reject)=>{
    nativePendingRequests.set(requestId,{resolve,reject});
    nativeEnginePost('adf-mh-engine-set-many',{requestId,values});
  });
}

function initNativeModifierEngine() {
  if(nativeEngineReady) return Promise.resolve(true);

  return new Promise((resolve,reject)=>{
    nativeEngineReadyResolve=resolve;
    nativeEngineReadyReject=reject;

    addEventListener('message',handleNativeEngineMessage);

    nativeModifierFrame=document.createElement('iframe');
    nativeModifierFrame.id='nativeModifierEngineFrame';
    nativeModifierFrame.hidden=true;
    nativeModifierFrame.setAttribute('aria-hidden','true');
    nativeModifierFrame.src=`./modifier-engine.html?v=${Date.now()}`;
    nativeModifierFrame.addEventListener('load',()=>{
      try{
        nativeModifierFrame.contentWindow.adfMakeHumanUiAudit=()=>window.adfMakeHumanUiAudit();
        nativeModifierFrame.contentWindow.adfMakeHumanUiConversions=()=>window.adfMakeHumanUiConversions?.()||[];
      }catch(err){
        console.warn('[ADF MakeHuman] bridge audit iframe non disponibile',err);
      }
    });
    nativeModifierFrame.addEventListener('error',()=>reject(new Error('modifier-engine.html non caricato')));
    document.body.appendChild(nativeModifierFrame);

    setTimeout(()=>{
      if(!nativeEngineReady) reject(new Error('Timeout modifier engine MakeHuman (targets.bin).'));
    },90000);
  });
}

function registerModifierControl(fullName,input,output) {
  const arr=modifierControls.get(fullName)||[];
  arr.push({input,output});
  modifierControls.set(fullName,arr);
}

function symmetricModifierKey(meta) {
  const full=String(meta?.fullName||'');
  if(!sideFromName(full)) return '';
  return full.replace(/(^|[-/])[rl]-/i,'$1side-');
}

function symmetricModifierLabel(meta) {
  return prettyModifierText(meta)
    .replace(/\s*·\s*(?:destro|sinistro)\s*$/i,'')
    .trim();
}

function buildSymmetricModifierRows(items,{mergeSides=true}={}) {
  if(!mergeSides) return items.map(meta=>({type:'single',meta}));

  const byKey=new Map();
  for(const meta of items) {
    const key=symmetricModifierKey(meta);
    if(!key) continue;
    const entry=byKey.get(key)||{};
    entry[sideFromName(meta.fullName)]=meta;
    byKey.set(key,entry);
  }

  const consumed=new Set();
  const rows=[];

  for(const meta of items) {
    if(consumed.has(meta.fullName)) continue;

    const key=symmetricModifierKey(meta);
    const pair=key?byKey.get(key):null;

    if(pair?.left && pair?.right) {
      consumed.add(pair.left.fullName);
      consumed.add(pair.right.fullName);
      rows.push({
        type:'symmetric',
        left:pair.left,
        right:pair.right,
        key,
      });
      continue;
    }

    consumed.add(meta.fullName);
    rows.push({type:'single',meta});
  }

  return rows;
}

function makeSymmetricModifierRow(leftMeta,rightMeta) {
  const row=document.createElement('div');
  row.className='modifier-row modifier-row-symmetric';

  const head=document.createElement('div');
  head.className='modifier-label';

  const label=document.createElement('b');
  label.textContent=symmetricModifierLabel(leftMeta);

  const badge=document.createElement('span');
  badge.className='modifier-side-badge';
  badge.textContent='L + R';
  badge.title='Controllo simmetrico: modifica entrambi i lati';

  const output=document.createElement('output');

  const leftValue=Number(nativeModifierValues[leftMeta.fullName]);
  const rightValue=Number(nativeModifierValues[rightMeta.fullName]);
  const leftDefault=Number(leftMeta.defaultValue)||0;
  const rightDefault=Number(rightMeta.defaultValue)||0;
  const initialLeft=Number.isFinite(leftValue)?leftValue:leftDefault;
  const initialRight=Number.isFinite(rightValue)?rightValue:rightDefault;
  const initial=(initialLeft+initialRight)/2;
  output.textContent=initial.toFixed(2);

  const input=document.createElement('input');
  input.type='range';
  input.min=String(Math.max(Number(leftMeta.min),Number(rightMeta.min)));
  input.max=String(Math.min(Number(leftMeta.max),Number(rightMeta.max)));
  input.step=String(Math.max(
    0.001,
    (Number(input.max)-Number(input.min))/100
  ));
  input.value=String(initial);
  input.dataset.symmetricModifiers=`${leftMeta.fullName}|${rightMeta.fullName}`;

  const help=document.createElement('div');
  help.className='modifier-help modifier-symmetric-help';
  help.textContent='Controlla insieme lato sinistro e destro';

  row.title=`${leftMeta.fullName}\n${rightMeta.fullName}`;

  const applyValue=value=>requestNativeModifiers({
    [leftMeta.fullName]:Number(value),
    [rightMeta.fullName]:Number(value),
  }).catch(err=>setStatus(err.message,'bad'));

  let timer=null;
  input.addEventListener('input',()=>{
    output.textContent=Number(input.value).toFixed(2);
    clearTimeout(timer);
    timer=setTimeout(()=>applyValue(input.value),85);
  });
  input.addEventListener('change',()=>{
    clearTimeout(timer);
    applyValue(input.value);
  });

  head.append(label,badge,output);
  row.append(head,help,input);

  symmetricModifierControls.push({
    names:[leftMeta.fullName,rightMeta.fullName],
    input,
    output,
  });

  return row;
}

function makeModifierRow(meta) {
  const row=document.createElement('div');
  row.className='modifier-row';

  const head=document.createElement('div');
  head.className='modifier-label';

  const label=document.createElement('b');
  label.textContent=prettyModifierText(meta);

  const output=document.createElement('output');
  const value=Number(nativeModifierValues[meta.fullName]);
  output.textContent=(Number.isFinite(value)?value:Number(meta.defaultValue)||0).toFixed(2);

  const input=document.createElement('input');
  input.type='range';
  input.min=String(meta.min);
  input.max=String(meta.max);
  input.step=String(Math.max(0.001,(Number(meta.max)-Number(meta.min))/100));
  input.value=String(Number.isFinite(value)?value:Number(meta.defaultValue)||0);
  input.dataset.modifier=meta.fullName;

  const raw=document.createElement('div');
  raw.className='modifier-raw';
  raw.hidden=true;
  row.title=meta.fullName;

  let timer=null;
  input.addEventListener('input',()=>{
    output.textContent=Number(input.value).toFixed(2);
    clearTimeout(timer);
    timer=setTimeout(()=>{
      requestNativeModifier(meta.fullName,Number(input.value)).catch(err=>setStatus(err.message,'bad'));
    },85);
  });
  input.addEventListener('change',()=>{
    clearTimeout(timer);
    requestNativeModifier(meta.fullName,Number(input.value)).catch(err=>setStatus(err.message,'bad'));
  });

  head.append(label,output);
  row.append(head,input,raw);
  registerModifierControl(meta.fullName,input,output);
  return row;
}

function renderModifierGroups(container,entries,{emptyText='Nessun modifier.',mergeSides=true}={}) {
  if(!container) return;
  container.innerHTML='';
  const byGroup=new Map();
  for(const meta of entries) {
    const uiGroup=modifierUiGroup(meta);
    const arr=byGroup.get(uiGroup)||[];
    arr.push(meta); byGroup.set(uiGroup,arr);
  }

  if(!entries.length) {
    container.innerHTML=`<div class="modifier-empty">${escapeHtml(emptyText)}</div>`;
    return;
  }

  for(const [group,items] of [...byGroup.entries()].sort((a,b)=>groupTitle(a[0]).localeCompare(groupTitle(b[0]),'it'))) {
    const box=document.createElement('div');
    box.className='modifier-group';

    const uiRows=buildSymmetricModifierRows(items,{mergeSides});

    const h=document.createElement('div');
    h.className='modifier-group-head';
    h.innerHTML=`<span>${escapeHtml(groupTitle(group))}</span><span>${uiRows.length}</span>`;

    const list=document.createElement('div');
    list.className='modifier-list';

    for(const item of uiRows) {
      if(item.type==='symmetric') {
        list.appendChild(makeSymmetricModifierRow(item.left,item.right));
      } else {
        list.appendChild(makeModifierRow(item.meta));
      }
    }

    box.append(h,list);
    container.appendChild(box);
  }
}

function updateModifierSummary(id,entries,label) {
  const el=E(id);
  if(!el) return;
  el.innerHTML=
    `<span class="modifier-pill">${escapeHtml(label)}</span>`+
    `<span class="modifier-pill">${entries.length} slider reali</span>`;
}

function buildNativeModifierUi() {
  modifierControls.clear();
  symmetricModifierControls.length=0;

  const identity=nativeModifierMeta.filter(m=>modifierSection(m)==='identity');
  const face=nativeModifierMeta.filter(m=>modifierSection(m)==='face');
  const body=nativeModifierMeta.filter(m=>modifierSection(m)==='body');

  renderModifierGroups(E('nativeIdentityModifiers'),identity);
  renderModifierGroups(E('nativeFaceModifiers'),face);
  renderModifierGroups(E('nativeBodyModifiers'),body);

  updateModifierSummary('identityModifierSummary',identity,'Macro MakeHuman');
  updateModifierSummary('faceModifierSummary',face,'Volto');
  updateModifierSummary('bodyModifierSummary',body,'Corpo');

  renderNativeSearch('');
  syncModifierControls();

  document.querySelectorAll('[data-gender-value]').forEach(btn=>{
    btn.onclick=()=>requestNativeModifier('macrodetails/Gender',Number(btn.dataset.genderValue))
      .catch(err=>setStatus(err.message,'bad'));
  });
}

function renderNativeSearch(query='') {
  const container=E('nativeSearchResults');
  if(!container) return;
  const q=String(query||'').trim().toLowerCase();

  if(!q) {
    container.innerHTML=`<div class="modifier-empty">Scrivi per cercare tra ${nativeModifierMeta.length} modifier. Nei pannelli normali i controlli destra/sinistra sono uniti; qui restano separati per creare asimmetrie.</div>`;
    return;
  }

  const filtered=nativeModifierMeta.filter(meta=>{
    const hay=`${meta.fullName} ${prettyModifierText(meta)} ${modifierUiGroup(meta)}`.toLowerCase();
    return hay.includes(q);
  }).slice(0,80);

  renderModifierGroups(container,filtered,{
    emptyText:'Nessun modifier corrispondente.',
    mergeSides:false
  });
}

function renderCustomTargetList(query='') {
  const container=E('customTargetList');
  if(!container) return;
  const q=String(query||'').trim().toLowerCase();
  const targetMeta=new Map((uiCatalog?.targets||[]).map(t=>[String(t.id),t]));
  const targets=(customTargets.targets||[]).filter(t=>{
    const meta=targetMeta.get(String(t.id));
    const label=meta?.uiLabel||String(t.id);
    const description=meta?.uiDescription||'';
    const group=meta?.uiGroup||meta?.group||'';
    return !q || `${label} ${description} ${group} ${t.id}`.toLowerCase().includes(q);
  });

  container.innerHTML='';
  if(!targets.length) {
    container.innerHTML='<div class="modifier-empty">Nessun target extra.</div>';
    return;
  }

  for(const target of targets) {
    const id=String(target.id);
    const row=document.createElement('div');
    row.className='custom-target-row';

    const head=document.createElement('div');
    head.className='modifier-label';
    const label=document.createElement('b');
    const meta=targetMeta.get(id);
    label.textContent=meta?.uiLabel||'Forma';
    const output=document.createElement('output');
    output.textContent=Number(customTargetValues[id]||0).toFixed(2);

    const input=document.createElement('input');
    input.type='range'; input.min='0'; input.max='1'; input.step='.01';
    input.value=String(Number(customTargetValues[id]||0));

    let timer=null;
    input.addEventListener('input',()=>{
      customTargetValues[id]=Number(input.value);
      output.textContent=Number(input.value).toFixed(2);
      clearTimeout(timer);
      timer=setTimeout(()=>rebuildAll(true),70);
    });
    input.addEventListener('change',()=>{
      clearTimeout(timer);
      customTargetValues[id]=Number(input.value);
      output.textContent=Number(input.value).toFixed(2);
      rebuildAll(true);
    });

    const raw=document.createElement('div');
    raw.className='modifier-raw';
    raw.textContent=id;

    const help=document.createElement('div');
    help.className='modifier-help';
    help.textContent=meta?.uiDescription||'';

    head.append(label,output);
    row.append(head,help,input,raw);
    container.appendChild(row);
  }
}

function baseProxyUrl(relative) {
  return `../makehuman-editor-v1/data/proxies/${relative}`;
}

function baseSkinUrl(relative) {
  return `../makehuman-editor-v1/data/skins/${relative}`;
}

function parseResourceEntry(raw) {
  const s=String(raw||'').trim().replaceAll('\\','/');
  if(!s) return null;

  const hash=s.indexOf('#');
  const basePath=(hash>=0?s.slice(0,hash):s).split('?')[0];
  const variant=hash>=0?s.slice(hash+1):null;
  const parts=basePath.split('/');
  const category=parts[0]||'unknown';
  const name=parts.at(-2)||parts.at(-1)?.replace(/\.json$/i,'')||basePath;

  return {
    raw:s,
    basePath,
    variant:variant||null,
    category,
    name,
    label:variant?`${name} · ${variant}`:name
  };
}

function selectedEntries() {
  const out=[];
  const byRaw=new Map(resourceEntries.map(e=>[e.raw,e]));

  for(const def of SLOT_DEFS) {
    const select=E(`slot-${def.id}`);
    const raw=select?.value||'';
    if(!raw) continue;

    const parsed=parseResourceEntry(raw);
    if(!parsed) continue;

    const ui=byRaw.get(raw);
    out.push({
      ...parsed,
      slotId:def.id,
      slotLabel:def.label,
      label:ui?.uiLabel||def.label,
      uiGroup:def.uiGroup
    });
  }

  return out;
}
function materialVariantIndex(json, variant) {
  if(!variant) return null;
  const mats=Array.isArray(json.materials)?json.materials:[];
  const needle=String(variant).toLowerCase();

  let idx=mats.findIndex(m =>
    String(m?.DbgName||m?.name||'').toLowerCase()===needle
  );

  if(idx<0) {
    idx=mats.findIndex(m =>
      String(m?.DbgName||m?.name||'').toLowerCase().includes(needle)
    );
  }

  return idx>=0?idx:null;
}

async function loadProxyEntry(entry, bodyVertices) {
  const url=baseProxyUrl(entry.basePath);
  const json=await fetchJsonCached(url,`${entry.slotLabel}: ${entry.name}`);
  const fit=fitProxy(json,bodyVertices);
  const del=deleteMask(json,bodyVertices.length/3);
  const variantIndex=materialVariantIndex(json,entry.variant);

  return {
    entry,
    url,
    json,
    fit,
    del,
    variantIndex
  };
}

function characterBounds() {
  const objs=[bodyMesh,...activeProxyMeshes].filter(Boolean);
  if(!objs.length) return null;
  const box=new THREE.Box3();
  for(const o of objs) box.expandByObject(o);
  return {box,center:box.getCenter(new THREE.Vector3()),size:box.getSize(new THREE.Vector3())};
}

function applyVisualCenter() {
  if(!camera) return;
  camera.clearViewOffset?.();
  if(previewMode) {
    camera.updateProjectionMatrix();
    return;
  }

  const sidebar=E('editorSidebar');
  if(!sidebar) return;
  const rect=sidebar.getBoundingClientRect();
  if(!rect.width || rect.left<=0) return;

  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
  const freeLeft=0;
  const freeRight=Math.max(1,Math.min(w,rect.left));
  const freeCenter=(freeLeft+freeRight)/2;
  const screenCenter=w/2;
  const shift=Math.max(0,screenCenter-freeCenter);

  // Three.js viewOffset sposta il frustum usando la larghezza reale della UI.
  // Nessun pixel hardcoded per "centrare a occhio" il personaggio.
  camera.setViewOffset(w,h,shift,0,w,h);
  camera.updateProjectionMatrix();
}

function cameraDestination(view='full') {
  const b=characterBounds();
  if(!b) return null;
  const {box,center,size}=b;
  const max=Math.max(size.x,size.y,size.z,0.001);
  const fullDistance=max*1.77;
  const fullTarget=new THREE.Vector3(center.x,box.min.y+size.y*0.50,center.z);
  const faceTarget=new THREE.Vector3(center.x,box.min.y+size.y*0.84,center.z);

  let target=fullTarget;
  let distance=fullDistance;
  let position;

  if(view==='face') {
    target=faceTarget;
    distance=max*0.72;
    position=new THREE.Vector3(target.x,target.y,target.z+distance);
  } else if(view==='profile') {
    target=fullTarget;
    distance=fullDistance;
    position=new THREE.Vector3(target.x+distance,target.y,target.z);
  } else {
    position=new THREE.Vector3(target.x,target.y,target.z+distance);
  }

  const minFactor=view==='face'?0.72:0.73;
  const maxFactor=view==='face'?1.38:1.035;

  return {
    view,
    target,
    position,
    minDistance:distance*minFactor,
    maxDistance:distance*maxFactor,
    near:Math.max(.01,max/1000),
    far:Math.max(200,max*10)
  };
}


/* ADF_MAKEHUMAN_ZOOM_DAMPING_V4 · helpers */
const WHEEL_ZOOM_TARGET_GAIN=0.00082;
const WHEEL_ZOOM_MAX_TARGET_STEP=0.11;
const WHEEL_ZOOM_SMOOTH_TIME=0.24;
const WHEEL_ZOOM_MAX_SPEED=4.5;
const WHEEL_ZOOM_EPSILON=0.0008;

function clamp01(v){ return Math.max(0,Math.min(1,Number(v)||0)); }

function smootherStep(v){
  const t=clamp01(v);
  return t*t*t*(t*(t*6-15)+10);
}

function resetWheelZoomBridge(){
  wheelZoomBridgeOriginView=null;
  wheelZoomBridgeProgress=0;
  wheelZoomBridgeTarget=0;
  wheelZoomBridgeVelocity=0;
  wheelZoomBridgeLastTime=0;
  wheelZoomBridgeActive=false;
}

function wheelTargetStep(deltaY){
  const raw=Math.abs(Number(deltaY)||0)*WHEEL_ZOOM_TARGET_GAIN;
  return Math.min(WHEEL_ZOOM_MAX_TARGET_STEP,Math.max(0.006,raw));
}

function cameraBridgeOriginDestination(originView){
  const b=characterBounds();
  if(!b) return null;

  const base=cameraDestination(originView);
  if(!base) return null;

  const {size}=b;
  const max=Math.max(size.x,size.y,size.z,0.001);
  const distance=max*1.30;
  const target=base.target.clone();
  const position=originView==='profile'
    ? new THREE.Vector3(target.x+distance,target.y,target.z)
    : new THREE.Vector3(target.x,target.y,target.z+distance);

  return {
    ...base,
    target,
    position
  };
}

function cameraBridgePose(originView,progress){
  const from=cameraBridgeOriginDestination(originView);
  const face=cameraDestination('face');
  if(!from || !face) return null;

  const t=smootherStep(progress);
  const target=from.target.clone().lerp(face.target,t);

  const fromOffset=from.position.clone().sub(from.target);
  const faceOffset=face.position.clone().sub(face.target);
  const distance=THREE.MathUtils.lerp(fromOffset.length(),faceOffset.length(),t);

  /* Profilo -> Volto: rotazione progressiva sul piano orizzontale.
     Intero -> Volto: l'angolo resta frontale. */
  const fromAngle=Math.atan2(fromOffset.x,fromOffset.z);
  const faceAngle=Math.atan2(faceOffset.x,faceOffset.z);
  const angle=THREE.MathUtils.lerp(fromAngle,faceAngle,t);

  const offset=new THREE.Vector3(
    Math.sin(angle)*distance,
    0,
    Math.cos(angle)*distance
  );

  return {
    position:target.clone().add(offset),
    target,
    near:THREE.MathUtils.lerp(from.near,face.near,t),
    far:THREE.MathUtils.lerp(from.far,face.far,t)
  };
}

/* SmoothDamp scalare criticamente smorzato.
   Restituisce valore + velocità, così l'inversione di direzione conserva
   l'inerzia residua invece di ripartire da zero. */
function smoothDampScalar(current,target,currentVelocity,smoothTime,maxSpeed,deltaTime){
  smoothTime=Math.max(0.0001,smoothTime);
  deltaTime=Math.max(0,Math.min(0.05,deltaTime));

  const omega=2/smoothTime;
  const x=omega*deltaTime;
  const exp=1/(1+x+0.48*x*x+0.235*x*x*x);

  let change=current-target;
  const originalTarget=target;
  const maxChange=Math.max(0,maxSpeed)*smoothTime;
  change=Math.max(-maxChange,Math.min(maxChange,change));
  target=current-change;

  const temp=(currentVelocity+omega*change)*deltaTime;
  let velocity=(currentVelocity-omega*temp)*exp;
  let output=target+(change+temp)*exp;

  /* Evita overshoot agli estremi. */
  if((originalTarget-current>0)===(output>originalTarget)){
    output=originalTarget;
    velocity=deltaTime>0?(output-originalTarget)/deltaTime:0;
  }

  return {value:output,velocity};
}

function beginWheelZoomBridge(originView,startProgress){
  const origin=(originView==='profile')?'profile':'full';
  wheelZoomBridgeOriginView=origin;
  lastNonFaceCameraView=origin;
  wheelZoomBridgeProgress=clamp01(startProgress);
  wheelZoomBridgeTarget=wheelZoomBridgeProgress;
  wheelZoomBridgeVelocity=0;
  wheelZoomBridgeLastTime=performance.now();
  wheelZoomBridgeActive=true;
  cancelCameraTransition();
  applyVisualCenter();
}

function updateWheelZoomDamping(time){
  if(!wheelZoomBridgeActive || !wheelZoomBridgeOriginView) return;

  const now=Number(time)||performance.now();
  const dt=wheelZoomBridgeLastTime
    ? Math.max(0.001,Math.min(0.05,(now-wheelZoomBridgeLastTime)/1000))
    : 1/60;
  wheelZoomBridgeLastTime=now;

  const next=smoothDampScalar(
    wheelZoomBridgeProgress,
    wheelZoomBridgeTarget,
    wheelZoomBridgeVelocity,
    WHEEL_ZOOM_SMOOTH_TIME,
    WHEEL_ZOOM_MAX_SPEED,
    dt
  );

  wheelZoomBridgeProgress=clamp01(next.value);
  wheelZoomBridgeVelocity=next.velocity;

  const pose=cameraBridgePose(wheelZoomBridgeOriginView,wheelZoomBridgeProgress);
  if(!pose) {
    resetWheelZoomBridge();
    return;
  }

  camera.near=pose.near;
  camera.far=pose.far;
  camera.position.copy(pose.position);
  controls.target.copy(pose.target);
  camera.updateProjectionMatrix();

  /* Il bottone segue ciò che l'utente sta realmente vedendo, non il target
     futuro impartito dalla rotellina. */
  currentCameraView=wheelZoomBridgeProgress>=0.68
    ? 'face'
    : wheelZoomBridgeOriginView;
  updateCameraViewButtons();

  const settled=
    Math.abs(wheelZoomBridgeProgress-wheelZoomBridgeTarget)<WHEEL_ZOOM_EPSILON &&
    Math.abs(wheelZoomBridgeVelocity)<0.004;

  if(!settled) return;

  wheelZoomBridgeProgress=wheelZoomBridgeTarget;
  wheelZoomBridgeVelocity=0;

  if(wheelZoomBridgeTarget>=1-WHEEL_ZOOM_EPSILON){
    const face=cameraDestination('face');
    if(face){
      wheelZoomBridgeProgress=1;
      currentCameraView='face';
      cameraZoomLimits={min:face.minDistance,max:face.maxDistance};
      camera.position.copy(face.position);
      controls.target.copy(face.target);
      camera.near=face.near;
      camera.far=face.far;
      camera.updateProjectionMatrix();
      updateCameraViewButtons();
    }
    /* Conserviamo originView per poter tornare indietro con la rotellina. */
    wheelZoomBridgeActive=false;
    wheelZoomBridgeLastTime=0;
    return;
  }

  if(wheelZoomBridgeTarget<=WHEEL_ZOOM_EPSILON){
    const originView=wheelZoomBridgeOriginView;
    const originDefault=cameraDestination(originView);
    const bridgeOrigin=cameraBridgeOriginDestination(originView);

    if(originDefault && bridgeOrigin){
      currentCameraView=originView;
      lastNonFaceCameraView=originView;
      cameraZoomLimits={
        min:originDefault.minDistance,
        max:originDefault.maxDistance
      };
      camera.position.copy(bridgeOrigin.position);
      controls.target.copy(bridgeOrigin.target);
      camera.near=bridgeOrigin.near;
      camera.far=bridgeOrigin.far;
      camera.updateProjectionMatrix();
      updateCameraViewButtons();
    }
    resetWheelZoomBridge();
  }
}

function updateCameraViewButtons() {
  document.querySelectorAll('[data-camera-view]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.cameraView===currentCameraView);
  });
}

function setCameraView(view='full',{smooth=true}={}) {
  if(view==='full' || view==='profile') lastNonFaceCameraView=view;
  resetWheelZoomBridge();
  const dest=cameraDestination(view);
  if(!dest) return;
  currentCameraView=view;
  cameraZoomLimits={min:dest.minDistance,max:dest.maxDistance};
  camera.near=dest.near;
  camera.far=dest.far;
  applyVisualCenter();

  if(!smooth) {
    cameraTransition=null;
    camera.position.copy(dest.position);
    controls.target.copy(dest.target);
    camera.updateProjectionMatrix();
    controls.update();
    updateCameraViewButtons();
    return;
  }

  cameraTransition={
    startedAt:performance.now(),
    duration:420,
    fromPosition:camera.position.clone(),
    fromTarget:controls.target.clone(),
    toPosition:dest.position.clone(),
    toTarget:dest.target.clone()
  };
  updateCameraViewButtons();
}

function updateCameraTransition(time=performance.now()) {
  if(!cameraTransition) return;
  const t=Math.min(1,Math.max(0,(time-cameraTransition.startedAt)/cameraTransition.duration));
  const eased=1-Math.pow(1-t,3);
  camera.position.lerpVectors(cameraTransition.fromPosition,cameraTransition.toPosition,eased);
  controls.target.lerpVectors(cameraTransition.fromTarget,cameraTransition.toTarget,eased);
  if(t>=1) cameraTransition=null;
}

function fitScene() {
  setCameraView(currentCameraView||'full',{smooth:false});
}

function syncVisibility() {
  if(bodyMesh) bodyMesh.visible=E('showBody').checked;
  for(const m of activeProxyMeshes) m.visible=E('showProxies').checked;
}


async function rebuildAll(refit=true) {
  const id=++rebuildId;

  try {
    const entries=selectedEntries();
    setStatus(`Carico personaggio completo…\nProxy attivi: ${entries.length}`);

    const bodyBase=nativeMorphedBody
      ? new Float32Array(nativeMorphedBody)
      : scaledVertices(bodyJson);
    const morphedBody=applyCustomTargetStack(bodyBase);

    const loaded=[];
    for(let i=0;i<entries.length;i++) {
      const entry=entries[i];
      setStatus(
        `Carico personaggio completo…\n`+
        `${i+1}/${entries.length} — ${entry.slotLabel}: ${entry.label}`
      );
      loaded.push(await loadProxyEntry(entry,morphedBody));
    }

    if(id!==rebuildId) return;

    let invalidRefs=0;
    let invalidRows=0;
    for(const item of loaded) {
      invalidRefs+=item.fit.invalidRefs;
      invalidRows+=item.fit.invalidRows;
    }

    // Clothes masking EXACT MakeHuman semantics:
    // only clothes participate, stacked by (z_depth, uuid), top -> bottom.
    const clothesMasks=buildClothesMasksMakeHuman(
      loaded,
      morphedBody.length/3,
      E('applyMask').checked
    );

    const bodyBuilt=geometryFromLegacy(bodyJson,morphedBody,{
      skipFace:E('applyMask').checked
        ? vi=>faceHiddenByVertexVisibility(vi,clothesMasks.bodyVisible)
        : null,
      smoothBySourceVertex:true
    });

    const nextBodyMaterials=await materialsFromJson(bodyJson,URLS.body,'body');

    if(currentSkin) {
      const skinUrl=baseSkinUrl(currentSkin);
      const skinDef=await fetchJsonCached(skinUrl,'Skin MakeHuman');
      const skinMat=await materialFromDef(skinDef,skinUrl,'skin');

      // MakeHuman setSkin(): only body material[0].
      if(nextBodyMaterials.length) {
        nextBodyMaterials[0]?.dispose?.();
        nextBodyMaterials[0]=skinMat;
      } else {
        nextBodyMaterials.push(skinMat);
      }
    }

    const nextBodyMesh=new THREE.Mesh(bodyBuilt.geometry,nextBodyMaterials);
    applyMakeHumanMeshFlags(nextBodyMesh,bodyJson);

    const nextProxyMeshes=[];
    const proxyLines=[];

    for(const item of loaded) {
      const cat=item.entry.category;
      const proxyVisible=
        cat==='clothes'
          ? clothesMasks.proxyVisibleByItem.get(item)
          : null;

      const built=geometryFromLegacy(
        item.json,
        item.fit.vertices,
        {
          forceMaterialIndex:item.variantIndex,
          skipFace:E('applyMask').checked && proxyVisible
            ? vi=>faceHiddenByVertexVisibility(vi,proxyVisible)
            : null
        }
      );

      const mats=await materialsFromJson(item.json,item.url,cat);
      applyAppearanceColorToMaterials(mats,item.entry.uiGroup);
      const mesh=new THREE.Mesh(built.geometry,mats);

      applyMakeHumanMeshFlags(mesh,item.json);

      mesh.renderOrder=proxyZDepthMakeHuman(item);
      mesh.userData.category=cat;
      mesh.userData.slotId=item.entry.slotId;
      mesh.userData.label=item.entry.label;
      mesh.userData.zDepth=proxyZDepthMakeHuman(item);
      mesh.userData.uuid=proxyUuidMakeHuman(item);

      nextProxyMeshes.push(mesh);

      const hiddenLayerFaces=built.skippedFaces||0;
      const transparentMats=mats.filter(m=>m.userData?.mhTransparent).length;
      const a2cMats=mats.filter(m=>m.userData?.mhTransparent && m.userData?.mhAlphaToCoverage).length;
      const blendMats=mats.filter(m=>m.transparent).length;
      const alphaTestMats=mats.filter(m=>Number(m.alphaTest)>0).length;

      proxyLines.push(
        `${item.entry.slotLabel}: ${item.entry.label} | `+
        `z=${proxyZDepthMakeHuman(item)} | `+
        `fit=${item.fit.fitted?'SI':'NO'} | `+
        `refs=${item.fit.invalidRefs} | rows=${item.fit.invalidRows} | `+
        `delete=${item.del.count} | layerHiddenFaces=${hiddenLayerFaces} | `+
        `MH transparent=${transparentMats}/${mats.length} | `+
        `A2C=${a2cMats} | blend=${blendMats} | alphaTest>0=${alphaTestMats}`
      );
    }

    if(id!==rebuildId) {
      disposeMesh(nextBodyMesh);
      for(const m of nextProxyMeshes) disposeMesh(m);
      return;
    }

    disposeMesh(bodyMesh);
    for(const m of activeProxyMeshes) disposeMesh(m);

    bodyMesh=nextBodyMesh;
    bodyMaterials=nextBodyMaterials;
    activeProxyMeshes=nextProxyMeshes;

    scene.add(bodyMesh);
    for(const m of activeProxyMeshes) scene.add(m);

    syncVisibility();

    if(refit) fitScene();

    const hiddenHelpers=bodyMaterials.filter(m=>m.visible===false).length;
    const clothesOrder=clothesMasks.ordered
      .map(i=>`${proxyZDepthMakeHuman(i)}:${i.entry.label}`)
      .join(' > ') || 'nessun clothes';

    setStatus([
      `PERSONAGGIO COMPLETO: ${activeProxyMeshes.length} proxy simultanei`,
      `SKIN: ${currentSkin||'default'}`,
      `CONTROLLI: ${nativeModifierMeta.length} | forme extra attive: ${activeCustomTargetCount()}`,
      `CLOTHES MASK MakeHuman: ${clothesMasks.hiddenBodyVertices} body verts nascosti | ${bodyBuilt.skippedFaces}/${bodyBuilt.originalFaces} body faces`,
      `CLOTHES ORDER top→bottom: ${clothesOrder}`,
      `FIT totale: invalidRefs=${invalidRefs} | invalidRows=${invalidRows}`,
      `COLORI: capelli=${appearanceColorState.hair.enabled?appearanceColorState.hair.color:'originale'} | occhi=${appearanceColorState.eyes.enabled?appearanceColorState.eyes.color:'originale'} | sopracciglia=${appearanceColorState.eyebrows.enabled?appearanceColorState.eyebrows.color:'originale'}`,
      `helper/joint body nascosti: ${hiddenHelpers}`,
      '',
      ...proxyLines,
      '',
      'Renderer: Three.js 0.179.1',
      'Materiali: guidati dai metadata MakeHuman (no regole per categoria)',
      'TMatrix: MakeHuman scale + affine shear',
      'Clothes: MakeHuman z_depth + transferVertexMaskToProxy + deleteVerts'
    ],invalidRefs||invalidRows?'warn':'ok');

  } catch(err) {
    console.error(err);
    setStatus(`ERRORE CAMERINO V2.11\n${err.message}`,'bad');
  }
}

function buildResourceCatalog() {
  assetByPath=new Map(
    (audit?.assets||[]).map(a=>[String(a.relativePath).replaceAll('\\','/'),a])
  );

  resourceEntries=(uiCatalog?.assets||[])
    .filter(item=>{
      const audited=assetByPath.get(item.basePath);
      return Boolean(audited?.parseOk && audited?.hasGeometry);
    })
    .map(item=>({
      raw:item.raw,
      basePath:item.basePath,
      variant:item.variant||null,
      category:item.nativeCategory,
      nativeCategory:item.nativeCategory,
      uiGroup:item.group,
      section:item.section,
      label:item.uiLabel,
      uiLabel:item.uiLabel,
      originalName:item.originalName,
      confidence:item.confidence,
      uiDescription:item.uiDescription||''
    }));
}

function entriesForUiGroup(uiGroup) {
  return resourceEntries.filter(e=>e.uiGroup===uiGroup);
}

function wardrobeSlotDef(slotId) {
  return SLOT_DEFS.find(def=>def.id===slotId)||null;
}

function wardrobeSlotLabel(slotId) {
  return wardrobeSlotDef(slotId)?.label||slotId;
}

function wardrobeRuleForRaw(raw,slotId) {
  const manual=uiOverrides?.assets?.[String(raw||'')];
  return manual?.wardrobe||{};
}

function wardrobeItemFor(slotId,raw) {
  if(!WARDROBE_SLOT_SET.has(slotId) || !raw) return null;
  return createWardrobeItem(slotId,raw,wardrobeRuleForRaw(raw,slotId));
}

function currentWardrobeItems({excludeSlotId=''}={}) {
  const items=[];
  for(const slotId of WARDROBE_SLOT_IDS) {
    if(slotId===excludeSlotId) continue;
    const select=E(`slot-${slotId}`);
    const raw=select?.value||'';
    const item=wardrobeItemFor(slotId,raw);
    if(item) items.push(item);
  }
  return items;
}

function showWardrobeNotice(message,{bad=false}={}) {
  const box=E('wardrobeConflictNotice');
  if(!box) return;
  clearTimeout(wardrobeNoticeTimer);

  if(!message) {
    box.hidden=true;
    box.textContent='';
    box.classList.remove('bad');
    return;
  }

  box.hidden=false;
  box.textContent=message;
  box.classList.toggle('bad',!!bad);
  wardrobeNoticeTimer=setTimeout(()=>{
    box.hidden=true;
    box.textContent='';
    box.classList.remove('bad');
  },3200);
}

function canEquip(slotId,raw,{equippedItems=null}={}) {
  if(!WARDROBE_SLOT_SET.has(slotId)) {
    return {ok:false,reason:`Slot guardaroba sconosciuto: ${slotId}`,conflicts:[]};
  }

  if(!raw) return {ok:true,reason:'',conflicts:[]};

  const select=E(`slot-${slotId}`);
  if(!select || ![...select.options].some(option=>option.value===raw)) {
    return {ok:false,reason:`Asset non disponibile nello slot ${wardrobeSlotLabel(slotId)}.`,conflicts:[]};
  }

  const candidate=wardrobeItemFor(slotId,raw);
  return canEquipCandidate(
    candidate,
    equippedItems||currentWardrobeItems({excludeSlotId:slotId})
  );
}

function resolveConflicts(slotId,raw,{apply=true,equippedItems=null}={}) {
  if(!raw) return {ok:true,reason:'',conflicts:[],clearSlots:[]};

  const candidate=wardrobeItemFor(slotId,raw);
  const result=resolveWardrobeConflicts(
    candidate,
    equippedItems||currentWardrobeItems({excludeSlotId:slotId})
  );

  if(apply && result.ok) {
    for(const conflictSlot of result.clearSlots) {
      const select=E(`slot-${conflictSlot}`);
      if(select) select.value='';
    }
  }

  return result;
}

async function equip(slotId,raw,{rebuild=true,notify=true}={}) {
  const select=E(`slot-${slotId}`);
  if(!select) return {ok:false,reason:`Select mancante: ${slotId}`,conflicts:[]};

  raw=String(raw||'');
  if(!raw) {
    select.value='';
    if(rebuild) await rebuildAll(false);
    return {ok:true,reason:'',conflicts:[]};
  }

  const check=canEquip(slotId,raw);
  if(!check.ok) {
    if(notify) showWardrobeNotice(check.reason,{bad:true});
    return check;
  }

  const resolution=resolveConflicts(slotId,raw,{apply:true});
  select.value=raw;

  if(notify && resolution.clearSlots.length) {
    const removed=resolution.clearSlots.map(wardrobeSlotLabel);
    const label=resourceEntries.find(entry=>entry.raw===raw)?.uiLabel||wardrobeSlotLabel(slotId);
    showWardrobeNotice(`${label}: sostituisce ${removed.join(', ')}.`);
  }

  if(rebuild) await rebuildAll(false);
  return resolution;
}

function normalizedWardrobeState(slots) {
  return normalizeWardrobeSelections(
    slots||{},
    (raw,slotId)=>wardrobeRuleForRaw(raw,slotId)
  );
}

function applyWardrobeSelections(slots,{notify=false}={}) {
  const normalized=normalizedWardrobeState(slots);

  for(const slotId of WARDROBE_SLOT_IDS) {
    const select=E(`slot-${slotId}`);
    if(!select) continue;

    const raw=normalized.slots[slotId]||'';
    select.value=[...select.options].some(option=>option.value===raw)?raw:'';
  }

  if(notify && normalized.dropped.length) {
    const removed=normalized.dropped.map(item=>wardrobeSlotLabel(item.slotId));
    showWardrobeNotice(`Combinazioni incompatibili rimosse: ${removed.join(', ')}.`);
  }

  return normalized;
}

window.adfMakeHumanWardrobe={
  equip,
  canEquip,
  resolveConflicts,
  snapshot:()=>Object.fromEntries(
    WARDROBE_SLOT_IDS.map(id=>[id,E(`slot-${id}`)?.value||''])
  )
};

function choosePreferred(def, entries) {
  if(def.defaultNone) return '';
  if(def.uiGroup==='eyes') {
    const exact=entries.find(e=>e.raw===DEFAULT_EYES_RAW);
    if(exact) return exact.raw;
  }
  return entries[0]?.raw||'';
}

function populateSlots() {
  for(const def of SLOT_DEFS) {
    const select=E(`slot-${def.id}`);
    if(!select) continue;

    const entries=entriesForUiGroup(def.uiGroup);

    select.innerHTML=
      `<option value="">— nessuno —</option>`+
      entries.map(e=>
        `<option value="${escapeHtmlAttr(e.raw)}" title="${escapeHtmlAttr(e.uiDescription||e.originalName||'')}">${escapeHtml(e.uiLabel)}</option>`
      ).join('');

    select.value=choosePreferred(def,entries);

    if(def.id==='clothesOther') {
      const slot=select.closest('.slot');
      if(slot) slot.hidden=entries.length===0;
    }

    if(WARDROBE_SLOT_SET.has(def.id)) {
      select.addEventListener('change',()=>{
        equip(def.id,select.value,{rebuild:true,notify:true})
          .catch(err=>setStatus(err.message,'bad'));
      });
    } else {
      select.addEventListener('change',()=>rebuildAll(false));
    }
  }
}
function escapeHtml(value) {
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;');
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replaceAll("'","&#39;");
}

function populateSkinAndTargets() {
  const uiSkins=uiCatalog?.skins||[];
  const familyOrder=['Base','Giovani','Adulti','Anziani','Speciali','Altre'];
  const families=new Map();

  for(const skin of uiSkins){
    const family=skin.uiFamily||'Altre';
    if(!families.has(family)) families.set(family,[]);
    families.get(family).push(skin);
  }

  skinSelect.innerHTML='<option value="">Pelle base</option>';
  for(const family of familyOrder){
    const list=families.get(family);
    if(!list?.length) continue;
    const group=document.createElement('optgroup');
    group.label=family;
    for(const s of list){
      const option=document.createElement('option');
      option.value=s.relativePath;
      option.textContent=s.uiLabel;
      option.title=s.uiDescription||'';
      group.appendChild(option);
    }
    skinSelect.appendChild(group);
  }

  if(resources.defaultSkin) {
    const match=uiSkins.find(s=>s.relativePath===resources.defaultSkin);
    if(match) {
      skinSelect.value=match.relativePath;
      currentSkin=match.relativePath;
    }
  }
  updateSkinDescription();

  const targetLabels=new Map(
    (uiCatalog?.targets||[]).map(t=>[String(t.id),t.uiLabel])
  );

  allTargetOptions=(customTargets.targets||[]).map(t=>({
    id:String(t.id),
    label:targetLabels.get(String(t.id)) || 'Forma'
  }));

  targetSelect.innerHTML=
    `<option value="">Nessuna modifica</option>`+
    allTargetOptions
      .map(t=>`<option value="${escapeHtmlAttr(t.id)}">${escapeHtml(t.label)}</option>`)
      .join('');
}
function showAudit() {
  const s=audit?.summary||{};
  const unsupported=Object.entries(audit?.unsupportedMaterialMaps||{})
    .map(([k,v])=>`${k}:${v}`)
    .join(' · ')||'nessuna';

  auditEl.textContent=[
    `Proxy: ${s.proxyJsonFiles??0} | fitting KO: ${s.proxyFittingFailures??0} | tmatrix KO: ${s.tmatrixFailures??0}`,
    `Skin: ${s.skinJsonFiles??0} | target: ${s.customTargets??0} | target KO: ${s.targetFailures??0}`,
    `Texture refs: ${s.textureReferences??0} | MANCANTI: ${s.missingTextureReferences??0} | vuote: ${s.zeroByteTextures??0}`,
    `Resources rotte: ${s.brokenResourceEntries??0} | errori: ${s.errors??0} | warning: ${s.warnings??0}`,
    `UI catalogo: ${(uiCatalog?.summary?.proxyEntries??0)} asset | riclassificati ADF: ${(uiCatalog?.summary?.adfRecategorized??0)} | altro residuo: ${(uiCatalog?.summary?.adfRemainingOther??0)}`,
    (()=>{const n=uiCatalog?.summary?.adfUiNameAudit; return n ? `Nomi UI: ${n.total} controllati | problemi: ${n.issues} | ${n.pass?'PASS':'FAIL'}` : 'Nomi UI: audit non ancora disponibile';})(),
    `Mappe non ancora rese: ${unsupported}`
  ].join('\n');

  auditEl.className='audit '+(
    (s.proxyFittingFailures||s.tmatrixFailures||s.targetFailures||s.brokenResourceEntries)
      ?'warn':'ok'
  );
}


function uiAssetForRaw(raw) {
  return (uiCatalog?.assets||[]).find(a=>a.raw===raw)||null;
}

function bodyBoundsFromVertices(vertices) {
  const box=new THREE.Box3();
  const v=new THREE.Vector3();

  for(let i=0;i<vertices.length;i+=3) {
    v.set(vertices[i],vertices[i+1],vertices[i+2]);
    box.expandByPoint(v);
  }

  return box;
}

function hairPositionCheck(proxyBox, bodyBox) {
  if(!proxyBox || proxyBox.isEmpty() || !bodyBox || bodyBox.isEmpty()) {
    return {ok:false, reason:'bounding box non valida'};
  }

  const bodySize=bodyBox.getSize(new THREE.Vector3());
  const bodyCenter=bodyBox.getCenter(new THREE.Vector3());
  const hairCenter=proxyBox.getCenter(new THREE.Vector3());

  const h=Math.max(bodySize.y,1e-6);
  const headFloor=bodyBox.max.y-h*.34;
  const maxHorizontalDistance=h*.28;

  const dx=Math.abs(hairCenter.x-bodyCenter.x);
  const dz=Math.abs(hairCenter.z-bodyCenter.z);

  const overlapsHeadHeight=proxyBox.max.y>=headFloor;
  const nearHeadAxis=dx<=maxHorizontalDistance && dz<=maxHorizontalDistance;

  return {
    ok:Boolean(overlapsHeadHeight && nearHeadAxis),
    reason:!overlapsHeadHeight
      ? 'mesh troppo bassa rispetto alla testa'
      : !nearHeadAxis
        ? 'mesh lontana dall’asse della testa'
        : 'ok'
  };
}

function getVisualQaRenderer() {
  if(visualQaRenderer) return visualQaRenderer;

  const canvas=document.createElement('canvas');
  canvas.width=VISUAL_QA_SIZE;
  canvas.height=VISUAL_QA_SIZE;

  // Dedicated default framebuffer:
  // readPixels() on the default framebuffer avoids relying on multisampled
  // WebGLRenderTarget resolve/readback behavior.
  visualQaRenderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:false,
    preserveDrawingBuffer:true,
    powerPreference:'high-performance'
  });

  visualQaRenderer.setPixelRatio(1);
  visualQaRenderer.setSize(VISUAL_QA_SIZE,VISUAL_QA_SIZE,false);
  visualQaRenderer.outputColorSpace=THREE.SRGBColorSpace;
  visualQaRenderer.toneMapping=THREE.ACESFilmicToneMapping;
  visualQaRenderer.toneMappingExposure=1.05;
  visualQaRenderer.autoClear=true;

  return visualQaRenderer;
}

function readVisualQaFramebuffer(qaRenderer) {
  const gl=qaRenderer.getContext();
  const out=new Uint8Array(VISUAL_QA_SIZE*VISUAL_QA_SIZE*4);

  // readPixels is synchronous with respect to framebuffer contents.
  // finish() is intentionally explicit here because this is a QA path,
  // not the gameplay render loop.
  gl.finish();
  gl.readPixels(
    0,0,VISUAL_QA_SIZE,VISUAL_QA_SIZE,
    gl.RGBA,gl.UNSIGNED_BYTE,out
  );

  const error=gl.getError();
  if(error!==gl.NO_ERROR) {
    throw new Error(`Visual QA WebGL readPixels error: 0x${error.toString(16)}`);
  }

  return out;
}

function compareRenderBuffers(before,after) {
  let pixels=0;
  let weightedDelta=0;
  const total=after.length/4;

  for(let i=0;i<after.length;i+=4) {
    const dr=Math.abs(after[i]-before[i]);
    const dg=Math.abs(after[i+1]-before[i+1]);
    const db=Math.abs(after[i+2]-before[i+2]);
    const delta=dr+dg+db;

    if(delta>=18) {
      pixels++;
      weightedDelta+=delta;
    }
  }

  return {
    pixels,
    ratio:total?pixels/total:0,
    meanDelta:pixels?weightedDelta/pixels:0
  };
}

function auditCameraForBox(box,back=false) {
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z,.01);

  const cam=new THREE.PerspectiveCamera(35,1,.001,Math.max(20,maxDim*20));
  const fovRad=THREE.MathUtils.degToRad(cam.fov);
  const visibleDim=Math.max(size.x,size.y,.01);
  const dist=(visibleDim*.5)/Math.tan(fovRad*.5)*1.35 + size.z*.5 + .05;

  cam.position.set(center.x,center.y,center.z+(back?-dist:dist));
  cam.up.set(0,1,0);
  cam.lookAt(center);
  cam.updateProjectionMatrix();

  return cam;
}

function createAuditScene() {
  const s=new THREE.Scene();

  // Deliberately vivid diagnostic background: reduces false "same pixel"
  // matches against dark/black assets.
  s.background=new THREE.Color(0xd11b87);

  const hemi=new THREE.HemisphereLight(0xffffff,0x707070,2.4);
  s.add(hemi);

  const key=new THREE.DirectionalLight(0xffffff,3.2);
  key.position.set(2,5,6);
  s.add(key);

  const fill=new THREE.DirectionalLight(0xffffff,1.3);
  fill.position.set(-4,2,-5);
  s.add(fill);

  return s;
}

function renderCoverageForMesh(mesh,{overrideMaterial=null}={}) {
  const geometry=mesh?.geometry;
  if(!geometry) {
    return {front:{pixels:0,ratio:0,meanDelta:0},back:{pixels:0,ratio:0,meanDelta:0}};
  }

  geometry.computeBoundingBox();
  const box=geometry.boundingBox?.clone();

  if(!box || box.isEmpty()) {
    return {front:{pixels:0,ratio:0,meanDelta:0},back:{pixels:0,ratio:0,meanDelta:0}};
  }

  const qaRenderer=getVisualQaRenderer();
  const result={};

  for(const [name,back] of [['front',false],['back',true]]) {
    const auditScene=createAuditScene();
    const cam=auditCameraForBox(box,back);

    qaRenderer.render(auditScene,cam);
    const before=readVisualQaFramebuffer(qaRenderer);

    const material=overrideMaterial || mesh.material;
    const clone=new THREE.Mesh(mesh.geometry,material);
    clone.frustumCulled=false;
    auditScene.add(clone);

    qaRenderer.render(auditScene,cam);
    const after=readVisualQaFramebuffer(qaRenderer);

    result[name]=compareRenderBuffers(before,after);
    auditScene.remove(clone);
  }

  return result;
}

function bestCoverage(result) {
  if(!result) return {pixels:0,ratio:0,meanDelta:0};
  return result.front?.ratio>=result.back?.ratio
    ? result.front
    : result.back;
}

function runVisualQaSelfTest() {
  const qaRenderer=getVisualQaRenderer();

  const geometry=new THREE.BoxGeometry(1,1,1);
  const material=new THREE.MeshBasicMaterial({
    color:0xffffff,
    side:THREE.DoubleSide
  });
  const mesh=new THREE.Mesh(geometry,material);

  try {
    const coverage=renderCoverageForMesh(mesh);
    const best=bestCoverage(coverage);

    visualQaSelfTest={
      ok:best.pixels>=100 && best.ratio>=0.002,
      pixels:best.pixels,
      ratio:best.ratio,
      coverage
    };

    return visualQaSelfTest;
  } finally {
    geometry.dispose();
    material.dispose();
  }
}

function classifyRenderedCoverage({
  fitOk,
  triangles,
  materialPixels,
  materialRatio,
  solidPixels,
  solidRatio,
  positionOk=true
}) {
  if(!fitOk) return {status:'FAIL',reason:'fitting non valido'};
  if(!Number.isFinite(triangles)||triangles<=0) {
    return {status:'FAIL',reason:'nessun triangolo renderizzabile'};
  }

  // If even a forced opaque white material cannot be seen, this is geometry /
  // camera / renderer, not a MakeHuman-material failure.
  if(!Number.isFinite(solidPixels)||solidPixels<24||!Number.isFinite(solidRatio)||solidRatio<0.0004) {
    return {status:'ENGINE',reason:'controllo geometria/renderer non valido'};
  }

  // Geometry renders, original MakeHuman material does not.
  if(!Number.isFinite(materialPixels)||materialPixels<24||
     !Number.isFinite(materialRatio)||materialRatio<0.0004) {
    return {status:'FAIL',reason:'geometria visibile, materiale non produce pixel'};
  }

  if(!positionOk) return {status:'REVIEW',reason:'visibile ma posizione sospetta'};
  if(materialRatio<0.004) return {status:'REVIEW',reason:'copertura visiva molto bassa'};

  return {status:'PASS',reason:'render visibile'};
}

async function buildAuditProxy(asset,bodyVertices) {
  const parsed=parseResourceEntry(asset.raw);
  if(!parsed) throw new Error('resource entry non valida');

  const entry={
    ...parsed,
    slotId:`audit-${asset.group}`,
    slotLabel:asset.uiLabel||asset.group,
    label:asset.uiLabel||asset.group,
    uiGroup:asset.group
  };

  const url=baseProxyUrl(entry.basePath);
  const json=await fetchJsonCached(url,`Visual QA ${asset.uiLabel}`);
  const fit=fitProxy(json,bodyVertices);
  const variantIndex=materialVariantIndex(json,entry.variant);

  const built=geometryFromLegacy(
    json,
    fit.vertices,
    {forceMaterialIndex:variantIndex}
  );

  const mats=await materialsFromJson(json,url,entry.category);
  const mesh=new THREE.Mesh(built.geometry,mats);
  applyMakeHumanMeshFlags(mesh,json);

  return {entry,json,fit,built,mats,mesh,url};
}

function disposeAuditProxy(item) {
  if(!item) return;
  item.mesh?.geometry?.dispose?.();
  disposeMaterials(item.mats||[]);
}

function visualAuditAssetsForGroup(group) {
  return (uiCatalog?.assets||[])
    .filter(a=>a.group===group)
    .slice()
    .sort((a,b)=>String(a.uiLabel).localeCompare(String(b.uiLabel),'it',{numeric:true}));
}

function renderVisualAuditResults(report) {
  const box=E('visualQaResults');
  if(!box) return;

  const s=report.summary;
  const rows=report.results.map(r=>{
    const cls=r.status==='PASS'
      ?'qa-pass'
      :r.status==='FAIL'
        ?'qa-fail'
        :r.status==='ENGINE'
          ?'qa-engine'
          :'qa-review';
    const coverage=Number.isFinite(Number(r.coverageRatio)) ? `${(Number(r.coverageRatio)*100).toFixed(2)}%` : '—';
    return `<tr>
      <td>${escapeHtml(r.label)}</td>
      <td>${escapeHtml(r.uiGroup||r.kind||'')}</td>
      <td class="${cls}">${r.status}</td>
      <td>${coverage}</td>
      <td>${escapeHtml(r.reason)}</td>
    </tr>`;
  }).join('');

  box.innerHTML=`
    <div class="qa-summary">
      Testati <b>${s.total}</b> ·
      <span class="qa-pass">PASS ${s.pass}</span> ·
      <span class="qa-review">REVIEW ${s.review}</span> ·
      <span class="qa-fail">FAIL ${s.fail}</span> ·
      <span class="qa-engine">ENGINE ${s.engine}</span>
    </div>
    <div class="qa-table-wrap">
      <table class="qa-table">
        <thead><tr><th>Asset</th><th>Gruppo</th><th>Esito</th><th>Coverage</th><th>Motivo</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


function qaSummary(results,cancelled=false) {
  return {
    total:results.length,
    pass:results.filter(r=>r.status==='PASS').length,
    review:results.filter(r=>r.status==='REVIEW').length,
    fail:results.filter(r=>r.status==='FAIL').length,
    engine:results.filter(r=>r.status==='ENGINE').length,
    cancelled:Boolean(cancelled)
  };
}

async function auditProxyAsset(asset,bodyVertices,bodyBox) {
  let item=null;

  try {
    item=await buildAuditProxy(asset,bodyVertices);

    const pos=item.mesh.geometry.getAttribute('position');
    const triangles=pos?Math.floor(pos.count/3):0;

    item.mesh.geometry.computeBoundingBox();
    const proxyBox=item.mesh.geometry.boundingBox?.clone();
    const position=asset.group==='hair'
      ? hairPositionCheck(proxyBox,bodyBox)
      : {ok:true,reason:'non applicabile'};

    const materialCoverage=renderCoverageForMesh(item.mesh);
    const bestMaterial=bestCoverage(materialCoverage);

    const diagnosticMaterial=new THREE.MeshBasicMaterial({
      color:0xffffff,
      side:THREE.DoubleSide,
      transparent:false,
      alphaTest:0,
      depthTest:true,
      depthWrite:true
    });

    let solidCoverage;
    try {
      solidCoverage=renderCoverageForMesh(item.mesh,{overrideMaterial:diagnosticMaterial});
    } finally {
      diagnosticMaterial.dispose();
    }

    const bestSolid=bestCoverage(solidCoverage);
    const decision=classifyRenderedCoverage({
      fitOk:Boolean(item.fit.fitted && item.fit.invalidRefs===0 && item.fit.invalidRows===0),
      triangles,
      materialPixels:bestMaterial.pixels,
      materialRatio:bestMaterial.ratio,
      solidPixels:bestSolid.pixels,
      solidRatio:bestSolid.ratio,
      positionOk:position.ok
    });

    return {
      kind:'proxy',
      label:asset.uiLabel,
      raw:asset.raw,
      basePath:asset.basePath,
      uiGroup:asset.group,
      status:decision.status,
      reason:decision.reason,
      coveragePixels:bestMaterial.pixels,
      coverageRatio:bestMaterial.ratio,
      solidCoveragePixels:bestSolid.pixels,
      solidCoverageRatio:bestSolid.ratio,
      frontCoverage:materialCoverage.front,
      backCoverage:materialCoverage.back,
      solidFrontCoverage:solidCoverage.front,
      solidBackCoverage:solidCoverage.back,
      triangles,
      fitted:item.fit.fitted,
      invalidRefs:item.fit.invalidRefs,
      invalidRows:item.fit.invalidRows,
      positionOk:position.ok,
      positionReason:position.reason,
      materials:item.mats.map(m=>({
        name:m.name||'',
        mhTransparent:Boolean(m.userData?.mhTransparent),
        mhAlphaToCoverage:Boolean(m.userData?.mhAlphaToCoverage),
        threeTransparent:Boolean(m.transparent),
        alphaToCoverage:Boolean(m.alphaToCoverage),
        alphaTest:Number(m.alphaTest||0),
        side:Number(m.side)
      }))
    };
  } catch(err) {
    console.error('Visual QA proxy error',asset,err);
    return {
      kind:'proxy',
      label:asset.uiLabel,
      raw:asset.raw,
      basePath:asset.basePath,
      uiGroup:asset.group,
      status:'FAIL',
      reason:`errore runtime: ${err.message}`,
      coveragePixels:0,
      coverageRatio:0,
      solidCoveragePixels:0,
      solidCoverageRatio:0,
      fitted:false,
      invalidRefs:null,
      invalidRows:null,
      positionOk:false,
      positionReason:'non verificata',
      materials:[]
    };
  } finally {
    disposeAuditProxy(item);
  }
}

function buildUniformBodyAuditGeometry(bodyVertices) {
  const built=geometryFromLegacy(bodyJson,bodyVertices,{smoothBySourceVertex:true});
  const pos=built.geometry.getAttribute('position');
  built.geometry.clearGroups();
  if(pos) built.geometry.addGroup(0,pos.count,0);
  return built.geometry;
}

async function auditSkinAsset(skin,sharedBodyGeometry) {
  let material=null;
  try {
    const url=baseSkinUrl(skin.relativePath);
    const def=await fetchJsonCached(url,`QA ${skin.uiLabel}`);
    material=await materialFromDef(def,url,'skin');
    const mesh=new THREE.Mesh(sharedBodyGeometry,material);
    mesh.frustumCulled=false;

    const materialCoverage=renderCoverageForMesh(mesh);
    const bestMaterial=bestCoverage(materialCoverage);

    const diagnosticMaterial=new THREE.MeshBasicMaterial({
      color:0xffffff,
      side:THREE.DoubleSide,
      transparent:false,
      alphaTest:0,
      depthTest:true,
      depthWrite:true
    });

    let solidCoverage;
    try {
      solidCoverage=renderCoverageForMesh(mesh,{overrideMaterial:diagnosticMaterial});
    } finally {
      diagnosticMaterial.dispose();
    }

    const bestSolid=bestCoverage(solidCoverage);
    const pos=sharedBodyGeometry.getAttribute('position');
    const decision=classifyRenderedCoverage({
      fitOk:true,
      triangles:pos?Math.floor(pos.count/3):0,
      materialPixels:bestMaterial.pixels,
      materialRatio:bestMaterial.ratio,
      solidPixels:bestSolid.pixels,
      solidRatio:bestSolid.ratio,
      positionOk:true
    });

    return {
      kind:'skin',
      label:skin.uiLabel,
      raw:skin.raw,
      relativePath:skin.relativePath,
      uiGroup:'skins',
      status:decision.status,
      reason:decision.reason,
      coveragePixels:bestMaterial.pixels,
      coverageRatio:bestMaterial.ratio,
      solidCoveragePixels:bestSolid.pixels,
      solidCoverageRatio:bestSolid.ratio,
      materials:[{
        name:material.name||'',
        mhTransparent:Boolean(material.userData?.mhTransparent),
        mhAlphaToCoverage:Boolean(material.userData?.mhAlphaToCoverage),
        threeTransparent:Boolean(material.transparent),
        alphaToCoverage:Boolean(material.alphaToCoverage),
        alphaTest:Number(material.alphaTest||0),
        side:Number(material.side)
      }]
    };
  } catch(err) {
    console.error('Visual QA skin error',skin,err);
    return {
      kind:'skin',
      label:skin.uiLabel,
      raw:skin.raw,
      relativePath:skin.relativePath,
      uiGroup:'skins',
      status:'FAIL',
      reason:`errore runtime: ${err.message}`,
      coveragePixels:0,
      coverageRatio:0,
      solidCoveragePixels:0,
      solidCoverageRatio:0,
      materials:[]
    };
  } finally {
    if(material) disposeMaterials([material]);
  }
}

function auditTargetAsset(uiTarget,baseVertices) {
  const target=(customTargets.targets||[]).find(t=>String(t.id)===String(uiTarget.id));
  if(!target) {
    return {
      kind:'target',label:uiTarget.uiLabel,id:String(uiTarget.id),uiGroup:'targets',
      status:'FAIL',reason:'target non trovato nel catalogo runtime',coverageRatio:null
    };
  }

  let invalidRows=0;
  let changedVertices=0;
  let maxDelta=0;
  let sumSq=0;

  for(const row of target.vertices||[]) {
    if(!Array.isArray(row)||row.length<4) { invalidRows++; continue; }
    const i=Number(row[0]);
    const dx=Number(row[1]),dy=Number(row[2]),dz=Number(row[3]);
    if(!Number.isInteger(i)||i<0||i*3+2>=baseVertices.length||
       !Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(dz)) {
      invalidRows++;
      continue;
    }
    const d=Math.hypot(dx,dy,dz);
    if(d>1e-9) {
      changedVertices++;
      maxDelta=Math.max(maxDelta,d);
      sumSq+=d*d;
    }
  }

  let status='PASS',reason='target modifica la geometria';
  if(invalidRows>0) {
    status='FAIL'; reason=`${invalidRows} righe target non valide`;
  } else if(changedVertices===0 || maxDelta<=1e-9) {
    status='FAIL'; reason='target senza effetto geometrico';
  }

  return {
    kind:'target',
    label:uiTarget.uiLabel,
    id:String(uiTarget.id),
    uiGroup:'targets',
    status,
    reason,
    coverageRatio:null,
    changedVertices,
    invalidRows,
    maxDelta,
    rmsDelta:changedVertices?Math.sqrt(sumSq/changedVertices):0
  };
}

function qaSelfTestOrStop() {
  const selfTest=runVisualQaSelfTest();
  if(selfTest.ok) return selfTest;

  setStatus([
    'VISUAL QA ENGINE ERROR',
    'Il test di calibrazione non riesce a leggere nemmeno un cubo bianco noto.',
    `coverage self-test: ${(selfTest.ratio*100).toFixed(3)}%`,
    `pixel self-test: ${selfTest.pixels}`,
    '',
    'Il QA viene fermato: nessun asset viene marcato FAIL.'
  ],'bad');

  const resultsBox=E('visualQaResults');
  if(resultsBox) resultsBox.innerHTML='<div class="qa-engine">QA NON ESEGUITO: self-test renderer/readback fallito.</div>';
  return null;
}

async function runSkinVisualAudit() {
  if(visualAuditRunning) return;
  const skins=(uiCatalog?.skins||[]).slice();
  if(!skins.length) return;

  visualAuditRunning=true;
  visualAuditCancelRequested=false;
  E('qaRun').disabled=true; E('qaCancel').disabled=false; E('qaExport').disabled=true;

  const selfTest=qaSelfTestOrStop();
  if(!selfTest) { visualAuditRunning=false; E('qaRun').disabled=false; E('qaCancel').disabled=true; return; }

  const base=scaledVertices(bodyJson);
  const geometry=buildUniformBodyAuditGeometry(base);
  const results=[];
  try {
    for(let i=0;i<skins.length;i++) {
      if(visualAuditCancelRequested) break;
      setStatus(`VISUAL QA PELLI\n${i+1}/${skins.length} — ${skins[i].uiLabel}`);
      results.push(await auditSkinAsset(skins[i],geometry));
      await new Promise(r=>setTimeout(r,0));
    }
  } finally {
    geometry.dispose();
    visualAuditRunning=false;
    E('qaRun').disabled=false; E('qaCancel').disabled=true;
  }

  const summary=qaSummary(results,visualAuditCancelRequested);
  lastVisualAudit={schema:'adf.makehuman.visual-qa.v29',generatedAt:new Date().toISOString(),group:'skins',renderer:`Three.js ${THREE.REVISION}`,selfTest,summary,results};
  renderVisualAuditResults(lastVisualAudit); E('qaExport').disabled=false;
  setStatus(`VISUAL QA PELLI COMPLETATO\nPASS ${summary.pass} · REVIEW ${summary.review} · FAIL ${summary.fail} · ENGINE ${summary.engine}`,summary.fail?'warn':'ok');
}

async function runTargetAudit() {
  if(visualAuditRunning) return;
  const targets=(uiCatalog?.targets||[]).slice();
  visualAuditRunning=true; visualAuditCancelRequested=false;
  E('qaRun').disabled=true; E('qaCancel').disabled=false; E('qaExport').disabled=true;
  const base=scaledVertices(bodyJson);
  const results=[];
  try {
    for(let i=0;i<targets.length;i++) {
      if(visualAuditCancelRequested) break;
      setStatus(`QA TARGET\n${i+1}/${targets.length} — ${targets[i].uiLabel}`);
      results.push(auditTargetAsset(targets[i],base));
      await new Promise(r=>setTimeout(r,0));
    }
  } finally {
    visualAuditRunning=false; E('qaRun').disabled=false; E('qaCancel').disabled=true;
  }
  const summary=qaSummary(results,visualAuditCancelRequested);
  lastVisualAudit={schema:'adf.makehuman.visual-qa.v29',generatedAt:new Date().toISOString(),group:'targets',renderer:`Three.js ${THREE.REVISION}`,summary,results};
  renderVisualAuditResults(lastVisualAudit); E('qaExport').disabled=false;
  setStatus(`QA TARGET COMPLETATO\nPASS ${summary.pass} · FAIL ${summary.fail}`,summary.fail?'warn':'ok');
}

async function runFullVisualAudit({autoExport=false}={}) {
  if(visualAuditRunning) return;

  const proxyAssets=(uiCatalog?.assets||[]).slice().sort((a,b)=>
    String(a.section||'').localeCompare(String(b.section||''),'it') ||
    String(a.group||'').localeCompare(String(b.group||''),'it') ||
    String(a.uiLabel||'').localeCompare(String(b.uiLabel||''),'it',{numeric:true})
  );
  const skins=(uiCatalog?.skins||[]).slice();
  const targets=(uiCatalog?.targets||[]).slice();
  const total=proxyAssets.length+skins.length+targets.length;

  visualAuditRunning=true;
  visualAuditCancelRequested=false;
  E('qaRun').disabled=true; E('qaCancel').disabled=false; E('qaExport').disabled=true;

  const selfTest=qaSelfTestOrStop();
  if(!selfTest) {
    visualAuditRunning=false; E('qaRun').disabled=false; E('qaCancel').disabled=true;
    return;
  }

  const base=scaledVertices(bodyJson);
  const bodyBox=bodyBoundsFromVertices(base);
  const results=[];
  let cursor=0;

  try {
    for(const asset of proxyAssets) {
      if(visualAuditCancelRequested) break;
      cursor++;
      setStatus([
        'VISUAL QA GLOBALE V2.9',
        `${cursor}/${total} — PROXY — ${asset.uiLabel}`,
        `Gruppo: ${asset.group}`,
        '',
        'Fit + materiale reale + pass geometrico di controllo…'
      ]);
      results.push(await auditProxyAsset(asset,base,bodyBox));
      await new Promise(r=>setTimeout(r,0));
    }

    if(!visualAuditCancelRequested) {
      const geometry=buildUniformBodyAuditGeometry(base);
      try {
        for(const skin of skins) {
          if(visualAuditCancelRequested) break;
          cursor++;
          setStatus(`VISUAL QA GLOBALE V2.9\n${cursor}/${total} — SKIN — ${skin.uiLabel}`);
          results.push(await auditSkinAsset(skin,geometry));
          await new Promise(r=>setTimeout(r,0));
        }
      } finally {
        geometry.dispose();
      }
    }

    if(!visualAuditCancelRequested) {
      for(const target of targets) {
        if(visualAuditCancelRequested) break;
        cursor++;
        setStatus(`VISUAL QA GLOBALE V2.9\n${cursor}/${total} — TARGET — ${target.uiLabel}`);
        results.push(auditTargetAsset(target,base));
        await new Promise(r=>setTimeout(r,0));
      }
    }

    const summary=qaSummary(results,visualAuditCancelRequested);
    const byGroup={};
    for(const r of results) {
      const g=r.uiGroup||r.kind||'unknown';
      byGroup[g] ||= {total:0,pass:0,review:0,fail:0,engine:0};
      byGroup[g].total++;
      const k=String(r.status||'').toLowerCase();
      if(byGroup[g][k]!==undefined) byGroup[g][k]++;
    }

    lastVisualAudit={
      schema:'adf.makehuman.visual-qa.v29',
      generatedAt:new Date().toISOString(),
      group:'all',
      renderer:`Three.js ${THREE.REVISION}`,
      rule:'FAIL only = candidate for UI blacklist. REVIEW and ENGINE are never auto-pruned.',
      selfTest:visualQaSelfTest,
      inventory:{proxyEntries:proxyAssets.length,skins:skins.length,targets:targets.length,total},
      summary,
      byGroup,
      results
    };

    renderVisualAuditResults(lastVisualAudit);
    E('qaExport').disabled=false;
    setStatus([
      'VISUAL QA GLOBALE COMPLETATO',
      `Testati: ${summary.total}/${total}`,
      `PASS: ${summary.pass}`,
      `REVIEW: ${summary.review}`,
      `FAIL: ${summary.fail}`,
      `ENGINE: ${summary.engine}`,
      '',
      'Solo i FAIL verranno proposti per la blacklist. REVIEW/ENGINE restano attivi.'
    ],summary.fail?'warn':'ok');

    if(autoExport && !summary.cancelled) setTimeout(()=>exportVisualAudit(),250);
  } finally {
    visualAuditRunning=false;
    E('qaRun').disabled=false; E('qaCancel').disabled=true;
  }
}

async function runQaSelection(value,{autoExport=false}={}) {
  if(value==='all') return runFullVisualAudit({autoExport});
  if(value==='skins') return runSkinVisualAudit();
  if(value==='targets') return runTargetAudit();
  return runVisualAudit(value);
}

async function runVisualAudit(group='hair') {
  if(visualAuditRunning) return;

  const assets=visualAuditAssetsForGroup(group);
  if(!assets.length) {
    setStatus(`VISUAL QA: nessun asset nel gruppo ${group}`,'warn');
    return;
  }

  visualAuditRunning=true;
  visualAuditCancelRequested=false;
  E('qaRun').disabled=true;
  E('qaCancel').disabled=false;
  E('qaExport').disabled=true;

  const selfTest=runVisualQaSelfTest();
  if(!selfTest.ok) {
    visualAuditRunning=false;
    E('qaRun').disabled=false;
    E('qaCancel').disabled=true;

    setStatus([
      'VISUAL QA ENGINE ERROR',
      'Il test di calibrazione non riesce a leggere nemmeno un cubo bianco noto.',
      `coverage self-test: ${(selfTest.ratio*100).toFixed(3)}%`,
      `pixel self-test: ${selfTest.pixels}`,
      '',
      'Gli asset NON vengono marcati FAIL: il problema e nel tester.'
    ],'bad');

    const resultsBox=E('visualQaResults');
    if(resultsBox) {
      resultsBox.innerHTML=`
        <div class="qa-engine">
          QA NON ESEGUITO: self-test renderer/readback fallito
          (${(selfTest.ratio*100).toFixed(3)}%, ${selfTest.pixels} px).
        </div>`;
    }
    return;
  }

  const bodyVertices=scaledVertices(bodyJson);
  const bodyBox=bodyBoundsFromVertices(bodyVertices);
  const results=[];

  try {
    for(let i=0;i<assets.length;i++) {
      if(visualAuditCancelRequested) break;

      const asset=assets[i];
      setStatus(
        `VISUAL QA AUTOMATICO\n`+
        `${i+1}/${assets.length} — ${asset.uiLabel}\n`+
        `Carico, fitto e renderizzo fronte/retro…`
      );

      let item=null;

      try {
        item=await buildAuditProxy(asset,bodyVertices);

        const pos=item.mesh.geometry.getAttribute('position');
        const triangles=pos?Math.floor(pos.count/3):0;

        item.mesh.geometry.computeBoundingBox();
        const proxyBox=item.mesh.geometry.boundingBox?.clone();
        const position=group==='hair'
          ? hairPositionCheck(proxyBox,bodyBox)
          : {ok:true,reason:'non applicabile'};

        const materialCoverage=renderCoverageForMesh(item.mesh);
        const bestMaterial=bestCoverage(materialCoverage);

        const diagnosticMaterial=new THREE.MeshBasicMaterial({
          color:0xffffff,
          side:THREE.DoubleSide,
          transparent:false,
          alphaTest:0,
          depthTest:true,
          depthWrite:true
        });

        let solidCoverage;
        try {
          solidCoverage=renderCoverageForMesh(
            item.mesh,
            {overrideMaterial:diagnosticMaterial}
          );
        } finally {
          diagnosticMaterial.dispose();
        }

        const bestSolid=bestCoverage(solidCoverage);

        const decision=classifyRenderedCoverage({
          fitOk:Boolean(item.fit.fitted && item.fit.invalidRefs===0 && item.fit.invalidRows===0),
          triangles,
          materialPixels:bestMaterial.pixels,
          materialRatio:bestMaterial.ratio,
          solidPixels:bestSolid.pixels,
          solidRatio:bestSolid.ratio,
          positionOk:position.ok
        });

        results.push({
          kind:'proxy',
          label:asset.uiLabel,
          raw:asset.raw,
          basePath:asset.basePath,
          uiGroup:asset.group,
          status:decision.status,
          reason:decision.reason,
          coveragePixels:bestMaterial.pixels,
          coverageRatio:bestMaterial.ratio,
          solidCoveragePixels:bestSolid.pixels,
          solidCoverageRatio:bestSolid.ratio,
          frontCoverage:materialCoverage.front,
          backCoverage:materialCoverage.back,
          solidFrontCoverage:solidCoverage.front,
          solidBackCoverage:solidCoverage.back,
          triangles,
          fitted:item.fit.fitted,
          invalidRefs:item.fit.invalidRefs,
          invalidRows:item.fit.invalidRows,
          positionOk:position.ok,
          positionReason:position.reason,
          materials:item.mats.map(m=>({
            name:m.name||'',
            mhTransparent:Boolean(m.userData?.mhTransparent),
            mhAlphaToCoverage:Boolean(m.userData?.mhAlphaToCoverage),
            threeTransparent:Boolean(m.transparent),
            alphaToCoverage:Boolean(m.alphaToCoverage),
            alphaTest:Number(m.alphaTest||0),
            side:Number(m.side)
          }))
        });
      } catch(err) {
        console.error('Visual QA asset error',asset,err);
        results.push({
          kind:'proxy',
          label:asset.uiLabel,
          raw:asset.raw,
          basePath:asset.basePath,
          uiGroup:asset.group,
          status:'FAIL',
          reason:`errore runtime: ${err.message}`,
          coveragePixels:0,
          coverageRatio:0,
          frontCoverage:null,
          backCoverage:null,
          triangles:0,
          fitted:false,
          invalidRefs:null,
          invalidRows:null,
          positionOk:false,
          positionReason:'non verificata',
          materials:[]
        });
      } finally {
        disposeAuditProxy(item);
      }

      // Lascia respirare UI/GPU fra asset.
      await new Promise(resolve=>setTimeout(resolve,0));
    }

    const summary=qaSummary(results,visualAuditCancelRequested);

    lastVisualAudit={
      schema:'adf.makehuman.visual-qa.v29',
      generatedAt:new Date().toISOString(),
      group,
      renderer:`Three.js ${THREE.REVISION}`,
      rule:'Rendered-output audit. PASS requires valid fit + real rendered pixel contribution.',
      selfTest:visualQaSelfTest,
      thresholds:{
        failPixelsBelow:24,
        failCoverageBelow:0.0004,
        reviewCoverageBelow:0.004
      },
      summary,
      results
    };

    renderVisualAuditResults(lastVisualAudit);

    setStatus([
      `VISUAL QA ${visualAuditCancelRequested?'INTERROTTO':'COMPLETATO'}`,
      `Gruppo: ${group}`,
      `Testati: ${summary.total}`,
      `PASS: ${summary.pass}`,
      `REVIEW: ${summary.review}`,
      `FAIL: ${summary.fail}`,
      `ENGINE: ${summary.engine}`,
      '',
      summary.engine
        ? 'Alcuni casi non sono classificabili per un problema del tester/renderer.'
        : summary.fail
          ? 'Sono stati trovati asset con geometria valida ma materiale non visibile.'
          : 'Nessun FAIL di visibilità rilevato.'
    ],summary.fail?'warn':'ok');

    E('qaExport').disabled=false;
  } finally {
    visualAuditRunning=false;
    E('qaRun').disabled=false;
    E('qaCancel').disabled=true;
  }
}

function exportVisualAudit() {
  if(!lastVisualAudit) return;

  const blob=new Blob(
    [JSON.stringify(lastVisualAudit,null,2)],
    {type:'application/json'}
  );

  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`makehuman-visual-qa-${lastVisualAudit.group}-v29.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1500);
}


function colorGroupTitle(group) {
  if(group==='hair') return 'Colore capelli';
  if(group==='eyes') return 'Colore occhi';
  if(group==='eyebrows') return 'Colore sopracciglia';
  return 'Colore';
}

function updateColorCustomizerUi() {
  const group=activeColorCustomizerGroup;
  const state=appearanceColorState[group];

  const panel=E('colorCustomizer');
  if(!panel || !state) return;

  E('colorCustomizerTitle').textContent=colorGroupTitle(group);
  E('colorPicker').value=state.color;
  E('colorHex').textContent=state.color.toUpperCase();

  panel.dataset.group=group;

  const swatches=E('colorSwatches');
  swatches.innerHTML=(COLOR_SWATCHES[group]||[]).map(color=>
    `<button class="color-swatch" data-color="${escapeHtmlAttr(color)}" `+
    `style="--swatch:${escapeHtmlAttr(color)}" title="${escapeHtmlAttr(color)}"></button>`
  ).join('');

  for(const btn of swatches.querySelectorAll('.color-swatch')) {
    btn.addEventListener('click',()=>{
      const color=btn.dataset.color;
      appearanceColorState[group].enabled=true;
      appearanceColorState[group].color=color;
      updateColorCustomizerUi();
      syncColorCustomizeButtons();
      rebuildAll(false);
    });
  }

  E('colorReset').disabled=!state.enabled;
}

function openColorCustomizer(group) {
  if(!COLOR_CUSTOMIZABLE_GROUPS.has(group)) return;
  activeColorCustomizerGroup=group;
  E('colorCustomizer').hidden=false;
  updateColorCustomizerUi();
}

function closeColorCustomizer() {
  E('colorCustomizer').hidden=true;
}

function syncColorCustomizeButtons() {
  for(const group of COLOR_CUSTOMIZABLE_GROUPS) {
    const btn=E(`customize-${group}`);
    const state=appearanceColorState[group];
    if(!btn || !state) continue;

    btn.classList.toggle('active',Boolean(state.enabled));
    btn.style.setProperty('--active-color',state.color);
    btn.textContent=state.enabled?'Personalizza ✓':'Personalizza';
  }
}

function bindColorCustomizer() {
  for(const group of COLOR_CUSTOMIZABLE_GROUPS) {
    E(`customize-${group}`)?.addEventListener('click',()=>openColorCustomizer(group));
  }

  E('colorClose')?.addEventListener('click',closeColorCustomizer);

  E('colorPicker')?.addEventListener('input',e=>{
    const state=appearanceColorState[activeColorCustomizerGroup];
    if(!state) return;
    state.color=e.target.value;
    state.enabled=true;
    E('colorHex').textContent=state.color.toUpperCase();
    syncColorCustomizeButtons();
  });

  // Rebuild only when the native color picker commits the choice,
  // avoiding dozens of expensive full-character rebuilds while dragging.
  E('colorPicker')?.addEventListener('change',()=>{
    rebuildAll(false);
    updateColorCustomizerUi();
  });

  E('colorReset')?.addEventListener('click',()=>{
    const state=appearanceColorState[activeColorCustomizerGroup];
    if(!state) return;
    state.enabled=false;
    syncColorCustomizeButtons();
    updateColorCustomizerUi();
    rebuildAll(false);
  });

  syncColorCustomizeButtons();
}


function snapshotCharacterState() {
  const slots={};
  for(const def of SLOT_DEFS) slots[def.id]=E(`slot-${def.id}`)?.value||'';
  return {
    schema:'adf.makehuman.character.v2',
    slots,
    skin:skinSelect.value||'',
    modifiers:{...nativeModifierValues},
    customTargets:{...customTargetValues},
    colors:Object.fromEntries(
      [...COLOR_CUSTOMIZABLE_GROUPS].map(group=>[group,{...appearanceColorState[group]}])
    )
  };
}

async function restoreCharacterState(state,{refit=true}={}) {
  if(!state || typeof state!=='object') return false;

  for(const def of SLOT_DEFS) {
    if(WARDROBE_SLOT_SET.has(def.id)) continue;
    const select=E(`slot-${def.id}`);
    const value=state.slots?.[def.id];
    if(select && typeof value==='string' && [...select.options].some(o=>o.value===value)) {
      select.value=value;
    }
  }

  applyWardrobeSelections(state.slots||{},{notify:false});

  if(typeof state.skin==='string' && [...skinSelect.options].some(o=>o.value===state.skin)) {
    skinSelect.value=state.skin;
    currentSkin=state.skin||null;
  }

  customTargetValues={};
  if(state.customTargets && typeof state.customTargets==='object') {
    for(const [id,value] of Object.entries(state.customTargets)) {
      customTargetValues[String(id)]=Math.max(0,Math.min(1,Number(value)||0));
    }
  } else if(state.target?.id) {
    // Migration from character.v1 single-target state.
    customTargetValues[String(state.target.id)]=Math.max(0,Math.min(1,Number(state.target.strength)||0));
  }

  for(const group of COLOR_CUSTOMIZABLE_GROUPS) {
    const incoming=state.colors?.[group];
    if(!incoming) continue;
    appearanceColorState[group].enabled=!!incoming.enabled;
    if(/^#[0-9a-f]{6}$/i.test(String(incoming.color||''))) {
      appearanceColorState[group].color=String(incoming.color);
    }
  }

  syncColorCustomizeButtons();
  updateColorCustomizerUi();
  renderCustomTargetList(E('customTargetSearch')?.value||'');

  if(nativeEngineReady && state.modifiers && typeof state.modifiers==='object') {
    await requestNativeModifiers(state.modifiers);
  } else {
    await rebuildAll(refit);
  }
  return true;
}

function filterTargets(query='') {
  renderCustomTargetList(query);
}

function setEditorSection(section,{autoFrame=true}={}) {
  if(!EDITOR_SECTION_CAMERA[section]) return;
  currentEditorSection=section;
  document.querySelectorAll('[data-editor-section]').forEach(el=>{
    el.classList.toggle('active',el.dataset.editorSection===section);
  });
  document.querySelectorAll('[data-editor-tab]').forEach(el=>{
    el.classList.toggle('active',el.dataset.editorTab===section);
  });
  E('sectionTitle') && (E('sectionTitle').textContent={
    identity:'Identità',face:'Volto',body:'Corpo',hair:'Capelli & dettagli',
    wardrobe:'Guardaroba',skin:'Pelle',customization:'Personalizzazione',confirm:'Conferma'
  }[section]||section);

  if(autoFrame && !previewMode) setCameraView(EDITOR_SECTION_CAMERA[section],{smooth:true});
}

async function resetCurrentSection() {
  const base=initialCharacterState;
  if(!base) return;

  const copy=snapshotCharacterState();
  const restoreSlots=(ids)=>{ for(const id of ids) copy.slots[id]=base.slots[id]||''; };

  if(currentEditorSection==='identity') {
    const values={};
    for(const meta of nativeModifierMeta.filter(m=>modifierSection(m)==='identity')) {
      values[meta.fullName]=nativeModifierDefaults[meta.fullName]??meta.defaultValue??0;
    }
    await requestNativeModifiers(values);
  } else if(currentEditorSection==='face') {
    restoreSlots(['eyes','eyebrows','eyelashes']);
    copy.colors.eyes={...base.colors.eyes};
    copy.colors.eyebrows={...base.colors.eyebrows};
    const values={};
    for(const meta of nativeModifierMeta.filter(m=>modifierSection(m)==='face')) {
      values[meta.fullName]=nativeModifierDefaults[meta.fullName]??meta.defaultValue??0;
    }
    await restoreCharacterState(copy,{refit:false});
    await requestNativeModifiers(values);
  } else if(currentEditorSection==='body') {
    restoreSlots(['bodyDetail','genitals']);
    const values={};
    for(const meta of nativeModifierMeta.filter(m=>modifierSection(m)==='body')) {
      values[meta.fullName]=nativeModifierDefaults[meta.fullName]??meta.defaultValue??0;
    }
    await restoreCharacterState(copy,{refit:false});
    await requestNativeModifiers(values);
  } else if(currentEditorSection==='hair') {
    restoreSlots(['hair','facialHair','teeth','tongue']);
    copy.colors.hair={...base.colors.hair};
    await restoreCharacterState(copy,{refit:false});
  } else if(currentEditorSection==='wardrobe') {
    restoreSlots(['tops','bottoms','dresses','underwear','shoes','outerwear','clothesOther','armsleeves','glasses','hats','gloves','masks','jewelry','equipment']);
    await restoreCharacterState(copy,{refit:false});
  } else if(currentEditorSection==='skin') {
    copy.skin=base.skin;
    await restoreCharacterState(copy,{refit:false});
  } else if(currentEditorSection==='customization') {
    copy.customTargets={};
    await restoreCharacterState(copy,{refit:false});
  } else if(currentEditorSection==='confirm') {
    return;
  }

  setCameraView(EDITOR_SECTION_CAMERA[currentEditorSection]||'full',{smooth:true});
}

function setPreviewMode(next) {
  previewMode=!!next;
  document.body.classList.toggle('preview-mode',previewMode);
  E('editorPreview').textContent=previewMode?'Esci anteprima':'Anteprima';
  applyVisualCenter();
  setCameraView('full',{smooth:true});
}

/* ADF_MAKEHUMAN_PORTRAIT_STORE_V3
   La preview MakeHuman viene conservata fuori dal creator RPG.
   Questo evita di dipendere dal markup/funzioni del creator locale. */
function adfPersistMakeHumanPortrait(dataUrl){
  try{
    if(typeof dataUrl !== "string" || !/^data:image\/(?:png|jpeg|webp);base64,/i.test(dataUrl)) return dataUrl;
    let slot = 1;
    try{
      const s = JSON.parse(localStorage.getItem("adf-impostazioni-v1") || "null");
      const n = s && Number(s.slot);
      if(Number.isInteger(n) && n >= 1 && n <= 3) slot = n;
    }catch(_e){}
    const suffix = slot > 1 ? "-s" + slot : "";
    localStorage.setItem("adf-makehuman-portrait-v3" + suffix, JSON.stringify({
      v:3, ts:Date.now(), image:dataUrl
    }));
  }catch(e){
    try{ console.warn("[ADF] salvataggio portrait MakeHuman non riuscito", e); }catch(_e){}
  }
  return dataUrl;
}

function makePreviewImage(){
  /* ADF_MAKEHUMAN_DETERMINISTIC_PROPIC_V1_2
     Portrait MakeHuman indipendente da viewport/sidebar/DPR/browser zoom.
     Usiamo un render fisso 420x560 e una camera portrait dedicata.
     La camera live dell'editor non viene modificata. */
  const OUT_W=420;
  const OUT_H=560;

  if(
    typeof renderer==="undefined" || !renderer ||
    typeof scene==="undefined" || !scene ||
    typeof camera==="undefined" || !camera ||
    typeof THREE==="undefined" ||
    typeof characterBounds!=="function"
  ) return "";

  const bounds=characterBounds();
  if(!bounds) return "";

  const {box,center,size}=bounds;
  const max=Math.max(size.x,size.y,size.z,0.001);

  const target=new THREE.Vector3(
    center.x,
    box.min.y+size.y*0.91,
    center.z
  );
  const distance=max*0.34;

  const portraitCamera=new THREE.PerspectiveCamera(
    32,
    OUT_W/OUT_H,
    Math.max(.01,max/1000),
    Math.max(200,max*10)
  );

  portraitCamera.position.set(target.x,target.y,target.z+distance);
  portraitCamera.up.copy(camera.up);
  portraitCamera.layers.mask=camera.layers.mask;
  portraitCamera.lookAt(target);
  portraitCamera.updateProjectionMatrix();
  portraitCamera.updateMatrixWorld(true);

  const oldPixelRatio=renderer.getPixelRatio();
  const oldSize=renderer.getSize(new THREE.Vector2());
  const oldRenderTarget=renderer.getRenderTarget?.() || null;

  try{
    renderer.setRenderTarget(null);
    renderer.setPixelRatio(1);
    renderer.setSize(OUT_W,OUT_H,false);
    renderer.render(scene,portraitCamera);

    const canvas=renderer.domElement;
    if(!canvas || canvas.width!==OUT_W || canvas.height!==OUT_H) return "";

    const data=canvas.toDataURL("image/png");
    if(!/^data:image\/png;base64,/i.test(data)) return "";

    return (typeof adfPersistMakeHumanPortrait==="function")
      ? adfPersistMakeHumanPortrait(data)
      : data;
  }catch(e){
    try{ console.warn("[ADF] propic MakeHuman deterministica non acquisita",e); }catch(_e){}
    return "";
  }finally{
    try{
      renderer.setPixelRatio(oldPixelRatio);
      renderer.setSize(oldSize.x,oldSize.y,false);
      renderer.setRenderTarget(oldRenderTarget);
      renderer.render(scene,camera);
    }catch(_e){}
  }
}
function emitToRoom(type,extra={}) {
  window.parent.postMessage({type,...extra},'*');
}

function bindEditorShell() {
  document.querySelectorAll('[data-editor-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>setEditorSection(btn.dataset.editorTab));
  });
  document.querySelectorAll('[data-camera-view]').forEach(btn=>{
    btn.addEventListener('click',()=>setCameraView(btn.dataset.cameraView,{smooth:true}));
  });
  E('editorBack')?.addEventListener('click',()=>emitToRoom('adf-makehuman-back'));
  E('editorRandom')?.addEventListener('click',()=>randomizeComplete());
  E('editorReset')?.addEventListener('click',()=>resetCurrentSection());
  E('editorPreview')?.addEventListener('click',()=>setPreviewMode(!previewMode));
  E('editorConfirm')?.addEventListener('click',()=>{
    emitToRoom('adf-makehuman-confirm',{
      state:{
        ...snapshotCharacterState(),
        previewFraming:'makehuman-deterministic-v1'
      },
      previewImage:makePreviewImage()
    });
  });
  E('modifierSearch')?.addEventListener('input',e=>renderNativeSearch(e.target.value));
  E('customTargetSearch')?.addEventListener('input',e=>renderCustomTargetList(e.target.value));

  window.addEventListener('message',e=>{
    const msg=e.data||{};
    if(msg.type!=='adf-makehuman-init') return;

    /* ADF_MAKEHUMAN_INIT_ONCE_V1
       Il creator può tentare l'init sia poco dopo l'apertura sia dopo il
       messaggio ready. Per uno stesso iframe accettiamo UN solo init: un
       secondo restore tardivo non deve sovrascrivere il primo preset cliccato. */
    if(window.__ADF_MAKEHUMAN_INIT_ACCEPTED__) return;
    window.__ADF_MAKEHUMAN_INIT_ACCEPTED__=true;

    if(msg.state) {
      if(runtimeReady) {
        Promise.resolve(restoreCharacterState(msg.state,{refit:true}))
          .then(()=>adfMhMountPresetBox())
          .catch(err=>console.error('[ADF] restore MakeHuman iniziale fallito',err));
      } else {
        pendingRestoreState=msg.state;
      }
      return;
    }

    /* Nuova creazione senza stato precedente: l'handshake è comunque
       concluso, quindi da questo momento i preset possono diventare cliccabili. */
    if(runtimeReady) adfMhMountPresetBox();
  });
}

async function resetCompletePreset() {
  for(const def of SLOT_DEFS) {
    const select=E(`slot-${def.id}`);
    const entries=entriesForUiGroup(def.uiGroup);
    select.value=choosePreferred(def,entries);
  }

  customTargetValues={};
  renderCustomTargetList(E('customTargetSearch')?.value||'');

  for(const group of COLOR_CUSTOMIZABLE_GROUPS) appearanceColorState[group].enabled=false;
  syncColorCustomizeButtons();

  if(nativeEngineReady) await requestNativeModifiers(nativeModifierDefaults);
  else await rebuildAll(true);
}

function clearWardrobe() {
  for(const slotId of WARDROBE_SLOT_IDS) {
    const select=E(`slot-${slotId}`);
    if(select) select.value='';
  }
  rebuildAll(false);
}

async function randomizeComplete() {
  const proposedWardrobe={};

  for(const def of SLOT_DEFS) {
    const entries=entriesForUiGroup(def.uiGroup);
    const select=E(`slot-${def.id}`);

    if(WARDROBE_SLOT_SET.has(def.id)) {
      if(!entries.length) {
        proposedWardrobe[def.id]='';
        continue;
      }

      if(['tops','bottoms','dresses','underwear','shoes','outerwear','clothesOther'].includes(def.uiGroup) && Math.random()>.45) {
        proposedWardrobe[def.id]='';
        continue;
      }

      proposedWardrobe[def.id]=entries[Math.floor(Math.random()*entries.length)].raw;
      continue;
    }

    if(!entries.length) { select.value=''; continue; }
    if(def.uiGroup==='genitals') { select.value=''; continue; }
    select.value=entries[Math.floor(Math.random()*entries.length)].raw;
  }

  applyWardrobeSelections(proposedWardrobe,{notify:false});

  customTargetValues={};

  if(nativeEngineReady) {
    const values={};
    for(const meta of nativeModifierMeta) {
      const def=Number(nativeModifierDefaults[meta.fullName]??meta.defaultValue??0);
      if(meta.fullName==='macrodetails/Gender') {
        values[meta.fullName]=Math.random()<.5?0:1;
      } else if(meta.isMacro) {
        const span=(meta.max-meta.min);
        values[meta.fullName]=Math.max(meta.min,Math.min(meta.max,def+(Math.random()-.5)*span*.45));
      } else {
        // Controlled randomization: most detailed modifiers stay near neutral.
        const span=(meta.max-meta.min);
        values[meta.fullName]=Math.max(meta.min,Math.min(meta.max,def+(Math.random()-.5)*span*.28));
      }
    }
    await requestNativeModifiers(values);
  } else {
    await rebuildAll(true);
  }

  renderCustomTargetList('');
}

async function init() {
  initScene();

  try {
    setStatus('1/6 — Carico body MakeHuman…');
    bodyJson=await fetchCoreJson(URLS.body,'Body MakeHuman');

    setStatus('2/6 — Carico resources.json…');
    resources=await fetchCoreJson(URLS.resources,'Resources MakeHuman');

    setStatus('3/6 — Carico catalogo audit…');
    audit=await fetchCoreJson(URLS.catalog,'Catalogo audit');

    setStatus('4/6 — Carico 37 target extra…');
    try {
      customTargets=await fetchCoreJson(URLS.customTargets,'Target extra');
    } catch(err) {
      console.warn(err);
      customTargets={targets:[]};
    }

    setStatus('5/6 — Carico catalogo UI italiano…');
    uiCatalog=await fetchCoreJson(URLS.uiCatalog,'Catalogo UI V2.9');
    try {
      uiOverrides=await fetchCoreJson(URLS.uiOverrides,'Override UI ADF V2.13.6');
    } catch(err) {
      console.warn('Override UI ADF non disponibile:',err);
      uiOverrides={skins:{},targets:{},assets:{}};
    }
    applyUiPresentationOverrides();

    buildResourceCatalog();
    populateSlots();
    populateSkinAndTargets();
    showAudit();
    renderCustomTargetList('');

    setStatus('6/6 — Carico modifier stack nativo MakeHuman…\ntargets.bin ≈ 145 MB: il primo avvio può richiedere qualche secondo.');
    await initNativeModifierEngine();

    setStatus('Costruisco personaggio con tutti i modifier MakeHuman…');
    await rebuildAll(true);

    // Default occhi esplicito e stabile: HighPoly / Eye_brown.
    const eyeSelect=E('slot-eyes');
    if(eyeSelect && [...eyeSelect.options].some(o=>o.value===DEFAULT_EYES_RAW) && eyeSelect.value!==DEFAULT_EYES_RAW) {
      eyeSelect.value=DEFAULT_EYES_RAW;
      await rebuildAll(false);
    }

    initialCharacterState=snapshotCharacterState();
    runtimeReady=true;

    /* Prima completiamo l'eventuale restore iniziale del creator. I preset
       non devono essere cliccabili mentre questa fase può ancora riscrivere
       lo stato del personaggio o riportare l'editor alla sezione iniziale. */
    if(pendingRestoreState) {
      const restore=pendingRestoreState; pendingRestoreState=null;
      await restoreCharacterState(restore,{refit:true});
    }
    setEditorSection('identity',{autoFrame:false});
    setCameraView('full',{smooth:false});
    applyVisualCenter();

    /* In standalone non esiste un parent da cui attendere l'init. Nel gioco,
       invece, montiamo i preset solo quando l'handshake iniziale è già stato
       accettato; se arriverà dopo ready sarà il message handler a montarli. */
    if(window.parent===window || window.__ADF_MAKEHUMAN_INIT_ACCEPTED__){
      adfMhMountPresetBox();
    }

    emitToRoom('adf-makehuman-ready',{state:snapshotCharacterState()});

    const params=new URLSearchParams(location.search);
    const autoVisual=params.get('autovisual');
    if(autoVisual) {
      const group=autoVisual==='1'?'hair':autoVisual;
      const autoExport=params.get('autoexport')==='1';
      setTimeout(()=>runQaSelection(group,{autoExport}),250);
    }

  } catch(err) {
    console.error(err);
    setStatus(`ERRORE AVVIO CAMERINO V2.13.6\n${err.message}`,'bad');
  }
}

skinSelect.addEventListener('change',()=>{
  currentSkin=skinSelect.value||null;
  updateSkinDescription();
  rebuildAll(false);
});

E('applyMask').addEventListener('change',()=>rebuildAll(false));
E('showBody').addEventListener('change',syncVisibility);
E('showProxies').addEventListener('change',syncVisibility);


E('front').onclick=()=>setCameraView('full',{smooth:true});
E('back').onclick=()=>setCameraView('profile',{smooth:true});
E('fit').onclick=()=>setCameraView(currentCameraView||'full',{smooth:true});
E('presetComplete').onclick=resetCompletePreset;
E('clearWardrobe').onclick=clearWardrobe;
E('randomComplete').onclick=randomizeComplete;

E('qaRun').onclick=()=>runQaSelection(E('qaGroup').value||'all');
E('qaCancel').onclick=()=>{ visualAuditCancelRequested=true; };
E('qaExport').onclick=exportVisualAudit;

bindColorCustomizer();
bindEditorShell();

init();

/* ============================================================
   ADF_MAKEHUMAN_PRESETS_V1
   14 preset MakeHuman:
   - 7 uomo
   - 7 donna
   Cambiano: sesso, shape, modifier, pelle, capelli, vestiti.
   Non toccano accessori. Gli slider restano poi modificabili.
   ============================================================ */

/* ADF_MAKEHUMAN_PRESETS_FACE_PROFILES_V5 · ADF_MAKEHUMAN_PRESETS_FACE_IDENTITY_V6
   14 identità facciali volutamente differenziate.
   I valori continuano a pilotare gli slider MakeHuman reali
   e restano modificabili manualmente dopo il preset. */
const ADF_MH_PRESETS = [
  {
    id:'uomo-affilato',
    gender:'male',
    label:'Affilato',
    blurb:'Lineamenti netti, fisico asciutto, look urbano.',
    skin:['olive','light','tan'],
    hair:['fade','short','crop','undercut','buzz'],
    facialHair:{patterns:['stubble','goatee','short beard','beard'],allowEmpty:false},
    wardrobe:{
      tops:{patterns:['hood','hoodie','jacket','shirt','tee','t-shirt'],allowEmpty:false},
      bottoms:{patterns:['jean','pants','trouser','cargo'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['sneaker','boot','trainer'],allowEmpty:false},
      outerwear:{patterns:['bomber','jacket','coat'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.28,height:.64,weight:.34,muscle:.42,jawWidth:.82,chinSize:.74,cheekFullness:.14,noseWidth:.3,noseLength:.72,eyeSize:.38,browProminence:.76,lipFullness:.26,shoulder:.58,waist:.42,hip:.34,faceRoundness:.1,neck:.46,headWidth:.32,headHeight:.62,headDepth:.36,foreheadHeight:.66,foreheadProjection:.58,eyeSpacing:.6,eyeVertical:.5,eyeCorner:.7,browHeight:.42,browAngle:.7,cheekHeight:.78,chinProminence:.76,noseDepth:.62,noseTip:.6,noseCurve:.56,mouthWidth:.42,mouthHeight:.32,headSquare:.42,headOval:.62}
  },
  {
    id:'uomo-atletico',
    gender:'male',
    label:'Atletico',
    blurb:'Corpo tonico, spalle aperte, volto energico.',
    skin:['tan','olive','light'],
    hair:['short','crew','fade','sport'],
    facialHair:{patterns:['stubble','short beard'],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['tank','tee','t-shirt','hoodie','sweat'],allowEmpty:false},
      bottoms:{patterns:['jogger','sport','track','pants','short'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['sneaker','trainer','running'],allowEmpty:false},
      outerwear:{patterns:['hoodie','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.26,height:.66,weight:.48,muscle:.76,jawWidth:.68,chinSize:.58,cheekFullness:.28,noseWidth:.44,noseLength:.48,eyeSize:.46,browProminence:.62,lipFullness:.36,shoulder:.72,waist:.40,hip:.36,faceRoundness:.26,neck:.62,headWidth:.56,headHeight:.54,headDepth:.56,foreheadHeight:.54,foreheadProjection:.54,eyeSpacing:.52,eyeVertical:.5,eyeCorner:.56,browHeight:.48,browAngle:.56,cheekHeight:.6,chinProminence:.6,noseDepth:.52,noseTip:.52,noseCurve:.48,mouthWidth:.56,mouthHeight:.44,headSquare:.46,headOval:.34}
  },
  {
    id:'uomo-robusto',
    gender:'male',
    label:'Robusto',
    blurb:'Corporatura solida, guance più piene, presenza forte.',
    skin:['olive','tan','brown'],
    hair:['short','wavy','messy','medium'],
    facialHair:{patterns:['beard','full beard','short beard'],allowEmpty:false},
    wardrobe:{
      tops:{patterns:['flannel','shirt','tee','t-shirt','jacket'],allowEmpty:false},
      bottoms:{patterns:['jean','cargo','pants'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['boot','sneaker'],allowEmpty:false},
      outerwear:{patterns:['jacket','coat'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.42,height:.56,weight:.70,muscle:.58,jawWidth:.76,chinSize:.64,cheekFullness:.76,noseWidth:.64,noseLength:.46,eyeSize:.36,browProminence:.58,lipFullness:.42,shoulder:.68,waist:.58,hip:.44,faceRoundness:.78,neck:.7,headWidth:.74,headHeight:.44,headDepth:.72,foreheadHeight:.46,foreheadProjection:.58,eyeSpacing:.44,eyeVertical:.47,eyeCorner:.4,browHeight:.42,browAngle:.46,cheekHeight:.44,chinProminence:.7,noseDepth:.66,noseTip:.42,noseCurve:.6,mouthWidth:.66,mouthHeight:.46,headSquare:.72,headOval:.12}
  },
  {
    id:'uomo-slanciato',
    gender:'male',
    label:'Slanciato',
    blurb:'Più alto, asciutto e con linee eleganti.',
    skin:['light','olive','tan'],
    hair:['medium','swept','wavy','side'],
    facialHair:{patterns:['goatee','stubble'],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['shirt','blazer','coat','jacket'],allowEmpty:false},
      bottoms:{patterns:['trouser','pants','slim','jean'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['boot','shoe','sneaker'],allowEmpty:false},
      outerwear:{patterns:['coat','jacket','blazer'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.34,height:.78,weight:.28,muscle:.34,jawWidth:.44,chinSize:.62,cheekFullness:.12,noseWidth:.24,noseLength:.78,eyeSize:.48,browProminence:.44,lipFullness:.32,shoulder:.50,waist:.34,hip:.32,faceRoundness:.08,neck:.38,headWidth:.22,headHeight:.76,headDepth:.3,foreheadHeight:.72,foreheadProjection:.48,eyeSpacing:.64,eyeVertical:.54,eyeCorner:.62,browHeight:.54,browAngle:.54,cheekHeight:.74,chinProminence:.62,noseDepth:.58,noseTip:.62,noseCurve:.52,mouthWidth:.36,mouthHeight:.36,headSquare:.08,headOval:.86}
  },
  {
    id:'uomo-giovane',
    gender:'male',
    label:'Giovane',
    blurb:'Tratti freschi, occhi un po’ più grandi, street casual.',
    skin:['light','olive','tan'],
    hair:['short','messy','fringe','crop'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['hoodie','tee','t-shirt','sweat'],allowEmpty:false},
      bottoms:{patterns:['jogger','jean','pants'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['sneaker','trainer'],allowEmpty:false},
      outerwear:{patterns:['hoodie','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.18,height:.58,weight:.32,muscle:.34,jawWidth:.28,chinSize:.26,cheekFullness:.52,noseWidth:.24,noseLength:.3,eyeSize:.78,browProminence:.3,lipFullness:.56,shoulder:.46,waist:.36,hip:.34,faceRoundness:.6,neck:.34,headWidth:.44,headHeight:.46,headDepth:.48,foreheadHeight:.68,foreheadProjection:.42,eyeSpacing:.6,eyeVertical:.6,eyeCorner:.64,browHeight:.62,browAngle:.46,cheekHeight:.56,chinProminence:.24,noseDepth:.32,noseTip:.6,noseCurve:.38,mouthWidth:.54,mouthHeight:.62,headSquare:.06,headOval:.38}
  },
  {
    id:'uomo-maturo',
    gender:'male',
    label:'Maturo',
    blurb:'Età più adulta, volto definito, outfit più pulito.',
    skin:['olive','tan','light'],
    hair:['short','classic','comb','side'],
    facialHair:{patterns:['short beard','beard','goatee'],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['shirt','polo','knit','jacket'],allowEmpty:false},
      bottoms:{patterns:['trouser','pants','chino','jean'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['shoe','boot','loafer'],allowEmpty:false},
      outerwear:{patterns:['coat','jacket','blazer'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.62,height:.58,weight:.44,muscle:.40,jawWidth:.7,chinSize:.76,cheekFullness:.24,noseWidth:.52,noseLength:.78,eyeSize:.28,browProminence:.74,lipFullness:.24,shoulder:.56,waist:.48,hip:.36,faceRoundness:.22,neck:.56,headWidth:.58,headHeight:.6,headDepth:.64,foreheadHeight:.5,foreheadProjection:.66,eyeSpacing:.46,eyeVertical:.42,eyeCorner:.42,browHeight:.36,browAngle:.62,cheekHeight:.64,chinProminence:.82,noseDepth:.74,noseTip:.44,noseCurve:.72,mouthWidth:.48,mouthHeight:.28,headSquare:.6,headOval:.36}
  },
  {
    id:'uomo-massiccio',
    gender:'male',
    label:'Massiccio',
    blurb:'Spalle ampie, collo più spesso, fisico grande.',
    skin:['brown','tan','olive'],
    hair:['buzz','short','crew'],
    facialHair:{patterns:['full beard','beard','short beard'],allowEmpty:false},
    wardrobe:{
      tops:{patterns:['hoodie','jacket','tee','t-shirt'],allowEmpty:false},
      bottoms:{patterns:['cargo','pants','jean'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['boxer','brief'],allowEmpty:true},
      shoes:{patterns:['boot','sneaker'],allowEmpty:false},
      outerwear:{patterns:['jacket','coat'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.46,height:.60,weight:.82,muscle:.82,jawWidth:.92,chinSize:.84,cheekFullness:.7,noseWidth:.76,noseLength:.44,eyeSize:.24,browProminence:.8,lipFullness:.34,shoulder:.82,waist:.62,hip:.44,faceRoundness:.66,neck:.88,headWidth:.88,headHeight:.38,headDepth:.84,foreheadHeight:.4,foreheadProjection:.68,eyeSpacing:.4,eyeVertical:.44,eyeCorner:.34,browHeight:.34,browAngle:.72,cheekHeight:.38,chinProminence:.92,noseDepth:.82,noseTip:.36,noseCurve:.64,mouthWidth:.74,mouthHeight:.4,headSquare:.92,headOval:.04}
  },

  {
    id:'donna-affilata',
    gender:'female',
    label:'Affilata',
    blurb:'Tratti fini, silhouette asciutta, look deciso.',
    skin:['light','olive','tan'],
    hair:['bob','straight','long','sleek'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['top','blouse','shirt','crop'],allowEmpty:false},
      bottoms:{patterns:['pants','trouser','skirt','jean'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['boot','heel','shoe'],allowEmpty:false},
      outerwear:{patterns:['jacket','coat'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.30,height:.66,weight:.28,muscle:.32,cheekFullness:.1,jawWidth:.2,chinSize:.44,noseWidth:.18,noseLength:.66,eyeSize:.66,browProminence:.54,lipFullness:.58,waist:.24,hip:.58,shoulder:.34,bust:.48,faceRoundness:.08,neck:.28,headWidth:.2,headHeight:.7,headDepth:.3,foreheadHeight:.72,foreheadProjection:.48,eyeSpacing:.64,eyeVertical:.56,eyeCorner:.74,browHeight:.58,browAngle:.68,cheekHeight:.82,chinProminence:.5,noseDepth:.42,noseTip:.64,noseCurve:.38,mouthWidth:.42,mouthHeight:.46,headSquare:.04,headOval:.78}
  },
  {
    id:'donna-atletica',
    gender:'female',
    label:'Atletica',
    blurb:'Fisico tonico, postura energica, abbigliamento sportivo.',
    skin:['tan','olive','light'],
    hair:['ponytail','sport','short','braid'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['tank','top','hoodie','tee','t-shirt'],allowEmpty:false},
      bottoms:{patterns:['legging','jogger','sport','pants','short'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['sneaker','trainer','running'],allowEmpty:false},
      outerwear:{patterns:['hoodie','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.28,height:.64,weight:.40,muscle:.66,cheekFullness:.26,jawWidth:.42,chinSize:.48,noseWidth:.32,noseLength:.46,eyeSize:.52,browProminence:.52,lipFullness:.44,waist:.30,hip:.52,shoulder:.46,bust:.42,faceRoundness:.22,neck:.44,headWidth:.44,headHeight:.56,headDepth:.48,foreheadHeight:.58,foreheadProjection:.5,eyeSpacing:.54,eyeVertical:.54,eyeCorner:.58,browHeight:.52,browAngle:.56,cheekHeight:.64,chinProminence:.48,noseDepth:.48,noseTip:.56,noseCurve:.44,mouthWidth:.54,mouthHeight:.48,headSquare:.24,headOval:.46}
  },
  {
    id:'donna-morbida',
    gender:'female',
    label:'Morbida',
    blurb:'Linee più dolci, volto pieno, presenza delicata.',
    skin:['light','tan','olive'],
    hair:['wavy','curly','long','soft'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['blouse','knit','top'],allowEmpty:false},
      bottoms:{patterns:['skirt','pants','jean'],allowEmpty:true},
      dresses:{patterns:['dress'],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['boot','flat','shoe','heel'],allowEmpty:false},
      outerwear:{patterns:['cardigan','coat','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.36,height:.54,weight:.58,muscle:.26,cheekFullness:.82,jawWidth:.28,chinSize:.3,noseWidth:.42,noseLength:.36,eyeSize:.64,browProminence:.3,lipFullness:.74,waist:.40,hip:.68,shoulder:.34,bust:.60,faceRoundness:.86,neck:.34,headWidth:.64,headHeight:.4,headDepth:.68,foreheadHeight:.52,foreheadProjection:.4,eyeSpacing:.5,eyeVertical:.6,eyeCorner:.54,browHeight:.6,browAngle:.42,cheekHeight:.42,chinProminence:.28,noseDepth:.38,noseTip:.58,noseCurve:.34,mouthWidth:.62,mouthHeight:.68,headSquare:.02,headOval:.24}
  },
  {
    id:'donna-slanciata',
    gender:'female',
    label:'Slanciata',
    blurb:'Più alta e longilinea, look pulito e verticale.',
    skin:['olive','light','tan'],
    hair:['long','straight','side','sleek'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['blouse','shirt','top','coat'],allowEmpty:false},
      bottoms:{patterns:['trouser','pants','slim'],allowEmpty:false},
      dresses:{patterns:['dress'],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['heel','boot','shoe'],allowEmpty:false},
      outerwear:{patterns:['coat','jacket','blazer'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.34,height:.80,weight:.26,muscle:.24,cheekFullness:.08,jawWidth:.16,chinSize:.42,noseWidth:.16,noseLength:.76,eyeSize:.56,browProminence:.46,lipFullness:.42,waist:.22,hip:.50,shoulder:.32,bust:.42,faceRoundness:.06,neck:.24,headWidth:.16,headHeight:.82,headDepth:.26,foreheadHeight:.76,foreheadProjection:.48,eyeSpacing:.66,eyeVertical:.56,eyeCorner:.7,browHeight:.56,browAngle:.62,cheekHeight:.78,chinProminence:.44,noseDepth:.46,noseTip:.66,noseCurve:.42,mouthWidth:.36,mouthHeight:.44,headSquare:.02,headOval:.92}
  },
  {
    id:'donna-giovane',
    gender:'female',
    label:'Giovane',
    blurb:'Tratti freschi, occhi un po’ più grandi, casual moderno.',
    skin:['light','olive','tan'],
    hair:['ponytail','bob','messy','fringe','long'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['hoodie','tee','t-shirt','top','crop'],allowEmpty:false},
      bottoms:{patterns:['jean','skirt','jogger','pants'],allowEmpty:false},
      dresses:{patterns:[],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['sneaker','shoe','boot'],allowEmpty:false},
      outerwear:{patterns:['hoodie','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.18,height:.58,weight:.28,muscle:.22,cheekFullness:.5,jawWidth:.12,chinSize:.22,noseWidth:.16,noseLength:.26,eyeSize:.84,browProminence:.26,lipFullness:.68,waist:.28,hip:.54,shoulder:.30,bust:.38,faceRoundness:.58,neck:.24,headWidth:.4,headHeight:.46,headDepth:.44,foreheadHeight:.72,foreheadProjection:.38,eyeSpacing:.62,eyeVertical:.64,eyeCorner:.68,browHeight:.64,browAngle:.5,cheekHeight:.56,chinProminence:.2,noseDepth:.28,noseTip:.66,noseCurve:.3,mouthWidth:.52,mouthHeight:.7,headSquare:.01,headOval:.34}
  },
  {
    id:'donna-matura',
    gender:'female',
    label:'Matura',
    blurb:'Età più adulta, lineamenti composti, outfit più sobrio.',
    skin:['tan','olive','light'],
    hair:['medium','wavy','classic','long'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['blouse','shirt','knit'],allowEmpty:false},
      bottoms:{patterns:['trouser','pants','skirt'],allowEmpty:false},
      dresses:{patterns:['dress'],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['shoe','boot','heel'],allowEmpty:false},
      outerwear:{patterns:['coat','cardigan','jacket'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.64,height:.56,weight:.46,muscle:.24,cheekFullness:.28,jawWidth:.4,chinSize:.56,noseWidth:.44,noseLength:.72,eyeSize:.32,browProminence:.6,lipFullness:.34,waist:.36,hip:.56,shoulder:.34,bust:.50,faceRoundness:.24,neck:.42,headWidth:.5,headHeight:.62,headDepth:.6,foreheadHeight:.52,foreheadProjection:.62,eyeSpacing:.48,eyeVertical:.42,eyeCorner:.44,browHeight:.38,browAngle:.62,cheekHeight:.62,chinProminence:.64,noseDepth:.66,noseTip:.46,noseCurve:.68,mouthWidth:.48,mouthHeight:.36,headSquare:.3,headOval:.5}
  },
  {
    id:'donna-formosa',
    gender:'female',
    label:'Formosa',
    blurb:'Curve più marcate, volto pieno, stile deciso.',
    skin:['brown','tan','olive'],
    hair:['curly','wavy','long','braid'],
    facialHair:{patterns:[],allowEmpty:true},
    wardrobe:{
      tops:{patterns:['top','blouse','shirt'],allowEmpty:true},
      bottoms:{patterns:['skirt','pants','jean'],allowEmpty:true},
      dresses:{patterns:['dress'],allowEmpty:true},
      underwear:{patterns:['bra','brief','underwear'],allowEmpty:true},
      shoes:{patterns:['heel','boot','shoe'],allowEmpty:false},
      outerwear:{patterns:['jacket','coat'],allowEmpty:true},
      clothesOther:{patterns:[],allowEmpty:true}
    },
    mods:{age:.40,height:.56,weight:.66,muscle:.28,cheekFullness:.78,jawWidth:.34,chinSize:.4,noseWidth:.54,noseLength:.42,eyeSize:.58,browProminence:.36,lipFullness:.82,waist:.34,hip:.76,shoulder:.36,bust:.72,faceRoundness:.78,neck:.4,headWidth:.7,headHeight:.42,headDepth:.72,foreheadHeight:.48,foreheadProjection:.42,eyeSpacing:.46,eyeVertical:.58,eyeCorner:.52,browHeight:.56,browAngle:.44,cheekHeight:.44,chinProminence:.32,noseDepth:.46,noseTip:.54,noseCurve:.38,mouthWidth:.7,mouthHeight:.74,headSquare:.06,headOval:.2}
  }
];

const ADF_MH_SEMANTIC_PATTERNS = {
  age:[['age'],['old'],['young']],
  height:[['height'],['stature']],
  weight:[['weight'],['fat']],
  muscle:[['muscle'],['muscular']],
  bust:[['breast'],['bust'],['chest']],
  jawWidth:[['jaw','width'],['mandible','width'],['jaw']],
  chinSize:[['chin'],['menton']],
  cheekFullness:[['cheek'],['cheekbone']],
  noseWidth:[['nose','width']],
  noseLength:[['nose','length'],['nose','size']],
  eyeSize:[['eye','size'],['eyes']],
  browProminence:[['brow'],['eyebrow']],
  lipFullness:[['lip'],['mouth']],
  shoulder:[['shoulder']],
  waist:[['waist']],
  hip:[['hip'],['pelvis']],
  neck:[['neck']],
  faceRoundness:[['round'],['roundness'],['face','shape']]
};

function adfMhDelay(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}
function adfMhNorm(value){
  return String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim();
}
function adfMhMetaText(meta){
  return adfMhNorm([
    meta?.fullName,
    meta?.uiGroup,
    meta?.uiLabel,
    meta?.group,
    meta?.rawGroup
  ].filter(Boolean).join(' '));
}
function adfMhMatchesAny(text,patterns){
  const hay=adfMhNorm(text);
  if(!hay || !Array.isArray(patterns) || !patterns.length) return false;
  return patterns.some(pattern=>{
    if(Array.isArray(pattern)){
      return pattern.every(token=>hay.includes(adfMhNorm(token)));
    }
    return hay.includes(adfMhNorm(pattern));
  });
}
function adfMhPickOptionValue(select,patterns,{allowEmpty=false}={}){
  if(!select) return '';
  const options=[...select.options];
  if(allowEmpty){
    const empty=options.find(o=>!String(o.value||'').trim());
    if(empty && (!patterns || !patterns.length)) return empty.value;
  }
  const nonEmpty=options.filter(o=>String(o.value||'').trim());
  const match=nonEmpty.find(o=>{
    const hay=`${o.value} ${o.textContent||''}`;
    return adfMhMatchesAny(hay,patterns||[]);
  });
  if(match) return match.value;
  if(allowEmpty && (!patterns || !patterns.length)){
    const empty=options.find(o=>!String(o.value||'').trim());
    if(empty) return empty.value;
  }
  return nonEmpty[0]?.value||'';
}
function adfMhPickEntryRaw(uiGroup,patterns,{allowEmpty=false}={}){
  const entries=typeof entriesForUiGroup==='function' ? entriesForUiGroup(uiGroup) : [];
  if(!Array.isArray(entries) || !entries.length){
    return allowEmpty ? '' : '';
  }
  const match=entries.find(entry=>{
    const hay=[entry?.raw,entry?.label,entry?.name,entry?.displayName].filter(Boolean).join(' ');
    return adfMhMatchesAny(hay,patterns||[]);
  });
  if(match) return match.raw||'';
  return allowEmpty ? '' : (entries[0]?.raw||'');
}
function adfMhMapNormalizedToMeta(meta,normalized){
  const min=Number(meta?.min);
  const max=Number(meta?.max);
  const lo=Number.isFinite(min) ? min : 0;
  const hi=Number.isFinite(max) ? max : 1;
  const n=Math.max(0,Math.min(1,Number(normalized)));
  return lo + ((hi-lo)*n);
}
function adfMhApplySemantic(modifiers,key,normalized){
  const patterns=ADF_MH_SEMANTIC_PATTERNS[key];
  if(!patterns || !Array.isArray(nativeModifierMeta)) return 0;
  let count=0;
  for(const meta of nativeModifierMeta){
    const text=adfMhMetaText(meta);
    if(!adfMhMatchesAny(text,patterns)) continue;
    modifiers[meta.fullName]=adfMhMapNormalizedToMeta(meta,normalized);
    count++;
  }
  return count;
}
function adfMhSetSkinFromPatterns(state,preset){
  const select=(typeof skinSelect!=='undefined' && skinSelect) ? skinSelect : document.querySelector('#skinSelect, select[id*="skin"]');
  if(!select) return;
  const value=adfMhPickOptionValue(select,preset.skin||[],{allowEmpty:false});
  if(value){
    select.value=value;
    state.skin=value;
  }
}
function adfMhSetNonWardrobeSlots(state,preset){
  state.slots=state.slots||{};
  const slotPatterns={
    hair:preset.hair||[],
    facialHair:(preset.facialHair?.patterns)||[]
  };
  for(const [slotId,patterns] of Object.entries(slotPatterns)){
    const select=(typeof E==='function' ? E(`slot-${slotId}`) : null) || document.getElementById(`slot-${slotId}`);
    if(!select) continue;
    const value=adfMhPickOptionValue(
      select,
      patterns,
      {allowEmpty:Boolean(preset.facialHair?.allowEmpty && slotId==='facialHair')}
    );
    select.value=value;
    state.slots[slotId]=value;
  }
}
function adfMhSetClothingSlots(state,preset){
  state.slots=state.slots||{};
  if(!Array.isArray(SLOT_DEFS)) return;
  for(const def of SLOT_DEFS){
    if(!WARDROBE_SLOT_SET?.has(def.id)) continue;
    if(!['tops','bottoms','dresses','underwear','shoes','outerwear','clothesOther'].includes(def.uiGroup)) continue;
    const rule=preset.wardrobe?.[def.uiGroup];
    if(!rule) continue;
    const raw=adfMhPickEntryRaw(def.uiGroup,rule.patterns||[],{allowEmpty:Boolean(rule.allowEmpty)});
    state.slots[def.id]=raw;
  }
}
async function adfMhSwitchGender(gender){
  const buttons=[...document.querySelectorAll('.gender-quick button')];
  if(!buttons.length) return false;
  const want=gender==='female' ? ['donna','femmina','female'] : ['uomo','maschio','male'];
  const btn=buttons.find(button=>{
    const text=adfMhNorm(button.textContent||'');
    return want.some(token=>text.includes(token));
  });
  if(!btn) return false;
  if(!btn.classList.contains('active')){
    btn.click();
    await adfMhDelay(260);
  }
  return true;
}
function adfMhBaseState(){
  const snapshot=typeof snapshotCharacterState==='function'
    ? snapshotCharacterState()
    : {schema:'adf.makehuman.character.v2',slots:{},modifiers:{},customTargets:{},appearanceColors:{}};

  return {
    schema:snapshot?.schema||'adf.makehuman.character.v2',
    slots:{...(snapshot?.slots||{})},
    skin:snapshot?.skin||'',
    modifiers:{...((nativeModifierDefaults && Object.keys(nativeModifierDefaults).length) ? nativeModifierDefaults : (snapshot?.modifiers||{}))},
    customTargets:{},
    appearanceColors:{...(snapshot?.appearanceColors||{})}
  };
}
async function adfMhApplyPreset(presetId){
  /* ADF_MAKEHUMAN_PRESETS_INPLACE_V4
     I preset vengono applicati NELLA sessione corrente.
     Niente restoreCharacterState(): quello è un restore completo
     e può riportare temporaneamente l'editor allo stato iniziale. */
  const preset=ADF_MH_PRESETS.find(p=>p.id===presetId);
  if(!preset || !runtimeReady || !nativeEngineReady) return;

  const sectionBefore=currentEditorSection;
  const cameraBefore=currentCameraView;

  adfMhSetPresetStatus(`Applico preset "${preset.label}"…`,'info');
  adfMhSetPresetButtonsEnabled(false);

  try{
    const state=adfMhBaseState();

    state.modifiers={
      ...(state.modifiers||{}),
      'macrodetails/Gender':preset.gender==='female' ? 0 : 1
    };

    adfMhSetSkinFromPatterns(state,preset);
    adfMhSetNonWardrobeSlots(state,preset);
    adfMhSetClothingSlots(state,preset);

    for(const [key,value] of Object.entries(preset.mods||{})){
      adfMhApplySemantic(state.modifiers,key,value);
    }

    /*
      Applichiamo gli slot normali direttamente ai select correnti.
      Non tocchiamo sezione, navigazione o lifecycle del camerino.
    */
    for(const def of SLOT_DEFS){
      if(WARDROBE_SLOT_SET.has(def.id)) continue;

      const select=E(`slot-${def.id}`);
      const value=state.slots?.[def.id];

      if(
        select &&
        typeof value==='string' &&
        [...select.options].some(o=>o.value===value)
      ){
        select.value=value;
      }
    }

    /*
      Il guardaroba usa la sua API esistente: stessa logica degli
      slider/select manuali, senza ripristinare l'intero personaggio.
    */
    applyWardrobeSelections(state.slots||{},{notify:false});

    if(
      typeof state.skin==='string' &&
      skinSelect &&
      [...skinSelect.options].some(o=>o.value===state.skin)
    ){
      skinSelect.value=state.skin;
      currentSkin=state.skin||null;
    }

    /*
      Un solo set-many al motore MakeHuman.
      È l'unica operazione morfologica del preset.
    */
    await requestNativeModifiers(state.modifiers);

    if(typeof syncGenderQuick==='function') syncGenderQuick();
    if(typeof syncModifierControls==='function') syncModifierControls();

    /*
      Il click sul preset non può cambiare pagina/sezione/camera.
      Manteniamo esplicitamente il contesto in cui l'utente si trovava.
    */
    if(
      sectionBefore &&
      typeof setEditorSection==='function'
    ){
      setEditorSection(sectionBefore,{autoFrame:false});
    }

    if(
      cameraBefore &&
      typeof setCameraView==='function'
    ){
      setCameraView(cameraBefore,{smooth:false});
    }

    if(typeof applyVisualCenter==='function') applyVisualCenter();

    adfMhSetPresetStatus(`Preset applicato: ${preset.label}`,'ok');

  }catch(err){
    console.error('[ADF PRESET]',err);
    adfMhSetPresetStatus(
      `Errore preset: ${err?.message||'sconosciuto'}`,
      'bad'
    );
  }finally{
    adfMhSetPresetButtonsEnabled(true);
  }
}

function adfMhInjectPresetStyles(){
  if(document.getElementById('adf-mh-presets-style')) return;
  const style=document.createElement('style');
  style.id='adf-mh-presets-style';
  style.textContent=`
    .adf-mh-preset-box{
      margin-top:12px;
    }
    .adf-mh-preset-head{
      margin:0 0 10px;
      color:#eee7dd;
      font-size:13px;
      line-height:1.45;
    }
    .adf-mh-preset-note{
      margin:0 0 12px;
      color:#b9b1a7;
      font-size:11.5px;
      line-height:1.55;
    }
    .adf-mh-preset-group{
      margin-top:12px;
      padding-top:12px;
      border-top:1px solid rgba(255,255,255,.08);
    }
    .adf-mh-preset-group:first-of-type{
      margin-top:0;
      padding-top:0;
      border-top:0;
    }
    .adf-mh-preset-group h3{
      margin:0 0 8px;
      color:#f3d9a6;
      font-size:10px;
      letter-spacing:.08em;
      text-transform:uppercase;
    }
    .adf-mh-preset-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:8px;
    }
    .adf-mh-preset-btn{
      appearance:none;
      width:100%;
      min-height:54px;
      padding:10px 11px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:12px;
      background:rgba(255,255,255,.04);
      color:#eee7dd;
      text-align:left;
      cursor:pointer;
    }
    .adf-mh-preset-btn:hover{
      border-color:rgba(211,170,94,.5);
      background:rgba(243,217,166,.08);
    }
    .adf-mh-preset-btn strong{
      display:block;
      font-size:11.5px;
      line-height:1.25;
    }
    .adf-mh-preset-btn span{
      display:block;
      margin-top:4px;
      color:#b9b1a7;
      font-size:10px;
      line-height:1.35;
    }
    .adf-mh-preset-status{
      margin-top:10px;
      color:#b9b1a7;
      font-size:11px;
      line-height:1.45;
      min-height:16px;
    }
    .adf-mh-preset-status[data-tone="ok"]{ color:#d9c089; }
    .adf-mh-preset-status[data-tone="bad"]{ color:#e39a9a; }
  `;
  document.head.appendChild(style);
}
function adfMhSetPresetStatus(message,tone='info'){
  const el=document.getElementById('adf-mh-preset-status');
  if(el){
    el.textContent=message||'';
    el.dataset.tone=tone;
  }
  if(typeof setStatus==='function' && tone==='bad'){
    setStatus(message||'Errore preset','bad');
  }
}
function adfMhSetPresetButtonsEnabled(enabled){
  document.querySelectorAll('.adf-mh-preset-btn').forEach(button=>{
    button.disabled=!enabled;
    button.style.opacity=enabled ? '1' : '.65';
    button.style.cursor=enabled ? 'pointer' : 'wait';
  });
}
function adfMhPresetButtonHtml(preset){
  return `
    <button type="button" class="adf-mh-preset-btn" data-preset-id="${preset.id}">
      <strong>${preset.label}</strong>
      <span>${preset.blurb}</span>
    </button>
  `;
}
function adfMhBuildPresetBox(){
  if(document.getElementById('adf-mh-preset-box')) return document.getElementById('adf-mh-preset-box');

  const male=ADF_MH_PRESETS.filter(p=>p.gender==='male');
  const female=ADF_MH_PRESETS.filter(p=>p.gender==='female');

  const box=document.createElement('div');
  box.id='adf-mh-preset-box';
  box.className='box adf-mh-preset-box';
  box.innerHTML=`
    <h2>Preset rapidi</h2>
    <p class="adf-mh-preset-head">14 preset base: 7 uomo + 7 donna.</p>
    <p class="adf-mh-preset-note">Impostano volto, corpo, pelle, capelli e vestiti. Gli accessori non vengono toccati e tutto resta modificabile a mano.</p>

    <div class="adf-mh-preset-group">
      <h3>Uomo</h3>
      <div class="adf-mh-preset-grid">${male.map(adfMhPresetButtonHtml).join('')}</div>
    </div>

    <div class="adf-mh-preset-group">
      <h3>Donna</h3>
      <div class="adf-mh-preset-grid">${female.map(adfMhPresetButtonHtml).join('')}</div>
    </div>

    <div id="adf-mh-preset-status" class="adf-mh-preset-status"></div>
  `;

  box.addEventListener('click',ev=>{
    const button=ev.target.closest?.('.adf-mh-preset-btn');
    if(!button) return;

    ev.preventDefault();
    ev.stopPropagation();

    const presetId=button.getAttribute('data-preset-id');
    void adfMhApplyPreset(presetId);
  });

  return box;
}
function adfMhMountPresetBox(){
  if(document.getElementById('adf-mh-preset-box')) return true;

  adfMhInjectPresetStyles();

  const genderQuick=document.querySelector('.gender-quick');
  const anchorBox=genderQuick ? genderQuick.closest('.box') : null;
  const box=adfMhBuildPresetBox();

  if(anchorBox){
    anchorBox.insertAdjacentElement('afterend',box);
    return true;
  }

  const identityFallback=
    document.querySelector('.editor-scroll') ||
    document.querySelector('.editor-sidebar');

  if(identityFallback){
    identityFallback.prepend(box);
    return true;
  }

  return false;
}
function adfMhInitPresets(){
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    const mounted=adfMhMountPresetBox();
    if(mounted || attempts>=20){
      clearInterval(timer);
    }
  },220);
}

document.addEventListener('DOMContentLoaded',adfMhInitPresets);



/* ============================================================
   ADF_MAKEHUMAN_PRESETS_SAFE_V2

   Hardening artistico dei preset:
   - niente matching fuzzy sugli asset;
   - niente fallback al primo asset disponibile;
   - niente modifica massiva dei modifier facciali;
   - solo macro MakeHuman note e stabili;
   - capelli + top/bottom deterministici;
   - barba rimossa automaticamente;
   - scarpe/outerwear/dress/clothesOther azzerati per evitare
     combinazioni incompatibili della V1;
   - accessori NON toccati.
   ============================================================ */

const ADF_MH_PRESET_SAFE_ASSETS_V2 = Object.freeze({

  'uomo-affilato': {
    hair:'hair/short01/short01.json',
    tops:'clothes/mens_shirt_untuck_elvbhp1f/mens_shirt_untuck_elvbhp1f.json',
    bottoms:'clothes/mens_elv_jeans2slf/mens_elv_jeans2slf.json'
  },

  'uomo-atletico': {
    hair:'hair/short02/short02.json',
    tops:'clothes/mens_tanks_elvmuscle1f/mens_tanks_elvmuscle1f.json',
    bottoms:'clothes/mens_elv_jeans1f/mens_elv_jeans1f.json'
  },

  'uomo-robusto': {
    hair:'hair/short_messy/short_messy.json',
    tops:'clothes/mens_boho_top1elv/mens_boho_top1elv.json',
    bottoms:'clothes/male-classic-jeans/male-classic-jeans.json'
  },

  'uomo-slanciato': {
    hair:'hair/maxwell_hair_mh/maxwell_hair_mh.json',
    tops:'clothes/mens_shirt_untuck_elvbhp1f/mens_shirt_untuck_elvbhp1f.json',
    bottoms:'clothes/mens_trouser_f_elv_chr/mens_trouser_f_elv_chr.json'
  },

  'uomo-giovane': {
    hair:'hair/short03/short03.json',
    tops:'clothes/mens_tanks_elv1f/mens_tanks_elv1f.json',
    bottoms:'clothes/mens_elv_jeans2slf/mens_elv_jeans2slf.json'
  },

  'uomo-maturo': {
    hair:'hair/mhair02/mhair02.json',
    tops:'clothes/mens_boho_top1elv/mens_boho_top1elv.json',
    bottoms:'clothes/mens_trouser_f_elv1/mens_trouser_f_elv1.json'
  },

  'uomo-massiccio': {
    hair:'hair/short04/short04.json',
    tops:'clothes/mens_tanks_elvmuscle1f/mens_tanks_elvmuscle1f.json',
    bottoms:'clothes/male-classic-jeans/male-classic-jeans.json'
  },


  'donna-affilata': {
    hair:'hair/bob01/bob01.json',
    tops:'clothes/Rolled_neck_blouse/Rolled_neck_blouse.json',
    bottoms:'clothes/Tightjeans/Tightjeans.json'
  },

  'donna-atletica': {
    hair:'hair/ponytail01/ponytail01.json',
    tops:'clothes/Sleeveless/Sleeveless.json',
    bottoms:'clothes/Tightjeans/Tightjeans.json'
  },

  'donna-morbida': {
    hair:'hair/curly/curly.json',
    tops:'clothes/lace_up_blouse/lace_up_blouse.json',
    bottoms:'clothes/Skirt_Full_Long/Skirt_Full_Long.json'
  },

  'donna-slanciata': {
    hair:'hair/long01/long01.json',
    tops:'clothes/Rolled_neck_blouse/Rolled_neck_blouse.json',
    bottoms:'clothes/Tightjeans/Tightjeans.json'
  },

  'donna-giovane': {
    hair:'hair/bob02/bob02.json',
    tops:'clothes/SleevelessCropTop/SleevelessCropTop.json',
    bottoms:'clothes/JeansSkirt/JeansSkirt.json'
  },

  'donna-matura': {
    hair:'hair/frenchbraid1mh01/frenchbraid1mh01.json',
    tops:'clothes/lace_up_blouse/lace_up_blouse.json',
    bottoms:'clothes/Skirt_Full_Long/Skirt_Full_Long.json'
  },

  'donna-formosa': {
    hair:'hair/curly2/curly2.json',
    tops:'clothes/Sleeveless/Sleeveless.json',
    bottoms:'clothes/JeansSkirt/JeansSkirt.json'
  }
});


/* Testo coerente con ciò che la V2 modifica davvero. */
const ADF_MH_PRESET_SAFE_COPY_V2 = Object.freeze({
  'uomo-affilato':'Fisico asciutto, look pulito e contemporaneo.',
  'uomo-atletico':'Corporatura atletica e più muscolosa.',
  'uomo-robusto':'Fisico più pieno e struttura solida.',
  'uomo-slanciato':'Più alto, leggero e longilineo.',
  'uomo-giovane':'Corporatura giovane e leggera.',
  'uomo-maturo':'Età più adulta e corporatura equilibrata.',
  'uomo-massiccio':'Peso e massa muscolare più marcati.',

  'donna-affilata':'Fisico asciutto e look essenziale.',
  'donna-atletica':'Corporatura atletica e tonica.',
  'donna-morbida':'Corporatura più morbida e piena.',
  'donna-slanciata':'Più alta, leggera e longilinea.',
  'donna-giovane':'Corporatura giovane e leggera.',
  'donna-matura':'Età più adulta e proporzioni equilibrate.',
  'donna-formosa':'Corporatura più piena e curve più marcate.'
});

for(const preset of ADF_MH_PRESETS){
  if(ADF_MH_PRESET_SAFE_COPY_V2[preset.id]){
    preset.blurb=ADF_MH_PRESET_SAFE_COPY_V2[preset.id];
  }
}


/* ------------------------------------------------------------
   MODIFIER: solo macro sicure.

   La V1 cercava token generici e poteva quindi modificare molti
   slider facciali contemporaneamente. La V2 non lo fa.
   ------------------------------------------------------------ */

/* ADF_MAKEHUMAN_PRESETS_FACE_IDENTITY_V6
   Morph facciali estesi basati sui modifier MakeHuman reali.
   Nessun fuzzy matching.
   Nessun fallback semantico.
*/
const ADF_MH_PRESET_EXACT_MODIFIERS_V6=Object.freeze({

  age:[
    {name:'macrodetails/Age',gain:1},
    {name:'head/head-age-decr|incr',gain:1.25}
  ],

  height:[
    {name:'macrodetails-height/Height',gain:1}
  ],

  weight:[
    {name:'macrodetails-universal/Weight',gain:1},
    {name:'head/head-fat-decr|incr',gain:1.20}
  ],

  muscle:[
    {name:'macrodetails-universal/Muscle',gain:1}
  ],


  headWidth:[
    {name:'head/head-scale-horiz-decr|incr',gain:1.55}
  ],

  headHeight:[
    {name:'head/head-scale-vert-decr|incr',gain:1.48}
  ],

  headDepth:[
    {name:'head/head-scale-depth-decr|incr',gain:1.45}
  ],

  headSquare:[
    {name:'head/head-square',gain:1,direct:true}
  ],

  headOval:[
    {name:'head/head-oval',gain:1,direct:true}
  ],

  faceRoundness:[
    {name:'head/head-round',gain:1,direct:true}
  ],


  foreheadHeight:[
    {name:'forehead/forehead-scale-vert-decr|incr',gain:1.42}
  ],

  foreheadProjection:[
    {name:'forehead/forehead-trans-backward|forward',gain:1.35}
  ],


  eyeSpacing:[
    {name:'eyes/l-eye-trans-in|out',gain:1.45},
    {name:'eyes/r-eye-trans-in|out',gain:1.45}
  ],

  eyeVertical:[
    {name:'eyes/l-eye-trans-down|up',gain:1.32},
    {name:'eyes/r-eye-trans-down|up',gain:1.32}
  ],

  eyeSize:[
    {name:'eyes/l-eye-scale-decr|incr',gain:1.55},
    {name:'eyes/r-eye-scale-decr|incr',gain:1.55},
    {name:'eyes/l-eye-height1-decr|incr',gain:1.35},
    {name:'eyes/r-eye-height1-decr|incr',gain:1.35},
    {name:'eyes/l-eye-height2-decr|incr',gain:1.30},
    {name:'eyes/r-eye-height2-decr|incr',gain:1.30}
  ],

  eyeCorner:[
    {name:'eyes/l-eye-corner1-down|up',gain:1.38},
    {name:'eyes/r-eye-corner1-down|up',gain:1.38},
    {name:'eyes/l-eye-corner2-down|up',gain:1.24},
    {name:'eyes/r-eye-corner2-down|up',gain:1.24}
  ],


  browProminence:[
    {name:'eyebrows/eyebrows-trans-backward|forward',gain:1.40}
  ],

  browHeight:[
    {name:'eyebrows/eyebrows-trans-down|up',gain:1.38}
  ],

  browAngle:[
    {name:'eyebrows/eyebrows-angle-down|up',gain:1.42}
  ],


  cheekFullness:[
    {name:'cheek/l-cheek-volume-decr|incr',gain:1.62},
    {name:'cheek/r-cheek-volume-decr|incr',gain:1.62},
    {name:'cheek/l-cheek-inner-decr|incr',gain:1.26},
    {name:'cheek/r-cheek-inner-decr|incr',gain:1.26}
  ],

  cheekHeight:[
    {name:'cheek/l-cheek-trans-down|up',gain:1.50},
    {name:'cheek/r-cheek-trans-down|up',gain:1.50},
    {name:'cheek/l-cheek-bones-decr|incr',gain:1.34},
    {name:'cheek/r-cheek-bones-decr|incr',gain:1.34}
  ],


  jawWidth:[
    {name:'chin/chin-width-decr|incr',gain:1.72},
    {name:'chin/chin-bones-decr|incr',gain:1.42}
  ],

  chinSize:[
    {name:'chin/chin-height-decr|incr',gain:1.55}
  ],

  chinProminence:[
    {name:'chin/chin-prominent-decr|incr',gain:1.60},
    {name:'chin/chin-prognathism-decr|incr',gain:1.22}
  ],


  noseWidth:[
    {name:'nose/nose-scale-horiz-decr|incr',gain:1.55},
    {name:'nose/nose-nostrils-width-decr|incr',gain:1.48},
    {name:'nose/nose-point-width-decr|incr',gain:1.34}
  ],

  noseLength:[
    {name:'nose/nose-scale-vert-decr|incr',gain:1.52}
  ],

  noseDepth:[
    {name:'nose/nose-scale-depth-decr|incr',gain:1.55}
  ],

  noseTip:[
    {name:'nose/nose-point-down|up',gain:1.46},
    {name:'nose/nose-base-down|up',gain:1.22}
  ],

  noseCurve:[
    {name:'nose/nose-curve-concave|convex',gain:1.52},
    {name:'nose/nose-hump-decr|incr',gain:1.18}
  ],


  mouthWidth:[
    {name:'mouth/mouth-scale-horiz-decr|incr',gain:1.58},
    {name:'mouth/mouth-upperlip-width-decr|incr',gain:1.26},
    {name:'mouth/mouth-lowerlip-width-decr|incr',gain:1.26}
  ],

  mouthHeight:[
    {name:'mouth/mouth-scale-vert-decr|incr',gain:1.48},
    {name:'mouth/mouth-upperlip-height-decr|incr',gain:1.24},
    {name:'mouth/mouth-lowerlip-height-decr|incr',gain:1.24}
  ],

  lipFullness:[
    {name:'mouth/mouth-upperlip-volume-decr|incr',gain:1.60},
    {name:'mouth/mouth-lowerlip-volume-decr|incr',gain:1.60}
  ],


  shoulder:[
    {name:'torso/torso-vshape-decr|incr',gain:1.18}
  ],

  hip:[
    {name:'hip/hip-scale-horiz-decr|incr',gain:1.15}
  ],

  bust:[
    {name:'breast/BreastSize',gain:1}
  ],

  neck:[
    {name:'neck/neck-scale-horiz-decr|incr',gain:1.38},
    {name:'neck/neck-scale-depth-decr|incr',gain:1.26}
  ]
});


function adfMhPresetMorphValueV6(value,spec){

  const n=Math.max(0,Math.min(1,Number(value)));

  if(spec.direct){
    return Math.max(
      0,
      Math.min(1,n*(Number(spec.gain)||1))
    );
  }

  const gain=Math.max(0,Number(spec.gain)||1);

  return Math.max(
    0,
    Math.min(
      1,
      .5+((n-.5)*gain)
    )
  );
}


adfMhApplySemantic=function(modifiers,key,normalized){

  const specs=ADF_MH_PRESET_EXACT_MODIFIERS_V6[key];

  if(!Array.isArray(specs) || !specs.length){
    return 0;
  }

  let applied=0;

  for(const spec of specs){

    const meta=nativeModifierMeta.find(
      item=>item.fullName===spec.name
    );

    /*
      Il runtime MakeHuman decide cosa esiste davvero.
      Nessun tentativo di indovinare un modifier mancante.
    */
    if(!meta) continue;

    modifiers[spec.name]=adfMhMapNormalizedToMeta(
      meta,
      adfMhPresetMorphValueV6(normalized,spec)
    );

    applied++;
  }

  return applied;
};


/* ------------------------------------------------------------
   Pelle: la V2 la PRESERVA.

   Evitiamo che un preset di corporatura cambi involontariamente
   texture/età/etnia tramite un nome fuzzy.
   ------------------------------------------------------------ */

adfMhSetSkinFromPatterns = function(state){
  if(typeof skinSelect!=='undefined' && skinSelect){
    state.skin=skinSelect.value||state.skin||'';
  }
};


/* ------------------------------------------------------------
   Slot aspetto:
   - capello esatto;
   - barba sempre vuota;
   - nessun fallback automatico.
   ------------------------------------------------------------ */

function adfMhPresetExactSelectValueV2(slotId,raw){

  const select=E(`slot-${slotId}`);
  if(!select) return null;

  const exists=[...select.options].some(
    option=>String(option.value||'')===String(raw||'')
  );

  return exists ? raw : null;
}

adfMhSetNonWardrobeSlots = function(state,preset){

  state.slots=state.slots||{};

  const config=ADF_MH_PRESET_SAFE_ASSETS_V2[preset.id];
  if(!config) return;

  const hair=adfMhPresetExactSelectValueV2('hair',config.hair);

  if(hair!==null){
    state.slots.hair=hair;
  }

  /*
    V2 volutamente clean-shaven.
    Le barbe si potranno comunque aggiungere manualmente dopo.
  */
  const facialHair=E('slot-facialHair');

  if(
    facialHair &&
    [...facialHair.options].some(o=>String(o.value||'')==='')
  ){
    state.slots.facialHair='';
  }
};


/* ------------------------------------------------------------
   Guardaroba:
   - cambia SOLO abbigliamento;
   - accessori conservati;
   - top/bottom esatti;
   - niente fallback;
   - niente scarpe automatiche per questa V2: alcuni asset
     del catalogo hanno fitting molto aggressivo sui piedi.
   ------------------------------------------------------------ */

function adfMhPresetRawExistsV2(group,raw){

  if(!raw) return false;

  const entries=entriesForUiGroup(group);

  return Array.isArray(entries) &&
    entries.some(entry=>String(entry?.raw||'')===String(raw));
}

adfMhSetClothingSlots = function(state,preset){

  state.slots=state.slots||{};

  const config=ADF_MH_PRESET_SAFE_ASSETS_V2[preset.id];
  if(!config) return;

  if(adfMhPresetRawExistsV2('tops',config.tops)){
    state.slots.tops=config.tops;
  }

  if(adfMhPresetRawExistsV2('bottoms',config.bottoms)){
    state.slots.bottoms=config.bottoms;
  }

  /*
    Pulizia esclusivamente degli slot di abbigliamento che
    potrebbero essere rimasti da un preset precedente.
    Intimo resta quello corrente.
    Accessori non vengono toccati.
  */
  state.slots.dresses='';
  state.slots.shoes='';
  state.slots.outerwear='';
  state.slots.clothesOther='';
};


/* Diagnostica non invasiva: segnala eventuali asset mancanti. */
function adfMhAuditPresetAssetsV2(){

  const missing=[];

  for(const preset of ADF_MH_PRESETS){

    const config=ADF_MH_PRESET_SAFE_ASSETS_V2[preset.id];
    if(!config){
      missing.push(`${preset.id}: configurazione`);
      continue;
    }

    const hairSelect=E('slot-hair');

    if(
      hairSelect &&
      ![...hairSelect.options].some(o=>o.value===config.hair)
    ){
      missing.push(`${preset.id}: hair ${config.hair}`);
    }

    if(!adfMhPresetRawExistsV2('tops',config.tops)){
      missing.push(`${preset.id}: top ${config.tops}`);
    }

    if(!adfMhPresetRawExistsV2('bottoms',config.bottoms)){
      missing.push(`${preset.id}: bottom ${config.bottoms}`);
    }
  }

  if(missing.length){
    console.warn(
      '[ADF PRESET V2] asset mancanti:',
      missing
    );
  }else{
    console.info(
      '[ADF PRESET V2] 14/14 configurazioni asset valide'
    );
  }

  return missing;
}


/* Quando MakeHuman è pronto facciamo soltanto l'audit.
   Nessuna modifica automatica al personaggio. */
(function adfMhPresetSafeV2Boot(){

  let attempts=0;

  const timer=setInterval(()=>{

    attempts++;

    if(runtimeReady){

      clearInterval(timer);

      const missing=adfMhAuditPresetAssetsV2();

      if(!missing.length){
        adfMhSetPresetStatus(
          'Preset V2 pronti · 14 configurazioni controllate',
          'ok'
        );
      }

      return;
    }

    if(attempts>=40){
      clearInterval(timer);
    }

  },250);

})();
