/* ============================================================
   store.js — состояние платформы в localStorage
   Единственное место, которое знает про формат хранения.
   ============================================================ */

const KEY = 'growthlab.v1';

const EMPTY = () => ({
  version: 1,
  settings: { theme: 'light', dailyGoal: 20, name: 'Zhaina' },
  // прогресс по статьям: { [id]: { status, readAt, best, attempts } }
  articles: {},
  // книги: { [id]: { status, rating, startedAt, finishedAt, note, idea, best } }
  books: {},
  // задачи практики: { [id]: { status, steps: [bool], startedAt, doneAt, link, note } }
  tasks: {},
  // код-задачи: { [id]: { solved, code, solvedAt } }
  code: {},
  // sql-задачи: { [id]: { solved, sql, solvedAt } }
  sql: {},
  // кейсы: { [id]: { answered, answer, self, answeredAt } }
  cases: {},
  // интервальные повторения: { [cardId]: { ef, reps, interval, due, lapses, lastAt } }
  srs: {},
  // артефакты портфолио: [{ id, title, kind, track, link, note, date }]
  artifacts: [],
  // цели квартала: [{ id, quarter, objective, krs: [{ text, target, current, unit }] }]
  okr: [],
  // журнал рефлексии: [{ id, date, learned, applied, stuck, next, mood }]
  journal: [],
  // ресурсы: { [id]: { status } } + собственные [{ id, title, url, kind, track, custom:true }]
  resources: {},
  customResources: [],
  // лог активности: { 'YYYY-MM-DD': { minutes, events: [{ type, ref, at, xp }] } }
  log: {},
  xp: 0,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY();
    const parsed = JSON.parse(raw);
    return Object.assign(EMPTY(), parsed, { settings: Object.assign(EMPTY().settings, parsed.settings || {}) });
  } catch (e) {
    console.warn('Не удалось прочитать сохранение, начинаю с чистого листа', e);
    return EMPTY();
  }
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.error('Не удалось сохранить прогресс', e); }
  }, 120);
}

const subs = new Set();
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit() { subs.forEach(fn => fn(state)); }

export function get() { return state; }

/** Изменить состояние: update(s => { s.xp += 10 }) */
export function update(mutator) {
  mutator(state);
  persist();
  emit();
  return state;
}

/* ---------- даты ----------
   Считаем по местному времени, а не по UTC: иначе в Алматы (UTC+5)
   «завтра» превращалось бы в «сегодня» после toISOString. */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => ymd(new Date());
export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}
export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/* ---------- активность и XP ---------- */
export const XP = {
  article: 20, quiz: 15, quizPerfect: 25, book: 40, bookStart: 5,
  task: 60, code: 25, sql: 25, case: 30, review: 5, journal: 15, artifact: 50,
};

export function logEvent(type, ref, xp = 0, minutes = 0) {
  update(s => {
    const d = today();
    if (!s.log[d]) s.log[d] = { minutes: 0, events: [] };
    s.log[d].minutes += minutes;
    s.log[d].events.push({ type, ref, at: new Date().toISOString(), xp });
    s.xp += xp;
  });
}

/** Сколько дней подряд была активность, включая сегодня или вчера. */
export function streak() {
  const s = get();
  let day = today();
  if (!s.log[day] || !s.log[day].events.length) {
    day = addDays(day, -1);
    if (!s.log[day] || !s.log[day].events.length) return 0;
  }
  let n = 0;
  while (s.log[day] && s.log[day].events.length) { n++; day = addDays(day, -1); }
  return n;
}

export function activityMap(days = 182) {
  const s = get(), out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today(), -i);
    const e = s.log[d] ? s.log[d].events.length : 0;
    out.push({ date: d, count: e, level: e === 0 ? 0 : e <= 1 ? 1 : e <= 3 ? 2 : e <= 6 ? 3 : 4 });
  }
  return out;
}

export function todayXP() {
  const l = get().log[today()];
  return l ? l.events.reduce((a, e) => a + (e.xp || 0), 0) : 0;
}

export function level() {
  const xp = get().xp;
  // 0-99 ур.1, дальше каждые +150·уровень
  let lvl = 1, need = 150, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = 150 + (lvl - 1) * 60; }
  return { level: lvl, into: xp - acc, need, pct: Math.round(((xp - acc) / need) * 100) };
}

/* ---------- экспорт / импорт ---------- */
export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `growthlab-backup-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Не похоже на резервную копию');
  state = Object.assign(EMPTY(), parsed, { settings: Object.assign(EMPTY().settings, parsed.settings || {}) });
  persist(); emit();
}

export function reset() { state = EMPTY(); persist(); emit(); }

export const uid = () => Math.random().toString(36).slice(2, 10);
