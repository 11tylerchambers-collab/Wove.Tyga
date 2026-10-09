// End card: the logo stays locked where it sat all reel, then "wove" and the
// slogan (gowove.com's headline) rise in underneath. Renders build/end_XXX.png.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const D = readFileSync(path.join(here, '../assets/mark-path.txt'), 'utf8').trim();
const font = 'file://' + path.join(here, '../assets/schibsted-grotesk.woff2');

export const FPS = 30, SECONDS = 2.5;
const W = 1080, H = 1920;
const box = (0.357 * W) / (162 / 200), cx = W / 2, cy = 0.449 * H; // same as layers.mjs

const html = `<!doctype html><html><head><style>
@font-face{font-family:S;src:url(${font}) format("woff2");font-weight:400 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:S,sans-serif;color:#fff;
  background:
    radial-gradient(1300px 1200px at 0% 0%, #1F3954, rgba(5,7,10,0) 60%),
    radial-gradient(1300px 1300px at 100% 100%, #A3591A, #6B3A10 22%, rgba(5,7,10,0) 62%),
    #05070A}
svg{position:absolute;left:${cx - box / 2}px;top:${cy - box / 2}px;width:${box}px;height:${box}px}
.t{position:absolute;left:0;right:0;text-align:center}
#word{top:${cy + 150}px;font-size:150px;font-weight:650;letter-spacing:-.04em;line-height:1}
#line{top:${cy + 340}px;font-size:46px;font-weight:500;letter-spacing:-.01em;line-height:1.25;color:rgba(247,243,242,.82)}
</style></head><body>
<svg viewBox="0 0 200 200"><path d="${D}" fill="#fff"/></svg>
<div class="t" id="word">wove</div>
<div class="t" id="line">Every door coached.<br>Every deal verified.</div>
<script>
  const ease = x => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
  window.at = t => {
    for (const [id, start] of [['word', .12], ['line', .32]]) {
      const k = ease((t - start) / .4), el = document.getElementById(id);
      el.style.opacity = k; el.style.transform = 'translateY(' + (1 - k) * 36 + 'px)';
    }
  };
</script></body></html>`;

const tmp = path.join(out, '_end.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: W, height: H } });
await p.goto('file://' + tmp);
await p.evaluate(() => document.fonts.ready);
const n = Math.round(FPS * SECONDS);
for (let f = 0; f < n; f++) {
  await p.evaluate(t => window.at(t), f / FPS);
  await p.screenshot({ path: path.join(out, `end_${String(f).padStart(3, '0')}.png`) });
}
await browser.close();
console.log(`end card: ${n} frames`);
