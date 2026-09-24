import { RESOURCES } from '../../data/resources.js';
import { get, update, uid } from '../store.js';
import { esc, trackTag, TRACKS, on, modal, toast, confirmAsk } from '../ui.js';

const STATUS = { want: 'Хочу изучить', doing: 'Изучаю', done: 'Пройдено' };

export async function render(root) {
  let filter = 'all';

  root.innerHTML = `
    <div class="page-head">
      <h1>Ресурсы</h1>
      <p>Курсы, блоги, инструменты и тренажёры. Свои ссылки можно добавлять — они хранятся вместе с прогрессом.</p>
    </div>
    <div class="row" style="margin-bottom:14px"><button class="btn ghost sm" id="add">+ Добавить свой ресурс</button></div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips'), list = root.querySelector('#list');
  const all = () => [...RESOURCES, ...get().customResources];

  function draw() {
    const s = get();
    const items0 = all();
    chips.innerHTML = [['all', 'Все'], ['doing', 'Изучаю'], ['done', 'Пройдено'],
      ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => {
        const n = k === 'all' ? items0.length
          : TRACKS[k] ? items0.filter(r => r.track === k).length
          : items0.filter(r => s.resources[r.id]?.status === k).length;
        return `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label} <span style="opacity:.55">${n}</span></button>`;
      }).join('');

    const items = items0.filter(r => filter === 'all' ? true
      : TRACKS[filter] ? r.track === filter : s.resources[r.id]?.status === filter);

    list.innerHTML = items.length ? items.map(r => {
      const p = s.resources[r.id] || {};
      return `<div class="card">
        <div class="row between" style="margin-bottom:10px">
          <span class="row" style="gap:6px">${trackTag(r.track)}<span class="tag">${esc(r.kind)}</span>
            ${r.custom ? '<span class="tag accent">Своё</span>' : ''}</span>
          ${p.status ? `<span class="tag ${p.status === 'done' ? 'ok' : p.status === 'doing' ? 'warn' : ''}">${STATUS[p.status]}</span>` : ''}
        </div>
        <h3><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ↗</a></h3>
        ${r.note ? `<p>${esc(r.note)}</p>` : ''}
        <div class="row" style="margin-top:12px;gap:7px">
          <select class="select" data-status="${r.id}" style="max-width:170px">
            <option value="">— статус —</option>
            ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${p.status === k ? ' selected' : ''}>${v}</option>`).join('')}
          </select>
          ${r.custom ? `<button class="btn ghost sm" data-del="${r.id}">Удалить</button>` : ''}
        </div>
      </div>`;
    }).join('') : '<div class="empty"><b>Пусто</b></div>';
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });
  on(list, '[data-status]', el => {
    update(s => { s.resources[el.dataset.status] = { status: el.value || undefined }; });
    draw();
  }, 'change');
  on(list, '[data-del]', async el => {
    if (!await confirmAsk('Удалить этот ресурс?', 'Удалить')) return;
    update(s => { s.customResources = s.customResources.filter(r => r.id !== el.dataset.del); });
    draw();
  });

  root.querySelector('#add').onclick = () => {
    modal(`<h3>Новый ресурс</h3>
      <label class="fld"><span>Название</span><input class="input" id="t" /></label>
      <label class="fld"><span>Ссылка</span><input class="input" id="u" placeholder="https://" /></label>
      <label class="fld"><span>Тип</span><input class="input" id="k" placeholder="Курс, блог, подкаст, инструмент…" /></label>
      <label class="fld"><span>Трек</span><select class="select" id="tr">
        ${Object.entries(TRACKS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
      <label class="fld"><span>Зачем</span><textarea class="textarea" id="n" rows="3"></textarea></label>
      <div class="row" style="justify-content:flex-end"><button class="btn accent" id="ok">Добавить</button></div>`,
      (m, close) => {
        m.querySelector('#ok').onclick = () => {
          const title = m.querySelector('#t').value.trim();
          const url = m.querySelector('#u').value.trim();
          if (!title || !url) return toast('Нужны название и ссылка');
          update(s => s.customResources.push({
            id: 'cr-' + uid(), title, url, custom: true,
            kind: m.querySelector('#k').value.trim() || 'Ссылка',
            track: m.querySelector('#tr').value,
            note: m.querySelector('#n').value.trim(),
          }));
          close(); draw(); toast('Добавлено');
        };
      });
  };

  draw();
}
