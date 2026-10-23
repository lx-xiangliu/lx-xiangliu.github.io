# Xiang Liu — Academic Homepage

Personal academic website of Xiang Liu (刘祥), an undergraduate researcher at Xiamen University and a research intern at Stony Brook University.

**Website:** https://lx-xiangliu.github.io/

## Update the site

- `index.html`: biography, news, publications, research, education, and experience.
- `assets/css/personal.css`: custom layout and styles layered over the original theme.
- `assets/css/theme-luka.css`: original Luka theme.
- `assets/js/homepage.js`: accessible theme toggle with persistent preference.
- `assets/img/xiang-liu.jpg`: profile avatar.
- `assets/img/favicon.svg`: site icon.

The site uses static HTML, CSS, and JavaScript with no build step, analytics, or remote font/icon dependencies. Missing paper, code, and CV links are intentionally omitted; add actual links when available.

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ in a browser.

## GitHub Pages

Published from the `main` branch at `/` (repository root). `.nojekyll` bypasses Jekyll processing. Changes to the publishing branch trigger GitHub Pages deployment.

## Credits and license

Adapted from [Luka Homepage Template](https://github.com/wzsyyh/luka-homepage-template) by [Yuheng Yang](https://wzsyyh.github.io/), upstream commit `41cba0881dd0911624f3006a593120e071676686`. Original template license retained in [LICENSE.md](LICENSE.md).

Academic content was provided by Xiang Liu. The supplied personal avatar is not covered by the template's software license.
