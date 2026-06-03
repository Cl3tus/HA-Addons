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
/* i18n helper — delegates to lang.js if present, else returns the Dutch text */
const T = (nl,en) => (window.t ? window.t(nl,en) : nl);

/* ---------------- seed profile (Paul's aquarium config) ---------------- */
function seedProfile(name='My display'){
  return {
    id: uid('p'),
    name,
    schema_version: 1,
    device: { name:'aquarium-display', comment:'Aquarium Display',
              model:'7.50in-bv3', rotation:90, w:480, h:800, bg:'#d4d6d7' },
    fonts: [
      f('font_small_book','local','fonts/GothamRnd-Book.ttf',null,null,18,false),
      f('digital_face','local','fonts/digital.ttf',null,null,60,true),
      f('digital_face_small','local','fonts/digital.ttf',null,null,30,true,' -°0123456789C.w:UR%L/at'),
      f('font_boven','gfonts',null,'Noto Sans Display',900,35,false),
      f('font_klein','gfonts',null,'Roboto',400,25,false),
      f('font_medium','gfonts',null,'Roboto',500,25,false),
      f('font_mdi_large','local','fonts/materialdesignicons-webfont.ttf',null,null,50,false),
      f('font_mdi_medium','local','fonts/materialdesignicons-webfont.ttf',null,null,60,false),
      f('font_mdi_small','local','fonts/materialdesignicons-webfont.ttf',null,null,30,false),
    ],
    colors: [
      c('color_bg',0,0,0,0,'#f4f1e9'),     // background (paper)
      c('color_text',0,0,0,100,'#1d1d1b'), // ink black
      c('red',100,0,0,0,'#d6483b'),        // tri-color red
    ],
    sources: [
      s('aquatemp','sensor.aquarium_esp_aquarium_temperatuur','number',24.6),
      s('aquawatt','sensor.aquarium_main_power','number',38.4),
      s('pumpspeed','sensor.aquarium_filter_current_speed','number',65),
      s('pumpflow','sensor.aquarium_pomp_flow_rate','number',900),
      s('aquaamountlight','sensor.aquarium_uren_licht','number',8),
      s('aquaamountdark','sensor.aquarium_uren_donker','number',16),
      s('phsensor','sensor.aquarium_ph_controller_current_ph','number',6.8),
      s('phtarget','sensor.aquarium_ph_controller_target_ph','number',6.5),
      s('khsensor','sensor.aquarium_ph_controller_kh_value','number',4.2),
      s('aquasunup','input_datetime.aquarium_ochtend','time','08:30:00'),
      s('aquasundown','input_datetime.aquarium_avond','time','21:00:00'),
      s('schoongemaaktop','input_datetime.aquarium_schoongemaakt','time','12:00:00'),
      s('volgendeschoonmaak','sensor.aquarium_schoonmaak_7d','string','3 dagen'),
      s('eten','input_boolean.vissen_gevoerd','bool','off'),
      s('co2state','binary_sensor.aquarium_ph_controller_ph_valve_is_active','bool','on'),
      s('skimmerstate','switch.aquarium_skimmer','bool','on'),
    ],
    elements: [],
    scenarios: [],
    activeScenario: null,
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
let selectedId = null;
let zoom = 1;
let HA_STATES=null, HA_LIVE=false;   // live HA data (add-on build)
let shiftDown = false; // hold Shift to constrain line endpoints to 45° steps
window.addEventListener('keydown', e=>{ if(e.key==='Shift') shiftDown=true; });
window.addEventListener('keyup',   e=>{ if(e.key==='Shift') shiftDown=false; });
window.addEventListener('blur',    ()=>{ shiftDown=false; });

function profile(){ return state.profiles.find(p=>p.id===state.current); }
function els(){ return profile().elements; }
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
function snapshot(){ return JSON.stringify(profile().elements); }
function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>60) undoStack.shift(); redoStack=[]; }
function undo(){ if(!undoStack.length) return; redoStack.push(snapshot()); profile().elements = JSON.parse(undoStack.pop()); afterChange(); }
function redo(){ if(!redoStack.length) return; undoStack.push(snapshot()); profile().elements = JSON.parse(redoStack.pop()); afterChange(); }

function afterChange(){ persist(); renderCanvas(); renderLayers(); renderInspector(); if($('#code-drawer').classList.contains('open')) renderCode(); }

/* ============================================================
   FONT LOADING (preview)
   ============================================================ */
