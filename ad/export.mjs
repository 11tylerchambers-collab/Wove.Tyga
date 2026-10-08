// Render wove-ad.html frame-by-frame and encode an MP4 (1080x1920, 30fps).
// Usage: node export.mjs [--stills]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const stills = process.argv.includes('--stills');
mkdirSync(path.join(here, 'out'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + path.join(here, 'wove-ad.html') + '?export');
await page.evaluate(() => document.fonts.ready);
const total = await page.evaluate(() => window.AD_DURATION);

if (stills) {
  const starts = await page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => +s.dataset.dur));
  let t = 0, i = 0;
  for (const d of starts) {
    await page.evaluate((x) => window.renderAt(x), t + d * (i === starts.length - 1 ? 0.9 : 0.5));
    await page.screenshot({ path: path.join(here, 'out', `still_${String(i).padStart(2, '0')}.png`) });
    t += d; i++;
  }
  console.log('stills written');
} else {
  const out = path.join(here, 'out', 'wove-ad.mp4');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((x) => window.renderAt(x), f / FPS + 0.0001);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out} (${frames} frames, ${total.toFixed(2)}s)`);
}
await browser.close();
