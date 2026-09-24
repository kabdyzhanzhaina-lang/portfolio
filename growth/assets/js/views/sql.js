/* ============================================================
   sql.js — SQL-песочница на sql.js (SQLite в браузере, WASM).
   База генерируется локально, ничего никуда не отправляется.
   Проверка: результат твоего запроса сравнивается с результатом
   эталонного, поэтому способ решения может быть любым.
   ============================================================ */

import { SQL_TASKS } from '../../data/sqltasks.js';
import { seedSQL, SCHEMA } from '../../data/db.js';
import { get, update, logEvent, XP } from '../store.js';
import { esc, toast, on } from '../ui.js';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
let dbPromise = null;

function loadSqlJs() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (window.initSqlJs) return resolve(window.initSqlJs);
    const sc = document.createElement('script');
    sc.src = CDN + 'sql-wasm.js';
    sc.onload = () => resolve(window.initSqlJs);
    sc.onerror = () => reject(new Error('Не удалось загрузить sql.js. Нужен интернет — движок SQLite подтягивается с CDN.'));
    document.head.appendChild(sc);
  }).then(init => init({ locateFile: f => CDN + f }))
    .then(SQL => { const db = new SQL.Database(); db.run(seedSQL()); return db; });
  return dbPromise;
}

/* ---- сравнение результатов ---- */
const SEP_CELL = String.fromCharCode(1);
const SEP_ROW = String.fromCharCode(2);

const norm = v => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return (Math.round(v * 10000) / 10000).toString();
  if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return (Math.round(Number(v) * 10000) / 10000).toString();
  return String(v).trim();
};
const rowKey = r => r.map(norm).join(SEP_CELL);

function equalResults(a, b, ordered) {
  if (!a || !b) return false;
  if (a.values.length !== b.values.length) return false;
  if (a.values.length && a.values[0].length !== b.values[0].length) return false;
  const A = a.values.map(rowKey), B = b.values.map(rowKey);
  if (ordered) return A.every((r, i) => r === B[i]);
  return [...A].sort().join(SEP_ROW) === [...B].sort().join(SEP_ROW);
}

function table(res, limit = 50) {
  if (!res) return '<p class="muted">Запрос не вернул данных.</p>';
  const rows = res.values.slice(0, limit);
  return `<div class="tbl-wrap"><table class="data">
    <thead><tr>${res.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v === null ? '<span style="opacity:.4">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>${res.values.length > limit
    ? `<p class="muted" style="margin-top:6px;font-size:12.5px">Показаны первые ${limit} из ${res.values.length} строк</p>`
    : `<p class="muted" style="margin-top:6px;font-size:12.5px">${res.values.length} строк</p>`}`;
}

