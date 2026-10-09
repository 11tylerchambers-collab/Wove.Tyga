// End card: the reel holds on its last photo (logo already printed on it) while
// "wove" and the slogan (gowove.com's headline) fade in from nothing underneath.
// Run after compose.py. Renders build/end_XXX.png.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const font = 'file://' + path.join(here, '../assets/schibsted-grotesk.woff2');
const last = 'file://' + path.join(out, 'shot_41.png'); // final photo of the sequence

export const FPS = 30, SECONDS = 2.5;
const W = 1080, H = 1920;
const cy = 0.449 * H; // logo centre, same as layers.mjs

const html = `<!doctype html><html><head><style>
@font-face{font-family:S;src:url(${font}) format("woff2");font-weight:400 900}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:S,sans-serif;color:#fff;
  background:url(${last}) 0 0 / ${W}px ${H}px no-repeat}
.t{position:absolute;left:0;right:0;text-align:center;opacity:0;text-shadow:0 2px 18px rgba(5,7,10,.35)}
#word{top:${cy + 128}px;font-size:124px;font-weight:650;letter-spacing:-.04em;line-height:1}
#line{top:${cy + 362}px;font-size:44px;font-weight:500;letter-spacing:-.01em;line-height:1.25}
</style></head><body>
<div class="t" id="word">wove</div>
<div class="t" id="line">Every door coached.<br>Every deal verified.</div>
<script>
  const ease = x => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
  window.at = t => {
    for (const [id, start] of [['word', .15], ['line', .55]]) {
      document.getElementById(id).style.opacity = ease((t - start) / .7);
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
