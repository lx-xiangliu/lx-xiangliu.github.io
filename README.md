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
- `assets/img/xiamen-university.svg` and `assets/img/stony-brook-university.png`: university marks; see [asset sources](ASSET_SOURCES.md).

The site uses static HTML, CSS, and JavaScript with no build step or remote font/icon dependencies. Missing paper, code, and CV links are intentionally omitted; add actual links when available.

## Visitor counter and world map

The public visitor section uses an aggregate counter at `https://xiang-liu-visitor-map.smartowl258.chatgpt.site`. On October 29, 2026, the owner authorized IPWhois (`ipwho.is`) to receive visitor network IPs for approximate city lookup. Browsers query IPWhois directly and send only coarse city results to the counter; the backend can also try edge metadata/IPWhois as a fallback. The application does not store or publish raw IPs, collect GPS data, or create persistent visitor profiles. It saves only city totals and coordinates rounded to 0.1 degrees. A random event receipt prevents duplicate requests for 24 hours; browser session storage limits counting to once per tab per 30 minutes. Do Not Track and Global Privacy Control suppress counting. The hosting providers may still process ordinary connection logs. Earlier count-only visits remain without a known location. VPNs, lookup errors, and provider limits may affect city accuracy and coverage. These anonymous statistics are not protected against forged submissions.

The map uses TianDiTu's original vector basemap, boundaries, and attribution. Because its legacy English annotation service is unavailable, local English country and ocean names are overlaid using Leaflet. General labels prioritize larger countries and avoid overlap as the map moves or zooms. Warm-colored circles represent approximate visitor city aggregates; popups show city and visit count. The list shows the eight most visited cities, and the map displays up to 200 city aggregates. It does not include general street or city labels beyond visitor markers.

`assets/js/visitor-config.js` contains the public browser map key, intended to be restricted to this GitHub Pages domain in the provider console. It contains no server credential. Local previews never submit visits. Leaflet is vendored locally; see its bundled license and [asset sources](ASSET_SOURCES.md).

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