function previewFamily(font){
  if(/materialdesignicons/i.test(font.file||'')) return 'Material Design Icons';
  if(font.dataUrl) return 'pf_'+font.id;
  if(font.kind==='gfonts') return font.family;
  // local font not uploaded yet -> fallback
  if(/digital/i.test(font.file||'')) return 'IBM Plex Mono';
  return 'IBM Plex Sans';
}
function fontLoaded(font){
  return /materialdesignicons/i.test(font.file||'') || !!font.dataUrl || font.kind==='gfonts';
}
function injectGoogleFonts(){
  /* Add-on build: preview display fonts (Noto/Roboto) and IBM Plex are bundled
     locally via vendor/fonts.css, so no external Google Fonts request is made. */
  return;
}
async function registerUploadedFonts(){
  for(const font of profile().fonts){
    if(font.dataUrl){
      try{
        const ff = new FontFace('pf_'+font.id, `url(${font.dataUrl})`);
        await ff.load(); document.fonts.add(ff);
      }catch(e){ console.warn('font load',font.id,e); }
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
  const p = profile();
  if(p.activeScenario){
    const sc = p.scenarios.find(s=>s.id===p.activeScenario);
    if(sc && sc.values && sc.values[src.id]!=null) return sc.values[src.id];
  }
  // live HA value (add-on) takes precedence over the static sample when available
  if(typeof HA_LIVE!=='undefined' && HA_LIVE && src.live!=null && src.live!=='') return src.live;
  return src.sample;
}
function transformPreview(el, val){
  const t = el.transform||'none', a = el.transformArg||{};
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
  return (fmt.prefix||'') + body + (fmt.suffix||'');
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
  return String(fmt||'%H:%M')
    .replace(/%H/g,p2(d.getHours())).replace(/%M/g,p2(d.getMinutes())).replace(/%S/g,p2(d.getSeconds()))
    .replace(/%d/g,p2(d.getDate())).replace(/%m/g,p2(d.getMonth()+1)).replace(/%Y/g,d.getFullYear())
    .replace(/%%/g,'%');
}

/* condition evaluation (preview) */
function condResult(el){
  const cd = el.condition;
  if(!cd || !cd.enabled || !cd.sourceId) return null;
  const src = srcById(cd.sourceId);
  let v = src ? src.sample : null;
  const p=profile();
  if(p.activeScenario){ const sc=p.scenarios.find(s=>s.id===p.activeScenario); if(sc&&sc.values&&sc.values[cd.sourceId]!=null) v=sc.values[cd.sourceId]; }
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
  stage.on('click tap', e=>{ if(e.target===stage){ select(null); } });
  applyZoom();
}
function applyZoom(){
  const p=profile();
  $('#konva-host').style.width = p.device.w+'px';
  $('#konva-host').style.height = p.device.h+'px';
  stage.width(p.device.w); stage.height(p.device.h);
  $('#stage-frame').style.transform = `scale(${zoom})`;
  $('#stage-frame').style.transformOrigin='center top';
  $('#stage-frame').style.background = p.device.bg || '#d4d6d7';
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
    node = new Konva.Rect({x:E.x,y:E.y,width:E.w,height:E.h,
      stroke:E.filled?undefined:color.css, strokeWidth:1,
      fill:E.filled?color.css:'rgba(0,0,0,0.001)'});
  }
  else if(E.type==='circle'){
    node = new Konva.Circle({x:E.x,y:E.y,radius:E.r,
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
    const gap=hasIcon?(E.clock.iconGap||40):0;
    txtNode.x(gap); txtNode.y((midH-txtNode.height())/2); g.add(txtNode);
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
        if(tr.lineType==='STEPLINE'){ yy=E.y+E.h*(0.5-0.32*Math.sin(Math.floor(i/4)*4/n*Math.PI*2+ti)); }
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
    node=g;
  }
  if(!node) return null;
  node._elId = el.id;
  node.draggable(true);
  node.on('mousedown touchstart', ()=>selectNode(el, node));
  node.on('dragstart', ()=>{ pushUndo(); if(selectionVisual) selectionVisual.hide(); });
  node.on('dragend', ()=>{
    // translate node movement back to element anchor coords
    if(el.type==='line'){
      const dx=node.x(), dy=node.y();
      el.x+=dx; el.y+=dy; el.x2+=dx; el.y2+=dy; node.position({x:0,y:0});
    } else if(el.type==='rect'||el.type==='circle'){
      el.x=Math.round(node.x()); el.y=Math.round(node.y());
    } else if(el.type==='graph' || el.type==='clock'){
      // groups whose children use absolute coords: node.x()/y() is the drag delta
      const dx=node.x(), dy=node.y();
      el.x=Math.round(el.x+dx); el.y=Math.round(el.y+dy); node.position({x:0,y:0});
    } else {
      const w=node.width(), h=node.height();
      const {ox,oy}=anchorOffset(el.anchor||'TOP_LEFT', w, h);
      el.x=Math.round(node.x()-ox); el.y=Math.round(node.y()-oy);
    }
    if($('#tg-snap').checked) snapEl(el);
    afterChange();
  });
  return node;
}
function snapEl(el){
  const g=gridStep();
  if(el.type==='line'){
    const sx=Math.round(el.x/g)*g-el.x, sy=Math.round(el.y/g)*g-el.y;
    el.x+=sx; el.y+=sy; el.x2+=sx; el.y2+=sy; // shift both endpoints equally -> angle preserved
  } else {
    el.x=Math.round(el.x/g)*g; el.y=Math.round(el.y/g)*g;
  }
}

/* attach selection visuals (resize handles for rect/circle, dashed outline otherwise)
   to an existing node WITHOUT rebuilding the layer — keeps an in-progress drag alive */
function attachSelection(el, node){
  if(transformer){ try{transformer.destroy();}catch(e){} transformer=null; }
  if(selectionVisual){ try{selectionVisual.destroy();}catch(e){} selectionVisual=null; }
  if(!node) return;
  if(el.type==='rect'||el.type==='circle'){
    transformer=new Konva.Transformer({rotateEnabled:false,borderStroke:'#e8a13a',anchorStroke:'#e8a13a',anchorFill:'#fff',anchorSize:7});
    contentLayer.add(transformer); transformer.nodes([node]);
    node.off('transformend.sel'); node.on('transformend.sel',()=>{ pushUndo();
      if(el.type==='rect'){ el.w=Math.round(node.width()*node.scaleX()); el.h=Math.round(node.height()*node.scaleY()); }
      else { el.r=Math.round(node.radius()*node.scaleX()); }
      node.scaleX(1); node.scaleY(1); el.x=Math.round(node.x()); el.y=Math.round(node.y()); afterChange(); });
  } else if(el.type==='graph'){
    // outline + bottom-right resize handle (keeps top-left anchored)
    const g=new Konva.Group();
    g.add(new Konva.Rect({x:el.x,y:el.y,width:el.w,height:el.h,stroke:'#e8a13a',strokeWidth:1,dash:[4,3],listening:false}));
    const hb=new Konva.Circle({x:el.x+el.w,y:el.y+el.h,radius:6,fill:'#fff',stroke:'#e8a13a',strokeWidth:2,draggable:true});
    hb.on('mousedown touchstart',e=>{e.cancelBubble=true;});
    hb.on('dragstart',e=>{e.cancelBubble=true; pushUndo();});
    hb.on('dragmove',e=>{e.cancelBubble=true; el.w=Math.max(40,Math.round(hb.x()-el.x)); el.h=Math.max(30,Math.round(hb.y()-el.y)); renderCanvasKeepSel(el);});
    hb.on('dragend',e=>{e.cancelBubble=true; afterChange();});
    g.add(hb); contentLayer.add(g); selectionVisual=g;
  } else if(el.type==='line'){
    // one draggable handle per endpoint -> move endpoints, make vertical, resize
    const g=new Konva.Group();
    const handle=(px,py,which)=>{
      const h=new Konva.Circle({x:px,y:py,radius:6,fill:'#fff',stroke:'#e8a13a',strokeWidth:2,draggable:true});
      h.on('mousedown touchstart', e=>{ e.cancelBubble=true; });
      h.on('dragstart', e=>{ e.cancelBubble=true; pushUndo(); });
      h.on('dragmove', e=>{ e.cancelBubble=true;
        let mx=h.x(), my=h.y();
        if(shiftDown){ // lock to nearest 45° relative to the fixed endpoint
          const fx = which==='a'? el.x2 : el.x;
          const fy = which==='a'? el.y2 : el.y;
          const dx=mx-fx, dy=my-fy, dist=Math.hypot(dx,dy), step=Math.PI/4;
          const ang=Math.round(Math.atan2(dy,dx)/step)*step;
          mx=fx+Math.cos(ang)*dist; my=fy+Math.sin(ang)*dist;
          h.x(mx); h.y(my); // keep handle on the constrained line
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
    g.add(handle(el.x,el.y,'a')); g.add(handle(el.x2,el.y2,'b'));
    contentLayer.add(g); selectionVisual=g;
  } else {
    const b=node.getClientRect({relativeTo:contentLayer});
    selectionVisual=new Konva.Rect({x:b.x-3,y:b.y-3,width:b.width+6,height:b.height+6,
      stroke:'#e8a13a',strokeWidth:1,dash:[4,3],listening:false});
    contentLayer.add(selectionVisual);
  }
}
/* lightweight select used when clicking a node on the canvas (no full rebuild) */
function selectNode(el, node){
  selectedId=el.id;
  attachSelection(el, node);
  contentLayer.draw();
  renderLayers(); renderInspector();
}

function renderCanvas(){
  if(!stage) return;
  drawGrid();
  contentLayer.destroyChildren();
  transformer=null; selectionVisual=null;
  els().forEach(el=>{ const n=buildNode(el); if(n) contentLayer.add(n); });
  const sel=selected();
  if(sel){ const selNode=contentLayer.getChildren(n=>n._elId===selectedId)[0]; if(selNode) attachSelection(sel, selNode); }
  contentLayer.draw();
  if($('#tg-eink').checked) renderEink(); else $('#stage-frame').classList.remove('eink-on');
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
  const cv=$('#eink-canvas'); cv.width=p.device.w; cv.height=p.device.h;
  cv.style.width=p.device.w+'px'; cv.style.height=p.device.h+'px';
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
function select(id){ selectedId=id; renderCanvas(); renderLayers(); renderInspector(); }

function renderLayers(){
  const box=$('#layers'); box.innerHTML='';
  $('#layer-count').textContent = els().length;
  // top of list = top of z-order (draw last) -> reverse
  els().slice().reverse().forEach(el=>{
    const row=document.createElement('div');
    row.className='layer'+(el.id===selectedId?' sel':'')+(el.visible===false?' hidden':'');
    row.innerHTML=`<span class="ltype">${typeGlyph(el.type)}</span>
      <span class="lname" title="Dubbelklik om te hernoemen">${el.name||el.type}</span>
      <span class="lvis" title="Zichtbaarheid">${el.visible===false?'🚫':'👁'}</span>`;
    const nameEl=row.querySelector('.lname');
    let clickTimer=null;
    nameEl.onclick=()=>{ if(clickTimer) return; clickTimer=setTimeout(()=>{ clickTimer=null; select(el.id); }, 220); };
    nameEl.ondblclick=(e)=>{ e.stopPropagation(); if(clickTimer){ clearTimeout(clickTimer); clickTimer=null; } startRename(nameEl, el); };
    row.querySelector('.ltype').onclick=()=>select(el.id);
    row.querySelector('.lvis').onclick=(e)=>{e.stopPropagation(); pushUndo(); el.visible=el.visible===false?true:false; afterChange();};
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
function typeGlyph(t){ return {text:'T',icon:'◈',line:'╱',rect:'▢',circle:'◯',wifi:'⌁',clock:'◔',graph:'⊿'}[t]||'•'; }

/* ============================================================
   ADD ELEMENTS
   ============================================================ */
function addElement(type, pos){
  pushUndo();
  const p=profile();
  const cx = pos ? clamp(Math.round(pos.x),0,p.device.w) : Math.round(p.device.w/2);
  const cy = pos ? clamp(Math.round(pos.y),0,p.device.h) : 120;
  const base={ id:uid(), type, name:elName(type), visible:true,
    x:cx, y:cy, colorId:'color_text', anchor:'TOP_CENTER',
    condition:{enabled:false,sourceId:'',op:'on',val:'',val2:'',
               whenTrue:{text:'',iconName:'',iconHex:'',colorId:'',visible:true},
               whenFalse:{text:'',iconName:'',iconHex:'',colorId:'',visible:true}} };
  if(type==='text'){
    Object.assign(base,{ fontId:'font_klein',
      source:{kind:'static',text:'Tekst',sourceId:'',expr:''},
      format:{mode:'builder',decimals:1,prefix:'',suffix:'',raw:'%s'}, transform:'none', transformArg:{} });
  } else if(type==='icon'){
    Object.assign(base,{ fontId:'font_mdi_large', iconName:'thermometer-water', iconHex:'F1A80' });
  } else if(type==='line'){
    Object.assign(base,{ x:cx-80,y:cy,x2:cx+80,y2:cy, colorId:'color_text', anchor:undefined });
  } else if(type==='rect'){
    Object.assign(base,{ x:cx-80,y:cy-40, w:160,h:80, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='circle'){
    Object.assign(base,{ x:cx,y:cy, r:40, filled:false, colorId:'color_text', anchor:undefined });
  } else if(type==='widget'){
    // convenience: stamp an icon + a value pair (two independent elements)
    const icon={...base, id:uid(), type:'icon', name:'Widget-icoon', fontId:'font_mdi_large',
                iconName:'thermometer-water', iconHex:'F1A80', x:cx-60, y:cy, anchor:'TOP_CENTER'};
    const val ={...base, id:uid(), type:'text', name:'Widget-waarde', fontId:'digital_face',
                x:cx+30, y:cy, anchor:'TOP_CENTER',
                source:{kind:'sensor',sourceId:'aquatemp',text:'',expr:''},
                format:{mode:'builder',decimals:1,prefix:'',suffix:'°C',raw:'%s'}, transform:'none', transformArg:{},
                condition:JSON.parse(JSON.stringify(base.condition))};
    els().push(icon, val); selectedId=val.id; afterChange(); toast(T('Widget toegevoegd (icoon + waarde)','Widget added (icon + value)')); return;
  } else if(type==='wifi'){
    Object.assign(base,{ fontId:'font_mdi_small', anchor:'TOP_CENTER', colorId:'color_text',
      // signal thresholds (dBm) -> MDI hex, strongest first; matches your test code
      wifi:{ sourceId:'', levels:[
        {min:-50, hex:'F0928'}, {min:-60, hex:'F0925'}, {min:-67, hex:'F0922'},
        {min:-70, hex:'F091F'}, {min:-999, hex:'F092B'} ] } });
  } else if(type==='clock'){
    Object.assign(base,{ fontId:'font_small_book', anchor:'TOP_CENTER', colorId:'color_text',
      clock:{ strftime:'%H:%M', icon:true, iconHex:'F044C', iconFontId:'font_mdi_small', iconGap:40 } });
  } else if(type==='graph'){
    Object.assign(base,{ x:cx-150,y:cy, w:300,h:140, colorId:'color_text', anchor:undefined,
      graph:{ duration:'1h', x_grid:'10min', y_grid:5, border:true,
        min_range:'', max_range:'',
        traces:[{sourceId:'aquatemp', lineType:'SOLID', thickness:2, continuous:true, colorId:'color_text'}],
        axes:{ show:false, fontId:'font_klein', yTitle:'', xTitle:'', showYScale:true, showXScale:true } } });
  }
  els().push(base); selectedId=base.id; afterChange();
}
function elName(t){ const n=els().filter(e=>e.type===t).length+1;
  return ({text:'Tekst',icon:'Icoon',line:'Lijn',rect:'Rechthoek',circle:'Cirkel',wifi:'WiFi',clock:'Klok',graph:'Grafiek'}[t]||'Element')+' '+n; }

function deleteSel(){ if(!selectedId) return; pushUndo(); profile().elements=els().filter(e=>e.id!==selectedId); selectedId=null; afterChange(); }
function dupSel(){ const e=selected(); if(!e) return; pushUndo(); const cp=JSON.parse(JSON.stringify(e)); cp.id=uid(); cp.x+=14; cp.y+=14; if(cp.x2!=null){cp.x2+=14;cp.y2+=14;} cp.name=(e.name||e.type)+' kopie'; els().push(cp); selectedId=cp.id; afterChange(); }

/* point 7: align the selected element to the canvas edges/centre.
   Works on the element's rendered bounding box, then shifts the element by a delta. */
function alignSel(how){
  const el=selected(); if(!el){ toast(T('Selecteer eerst een element','Select an element first')); return; }
  const p=profile();
  const node=contentLayer.getChildren(n=>n._elId===el.id)[0];
  if(!node) return;
  const b=node.getClientRect({relativeTo:contentLayer});
  let dx=0, dy=0;
  if(how==='left')    dx=-b.x;
  if(how==='right')   dx=(p.device.w-(b.x+b.width));
  if(how==='hcenter') dx=(p.device.w/2-(b.x+b.width/2));
  if(how==='top')     dy=-b.y;
  if(how==='bottom')  dy=(p.device.h-(b.y+b.height));
  if(how==='vcenter') dy=(p.device.h/2-(b.y+b.height/2));
  pushUndo();
  el.x=Math.round(el.x+dx); el.y=Math.round(el.y+dy);
  if(el.type==='line'){ el.x2=Math.round(el.x2+dx); el.y2=Math.round(el.y2+dy); }
  afterChange();
}

/* ============================================================
   INSPECTOR
   ============================================================ */
function renderInspector(){
  const host=$('#inspector'); const el=selected();
  if(!el){ host.innerHTML='<div class="inspector-empty">'+T('Selecteer een element op het canvas','Select an element on the canvas')+'<br>'+T('of voeg er een toe.','or add a new one.')+'</div>'; return; }
  let h='';
  h+=g('Element',`
    <div class="row"><div><label class="fld">Naam</label><input data-k="name" type="text" value="${attr(el.name)}"></div></div>`);

  // geometry
  if(el.type==='line'){
    h+=g('Positie',`<div class="row"><div><label class="fld">X1</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y1</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">X2</label><input data-k="x2" type="number" value="${el.x2}"></div><div><label class="fld">Y2</label><input data-k="y2" type="number" value="${el.y2}"></div></div>`);
  } else if(el.type==='rect'){
    h+=g('Positie & maat',`<div class="row"><div><label class="fld">X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">Breedte</label><input data-k="w" type="number" value="${el.w}"></div><div><label class="fld">Hoogte</label><input data-k="h" type="number" value="${el.h}"></div></div>
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> Gevuld</label>`);
  } else if(el.type==='circle'){
    h+=g('Positie & maat',`<div class="row"><div><label class="fld">Midden X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Midden Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">Straal</label><input data-k="r" type="number" value="${el.r}"></div></div>
      <label class="toggle"><input type="checkbox" data-k="filled" ${el.filled?'checked':''}> Gevuld</label>`);
  } else if(el.type==='graph'){
    h+=g('Positie & maat',`<div class="row"><div><label class="fld">X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <div class="row"><div><label class="fld">Breedte</label><input data-k="w" type="number" value="${el.w}"></div><div><label class="fld">Hoogte</label><input data-k="h" type="number" value="${el.h}"></div></div>`);
  } else {
    h+=g('Positie & uitlijning',`<div class="row"><div><label class="fld">Anker X</label><input data-k="x" type="number" value="${el.x}"></div><div><label class="fld">Anker Y</label><input data-k="y" type="number" value="${el.y}"></div></div>
      <label class="fld">Uitlijning (TextAlign)</label>${anchorGrid(el)}`);
  }

  // font + color
  let style='';
  if(el.type==='text'||el.type==='icon'||el.type==='wifi'||el.type==='clock'){
    style+=`<div class="row"><div><label class="fld">Font</label><select data-k="fontId">${fontOpts(el.fontId)}</select></div></div>`;
    const font=fontById(el.fontId);
    if(font && !fontLoaded(font)) style+=`<div class="hint">⚠ Font "${font.file}" nog niet geüpload — preview is bij benadering. Upload via “Fonts &amp; kleuren”.</div>`;
  }
  if(el.type!=='graph') style+=`<div class="row"><div><label class="fld">Kleur</label>${colorSwatches(el.colorId,'colorId')}</div></div>`;
  h+=g('Stijl',style);

  // icon
  if(el.type==='icon'){
    h+=g('Icoon',`<div class="row" style="align-items:center">
      <div style="flex:none"><span class="mdi mdi-${el.iconName}" style="font-size:34px"></span></div>
      <div><div class="mono" style="margin-bottom:4px">mdi-${el.iconName} · ${el.iconHex}</div>
      <button class="btn sm" id="pick-icon">Icoon kiezen…</button></div></div>`);
  }

  // value source + format + transform (text only)
  if(el.type==='text'){
    h+=g('Waardebron', sourceEditor(el));
    h+=g('Format & transform', formatEditor(el));
  }

  // wifi smart element
  if(el.type==='wifi'){
    const w=el.wifi||{};
    h+=g('WiFi-signaal',`
      <div class="row"><div><label class="fld">Signaalbron (optioneel, voor preview)</label><select data-wifi="sourceId">${srcOpts(w.sourceId,true)}</select></div></div>
      <div class="hint">Bij export wordt <span class="mono">id(wifisignal)</span> gebruikt (de diagnostische sensor die de editor genereert). De bron hierboven bepaalt alleen welke staaf je nu in de preview ziet.</div>
      <label class="fld" style="margin-top:8px">Drempels (dBm → icoon)</label>
      ${(w.levels||[]).map((lv,i)=>`<div class="row tight" style="align-items:center">
        <div><input data-wifilv="${i}.min" type="number" value="${lv.min}" title="≥ dBm"></div>
        <div style="flex:none"><span class="mdi" style="font-size:22px">${mdiChar(lv.hex)}</span></div>
        <div><input data-wifilv="${i}.hex" type="text" class="mono" value="${attr(lv.hex)}"></div>
      </div>`).join('')}
      <div class="hint">Sterkste drempel bovenaan. De laatste regel (laagste dBm) is de "geen signaal"-staaf.</div>`);
  }

  // clock smart element
  if(el.type==='clock'){
    const c=el.clock||{};
    h+=g('Refresh-klok',`
      <div class="row"><div><label class="fld">Tijdformaat (strftime)</label><input data-clock="strftime" class="mono" type="text" value="${attr(c.strftime||'%H:%M')}"></div></div>
      <div class="hint">Toont het tijdstip van de laatste schermverversing via <span class="mono">id(homeassistant_time)</span>. Bv. <span class="mono">%H:%M</span> of <span class="mono">%d-%m %H:%M</span>.</div>
      <label class="toggle" style="margin-top:8px"><input type="checkbox" data-clock="icon" ${c.icon?'checked':''}> Klok-icoon ervoor</label>
      ${c.icon?`<div class="row" style="align-items:center;margin-top:6px">
        <div style="flex:none"><span class="mdi" style="font-size:22px">${mdiChar(c.iconHex)}</span></div>
        <div><button class="btn sm" id="pick-clock-icon">Icoon…</button></div>
        <div><label class="fld">Tekst-offset (px)</label><input data-clock="iconGap" type="number" value="${c.iconGap??40}"></div>
      </div>
      <div class="row"><div><label class="fld">Icoon-font</label><select data-clock="iconFontId">${fontOpts(c.iconFontId)}</select></div></div>`:''}`);
  }

  // graph smart element
  if(el.type==='graph'){
    const gr=el.graph||{traces:[]};
    const ax=gr.axes||{};
    h+=g('Grafiek — algemeen',`
      <div class="row tight"><div><label class="fld">Duur (X-as)</label><input data-graph="duration" class="mono" type="text" value="${attr(gr.duration||'1h')}"></div>
        <div><label class="fld">X-raster</label><input data-graph="x_grid" class="mono" type="text" value="${attr(gr.x_grid||'10min')}"></div></div>
      <div class="row tight"><div><label class="fld">Y-raster</label><input data-graph="y_grid" type="number" step="any" value="${gr.y_grid??5}"></div>
        <div><label class="fld">Y-min</label><input data-graph="min_range" type="number" step="any" value="${attr(gr.min_range)}" placeholder="auto"></div>
        <div><label class="fld">Y-max</label><input data-graph="max_range" type="number" step="any" value="${attr(gr.max_range)}" placeholder="auto"></div></div>
      <div class="hint">Y-min/Y-max leeg = ESPHome schaalt automatisch. Vul beide voor een vaste Y-schaal.</div>
      <label class="toggle" style="margin-top:6px"><input type="checkbox" data-graph="border" ${gr.border!==false?'checked':''}> Rand tekenen</label>`);

    h+=g('Grafiek — traces (stijlen)',`
      ${(gr.traces||[]).map((t,i)=>`<div class="cond-box">
        <div class="row"><div><label class="fld">Sensor</label><select data-trace="${i}.sourceId">${srcOpts(t.sourceId,true)}</select></div></div>
        <div class="row tight"><div><label class="fld">Lijntype</label><select data-trace="${i}.lineType">
          ${['SOLID','DOTTED','DASHED','STEPLINE'].map(o=>`<option ${t.lineType===o?'selected':''}>${o}</option>`).join('')}</select></div>
          <div><label class="fld">Dikte</label><input data-trace="${i}.thickness" type="number" min="1" max="10" value="${t.thickness??2}"></div></div>
        <div class="row tight"><div><label class="fld">Kleur</label><select data-trace="${i}.colorId">${profile().colors.map(c=>`<option value="${c.id}" ${t.colorId===c.id?'selected':''}>${c.id}</option>`).join('')}</select></div>
          <div style="display:flex;align-items:flex-end"><label class="toggle"><input type="checkbox" data-trace="${i}.continuous" ${t.continuous!==false?'checked':''}> Continu</label></div></div>
        ${(gr.traces.length>1)?`<button class="btn ghost sm danger" data-trace-del="${i}">Trace verwijderen</button>`:''}
      </div>`).join('')}
      <button class="btn sm" id="trace-add" style="margin-top:8px">+ Trace toevoegen</button>
      <div class="hint">Elke trace heeft een eigen lijntype, dikte en kleur. Alleen numerieke sensoren zijn zinvol.</div>`);

    h+=g('Grafiek — assen & labels',`
      <label class="toggle"><input type="checkbox" data-axes="show" ${ax.show?'checked':''}> As-labels tekenen (via lambda-tekst)</label>
      ${ax.show?`
      <div class="row"><div><label class="fld">Label-font</label><select data-axes="fontId">${fontOpts(ax.fontId)}</select></div></div>
      <div class="row tight"><div><label class="fld">Y-as titel</label><input data-axes="yTitle" type="text" value="${attr(ax.yTitle)}" placeholder="bv. °C"></div>
        <div><label class="fld">X-as titel</label><input data-axes="xTitle" type="text" value="${attr(ax.xTitle)}" placeholder="bv. tijd"></div></div>
      <label class="toggle"><input type="checkbox" data-axes="showYScale" ${ax.showYScale!==false?'checked':''}> Y-schaal tonen (min/max)</label>
      <label class="toggle"><input type="checkbox" data-axes="showXScale" ${ax.showXScale!==false?'checked':''}> X-schaal tonen (0 … −duur)</label>
      <div class="hint">Y-schaalwaarden (min/midden/max) verschijnen alleen als je hierboven bij “Algemeen” een vaste <b>Y-min én Y-max</b> hebt ingevuld. Bij auto-schaal kent de editor de werkelijke grenzen niet.</div>`:`
      <div class="hint">ESPHome's <span class="mono">graph:</span> tekent zelf geen astitels of schaalwaarden. Zet dit aan om ze als tekst rond de grafiek te genereren.</div>`}`);
  }

  // condition (text + icon)
  if(el.type==='text'||el.type==='icon'){
    h+=g('Conditie (if / else)', condEditor(el));
  }

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
  let h=`<div class="row"><div><label class="fld">Type bron</label>
    <select data-src="kind">
      <option value="static" ${sc.kind==='static'?'selected':''}>Vaste tekst</option>
      <option value="sensor" ${sc.kind==='sensor'?'selected':''}>Sensorwaarde</option>
      <option value="expr"   ${sc.kind==='expr'?'selected':''}>Vrije expressie</option>
    </select></div></div>`;
  if(sc.kind==='static') h+=`<div class="row"><div><label class="fld">Tekst</label><input data-src="text" type="text" value="${attr(sc.text)}"></div></div>`;
  else if(sc.kind==='sensor') h+=`<div class="row"><div><label class="fld">Sensor</label><select data-src="sourceId">${srcOpts(sc.sourceId,true)}</select></div></div>`;
  else h+=`<div class="row"><div><label class="fld">C++ expressie</label><input data-src="expr" class="mono" type="text" value="${attr(sc.expr)}" placeholder="id(x).state"></div></div><div class="hint">Wordt rauw in printf gezet. Gebruik <span class="mono">%s</span>/<span class="mono">%f</span> in de format.</div>`;
  return h;
}
const SUFFIX_PRESETS=['','°C','°F','%','W','kW','kWh','Wh','V','A','mA','Hz','bar','pH','ppm','L','L/u','mL','m³','g','kg','lux','dB','rpm','x','€','s','min','u'];
const PREFIX_PRESETS=['','€ ','$ ','~','± ','# '];
function affixControl(which, val){
  const presets = which==='suffix'?SUFFIX_PRESETS:PREFIX_PRESETS;
  const known = presets.includes(val);
  const opts = presets.map(p=>`<option value="${attr(p)}" ${known&&p===val?'selected':''}>${p===''?'(geen)':p}</option>`).join('')
             + `<option value="__custom__" ${!known?'selected':''}>Aangepast…</option>`;
  let h=`<select data-affix-sel="${which}">${opts}</select>`;
  h+=`<input data-affix-custom="${which}" type="text" value="${attr(val)}" placeholder="eigen tekst" style="margin-top:5px;${known?'display:none':''}">`;
  return h;
}
function formatEditor(el){
  const fmt=el.format||{mode:'builder'};
  const kind = el.source&&el.source.kind==='sensor' ? (srcById(el.source.sourceId)||{}).kind : el.source&&el.source.kind;
  let h=`<div class="row"><div><label class="fld">Modus</label><select data-fmt="mode">
      <option value="builder" ${fmt.mode!=='raw'?'selected':''}>Builder</option>
      <option value="raw" ${fmt.mode==='raw'?'selected':''}>Rauwe printf</option></select></div></div>`;
  if(fmt.mode==='raw'){
    h+=`<div class="row"><div><label class="fld">Format string</label><input data-fmt="raw" class="mono" type="text" value="${attr(fmt.raw||'%s')}"></div></div>`;
  } else {
    h+=`<div class="row tight">
      <div><label class="fld">Prefix</label>${affixControl('prefix', fmt.prefix||'')}</div>
      <div><label class="fld">Suffix</label>${affixControl('suffix', fmt.suffix||'')}</div></div>`;
    if(kind==='number') h+=`<div class="row"><div><label class="fld">Decimalen</label><input data-fmt="decimals" type="number" min="0" max="6" value="${fmt.decimals??1}"></div></div>`;
  }
  // transform
  const opts = transformOptions(kind);
  h+=`<div class="row"><div><label class="fld">Transform</label><select data-k2="transform">${opts.map(o=>`<option value="${o[0]}" ${(el.transform||'none')===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div></div>`;
  if(el.transform==='boolLabel'){ const a=el.transformArg||{};
    h+=`<div class="row tight"><div><label class="fld">Label “aan”</label><input data-ta="trueLabel" type="text" value="${attr(a.trueLabel||'Aan')}"></div><div><label class="fld">Label “uit”</label><input data-ta="falseLabel" type="text" value="${attr(a.falseLabel||'Uit')}"></div></div>`; }
  if(el.transform==='scale'){ const a=el.transformArg||{};
    h+=`<div class="row"><div><label class="fld">Factor (×)</label><input data-ta="factor" type="number" step="any" value="${a.factor??1}"></div></div>`; }
  if(el.transform==='roundN'){ const a=el.transformArg||{};
    h+=`<div class="row"><div><label class="fld">Decimalen</label><input data-ta="n" type="number" min="0" max="6" value="${a.n??1}"></div></div>`; }
  h+=`<div class="hint">Preview: <span class="mono">${attr(displayText(el))}</span></div>`;
  return h;
}
function transformOptions(kind){
  if(kind==='number') return [['none','Geen'],['roundN','Afronden op N decimalen'],['scale','Schalen (× factor)']];
  if(kind==='bool')   return [['none','Geen'],['boolLabel','on/off → eigen labels']];
  if(kind==='time')   return [['none','Geen'],['trimSeconds','Tijd → HH:MM']];
  if(kind==='string') return [['none','Geen'],['trimSeconds','Laatste 3 tekens weg'],['boolLabel','on/off → eigen labels']];
  // static
  return [['none','Geen'],['upper','HOOFDLETTERS'],['capitalize','Eerste letter hoofdletter']];
}
function condEditor(el){
  const cd=el.condition||{enabled:false};
  let h=`<label class="toggle"><input type="checkbox" data-cd="enabled" ${cd.enabled?'checked':''}> Conditie gebruiken</label>`;
  if(!cd.enabled) return h;
  h+=`<div class="cond-box">
    <div class="row"><div><label class="fld">Bron</label><select data-cd="sourceId">${srcOpts(cd.sourceId,true)}</select></div></div>
    <div class="row tight"><div><label class="fld">Operator</label><select data-cd="op">
      <option value="on" ${cd.op==='on'?'selected':''}>is aan (on)</option>
      <option value="eq" ${cd.op==='eq'?'selected':''}>= gelijk aan</option>
      <option value="lt" ${cd.op==='lt'?'selected':''}>&lt; kleiner dan</option>
      <option value="gt" ${cd.op==='gt'?'selected':''}>&gt; groter dan</option>
      <option value="between" ${cd.op==='between'?'selected':''}>tussen</option>
    </select></div>`;
  if(cd.op!=='on') h+=`<div><label class="fld">Waarde</label><input data-cd="val" type="text" value="${attr(cd.val)}"></div>`;
  if(cd.op==='between') h+=`<div><label class="fld">… en</label><input data-cd="val2" type="text" value="${attr(cd.val2)}"></div>`;
  h+=`</div>`;
  h+=branchEditor(el,'whenTrue','Als WAAR','t')+branchEditor(el,'whenFalse','Als ONWAAR','f');
  h+=`</div>`;
  return h;
}
function branchEditor(el,key,title,cls){
  const b=el.condition[key]||{};
  let h=`<div class="branch ${cls}"><h5>${title}</h5>`;
  if(el.type==='text') h+=`<div class="row"><div><label class="fld">Tekst (override)</label><input data-br="${key}.text" type="text" value="${attr(b.text)}" placeholder="(leeg = waarde uit bron)"></div></div>`;
  if(el.type==='icon') h+=`<div class="row" style="align-items:center"><div style="flex:none">${b.iconName?`<span class="mdi mdi-${b.iconName}" style="font-size:26px"></span>`:'<span class="hint">geen</span>'}</div><div><button class="btn sm" data-pickbranch="${key}">Icoon…</button></div></div>`;
  h+=`<div class="row"><div><label class="fld">Kleur (override)</label><select data-br="${key}.colorId"><option value="">— geen —</option>${profile().colors.map(c=>`<option value="${c.id}" ${b.colorId===c.id?'selected':''}>${c.id}</option>`).join('')}</select></div></div>`;
  h+=`<label class="toggle"><input type="checkbox" data-br="${key}.visible" ${b.visible!==false?'checked':''}> Zichtbaar</label>`;
  return h+`</div>`;
}

function attr(v){ return v==null?'':String(v).replace(/"/g,'&quot;'); }

/* ---- inspector event binding ---- */
function bindInspector(host, el){
  // generic top-level keys
  host.querySelectorAll('[data-k]').forEach(inp=>{
    inp.addEventListener('change',()=>{ pushUndo(); const k=inp.dataset.k;
      el[k] = inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); });
  });
  host.querySelectorAll('[data-k2]').forEach(inp=>{
    inp.addEventListener('change',()=>{ pushUndo(); el[inp.dataset.k2]=inp.value; el.transformArg={}; afterChange(); });
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
  host.querySelectorAll('[data-fmt]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.format=el.format||{}; el.format[inp.dataset.fmt]= inp.type==='number'?(+inp.value):inp.value; afterChange(); }));
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

  // clock
  host.querySelectorAll('[data-clock]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.clock=el.clock||{}; const k=inp.dataset.clock; el.clock[k]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  const pci=host.querySelector('#pick-clock-icon'); if(pci) pci.addEventListener('click',()=>openIconPicker(sel=>{ pushUndo(); el.clock.iconHex=sel.hex; afterChange(); }));

  // graph
  host.querySelectorAll('[data-graph]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.graph=el.graph||{}; const k=inp.dataset.graph; el.graph[k]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  host.querySelectorAll('[data-trace]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); const [i,prop]=inp.dataset.trace.split('.'); el.graph.traces[+i][prop]= inp.type==='checkbox'?inp.checked:(inp.type==='number'?(+inp.value):inp.value); afterChange(); }));
  host.querySelectorAll('[data-axes]').forEach(inp=>inp.addEventListener('change',()=>{ pushUndo(); el.graph.axes=el.graph.axes||{}; const k=inp.dataset.axes; el.graph.axes[k]= inp.type==='checkbox'?inp.checked:inp.value; afterChange(); }));
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
    t = (fmt.prefix||'')+t+(fmt.suffix||'');
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
  } else {
    let expr=`id(${src.id}).state`;
    if(el.transform==='trimSeconds') expr=`id(${src.id}).state.substr(0, id(${src.id}).state.length() - 3)`;
    if(el.transform==='boolLabel'){ const a=el.transformArg||{};
      arg=`(id(${src.id}).state == "on" ? "${esc(a.trueLabel||'Aan')}" : "${esc(a.falseLabel||'Uit')}")`; token='%s';
      return wrapFmt();
    }
    arg=expr+'.c_str()'; token='%s';
  }
  return wrapFmt();
  function wrapFmt(){
    let f;
    if(fmt.mode==='raw' && fmt.raw) f=fmt.raw;
    else f=escFmt(fmt.prefix||'')+token+escFmt(fmt.suffix||'');
    return {mode:'printf', fmt:f, args:[arg]};
  }
}

function drawStmt(el, indent){
  const I=indent;
  const color = cppColor(el.colorId);
  const anchor = el.anchor||'TOP_LEFT';
  if(el.type==='line') return `${I}it.line(${el.x}, ${el.y}, ${el.x2}, ${el.y2}, ${color});`;
  if(el.type==='rect'){ const fn=el.filled?'filled_rectangle':'rectangle'; return `${I}it.${fn}(${el.x}, ${el.y}, ${el.w}, ${el.h}, ${color});`; }
  if(el.type==='circle'){ const fn=el.filled?'filled_circle':'circle'; return `${I}it.${fn}(${el.x}, ${el.y}, ${el.r}, ${color});`; }
  if(el.type==='graph') return graphDrawCode(el, I);
  if(el.type==='wifi') return wifiCode(el, I, color, anchor);
  if(el.type==='clock') return clockCode(el, I, color, anchor);
  const font=fontById(el.fontId)||{id:'font_klein'};
  if(el.type==='icon') return `${I}it.printf(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "\\U${pad8(el.iconHex||'')}");`;
  // text
  const v=valueExpr(el);
  if(v.mode==='print') return `${I}it.print(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "${esc(v.literal)}");`;
  return `${I}it.printf(${el.x}, ${el.y}, id(${font.id}), ${color}, TextAlign::${anchor}, "${v.fmt}", ${v.args.join(', ')});`;
}
function numFilled(v){ return v!==''&&v!=null&&!isNaN(+v); }
function graphId(el){ return 'graph_'+el.id.replace(/[^a-z0-9_]/gi,''); }
function graphDrawCode(el, I){
  let out=`${I}it.graph(${el.x}, ${el.y}, id(${graphId(el)}));`;
  const gr=el.graph||{}, ax=gr.axes||{};
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
  let out=`${I}// WiFi icoon (${el.name||'wifi'})\n`;
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
function clockCode(el, I, color, anchor){
  const c=el.clock||{}; const font=(fontById(el.fontId)||{id:'font_small_book'}).id;
  // keep horizontal part of the anchor, force vertical CENTER so icon+text share a midline
  const hpart = /LEFT$/.test(anchor)?'LEFT':(/RIGHT$/.test(anchor)?'RIGHT':'CENTER');
  const valign = 'CENTER_'+hpart; // CENTER_LEFT / CENTER / CENTER_RIGHT
  const va = hpart==='CENTER' ? 'CENTER' : valign;
  let out=`${I}// Refresh tijdstempel (${el.name||'klok'})\n`;
  out+=`${I}{\n`;
  out+=`${I}  char ts_${shortId(el)}[24];\n`;
  out+=`${I}  time_t t_${shortId(el)} = id(homeassistant_time).now().timestamp;\n`;
  out+=`${I}  strftime(ts_${shortId(el)}, sizeof(ts_${shortId(el)}), "${esc(c.strftime||'%H:%M')}", localtime(&t_${shortId(el)}));\n`;
  if(c.icon){
    const ifont=(fontById(c.iconFontId)||{id:font}).id;
    out+=`${I}  it.printf(${el.x}, ${el.y}, id(${ifont}), ${color}, TextAlign::${va}, "\\U${pad8(c.iconHex||'F044C')}");\n`;
    out+=`${I}  it.printf(${el.x + (c.iconGap||40)}, ${el.y}, id(${font}), ${color}, TextAlign::${va}, "%s", ts_${shortId(el)});\n`;
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
    // point 1: hidden in layers -> commented out in YAML (kept visible as intent)
    const inner=drawStmt(Object.assign({},el,{visible:true}), '').trim();
    return `${baseIndent}// [verborgen] ${el.name||el.type}: ${inner}`;
  }
  const cd=el.condition;
  if(!cd || !cd.enabled || !cd.sourceId){
    return drawStmt(el, baseIndent);
  }
  const tEl=applyBranch(el, cd.whenTrue||{}), fEl=applyBranch(el, cd.whenFalse||{});
  const tVis=(cd.whenTrue&&cd.whenTrue.visible!==false), fVis=(cd.whenFalse&&cd.whenFalse.visible!==false);
  const I=baseIndent, I2=baseIndent+'  ';
  let out=`${I}if (${condExpr(cd)}) {\n`;
  out += (tVis? drawStmt(tEl,I2):`${I2}// (verborgen)`)+'\n';
  out += `${I}} else {\n`;
  out += (fVis? drawStmt(fEl,I2):`${I2}// (verborgen)`)+'\n';
  out += `${I}}`;
  return out;
}

/* ---- glyph collection ---- */
function collectGlyphs(){
  const map={}; // fontId -> {chars:Set, icons:Map(hex->name), dynamic:bool}
  profile().fonts.forEach(f=>map[f.id]={chars:new Set(), icons:new Map(), dynamic:f.dynamic});
  const addText=(fontId,str)=>{ if(!map[fontId])return; for(const ch of String(str)) map[fontId].chars.add(ch); };
  const addIcon=(fontId,hex,name)=>{ if(!map[fontId]||!hex)return; map[fontId].icons.set(pad8(hex),name||''); };
  els().forEach(el=>{
    const variants=[el];
    if(el.condition&&el.condition.enabled){ variants.push(applyBranch(el,el.condition.whenTrue||{}),applyBranch(el,el.condition.whenFalse||{})); }
    variants.forEach(E=>{
      if(E.type==='icon') addIcon(E.fontId,E.iconHex,E.iconName);
      else if(E.type==='text'){
        const sc=E.source||{};
        if(sc.kind==='static') addText(E.fontId, transformPreview(E, sc.text||''));
        else { map[E.fontId] && (map[E.fontId].dynamic=true);
          addText(E.fontId,(E.format&&E.format.prefix)||''); addText(E.fontId,(E.format&&E.format.suffix)||'');
          if(E.transform==='boolLabel'){ const a=E.transformArg||{}; addText(E.fontId,a.trueLabel||'Aan'); addText(E.fontId,a.falseLabel||'Uit'); }
        }
      }
      else if(E.type==='wifi'){ (E.wifi&&E.wifi.levels||[]).forEach(lv=>addIcon(E.fontId, lv.hex, 'wifi')); }
      else if(E.type==='clock'){
        // time digits + separators are dynamic; mark font dynamic and add the format's literal chars
        if(map[E.fontId]) map[E.fontId].dynamic=true;
        addText(E.fontId, '0123456789:-/. ');
        if(E.clock&&E.clock.icon) addIcon(E.clock.iconFontId, E.clock.iconHex, 'clock');
      }
      else if(E.type==='graph'){
        const ax=E.graph&&E.graph.axes;
        if(ax&&ax.show){
          addText(ax.fontId, '0123456789-. ');
          addText(ax.fontId, ax.yTitle||''); addText(ax.fontId, ax.xTitle||'');
          addText(ax.fontId, String((E.graph.min_range??''))+String((E.graph.max_range??''))+String(E.graph.duration||''));
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
function orderedElements(){
  return els().slice().sort((a,b)=>{
    const ka=elementSortKey(a), kb=elementSortKey(b);
    return (ka.y-kb.y) || (ka.x-kb.x);
  });
}

function genYAML(){
  const p=profile(), d=p.device, gl=collectGlyphs();
  let out='';
  out+=`# ============================================================\n`;
  out+=`# Gegenereerd door E-ink Studio (v1) — profiel: ${p.name}\n`;
  out+=`# Plak deze blokken in je ESPHome-config. wifi/api/ota/secrets\n`;
  out+=`# blijven jouw bestaande blokken; hier staat de display-stack.\n`;
  out+=`# Zet je TTF's (digital.ttf, GothamRnd-Book.ttf,\n`;
  out+=`# materialdesignicons-webfont.ttf v${MDI_VERSION}) in je fonts/-map.\n`;
  out+=`# ============================================================\n\n`;

  // substitutions
  out+=`substitutions:\n  device_name: "${d.name}"\n  friendly_name: "${d.comment}"\n  board_type: "ESP32"\n\n`;

  // esphome on_boot
  out+=`# --- vul aan in je bestaande esphome: blok ---\nesphome:\n  on_boot:\n    priority: 600.0\n    then:\n      - delay: 2s\n      - component.update: eink_display\n      - wait_until:\n          condition:\n            lambda: 'return id(data_updated) == true;'\n          timeout: 30s\n      - lambda: 'id(initial_data_received) = true;'\n      - script.execute: update_screen\n\n`;

  // globals
  out+=`globals:\n  - id: data_updated\n    type: bool\n    restore_value: no\n    initial_value: 'false'\n  - id: initial_data_received\n    type: bool\n    restore_value: no\n    initial_value: 'false'\n  - id: recorded_display_refresh\n    type: int\n    restore_value: yes\n    initial_value: '0'\n\n`;

  // script
  out+=`script:\n  - id: update_screen\n    then:\n      - lambda: 'id(data_updated) = false;'\n      - component.update: eink_display\n      - lambda: 'id(recorded_display_refresh) += 1;'\n      - lambda: 'id(display_last_update).publish_state(id(homeassistant_time).now().timestamp);'\n\n`;

  // time
  out+=`time:\n  - platform: homeassistant\n    id: homeassistant_time\n    on_time:\n      - seconds: 0\n        minutes: /15\n        then:\n          - if:\n              condition:\n                lambda: 'return id(data_updated) == true;'\n              then:\n                - script.execute: update_screen\n\n`;

  // fonts
  out+=`font:\n`;
  p.fonts.forEach(f=>{
    if(f.kind==='gfonts'){
      out+=`  - file:\n      type: gfonts\n      family: ${f.family}\n      weight: ${f.weight}\n    id: ${f.id}\n    size: ${f.size}\n`;
    } else {
      out+=`  - file: '${f.file}'\n    id: ${f.id}\n    size: ${f.size}\n`;
    }
    out+=glyphBlock(f, gl[f.id]);
  });
  out+='\n';

  // colors
  out+=`color:\n`;
  p.colors.forEach(c=>{ out+=`  - id: ${c.id}\n    red: ${c.r}%\n    green: ${c.g}%\n    blue: ${c.b}%\n    white: ${c.w}%\n`; });
  out+='\n';

  // sensors (diagnostics + used numeric homeassistant)
  const used = usedSources();
  out+=`sensor:\n`;
  out+=`  - platform: template\n    name: "\${friendly_name} Display Last Update"\n    device_class: timestamp\n    entity_category: diagnostic\n    id: display_last_update\n`;
  out+=`  - platform: template\n    name: "\${friendly_name} Recorded Display Refresh"\n    accuracy_decimals: 0\n    unit_of_measurement: "Refreshes"\n    state_class: total_increasing\n    entity_category: diagnostic\n    lambda: 'return id(recorded_display_refresh);'\n`;
  out+=`  - platform: wifi_signal\n    name: "\${friendly_name} WiFi Signal"\n    id: wifisignal\n    entity_category: diagnostic\n    update_interval: 60s\n`;
  used.filter(s=>s.kind==='number').forEach(s=>out+=haSensor(s));
  out+='\n';

  // text sensors (used string/time/bool homeassistant)
  const txt = used.filter(s=>s.kind!=='number');
  if(txt.length){ out+=`text_sensor:\n`; txt.forEach(s=>out+=haSensor(s)); out+='\n'; }

  // graph: components (one per graph element)
  const graphs=els().filter(e=>e.type==='graph');
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
      const traces=(gr.traces||[]).filter(t=>t.sourceId);
      if(traces.length){
        out+=`    traces:\n`;
        traces.forEach(t=>{
          out+=`      - sensor: ${t.sourceId}\n        line_type: ${t.lineType||'SOLID'}\n        line_thickness: ${t.thickness??2}\n        continuous: ${t.continuous!==false?'true':'false'}\n        color: ${cppColor(t.colorId)}\n`;
        });
      }
    });
    out+='\n';
  }

  // display + lambda
  out+=`display:\n  - platform: waveshare_epaper\n    id: eink_display\n    model: ${d.model}\n    update_interval: never\n    rotation: ${d.rotation}°\n    # cs/dc/busy/reset pins: behoud je eigen pinconfig\n    lambda: |-\n`;
  const L='      ';
  out+=`${L}if (id(initial_data_received) == false) {\n`;
  out+=`${L}  it.printf(${Math.round(d.w/2)}, ${Math.round(d.h/2)}, id(${p.fonts[0].id}), color_text, TextAlign::CENTER, "WACHTEN OP DATA...");\n`;
  out+=`${L}} else {\n`;
  orderedElements().forEach(el=>{ const code=elementCode(el, L+'  '); if(code) out+=code+'\n'; });
  out+=`${L}}\n`;

  // round-trip comment
  const snap = btoa(unescape(encodeURIComponent(JSON.stringify({
    device:p.device, elements:p.elements
  }))));
  out+=`\n# eink-editor:v1:${snap}\n`;
  return out;
}
function glyphEsc(ch){ if(ch==='\\') return '\\\\'; if(ch==='"') return '\\"'; return ch; }
function glyphBlock(f, g){
  const chars=new Set(g?g.chars:[]); const icons=g?g.icons:new Map(); const dyn=g?g.dynamic:f.dynamic;
  if(dyn) for(const ch of (f.baseCharset||'')) chars.add(ch);
  if(!chars.size && !icons.size){
    if(f.seedGlyphs && f.seedGlyphs.length){ f.seedGlyphs.forEach(c=>chars.add(c)); }
    else return ''; // full font (no glyph restriction)
  }
  // single, uniform YAML block sequence (icons first, then plain chars)
  let out=`    glyphs:\n`;
  if(icons.size) icons.forEach((name,hex)=>{ out+=`      - "\\U${hex}"${name?`  # mdi-${name}`:''}\n`; });
  Array.from(chars).filter(c=>c && c.codePointAt(0)<0xF0000).sort()
    .forEach(ch=>{ out+=`      - "${glyphEsc(ch)}"\n`; });
  return out;
}
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

function renderCode(){ $('#code-out').textContent = genYAML(); }

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
async function openIconPicker(cb){
  openModal('MDI-icoon kiezen', `<input class="icon-search" id="icon-q" type="text" placeholder="Zoek… (bv. thermometer, pump, weather)"><div class="icon-grid" id="icon-grid"><div class="hint">Laden…</div></div>`, []);
  const meta=await loadMdiMeta();
  const grid=$('#icon-grid'), q=$('#icon-q');
  function render(filter){
    const f=(filter||'').toLowerCase();
    const list=meta.filter(m=>!f || m.name.includes(f) || (m.aliases||[]).some(a=>a.includes(f)) || (m.tags||[]).some(t=>t.toLowerCase().includes(f))).slice(0,300);
    grid.innerHTML = list.map(m=>`<div class="icon-cell" data-name="${m.name}" data-hex="${m.codepoint.toUpperCase()}"><span class="mdi mdi-${m.name}"></span><small>${m.name}</small></div>`).join('') || '<div class="hint">Niets gevonden.</div>';
    grid.querySelectorAll('.icon-cell').forEach(c=>c.onclick=()=>{ cb({name:c.dataset.name, hex:c.dataset.hex}); closeModal(); });
  }
  render('thermometer'); q.value=''; q.oninput=()=>render(q.value); q.focus();
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(title, body, footerBtns){
  $('#modal-title').textContent=title; $('#modal-body').innerHTML=body;
  const f=$('#modal-footer'); f.innerHTML='';
  (footerBtns||[]).forEach(b=>{ const el=document.createElement('button'); el.className='btn '+(b.cls||'ghost'); el.textContent=b.label; el.onclick=b.onClick; f.appendChild(el); });
  $('#modal-back').classList.add('open');
}
function closeModal(){ $('#modal-back').classList.remove('open'); }
$('#modal-x').onclick=closeModal;
let _modalDownOnBack=false;
$('#modal-back').addEventListener('mousedown', e=>{ _modalDownOnBack = (e.target===$('#modal-back')); });
$('#modal-back').addEventListener('mouseup', e=>{
  if(_modalDownOnBack && e.target===$('#modal-back')) closeModal();
  _modalDownOnBack=false;
});

/* ---- Sources modal ---- */
function openSources(){
  const rows=profile().sources.map((s,i)=>`<tr>
    <td><input data-i="${i}" data-f="id" class="mono" value="${attr(s.id)}"></td>
    <td><input data-i="${i}" data-f="entityId" class="mono" value="${attr(s.entityId)}"></td>
    <td><select data-i="${i}" data-f="kind">
      ${['number','string','time','bool'].map(k=>`<option ${s.kind===k?'selected':''}>${k}</option>`).join('')}
    </select></td>
    <td><input data-i="${i}" data-f="sample" value="${attr(s.sample)}"></td>
    <td><button class="btn ghost sm danger" data-del="${i}">✕</button></td></tr>`).join('');
  openModal('Waardebronnen (sensor-mapping)',
    `<table class="tbl"><thead><tr><th>id (lambda)</th><th>entity_id (HA)</th><th>type</th><th>voorbeeld</th><th></th></tr></thead><tbody id="src-body">${rows}</tbody></table>
     <button class="btn sm" id="src-add" style="margin-top:10px">+ Bron toevoegen</button>
     <div class="hint" style="margin-top:8px">“type” bepaalt welke transforms/operatoren beschikbaar zijn. Het <span class="mono">id</span> wordt de ESPHome-sensor-id; de <span class="mono">entity_id</span> wordt later gebruikt voor live data (deel 2).</div>`,
    [{label:'Klaar',cls:'primary',onClick:()=>{ persist(); closeModal(); renderInspector(); }}]);
  const body=$('#src-body');
  body.querySelectorAll('input,select').forEach(inp=>inp.addEventListener('change',()=>{ const i=+inp.dataset.i; profile().sources[i][inp.dataset.f]=inp.value; persist(); }));
  body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ profile().sources.splice(+b.dataset.del,1); persist(); openSources(); });
  $('#src-add').onclick=()=>{ profile().sources.push({id:uid('s'),entityId:'sensor.nieuw',kind:'number',sample:0}); persist(); openSources(); };
}

/* ---- Fonts & colors modal ---- */
function openFonts(){
  const frows=profile().fonts.map((f,i)=>`<tr>
    <td class="mono">${f.id}</td>
    <td>${f.kind==='gfonts'?`gfonts: ${f.family} ${f.weight}`:f.file}</td>
    <td>${f.size}px</td>
    <td>${/materialdesignicons/i.test(f.file||'')?'<span class="tag">MDI (CDN)</span>':(f.kind==='gfonts'?'<span class="tag">geladen</span>':(f.dataUrl?'<span class="tag" style="color:var(--ok)">geüpload</span>':'<span class="tag" style="color:var(--red)">upload nodig</span>'))}</td>
    <td>${f.kind==='local'&&!/materialdesignicons/i.test(f.file||'')?`<input type="file" accept=".ttf,.otf" data-font="${i}" style="font-size:10px">`:''}</td>
    <td><button class="btn ghost sm danger" data-delfont="${i}" title="Font verwijderen">✕</button></td>
  </tr>`).join('');
  const crows=profile().colors.map((c,i)=>`<tr>
    <td class="mono">${c.id}</td>
    <td><div class="swatch" style="background:${c.css}"></div></td>
    <td><input type="color" data-color-i="${i}" value="${rgbToHex(c.css)}"></td>
    <td class="mono">r${c.r} g${c.g} b${c.b} w${c.w}</td>
  </tr>`).join('');
  openModal('Fonts &amp; kleuren',
    `<h4 style="margin:0 0 8px;color:var(--accent)">Fonts</h4>
     <table class="tbl"><thead><tr><th>id</th><th>bron</th><th>grootte</th><th>status</th><th>upload</th><th></th></tr></thead><tbody>${frows}</tbody></table>
     <div class="src-box" style="margin-top:10px">
       <label class="fld">Nieuw font toevoegen</label>
       <div class="row tight">
         <div><input id="nf-id" type="text" class="mono" placeholder="id (bv. font_groot)"></div>
         <div><input id="nf-size" type="number" placeholder="grootte" value="30" style="width:90px"></div>
         <div><select id="nf-kind"><option value="gfonts">Google Font</option><option value="local">Lokale TTF</option></select></div>
       </div>
       <div class="row tight" id="nf-gfonts">
         <div><input id="nf-family" type="text" placeholder="family (bv. Roboto)"></div>
         <div><input id="nf-weight" type="number" placeholder="weight" value="400" style="width:90px"></div>
       </div>
       <div class="row tight" id="nf-local" style="display:none">
         <div><input id="nf-file" type="text" placeholder="pad in HA (bv. fonts/mijn.ttf)"></div>
         <div><input id="nf-upload" type="file" accept=".ttf,.otf" style="font-size:10px"></div>
       </div>
       <button class="btn sm" id="nf-add" style="margin-top:8px">+ Font toevoegen</button>
       <div class="hint" style="margin-top:6px">Het <span class="mono">id</span> gebruik je in elementen; het <span class="mono">pad</span> moet kloppen met je ESPHome <span class="mono">fonts/</span>-map. Upload een TTF voor een exacte preview.</div>
     </div>
     <div class="hint" style="margin:10px 0 18px">De MDI-iconenfont wordt vanaf het CDN (v${MDI_VERSION}) geladen.</div>
     <h4 style="margin:0 0 8px;color:var(--accent)">Kleuren (preview)</h4>
     <table class="tbl"><thead><tr><th>id</th><th></th><th>preview</th><th>e-ink waarde</th></tr></thead><tbody>${crows}</tbody></table>
     <div class="hint" style="margin-top:6px">De preview-kleur is alleen voor weergave; de e-ink waarde (rgbw%) gaat naar de gegenereerde <span class="mono">color:</span>.</div>`,
    [{label:'Klaar',cls:'primary',onClick:()=>{ persist(); closeModal(); }}]);
  // existing uploads
  $$('#modal-body input[type=file][data-font]').forEach(inp=>inp.addEventListener('change',e=>{
    const f=profile().fonts[+inp.dataset.font], file=e.target.files[0]; if(!file) return;
    const rd=new FileReader(); rd.onload=async()=>{ f.dataUrl=rd.result; await registerUploadedFonts(); await maybeUploadFont(f, file.name); persist(); afterChange(); openFonts(); toast(T('Font geladen','Font loaded')); }; rd.readAsDataURL(file);
  }));
  $$('#modal-body input[type=color]').forEach(inp=>inp.addEventListener('change',()=>{ profile().colors[+inp.dataset.colorI].css=inp.value; persist(); afterChange(); }));
  $$('#modal-body [data-delfont]').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.delfont, f=profile().fonts[i];
    const inUse=els().some(e=>e.fontId===f.id);
    if(inUse && !confirm(`Font "${f.id}" wordt gebruikt door elementen. Toch verwijderen?`)) return;
    profile().fonts.splice(i,1); persist(); afterChange(); openFonts(); toast(T('Font verwijderd','Font deleted'));
  });
  // new-font form: toggle gfonts/local fields
  const kindSel=$('#nf-kind');
  kindSel.onchange=()=>{ const g=kindSel.value==='gfonts'; $('#nf-gfonts').style.display=g?'':'none'; $('#nf-local').style.display=g?'none':''; };
  let pendingUpload=null;
  $('#nf-upload').onchange=e=>{ const file=e.target.files[0]; if(!file)return; const rd=new FileReader(); rd.onload=()=>{ pendingUpload=rd.result; if(!$('#nf-file').value) $('#nf-file').value='fonts/'+file.name; }; rd.readAsDataURL(file); };
  $('#nf-add').onclick=async()=>{
    const id=($('#nf-id').value||'').trim();
    if(!/^[a-z_][a-z0-9_]*$/i.test(id)){ toast(T('Geef een geldig id (letters/cijfers/_)','Enter a valid id (letters/digits/_)')); return; }
    if(fontById(id)){ toast(T('Dit id bestaat al','This id already exists')); return; }
    const size=+$('#nf-size').value||30;
    const f={ id, size, kind:kindSel.value, dynamic:false, baseCharset:' -.:%/°0123456789', dataUrl:null, seedGlyphs:[] };
    if(kindSel.value==='gfonts'){ f.family=($('#nf-family').value||'Roboto').trim(); f.weight=+$('#nf-weight').value||400; f.file=null; }
    else { f.family=null; f.weight=null; f.file=($('#nf-file').value||'fonts/font.ttf').trim(); f.dataUrl=pendingUpload; }
    profile().fonts.push(f);
    injectGoogleFonts(); await registerUploadedFonts();
    if(f.dataUrl) await maybeUploadFont(f, (f.file||'').split('/').pop()||f.id+'.ttf');
    persist(); afterChange(); openFonts(); toast(T('Font toegevoegd','Font added'));
  };
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

/* ---- Scenarios modal ---- */
function openScenarios(){
  const p=profile();
  const list=p.scenarios.map(sc=>`<tr><td><input data-sc="${sc.id}" value="${attr(sc.name)}"></td>
    <td><button class="btn sm" data-apply="${sc.id}">${p.activeScenario===sc.id?'● actief':'Toepassen'}</button></td>
    <td><button class="btn sm" data-edit="${sc.id}">Waarden…</button></td>
    <td><button class="btn ghost sm danger" data-del="${sc.id}">✕</button></td></tr>`).join('');
  openModal("Scenario's (test-waarden)",
    `<table class="tbl"><tbody>${list||'<tr><td class="hint">Nog geen scenario’s.</td></tr>'}</tbody></table>
     <div class="row" style="margin-top:10px"><button class="btn sm" id="sc-add">+ Scenario van huidige waarden</button>
     <button class="btn ghost sm" id="sc-clear">Live/standaard waarden</button></div>
     <div class="hint" style="margin-top:8px">Een scenario legt waarden per bron vast, zodat je je condities (Voeren aan/uit, CO₂…) kunt testen zonder te flashen.</div>`,
    [{label:'Klaar',cls:'primary',onClick:()=>{persist();closeModal();}}]);
  $('#sc-add').onclick=()=>{ const vals={}; p.sources.forEach(s=>vals[s.id]=s.sample); p.scenarios.push({id:uid('sc'),name:'Scenario '+(p.scenarios.length+1),values:vals}); persist(); openScenarios(); };
  $('#sc-clear').onclick=()=>{ p.activeScenario=null; persist(); afterChange(); openScenarios(); };
  $$('#modal-body [data-sc]').forEach(i=>i.onchange=()=>{ p.scenarios.find(s=>s.id===i.dataset.sc).name=i.value; persist(); });
  $$('#modal-body [data-apply]').forEach(b=>b.onclick=()=>{ p.activeScenario=b.dataset.apply; persist(); afterChange(); openScenarios(); });
  $$('#modal-body [data-del]').forEach(b=>b.onclick=()=>{ p.scenarios=p.scenarios.filter(s=>s.id!==b.dataset.del); if(p.activeScenario===b.dataset.del)p.activeScenario=null; persist(); openScenarios(); });
  $$('#modal-body [data-edit]').forEach(b=>b.onclick=()=>editScenario(b.dataset.edit));
}
function editScenario(id){
  const p=profile(), sc=p.scenarios.find(s=>s.id===id);
  const rows=p.sources.map(s=>`<tr><td class="mono">${s.id}</td><td class="tag">${s.kind}</td><td><input data-v="${s.id}" value="${attr(sc.values[s.id]??s.sample)}"></td></tr>`).join('');
  openModal('Scenario: '+sc.name, `<table class="tbl"><thead><tr><th>bron</th><th>type</th><th>waarde</th></tr></thead><tbody>${rows}</tbody></table>`,
    [{label:'Terug',onClick:openScenarios},{label:'Opslaan',cls:'primary',onClick:()=>{ $$('#modal-body [data-v]').forEach(i=>sc.values[i.dataset.v]=i.value); persist(); afterChange(); openScenarios(); }}]);
}

/* ---- Profile settings ---- */
function openProfileSettings(){
  const p=profile(), d=p.device;
  openModal('Profiel-instellingen',
    `<div class="row"><div><label class="fld">Profielnaam</label><input id="ps-name" value="${attr(p.name)}"></div></div>
     <div class="row"><div><label class="fld">Device naam</label><input id="ps-dev" value="${attr(d.name)}"></div><div><label class="fld">Friendly name</label><input id="ps-fn" value="${attr(d.comment)}"></div></div>
     <div class="row"><div><label class="fld">Model</label><input id="ps-model" value="${attr(d.model)}"></div><div><label class="fld">Rotatie</label><select id="ps-rot">${[0,90,180,270].map(r=>`<option ${d.rotation===r?'selected':''}>${r}</option>`).join('')}</select></div></div>
     <div class="row"><div><label class="fld">Breedte (px)</label><input id="ps-w" type="number" value="${d.w}"></div><div><label class="fld">Hoogte (px)</label><input id="ps-h" type="number" value="${d.h}"></div></div>
     <div class="row"><div><label class="fld">Canvas-achtergrond (preview)</label>
       <div style="display:flex;gap:8px;align-items:center">
         <input id="ps-bg" type="color" value="${d.bg||'#d4d6d7'}" style="width:48px;padding:2px;height:30px">
         <button class="btn ghost sm" data-bg="#d4d6d7">E-ink grijs</button>
         <button class="btn ghost sm" data-bg="#f4f1e9">Papier</button>
         <button class="btn ghost sm" data-bg="#ffffff">Wit</button>
       </div></div></div>
     <div class="hint">Beide jouw devices zijn 480×800 (7.5" tri-color, 90°). Breedte/hoogte = de logische ruimte ná rotatie. De achtergrond is alleen voor de preview.</div>
     <hr style="border-color:var(--line);margin:14px 0">
     <button class="btn ghost sm danger" id="ps-delete">Profiel verwijderen</button>`,
    [{label:'Opslaan',cls:'primary',onClick:()=>{
      p.name=$('#ps-name').value; d.name=$('#ps-dev').value; d.comment=$('#ps-fn').value;
      d.model=$('#ps-model').value; d.rotation=+$('#ps-rot').value; d.w=+$('#ps-w').value; d.h=+$('#ps-h').value;
      d.bg=$('#ps-bg').value;
      persist(); initStage(); renderProfiles(); afterChange(); closeModal();
    }}]);
  $$('#modal-body [data-bg]').forEach(b=>b.onclick=()=>{ $('#ps-bg').value=b.dataset.bg; });
  $('#ps-delete').onclick=()=>{ if(state.profiles.length<2){toast(T('Minstens één profiel nodig','At least one profile required'));return;}
    if(confirm('Profiel verwijderen?')){ state.profiles=state.profiles.filter(x=>x.id!==p.id); state.current=state.profiles[0].id; persist(); boot(); closeModal(); } };
}

/* ---- YAML import ---- */
function openImport(){
  openModal('YAML importeren',
    `<div class="hint" style="margin-bottom:8px">Plak je <span class="mono">font:</span>, <span class="mono">color:</span>, <span class="mono">sensor:</span> en/of <span class="mono">text_sensor:</span> blokken. De editor vult fonts, kleuren en waardebronnen van dit profiel.</div>
     <textarea class="import-area" id="imp-area" placeholder="font:\n  - file: ..."></textarea>`,
    [{label:'Annuleer',onClick:closeModal},{label:'Importeer',cls:'primary',onClick:doImport}]);
}
function doImport(){
  const text=$('#imp-area').value; let doc;
  try{ doc=jsyaml.load(text); }catch(e){ toast(T('YAML-fout: ','YAML error: ')+e.message); return; }
  if(!doc||typeof doc!=='object'){ toast(T('Niets bruikbaars gevonden','Nothing usable found')); return; }
  const p=profile(); let n=0;
  if(Array.isArray(doc.font)){ p.fonts=doc.font.map(parseFont); n+=p.fonts.length; }
  if(Array.isArray(doc.color)){ p.colors=doc.color.map(parseColor); n+=p.colors.length; }
  ['sensor','text_sensor'].forEach(key=>{
    if(Array.isArray(doc[key])) doc[key].forEach(it=>{ if(it.platform==='homeassistant'&&it.id&&it.entity_id){
      const kind = key==='text_sensor' ? guessKind(it.entity_id) : 'number';
      const ex=p.sources.find(s=>s.id===it.id);
      if(ex){ ex.entityId=it.entity_id; ex.kind=kind; } else p.sources.push({id:it.id,entityId:it.entity_id,kind,sample:sampleFor(kind)});
      n++;
    }});
  });
  persist(); afterChange(); closeModal(); toast(T(`Geïmporteerd: ${n} items`,`Imported: ${n} items`));
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
function renderProfiles(){
  const sel=$('#profile-select'); sel.innerHTML=state.profiles.map(p=>`<option value="${p.id}" ${p.id===state.current?'selected':''}>${p.name}</option>`).join('');
}
/* ============================================================
   SERVER STORAGE (add-on build) — projects + fonts in /data
   When the add-on API is present, Save/Open use server storage;
   standalone (file/localhost) keeps the file-based behaviour.
   ============================================================ */
var SERVER_STORAGE=false;
function pname(){ return (profile().name||'profiel').replace(/[^A-Za-z0-9._-]+/g,'_'); }
function pslug(p){ return (p.name||'profiel').replace(/[^A-Za-z0-9._-]+/g,'_'); }

/* ---- server-side profile sync ---- */
var _profileSyncTimer=null;

async function syncProfilesToServer(){
  if(!SERVER_STORAGE) return;
  for(const p of state.profiles){
    const n=pslug(p);
    try{ await fetch('api/profiles/'+encodeURIComponent(n),{
      method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)
    }); }catch(e){}
  }
}

async function serverSaveProject(){
  try{
    const r=await fetch('api/projects/'+encodeURIComponent(pname()), {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(profile()) });
    if(!r.ok) throw new Error('http '+r.status);
    toast(T('Opgeslagen in add-on ('+pname()+')','Saved in add-on ('+pname()+')'));
  }catch(e){ console.warn(e); toast(T('Opslaan op server mislukt — gedownload als bestand','Server save failed — downloaded as file')); fileSaveProject(); }
}
async function serverOpenProject(){
  let list=[];
  try{ const r=await fetch('api/projects'); list=(await r.json()).projects||[]; }
  catch(e){ toast(T('Kon serverlijst niet laden','Could not load server list')); return; }
  const rows = list.length
    ? list.map(n=>`<div class="row" style="align-items:center"><div class="mono" style="flex:1">${n}</div>
        <button class="btn sm" data-open="${attr(n)}">Openen</button>
        <button class="btn ghost sm danger" data-del="${attr(n)}">✕</button></div>`).join('')
    : '<div class="hint">Nog geen projecten in de add-on opgeslagen.</div>';
  openModal('Project openen (add-on)', rows + `<div class="hint" style="margin-top:10px">Of laad een bestand:</div>
    <button class="btn sm" id="open-file" style="margin-top:6px">Bestand kiezen…</button>`,
    [{label:'Sluiten',onClick:closeModal}]);
  $$('#modal-body [data-open]').forEach(b=>b.onclick=async()=>{
    try{ const r=await fetch('api/projects/'+encodeURIComponent(b.dataset.open));
      const p=await r.json(); p.id=uid('p'); state.profiles.push(p); state.current=p.id; persist(); closeModal(); boot(); toast(T('Geopend: ','Opened: ')+b.dataset.open);
    }catch(e){ toast(T('Openen mislukt','Open failed')); }
  });
  $$('#modal-body [data-del]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Verwijder serverproject "'+b.dataset.del+'"?')) return;
    await fetch('api/projects/'+encodeURIComponent(b.dataset.del), {method:'DELETE'});
    serverOpenProject();
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
    rd.onload=()=>{ try{ const p=JSON.parse(rd.result); p.id=uid('p'); state.profiles.push(p); state.current=p.id; persist(); closeModal&&closeModal(); boot(); toast(T('Project geladen','Project loaded')); }catch(e){ toast(T('Ongeldig bestand','Invalid file')); } };
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
  const btn=$('#btn-theme'); if(btn) btn.textContent = state.theme==='light' ? '◑ Licht' : '◐ Donker';
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),1800); }

/* point 2: right-click context menu on the canvas */
function setupContextMenu(){
  const menu=$('#ctxmenu');
  const hide=()=>menu.classList.remove('open');
  window.addEventListener('click', hide);
  window.addEventListener('scroll', hide, true);
  $('#stage-wrap').addEventListener('contextmenu', e=>{
    e.preventDefault();
    // figure out which element is under the cursor (topmost), else use current selection
    let hitId=null;
    if(stage){ const pos=stage.getPointerPosition();
      const shape=pos && stage.getIntersection(pos);
      if(shape){ let n=shape; while(n && !n._elId) n=n.getParent(); if(n&&n._elId) hitId=n._elId; }
    }
    if(hitId){ selectedId=hitId; const node=contentLayer.getChildren(n=>n._elId===hitId)[0]; attachSelection(selected(),node); contentLayer.draw(); renderLayers(); renderInspector(); }
    const el=selected();
    const items=[];
    if(el){
      items.push(['⧉ Dupliceren','Ctrl+D',dupSel]);
      items.push([el.visible===false?'👁 Tonen':'🚫 Verbergen','',()=>{ pushUndo(); el.visible=el.visible===false?true:false; afterChange(); }]);
      items.push(['↑ Naar voren','',()=>reorder(el,1)]);
      items.push(['↓ Naar achteren','',()=>reorder(el,-1)]);
      items.push(['sep']);
      items.push(['🗑 Verwijderen','Del',deleteSel,'danger']);
    } else {
      items.push(['Niets geselecteerd','',null]);
    }
    menu.innerHTML = items.map(it=>{
      if(it[0]==='sep') return '<div class="sep"></div>';
      const cls=it[3]?` class="${it[3]}"`:'';
      const k=it[1]?`<span class="k">${it[1]}</span>`:'';
      return `<button${cls} data-act>${it[0]}${k}</button>`;
    }).join('');
    Array.from(menu.querySelectorAll('[data-act]')).forEach((b,i)=>{
      const fn=items.filter(x=>x[0]!=='sep')[i] && items.filter(x=>x[0]!=='sep')[i][2];
      b.onclick=()=>{ hide(); if(fn) fn(); };
    });
    menu.style.left=Math.min(e.clientX,window.innerWidth-190)+'px';
    menu.style.top=Math.min(e.clientY,window.innerHeight-220)+'px';
    menu.classList.add('open');
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
  $('#btn-scenarios').onclick=openScenarios;
  $('#btn-save').onclick=saveProject;
  $('#btn-theme').onclick=()=>{ state.theme = (state.theme==='light'?'dark':'light'); applyTheme(); persist(); };
  const lb=$('#btn-live'); if(lb) lb.onclick=refreshLive;
  $('#btn-load').onclick=loadProject;

  $('#btn-code').onclick=()=>{ renderCode(); $('#code-drawer').classList.add('open'); };
  $('#code-close').onclick=()=>$('#code-drawer').classList.remove('open');
  $('#code-copy').onclick=()=>{ navigator.clipboard.writeText(genYAML()).then(()=>toast(T('Naar klembord gekopieerd','Copied to clipboard'))); };
  $('#code-download').onclick=()=>{ download(new Blob([genYAML()],{type:'text/yaml'}), (profile().device.name||'display')+'.yaml'); toast(T('YAML gedownload','YAML downloaded')); };

  $('#zoom-in').onclick=()=>{ zoom=clamp(zoom+0.1,0.3,2); applyZoom(); };
  $('#zoom-out').onclick=()=>{ zoom=clamp(zoom-0.1,0.3,2); applyZoom(); };
  $('#zoom-fit').onclick=fitZoom;
  $('#tg-grid').onchange=()=>drawGrid();
  $('#grid-size').onchange=e=>{ profile().device.grid=+e.target.value; persist(); drawGrid(); };
  $('#tg-eink').onchange=renderCanvas;
  $('#tg-chrome').onchange=e=>document.body.classList.toggle('chrome-hidden',e.target.checked);

  $('#btn-undo').onclick=undo; $('#btn-redo').onclick=redo;
  $('#btn-dup').onclick=dupSel; $('#btn-del').onclick=deleteSel;
  $('#al-left').onclick=()=>alignSel('left'); $('#al-hcenter').onclick=()=>alignSel('hcenter'); $('#al-right').onclick=()=>alignSel('right');
  $('#al-top').onclick=()=>alignSel('top'); $('#al-vcenter').onclick=()=>alignSel('vcenter'); $('#al-bottom').onclick=()=>alignSel('bottom');

  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select')) return;
    if((e.ctrlKey||e.metaKey)&&e.key==='z'){ e.preventDefault(); undo(); }
    else if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='Z'))){ e.preventDefault(); redo(); }
    else if((e.ctrlKey||e.metaKey)&&e.key==='d'){ e.preventDefault(); dupSel(); }
    else if(e.key==='Delete'||e.key==='Backspace'){ deleteSel(); }
    else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){ nudge(e); }
  });
}
function nudge(e){ const el=selected(); if(!el) return; e.preventDefault(); const d=e.shiftKey?10:1;
  const dx=(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0), dy=(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0);
  el.x+=dx; el.y+=dy; if(el.x2!=null){el.x2+=dx;el.y2+=dy;} afterChange(); }
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
async function refreshLive(){
  try{
    HA_STATES=await fetchHaStates();
    applyLiveToSources();
    HA_LIVE=true;
    updateLiveBadge();
    renderCanvas(); renderInspector();
    const n=Object.keys(HA_STATES).length;
    toast(T('Live data bijgewerkt ('+n+' entiteiten)','Live data updated ('+n+' entities)'));
  }catch(e){
    HA_LIVE=false; updateLiveBadge();
    toast(T('Live data niet beschikbaar','Live data unavailable'));
    console.warn('live fetch failed', e);
  }
}
function updateLiveBadge(){
  const b=$('#btn-live'); if(!b) return;
  b.textContent = HA_LIVE ? '● Live' : '○ Live';
  b.classList.toggle('primary', HA_LIVE);
}

async function boot(){
  renderProfiles();
  applyTheme();
  const gs=$('#grid-size'); if(gs) gs.value=String(gridStep());
  injectGoogleFonts();
  try{ await registerUploadedFonts(); }catch(e){ console.warn(e); }
  initStage();
  selectedId=null;
  fitZoom();
  renderCanvas(); renderLayers(); renderInspector();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>renderCanvas());
  // Check add-on API + live data (fire-and-forget to keep boot fast)
  fetch('api/info').then(r=>r.json()).then(info=>{
    if(!info) return;
    if(info.app){ SERVER_STORAGE=true; syncProfilesToServer(); }
    // Apply add-on language/theme options BEFORE any toast fires
    if(info.language){ window.ADDON_LANGUAGE=info.language; if(window.haRefreshLang) window.haRefreshLang(); }
    if(info.theme){ window.ADDON_THEME=info.theme; if(window.haTheme) window.haTheme.apply(window.haTheme.detect()); }
    if(info.live_data){ refreshLive(); }
  }).catch(()=>{});
}

try{ loadState(); wire(); boot(); }
catch(e){ showFatal('Opstartfout: '+e.message); throw e; }
