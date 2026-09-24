/* ============================================================
   db.js — учебная база для SQL-песочницы.
   Данные генерируются детерминированно (свой ГПСЧ),
   поэтому у всех одинаковые и задачи проверяемы.
   ============================================================ */

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const CITIES = [
  ['Алматы', 0.34], ['Астана', 0.26], ['Шымкент', 0.14],
  ['Караганда', 0.10], ['Актобе', 0.09], ['Атырау', 0.07],
];
const PLANS = [['free', 0.55], ['basic', 0.30], ['pro', 0.15]];
const CATS = ['Кофе', 'Выпечка', 'Обеды', 'Напитки', 'Десерты'];
const FIRST = ['Айгерим','Данияр','Мадина','Ержан','Асель','Тимур','Дана','Нурлан','Камила','Арман','Алия','Бекзат','Жанна','Руслан','Сабина','Олжас'];
const LAST = ['Абенов','Сериков','Жумаев','Оспанов','Тулеген','Каримов','Нурпеис','Байжан','Сатпаев','Ахметов'];

const pick = (r, table) => {
  let x = r(), acc = 0;
  for (const [v, p] of table) { acc += p; if (x < acc) return v; }
  return table[table.length - 1][0];
};

const iso = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

export function seedSQL() {
  const r = rng(20260924);
  const out = [];

  out.push(`CREATE TABLE users (
    id INTEGER PRIMARY KEY, name TEXT, city TEXT, plan TEXT, created_at TEXT
  );`);
  out.push(`CREATE TABLE products (
    id INTEGER PRIMARY KEY, name TEXT, category TEXT, price INTEGER
  );`);
  out.push(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY, user_id INTEGER, created_at TEXT, total INTEGER, status TEXT
  );`);
  out.push(`CREATE TABLE order_items (
    id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, qty INTEGER, price INTEGER
  );`);
  out.push(`CREATE TABLE events (
    id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT, created_at TEXT
  );`);

  /* --- продукты --- */
  const PRODUCTS = [
    ['Американо','Кофе',700],['Капучино','Кофе',1100],['Латте','Кофе',1200],['Раф','Кофе',1500],
    ['Круассан','Выпечка',900],['Самса','Выпечка',600],['Багет','Выпечка',450],
    ['Бизнес-ланч','Обеды',2500],['Паста','Обеды',2200],['Салат Цезарь','Обеды',1900],
    ['Лимонад','Напитки',800],['Чай','Напитки',500],['Смузи','Напитки',1400],
    ['Чизкейк','Десерты',1600],['Тирамису','Десерты',1700],['Медовик','Десерты',1300],
  ];
  PRODUCTS.forEach(([n, c, p], i) =>
    out.push(`INSERT INTO products VALUES (${i + 1}, '${n}', '${c}', ${p});`));

  /* --- пользователи --- */
  const N_USERS = 320;
  const start = new Date('2025-01-05T00:00:00Z');
  const users = [];
  for (let i = 1; i <= N_USERS; i++) {
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    const city = pick(r, CITIES);
    const plan = pick(r, PLANS);
    const d = new Date(start.getTime() + Math.floor(r() * 400) * 86400000);
    users.push({ id: i, city, plan, created: d });
    out.push(`INSERT INTO users VALUES (${i}, '${name}', '${city}', '${plan}', '${iso(d)}');`);
  }

  /* --- заказы: часть пользователей без заказов (для LEFT JOIN-задач) --- */
  let oid = 1, itemId = 1;
  for (const u of users) {
    if (r() < 0.18) continue;                      // 18% без заказов
    const base = u.plan === 'pro' ? 9 : u.plan === 'basic' ? 5 : 2;
    const n = 1 + Math.floor(r() * base);
    for (let k = 0; k < n; k++) {
      const d = new Date(u.created.getTime() + Math.floor(r() * 330) * 86400000 + Math.floor(r() * 12) * 3600000);
      if (d > new Date('2026-09-20T00:00:00Z')) continue;
      const status = r() < 0.86 ? 'paid' : (r() < 0.6 ? 'cancelled' : 'new');
      const nItems = 1 + Math.floor(r() * 3);
      let total = 0;
      const lines = [];
      for (let j = 0; j < nItems; j++) {
        const pid = 1 + Math.floor(r() * PRODUCTS.length);
        const qty = 1 + Math.floor(r() * 3);
        const price = PRODUCTS[pid - 1][2];
        total += qty * price;
        lines.push([itemId++, oid, pid, qty, price]);
      }
      out.push(`INSERT INTO orders VALUES (${oid}, ${u.id}, '${iso(d)}', ${total}, '${status}');`);
      lines.forEach(l => out.push(`INSERT INTO order_items VALUES (${l[0]}, ${l[1]}, ${l[2]}, ${l[3]}, ${l[4]});`));
      oid++;
    }
  }

  /* --- события: для когортных задач --- */
  let eid = 1;
  const EV = ['open_app', 'view_menu', 'add_to_cart', 'checkout'];
  for (const u of users) {
    const life = u.plan === 'pro' ? 200 : u.plan === 'basic' ? 90 : 25;
    const n = 3 + Math.floor(r() * 25);
    for (let k = 0; k < n; k++) {
      const d = new Date(u.created.getTime() + Math.floor(r() * life) * 86400000);
      if (d > new Date('2026-09-20T00:00:00Z')) continue;
      out.push(`INSERT INTO events VALUES (${eid++}, ${u.id}, '${EV[Math.floor(r() * EV.length)]}', '${iso(d)}');`);
    }
  }

  return out.join('\n');
}

export const SCHEMA = [
  { table: 'users', cols: 'id, name, city, plan (free/basic/pro), created_at' },
  { table: 'orders', cols: 'id, user_id, created_at, total, status (paid/new/cancelled)' },
  { table: 'order_items', cols: 'id, order_id, product_id, qty, price' },
  { table: 'products', cols: 'id, name, category, price' },
  { table: 'events', cols: 'id, user_id, name (open_app/view_menu/add_to_cart/checkout), created_at' },
];
