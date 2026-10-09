// Renders the locked logo mask (white on transparent, 1080x1920) to build/mark.png.
// Size and position are measured from the reference ad: the mark spans 35.7% of
// the frame width and its centre sits 44.9% down the frame.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'build');
mkdirSync(out, { recursive: true });
const D = readFileSync(path.join(here, '../assets/mark-path.txt'), 'utf8').trim();

const W = 1080, H = 1920;
const markWidth = 0.357 * W;           // visible mark width
const box = markWidth / (162 / 200);   // the mark fills 162 of its 200-unit viewBox
const cx = W / 2, cy = 0.449 * H;

const html = `<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;background:transparent">
<svg viewBox="0 0 200 200" style="position:absolute;left:${cx - box / 2}px;top:${cy - box / 2}px;width:${box}px;height:${box}px">
<path d="${D}" fill="#fff"/></svg></body></html>`;

const tmp = path.join(out, '_mark.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: W, height: H } });
await p.goto('file://' + tmp);
await p.screenshot({ path: path.join(out, 'mark.png'), omitBackground: true });
await browser.close();
console.log(`mark: ${markWidth.toFixed(0)}px wide, centre (${cx}, ${cy.toFixed(0)})`);
