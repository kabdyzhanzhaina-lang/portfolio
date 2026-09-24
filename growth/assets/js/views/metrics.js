/* ============================================================
   metrics.js — тренажёр метрик: числа генерируются заново
   каждый раз, поэтому ответ нельзя запомнить, только посчитать.
   ============================================================ */

import { logEvent } from '../store.js';
import { esc, toast } from '../ui.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const money = n => n.toLocaleString('ru-RU');

const GEN = [
{
  id: 'm-cac', name: 'CAC',
  make() {
    const spend = ri(4, 30) * 100000, n = ri(8, 60);
    return {
      q: `На маркетинг за месяц потрачено ${money(spend)} ₸, привлечено ${n} новых клиентов. Чему равен CAC?`,
      a: spend / n, unit: '₸', tol: 1,
      how: `CAC = расходы на привлечение / число новых клиентов = ${money(spend)} / ${n} = ${money(Math.round(spend / n))} ₸`,
    };
  },
},
{
  id: 'm-ltv', name: 'LTV',
  make() {
    const arpu = ri(3, 40) * 1000, margin = ri(4, 9) / 10, churn = ri(2, 12) / 100;
    return {
      q: `ARPU ${money(arpu)} ₸ в месяц, маржа ${Math.round(margin * 100)}%, месячный отток ${(churn * 100).toFixed(0)}%. Чему равен LTV?`,
      a: arpu * margin * (1 / churn), unit: '₸', tol: Math.max(50, arpu * 0.01),
      how: `Срок жизни = 1 / ${churn} = ${(1 / churn).toFixed(1)} мес.
LTV = ARPU × маржа × срок = ${money(arpu)} × ${margin} × ${(1 / churn).toFixed(1)} ≈ ${money(Math.round(arpu * margin / churn))} ₸`,
    };
  },
},
{
  id: 'm-ratio', name: 'LTV / CAC',
  make() {
    const ltv = ri(10, 60) * 10000, cac = ri(2, 20) * 10000;
    return {
      q: `LTV = ${money(ltv)} ₸, CAC = ${money(cac)} ₸. Чему равно LTV/CAC? Один знак после запятой.`,
      a: ltv / cac, unit: '', tol: 0.15,
      how: `${money(ltv)} / ${money(cac)} = ${(ltv / cac).toFixed(2)}.
Ориентир: ≥ 3 — здоровая экономика, < 1 — убыток на каждом клиенте, > 5 — возможно, недоинвестируете в рост.`,
    };
  },
},
{
  id: 'm-payback', name: 'Окупаемость',
  make() {
    const cac = ri(3, 30) * 10000, arpu = ri(3, 30) * 1000, margin = ri(5, 9) / 10;
    return {
      q: `CAC ${money(cac)} ₸, ARPU ${money(arpu)} ₸/мес, маржа ${Math.round(margin * 100)}%. За сколько месяцев клиент окупит привлечение? Один знак.`,
      a: cac / (arpu * margin), unit: 'мес.', tol: 0.3,
      how: `Валовая прибыль в месяц = ${money(arpu)} × ${margin} = ${money(Math.round(arpu * margin))} ₸.
Payback = ${money(cac)} / ${money(Math.round(arpu * margin))} = ${(cac / (arpu * margin)).toFixed(1)} мес.`,
    };
  },
},
{
  id: 'm-dau', name: 'DAU / MAU',
  make() {
    const mau = ri(10, 200) * 1000, ratio = ri(5, 60) / 100;
    const dau = Math.round(mau * ratio);
    return {
      q: `MAU = ${money(mau)}, DAU = ${money(dau)}. Чему равен DAU/MAU в процентах? Целое число.`,
      a: dau / mau * 100, unit: '%', tol: 1,
      how: `${money(dau)} / ${money(mau)} = ${(dau / mau).toFixed(3)} → ${Math.round(dau / mau * 100)}%.
Для рабочего инструмента 30–50% — хорошо, для мессенджера ждут 50%+.`,
    };
  },
},
{
  id: 'm-retention', name: 'Годовое удержание',
  make() {
    const churn = ri(2, 15);
    return {
      q: `Месячный отток ${churn}%. Какая доля клиентов останется через 12 месяцев? Целое число процентов.`,
      a: Math.pow(1 - churn / 100, 12) * 100, unit: '%', tol: 2,
      how: `(1 − ${churn / 100}) в степени 12 = ${Math.pow(1 - churn / 100, 12).toFixed(4)} → ${Math.round(Math.pow(1 - churn / 100, 12) * 100)}%.
Связь нелинейная: умножать месячный отток на 12 нельзя.`,
    };
  },
},
{
  id: 'm-conv', name: 'Конверсия воронки',
  make() {
    const v = ri(20, 200) * 100;
    const c = Math.round(v * ri(10, 50) / 100);
    const o = Math.round(c * ri(20, 80) / 100);
    return {
      q: `${money(v)} посещений → ${money(c)} корзин → ${money(o)} заказов. Какова сквозная конверсия из посещения в заказ? Два знака, в процентах.`,
      a: o / v * 100, unit: '%', tol: 0.1,
      how: `${money(o)} / ${money(v)} = ${(o / v).toFixed(4)} → ${(o / v * 100).toFixed(2)}%.
Это произведение шагов: ${(c / v * 100).toFixed(1)}% × ${(o / c * 100).toFixed(1)}%.`,
    };
  },
},
{
  id: 'm-rice', name: 'RICE-score',
  make() {
    const r = ri(5, 90) * 100;
    const i = [0.25, 0.5, 1, 2, 3][ri(0, 4)];
    const c = [0.5, 0.8, 1][ri(0, 2)];
    const e = ri(1, 12);
    return {
      q: `Reach ${money(r)}, Impact ${i}, Confidence ${Math.round(c * 100)}%, Effort ${e}. Чему равен RICE-score? Целое число.`,
      a: r * i * c / e, unit: '', tol: 1,
      how: `(${money(r)} × ${i} × ${c}) / ${e} = ${Math.round(r * i * c / e)}`,
    };
  },
},
{
  id: 'm-pert', name: 'PERT-оценка',
  make() {
    const o = ri(2, 10), p = o + ri(1, 8), w = p + ri(2, 20);
    return {
      q: `Оптимистичная оценка ${o} дн., реалистичная ${p} дн., пессимистичная ${w} дн. Что даёт формула PERT? Один знак.`,
      a: (o + 4 * p + w) / 6, unit: 'дн.', tol: 0.2,
      how: `(${o} + 4 × ${p} + ${w}) / 6 = ${((o + 4 * p + w) / 6).toFixed(1)} дн.`,
    };
  },
},
{
  id: 'm-arpu', name: 'ARPU и ARPPU',
  make() {
    const users = ri(10, 100) * 100, payRate = ri(2, 30) / 100;
    const payers = Math.max(1, Math.round(users * payRate));
    const rev = payers * ri(2, 20) * 1000;
    return {
      q: `${money(users)} пользователей, из них ${money(payers)} платящих. Выручка ${money(rev)} ₸. Чему равен ARPU? Целое число.`,
      a: rev / users, unit: '₸', tol: 2,
      how: `ARPU = выручка / всех пользователей = ${money(rev)} / ${money(users)} = ${money(Math.round(rev / users))} ₸.
Для сравнения ARPPU = ${money(rev)} / ${money(payers)} = ${money(Math.round(rev / payers))} ₸.`,
    };
  },
},
];

