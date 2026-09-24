import { CASES } from '../../data/cases.js';
import { get, update, logEvent, XP } from '../store.js';
import { esc, trackTag, toast, on } from '../ui.js';

export async function render(root, [id]) {
  const c = CASES.find(x => x.id === id);
  if (!c) { root.innerHTML = '<div class="empty"><b>Кейс не найден</b></div>'; return; }

  let revealed = false;
  let timer = null, left = c.minutes * 60;

  function draw() {
    const p = get().cases[c.id] || {};
    revealed = revealed || !!p.answered;

    root.innerHTML = `
      <a class="muted" href="#/cases">← Все кейсы</a>
      <div class="page-head" style="margin-top:14px">
        <div class="row" style="margin-bottom:12px">${trackTag(c.track)}<span class="tag">${esc(c.kind)}</span>
          ${p.answered ? '<span class="tag ok">Разобрано</span>' : ''}</div>
        <h1>${esc(c.title)}</h1>
      </div>

      <div class="card" style="background:var(--bg-2)">
        <p style="font-size:16.5px;line-height:1.6">${esc(c.prompt)}</p>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="row between">
          <span><b style="font-size:15px">Таймер</b> <span class="muted">— ${c.minutes} минут на ответ вслух</span></span>
          <span class="mono" id="clock" style="font-size:22px;font-weight:500;font-variant-numeric:tabular-nums">${fmt(left)}</span>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn ghost sm" id="tstart">Старт</button>
          <button class="btn ghost sm" id="tstop">Пауза</button>
          <button class="btn ghost sm" id="treset">Сброс</button>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <label class="fld"><span>Твой ответ — тезисы (пиши до того, как откроешь разбор)</span>
          <textarea class="textarea" id="ans" rows="7" placeholder="Структура ответа: с чего начну, что уточню, какие гипотезы, чем закончу">${esc(p.answer || '')}</textarea></label>
        <div class="row">
          <button class="btn ghost" id="save">Сохранить</button>
          <span class="spacer"></span>
          <button class="btn accent" id="reveal">${revealed ? 'Разбор открыт' : 'Показать разбор'}</button>
        </div>
      </div>

      <div id="frame" style="margin-top:20px${revealed ? '' : ';display:none'}">
        <h2 class="sec">Структура сильного ответа</h2>
        <div class="card">
          <ol style="padding-left:1.2em">
            ${c.framework.map(f => `<li style="list-style:decimal;padding:5px 0;font-size:15px">${esc(f)}</li>`).join('')}
          </ol>
        </div>
        <div class="explain" style="margin-top:14px"><b>Что отличает сильный ответ. </b>${esc(c.goodAnswer)}</div>
        <div class="explain" style="margin-top:10px;border-color:var(--bad)"><b>Типичная ошибка. </b>${esc(c.trap)}</div>

        <div class="card" style="margin-top:18px">
          <b style="font-size:15px">Насколько твой ответ совпал со структурой?</b>
          <p class="muted" style="margin-top:4px">Честная оценка важнее высокой — она определяет, вернётся ли кейс к тебе.</p>
          <div class="row" style="margin-top:12px">
            ${[1, 2, 3, 4, 5].map(n => `<button class="btn ${p.self === n ? 'accent' : 'ghost'} sm" data-self="${n}">${n}</button>`).join('')}
            <span class="muted" style="font-size:13px">1 — мимо, 5 — попала во всё</span>
          </div>
        </div>
      </div>`;

    const clock = root.querySelector('#clock');
    const tick = () => {
      left = Math.max(0, left - 1);
      clock.textContent = fmt(left);
      if (left === 0) { clearInterval(timer); timer = null; toast('Время вышло'); }
    };
    root.querySelector('#tstart').onclick = () => { if (!timer) timer = setInterval(tick, 1000); };
    root.querySelector('#tstop').onclick = () => { clearInterval(timer); timer = null; };
    root.querySelector('#treset').onclick = () => { clearInterval(timer); timer = null; left = c.minutes * 60; clock.textContent = fmt(left); };

    root.querySelector('#save').onclick = () => {
      update(s => { s.cases[c.id] = { ...(s.cases[c.id] || {}), answer: root.querySelector('#ans').value }; });
      toast('Сохранено');
    };

    root.querySelector('#reveal').onclick = () => {
      update(s => { s.cases[c.id] = { ...(s.cases[c.id] || {}), answer: root.querySelector('#ans').value }; });
      revealed = true;
      root.querySelector('#frame').style.display = '';
      root.querySelector('#reveal').textContent = 'Разбор открыт';
      root.querySelector('#frame').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    on(root, '[data-self]', el => {
      const n = +el.dataset.self;
      const was = get().cases[c.id]?.answered;
      update(s => {
        s.cases[c.id] = { ...(s.cases[c.id] || {}), answered: true, self: n,
          answer: root.querySelector('#ans').value, answeredAt: new Date().toISOString() };
      });
      if (!was) { logEvent('case', c.id, XP.case, c.minutes); toast(`+${XP.case} XP`); }
      clearInterval(timer); timer = null;
      draw();
    });
  }

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  draw();
  return () => clearInterval(timer);
}
