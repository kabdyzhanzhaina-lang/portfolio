import { ARTICLES } from '../../data/articles.js';
import { get } from '../store.js';
import { esc, trackTag, TRACKS, on } from '../ui.js';

export async function render(root) {
  let filter = 'all';
  root.innerHTML = `
    <div class="page-head">
      <h1>Статьи</h1>
      <p>Конспекты по четырём трекам. После каждой — тест, ошибки уходят в повторения.</p>
    </div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips');
  const list = root.querySelector('#list');

  function draw() {
    const s = get();
    chips.innerHTML = [['all', 'Все'], ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => {
        const n = k === 'all' ? ARTICLES.length : ARTICLES.filter(a => a.track === k).length;
        return `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label} <span style="opacity:.55">${n}</span></button>`;
      }).join('');

    const items = ARTICLES.filter(a => filter === 'all' || a.track === filter);
    list.innerHTML = items.map(a => {
      const p = s.articles[a.id] || {};
      return `<a class="card" href="#/articles/${a.id}">
        <div class="row between" style="margin-bottom:10px">
          ${trackTag(a.track)}
          <span class="row" style="gap:6px">
            ${p.status === 'read' ? '<span class="tag ok">Прочитано</span>' : ''}
            ${p.best != null ? `<span class="tag ${p.best >= 80 ? 'ok' : p.best >= 50 ? 'warn' : 'bad'}">Тест ${p.best}%</span>` : ''}
          </span>
        </div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.summary)}</p>
        <div class="row muted" style="margin-top:12px;font-size:12.5px;gap:14px">
          <span>${a.minutes} мин</span><span>${esc(a.level)}</span><span>${a.quiz.length} вопросов</span>
        </div>
      </a>`;
    }).join('');
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });
  draw();
}
