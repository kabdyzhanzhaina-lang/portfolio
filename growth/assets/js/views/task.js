import { TASKS } from '../../data/tasks.js';
import { get, update, logEvent, XP, uid, today } from '../store.js';
import { esc, trackTag, toast, on } from '../ui.js';

export async function render(root, [id]) {
  const t = TASKS.find(x => x.id === id);
  if (!t) { root.innerHTML = '<div class="empty"><b>Задача не найдена</b></div>'; return; }

  function draw() {
    const p = get().tasks[t.id] || {};
    const steps = p.steps || new Array(t.steps.length).fill(false);
    const n = steps.filter(Boolean).length;
    const pct = Math.round(n / t.steps.length * 100);

    root.innerHTML = `
      <a class="muted" href="#/tasks">← Все задачи</a>
      <div class="page-head" style="margin-top:14px">
        <div class="row" style="margin-bottom:12px">
          ${trackTag(t.track)}<span class="tag">${esc(t.level)}</span><span class="tag">~${t.hours} ч</span>
          ${p.status === 'done' ? '<span class="tag ok">Готово</span>' : p.status === 'doing' ? '<span class="tag warn">В работе</span>' : ''}
        </div>
        <h1>${esc(t.title)}</h1>
        <p>${esc(t.goal)}</p>
      </div>

      <div class="callout" style="margin-bottom:22px"><b>Артефакт на выходе: </b>${esc(t.artifact)}</div>

      <div class="card">
        <div class="row between" style="margin-bottom:8px">
          <b style="font-size:15px">Шаги</b>
          <span class="muted">${n} из ${t.steps.length}</span>
        </div>
        <div class="bar ${pct === 100 ? 'ok' : ''}" style="margin-bottom:14px"><i style="width:${pct}%"></i></div>
        ${t.steps.map((s, i) => `
          <label class="checkline${steps[i] ? ' done' : ''}">
            <input type="checkbox" data-step="${i}"${steps[i] ? ' checked' : ''} />
            <span>${esc(s)}</span>
          </label>`).join('')}
      </div>

      <div class="explain" style="margin-top:16px"><b>Подсказка. </b>${esc(t.hint)}</div>

      <div class="card" style="margin-top:20px">
        <label class="fld"><span>Ссылка на результат</span>
          <input class="input" id="link" value="${esc(p.link || '')}" placeholder="Google Docs, Figma, Notion, GitHub…" /></label>
        <label class="fld"><span>Заметки по ходу</span>
          <textarea class="textarea" id="note" rows="5" placeholder="Что получилось, что было сложно, что бы сделала иначе">${esc(p.note || '')}</textarea></label>
        <div class="row">
          <button class="btn ghost" id="save">Сохранить</button>
          <span class="spacer"></span>
          ${p.status !== 'done'
            ? `<button class="btn ghost" id="start">${p.status === 'doing' ? 'В работе' : 'Начать'}</button>
               <button class="btn accent" id="done">Завершить задачу</button>`
            : `<button class="btn ghost" id="undone">Вернуть в работу</button>`}
        </div>
      </div>`;

    on(root, '[data-step]', el => {
      const i = +el.dataset.step;
      update(s => {
        const cur = s.tasks[t.id] || {};
        const arr = cur.steps ? [...cur.steps] : new Array(t.steps.length).fill(false);
        arr[i] = el.checked;
        s.tasks[t.id] = { ...cur, steps: arr, status: cur.status === 'done' ? 'done' : 'doing', startedAt: cur.startedAt || new Date().toISOString() };
      });
      draw();
    }, 'change');

    root.querySelector('#save').onclick = () => {
      update(s => {
        s.tasks[t.id] = { ...(s.tasks[t.id] || {}),
          link: root.querySelector('#link').value.trim(),
          note: root.querySelector('#note').value.trim() };
      });
      toast('Сохранено');
    };

    root.querySelector('#start')?.addEventListener('click', () => {
      update(s => { s.tasks[t.id] = { ...(s.tasks[t.id] || {}), status: 'doing', startedAt: new Date().toISOString() }; });
      draw();
    });

    root.querySelector('#done')?.addEventListener('click', () => {
      const link = root.querySelector('#link').value.trim();
      update(s => {
        s.tasks[t.id] = { ...(s.tasks[t.id] || {}), status: 'done', doneAt: new Date().toISOString(), link,
          note: root.querySelector('#note').value.trim(),
          steps: new Array(t.steps.length).fill(true) };
        // артефакт сразу попадает в копилку для портфолио
        if (!s.artifacts.some(a => a.taskId === t.id)) {
          s.artifacts.push({ id: uid(), taskId: t.id, title: t.artifact, kind: 'Из задачи',
            track: t.track, link, note: t.title, date: today() });
        }
      });
      logEvent('task', t.id, XP.task, t.hours * 60);
      toast(`+${XP.task} XP — артефакт добавлен`);
      draw();
    });

    root.querySelector('#undone')?.addEventListener('click', () => {
      update(s => { s.tasks[t.id] = { ...(s.tasks[t.id] || {}), status: 'doing' }; });
      draw();
    });
  }

  draw();
}
