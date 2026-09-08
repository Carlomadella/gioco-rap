/* Anni di Fame — MakeHuman Creator In-Game UI Prototype
 * Runtime: makehuman-js-new pinned by the existing installer.
 * IMPORTANT: this file does NOT patch MakeHuman. It only consumes the public
 * Human / Modifier / Proxy APIs already used by the working editor.
 */
'use strict';

(function () {
  var DATA_URL = './data/';
  var STORAGE_KEY = 'adf.makehuman.editor.v1';

  var SECTION_ORDER = ['identity','face','body','details','wardrobe','skin','custom','confirm'];
  var SECTION_META = {
    identity: ['01 · IDENTITÀ', 'Costruisci la base', "Parti dall'identità del personaggio. Tutto resta modificabile."],
    face: ['02 · VOLTO', 'Dagli una faccia', 'Preset rapidi e controlli reali MakeHuman, area per area.'],
    body: ['03 · CORPO', 'Costruisci il fisico', 'Preset e slider lavorano sugli stessi modifier.'],
    details: ['04 · CAPELLI & DETTAGLI', 'Definisci lo stile', 'Capelli, sopracciglia, ciglia, occhi e dettagli del volto.'],
    wardrobe: ['05 · GUARDAROBA', 'Vestilo', 'I capi vengono applicati dai proxy MakeHuman reali.'],
    skin: ['06 · PELLE', 'Scegli la pelle', 'Materiali e texture disponibili nel pacchetto MakeHuman.'],
    custom: ['07 · PERSONALIZZAZIONE', 'Vai fino in fondo', 'Tutti i modifier restano disponibili: niente viene nascosto.'],
    confirm: ['08 · CONFERMA', 'Il tuo artista', 'Controlla il risultato e salva il personaggio.']
  };

  var EXCLUSIVE_PROXY_GROUPS = new Set([
    'hair','eyebrows','eyelashes','eyes','teeth','tongue','genitals'
  ]);

  var DETAIL_PROXY_GROUPS = new Set([
    'hair','eyebrows','eyelashes','eyes','teeth','tongue'
  ]);

  var FACE_GROUPS = new Set([
    'head','forehead','eyebrows','eyes','nose','cheek','mouth','chin','ears'
  ]);

  var BODY_GROUPS = new Set([
    'neck','pelvis','hip','armslegs','stomach','breast','buttocks','torso','legs','measure'
  ]);

  var IDENTITY_MODS = [
    ['macrodetails/Age', 'Età']
  ];

  var BODY_MODS = [
    ['macrodetails-height/Height', 'Altezza'],
    ['macrodetails-universal/Weight', 'Massa'],
    ['macrodetails-universal/Muscle', 'Muscolatura'],
    ['macrodetails-proportions/BodyProportions', 'Proporzioni']
  ];

  var ETHNIC_MODS = [
    ['macrodetails/African', 'Africana'],
    ['macrodetails/Asian', 'Asiatica'],
    ['macrodetails/Caucasian', 'Caucasica']
  ];

  var GROUP_LABELS = {
    macrodetails: 'Macro',
    'macrodetails-height': 'Altezza',
    'macrodetails-universal': 'Corpo',
    'macrodetails-proportions': 'Proporzioni',
    eyebrows: 'Sopracciglia', eyes: 'Occhi', chin: 'Mento', forehead: 'Fronte',
    head: 'Testa', mouth: 'Bocca', nose: 'Naso', neck: 'Collo', ears: 'Orecchie',
    cheek: 'Guance', pelvis: 'Bacino', hip: 'Fianchi', armslegs: 'Braccia e gambe',
    stomach: 'Addome', breast: 'Torace / seno', buttocks: 'Glutei', torso: 'Torso',
    legs: 'Gambe', genitals: 'Anatomia', measure: 'Misure'
  };

  var PROXY_LABELS = {
    clothes: 'Vestiti', hair: 'Capelli', eyebrows: 'Sopracciglia',
    eyelashes: 'Ciglia', eyes: 'Occhi', teeth: 'Denti', tongue: 'Lingua', genitals: 'Anatomia'
  };

  var BODY_PRESETS = [
    { id:'neutral', label:'Neutro', hint:'equilibrato', values:{
      'macrodetails-universal/Weight':0.50,
      'macrodetails-universal/Muscle':0.50,
      'macrodetails-proportions/BodyProportions':0.50
    }},
    { id:'slim', label:'Snello', hint:'massa bassa', values:{
      'macrodetails-universal/Weight':0.28,
      'macrodetails-universal/Muscle':0.40,
      'macrodetails-proportions/BodyProportions':0.52
    }},
    { id:'athletic', label:'Atletico', hint:'muscolo alto', values:{
      'macrodetails-universal/Weight':0.50,
      'macrodetails-universal/Muscle':0.74,
      'macrodetails-proportions/BodyProportions':0.58
    }},
    { id:'solid', label:'Massiccio', hint:'massa + muscolo', values:{
      'macrodetails-universal/Weight':0.68,
      'macrodetails-universal/Muscle':0.70,
      'macrodetails-proportions/BodyProportions':0.60
    }},
    { id:'soft', label:'Morbido', hint:'massa alta', values:{
      'macrodetails-universal/Weight':0.72,
      'macrodetails-universal/Muscle':0.30,
      'macrodetails-proportions/BodyProportions':0.48
    }},
    { id:'lean', label:'Asciutto', hint:'massa contenuta', values:{
      'macrodetails-universal/Weight':0.36,
      'macrodetails-universal/Muscle':0.62,
      'macrodetails-proportions/BodyProportions':0.56
    }}
  ];

  var state = {
    human:null, resources:null, ready:false,
    scene:null, camera:null, renderer:null, controls:null, pivot:null,
    modifierEntries:[], proxyEntries:[], currentSkin:null,
    currentSection:'identity', activeDetailGroup:'all',
    syncQueued:false
  };

  var els = {};
  function $(id) { return document.getElementById(id); }

  function collectEls() {
    [
      'viewport','statusPill','loadCard','loadTitle','loadDetail','loadBar',
      'morphCount','proxyCount','wornCount','identityMorphs','bodyMorphs','ethnicControls',
      'facePresets','faceAreaFilter','faceMorphs','bodyPresets','allMorphs','morphSearch',
      'groupFilter','morphVisibleCount','detailCategories','detailSearch','detailResultCount',
      'detailGrid','wardrobeCategories','wardrobeSearch','wardrobeResultCount','wardrobeGrid',
      'skinGrid','footerStatus','btnRandom','btnResetSection','btnClearWardrobe','btnClearDetails',
      'btnSaveLocal','btnLoadLocal','btnExport','fileImport','sexFemale','sexNeutral','sexMale',
      'btnCollapseGroups','btnBack','btnPreview','previewExit','btnConfirmArtist','btnConfirmInside',
      'sectionEyebrow','sectionTitle','sectionHint','confirmSummary'
    ].forEach(function (id) { els[id] = $(id); });
  }

  function setStatus(text, type) {
    if (els.statusPill) {
      els.statusPill.textContent = text;
      els.statusPill.classList.remove('busy','error');
      if (type) els.statusPill.classList.add(type);
    }
    if (els.footerStatus) els.footerStatus.textContent = text;
  }

  function loadProgress(title, detail, percent) {
    els.loadTitle.textContent = title;
    els.loadDetail.textContent = detail;
    els.loadBar.style.width = Math.max(4, Math.min(100, percent)) + '%';
  }

  function friendly(text) {
    return String(text || '')
      .replace(/\|/g, ' / ')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function groupLabel(group) { return GROUP_LABELS[group] || friendly(group); }
  function proxyGroupLabel(group) { return PROXY_LABELS[group] || friendly(group); }

  function activateSection(name, options) {
    if (SECTION_ORDER.indexOf(name) === -1) return;
    state.currentSection = name;

    document.querySelectorAll('.section-tab').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === name);
    });
    document.querySelectorAll('.tab-page').forEach(function (p) {
      p.classList.toggle('active', p.dataset.page === name);
    });

    var meta = SECTION_META[name];
    els.sectionEyebrow.textContent = meta[0];
    els.sectionTitle.textContent = meta[1];
    els.sectionHint.textContent = meta[2];
    els.btnBack.disabled = name === SECTION_ORDER[0];

    if (!options || options.camera !== false) {
      if (name === 'face' || name === 'details' || name === 'skin') setView('face');
      else setView('full');
    }
    if (name === 'confirm') renderConfirmSummary();
  }

  function initTabs() {
    document.querySelectorAll('.section-tab').forEach(function (button) {
      button.addEventListener('click', function () { activateSection(button.dataset.tab); });
    });
  }

  function initScene() {
    var THREE = window.THREE;
    state.scene = new THREE.Scene();
    state.camera = new THREE.PerspectiveCamera(31, 1, 0.5, 300);
    state.camera.position.set(0, 10.5, 34);

    state.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.setClearColor(0x000000, 0);
    els.viewport.appendChild(state.renderer.domElement);

    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.target.set(0, 10, 0);
    state.controls.enablePan = false;
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.08;
    state.controls.minDistance = 7;
    state.controls.maxDistance = 65;

    var key = new THREE.DirectionalLight(0xfff3df, 0.92);
    key.position.set(-15, 27, 28);
    state.scene.add(key);
    var rim = new THREE.DirectionalLight(0x8bc9ff, 0.45);
    rim.position.set(18, 20, -18);
    state.scene.add(rim);
    state.scene.add(new THREE.HemisphereLight(0xe9f0f6, 0x16100c, 0.48));

    state.pivot = new THREE.Object3D();
    state.scene.add(state.pivot);

    window.addEventListener('resize', resize);
    resize();
  }

  function resize() {
    if (!state.renderer || !state.camera) return;
    var w = Math.max(1, els.viewport.clientWidth);
    var h = Math.max(1, els.viewport.clientHeight);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (state.controls) state.controls.update();
    if (!state.human || !state.renderer) return;
    state.human.onBeforeRender();
    state.renderer.render(state.scene, state.camera);
    state.human.onAfterRender();
  }

  function modifier(fullName) {
    return state.human && state.human.modifiers.children[fullName];
  }

  function getModifierValue(m) {
    try { return Number(m.getValue()); }
    catch (err) { return Number(m.defaultValue || 0); }
  }

  function defaultModifierValue(m) {
    var d = Number(m.defaultValue);
    if (Number.isFinite(d)) return d;
    var min = Number(m.min), max = Number(m.max);
    if (Number.isFinite(min) && Number.isFinite(max)) return (min + max) / 2;
    return 0;
  }

  function setModifier(fullName, value, forceBake) {
    var m = modifier(fullName);
    if (!m) return false;
    var min = Number(m.min), max = Number(m.max);
    var v = Number(value);
    if (Number.isFinite(min)) v = Math.max(min, v);
    if (Number.isFinite(max)) v = Math.min(max, v);
    m.setValue(v);
    m.updateValue();
    if (forceBake) forceMorphBake();
    queueSync();
    return true;
  }

  function forceMorphBake() {
    if (!state.human || !state.human.targets) return;
    state.human.targets.lastBake = 0;
  }

  function queueSync() {
    if (state.syncQueued) return;
    state.syncQueued = true;
    requestAnimationFrame(function () {
      state.syncQueued = false;
      syncModifierControls();
      updateSexButtons();
    });
  }

  function applyMap(values) {
    Object.keys(values).forEach(function (name) { setModifier(name, values[name], false); });
    forceMorphBake();
    setStatus('Preset applicato');
  }

  function makeMorphControl(m, label, showMeta) {
    var row = document.createElement('div');
    row.className = 'morph-row';
    row.dataset.mod = m.fullName;

    var top = document.createElement('div');
    top.className = 'label-line';
    var copy = document.createElement('div');
    var b = document.createElement('b');
    b.textContent = label || friendly(m.name);
    copy.appendChild(b);

    if (showMeta) {
      var meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = m.fullName;
      copy.appendChild(meta);
    }

    var out = document.createElement('output');
    out.textContent = getModifierValue(m).toFixed(2);
    top.appendChild(copy);
    top.appendChild(out);

    var input = document.createElement('input');
    input.type = 'range';
    input.min = String(m.min);
    input.max = String(m.max);
    input.step = '0.01';
    input.value = String(getModifierValue(m));
    input.addEventListener('input', function () {
      out.textContent = Number(input.value).toFixed(2);
      setModifier(m.fullName, Number(input.value), false);
    });
    input.addEventListener('change', function () {
      setModifier(m.fullName, Number(input.value), true);
      setStatus('Morph aggiornato');
    });

    row.appendChild(top);
    row.appendChild(input);
    return row;
  }

  function buildQuickMorphs() {
    els.identityMorphs.innerHTML = '';
    IDENTITY_MODS.forEach(function (entry) {
      var m = modifier(entry[0]);
      if (m) els.identityMorphs.appendChild(makeMorphControl(m, entry[1], false));
    });

    els.bodyMorphs.innerHTML = '';
    BODY_MODS.forEach(function (entry) {
      var m = modifier(entry[0]);
      if (m) els.bodyMorphs.appendChild(makeMorphControl(m, entry[1], false));
    });

    els.ethnicControls.innerHTML = '';
    ETHNIC_MODS.forEach(function (entry) {
      var m = modifier(entry[0]);
      if (m) els.ethnicControls.appendChild(makeMorphControl(m, entry[1], false));
    });
  }

  function buildBodyPresets() {
    els.bodyPresets.innerHTML = '';
    BODY_PRESETS.forEach(function (preset) {
      var btn = document.createElement('button');
      btn.className = 'preset';
      btn.type = 'button';
      btn.innerHTML = '<b>' + preset.label + '</b><span>' + preset.hint + '</span>';
      btn.addEventListener('click', function () { applyMap(preset.values); });
      els.bodyPresets.appendChild(btn);
    });
  }

  function faceModifiers() {
    return state.modifierEntries.filter(function (m) { return FACE_GROUPS.has(m.groupName); });
  }

  function stableHash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function applyFacePreset(seed) {
    var mods = faceModifiers();
    if (seed === 0) {
      mods.forEach(function (m) { setModifier(m.fullName, defaultModifierValue(m), false); });
    } else {
      mods.forEach(function (m) {
        var min = Number(m.min), max = Number(m.max);
        var span = max - min;
        if (!Number.isFinite(span) || span <= 0) return;
        var r = (stableHash(m.fullName + ':' + seed) % 10000) / 9999;
        var base = defaultModifierValue(m);
        var target = base + (r - 0.5) * span * 0.28;
        setModifier(m.fullName, target, false);
      });
    }
    forceMorphBake();
    queueSync();
    setStatus(seed === 0 ? 'Volto neutro applicato' : 'Preset volto applicato');
  }

  function buildFaceEditor() {
    els.facePresets.innerHTML = '';
    [
      ['Neutro','base',0],['Preset 01','variazione',1],['Preset 02','variazione',2],['Preset 03','variazione',3]
    ].forEach(function (entry) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.innerHTML = '<b>' + entry[0] + '</b><span>' + entry[1] + '</span>';
      btn.addEventListener('click', function () { applyFacePreset(entry[2]); });
      els.facePresets.appendChild(btn);
    });

    var groups = Array.from(new Set(faceModifiers().map(function (m) { return m.groupName; }))).sort();
    els.faceAreaFilter.innerHTML = '';
    groups.forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = groupLabel(g);
      els.faceAreaFilter.appendChild(opt);
    });
    var preferred = groups.indexOf('nose') !== -1 ? 'nose' : groups[0];
    if (preferred) els.faceAreaFilter.value = preferred;
    renderFaceMorphs();
  }

  function renderFaceMorphs() {
    if (!state.ready) return;
    var group = els.faceAreaFilter.value;
    var mods = faceModifiers().filter(function (m) { return !group || m.groupName === group; });
    els.faceMorphs.innerHTML = '';
    mods.forEach(function (m) { els.faceMorphs.appendChild(makeMorphControl(m, friendly(m.name), false)); });
  }

  function buildAllMorphs() {
    var mods = Object.keys(state.human.modifiers.children)
      .map(function (key) { return state.human.modifiers.children[key]; })
      .filter(Boolean)
      .sort(function (a, b) { return (a.groupName + '/' + a.name).localeCompare(b.groupName + '/' + b.name); });

    state.modifierEntries = mods;
    els.morphCount.textContent = String(mods.length);

    var groups = Array.from(new Set(mods.map(function (m) { return m.groupName; }))).sort();
    els.groupFilter.innerHTML = '<option value="">Tutti i gruppi</option>';
    groups.forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = groupLabel(g);
      els.groupFilter.appendChild(opt);
    });
    renderMorphList();
  }

  function renderMorphList() {
    if (!state.ready) return;
    var q = els.morphSearch.value.trim().toLowerCase();
    var g = els.groupFilter.value;
    var filtered = state.modifierEntries.filter(function (m) {
      if (g && m.groupName !== g) return false;
      if (!q) return true;
      var hay = (m.fullName + ' ' + m.groupName + ' ' + m.name + ' ' + groupLabel(m.groupName)).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    var byGroup = {};
    filtered.forEach(function (m) { (byGroup[m.groupName] || (byGroup[m.groupName] = [])).push(m); });
    els.allMorphs.innerHTML = '';
    Object.keys(byGroup).sort().forEach(function (group) {
      var wrap = document.createElement('section');
      wrap.className = 'morph-group';
      var head = document.createElement('button');
      head.type = 'button';
      head.innerHTML = '<b>' + groupLabel(group) + '</b><span>' + byGroup[group].length + '</span>';
      head.addEventListener('click', function () { wrap.classList.toggle('collapsed'); });
      var body = document.createElement('div');
      body.className = 'group-body';
      byGroup[group].forEach(function (m) { body.appendChild(makeMorphControl(m, friendly(m.name), true)); });
      wrap.appendChild(head);
      wrap.appendChild(body);
      els.allMorphs.appendChild(wrap);
    });
    els.morphVisibleCount.textContent = filtered.length + ' controlli';
  }

  function syncModifierControls() {
    document.querySelectorAll('.morph-row[data-mod]').forEach(function (row) {
      var m = modifier(row.dataset.mod);
      if (!m) return;
      var v = getModifierValue(m);
      var input = row.querySelector('input[type=range]');
      var out = row.querySelector('output');
      if (document.activeElement !== input) input.value = String(v);
      out.textContent = Number(v).toFixed(2);
    });
  }

  function setSex(value) {
    if (setModifier('macrodetails/Gender', value, true)) {
      setStatus(value < 0.25 ? 'Base donna' : value > 0.75 ? 'Base uomo' : 'Base neutra');
    }
  }

  function updateSexButtons() {
    var m = modifier('macrodetails/Gender');
    if (!m) return;
    var v = getModifierValue(m);
    [els.sexFemale, els.sexNeutral, els.sexMale].forEach(function (b) { b.classList.remove('active'); });
    if (v < 0.25) els.sexFemale.classList.add('active');
    else if (v > 0.75) els.sexMale.classList.add('active');
    else els.sexNeutral.classList.add('active');
  }

  function proxyThumbnail(proxy) { return DATA_URL + 'proxies/' + proxy.thumbnail; }

  function renderProxyCards(entries, container, resultEl, noun) {
    container.innerHTML = '';
    entries.forEach(function (proxy) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'asset-card' + (proxy.visible ? ' active' : '');
      card.dataset.proxyKey = proxy.key;

      var thumb = document.createElement('div');
      thumb.className = 'asset-thumb';
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = proxyThumbnail(proxy);
      img.addEventListener('error', function () {
        img.remove();
        var fb = document.createElement('span');
        fb.className = 'fallback';
        fb.textContent = proxy.group === 'hair' ? '✂' : '◇';
        thumb.appendChild(fb);
      });
      thumb.appendChild(img);

      var copy = document.createElement('div');
      copy.className = 'asset-copy';
      copy.innerHTML = '<b>' + friendly(proxy.name) + '</b><span>' + proxyGroupLabel(proxy.group) + '</span>';
      card.appendChild(thumb);
      card.appendChild(copy);
      card.addEventListener('click', function () { toggleProxy(proxy, card); });
      container.appendChild(card);
    });
    resultEl.textContent = entries.length + ' ' + noun;
  }

  function buildDetailCategories() {
    var details = state.proxyEntries.filter(function (p) { return DETAIL_PROXY_GROUPS.has(p.group); });
    var groups = ['all'].concat(Array.from(new Set(details.map(function (p) { return p.group; }))).sort());
    els.detailCategories.innerHTML = '';
    groups.forEach(function (group) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (group === state.activeDetailGroup ? ' active' : '');
      btn.textContent = group === 'all' ? 'Tutto' : proxyGroupLabel(group);
      btn.addEventListener('click', function () {
        state.activeDetailGroup = group;
        buildDetailCategories();
        renderDetails();
      });
      els.detailCategories.appendChild(btn);
    });
  }

  function renderDetails() {
    var q = els.detailSearch.value.trim().toLowerCase();
    var filtered = state.proxyEntries.filter(function (p) {
      if (!DETAIL_PROXY_GROUPS.has(p.group)) return false;
      if (state.activeDetailGroup !== 'all' && p.group !== state.activeDetailGroup) return false;
      if (!q) return true;
      return (p.name + ' ' + p.group + ' ' + p.key).toLowerCase().indexOf(q) !== -1;
    });
    renderProxyCards(filtered, els.detailGrid, els.detailResultCount, 'asset');
  }

  function renderWardrobe() {
    var q = els.wardrobeSearch.value.trim().toLowerCase();
    var filtered = state.proxyEntries.filter(function (p) {
      if (p.group !== 'clothes') return false;
      if (!q) return true;
      return (p.name + ' ' + p.key).toLowerCase().indexOf(q) !== -1;
    });
    renderProxyCards(filtered, els.wardrobeGrid, els.wardrobeResultCount, 'capi');
  }

  function buildWardrobe() {
    state.proxyEntries = state.human.proxies.children.slice().sort(function (a, b) {
      return (a.group + '/' + a.name).localeCompare(b.group + '/' + b.name);
    });
    els.proxyCount.textContent = String(state.proxyEntries.length);
    els.wardrobeCategories.innerHTML = '<button class="chip active" type="button">Vestiti</button>';
    buildDetailCategories();
    renderDetails();
    renderWardrobe();
    updateWornCount();
  }

  async function toggleProxy(proxy, card) {
    if (!state.ready || card.classList.contains('loading')) return;
    card.classList.add('loading');
    try {
      var enable = !proxy.visible;
      if (enable && EXCLUSIVE_PROXY_GROUPS.has(proxy.group)) {
        var others = state.proxyEntries.filter(function (p) {
          return p !== proxy && p.group === proxy.group && p.visible;
        });
        await Promise.all(others.map(function (p) { return p.toggle(false); }));
      }
      await proxy.toggle(enable);
      renderDetails();
      renderWardrobe();
      updateWornCount();
      setStatus(enable ? 'Asset indossato' : 'Asset rimosso');
    } catch (err) {
      console.error('Proxy error', proxy.key, err);
      setStatus('Asset non caricabile: ' + proxy.name, 'error');
      card.classList.remove('loading');
    }
  }

  async function clearWardrobe() {
    if (!state.ready) return;
    var visible = state.proxyEntries.filter(function (p) { return p.group === 'clothes' && p.visible; });
    await Promise.all(visible.map(function (p) { return p.toggle(false); }));
    renderWardrobe();
    updateWornCount();
    setStatus('Vestiti rimossi');
  }

  async function clearDetails() {
    if (!state.ready) return;
    var visible = state.proxyEntries.filter(function (p) { return DETAIL_PROXY_GROUPS.has(p.group) && p.visible; });
    await Promise.all(visible.map(function (p) { return p.toggle(false); }));
    renderDetails();
    updateWornCount();
    setStatus('Dettagli rimossi');
  }

  function updateWornCount() {
    els.wornCount.textContent = String(state.proxyEntries.filter(function (p) { return p.visible; }).length);
  }

  function buildSkins() {
    var skins = (state.resources.skins || []).slice();
    els.skinGrid.innerHTML = '';
    skins.forEach(function (skin) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skin-card' + (skin === state.currentSkin ? ' active' : '');
      var base = skin.split('/').pop().replace(/\.json$/i, '');
      btn.innerHTML = '<b>' + friendly(base) + '</b><span>' + friendly(skin.split('/')[0]) + '</span>';
      btn.addEventListener('click', async function () {
        try {
          setStatus('Carico pelle…', 'busy');
          await state.human.setSkin(skin);
          state.currentSkin = skin;
          buildSkins();
          setStatus('Pelle applicata');
        } catch (err) {
          console.error(err);
          setStatus('Pelle non caricabile', 'error');
        }
      });
      els.skinGrid.appendChild(btn);
    });
  }

  function currentConfig() {
    var modifiers = {};
    state.modifierEntries.forEach(function (m) { modifiers[m.fullName] = getModifierValue(m); });
    return {
      schema:'adf.makehuman.editor.v1',
      savedAt:new Date().toISOString(),
      runtime:'makehuman-js-new@781728cc11efc0322d51ab9be12e6b3fab893c4b',
      skin:state.currentSkin,
      modifiers:modifiers,
      proxies:state.proxyEntries.filter(function (p) { return p.visible; }).map(function (p) { return p.key; })
    };
  }

  async function applyConfig(config) {
    if (!state.ready) throw new Error('Editor non pronto');
    if (!config || !config.modifiers) throw new Error('JSON editor non valido');
    setStatus('Applico personaggio…', 'busy');

    var visible = state.proxyEntries.filter(function (p) { return p.visible; });
    await Promise.all(visible.map(function (p) { return p.toggle(false); }));

    var names = Object.keys(config.modifiers);
    var macroNames = names.filter(function (name) {
      var m = modifier(name);
      return m && typeof m.isMacro === 'function' && m.isMacro();
    });
    var detailNames = names.filter(function (name) { return macroNames.indexOf(name) === -1; });
    macroNames.concat(detailNames).forEach(function (name) {
      if (modifier(name)) setModifier(name, config.modifiers[name], false);
    });
    forceMorphBake();
    state.human.onBeforeRender();

    if (config.skin) {
      await state.human.setSkin(config.skin);
      state.currentSkin = config.skin;
    }

    var wanted = Array.isArray(config.proxies) ? config.proxies : [];
    for (var i = 0; i < wanted.length; i++) {
      var p = state.proxyEntries.find(function (proxy) { return proxy.key === wanted[i] || proxy.url === wanted[i]; });
      if (p) {
        try { await p.toggle(true); } catch (err) { console.warn('Proxy import skipped', wanted[i], err); }
      }
    }

    queueSync();
    renderDetails();
    renderWardrobe();
    buildSkins();
    updateWornCount();
    setStatus('Personaggio caricato');
  }

  function saveLocal() {
    if (!state.ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig()));
    setStatus('Personaggio salvato');
  }

  async function loadLocal() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { setStatus('Nessun salvataggio locale', 'error'); return; }
    try { await applyConfig(JSON.parse(raw)); }
    catch (err) { console.error(err); setStatus('Salvataggio non valido', 'error'); }
  }

  function exportJson() {
    if (!state.ready) return;
    var blob = new Blob([JSON.stringify(currentConfig(), null, 2)], { type:'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'anni-di-fame-character-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  async function importFile(file) {
    if (!file) return;
    try { await applyConfig(JSON.parse(await file.text())); }
    catch (err) { console.error(err); setStatus('Import fallito', 'error'); }
    finally { els.fileImport.value = ''; }
  }

  function setView(view) {
    if (!state.camera || !state.controls) return;
    var cam = state.camera;
    var target = state.controls.target;
    state.pivot.rotation.y = 0;
    if (view === 'face') {
      cam.position.set(0, 17.0, 11);
      target.set(0, 16.7, 0);
    } else if (view === 'side') {
      cam.position.set(30, 10.5, 0);
      target.set(0, 10, 0);
    } else {
      cam.position.set(0, 10.5, 34);
      target.set(0, 10, 0);
    }
    cam.lookAt(target);
    state.controls.update();
    document.querySelectorAll('[data-view]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === view);
    });
  }

  function resetModifiers(filterFn) {
    state.modifierEntries.filter(filterFn).forEach(function (m) {
      try { m.setValue(defaultModifierValue(m)); m.updateValue(); } catch (err) {}
    });
    forceMorphBake();
    queueSync();
  }

  function randomizeModifiers(filterFn, strength) {
    state.modifierEntries.filter(filterFn).forEach(function (m) {
      var min = Number(m.min), max = Number(m.max);
      var span = max - min;
      if (!Number.isFinite(span) || span <= 0) return;
      var base = defaultModifierValue(m);
      var v = base + (Math.random() - 0.5) * span * strength;
      setModifier(m.fullName, v, false);
    });
    forceMorphBake();
    queueSync();
  }

  async function resetCurrentSection() {
    if (!state.ready) return;
    var s = state.currentSection;
    if (s === 'identity') {
      ['macrodetails/Gender'].concat(IDENTITY_MODS.map(function (e) { return e[0]; }), ETHNIC_MODS.map(function (e) { return e[0]; }))
        .forEach(function (name) { var m = modifier(name); if (m) setModifier(name, defaultModifierValue(m), false); });
      forceMorphBake(); queueSync();
    } else if (s === 'face') {
      resetModifiers(function (m) { return FACE_GROUPS.has(m.groupName); });
    } else if (s === 'body') {
      resetModifiers(function (m) { return BODY_GROUPS.has(m.groupName) || BODY_MODS.some(function (e) { return e[0] === m.fullName; }); });
    } else if (s === 'details') {
      await clearDetails();
    } else if (s === 'wardrobe') {
      await clearWardrobe();
    } else if (s === 'skin') {
      if (state.resources.defaultSkin) {
        await state.human.setSkin(state.resources.defaultSkin);
        state.currentSkin = state.resources.defaultSkin;
        buildSkins();
      }
    } else if (s === 'custom') {
      resetModifiers(function () { return true; });
    }
    setStatus('Sezione ripristinata');
  }

  async function randomCurrentSection() {
    if (!state.ready) return;
    var s = state.currentSection;
    if (s === 'identity') {
      setSex([0.10,0.50,0.90][Math.floor(Math.random()*3)]);
      randomizeModifiers(function (m) {
        return IDENTITY_MODS.some(function (e) { return e[0] === m.fullName; }) || ETHNIC_MODS.some(function (e) { return e[0] === m.fullName; });
      }, 0.7);
    } else if (s === 'face') {
      randomizeModifiers(function (m) { return FACE_GROUPS.has(m.groupName); }, 0.36);
    } else if (s === 'body') {
      randomizeModifiers(function (m) {
        return BODY_GROUPS.has(m.groupName) || BODY_MODS.some(function (e) { return e[0] === m.fullName; });
      }, 0.38);
    } else if (s === 'details') {
      var hairs = state.proxyEntries.filter(function (p) { return p.group === 'hair'; });
      if (hairs.length) {
        var hair = hairs[Math.floor(Math.random() * hairs.length)];
        var visibleHair = hairs.filter(function (p) { return p.visible && p !== hair; });
        await Promise.all(visibleHair.map(function (p) { return p.toggle(false); }));
        await hair.toggle(true);
        renderDetails(); updateWornCount();
      }
    } else if (s === 'wardrobe') {
      var clothes = state.proxyEntries.filter(function (p) { return p.group === 'clothes'; });
      if (clothes.length) {
        var cloth = clothes[Math.floor(Math.random() * clothes.length)];
        await cloth.toggle(true);
        renderWardrobe(); updateWornCount();
      }
    } else if (s === 'skin') {
      var skins = state.resources.skins || [];
      if (skins.length) {
        var skin = skins[Math.floor(Math.random() * skins.length)];
        await state.human.setSkin(skin); state.currentSkin = skin; buildSkins();
      }
    } else if (s === 'custom') {
      try { state.human.modifiers.randomize(); forceMorphBake(); queueSync(); }
      catch (err) { console.error(err); }
    }
    setStatus('Variazione generata');
  }

  function renderConfirmSummary() {
    if (!state.ready) return;
    var gender = modifier('macrodetails/Gender');
    var gv = gender ? getModifierValue(gender) : 0.5;
    var genderLabel = gv < 0.25 ? 'Donna' : gv > 0.75 ? 'Uomo' : 'Neutro';
    var clothes = state.proxyEntries.filter(function (p) { return p.group === 'clothes' && p.visible; }).length;
    var details = state.proxyEntries.filter(function (p) { return DETAIL_PROXY_GROUPS.has(p.group) && p.visible; }).length;
    var changed = state.modifierEntries.filter(function (m) { return Math.abs(getModifierValue(m) - defaultModifierValue(m)) > 0.001; }).length;
    var skin = state.currentSkin ? friendly(state.currentSkin.split('/').pop().replace(/\.json$/i,'')) : 'Default';
    els.confirmSummary.innerHTML = [
      ['Base',genderLabel],['Pelle',skin],['Vestiti',String(clothes)],['Dettagli',String(details)],['Modifier personalizzati',String(changed)],['Stato','Pronto']
    ].map(function (item) {
      return '<div class="summary-card"><span>' + item[0] + '</span><b>' + item[1] + '</b></div>';
    }).join('');
  }

  function confirmArtist() {
    if (!state.ready) return;
    if (state.currentSection !== 'confirm') {
      activateSection('confirm');
      setStatus('Controlla il personaggio prima di confermare');
      return;
    }
    var config = currentConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('adf:makehuman-confirmed', { detail:config }));
    window.__ADF_MAKEHUMAN_CONFIRMED__ = config;
    setStatus('Artista confermato');
  }

  function togglePreview(forceOff) {
    var next = forceOff ? false : !document.body.classList.contains('preview-mode');
    document.body.classList.toggle('preview-mode', next);
    setTimeout(resize, 230);
  }

  function bindUi() {
    initTabs();
    els.sexFemale.addEventListener('click', function () { setSex(0.10); });
    els.sexNeutral.addEventListener('click', function () { setSex(0.50); });
    els.sexMale.addEventListener('click', function () { setSex(0.90); });
    els.faceAreaFilter.addEventListener('change', renderFaceMorphs);
    els.morphSearch.addEventListener('input', renderMorphList);
    els.groupFilter.addEventListener('change', renderMorphList);
    els.detailSearch.addEventListener('input', renderDetails);
    els.wardrobeSearch.addEventListener('input', renderWardrobe);
    els.btnClearWardrobe.addEventListener('click', clearWardrobe);
    els.btnClearDetails.addEventListener('click', clearDetails);
    els.btnRandom.addEventListener('click', randomCurrentSection);
    els.btnResetSection.addEventListener('click', resetCurrentSection);
    els.btnPreview.addEventListener('click', function () { togglePreview(false); });
    els.previewExit.addEventListener('click', function () { togglePreview(true); });
    els.btnConfirmArtist.addEventListener('click', confirmArtist);
    els.btnConfirmInside.addEventListener('click', confirmArtist);
    els.btnBack.addEventListener('click', function () {
      var idx = SECTION_ORDER.indexOf(state.currentSection);
      if (idx > 0) activateSection(SECTION_ORDER[idx - 1]);
    });

    els.btnCollapseGroups.addEventListener('click', function () {
      var groups = Array.from(document.querySelectorAll('.morph-group'));
      var collapse = groups.some(function (g) { return !g.classList.contains('collapsed'); });
      groups.forEach(function (g) { g.classList.toggle('collapsed', collapse); });
      els.btnCollapseGroups.textContent = collapse ? 'Espandi gruppi' : 'Comprimi gruppi';
    });

    document.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
    });

    // Dev-only compatibility hooks; intentionally hidden from player UI.
    els.btnSaveLocal.addEventListener('click', saveLocal);
    els.btnLoadLocal.addEventListener('click', loadLocal);
    els.btnExport.addEventListener('click', exportJson);
    els.fileImport.addEventListener('change', function () { importFile(els.fileImport.files[0]); });
  }

  async function start() {
    collectEls();
    bindUi();
    initScene();
    animate();

    try {
      loadProgress('Carico il personaggio', 'resources.json', 8);
      setStatus('Carico risorse…', 'busy');
      var response = await fetch(DATA_URL + 'resources.json');
      if (!response.ok) throw new Error('resources.json HTTP ' + response.status);
      state.resources = await response.json();
      state.resources.baseUrl = DATA_URL;

      loadProgress('Carico il personaggio', 'Mesh HM08 completa', 23);
      state.human = new makehuman.Human(state.resources);
      state.pivot.add(state.human);
      await state.human.loadModel();

      loadProgress('Carico il personaggio', 'Morph target', 45);
      setStatus('Carico morph target…', 'busy');
      await state.human.loadTargets(DATA_URL + 'targets/' + state.resources.targets);

      loadProgress('Preparo il camerino', 'Costruisco i controlli', 82);
      state.currentSkin = state.resources.defaultSkin || null;
      state.ready = true;
      buildAllMorphs();
      buildQuickMorphs();
      buildBodyPresets();
      buildFaceEditor();
      buildWardrobe();
      buildSkins();
      updateSexButtons();
      activateSection('identity', { camera:false });
      setView('full');

      loadProgress('Pronto', 'Camerino pronto', 100);
      setTimeout(function () { els.loadCard.classList.add('hidden'); }, 300);
      setStatus('Pronto');

      window.__ADF_MAKEHUMAN_EDITOR__ = {
        state:state,
        currentConfig:currentConfig,
        applyConfig:applyConfig,
        setModifier:setModifier,
        setView:setView,
        activateSection:activateSection,
        confirmArtist:confirmArtist
      };
    } catch (err) {
      console.error(err);
      loadProgress('Errore di avvio', err.message || String(err), 100);
      setStatus('Errore: ' + (err.message || String(err)), 'error');
    }
  }

  start();


  /* ADF_CUSTOM_TARGETS_V15 */
  var adfCustomTargets = [];
  var adfCustomTargetValues = {};
  var adfCustomTargetsInstalled = false;
  var adfCustomDirty = false;
  var adfCustomPendingConfig = null;

  function adfTargetLabel(name) {
    return String(name || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function adfMarkCustomTargetsDirty() {
    adfCustomDirty = true;
    if (state.human && state.human.targets) {
      state.human.targets.lastmorphTargetInfluences = null;
      state.human.targets.lastBake = 0;
    }
  }

  function adfWrapTargetRuntime() {
    if (!state.human || !state.human.targets || state.human.targets.__adfCustomWrapped) return;
    var targets = state.human.targets;
    var originalApplyTargets = targets.applyTargets.bind(targets);
    targets.__adfCustomWrapped = true;
    targets.applyTargets = function () {
      var changed = originalApplyTargets();
      if (!changed && adfCustomDirty) {
        targets.lastmorphTargetInfluences = null;
        targets.lastBake = 0;
        changed = originalApplyTargets();
      }
      if (changed || adfCustomDirty) {
        var human = state.human;
        var verts = human && human.mesh && human.mesh.geometry && human.mesh.geometry.vertices;
        if (verts) {
          for (var t = 0; t < adfCustomTargets.length; t++) {
            var target = adfCustomTargets[t];
            var value = Number(adfCustomTargetValues[target.id] || 0);
            if (!value) continue;
            var deltas = target.vertices || [];
            for (var i = 0; i < deltas.length; i++) {
              var d = deltas[i];
              var v = verts[d[0]];
              if (!v) continue;
              v.x += d[1] * value;
              v.y += d[2] * value;
              v.z += d[3] * value;
            }
          }
          human.mesh.geometry.verticesNeedUpdate = true;
          human.mesh.geometry.elementsNeedUpdate = true;
        }
        adfCustomDirty = false;
        return true;
      }
      return changed;
    };
  }

  function adfBuildCustomTargetControls() {
    if (!els || !els.bodyMorphs || !adfCustomTargets.length) return;
    var old = document.getElementById('adfCustomTargetsV15');
    if (old) old.remove();
    var root = document.createElement('div');
    root.id = 'adfCustomTargetsV15';
    root.style.cssText = 'margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);display:grid;gap:10px;';
    var groups = {};
    adfCustomTargets.forEach(function (target) {
      var group = target.group || 'Target extra';
      if (!groups[group]) groups[group] = [];
      groups[group].push(target);
    });
    Object.keys(groups).sort().forEach(function (group) {
      var title = document.createElement('div');
      title.textContent = adfTargetLabel(group);
      title.style.cssText = 'font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;opacity:.7;margin-top:6px;';
      root.appendChild(title);
      groups[group].forEach(function (target) {
        var row = document.createElement('label');
        row.dataset.adfTargetId = target.id;
        row.style.cssText = 'display:grid;grid-template-columns:minmax(135px,1fr) minmax(140px,2fr) 44px;gap:10px;align-items:center;font-size:12px;';
        var name = document.createElement('span');
        name.textContent = adfTargetLabel(target.name || target.id.split('/').pop());
        var input = document.createElement('input');
        input.type = 'range'; input.min = target.min == null ? 0 : target.min; input.max = target.max == null ? 1 : target.max; input.step = target.step || 0.01;
        input.value = adfCustomTargetValues[target.id] == null ? 0 : adfCustomTargetValues[target.id];
        var value = document.createElement('b');
        value.textContent = Number(input.value).toFixed(2);
        input.addEventListener('input', function () {
          adfCustomTargetValues[target.id] = Number(input.value);
          value.textContent = Number(input.value).toFixed(2);
          adfMarkCustomTargetsDirty();
        });
        row.appendChild(name); row.appendChild(input); row.appendChild(value); root.appendChild(row);
      });
    });
    els.bodyMorphs.appendChild(root);
    if (els.morphCount && !els.morphCount.dataset.adfExtrasAdded) {
      var n = Number(els.morphCount.textContent || 0);
      if (Number.isFinite(n)) els.morphCount.textContent = String(n + adfCustomTargets.length);
      els.morphCount.dataset.adfExtrasAdded = '1';
    }
  }

  function adfApplyPendingCustomConfig() {
    if (!adfCustomPendingConfig) return;
    Object.keys(adfCustomPendingConfig).forEach(function (id) {
      if (adfCustomTargetValues[id] !== undefined) adfCustomTargetValues[id] = Number(adfCustomPendingConfig[id]) || 0;
    });
    adfCustomPendingConfig = null;
    adfBuildCustomTargetControls();
    adfMarkCustomTargetsDirty();
  }

  function adfInitCustomTargets() {
    if (adfCustomTargetsInstalled || !state.human || !state.human.targets || !state.human.targets.targetData || !els.bodyMorphs) return;
    adfCustomTargetsInstalled = true;
    fetch(DATA_URL + 'custom-targets.json').then(function (res) {
      if (!res.ok) throw new Error('custom-targets.json HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      adfCustomTargets = Array.isArray(data.targets) ? data.targets : [];
      adfCustomTargets.forEach(function (target) { adfCustomTargetValues[target.id] = 0; });
      adfWrapTargetRuntime();
      adfBuildCustomTargetControls();
      adfApplyPendingCustomConfig();
      adfMarkCustomTargetsDirty();
      console.info('ADF custom targets caricati:', adfCustomTargets.length);
    }).catch(function (err) {
      adfCustomTargetsInstalled = false;
      console.warn('ADF custom targets non caricati', err);
    });
  }

  var adfBaseCurrentConfig = currentConfig;
  currentConfig = function () {
    var cfg = adfBaseCurrentConfig();
    cfg.customTargets = Object.assign({}, adfCustomTargetValues);
    return cfg;
  };

  var adfBaseApplyConfig = applyConfig;
  applyConfig = async function (config) {
    var result = await adfBaseApplyConfig(config);
    if (config && config.customTargets) {
      adfCustomPendingConfig = Object.assign({}, config.customTargets);
      adfApplyPendingCustomConfig();
    }
    return result;
  };

  var adfCustomTargetTimer = setInterval(function () {
    adfInitCustomTargets();
    if (adfCustomTargetsInstalled && adfCustomTargets.length) clearInterval(adfCustomTargetTimer);
  }, 400);

}());
