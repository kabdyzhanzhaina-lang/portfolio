/* ============================================================
   dashboard.js — обзор: streak, XP, прогресс по трекам, что делать сегодня
   ============================================================ */

import { get, streak, activityMap, todayXP, level, today } from '../store.js';
import { dueCount, stats as srsStats } from '../srs.js';
import { ARTICLES } from '../../data/articles.js';
import { BOOKS } from '../../data/books.js';
import { TASKS } from '../../data/tasks.js';
import { CODE_TASKS } from '../../data/codetasks.js';
import { SQL_TASKS } from '../../data/sqltasks.js';
import { CASES } from '../../data/cases.js';
import { esc, plural, TRACKS, trackTag, fmtDate } from '../ui.js';

function trackProgress(track) {
  const s = get();
  const arts = ARTICLES.filter(a => a.track === track);
  const readArts = arts.filter(a => s.articles[a.id]?.status === 'read').length;
  const bks = BOOKS.filter(b => b.track === track);
  const doneBks = bks.filter(b => s.books[b.id]?.status === 'done').length;
  const tsk = TASKS.filter(t => t.track === track);
  const doneTsk = tsk.filter(t => s.tasks[t.id]?.status === 'done').length;
  const total = arts.length + bks.length + tsk.length;
  const done = readArts + doneBks + doneTsk;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0, readArts, arts: arts.length, doneTsk, tsk: tsk.length };
}

/** Что делать сегодня: одна рекомендация из каждой категории. */
function suggestions() {
  const s = get(), out = [];
  const d = dueCount();
  if (d > 0) out.push({ icon: '⟳', title: `Повторить ${d} ${plural(d, 'карточку', 'карточки', 'карточек')}`,
    note: 'Начни с этого — 3 минуты', href: '#/review', hot: true });

  const art = ARTICLES.find(a => !s.articles[a.id]?.status);
  if (art) out.push({ icon: '▤', title: art.title, note: `Статья · ${art.minutes} мин · ${TRACKS[art.track].label}`, href: `#/articles/${art.id}` });

  const quizable = ARTICLES.find(a => s.articles[a.id]?.status === 'read' && !s.articles[a.id]?.best);
  if (quizable) out.push({ icon: '✓', title: `Тест: ${quizable.title}`, note: 'Прочитано, но не проверено', href: `#/quiz/article/${quizable.id}` });

  const sq = SQL_TASKS.find(t => !s.sql[t.id]?.solved);
  if (sq) out.push({ icon: '⌸', title: `SQL: ${sq.title}`, note: sq.level, href: '#/sql' });

  const cd = CODE_TASKS.find(t => !s.code[t.id]?.solved);
  if (cd) out.push({ icon: '⟨⟩', title: `Код: ${cd.title}`, note: cd.level, href: '#/code' });

  const inProgress = TASKS.find(t => s.tasks[t.id]?.status === 'doing');
  const nextTask = inProgress || TASKS.find(t => !s.tasks[t.id]?.status);
  if (nextTask) out.push({ icon: '✦', title: nextTask.title,
    note: `${inProgress ? 'В работе' : 'Задача'} · ~${nextTask.hours} ч · ${TRACKS[nextTask.track].label}`, href: `#/tasks/${nextTask.id}` });

  const kase = CASES.find(k => !s.cases[k.id]?.answered);
  if (kase) out.push({ icon: '◈', title: `Кейс: ${kase.title}`, note: `${kase.minutes} мин вслух`, href: `#/cases/${kase.id}` });

  if (!s.journal.some(j => j.date === today())) out.push({ icon: '✎', title: 'Записать рефлексию дня', note: '2 минуты', href: '#/journal' });

  return out.slice(0, 5);
}

