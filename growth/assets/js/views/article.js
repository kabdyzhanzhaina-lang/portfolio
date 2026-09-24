import { ARTICLES } from '../../data/articles.js';
import { get, update, logEvent, XP } from '../store.js';
import { esc, trackTag, toast } from '../ui.js';

export async function render(root, [id]) {
  const a = ARTICLES.find(x => x.id === id);
  if (!a) { root.innerHTML = '<div class="empty"><b>Статья не найдена</b></div>'; return; }

  const idx = ARTICLES.indexOf(a);
  const prev = ARTICLES[idx - 1], next = ARTICLES[idx + 1];
  const p = get().articles[a.id] || {};

  root.innerHTML = `
    <a class="muted" href="#/articles">← Все статьи</a>
    <div class="page-head" style="margin-top:14px">
      <div class="row" style="margin-bottom:12px">
        ${trackTag(a.track)}<span class="tag">${a.minutes} мин</span><span class="tag">${esc(a.level)}</span>
        ${p.best != null ? `<span class="tag ${p.best >= 80 ? 'ok' : 'warn'}">Лучший тест ${p.best}%</span>` : ''}
      </div>
      <h1>${esc(a.title)}</h1>
      <p>${esc(a.summary)}</p>
    </div>

    <article class="prose">${a.body}</article>

    <div class="card" style="margin-top:36px;text-align:center;padding:26px">
      <h3 style="font-size:18px">Проверь себя</h3>
      <p style="margin-top:6px">${a.quiz.length} вопросов. Ошибки автоматически попадут в повторения.</p>
      <div class="row" style="justify-content:center;margin-top:16px">
        <button class="btn ghost" id="mark">${p.status === 'read' ? 'Отмечено как прочитанное' : 'Отметить прочитанным'}</button>
        <a class="btn accent" href="#/quiz/article/${a.id}">Пройти тест</a>
      </div>
    </div>

    <div class="row between" style="margin-top:28px;gap:14px">
      <span>${prev ? `<a class="muted" href="#/articles/${prev.id}">← ${esc(prev.title)}</a>` : ''}</span>
      <span style="text-align:right">${next ? `<a class="muted" href="#/articles/${next.id}">${esc(next.title)} →</a>` : ''}</span>
    </div>`;

  const btn = root.querySelector('#mark');
  btn.onclick = () => {
    if (get().articles[a.id]?.status === 'read') return;
    update(s => {
      s.articles[a.id] = { ...(s.articles[a.id] || {}), status: 'read', readAt: new Date().toISOString() };
    });
    logEvent('article', a.id, XP.article, a.minutes);
    btn.textContent = 'Отмечено как прочитанное';
    toast(`+${XP.article} XP`);
  };

  // автоотметка при долистывании до конца
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && get().articles[a.id]?.status !== 'read') btn.click();
  }, { threshold: 0.5 });
  io.observe(root.querySelector('#mark').closest('.card'));
  return () => io.disconnect();
}
