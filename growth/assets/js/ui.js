/* ============================================================
   ui.js — мелкие помощники для вёрстки вью
   ============================================================ */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Экранирование пользовательского текста перед вставкой в HTML. */
export function esc(str = '') {
  return String(str).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function modal(html, onMount) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', esckey); };
  const esckey = e => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.addEventListener('keydown', esckey);
  document.body.appendChild(back);
  onMount?.(back.firstElementChild, close);
  return close;
}

export function confirmAsk(text, okLabel = 'Да') {
  return new Promise(res => {
    const close = modal(
      `<h3>${esc(text)}</h3><div class="row" style="justify-content:flex-end;margin-top:18px">
        <button class="btn ghost" data-no>Отмена</button><button class="btn" data-yes>${esc(okLabel)}</button></div>`,
      (m, c) => {
        m.querySelector('[data-no]').onclick = () => { c(); res(false); };
        m.querySelector('[data-yes]').onclick = () => { c(); res(true); };
      });
    void close;
  });
}

export const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

export const fmtDate = iso =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

export const TRACKS = {
  product:  { label: 'Продукт',  short: 'Product'  },
  delivery: { label: 'Проджект', short: 'Delivery' },
  data:     { label: 'Данные',   short: 'Data'     },
  code:     { label: 'Код',      short: 'Code'     },
};

export const trackTag = t => `<span class="tag t-${t}">${TRACKS[t]?.label || t}</span>`;

export function ring(pct, size = 132, stroke = 9) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const color = pct >= 80 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--bad)';
  return `<svg width="${size}" height="${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--bg-2)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
  </svg>`;
}

/** Делегирование кликов: on(root, '[data-x]', el => …) */
export function on(root, sel, handler, evt = 'click') {
  root.addEventListener(evt, e => {
    const el = e.target.closest(sel);
    if (el && root.contains(el)) handler(el, e);
  });
}