export async function render(root) {
  const s = get();
  const st = streak();
  const lv = level();
  const map = activityMap(182);
  const srs = srsStats();
  const goal = s.settings.dailyGoal || 20;
  const tXP = todayXP();

  const solvedCode = CODE_TASKS.filter(t => s.code[t.id]?.solved).length;
  const solvedSql = SQL_TASKS.filter(t => s.sql[t.id]?.solved).length;
  const readArts = ARTICLES.filter(a => s.articles[a.id]?.status === 'read').length;
  const doneTasks = TASKS.filter(t => s.tasks[t.id]?.status === 'done').length;
  const doneBooks = BOOKS.filter(b => s.books[b.id]?.status === 'done').length;
  const answeredCases = CASES.filter(c => s.cases[c.id]?.answered).length;

  const sug = suggestions();
  const lastJournal = [...s.journal].sort((a, b) => b.date.localeCompare(a.date))[0];

  root.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">${new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1>Привет, ${esc(s.settings.name || 'Zhaina')}</h1>
      <p>${st > 0
        ? `${st} ${plural(st, 'день', 'дня', 'дней')} подряд. Сегодня набрано ${tXP} из ${goal} XP.`
        : 'Пока пусто. Начни с чего-нибудь маленького — например, с одной статьи.'}</p>
    </div>

    <div class="grid g4" style="margin-bottom:26px">
      <div class="stat"><div class="k">Серия</div><div class="v">${st > 0 ? '🔥 ' + st : '—'}</div><div class="s">${plural(st, 'день', 'дня', 'дней')} подряд</div></div>
      <div class="stat"><div class="k">Уровень</div><div class="v">${lv.level}</div>
        <div class="s">${lv.into} / ${lv.need} XP</div>
        <div class="bar" style="margin-top:8px"><i style="width:${lv.pct}%"></i></div></div>
      <div class="stat"><div class="k">Сегодня</div><div class="v">${tXP}</div>
        <div class="s">цель ${goal} XP</div>
        <div class="bar ${tXP >= goal ? 'ok' : ''}" style="margin-top:8px"><i style="width:${Math.min(100, Math.round(tXP / goal * 100))}%"></i></div></div>
      <div class="stat"><div class="k">К повторению</div><div class="v">${srs.due}</div>
        <div class="s">всего карточек: ${srs.total}</div></div>
    </div>

    <h2 class="sec">Что сделать сегодня</h2>
    <div class="grid g2" style="margin-bottom:8px">
      ${sug.length ? sug.map(x => `
        <a class="card" href="${x.href}">
          <div class="row" style="gap:12px;align-items:flex-start">
            <span style="font-size:19px;line-height:1.2;opacity:.75">${x.icon}</span>
            <span style="min-width:0">
              <h3>${esc(x.title)}</h3>
              <p>${esc(x.note)}</p>
            </span>
            ${x.hot ? '<span class="tag accent nowrap">Сначала</span>' : ''}
          </div>
        </a>`).join('')
      : `<div class="card"><h3>Всё пройдено</h3><p>Материалы закончились. Добавь свои в файлы данных или займись артефактами для портфолио.</p></div>`}
    </div>

    <h2 class="sec">Активность за полгода</h2>
    <div class="card">
      <div class="heat" role="img" aria-label="Карта активности">
        ${map.map(d => `<i data-l="${d.level}" title="${d.date}: ${d.count}"></i>`).join('')}
      </div>
      <div class="row muted" style="margin-top:12px;font-size:12px">
        <span>${fmtDate(map[0].date)}</span><span class="spacer"></span>
        <span>меньше</span>
        <span class="heat" style="grid-template-rows:11px;display:inline-grid;gap:3px">
          ${[0,1,2,3,4].map(l => `<i data-l="${l}"></i>`).join('')}
        </span>
        <span>больше</span>
      </div>
    </div>

    <h2 class="sec">Треки</h2>
    <div class="grid g2">
      ${Object.keys(TRACKS).map(t => {
        const p = trackProgress(t);
        return `<div class="card">
          <div class="row between">${trackTag(t)}<b style="font-size:15px;font-variant-numeric:tabular-nums">${p.pct}%</b></div>
          <div class="bar ${p.pct >= 100 ? 'ok' : ''}" style="margin-top:12px"><i style="width:${p.pct}%"></i></div>
          <p style="margin-top:10px">${p.done} из ${p.total} — статьи, книги и задачи трека</p>
        </div>`;
      }).join('')}
    </div>

    <h2 class="sec">Всего сделано</h2>
    <div class="grid g4">
      <div class="stat"><div class="k">Статьи</div><div class="v">${readArts}<span style="font-size:17px;color:var(--ink-3)">/${ARTICLES.length}</span></div></div>
      <div class="stat"><div class="k">Книги</div><div class="v">${doneBooks}<span style="font-size:17px;color:var(--ink-3)">/${BOOKS.length}</span></div></div>
      <div class="stat"><div class="k">Задачи</div><div class="v">${doneTasks}<span style="font-size:17px;color:var(--ink-3)">/${TASKS.length}</span></div></div>
      <div class="stat"><div class="k">SQL</div><div class="v">${solvedSql}<span style="font-size:17px;color:var(--ink-3)">/${SQL_TASKS.length}</span></div></div>
      <div class="stat"><div class="k">Код</div><div class="v">${solvedCode}<span style="font-size:17px;color:var(--ink-3)">/${CODE_TASKS.length}</span></div></div>
      <div class="stat"><div class="k">Кейсы</div><div class="v">${answeredCases}<span style="font-size:17px;color:var(--ink-3)">/${CASES.length}</span></div></div>
      <div class="stat"><div class="k">Артефакты</div><div class="v">${s.artifacts.length}</div><div class="s">для портфолио</div></div>
      <div class="stat"><div class="k">Всего XP</div><div class="v">${s.xp}</div></div>
    </div>

    ${lastJournal ? `
    <h2 class="sec">Последняя запись в дневнике</h2>
    <a class="card" href="#/journal">
      <div class="row between"><span class="tag">${fmtDate(lastJournal.date)}</span></div>
      <p style="margin-top:10px;color:var(--ink-2);font-size:15px">${esc((lastJournal.learned || '').slice(0, 220))}${(lastJournal.learned || '').length > 220 ? '…' : ''}</p>
    </a>` : ''}
  `;
}
