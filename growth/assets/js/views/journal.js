import { get, update, uid, today, logEvent, XP } from '../store.js';
import { esc, fmtDate, on, toast, confirmAsk } from '../ui.js';

export async function render(root) {
  function draw() {
    const s = get();
    const entries = [...s.journal].sort((a, b) => b.date.localeCompare(a.date));
    const hasToday = entries.some(e => e.date === today());

    root.innerHTML = `
      <div class="page-head">
        <h1>Дневник</h1>
        <p>Две минуты в конце дня. Обучение без рефлексии забывается: запись превращает «прочитала» в «поняла и применила».</p>
      </div>

      <div class="card">
        <div class="row between" style="margin-bottom:14px">
          <b style="font-size:15px">${hasToday ? 'Запись за сегодня уже есть — можно добавить ещё' : 'Запись за сегодня'}</b>
          <span class="tag">${fmtDate(today())}</span>
        </div>
        <label class="fld"><span>Что нового узнала</span>
          <textarea class="textarea" id="learned" rows="3" placeholder="Конкретно: не «читала про метрики», а «поняла, почему LTV считают с маржой»"></textarea></label>
        <label class="fld"><span>Что применила или применю</span>
          <textarea class="textarea" id="applied" rows="2" placeholder="Где именно это пригодится в работе"></textarea></label>
        <label class="fld"><span>Где застряла</span>
          <textarea class="textarea" id="stuck" rows="2" placeholder="Что осталось непонятным — это список вопросов на завтра"></textarea></label>
        <label class="fld"><span>Следующий шаг</span>
          <input class="input" id="next" placeholder="Одно конкретное действие на завтра" /></label>
        <div class="row">
          <span class="muted">Как прошёл день:</span>
          ${[1, 2, 3, 4, 5].map(n => `<button class="btn ghost sm" data-mood="${n}">${n}</button>`).join('')}
          <span class="spacer"></span>
          <button class="btn accent" id="save">Сохранить</button>
        </div>
      </div>

      <h2 class="sec">История${entries.length ? ` · ${entries.length}` : ''}</h2>
      ${entries.length ? entries.map(e => `
        <div class="card" style="margin-bottom:12px">
          <div class="row between" style="margin-bottom:10px">
            <span class="tag">${fmtDate(e.date)}</span>
            <span class="row" style="gap:8px">
              ${e.mood ? `<span class="tag ${e.mood >= 4 ? 'ok' : e.mood >= 3 ? 'warn' : 'bad'}">${e.mood}/5</span>` : ''}
              <button class="btn ghost sm" data-del="${e.id}">Удалить</button>
            </span>
          </div>
          ${e.learned ? `<p style="font-size:15px"><b style="font-weight:620">Узнала. </b>${esc(e.learned)}</p>` : ''}
          ${e.applied ? `<p style="font-size:15px;margin-top:6px;color:var(--ink-2)"><b style="font-weight:620">Применила. </b>${esc(e.applied)}</p>` : ''}
          ${e.stuck ? `<p style="font-size:15px;margin-top:6px;color:var(--ink-2)"><b style="font-weight:620">Застряла. </b>${esc(e.stuck)}</p>` : ''}
          ${e.next ? `<div class="explain" style="margin-top:10px"><b>Следующий шаг: </b>${esc(e.next)}</div>` : ''}
        </div>`).join('')
      : '<div class="empty"><b>Записей пока нет</b><p>Первая займёт две минуты.</p></div>'}`;

    let mood = 0;
    on(root, '[data-mood]', el => {
      mood = +el.dataset.mood;
      root.querySelectorAll('[data-mood]').forEach(b => {
        b.classList.toggle('accent', +b.dataset.mood === mood);
        b.classList.toggle('ghost', +b.dataset.mood !== mood);
      });
    });

    root.querySelector('#save').onclick = () => {
      const learned = root.querySelector('#learned').value.trim();
      const applied = root.querySelector('#applied').value.trim();
      const stuck = root.querySelector('#stuck').value.trim();
      const next = root.querySelector('#next').value.trim();
      if (!learned && !applied && !stuck && !next) return toast('Заполни хотя бы одно поле');
      update(s => s.journal.push({ id: uid(), date: today(), learned, applied, stuck, next, mood }));
      logEvent('journal', today(), XP.journal, 2);
      toast(`+${XP.journal} XP`);
      draw();
    };

    on(root, '[data-del]', async el => {
      if (!await confirmAsk('Удалить запись?', 'Удалить')) return;
      update(s => { s.journal = s.journal.filter(j => j.id !== el.dataset.del); });
      draw();
    });
  }

  draw();
}
