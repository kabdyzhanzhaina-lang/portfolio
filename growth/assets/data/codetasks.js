/* ============================================================
   codetasks.js — задачи по JavaScript с автопроверкой.
   Каждая задача: напиши функцию solve(...), тесты прогонятся сами.
   ============================================================ */

export const CODE_TASKS = [
{
  id: 'c1', level: 'Разминка', title: 'Сумма чисел',
  prompt: 'Верни сумму всех чисел массива. Для пустого массива — 0.',
  starter: `function solve(nums) {\n  // твой код\n}`,
  tests: [
    { args: [[1, 2, 3]], expected: 6 },
    { args: [[]], expected: 0 },
    { args: [[-5, 5, 10]], expected: 10 },
  ],
  solution: `function solve(nums) {\n  return nums.reduce((a, b) => a + b, 0);\n}`,
},
{
  id: 'c2', level: 'Разминка', title: 'Средний чек',
  prompt: 'Дан массив заказов вида { total }. Верни средний чек, округлённый до целого. Для пустого массива — 0.',
  starter: `function solve(orders) {\n  // твой код\n}`,
  tests: [
    { args: [[{ total: 1000 }, { total: 2000 }]], expected: 1500 },
    { args: [[]], expected: 0 },
    { args: [[{ total: 1000 }, { total: 1001 }, { total: 1000 }]], expected: 1000 },
  ],
  solution: `function solve(orders) {\n  if (!orders.length) return 0;\n  return Math.round(orders.reduce((a, o) => a + o.total, 0) / orders.length);\n}`,
},
{
  id: 'c3', level: 'Разминка', title: 'Фильтр по статусу',
  prompt: 'Верни массив сумм только оплаченных заказов (status === "paid").',
  starter: `function solve(orders) {\n  // твой код\n}`,
  tests: [
    { args: [[{ total: 100, status: 'paid' }, { total: 50, status: 'new' }, { total: 70, status: 'paid' }]], expected: [100, 70] },
    { args: [[{ total: 10, status: 'new' }]], expected: [] },
  ],
  solution: `function solve(orders) {\n  return orders.filter(o => o.status === 'paid').map(o => o.total);\n}`,
},
{
  id: 'c4', level: 'Группировка', title: 'Выручка по городам',
  prompt: 'Дан массив заказов { city, total }. Верни объект { город: суммарная выручка }.',
  starter: `function solve(orders) {\n  // твой код\n}`,
  tests: [
    { args: [[{ city: 'Алматы', total: 100 }, { city: 'Астана', total: 50 }, { city: 'Алматы', total: 200 }]],
      expected: { 'Алматы': 300, 'Астана': 50 } },
    { args: [[]], expected: {} },
  ],
  solution: `function solve(orders) {\n  return orders.reduce((acc, o) => {\n    acc[o.city] = (acc[o.city] || 0) + o.total;\n    return acc;\n  }, {});\n}`,
},
{
  id: 'c5', level: 'Группировка', title: 'Топ-N по значению',
  prompt: 'Дан объект { ключ: число } и число n. Верни массив из n ключей с наибольшими значениями, по убыванию.',
  starter: `function solve(obj, n) {\n  // твой код\n}`,
  tests: [
    { args: [{ a: 5, b: 12, c: 3, d: 8 }, 2], expected: ['b', 'd'] },
    { args: [{ x: 1 }, 3], expected: ['x'] },
  ],
  solution: `function solve(obj, n) {\n  return Object.entries(obj)\n    .sort((a, b) => b[1] - a[1])\n    .slice(0, n)\n    .map(e => e[0]);\n}`,
},
{
  id: 'c6', level: 'Метрики', title: 'Конверсия',
  prompt: 'Дан массив событий { user, name }. Посчитай конверсию из "view" в "purchase" по уникальным пользователям, в процентах, округли до одного знака. Если просмотров нет — верни 0.',
  starter: `function solve(events) {\n  // твой код\n}`,
  tests: [
    { args: [[{ user: 1, name: 'view' }, { user: 1, name: 'purchase' }, { user: 2, name: 'view' }, { user: 1, name: 'view' }]], expected: 50 },
    { args: [[]], expected: 0 },
    { args: [[{ user: 1, name: 'view' }, { user: 2, name: 'view' }, { user: 3, name: 'view' }, { user: 1, name: 'purchase' }]], expected: 33.3 },
  ],
  solution: `function solve(events) {\n  const views = new Set(events.filter(e => e.name === 'view').map(e => e.user));\n  const buys = new Set(events.filter(e => e.name === 'purchase').map(e => e.user));\n  if (!views.size) return 0;\n  const converted = [...buys].filter(u => views.has(u)).length;\n  return Math.round(converted / views.size * 1000) / 10;\n}`,
},
{
  id: 'c7', level: 'Метрики', title: 'LTV',
  prompt: 'Посчитай LTV: arpu × margin × (1 / churn). Округли до целого. Если churn равен 0 — верни null (бесконечный срок жизни).',
  starter: `function solve(arpu, margin, churn) {\n  // твой код\n}`,
  tests: [
    { args: [5000, 0.6, 0.05], expected: 60000 },
    { args: [20000, 0.7, 0.04], expected: 350000 },
    { args: [1000, 0.5, 0], expected: null },
  ],
  solution: `function solve(arpu, margin, churn) {\n  if (churn === 0) return null;\n  return Math.round(arpu * margin * (1 / churn));\n}`,
},
{
  id: 'c8', level: 'Метрики', title: 'Удержание по дням',
  prompt: 'Дан массив { user, day } — дни активности от регистрации (день 0 — регистрация). Верни объект { 1: %, 7: %, 30: % } — доля от всех пользователей, активных в этот день. Проценты округли до целого.',
  starter: `function solve(rows) {\n  // твой код\n}`,
  tests: [
    { args: [[{ user: 1, day: 0 }, { user: 1, day: 1 }, { user: 2, day: 0 }, { user: 3, day: 0 }, { user: 3, day: 7 }]],
      expected: { 1: 33, 7: 33, 30: 0 } },
  ],
  solution: `function solve(rows) {\n  const all = new Set(rows.map(r => r.user));\n  const res = {};\n  for (const d of [1, 7, 30]) {\n    const active = new Set(rows.filter(r => r.day === d).map(r => r.user));\n    res[d] = all.size ? Math.round(active.size / all.size * 100) : 0;\n  }\n  return res;\n}`,
},
{
  id: 'c9', level: 'Данные', title: 'RICE-сортировка',
  prompt: 'Дан массив задач { title, reach, impact, confidence, effort }. Верни массив названий, отсортированный по RICE-score по убыванию. Confidence приходит как доля (0.8 — это 80%).',
  starter: `function solve(items) {\n  // твой код\n}`,
  tests: [
    { args: [[
        { title: 'A', reach: 1000, impact: 2, confidence: 0.8, effort: 2 },
        { title: 'B', reach: 5000, impact: 1, confidence: 1, effort: 10 },
        { title: 'C', reach: 200, impact: 3, confidence: 1, effort: 1 },
      ]], expected: ['A', 'C', 'B'] },
  ],
  solution: `function solve(items) {\n  return [...items]\n    .sort((a, b) =>\n      (b.reach * b.impact * b.confidence / b.effort) -\n      (a.reach * a.impact * a.confidence / a.effort))\n    .map(i => i.title);\n}`,
},
{
  id: 'c10', level: 'Данные', title: 'Соединение таблиц',
  prompt: 'Даны users [{ id, name }] и orders [{ userId, total }]. Верни массив { name, orders, revenue } для всех пользователей, включая тех, у кого заказов нет. Порядок — как в users.',
  starter: `function solve(users, orders) {\n  // твой код\n}`,
  tests: [
    { args: [[{ id: 1, name: 'Аня' }, { id: 2, name: 'Бота' }],
             [{ userId: 1, total: 100 }, { userId: 1, total: 50 }]],
      expected: [{ name: 'Аня', orders: 2, revenue: 150 }, { name: 'Бота', orders: 0, revenue: 0 }] },
  ],
  solution: `function solve(users, orders) {\n  return users.map(u => {\n    const mine = orders.filter(o => o.userId === u.id);\n    return { name: u.name, orders: mine.length, revenue: mine.reduce((a, o) => a + o.total, 0) };\n  });\n}`,
},
{
  id: 'c11', level: 'Данные', title: 'Скользящее среднее',
  prompt: 'Дан массив чисел и окно n. Верни массив скользящих средних (округлённых до одного знака). Первые n−1 элементов пропусти — результат короче исходного на n−1.',
  starter: `function solve(nums, n) {\n  // твой код\n}`,
  tests: [
    { args: [[1, 2, 3, 4, 5], 3], expected: [2, 3, 4] },
    { args: [[10, 20], 2], expected: [15] },
    { args: [[1, 2], 5], expected: [] },
  ],
  solution: `function solve(nums, n) {\n  const out = [];\n  for (let i = n - 1; i < nums.length; i++) {\n    const w = nums.slice(i - n + 1, i + 1);\n    out.push(Math.round(w.reduce((a, b) => a + b, 0) / n * 10) / 10);\n  }\n  return out;\n}`,
},
{
  id: 'c12', level: 'Данные', title: 'Медиана',
  prompt: 'Верни медиану массива чисел. Для чётной длины — среднее двух центральных. Для пустого — null. Исходный массив менять нельзя.',
  starter: `function solve(nums) {\n  // твой код\n}`,
  tests: [
    { args: [[3, 1, 2]], expected: 2 },
    { args: [[4, 1, 3, 2]], expected: 2.5 },
    { args: [[]], expected: null },
    { args: [[10, 9, 100]], expected: 10 },
  ],
  solution: `function solve(nums) {\n  if (!nums.length) return null;\n  const s = [...nums].sort((a, b) => a - b);\n  const m = Math.floor(s.length / 2);\n  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;\n}`,
},
];
