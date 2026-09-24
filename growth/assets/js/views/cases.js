import { CASES } from '../../data/cases.js';
import { get } from '../store.js';
import { esc, trackTag, on } from '../ui.js';

export async function render(root) {
  let filter = 'all';
  const kinds = [...new Set(CASES.map(c => c.kind))];

  root.innerHTML = `
    <div class="page-head">
      <h1>Продуктовые кейсы</h1>
      <p>Вопросы с собеседований. Формат: 10 минут подготовки, ответ вслух под запись, потом сверка со структурой. Оценивается не правильный ответ, а видимая структура мышления.</p>
    </div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips'), list = root.querySelector('#list');

  function draw() {
    const s = get();
    const done = CASES.filter(c => s.cases[c.id]?.answered).length;
    chips.innerHTML = [['all', `Все ${CASES.length}`], ['todo', `Не пройдено ${CASES.length - done}`], ...kinds.map(k => [k, k])]
      .map(([k, label]) => `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${esc(k)}">${esc(label)}</button>`).join('');

    const items = CASES.filter(c => filter === 'all' ? true
      : filter === 'todo' ? !s.cases[c.id]?.answered : c.kind === filter);

    list.innerHTML = items.map(c => {
      const p = s.cases[c.id] || {};
      return `<a class="card" href="#/cases/${c.id}">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px">${trackTag(c.track)}<span class="tag">${esc(c.kind)}</span></span>
          ${p.answered ? `<span class="tag ${p.self >= 4 ? 'ok' : p.self >= 3 ? 'warn' : 'bad'}">Разобрано${p.self ? ` · ${p.self}/5` : ''}</span>` : ''}
        </div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.prompt.slice(0, 150))}${c.prompt.length > 150 ? '…' : ''}</p>
        <p class="muted" style="margin-top:10px;font-size:12.5px">${c.minutes} мин вслух · ${c.framework.length} шагов разбора</p>
      </a>`;
    }).join('');
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });
  draw();
}
