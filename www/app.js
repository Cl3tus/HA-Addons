/* ============================================================
   ESPHome E-ink Lambda Editor — application logic (Phase 1)
   Vanilla JS + Konva (canvas) + js-yaml (import). Runs from file://.
   Author note: code/comments in English, UI/labels in Dutch.
   ============================================================ */
'use strict';

/* ---------------- constants ---------------- */
const MDI_VERSION = '7.4.47';
const ANCHORS = [
  ['TOP_LEFT','TOP_CENTER','TOP_RIGHT'],
  ['CENTER_LEFT','CENTER','CENTER_RIGHT'],
  ['BOTTOM_LEFT','BOTTOM_CENTER','BOTTOM_RIGHT'],
];
const LS_KEY = 'eink_editor_state_v1';
const uid = (p='e') => p + Math.random().toString(36).slice(2,8);
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const esc = s => String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
const escFmt = s => esc(s).replace(/%/g,'%%');
/* auto-space a suffix in builder mode: "L/u" -> " L/u", " uur" -> " uur"
   (trimmed first, so no double space), but ° / % / ‰ stay attached: "21°C", "50%". */
const _suffixOut = s => { s=String(s||'').trim(); return s ? (/^[°%‰]/.test(s) ? s : ' '+s) : ''; };
/* i18n helper — delegates to lang.js if present, else returns the Dutch text */
const T = (nl,en) => (window.t ? window.t(nl,en) : nl);

/* ---------------- ESPHome waveshare_epaper models ----------------
   colour: 'mono' (B/W) | 'bwr' (black/white/red) | '7c' (7-colour)     */
const EINK_MODELS = [
  {v:'1.54in', c:'mono', d:'1.54" B/W'},
  {v:'1.54inv2', c:'mono', d:'1.54" V2 B/W'},
  {v:'1.54inv2-b', c:'bwr', d:'1.54" V2 Black/White/Red'},
  {v:'2.13in', c:'mono', d:'2.13" B/W (not tested)'},
  {v:'2.13in-ttgo', c:'mono', d:'2.13" TTGO T5 V2.3'},
  {v:'2.13in-ttgo-b73', c:'mono', d:'2.13" TTGO B73'},
  {v:'2.13in-ttgo-b74', c:'mono', d:'2.13" TTGO B74'},
  {v:'2.13in-ttgo-b1', c:'mono', d:'2.13" TTGO B1'},
  {v:'2.13in-ttgo-dke', c:'mono', d:'2.13" TTGO DKE (DEPG0213BN)'},
  {v:'2.13inv2', c:'mono', d:'2.13" V2 (Pico 2.13v2)'},
  {v:'2.13inv3', c:'mono', d:'2.13" V3 (Pico 2.13v3)'},
  {v:'2.70in', c:'mono', d:'2.70" B/W'},
  {v:'2.70inv2', c:'mono', d:'2.70" V2 B/W'},
  {v:'2.70in-b', c:'bwr', d:'2.70" Black/White/Red'},
  {v:'2.70in-bv2', c:'bwr', d:'2.70" V2 Black/White/Red'},
  {v:'2.90in', c:'mono', d:'2.90" B/W'},
  {v:'2.90in-dke', c:'mono', d:'2.90" DKE'},
  {v:'2.90inv2', c:'mono', d:'2.90" V2'},
  {v:'2.90inv2-r2', c:'mono', d:'2.90" V2 r2'},
  {v:'2.90in-b', c:'mono', d:'2.90" B/W only'},
  {v:'2.90in-bV3', c:'mono', d:'2.90" B/W only (V3)'},
  {v:'4.20in', c:'mono', d:'4.20" B/W'},
  {v:'4.20in-bV2', c:'mono', d:'4.20" V2 B/W only'},
  {v:'gdey042t81', c:'mono', d:'GoodDisplay GDEY042T81 4.2" B/W'},
  {v:'4.20in-bV2-bwr', c:'bwr', d:'4.20" V2 BWR (double buffer)'},
  {v:'5.83in', c:'mono', d:'5.83" B/W'},
  {v:'5.83inv2', c:'mono', d:'5.83" V2 B/W'},
  {v:'gdey0583t81', c:'mono', d:'GoodDisplay GDEY0583T81 5.83" B/W'},
  {v:'7.30in-f', c:'7c', d:'7.3" 7-colour (b/w/r/y/blue/green/orange)'},
  {v:'7.50in', c:'mono', d:'7.50" B/W'},
  {v:'7.50in-bV2', c:'mono', d:'7.50" B/W only (also V3)'},
  {v:'7.50in-bV3', c:'mono', d:'7.50" B/W only (V3 sticker)'},
  {v:'7.50in-bV3-bwr', c:'bwr', d:'7.50" BWR (V3 sticker, double buffer)'},
  {v:'7.50in-bc', c:'mono', d:'7.50" B/W only (C sticker)'},
  {v:'7.50inV2', c:'mono', d:'7.50" V2 (not for ESP8266)'},
  {v:'7.50inV2alt', c:'mono', d:'7.50" V2 (alternative)'},
  {v:'7.50inV2p', c:'mono', d:'7.50" V2 partial/fast refresh (>= Sep 2023)'},
  {v:'7.50in-hd-b', c:'mono', d:'7.50" HD (not for ESP8266)'},
  {v:'gdey029t94', c:'mono', d:'GoodDisplay GDEY029T94 2.9" mono'},
  {v:'gdew029t5', c:'mono', d:'GoodDisplay GDEW029T5 (MagTag/Badger)'},
  {v:'1.54in-m5coreink-m09', c:'mono', d:'M5Stack Core Ink (gdew0154m09)'},
  {v:'13.3in-k', c:'mono', d:'13.3" K model 960×680 B/W only'},
];
function modelInfo(v){ return EINK_MODELS.find(m=>m.v===v) || {v, c:'bwr', d:''}; }
/* native panel resolution (landscape W×H) for the known models, so picking a
   model can pre-fill width/height. Not exhaustive — unknown models keep current. */
var MODEL_RES = {
  '1.54in':[200,200],'1.54inv2':[200,200],'1.54inv2-b':[200,200],'1.54in-m5coreink-m09':[200,200],
  '2.13in':[250,122],'2.13in-ttgo':[250,122],'2.13in-ttgo-b73':[250,122],'2.13in-ttgo-b74':[250,122],
  '2.13in-ttgo-b1':[250,122],'2.13in-ttgo-dke':[250,122],'2.13inv2':[250,122],'2.13inv3':[250,122],
  '2.70in':[264,176],'2.70inv2':[264,176],'2.70in-b':[264,176],'2.70in-bv2':[264,176],
  '2.90in':[296,128],'2.90in-dke':[296,128],'2.90inv2':[296,128],'2.90inv2-r2':[296,128],
  '2.90in-b':[296,128],'2.90in-bV3':[296,128],'gdey029t94':[296,128],'gdew029t5':[296,128],
  '4.20in':[400,300],'4.20in-bV2':[400,300],'gdey042t81':[400,300],'4.20in-bV2-bwr':[400,300],
  '5.83in':[600,448],'5.83inv2':[648,480],'gdey0583t81':[648,480],
  '7.30in-f':[800,480],
  '7.50in':[640,384],'7.50in-bV2':[800,480],'7.50in-bV3':[800,480],'7.50in-bV3-bwr':[800,480],
  '7.50in-bc':[800,480],'7.50inV2':[800,480],'7.50inV2alt':[800,480],'7.50inV2p':[800,480],'7.50in-hd-b':[880,528],
  '13.3in-k':[960,680],
};
function modelRes(v){ return MODEL_RES[v]||null; }

/* colour palette for a display colour-type */
function mkColor(id,r,g,b,w,css){ return {id,r,g,b,w,css}; }
function colorSetFor(type){
  const white=mkColor('color_bg',0,0,0,0,'#f4f1e9');
  const black=mkColor('color_text',0,0,0,100,'#1d1d1b');
  if(type==='mono') return [white,black];
  if(type==='7c') return [white,black,
    mkColor('red',0,0,0,0,'#d6483b'), mkColor('yellow',0,0,0,0,'#e3c81e'),
    mkColor('blue',0,0,0,0,'#2f5fd0'), mkColor('green',0,0,0,0,'#3a9e4a'),
    mkColor('orange',0,0,0,0,'#e08a2e')];
  // bwr (default)
  return [white,black, mkColor('red',100,0,0,0,'#d6483b')];
}
/* derive the colour-type from an existing palette */
function paletteType(colors){
  const ids=(colors||[]).map(c=>c.id);
  if(ids.includes('orange')||ids.includes('yellow')||ids.includes('green')||ids.includes('blue')) return '7c';
  if(ids.includes('red')) return 'bwr';
  return 'mono';
}

/* default "WAITING FOR DATA..." element, centred on the profile's device */
function makeWaitText(p){
  const d=(p&&p.device)||{w:480,h:800};
  const fid=(p&&p.fonts&&p.fonts[0]&&p.fonts[0].id)||'font_klein';
  return { id:uid(), type:'text', name:T('Tekst','Text')+' 1', visible:true,
    x:Math.round(d.w/2), y:Math.round(d.h/2), colorId:'color_text', anchor:'CENTER', fontId:fid,
    source:{kind:'static',text:'WAITING FOR DATA...',sourceId:'',expr:''},
    format:{mode:'builder',decimals:1,prefix:'',suffix:'',raw:'%s'}, transform:'none', transformArg:{},
    condition:{enabled:false,sourceId:'',op:'on',val:'',val2:'',
      whenTrue:{text:'',iconName:'',iconHex:'',colorId:'',visible:true},
      whenFalse:{text:'',iconName:'',iconHex:'',colorId:'',visible:true}} };
}
/* ---------------- seed profile (clean, empty starting point) ---------------- */
function seedProfile(name='My display'){
  return {
    id: uid('p'),
    name,
    schema_version: 1,
    device: { name:'eink-display', comment:'E-ink Display',
              model:'7.50in-bV3-bwr', rotation:90, w:480, h:800, bg:'#d4d6d7' },
    // a minimal, generic font set so text/icons render out of the box
    fonts: [
      f('font_klein','gfonts',null,'Roboto',400,25,false),
      f('font_medium','gfonts',null,'Roboto',500,25,false),
      f('font_boven','gfonts',null,'Noto Sans Display',900,35,false),
      f('font_mdi_large','local','fonts/materialdesignicons-webfont.ttf',null,null,50,false),
      f('font_mdi_medium','local','fonts/materialdesignicons-webfont.ttf',null,null,60,false),
      f('font_mdi_small','local','fonts/materialdesignicons-webfont.ttf',null,null,30,false),
    ],
    colors: colorSetFor('bwr'),   // palette matches the model's colour capability
    sources: [],          // start empty — add via "Value sources → From Home Assistant"
    elements: [],
    waitEnabled: true,    // whether to emit the "waiting for data" branch at all
    waitElements: [],     // seeded with a default WAITING FOR DATA text on first boot
    output: outputDefaults(),   // which YAML blocks to generate
  };
  function f(id,kind,file,family,weight,size,dynamic,base){
    return {id,kind,file,family,weight,size,dynamic:!!dynamic,
            baseCharset: base || ' -.:%/°0123456789',
            dataUrl:null, seedGlyphs: base ? base.split('') : []};
  }
  function c(id,r,g,b,w,css){ return {id,r,g,b,w,css}; }
  function s(id,entityId,kind,sample){ return {id,entityId,kind,sample}; }
}

/* ---------------- state ---------------- */
var state = { profiles:[], current:null }; // var zodat window.state toegankelijk is voor theme.js
let undoStack = [], redoStack = [];
let selectedId = null;             // primary selection (drives the inspector)
let selectedIds = new Set();       // all selected element ids (multi-select)
let _layerAnchor = null;           // anchor id for shift-range select in layers
let zoom = 1;
let HA_STATES=null, HA_LIVE=false;   // live HA data (add-on build)
let LIVE_ON=false, LIVE_STATUS='off';  // live toggle + status dot (off|ok|warn|error)
let LIVE_TIMER=null;                    // auto-refresh interval handle
let shiftDown = false; // hold Shift to constrain line endpoints to 45° steps
window.addEventListener('keydown', e=>{ if(e.key==='Shift') shiftDown=true; });
window.addEventListener('keyup',   e=>{ if(e.key==='Shift') shiftDown=false; });
window.addEventListener('blur',    ()=>{ shiftDown=false; });

function profile(){ return state.profiles.find(p=>p.id===state.current); }
let editScreen='main';   // 'main' | 'wait' — which screen's elements you're editing
function activeKey(){ return editScreen==='wait' ? 'waitElements' : 'elements'; }
function els(){ const p=profile(); if(!p[activeKey()]) p[activeKey()]=[]; return p[activeKey()]; }
function setEls(arr){ profile()[activeKey()]=arr; }
function selected(){ return els().find(e=>e.id===selectedId) || null; }
function fontById(id){ return profile().fonts.find(f=>f.id===id); }
function colorById(id){ return profile().colors.find(c=>c.id===id); }
function srcById(id){ return profile().sources.find(s=>s.id===id); }

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){ state = JSON.parse(raw); }
  }catch(e){ console.warn('load failed',e); }
  if(!state.profiles || !state.profiles.length){
    const p = seedProfile();
    state = { profiles:[p], current:p.id };
  }
  if(!state.current) state.current = state.profiles[0].id;
}
function persist(){
  try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); }catch(e){}
  if(SERVER_STORAGE){ clearTimeout(_profileSyncTimer); _profileSyncTimer=setTimeout(syncProfilesToServer,2000); }
}

/* ---------------- undo / redo ---------------- */
function snapshot(){ return JSON.stringify(els()); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>60) undoStack.shift(); redoStack=[]; }
function undo(){ if(!undoStack.length) return; redoStack.push(snapshot()); setEls(JSON.parse(undoStack.pop())); afterChange(); }
function redo(){ if(!redoStack.length) return; undoStack.push(snapshot()); setEls(JSON.parse(redoStack.pop())); afterChange(); }

function afterChange(){ persist(); renderCanvas(); renderLayers(); renderInspector(); renderProfiles(); if($('#code-drawer').classList.contains('open')) renderCode(); }

/* ============================================================
   FONT LOADING (preview)
   ============================================================ */
var LOADED_FONT_IDS=new Set();   // font ids with a registered FontFace (uploaded OR loaded from fonts/)
function previewFamily(font){
  if(/materialdesignicons/i.test(font.file||'')) return 'Material Design Icons';
  if(font.dataUrl || LOADED_FONT_IDS.has(font.id)) return 'pf_'+font.id;
  if(font.kind==='gfonts') return font.family;
  // local font not uploaded yet -> fallback
  if(/digital/i.test(font.file||'')) return 'IBM Plex Mono';
  return 'IBM Plex Sans';
}
/* inline font preview inside the Fonts modal (#nf-preview) */
async function previewFontInline(f){
  const host=$('#nf-preview'); if(!host||!f) return;
  let fam=previewFamily(f);
  const isMdi=/materialdesignicons/i.test(f.file||'');
  // a local font stored on the server (no inline bytes) → fetch + register it so the preview renders
  if(!isMdi && f.kind!=='gfonts' && !f.dataUrl){
    const fname=_fontFileName(f);
    if(fname && SERVER_FONTS.has(fname)){
      fam='pf_'+f.id;
      if(!_previewLoaded.has(fam)){
        host.style.display='block'; host.innerHTML='<div class="fld">…</div>';
        try{ const r=await fetch('api/fonts/'+encodeURIComponent(fname));
          if(r.ok){ const buf=await r.arrayBuffer(); const ff=new FontFace(fam,buf); await ff.load(); document.fonts.add(ff); _previewLoaded.add(fam); } }catch(e){}
      }
    }
  }
  const sample = isMdi ? '4 0 8 C 5 6 4'
                       : 'AaBbCc Gg 0123 .,:%/°€';
  const sz=Math.max(14,Math.min(f.size||30,56));
  host.style.display='block';
  if(isMdi){
    // real MDI icons via the bundled .mdi webfont classes (a few fun ones)
    const fun=['rocket-launch','robot-happy','heart','weather-sunny','coffee','cat','ghost','pac-man','music-note','star'];
    const isz=Math.max(22,Math.min(f.size||30,64));
    host.innerHTML=`<div class="fld" style="margin-bottom:2px">Preview</div>`
      +`<div class="hint" style="margin:0 0 6px">${esc(f.id)} (${f.size}px)</div>`
      +`<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;line-height:1">`
      +fun.map(n=>`<span class="mdi mdi-${n}" style="font-size:${isz}px" title="mdi-${n}"></span>`).join('')
      +`</div>`;
    return;
  }
  host.innerHTML=`<div class="fld" style="margin-bottom:4px">Preview · ${esc(f.id)} — ${f.size}px · ${esc(fam)}</div>`+
    `<div style="font-family:'${fam.replace(/'/g,'')}', sans-serif;font-size:${sz}px;line-height:1.25;word-break:break-word">${sample}</div>`;
}
var _previewLoaded=new Set();
function fontLoaded(font){
  return /materialdesignicons/i.test(font.file||'') || !!font.dataUrl || font.kind==='gfonts' || LOADED_FONT_IDS.has(font.id);
}
function injectGoogleFonts(){
  /* Add-on build: preview display fonts (Noto/Roboto) and IBM Plex are bundled
     locally via vendor/fonts.css, so no external Google Fonts request is made. */
  return;
}
async function registerUploadedFonts(){
  await refreshServerFonts();
  for(const font of profile().fonts){
    const fam='pf_'+font.id;
    if(font.dataUrl){
      try{ const ff=new FontFace(fam, `url(${font.dataUrl})`); await ff.load(); document.fonts.add(ff); LOADED_FONT_IDS.add(font.id); }
      catch(e){ console.warn('font load',font.id,e); }
      continue;
    }
    // local font that already lives in the server fonts/ folder → load it so it
    // renders on the canvas instead of hanging in "upload needed" limbo
    if(font.kind==='local' && !/materialdesignicons/i.test(font.file||'') && !LOADED_FONT_IDS.has(font.id)){
      const fname=_fontFileName(font);
      if(fname && SERVER_FONTS.has(fname)){
        try{ const r=await fetch('api/fonts/'+encodeURIComponent(fname));
          if(r.ok){ const buf=await r.arrayBuffer(); const ff=new FontFace(fam,buf); await ff.load(); document.fonts.add(ff); LOADED_FONT_IDS.add(font.id); } }catch(e){}
      }
    }
  }
}

/* ============================================================
   VALUE RESOLUTION (preview) + TRANSFORMS
   ============================================================ */
function rawValue(el){
  if(!el.source) return '';
  if(el.source.kind==='static') return el.source.text||'';
  if(el.source.kind==='expr')   return '(expr)';
  const src = srcById(el.source.sourceId);
  if(!src) return '?';
  // live HA value (add-on) takes precedence over the static sample when available
  if(typeof HA_LIVE!=='undefined' && HA_LIVE && src.live!=null && src.live!=='') return src.live;
  return src.sample;
}
function transformPreview(el, val){
  const t = el.transform||'none', a = el.transformArg||{};
  if(t==='custom') return customFmtPreview(el, val);
  if(STRTRANSFORMS[t] && STRTRANSFORMS[t].prev) return STRTRANSFORMS[t].prev(String(val));
  if(NAMETRANSFORMS[t]) return nameTransformPreview(NAMETRANSFORMS[t], val);
  switch(t){
    case 'trimSeconds': { const sv=String(val); return sv.length>3?sv.slice(0,-3):sv; }
    case 'upper': return String(val).toUpperCase();
    case 'capitalize': { const sv=String(val); return sv.charAt(0).toUpperCase()+sv.slice(1); }
    case 'boolLabel': return (String(val)==='on'||val===true)?(a.trueLabel||'Aan'):(a.falseLabel||'Uit');
    case 'scale': return Number(val)*(a.factor||1);
    default: return val;
  }
}
function formatPreview(el, val){
  const fmt = el.format||{};
  let body;
  const srcKind = el.source && el.source.kind==='sensor' ? (srcById(el.source.sourceId)||{}).kind : el.source && el.source.kind;
  const numeric = srcKind==='number' && el.transform!=='boolLabel';
  if(fmt.mode==='raw' && fmt.raw){
    // best-effort preview for raw printf
    body = fmt.raw.replace(/%%/g,'\u0001')
      .replace(/%[-+ 0-9.]*[dfsxX]/, m=>{
        if(/[df]/.test(m)){ const d=(m.match(/\.(\d+)/)||[])[1]; return Number(val).toFixed(d?+d:0); }
        return String(val);
      }).replace(/\u0001/g,'%');
  } else {
    if(numeric){ const d = el.transform==='roundN'?(el.transformArg.n??1):(fmt.decimals??1); body = Number(val).toFixed(d); }
    else body = String(val);
  }
  return (fmt.prefix||'') + body + _suffixOut(fmt.suffix);
}
function displayText(el){ return formatPreview(el, transformPreview(el, rawValue(el))); }

/* pick the wifi glyph for preview: use the chosen source's sample dBm if set, else weakest */
function wifiPreviewHex(el){
  const w=el.wifi||{}; const levels=w.levels||[];
  let dbm=-65; // default sample
  if(w.sourceId){ const src=srcById(w.sourceId); if(src && !isNaN(+src.sample)) dbm=+src.sample; }
  for(const lv of levels){ if(dbm>=lv.min) return lv.hex; }
  return levels.length?levels[levels.length-1].hex:'F092B';
}
/* tiny strftime preview supporting the common tokens */
function strftimePreview(fmt){
  const d=new Date();
  const p2=n=>String(n).padStart(2,'0');
  const h24=d.getHours(), h12=((h24+11)%12)+1, ampm=h24<12?'AM':'PM';
  return String(fmt||'%H:%M')
    .replace(/%H/g,p2(h24)).replace(/%I/g,p2(h12)).replace(/%l/g,String(h12))
    .replace(/%M/g,p2(d.getMinutes())).replace(/%S/g,p2(d.getSeconds()))
    .replace(/%p/g,ampm).replace(/%P/g,ampm.toLowerCase())
    .replace(/%d/g,p2(d.getDate())).replace(/%m/g,p2(d.getMonth()+1)).replace(/%Y/g,d.getFullYear())
    .replace(/%%/g,'%');
}

/* condition evaluation (preview) */
function condResult(el){
  const cd = el.condition;
  if(!cd || !cd.enabled || !cd.sourceId) return null;
  const src = srcById(cd.sourceId);
  let v = src ? src.sample : null;
  if(typeof HA_LIVE!=='undefined' && HA_LIVE && src && src.live!=null && src.live!=='') v=src.live;
  switch(cd.op){
    case 'on': return String(v)==='on';
    case 'eq': return (src&&src.kind==='number')? Number(v)===Number(cd.val) : String(v)===String(cd.val);
    case 'lt': return Number(v) <  Number(cd.val);
    case 'gt': return Number(v) >  Number(cd.val);
    case 'between': return Number(v)>=Number(cd.val) && Number(v)<=Number(cd.val2);
  }
  return null;
}
/* returns effective element after applying condition branch overrides */
function effective(el){
  const r = condResult(el);
  if(r===null) return {el, draw:el.visible!==false};
  const ov = r ? el.condition.whenTrue : el.condition.whenFalse;
  if(!ov) return {el, draw:el.visible!==false};
  const merged = Object.assign({}, el);
  if(ov.text!=null && ov.text!=='')   merged.source = Object.assign({},el.source,{kind:'static',text:ov.text});
  if(ov.iconName)                     { merged.iconName=ov.iconName; merged.iconHex=ov.iconHex; }
  if(ov.colorId)                      merged.colorId=ov.colorId;
  const vis = ov.visible!==false && el.visible!==false;
  return {el:merged, draw:vis};
}

/* ============================================================
   KONVA CANVAS
   ============================================================ */
let stage, gridLayer, contentLayer, transformer, selectionVisual;
function initStage(){
  const p = profile();
  $('#konva-host').innerHTML='';
  stage = new Konva.Stage({ container:'#konva-host', width:p.device.w, height:p.device.h });
  gridLayer = new Konva.Layer({listening:false});
  contentLayer = new Konva.Layer();
  stage.add(gridLayer); stage.add(contentLayer);
  setupMarquee();
  applyZoom();
}

/* #11 — rubber-band selection: click+drag on empty canvas selects elements it touches */
let _marqueeRect=null, _marqueeStart=null, _marqueeOnNode=null;
// a near-full-canvas element acts as a backdrop: dragging on it should rubber-band
// the things on top of it, not move the backdrop itself
function isBackdropNode(node){
  if(!node) return false;
  const d=profile().device; const b=node.getClientRect({relativeTo:contentLayer});
  return b.width>=d.w*0.6 && b.height>=d.h*0.6;
}
function setupMarquee(){
  stage.on('mousedown touchstart', e=>{
    if(e.target!==stage && !_marqueeOnNode) return;   // empty area, or a backdrop flagged itself
    const e2=e.evt;
    const add = e2 && (e2.ctrlKey||e2.metaKey||e2.shiftKey);
    _marqueeStart=stage.getRelativePointerPosition();
    if(!_marqueeStart) return;
    _marqueeBase = add ? new Set(selectedIds) : new Set();
    _marqueeRect=new Konva.Rect({x:_marqueeStart.x,y:_marqueeStart.y,width:0,height:0,
      stroke:'#e8a13a',dash:[4,3],fill:'rgba(232,161,58,0.08)',listening:false});
    contentLayer.add(_marqueeRect); contentLayer.draw();
  });
  stage.on('mousemove touchmove', ()=>{
    if(!_marqueeStart||!_marqueeRect) return;
    const p=stage.getRelativePointerPosition(); if(!p) return;
    _marqueeRect.setAttrs({x:Math.min(_marqueeStart.x,p.x), y:Math.min(_marqueeStart.y,p.y),
      width:Math.abs(p.x-_marqueeStart.x), height:Math.abs(p.y-_marqueeStart.y)});
    contentLayer.batchDraw();
  });
  const finish=()=>{
    if(!_marqueeStart||!_marqueeRect) return;
    const box=_marqueeRect.getClientRect({relativeTo:contentLayer});
    _marqueeRect.destroy(); _marqueeRect=null; const start=_marqueeStart; _marqueeStart=null;
    if(box.width<4 && box.height<4){ // treated as a plain click
      const onNode=_marqueeOnNode; _marqueeOnNode=null;
      if(onNode){ select(onNode); return; }   // click on a backdrop element → select it
      if(!_marqueeBase || !_marqueeBase.size) select(null);
      contentLayer.draw(); return;
    }
    _marqueeOnNode=null;
    const hit=new Set(_marqueeBase||[]);
    els().forEach(el=>{
      if(el.visible===false) return;
      const n=contentLayer.getChildren(x=>x._elId===el.id)[0]; if(!n) return;
      const b=n.getClientRect({relativeTo:contentLayer});
      // only select elements FULLY inside the marquee (not partial overlaps), so a
      // big background rectangle isn't grabbed when you select things on top of it
      const contained = b.x>=box.x && b.y>=box.y && (b.x+b.width)<=(box.x+box.width) && (b.y+b.height)<=(box.y+box.height);
      if(contained) hit.add(el.id);
    });
    setSelection([...hit], [...hit][hit.size-1]);
  };
  stage.on('mouseup touchend', finish);
  _marqueeFinish = finish;   // expose to the (once-bound) window listeners below

  // also allow starting a marquee from the margin AROUND the canvas (the grey/
  // black/white area in #stage-wrap, outside the device) so you can rubber-band
  // from outside the page and still catch elements near the edges
  const wrap=$('#stage-wrap');
  if(wrap && !wrap._marqueeBound){
    wrap._marqueeBound=true;
    wrap.addEventListener('mousedown', e=>{
      if(e.button!==0) return;
      if($('#konva-host').contains(e.target)) return;             // inside canvas → Konva handles it
      if(e.target.closest && e.target.closest('#code-drawer')) return;
      const add = e.ctrlKey||e.metaKey||e.shiftKey;
      _marqueeStart = clientToStage(e.clientX, e.clientY);
      _marqueeBase = add ? new Set(selectedIds) : new Set();
      _marqueeRect=new Konva.Rect({x:_marqueeStart.x,y:_marqueeStart.y,width:0,height:0,
        stroke:'#e8a13a',dash:[4,3],fill:'rgba(232,161,58,0.08)',listening:false});
      contentLayer.add(_marqueeRect); contentLayer.draw();
      const move=ev=>{ if(!_marqueeStart||!_marqueeRect) return; const p=clientToStage(ev.clientX,ev.clientY);
        _marqueeRect.setAttrs({x:Math.min(_marqueeStart.x,p.x),y:Math.min(_marqueeStart.y,p.y),
          width:Math.abs(p.x-_marqueeStart.x),height:Math.abs(p.y-_marqueeStart.y)}); contentLayer.batchDraw(); };
      const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
        if(_marqueeFinish) _marqueeFinish(); };
      window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
      e.preventDefault();
    });
  }
}
/* map a viewport (clientX/Y) point to canvas/stage coordinates, clamped to the device */
function clientToStage(clientX, clientY){
  const r=$('#konva-host').getBoundingClientRect(); const p=profile();
  return { x: clamp((clientX-r.left)/zoom, 0, p.device.w),
           y: clamp((clientY-r.top)/zoom, 0, p.device.h) };
}
let _marqueeBase=null;
let _marqueeFinish=null;
// release outside the canvas should still finish the marquee (bound once)
window.addEventListener('mouseup', ()=>{ if(_marqueeStart && _marqueeFinish) _marqueeFinish(); });
window.addEventListener('touchend', ()=>{ if(_marqueeStart && _marqueeFinish) _marqueeFinish(); });
function applyZoom(){
  const p=profile(), W=p.device.w, H=p.device.h;
  const kh=$('#konva-host'), cv=$('#eink-canvas'), fr=$('#stage-frame');
  kh.style.width = W+'px'; kh.style.height = H+'px';
  stage.width(W); stage.height(H);
  // scale the inner content from the top-left and size the FRAME to the scaled
  // result, so #stage-wrap gets real scrollbars when the canvas overflows
  kh.style.transformOrigin='0 0'; kh.style.transform=`scale(${zoom})`;
  if(cv) cv.style.transform='none';   // the e-ink overlay fills the frame via inset:0
  fr.style.transform='none';
  fr.style.width = (W*zoom)+'px';
  fr.style.height = (H*zoom)+'px';
  fr.style.background = p.device.bg || '#d4d6d7';
  $('#zoom-val').textContent = Math.round(zoom*100)+'%';
}
function gridStep(){ return (profile().device.grid)|| 16; }
function drawGrid(){
  gridLayer.destroyChildren();
  if(!$('#tg-grid').checked){ gridLayer.draw(); return; }
  const p=profile(), step=gridStep();
  const minor='rgba(0,0,0,0.09)', major='rgba(0,0,0,0.20)';
  let i=0;
  for(let x=0;x<=p.device.w+0.5;x+=step,i++){
    const maj=i%4===0;
    gridLayer.add(new Konva.Line({points:[x,0,x,p.device.h],stroke:maj?major:minor,strokeWidth:maj?0.8:0.4}));
  }
  i=0;
  for(let y=0;y<=p.device.h+0.5;y+=step,i++){
    const maj=i%4===0;
    gridLayer.add(new Konva.Line({points:[0,y,p.device.w,y],stroke:maj?major:minor,strokeWidth:maj?0.8:0.4}));
  }
  gridLayer.draw();
}
function anchorOffset(anchor, w, h){
  let ox=0, oy=0;
  if(/CENTER$/.test(anchor)) ox=-w/2; else if(/RIGHT$/.test(anchor)) ox=-w;
  if(/^CENTER/.test(anchor)) oy=-h/2; else if(/^BOTTOM/.test(anchor)) oy=-h;
  return {ox,oy};
}
function buildNode(el){
  const eff = effective(el);
  if(!eff.draw) return null;
  const E = eff.el;
  const color = colorById(E.colorId) || {css:'#1d1d1b'};
  let node;

  if(E.type==='text' || E.type==='icon'){
    const font = fontById(E.fontId) || profile().fonts[0];
    const txt = E.type==='icon' ? mdiChar(E.iconHex) : displayText(E);
    node = new Konva.Text({ text:txt, fontFamily:previewFamily(font), fontSize:font.size,
                            fill:color.css, listening:true });
    // measure then position by anchor
    const w=node.width(), h=node.height();
    const {ox,oy}=anchorOffset(E.anchor||'TOP_LEFT', w, h);
    node.x(E.x+ox); node.y(E.y+oy);
    if(!fontLoaded(font)){ node.opacity(0.75); }
  }
  else if(E.type==='line'){
    node = new Konva.Line({points:[E.x,E.y,E.x2,E.y2], stroke:color.css, strokeWidth:1, hitStrokeWidth:10});
  }
  else if(E.type==='rect'){
    const w=E.w, h=E.h;   // centre-origin so the transformer rotates around the middle
    node = new Konva.Rect({x:E.x+w/2,y:E.y+h/2,width:w,height:h,offsetX:w/2,offsetY:h/2,rotation:E.rotation||0,
      stroke:E.filled?undefined:color.css, strokeWidth:1,
      fill:E.filled?color.css:'rgba(0,0,0,0.001)'});
  }
  else if(E.type==='triangle'){
    // local points centred on (0,0); position/rotate via the node so the
    // transformer handles (resize + rotate) work naturally
    const w=E.w, h=E.h;
    node = new Konva.Line({points:[0,-h/2, -w/2,h/2, w/2,h/2], closed:true,
      x:E.x, y:E.y, rotation:E.rotation||0,
      stroke:E.filled?undefined:color.css, strokeWidth:1, hitStrokeWidth:10,
      fill:E.filled?color.css:'rgba(0,0,0,0.001)'});
  }
  else if(E.type==='polygon'){
    node = new Konva.RegularPolygon({x:E.x,y:E.y,sides:Math.max(3,E.sides||6),radius:E.r||60,
      rotation:E.rotation||0,
      stroke:E.filled?undefined:color.css, strokeWidth:1,
      fill:E.filled?color.css:'rgba(0,0,0,0.001)'});
  }
  else if(E.type==='ring'){
    node = new Konva.Ring({x:E.x,y:E.y,innerRadius:Math.min(E.inner||30,(E.r||50)-1),outerRadius:E.r||50,
      fill:color.css});
  }
  else if(E.type==='gauge'){
    // matches ESPHome it.filled_gauge: a 180° half ring (top half) whose track is
    // outlined and which fills from the LEFT (9 o'clock) over the top toward the
    // right (3 o'clock); 50% = the left quarter (9→12 o'clock). No rotation.
    const pct=Math.max(0,Math.min(100,E.percent==null?50:E.percent));
    const ro=E.r||50, ri=Math.min(E.inner||30, ro-1);
    const A0=Math.PI, A2=2*Math.PI;   // west → east, over the top
    node = new Konva.Shape({ x:E.x, y:E.y, width:2*ro, height:2*ro, offsetX:ro, offsetY:ro, rotation:0, fill:color.css,
      sceneFunc:(ctx)=>{
        const cx=ro, cy=ro, col=color.css;
        // track outline (full 180° annulus)
        ctx.beginPath(); ctx.arc(cx,cy,ro,A0,A2,false); ctx.arc(cx,cy,ri,A2,A0,true); ctx.closePath();
        ctx.lineWidth=1; ctx.strokeStyle=col; ctx.stroke();
        // filled value sector
        if(pct>0){ const a1=A0 + (pct/100)*Math.PI;
          ctx.beginPath(); ctx.arc(cx,cy,ro,A0,a1,false); ctx.arc(cx,cy,ri,a1,A0,true); ctx.closePath();
          ctx.fillStyle=col; ctx.fill(); }
      },
      hitFunc:(ctx,shape)=>{ ctx.beginPath(); ctx.arc(ro,ro,ro,A0,A2,false); ctx.arc(ro,ro,ri,A2,A0,true); ctx.closePath(); ctx.fillStrokeShape(shape); }});
  }
  else if(E.type==='qr'){
    node = qrPreviewNode(E, color.css);
  }
  else if(E.type==='circle'){
    const rx=(E.rx!=null?E.rx:(E.r!=null?E.r:40)), ry=(E.ry!=null?E.ry:(E.r!=null?E.r:40));
    node = new Konva.Ellipse({x:E.x,y:E.y,radiusX:rx,radiusY:ry,
      stroke:E.filled?undefined:color.css, strokeWidth:1,
      fill:E.filled?color.css:'rgba(0,0,0,0.001)'});
  }
  else if(E.type==='wifi'){
    const font=fontById(E.fontId)||profile().fonts[0];
    node=new Konva.Text({ text:mdiChar(wifiPreviewHex(E)), fontFamily:previewFamily(font), fontSize:font.size, fill:color.css, listening:true });
    const w=node.width(), h=node.height(); const {ox,oy}=anchorOffset(E.anchor||'TOP_CENTER', w, h);
    node.x(E.x+ox); node.y(E.y+oy);
  }
  else if(E.type==='clock'){
    const font=fontById(E.fontId)||profile().fonts[0];
    const g=new Konva.Group({listening:true});
    const txt=strftimePreview(E.clock&&E.clock.strftime||'%H:%M');
    const hasIcon=E.clock&&E.clock.icon;
    const ifont=hasIcon?(fontById(E.clock.iconFontId)||font):null;
    // build text node first to know its height
    const txtNode=new Konva.Text({text:txt, fontFamily:previewFamily(font), fontSize:font.size, fill:color.css});
    let iconNode=null;
    if(hasIcon) iconNode=new Konva.Text({text:mdiChar(E.clock.iconHex), fontFamily:previewFamily(ifont), fontSize:ifont.size, fill:color.css});
    const midH=Math.max(txtNode.height(), iconNode?iconNode.height():0);
    if(iconNode){ iconNode.x(0); iconNode.y((midH-iconNode.height())/2); g.add(iconNode); }
    const {offX,offY}=hasIcon?clockOffsets(E):{offX:0,offY:0};
    txtNode.x(offX); txtNode.y((midH-txtNode.height())/2 + offY); g.add(txtNode);
    // anchor by group bbox
    const b=g.getClientRect(); const {ox,oy}=anchorOffset(E.anchor||'TOP_CENTER', b.width, b.height);
    g.x(E.x+ox); g.y(E.y+oy); node=g;
  }
  else if(E.type==='graph'){
    const g=new Konva.Group({listening:true});
    if(E.graph&&E.graph.border) g.add(new Konva.Rect({x:E.x,y:E.y,width:E.w,height:E.h,stroke:color.css,strokeWidth:1}));
    // fake traces so you can see placement/size/style
    (E.graph&&E.graph.traces||[]).forEach((tr,ti)=>{
      const tc=colorById(tr.colorId)||color; const pts=[]; const n=40;
      for(let i=0;i<=n;i++){ const x=E.x+(E.w*i/n);
        let yy=E.y+E.h*(0.5-0.32*Math.sin(i/n*Math.PI*2+ti));
        pts.push(x,yy); }
      g.add(new Konva.Line({points:pts, stroke:tc.css, strokeWidth:Math.max(1,(tr.thickness??2)*0.7),
        dash: tr.lineType==='DOTTED'?[2,3]:(tr.lineType==='DASHED'?[6,4]:undefined)}));
    });
    // axis labels preview
    const ax=E.graph&&E.graph.axes;
    if(ax&&ax.show){
      const af=fontById(ax.fontId)||profile().fonts[0]; const fam=previewFamily(af); const fs=Math.min(af.size,16);
      const add=(t,x,y,a)=>{ const tn=new Konva.Text({text:t,fontFamily:fam,fontSize:fs,fill:color.css}); const w=tn.width();
        if(a==='r') tn.x(x-w); else if(a==='c') tn.x(x-w/2); else tn.x(x); tn.y(y); g.add(tn); };
      if(ax.showYScale!==false && numFilled(E.graph.max_range) && numFilled(E.graph.min_range)){
        const mx=+E.graph.max_range, mn=+E.graph.min_range, mid=Math.round(((mx+mn)/2)*100)/100;
        add(String(mx),E.x-4,E.y,'r'); add(String(mid),E.x-4,E.y+E.h/2-fs/2,'r'); add(String(mn),E.x-4,E.y+E.h-fs,'r');
      }
      if(ax.yTitle) add(ax.yTitle, E.x, E.y-fs-2,'l');
      if(ax.showXScale!==false){ add('-'+(E.graph.duration||'1h'),E.x,E.y+E.h+2,'l'); add('0',E.x+E.w,E.y+E.h+2,'r'); }
      if(ax.xTitle) add(ax.xTitle, E.x+E.w/2, E.y+E.h+16,'c');
    }
    // legend preview (positioned independently; defaults to the right of the graph)
    const lg=E.graph&&E.graph.legend;
    if(lg&&lg.show){
      const lf=fontById(lg.nameFontId)||profile().fonts[0]||{size:14};
      const lfam=previewFamily(lf), lfs=Math.min(lf.size||14,14);
      const lx=numFilled(lg.x)?+lg.x:(E.x+E.w+8), ly=numFilled(lg.y)?+lg.y:E.y;
      const traces=(E.graph.traces||[]).filter(t=>t.sourceId);
      const rowH=lfs+6, sampleW=lg.showLines!==false?18:0, pad=6;
      let maxw=0; const labels=traces.map(t=>{ const lab=t.name||(srcById(t.sourceId)||{}).id||t.sourceId||'?';
        const tn=new Konva.Text({text:lab,fontFamily:lfam,fontSize:lfs}); maxw=Math.max(maxw,tn.width()); return lab; });
      const boxW=pad*2+sampleW+(sampleW?6:0)+maxw, boxH=pad*2+Math.max(1,traces.length)*rowH-6;
      if(lg.border!==false) g.add(new Konva.Rect({x:lx,y:ly,width:boxW,height:boxH,stroke:color.css,strokeWidth:1}));
      traces.forEach((t,ri)=>{ const ry=ly+pad+ri*rowH, tc=colorById(t.colorId)||color;
        if(sampleW) g.add(new Konva.Line({points:[lx+pad,ry+lfs/2,lx+pad+sampleW,ry+lfs/2],stroke:tc.css,
          strokeWidth:Math.max(1,(t.thickness??2)*0.7),dash:t.lineType==='DOTTED'?[2,3]:(t.lineType==='DASHED'?[6,4]:undefined)}));
        g.add(new Konva.Text({text:labels[ri],fontFamily:lfam,fontSize:lfs,fill:color.css,x:lx+pad+(sampleW?sampleW+6:0),y:ry})); });
    }
    // centre-origin so the transformer resizes around the middle (no rotation for graphs)
    const gcx=E.x+E.w/2, gcy=E.y+E.h/2;
    g.offset({x:gcx,y:gcy}); g.position({x:gcx,y:gcy});
    node=g;
  }
  if(!node) return null;
  node._elId = el.id;
  node.draggable(true);
  // live snap-to-grid while dragging: align the element's VISIBLE box top-left to
  // the nearest grid line (works for any grid size). The offset between the node
  // position and its visible box is captured at dragstart (render position) so the
  // maths stays correct. Shift bypasses.
  node.on('dragstart.snap', ()=>{
    const b=(el.type==='text'||el.type==='icon') ? inkBounds(node) : node.getClientRect({relativeTo:contentLayer});
    node._sbx=b.x-node.x(); node._sby=b.y-node.y(); });
  node.dragBoundFunc(function(pos){
    const sn=$('#tg-snap'); if(!sn || !sn.checked || shiftDown) return pos;
    const g=gridStep(), ox=node._sbx||0, oy=node._sby||0;
    return { x: Math.round((pos.x+ox)/g)*g - ox, y: Math.round((pos.y+oy)/g)*g - oy };
  });
  node.on('mousedown touchstart', (ev)=>{
    const e=ev && ev.evt;
    if(e && (e.ctrlKey||e.metaKey)){ ev.cancelBubble=true; toggleSelect(el.id); return; }
    if(isSelected(el.id) && selectedIds.size>1) return;   // keep group for drag
    // an unselected near-full-canvas backdrop: don't move it — let the event bubble to
    // the stage so a drag becomes a marquee (a plain click selects it in finish()).
    if(!isSelected(el.id) && isBackdropNode(node)){ node.draggable(false); _marqueeOnNode=el.id; return; }
    // click-through: first click = topmost; clicking the same spot again steps to the
    // element below it (cycling through everything stacked under the pointer)
    const pick=cyclePick(el);
    if(pick && pick.el.id!==el.id && pick.node){
      selectNode(pick.el, pick.node);
      node.draggable(false);                 // hand the drag to the chosen (lower) node
      try{ pick.node.startDrag(); }catch(_){}
      ev.cancelBubble=true; return;
    }
    selectNode(el, node);
  });
  node.on('dragstart', ()=>{ pushUndo(); if(selectionVisual) selectionVisual.hide();
    // group move: capture the other selected nodes + all outline boxes so they
    // move LIVE together with the node you grabbed
    if(selectedIds.size>1 && isSelected(el.id)){
      _groupDrag = {ox:el.x, oy:el.y, nx0:node.x(), ny0:node.y(), others:[], outlines:[]};
      els().forEach(o=>{ if(!selectedIds.has(o.id)) return;
        const out=_selOutlines[o.id]; if(out) _groupDrag.outlines.push({rect:out, x0:out.x(), y0:out.y()});
        if(o.id!==el.id){ const n=contentLayer.getChildren(x=>x._elId===o.id)[0]; if(n) _groupDrag.others.push({node:n, x0:n.x(), y0:n.y()}); }
      });
    } else { _groupDrag=null; }
  });
  node.on('dragmove', ()=>{
    if(!_groupDrag) return;
    const dx=node.x()-_groupDrag.nx0, dy=node.y()-_groupDrag.ny0;
    _groupDrag.others.forEach(it=>it.node.position({x:it.x0+dx, y:it.y0+dy}));
    _groupDrag.outlines.forEach(it=>it.rect.position({x:it.x0+dx, y:it.y0+dy}));
    contentLayer.batchDraw();
  });
  node.on('dragend', ()=>{
    // translate node movement back to element anchor coords
    if(el.type==='line'){
      const dx=node.x(), dy=node.y();
      el.x+=dx; el.y+=dy; el.x2+=dx; el.y2+=dy; node.position({x:0,y:0});
    } else if(el.type==='rect' || el.type==='graph'){
      // centre-origin nodes: node.x()/y() is the centre
      el.x=Math.round(node.x()-el.w/2); el.y=Math.round(node.y()-el.h/2);
    } else if(el.type==='triangle' || el.type==='circle' || el.type==='polygon' || el.type==='ring' || el.type==='gauge' || el.type==='qr'){
      // these use node.x()/y() as their origin (centre for shapes, top-left for QR group)
      el.x=Math.round(node.x()); el.y=Math.round(node.y());
    } else if(el.type==='clock'){
      // anchored group: convert the group's top-left back to the anchor point
      const b=node.getClientRect({relativeTo:contentLayer});
      const {ox,oy}=anchorOffset(el.anchor||'TOP_CENTER', b.width, b.height);
      el.x=Math.round(node.x()-ox); el.y=Math.round(node.y()-oy);
    } else {
      const w=node.width(), h=node.height();
      const {ox,oy}=anchorOffset(el.anchor||'TOP_LEFT', w, h);
      el.x=Math.round(node.x()-ox); el.y=Math.round(node.y()-oy);
    }
    // (live snapping is handled by dragBoundFunc, which aligns the visual box to
    //  the grid; re-snapping the anchor here would undo that, so we don't)
    // group move: shift the other selected elements by the same delta
    if(_groupDrag){
      const dx=el.x-_groupDrag.ox, dy=el.y-_groupDrag.oy; _groupDrag=null;
      if(dx||dy){
        els().forEach(o=>{
          if(o.id!==el.id && selectedIds.has(o.id)){
            o.x+=dx; o.y+=dy;
            if(o.x2!=null){ o.x2+=dx; o.y2+=dy; }
          }
        });
      }
    }
    afterChange();
  });
  return node;
}
let _groupDrag=null;
function snapEl(el){
  const g=gridStep();
  if(el.type==='line'){
    const sx=Math.round(el.x/g)*g-el.x, sy=Math.round(el.y/g)*g-el.y;
    el.x+=sx; el.y+=sy; el.x2+=sx; el.y2+=sy; // shift both endpoints equally -> angle preserved
  } else {
    el.x=Math.round(el.x/g)*g; el.y=Math.round(el.y/g)*g;
  }
}

