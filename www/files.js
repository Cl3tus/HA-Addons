'use strict';

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let currentPath = '';
let entries     = [];
let selected    = new Set();

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
    else toast(`Upload mislukt: ${file.name}`, true);
  }
  return names;
}

// ---------------------------------------------------------------- SAMBA info

async function loadSambaInfo() {
  try {
    const d = await fetch('api/info').then(r => r.json());
    const host = d.samba_host || '';
    const badge = $('#samba-badge');
    if (badge) {
      badge.textContent = host
        ? `\\\\${host}\\addon_configs\\d5a9c741_eink_studio`
        : '\\\\<HA-IP>\\addon_configs\\d5a9c741_eink_studio';
      badge.parentElement.style.display = '';
    }
  } catch { /* ignore */ }
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
  } catch (e) {
    toast('Fout bij laden: ' + e.message, true);
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

  addCrumb('Add-on data', '', parts.length === 0);
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

  if (currentPath) {
    const parent = currentPath.includes('/')
      ? currentPath.split('/').slice(0, -1).join('/')
      : '';
    tbody.appendChild(makeRow({name: '..', type: '_up'}, parent));
  }

  ents.forEach(e => tbody.appendChild(makeRow(e, null)));

  empty.style.display = ents.length === 0 ? '' : 'none';
  updateStatus();
}

function makeRow(e, upPath) {
  const isUp   = e.type === '_up';
  const isDir  = e.type === 'dir';
  const isFile = e.type === 'file';

  const row = document.createElement('tr');
  if (!isUp) row.dataset.name = e.name;

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

  row.innerHTML = `
    <td>${icon}</td>
    <td class="${nameClass}">${esc(isUp ? '..' : e.name)}</td>
    <td class="fe-size">${size}</td>
    <td class="fe-date">${date}</td>`;

  if (isUp) {
    row.onclick = () => navigate(upPath);
    return row;
  }

  row.onclick = ev => {
    if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) selected.clear();
    if (selected.has(e.name)) selected.delete(e.name);
    else selected.add(e.name);
    renderSelection();
    updateToolbar();
    updateStatus();
  };

  row.ondblclick = () => {
    if (isDir) navigate(currentPath ? currentPath + '/' + e.name : e.name);
    else doDownload(e.name);
  };

  row.oncontextmenu = ev => {
    ev.preventDefault();
    if (!selected.has(e.name)) {
      selected.clear();
      selected.add(e.name);
      renderSelection();
      updateToolbar();
      updateStatus();
    }
    showCtxMenu(ev.clientX, ev.clientY, e);
  };

  return row;
}

function renderSelection() {
  $$('#fe-tbody tr[data-name]').forEach(row => {
    row.classList.toggle('sel', selected.has(row.dataset.name));
  });
}

function updateToolbar() {
  const n       = selected.size;
  const selEnts = [...selected].map(name => entries.find(e => e.name === name)).filter(Boolean);
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
  if (dirs)  parts.push(`${dirs} map${dirs  !== 1 ? 'pen' : ''}`);
  if (files) parts.push(`${files} bestand${files !== 1 ? 'en' : ''}`);
  $('#fe-status').textContent = parts.join(', ') || 'Leeg';

  const n = selected.size;
  $('#fe-sel-status').textContent = n ? `· ${n} geselecteerd` : '';
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

async function doDelete() {
  const names = [...selected];
  const label = names.length === 1 ? `"${names[0]}"` : `${names.length} items`;
  if (!confirm(`Verwijder ${label}? Dit kan niet ongedaan worden gemaakt.`)) return;
  try {
    for (const name of names) await apiDelete(entryPath(name));
    toast(`${names.length} item${names.length !== 1 ? 's' : ''} verwijderd`);
    await navigate(currentPath);
  } catch (e) {
    toast('Verwijderen mislukt: ' + e.message, true);
  }
}

function doDownload(name) {
  const a = document.createElement('a');
  a.href = `api/fs/download?path=${enc(entryPath(name))}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function doRename() {
  const [name] = [...selected];
  const entry  = entries.find(e => e.name === name);
  const newName = await showDialog(
    `Hernoemen: "${name}"`,
    name,
    entry?.type === 'file' ? 'Voer de nieuwe bestandsnaam in.' : 'Voer de nieuwe mapnaam in.'
  );
  if (!newName || newName === name) return;
  const dst = currentPath ? currentPath + '/' + newName : newName;
  try {
    await apiMove(entryPath(name), dst);
    toast(`Hernoemd naar "${newName}"`);
    await navigate(currentPath);
  } catch (e) {
    toast('Hernoemen mislukt: ' + e.message, true);
  }
}

async function doMove() {
  const names = [...selected];
  const label = names.length === 1 ? `"${names[0]}"` : `${names.length} items`;
  const dest  = await showDialog(
    `Verplaatsen: ${label}`,
    currentPath,
    'Voer het doelpad in (relatief aan /data). Leeg = root.'
  );
  if (dest === null) return;
  try {
    for (const name of names) {
      const dst = dest ? dest.replace(/\/$/, '') + '/' + name : name;
      await apiMove(entryPath(name), dst);
    }
    toast(`${names.length} item${names.length !== 1 ? 's' : ''} verplaatst`);
    await navigate(currentPath);
  } catch (e) {
    toast('Verplaatsen mislukt: ' + e.message, true);
  }
}

async function doMkdir() {
  const name = await showDialog('Nieuwe map aanmaken', '', 'Geef de naam van de nieuwe map.');
  if (!name) return;
  const path = currentPath ? currentPath + '/' + name : name;
  try {
    await apiMkdir(path);
    toast(`Map "${name}" aangemaakt`);
    await navigate(currentPath);
  } catch (e) {
    toast('Map aanmaken mislukt: ' + e.message, true);
  }
}

async function doUpload(files) {
  if (!files.length) return;
  toast('Bezig met uploaden…');
  const uploaded = await apiUpload(currentPath, files);
  if (uploaded.length) toast(`${uploaded.length} bestand${uploaded.length !== 1 ? 'en' : ''} geüpload`);
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

function showCtxMenu(x, y, entry) {
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
    item('Openen', 'mdi-folder-open-outline',
      () => navigate(entryPath(entry.name)));
  } else {
    item('Downloaden', 'mdi-download-outline',
      () => doDownload(entry.name));
  }
  sep();
  item('Hernoemen', 'mdi-pencil-outline', doRename);
  item('Verplaatsen', 'mdi-folder-move-outline', doMove);
  sep();
  item('Verwijderen', 'mdi-delete-outline', doDelete, true);

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
  loadSambaInfo();
  navigate('');

  $('#btn-upload').onclick   = () => $('#upload-input').click();
  $('#btn-mkdir').onclick    = doMkdir;
  $('#btn-rename').onclick   = doRename;
  $('#btn-move').onclick     = doMove;
  $('#btn-download').onclick = () => { const [n] = [...selected]; doDownload(n); };
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
