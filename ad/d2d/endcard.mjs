// End-card type + reveal. Renders one white-on-transparent mask per frame
// (build/text_XXX.png); compose.py prints each onto the held last photo with
// the same ink treatment as the logo.
//
// Type:
//   "wove"  Fraunces italic, SOFT 100 / WONK 1: soft, rounded, flowing letters
//           that echo the logo's woven ribbon and its round stroke ends.
//   slogan  Bricolage Grotesque 600: a characterful but clean grotesk.
// Reveal (punchy, no fades):
//   "wove"  letters rise from behind a hard baseline mask, staggered, expo-out.
//   slogan  words punch in one by one every 0.1s, the reel's own cut rhythm.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const fonts = path.join(here, '../assets/fonts');

export const FPS = 30, SECONDS = 2.5;
const W = 1080, H = 1920;
const cy = 0.449 * H;   // logo centre, same as layers.mjs
const MAX_LINE = 440;   // keep the slogan on the door panel

const html = `<!doctype html><html><head><style>
@font-face{font-family:Fra;src:url(file://${fonts}/Fraunces-italic.woff2);font-style:italic;font-weight:100 900}
@font-face{font-family:Bri;src:url(file://${fonts}/BricolageGrotesque-normal.woff2);font-weight:200 800}
*{margin:0;padding:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:transparent;color:#fff}
.row{position:absolute;left:0;right:0;text-align:center;white-space:nowrap}
#word{top:${cy + 96}px;font:italic 600 168px/1.12 Fra;letter-spacing:-.03em;
  font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144}
#line{top:${cy + 352}px;font:600 50px/1.18 Bri;letter-spacing:-.03em;font-variation-settings:'opsz' 48}
/* each unit is clipped only at its bottom edge, so it rises out of a hard line */
.m{display:inline-block;clip-path:inset(-40% -40% 0 -40%);padding-bottom:.14em;vertical-align:top}
.m>span{display:inline-block;will-change:transform}
</style></head><body>
<div class="row" id="word">${[...'wove'].map(c => `<span class="m"><span>${c}</span></span>`).join('')}</div>
<div class="row" id="line">${['Every door coached.', 'Every deal verified.'].map(l =>
  l.split(' ').map(w => `<span class="m"><span>${w}</span></span>`).join('<span class="sp"> </span>')).join('<br>')}</div>
<script>
  const expo = x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(x, 0));
  const letters = [...document.querySelectorAll('#word .m>span')];
  const words = [...document.querySelectorAll('#line .m>span')];
  window.fit = (max) => {
    const line = document.getElementById('line');
    const widest = () => Math.max(...[...line.childNodes].reduce((rows, n) => {
      if (n.nodeName === 'BR') rows.push([]); else rows[rows.length - 1].push(n); return rows; }, [[]])
      .map(r => r.reduce((w, n) => w + (n.getBoundingClientRect ? n.getBoundingClientRect().width : 0), 0)));
    let size = 50;
    while (widest() > max && size > 30) line.style.fontSize = (--size) + 'px';
  };
  window.at = t => {
    letters.forEach((el, i) => {            // "wove": staggered rise, 0.45s each
      const k = expo((t - (0.08 + i * 0.07)) / 0.45);
      el.style.transform = 'translateY(' + (1 - k) * 140 + '%)';
      el.style.filter = 'blur(' + ((1 - k) * 7).toFixed(2) + 'px)';   // motion blur while moving
    });
    words.forEach((el, i) => {              // slogan: a word every 0.1s
      const k = expo((t - (0.62 + i * 0.1)) / 0.3);
      el.style.transform = 'translateY(' + (1 - k) * 140 + '%)';
      el.style.filter = 'blur(' + ((1 - k) * 4).toFixed(2) + 'px)';
    });
  };
</script></body></html>`;

for (const f of readdirSync(out)) if (/^text_\d+\.png$/.test(f)) unlinkSync(path.join(out, f));
const tmp = path.join(out, '_text.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: W, height: H } });
await p.goto('file://' + tmp);
await p.evaluate(() => document.fonts.ready);
await p.evaluate(m => window.fit(m), MAX_LINE);
const n = Math.round(FPS * SECONDS);
for (let f = 0; f < n; f++) {
  await p.evaluate(t => window.at(t), f / FPS);
  await p.screenshot({ path: path.join(out, `text_${String(f).padStart(3, '0')}.png`), omitBackground: true });
}
await browser.close();
console.log(`end-card type: ${n} frames -> build/text_XXX.png`);