/* ---- shape geometry (triangle verts, rotated-rect corners) ---- */
function rotPt(cx,cy,px,py,deg){
  const a=(deg||0)*Math.PI/180, c=Math.cos(a), s=Math.sin(a), dx=px-cx, dy=py-cy;
  return [cx+dx*c-dy*s, cy+dx*s+dy*c];
}
// triangle: x,y = centre; w,h = bounding box; rotation deg; flipV points it down
function triVerts(E){
  const cx=E.x, cy=E.y, w=E.w, h=E.h, dir=E.flipV?-1:1, r=E.rotation||0;
  return [
    rotPt(cx,cy, cx,        cy-dir*h/2, r),  // apex
    rotPt(cx,cy, cx-w/2,    cy+dir*h/2, r),  // base-left
    rotPt(cx,cy, cx+w/2,    cy+dir*h/2, r),  // base-right
  ];
}
// rect: x,y = top-left; w,h; rotation deg around centre
function rectCorners(E){
  const cx=E.x+E.w/2, cy=E.y+E.h/2, r=E.rotation||0;
  return [
    rotPt(cx,cy, E.x,      E.y,      r),
    rotPt(cx,cy, E.x+E.w,  E.y,      r),
    rotPt(cx,cy, E.x+E.w,  E.y+E.h,  r),
    rotPt(cx,cy, E.x,      E.y+E.h,  r),
  ];
}
const flatPts = pts => pts.reduce((a,p)=>{a.push(p[0],p[1]);return a;},[]);

/* byte-mode character capacity per QR version (1..40) for ECC L/M/Q/H — used to work
   out the real module count so the preview box matches the device size exactly. */
const QR_BYTE_CAP = {
  L:[17,32,53,78,106,134,154,192,230,271,321,367,425,458,520,586,644,718,792,858,929,1003,1091,1171,1273,1367,1465,1528,1628,1732,1840,1952,2068,2188,2303,2431,2563,2699,2809,2953],
  M:[14,26,42,62,84,106,122,152,180,213,251,287,331,362,412,450,504,560,624,666,711,779,857,911,997,1059,1125,1190,1264,1370,1452,1538,1628,1722,1809,1911,1989,2099,2213,2331],
  Q:[11,20,32,46,60,74,86,108,130,151,177,203,241,258,292,322,364,394,442,482,509,565,611,661,715,751,805,868,908,982,1030,1112,1168,1228,1283,1351,1423,1499,1579,1663],
  H:[7,14,24,34,44,58,64,84,98,119,137,155,177,194,220,250,280,310,338,382,403,439,461,511,535,593,625,658,698,742,790,842,898,958,983,1051,1093,1139,1219,1273] };
/* build a real QR matrix with the bundled qrcode-generator (auto version). Returns
   the qr object (getModuleCount/isDark) or null if unavailable / data too long. */
function buildQR(text, ecc){
  if(typeof qrcode==='undefined') return null;
  const lvl = ecc==='HIGH'?'H' : ecc==='QUARTILE'?'Q' : ecc==='MEDIUM'?'M' : 'L';
  try{ const q=qrcode(0, lvl); q.addData(String(text||'')); q.make(); return q; }catch(e){ return null; }
}
/* module count (side length) for the data + ECC — exact via the QR library, with a
   byte-mode capacity-table fallback if the library is missing. */
function qrModuleCount(text, ecc){
  const q=buildQR(text, ecc); if(q) return q.getModuleCount();
  const bytes = unescape(encodeURIComponent(String(text||''))).length;
  const lvl = ecc==='HIGH'?'H' : ecc==='QUARTILE'?'Q' : ecc==='MEDIUM'?'M' : 'L';
  const tbl = QR_BYTE_CAP[lvl];
  let v = tbl.findIndex(cap=>bytes<=cap);
  if(v<0) v = 39;
  return 17 + 4*(v+1);
}
/* QR preview — renders the REAL QR (correct modules) at modules × scale so both the
   look and the size match the device. Falls back to a placeholder if the lib fails. */
function _isLightCss(css){
  let r,g,b; const h=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(css||'').trim());
  if(h){ r=parseInt(h[1],16); g=parseInt(h[2],16); b=parseInt(h[3],16); }
  else { const m=/(\d+)\D+(\d+)\D+(\d+)/.exec(String(css||'')); if(!m) return false; r=+m[1]; g=+m[2]; b=+m[3]; }
  return (0.299*r+0.587*g+0.114*b) > 150;
}
function qrPreviewNode(E, css){
  const scale = Math.max(1, E.scale||4);
  // if the QR colour is light/white, invert the preview (dark background) so it stays
  // readable on the grey canvas — on a real B/W panel the QR is white-on-black then.
  const light=_isLightCss(css), bg=light?'#1d1d1b':'#fff', fg=css;
  const q = buildQR(E.text, E.ecc);
  const g = new Konva.Group({x:E.x, y:E.y});
  if(q){
    const n=q.getModuleCount(), size=n*scale;
    g.add(new Konva.Rect({x:0,y:0,width:size,height:size,fill:bg,stroke:fg,strokeWidth:1}));
    g.add(new Konva.Shape({width:size,height:size,listening:false, sceneFunc:(ctx)=>{
      ctx.fillStyle=fg;
      for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) ctx.fillRect(c*scale, r*scale, scale, scale);
    }}));
    return g;
  }
  // fallback placeholder (data too long or lib missing) — still sized correctly
  const QR_MODULES = qrModuleCount(E.text, E.ecc), size=QR_MODULES*scale, m=scale;
  g.add(new Konva.Rect({x:0,y:0,width:size,height:size,fill:bg,stroke:fg,strokeWidth:1}));
  const finder=(fx,fy)=>{ g.add(new Konva.Rect({x:fx*m,y:fy*m,width:7*m,height:7*m,fill:fg}));
    g.add(new Konva.Rect({x:(fx+1)*m,y:(fy+1)*m,width:5*m,height:5*m,fill:bg}));
    g.add(new Konva.Rect({x:(fx+2)*m,y:(fy+2)*m,width:3*m,height:3*m,fill:fg})); };
  finder(0,0); finder(QR_MODULES-7,0); finder(0,QR_MODULES-7);
  for(let i=9;i<QR_MODULES-2;i+=2){ for(let j=9;j<QR_MODULES-2;j+=2){
    if((i*j)%3===0) g.add(new Konva.Rect({x:i*m,y:j*m,width:m,height:m,fill:fg})); } }
  return g;
}

/* attach selection visuals (resize handles for rect/circle, dashed outline otherwise)
   to an existing node WITHOUT rebuilding the layer — keeps an in-progress drag alive */
