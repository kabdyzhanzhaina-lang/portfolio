# Zhaina Kabdyzhan — Product Designer Portfolio

A minimal, editorial, bilingual (EN/RU) portfolio built as fast static HTML/CSS/JS.
No build step — open `index.html` in a browser or deploy the folder to any static host
(Netlify, Vercel, GitHub Pages, Cloudflare Pages).

## Structure

```
index.html                 Main page (hero, work, about, skills, experience,
                           education, languages, volunteering, contact, footer)
work/
  yume.html                01 — Yume Cloud   (full case study)
  ordio.html               02 — Ordio        (full case study, 0→1 ecosystem)
  smart-gardener.html      03 — Smart Gardener
  qomics.html              04 — Qomics
  womens-diary.html        05 — Women's Diary (research layout)
assets/
  css/styles.css           Design system (tokens, components, responsive)
  js/main.js               Language toggle, sticky nav, reveal, scroll progress
  img/                     Put your project screenshots here
```

## Language toggle (EN / RU)

Every piece of translatable text lives twice in the markup:

```html
<span lang="en">View Work</span><span lang="ru">Смотреть работы</span>
```

CSS shows only the language that matches `<html data-lang="…">`, and the choice is
saved to `localStorage`. To edit copy, edit both `lang="en"` and `lang="ru"` spans.

## Adding real screenshots

Each image placeholder looks like:

```html
<div class="ph-block">
  <span class="ph-label">Project Visual</span>
  <span class="ph-sub">…Upload …</span>
</div>
```

Replace the whole `.ph-block` (or the parent `.frame` / `.card-media` contents)
with an `<img>`:

```html
<img src="../assets/img/yume-dashboard.png" alt="Yume Cloud dashboard" />
```

- In `index.html` cards, swap the `.ph` block inside `.card-media` for
  `<img src="assets/img/…">`.
- In `work/*.html`, swap the `.ph-block` inside `.frame` for
  `<img src="../assets/img/…">`.

Images inside `.frame` and `.card-media` are automatically sized and get the
hover-scale interaction. Prefer real product screenshots — no stock imagery.

## Design system

- **Background:** warm off-white `--bg: #f7f6f2`
- **Ink:** near-black `--ink: #111110`
- **Accent:** electric cobalt `--accent: #1f43ff` (no purple)
- **Type:** Inter (grotesk) + Newsreader italic for editorial accents
- **Grid:** 12-column, `--maxw: 1320px`

All tokens are CSS variables at the top of `assets/css/styles.css` — change once,
updates everywhere.

## Contact

Email: kabdyzhanzhaina@gmail.com · Telegram: @zhaenaa · Almaty, Kazakhstan

Placeholders for LinkedIn / Behance / Dribbble are in the Contact section and
footer — add the URLs when ready.
