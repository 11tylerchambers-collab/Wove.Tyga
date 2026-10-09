// End-card type, set the way gowove.com sets it (Schibsted Grotesk):
//   "wove"   = the site's nav wordmark: weight 650, tracking -0.0366em
//   slogan   = the site's hero h1 ("Every door coached. Every deal verified."):
//              weight 700, tracking -0.045em, line-height 1
// Renders white-on-transparent masks build/text_word.png and build/text_line.png;
// compose.py prints them onto the last photo like the logo and fades them in.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const font = 'file://' + path.join(here, '../assets/schibsted-grotesk.woff2');

const W = 1080, H = 1920;
const cy = 0.449 * H;   // logo centre, same as layers.mjs
const MAX_LINE = 440;   // keep the slogan on the door panel

const html = (id) => `<!doctype html><html><head><style>
@font-face{font-family:S;src:url(${font}) format("woff2");font-weight:400 900}
*{margin:0;padding:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:transparent;color:#fff;font-family:S,sans-serif}
.t{position:absolute;left:0;right:0;text-align:center;visibility:hidden}
#word{top:${cy + 120}px;font-size:132px;font-weight:650;letter-spacing:-.0366em;line-height:1}
#line{top:${cy + 360}px;font-size:56px;font-weight:700;letter-spacing:-.045em;line-height:1}
#line span{display:inline-block}
#${id}{visibility:visible}
</style></head><body>
<div class="t" id="word">wove</div>
<div class="t" id="line"><span>Every door coached.</span><br><span>Every deal verified.</span></div>
</body></html>`;

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: W, height: H } });
for (const id of ['word', 'line']) {
  const tmp = path.join(out, `_text_${id}.html`);
  writeFileSync(tmp, html(id));
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  if (id === 'line') {
    // shrink until the longest line fits the door
    await p.evaluate((max) => {
      const el = document.getElementById('line');
      const widest = () => Math.max(...[...el.querySelectorAll('span')].map(s => s.getBoundingClientRect().width));
      let size = 56;
      while (widest() > max && size > 30) el.style.fontSize = (--size) + 'px';
    }, MAX_LINE);
  }
  await p.screenshot({ path: path.join(out, `text_${id}.png`), omitBackground: true });
}
await browser.close();
console.log('end-card type -> build/text_word.png, build/text_line.png');