export async function render(root) {
  const s0 = get();
  let cur = SQL_TASKS.find(t => !s0.sql[t.id]?.solved)?.id || SQL_TASKS[0].id;

  root.innerHTML = `
    <div class="page-head">
      <h1>SQL-песочница</h1>
      <p>Настоящая база SQLite прямо в браузере: пользователи, заказы, товары, события.</p>
    </div>
    <div class="card"><p class="muted">Загружаю движок SQLite…</p></div>`;

  let db;
  try { db = await loadSqlJs(); }
  catch (e) {
    root.querySelector('.card').innerHTML = `<b>Не получилось</b><p class="muted" style="margin-top:6px">${esc(e.message)}</p>`;
    return;
  }

  root.innerHTML = `
    <div class="page-head">
      <h1>SQL-песочница</h1>
      <p>Настоящая база SQLite прямо в браузере. Решение проверяется по результату, а не по тексту запроса — способ может быть любым.</p>
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,250px) minmax(0,1fr);gap:20px;align-items:start" id="wrap">
      <div id="nav"></div><div id="pane"></div>
    </div>`;

  const mq = window.matchMedia('(max-width: 900px)');
  const applyMQ = () => {
    root.querySelector('#wrap').style.gridTemplateColumns = mq.matches ? '1fr' : 'minmax(0,250px) minmax(0,1fr)';
  };
  mq.addEventListener('change', applyMQ); applyMQ();

  const nav = root.querySelector('#nav'), pane = root.querySelector('#pane');

  function drawNav() {
    const s = get();
    const solved = SQL_TASKS.filter(t => s.sql[t.id]?.solved).length;
    let lastLevel = '';
    nav.innerHTML = `<div class="card" style="padding:14px">
        <div class="row between" style="margin-bottom:10px"><b style="font-size:14px">Задачи</b>
          <span class="muted">${solved}/${SQL_TASKS.length}</span></div>
        <div class="bar ${solved === SQL_TASKS.length ? 'ok' : ''}" style="margin-bottom:12px"><i style="width:${Math.round(solved / SQL_TASKS.length * 100)}%"></i></div>
        ${SQL_TASKS.map(t => {
          const head = t.level !== lastLevel ? `<div class="side-label" style="margin-top:10px">${esc(t.level)}</div>` : '';
          lastLevel = t.level;
          return head + `<button class="side-link${cur === t.id ? ' is-active' : ''}" data-t="${t.id}" style="width:100%">
            <i>${s.sql[t.id]?.solved ? '✓' : '○'}</i><span style="font-size:13.5px">${esc(t.title)}</span></button>`;
        }).join('')}
      </div>
      <div class="card" style="padding:14px;margin-top:14px">
        <b style="font-size:14px">Схема базы</b>
        ${SCHEMA.map(t => `<div style="margin-top:10px">
          <div class="mono" style="font-weight:500;color:var(--accent-ink)">${esc(t.table)}</div>
          <div class="muted" style="font-size:12px;line-height:1.45">${esc(t.cols)}</div></div>`).join('')}
      </div>`;
  }

  function drawPane() {
    const t = SQL_TASKS.find(x => x.id === cur);
    const p = get().sql[t.id] || {};
    pane.innerHTML = `
      <div class="card">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px"><span class="tag">${esc(t.level)}</span>
            ${p.solved ? '<span class="tag ok">Решено</span>' : ''}
            ${t.ordered ? '<span class="tag accent">Порядок строк важен</span>' : ''}</span>
        </div>
        <h3 style="font-size:19px">${esc(t.title)}</h3>
        <p style="margin-top:8px;font-size:15px;color:var(--ink-2)">${esc(t.question)}</p>
      </div>

      <textarea class="editor" id="ed" spellcheck="false" style="min-height:170px;margin-top:14px"
        placeholder="SELECT …">${esc(p.sql || '')}</textarea>

      <div class="row" style="margin-top:12px">
        <button class="btn accent" id="run">Выполнить и проверить</button>
        <button class="btn ghost" id="just">Просто выполнить</button>
        <span class="spacer"></span>
        <button class="btn ghost sm" id="hint">Подсказка</button>
        <button class="btn ghost sm" id="sol">Решение</button>
      </div>

      <div id="out" style="margin-top:14px"></div>`;

    const ed = pane.querySelector('#ed'), out = pane.querySelector('#out');
    ed.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') pane.querySelector('#run').click();
    });

    pane.querySelector('#hint').onclick = () => {
      out.innerHTML = `<div class="explain"><b>Подсказка. </b>${esc(t.hint)}</div>`;
    };
    pane.querySelector('#sol').onclick = () => {
      out.innerHTML = `<div class="explain"><b>Эталонное решение</b><pre class="mono" style="margin-top:8px;white-space:pre-wrap">${esc(t.solution)}</pre></div>`;
    };

    const exec = (check) => {
      const sql = ed.value.trim();
      if (!sql) return toast('Напиши запрос');
      update(s => { s.sql[t.id] = { ...(s.sql[t.id] || {}), sql }; });

      let mine;
      try { mine = db.exec(sql)[0] || { columns: [], values: [] }; }
      catch (err) {
        out.innerHTML = `<div class="console"><span class="fail">Ошибка SQL: ${esc(err.message)}</span></div>`;
        return;
      }
      if (!check) { out.innerHTML = table(mine); return; }

      const ref = db.exec(t.solution)[0];
      const ok = equalResults(mine, ref, t.ordered);
      out.innerHTML = `
        <div class="explain" style="border-color:${ok ? 'var(--ok)' : 'var(--bad)'};margin-bottom:12px">
          <b>${ok ? 'Верно. ' : 'Пока не сходится. '}</b>
          ${ok ? 'Результат совпал с эталонным.'
               : `Твой запрос вернул строк: ${mine.values.length}, колонок: ${mine.columns.length}. Ожидалось строк: ${ref.values.length}, колонок: ${ref.columns.length}. Проверь фильтры, группировку и сортировку.`}
        </div>
        ${table(mine)}`;

      if (ok && !get().sql[t.id]?.solved) {
        update(s => { s.sql[t.id] = { ...(s.sql[t.id] || {}), solved: true, solvedAt: new Date().toISOString() }; });
        logEvent('sql', t.id, XP.sql, 10);
        toast(`+${XP.sql} XP — задача решена`);
        drawNav();
      }
    };

    pane.querySelector('#run').onclick = () => exec(true);
    pane.querySelector('#just').onclick = () => exec(false);
    ed.focus();
  }

  on(nav, '[data-t]', el => { cur = el.dataset.t; drawNav(); drawPane(); });
  drawNav(); drawPane();
  return () => mq.removeEventListener('change', applyMQ);
}
