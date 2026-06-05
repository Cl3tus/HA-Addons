'use strict';

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let currentPath = '';
let entries     = [];
let selected    = new Set();   // full paths of selected entries (works across the tree)
let rowIndex    = new Map();   // fullPath -> entry (for all rendered rows)
let expandedPaths = new Set(); // folder paths that are expanded (kept across refresh)
let didInitialExpand = false;  // on first load, expand every folder once

// ---------------------------------------------------------------- API  (relative URLs – required for HA Ingress)

async function apiList(path) {
  const r = await fetch(`api/fs/list?path=${enc(path)}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  return r.json();
}

async function apiMkdir(path) {
  const r = await fetch('api/fs/mkdir', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({path}),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
}

async function apiDelete(path) {
  const r = await fetch(`api/fs/entry?path=${enc(path)}`, {method: 'DELETE'});
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
}

async function apiMove(src, dst) {
  const r = await fetch('api/fs/move', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({src, dst}),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
}

async function apiUpload(path, files) {
  const names = [];
  for (const file of files) {
    const fd = new FormData();
    fd.append('path', path);
    fd.append('file', file, file.name);
    const r = await fetch('api/fs/upload', {method: 'POST', body: fd});
    if (r.ok) names.push(file.name);
    else toast(_t(`Upload mislukt: ${file.name}`, `Upload failed: ${file.name}`), true);
  }
  return names;
}

// ---------------------------------------------------------------- SAMBA info

function _t(nl, en) { return (window.t ? window.t(nl, en) : nl); }

// ---------------------------------------------------------------- text editor

const TEXT_EXT = new Set([
  'txt','md','markdown','yaml','yml','json','js','mjs','css','html','htm','xml',
  'svg','py','sh','bash','conf','cfg','ini','toml','env','log','csv','tsv',
  'c','h','cpp','hpp','ino','rs','go','java','ts','php','rb','sql','gitignore',
]);

function isTextFile(name) {
  if (name.indexOf('.') === -1) return false;           // extensionless: treat as binary
  return TEXT_EXT.has(name.split('.').pop().toLowerCase());
}

const FONT_EXT = new Set(['ttf','otf','woff','woff2']);
function isFontFile(name) {
  return name.indexOf('.') !== -1 && FONT_EXT.has(name.split('.').pop().toLowerCase());
}

let _fontPrevN = 0;
async function openFontPreview(name, fullPath) {
  const path = fullPath || entryPath(name);
  try {
    const r = await fetch(`api/fs/download?path=${enc(path)}`);
    if (!r.ok) throw new Error(r.status);
    const buf = await r.arrayBuffer();
    const fam = 'feprev_' + (++_fontPrevN);
    const ff = new FontFace(fam, buf);
    await ff.load();
    document.fonts.add(ff);
    const sizes = [14, 20, 28, 40, 56];
    const sample = 'AaBbCcDd 0123456789 :-/°%';
    const body = $('#fe-fontprev-body');
    body.innerHTML =
      `<div style="font-family:'${fam}';line-height:1.3">` +
      sizes.map(s => `<div style="font-size:${s}px;margin-bottom:8px">${esc(sample)}</div>`).join('') +
      `</div><div class="hint" style="margin-top:6px">${esc(name)}</div>`;
    $('#fe-fontprev-name').textContent = path;
    $('#fe-fontprev-back').style.display = 'flex';
  } catch (e) {
    toast(_t('Kon font niet laden: ', 'Could not load font: ') + e.message, true);
  }
}
function closeFontPreview() { $('#fe-fontprev-back').style.display = 'none'; }

async function apiRead(path) {
  const r = await fetch(`api/fs/read?path=${enc(path)}`);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
  return (await r.json()).content;
}

async function apiWrite(path, content) {
  const r = await fetch('api/fs/write', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({path, content}),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
}

let _editPath = null;
let _editClean = '';
let _undoStack = [], _redoStack = [], _editPrev = '', _lastPush = 0;

function _refreshUndoButtons() {
  $('#fe-editor-undo').disabled = _undoStack.length === 0;
  $('#fe-editor-redo').disabled = _redoStack.length === 0;
}

// Called on every input — pushes coalesced snapshots onto the undo stack
function _recordEdit() {
  const now = Date.now();
  if (now - _lastPush > 400 && _editPrev !== $('#fe-editor-area').value) {
    _undoStack.push(_editPrev);
    if (_undoStack.length > 200) _undoStack.shift();
    _redoStack = [];
    _lastPush = now;
  }
  _editPrev = $('#fe-editor-area').value;
  $('#fe-editor-dirty').textContent = editorDirty() ? '●' : '';
  _refreshUndoButtons();
}

function editorUndo() {
  if (!_undoStack.length) return;
  const area = $('#fe-editor-area');
  _redoStack.push(area.value);
  const val = _undoStack.pop();
  area.value = val; _editPrev = val; _lastPush = 0;
  $('#fe-editor-dirty').textContent = editorDirty() ? '●' : '';
  _refreshUndoButtons();
}

function editorRedo() {
  if (!_redoStack.length) return;
  const area = $('#fe-editor-area');
  _undoStack.push(area.value);
  const val = _redoStack.pop();
  area.value = val; _editPrev = val; _lastPush = 0;
  $('#fe-editor-dirty').textContent = editorDirty() ? '●' : '';
  _refreshUndoButtons();
}

async function openEditor(name, fullPath) {
  const path = fullPath || entryPath(name);
  try {
    const content = await apiRead(path);
    _editPath  = path;
    _editClean = content;
    _undoStack = []; _redoStack = []; _editPrev = content; _lastPush = 0;
    $('#fe-editor-name').textContent = path;
    $('#fe-editor-area').value = content;
    $('#fe-editor-dirty').textContent = '';
    _refreshUndoButtons();
    $('#fe-editor-back').classList.add('open');
    $('#fe-editor-area').focus();
  } catch (e) {
    if (String(e.message) === 'not_text' || String(e.message) === '415')
      toast(_t('Dit is geen tekstbestand', 'This is not a text file'), true);
    else if (String(e.message) === 'too_large' || String(e.message) === '413')
      toast(_t('Bestand te groot om te bewerken', 'File too large to edit'), true);
    else
      toast(_t('Openen mislukt: ', 'Open failed: ') + e.message, true);
  }
}

function editorDirty() {
  return $('#fe-editor-area').value !== _editClean;
}

async function saveEditor() {
  if (!_editPath) return;
  try {
    const content = $('#fe-editor-area').value;
    await apiWrite(_editPath, content);
    _editClean = content;
    $('#fe-editor-dirty').textContent = '';
    toast(_t('Opgeslagen', 'Saved'));
    navigate(currentPath);
  } catch (e) {
    toast(_t('Opslaan mislukt: ', 'Save failed: ') + e.message, true);
  }
}

function closeEditor() {
  if (editorDirty() && !confirm(_t('Niet-opgeslagen wijzigingen weggooien?',
                                    'Discard unsaved changes?'))) return;
  $('#fe-editor-back').classList.remove('open');
  _editPath = null;
  _editClean = '';
}

// ---------------------------------------------------------------- Navigation

async function navigate(path) {
  currentPath = path;
  selected.clear();
  updateToolbar();
  try {
    const data = await apiList(path);
    entries = data.entries ?? [];
    renderBreadcrumb(data.path ?? '');
    renderTable(entries);
    await restoreExpansion();
    if (!didInitialExpand) { didInitialExpand = true; await expandAll(); }
  } catch (e) {
    toast(_t('Fout bij laden: ', 'Loading error: ') + e.message, true);
  }
}

// ---------------------------------------------------------------- Render

function renderBreadcrumb(path) {
  const nav = $('#fe-breadcrumb');
  nav.innerHTML = '';
  const parts = path ? path.split('/').filter(Boolean) : [];

  const addCrumb = (label, navPath, isLast) => {
    const el = document.createElement('span');
    el.className = 'crumb' + (isLast ? ' last' : '');
    el.textContent = label;
    if (!isLast) el.onclick = () => navigate(navPath);
    nav.appendChild(el);
  };

  addCrumb(_t('Add-on data', 'Add-on data'), '', parts.length === 0);
  parts.forEach((part, i) => {
    const sep = document.createElement('span');
    sep.className = 'crumb-sep';
    sep.textContent = '/';
    nav.appendChild(sep);
    const navPath = parts.slice(0, i + 1).join('/');
    addCrumb(part, navPath, i === parts.length - 1);
  });
}

function renderTable(ents) {
  const tbody = $('#fe-tbody');
  const empty = $('#fe-empty');
  tbody.innerHTML = '';
  rowIndex = new Map();

  if (currentPath) {
    const parent = currentPath.includes('/')
      ? currentPath.split('/').slice(0, -1).join('/')
      : '';
    tbody.appendChild(makeRow({name: '..', type: '_up'}, {upPath: parent, depth: 0}));
  }

  ents.forEach(e => tbody.appendChild(makeRow(e, {depth: 0, parentPath: currentPath})));

  empty.style.display = ents.length === 0 ? '' : 'none';
  updateStatus();
}

function fullPathOf(parentPath, name) { return parentPath ? parentPath + '/' + name : name; }

// expand/collapse a folder row in place, showing its children indented beneath it
async function toggleExpand(row, chev, fullPath, depth) {
  if (row._expanded) {
    let n = row.nextSibling;
    while (n && (n._depth || 0) > depth) { const x = n; n = n.nextSibling; x.remove(); }
    row._expanded = false;
    expandedPaths.delete(fullPath);
    chev.classList.remove('mdi-chevron-down'); chev.classList.add('mdi-chevron-right');
    return;
  }
  let data;
  try { data = await apiList(fullPath); }
  catch (e) { toast(_t('Fout bij laden: ', 'Loading error: ') + e.message, true); return; }
  const kids = (data.entries || []).slice()
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  let after = row; const newRows = [];
  kids.forEach(child => {
    const r = makeRow(child, {depth: depth + 1, parentPath: fullPath});
    after.after(r); after = r; newRows.push(r);
  });
  row._expanded = true;
  expandedPaths.add(fullPath);
  chev.classList.remove('mdi-chevron-right'); chev.classList.add('mdi-chevron-down');
  // restore any child folders that were expanded before (so a refresh keeps the tree open)
  for (const r of newRows) {
    if (r._isDir && expandedPaths.has(r.dataset.path)) {
      const c = r.querySelector('.fe-chev');
      if (c) await toggleExpand(r, c, r.dataset.path, depth + 1);
    }
  }
}
// re-open the folders that were expanded, after a fresh renderTable
async function restoreExpansion() {
  if (!expandedPaths.size) return;
  const rows = $$('#fe-tbody tr[data-path]').filter(r => r._isDir && (r._depth || 0) === 0 && expandedPaths.has(r.dataset.path));
  for (const r of rows) {
    const c = r.querySelector('.fe-chev');
    if (c && !r._expanded) await toggleExpand(r, c, r.dataset.path, 0);
  }
}

// expand every folder in the tree (used once on first load so the whole tree is
// open by default). Keeps looping until no collapsed folder rows remain — each
// pass reveals the next level, which the next pass then expands.
async function expandAll() {
  for (let guard = 0; guard < 100; guard++) {
    const rows = $$('#fe-tbody tr[data-path]')
      .filter(r => r._isDir && !r._expanded);
    if (!rows.length) return;
    for (const r of rows) {
      const c = r.querySelector('.fe-chev');
      if (c) await toggleExpand(r, c, r.dataset.path, r._depth || 0);
    }
  }
}

function makeRow(e, opts) {
  opts = opts || {};
  const depth = opts.depth || 0;
  const parentPath = opts.parentPath || '';
  const isUp   = e.type === '_up';
  const isDir  = e.type === 'dir';
  const isFile = e.type === 'file';
  const fullPath = isUp ? '' : fullPathOf(parentPath, e.name);

  const row = document.createElement('tr');
  row._depth = depth;
  row._isDir = isDir;
  if (!isUp) { row.dataset.path = fullPath; rowIndex.set(fullPath, e); }

  const chevron = isDir
    ? '<span class="fe-chev mdi mdi-chevron-right" style="cursor:pointer;color:var(--txt-faint)"></span>'
    : '<span style="display:inline-block;width:1.1em"></span>';
  const icon = isUp  ? '<span class="mdi mdi-arrow-up-bold" style="color:var(--txt-faint)"></span>'
             : isDir ? '<span class="mdi mdi-folder" style="color:var(--accent)"></span>'
             : fileIcon(e.name);

  const nameClass = isUp ? 'fe-name is-up' : isDir ? 'fe-name is-dir' : 'fe-name';
  const size = isFile ? fmtSize(e.size) : '';
  const date = (isFile || isDir) && e.modified
    ? new Date(e.modified * 1000).toLocaleString('nl-NL', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      })
    : '';

  const checkCell = isUp ? '' : `<input type="checkbox" class="fe-cb">`;
  row.innerHTML = `
    <td class="fe-check">${checkCell}</td>
    <td class="fe-icon" style="padding-left:${depth * 18}px;white-space:nowrap">${isUp ? '' : chevron}${icon}</td>
    <td class="${nameClass}">${esc(isUp ? '..' : e.name)}</td>
    <td class="fe-size">${size}</td>
    <td class="fe-date">${date}</td>`;

  if (isUp) {
    row.onclick = () => navigate(opts.upPath);
    return row;
  }

  if (isDir) {
    const chev = row.querySelector('.fe-chev');
    chev.onclick = ev => { ev.stopPropagation(); toggleExpand(row, chev, fullPath, depth); };
  }

  // multi-select checkbox (every file/folder, including ones inside the tree)
  const cb = row.querySelector('.fe-cb');
  if (cb) {
    cb.checked = selected.has(fullPath);
    cb.onclick = ev => {
      ev.stopPropagation();
      if (cb.checked) selected.add(fullPath); else selected.delete(fullPath);
      renderSelection(); updateToolbar(); updateStatus();
    };
  }

  row.onclick = () => {
    // toggle (accumulate) — same as the checkbox, so clicking a row never wipes
    // the rest of your selection
    if (selected.has(fullPath)) selected.delete(fullPath);
    else selected.add(fullPath);
    renderSelection();
    updateToolbar();
    updateStatus();
  };

  row.ondblclick = () => {
    if (isDir) navigate(fullPath);
    else if (isFontFile(e.name)) openFontPreview(e.name, fullPath);
    else if (isTextFile(e.name)) openEditor(e.name, fullPath);
    else doDownload(e.name, fullPath);
  };

  row.oncontextmenu = ev => {
    ev.preventDefault();
    if (!selected.has(fullPath)) {
      selected.clear();
      selected.add(fullPath);
      renderSelection();
      updateToolbar();
      updateStatus();
    }
    showCtxMenu(ev.clientX, ev.clientY, e, fullPath);
  };

  return row;
}

function renderSelection() {
  const rows = $$('#fe-tbody tr[data-path]');
  rows.forEach(row => {
    const on = selected.has(row.dataset.path);
    row.classList.toggle('sel', on);
    const cb = row.querySelector('.fe-cb'); if (cb) cb.checked = on;
  });
  const all = $('#fe-selall');
  if (all) all.checked = rows.length > 0 && rows.every(r => selected.has(r.dataset.path));
}

function updateToolbar() {
  const n       = selected.size;
  const selEnts = [...selected].map(p => rowIndex.get(p)).filter(Boolean);
  const hasFile = selEnts.some(e => e.type === 'file');

  $('#btn-rename').disabled   = n !== 1;
  $('#btn-move').disabled     = n === 0;
  $('#btn-download').disabled = n !== 1 || !hasFile;
  $('#btn-delete').disabled   = n === 0;
}

function updateStatus() {
  const dirs  = entries.filter(e => e.type === 'dir').length;
  const files = entries.filter(e => e.type === 'file').length;
  const parts = [];
  if (dirs)  parts.push(dirs === 1
    ? _t('1 map', '1 folder')
    : _t(`${dirs} mappen`, `${dirs} folders`));
  if (files) parts.push(files === 1
    ? _t('1 bestand', '1 file')
    : _t(`${files} bestanden`, `${files} files`));
  $('#fe-status').textContent = parts.join(', ') || _t('Leeg', 'Empty');

  const n = selected.size;
  $('#fe-sel-status').textContent = n ? `· ${n} ${_t('geselecteerd', 'selected')}` : '';
}

// ---------------------------------------------------------------- File icons

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    json: 'mdi-code-json',
    yaml: 'mdi-file-code-outline', yml: 'mdi-file-code-outline',
    ttf: 'mdi-format-font', otf: 'mdi-format-font',
    woff: 'mdi-format-font', woff2: 'mdi-format-font',
    png: 'mdi-file-image-outline', jpg: 'mdi-file-image-outline',
    jpeg: 'mdi-file-image-outline', gif: 'mdi-file-image-outline',
    svg: 'mdi-file-image-outline', bmp: 'mdi-file-image-outline',
    txt: 'mdi-file-document-outline', md: 'mdi-file-document-outline',
    pdf: 'mdi-file-pdf-box',
    zip: 'mdi-folder-zip-outline', gz: 'mdi-folder-zip-outline',
    py:  'mdi-language-python', js: 'mdi-language-javascript',
    sh:  'mdi-console',
  };
  const icon = map[ext] || 'mdi-file-outline';
  return `<span class="mdi ${icon}" style="color:var(--txt-faint)"></span>`;
}

// ---------------------------------------------------------------- Operations

function entryPath(name) {
  return currentPath ? currentPath + '/' + name : name;
}

function baseName(p) { return p.split('/').pop(); }

async function doDelete() {
  const paths = [...selected];
  const label = paths.length === 1 ? `"${baseName(paths[0])}"` : `${paths.length} items`;
  if (!confirm(_t(`Verwijder ${label}? Dit kan niet ongedaan worden gemaakt.`,
                   `Delete ${label}? This cannot be undone.`))) return;
  try {
    for (const path of paths) await apiDelete(path);
    toast(paths.length === 1
      ? _t(`"${baseName(paths[0])}" verwijderd`, `"${baseName(paths[0])}" deleted`)
      : _t(`${paths.length} items verwijderd`, `${paths.length} items deleted`));
    await navigate(currentPath);
  } catch (e) {
    toast(_t('Verwijderen mislukt: ', 'Delete failed: ') + e.message, true);
  }
}

function doDownload(name, fullPath) {
  const a = document.createElement('a');
  a.href = `api/fs/download?path=${enc(fullPath || entryPath(name))}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function doRename() {
  const [path] = [...selected];
  const name   = baseName(path);
  const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const entry  = rowIndex.get(path);
  const newName = await showDialog(
    _t(`Hernoemen: "${name}"`, `Rename: "${name}"`),
    name,
    entry?.type === 'file'
      ? _t('Voer de nieuwe bestandsnaam in.', 'Enter the new file name.')
      : _t('Voer de nieuwe mapnaam in.', 'Enter the new folder name.')
  );
  if (!newName || newName === name) return;
  const dst = parent ? parent + '/' + newName : newName;
  try {
    await apiMove(path, dst);
    toast(_t(`Hernoemd naar "${newName}"`, `Renamed to "${newName}"`));
    await navigate(currentPath);
  } catch (e) {
    toast(_t('Hernoemen mislukt: ', 'Rename failed: ') + e.message, true);
  }
}

async function doMove() {
  const paths = [...selected];
  const label = paths.length === 1 ? `"${baseName(paths[0])}"` : `${paths.length} items`;
  const dest  = await showDialog(
    _t(`Verplaatsen: ${label}`, `Move: ${label}`),
    currentPath,
    _t('Voer het doelpad in (relatief aan /data). Leeg = root.',
       'Enter the destination path (relative to /data). Empty = root.')
  );
  if (dest === null) return;
  try {
    for (const path of paths) {
      const name = baseName(path);
      const dst = dest ? dest.replace(/\/$/, '') + '/' + name : name;
      await apiMove(path, dst);
    }
    toast(paths.length === 1
      ? _t(`"${baseName(paths[0])}" verplaatst`, `"${baseName(paths[0])}" moved`)
      : _t(`${paths.length} items verplaatst`, `${paths.length} items moved`));
    await navigate(currentPath);
  } catch (e) {
    toast(_t('Verplaatsen mislukt: ', 'Move failed: ') + e.message, true);
  }
}

async function doMkdir() {
  const name = await showDialog(
    _t('Nieuwe map aanmaken', 'Create new folder'),
    '',
    _t('Geef de naam van de nieuwe map.', 'Enter the folder name.')
  );
  if (!name) return;
  const path = currentPath ? currentPath + '/' + name : name;
  try {
    await apiMkdir(path);
    toast(_t(`Map "${name}" aangemaakt`, `Folder "${name}" created`));
    await navigate(currentPath);
  } catch (e) {
    toast(_t('Map aanmaken mislukt: ', 'Folder creation failed: ') + e.message, true);
  }
}

async function doUpload(files) {
  if (!files.length) return;
  toast(_t('Bezig met uploaden…', 'Uploading…'));
  const uploaded = await apiUpload(currentPath, files);
  if (uploaded.length) toast(uploaded.length === 1
    ? _t(`"${uploaded[0]}" geüpload`, `"${uploaded[0]}" uploaded`)
    : _t(`${uploaded.length} bestanden geüpload`, `${uploaded.length} files uploaded`));
  await navigate(currentPath);
}

// ---------------------------------------------------------------- Dialog

function showDialog(title, value, hint = '') {
  return new Promise(resolve => {
    $('#dlg-title').textContent = title;
    const hintEl = $('#dlg-hint');
    if (hint) { hintEl.textContent = hint; hintEl.style.display = ''; }
    else hintEl.style.display = 'none';

    const input = $('#dlg-input');
    input.value = value;
    $('#fe-dialog-back').classList.add('open');
    input.focus();
    input.select();

    const finish = val => {
      $('#fe-dialog-back').classList.remove('open');
      cleanup();
      resolve(val);
    };

    const ok     = () => finish(input.value.trim());
    const cancel = () => finish(null);
    const onKey  = ev => { if (ev.key === 'Enter') ok(); if (ev.key === 'Escape') cancel(); };

    $('#dlg-ok').onclick     = ok;
    $('#dlg-cancel').onclick = cancel;
    input.addEventListener('keydown', onKey);

    function cleanup() {
      $('#dlg-ok').onclick     = null;
      $('#dlg-cancel').onclick = null;
      input.removeEventListener('keydown', onKey);
    }
  });
}

// ---------------------------------------------------------------- Context menu

function showCtxMenu(x, y, entry, fullPath) {
  const path = fullPath || entryPath(entry.name);
  const menu = $('#ctxmenu');
  menu.innerHTML = '';

  const item = (label, icon, fn, danger = false) => {
    const btn = document.createElement('button');
    if (danger) btn.className = 'danger';
    btn.innerHTML = `<span class="mdi ${icon}"></span>${label}`;
    btn.onclick = () => { hideCtxMenu(); fn(); };
    menu.appendChild(btn);
  };
  const sep = () => {
    const d = document.createElement('div');
    d.className = 'sep';
    menu.appendChild(d);
  };

  if (entry.type === 'dir') {
    item(_t('Openen', 'Open'), 'mdi-folder-open-outline',
      () => navigate(path));
  } else {
    if (isFontFile(entry.name)) {
      item(_t('Voorbeeld', 'Preview'), 'mdi-format-font',
        () => openFontPreview(entry.name, path));
    }
    if (isTextFile(entry.name)) {
      item(_t('Bewerken', 'Edit'), 'mdi-file-edit-outline',
        () => openEditor(entry.name, path));
    }
    item(_t('Downloaden', 'Download'), 'mdi-download-outline',
      () => doDownload(entry.name, path));
  }
  sep();
  item(_t('Hernoemen', 'Rename'), 'mdi-pencil-outline', doRename);
  item(_t('Verplaatsen', 'Move'), 'mdi-folder-move-outline', doMove);
  sep();
  item(_t('Verwijderen', 'Delete'), 'mdi-delete-outline', doDelete, true);

  menu.classList.add('open');
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  requestAnimationFrame(() => {
    const r = menu.getBoundingClientRect();
    if (r.right  > window.innerWidth)  menu.style.left = (x - r.width)  + 'px';
    if (r.bottom > window.innerHeight) menu.style.top  = (y - r.height) + 'px';
  });
}

function hideCtxMenu() {
  $('#ctxmenu').classList.remove('open');
}

// ---------------------------------------------------------------- Toast

let toastTimer;
function toast(msg, isError = false) {
  const el = $('#fe-toast');
  el.textContent = msg;
  el.style.background = isError ? 'var(--red)' : '';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ---------------------------------------------------------------- Helpers

const enc     = s => encodeURIComponent(s);
const esc     = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtSize = b => b < 1024 ? b + ' B'
                   : b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB'
                   : (b / (1024 * 1024)).toFixed(1) + ' MB';

// ---------------------------------------------------------------- Init

document.addEventListener('DOMContentLoaded', () => {
  navigate('');

  $('#btn-theme-fe').onclick = () => window.haTheme?.toggle();
  $('#btn-upload').onclick   = () => $('#upload-input').click();

  // select-all checkbox in the table header
  const selAll = $('#fe-selall');
  if (selAll) selAll.onclick = () => {
    const rows = $$('#fe-tbody tr[data-path]');
    if (selAll.checked) rows.forEach(r => selected.add(r.dataset.path));
    else rows.forEach(r => selected.delete(r.dataset.path));
    renderSelection(); updateToolbar(); updateStatus();
  };

  // Text editor
  $('#fe-editor-save').onclick  = saveEditor;
  $('#fe-editor-close').onclick = closeEditor;
  $('#fe-fontprev-close').onclick = closeFontPreview;
  $('#fe-fontprev-back').addEventListener('mousedown', ev => { if (ev.target === $('#fe-fontprev-back')) closeFontPreview(); });
  $('#fe-editor-undo').onclick  = editorUndo;
  $('#fe-editor-redo').onclick  = editorRedo;
  const area = $('#fe-editor-area');
  area.addEventListener('input', _recordEdit);
  area.addEventListener('keydown', ev => {
    const ctrl = ev.ctrlKey || ev.metaKey;
    // Ctrl/Cmd+S saves
    if (ctrl && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveEditor(); return; }
    // Undo / Redo (use our own stack so the buttons and shortcuts agree)
    if (ctrl && ev.key.toLowerCase() === 'z' && !ev.shiftKey) { ev.preventDefault(); editorUndo(); return; }
    if (ctrl && (ev.key.toLowerCase() === 'y' || (ev.shiftKey && ev.key.toLowerCase() === 'z'))) { ev.preventDefault(); editorRedo(); return; }
    // Tab inserts two spaces
    if (ev.key === 'Tab') {
      ev.preventDefault();
      const s = area.selectionStart, e = area.selectionEnd;
      area.value = area.value.slice(0, s) + '  ' + area.value.slice(e);
      area.selectionStart = area.selectionEnd = s + 2;
      _recordEdit();
    }
    // Escape closes the editor
    if (ev.key === 'Escape') { ev.preventDefault(); closeEditor(); }
  });
  $('#fe-editor-back').addEventListener('mousedown', ev => {
    if (ev.target === $('#fe-editor-back')) closeEditor();
  });
  $('#btn-mkdir').onclick    = doMkdir;
  $('#btn-rename').onclick   = doRename;
  $('#btn-move').onclick     = doMove;
  $('#btn-download').onclick = () => { const [p] = [...selected]; if (p) doDownload(baseName(p), p); };
  $('#btn-delete').onclick   = doDelete;
  $('#btn-refresh').onclick  = () => navigate(currentPath);

  $('#upload-input').onchange = async ev => {
    await doUpload([...ev.target.files]);
    ev.target.value = '';
  };

  // Drag & drop upload
  const main = $('#fe-main');
  main.addEventListener('dragover',  ev => { ev.preventDefault(); main.classList.add('drag-over'); });
  main.addEventListener('dragleave', ev => { if (!main.contains(ev.relatedTarget)) main.classList.remove('drag-over'); });
  main.addEventListener('drop', async ev => {
    ev.preventDefault();
    main.classList.remove('drag-over');
    await doUpload([...ev.dataTransfer.files]);
  });

  // Close context menu
  document.addEventListener('click', ev => {
    if (!$('#ctxmenu').contains(ev.target)) hideCtxMenu();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', ev => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (ev.key === 'Delete' && selected.size)      { doDelete();  return; }
    if (ev.key === 'F2'     && selected.size === 1) { doRename(); return; }
    if (ev.key === 'F5')                            { navigate(currentPath); return; }
    if (ev.key === 'Escape') {
      selected.clear(); renderSelection(); updateToolbar(); updateStatus(); return;
    }
    if (ev.key === 'Backspace' && currentPath) {
      const parent = currentPath.includes('/') ? currentPath.split('/').slice(0, -1).join('/') : '';
      navigate(parent);
    }
  });
});

/* custom tooltips: replace the native title with a styled 1px-border tooltip */
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
    if(text){ el.setAttribute('data-tt', text); el.removeAttribute('title'); }
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
