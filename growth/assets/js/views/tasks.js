import { TASKS } from '../../data/tasks.js';
import { get } from '../store.js';
import { esc, trackTag, TRACKS, on } from '../ui.js';

export async function render(root) {
  let filter = 'all';
  root.innerHTML = `
    <div class="page-head">
      <h1>Практические задачи</h1>
      <p>Каждая заканчивается артефактом, который можно показать работодателю. Это главное отличие от курсов: на выходе не галочка, а работа.</p>
    </div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips'), list = root.querySelector('#list');

  function draw() {
    const s = get();
    const done = TASKS.filter(t => s.tasks[t.id]?.status === 'done').length;
    const doing = TASKS.filter(t => s.tasks[t.id]?.status === 'doing').length;
    chips.innerHTML = [['all', `Все ${TASKS.length}`], ['doing', `В работе ${doing}`], ['done', `Готово ${done}`],
      ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label}</button>`).join('');

    const items = TASKS.filter(t => {
      if (filter === 'all') return true;
      if (TRACKS[filter]) return t.track === filter;
      return s.tasks[t.id]?.status === filter;
    });

    list.innerHTML = items.length ? items.map(t => {
      const p = s.tasks[t.id] || {};
      const steps = p.steps || [];
      const n = steps.filter(Boolean).length;
      const pct = Math.round(n / t.steps.length * 100);
      return `<a class="card" href="#/tasks/${t.id}">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px">${trackTag(t.track)}<span class="tag">${esc(t.level)}</span></span>
          ${p.status === 'done' ? '<span class="tag ok">Готово</span>' : p.status === 'doing' ? '<span class="tag warn">В работе</span>' : ''}
        </div>
        <h3>${esc(t.title)}</h3>
        <p>${esc(t.goal)}</p>
        <p style="margin-top:8px;color:var(--ink-2)"><b style="font-weight:620">Артефакт:</b> ${esc(t.artifact)}</p>
        ${n ? `<div class="bar ${pct === 100 ? 'ok' : ''}" style="margin-top:12px"><i style="width:${pct}%"></i></div>
               <p class="muted" style="margin-top:6px;font-size:12.5px">${n} из ${t.steps.length} шагов</p>`
            : `<p class="muted" style="margin-top:12px;font-size:12.5px">${t.steps.length} шагов · ~${t.hours} ч</p>`}
      </a>`;
    }).join('') : '<div class="empty"><b>Пусто</b><p>В этом фильтре задач нет.</p></div>';
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });
  draw();
}
