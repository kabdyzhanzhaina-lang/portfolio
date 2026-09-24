/* ============================================================
   sqltasks.js — задачи для SQL-песочницы.
   Проверка: твой запрос сравнивается с эталонным по результату,
   а не по тексту. Способ решения может быть любым.
   ============================================================ */

export const SQL_TASKS = [
{
  id: 'q1', level: 'Разминка', title: 'Первые строки',
  question: 'Выведи id, name и city первых 10 пользователей, отсортированных по id.',
  ordered: true,
  solution: `SELECT id, name, city FROM users ORDER BY id LIMIT 10;`,
  hint: 'SELECT нужные колонки FROM users ORDER BY id LIMIT 10',
},
{
  id: 'q2', level: 'Разминка', title: 'Фильтр',
  question: 'Сколько пользователей из Алматы? Выведи одно число в колонке с любым именем.',
  ordered: false,
  solution: `SELECT COUNT(*) AS n FROM users WHERE city = 'Алматы';`,
  hint: 'COUNT(*) с условием WHERE city = …',
},
{
  id: 'q3', level: 'Разминка', title: 'Уникальные значения',
  question: 'Выведи все уникальные категории товаров, отсортированные по алфавиту.',
  ordered: true,
  solution: `SELECT DISTINCT category FROM products ORDER BY category;`,
  hint: 'DISTINCT убирает повторы',
},
{
  id: 'q4', level: 'Группировка', title: 'Выручка по городам',
  question: 'Для оплаченных заказов (status = \'paid\') посчитай по городам: число заказов и суммарную выручку. Отсортируй по выручке по убыванию. Колонки: city, orders, revenue.',
  ordered: true,
  solution: `SELECT u.city AS city, COUNT(*) AS orders, SUM(o.total) AS revenue
FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.city
ORDER BY revenue DESC;`,
  hint: 'JOIN users к orders, затем GROUP BY city',
},
{
  id: 'q5', level: 'Группировка', title: 'Средний чек по тарифам',
  question: 'Средний чек оплаченных заказов по тарифам пользователей. Округли до целого. Колонки: plan, avg_check. Сортировка по avg_check по убыванию.',
  ordered: true,
  solution: `SELECT u.plan AS plan, CAST(ROUND(AVG(o.total)) AS INTEGER) AS avg_check
FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.plan
ORDER BY avg_check DESC;`,
  hint: 'AVG + ROUND, не забудь CAST(… AS INTEGER) для точного сравнения',
},
{
  id: 'q6', level: 'Группировка', title: 'Фильтр по агрегату',
  question: 'Города, где больше 60 оплаченных заказов. Колонки: city, orders. Сортировка по orders по убыванию.',
  ordered: true,
  solution: `SELECT u.city AS city, COUNT(*) AS orders
FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.city
HAVING COUNT(*) > 60
ORDER BY orders DESC;`,
  hint: 'Фильтр по агрегату — это HAVING, а не WHERE',
},
{
  id: 'q7', level: 'JOIN', title: 'Кто ни разу не заказал',
  question: 'Сколько пользователей не сделали ни одного заказа? Выведи одно число.',
  ordered: false,
  solution: `SELECT COUNT(*) AS n FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;`,
  hint: 'LEFT JOIN + WHERE orders.id IS NULL',
},
{
  id: 'q8', level: 'JOIN', title: 'Топ товаров',
  question: 'Топ-5 товаров по суммарной выручке (qty × price) среди оплаченных заказов. Колонки: name, revenue. Сортировка по revenue по убыванию.',
  ordered: true,
  solution: `SELECT p.name AS name, SUM(i.qty * i.price) AS revenue
FROM order_items i
JOIN orders o ON o.id = i.order_id
JOIN products p ON p.id = i.product_id
WHERE o.status = 'paid'
GROUP BY p.name
ORDER BY revenue DESC
LIMIT 5;`,
  hint: 'Три таблицы: order_items → orders (для статуса) → products (для названия)',
},
{
  id: 'q9', level: 'JOIN', title: 'Осторожно, размножение строк',
  question: 'Сколько РАЗНЫХ пользователей сделали хотя бы один оплаченный заказ? Выведи одно число.',
  ordered: false,
  solution: `SELECT COUNT(DISTINCT o.user_id) AS n FROM orders o WHERE o.status = 'paid';`,
  hint: 'COUNT(DISTINCT …) — иначе посчитаешь заказы, а не людей',
},
{
  id: 'q10', level: 'Время', title: 'Выручка по месяцам',
  question: 'Выручка оплаченных заказов по месяцам. Колонки: month (в формате YYYY-MM), revenue. Сортировка по month по возрастанию.',
  ordered: true,
  solution: `SELECT strftime('%Y-%m', created_at) AS month, SUM(total) AS revenue
FROM orders WHERE status = 'paid'
GROUP BY month ORDER BY month;`,
  hint: "В SQLite формат даты берётся через strftime('%Y-%m', created_at)",
},
{
  id: 'q11', level: 'Подзапросы', title: 'Первый заказ каждого',
  question: 'Для каждого пользователя с заказами выведи дату его первого заказа. Колонки: user_id, first_order (только дата, YYYY-MM-DD). Первые 10 по user_id.',
  ordered: true,
  solution: `SELECT user_id, DATE(MIN(created_at)) AS first_order
FROM orders GROUP BY user_id ORDER BY user_id LIMIT 10;`,
  hint: 'MIN(created_at) с группировкой по user_id, обернуть в DATE()',
},
{
  id: 'q12', level: 'Подзапросы', title: 'Выше среднего',
  question: 'Сколько оплаченных заказов имеют сумму выше средней по всем оплаченным заказам? Выведи одно число.',
  ordered: false,
  solution: `SELECT COUNT(*) AS n FROM orders
WHERE status = 'paid'
  AND total > (SELECT AVG(total) FROM orders WHERE status = 'paid');`,
  hint: 'Скалярный подзапрос в условии WHERE',
},
{
  id: 'q13', level: 'Когорты', title: 'Когорты по месяцу регистрации',
  question: 'Сколько пользователей в каждой когорте по месяцу регистрации? Колонки: cohort (YYYY-MM), users. Сортировка по cohort.',
  ordered: true,
  solution: `SELECT strftime('%Y-%m', created_at) AS cohort, COUNT(*) AS users
FROM users GROUP BY cohort ORDER BY cohort;`,
  hint: 'Группировка по месяцу поля created_at таблицы users',
},
{
  id: 'q14', level: 'Когорты', title: 'Повторные покупатели',
  question: 'Сколько пользователей сделали 2 и более оплаченных заказа? Выведи одно число.',
  ordered: false,
  solution: `SELECT COUNT(*) AS n FROM (
  SELECT user_id FROM orders WHERE status = 'paid'
  GROUP BY user_id HAVING COUNT(*) >= 2
);`,
  hint: 'Сначала группировка с HAVING, потом COUNT по результату — подзапрос в FROM',
},
{
  id: 'q15', level: 'Окна', title: 'Последний заказ каждого',
  question: 'Для каждого пользователя выведи его последний оплаченный заказ. Колонки: user_id, order_id, total. Первые 10 по user_id.',
  ordered: true,
  solution: `WITH ranked AS (
  SELECT user_id, id AS order_id, total,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
  FROM orders WHERE status = 'paid'
)
SELECT user_id, order_id, total FROM ranked WHERE rn = 1
ORDER BY user_id LIMIT 10;`,
  hint: 'ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) и фильтр rn = 1',
},
{
  id: 'q16', level: 'Окна', title: 'Доля города в выручке',
  question: 'Для каждого города: выручка и её доля в общей выручке по всем городам в процентах, округлённая до одного знака. Колонки: city, revenue, share. Сортировка по revenue по убыванию. Считай только оплаченные заказы.',
  ordered: true,
  solution: `SELECT u.city AS city,
       SUM(o.total) AS revenue,
       ROUND(SUM(o.total) * 100.0 / SUM(SUM(o.total)) OVER (), 1) AS share
FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.city
ORDER BY revenue DESC;`,
  hint: 'Оконная функция поверх агрегата: SUM(SUM(total)) OVER () даёт общий итог',
},
];
