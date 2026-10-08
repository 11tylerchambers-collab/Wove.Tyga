# Wove brand reel

9:16 vertical ad (1080×1920, ~9.5s): the Wove mark stays locked in the center while the background hard-cuts through scenes, ending on a "Book a demo" card.

- `template.html` – the ad (scenes, copy, timing). Each `<section class="scene">` has `data-dur` (seconds) and `data-mark` (logo colour).
- `build.py` – inlines the logo path (`assets/mark-path.txt`) → `wove-ad.html`. Open that in a browser to preview (click to pause).
- `export.mjs` – renders `out/wove-ad.mp4` with Playwright + ffmpeg. `--stills` writes one PNG per scene.

```
python3 ad/build.py && node ad/export.mjs
```