export async function render(root) {
  let task = null, streak = 0, total = 0, right = 0;

  root.innerHTML = `
    <div class="page-head">
      <h1>Тренажёр метрик</h1>
      <p>Числа генерируются заново каждый раз — ответ нельзя запомнить, только посчитать. Десять типов задач: экономика, воронка, удержание, оценка сроков.</p>
    </div>
    <div class="grid g4" style="margin-bottom:20px">
      <div class="stat"><div class="k">Подряд верно</div><div class="v" id="st">0</div></div>
      <div class="stat"><div class="k">Всего решено</div><div class="v" id="tt">0</div></div>
      <div class="stat"><div class="k">Точность</div><div class="v" id="ac">—</div></div>
    </div>
    <div class="quiz" id="body"></div>`;

  const body = root.querySelector('#body');
  const upd = () => {
    root.querySelector('#st').textContent = streak;
    root.querySelector('#tt').textContent = total;
    root.querySelector('#ac').textContent = total ? Math.round(right / total * 100) + '%' : '—';
  };

  function draw() {
    const gen = GEN[Math.floor(Math.random() * GEN.length)];
    task = { ...gen.make(), name: gen.name };
    body.innerHTML = `
      <div class="q-card">
        <div class="row" style="margin-bottom:12px"><span class="tag accent">${esc(task.name)}</span></div>
        <div class="q-stem">${esc(task.q)}</div>
        <div class="row">
          <input class="input" id="ans" type="text" inputmode="decimal" placeholder="Ответ" style="max-width:210px" autocomplete="off" />
          ${task.unit ? `<span class="muted">${esc(task.unit)}</span>` : ''}
        </div>
        <div id="after"></div>
        <div class="row" style="margin-top:16px">
          <button class="btn accent" id="check">Проверить</button>
          <button class="btn ghost" id="skip">Другая задача</button>
        </div>
      </div>`;

    const inp = body.querySelector('#ans');
    inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') body.querySelector('#check').click(); });
    body.querySelector('#skip').onclick = draw;
    body.querySelector('#check').onclick = () => {
      const v = parseFloat(inp.value.trim().replace(',', '.').replace(/\s/g, ''));
      if (Number.isNaN(v)) return toast('Введи число');
      const ok = Math.abs(v - task.a) <= task.tol;
      total++;
      if (ok) { right++; streak++; } else streak = 0;
      upd();
      if (ok) logEvent('metric', task.name, 5, 1);
      inp.disabled = true;
      body.querySelector('#check').style.display = 'none';
      body.querySelector('#after').innerHTML = `
        <div class="explain" style="border-color:${ok ? 'var(--ok)' : 'var(--bad)'}">
          <b>${ok ? 'Верно.' : `Не сходится. Правильный ответ: ${Math.round(task.a * 100) / 100}${task.unit ? ' ' + esc(task.unit) : ''}`}</b>
          <div style="margin-top:8px;white-space:pre-wrap">${esc(task.how)}</div>
        </div>`;
      const sk = body.querySelector('#skip');
      sk.textContent = 'Следующая →';
      sk.classList.remove('ghost');
      sk.classList.add('accent');
      sk.focus();
    };
  }

  draw(); upd();
}
