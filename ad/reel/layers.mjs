// Renders the vector layers (logo masks, wall paint masks, app-icon frames)
// to 1080x1920 PNGs in build/. compose.py turns them + the photos into frames.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const D = readFileSync(path.join(here, '../assets/mark-path.txt'), 'utf8').trim();
const font = 'file://' + path.join(here, '../assets/schibsted-grotesk.woff2');

// The logo is locked here in every shot (same spot as the reference ad).
const MARK = { left: 310, top: 630, size: 460 };
const mk = (style, fill = '#fff') =>
  `<svg viewBox="0 0 200 200" style="position:absolute;${style}"><path d="${D}" fill="${fill}"/></svg>`;

const page = (body, bg = 'transparent') => `<!doctype html><html><head><style>
@font-face{font-family:S;src:url(${font}) format("woff2");font-weight:400 900}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:${bg};font-family:S,sans-serif}
</style></head><body>${body}</body></html>`;

const layers = {
  // fixed centre logo, white on transparent = alpha mask
  mark: page(mk(`left:${MARK.left}px;top:${MARK.top}px;width:${MARK.size}px;height:${MARK.size}px`)),

  // wall signage: giant cropped mark whose diagonal arm runs under the logo
  wall_giant: page(mk('left:-324px;top:-724px;width:3600px;height:3600px')),
  wall_type: page(
    mk('left:70px;top:140px;width:150px;height:150px') +
    `<div style="position:absolute;left:20px;top:800px;width:600px;color:#fff;font-size:66px;font-weight:600;
      letter-spacing:-.03em;line-height:1.02;transform:rotate(-42deg);transform-origin:0 0">every door,<br>on the record</div>`),

  // app icons on a home screen, like the reference's last pair
  icon_white: page(icons('light'), '#E9E9EC'),
  icon_black: page(icons('dark'), '#0A0A0C'),
};

function icons(mode) {
  const light = mode === 'light';
  const size = 480, r = 108, y = MARK.top + MARK.size / 2 - size / 2, gap = 84;
  const tile = (x, bg, inner = '') =>
    `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:${r}px;
      background:${bg};overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,${light ? .12 : .5})">${inner}</div>`;
  const center = 540 - size / 2;
  const left = center - size - gap, right = center + size + gap;
  const wove = light
    ? tile(center, 'linear-gradient(180deg,#FFFFFF,#F4F1F0)')
    : tile(center, `radial-gradient(560px 560px at 0% 0%,#1F3954,rgba(5,7,10,0) 55%),
        radial-gradient(620px 620px at 100% 100%,#A3591A,#6B3A10 22%,rgba(5,7,10,0) 62%),#05070A`);
  const neighbourL = light
    ? tile(left, 'linear-gradient(180deg,#EEF3FA,#C9D6E8)', `<div style="position:absolute;right:70px;top:150px;width:210px;height:160px;border-radius:80px;border:26px solid #9FB0C8"></div>`)
    : tile(left, 'linear-gradient(180deg,#3a3026,#1d1712)', `<div style="position:absolute;right:80px;top:120px;width:200px;height:240px;border-radius:30px;background:#5a4a3a"></div>`);
  const gear = `radial-gradient(circle,#8d9097 0 18%,#c9ccd2 19% 30%,#6f7279 31% 33%,#d7dae0 34% 46%,#7d8087 47% 49%,#bfc2c8 50%)`;
  const neighbourR = tile(right, light ? gear : gear.replace(/#c9ccd2|#d7dae0|#bfc2c8/g, '#6a6d73'));
  return neighbourL + wove + neighbourR +
    mk(`left:${MARK.left}px;top:${MARK.top}px;width:${MARK.size}px;height:${MARK.size}px`, light ? '#0E0E12' : '#FFFFFF');
}

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, html] of Object.entries(layers)) {
  const tmp = path.join(out, `_${name}.html`);
  writeFileSync(tmp, html);
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(out, name + '.png'), omitBackground: !name.startsWith('icon') });
}
await browser.close();
console.log('layers ->', out);
