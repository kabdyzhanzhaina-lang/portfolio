/* ============================================================
   srs.js — интервальные повторения, алгоритм SM-2
   Карточка попадает в очередь, когда ты ошиблась в тесте
   или добавила термин из глоссария.
   ============================================================ */

import { get, update, today, addDays, daysBetween, logEvent, XP } from './store.js';

/** Добавить карточку в очередь (если её ещё нет). */
export function schedule(cardId, meta = {}) {
  update(s => {
    if (s.srs[cardId]) return;
    s.srs[cardId] = { ef: 2.5, reps: 0, interval: 0, due: today(), lapses: 0, lastAt: null, ...meta };
  });
}

/** Оценка 0–5. <3 — забыла, счёт сбрасывается. */
export function grade(cardId, q) {
  update(s => {
    const c = s.srs[cardId];
    if (!c) return;
    if (q < 3) {
      c.reps = 0; c.interval = 1; c.lapses++;
    } else {
      c.reps++;
      c.interval = c.reps === 1 ? 1 : c.reps === 2 ? 6 : Math.round(c.interval * c.ef);
    }
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    c.due = addDays(today(), c.interval);
    c.lastAt = today();
  });
  logEvent('review', cardId, XP.review, 1);
}

/** Карточки, которые пора повторить. */
export function due() {
  const s = get(), t = today();
  return Object.entries(s.srs)
    .filter(([, c]) => daysBetween(c.due, t) >= 0)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.due < b.due ? -1 : 1));
}

export function dueCount() { return due().length; }

export function stats() {
  const s = get(), all = Object.values(s.srs);
  return {
    total: all.length,
    due: dueCount(),
    mature: all.filter(c => c.interval >= 21).length,
    leeches: all.filter(c => c.lapses >= 4).length,
  };
}

export function forget(cardId) { update(s => { delete s.srs[cardId]; }); }
