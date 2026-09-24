/* ============================================================
   review.js — интервальные повторения.
   Сюда попадают: ошибки из тестов и добавленные термины.
   ============================================================ */

import { due, grade, stats, forget } from '../srs.js';
import { ARTICLES } from '../../data/articles.js';
import { BOOKS } from '../../data/books.js';
import { GLOSSARY } from '../../data/glossary.js';
import { esc, ring, plural, on, toast } from '../ui.js';

/** Достаём содержимое карточки по её id. */
function cardContent(card) {
  if (card.kind === 'term') {
    const t = GLOSSARY.find(g => g.id === card.termId);
    if (!t) return null;
    return { front: t.term, back: t.def, source: 'Термин' };
  }
  const src = card.srcKind === 'book' ? BOOKS.find(b => b.id === card.srcId) : ARTICLES.find(a => a.id === card.srcId);
  const q = src?.quiz?.[card.qIndex];
  if (!q) return null;
  let answer = '';
  if (q.type === 'one' || q.type === 'multi') {
    const right = Array.isArray(q.answer) ? q.answer : [q.answer];
    answer = right.map(n => q.options[n]).join(' · ');
  } else if (q.type === 'num') answer = `${q.answer}${q.unit ? ' ' + q.unit : ''}`;
  else answer = q.reference || '';
  return { front: q.stem, back: answer, explain: q.explain || q.reference, source: src.title };
}

export async function render(root) {
  let queue = due().filter(c => cardContent(c));
  let i = 0, done = 0;

  function drawEmpty() {
    const st = stats();
    root.innerHTML = `
      <div class="page-head">
        <h1>Повторения</h1>
        <p>Карточки появляются здесь автоматически: каждая ошибка в тесте и каждый термин, отправленный на повторение.</p>
      </div>
      <div class="grid g4" style="margin-bottom:24px">
        <div class="stat"><div class="k">К повторению</div><div class="v">${st.due}</div></div>
        <div class="stat"><div class="k">Всего карточек</div><div class="v">${st.total}</div></div>
        <div class="stat"><div class="k">Закреплено</div><div class="v">${st.mature}</div><div class="s">интервал ≥ 21 дня</div></div>
        <div class="stat"><div class="k">Проблемные</div><div class="v">${st.leeches}</div><div class="s">забыто 4+ раза</div></div>
      </div>
      <div class="empty">
        <b>${done ? `Готово — ${done} ${plural(done, 'карточка', 'карточки', 'карточек')} повторено` : 'На сегодня ничего нет'}</b>
        <p>${st.total === 0
          ? 'Пройди любой тест — ошибки попадут сюда автоматически. Или добавь термины из раздела «Термины».'
          : 'Возвращайся завтра. Алгоритм сам выберет, что пора освежить.'}</p>
        <p style="margin-top:16px"><a class="btn ghost" href="#/glossary">Добавить термины</a></p>
      </div>`;
  }

  function draw() {
    if (i >= queue.length) return drawEmpty();
    const card = queue[i];
    const c = cardContent(card);
    const pct = Math.round(i / queue.length * 100);

    root.innerHTML = `
      <div class="page-head">
        <h1>Повторения</h1>
        <p>Карточка ${i + 1} из ${queue.length}. Сначала вспомни ответ сама, только потом открывай.</p>
      </div>
      <div class="bar" style="margin-bottom:20px"><i style="width:${pct}%"></i></div>
      <div class="quiz">
        <div class="q-card">
          <div class="row between" style="margin-bottom:14px">
            <span class="tag">${esc(c.source)}</span>
            <span class="muted" style="font-size:12.5px">повторов: ${card.reps} · интервал: ${card.interval} дн.${card.lapses ? ` · забыто раз: ${card.lapses}` : ''}</span>
          </div>
          <div class="q-stem">${esc(c.front)}</div>
          <div id="back" style="display:none">
            <div class="explain" style="border-color:var(--ok)"><b>${esc(c.back)}</b></div>
            ${c.explain && c.explain !== c.back ? `<div class="explain" style="margin-top:10px">${esc(c.explain)}</div>` : ''}
            <p class="muted" style="margin-top:16px;font-size:13.5px">Насколько легко вспомнила?</p>
            <div class="row" style="margin-top:8px;gap:7px">
              <button class="btn ghost sm" data-g="0" style="border-color:var(--bad);color:var(--bad)">Не вспомнила</button>
              <button class="btn ghost sm" data-g="3">С трудом</button>
              <button class="btn ghost sm" data-g="4">Нормально</button>
              <button class="btn ghost sm" data-g="5" style="border-color:var(--ok);color:var(--ok)">Легко</button>
            </div>
          </div>
          <div class="row" style="margin-top:16px" id="showrow">
            <button class="btn accent" id="show">Показать ответ</button>
            <span class="spacer"></span>
            <button class="btn ghost sm" id="drop">Убрать из повторений</button>
          </div>
        </div>
      </div>`;

    root.querySelector('#show').onclick = () => {
      root.querySelector('#back').style.display = '';
      root.querySelector('#showrow').style.display = 'none';
    };
    root.querySelector('#drop').onclick = () => { forget(card.id); queue.splice(i, 1); draw(); };
    on(root, '[data-g]', el => { grade(card.id, +el.dataset.g); done++; i++; draw(); });
  }

  document.addEventListener('keydown', keys);
  function keys(e) {
    if (i >= queue.length) return;
    if (e.key === ' ' && root.querySelector('#show')) { e.preventDefault(); root.querySelector('#show').click(); }
    if (['1', '2', '3', '4'].includes(e.key) && root.querySelector('[data-g]')) {
      root.querySelector(`[data-g="${['0', '3', '4', '5'][+e.key - 1]}"]`)?.click();
    }
  }

  queue.length ? draw() : drawEmpty();
  return () => document.removeEventListener('keydown', keys);
}
