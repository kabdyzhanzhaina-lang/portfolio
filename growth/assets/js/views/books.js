import { BOOKS } from '../../data/books.js';
import { get, update, logEvent, XP } from '../store.js';
import { esc, trackTag, TRACKS, on, modal, toast } from '../ui.js';

const STATUS = { want: 'Хочу прочитать', reading: 'Читаю', done: 'Прочитано' };

export async function render(root) {
  let filter = 'all';
  root.innerHTML = `
    <div class="page-head">
      <h1>Книги</h1>
      <p>Полка с приоритетами. Заметка «главная мысль в одном предложении» — обязательна: без неё книга забудется за месяц.</p>
    </div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips');
  const list = root.querySelector('#list');

  function draw() {
    const s = get();
    const counts = { all: BOOKS.length, want: 0, reading: 0, done: 0 };
    BOOKS.forEach(b => { const st = s.books[b.id]?.status; if (st) counts[st]++; });

    chips.innerHTML = [['all', 'Все'], ['reading', 'Читаю'], ['done', 'Прочитано'], ['want', 'Хочу'],
      ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label}${counts[k] != null ? ` <span style="opacity:.55">${counts[k]}</span>` : ''}</button>`).join('');

    const items = BOOKS.filter(b => {
      if (filter === 'all') return true;
      if (TRACKS[filter]) return b.track === filter;
      return s.books[b.id]?.status === filter;
    }).sort((a, b) => a.priority - b.priority);

    list.innerHTML = items.length ? items.map(b => {
      const p = s.books[b.id] || {};
      return `<div class="card">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px">${trackTag(b.track)}
            ${b.priority === 1 ? '<span class="tag accent">Сначала</span>' : ''}</span>
          ${p.status ? `<span class="tag ${p.status === 'done' ? 'ok' : p.status === 'reading' ? 'warn' : ''}">${STATUS[p.status]}</span>` : ''}
        </div>
        <h3>${esc(b.title)}</h3>
        <p style="margin-top:2px;color:var(--ink-2)">${esc(b.author)} · ${b.year} · ~${b.hours} ч${b.ru && b.ru !== b.title ? ` · «${esc(b.ru)}»` : ''}</p>
        <p style="margin-top:10px">${esc(b.why)}</p>
        <details style="margin-top:12px">
          <summary class="muted" style="cursor:pointer;font-size:13.5px">Ключевые идеи</summary>
          <ul style="margin-top:8px">${b.takeaways.map(t => `<li class="muted" style="font-size:14px;padding:3px 0">— ${esc(t)}</li>`).join('')}</ul>
        </details>
        ${p.idea ? `<div class="explain" style="margin-top:12px"><b>Моя главная мысль: </b>${esc(p.idea)}</div>` : ''}
        ${p.best != null ? `<div class="row" style="margin-top:10px"><span class="tag ${p.best >= 80 ? 'ok' : 'warn'}">Тест ${p.best}%</span></div>` : ''}
        <div class="row" style="margin-top:14px;gap:7px">
          <select class="select" data-status="${b.id}" style="max-width:170px">
            <option value="">— статус —</option>
            ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${p.status === k ? ' selected' : ''}>${v}</option>`).join('')}
          </select>
          <button class="btn ghost sm" data-note="${b.id}">Заметка</button>
          ${b.quiz?.length ? `<a class="btn sm" href="#/quiz/book/${b.id}">Тест</a>` : ''}
        </div>
      </div>`;
    }).join('') : '<div class="empty"><b>Пусто</b><p>В этом фильтре книг нет.</p></div>';
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });

  on(list, '[data-status]', el => {
    const id = el.dataset.status, val = el.value;
    const was = get().books[id]?.status;
    update(s => {
      s.books[id] = { ...(s.books[id] || {}), status: val || undefined };
      if (val === 'reading' && !s.books[id].startedAt) s.books[id].startedAt = new Date().toISOString();
      if (val === 'done') s.books[id].finishedAt = new Date().toISOString();
    });
    if (val === 'done' && was !== 'done') { logEvent('book', id, XP.book, 0); toast(`+${XP.book} XP — книга прочитана`); }
    else if (val === 'reading' && !was) logEvent('bookStart', id, XP.bookStart, 0);
    draw();
  }, 'change');

  on(list, '[data-note]', el => {
    const id = el.dataset.note;
    const b = BOOKS.find(x => x.id === id);
    const p = get().books[id] || {};
    modal(`<h3>${esc(b.title)}</h3>
      <label class="fld"><span>Главная мысль в одном предложении</span>
        <input class="input" id="idea" value="${esc(p.idea || '')}" placeholder="Если бы пришлось пересказать книгу одной фразой…" /></label>
      <label class="fld"><span>Заметки</span>
        <textarea class="textarea" id="note" rows="8" placeholder="Цитаты, мысли, что применить">${esc(p.note || '')}</textarea></label>
      <div class="row" style="justify-content:flex-end"><button class="btn accent" id="save">Сохранить</button></div>`,
      (m, close) => {
        m.querySelector('#save').onclick = () => {
          const idea = m.querySelector('#idea').value.trim();
          const note = m.querySelector('#note').value.trim();
          update(s => { s.books[id] = { ...(s.books[id] || {}), idea, note }; });
          close(); draw(); toast('Сохранено');
        };
      });
  });

  draw();
}
