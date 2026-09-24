/* ============================================================
   quiz.js — движок тестов. Работает для статей и книг.
   Маршрут: #/quiz/<kind>/<id>, где kind = article | book
   Ошибки автоматически уходят в интервальные повторения.
   ============================================================ */

import { ARTICLES } from '../../data/articles.js';
import { BOOKS } from '../../data/books.js';
import { update, get, logEvent, XP } from '../store.js';
import { schedule } from '../srs.js';
import { esc, ring, toast, on } from '../ui.js';

export async function render(root, [kind, id]) {
  const src = kind === 'book' ? BOOKS.find(b => b.id === id) : ARTICLES.find(a => a.id === id);
  if (!src || !src.quiz?.length) {
    root.innerHTML = `<div class="empty"><b>Теста нет</b><p>Для этого материала тест ещё не готов.</p></div>`;
    return;
  }

  const qs = src.quiz;
  const backHash = kind === 'book' ? '#/books' : `#/articles/${id}`;
  let i = 0;
  const results = new Array(qs.length).fill(null);  // true | false | null

  root.innerHTML = `
    <div class="quiz">
      <a class="muted" href="${backHash}">← ${kind === 'book' ? 'К книгам' : 'К статье'}</a>
      <h1 style="font-size:23px;font-weight:660;letter-spacing:-.022em;margin:10px 0 18px">${esc(src.title)}</h1>
      <div class="q-progress" id="qp"></div>
      <div id="qbody"></div>
    </div>`;

  const qp = root.querySelector('#qp');
  const body = root.querySelector('#qbody');

  const drawProgress = () => {
    qp.innerHTML = qs.map((_, n) =>
      `<i class="${results[n] === true ? 'done' : results[n] === false ? 'miss' : n === i ? 'now' : ''}"></i>`).join('');
  };

  function drawQuestion() {
    drawProgress();
    const q = qs[i];
    const letters = 'АБВГДЕ';
    let controls = '';

    if (q.type === 'one' || q.type === 'multi') {
      controls = q.options.map((o, n) =>
        `<button class="opt" data-opt="${n}"><span class="mark">${letters[n]}</span><span>${esc(o)}</span></button>`).join('');
    } else if (q.type === 'num') {
      controls = `<div class="row"><input class="input" id="numin" type="text" inputmode="decimal"
        placeholder="Число" style="max-width:190px" autocomplete="off" />
        ${q.unit ? `<span class="muted">${esc(q.unit)}</span>` : ''}</div>`;
    } else {
      controls = `<textarea class="textarea" id="openin" rows="5" placeholder="Твой ответ…"></textarea>`;
    }

    body.innerHTML = `
      <div class="q-card">
        <div class="row" style="margin-bottom:12px">
          <span class="tag">Вопрос ${i + 1} из ${qs.length}</span>
          ${q.type === 'multi' ? '<span class="tag accent">Несколько ответов</span>' : ''}
          ${q.type === 'num' ? '<span class="tag accent">Посчитай</span>' : ''}
          ${q.type === 'open' ? '<span class="tag accent">Свободный ответ</span>' : ''}
        </div>
        <div class="q-stem">${esc(q.stem)}</div>
        <div id="controls">${controls}</div>
        <div id="after"></div>
        <div class="row" style="margin-top:16px">
          <button class="btn accent" id="check">${q.type === 'open' ? 'Показать разбор' : 'Проверить'}</button>
          <span class="spacer"></span>
          <button class="btn ghost sm" id="skip">Пропустить</button>
        </div>
      </div>`;

    const chosen = new Set();
    on(body, '[data-opt]', el => {
      const n = +el.dataset.opt;
      if (q.type === 'one') { chosen.clear(); chosen.add(n); }
      else { chosen.has(n) ? chosen.delete(n) : chosen.add(n); }
      body.querySelectorAll('[data-opt]').forEach(b =>
        b.classList.toggle('is-sel', chosen.has(+b.dataset.opt)));
    });

    body.querySelector('#skip').onclick = () => { results[i] = false; next(); };
    body.querySelector('#check').onclick = () => {
      let ok = null;
      if (q.type === 'one' || q.type === 'multi') {
        if (!chosen.size) return toast('Выбери вариант');
        const right = Array.isArray(q.answer) ? q.answer : [q.answer];
        ok = right.length === chosen.size && right.every(n => chosen.has(n));
        body.querySelectorAll('[data-opt]').forEach(b => {
          const n = +b.dataset.opt;
          b.disabled = true;
          b.classList.remove('is-sel');
          if (right.includes(n)) b.classList.add('is-right');
          else if (chosen.has(n)) b.classList.add('is-wrong');
        });
      } else if (q.type === 'num') {
        const raw = body.querySelector('#numin').value.trim().replace(',', '.').replace(/\s/g, '');
        const v = parseFloat(raw);
        if (Number.isNaN(v)) return toast('Введи число');
        ok = Math.abs(v - q.answer) <= (q.tolerance ?? 0.001);
        body.querySelector('#numin').disabled = true;
      } else {
        ok = null;   // открытый вопрос оценивает сама
        body.querySelector('#openin').disabled = true;
      }

      const after = body.querySelector('#after');
      after.innerHTML = `
        ${q.type === 'num' && ok === false ? `<div class="explain" style="border-color:var(--bad)"><b>Верный ответ: ${q.answer}${q.unit ? ' ' + esc(q.unit) : ''}</b></div>` : ''}
        <div class="explain">${ok === true ? '<b>Верно. </b>' : ok === false ? '<b>Не совсем. </b>' : ''}${esc(q.explain || q.reference || '')}</div>
        ${q.type === 'open' ? `<div class="row" style="margin-top:12px">
            <span class="muted">Оцени себя:</span>
            <button class="btn ghost sm" data-self="1">Попала в суть</button>
            <button class="btn ghost sm" data-self="0">Мимо</button>
          </div>` : ''}`;

      body.querySelector('#check').style.display = 'none';
      body.querySelector('#skip').textContent = 'Дальше →';
      body.querySelector('#skip').classList.remove('ghost');
      body.querySelector('#skip').onclick = () => { if (results[i] === null) results[i] = ok ?? true; next(); };

      if (q.type === 'open') {
        on(after, '[data-self]', el => { results[i] = el.dataset.self === '1'; finishQ(q, results[i]); next(); });
      } else {
        results[i] = ok;
        finishQ(q, ok);
      }
      drawProgress();
    };

    const input = body.querySelector('#numin') || body.querySelector('#openin');
    input?.focus();
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && q.type === 'num') { e.preventDefault(); body.querySelector('#check').click(); }
    });
  }

  /* ошибку — в очередь повторений */
  function finishQ(q, ok) {
    if (ok === false) {
      const cardId = `${kind}:${id}:${qs.indexOf(q)}`;
      schedule(cardId, { kind: 'quiz', srcKind: kind, srcId: id, qIndex: qs.indexOf(q) });
    }
  }

  function next() {
    if (i < qs.length - 1) { i++; drawQuestion(); }
    else finish();
  }

  function finish() {
    const right = results.filter(Boolean).length;
    const pct = Math.round(right / qs.length * 100);
    drawProgress();

    update(s => {
      const store = kind === 'book' ? s.books : s.articles;
      if (!store[id]) store[id] = {};
      store[id].best = Math.max(store[id].best || 0, pct);
      store[id].attempts = (store[id].attempts || 0) + 1;
      store[id].lastQuizAt = new Date().toISOString();
      if (kind === 'article' && !store[id].status) store[id].status = 'read';
    });
    logEvent('quiz', `${kind}:${id}`, pct === 100 ? XP.quizPerfect : XP.quiz, 5);

    const wrong = results.map((r, n) => r === false ? n : -1).filter(n => n >= 0);
    body.innerHTML = `
      <div class="q-card" style="text-align:center">
        <div class="score-ring">${ring(pct)}<b>${pct}%</b></div>
        <h2 style="font-size:20px;font-weight:650;letter-spacing:-.02em">${right} из ${qs.length} верно</h2>
        <p class="muted" style="margin-top:8px;max-width:46ch;margin-inline:auto">
          ${pct === 100 ? 'Идеально. Материал усвоен — проверь себя ещё раз через неделю.'
            : pct >= 70 ? 'Хороший результат. Ошибки уже добавлены в повторения.'
            : 'Стоит перечитать материал. Ошибки добавлены в повторения — вернутся завтра.'}
        </p>
        ${wrong.length ? `<p class="muted" style="margin-top:10px">В повторения добавлено: ${wrong.length}</p>` : ''}
        <div class="row" style="justify-content:center;margin-top:20px">
          <a class="btn ghost" href="${backHash}">${kind === 'book' ? 'К книгам' : 'К статье'}</a>
          <button class="btn accent" id="again">Пройти заново</button>
          ${wrong.length ? '<a class="btn" href="#/review">В повторения</a>' : ''}
        </div>
      </div>`;
    body.querySelector('#again').onclick = () => {
      i = 0; results.fill(null); drawQuestion();
    };
  }

  drawQuestion();
}
