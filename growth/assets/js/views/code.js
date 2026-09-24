/* ============================================================
   code.js — задачи по JS с автопроверкой.
   Код выполняется в браузере через new Function — это твой
   собственный код в твоей же вкладке, ничего никуда не уходит.
   ============================================================ */

import { CODE_TASKS } from '../../data/codetasks.js';
import { get, update, logEvent, XP } from '../store.js';
import { esc, toast, on } from '../ui.js';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const show = v => JSON.stringify(v) ?? String(v);

export async function render(root) {
  const s0 = get();
  let cur = CODE_TASKS.find(t => !s0.code[t.id]?.solved)?.id || CODE_TASKS[0].id;

  root.innerHTML = `
    <div class="page-head">
      <h1>Код</h1>
      <p>Задачи на JavaScript — от суммы массива до расчёта удержания. Пиши функцию <code class="mono">solve</code>, тесты прогонятся сами.</p>
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:20px;align-items:start" id="wrap">
      <div id="nav"></div>
      <div id="pane"></div>
    </div>`;

  // на узких экранах — в одну колонку
  const mq = window.matchMedia('(max-width: 900px)');
  const applyMQ = () => { root.querySelector('#wrap').style.gridTemplateColumns = mq.matches ? '1fr' : 'minmax(0,260px) minmax(0,1fr)'; };
  mq.addEventListener('change', applyMQ); applyMQ();

  const nav = root.querySelector('#nav'), pane = root.querySelector('#pane');

  function drawNav() {
    const s = get();
    const solved = CODE_TASKS.filter(t => s.code[t.id]?.solved).length;
    let lastLevel = '';
    nav.innerHTML = `<div class="card" style="padding:14px">
      <div class="row between" style="margin-bottom:10px"><b style="font-size:14px">Задачи</b>
        <span class="muted">${solved}/${CODE_TASKS.length}</span></div>
      <div class="bar ${solved === CODE_TASKS.length ? 'ok' : ''}" style="margin-bottom:12px"><i style="width:${Math.round(solved / CODE_TASKS.length * 100)}%"></i></div>
      ${CODE_TASKS.map(t => {
        const head = t.level !== lastLevel ? `<div class="side-label" style="margin-top:10px">${esc(t.level)}</div>` : '';
        lastLevel = t.level;
        return head + `<button class="side-link${cur === t.id ? ' is-active' : ''}" data-t="${t.id}" style="width:100%">
          <i>${s.code[t.id]?.solved ? '✓' : '○'}</i><span style="font-size:13.5px">${esc(t.title)}</span></button>`;
      }).join('')}
    </div>`;
  }

  function drawPane() {
    const t = CODE_TASKS.find(x => x.id === cur);
    const p = get().code[t.id] || {};
    pane.innerHTML = `
      <div class="card">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px"><span class="tag">${esc(t.level)}</span>
            ${p.solved ? '<span class="tag ok">Решено</span>' : ''}</span>
        </div>
        <h3 style="font-size:19px">${esc(t.title)}</h3>
        <p style="margin-top:8px;font-size:15px;color:var(--ink-2)">${esc(t.prompt)}</p>
      </div>

      <textarea class="editor" id="ed" spellcheck="false" style="margin-top:14px">${esc(p.code || t.starter)}</textarea>

      <div class="row" style="margin-top:12px">
        <button class="btn accent" id="run">Запустить тесты</button>
        <button class="btn ghost" id="reset">Сбросить</button>
        <span class="spacer"></span>
        <button class="btn ghost sm" id="sol">Показать решение</button>
      </div>

      <div id="out" class="console" style="margin-top:14px;display:none"></div>`;

    const ed = pane.querySelector('#ed'), out = pane.querySelector('#out');

    // Tab вставляет отступ, а не уводит фокус
    ed.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const st = ed.selectionStart, en = ed.selectionEnd;
        ed.value = ed.value.slice(0, st) + '  ' + ed.value.slice(en);
        ed.selectionStart = ed.selectionEnd = st + 2;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') pane.querySelector('#run').click();
    });

    pane.querySelector('#reset').onclick = () => { ed.value = t.starter; out.style.display = 'none'; };
    pane.querySelector('#sol').onclick = () => {
      out.style.display = 'block';
      out.innerHTML = `<span class="dim">Один из возможных вариантов:</span>\n\n${esc(t.solution)}`;
    };

    pane.querySelector('#run').onclick = () => {
      const code = ed.value;
      update(s => { s.code[t.id] = { ...(s.code[t.id] || {}), code }; });
      out.style.display = 'block';

      let fn;
      try {
        fn = new Function(`"use strict";${code}; return typeof solve === 'function' ? solve : null;`)();
      } catch (err) {
        out.innerHTML = `<span class="fail">Ошибка в коде: ${esc(err.message)}</span>`;
        return;
      }
      if (!fn) { out.innerHTML = `<span class="fail">Не нашла функцию solve. Она должна называться именно так.</span>`; return; }

      const lines = [];
      let passed = 0;
      for (const test of t.tests) {
        let got, err = null;
        try { got = fn(...structuredClone(test.args)); }
        catch (e) { err = e.message; }
        const ok = !err && same(got, test.expected);
        if (ok) passed++;
        lines.push(`<span class="${ok ? 'pass' : 'fail'}">${ok ? '✓' : '✗'}</span> solve(${test.args.map(show).join(', ')})\n` +
          `   <span class="dim">ожидалось:</span> ${esc(show(test.expected))}\n` +
          `   <span class="dim">получено:  </span> ${err ? `<span class="fail">ошибка: ${esc(err)}</span>` : esc(show(got))}`);
      }

      const all = passed === t.tests.length;
      out.innerHTML = lines.join('\n\n') + `\n\n<b class="${all ? 'pass' : 'fail'}">${passed} из ${t.tests.length} тестов пройдено</b>`;

      if (all && !get().code[t.id]?.solved) {
        update(s => { s.code[t.id] = { ...(s.code[t.id] || {}), solved: true, solvedAt: new Date().toISOString() }; });
        logEvent('code', t.id, XP.code, 10);
        toast(`+${XP.code} XP — задача решена`);
        drawNav(); drawPane();
      }
    };
  }

  on(nav, '[data-t]', el => { cur = el.dataset.t; drawNav(); drawPane(); });
  drawNav(); drawPane();
  return () => mq.removeEventListener('change', applyMQ);
}
