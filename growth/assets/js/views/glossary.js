import { GLOSSARY } from '../../data/glossary.js';
import { get } from '../store.js';
import { schedule, forget } from '../srs.js';
import { esc, trackTag, TRACKS, on, toast } from '../ui.js';

export async function render(root) {
  let filter = 'all', q = '';

  root.innerHTML = `
    <div class="page-head">
      <h1>Термины</h1>
      <p>Словарь профессии. Любой термин можно отправить в интервальные повторения — тогда он вернётся к тебе через день, неделю, месяц.</p>
    </div>
    <div class="row" style="margin-bottom:14px">
      <input class="input" id="q" placeholder="Поиск по термину или определению" style="max-width:380px" />
      <button class="btn ghost sm" id="addall">Добавить всё в повторения</button>
    </div>
    <div class="chips" id="chips"></div>
    <div class="grid g2" id="list"></div>`;

  const chips = root.querySelector('#chips'), list = root.querySelector('#list');

  function draw() {
    const s = get();
    const inSrs = id => !!s.srs[`term:${id}`];
    chips.innerHTML = [['all', 'Все'], ['srs', 'В повторениях'], ...Object.entries(TRACKS).map(([k, v]) => [k, v.label])]
      .map(([k, label]) => {
        const n = k === 'all' ? GLOSSARY.length
          : k === 'srs' ? GLOSSARY.filter(g => inSrs(g.id)).length
          : GLOSSARY.filter(g => g.track === k).length;
        return `<button class="chip${filter === k ? ' is-on' : ''}" data-f="${k}">${label} <span style="opacity:.55">${n}</span></button>`;
      }).join('');

    const ql = q.toLowerCase();
    const items = GLOSSARY.filter(g =>
      (filter === 'all' || (filter === 'srs' ? inSrs(g.id) : g.track === filter)) &&
      (!ql || g.term.toLowerCase().includes(ql) || g.def.toLowerCase().includes(ql)));

    list.innerHTML = items.length ? items.map(g => `
      <div class="card">
        <div class="row between" style="margin-bottom:8px">
          ${trackTag(g.track)}
          <button class="btn ghost sm" data-srs="${g.id}">${inSrs(g.id) ? '✓ В повторениях' : '+ В повторения'}</button>
        </div>
        <h3>${esc(g.term)}</h3>
        <p style="margin-top:6px;font-size:14.5px;color:var(--ink-2);line-height:1.55">${esc(g.def)}</p>
      </div>`).join('') : '<div class="empty"><b>Ничего не найдено</b></div>';
  }

  on(chips, '[data-f]', el => { filter = el.dataset.f; draw(); });
  on(list, '[data-srs]', el => {
    const id = el.dataset.srs, key = `term:${id}`;
    if (get().srs[key]) { forget(key); toast('Убрано из повторений'); }
    else { schedule(key, { kind: 'term', termId: id }); toast('Добавлено в повторения'); }
    draw();
  });
  root.querySelector('#q').addEventListener('input', e => { q = e.target.value; draw(); });
  root.querySelector('#addall').onclick = () => {
    const ql = q.toLowerCase();
    const items = GLOSSARY.filter(g =>
      (filter === 'all' || (filter !== 'srs' && g.track === filter)) &&
      (!ql || g.term.toLowerCase().includes(ql)));
    items.forEach(g => schedule(`term:${g.id}`, { kind: 'term', termId: g.id }));
    toast(`Добавлено: ${items.length}`);
    draw();
  };
  draw();
}
