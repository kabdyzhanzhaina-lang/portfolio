/* ============================================================
   app.js — сборка приложения: навигация, роутинг, тема
   ============================================================ */

import { get, update, subscribe, streak } from './store.js';
import { dueCount } from './srs.js';
import { $, $$, on } from './ui.js';

const NAV = [
  { group: 'Обзор', items: [
    { hash: '#/',          icon: '◉', label: 'Дашборд' },
    { hash: '#/review',    icon: '⟳', label: 'Повторения', badge: () => dueCount() },
    { hash: '#/journal',   icon: '✎', label: 'Дневник' },
  ]},
  { group: 'Учиться', items: [
    { hash: '#/articles',  icon: '▤', label: 'Статьи' },
    { hash: '#/books',     icon: '▣', label: 'Книги' },
    { hash: '#/glossary',  icon: '⌗', label: 'Термины' },
    { hash: '#/resources', icon: '↗', label: 'Ресурсы' },
  ]},
  { group: 'Практика', items: [
    { hash: '#/tasks',     icon: '✦', label: 'Задачи' },
    { hash: '#/sql',       icon: '⌸', label: 'SQL' },
    { hash: '#/code',      icon: '⟨⟩', label: 'Код' },
    { hash: '#/metrics',   icon: '％', label: 'Тренажёр метрик' },
    { hash: '#/cases',     icon: '◈', label: 'Кейсы' },
  ]},
  { group: 'Результат', items: [
    { hash: '#/okr',       icon: '◎', label: 'Цели квартала' },
    { hash: '#/artifacts', icon: '★', label: 'Артефакты' },
  ]},
];

const ROUTES = [
  [/^#?\/?$/,                  () => import('./views/dashboard.js')],
  [/^#\/articles$/,            () => import('./views/articles.js')],
  [/^#\/articles\/([\w-]+)$/,  () => import('./views/article.js')],
  [/^#\/quiz\/(\w+)\/([\w-]+)$/, () => import('./views/quiz.js')],
  [/^#\/books$/,               () => import('./views/books.js')],
  [/^#\/tasks$/,               () => import('./views/tasks.js')],
  [/^#\/tasks\/([\w-]+)$/,     () => import('./views/task.js')],
  [/^#\/sql$/,                 () => import('./views/sql.js')],
  [/^#\/code$/,                () => import('./views/code.js')],
  [/^#\/metrics$/,             () => import('./views/metrics.js')],
  [/^#\/cases$/,               () => import('./views/cases.js')],
  [/^#\/cases\/([\w-]+)$/,     () => import('./views/case.js')],
  [/^#\/review$/,              () => import('./views/review.js')],
  [/^#\/glossary$/,            () => import('./views/glossary.js')],
  [/^#\/resources$/,           () => import('./views/resources.js')],
  [/^#\/okr$/,                 () => import('./views/okr.js')],
  [/^#\/artifacts$/,           () => import('./views/artifacts.js')],
  [/^#\/journal$/,             () => import('./views/journal.js')],
  [/^#\/settings$/,            () => import('./views/settings.js')],
];

/* ---------- навигация ---------- */
function renderNav() {
  const cur = location.hash || '#/';
  $('#side-nav').innerHTML = NAV.map(g => `
    <div class="side-group">
      <div class="side-label">${g.group}</div>
      ${g.items.map(it => {
        const active = cur === it.hash || (it.hash !== '#/' && cur.startsWith(it.hash));
        const n = it.badge ? it.badge() : 0;
        return `<a class="side-link${active ? ' is-active' : ''}" href="${it.hash}">
          <i aria-hidden="true">${it.icon}</i><span>${it.label}</span>
          ${n > 0 ? `<span class="badge">${n}</span>` : ''}
        </a>`;
      }).join('')}
    </div>`).join('');
  const st = streak();
  $('#top-streak').textContent = st > 0 ? `🔥 ${st}` : '—';
}

/* ---------- роутинг ---------- */
let currentCleanup = null;

async function route() {
  const hash = location.hash || '#/';
  const view = $('#view');
  for (const [re, load] of ROUTES) {
    const m = hash.match(re);
    if (!m) continue;
    try {
      currentCleanup?.();
      currentCleanup = null;
      const mod = await load();
      view.innerHTML = '';
      view.className = 'view fade';
      currentCleanup = await mod.render(view, m.slice(1)) || null;
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="empty"><b>Не удалось открыть раздел</b>
        <p>${err.message}</p>
        <p class="muted" style="margin-top:10px">Если сайт открыт как файл, запусти локальный сервер — модулям нужен http.</p></div>`;
    }
    renderNav();
    document.body.classList.remove('nav-open');
    window.scrollTo(0, 0);
    return;
  }
  view.innerHTML = `<div class="empty"><b>Страница не найдена</b><p>Такого раздела нет.</p>
    <p style="margin-top:14px"><a class="btn" href="#/">На дашборд</a></p></div>`;
  renderNav();
}

/* ---------- тема ---------- */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0e0e0d' : '#f7f6f2');
}

$('#theme-btn').addEventListener('click', () => {
  const next = get().settings.theme === 'dark' ? 'light' : 'dark';
  update(s => { s.settings.theme = next; });
  applyTheme(next);
});

$('#burger').addEventListener('click', () => document.body.classList.toggle('nav-open'));
on(document.getElementById('sidebar'), 'a', () => document.body.classList.remove('nav-open'));

/* ---------- старт ---------- */
applyTheme(get().settings.theme);
subscribe(() => renderNav());
window.addEventListener('hashchange', route);
route();
