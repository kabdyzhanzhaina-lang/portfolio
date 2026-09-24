import { get, update, uid } from '../store.js';
import { esc, on, modal, toast, confirmAsk } from '../ui.js';

const currentQuarter = () => {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
};

export async function render(root) {
  function progress(o) {
    if (!o.krs.length) return 0;
    const sum = o.krs.reduce((a, k) => {
      const t = Number(k.target) || 0, c = Number(k.current) || 0;
      return a + (t ? Math.min(1, c / t) : 0);
    }, 0);
    return Math.round(sum / o.krs.length * 100);
  }

  function draw() {
    const s = get();
    const list = [...s.okr].sort((a, b) => b.quarter.localeCompare(a.quarter));

    root.innerHTML = `
      <div class="page-head">
        <h1>Цели квартала</h1>
        <p>Цель отвечает на «куда», ключевые результаты — на «как поймём, что дошли». Правило: 2–3 цели на квартал, не больше. Ключевой результат всегда измеримый.</p>
      </div>
      <div class="row" style="margin-bottom:18px">
        <button class="btn accent" id="add">+ Новая цель</button>
        <span class="muted">Текущий квартал: ${currentQuarter()}</span>
      </div>
      ${list.length ? list.map(o => {
        const pct = progress(o);
        return `<div class="card" style="margin-bottom:14px">
          <div class="row between" style="margin-bottom:10px">
            <span class="tag">${esc(o.quarter)}</span>
            <span class="row" style="gap:8px">
              <b style="font-variant-numeric:tabular-nums;font-size:15px">${pct}%</b>
              <button class="btn ghost sm" data-edit="${o.id}">Изменить</button>
              <button class="btn ghost sm" data-del="${o.id}">Удалить</button>
            </span>
          </div>
          <h3 style="font-size:18px">${esc(o.objective)}</h3>
          <div class="bar ${pct >= 100 ? 'ok' : ''}" style="margin:12px 0 14px"><i style="width:${pct}%"></i></div>
          ${o.krs.map((k, i) => {
            const t = Number(k.target) || 0, c = Number(k.current) || 0;
            const p = t ? Math.min(100, Math.round(c / t * 100)) : 0;
            return `<div style="padding:9px 0;border-top:1px solid var(--line)">
              <div class="row between">
                <span style="font-size:14.5px">${esc(k.text)}</span>
                <span class="row" style="gap:7px">
                  <input class="input" data-kr="${o.id}:${i}" value="${esc(k.current ?? '')}"
                    style="width:82px;padding:4px 8px;font-size:13px;text-align:right" inputmode="decimal" />
                  <span class="muted nowrap" style="font-size:13px">/ ${esc(k.target)} ${esc(k.unit || '')}</span>
                </span>
              </div>
              <div class="bar ${p >= 100 ? 'ok' : ''}" style="margin-top:7px;height:4px"><i style="width:${p}%"></i></div>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')
      : `<div class="empty"><b>Целей пока нет</b>
          <p>Пример: «Освоить продуктовую аналитику настолько, чтобы отвечать на вопросы о данных самостоятельно».<br>
          Ключевые результаты: решить 16 SQL-задач, построить 2 дашборда, провести 1 когортный анализ.</p></div>`}`;

    on(root, '[data-kr]', el => {
      const [id, i] = el.dataset.kr.split(':');
      update(s => {
        const o = s.okr.find(x => x.id === id);
        if (o) o.krs[+i].current = el.value.trim();
      });
      draw();
    }, 'change');

    on(root, '[data-del]', async el => {
      if (!await confirmAsk('Удалить цель со всеми ключевыми результатами?', 'Удалить')) return;
      update(s => { s.okr = s.okr.filter(o => o.id !== el.dataset.del); });
      draw();
    });

    on(root, '[data-edit]', el => form(s.okr.find(o => o.id === el.dataset.edit)));
    root.querySelector('#add').onclick = () => form(null);
  }

  function form(existing) {
    const o = existing || { quarter: currentQuarter(), objective: '', krs: [{ text: '', target: '', current: '', unit: '' }] };
    const krRow = (k, i) => `
      <div class="row" style="gap:6px;margin-bottom:7px" data-row="${i}">
        <input class="input" data-f="text" value="${esc(k.text)}" placeholder="Ключевой результат" />
        <input class="input" data-f="target" value="${esc(k.target)}" placeholder="Цель" style="width:80px" />
        <input class="input" data-f="unit" value="${esc(k.unit || '')}" placeholder="ед." style="width:70px" />
      </div>`;

    modal(`<h3>${existing ? 'Изменить цель' : 'Новая цель'}</h3>
      <label class="fld"><span>Квартал</span><input class="input" id="q" value="${esc(o.quarter)}" /></label>
      <label class="fld"><span>Цель — куда идём</span>
        <textarea class="textarea" id="ob" rows="2" placeholder="Качественно и вдохновляюще">${esc(o.objective)}</textarea></label>
      <div class="fld"><span style="display:block;font-size:12.5px;font-weight:600;color:var(--ink-2);margin-bottom:5px">Ключевые результаты — измеримые</span>
        <div id="krs">${o.krs.map(krRow).join('')}</div>
        <button class="btn ghost sm" id="addkr" style="margin-top:6px">+ Ещё результат</button>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn accent" id="ok">Сохранить</button></div>`,
      (m, close) => {
        m.querySelector('#addkr').onclick = () => {
          const n = m.querySelectorAll('[data-row]').length;
          m.querySelector('#krs').insertAdjacentHTML('beforeend', krRow({ text: '', target: '', unit: '' }, n));
        };
        m.querySelector('#ok').onclick = () => {
          const objective = m.querySelector('#ob').value.trim();
          if (!objective) return toast('Сформулируй цель');
          const krs = [...m.querySelectorAll('[data-row]')].map((row, i) => ({
            text: row.querySelector('[data-f="text"]').value.trim(),
            target: row.querySelector('[data-f="target"]').value.trim(),
            unit: row.querySelector('[data-f="unit"]').value.trim(),
            current: o.krs[i]?.current ?? '',
          })).filter(k => k.text);
          update(s => {
            if (existing) Object.assign(existing, { quarter: m.querySelector('#q').value.trim(), objective, krs });
            else s.okr.push({ id: uid(), quarter: m.querySelector('#q').value.trim(), objective, krs });
          });
          close(); draw(); toast('Сохранено');
        };
      });
  }

  draw();
}
