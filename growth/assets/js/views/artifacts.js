/* ============================================================
   artifacts.js — копилка готовых работ.
   Задачи складывают сюда результат автоматически.
   Отсюда берутся кейсы для основного портфолио.
   ============================================================ */

import { get, update, uid, today, logEvent, XP } from '../store.js';
import { esc, trackTag, TRACKS, fmtDate, on, modal, toast, confirmAsk } from '../ui.js';

const KINDS = ['PRD', 'Исследование', 'Дашборд', 'Анализ данных', 'Роадмап', 'Презентация', 'Код', 'Из задачи', 'Другое'];

export async function render(root) {
  let filter = 'all';

  function draw() {
    const s = get();
    const items = [...s.artifacts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const shown = items.filter(a => filter === 'all' || a.track === filter);

    root.innerHTML = `
      <div class="page-head">
        <h1>Артефакты</h1>
        <p>Готовые работы, которые можно показать. Задачи складывают результат сюда автоматически — отсюда берутся кейсы для основного портфолио.</p>
      </div>
      <div class="grid g4" style="margin-bottom:20px">
        <div class="stat"><div class="k">Всего</div><div class="v">${items.length}</div></div>
        <div class="stat"><div class="k">Со ссылкой</div><div class="v">${items.filter(a => a.link).length}</div>
          <div class="s">готовы к показу</div></div>
        <div class="stat"><div class="k">За 90 дней</div>
          <div class="v">${items.filter(a => a.date && (Date.now() - new Date(a.date)) < 90 * 86400000).length}</div></div>
      </div>
      <div class="row" style="margin-bottom:14px">
        <button class="btn accent" id="add">+ Добавить артефакт</button>
        <button class="btn ghost sm" id="copy">Скопировать список</button>
      </div>
      <div class="chips" id="chips">
        ${[['all', 'Все'], ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
          .map(([k, label]) => `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label}</button>`).join('')}
      </div>
      <div class="grid g2">
        ${shown.length ? shown.map(a => `
          <div class="card">
            <div class="row between" style="margin-bottom:10px">
              <span class="row" style="gap:6px">${a.track ? trackTag(a.track) : ''}<span class="tag">${esc(a.kind || 'Другое')}</span></span>
              <span class="muted" style="font-size:12.5px">${a.date ? fmtDate(a.date) : ''}</span>
            </div>
            <h3>${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.title)} ↗</a>` : esc(a.title)}</h3>
            ${a.note ? `<p>${esc(a.note)}</p>` : ''}
            ${!a.link ? '<p class="muted" style="margin-top:8px;font-size:12.5px">Нет ссылки — добавь, чтобы можно было показать</p>' : ''}
            <div class="row" style="margin-top:12px;gap:7px">
              <button class="btn ghost sm" data-edit="${a.id}">Изменить</button>
              <button class="btn ghost sm" data-del="${a.id}">Удалить</button>
            </div>
          </div>`).join('')
        : `<div class="empty" style="grid-column:1/-1"><b>Пока пусто</b>
            <p>Заверши любую практическую задачу — её артефакт появится здесь автоматически.</p>
            <p style="margin-top:14px"><a class="btn ghost" href="#/tasks">К задачам</a></p></div>`}
      </div>`;

    on(root, '[data-f]', el => { filter = el.dataset.f; draw(); });
    root.querySelector('#add').onclick = () => form(null);
    on(root, '[data-edit]', el => form(get().artifacts.find(a => a.id === el.dataset.edit)));
    on(root, '[data-del]', async el => {
      if (!await confirmAsk('Удалить артефакт?', 'Удалить')) return;
      update(s => { s.artifacts = s.artifacts.filter(a => a.id !== el.dataset.del); });
      draw();
    });
    root.querySelector('#copy').onclick = () => {
      const txt = shown.map(a => `• ${a.title}${a.kind ? ` (${a.kind})` : ''}${a.link ? ` — ${a.link}` : ''}`).join('\n');
      navigator.clipboard?.writeText(txt).then(
        () => toast('Список скопирован'),
        () => toast('Не удалось скопировать'));
    };
  }

  function form(existing) {
    const a = existing || { title: '', kind: 'PRD', track: 'product', link: '', note: '', date: today() };
    modal(`<h3>${existing ? 'Изменить артефакт' : 'Новый артефакт'}</h3>
      <label class="fld"><span>Название</span><input class="input" id="t" value="${esc(a.title)}" /></label>
      <label class="fld"><span>Тип</span><select class="select" id="k">
        ${KINDS.map(k => `<option${a.kind === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="fld"><span>Трек</span><select class="select" id="tr">
        ${Object.entries(TRACKS).map(([k, v]) => `<option value="${k}"${a.track === k ? ' selected' : ''}>${v.label}</option>`).join('')}</select></label>
      <label class="fld"><span>Ссылка</span><input class="input" id="l" value="${esc(a.link || '')}" placeholder="Docs, Figma, Notion, GitHub…" /></label>
      <label class="fld"><span>Дата</span><input class="input" id="d" type="date" value="${esc(a.date || today())}" /></label>
      <label class="fld"><span>Описание — что это и зачем</span>
        <textarea class="textarea" id="n" rows="3">${esc(a.note || '')}</textarea></label>
      <div class="row" style="justify-content:flex-end"><button class="btn accent" id="ok">Сохранить</button></div>`,
      (m, close) => {
        m.querySelector('#ok').onclick = () => {
          const title = m.querySelector('#t').value.trim();
          if (!title) return toast('Нужно название');
          const data = {
            title, kind: m.querySelector('#k').value, track: m.querySelector('#tr').value,
            link: m.querySelector('#l').value.trim(), date: m.querySelector('#d').value,
            note: m.querySelector('#n').value.trim(),
          };
          update(s => {
            if (existing) Object.assign(existing, data);
            else s.artifacts.push({ id: uid(), ...data });
          });
          if (!existing) logEvent('artifact', title, XP.artifact, 0);
          close(); draw(); toast(existing ? 'Сохранено' : `+${XP.artifact} XP`);
        };
      });
  }

  draw();
}
