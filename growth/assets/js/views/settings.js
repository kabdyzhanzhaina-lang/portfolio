import { get, update, exportJSON, importJSON, reset } from '../store.js';
import { esc, toast, confirmAsk } from '../ui.js';

export async function render(root) {
  function draw() {
    const s = get();
    const size = (() => {
      try { return Math.round((localStorage.getItem('growthlab.v1') || '').length / 1024); }
      catch { return 0; }
    })();

    root.innerHTML = `
      <div class="page-head">
        <h1>Настройки</h1>
        <p>Весь прогресс хранится только в этом браузере и никуда не отправляется. Поэтому резервная копия — не формальность: очистка данных сайта сотрёт всё.</p>
      </div>

      <div class="card" style="max-width:560px">
        <label class="fld"><span>Имя</span>
          <input class="input" id="name" value="${esc(s.settings.name || '')}" /></label>
        <label class="fld"><span>Дневная цель, XP</span>
          <input class="input" id="goal" type="number" min="5" max="500" step="5" value="${s.settings.dailyGoal}" />
        </label>
        <p class="muted" style="font-size:13px;margin-top:-6px">Ориентир: статья — 20, тест — 15, SQL или код — 25, задача — 60, книга — 40.</p>
        <div class="row" style="margin-top:14px"><button class="btn accent" id="save">Сохранить</button></div>
      </div>

      <h2 class="sec">Резервная копия</h2>
      <div class="card" style="max-width:560px">
        <p class="muted">Данных сохранено: ~${size} КБ. Делай копию раз в месяц и после больших продвижений.</p>
        <div class="row" style="margin-top:14px">
          <button class="btn" id="exp">Скачать копию</button>
          <button class="btn ghost" id="imp">Загрузить копию</button>
          <input type="file" id="file" accept="application/json,.json" hidden />
        </div>
      </div>

      <h2 class="sec">Опасная зона</h2>
      <div class="card" style="max-width:560px;border-color:var(--bad)">
        <b style="font-size:15px">Сбросить весь прогресс</b>
        <p class="muted" style="margin-top:4px">Удалит статусы статей, книг, задач, решения, повторения, цели, артефакты и дневник. Отменить нельзя.</p>
        <div class="row" style="margin-top:14px"><button class="btn ghost" id="reset" style="border-color:var(--bad);color:var(--bad)">Сбросить всё</button></div>
      </div>

      <h2 class="sec">Как это устроено</h2>
      <div class="card" style="max-width:560px">
        <p class="muted" style="line-height:1.65">
          Платформа — статический сайт без сервера. Прогресс лежит в localStorage этого браузера.<br><br>
          Содержимое (статьи, книги, задачи, термины, кейсы) хранится в файлах
          <code class="mono">growth/assets/data/</code> — их можно дополнять своими материалами,
          формат виден по существующим записям.<br><br>
          Повторения работают по алгоритму SM-2: чем легче вспомнила, тем длиннее следующий интервал.
        </p>
      </div>`;

    root.querySelector('#save').onclick = () => {
      const goal = Math.max(5, Math.min(500, +root.querySelector('#goal').value || 20));
      update(s2 => {
        s2.settings.name = root.querySelector('#name').value.trim();
        s2.settings.dailyGoal = goal;
      });
      toast('Сохранено');
      draw();
    };

    root.querySelector('#exp').onclick = () => { exportJSON(); toast('Копия скачана'); };
    root.querySelector('#imp').onclick = () => root.querySelector('#file').click();
    root.querySelector('#file').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      if (!await confirmAsk('Загрузка копии заменит текущий прогресс. Продолжить?', 'Загрузить')) return;
      try {
        importJSON(await f.text());
        toast('Прогресс восстановлен');
        location.hash = '#/';
      } catch (err) { toast('Не удалось прочитать файл: ' + err.message); }
    };

    root.querySelector('#reset').onclick = async () => {
      if (!await confirmAsk('Точно сбросить весь прогресс? Это нельзя отменить.', 'Сбросить')) return;
      reset();
      toast('Прогресс сброшен');
      location.hash = '#/';
    };
  }

  draw();
}