function attachSelection(el, node){
  if(transformer){ try{transformer.destroy();}catch(e){} transformer=null; }
  if(selectionVisual){ try{selectionVisual.destroy();}catch(e){} selectionVisual=null; }
  if(!node) return;
  if(el.type==='rect' || el.type==='circle' || el.type==='triangle' || el.type==='polygon' || el.type==='ring' || el.type==='gauge' || el.type==='qr' || el.type==='graph'){
    // aspect-locked (radial / opt-in) shapes keep their ratio AND only expose
    // the corner anchors, so the side anchors can't distort them.
    const locked = (el.type==='circle') ? (el.lockAspect!==false)
                 : (el.type==='triangle'||el.type==='rect') ? !!el.lockAspect
                 : (el.type==='polygon'||el.type==='ring'||el.type==='gauge'||el.type==='qr');
    const rotateEnabled = (el.type==='rect' || el.type==='triangle' || el.type==='polygon');
    const allAnchors=['top-left','top-center','top-right','middle-right','middle-left','bottom-left','bottom-center','bottom-right'];
    const corners=['top-left','top-right','bottom-left','bottom-right'];
    transformer=new Konva.Transformer({rotateEnabled, keepRatio:locked,
      enabledAnchors: locked ? corners : allAnchors,
      borderStroke:'#e8a13a',anchorStroke:'#e8a13a',anchorFill:'#fff',anchorSize:8,rotateAnchorOffset:24,
      anchorStyleFunc:(a)=>{ if(a.hasName('rotater')){ a.cornerRadius(a.width()/2); a.fill('#e8a13a'); a.stroke('#fff'); } }});
    contentLayer.add(transformer); transformer.nodes([node]);
    // hold Shift while rotating to snap to 45°
    if(rotateEnabled){ node.off('transform.snaprot'); node.on('transform.snaprot',()=>{
      if(shiftDown) node.rotation(Math.round(node.rotation()/45)*45); }); }
    node.off('transformend.sel'); node.on('transformend.sel',()=>{ pushUndo();
      const sx=node.scaleX(), sy=node.scaleY();
      if(el.type==='rect'){ el.w=Math.max(4,Math.round(el.w*sx)); el.h=Math.max(4,Math.round(el.h*sy)); el.rotation=Math.round(node.rotation()); el.x=Math.round(node.x()-el.w/2); el.y=Math.round(node.y()-el.h/2); }
      else if(el.type==='graph'){ el.w=Math.max(40,Math.round(el.w*sx)); el.h=Math.max(30,Math.round(el.h*sy)); el.x=Math.round(node.x()-el.w/2); el.y=Math.round(node.y()-el.h/2); }
      else if(el.type==='circle'){ el.rx=Math.max(2,Math.round(node.radiusX()*sx)); el.ry=Math.max(2,Math.round(node.radiusY()*sy)); delete el.r; el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      else if(el.type==='triangle'){ el.w=Math.max(4,Math.round(el.w*sx)); el.h=Math.max(4,Math.round(el.h*sy)); el.rotation=Math.round(node.rotation()); el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      else if(el.type==='polygon'){ el.r=Math.max(4,Math.round(node.radius()*((sx+sy)/2))); el.rotation=Math.round(node.rotation()); el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      else if(el.type==='ring'){ const f=(sx+sy)/2; el.r=Math.max(6,Math.round(node.outerRadius()*f)); el.inner=Math.max(2,Math.round(node.innerRadius()*f)); el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      else if(el.type==='gauge'){ const f=(sx+sy)/2; el.r=Math.max(6,Math.round((el.r||50)*f)); el.inner=Math.max(2,Math.round((el.inner||30)*f)); el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      else if(el.type==='qr'){ el.scale=Math.max(1,Math.round((el.scale||4)*((sx+sy)/2))); el.x=Math.round(node.x()); el.y=Math.round(node.y()); }
      node.scaleX(1); node.scaleY(1); afterChange(); });
  } else if(el.type==='line'){
    // square endpoint handles + a rotation handle that spins the line around its midpoint
    const g=new Konva.Group();
    const HS=11; // handle size
    const endpoint=(px,py,which)=>{
      const h=new Konva.Rect({x:px-HS/2,y:py-HS/2,width:HS,height:HS,fill:'#fff',stroke:'#e8a13a',strokeWidth:2,draggable:true});
      h.on('mousedown touchstart', e=>{ e.cancelBubble=true; });
      h.on('dragstart', e=>{ e.cancelBubble=true; pushUndo(); });
      h.on('dragmove', e=>{ e.cancelBubble=true;
        let mx=h.x()+HS/2, my=h.y()+HS/2;
        if(shiftDown){ // lock to nearest 45° relative to the fixed endpoint
          const fx = which==='a'? el.x2 : el.x;
          const fy = which==='a'? el.y2 : el.y;
          const dx=mx-fx, dy=my-fy, dist=Math.hypot(dx,dy), step=Math.PI/4;
          const ang=Math.round(Math.atan2(dy,dx)/step)*step;
          mx=fx+Math.cos(ang)*dist; my=fy+Math.sin(ang)*dist;
          h.x(mx-HS/2); h.y(my-HS/2);
        }
        if(which==='a'){ el.x=Math.round(mx); el.y=Math.round(my); }
        else { el.x2=Math.round(mx); el.y2=Math.round(my); }
        node.points([el.x,el.y,el.x2,el.y2]); contentLayer.batchDraw();
      });
      h.on('dragend', e=>{ e.cancelBubble=true;
        if($('#tg-snap').checked && !shiftDown){ const s=gridStep();
          if(which==='a'){ el.x=Math.round(el.x/s)*s; el.y=Math.round(el.y/s)*s; }
          else { el.x2=Math.round(el.x2/s)*s; el.y2=Math.round(el.y2/s)*s; } }
        afterChange();
      });
      return h;
    };
    g.add(endpoint(el.x,el.y,'a')); g.add(endpoint(el.x2,el.y2,'b'));
    // rotation handle: perpendicular offset from the midpoint, always on the UPPER side
    const mx=(el.x+el.x2)/2, my=(el.y+el.y2)/2;
    const dx=el.x2-el.x, dy=el.y2-el.y, len=Math.hypot(dx,dy)||1;
    let nx=-dy/len, ny=dx/len; if(ny>0){ nx=-nx; ny=-ny; }   // point towards the top
    const off=26;
    const rh=new Konva.Circle({x:mx+nx*off,y:my+ny*off,radius:6,fill:'#e8a13a',stroke:'#fff',strokeWidth:2,draggable:true});
    g.add(new Konva.Line({points:[mx,my,mx+nx*off,my+ny*off],stroke:'#e8a13a',strokeWidth:1,dash:[3,3],listening:false}));
    rh.on('mousedown touchstart', e=>{ e.cancelBubble=true; });
    rh.on('dragstart', e=>{ e.cancelBubble=true; pushUndo(); });
    rh.on('dragmove', e=>{ e.cancelBubble=true;
      const cx=(el.x+el.x2)/2, cy=(el.y+el.y2)/2, half=Math.hypot(el.x2-el.x,el.y2-el.y)/2;
      let ang=Math.atan2(rh.y()-cy, rh.x()-cx) - Math.PI/2;   // handle sits perpendicular
      if(shiftDown) ang=Math.round(ang/(Math.PI/4))*(Math.PI/4);
      const ca=Math.cos(ang), sa=Math.sin(ang);
      el.x=Math.round(cx-ca*half); el.y=Math.round(cy-sa*half);
      el.x2=Math.round(cx+ca*half); el.y2=Math.round(cy+sa*half);
      node.points([el.x,el.y,el.x2,el.y2]); contentLayer.batchDraw();
    });
    rh.on('dragend', e=>{ e.cancelBubble=true; afterChange(); });
    g.add(rh);
    contentLayer.add(g); selectionVisual=g;
  } else {
    const b=(el.type==='text'||el.type==='icon') ? inkBounds(node) : node.getClientRect({relativeTo:contentLayer});
    // hug the actual ink with a small margin; bold + clearly visible
    selectionVisual=new Konva.Rect({x:b.x-3,y:b.y-3,width:b.width+6,height:b.height+6,
      stroke:'#ff9800',strokeWidth:3,dash:[7,4],fill:'rgba(255,152,0,0.16)',
      shadowColor:'#000',shadowBlur:3,shadowOpacity:.5,listening:false});
    contentLayer.add(selectionVisual);
  }
}
/* lightweight single-select used when clicking a node on the canvas (no full rebuild) */
function selectNode(el, node){
  selectedId=el.id; selectedIds=new Set([el.id]); _layerAnchor=el.id;
  attachSelection(el, node);
  contentLayer.draw();
  renderLayers(); renderInspector();
}
/* click-through stacked elements: clicking the same spot repeatedly steps to the next
   element below the one currently chosen (top → bottom, then wraps). */
let _cycleAt=null;
function cyclePick(topEl){
  const pos=stage && stage.getPointerPosition(); const rp=stage && stage.getRelativePointerPosition();
  if(!pos || !rp) return null;
  // pixel-accurate: every shape actually under the cursor → its element id
  let shapes=[]; try{ shapes=contentLayer.getAllIntersections(pos); }catch(_){ shapes=[]; }
  const hit=new Set();
  shapes.forEach(s=>{ let n=s; while(n && n._elId===undefined && n.getParent) n=n.getParent(); if(n && n._elId!==undefined) hit.add(n._elId); });
  if(hit.size<2){ _cycleAt=null; return null; }                 // nothing stacked → normal select
  const ids=els().slice().reverse().map(e=>e.id).filter(id=>hit.has(id));   // top of z-order first
  const same=_cycleAt && Math.abs(_cycleAt.x-rp.x)<6 && Math.abs(_cycleAt.y-rp.y)<6 && _cycleAt.ids.join()===ids.join();
  const idx = same ? (_cycleAt.idx+1)%ids.length : 0;
  _cycleAt={x:rp.x, y:rp.y, ids, idx};
  const id=ids[idx], e=els().find(x=>x.id===id), n=contentLayer.getChildren(x=>x._elId===id)[0];
  return e&&n ? {el:e, node:n} : null;
}

/* dashed, non-interactive outline around a node (used to show extra multi-selected items) */
let _selOutlines={};
/* tight bounding box around the actual drawn pixels (ink), not the font-metric
   box — keeps the selection rectangle hugging the visible glyphs */
function inkBounds(node){
  const b=node.getClientRect({relativeTo:contentLayer});
  try{
    const cv=node.toCanvas({pixelRatio:1}); const W=cv.width, H=cv.height;
    if(!W||!H) return b;
    const data=cv.getContext('2d').getImageData(0,0,W,H).data;
    let minX=W,minY=H,maxX=-1,maxY=-1;
    for(let y=0;y<H;y++){ const row=y*W*4; for(let x=0;x<W;x++){ if(data[row+x*4+3]>16){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } }
    if(maxX<0) return b;
    return { x:b.x+minX, y:b.y+minY, width:maxX-minX+1, height:maxY-minY+1 };
  }catch(e){ return b; }
}
function outlineNode(node){
  const b=(node._elId && (()=>{const e=els().find(x=>x.id===node._elId);return e&&(e.type==='text'||e.type==='icon');})()) ? inkBounds(node) : node.getClientRect({relativeTo:contentLayer});
  // bright, slightly filled box so multi-selected items stand out clearly
  const o=new Konva.Rect({x:b.x-4,y:b.y-4,width:b.width+8,height:b.height+8,
    stroke:'#ff9800',strokeWidth:3,dash:[8,4],fill:'rgba(255,152,0,0.16)',
    shadowColor:'#000',shadowBlur:2,shadowOpacity:.4,listening:false});
  contentLayer.add(o);
  return o;
}

function renderCanvas(){
  if(!stage) return;
  drawGrid();
  contentLayer.destroyChildren();
  transformer=null; selectionVisual=null;
  els().forEach(el=>{ const n=buildNode(el); if(n) contentLayer.add(n); });
  const ids=[...selectedIds];
  _selOutlines={};
  if(ids.length===1){
    const sel=selected(); const selNode=contentLayer.getChildren(n=>n._elId===selectedId)[0];
    if(sel && selNode) attachSelection(sel, selNode);
  } else if(ids.length>1){
    ids.forEach(id=>{ const n=contentLayer.getChildren(x=>x._elId===id)[0]; if(n) _selOutlines[id]=outlineNode(n); });
  }
  contentLayer.draw();
}

/* during live graph resize: redraw element nodes but keep current selection visuals */
function renderCanvasKeepSel(el){
  const old=contentLayer.getChildren(n=>n._elId===el.id)[0];
  if(old){ const fresh=buildNode(el); if(fresh){ old.destroy(); contentLayer.add(fresh); } }
  contentLayer.batchDraw();
}

/* MDI codepoint -> char */
function mdiChar(hex){ if(!hex) return '?'; return String.fromCodePoint(parseInt(hex,16)); }

/* ---------------- e-ink 1-bit preview ---------------- */
function renderEink(){
  const p=profile();
  if(transformer) transformer.hide();
  if(selectionVisual) selectionVisual.hide();
  const src=stage.toCanvas({pixelRatio:1});
  if(transformer) transformer.show();
  if(selectionVisual) selectionVisual.show();
  // capture at the panel's native resolution; CSS (inset:0) stretches it to fill
  // the (zoomed) frame so the preview matches the canvas exactly at any zoom
  const cv=$('#eink-canvas'); cv.width=p.device.w; cv.height=p.device.h;
  cv.style.width=''; cv.style.height='';
  const ctx=cv.getContext('2d');
  const bg=hexToRgb(p.device.bg||'#d4d6d7');
  ctx.fillStyle=p.device.bg||'#d4d6d7'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.drawImage(src,0,0);
  const img=ctx.getImageData(0,0,cv.width,cv.height); const d=img.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2];
    const isRed = r>120 && g<110 && b<110;
    const lum = 0.299*r+0.587*g+0.114*b;
    if(isRed){ d[i]=214; d[i+1]=72; d[i+2]=59; }
    else if(lum<150){ d[i]=29; d[i+1]=29; d[i+2]=27; }
    else { d[i]=bg.r; d[i+1]=bg.g; d[i+2]=bg.b; }
    d[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  $('#stage-frame').classList.add('eink-on');
}
function hexToRgb(h){ const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h||''); return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:212,g:214,b:215}; }

/* ============================================================
   SELECTION + LAYERS
   ============================================================ */
function isSelected(id){ return selectedIds.has(id); }
function setSelection(ids, primary){
  selectedIds=new Set(ids);
  selectedId = (primary!=null && selectedIds.has(primary)) ? primary
             : (ids.length ? ids[ids.length-1] : null);
  renderCanvas(); renderLayers(); renderInspector();
}
function select(id){
  if(id==null){ setSelection([],null); }
  else { setSelection([id], id); _layerAnchor=id; }
}
function toggleSelect(id){
  const s=new Set(selectedIds);
  if(s.has(id)) s.delete(id); else s.add(id);
  const arr=[...s];
  setSelection(arr, s.has(id)?id:(arr[arr.length-1]??null));
  _layerAnchor=id;
}
/* layer click with modifier support (#9 ctrl-toggle, #10 shift-range) */
function layerClick(id, e){
  if(e && e.shiftKey && _layerAnchor){
    const order=els().slice().reverse().map(x=>x.id);   // displayed (top→bottom) order
    const a=order.indexOf(_layerAnchor), b=order.indexOf(id);
    if(a>=0 && b>=0){ const lo=Math.min(a,b), hi=Math.max(a,b); setSelection(order.slice(lo,hi+1), id); return; }
  }
  if(e && (e.ctrlKey||e.metaKey)){ toggleSelect(id); return; }
  select(id);
}

let _dragLayerId=null;
/* drop src above/below target in the displayed (top→bottom) layer list, then write
   the new order back to the elements array (which is bottom→top). */
function moveLayerTo(srcId, targetId, before){
  if(srcId===targetId) return;
  let order = els().slice().reverse().map(e=>e.id);   // display order (top→bottom)
  order = order.filter(id=>id!==srcId);
  let ti = order.indexOf(targetId); if(ti<0) return;
  order.splice(before?ti:ti+1, 0, srcId);
  const map=new Map(els().map(e=>[e.id,e]));
  const newArr = order.reverse().map(id=>map.get(id)).filter(Boolean);   // back to array order
  if(newArr.length!==els().length) return;
  pushUndo();
  const arr=els(); arr.length=0; newArr.forEach(e=>arr.push(e));
  afterChange();
}
function renderLayers(){
  const box=$('#layers'); box.innerHTML='';
  $('#layer-count').textContent = els().length;
  // auto-scroll the (scrollable) list when dragging a layer near its top/bottom edge
  box.ondragover=e=>{ if(!_dragLayerId) return; const r=box.getBoundingClientRect(); const edge=26;
    if(e.clientY < r.top+edge) box.scrollTop -= 10;
    else if(e.clientY > r.bottom-edge) box.scrollTop += 10; };
  // top of list = top of z-order (draw last) -> reverse
  els().slice().reverse().forEach(el=>{
    const row=document.createElement('div');
    row._elId=el.id;
    row.className='layer'+(isSelected(el.id)?' sel':'')+(el.visible===false?' hidden':'');
    row.innerHTML=`<span class="lmove mdi mdi-drag-vertical" title="${T('Sleep om te verplaatsen','Drag to reorder')}"></span>
      <span class="ltype">${typeGlyph(el)}</span>
      <span class="lname" title="${T('Dubbelklik om te hernoemen','Double-click to rename')}">${el.name||el.type}</span>
      <span class="ldel" title="${T('Verwijderen','Delete')}">🗑</span>
      <span class="lvis" title="${T('Zichtbaarheid','Visibility')}">${el.visible===false?'🚫':'👁'}</span>`;
    // drag-to-reorder via the handle
    const handle=row.querySelector('.lmove'); handle.draggable=true;
    const clearDrop=()=>$$('.layer.drop-before,.layer.drop-after').forEach(r=>r.classList.remove('drop-before','drop-after'));
    handle.ondragstart=e=>{ _dragLayerId=el.id; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',el.id);}catch(_){} };
    handle.ondragend=()=>{ _dragLayerId=null; clearDrop(); };
    row.ondragover=e=>{ if(!_dragLayerId || _dragLayerId===el.id) return; e.preventDefault();
      const r=row.getBoundingClientRect(); const before=(e.clientY-r.top) < r.height/2;
      clearDrop(); row.classList.add(before?'drop-before':'drop-after'); row._dropBefore=before; };
    row.ondragleave=()=>row.classList.remove('drop-before','drop-after');
    row.ondrop=e=>{ e.preventDefault(); const before=row._dropBefore!==false; clearDrop(); if(_dragLayerId) moveLayerTo(_dragLayerId, el.id, before); _dragLayerId=null; };
    const nameEl=row.querySelector('.lname');
    let clickTimer=null;
    nameEl.onclick=(e)=>{ if(clickTimer) return; clickTimer=setTimeout(()=>{ clickTimer=null; layerClick(el.id, e); }, 220); };
    nameEl.ondblclick=(e)=>{ e.stopPropagation(); if(clickTimer){ clearTimeout(clickTimer); clickTimer=null; } startRename(nameEl, el); };
    row.querySelector('.ltype').onclick=(e)=>layerClick(el.id, e);
    row.querySelector('.lvis').onclick=(e)=>{e.stopPropagation(); pushUndo(); el.visible=el.visible===false?true:false; afterChange();};
    row.querySelector('.ldel').onclick=(e)=>{e.stopPropagation(); pushUndo();
      const arr=els(); const i=arr.findIndex(x=>x.id===el.id); if(i>=0) arr.splice(i,1);
      selectedIds.delete(el.id); if(selectedId===el.id) selectedId=null; afterChange();};
    row.oncontextmenu=(e)=>{ e.preventDefault(); if(!isSelected(el.id)) select(el.id); showMenu(e.clientX,e.clientY, elItems(el)); };
    box.appendChild(row);
  });
}
function startRename(span, el){
  const inp=document.createElement('input');
  inp.type='text'; inp.value=el.name||el.type; inp.className='lname-edit';
  span.replaceWith(inp); inp.focus(); inp.select();
  const commit=()=>{ const v=inp.value.trim(); if(v && v!==el.name){ pushUndo(); el.name=v; afterChange(); } else { renderLayers(); } };
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ inp.blur(); } else if(e.key==='Escape'){ inp.value=el.name||el.type; inp.blur(); } });
  inp.addEventListener('blur', commit, {once:true});
}
function typeGlyph(el){
  const t = (el && typeof el==='object') ? el.type : el;
  // text vs value get a different glyph so layers are visually distinguishable
  if(t==='text'){ const sc=(el&&typeof el==='object')?el.source:null;
    return (sc && sc.kind!=='static') ? '#' : 'T'; }
  return {icon:'◈',line:'╱',rect:'▢',circle:'◯',triangle:'△',polygon:'⬡',ring:'◎',gauge:'◴',qr:'▦',wifi:'⌁',clock:'◔',graph:'⊿'}[t]||'•';
}

/* ============================================================
   ADD ELEMENTS
   ============================================================ */
/* ensure at least one Material Design Icons font exists (size 30) so icon/clock/wifi
   elements never show a missing-glyph box; returns a usable MDI font id. */
function ensureMdiFont(){
  const ex=profile().fonts.find(x=>/materialdesignicons/i.test(x.file||''));
  if(ex) return ex.id;
  let id='font_mdi', n=2; while(fontById(id)) id='font_mdi_'+(n++);
  profile().fonts.push({id, size:30, kind:'local', file:'fonts/materialdesignicons-webfont.ttf', dynamic:false, baseCharset:'', dataUrl:null, seedGlyphs:[]});
  try{ registerUploadedFonts(); }catch(e){}
  return id;
}
function mdiFontFor(preferId){ const f=fontById(preferId); return (f && /materialdesignicons/i.test(f.file||'')) ? preferId : ensureMdiFont(); }
function addElement(type, pos){
  pushUndo();
  const p=profile();
  // "value" and "text" are both the it.print(f) text element, only the inspector
  // (and the layer icon) differ: text = static only, value = source/transform
  let role=null, nameType=type;
  if(type==='value'){ role='value'; type='text'; }
  else if(type==='text'){ role='text'; }
  const cx = pos ? clamp(Math.round(pos.x),0,p.device.w) : Math.round(p.device.w/2);
  const cy = pos ? clamp(Math.round(pos.y),0,p.device.h) : 120;
  const base={ id:uid(), type, name:elName(nameType), visible:true,
    x:cx, y:cy, colorId:'color_text', anchor:'CENTER',
    condition:{enabled:false,sourceId:'',op:'on',val:'',val2:'',
               whenTrue:{text:'',iconName:'',iconHex:'',colorId:'',visible:true},
               whenFalse:{text:'',iconName:'',iconHex:'',colorId:'',visible:true}} };
  if(type==='text'){
    Object.assign(base,{ fontId:'font_klein', role,
      source: role==='value'
        ? {kind:'sensor',sourceId:(p.sources[0]?p.sources[0].id:''),text:'',expr:''}
        : {kind:'static',text:'Tekst',sourceId:'',expr:''},
      format:{mode:'builder',decimals:1,prefix:'',suffix:'',raw:'%s'}, transform:'none', transformArg:{} });
  } else if(type==='icon'){
    Object.assign(base,{ fontId:mdiFontFor('font_mdi_large'), iconName:'thermometer-water', iconHex:'F1A80' });
  } else if(type==='line'){
    Object.assign(base,{ x:cx-80,y:cy,x2:cx+80,y2:cy, colorId:'color_text', anchor:undefined });
  } else if(type==='rect'){
    Object.assign(base,{ x:cx-80,y:cy-40, w:160,h:80, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='circle'){
    Object.assign(base,{ x:cx,y:cy, r:40, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='triangle'){
    Object.assign(base,{ x:cx,y:cy, w:120,h:100, rotation:0, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='polygon'){
    Object.assign(base,{ x:cx,y:cy, r:60, sides:6, rotation:0, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='ring'){
    Object.assign(base,{ x:cx,y:cy, r:50, inner:30, colorId:'color_text', anchor:undefined });
  } else if(type==='gauge'){
    Object.assign(base,{ x:cx,y:cy, r:50, inner:30, percent:50, colorId:'color_text', anchor:undefined });
  } else if(type==='qr'){
    Object.assign(base,{ x:cx-50,y:cy-50, text:'https://home-assistant.io', scale:4, ecc:'LOW', colorId:'color_text', anchor:undefined });
  } else if(type==='wifi'){
    Object.assign(base,{ fontId:mdiFontFor('font_mdi_small'), anchor:'CENTER', colorId:'color_text',
      // signal thresholds (dBm) -> MDI icon, strongest first
      wifi:{ sourceId:'', levels:[
        {min:-50, icon:'wifi-strength-4', hex:'F0928'},
        {min:-60, icon:'wifi-strength-3', hex:'F0925'},
        {min:-67, icon:'wifi-strength-2', hex:'F0922'},
        {min:-70, icon:'wifi-strength-1', hex:'F091F'},
        {min:-999, icon:'wifi-strength-alert-outline', hex:'F092B'} ] } });
  } else if(type==='clock'){
    const mdi=mdiFontFor('font_mdi_small');
    Object.assign(base,{ fontId:'font_klein', anchor:'CENTER', colorId:'color_text',
      clock:{ strftime:'%H:%M', icon:true, iconName:'recycle', iconHex:'F044C', iconFontId:mdi } });
  } else if(type==='graph'){
    Object.assign(base,{ x:cx-150,y:cy, w:300,h:140, colorId:'color_text', anchor:undefined,
      graph:{ duration:'1h', x_grid:'10min', y_grid:5, border:true,
        min_range:'', max_range:'',
        traces:[{sourceId:'aquatemp', name:'', lineType:'SOLID', thickness:2, continuous:true, colorId:'color_text'}],
        axes:{ show:false, fontId:'font_klein', yTitle:'', xTitle:'', showYScale:true, showXScale:true },
        legend:{ show:false, x:'', y:'', nameFontId:'font_klein', valueFontId:'', border:true,
                 showLines:true, showValues:'AUTO', showUnits:true, direction:'AUTO' } } });
  }
  els().push(base); selectedId=base.id; afterChange();
}
function elName(t){
  const isVal=t==='value';
  const n=els().filter(e=> isVal ? (e.type==='text'&&e.role==='value')
                                 : (e.type===t && !(t==='text'&&e.role==='value'))).length+1;
  const m={text:T('Tekst','Text'),value:T('Waarde','Value'),icon:T('Icoon','Icon'),line:T('Lijn','Line'),rect:T('Rechthoek','Rectangle'),
           circle:T('Cirkel','Circle'),triangle:T('Driehoek','Triangle'),polygon:T('Veelhoek','Polygon'),
           ring:'Ring',gauge:T('Meter','Gauge'),qr:'QR',wifi:'WiFi',clock:'Refresh Time',graph:T('Grafiek','Graph')};
  return (m[t]||'Element')+' '+n; }

function deleteSel(){
  const ids = selectedIds.size ? selectedIds : (selectedId?new Set([selectedId]):null);
  if(!ids||!ids.size) return;
  pushUndo(); setEls(els().filter(e=>!ids.has(e.id)));
  selectedIds=new Set(); selectedId=null; afterChange();
}
function dupSel(){
  const ids = selectedIds.size ? [...selectedIds] : (selectedId?[selectedId]:[]);
  if(!ids.length) return;
  pushUndo(); const arr=els(); const newIds=[];
  ids.forEach(id=>{ const e=arr.find(x=>x.id===id); if(!e) return;
    const cp=JSON.parse(JSON.stringify(e)); cp.id=uid(); cp.x+=14; cp.y+=14;
    if(cp.x2!=null){cp.x2+=14;cp.y2+=14;} cp.name=(e.name||e.type)+' '+T('kopie','copy');
    arr.push(cp); newIds.push(cp.id); });
  selectedIds=new Set(newIds); selectedId=newIds[newIds.length-1]||null; afterChange();
}
/* clipboard: copy/cut/paste, works across the main & waiting screens */
var _clipboard=[], _clipScreen=null;
function copySel(){
  const ids = selectedIds.size ? [...selectedIds] : (selectedId?[selectedId]:[]);
  if(!ids.length) return false;
  const arr=els();
  _clipboard = ids.map(id=>arr.find(x=>x.id===id)).filter(Boolean).map(e=>JSON.parse(JSON.stringify(e)));
  _clipScreen = editScreen;
  return _clipboard.length>0;
}
function cutSel(){ if(copySel()) deleteSel(); }
function pasteClip(){
  if(!_clipboard.length) return;
  // same screen → offset so it doesn't overlap; another screen → keep exact position
  const off = (editScreen===_clipScreen) ? 14 : 0;
  pushUndo(); const arr=els(); const newIds=[];
  _clipboard.forEach(e=>{ const cp=JSON.parse(JSON.stringify(e)); cp.id=uid(); cp.x=(cp.x||0)+off; cp.y=(cp.y||0)+off;
    if(cp.x2!=null){cp.x2+=off;cp.y2+=off;} arr.push(cp); newIds.push(cp.id); });
  // next paste offsets from these (so repeated paste on the same screen keeps stepping)
  _clipboard = newIds.map(id=>JSON.parse(JSON.stringify(arr.find(x=>x.id===id)))); _clipScreen=editScreen;
  selectedIds=new Set(newIds); selectedId=newIds[newIds.length-1]||null; afterChange();
  toast(T(`Geplakt: ${newIds.length}`,`Pasted: ${newIds.length}`));
}

/* point 7: align the selected element to the canvas edges/centre.
   Works on the element's rendered bounding box, then shifts the element by a delta. */
function alignSel(how){
  const ids = selectedIds.size ? [...selectedIds] : (selectedId?[selectedId]:[]);
  if(!ids.length){ toast(T('Selecteer eerst een element','Select an element first')); return; }
  const p=profile();
  // combined bounding box of the whole selection (so the group moves as one)
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity, found=false;
  ids.forEach(id=>{ const n=contentLayer.getChildren(x=>x._elId===id)[0]; if(!n) return;
    const b=n.getClientRect({relativeTo:contentLayer});
    minX=Math.min(minX,b.x); minY=Math.min(minY,b.y); maxX=Math.max(maxX,b.x+b.width); maxY=Math.max(maxY,b.y+b.height); found=true; });
  if(!found) return;
  const bw=maxX-minX, bh=maxY-minY;
  let dx=0, dy=0;
  if(how==='left')    dx=-minX;
  if(how==='right')   dx=(p.device.w-maxX);
  if(how==='hcenter') dx=(p.device.w/2-(minX+bw/2));
  if(how==='top')     dy=-minY;
  if(how==='bottom')  dy=(p.device.h-maxY);
  if(how==='vcenter') dy=(p.device.h/2-(minY+bh/2));
  pushUndo();
  ids.forEach(id=>{ const e=els().find(x=>x.id===id); if(!e) return;
    e.x=Math.round((e.x||0)+dx); e.y=Math.round((e.y||0)+dy);
    if(e.type==='line'){ e.x2=Math.round(e.x2+dx); e.y2=Math.round(e.y2+dy); } });
  afterChange();
}

/* ============================================================
   INSPECTOR
   ============================================================ */
function renderInspector(){
  const host=$('#inspector'); const el=selected();
  if(!el){ host.innerHTML='<div class="inspector-empty">'+T('Selecteer een element op het canvas','Select an element on the canvas')+'<br>'+T('of voeg er een toe.','or add a new one.')+'</div>'; return; }
  if(selectedIds.size>1){
    host.innerHTML=`<div class="insp-group"><h4>${T('Selectie','Selection')}</h4>
      <div class="hint" style="margin-bottom:10px">${selectedIds.size} ${T('elementen geselecteerd','elements selected')}</div>
      <div class="row tight">
        <button class="btn sm" id="msel-dup">⧉ ${T('Dupliceren','Duplicate')}</button>
        <button class="btn ghost sm danger" id="msel-del">🗑 ${T('Verwijderen','Delete')}</button>
      </div>
      <div class="hint" style="margin-top:8px">${T('Sleep een element om de hele selectie te verplaatsen.','Drag an element to move the whole selection.')}</div></div>`;
    $('#msel-dup').onclick=dupSel; $('#msel-del').onclick=deleteSel;
    return;
  }
  let h='';
  h+=g(T('Element','Element'),`
    <div class="row"><div><label class="fld">${T('Naam','Name')}</label><input data-k="name" type="text" value="${attr(el.name)}"></div></div>`);

  // geometry
  if(el.type==='line'){
    h+=g(T('Positie','Position'),`<div class="row"><div><label class="fld">X1</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y1</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">X2</label><input data-k="x2" type="number" value="${el.x2}"></div><div><label class="fld">Y2</label><input data-k="y2" type="number" value="${el.y2}"></div></div>`);
  } else if(el.type==='rect'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Breedte','Width')}</label><input data-k="w" type="number" value="${el.w}"></div><div><label class="fld">${T('Hoogte','Height')}</label><input data-k="h" type="number" value="${el.h}"></div></div>
      <label class="fld">${T('Rotatie','Rotation')} (<span class="rot-deg">${el.rotation||0}</span>°)</label>
      <input data-k="rotation" type="range" min="0" max="360" step="1" value="${el.rotation||0}">
      <label class="toggle"><input type="checkbox" data-k="lockAspect" ${el.lockAspect?'checked':''}> ${T('Verhouding vergrendelen','Lock aspect ratio')}</label>
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> ${T('Gevuld','Filled')}</label>
      <div class="hint">${T('Houd Shift ingedrukt tijdens roteren om op 45° te vergrendelen.','Hold Shift while rotating to snap to 45°.')}</div>`);
  } else if(el.type==='circle'){
    const rx=(el.rx!=null?el.rx:(el.r!=null?el.r:40)), ry=(el.ry!=null?el.ry:(el.r!=null?el.r:40));
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">${T('Midden X','Center X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Midden Y','Center Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Straal X','Radius X')}</label><input data-k="rx" type="number" value="${rx}"></div><div><label class="fld">${T('Straal Y','Radius Y')}</label><input data-k="ry" type="number" value="${ry}"></div></div>
      <label class="toggle"><input type="checkbox" data-k="lockAspect" ${el.lockAspect!==false?'checked':''}> ${T('Rond houden (vaste verhouding)','Keep circular (lock ratio)')}</label>
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> ${T('Gevuld','Filled')}</label>
      <div class="hint">${T('Ovaal wordt geëxporteerd als veelhoek-benadering (ESPHome heeft geen ellipse).','An oval is exported as a polygon approximation (ESPHome has no ellipse).')}</div>`);
  } else if(el.type==='triangle'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">${T('Midden X','Center X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Midden Y','Center Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Breedte','Width')}</label><input data-k="w" type="number" value="${el.w}"></div><div><label class="fld">${T('Hoogte','Height')}</label><input data-k="h" type="number" value="${el.h}"></div></div>
      <label class="fld">${T('Rotatie','Rotation')} (<span class="rot-deg">${el.rotation||0}</span>°)</label>
      <input data-k="rotation" type="range" min="0" max="360" step="1" value="${el.rotation||0}">
      <label class="toggle"><input type="checkbox" data-k="lockAspect" ${el.lockAspect?'checked':''}> ${T('Verhouding vergrendelen','Lock aspect ratio')}</label>
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> ${T('Gevuld','Filled')}</label>
      <div class="hint">${T('Houd Shift ingedrukt tijdens roteren om op 45° te vergrendelen.','Hold Shift while rotating to snap to 45°.')}</div>`);
  } else if(el.type==='polygon'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">${T('Midden X','Center X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Midden Y','Center Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Straal','Radius')}</label><input data-k="r" type="number" value="${el.r||60}"></div><div><label class="fld">${T('Aantal hoeken','Sides')}</label><input data-k="sides" class="spin" type="number" min="3" step="1" value="${el.sides||6}" title="${T('Minimaal 3 (minder wordt een lijn/driehoek).','Minimum 3 (fewer becomes a line/triangle).')}"></div></div>
      <label class="fld">${T('Rotatie','Rotation')} (<span class="rot-deg">${el.rotation||0}</span>°)</label>
      <input data-k="rotation" type="range" min="0" max="360" step="1" value="${el.rotation||0}">
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> ${T('Gevuld','Filled')}</label>`);
  } else if(el.type==='ring'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">${T('Midden X','Center X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Midden Y','Center Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Buitenstraal','Outer radius')}</label><input data-k="r" type="number" value="${el.r||50}"></div><div><label class="fld">${T('Binnenstraal','Inner radius')}</label><input data-k="inner" type="number" value="${el.inner||30}"></div></div>
      <div class="hint">${T('Een ring is altijd gevuld','A ring is always filled')} — <span class="mono">it.filled_ring</span>.</div>`);
  } else if(el.type==='gauge'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">${T('Midden X','Center X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Midden Y','Center Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Buitenstraal','Outer radius')}</label><input data-k="r" type="number" value="${el.r||50}"></div><div><label class="fld">${T('Binnenstraal','Inner radius')}</label><input data-k="inner" type="number" value="${el.inner||30}"></div></div>
      <label class="fld">${T('Vulling','Fill')} (<span class="rot-deg">${el.percent==null?50:el.percent}</span>%)</label>
      <input data-k="percent" type="range" min="0" max="100" step="1" value="${el.percent==null?50:el.percent}">
      <div class="hint"><span class="mono">it.filled_gauge</span> — ${T('halve cirkel (180°), vult van links over de top naar rechts. 50% = de linkerhelft.','half circle (180°), fills from the left over the top to the right. 50% = the left half.')}</div>`);
  } else if(el.type==='qr'){
    h+=g(T('Naam & ID','Name & ID'),`<div class="row"><div><label class="fld">${T('Naam','Name')}</label><input data-k="name" type="text" value="${attr(el.name)}" title="${T('Naam in de lagenlijst.','Name in the layers list.')}"></div></div>
      <div class="row"><div><label class="fld">${T('ID (YAML)','ID (YAML)')}</label><input data-k="qrCustomId" type="text" class="mono" value="${attr(el.qrCustomId)}" placeholder="${attr(qrId(el))}" title="${T('Eigen id voor het qr_code:-component in de YAML. Leeg = automatisch.','Custom id for the qr_code: component in the YAML. Empty = auto-generated.')}"></div></div>`);
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Schaal (px per module)','Scale (px per module)')}</label><input data-k="scale" type="number" min="1" max="12" value="${el.scale||4}"></div>
        <div><label class="fld">${T('Foutcorrectie (ECC)','Error correction (ECC)')}</label><select data-k="ecc">
          ${['LOW','MEDIUM','QUARTILE','HIGH'].map(o=>`<option ${(el.ecc||'LOW')===o?'selected':''}>${o}</option>`).join('')}
        </select></div></div>
      <div class="row"><div><label class="fld">${T('Inhoud (tekst/URL)','Content (text/URL)')}</label><input data-k="text" type="text" value="${attr(el.text)}"></div></div>
      ${(()=>{ const mods=qrModuleCount(el.text,el.ecc), px=mods*Math.max(1,el.scale||4);
        return `<div class="hint">${T('Geschatte grootte','Estimated size')}: <b>${mods}×${mods}</b> ${T('modules','modules')} = <b>${px}×${px} px</b> ${T('op het device.','on the device.')}</div>`; })()}
      <div class="hint">${T('ECC: LOW ~7%, MEDIUM ~15%, QUARTILE ~25%, HIGH ~30% fouttolerantie. Het patroon is een plaatshouder, maar de grootte klopt met het device.','ECC: LOW ~7%, MEDIUM ~15%, QUARTILE ~25%, HIGH ~30% error tolerance. The pattern is a placeholder, but the size matches the device.')}</div>`);
  } else if(el.type==='graph'){
    h+=g(T('Positie & maat','Position & size'),`<div class="row"><div><label class="fld">X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">${T('Breedte','Width')}</label><input data-k="w" type="number" value="${el.w}"></div><div><label class="fld">${T('Hoogte','Height')}</label><input data-k="h" type="number" value="${el.h}"></div></div>
      <div class="hint">${T('De golf in de preview is een voorbeeld; op het device tekent ESPHome de echte sensorgeschiedenis. De Y-as-getallen verschijnen pas als je hieronder een vaste Y-min én Y-max invult.','The wave in the preview is a placeholder; on the device ESPHome draws the real sensor history. The Y-axis numbers only appear once you set a fixed Y-min and Y-max below.')}</div>`);
  } else {
    h+=g(T('Positie & uitlijning','Position & alignment'),`<div class="row"><div><label class="fld">${T('Anker X','Anchor X')}</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">${T('Anker Y','Anchor Y')}</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <label class="fld">${T('Uitlijning (TextAlign)','Alignment (TextAlign)')}</label>${anchorGrid(el)}`);
  }

  // font + color
  let style='';
  if(el.type==='text'||el.type==='icon'||el.type==='wifi'||el.type==='clock'){
    style+=`<div class="row"><div><label class="fld">Font</label><select data-k="fontId">${fontOpts(el.fontId)}</select></div></div>`;
    const font=fontById(el.fontId);
    if(font && !fontLoaded(font)) style+=`<div class="hint">⚠ ${T('Font','Font')} "${font.file}" ${T('nog niet geüpload — preview is bij benadering. Upload via “Fonts & kleuren”.','not uploaded yet — preview is approximate. Upload via “Fonts & colours”.')}</div>`;
  }
  if(el.type!=='graph') style+=`<div class="row"><div><label class="fld">${T('Kleur','Colour')}</label>${colorSwatches(el.colorId,'colorId')}</div></div>`;
  h+=g(T('Stijl','Style'),style);

  // icon
  if(el.type==='icon'){
    h+=g(T('Icoon','Icon'),`<div class="row" style="align-items:center">
      <div style="flex:none"><span class="mdi mdi-${el.iconName}" style="font-size:34px"></span></div>
      <div><div class="mono" style="margin-bottom:4px">mdi-${el.iconName} · ${el.iconHex}</div>
      <button class="btn sm" id="pick-icon">${T('Icoon kiezen…','Choose icon…')}</button></div></div>`);
  }

  // value source + format + transform (text only)
  if(el.type==='text'){
    if(el.role==='text'){
      // pure text element: just the static text, no source/transform
      h+=g(T('Tekst','Text'), `<div class="row"><div><input data-src="text" type="text" value="${attr((el.source&&el.source.text)||'')}"></div></div>`);
    } else {
      if(el.role==='value' && el.source && el.source.kind!=='sensor') el.source.kind='sensor';   // value = sensor only
      h+=g(T('Bron','Source'), sourceEditor(el));
      h+=g(T('Format & transform','Format & transform'), formatEditor(el));
    }
  }

  // wifi smart element
  if(el.type==='wifi'){
    const w=el.wifi||{};
    h+=g(T('WiFi-signaal','Wi-Fi signal'),`
      <div class="row"><div><label class="fld">${T('Signaalbron (optioneel, voor preview)','Signal source (optional, for preview)')}</label><select data-wifi="sourceId">${srcOpts(w.sourceId,true)}</select></div></div>
      <div class="hint">${T('Bij export wordt','On export')} <span class="mono">id(wifisignal)</span> ${T('gebruikt (de diagnostische sensor die de editor genereert). De bron hierboven bepaalt alleen welke staaf je nu in de preview ziet.','is used (the diagnostic sensor the editor generates). The source above only controls which bar you see in the preview now.')}</div>
      <label class="fld" style="margin-top:8px">${T('Niveaus: vanaf dBm → icoon','Levels: from dBm → icon')}</label>
      ${(w.levels||[]).map((lv,i)=>`<div class="row tight" style="align-items:center">
        <div style="flex:0 0 80px"><input data-wifilv="${i}.min" type="number" value="${lv.min}" title="≥ dBm"></div>
        <div style="flex:none"><span class="mdi mdi-${lv.icon||''}" style="font-size:24px">${lv.icon?'':mdiChar(lv.hex)}</span></div>
        <button class="btn ghost sm" data-pickwifi="${i}" style="flex:1">${T('Icoon kiezen…','Choose icon…')}</button>
      </div>`).join('')}
      <div class="hint">${T('Sterkste niveau bovenaan; de onderste regel is "geen signaal". De getallen zijn dBm-drempels — klik een icoon om het te wijzigen.','Strongest level on top; the bottom row is "no signal". The numbers are dBm thresholds — click an icon to change it.')}</div>`);
  }

  // clock smart element
  if(el.type==='clock'){
    const c=el.clock||{};
    const is12=/%I/.test(c.strftime||'');
    h+=g(T('Refresh-klok','Refresh clock'),`
      <label class="toggle"><input type="checkbox" id="clock-12h" ${is12?'checked':''}> ${T('12-uurs klok (AM/PM)','12-hour clock (AM/PM)')}</label>
      <div class="row" style="margin-top:6px"><div><label class="fld">${T('Tijdformaat (strftime)','Time format (strftime)')}</label><input data-clock="strftime" class="mono" type="text" value="${attr(c.strftime||'%H:%M')}"></div></div>
      <div class="hint">${T('Toont het tijdstip van de laatste schermverversing via','Shows the time of the last screen refresh via')} <span class="mono">id(homeassistant_time)</span>. ${T('Standaard 24-uurs','Default 24-hour')} (<span class="mono">%H:%M</span>).</div>
      <label class="toggle" style="margin-top:8px"><input type="checkbox" data-clock="icon" ${c.icon?'checked':''}> ${T('Icoon ervoor','Icon before it')}</label>
      ${c.icon?`<div class="row" style="align-items:center;margin-top:6px">
        <div style="flex:none"><span class="mdi mdi-${c.iconName||'refresh'}" style="font-size:24px"></span></div>
        <div><button class="btn sm" id="pick-clock-icon">${T('Icoon kiezen…','Choose icon…')}</button></div>
        <div><label class="fld">${T('Icoon-font','Icon font')}</label><select data-clock="iconFontId">${fontOpts(c.iconFontId)}</select></div></div>
      <div class="row tight"><div><label class="fld">${T('Tekst-offset X','Text offset X')}</label><input data-clock="offX" class="spin" type="number" value="${attr(c.offX)}" placeholder="${clockOffsets(el).autoX} (auto)" title="${T('Horizontale afstand van de tekst t.o.v. het icoon. Leeg = automatisch op de iconbreedte.','Horizontal text distance from the icon. Empty = auto from the icon width.')}"></div>
        <div><label class="fld">${T('Tekst-offset Y','Text offset Y')}</label><input data-clock="offY" class="spin" type="number" value="${attr(c.offY)}" placeholder="0" title="${T('Verticale verschuiving. 0 = verticaal gecentreerd op het icoon.','Vertical shift. 0 = vertically centred on the icon.')}"></div></div>`:''}`);
  }

  // graph smart element
  if(el.type==='graph'){
    const gr=el.graph||{traces:[]};
    const ax=gr.axes||{};
    h+=g(T('Grafiek — algemeen','Graph — general'),`
      <div class="row tight"><div><label class="fld">${T('X-raster','X grid')}</label><input data-graph="x_grid" class="mono" type="text" value="${attr(gr.x_grid||'10min')}"></div>
        <div><label class="fld">${T('Y-raster','Y grid')}</label><input data-graph="y_grid" type="number" step="any" value="${gr.y_grid??5}"></div></div>
      <div class="row tight"><div><label class="fld">Y-min</label><input data-graph="min_range" type="number" step="any" value="${attr(gr.min_range)}" placeholder="auto"></div>
        <div><label class="fld">Y-max</label><input data-graph="max_range" type="number" step="any" value="${attr(gr.max_range)}" placeholder="auto"></div></div>
      <div class="hint">${T('Y-min/Y-max leeg = ESPHome schaalt automatisch. Vul beide voor een vaste Y-schaal.','Y-min/Y-max empty = ESPHome auto-scales. Fill both for a fixed Y scale.')}</div>
      <label class="toggle" style="margin-top:6px"><input type="checkbox" data-graph="border" ${gr.border!==false?'checked':''}> ${T('Rand tekenen','Draw border')}</label>`);

    h+=g(T('Grafiek — traces (stijlen)','Graph — traces (styles)'),`
      ${(gr.traces||[]).map((t,i)=>`<div class="cond-box">
        <div class="row"><div><label class="fld">Sensor</label><select data-trace="${i}.sourceId">${srcOpts(t.sourceId,true)}</select></div></div>
        <div class="row tight"><div><label class="fld">${T('Lijntype','Line type')}</label><select data-trace="${i}.lineType">
          ${['SOLID','DOTTED','DASHED'].map(o=>`<option ${t.lineType===o?'selected':''}>${o}</option>`).join('')}</select></div>
          <div><label class="fld">${T('Dikte','Thickness')}</label><input data-trace="${i}.thickness" class="spin" type="number" min="1" max="10" value="${t.thickness??2}"></div></div>
        <div><label class="fld">${T('Kleur','Colour')}</label><div class="swatches">${profile().colors.map(c=>`<div class="swatch ${t.colorId===c.id?'on':''}" data-trace-color="${i}.${c.id}" style="background:${c.css}" title="${c.id}"></div>`).join('')}</div></div>
        <label class="toggle"><input type="checkbox" data-trace="${i}.continuous" ${t.continuous!==false?'checked':''}> ${T('Continu','Continuous')}</label>
        ${(gr.traces.length>1)?`<button class="btn ghost sm danger" data-trace-del="${i}">${T('Trace verwijderen','Remove trace')}</button>`:''}
      </div>`).join('')}
      <button class="btn sm" id="trace-add" style="margin-top:8px">+ ${T('Trace toevoegen','Add trace')}</button>
      <div class="hint">${T('Elke trace heeft een eigen lijntype, dikte en kleur. Alleen numerieke sensoren zijn zinvol.','Each trace has its own line type, thickness and colour. Only numeric sensors make sense.')}</div>`);

    h+=g(T('Grafiek — assen & labels','Graph — axes & labels'),`
      <label class="toggle"><input type="checkbox" data-axes="show" ${ax.show?'checked':''}> ${T('As-labels tekenen (via lambda-tekst)','Draw axis labels (via lambda text)')}</label>
      ${ax.show?`
      <div class="row"><div><label class="fld">${T('Label-font','Label font')}</label><select data-axes="fontId">${fontOpts(ax.fontId)}</select></div></div>
      <div class="row tight"><div><label class="fld">${T('Y-as titel','Y-axis title')}</label><input data-axes="yTitle" type="text" value="${attr(ax.yTitle)}" placeholder="${T('bv. °C','e.g. °C')}"></div>
        <div><label class="fld">${T('X-as titel','X-axis title')}</label><input data-axes="xTitle" type="text" value="${attr(ax.xTitle)}" placeholder="${T('bv. tijd','e.g. time')}"></div></div>
      <label class="toggle"><input type="checkbox" data-axes="showYScale" ${ax.showYScale!==false?'checked':''}> ${T('Y-schaal tonen (min/max)','Show Y scale (min/max)')}</label>
      <label class="toggle"><input type="checkbox" data-axes="showXScale" ${ax.showXScale!==false?'checked':''}> ${T('X-schaal tonen (0 … −duur)','Show X scale (0 … −duration)')}</label>
      <div class="row" style="margin-top:6px"><div><label class="fld">${T('Duur (X-as) — aantal uren','Duration (X-axis) — hours')}</label><input data-graph="duration" class="mono" type="text" value="${attr(gr.duration||'1h')}" title="${T('Zelfde waarde als bij Algemeen. Bepaalt de X-as: van −duur (begin) tot 0 (nu). Bv. 1h, 6h, 24h.','Same value as under General. Sets the X axis: from −duration (start) to 0 (now). E.g. 1h, 6h, 24h.')}"></div></div>
      <div class="hint">${T('De X-schaal loopt van','The X scale runs from')} <span class="mono">−${attr(gr.duration||'1h')}</span> ${T('(begin) tot','(start) to')} <span class="mono">0</span> ${T('(nu).','(now).')}</div>
      <div class="hint">${T('Y-schaalwaarden (min/midden/max) verschijnen alleen als je hierboven bij “Algemeen” een vaste','Y scale values (min/mid/max) only appear if you set a fixed')} <b>Y-min ${T('én','and')} Y-max</b> ${T('hebt ingevuld. Bij auto-schaal kent de editor de werkelijke grenzen niet.','under “General”. With auto-scale the editor cannot know the real bounds.')}</div>`:`
      <div class="hint">ESPHome's <span class="mono">graph:</span> ${T('tekent zelf geen astitels of schaalwaarden. Zet dit aan om ze als tekst rond de grafiek te genereren.','does not draw axis titles or scale values itself. Enable this to generate them as text around the graph.')}</div>`}`);

    const lg=gr.legend||{};
    h+=g(T('Grafiek — legenda','Graph — legend'),`
      <label class="toggle"><input type="checkbox" data-legend="show" ${lg.show?'checked':''}> ${T('Legenda tekenen (it.legend)','Draw legend (it.legend)')}</label>
      ${lg.show?`
      <label class="fld" style="margin-top:6px">${T('Labels per trace','Per-trace labels')}</label>
      <div class="row tight" style="margin-bottom:2px"><div class="fld" style="flex:0 0 90px;margin:0">Source</div><div class="fld" style="flex:1;margin:0">${T('Label (legenda-ID)','Label (legend ID)')}</div></div>
      ${(gr.traces||[]).map((t,i)=> t.sourceId ? `<div class="row tight" style="align-items:center;margin-bottom:4px">
        <div class="mono hint" style="flex:0 0 90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0" title="${attr(t.sourceId)}">${attr(t.sourceId)}</div>
        <div style="flex:1"><select data-trace="${i}.name" title="${T('Legenda-label: kies een bron of laat op (auto) staan.','Legend label: pick a source or leave on (auto).')}">
          <option value="" ${!t.name?'selected':''}>${T('(auto: sensor-id)','(auto: sensor id)')}</option>
          ${profile().sources.length ? profile().sources.map(s=>`<option value="${attr(s.id)}" ${t.name===s.id?'selected':''}>${attr(s.id)}</option>`).join('') : `<option disabled>${T('(geen bronnen ingesteld)','(no sources set)')}</option>`}
        </select></div>
      </div>` : '').join('')}
      <div class="hint" style="margin-bottom:6px">${T('Links de bron-sensor, rechts je eigen label. Leeg = de sensor-id wordt gebruikt.','Left is the source sensor, right is your own label. Empty = the sensor id is used.')}</div>
      <div class="row tight"><div><label class="fld">${T('Naam-font','Name font')}</label><select data-legend="nameFontId" title="${T('Verplicht. Font voor de trace-namen in de legenda.','Required. Font for the trace names in the legend.')}">${fontOpts(lg.nameFontId)}</select></div>
        <div><label class="fld">${T('Waarde-font','Value font')}</label><select data-legend="valueFontId" title="${T('Optioneel. Font voor de actuele waarden. Leeg = geen waarden.','Optional. Font for the current values. Empty = no values.')}"><option value="" ${lg.valueFontId?'':'selected'}>${T('(geen)','(none)')}</option>${fontOpts(lg.valueFontId)}</select></div></div>
      <div class="row tight"><div><label class="fld">${T('Waarden tonen','Show values')}</label><select data-legend="showValues" title="${T('NONE=geen, AUTO=automatisch, BESIDE=naast de naam, BELOW=onder de naam.','NONE=none, AUTO=automatic, BESIDE=next to name, BELOW=below name.')}">${['NONE','AUTO','BESIDE','BELOW'].map(o=>`<option ${(lg.showValues||'AUTO')===o?'selected':''}>${o}</option>`).join('')}</select></div>
        <div><label class="fld">${T('Richting','Direction')}</label><select data-legend="direction" title="${T('Hoe de items gestapeld worden.','How the items are stacked.')}">${['AUTO','HORIZONTAL','VERTICAL'].map(o=>`<option ${(lg.direction||'AUTO')===o?'selected':''}>${o}</option>`).join('')}</select></div></div>
      <div class="row tight"><div><label class="fld">${T('Legenda X','Legend X')}</label><input data-legend="x" type="number" value="${attr(lg.x)}" placeholder="${T('auto (rechts)','auto (right)')}" title="${T('Linkerbovenhoek van de legenda. Leeg = rechts naast de grafiek.','Top-left of the legend. Empty = right of the graph.')}"></div>
        <div><label class="fld">${T('Legenda Y','Legend Y')}</label><input data-legend="y" type="number" value="${attr(lg.y)}" placeholder="${T('auto','auto')}" title="${T('Bovenkant van de legenda. Leeg = bovenkant grafiek.','Top of the legend. Empty = top of the graph.')}"></div></div>
      <div class="hint">${T('X en Y zijn pixelposities (getallen), geen tekst. Leeg laten = automatisch rechts van de grafiek.','X and Y are pixel positions (numbers), not text. Leave empty = automatically to the right of the graph.')}</div>
      <label class="toggle"><input type="checkbox" data-legend="border" ${lg.border!==false?'checked':''}> ${T('Rand om legenda','Legend border')}</label>
      <label class="toggle"><input type="checkbox" data-legend="showLines" ${lg.showLines!==false?'checked':''}> ${T('Lijnvoorbeelden tonen','Show line samples')}</label>
      <label class="toggle"><input type="checkbox" data-legend="showUnits" ${lg.showUnits!==false?'checked':''}> ${T('Eenheden tonen','Show units')}</label>
      <div class="hint">${T('De legenda wordt los geplaatst met','The legend is placed separately with')} <span class="mono">it.legend(x, y, …)</span>.</div>
      `:`<div class="hint">${T('Toont sensornamen, lijnstijlen en (optioneel) actuele waarden in een apart kader.','Shows sensor names, line styles and (optionally) current values in a separate box.')}</div>`}`);
  }

  // condition (if / else) — available on every element
  h+=g(T('Conditie (if / else)','Condition (if / else)'), condEditor(el));

  host.innerHTML=h;
  bindInspector(host, el);

  function g(title,inner){ return `<div class="insp-group"><h4>${title}</h4>${inner}</div>`; }
}

function anchorGrid(el){
  let h='<div class="anchor-grid">';
  ANCHORS.forEach(row=>row.forEach(a=>{ h+=`<button data-anchor="${a}" class="${(el.anchor||'TOP_LEFT')===a?'on':''}" title="${a}"></button>`; }));
  return h+'</div>';
}
function fontOpts(sel){ return profile().fonts.map(f=>`<option value="${f.id}" ${f.id===sel?'selected':''}>${f.id} (${f.size}px)</option>`).join(''); }
function colorSwatches(sel,key){
  return '<div class="swatches">'+profile().colors.map(c=>`<div class="swatch ${c.id===sel?'on':''}" data-color="${c.id}" data-key="${key}" style="background:${c.css}" title="${c.id}"></div>`).join('')+'</div>';
}
function srcOpts(sel,allowEmpty){
  let o = allowEmpty?`<option value="">— kies —</option>`:'';
  return o+profile().sources.map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${s.id} · ${s.kind}</option>`).join('');
}

function sourceEditor(el){
  const sc=el.source||{kind:'static'};
  // value elements are always a sensor — no static/expression choice
  if(el.role==='value'){
    return `<div class="row"><div><label class="fld">Sensor</label><select data-src="sourceId">${srcOpts(sc.sourceId,true)}</select></div></div>`;
  }
  let h=`<div class="row"><div><label class="fld">${T('Type bron','Source type')}</label>
    <select data-src="kind">
      <option value="static" ${sc.kind==='static'?'selected':''}>${T('Vaste tekst','Static text')}</option>
      <option value="sensor" ${sc.kind==='sensor'?'selected':''}>${T('Sensorwaarde','Sensor value')}</option>
      <option value="expr"   ${sc.kind==='expr'?'selected':''}>${T('Vrije expressie','Free expression')}</option>
    </select></div></div>`;
  if(sc.kind==='static') h+=`<div class="row"><div><label class="fld">${T('Tekst','Text')}</label><input data-src="text" type="text" value="${attr(sc.text)}"></div></div>`;
  else if(sc.kind==='sensor') h+=`<div class="row"><div><label class="fld">Sensor</label><select data-src="sourceId">${srcOpts(sc.sourceId,true)}</select></div></div>`;
  else h+=`<div class="row"><div><label class="fld">${T('C++ expressie','C++ expression')}</label><input data-src="expr" class="mono" type="text" value="${attr(sc.expr)}" placeholder="id(x).state"></div></div><div class="hint">${T('Wordt rauw in printf gezet. Gebruik','Inserted raw into printf. Use')} <span class="mono">%s</span>/<span class="mono">%f</span> ${T('in de format.','in the format.')}</div>`;
  return h;
}
// language-aware: most are units/symbols (neutral); the word-based ones differ NL/EN
function suffixPresets(){ return ['','°C','°F','%','W','kW','kWh','Wh','V','A','mA','Hz','bar','pH','ppm','L',T('L/u','L/h'),'mL','m³','g','kg','lux','dB','rpm','x','€','s','min',T('u','h')]; }
function prefixPresets(){ return ['','€ ','$ ','£ ','¥ ','± ','~','≈ ','> ','< ','Ø ','Δ ','# ',T('gem ','avg '),T('max ','max '),T('min ','min ')]; }
function affixControl(which, val){
  const presets = which==='suffix'?suffixPresets():prefixPresets();
  const known = presets.includes(val);
  // (none) first, Custom… second, then the presets
  const opts = `<option value="" ${val===''?'selected':''}>${T('(geen)','(none)')}</option>`
             + `<option value="__custom__" ${!known?'selected':''}>${T('Aangepast…','Custom…')}</option>`
             + presets.filter(p=>p!=='').map(p=>`<option value="${attr(p)}" ${known&&p===val?'selected':''}>${p}</option>`).join('');
  let h=`<select data-affix-sel="${which}">${opts}</select>`;
  h+=`<input data-affix-custom="${which}" type="text" value="${attr(val)}" placeholder="${T('eigen tekst','custom text')}" style="margin-top:5px;${known?'display:none':''}">`;
  return h;
}
function formatEditor(el){
  const fmt=el.format||{mode:'builder'};
  const kind = el.source&&el.source.kind==='sensor' ? (srcById(el.source.sourceId)||{}).kind : el.source&&el.source.kind;
  let h=`<div class="row"><div><label class="fld">${T('Modus','Mode')}</label><select data-fmt="mode" title="${T('Builder: prefix/suffix/decimalen los instellen. Rauwe printf: zelf de C-format string typen.','Builder: set prefix/suffix/decimals separately. Raw printf: type the C format string yourself.')}">
      <option value="builder" ${fmt.mode!=='raw'?'selected':''}>Builder</option>
      <option value="raw" ${fmt.mode==='raw'?'selected':''}>${T('Rauwe printf','Raw printf')}</option></select></div></div>`;
  if(fmt.mode==='raw'){
    h+=`<div class="row"><div><label class="fld">Format string</label><input data-fmt="raw" class="mono" type="text" value="${attr(fmt.raw||'%s')}" title="${T('C printf-format. %.1f = 1 decimaal, %s = tekst, %% = letterlijk %. Letterlijke tekens (bv. °C) komen automatisch in de font-glyphs.','C printf format. %.1f = 1 decimal, %s = text, %% = literal %. Literal characters (e.g. °C) are added to the font glyphs automatically.')}"></div></div>
      <div class="hint">↗ <a href="https://cplusplus.com/reference/cstdio/printf/" target="_blank" rel="noopener">${T('printf-format uitleg','printf format reference')}</a> ${T('(opent in nieuw tabblad)','(opens in a new tab)')}</div>`;
  } else {
    h+=`<div class="row tight">
      <div><label class="fld">Prefix</label>${affixControl('prefix', fmt.prefix||'')}</div>
      <div><label class="fld">Suffix</label>${affixControl('suffix', fmt.suffix||'')}</div></div>`;
    if(kind==='number' && el.transform!=='roundN') h+=`<div class="row"><div><label class="fld">${T('Decimalen','Decimals')}</label><input data-fmt="decimals" class="spin" type="number" min="0" max="6" value="${fmt.decimals??1}" title="${T('Aantal cijfers achter de komma.','Number of digits after the decimal point.')}"></div></div>`;
  }
  // transform
  const opts = transformOptions(kind);
  h+=`<div class="row"><div><label class="fld">Transform</label><select data-k2="transform">${opts.map(o=>`<option value="${o[0]}" ${(el.transform||'none')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div></div>`;
  if(el.transform==='boolLabel'){ const a=el.transformArg||{};
    h+=`<div class="row tight"><div><label class="fld">${T('Label “aan”','Label “on”')}</label><input data-ta="trueLabel" type="text" value="${attr(a.trueLabel||'Aan')}"></div><div><label class="fld">${T('Label “uit”','Label “off”')}</label><input data-ta="falseLabel" type="text" value="${attr(a.falseLabel||'Uit')}"></div></div>`; }
  if(el.transform==='scale'){ const a=el.transformArg||{};
    h+=`<div class="row"><div><label class="fld">${T('Factor (×)','Factor (×)')}</label><input data-ta="factor" type="number" step="any" value="${a.factor??1}"></div></div>`; }
  if(el.transform==='roundN'){ const a=el.transformArg||{};
    h+=`<div class="row"><div><label class="fld">${T('Decimalen','Decimals')}</label><input data-ta="n" class="spin" type="number" min="0" max="6" value="${a.n??1}" title="${T('Afronden op dit aantal decimalen (zoals %.Nf).','Round to this many decimals (like %.Nf).')}"></div></div>`; }
  if(el.transform==='custom'){ const a=el.transformArg||{};
    h+=`<div class="row tight"><div style="flex:2"><label class="fld">Format</label><input data-ta="fmt" type="text" value="${attr(a.fmt||'{wd} {dd} {mon}')}" placeholder="{wd} {dd} {mon}"></div>
        <div><label class="fld">${T('Namen','Names')}</label><select data-ta="lang"><option value="nl" ${a.lang!=='en'?'selected':''}>NL</option><option value="en" ${a.lang==='en'?'selected':''}>EN</option></select></div></div>
      <div class="hint">${T('Tokens','Tokens')}: <span class="mono">{wd} {wday} {mon} {month} {dd} {mm} {yyyy} {yy} {hh} {min} {ss}</span> — ${T('bv.','e.g.')} <span class="mono">{wd} {dd} {mon}</span> → <span class="mono">Zo 19 apr</span>. ${T('Gaat uit van een ISO-datum (JJJJ-MM-DD …).','Assumes an ISO date (YYYY-MM-DD …).')}</div>`; }
  h+=`<div class="hint">Preview: <span class="mono">${attr(displayText(el))}</span></div>`;
  return h;
}
/* substr-based date/time reformatting for HA string/time values. Assumes an
   ISO-ish input: "HH:MM:SS", "YYYY-MM-DD", or "YYYY-MM-DD HH:MM:SS". */
function _iso(s){ return /^\d{4}-\d{2}-\d{2}/.test(String(s)); }
// finds the time portion whether the value is "HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
function _timeAt(s,len){ const c=String(s).indexOf(':'); const o=c>=2?c-2:0; return String(s).substr(o,len); }
function _timeCpp(s,len){ return `(${s}.find(':') != std::string::npos && ${s}.find(':') >= 2 ? ${s}.substr(${s}.find(':') - 2, ${len}) : ${s}.substr(0, ${len}))`; }
/* guard a substr-expression so an empty/short HA state (at boot, unknown, …)
   yields "" instead of throwing std::out_of_range (which caused a boot loop). */
function _dtGuard(s, minLen, expr){ return `(${s}.length() >= ${minLen} ? (${expr}) : std::string(""))`; }
var STRTRANSFORMS = {
  time_hm:     { nl:'Tijd → UU:MM', en:'Time → HH:MM',
                 expr:s=>_timeCpp(s,5), prev:s=>_timeAt(s,5) },
  time_hms:    { nl:'Tijd → UU:MM:SS', en:'Time → HH:MM:SS',
                 expr:s=>_timeCpp(s,8), prev:s=>_timeAt(s,8) },
  date_ymd:    { nl:'Datum → JJJJ-MM-DD', en:'Date → YYYY-MM-DD',
                 expr:s=>_dtGuard(s,10,`${s}.substr(0,10)`), prev:s=>String(s).substr(0,10) },
  date_dmy:    { nl:'Datum → DD-MM-JJJJ', en:'Date → DD-MM-YYYY',
                 expr:s=>_dtGuard(s,10,`${s}.substr(8,2) + "-" + ${s}.substr(5,2) + "-" + ${s}.substr(0,4)`),
                 prev:s=>_iso(s)?`${s.substr(8,2)}-${s.substr(5,2)}-${s.substr(0,4)}`:s },
  date_dmy_sl: { nl:'Datum → DD/MM/JJJJ', en:'Date → DD/MM/YYYY',
                 expr:s=>_dtGuard(s,10,`${s}.substr(8,2) + "/" + ${s}.substr(5,2) + "/" + ${s}.substr(0,4)`),
                 prev:s=>_iso(s)?`${s.substr(8,2)}/${s.substr(5,2)}/${s.substr(0,4)}`:s },
  date_dm:     { nl:'Datum → DD-MM', en:'Date → DD-MM',
                 expr:s=>_dtGuard(s,10,`${s}.substr(8,2) + "-" + ${s}.substr(5,2)`),
                 prev:s=>_iso(s)?`${s.substr(8,2)}-${s.substr(5,2)}`:s },
  date_dm_sl:  { nl:'Datum → DD/MM', en:'Date → DD/MM',
                 expr:s=>_dtGuard(s,10,`${s}.substr(8,2) + "/" + ${s}.substr(5,2)`),
                 prev:s=>_iso(s)?`${s.substr(8,2)}/${s.substr(5,2)}`:s },
};
/* weekday / month NAME transforms. These need a tiny helper block in the lambda
   (a names[] array + index), so they're emitted via textNameBlock() rather than a
   single printf. Index source: month = substr(5,2); weekday = mktime(YYYY-MM-DD). */
var NAMETRANSFORMS = {
  wday_nl_s: {nl:'Weekdag kort NL (zo/ma/di…)', en:'Weekday short, Dutch (zo/ma…)', from:'wday', arr:['zo','ma','di','wo','do','vr','za']},
  wday_nl_l: {nl:'Weekdag lang NL (zondag…)',  en:'Weekday long, Dutch (zondag…)', from:'wday', arr:['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag']},
  wday_en_s: {nl:'Weekdag kort EN (Sun/Mon…)', en:'Weekday short (Sun/Mon…)',      from:'wday', arr:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']},
  wday_en_l: {nl:'Weekdag lang EN (Sunday…)',  en:'Weekday long (Sunday…)',        from:'wday', arr:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']},
  mon_nl_s:  {nl:'Maand kort NL (jan/feb…)',   en:'Month short, Dutch (jan/feb…)', from:'month', arr:['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']},
  mon_nl_l:  {nl:'Maand lang NL (januari…)',   en:'Month long, Dutch (januari…)',  from:'month', arr:['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']},
  mon_en_s:  {nl:'Maand kort EN (Jan/Feb…)',   en:'Month short (Jan/Feb…)',        from:'month', arr:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']},
  mon_en_l:  {nl:'Maand lang EN (January…)',   en:'Month long (January…)',         from:'month', arr:['January','February','March','April','May','June','July','August','September','October','November','December']},
};
function nameTransformPreview(nt, val){
  const s=String(val); if(!_iso(s)) return s;
  if(nt.from==='month'){ const mi=parseInt(s.substr(5,2),10)-1; return (mi>=0&&mi<12)?nt.arr[mi]:s; }
  const wd=new Date(Date.UTC(+s.substr(0,4), +s.substr(5,2)-1, +s.substr(8,2))).getUTCDay();
  return nt.arr[wd]||s;
}
/* weekday/month names per language, for the custom date/time format */
var DTNAMES = {
  nl: { wd_s:['zo','ma','di','wo','do','vr','za'], wd_l:['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'],
        mo_s:['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'], mo_l:['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'] },
  en: { wd_s:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], wd_l:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        mo_s:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], mo_l:['January','February','March','April','May','June','July','August','September','October','November','December'] },
};
var DT_TOKEN_RE = /(\{wday\}|\{wd\}|\{month\}|\{mon\}|\{yyyy\}|\{yy\}|\{mm\}|\{dd\}|\{hh\}|\{min\}|\{ss\})/;
function customFmtPreview(el, val){
  const s=String(val); const a=el.transformArg||{}; const N=DTNAMES[a.lang==='en'?'en':'nl'];
  const wd=_iso(s)?new Date(Date.UTC(+s.substr(0,4),+s.substr(5,2)-1,+s.substr(8,2))).getUTCDay():0;
  const mo=_iso(s)?(parseInt(s.substr(5,2),10)-1):0;
  return String(a.fmt||'')
    .replace(/\{wday\}/g,N.wd_l[wd]||'').replace(/\{wd\}/g,N.wd_s[wd]||'')
    .replace(/\{month\}/g,N.mo_l[mo]||'').replace(/\{mon\}/g,N.mo_s[mo]||'')
    .replace(/\{yyyy\}/g,s.substr(0,4)).replace(/\{yy\}/g,s.substr(2,2))
    .replace(/\{mm\}/g,s.substr(5,2)).replace(/\{dd\}/g,s.substr(8,2))
    .replace(/\{hh\}/g,s.length>=13?s.substr(11,2):'').replace(/\{min\}/g,s.length>=16?s.substr(14,2):'').replace(/\{ss\}/g,s.length>=19?s.substr(17,2):'');
}
/* minimum state length needed for the tokens used (so substr never overruns) */
function _customMinLen(pat){
  const need={ '{yyyy}':4,'{yy}':4,'{mm}':7,'{dd}':10,'{hh}':13,'{min}':16,'{ss}':19,'{wd}':10,'{wday}':10,'{mon}':7,'{month}':7 };
  let m=1; Object.keys(need).forEach(tok=>{ if(pat.indexOf(tok)>=0) m=Math.max(m,need[tok]); });
  return m;
}
function textCustomBlock(el, I, fontId, color, anchor){
  const src=srcById(el.source.sourceId)||{id:el.source.sourceId};
  const sid=shortId(el), s=`s_${sid}`, a=el.transformArg||{}, N=DTNAMES[a.lang==='en'?'en':'nl'];
  const pat=String(a.fmt||''); const usesWd=/\{wd\}|\{wday\}/.test(pat), usesMo=/\{mon\}|\{month\}/.test(pat);
  const minLen=_customMinLen(pat);
  const segs=pat.split(DT_TOKEN_RE).filter(x=>x!=='');
  const cpp=seg=>{ switch(seg){
    case '{yyyy}':return `${s}.substr(0,4)`; case '{yy}':return `${s}.substr(2,2)`;
    case '{mm}':return `${s}.substr(5,2)`; case '{dd}':return `${s}.substr(8,2)`;
    case '{hh}':return `${s}.substr(11,2)`; case '{min}':return `${s}.substr(14,2)`; case '{ss}':return `${s}.substr(17,2)`;
    case '{wd}':return `std::string(wd_${sid}[tmv_${sid}.tm_wday])`; case '{wday}':return `std::string(wdl_${sid}[tmv_${sid}.tm_wday])`;
    case '{mon}':return `std::string(mo_${sid}[mi_${sid}])`; case '{month}':return `std::string(mol_${sid}[mi_${sid}])`;
    default:return `std::string("${esc(seg)}")`; } };
  const concat = segs.length ? segs.map(cpp).join(' + ') : 'std::string("")';
  const fmt=el.format||{};
  const f = (fmt.prefix||fmt.suffix) ? `${escFmt(fmt.prefix||'')}%s${escFmt(_suffixOut(fmt.suffix))}` : '%s';
  let out=`${I}{\n`;
  out+=`${I}  std::string ${s} = id(${src.id}).state;\n`;
  out+=`${I}  std::string out_${sid};\n`;
  out+=`${I}  if (${s}.length() >= ${minLen}) {\n`;   // guard: empty/short state at boot -> no substr crash
  if(usesWd){
    out+=`${I}    struct tm tmv_${sid} = {};\n`;
    out+=`${I}    tmv_${sid}.tm_year = atoi(${s}.substr(0,4).c_str()) - 1900;\n`;
    out+=`${I}    tmv_${sid}.tm_mon  = atoi(${s}.substr(5,2).c_str()) - 1;\n`;
    out+=`${I}    tmv_${sid}.tm_mday = atoi(${s}.substr(8,2).c_str());\n`;
    out+=`${I}    mktime(&tmv_${sid});\n`;
    out+=`${I}    static const char* wd_${sid}[] = {${N.wd_s.map(x=>`"${esc(x)}"`).join(', ')}};\n`;
    out+=`${I}    static const char* wdl_${sid}[] = {${N.wd_l.map(x=>`"${esc(x)}"`).join(', ')}};\n`;
  }
  if(usesMo){
    out+=`${I}    int mi_${sid} = atoi(${s}.substr(5,2).c_str()) - 1; if(mi_${sid}<0||mi_${sid}>11) mi_${sid}=0;\n`;
    out+=`${I}    static const char* mo_${sid}[] = {${N.mo_s.map(x=>`"${esc(x)}"`).join(', ')}};\n`;
    out+=`${I}    static const char* mol_${sid}[] = {${N.mo_l.map(x=>`"${esc(x)}"`).join(', ')}};\n`;
  }
  out+=`${I}    out_${sid} = ${concat};\n`;
  out+=`${I}  }\n`;
  out+=`${I}  it.printf(${el.x}, ${el.y}, id(${fontId}), ${color}, TextAlign::${anchor}, "${f}", out_${sid}.c_str());\n`;
  out+=`${I}}`;
  return out;
}
function transformOptions(kind){
  if(kind==='number') return [['none',T('Geen','None')],['roundN',T('Afronden op N decimalen','Round to N decimals')],['scale',T('Schalen (× factor)','Scale (× factor)')]];
  if(kind==='bool')   return [['none',T('Geen','None')],['boolLabel',T('on/off → eigen labels','on/off → custom labels')]];
  if(kind==='time' || kind==='string'){
    const base = [['none',T('Geen','None')]];
    if(kind==='string') base.push(['boolLabel',T('on/off → eigen labels','on/off → custom labels')]);
    Object.keys(STRTRANSFORMS).forEach(id=>base.push([id, T(STRTRANSFORMS[id].nl, STRTRANSFORMS[id].en)]));
    base.push(['custom', T('Aangepast format (weekdag/maand/datum/tijd)','Custom format (weekday/month/date/time)')]);
    return base;
  }
  // static
  return [['none',T('Geen','None')],['upper',T('HOOFDLETTERS','UPPERCASE')],['capitalize',T('Eerste letter hoofdletter','Capitalize first letter')]];
}
function condEditor(el){
  const cd=el.condition||{enabled:false};
  let h=`<label class="toggle"><input type="checkbox" data-cd="enabled" ${cd.enabled?'checked':''}> ${T('Conditie gebruiken','Use condition')}</label>`;
  if(!cd.enabled) return h;
  h+=`<div class="cond-box">
    <div class="row"><div><label class="fld">${T('Bron','Source')}</label><select data-cd="sourceId">${srcOpts(cd.sourceId,true)}</select></div></div>
    <div class="row tight"><div><label class="fld">Operator</label><select data-cd="op">
      <option value="on" ${cd.op==='on'?'selected':''}>${T('is aan (on)','is on')}</option>
      <option value="eq" ${cd.op==='eq'?'selected':''}>${T('= gelijk aan','= equals')}</option>
      <option value="lt" ${cd.op==='lt'?'selected':''}>${T('&lt; kleiner dan','&lt; less than')}</option>
      <option value="gt" ${cd.op==='gt'?'selected':''}>${T('&gt; groter dan','&gt; greater than')}</option>
      <option value="between" ${cd.op==='between'?'selected':''}>${T('tussen','between')}</option>
    </select></div>`;
  if(cd.op!=='on') h+=`<div><label class="fld">${T('Waarde','Value')}</label><input data-cd="val" type="text" value="${attr(cd.val)}"></div>`;
  if(cd.op==='between') h+=`<div><label class="fld">${T('… en','… and')}</label><input data-cd="val2" type="text" value="${attr(cd.val2)}"></div>`;
  h+=`</div>`;
  h+=branchEditor(el,'whenTrue',T('Als WAAR','If TRUE'),'t')+branchEditor(el,'whenFalse',T('Als ONWAAR','If FALSE'),'f');
  h+=`</div>`;
  return h;
}
function branchEditor(el,key,title,cls){
  const b=el.condition[key]||{};
  let h=`<div class="branch ${cls}"><h5>${title}</h5>`;
  if(el.type==='text') h+=`<div class="row"><div><label class="fld">${T('Tekst (override)','Text (override)')}</label><input data-br="${key}.text" type="text" value="${attr(b.text)}" placeholder="${T('(leeg = waarde uit bron)','(empty = value from source)')}"></div></div>`;
  if(el.type==='icon') h+=`<div class="row" style="align-items:center"><div style="flex:none">${b.iconName?`<span class="mdi mdi-${b.iconName}" style="font-size:26px"></span>`:`<span class="hint">${T('geen','none')}</span>`}</div><div><button class="btn sm" data-pickbranch="${key}">${T('Icoon…','Icon…')}</button></div></div>`;
  h+=`<div class="row"><div><label class="fld">${T('Kleur (override)','Colour (override)')}</label><select data-br="${key}.colorId"><option value="">${T('— geen —','— none —')}</option>${profile().colors.map(c=>`<option value="${c.id}" ${b.colorId===c.id?'selected':''}>${c.id}</option>`).join('')}</select></div></div>`;
  h+=`<label class="toggle"><input type="checkbox" data-br="${key}.visible" ${b.visible!==false?'checked':''}> ${T('Zichtbaar','Visible')}</label>`;
  return h+`</div>`;
}

function attr(v){ return v==null?'':String(v).replace(/"/g,'&quot;'); }

/* ---- inspector event binding ---- */
/* add ▲/▼ stepper buttons to radius/size number fields (the field stays editable) */
function addSteppers(host){
  const keys=['x','y','x2','y2','w','h','r','inner','rx','ry','sides','scale'];
  const sel='input[type=number].spin, '+keys.map(k=>`input[type=number][data-k="${k}"]`).join(', ');
  host.querySelectorAll(sel).forEach(inp=>{
    if(inp._stepped || !inp.parentNode) return; inp._stepped=true;
    const wrap=document.createElement('span'); wrap.className='stepper';
    inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
    const col=document.createElement('span'); col.className='step-col';
    const mk=(dir,glyph)=>{ const b=document.createElement('button'); b.type='button'; b.className='step-btn'; b.textContent=glyph; b.tabIndex=-1;
      b.onclick=()=>{ const step=+inp.step||1; let v=(+inp.value||0)+dir*step;
        if(inp.min!=='' && inp.min!=null) v=Math.max(+inp.min, v);
        if(inp.max!=='' && inp.max!=null) v=Math.min(+inp.max, v);
        inp.value=v; inp.dispatchEvent(new Event('change',{bubbles:true})); };
      return b; };
    col.appendChild(mk(1,'▲')); col.appendChild(mk(-1,'▼'));
    wrap.appendChild(col);
  });
}
function bindInspector(host, el){
  addSteppers(host);
  // generic top-level keys
  host.querySelectorAll('[data-k]').forEach(inp=>{
    const isNum = inp.type==='number'||inp.type==='range';
    inp.addEventListener('change',()=>{ pushUndo(); const k=inp.dataset.k;
      el[k] = inp.type==='checkbox'?inp.checked:(isNum?(+inp.value):inp.value);
      if(k==='sides'){ el.sides=Math.max(3, Math.round(el.sides||3)); inp.value=el.sides; }   // never below 3
      // circle with lock ratio: keep rx == ry so it stays round
      if(el.type==='circle' && el.lockAspect!==false && (k==='rx'||k==='ry')){ const v=el[k]; el.rx=v; el.ry=v; }
      // re-locking restores a clean 1:1 aspect (circle -> round, rect/triangle -> square)
      if(k==='lockAspect' && inp.checked){
        if(el.type==='circle'){
          const r=Math.round(((el.rx!=null?el.rx:(el.r!=null?el.r:40))+(el.ry!=null?el.ry:(el.r!=null?el.r:40)))/2);
          el.rx=r; el.ry=r; delete el.r;
        } else if(el.type==='rect' || el.type==='triangle'){
          const s=Math.round(((el.w||0)+(el.h||0))/2); el.w=s; el.h=s;
        }
      }
      afterChange();
      if(k==='lockAspect' || (el.type==='circle' && el.lockAspect!==false && (k==='rx'||k==='ry'))) renderInspector();   // refresh shown values
    });
    // live preview while dragging a slider (no undo spam, no full inspector rebuild)
    if(inp.type==='range'){
      inp.addEventListener('input',()=>{ el[inp.dataset.k]=+inp.value;
        const prev=inp.previousElementSibling;            // the matching <label> just above
        const lbl=prev && prev.querySelector ? prev.querySelector('.rot-deg') : null;
        if(lbl) lbl.textContent=inp.value;
        persist(); renderCanvas(); });
    }
  });
  host.querySelectorAll('[data-k2]').forEach(inp=>{
    inp.addEventListener('change',()=>{ pushUndo(); el[inp.dataset.k2]=inp.value; el.transformArg={};
      if(inp.value==='custom'){ el.transformArg={fmt:'{wd} {dd} {mon}', lang:(window.APP_LANG==='en'?'en':'nl')}; }
      afterChange(); });
  });
  // anchor
  host.querySelectorAll('[data-anchor]').forEach(b=>b.addEventListener('click',()=>{ pushUndo();
    // keep the text visually in place: convert anchor point between old and new alignment
    const node=contentLayer.getChildren(n=>n._elId===el.id)[0];
    if(node && (el.type==='text'||el.type==='icon')){
      const w=node.width(), h=node.height();
      const oldO=anchorOffset(el.anchor||'TOP_LEFT', w, h);
      const topLeftX=el.x+oldO.ox, topLeftY=el.y+oldO.oy; // current visual top-left
      const newO=anchorOffset(b.dataset.anchor, w, h);
      el.x=Math.round(topLeftX-newO.ox); el.y=Math.round(topLeftY-newO.oy);
    }
    el.anchor=b.dataset.anchor; afterChange();
  }));
  // color swatches
  host.querySelectorAll('.swatch[data-color]').forEach(sw=>sw.addEventListener('click',()=>{ pushUndo(); el[sw.dataset.key]=sw.dataset.color; afterChange(); }));
  // source
  host.querySelectorAll('[data-src]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.source=el.source||{}; el.source[inp.dataset.src]=inp.value; afterChange(); }));
  // format
  host.querySelectorAll('[data-fmt]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.format=el.format||{};
    if(inp.dataset.fmt==='mode'){
      // switching modes: wipe the other mode's leftovers so they don't linger/generate
      el.format.mode=inp.value;
      if(inp.value==='raw'){ el.format.prefix=''; el.format.suffix=''; }
      else { el.format.raw='%s'; }
    } else {
      el.format[inp.dataset.fmt]= inp.type==='number'?(+inp.value):inp.value;
    }
    afterChange(); }));
  // affix preset dropdown + custom field (point 5)
  host.querySelectorAll('[data-affix-sel]').forEach(sel=>sel.addEventListener('change',()=>{
    const which=sel.dataset.affixSel;
    const custom=host.querySelector(`[data-affix-custom="${which}"]`);
    if(sel.value==='__custom__'){ custom.style.display=''; custom.focus(); return; }
    custom.style.display='none'; custom.value=sel.value;
    pushUndo(); el.format=el.format||{}; el.format[which]=sel.value; afterChange();
  }));
  host.querySelectorAll('[data-affix-custom]').forEach(inp=>inp.addEventListener('input',()=>{
    el.format=el.format||{}; el.format[inp.dataset.affixCustom]=inp.value; persist(); renderCanvas();
  }));
  // transform args
  host.querySelectorAll('[data-ta]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.transformArg=el.transformArg||{}; el.transformArg[inp.dataset.ta]= inp.type==='number'?(+inp.value):inp.value; afterChange(); }));
  // condition
  host.querySelectorAll('[data-cd]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.condition=el.condition||{}; const k=inp.dataset.cd; el.condition[k]= inp.type==='checkbox'?inp.checked:inp.value; afterChange(); }));
  host.querySelectorAll('[data-br]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); const [bk,prop]=inp.dataset.br.split('.'); el.condition[bk]=el.condition[bk]||{}; el.condition[bk][prop]= inp.type==='checkbox'?inp.checked:inp.value; afterChange(); }));
  // icon pickers
  const pi=host.querySelector('#pick-icon'); if(pi) pi.addEventListener('click',()=>openIconPicker(sel=>{ pushUndo(); el.iconName=sel.name; el.iconHex=sel.hex; afterChange(); }));
  host.querySelectorAll('[data-pickbranch]').forEach(b=>b.addEventListener('click',()=>openIconPicker(sel=>{ pushUndo(); const k=b.dataset.pickbranch; el.condition[k]=el.condition[k]||{}; el.condition[k].iconName=sel.name; el.condition[k].iconHex=sel.hex; afterChange(); })));

  // wifi
  host.querySelectorAll('[data-wifi]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.wifi=el.wifi||{}; el.wifi[inp.dataset.wifi]=inp.value; afterChange(); }));
  host.querySelectorAll('[data-wifilv]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); const [i,prop]=inp.dataset.wifilv.split('.'); el.wifi.levels[+i][prop]= prop==='min'?(+inp.value):inp.value.toUpperCase(); afterChange(); }));
  // wifi per-level MDI icon picker
  host.querySelectorAll('[data-pickwifi]').forEach(b=>b.addEventListener('click',()=>openIconPicker(sel=>{ pushUndo(); const i=+b.dataset.pickwifi; el.wifi.levels[i].hex=sel.hex; el.wifi.levels[i].icon=sel.name; afterChange(); }, 'wifi')));

  // clock
  host.querySelectorAll('[data-clock]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.clock=el.clock||{}; const k=inp.dataset.clock; el.clock[k]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  const pci=host.querySelector('#pick-clock-icon'); if(pci) pci.addEventListener('click',()=>openIconPicker(sel=>{ pushUndo(); el.clock.iconName=sel.name; el.clock.iconHex=sel.hex; afterChange(); }, 'refresh'));
  const c12=host.querySelector('#clock-12h'); if(c12) c12.addEventListener('change',()=>{ pushUndo(); el.clock=el.clock||{}; el.clock.strftime = c12.checked ? '%I:%M %p' : '%H:%M'; afterChange(); });

  // graph
  host.querySelectorAll('[data-graph]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.graph=el.graph||{}; const k=inp.dataset.graph; el.graph[k]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  host.querySelectorAll('[data-trace]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); const [i,prop]=inp.dataset.trace.split('.'); el.graph.traces[+i][prop]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  host.querySelectorAll('[data-axes]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.graph.axes=el.graph.axes||{}; const k=inp.dataset.axes; el.graph.axes[k]= inp.type==='checkbox'?inp.checked:inp.value; afterChange(); }));
  host.querySelectorAll('[data-legend]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.graph.legend=el.graph.legend||{}; const k=inp.dataset.legend; el.graph.legend[k]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(inp.value===''?'':+inp.value):inp.value); afterChange(); }));
  host.querySelectorAll('[data-trace-color]').forEach(sw=>sw.addEventListener('click',()=>{ pushUndo();
    const dot=sw.dataset.traceColor.indexOf('.'); const i=+sw.dataset.traceColor.slice(0,dot), cid=sw.dataset.traceColor.slice(dot+1);
    el.graph.traces[i].colorId=cid; afterChange(); }));
  host.querySelectorAll('[data-trace-del]').forEach(b=>b.addEventListener('click',()=>{ pushUndo(); el.graph.traces.splice(+b.dataset.traceDel,1); afterChange(); }));
  const ta=host.querySelector('#trace-add'); if(ta) ta.addEventListener('click',()=>{ pushUndo(); el.graph.traces.push({sourceId:'', lineType:'SOLID', thickness:2, continuous:true, colorId:'color_text'}); afterChange(); });
}

/* ============================================================
   CODE GENERATION
   ============================================================ */
function cppColor(id){ return colorById(id)? id : 'color_text'; }
function pad8(hex){ return ('00000000'+hex).slice(-8).toUpperCase(); }

/* value expr + format token for a text element */
function valueExpr(el){
  const sc=el.source||{kind:'static'};
  const fmt=el.format||{};
  if(sc.kind==='static'){
    let t = transformPreview(el, sc.text||''); // upper/capitalize fold in here
    t = (fmt.prefix||'')+t+_suffixOut(fmt.suffix);
    return {mode:'print', literal:t};
  }
  if(sc.kind==='expr'){
    const f = fmt.mode==='raw'? (fmt.raw||'%s') : ((fmt.prefix||'')+'%s'+(fmt.suffix||''));
    return {mode:'printf', fmt:f, args:[sc.expr||'']};
  }
  // sensor
  const src=srcById(sc.sourceId)||{kind:'number'};
  let arg, token;
  if(src.kind==='number'){
    let expr=`id(${src.id}).state`;
    if(el.transform==='scale') expr=`(id(${src.id}).state * ${el.transformArg&&el.transformArg.factor!=null?el.transformArg.factor:1})`;
    const dec = el.transform==='roundN'?(el.transformArg.n??1):(fmt.decimals??1);
    token=`%.${dec}f`; arg=expr;
    const r=wrapFmt(); r.numeric=true; r.numArg=`id(${src.id}).state`; return r;
  } else {
    let expr=`id(${src.id}).state`;
    if(el.transform==='trimSeconds') expr=`id(${src.id}).state.substr(0, id(${src.id}).state.length() - 3)`;
    else if(STRTRANSFORMS[el.transform] && STRTRANSFORMS[el.transform].expr) expr=STRTRANSFORMS[el.transform].expr(`id(${src.id}).state`);
    if(el.transform==='boolLabel'){ const a=el.transformArg||{};
      arg=`(id(${src.id}).state == "on" ? "${esc(a.trueLabel||'Aan')}" : "${esc(a.falseLabel||'Uit')}")`; token='%s';
      return wrapFmt();
    }
    arg='('+expr+').c_str()'; token='%s';
  }
  return wrapFmt();
  function wrapFmt(){
    let f;
    if(fmt.mode==='raw' && fmt.raw) f=fmt.raw;
    else f=escFmt(fmt.prefix||'')+token+escFmt(_suffixOut(fmt.suffix));
    return {mode:'printf', fmt:f, args:[arg]};
  }
}

function drawStmt(el, indent){
  const I=indent;
  const color = cppColor(el.colorId);
  const anchor = el.anchor||'TOP_LEFT';
  if(el.type==='line') return `${I}it.line(${el.x}, ${el.y}, ${el.x2}, ${el.y2}, ${color});`;
  if(el.type==='rect'){
    if(el.rotation){
      const c=rectCorners(el).map(p=>[Math.round(p[0]),Math.round(p[1])]);
      if(el.filled){
        return `${I}it.filled_triangle(${c[0][0]}, ${c[0][1]}, ${c[1][0]}, ${c[1][1]}, ${c[2][0]}, ${c[2][1]}, ${color});\n`
             + `${I}it.filled_triangle(${c[0][0]}, ${c[0][1]}, ${c[2][0]}, ${c[2][1]}, ${c[3][0]}, ${c[3][1]}, ${color});`;
      }
      return [0,1,2,3].map(i=>{ const a=c[i], b=c[(i+1)%4];
        return `${I}it.line(${a[0]}, ${a[1]}, ${b[0]}, ${b[1]}, ${color});`; }).join('\n');
    }
    const fn=el.filled?'filled_rectangle':'rectangle'; return `${I}it.${fn}(${el.x}, ${el.y}, ${el.w}, ${el.h}, ${color});`;
  }
  if(el.type==='triangle'){
    const v=triVerts(el).map(p=>Math.round(p[0])+', '+Math.round(p[1]));
    const fn=el.filled?'filled_triangle':'triangle';
    return `${I}it.${fn}(${v.join(', ')}, ${color});`;
  }
  if(el.type==='polygon'){
    // ESPHome signature: regular_polygon(x, y, radius, edges, variation, rotation_degrees, color)
    // — the 5th arg is the VARIATION enum, the rotation is the 6th (a float in degrees).
    const fn=el.filled?'filled_regular_polygon':'regular_polygon';
    return `${I}it.${fn}(${el.x}, ${el.y}, ${el.r||60}, ${Math.max(3,el.sides||6)}, VARIATION_POINTY_TOP, ${el.rotation||0}, ${color});`;
  }
  if(el.type==='ring'){
    return `${I}it.filled_ring(${el.x}, ${el.y}, ${el.r||50}, ${el.inner||30}, ${color});`;
  }
  if(el.type==='gauge'){
    const pct=Math.max(0,Math.min(100,el.percent==null?50:el.percent));
    return `${I}it.filled_gauge(${el.x}, ${el.y}, ${el.r||50}, ${el.inner||30}, ${pct}, ${color});`;
  }
  if(el.type==='qr'){
    return `${I}it.qr_code(${el.x}, ${el.y}, id(${qrId(el)}), ${color}, ${el.scale||4});`;
  }
  if(el.type==='circle'){
    const rx=(el.rx!=null?el.rx:(el.r!=null?el.r:40)), ry=(el.ry!=null?el.ry:(el.r!=null?el.r:40));
    if(rx===ry){ const fn=el.filled?'filled_circle':'circle'; return `${I}it.${fn}(${el.x}, ${el.y}, ${rx}, ${color});`; }
    // ellipse → polygon approximation (no native ESPHome ellipse)
    const seg=48, pts=[];
    for(let i=0;i<seg;i++){ const a=i/seg*2*Math.PI; pts.push([Math.round(el.x+rx*Math.cos(a)), Math.round(el.y+ry*Math.sin(a))]); }
    const out=[];
    for(let i=0;i<seg;i++){ const p=pts[i], q=pts[(i+1)%seg];
      out.push(el.filled
        ? `${I}it.filled_triangle(${el.x}, ${el.y}, ${p[0]}, ${p[1]}, ${q[0]}, ${q[1]}, ${color});`
        : `${I}it.line(${p[0]}, ${p[1]}, ${q[0]}, ${q[1]}, ${color});`); }
    return out.join('\n');
  }
  if(el.type==='graph') return graphDrawCode(el, I);
  if(el.type==='wifi') return wifiCode(el, I, color, anchor);
  if(el.type==='clock') return clockCode(el, I, color, anchor);
  const font=fontById(el.fontId)||{id:'font_klein'};
  if(el.type==='icon') return `${I}it.printf(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "\\U${pad8(el.iconHex||'')}");`;
  // text — custom format and weekday/month NAME transforms need a helper block
  if(el.transform==='custom' && el.source && el.source.kind==='sensor' && el.source.sourceId)
    return textCustomBlock(el, I, font.id, color, anchor);
  if(NAMETRANSFORMS[el.transform] && el.source && el.source.kind==='sensor' && el.source.sourceId)
    return textNameBlock(el, I, font.id, color, anchor);
  const v=valueExpr(el);
  if(v.mode==='print') return `${I}it.print(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "${esc(v.literal)}");`;
  if(v.numeric){
    // NaN-safe: an unavailable/unknown sensor prints "---" (needs only '-', which every
    // digit/7-segment font has) instead of "nan" tofu.
    const I2=I+'  ';
    return `${I}if (isnan(${v.numArg})) {\n`
         + `${I2}it.print(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "---");\n`
         + `${I}} else {\n`
         + `${I2}it.printf(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "${v.fmt}", ${v.args.join(', ')});\n`
         + `${I}}`;
  }
  return `${I}it.printf(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "${v.fmt}", ${v.args.join(', ')});`;
}
/* emit a names[] lookup block for a weekday/month name transform */
function textNameBlock(el, I, fontId, color, anchor){
  const nt=NAMETRANSFORMS[el.transform];
  const src=srcById(el.source.sourceId)||{id:el.source.sourceId};
  const sid=shortId(el), st=`id(${src.id}).state`;
  const arr=nt.arr.map(s=>`"${esc(s)}"`).join(', ');
  const fmt=el.format||{};
  const f = (fmt.prefix||fmt.suffix) ? `${escFmt(fmt.prefix||'')}%s${escFmt(_suffixOut(fmt.suffix))}` : '%s';
  let out=`${I}{\n`;
  out+=`${I}  static const char* names_${sid}[] = {${arr}};\n`;
  out+=`${I}  int idx_${sid} = -1;\n`;
  if(nt.from==='month'){
    out+=`${I}  if (${st}.length() >= 7) idx_${sid} = atoi(${st}.substr(5,2).c_str()) - 1;\n`;
  } else {
    out+=`${I}  if (${st}.length() >= 10) {\n`;   // guard: short/empty state at boot must not throw
    out+=`${I}    struct tm tmv_${sid} = {};\n`;
    out+=`${I}    tmv_${sid}.tm_year = atoi(${st}.substr(0,4).c_str()) - 1900;\n`;
    out+=`${I}    tmv_${sid}.tm_mon  = atoi(${st}.substr(5,2).c_str()) - 1;\n`;
    out+=`${I}    tmv_${sid}.tm_mday = atoi(${st}.substr(8,2).c_str());\n`;
    out+=`${I}    mktime(&tmv_${sid});\n`;
    out+=`${I}    idx_${sid} = tmv_${sid}.tm_wday;\n`;
    out+=`${I}  }\n`;
  }
  out+=`${I}  const char* val_${sid} = (idx_${sid} >= 0 && idx_${sid} < ${nt.arr.length}) ? names_${sid}[idx_${sid}] : "";\n`;
  out+=`${I}  it.printf(${el.x}, ${el.y}, id(${fontId}), ${color}, TextAlign::${anchor}, "${f}", val_${sid});\n`;
  out+=`${I}}`;
  return out;
}
function numFilled(v){ return v!==''&&v!=null&&!isNaN(+v); }
function yamlStr(s){ return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"'; }
function graphId(el){ return 'graph_'+el.id.replace(/[^a-z0-9_]/gi,''); }
function qrId(el){
  const c=el.qrCustomId; if(c && /^[a-z_][a-z0-9_]*$/i.test(c)) return c;   // user-chosen id
  return 'qr_'+el.id.replace(/[^a-z0-9_]/gi,'');
}
function graphDrawCode(el, I){
  let out=`${I}it.graph(${el.x}, ${el.y}, id(${graphId(el)}));`;
  const gr=el.graph||{}, ax=gr.axes||{}, lg=gr.legend||{};
  // legend is positioned independently of the graph (defaults to its right)
  if(lg.show){
    const lx=numFilled(lg.x)?+lg.x:(el.x+el.w+8), ly=numFilled(lg.y)?+lg.y:el.y;
    out+=`\n${I}it.legend(${lx}, ${ly}, id(${graphId(el)}));`;
  }
  if(!ax.show) return out;
  const font=(fontById(ax.fontId)||{id:'font_klein'}).id;
  const col='color_text';
  const x=el.x, y=el.y, w=el.w, h=el.h;
  const lines=[];
  // y-axis scale (needs a fixed range; auto-scale has no known numbers)
  if(ax.showYScale!==false && numFilled(gr.max_range) && numFilled(gr.min_range)){
    const mx=+gr.max_range, mn=+gr.min_range, mid=Math.round(((mx+mn)/2)*100)/100;
    lines.push(`it.printf(${x-4}, ${y}, id(${font}), ${col}, TextAlign::TOP_RIGHT, "${esc(String(mx))}");`);
    lines.push(`it.printf(${x-4}, ${y+Math.round(h/2)}, id(${font}), ${col}, TextAlign::CENTER_RIGHT, "${esc(String(mid))}");`);
    lines.push(`it.printf(${x-4}, ${y+h}, id(${font}), ${col}, TextAlign::BOTTOM_RIGHT, "${esc(String(mn))}");`);
  }
  // y-axis title (above, top-left)
  if(ax.yTitle) lines.push(`it.printf(${x}, ${y-2}, id(${font}), ${col}, TextAlign::BOTTOM_LEFT, "${esc(ax.yTitle)}");`);
  // x-axis scale at the ends below the plot
  if(ax.showXScale!==false){
    lines.push(`it.printf(${x}, ${y+h+2}, id(${font}), ${col}, TextAlign::TOP_LEFT, "-${esc(gr.duration||'1h')}");`);
    lines.push(`it.printf(${x+w}, ${y+h+2}, id(${font}), ${col}, TextAlign::TOP_RIGHT, "0");`);
  }
  // x-axis title (centered below)
  if(ax.xTitle) lines.push(`it.printf(${x+Math.round(w/2)}, ${y+h+16}, id(${font}), ${col}, TextAlign::TOP_CENTER, "${esc(ax.xTitle)}");`);
  return out + (lines.length? '\n'+lines.map(l=>I+l).join('\n') : '');
}
function wifiCode(el, I, color, anchor){
  const font=(fontById(el.fontId)||{id:'font_mdi_small'}).id;
  const levels=(el.wifi&&el.wifi.levels)||[];
  const I2=I+'  ';
  let out=`${I}// ${T('WiFi-icoon','WiFi icon')} (${el.name||'wifi'})\n`;
  out+=`${I}if (id(wifisignal).has_state()) {\n`;
  levels.forEach((lv,i)=>{
    const line=`it.printf(${el.x}, ${el.y}, id(${font}), ${color}, TextAlign::${anchor}, "\\U${pad8(lv.hex)}");`;
    if(i===0) out+=`${I2}if (id(wifisignal).state >= ${lv.min}) {\n${I2}  ${line}\n`;
    else if(i<levels.length-1) out+=`${I2}} else if (id(wifisignal).state >= ${lv.min}) {\n${I2}  ${line}\n`;
    else out+=`${I2}} else {\n${I2}  ${line}\n`;
  });
  if(levels.length>1) out+=`${I2}}\n`;
  out+=`${I}}`;
  return out;
}
/* clock text offset: horizontal auto-scales with the icon size (so the time doesn't
   land on top of big icons) unless the user set offX; offY shifts the text vertically
   (0 = vertically centred on the icon). */
function clockOffsets(el){
  const c=el.clock||{};
  const ifont = c.icon ? (fontById(c.iconFontId)||fontById(el.fontId)||{size:30}) : null;
  const autoX = c.icon ? Math.round((ifont.size||30))+6 : 0;
  const offX = (c.offX!=null && c.offX!=='') ? +c.offX : autoX;   // auto-scales with icon size
  const offY = (c.offY!=null && c.offY!=='') ? +c.offY : 0;
  return {offX, offY, autoX};
}
function clockCode(el, I, color, anchor){
  const c=el.clock||{}; const font=(fontById(el.fontId)||{id:'font_small_book'}).id;
  // keep horizontal part of the anchor, force vertical CENTER so icon+text share a midline
  const hpart = /LEFT$/.test(anchor)?'LEFT':(/RIGHT$/.test(anchor)?'RIGHT':'CENTER');
  const valign = 'CENTER_'+hpart; // CENTER_LEFT / CENTER / CENTER_RIGHT
  const va = hpart==='CENTER' ? 'CENTER' : valign;
  let out=`${I}// ${T('Refresh-tijdstempel','Refresh timestamp')} (${el.name||'klok'})\n`;
  out+=`${I}{\n`;
  out+=`${I}  char ts_${shortId(el)}[24];\n`;
  out+=`${I}  time_t t_${shortId(el)} = id(homeassistant_time).now().timestamp;\n`;
  out+=`${I}  strftime(ts_${shortId(el)}, sizeof(ts_${shortId(el)}), "${esc(c.strftime||'%H:%M')}", localtime(&t_${shortId(el)}));\n`;
  if(c.icon){
    const ifont=(fontById(c.iconFontId)||{id:font}).id;
    const {offX,offY}=clockOffsets(el);
    out+=`${I}  it.printf(${el.x}, ${el.y}, id(${ifont}), ${color}, TextAlign::${va}, "\\U${pad8(c.iconHex||'F044C')}");\n`;
    out+=`${I}  it.printf(${el.x + offX}, ${el.y + offY}, id(${font}), ${color}, TextAlign::${va}, "%s", ts_${shortId(el)});\n`;
  } else {
    out+=`${I}  it.printf(${el.x}, ${el.y}, id(${font}), ${color}, TextAlign::${va}, "%s", ts_${shortId(el)});\n`;
  }
  out+=`${I}}`;
  return out;
}
function shortId(el){ return el.id.replace(/[^a-z0-9_]/gi,'').slice(-6); }
function condExpr(cd){
  const src=srcById(cd.sourceId)||{kind:'string'};
  const ref=`id(${cd.sourceId}).state`;
  const numv=v=>src.kind==='number'?Number(v):`"${esc(v)}"`;
  switch(cd.op){
    case 'on': return `${ref} == "on"`;
    case 'eq': return src.kind==='number'?`${ref} == ${Number(cd.val)}`:`${ref} == "${esc(cd.val)}"`;
    case 'lt': return `${ref} < ${Number(cd.val)}`;
    case 'gt': return `${ref} > ${Number(cd.val)}`;
    case 'between': return `${ref} >= ${Number(cd.val)} && ${ref} <= ${Number(cd.val2)}`;
  }
  return 'true';
}
function applyBranch(el, ov){
  const m=JSON.parse(JSON.stringify(el)); m.condition={enabled:false};
  if(ov.text!=null && ov.text!=='') m.source={kind:'static',text:ov.text};
  if(ov.iconName){ m.iconName=ov.iconName; m.iconHex=ov.iconHex; }
  if(ov.colorId) m.colorId=ov.colorId;
  return m;
}
function elementCode(el, baseIndent){
  if(el.visible===false){
    // hidden in layers -> the WHOLE statement (incl. multi-line if/else blocks) is commented out
    const inner=drawStmt(Object.assign({},el,{visible:true}), '').trim();
    const lines=inner.split('\n');
    const lbl=T('verborgen','hidden');
    return lines.map((ln,i)=> i===0
      ? `${baseIndent}// [${lbl}] ${el.name||el.type}: ${ln}`
      : `${baseIndent}// ${ln}`).join('\n');
  }
  const cd=el.condition;
  if(!cd || !cd.enabled || !cd.sourceId){
    return drawStmt(el, baseIndent);
  }
  const tEl=applyBranch(el, cd.whenTrue||{}), fEl=applyBranch(el, cd.whenFalse||{});
  const tVis=(cd.whenTrue&&cd.whenTrue.visible!==false), fVis=(cd.whenFalse&&cd.whenFalse.visible!==false);
  const I=baseIndent, I2=baseIndent+'  ';
  let out=`${I}if (${condExpr(cd)}) {\n`;
  out += (tVis? drawStmt(tEl,I2):`${I2}// (${T('verborgen','hidden')})`)+'\n';
  out += `${I}} else {\n`;
  out += (fVis? drawStmt(fEl,I2):`${I2}// (${T('verborgen','hidden')})`)+'\n';
  out += `${I}}`;
  return out;
}

/* ---- glyph collection ---- */
// ESPHome HARD-FAILS the build if you list a glyph the font file doesn't contain,
// so we never guess exotic glyphs. Value elements render "---" (not "nan") when a
// sensor is unavailable, so number fonts only need '-'. The graph legend is drawn
// by ESPHome itself (names/values/units we can't intercept), so its fonts get the
// full printable-ASCII set — safe for normal text fonts, skipped for digit fonts.
const ASCII_GLYPHS = (()=>{ let s=''; for(let c=0x20;c<=0x7e;c++) s+=String.fromCharCode(c); return s; })();
function fontIsDigitDisplay(f){ return /digital|7.?seg|dseg|segment|lcd|dotmatrix/i.test((f&&f.file)||''); }
function collectGlyphs(){
  const map={}; // fontId -> {chars:Set, icons:Map(hex->name), dynamic:bool}
  profile().fonts.forEach(f=>map[f.id]={chars:new Set(), icons:new Map(), dynamic:f.dynamic});
  const addText=(fontId,str)=>{ if(!map[fontId])return; for(const ch of String(str)) map[fontId].chars.add(ch); };
  const addIcon=(fontId,hex,name)=>{ if(!map[fontId]||!hex)return; map[fontId].icons.set(pad8(hex),name||''); };
  const p0=profile(); [].concat(p0.elements||[], p0.waitElements||[]).forEach(el=>{
    const variants=[el];
    if(el.condition&&el.condition.enabled){ variants.push(applyBranch(el,el.condition.whenTrue||{}),applyBranch(el,el.condition.whenFalse||{})); }
    variants.forEach(E=>{
      if(E.type==='icon') addIcon(E.fontId,E.iconHex,E.iconName);
      else if(E.type==='text'){
        const sc=E.source||{};
        if(sc.kind==='static') addText(E.fontId, transformPreview(E, sc.text||''));
        else { map[E.fontId] && (map[E.fontId].dynamic=true);
          if(E.format&&E.format.mode==='raw'){
            // raw printf: harvest the LITERAL characters (everything that isn't a
            // %-specifier) so e.g. "%.1f°C" still puts ° and C in the font's glyphs.
            addText(E.fontId, String(E.format.raw||'').replace(/%[-+ 0-9.]*[dfsxX]/g,'').replace(/%%/g,'%'));
          } else {
            addText(E.fontId,(E.format&&E.format.prefix)||''); addText(E.fontId,(E.format&&E.format.suffix)||'');
          }
          if(E.transform==='boolLabel'){ const a=E.transformArg||{}; addText(E.fontId,a.trueLabel||'Aan'); addText(E.fontId,a.falseLabel||'Uit'); }
          if(NAMETRANSFORMS[E.transform]) NAMETRANSFORMS[E.transform].arr.forEach(nm=>addText(E.fontId, nm));   // weekday/month letters
          if(E.transform==='custom'){ const a=E.transformArg||{}; const N=DTNAMES[a.lang==='en'?'en':'nl'];
            [].concat(N.wd_s,N.wd_l,N.mo_s,N.mo_l).forEach(nm=>addText(E.fontId, nm));
            addText(E.fontId, String(a.fmt||'').replace(/\{[a-z]+\}/g,'')); addText(E.fontId,'0123456789'); }
        }
      }
      else if(E.type==='wifi'){ (E.wifi&&E.wifi.levels||[]).forEach(lv=>addIcon(E.fontId, lv.hex, lv.icon||'wifi')); }
      else if(E.type==='clock'){
        // time digits + separators are dynamic; mark font dynamic and add the format's literal chars
        if(map[E.fontId]) map[E.fontId].dynamic=true;
        addText(E.fontId, '0123456789:-/. ');
        if(E.clock&&E.clock.icon) addIcon(E.clock.iconFontId, E.clock.iconHex, E.clock.iconName||'clock');
      }
      else if(E.type==='graph'){
        const ax=E.graph&&E.graph.axes;
        if(ax&&ax.show){
          addText(ax.fontId, '0123456789-. ');
          addText(ax.fontId, ax.yTitle||''); addText(ax.fontId, ax.xTitle||'');
          addText(ax.fontId, String((E.graph.min_range??''))+String((E.graph.max_range??''))+String(E.graph.duration||''));
        }
        const lg=E.graph&&E.graph.legend;
        if(lg&&lg.show){
          // resolve the SAME fonts the generator emits (name_font falls back to the
          // first font; value_font falls back to the name font). ESPHome draws the
          // names/values/units itself, so give these fonts the full ASCII set.
          const nf = fontById(lg.nameFontId) || profile().fonts[0];
          const vf = (lg.valueFontId && fontById(lg.valueFontId)) || nf;
          [nf, vf].forEach(font=>{ if(!font || !map[font.id]) return;
            map[font.id].dynamic=true;
            if(!fontIsDigitDisplay(font)) for(const ch of ASCII_GLYPHS) addText(font.id, ch);
          });
        }
      }
    });
  });
  return map;
}

function elementSortKey(el){
  // approximate visual top-left for ordering (lines use min of endpoints)
  let y = el.y, x = el.x;
  if(el.type==='line'){ y=Math.min(el.y,el.y2); x=Math.min(el.x,el.x2); }
  else if(el.type==='circle'){ y=el.y-(el.r||0); x=el.x-(el.r||0); }
  return {y,x};
}
function orderedFor(list){
  return (list||[]).slice().sort((a,b)=>{
    const ka=elementSortKey(a), kb=elementSortKey(b);
    return (ka.y-kb.y) || (ka.x-kb.x);
  });
}
function orderedElements(){ return orderedFor(els()); }

/* per-profile "which blocks to generate" settings (see Profile settings → Generated YAML) */
function outputDefaults(){
  return {
    refresh:true,                                   // esphome on_boot + script + time (grouped — they belong together)
    bootPriority:'600.0', bootDelay:'2s', waitTimeout:'30s', timeInterval:15,
    globals:true,
    spi:false, spiClk:'GPIO13', spiMosi:'GPIO14',
    fonts:true, colors:true, sensors:true, textSensors:true,
    displayPins:false,
    dataRate:'500kHz', csPin:'GPIO15', csIgnoreStrap:true,
    dcPin:'GPIO27', busyPin:'GPIO25', busyInverted:true,
    resetPin:'GPIO26', resetDuration:'2ms',
    // per-line on/off within the display pin block (only used when displayPins is on)
    dataRateOn:true, csPinOn:true, dcPinOn:true, busyPinOn:true, resetPinOn:true, resetDurOn:true,
  };
}
function outCfg(p){ return Object.assign(outputDefaults(), (p||profile()).output||{}); }

/* font ids actually referenced by an element (main + waiting screens). Used to skip
   unused fonts in the export and to flag them in the Font Editor. */
function usedFontIds(p){
  p=p||profile(); const used=new Set();
  // the built-in "waiting for data" fallback prints with the first font
  if(p.waitEnabled!==false && !(p.waitElements&&p.waitElements.length) && p.fonts[0]) used.add(p.fonts[0].id);
  [].concat(p.elements||[], p.waitElements||[]).forEach(e=>{
    if(e.fontId) used.add(e.fontId);
    if(e.clock && e.clock.iconFontId) used.add(e.clock.iconFontId);
    if(e.graph && e.graph.axes && e.graph.axes.fontId) used.add(e.graph.axes.fontId);
    if(e.graph && e.graph.legend){ if(e.graph.legend.nameFontId) used.add(e.graph.legend.nameFontId);
      if(e.graph.legend.valueFontId) used.add(e.graph.legend.valueFontId); }
  });
  return used;
}

function genYAML(){
  const p=profile(), d=p.device, gl=collectGlyphs();
  let out='';
  out+=`# ============================================================\n`;
  out+=`# ${T('Gegenereerd door E-ink Studio','Generated by E-ink Studio')} v${window.APP_VERSION||'?'} — ${T('profiel','profile')}: ${p.name}\n`;
  out+=`# ${T('Plak deze blokken in je ESPHome-config (wifi/api/ota/secrets blijven van jou).','Paste these blocks into your ESPHome config (keep your own wifi/api/ota/secrets).')}\n`;
  out+=`# ${T('Zet je lokale TTF-fonts in de fonts/-map van je ESPHome-config.','Put your local TTF fonts in your ESPHome config fonts/ folder.')}\n`;
  out+=`# ============================================================\n\n`;

  const o = outCfg(p);
  const friendly = p.name || 'E-ink Display';

  // refresh logic — esphome on_boot + script + time belong together (one toggle)
  if(o.refresh){
    out+=`# ${T('--- vul aan in je bestaande esphome: blok ---','--- add to your existing esphome: block ---')}\n`;
    out+=`esphome:\n  on_boot:\n    priority: ${o.bootPriority}\n    then:\n      - delay: ${o.bootDelay}\n      - component.update: eink_display\n      - wait_until:\n          condition:\n            lambda: 'return id(data_updated) == true;'\n          timeout: ${o.waitTimeout}\n      - lambda: 'id(initial_data_received) = true;'\n      - script.execute: update_screen\n\n`;
  }

  // globals
  if(o.globals){
    out+=`globals:\n  - id: data_updated\n    type: bool\n    restore_value: no\n    initial_value: 'false'\n  - id: initial_data_received\n    type: bool\n    restore_value: no\n    initial_value: 'false'\n  - id: recorded_display_refresh\n    type: int\n    restore_value: yes\n    initial_value: '0'\n\n`;
  }

  // script + time (part of the refresh logic)
  if(o.refresh){
    out+=`script:\n  - id: update_screen\n    then:\n      - lambda: 'id(data_updated) = false;'\n      - component.update: eink_display\n      - lambda: 'id(recorded_display_refresh) += 1;'\n      - lambda: 'id(display_last_update).publish_state(id(homeassistant_time).now().timestamp);'\n\n`;
    out+=`time:\n  - platform: homeassistant\n    id: homeassistant_time\n    on_time:\n      - seconds: 0\n        minutes: /${o.timeInterval||15}\n        then:\n          - if:\n              condition:\n                lambda: 'return id(data_updated) == true;'\n              then:\n                - script.execute: update_screen\n\n`;
  }

  // SPI bus (board-specific pins)
  if(o.spi){
    out+=`spi:\n  clk_pin: ${o.spiClk}\n  mosi_pin: ${o.spiMosi}\n\n`;
  }

  // fonts — only the ones actually used by an element (an unused font, especially an
  // icon font with no glyphs, would make ESPHome fail with "unable to determine height")
  if(o.fonts){
    const used=usedFontIds();
    const emit=p.fonts.filter(f=>used.has(f.id));
    out+=`font:\n`;
    emit.forEach(f=>{
      if(f.kind==='gfonts'){
        out+=`  - file:\n      type: gfonts\n      family: ${f.family}\n      weight: ${f.weight}\n    id: ${f.id}\n    size: ${f.size}\n`;
      } else if(f.kind==='web'){
        out+=`  - file:\n      type: web\n      url: ${yamlStr(f.url||'')}\n    id: ${f.id}\n    size: ${f.size}\n`;
      } else {
        out+=`  - file: '${f.file}'\n    id: ${f.id}\n    size: ${f.size}\n`;
      }
      out+=glyphBlock(f, gl[f.id]);
    });
    out+='\n';
  }

  // colors
  if(o.colors){
    out+=`color:\n`;
    p.colors.forEach(c=>{ out+=`  - id: ${c.id}\n    red: ${c.r}%\n    green: ${c.g}%\n    blue: ${c.b}%\n    white: ${c.w}%\n`; });
    out+='\n';
  }

  // sensors (diagnostics + used numeric homeassistant) — ${friendly_name} inlined (no substitutions block)
  const used = usedSources();
  if(o.sensors){
    out+=`sensor:\n`;
    out+=`  - platform: template\n    name: "${friendly} Display Last Update"\n    device_class: timestamp\n    entity_category: diagnostic\n    id: display_last_update\n`;
    out+=`  - platform: template\n    name: "${friendly} Recorded Display Refresh"\n    accuracy_decimals: 0\n    unit_of_measurement: "Refreshes"\n    state_class: total_increasing\n    entity_category: diagnostic\n    lambda: 'return id(recorded_display_refresh);'\n`;
    out+=`  - platform: wifi_signal\n    name: "${friendly} WiFi Signal"\n    id: wifisignal\n    entity_category: diagnostic\n    update_interval: 60s\n`;
    used.filter(s=>s.kind==='number').forEach(s=>out+=haSensor(s));
    out+='\n';
  }

  // text sensors (used string/time/bool homeassistant)
  if(o.textSensors){
    const txt = used.filter(s=>s.kind!=='number');
    if(txt.length){ out+=`text_sensor:\n`; txt.forEach(s=>out+=haSensor(s)); out+='\n'; }
  }

  // graph: components (one per graph element)
  const allEls=[].concat(p.elements||[], p.waitElements||[]);
  const graphs=allEls.filter(e=>e.type==='graph');
  if(graphs.length){
    out+=`graph:\n`;
    graphs.forEach(el=>{
      const gr=el.graph||{};
      out+=`  - id: ${graphId(el)}\n    duration: ${gr.duration||'1h'}\n    width: ${el.w}\n    height: ${el.h}\n`;
      if(gr.x_grid) out+=`    x_grid: ${gr.x_grid}\n`;
      if(gr.y_grid!=null && gr.y_grid!=='') out+=`    y_grid: ${gr.y_grid}\n`;
      if(gr.min_range!=null && gr.min_range!=='') out+=`    min_range: ${gr.min_range}\n`;
      if(gr.max_range!=null && gr.max_range!=='') out+=`    max_range: ${gr.max_range}\n`;
      out+=`    border: ${gr.border!==false?'true':'false'}\n`;
      const lg=gr.legend||{};
      const traces=(gr.traces||[]).filter(t=>t.sourceId);
      if(traces.length){
        out+=`    traces:\n`;
        traces.forEach(t=>{
          out+=`      - sensor: ${t.sourceId}\n`;
          // with a legend, ALWAYS emit a name (default = sensor id) so the rendered
          // label exactly matches the glyphs we collected — otherwise ESPHome falls
          // back to the sensor's HA name and you get tofu.
          const label = t.name || (lg.show ? t.sourceId : '');
          if(label) out+=`        name: ${yamlStr(label)}\n`;
          out+=`        line_type: ${t.lineType||'SOLID'}\n        line_thickness: ${t.thickness??2}\n        continuous: ${t.continuous!==false?'true':'false'}\n        color: ${cppColor(t.colorId)}\n`;
        });
      }
      if(lg.show){
        const nameFont=(fontById(lg.nameFontId)||profile().fonts[0]||{id:'font_klein'}).id;
        out+=`    legend:\n      name_font: ${nameFont}\n`;
        if(lg.valueFontId && fontById(lg.valueFontId)) out+=`      value_font: ${lg.valueFontId}\n`;
        out+=`      border: ${lg.border!==false?'true':'false'}\n`;
        out+=`      show_lines: ${lg.showLines!==false?'true':'false'}\n`;
        out+=`      show_values: ${lg.showValues||'AUTO'}\n`;
        out+=`      show_units: ${lg.showUnits!==false?'true':'false'}\n`;
        out+=`      direction: ${lg.direction||'AUTO'}\n`;
      }
    });
    out+='\n';
  }

  // qr_code: components (one per QR element)
  const qrs=allEls.filter(e=>e.type==='qr');
  if(qrs.length){
    out+=`qr_code:\n`;
    qrs.forEach(el=>{ out+=`  - id: ${qrId(el)}\n    value: "${esc(el.text||'')}"\n    ecc: ${el.ecc||'LOW'}\n`; });
    out+='\n';
  }

  // display + lambda
  out+=`display:\n  - platform: waveshare_epaper\n    id: eink_display\n    model: ${d.model}\n    rotation: ${d.rotation}°\n`;
  if(o.displayPins){
    if(o.dataRateOn) out+=`    data_rate: ${o.dataRate}\n`;
    if(o.csPinOn)    out+=`    cs_pin:\n      number: ${o.csPin}\n      ignore_strapping_warning: ${o.csIgnoreStrap?'true':'false'}\n`;
    if(o.dcPinOn)    out+=`    dc_pin: ${o.dcPin}\n`;
    if(o.busyPinOn)  out+=`    busy_pin:\n      number: ${o.busyPin}\n      inverted: ${o.busyInverted?'true':'false'}\n`;
    if(o.resetPinOn) out+=`    reset_pin: ${o.resetPin}\n`;
    if(o.resetDurOn) out+=`    reset_duration: ${o.resetDuration}\n`;
  } else {
    out+=`    # cs/dc/busy/reset pins: ${T('houd je eigen pin-config aan','keep your own pin config')}\n`;
  }
  out+=`    update_interval: never\n    lambda: |-\n`;
  const L='      ';
  // draw in LAYER order (array order = the layers panel, bottom→top) so the z-order
  // you see on the canvas and set in the layers list is exactly what ESPHome draws.
  if(p.waitEnabled===false){
    // waiting screen disabled — draw the main screen unconditionally
    (p.elements||[]).forEach(el=>{ const code=elementCode(el, L); if(code) out+=code+'\n'; });
  } else {
    out+=`${L}if (id(initial_data_received) == false) {\n`;
    const waitEls=p.waitElements||[];
    if(waitEls.length){
      waitEls.forEach(el=>{ const code=elementCode(el, L+'  '); if(code) out+=code+'\n'; });
    } else {
      out+=`${L}  it.printf(${Math.round(d.w/2)}, ${Math.round(d.h/2)}, id(${p.fonts[0].id}), color_text, TextAlign::CENTER, "${T('WACHTEN OP DATA...','WAITING FOR DATA...')}");\n`;
    }
    out+=`${L}} else {\n`;
    (p.elements||[]).forEach(el=>{ const code=elementCode(el, L+'  '); if(code) out+=code+'\n'; });
    out+=`${L}}\n`;
  }

  // round-trip comment (optional — toggled by the base64 checkbox)
  if(window.INCLUDE_SNAPSHOT!==false){
    const snap = btoa(unescape(encodeURIComponent(JSON.stringify({
      device:p.device, elements:p.elements, waitElements:p.waitElements||[]
    }))));
    out+=`\n# eink-editor:v${window.APP_VERSION||'1'}:${snap}\n`;
  }
  return out;
}
function glyphEsc(ch){ if(ch==='\\') return '\\\\'; if(ch==='"') return '\\"'; return ch; }
function glyphBlock(f, g){
  const chars=new Set(g?g.chars:[]); const icons=g?g.icons:new Map(); const dyn=g?g.dynamic:f.dynamic;
  if(dyn) for(const ch of (f.baseCharset||'')) chars.add(ch);
  // gfonts/web fonts are downloaded in full by ESPHome, so always give them the whole
  // printable-ASCII set (plus any special chars the design actually uses, e.g. °).
  // Typed text can then never render as tofu, even after editing — at a tiny flash cost.
  const isIconFont=/materialdesignicons/i.test(f.file||'');
  if((f.kind==='gfonts'||f.kind==='web') && !isIconFont && !fontIsDigitDisplay(f)){
    for(const ch of ASCII_GLYPHS) chars.add(ch);
  }
  if(!chars.size && !icons.size){
    if(f.seedGlyphs && f.seedGlyphs.length){ f.seedGlyphs.forEach(c=>chars.add(c)); }
    else return ''; // full font (no glyph restriction)
  }
  const plain=Array.from(chars).filter(c=>c && c.codePointAt(0)<0xF0000).sort();
  // icon font (has MDI glyphs): one per line with a "# mdi:<name>" comment
  if(icons.size){
    let out='    glyphs:\n';
    icons.forEach((name,hex)=>{ out+=`      - "\\U${hex}"${name?` # mdi:${name}`:''}\n`; });
    plain.forEach(ch=>{ out+=`      - ${glyphQ1(ch)}\n`; });   // any stray plain chars
    return out;
  }
  // regular font: compact single-line array, e.g. glyphs: ['A', 'Q', 'U']
  // never emit an empty "glyphs: []" — ESPHome then can't determine the font height
  if(!plain.length) return '';
  return `    glyphs: [${plain.map(glyphQ1).join(', ')}]\n`;
}
/* single-quoted YAML scalar (a literal ' is doubled; backslash stays literal) */
function glyphQ1(ch){ return "'"+String(ch).replace(/'/g,"''")+"'"; }
function usedSources(){
  const ids=new Set();
  els().forEach(el=>{
    if(el.source&&el.source.kind==='sensor'&&el.source.sourceId) ids.add(el.source.sourceId);
    if(el.condition&&el.condition.enabled&&el.condition.sourceId) ids.add(el.condition.sourceId);
    if(el.type==='graph'&&el.graph) (el.graph.traces||[]).forEach(t=>{ if(t.sourceId) ids.add(t.sourceId); });
  });
  return profile().sources.filter(s=>ids.has(s.id));
}
function haSensor(s){
  return `  - platform: homeassistant\n    entity_id: ${s.entityId}\n    id: ${s.id}\n    on_value:\n      then:\n        - lambda: 'id(data_updated) = true;'\n`;
}

function renderCode(){
  const code = genYAML().replace(/\s+$/,'\n');   // trim trailing blank space
  const h = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // one <span class="cl"> per line so a CSS ::before counter can show line numbers
  // that are NOT part of the text (never selected/copied). The long base64 recovery
  // line is wrapped so it folds within the visible width.
  const b64re = /(# eink-editor:v[\w.]+:[A-Za-z0-9+/=]+)/;
  const html = code.replace(/\n$/,'').split('\n').map(line=>{
    let inner = h(line);
    const isB64 = b64re.test(line);
    if(isB64) inner = inner.replace(b64re, m=>'<span class="b64wrap">'+m+'</span>');
    // mark the recovery line so it's visually dimmed (a "stop here" cue when you
    // drag-select the YAML, since you usually don't want the base64 too)
    return '<span class="cl'+(isB64?' cl-b64':'')+'">'+inner+'</span>';
  }).join('\n');   // real newlines between lines so blank lines survive copy/paste
  const pre=$('#code-out'); pre.innerHTML = html;
  _fitB64();
}
/* constrain the base64 span to the visible code width so it wraps there (not at
   the much wider scroll width of long YAML lines) */
function _fitB64(){
  const pre=$('#code-out'); if(!pre) return; const span=pre.querySelector('.b64wrap');
  if(span) span.style.maxWidth = Math.max(120, pre.clientWidth - 28) + 'px';
}

/* ============================================================
   ICON PICKER (MDI meta from CDN)
   ============================================================ */
let MDI_META=null;
async function loadMdiMeta(){
  if(MDI_META) return MDI_META;
  try{
    const r=await fetch('vendor/mdi-meta.json');
    MDI_META=await r.json();
  }catch(e){ MDI_META=[]; toast(T('Kon MDI-lijst niet laden','Could not load MDI list')); }
  return MDI_META;
}
async function openIconPicker(cb, defaultQuery){
  openModal(T('MDI-icoon kiezen','Choose MDI icon'), `<input class="icon-search" id="icon-q" type="text" placeholder="${T('Zoek… (bv. thermometer, pump, weather)','Search… (e.g. thermometer, pump, weather)')}"><div class="icon-grid" id="icon-grid"><div class="hint">${T('Laden…','Loading…')}</div></div>`, []);
  const meta=await loadMdiMeta();
  const grid=$('#icon-grid'), q=$('#icon-q');
  function render(filter){
    const f=(filter||'').toLowerCase();
    const list=meta.filter(m=>!f || m.name.includes(f) || (m.aliases||[]).some(a=>a.includes(f)) || (m.tags||[]).some(t=>t.toLowerCase().includes(f))).slice(0,300);
    grid.innerHTML = list.map(m=>`<div class="icon-cell" data-name="${m.name}" data-hex="${m.codepoint.toUpperCase()}"><span class="mdi mdi-${m.name}"></span><small>${m.name}</small></div>`).join('') || `<div class="hint">${T('Niets gevonden.','Nothing found.')}</div>`;
    grid.querySelectorAll('.icon-cell').forEach(c=>c.onclick=()=>{ cb({name:c.dataset.name, hex:c.dataset.hex}); closeModal(); });
  }
  const dq=defaultQuery||'thermometer'; render(dq); q.value=defaultQuery||''; q.oninput=()=>render(q.value); q.focus();
}

/* ============================================================
   MODALS
   ============================================================ */
let _modalClose=null;   // optional callback when the modal is dismissed (✕ / backdrop / any close)
function openModal(title, body, footerBtns, onClose){
  $('#modal-title').textContent=title; $('#modal-body').innerHTML=body;
  const f=$('#modal-footer'); f.innerHTML='';
  (footerBtns||[]).forEach(b=>{ const el=document.createElement('button'); el.className='btn '+(b.cls||'ghost'); el.textContent=b.label; el.onclick=b.onClick; f.appendChild(el); });
  _modalClose = onClose||null;
  addSteppers($('#modal-body'));   // ▲/▼ steppers for any .spin field in modals (font size/weight)
  $('#modal-back').classList.add('open');
}
function closeModal(){ const f=_modalClose; _modalClose=null; if(f){ try{ f(); }catch(e){} } $('#modal-back').classList.remove('open'); }
$('#modal-x').onclick=closeModal;
let _modalDownOnBack=false;
$('#modal-back').addEventListener('mousedown', e=>{ _modalDownOnBack = (e.target===$('#modal-back')); });
$('#modal-back').addEventListener('mouseup', e=>{
  if(_modalDownOnBack && e.target===$('#modal-back')) closeModal();
  _modalDownOnBack=false;
});

/* ---- Sources modal ---- */
function openSources(){
  const liveOn = HA_LIVE && HA_STATES;
  const rows=profile().sources.map((s,i)=>{
    const st = HA_STATES && HA_STATES[s.entityId];
    const liveCell = st
      ? `<span class="tag" style="color:var(--ok)">${attr(st.state)}${st.unit?(' '+attr(st.unit)):''}</span>`
      : (liveOn ? `<span class="tag" style="color:var(--red)">—</span>` : '');
    return `<tr>
    <td><input data-i="${i}" data-f="id" class="mono" value="${attr(s.id)}"></td>
    <td><input data-i="${i}" data-f="entityId" class="mono" value="${attr(s.entityId)}"></td>
    <td><select data-i="${i}" data-f="kind">
      ${['number','string','time','bool'].map(k=>`<option ${s.kind===k?'selected':''}>${k}</option>`).join('')}
    </select></td>
    <td><input data-i="${i}" data-f="sample" value="${attr(s.sample)}"></td>
    <td>${liveCell}</td>
    <td><button class="btn ghost sm danger" data-del="${i}">✕</button></td></tr>`;}).join('');

  const help = `<div class="src-box" style="margin-bottom:12px">
    <b>${T('Live data uit Home Assistant','Live data from Home Assistant')}</b>
    <div class="hint" style="margin-top:6px;line-height:1.5">
      ${T('Een <b>waardebron</b> koppelt een ESPHome-naam (<span class="mono">id</span>) aan een Home Assistant <span class="mono">entity_id</span>. Je gebruikt het <span class="mono">id</span> in tekst-elementen; bij export verwijst de YAML naar de bijbehorende sensor.',
          'A <b>value source</b> links an ESPHome name (<span class="mono">id</span>) to a Home Assistant <span class="mono">entity_id</span>. You use the <span class="mono">id</span> in text elements; on export the YAML references the matching sensor.')}<br><br>
      ${liveOn
        ? T('✅ Live data is actief — kies hieronder <b>“Uit Home Assistant”</b> om een echte entiteit te zoeken en toe te voegen. De huidige waarde verschijnt in de kolom “live”.',
            '✅ Live data is active — use <b>“From Home Assistant”</b> below to search and add a real entity. The current value shows in the “live” column.')
        : T('⚠ Live data staat uit. Klik eerst op <b>○ Live</b> in de bovenbalk om je echte entiteiten op te halen; daarna kun je ze hier zoeken en toevoegen.',
            '⚠ Live data is off. Click <b>○ Live</b> in the top bar first to fetch your real entities; then you can search and add them here.')}
    </div></div>`;

  openModal(T('Bronnen (sensor-mapping)','Sources (sensor mapping)'),
    `${help}
     <table class="tbl"><thead><tr><th>id (lambda)</th><th>entity_id (HA)</th><th>${T('type','type')}</th><th>${T('voorbeeld','sample')}</th><th>live</th><th></th></tr></thead><tbody id="src-body">${rows}</tbody></table>
     <div class="row tight" style="margin-top:10px">
       <button class="btn sm" id="src-ha">⌂ ${T('Uit Home Assistant…','From Home Assistant…')}</button>
       <button class="btn ghost sm" id="src-add">+ ${T('Handmatig toevoegen','Add manually')}</button>
     </div>`,
    [{label:T('Klaar','Done'),cls:'primary',onClick:()=>{ persist(); closeModal(); renderInspector(); }}]);
  const body=$('#src-body');
  body.querySelectorAll('input,select').forEach(inp=>inp.addEventListener('change',()=>{ const i=+inp.dataset.i; profile().sources[i][inp.dataset.f]=inp.value; persist(); }));
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ profile().sources.splice(+b.dataset.del,1); persist(); openSources(); });
  $('#src-add').onclick=()=>{ profile().sources.push({id:uid('s'),entityId:'sensor.new',kind:'number',sample:0}); persist(); openSources(); };
  $('#src-ha').onclick=openEntityPicker;
}

/* Searchable Home Assistant entity picker — adds a value source from live data */
async function openEntityPicker(){
  if(!HA_STATES){
    try{ HA_STATES=await fetchHaStates(); HA_LIVE=true; updateLiveBadge(); }
    catch(e){ toast(T('Live data niet beschikbaar — staat de add-on in Home Assistant?','Live data unavailable — is the add-on running in Home Assistant?'),true); return; }
  }
  const entries=Object.keys(HA_STATES).sort().map(eid=>({eid, ...HA_STATES[eid]}));
  const existing=new Set(profile().sources.map(s=>s.entityId));

  openModal(T('Entiteit kiezen uit Home Assistant','Pick an entity from Home Assistant'),
    `<input id="ent-search" class="icon-search" type="search" placeholder="${T('Zoek op naam of entity_id…','Search by name or entity_id…')}" autocomplete="off">
     <div class="hint">${entries.length} ${T('entiteiten','entities')} · ${T('klik om toe te voegen','click to add')}</div>
     <div id="ent-list" style="max-height:48vh;overflow:auto;margin-top:8px"></div>`,
    [{label:T('Terug','Back'),cls:'ghost',onClick:openSources}]);

  const list=$('#ent-list'), search=$('#ent-search');
  function render(q){
    q=(q||'').toLowerCase().trim();
    const hit=entries.filter(e=> !q || e.eid.toLowerCase().includes(q) || (e.name||'').toLowerCase().includes(q)).slice(0,300);
    list.innerHTML = hit.length ? hit.map(e=>`
      <div class="row" data-eid="${attr(e.eid)}" style="align-items:center;cursor:pointer;padding:6px 8px;border-bottom:1px solid var(--line)">
        <div style="flex:1;min-width:0">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.name?attr(e.name):'<span class="mono">'+attr(e.eid)+'</span>'}</div>
          <div class="mono hint" style="margin:0">${attr(e.eid)}</div>
        </div>
        <div class="tag" style="flex:none">${attr(e.state)}${e.unit?(' '+attr(e.unit)):''}</div>
        ${existing.has(e.eid)?'<span class="tag" style="color:var(--ok);flex:none">✓</span>':''}
      </div>`).join('')
      : `<div class="hint" style="padding:20px;text-align:center">${T('Geen resultaten','No results')}</div>`;
    list.querySelectorAll('[data-eid]').forEach(row=>row.onclick=()=>addSourceFromEntity(row.dataset.eid));
  }
  search.oninput=()=>render(search.value);
  render(''); search.focus();
}

function addSourceFromEntity(eid){
  const st=HA_STATES[eid]||{};
  // guess kind from domain / value
  let kind='string';
  if(/^input_datetime\./.test(eid)) kind='time';
  else if(/^(input_boolean|switch|binary_sensor|light|fan|lock)\./.test(eid)) kind='bool';
  else if(!isNaN(parseFloat(st.state))) kind='number';
  // generate a clean lambda id from the object_id
  let base=(eid.split('.')[1]||eid).replace(/[^A-Za-z0-9_]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase();
  if(!/^[a-z_]/.test(base)) base='s_'+base;
  let id=base, n=2; const taken=new Set(profile().sources.map(s=>s.id));
  while(taken.has(id)){ id=base+'_'+(n++); }
  profile().sources.push({id, entityId:eid, kind, sample:(st.state!=null?st.state:'')});
  applyLiveToSources(); persist();
  toast(T('Bron toegevoegd: ','Source added: ')+id);
  openSources();
}

/* ---- Fonts & colors modal ---- */
var SERVER_FONTS=new Set();   // filenames currently present in the storage fonts/ folder
async function refreshServerFonts(){
  if(!SERVER_STORAGE) return;
  try{ const r=await fetch('api/fonts'); if(r.ok){ const j=await r.json(); SERVER_FONTS=new Set(j.fonts||[]); } }catch(e){}
}
var _fontsSnapshot=null;   // fonts state when the editor opened (for Cancel / ✕ revert)
function _revertFontsIfUnsaved(){
  if(_fontsSnapshot){ profile().fonts=_fontsSnapshot; _fontsSnapshot=null; persist(); afterChange(); renderInspector(); }
}
async function openFonts(){
  await refreshServerFonts();
  if(_fontsSnapshot===null) _fontsSnapshot=JSON.parse(JSON.stringify(profile().fonts));   // snapshot once per session
  const used=usedFontIds();
  const onServer=f=>{ const n=_fontFileName(f); return !!(n && SERVER_FONTS.has(n)); };
  const previewable=f=>(f.kind==='gfonts'||/materialdesignicons/i.test(f.file||'')||fontHasBytes(f)||onServer(f));
  const statusTag=f=>/materialdesignicons/i.test(f.file||'') ? '<span class="tag">MDI</span>'
    : f.kind==='gfonts' ? `<span class="tag">${T('geladen','loaded')}</span>`
    : fontHasBytes(f) ? `<span class="tag" style="color:var(--ok)">${T('geüpload','uploaded')}</span>`
    : onServer(f) ? `<span class="tag" style="color:var(--ok)" title="${T('Bestand staat al in de fonts/-map','File is already in the fonts/ folder')}">${T('in fonts/','in fonts/')}</span>`
    : `<span class="tag" style="color:var(--red)">${T('upload nodig','upload needed')}</span>`;
  // group rows by source/status: uploaded-or-local, Google, Web, MDI (in that order)
  const fontCat=f=>/materialdesignicons/i.test(f.file||'')?3:(f.kind==='gfonts'?1:(f.kind==='web'?2:0));
  const catLabel=[T('Lokale / geüploade fonts','Local / uploaded fonts'),'Google Fonts',T('Web-fonts','Web Fonts'),T('Icoon-fonts (MDI)','Icon fonts (MDI)')];
  const oneRow=(f,i)=>`<tr>
    <td class="mono">${previewable(f)?`<a href="#" class="font-prev" data-prev="${i}" title="${T('Klik voor voorbeeld','Click to preview')}">${f.id}</a>`:f.id}</td>
    <td class="mono" style="font-size:10px;word-break:break-all">${f.kind==='gfonts'?`gfonts: ${attr(f.family)} ${f.weight}`:(f.kind==='web'?`web: ${attr(f.url||'')}`:attr(f.file||''))}</td>
    <td>${f.size}px</td>
    <td>${statusTag(f)}</td>
    <td style="white-space:nowrap">${used.has(f.id)
      ? `<span class="tag" style="color:var(--ok)">${T('in gebruik','in use')}</span>`
      : `<span class="tag" style="color:var(--txt-faint)" title="${T('Geen element gebruikt dit font; het komt niet in de YAML.','No element uses this font; it is left out of the YAML.')}">${T('ongebruikt','unused')}</span>`}</td>
    <td>${f.kind==='local'&&!/materialdesignicons/i.test(f.file||'')?`<input type="file" accept=".ttf,.otf,.woff,.pcf,.bdf" data-font="${i}" style="font-size:10px">`:''}</td>
    <td style="white-space:nowrap"><button class="btn ghost sm" data-editfont="${i}" title="${/materialdesignicons/i.test(f.file||'')?T('Bewerken (id, grootte)','Edit (id, size)'):T('Font bewerken (id, grootte, gewicht…)','Edit font (id, size, weight…)')}">✎</button>
        <button class="btn ghost sm danger" data-delfont="${i}" title="${T('Font verwijderen','Delete font')}">✕</button></td>
  </tr>`;
  const ordered=profile().fonts.map((f,i)=>({f,i})).sort((a,b)=>fontCat(a.f)-fontCat(b.f) || a.i-b.i);
  let frows='', lastCat=-1;
  ordered.forEach(({f,i})=>{ const c=fontCat(f);
    if(c!==lastCat){ lastCat=c; frows+=`<tr class="font-group"><td colspan="7" style="padding-top:10px;font-weight:600;color:var(--accent);font-size:11px">${catLabel[c]}</td></tr>`; }
    frows+=oneRow(f,i);
  });
  const unused=profile().fonts.filter(f=>!used.has(f.id));
  openModal('Font Editor',
    `<h4 style="margin:0 0 8px;color:var(--accent)">Fonts</h4>
     <table class="tbl"><thead><tr><th>id</th><th>${T('bron','source')}</th><th>${T('grootte','size')}</th><th>status</th><th>${T('gebruik','usage')}</th><th>upload</th><th></th></tr></thead><tbody>${frows}</tbody></table>
     ${unused.length?`<div class="hint" style="margin:6px 0 0;color:var(--txt-dim)">⚠ ${T('Ongebruikte fonts (niet in de YAML):','Unused fonts (left out of the YAML):')} <span class="mono">${unused.map(f=>attr(f.id)).join(', ')}</span> — ${T('je kunt ze hier verwijderen.','you can delete them here.')}</div>`:''}
     <div class="hint" style="margin:6px 0 0">${T('Tip: klik op een geladen font-id voor een voorbeeld.','Tip: click a loaded font id for a preview.')}</div>
     <div id="nf-preview" style="display:none;margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--bg-2)"></div>
     <div class="src-box" style="margin-top:10px">
       <label class="fld">${T('Font toevoegen','Add font')}</label>
       <div class="row tight">
         <div style="flex:2"><label class="fld">id</label><input id="nf-id" type="text" class="mono" placeholder="${T('bv. font_groot','e.g. font_large')}" title="${T('De id waarmee je dit font in elementen kiest en die in de YAML verschijnt. Letters, cijfers en _.','The id you select this font by in elements and that appears in the YAML. Letters, digits and _.')}"></div>
         <div><label class="fld">${T('grootte (size)','size')}</label><input id="nf-size" class="spin" type="number" placeholder="size" value="30" style="width:90px" title="${T('Tekenhoogte in pixels (font size).','Glyph height in pixels (font size).')}"></div>
         <div><label class="fld">Font Source</label><select id="nf-kind" title="${T('Waar het font vandaan komt.','Where the font comes from.')}"><option value="local">${T('Lokale fonts','Local Fonts')}</option><option value="mdi">MDI Fonts</option><option value="gfonts">Google Fonts</option><option value="web">${T('Web-fonts','Web Fonts')}</option></select></div>
       </div>
       <div class="row tight" id="nf-mdi" style="display:none">
         <div style="flex:2"><label class="fld">${T('pad (vast)','path (fixed)')}</label><input id="nf-mdi-file" type="text" class="mono" value="fonts/materialdesignicons-webfont.ttf" disabled style="opacity:.55" title="${T('De meegebundelde Material Design Icons-font; dit pad ligt vast.','The bundled Material Design Icons font; this path is fixed.')}"></div>
       </div>
       <div class="hint" id="nf-mdi-note" style="display:none;margin-top:4px">${T('Kies een eigen id en grootte; de glyphs worden bepaald door de gekozen icons.','Pick your own id and size; the glyphs come from the icons you use.')}</div>
       <div class="row tight" id="nf-gfonts">
         <div style="flex:2"><label class="fld">family</label><input id="nf-family" type="text" placeholder="${T('bv.','e.g.')} Roboto" title="${T('Exacte Google-Fonts-naam, bv. “Roboto”, “Noto Sans Display”.','Exact Google Fonts family name, e.g. “Roboto”, “Noto Sans Display”.')}"></div>
         <div><label class="fld">weight</label><input id="nf-weight" class="spin" type="number" placeholder="weight" value="400" style="width:90px" title="${T('Letterdikte: 100=thin, 400=normaal, 700=bold, 900=black. Moet bestaan voor deze family.','Font weight: 100=thin, 400=regular, 700=bold, 900=black. Must exist for this family.')}"></div>
       </div>
       <div class="hint" id="nf-gfonts-link" style="margin-top:4px">↗ <a href="https://fonts.google.com/" target="_blank" rel="noopener">${T('Bekijk en kies een Google Font','Browse and pick a Google Font')}</a> ${T('(opent in nieuw tabblad)','(opens in a new tab)')}</div>
       <div class="row tight" id="nf-local" style="display:none">
         <div style="flex:2"><label class="fld">${T('pad','path')}</label><input id="nf-file" type="text" placeholder="${T('bv. fonts/mijn.ttf','e.g. fonts/my.ttf')}" title="${T('Pad zoals het in je ESPHome-config staat, relatief aan de config-map. Moet exact kloppen.','Path as referenced in your ESPHome config, relative to the config folder. Must match exactly.')}"></div>
         <div><label class="fld">upload</label><input id="nf-upload" type="file" accept=".ttf,.otf,.woff,.pcf,.bdf" style="font-size:10px" title="${T('Upload het fontbestand zodat de preview klopt en het in fonts/ komt.','Upload the font file so the preview is accurate and it lands in fonts/.')}"></div>
       </div>
       <div class="hint" id="nf-local-note" style="display:none;margin-top:4px">${T('Toegestane formaten','Allowed formats')}: <span class="mono">.ttf .otf .woff .pcf .bdf</span></div>
       <div class="row tight" id="nf-web" style="display:none">
         <div style="flex:2"><label class="fld">URL</label><input id="nf-url" type="text" class="mono" placeholder="https://…/Font.ttf" title="${T('Directe download-URL naar een .ttf/.otf/.woff. ESPHome haalt het font op tijdens de build (type: web).','Direct download URL to a .ttf/.otf/.woff. ESPHome fetches the font at build time (type: web).')}"></div>
       </div>
       <div class="hint" id="nf-web-link" style="display:none;margin-top:4px">↗ <a href="https://fontsource.org/" target="_blank" rel="noopener">${T('Zoek een download-URL op Fontsource','Find a download URL on Fontsource')}</a> ${T('(of plak een directe link naar een .ttf/.otf)','(or paste a direct link to a .ttf/.otf)')}</div>
       <button class="btn sm" id="nf-add" style="margin-top:8px">+ ${T('Font toevoegen','Add font')}</button>
       <div class="hint" style="margin-top:6px">${T('Het','The')} <span class="mono">id</span> ${T('gebruik je in elementen; het','is used in elements; the')} <span class="mono">${T('pad','path')}</span> ${T('moet kloppen met je ESPHome','must match your ESPHome')} <span class="mono">fonts/</span>${T('-map.',' folder.')}</div>
     </div>
     <div class="hint" style="margin:10px 0 8px">${T('De Material Design Icons-font is meegebundeld','Material Design Icons font is bundled')} (v${MDI_VERSION}). ${T('Kleuren komen automatisch uit het displaytype (model).','Colours come automatically from the display type (model).')} ${T('Wijzigingen gelden pas na Opslaan.','Changes apply only after Save.')}</div>`,
    [{label:T('Annuleren','Cancel'),cls:'ghost',onClick:()=>{ _revertFontsIfUnsaved(); closeModal(); }},
     {label:T('Opslaan','Save'),cls:'primary',onClick:()=>{ _fontsSnapshot=null; persist(); afterChange(); closeModal(); toast(T('Fonts opgeslagen','Fonts saved')); }}],
    _revertFontsIfUnsaved);   // ✕ / backdrop also revert unsaved font changes
  // click a loaded font id → inline preview
  $$('#modal-body [data-prev]').forEach(a=>a.onclick=ev=>{ ev.preventDefault(); previewFontInline(profile().fonts[+a.dataset.prev]); });
  // existing uploads
  $$('#modal-body input[type=file][data-font]').forEach(inp=>inp.addEventListener('change',e=>{
    const f=profile().fonts[+inp.dataset.font], file=e.target.files[0]; if(!file) return;
    const rd=new FileReader(); rd.onload=async()=>{ f.dataUrl=rd.result; propagateFontFile(f); await registerUploadedFonts(); await maybeUploadFont(f, file.name); persist(); afterChange(); openFonts(); toast(T('Font geladen','Font loaded')); }; rd.readAsDataURL(file);
  }));
  $$('#modal-body [data-delfont]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.delfont, f=profile().fonts[i];
    const inUse=els().some(e=>e.fontId===f.id);
    if(inUse && !confirm(T(`Font "${f.id}" wordt gebruikt door elementen. Toch verwijderen?`,`Font "${f.id}" is used by elements. Delete anyway?`))) return;
    profile().fonts.splice(i,1); persist(); afterChange(); openFonts(); toast(T('Font verwijderd','Font deleted'));
  });
  $$('#modal-body [data-editfont]').forEach(b=>b.onclick=()=>editFont(+b.dataset.editfont));
  // new-font form: toggle gfonts/local/web fields + the matching browse link
  const kindSel=$('#nf-kind');
  const syncKind=()=>{ const k=kindSel.value;
    $('#nf-gfonts').style.display     = k==='gfonts'?'':'none';
    $('#nf-gfonts-link').style.display= k==='gfonts'?'':'none';
    $('#nf-local').style.display      = k==='local'?'':'none';
    $('#nf-local-note').style.display = k==='local'?'':'none';
    $('#nf-web').style.display        = k==='web'?'':'none';
    $('#nf-web-link').style.display   = k==='web'?'':'none';
    $('#nf-mdi').style.display        = k==='mdi'?'':'none';
    $('#nf-mdi-note').style.display   = k==='mdi'?'':'none';
  };
  kindSel.onchange=syncKind; syncKind();
  let pendingUpload=null;
  $('#nf-upload').onchange=e=>{ const file=e.target.files[0]; if(!file)return; const rd=new FileReader(); rd.onload=()=>{ pendingUpload=rd.result; if(!$('#nf-file').value) $('#nf-file').value='fonts/'+file.name; }; rd.readAsDataURL(file); };
  $('#nf-add').onclick=async()=>{
    const id=($('#nf-id').value||'').trim();
    if(!/^[a-z_][a-z0-9_]*$/i.test(id)){ toast(T('Geef een geldig id (letters/cijfers/_)','Enter a valid id (letters/digits/_)')); return; }
    if(fontById(id)){ toast(T('Dit id bestaat al','This id already exists')); return; }
    const size=+$('#nf-size').value||30, kind=kindSel.value;
    const f={ id, size, kind:(kind==='mdi'?'local':kind), dynamic:false, baseCharset:' -.:%/°0123456789', dataUrl:null, seedGlyphs:[] };
    if(kind==='gfonts'){ f.family=($('#nf-family').value||'Roboto').trim(); f.weight=+$('#nf-weight').value||400; f.file=null; }
    else if(kind==='web'){ const url=($('#nf-url').value||'').trim();
      if(!/^https?:\/\//i.test(url)){ toast(T('Geef een geldige http(s)-URL','Enter a valid http(s) URL')); return; }
      f.family=null; f.weight=null; f.url=url; f.file=null; }
    else if(kind==='mdi'){ f.family=null; f.weight=null; f.file='fonts/materialdesignicons-webfont.ttf'; f.baseCharset=''; }
    else { f.family=null; f.weight=null; f.file=($('#nf-file').value||'fonts/font.ttf').trim(); f.dataUrl=pendingUpload; reuseFontFile(f); }
    profile().fonts.push(f);
    injectGoogleFonts(); await registerUploadedFonts();
    if(f.dataUrl) await maybeUploadFont(f, (f.file||'').split('/').pop()||f.id+'.ttf');
    persist(); afterChange(); openFonts(); toast(T('Font toegevoegd','Font added'));
  };
}

/* rename a font id everywhere it is referenced (elements, graph axes, clock icon) */
function renameFontId(oldId, newId){
  if(oldId===newId) return;
  [].concat(profile().elements||[], profile().waitElements||[]).forEach(e=>{
    if(e.fontId===oldId) e.fontId=newId;
    if(e.clock && e.clock.iconFontId===oldId) e.clock.iconFontId=newId;
    if(e.graph && e.graph.axes && e.graph.axes.fontId===oldId) e.graph.axes.fontId=newId;
    if(e.graph && e.graph.legend){ if(e.graph.legend.nameFontId===oldId) e.graph.legend.nameFontId=newId;
      if(e.graph.legend.valueFontId===oldId) e.graph.legend.valueFontId=newId; }
  });
}

/* edit an existing font. For the bundled MDI font only the size is editable; for
   the rest: id (renamed across all references), size, weight, family, the source
   type (gfonts/local/web) and the file/URL. */
function editFont(i){
  const f=profile().fonts[i]; if(!f) return;
  const isMdi = /materialdesignicons/i.test(f.file||'');
  if(isMdi){
    openModal(T('Icoon-font','Icon font'),
      `<div class="row tight">
         <div style="flex:2"><label class="fld">id</label><input id="ef-id" class="mono" value="${attr(f.id)}" title="${T('Wordt overal bijgewerkt waar dit icoon-font gebruikt wordt.','Updated everywhere this icon font is used.')}"></div>
         <div><label class="fld">${T('grootte (px)','size (px)')}</label><input id="ef-size" class="spin" type="number" min="6" value="${f.size||30}" style="width:90px" title="${T('Tekenhoogte in pixels.','Glyph height in pixels.')}"></div>
       </div>
       <div class="hint" style="margin-top:6px">${T('Van de meegebundelde Material Design Icons-font kun je de id en de grootte aanpassen; de bron ligt vast.','For the bundled Material Design Icons font you can change the id and the size; the source is fixed.')}</div>`,
      [{label:T('Annuleren','Cancel'),cls:'ghost',onClick:openFonts},
       {label:T('Opslaan','Save'),cls:'primary',onClick:()=>{
         const newId=($('#ef-id').value||'').trim();
         if(!/^[a-z_][a-z0-9_]*$/i.test(newId)){ toast(T('Geef een geldig id (letters/cijfers/_)','Enter a valid id (letters/digits/_)')); return; }
         if(newId!==f.id && fontById(newId)){ toast(T('Dit id bestaat al','This id already exists')); return; }
         renameFontId(f.id, newId); f.id=newId;
         f.size=+$('#ef-size').value||f.size||30;
         persist(); afterChange(); openFonts(); toast(T('Font bijgewerkt','Font updated')); }}],
      _revertFontsIfUnsaved);
    return;
  }
  const kind0 = f.kind==='gfonts'?'gfonts':(f.kind==='web'?'web':'local');
  openModal(T('Font bewerken','Edit font'),
    `<div class="row tight">
       <div style="flex:2"><label class="fld">id</label><input id="ef-id" class="mono" value="${attr(f.id)}" title="${T('Wordt overal bijgewerkt waar dit font gebruikt wordt.','Updated everywhere this font is used.')}"></div>
       <div><label class="fld">${T('grootte','size')}</label><input id="ef-size" class="spin" type="number" min="6" value="${f.size||30}" style="width:90px" title="${T('Tekenhoogte in pixels.','Glyph height in pixels.')}"></div>
       <div><label class="fld">Font Source</label><select id="ef-kind" title="${T('Lokaal font-bestand, Google Fonts of een download-URL.','Local font file, Google Fonts or a download URL.')}">
         <option value="local" ${kind0==='local'?'selected':''}>${T('Lokale fonts','Local Fonts')}</option>
         <option value="gfonts" ${kind0==='gfonts'?'selected':''}>Google Fonts</option>
         <option value="web" ${kind0==='web'?'selected':''}>${T('Web-fonts','Web Fonts')}</option></select></div>
     </div>
     <div class="row tight" id="ef-gfonts" style="${kind0==='gfonts'?'':'display:none'}">
       <div style="flex:2"><label class="fld">family</label><input id="ef-family" value="${attr(f.family||'Roboto')}" title="${T('Exacte Google-Fonts-naam.','Exact Google Fonts family name.')}"></div>
       <div><label class="fld">weight</label><input id="ef-weight" class="spin" type="number" value="${f.weight||400}" style="width:90px" title="${T('100=thin, 400=normaal, 700=bold, 900=black.','100=thin, 400=regular, 700=bold, 900=black.')}"></div>
     </div>
     <div class="hint" id="ef-gfonts-link" style="${kind0==='gfonts'?'':'display:none'};margin-top:4px">↗ <a href="https://fonts.google.com/" target="_blank" rel="noopener">${T('Bekijk Google Fonts','Browse Google Fonts')}</a></div>
     <div class="row tight" id="ef-local" style="${kind0==='local'?'':'display:none'}">
       <div style="flex:2"><label class="fld">${T('pad','path')}</label><input id="ef-file" value="${attr(f.file||'fonts/font.ttf')}" title="${T('Pad zoals in je ESPHome-config.','Path as in your ESPHome config.')}"></div>
       <div><label class="fld">${T('vervang font','replace font')}</label><input id="ef-upload" type="file" accept=".ttf,.otf,.woff,.pcf,.bdf" style="font-size:10px"></div>
     </div>
     <div class="hint" id="ef-local-note" style="${kind0==='local'?'':'display:none'};margin-top:4px">${T('Toegestane formaten','Allowed formats')}: <span class="mono">.ttf .otf .woff .pcf .bdf</span></div>
     <div class="row tight" id="ef-web" style="${kind0==='web'?'':'display:none'}">
       <div style="flex:2"><label class="fld">URL</label><input id="ef-url" class="mono" value="${attr(f.url||'')}" placeholder="https://…/Font.ttf" title="${T('Directe download-URL (type: web).','Direct download URL (type: web).')}"></div>
     </div>
     <div class="hint" id="ef-web-link" style="${kind0==='web'?'':'display:none'};margin-top:4px">↗ <a href="https://fontsource.org/" target="_blank" rel="noopener">${T('Zoek een download-URL op Fontsource','Find a download URL on Fontsource')}</a></div>
     <div class="hint" style="margin-top:6px">${T('Tip: het wisselen van bron vervangt het font; elementen blijven gekoppeld via de id.','Tip: changing the source swaps the font; elements stay linked through the id.')}</div>`,
    [{label:T('Annuleren','Cancel'),cls:'ghost',onClick:openFonts},
     {label:T('Opslaan','Save'),cls:'primary',onClick:async()=>{
       const newId=($('#ef-id').value||'').trim();
       if(!/^[a-z_][a-z0-9_]*$/i.test(newId)){ toast(T('Geef een geldig id (letters/cijfers/_)','Enter a valid id (letters/digits/_)')); return; }
       if(newId!==f.id && fontById(newId)){ toast(T('Dit id bestaat al','This id already exists')); return; }
       const newKind=$('#ef-kind').value;
       if(newKind==='web' && !/^https?:\/\//i.test(($('#ef-url').value||'').trim())){ toast(T('Geef een geldige http(s)-URL','Enter a valid http(s) URL')); return; }
       renameFontId(f.id, newId); f.id=newId;
       f.size=+$('#ef-size').value||f.size||30;
       f.kind=newKind;
       if(newKind==='gfonts'){
         f.family=($('#ef-family').value||'Roboto').trim(); f.weight=+$('#ef-weight').value||400;
         f.file=null; f.url=null; f.dataUrl=null;
       } else if(newKind==='web'){
         f.family=null; f.weight=null; f.url=($('#ef-url').value||'').trim(); f.file=null; f.dataUrl=null;
       } else {
         f.family=null; f.weight=null; f.url=null;
         f.file=($('#ef-file').value||'fonts/font.ttf').trim();
         if(efUpload){ f.dataUrl=efUpload; } reuseFontFile(f);
       }
       injectGoogleFonts(); await registerUploadedFonts();
       if(f.dataUrl && newKind==='local') await maybeUploadFont(f, (f.file||'').split('/').pop()||f.id+'.ttf');
       persist(); afterChange(); openFonts(); toast(T('Font bijgewerkt','Font updated'));
     }}],
    _revertFontsIfUnsaved);
  const kindSel=$('#ef-kind');
  kindSel.onchange=()=>{ const k=kindSel.value;
    $('#ef-gfonts').style.display=k==='gfonts'?'':'none'; $('#ef-gfonts-link').style.display=k==='gfonts'?'':'none';
    $('#ef-local').style.display=k==='local'?'':'none'; $('#ef-local-note').style.display=k==='local'?'':'none';
    $('#ef-web').style.display=k==='web'?'':'none'; $('#ef-web-link').style.display=k==='web'?'':'none'; };
  let efUpload=null;
  const up=$('#ef-upload'); if(up) up.onchange=e=>{ const file=e.target.files[0]; if(!file) return; const rd=new FileReader(); rd.onload=()=>{ efUpload=rd.result; if($('#ef-file') && !$('#ef-file').value) $('#ef-file').value='fonts/'+file.name; }; rd.readAsDataURL(file); };
}

/* fonts that share the same TTF filename share one upload — different sizes of
   the same file should not be requested/uploaded twice (#19/#7) */
function _fontFileName(f){ return f.file ? f.file.split('/').pop() : null; }
function fontHasBytes(f){
  if(f.dataUrl) return true;
  const n=_fontFileName(f); if(!n) return false;
  return profile().fonts.some(o=>o.dataUrl && _fontFileName(o)===n);
}
/* pull a twin's bytes into f (when adding a new font with an existing filename) */
function reuseFontFile(f){
  if(f.dataUrl || !f.file) return;
  const n=_fontFileName(f);
  const twin=profile().fonts.find(o=>o!==f && _fontFileName(o)===n && o.dataUrl);
  if(twin) f.dataUrl=twin.dataUrl;
}
/* push f's freshly-uploaded bytes to every other font with the same filename */
function propagateFontFile(f){
  if(!f.dataUrl || !f.file) return;
  const n=_fontFileName(f);
  profile().fonts.forEach(o=>{ if(o!==f && _fontFileName(o)===n) o.dataUrl=f.dataUrl; });
}
/* push an uploaded font's bytes to the add-on /data/fonts (preview persistence) */
async function maybeUploadFont(f, filename){
  if(!SERVER_STORAGE || !f.dataUrl) return;
  const name=(filename||'').replace(/[^A-Za-z0-9._-]+/g,'_') || (f.id+'.ttf');
  try{
    await fetch('api/fonts/'+encodeURIComponent(name), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name, dataUrl:f.dataUrl}) });
  }catch(e){ console.warn('font upload failed', e); }
}
function rgbToHex(css){ if(/^#/.test(css)) return css; return '#1d1d1b'; }

/* ---- Profile settings ---- */
function openProfileSettings(){
  const p=profile(), d=p.device, o=outCfg(p);
  // one display-pin cell: a checkbox to include it + its value field (greyed when off)
  const pinRow=(onId,valId,label,on,val,extra='')=>`
    <div style="display:flex;flex-direction:column;gap:3px;min-width:0">
      <label class="toggle" style="font-size:12px"><input type="checkbox" id="ps-o-${onId}" data-pinon="${valId}" ${on?'checked':''}> <span class="mono">${label}</span></label>
      <input id="${valId}" data-default="${attr(val)}" value="${attr(val)}" ${on?'':'disabled'} style="width:100%">
      ${extra}
    </div>`;
  const colTypeName={mono:T('mono (zwart/wit)','mono (black/white)'),bwr:T('BWR (zwart/wit/rood)','BWR (black/white/red)'),'7c':T('7-kleuren','7-colour')};
  const modelOpts=EINK_MODELS.map(m=>`<option value="${attr(m.v)}" ${d.model===m.v?'selected':''}>${m.v} — ${m.d}</option>`).join('');
  openModal(T('Profiel-instellingen','Profile settings'),
    `${state.profiles.length>1?`<div class="row"><div><label class="fld">${T('Profiel (wisselen)','Profile (switch)')}</label><select id="ps-switch" style="width:100%">${sortedProfiles().map(x=>`<option value="${attr(x.id)}" ${x.id===p.id?'selected':''}>${attr(x.name)}</option>`).join('')}</select></div></div>`:''}
     <div class="row"><div><label class="fld">${T('Profielnaam','Profile name')}</label><input id="ps-name" value="${attr(p.name)}"></div></div>
     <div class="row"><div><label class="fld">Model</label><select id="ps-model" style="width:100%">${modelOpts}</select></div></div>
     <div class="hint" id="ps-model-info"></div>
     <div class="row"><div><label class="fld">${T('Rotatie','Rotation')}</label><select id="ps-rot">${[0,90,180,270].map(r=>`<option ${d.rotation===r?'selected':''}>${r}</option>`).join('')}</select></div>
       <div><label class="fld">${T('Breedte (px)','Width (px)')}</label><input id="ps-w" type="number" value="${d.w}"></div>
       <div><label class="fld">${T('Hoogte (px)','Height (px)')}</label><input id="ps-h" type="number" value="${d.h}"></div></div>
     <div class="row"><div><label class="fld">${T('Canvas-achtergrond (preview)','Canvas background (preview)')}</label>
       <div style="display:flex;gap:8px;align-items:center">
         <input id="ps-bg" type="color" value="${d.bg||'#d4d6d7'}" style="width:48px;padding:2px;height:30px">
         <button class="btn ghost sm" data-bg="#d4d6d7">${T('E-ink grijs','E-ink grey')}</button>
         <button class="btn ghost sm" data-bg="#f4f1e9">${T('Papier','Paper')}</button>
         <button class="btn ghost sm" data-bg="#ffffff">${T('Wit','White')}</button>
       </div></div></div>
     <div class="hint">${T('Breedte/hoogte = de logische ruimte ná rotatie. De achtergrond is alleen voor de preview. De kleuren in het palet passen zich aan op het displaytype.','Width/height = the logical space after rotation. The background is preview-only. The palette colours adapt to the display type.')}</div>
     <hr style="border-color:var(--line);margin:14px 0">
     <label class="toggle"><input type="checkbox" id="ps-wait" ${p.waitEnabled!==false?'checked':''}> ${T('Wachtscherm gebruiken','Use waiting screen')}</label>
     <div class="hint" style="margin:4px 0 0">${T('Genereert de “waiting for data”-tak (if initial_data_received == false). Het wachtscherm ontwerp je via de scherm-keuze boven het canvas.','Generates the “waiting for data” branch (if initial_data_received == false). Design the waiting screen via the screen selector above the canvas.')}</div>
     <hr style="border-color:var(--line);margin:14px 0">
     <button type="button" id="ps-yaml-toggle" style="background:none;border:none;cursor:pointer;font-weight:600;color:var(--accent);padding:0;font-size:13px">▸ ${T('Gegenereerde YAML-blokken','Generated YAML Blocks')}</button>
     <div id="ps-yaml-body" style="display:none;margin-top:8px">
         <label class="toggle"><input type="checkbox" id="ps-o-refresh" ${o.refresh?'checked':''}> ${T('Refresh-logica (esphome on_boot + script + time)','Refresh logic (esphome on_boot + script + time)')}</label>
         <div class="row tight" style="margin:4px 0 8px">
           <div><label class="fld">${T('Boot-prioriteit','Boot priority')}</label><input id="ps-o-prio" value="${attr(o.bootPriority)}" title="${T('ESPHome on_boot prioriteit. Hoger = vroeger. 600 draait ná WiFi/API (aanrader voor displays).','ESPHome on_boot priority. Higher = earlier. 600 runs after WiFi/API (recommended for displays).')}"></div>
           <div><label class="fld">${T('Boot-vertraging','Boot delay')}</label><input id="ps-o-delay" value="${attr(o.bootDelay)}" title="${T('Wachttijd na boot vóór de eerste refresh, bv. “2s”. Geeft sensoren tijd om binnen te komen.','Wait after boot before the first refresh, e.g. “2s”. Gives sensors time to arrive.')}"></div>
           <div><label class="fld">${T('Wacht-timeout','Wait timeout')}</label><input id="ps-o-timeout" value="${attr(o.waitTimeout)}" title="${T('Maximale wachttijd op data vóór het scherm tóch tekent, bv. “30s”.','Maximum time to wait for data before drawing anyway, e.g. “30s”.')}"></div>
           <div><label class="fld">${T('Interval (min)','Interval (min)')}</label><input id="ps-o-interval" type="number" min="1" value="${o.timeInterval}" style="width:70px" title="${T('Hoe vaak (in minuten) het display ververst via de time-trigger.','How often (in minutes) the display refreshes via the time trigger.')}"></div>
         </div>
         <div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin:6px 0">
           <label class="toggle"><input type="checkbox" id="ps-o-globals" ${o.globals?'checked':''}> globals</label>
           <label class="toggle"><input type="checkbox" id="ps-o-fonts" ${o.fonts?'checked':''}> font</label>
           <label class="toggle"><input type="checkbox" id="ps-o-colors" ${o.colors?'checked':''}> color</label>
           <label class="toggle"><input type="checkbox" id="ps-o-sensors" ${o.sensors?'checked':''}> sensor</label>
           <label class="toggle"><input type="checkbox" id="ps-o-textsensors" ${o.textSensors?'checked':''}> text_sensor</label>
         </div>
         <hr style="border-color:var(--line);margin:10px 0">
         <label class="toggle"><input type="checkbox" id="ps-o-spi" ${o.spi?'checked':''}> ${T('SPI-bus genereren','Generate SPI bus')}</label>
         <div class="row tight" style="margin:4px 0 8px">
           <div><label class="fld">clk_pin</label><input id="ps-o-spiclk" data-default="${attr(o.spiClk)}" value="${attr(o.spiClk)}" style="width:110px" ${o.spi?'':'disabled'}></div>
           <div><label class="fld">mosi_pin</label><input id="ps-o-spimosi" data-default="${attr(o.spiMosi)}" value="${attr(o.spiMosi)}" style="width:110px" ${o.spi?'':'disabled'}></div>
         </div>
         <label class="toggle"><input type="checkbox" id="ps-o-pins" ${o.displayPins?'checked':''}> ${T('Display-pins genereren','Generate display pins')}</label>
         <div id="ps-pins-box" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px 14px;margin:8px 0 0;${o.displayPins?'':'opacity:.45'}">
           ${pinRow('dataRateOn','ps-o-datarate','data_rate',o.dataRateOn,o.dataRate)}
           ${pinRow('csPinOn','ps-o-cs','cs_pin',o.csPinOn,o.csPin, `<label class="toggle" style="font-size:11px"><input type="checkbox" id="ps-o-csstrap" data-pinextra="ps-o-csPinOn" ${o.csIgnoreStrap?'checked':''}> ignore_strap</label>`)}
           ${pinRow('busyPinOn','ps-o-busy','busy_pin',o.busyPinOn,o.busyPin, `<label class="toggle" style="font-size:11px"><input type="checkbox" id="ps-o-busyinv" data-pinextra="ps-o-busyPinOn" ${o.busyInverted?'checked':''}> inverted</label>`)}
           ${pinRow('dcPinOn','ps-o-dc','dc_pin',o.dcPinOn,o.dcPin)}
           ${pinRow('resetPinOn','ps-o-reset','reset_pin',o.resetPinOn,o.resetPin)}
           ${pinRow('resetDurOn','ps-o-resetdur','reset_duration',o.resetDurOn,o.resetDuration)}
         </div>
       </div>
     <hr style="border-color:var(--line);margin:14px 0">
     <button class="btn ghost sm" id="ps-dup">${T('Profiel dupliceren','Duplicate profile')}</button>
     <button class="btn ghost sm danger" id="ps-delete" style="margin-left:8px">${T('Profiel verwijderen','Delete profile')}</button>`,
    [{label:T('Opslaan','Save'),cls:'primary',onClick:()=>{
      p.name=$('#ps-name').value;
      d.model=$('#ps-model').value; d.rotation=+$('#ps-rot').value; d.w=+$('#ps-w').value; d.h=+$('#ps-h').value;
      d.bg=$('#ps-bg').value;
      p.waitEnabled=$('#ps-wait').checked;
      if(!p.waitEnabled && editScreen==='wait'){ editScreen='main'; const ss=$('#screen-select'); if(ss) ss.value='main'; }
      { const ss=$('#screen-select'); const wopt=ss&&ss.querySelector('option[value="wait"]'); if(wopt) wopt.disabled=!p.waitEnabled; }
      p.output=Object.assign(outCfg(p), {
        refresh:$('#ps-o-refresh').checked,
        bootPriority:$('#ps-o-prio').value, bootDelay:$('#ps-o-delay').value, waitTimeout:$('#ps-o-timeout').value,
        timeInterval:+$('#ps-o-interval').value||15,
        globals:$('#ps-o-globals').checked,
        fonts:$('#ps-o-fonts').checked, colors:$('#ps-o-colors').checked,
        sensors:$('#ps-o-sensors').checked, textSensors:$('#ps-o-textsensors').checked,
        spi:$('#ps-o-spi').checked,
        // values are always kept in the field (greyed when off) so a deselected line is remembered
        spiClk:$('#ps-o-spiclk').value||o.spiClk, spiMosi:$('#ps-o-spimosi').value||o.spiMosi,
        displayPins:$('#ps-o-pins').checked,
        dataRateOn:$('#ps-o-dataRateOn').checked, dataRate:$('#ps-o-datarate').value||o.dataRate,
        csPinOn:$('#ps-o-csPinOn').checked, csPin:$('#ps-o-cs').value||o.csPin, csIgnoreStrap:$('#ps-o-csstrap').checked,
        dcPinOn:$('#ps-o-dcPinOn').checked, dcPin:$('#ps-o-dc').value||o.dcPin,
        busyPinOn:$('#ps-o-busyPinOn').checked, busyPin:$('#ps-o-busy').value||o.busyPin, busyInverted:$('#ps-o-busyinv').checked,
        resetPinOn:$('#ps-o-resetPinOn').checked, resetPin:$('#ps-o-reset').value||o.resetPin,
        resetDurOn:$('#ps-o-resetDurOn').checked, resetDuration:$('#ps-o-resetdur').value||o.resetDuration,
      });
      // adapt the colour palette to the model's colour capability (only when it changes)
      const newType=modelInfo(d.model).c;
      if(newType!==paletteType(p.colors)) p.colors=colorSetFor(newType);
      persist(); initStage(); renderProfiles(); afterChange();
      // keep the dialog open — just refresh the name field and the switch dropdown
      { const nm=$('#ps-name'); if(nm) nm.value=p.name;
        const sw=$('#ps-switch'); if(sw) sw.innerHTML=sortedProfiles().map(x=>`<option value="${attr(x.id)}" ${x.id===p.id?'selected':''}>${attr(x.name)}</option>`).join(''); }
      toast(T('Profiel opgeslagen','Profile saved'));
    }}]);
  const infoEl=$('#ps-model-info');
  const applyRes=()=>{ const res=modelRes($('#ps-model').value); if(!res) return;
    const rot=+$('#ps-rot').value, portrait=(rot===90||rot===270);
    $('#ps-w').value = portrait?res[1]:res[0]; $('#ps-h').value = portrait?res[0]:res[1]; };
  const showInfo=()=>{ const mi=modelInfo($('#ps-model').value), res=modelRes($('#ps-model').value);
    infoEl.innerHTML=`${mi.d} · ${T('kleuren','colours')}: <b>${colTypeName[mi.c]||mi.c}</b>`+(res?` · ${res.join('×')} px`:''); };
  { const sw=$('#ps-switch'); if(sw) sw.onchange=e=>{ // switch to another profile without leaving the dialog
      state.current=e.target.value; persist(); renderProfiles(); initStage();
      selectedId=null; selectedIds=new Set(); renderCanvas(); renderLayers(); renderInspector();
      openProfileSettings(); }; }
  $('#ps-model').onchange=()=>{ showInfo(); applyRes(); };   // pick a model → fill native w/h
  { const rs=$('#ps-rot'); if(rs) rs.onchange=applyRes; }
  showInfo();
  { const tg=$('#ps-yaml-toggle'), body=$('#ps-yaml-body'); if(tg&&body) tg.onclick=()=>{
      const open=body.style.display!=='none'; body.style.display=open?'none':'';
      tg.textContent=(open?'▸ ':'▾ ')+T('Gegenereerde YAML-blokken','Generated YAML Blocks'); }; }
  // enable/disable a field — the value stays visible (greyed) so a deselected
  // setting is remembered rather than wiped.
  const setField=(inp, on)=>{ if(!inp) return; inp.disabled=!on; if(on && !inp.value) inp.value=inp.dataset.default||''; };
  // SPI: clk/mosi greyed (not blanked) when "Generate SPI bus" is off
  { const spi=$('#ps-o-spi'); const sync=()=>{ setField($('#ps-o-spiclk'),spi.checked); setField($('#ps-o-spimosi'),spi.checked); }; if(spi){ spi.onchange=sync; } }
  // display pins: each line has its own checkbox; the master greys the whole block.
  // ignore_strap / inverted (data-pinextra) grey out with their pin row + the master
  // but keep their checked state — never auto-deselected.
  const pinsMaster=$('#ps-o-pins'), pinsBox=$('#ps-pins-box');
  const syncExtras=()=>{ const m=!pinsMaster||pinsMaster.checked;
    $$('#ps-pins-box [data-pinextra]').forEach(x=>{ const row=$('#'+x.dataset.pinextra); x.disabled=!(m && row && row.checked); }); };
  const syncPins=()=>{ const m=pinsMaster.checked; pinsBox.style.opacity=m?'1':'.45';
    $$('#ps-pins-box [data-pinon]').forEach(cb=>{ cb.disabled=!m; setField($('#'+cb.dataset.pinon), m&&cb.checked); }); syncExtras(); };
  $$('#ps-pins-box [data-pinon]').forEach(cb=>cb.onchange=()=>{ setField($('#'+cb.dataset.pinon), (!pinsMaster||pinsMaster.checked)&&cb.checked); syncExtras(); });
  if(pinsMaster){ pinsMaster.onchange=syncPins; syncPins(); }
  $$('#modal-body [data-bg]').forEach(b=>b.onclick=()=>{ $('#ps-bg').value=b.dataset.bg; });
  $('#ps-delete').onclick=()=>{ if(state.profiles.length<2){toast(T('Minstens één profiel nodig','At least one profile required'));return;}
    if(confirm(T('Profiel verwijderen?','Delete profile?'))){
      state.profiles=state.profiles.filter(x=>x.id!==p.id); state.current=state.profiles[0].id; persist();
      renderProfiles(); initStage(); selectedId=null; selectedIds=new Set(); renderCanvas(); renderLayers(); renderInspector();
      openProfileSettings();   // stay in settings, now showing the first profile
      toast(T('Profiel verwijderd','Profile deleted'));
    } };
  $('#ps-dup').onclick=()=>{
    const cp=JSON.parse(JSON.stringify(p)); cp.id=uid('p'); cp._waitSeeded=true;
    const base=(p.name||'profiel').replace(/\s*\(\d+\)\s*$/,'');
    const taken=new Set(state.profiles.map(x=>x.name)); let n=1, name;
    do{ name=`${base} (${n++})`; } while(taken.has(name));   // (1), (2), … skipping existing
    cp.name=name;
    state.profiles.push(cp); state.current=cp.id; persist();
    renderProfiles(); initStage(); selectedId=null; selectedIds=new Set();
    renderCanvas(); renderLayers(); renderInspector();
    openProfileSettings();   // keep the dialog open, now showing the new copy
    toast(T('Profiel gedupliceerd: ','Profile duplicated: ')+name);
  };
}

/* ---- YAML import ---- */
function openImport(){
  openModal(T('YAML importeren','Import YAML'),
    `<div class="hint" style="margin-bottom:8px">${T('Plak gerust je hele ESPHome-config','Paste your whole ESPHome config if you like')} — ${T('alleen','only')} <span class="mono">font:</span>, <span class="mono">color:</span> ${T('en','and')} <span class="mono">homeassistant</span>-<span class="mono">sensor:</span>/<span class="mono">text_sensor:</span> ${T('worden ingelezen.','are imported.')} ${T('De studio probeert ook de tekenregels uit de display-lambda terug te zetten op het canvas (standaard it.print/printf/line/rectangle/circle/polygon/ring/gauge/graph/qr). Regels met variabelen, lussen of berekeningen worden overgeslagen.','The studio also tries to rebuild the drawing lines from the display lambda onto the canvas (standard it.print/printf/line/rectangle/circle/polygon/ring/gauge/graph/qr). Lines with variables, loops or maths are skipped.')} ${T('Een YAML die de studio zelf maakte (met herstelcode) komt 1-op-1 terug.','A YAML the studio generated itself (with recovery code) comes back exactly.')}</div>
     <textarea class="import-area" id="imp-area" placeholder="font:\n  - file: ..."></textarea>`,
    [{label:T('Annuleer','Cancel'),onClick:closeModal},{label:T('Importeer','Import'),cls:'primary',onClick:doImport}]);
}
/* Pull a single top-level block ("key:" at column 0 up to the next top-level
   key) out of the raw YAML. Lets us ignore everything the studio doesn't use
   (esphome:, wifi:, api:, !secret tags, the display lambda, …). */
function _extractTopBlock(text, key){
  const lines=String(text).split(/\r?\n/);
  let buf=null;
  for(const ln of lines){
    const isTop=/^[A-Za-z_][\w-]*\s*:/.test(ln);          // unindented "key:"
    if(isTop){
      const k=ln.split(':')[0].trim();
      if(buf!==null) break;                                // reached the next top-level key
      if(k===key) buf=[ln];
    } else if(buf!==null){ buf.push(ln); }
  }
  return buf ? buf.join('\n') : null;
}
/* Tolerant parse of one block: neutralises ESPHome custom tags (!secret, !lambda…) */
function _parseBlock(block){
  if(!block) return null;
  const safe = block.replace(/!\s*[A-Za-z_][\w-]*/g, '');  // drop "!secret" etc., keep the value
  try{ return jsyaml.load(safe); }catch(e){ return null; }
}
/* Studio-generated YAML carries the full editable layout as a base64 comment
   (# eink-editor:v1:…). Decode it so a round-trip restores the canvas. */
function _readSnapshot(text){
  const m=/#\s*eink-editor:v[\w.]+:([A-Za-z0-9+/=]+)/.exec(String(text));
  if(!m) return null;
  try{ return JSON.parse(decodeURIComponent(escape(atob(m[1])))); }catch(e){ return null; }
}
/* read a pin value from a block (handles "key: GPIOxx" and "key:\n number: GPIOxx") */
function _yamlPin(block, key){
  let m=new RegExp(key+':[ \\t]*([A-Za-z0-9]+)','').exec(block);
  if(m && m[1]) return m[1];
  m=new RegExp(key+':[ \\t]*\\r?\\n[ \\t]*number:[ \\t]*([A-Za-z0-9]+)','').exec(block);
  return m? m[1] : null;
}
/* set the profile's "which YAML blocks" output settings from an imported config */
function applyOutputFromYaml(text, p){
  const has=k=>_extractTopBlock(text,k)!=null;
  const o=outCfg(p);
  const esph=_extractTopBlock(text,'esphome')||'';
  const tm=_extractTopBlock(text,'time')||'';
  const spi=_extractTopBlock(text,'spi')||'';
  const disp=_extractTopBlock(text,'display')||'';
  o.refresh = has('esphome')||has('script')||has('time');
  o.globals = has('globals');
  o.fonts = has('font'); o.colors = has('color');
  o.sensors = has('sensor'); o.textSensors = has('text_sensor');
  o.spi = has('spi');
  let m;
  if((m=/priority:[ \t]*([\d.]+)/.exec(esph))) o.bootPriority=m[1];
  if((m=/-[ \t]*delay:[ \t]*([0-9a-z]+)/i.exec(esph))) o.bootDelay=m[1];
  if((m=/timeout:[ \t]*([0-9a-z]+)/i.exec(esph))) o.waitTimeout=m[1];
  if((m=/minutes:[ \t]*\/(\d+)/.exec(tm))) o.timeInterval=+m[1];
  if(o.spi){ const a=_yamlPin(spi,'clk_pin'); if(a) o.spiClk=a; const b=_yamlPin(spi,'mosi_pin'); if(b) o.spiMosi=b; }
  if(/cs_pin:/.test(disp)){
    o.displayPins=true;
    if((m=/data_rate:[ \t]*([A-Za-z0-9]+)/.exec(disp))) o.dataRate=m[1];
    const cs=_yamlPin(disp,'cs_pin'); if(cs) o.csPin=cs;
    const dc=_yamlPin(disp,'dc_pin'); if(dc) o.dcPin=dc;
    const bs=_yamlPin(disp,'busy_pin'); if(bs) o.busyPin=bs;
    const rs=_yamlPin(disp,'reset_pin'); if(rs) o.resetPin=rs;
    if((m=/reset_duration:[ \t]*([A-Za-z0-9]+)/.exec(disp))) o.resetDuration=m[1];
    o.csIgnoreStrap=/ignore_strapping_warning:[ \t]*true/.test(disp);
    o.busyInverted=/busy_pin:[\s\S]*?inverted:[ \t]*true/.test(disp);
  }
  p.output=o;
}

/* ---- best-effort lambda parser ------------------------------------------
   Reverse-engineers the standard it.* drawing calls (the studio's own
   vocabulary + simple hand-written lines with literal coordinates) back into
   editable elements. Anything with variables/loops/expressions is skipped. */
function _splitArgs(s){
  const out=[]; let d=0,q=null,cur='';
  for(let i=0;i<s.length;i++){ const c=s[i];
    if(q){ cur+=c; if(c===q && s[i-1]!=='\\') q=null; continue; }
    if(c==='"'||c==="'"){ q=c; cur+=c; continue; }
    if(c==='('){ d++; cur+=c; continue; }
    if(c===')'){ d--; cur+=c; continue; }
    if(c===',' && d===0){ out.push(cur.trim()); cur=''; continue; }
    cur+=c;
  }
  if(cur.trim()!=='') out.push(cur.trim());
  return out;
}
function _lnum(a){ a=String(a==null?'':a).trim(); return /^-?\d+(\.\d+)?$/.test(a)?parseFloat(a):null; }
function _ln0(a,def){ const v=_lnum(a); return v==null?def:v; }
function _lstr(a){ const m=/^"((?:[^"\\]|\\.)*)"$/.exec(String(a).trim())||/^'((?:[^'\\]|\\.)*)'$/.exec(String(a).trim());
  return m? m[1].replace(/\\"/g,'"').replace(/\\\\/g,'\\') : null; }
function _lid(a){ const m=/id\(\s*([A-Za-z_]\w*)\s*\)/.exec(String(a)); return m?m[1]:null; }
function _lalign(args){ const m=/TextAlign::(\w+)/.exec(args.join(',')); return m?m[1]:'TOP_LEFT'; }
function _lcolor(args, colors){ for(const a of args){ const id=String(a).trim(); if(colors.some(c=>c.id===id)) return id; } return (colors[0]&&colors[0].id)||'color_text'; }
function _lblank(type){
  return { id:uid(), type, name:elName(type), visible:true, x:0,y:0, colorId:'color_text', anchor:'TOP_LEFT',
    condition:{enabled:false,sourceId:'',op:'on',val:'',val2:'',
      whenTrue:{text:'',iconName:'',iconHex:'',colorId:'',visible:true},
      whenFalse:{text:'',iconName:'',iconHex:'',colorId:'',visible:true}} };
}
function _componentMap(text, key){
  const arr=_parseBlock(_extractTopBlock(text,key)); const map={};
  if(arr && Array.isArray(arr[key])) arr[key].forEach(o=>{ if(o&&o.id) map[o.id]=o; });
  return map;
}
function _elFromCall(method, A, colors, qrMap, grMap, sources){
  const col=_lcolor(A, colors), n=_lnum;
  const mk=(type,extra)=>Object.assign(_lblank(type),{colorId:col},extra);
  switch(method){
    case 'line':{ const x=n(A[0]),y=n(A[1]),x2=n(A[2]),y2=n(A[3]); if([x,y,x2,y2].some(v=>v==null))return null;
      return mk('line',{x,y,x2,y2,anchor:undefined}); }
    case 'rectangle': case 'filled_rectangle':{ const x=n(A[0]),y=n(A[1]),w=n(A[2]),h=n(A[3]); if([x,y,w,h].some(v=>v==null))return null;
      return mk('rect',{x,y,w,h,filled:method.charAt(0)==='f',anchor:undefined}); }
    case 'circle': case 'filled_circle':{ const x=n(A[0]),y=n(A[1]),r=n(A[2]); if([x,y,r].some(v=>v==null))return null;
      return mk('circle',{x,y,r,filled:method.charAt(0)==='f',anchor:undefined}); }
    case 'regular_polygon': case 'filled_regular_polygon':{ const x=n(A[0]),y=n(A[1]),r=n(A[2]),s=n(A[3]); if([x,y,r,s].some(v=>v==null))return null;
      // rotation is at arg 4 (old format) or arg 5 (new: ..., VARIATION_*, rotation, color)
      const rot=(n(A[4])!=null)?n(A[4]):(n(A[5])||0);
      return mk('polygon',{x,y,r,sides:Math.max(3,s),rotation:rot||0,filled:method.charAt(0)==='f',anchor:undefined}); }
    case 'filled_ring':{ const x=n(A[0]),y=n(A[1]),r=n(A[2]),inner=n(A[3]); if([x,y,r,inner].some(v=>v==null))return null;
      return mk('ring',{x,y,r,inner,anchor:undefined}); }
    case 'filled_gauge':{ const x=n(A[0]),y=n(A[1]),r=n(A[2]),inner=n(A[3]),pct=n(A[4]); if([x,y,r,inner].some(v=>v==null))return null;
      return mk('gauge',{x,y,r,inner,percent:pct==null?75:pct,anchor:undefined}); }
    case 'qr_code':{ const x=n(A[0]),y=n(A[1]); if(x==null||y==null)return null; const q=qrMap[_lid(A[2])]||{};
      return mk('qr',{x,y,text:q.value||'',scale:n(A[4])||4,ecc:q.ecc||'LOW',anchor:undefined}); }
    case 'graph':{ const x=n(A[0]),y=n(A[1]); if(x==null||y==null)return null; const g=grMap[_lid(A[2])]||{};
      return mk('graph',{x,y,w:_ln0(g.width,300),h:_ln0(g.height,140),anchor:undefined,
        graph:{duration:g.duration||'1h',x_grid:g.x_grid||'',y_grid:g.y_grid==null?'':g.y_grid,border:g.border!==false,
          min_range:g.min_range==null?'':g.min_range,max_range:g.max_range==null?'':g.max_range,
          traces:(g.traces||[]).map(t=>({sourceId:t.sensor||'',name:t.name||'',lineType:t.line_type||'SOLID',thickness:t.line_thickness==null?2:t.line_thickness,continuous:t.continuous!==false,colorId:_lcolor([String(t.color||'')],colors)})),
          axes:{show:false,fontId:'font_klein',yTitle:'',xTitle:'',showYScale:true,showXScale:true},
          legend: g.legend ? {show:true,x:'',y:'',nameFontId:g.legend.name_font||'font_klein',valueFontId:g.legend.value_font||'',
            border:g.legend.border!==false,showLines:g.legend.show_lines!==false,showValues:g.legend.show_values||'AUTO',
            showUnits:g.legend.show_units!==false,direction:g.legend.direction||'AUTO'}
            : {show:false,x:'',y:'',nameFontId:'font_klein',valueFontId:'',border:true,showLines:true,showValues:'AUTO',showUnits:true,direction:'AUTO'}} }); }
    case 'strftime':{ const x=n(A[0]),y=n(A[1]); if(x==null||y==null)return null;
      const si=A.findIndex(a=>_lstr(a)!=null); if(si<0)return null; const fmt=_lstr(A[si]);
      const fontId=_lid(A[2])||'font_klein', align=_lalign(A);
      const el=mk('clock',{x,y,fontId,anchor:align});
      el.clock={strftime:fmt,icon:false,iconName:'',iconHex:'',iconFontId:fontId,iconGap:40}; return el; }
    case 'print': case 'printf':{ const x=n(A[0]),y=n(A[1]); if(x==null||y==null)return null;
      const si=A.findIndex(a=>_lstr(a)!=null); if(si<0)return null;
      const lit=_lstr(A[si]), rest=A.slice(si+1), fontId=_lid(A[2])||'font_klein', align=_lalign(A);
      const icon=/^\\U([0-9A-Fa-f]{8})$/.exec(lit);
      if(icon && rest.length===0) return mk('icon',{x,y,fontId,anchor:align,iconHex:icon[1].toUpperCase(),iconName:''});
      const el=mk('text',{x,y,fontId,anchor:align}); el.transform='none'; el.transformArg={};
      const ref=/id\(\s*([A-Za-z_]\w*)\s*\)\s*\.state/.exec(rest.join(','));
      if(method==='printf' && rest.length && ref && sources.some(s=>s.id===ref[1])){
        el.source={kind:'sensor',sourceId:ref[1],text:'',expr:''};
        // turn common formats into builder mode so prefix/suffix/decimals stay editable
        const dm=/^([^%]*)%\.(\d+)f([^%]*)$/.exec(lit), im=/^([^%]*)%d([^%]*)$/.exec(lit), sm=/^([^%]*)%s([^%]*)$/.exec(lit);
        if(dm) el.format={mode:'builder',decimals:+dm[2],prefix:dm[1],suffix:dm[3],raw:lit};
        else if(im) el.format={mode:'builder',decimals:0,prefix:im[1],suffix:im[3],raw:lit};
        else if(sm) el.format={mode:'builder',decimals:1,prefix:sm[1],suffix:sm[3],raw:lit};
        else el.format={mode:'raw',decimals:1,prefix:'',suffix:'',raw:lit};
        el.role='value';     // bound to a source → it's a value element
      } else {
        el.source={kind:'static',text:lit,sourceId:'',expr:''};
        el.format={mode:'builder',decimals:1,prefix:'',suffix:'',raw:'%s'};
        el.role='text';      // plain literal → pure text element
      }
      return el; }
  }
  return null; // triangle/image/etc. — too ambiguous to invert, skipped on purpose
}
// it.* calls we know how to invert; used to explain *why* a call was skipped
var _SUPPORTED_CALLS=['line','rectangle','filled_rectangle','circle','filled_circle',
  'regular_polygon','filled_regular_polygon','filled_ring','filled_gauge','qr_code',
  'graph','strftime','print','printf'];
function _skipReason(method){
  if(/triangle$/.test(method)) return T('driehoek wordt niet teruggelezen (te dubbelzinnig)','triangle is not read back (too ambiguous)');
  if(method==='image') return T('afbeelding niet ondersteund','image not supported');
  if(_SUPPORTED_CALLS.indexOf(method)>=0) return T('variabele / berekende of niet-letterlijke waarde','variable / computed or non-literal value');
  return T('commando niet ondersteund','command not supported');
}
function _parseLambda(text, p){
  const empty={els:[], skipped:[]};
  const block=_extractTopBlock(text,'display'); if(!block) return empty;
  const li=block.search(/lambda:\s*\|/); if(li<0) return empty;
  const lambda=block.slice(block.indexOf('\n', li)+1);
  const colors=p.colors||[], sources=p.sources||[];
  const qrMap=_componentMap(text,'qr_code'), grMap=_componentMap(text,'graph');
  const out=[], skipped=[], seen=new Set(); const re=/it\.([a-z_]+)\s*\(/g; let m;
  while((m=re.exec(lambda))){
    let i=m.index+m[0].length, d=1, q=null;
    for(; i<lambda.length && d>0; i++){ const c=lambda[i];
      if(q){ if(c===q && lambda[i-1]!=='\\') q=null; }
      else if(c==='"'||c==="'") q=c; else if(c==='(') d++; else if(c===')') d--; }
    const callTxt=lambda.slice(m.index, i);
    const el=_elFromCall(m[1], _splitArgs(lambda.slice(m.index+m[0].length, i-1)), colors, qrMap, grMap, sources);
    if(el){ const key=el.type+'|'+el.x+'|'+el.y+'|'+(el.iconHex||el.text||el.fontId||el.r||el.w||'');
      if(!seen.has(key)){ seen.add(key); out.push(el); } }
    else { skipped.push({ method:m[1], reason:_skipReason(m[1]),
      snippet:callTxt.replace(/\s+/g,' ').trim().slice(0,90) }); }
  }
  // give imported elements running names per type (Text 1, Text 2, Icon 1, Icon 2, …),
  // continuing past whatever is already on the screen
  const labels={text:T('Tekst','Text'),value:T('Waarde','Value'),icon:T('Icoon','Icon'),line:T('Lijn','Line'),rect:T('Rechthoek','Rectangle'),
    circle:T('Cirkel','Circle'),polygon:T('Veelhoek','Polygon'),ring:'Ring',gauge:T('Meter','Gauge'),
    qr:'QR',clock:T('Klok','Clock'),graph:T('Grafiek','Graph')};
  const nk=e=> e.type==='text' ? (e.role==='value'?'value':'text') : e.type;   // name key (text vs value)
  const baseCount={}; (p.elements||[]).forEach(e=>{ const k=nk(e); baseCount[k]=(baseCount[k]||0)+1; });
  const seq={};
  out.forEach(e=>{ const k=nk(e); seq[k]=(seq[k]||0)+1; e.name=(labels[k]||'Element')+' '+((baseCount[k]||0)+seq[k]); });
  return {els:out, skipped};
}
var _ELTYPE_LABEL={ text:()=>T('tekst','text'), icon:()=>T('icoon','icon'), line:()=>T('lijn','line'),
  rect:()=>T('rechthoek','rectangle'), circle:()=>T('cirkel','circle'), polygon:()=>T('veelhoek','polygon'),
  ring:()=>'ring', gauge:()=>T('meter','gauge'), qr:()=>'qr', clock:()=>T('klok','clock'), graph:()=>T('grafiek','graph') };
function _importReport({resources, drawn, skipped}){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // count drawn elements per type
  const counts={}; drawn.forEach(e=>{ counts[e.type]=(counts[e.type]||0)+1; });
  const drewLines=Object.keys(counts).map(t=>`${counts[t]}× ${(_ELTYPE_LABEL[t]?_ELTYPE_LABEL[t]():t)}`);
  let h=`<div class="hint" style="margin-bottom:10px">${T('Overzicht van de import. Wat de studio niet eenduidig kon teruglezen is overgeslagen — dat staat nog in je eigen YAML, alleen niet op het canvas.','Summary of the import. Anything the studio could not read back unambiguously was skipped — it is still in your own YAML, just not on the canvas.')}</div>`;
  h+=`<div style="display:flex;gap:14px;flex-wrap:wrap">`;
  // imported column
  h+=`<div style="flex:1;min-width:220px">`;
  h+=`<h4 style="margin:0 0 6px">✓ ${T('Wel meegenomen','Imported')}</h4><ul style="margin:0;padding-left:18px;line-height:1.7">`;
  if(resources) h+=`<li>${esc(resources)}</li>`;
  if(drewLines.length) h+=`<li>${T('tekenobjecten','drawing objects')}: ${esc(drewLines.join(', '))}</li>`;
  if(!resources && !drewLines.length) h+=`<li style="opacity:.6">—</li>`;
  h+=`</ul></div>`;
  // skipped column
  h+=`<div style="flex:1;min-width:220px">`;
  h+=`<h4 style="margin:0 0 6px">⊘ ${T('Niet meegenomen','Skipped')} (${skipped.length})</h4>`;
  if(skipped.length){
    h+=`<div style="max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:6px 8px">`;
    skipped.forEach(s=>{ h+=`<div style="margin-bottom:7px"><code style="font-size:11px;opacity:.85">${esc(s.snippet)}</code><br><span style="font-size:11px;opacity:.6">↳ ${esc(s.reason)}</span></div>`; });
    h+=`</div>`;
  } else h+=`<div style="opacity:.6">${T('niets — alles is teruggelezen','nothing — everything was read back')}</div>`;
  h+=`</div></div>`;
  openModal(T('Import-overzicht','Import summary'), h, [{label:T('Sluiten','Close'),cls:'primary',onClick:closeModal}]);
}

function doImport(textArg){
  // when used as a button onClick it receives the event; only a real string is a payload
  const text=(typeof textArg==='string')?textArg:$('#imp-area').value;
  if(!text || !text.trim()){ toast(T('Niets bruikbaars gevonden','Nothing usable found')); return; }
  // parse only the blocks the studio understands; everything else is ignored
  const doc={};
  ['font','color','sensor','text_sensor'].forEach(k=>{
    const parsed=_parseBlock(_extractTopBlock(text,k));
    if(parsed && Array.isArray(parsed[k])) doc[k]=parsed[k];
  });
  const snap=_readSnapshot(text);   // full layout, only present in studio-generated YAML
  const p=profile(); let n=0, nSrc=0;
  applyOutputFromYaml(text, p);     // sync the "which YAML blocks" settings to the imported config
  if(Array.isArray(doc.font)){ p.fonts=doc.font.map(parseFont); n+=p.fonts.length; }
  if(Array.isArray(doc.color)){ p.colors=doc.color.map(parseColor); n+=p.colors.length; }
  ['sensor','text_sensor'].forEach(key=>{
    if(Array.isArray(doc[key])) doc[key].forEach(it=>{ if(it.platform==='homeassistant'&&it.id&&it.entity_id){
      const kind = key==='text_sensor' ? guessKind(it.entity_id) : 'number';
      const ex=p.sources.find(s=>s.id===it.id);
      if(ex){ ex.entityId=it.entity_id; ex.kind=kind; } else p.sources.push({id:it.id,entityId:it.entity_id,kind,sample:sampleFor(kind)});
      n++; nSrc++;
    }});
  });
  // best-effort: rebuild canvas elements from the display lambda (fonts/colours/
  // sources are imported above first, so colour-ids and sensor-bindings resolve)
  const lam = snap ? {els:[],skipped:[]} : _parseLambda(text, p);
  const drawn = lam.els;
  if(!snap && !drawn.length && n===0 && !lam.skipped.length){
    toast(T('Geen font/color/sensor-blok gevonden','No font/color/sensor block found')); return;
  }
  if(snap){
    // full round-trip: restore the editable layout if this YAML came from the studio
    if(snap.device) p.device=snap.device;
    if(Array.isArray(snap.elements)) p.elements=snap.elements;
    if(Array.isArray(snap.waitElements)) p.waitElements=snap.waitElements;
  } else if(drawn.length){
    p.elements=(p.elements||[]).concat(drawn);
  }
  if(snap || drawn.length){
    editScreen='main'; { const ss=$('#screen-select'); if(ss) ss.value='main'; }
    selectedIds=new Set(); selectedId=null; applyZoom();   // device may have changed → resize the stage
  }
  persist(); afterChange(); closeModal();
  if(snap){ toast(T('Ontwerp hersteld uit herstelcode','Design restored from recovery code')); return; }
  // show a what-was-and-wasn't-imported report
  const resBits=[];
  if(Array.isArray(doc.font)) resBits.push(`${p.fonts.length} fonts`);
  if(Array.isArray(doc.color)) resBits.push(`${p.colors.length} ${T('kleuren','colours')}`);
  if(nSrc) resBits.push(`${nSrc} ${T('waardebronnen','value sources')}`);
  _importReport({ resources: resBits.join(' · '), drawn, skipped: lam.skipped });
  function parseFont(o){
    const file = typeof o.file==='string'?o.file:null;
    const g = (o.file&&o.file.type==='gfonts')?o.file:null;
    return { id:o.id, kind:g?'gfonts':'local', file, family:g?g.family:null, weight:g?g.weight:null,
      size:o.size||20, dynamic:!o.glyphs && /digital/i.test(file||''), baseCharset:' -.:%/°0123456789',
      dataUrl:null, seedGlyphs: Array.isArray(o.glyphs)?o.glyphs:[] };
  }
  function parseColor(o){ const css=rgbwToCss(o); return {id:o.id, r:pct(o.red),g:pct(o.green),b:pct(o.blue),w:pct(o.white),css}; }
  function pct(v){ if(v==null)return 0; return parseInt(String(v))||0; }
  function rgbwToCss(o){ if(pct(o.red)>50&&pct(o.green)<50) return '#d6483b'; if(pct(o.white)>50||(pct(o.red)===0&&pct(o.green)===0&&pct(o.blue)===0&&pct(o.white)===0&&o.id&&/bg/i.test(o.id))) return o.id&&/bg/i.test(o.id)?'#f4f1e9':'#1d1d1b'; return '#1d1d1b'; }
  function guessKind(eid){ if(/^input_datetime\./.test(eid)) return 'time'; if(/^(input_boolean|switch|binary_sensor|light|fan|lock)\./.test(eid)) return 'bool'; if(/^sensor\./.test(eid)) return 'string'; return 'string'; }
  function sampleFor(k){ return k==='number'?0:k==='time'?'12:00:00':k==='bool'?'on':'—'; }
}

/* ============================================================
   PROFILES bar + project save/load
   ============================================================ */
/* natural sort: numbers before letters, case-insensitive (used for both profile dropdowns) */
function sortedProfiles(){
  return state.profiles.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),undefined,{numeric:true,sensitivity:'base'}));
}
function renderProfiles(){
  const sel=$('#profile-select'); sel.innerHTML=sortedProfiles().map(p=>`<option value="${p.id}" ${p.id===state.current?'selected':''}>${attr(p.name)}</option>`).join('');
}
/* ============================================================
   SERVER STORAGE (add-on build) — projects + fonts in /data
   When the add-on API is present, Save/Open use server storage;
   standalone (file/localhost) keeps the file-based behaviour.
   ============================================================ */
var SERVER_STORAGE=false;
function pname(){ return (profile().name||'profiel').replace(/[^A-Za-z0-9._-]+/g,'_'); }
function pslug(p){ return (p.name||'profiel').replace(/[^A-Za-z0-9._-]+/g,'_'); }
/* write the generated YAML to projects/<profile>.yaml so it shows up in the file
   manager and over SAMBA (profiles/ already holds the editable design JSON, so
   projects/ is free to hold the human-readable generated output). */
async function saveGeneratedYaml(silent){
  if(!SERVER_STORAGE) return;
  const file='projects/'+pname()+'.yaml';
  try{
    const r=await fetch('api/fs/write',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({path:file, content:genYAML()})});
    if(r.ok && !silent) toast(T('Opgeslagen in ','Saved to ')+file);
  }catch(e){}
}
/* browse projects/ for a saved .yaml and import it back into the editor (the
   generated YAML carries the recovery code, so the design is fully restored) */
async function openGeneratedYaml(){
  if(!SERVER_STORAGE){ toast(T('Alleen in de add-on beschikbaar','Only available in the add-on')); return; }
  let files=[];
  try{ const r=await fetch('api/fs/list?path=projects'); const j=await r.json();
    files=(j.entries||[]).filter(e=>e.type==='file' && /\.ya?ml$/i.test(e.name)).map(e=>e.name); }
  catch(e){ toast(T('Kon lijst niet laden','Could not load list')); return; }
  const rows = files.length
    ? files.map(n=>`<div class="row" style="align-items:center"><div class="mono" style="flex:1">${attr(n)}</div>
        <button class="btn sm" data-openyaml="${attr(n)}">${T('Openen','Open')}</button></div>`).join('')
    : `<div class="hint">${T('Nog geen YAML in projects/. Druk op Opslaan om deze YAML te bewaren.','No YAML in projects/ yet. Press Save to store this YAML.')}</div>`;
  openModal(T('YAML openen (projects/)','Open YAML (projects/)'),
    rows + `<div class="hint" style="margin-top:10px">${T('Openen zet het ontwerp terug via de herstelcode in de YAML.','Opening restores the design via the recovery code in the YAML.')}</div>`,
    [{label:T('Sluiten','Close'),onClick:closeModal}]);
  $$('#modal-body [data-openyaml]').forEach(b=>b.onclick=async()=>{
    try{ const r=await fetch('api/fs/read?path='+encodeURIComponent('projects/'+b.dataset.openyaml));
      const j=await r.json();
      if(j.error || j.content==null){ toast(T('Kon bestand niet lezen','Could not read file')); return; }
      doImport(j.content);   // restores the design + closes this modal + re-renders
    }catch(e){ toast(T('Openen mislukt','Open failed')); }
  });
}

/* ---- server-side profile sync ---- */
var _profileSyncTimer=null;
var _knownServerSlugs=new Set();

async function syncProfilesToServer(){
  if(!SERVER_STORAGE) return;
  const current=new Set(state.profiles.map(pslug));
  // write every profile
  for(const p of state.profiles){
    const n=pslug(p);
    try{ await fetch('api/profiles/'+encodeURIComponent(n),{
      method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)
    }); }catch(e){}
  }
  // delete server profiles that no longer exist locally (renamed/removed)
  for(const n of _knownServerSlugs){
    if(!current.has(n)){ try{ await fetch('api/profiles/'+encodeURIComponent(n),{method:'DELETE'}); }catch(e){} }
  }
  _knownServerSlugs=current;
}

/* Load profiles from the add-on storage folder (source of truth when present).
   Runs once at startup. Seeds the server from local profiles on first run. */
async function loadProfilesFromServer(){
  try{
    const r=await fetch('api/profiles'); if(!r.ok) return;
    const names=(await r.json()).profiles||[];
    if(!names.length){ await syncProfilesToServer(); return; }   // first run: seed folder
    const loaded=(await Promise.all(
      names.map(n=>fetch('api/profiles/'+encodeURIComponent(n)).then(x=>x.ok?x.json():null))
    )).filter(Boolean);
    if(loaded.length){
      state.profiles=loaded;
      _knownServerSlugs=new Set(names);
      if(!loaded.some(p=>p.id===state.current)) state.current=loaded[0].id;
      try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
    }
  }catch(e){ console.warn('profile load failed',e); }
}

/* If profile JSONs were deleted in the file manager, drop them from the profile
   manager too. Runs when returning to the studio (focus / back-navigation), so
   the two stay in sync without the studio re-creating the deleted files. */
async function reconcileProfilesFromServer(){
  if(!SERVER_STORAGE) return;
  try{
    const r=await fetch('api/profiles'); if(!r.ok) return;
    const names=new Set((await r.json()).profiles||[]);
    if(!names.size) return;                            // empty list → don't wipe everything
    const keep=state.profiles.filter(p=>names.has(pslug(p)));
    if(!keep.length || keep.length===state.profiles.length) return;
    state.profiles=keep;
    if(!keep.some(p=>p.id===state.current)) state.current=keep[0].id;
    _knownServerSlugs=names;
    persist(); renderProfiles();
    if(!keep.some(p=>p.id===state.current)) boot();
  }catch(e){}
}
window.addEventListener('pageshow', e=>{ if(e.persisted) reconcileProfilesFromServer(); });
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) reconcileProfilesFromServer(); });

/* unique profile name so opening/loading never collides with an existing one
   (which would clash on the server slug) */
function _uniqueProfileName(base){
  base=base||'profiel';
  const taken=new Set(state.profiles.map(x=>x.name));
  if(!taken.has(base)) return base;
  const stem=base.replace(/\s*\(\d+\)\s*$/,''); let n=1, name;
  do{ name=`${stem} (${n++})`; }while(taken.has(name));
  return name;
}
// Save/Open operate on the JSON design folder (profiles/). The generated YAML lives
// separately in projects/ (see saveGeneratedYaml + the code drawer's Open/Save).
async function serverSaveProject(){
  try{
    const r=await fetch('api/profiles/'+encodeURIComponent(pslug(profile())), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(profile()) });
    if(!r.ok) throw new Error('http '+r.status);
    const fn='profiles/'+pslug(profile())+'.json';
    toast(T('Opgeslagen: '+fn,'Saved: '+fn));
  }catch(e){ console.warn(e); toast(T('Opslaan op server mislukt — gedownload als bestand','Server save failed — downloaded as file')); fileSaveProject(); }
}
async function serverOpenProject(){
  let list=[];
  try{ const r=await fetch('api/profiles'); list=(await r.json()).profiles||[]; }
  catch(e){ toast(T('Kon serverlijst niet laden','Could not load server list')); return; }
  const rows = list.length
    ? list.map(n=>`<div class="row" style="align-items:center"><div class="mono" style="flex:1">${attr(n)}</div>
        <button class="btn sm" data-open="${attr(n)}">${T('Openen','Open')}</button></div>`).join('')
    : `<div class="hint">${T('Nog geen ontwerpen opgeslagen.','No designs saved yet.')}</div>`;
  openModal(T('Ontwerp openen (profiles/)','Open design (profiles/)'), rows + `<div class="hint" style="margin-top:10px">${T('Of laad een bestand:','Or load a file:')}</div>
    <button class="btn sm" id="open-file" style="margin-top:6px">${T('Bestand kiezen…','Choose file…')}</button>`,
    [{label:T('Sluiten','Close'),onClick:closeModal}]);
  $$('#modal-body [data-open]').forEach(b=>b.onclick=async()=>{
    // already loaded locally (the folder mirrors local state) → just switch to it
    const existing=state.profiles.find(x=>pslug(x)===b.dataset.open);
    if(existing){ state.current=existing.id; persist(); closeModal(); boot(); toast(T('Geopend: ','Opened: ')+existing.name); return; }
    try{ const r=await fetch('api/profiles/'+encodeURIComponent(b.dataset.open));
      const p=await r.json(); p.id=uid('p'); p.name=_uniqueProfileName(p.name||b.dataset.open);
      state.profiles.push(p); state.current=p.id; persist(); closeModal(); boot(); toast(T('Geopend: ','Opened: ')+p.name);
    }catch(e){ toast(T('Openen mislukt','Open failed')); }
  });
  $('#open-file').onclick=fileOpenProject;
}

function fileSaveProject(){
  const blob=new Blob([JSON.stringify(profile(),null,2)],{type:'application/json'});
  download(blob, pname()+'.eink.json');
  toast(T('Project gedownload','Project downloaded'));
}
function fileOpenProject(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=()=>{ const f=inp.files[0]; if(!f)return; const rd=new FileReader();
    rd.onload=()=>{ try{ const p=JSON.parse(rd.result); p.id=uid('p'); p.name=_uniqueProfileName(p.name); state.profiles.push(p); state.current=p.id; persist(); closeModal&&closeModal(); boot(); toast(T('Project geladen','Project loaded')); }catch(e){ toast(T('Ongeldig bestand','Invalid file')); } };
    rd.readAsText(f); };
  inp.click();
}
function saveProject(){ if(SERVER_STORAGE) serverSaveProject(); else fileSaveProject(); }
function loadProject(){ if(SERVER_STORAGE) serverOpenProject(); else fileOpenProject(); }
function download(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

/* ============================================================
   WIRING
   ============================================================ */
function applyTheme(){
  document.body.classList.toggle('light', state.theme==='light');
  const btn=$('#btn-theme');
  if(btn) btn.textContent = state.theme==='light' ? ('◑ '+T('Licht','Light')) : ('◐ '+T('Donker','Dark'));
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),1800); }

/* point 2: right-click context menu on the canvas */
function hideCtxMenu(){ $('#ctxmenu').classList.remove('open'); }

/* context-menu items for a given element (used by canvas + layers) */
function elItems(el){
  const items=[];
  items.push(['✎ '+T('Hernoemen','Rename'),'',()=>{ const row=[...document.querySelectorAll('#layers .layer')].find(r=>r._elId===el.id);
    if(row){ const span=row.querySelector('.lname'); if(span) startRename(span, el); } else { select(el.id); } }]);
  items.push(['⧉ '+T('Dupliceren','Duplicate'),'Ctrl+D',()=>{ selectedId=el.id; dupSel(); }]);
  items.push([el.visible===false?('👁 '+T('Tonen','Show')):('🚫 '+T('Verbergen','Hide')),'',()=>{ pushUndo(); el.visible=el.visible===false?true:false; afterChange(); }]);
  items.push(['↑ '+T('Naar voren','Bring forward'),'',()=>reorder(el,1)]);
  items.push(['↓ '+T('Naar achteren','Send backward'),'',()=>reorder(el,-1)]);
  items.push(['sep']);
  items.push(['🗑 '+T('Verwijderen','Delete'),'Del',()=>{ selectedId=el.id; deleteSel(); },'danger']);
  return items;
}

function showMenu(x,y,items){
  const menu=$('#ctxmenu');
  menu.innerHTML = items.map(it=>{
    if(it[0]==='sep') return '<div class="sep"></div>';
    const cls=it[3]?` class="${it[3]}"`:'';
    const k=it[1]?`<span class="k">${it[1]}</span>`:'';
    return `<button${cls} data-act>${it[0]}${k}</button>`;
  }).join('');
  const acts=items.filter(x=>x[0]!=='sep');
  Array.from(menu.querySelectorAll('[data-act]')).forEach((b,i)=>{
    const fn=acts[i] && acts[i][2];
    b.onclick=()=>{ hideCtxMenu(); if(fn) fn(); };
  });
  menu.style.left=Math.min(x,window.innerWidth-200)+'px';
  menu.style.top=Math.min(y,window.innerHeight-240)+'px';
  menu.classList.add('open');
}

function setupContextMenu(){
  window.addEventListener('click', hideCtxMenu);
  window.addEventListener('scroll', hideCtxMenu, true);
  $('#stage-wrap').addEventListener('contextmenu', e=>{
    e.preventDefault();
    let hitId=null;
    if(stage){ const pos=stage.getPointerPosition();
      const shape=pos && stage.getIntersection(pos);
      if(shape){ let n=shape; while(n && !n._elId) n=n.getParent(); if(n&&n._elId) hitId=n._elId; }
    }
    if(hitId){ selectedId=hitId; const node=contentLayer.getChildren(n=>n._elId===hitId)[0]; attachSelection(selected(),node); contentLayer.draw(); renderLayers(); renderInspector(); }
    const el=selected();
    if(el) showMenu(e.clientX,e.clientY, elItems(el));
    else showMenu(e.clientX,e.clientY, [[T('Niets geselecteerd','Nothing selected'),'',null]]);
  });
}
function reorder(el, dir){
  const arr=els(); const i=arr.indexOf(el); if(i<0) return;
  const j=i+dir; if(j<0||j>=arr.length) return;
  pushUndo(); arr.splice(i,1); arr.splice(j,0,el); afterChange();
}

/* Mouse-event drag-and-drop from palette to canvas (most universally supported).
   - click on a tool  -> add at center (reliable fallback)
   - press + drag onto canvas + release -> add at drop position
   Console logs (prefix [dnd]) make it easy to see where it stops. */
function setupPaletteDnD(){
  const palette=$('#palette'), frame=$('#stage-frame');
  let type=null, ghost=null, startX=0, startY=0, moved=false, active=false;
  const log=(...a)=>console.log('[dnd]',...a);

  palette.addEventListener('click', e=>{
    const tool=e.target.closest('[data-add]');
    if(tool && !moved){ log('click -> add at center:', tool.dataset.add); addElement(tool.dataset.add); }
  });
  palette.addEventListener('mousedown', e=>{
    const tool=e.target.closest('[data-add]'); if(!tool) return;
    type=tool.dataset.add; startX=e.clientX; startY=e.clientY; moved=false; active=true;
    log('mousedown on tool:', type);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  function overCanvas(x,y){ const r=$('#konva-host').getBoundingClientRect(); return (x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)?r:null; }
  function onMove(e){
    if(!active) return;
    if(!moved && Math.hypot(e.clientX-startX,e.clientY-startY)>4){
      moved=true; ghost=document.createElement('div'); ghost.className='drag-ghost'; ghost.textContent=type;
      document.body.appendChild(ghost); log('drag started');
    }
    if(ghost){ ghost.style.left=e.clientX+'px'; ghost.style.top=e.clientY+'px';
      frame.classList.toggle('drop-hover', !!overCanvas(e.clientX,e.clientY)); }
  }
  function onUp(e){
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    active=false; frame.classList.remove('drop-hover');
    if(ghost){ ghost.remove(); ghost=null; }
    if(moved){
      const r=overCanvas(e.clientX,e.clientY);
      log('drop, over canvas =', !!r);
      if(r){ const p=profile();
        addElement(type,{x:clamp((e.clientX-r.left)/zoom,0,p.device.w), y:clamp((e.clientY-r.top)/zoom,0,p.device.h)}); }
    }
    type=null;
  }

  log('palette DnD ready — tools found:', palette.querySelectorAll('[data-add]').length);
}

function wire(){
  setupPaletteDnD();
  setupContextMenu();
  $('#profile-select').onchange=e=>{ state.current=e.target.value; selectedId=null; persist(); boot(); };
  $('#profile-new').onclick=()=>{ const p=seedProfile(T('Nieuw profiel ','New profile ')+(state.profiles.length+1)); p.elements=[]; state.profiles.push(p); state.current=p.id; persist(); boot(); };
  $('#profile-settings').onclick=openProfileSettings;

  $('#btn-import').onclick=openImport;
  $('#btn-sources').onclick=openSources;
  $('#btn-fonts').onclick=openFonts;
  $('#btn-save').onclick=saveProject;
  $('#btn-theme').onclick=()=>{ if(window.haTheme) window.haTheme.toggle(); };
  const lb=$('#btn-live'); if(lb) lb.onclick=toggleLive;
  const rb=$('#btn-refresh'); if(rb) rb.onclick=()=>refreshLive();
  const li=$('#live-interval'); if(li){
    _setLiveIntervalValue(localStorage.getItem('einkLiveIntervalMin')||'1');
    li.onchange=()=>{
      if(li.value==='custom'){
        const cur=localStorage.getItem('einkLiveIntervalMin')||'1';
        const ans=prompt(T('Vernieuw-interval in minuten (0 = uit):','Refresh interval in minutes (0 = off):'), cur);
        if(ans==null){ _setLiveIntervalValue(cur); return; }
        let m=parseInt(ans,10); if(isNaN(m)||m<0) m=0;
        _setLiveIntervalValue(String(m));
      }
      localStorage.setItem('einkLiveIntervalMin', String(liveIntervalMin())); startLiveTimer();
    };
  }
  $('#btn-load').onclick=loadProject;

  $('#btn-code').onclick=()=>{ const d=$('#code-drawer');
    if(d.classList.contains('open')) d.classList.remove('open');
    else { renderCode(); saveGeneratedYaml(true); d.classList.add('open'); setTimeout(_fitB64,220); }   // re-fit after the open animation
    document.body.classList.toggle('code-open', d.classList.contains('open')); };
  $('#code-close').onclick=()=>{ $('#code-drawer').classList.remove('open'); document.body.classList.remove('code-open'); };
  { const rz=$('#code-resizer'), drawer=$('#code-drawer');
    if(rz) rz.addEventListener('mousedown', e=>{ e.preventDefault();
      const rightEdge=drawer.getBoundingClientRect().right;
      const move=ev=>{ const w=Math.max(360, Math.min(rightEdge-ev.clientX, window.innerWidth-60)); drawer.style.setProperty('--code-w', w+'px'); _fitB64(); };
      const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
      window.addEventListener('mousemove',move); window.addEventListener('mouseup',up); }); }
  const cb64=$('#code-b64'); if(cb64) cb64.onchange=()=>{ window.INCLUDE_SNAPSHOT=cb64.checked; renderCode(); };
  const scr=$('#screen-select'); if(scr) scr.onchange=()=>{ editScreen=scr.value; selectedId=null; selectedIds=new Set(); undoStack=[]; redoStack=[]; renderCanvas(); renderLayers(); renderInspector(); };
  $('#code-copy').onclick=()=>{ navigator.clipboard.writeText(genYAML()).then(()=>toast(T('Naar klembord gekopieerd','Copied to clipboard'))); };
  $('#code-download').onclick=()=>{ download(new Blob([genYAML()],{type:'text/yaml'}), pname()+'.yaml'); saveGeneratedYaml(false); toast(T('YAML gedownload','YAML downloaded')); };
  { const cs=$('#code-save'); if(cs) cs.onclick=()=>{ if(!SERVER_STORAGE){ download(new Blob([genYAML()],{type:'text/yaml'}), pname()+'.yaml'); toast(T('Geen add-on opslag — gedownload','No add-on storage — downloaded')); return; } saveGeneratedYaml(false); }; }
  { const co=$('#code-open'); if(co) co.onclick=openGeneratedYaml; }

  $('#zoom-in').onclick=()=>{ zoom=clamp(zoom+0.1,0.3,2); applyZoom(); };
  $('#zoom-out').onclick=()=>{ zoom=clamp(zoom-0.1,0.3,2); applyZoom(); };
  $('#zoom-fit').onclick=fitZoom;
  $('#tg-grid').onchange=()=>drawGrid();
  $('#grid-size').onchange=e=>{ profile().device.grid=+e.target.value; persist(); drawGrid(); };

  $('#btn-undo').onclick=undo; $('#btn-redo').onclick=redo;
  $('#btn-dup').onclick=dupSel; $('#btn-del').onclick=deleteSel;
  { const c=$('#btn-copy-el'); if(c) c.onclick=copySel;
    const x=$('#btn-cut-el'); if(x) x.onclick=cutSel;
    const v=$('#btn-paste-el'); if(v) v.onclick=pasteClip; }
  $('#al-left').onclick=()=>alignSel('left'); $('#al-hcenter').onclick=()=>alignSel('hcenter'); $('#al-right').onclick=()=>alignSel('right');
  $('#al-top').onclick=()=>alignSel('top'); $('#al-vcenter').onclick=()=>alignSel('vcenter'); $('#al-bottom').onclick=()=>alignSel('bottom');

  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')) return;
    if((e.ctrlKey||e.metaKey)&&e.key==='z'){ e.preventDefault(); undo(); }
    else if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='Z'))){ e.preventDefault(); redo(); }
    else if((e.ctrlKey||e.metaKey)&&e.key==='a'){
      // when the YAML drawer is open, Ctrl+A selects the generated code instead of the canvas
      if($('#code-drawer').classList.contains('open')){
        e.preventDefault();
        const pre=$('#code-out'); const r=document.createRange(); r.selectNodeContents(pre);
        const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      } else { e.preventDefault(); setSelection(els().map(x=>x.id), null); }
    }
    else if((e.ctrlKey||e.metaKey)&&e.key==='d'){ e.preventDefault(); dupSel(); }
    else if((e.ctrlKey||e.metaKey)&&e.key==='c'){ if(String(window.getSelection()||'')) return; e.preventDefault(); copySel(); }
    else if((e.ctrlKey||e.metaKey)&&e.key==='x'){ if(String(window.getSelection()||'')) return; e.preventDefault(); cutSel(); }
    else if((e.ctrlKey||e.metaKey)&&e.key==='v'){ e.preventDefault(); pasteClip(); }
    else if(e.key==='Delete'||e.key==='Backspace'){ deleteSel(); }
    else if(e.key==='Escape'){ select(null); }
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){ nudge(e); }
  });
}
function nudge(e){ if(!selectedIds.size) return; e.preventDefault(); const d=e.shiftKey?10:1;
  const dx=(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0), dy=(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0);
  els().forEach(el=>{ if(selectedIds.has(el.id)){ el.x+=dx; el.y+=dy; if(el.x2!=null){el.x2+=dx;el.y2+=dy;} } });
  afterChange(); }
function fitZoom(){ const wrap=$('#stage-wrap'); const p=profile(); const avail=wrap.clientHeight-56; zoom=clamp(avail/p.device.h,0.3,2); applyZoom(); }

/* ============================================================
   BOOT
   ============================================================ */
function showFatal(msg){
  let b=document.getElementById('fatal-banner');
  if(!b){ b=document.createElement('div'); b.id='fatal-banner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#d6483b;color:#fff;font:13px/1.5 system-ui;padding:10px 14px;white-space:pre-wrap';
    document.body.appendChild(b); }
  b.textContent='⚠ '+msg;
}
window.addEventListener('error', e=>{
  const m=String(e.message||'');
  if(/file:|unique security origin|cross-origin|Failed to fetch|NetworkError/i.test(m))
    showFatal('Deze pagina is als bestand geopend (file://). Open hem via een lokale webserver — start serve.bat of gebruik "Live Server" in VS Code. Detail: '+m);
  else showFatal('Fout: '+m);
});

/* ============================================================
   LIVE HA DATA (add-on build)
   Fetches read-only states from the add-on server (/api/states),
   which proxies Home Assistant. Fills each source's live value by
   matching its entityId, so the preview shows real data.
   ============================================================ */
async function fetchHaStates(){
  const r=await fetch('api/states', {headers:{'Accept':'application/json'}});
  if(!r.ok) throw new Error('states '+r.status);
  const arr=await r.json();
  const map={};
  arr.forEach(s=>{ map[s.entity_id]={state:s.state, unit:s.unit, name:s.name, device_class:s.device_class}; });
  return map;
}
function applyLiveToSources(){
  if(!HA_STATES) return;
  profile().sources.forEach(src=>{
    const st=HA_STATES[src.entityId];
    if(st && st.state!=null && st.state!=='unavailable' && st.state!=='unknown'){
      src.live = st.state;           // store separately; sample stays as fallback
    } else { delete src.live; }
  });
}
/* Toggle live data on/off (button click). Enabling fetches once and starts the
   auto-refresh timer; disabling stops it. Re-fetching is done with ↻ Refresh. */
function toggleLive(){
  if(LIVE_ON){
    LIVE_ON=false; HA_LIVE=false; LIVE_STATUS='off'; HA_STATES=null;
    stopLiveTimer();
    if(profile()) profile().sources.forEach(s=>delete s.live);
    updateLiveBadge(); renderCanvas(); renderInspector();
    toast(T('Live data uit','Live data off'));
    return;
  }
  refreshLive();        // turns live on, fetches, and (re)starts the timer
}
/* Auto-refresh interval in minutes from the toolbar select; 0 = off. Persisted. */
function liveIntervalMin(){
  const sel=$('#live-interval');
  let v = (sel && sel.value!=='custom') ? parseInt(sel.value,10) : NaN;
  if(isNaN(v)) v=parseInt(localStorage.getItem('einkLiveIntervalMin')||'1',10);
  return isNaN(v)?1:Math.max(0,v);
}
/* select/insert the option matching v minutes (adds a custom value if needed) */
function _setLiveIntervalValue(v){
  const sel=$('#live-interval'); if(!sel) return; v=String(Math.max(0,parseInt(v,10)||0));
  let opt=Array.prototype.find.call(sel.options, o=>o.value===v);
  if(!opt){ opt=document.createElement('option'); opt.value=v; opt.textContent=v+' min';
    sel.insertBefore(opt, sel.querySelector('option[value="custom"]')); }
  sel.value=v;
}
function startLiveTimer(){
  stopLiveTimer();
  const m=liveIntervalMin();
  if(LIVE_ON && m>=1) LIVE_TIMER=setInterval(()=>refreshLive(true), m*60000);
}
function stopLiveTimer(){ if(LIVE_TIMER){ clearInterval(LIVE_TIMER); LIVE_TIMER=null; } }
/* one-time: give every text element a role (text = static, value = source/expr) */
function migrateTextRoles(){
  let changed=false;
  (state.profiles||[]).forEach(p=>{
    [].concat(p.elements||[], p.waitElements||[]).forEach(el=>{
      if(el.type==='text' && !el.role){
        el.role = (el.source && el.source.kind!=='static') ? 'value' : 'text';
        changed=true;
      }
    });
  });
  if(changed) persist();
}
/* Fetch HA states now. silent=true suppresses the success toast (auto-refresh). */
async function refreshLive(silent){
  LIVE_ON=true;
  try{
    const r=await fetch('api/states', {headers:{'Accept':'application/json'}});
    if(r.status===503){   // server up but no Supervisor token / no HA data
      HA_LIVE=false; LIVE_STATUS='warn'; updateLiveBadge(); startLiveTimer();
      toast(T('Live data: geen verbinding met Home Assistant (Supervisor-token ontbreekt)',
              'Live data: no Home Assistant connection (Supervisor token missing)'), true);
      return;
    }
    if(!r.ok) throw new Error('states '+r.status);
    const arr=await r.json();
    const map={};
    arr.forEach(s=>{ map[s.entity_id]={state:s.state, unit:s.unit, name:s.name, device_class:s.device_class}; });
    HA_STATES=map; applyLiveToSources(); HA_LIVE=true;
    const n=Object.keys(map).length;
    LIVE_STATUS = n>0 ? 'ok' : 'warn';
    updateLiveBadge(); renderCanvas(); renderInspector(); startLiveTimer();
    if(!silent) toast(T('Live data bijgewerkt ('+n+' entiteiten)','Live data updated ('+n+' entities)'));
  }catch(e){
    HA_LIVE=false; LIVE_STATUS='error'; updateLiveBadge(); startLiveTimer();
    if(!silent) toast(T('Live data niet beschikbaar','Live data unavailable'), true);
    console.warn('live fetch failed', e);
  }
}
/* Status dot: off = grey ○, ok = green ●, warn = orange ●, error = red ● */
function updateLiveBadge(){
  const b=$('#btn-live'); if(!b) return;
  const col={off:'var(--txt-faint)', ok:'#4caf50', warn:'#ff9800', error:'#f44336'}[LIVE_STATUS] || 'var(--txt-faint)';
  const dot = LIVE_ON ? '●' : '○';
  b.innerHTML = `<span style="color:${col};font-size:13px;line-height:1">${dot}</span> Live`;
  b.classList.toggle('primary', LIVE_ON && LIVE_STATUS==='ok');
  b.title = {off:T('Live data uit — klik om aan te zetten','Live data off — click to enable'),
             ok:T('Live verbonden met Home Assistant','Live connected to Home Assistant'),
             warn:T('Live aan, maar geen/onvolledige data','Live on, but no/incomplete data'),
             error:T('Live verbinding mislukt','Live connection failed')}[LIVE_STATUS] || 'Live';
}

async function boot(){
  renderProfiles();
  applyTheme();
  editScreen='main'; { const ss=$('#screen-select'); if(ss) ss.value='main'; }
  // one-time: give every profile a visible default waiting screen + waitEnabled flag
  { const p=profile(); if(p){
      if(p.waitEnabled===undefined) p.waitEnabled=true;
      if(!p._waitSeeded){
        if(p.waitEnabled!==false && (!p.waitElements || !p.waitElements.length)) p.waitElements=[makeWaitText(p)];
        p._waitSeeded=true; persist();
      }
  } }
  // migrate existing text elements: infer text vs value role from their source
  migrateTextRoles();
  { const we=profile()?profile().waitEnabled!==false:true;
    const ss=$('#screen-select'); const wopt=ss&&ss.querySelector('option[value="wait"]'); if(wopt) wopt.disabled=!we; }
  const gs=$('#grid-size'); if(gs) gs.value=String(gridStep());
  injectGoogleFonts();
  try{ await registerUploadedFonts(); }catch(e){ console.warn(e); }
  initStage();
  selectedId=null;
  zoom=1; applyZoom();                 // default to 100% (use "Passend" to fit)
  renderCanvas(); renderLayers(); renderInspector();
  updateLiveBadge();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>renderCanvas());
  // Check add-on API + live data (fire-and-forget to keep boot fast)
  fetch('api/info').then(r=>r.json()).then(info=>{
    if(!info) return;
    if(info.version){ window.APP_VERSION=info.version; const bv=$('#brand-version'); if(bv) bv.textContent='v'+info.version; }
    if(info.app){ SERVER_STORAGE=true; syncProfilesToServer(); }
    // Apply add-on language/theme options BEFORE any toast fires
    if(info.language){ window.ADDON_LANGUAGE=info.language; if(window.haRefreshLang) window.haRefreshLang(); }
    if(info.theme){ window.ADDON_THEME=info.theme; if(window.haTheme) window.haTheme.apply(window.haTheme.detect()); }
    if(info.live_data){ refreshLive(); }
  }).catch(()=>{});
}

async function startup(){
  loadState();
  // One-time: detect add-on, apply language/theme, load profiles from storage
  try{
    const info=await fetch('api/info').then(r=>r.json());
    if(info && info.version){ window.APP_VERSION=info.version; const bv=$('#brand-version'); if(bv) bv.textContent='v'+info.version; }
    if(info && info.app){
      SERVER_STORAGE=true;
      if(info.language){ window.ADDON_LANGUAGE=info.language; if(window.haRefreshLang) window.haRefreshLang(); }
      if(info.theme){ window.ADDON_THEME=info.theme; if(window.haTheme) window.haTheme.apply(window.haTheme.detect()); }
      await loadProfilesFromServer();
    }
  }catch(e){ /* standalone / offline — fall back to localStorage */ }
  wire();
  boot();
}

try{ startup(); }
catch(e){ showFatal('Opstartfout: '+e.message); throw e; }

/* custom tooltips: take over the native `title` so every tooltip has the same
   1px border. The title is moved to data-tt (suppressing the OS tooltip). */
(function(){
  let tip=null, cur=null, timer=null, lastE=null;
  function ensure(){ if(!tip){ tip=document.createElement('div'); tip.id='app-tooltip'; document.body.appendChild(tip); } return tip; }
  function hide(){ clearTimeout(timer); if(tip) tip.classList.remove('show'); cur=null; }
  function place(e){ if(!e||!tip) return; const pad=14, r=tip.getBoundingClientRect();
    let x=e.clientX+pad, y=e.clientY+pad;
    if(x+r.width>window.innerWidth-4) x=e.clientX-r.width-pad;
    if(y+r.height>window.innerHeight-4) y=e.clientY-r.height-pad;
    tip.style.left=Math.max(4,x)+'px'; tip.style.top=Math.max(4,y)+'px'; }
  document.addEventListener('mouseover', e=>{
    const el=e.target.closest && e.target.closest('[title],[data-tt]'); if(!el || el===cur) return;
    let text=el.getAttribute('title');
    if(text){ el.setAttribute('data-tt', text); el.removeAttribute('title'); }   // freshest (handles lang switch)
    else text=el.getAttribute('data-tt');
    if(!text){ return; }
    cur=el; const t=ensure(); t.textContent=text; lastE=e;
    clearTimeout(timer); timer=setTimeout(()=>{ t.classList.add('show'); place(lastE); }, 300);
  });
  document.addEventListener('mousemove', e=>{ lastE=e; if(cur && tip && tip.classList.contains('show')) place(e); });
  document.addEventListener('mouseout', e=>{ if(cur && e.target.closest && e.target.closest('[data-tt]')===cur) hide(); });
  document.addEventListener('mousedown', hide);
  window.addEventListener('blur', hide);
})();
