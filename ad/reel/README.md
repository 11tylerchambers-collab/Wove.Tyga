# Wove reel (real photos, reference timing)

7.0s, 1080×1920, 30fps loop. The Wove mark stays locked in the centre while
14 real product shots cut underneath it, in pairs (amber/violet, black/white),
with the exact cut rhythm measured from the reference ad:
30 cuts at 0.1s, then holds of 0.167, 0.2, 0.2, 0.2, 0.267, 0.3, 0.3, 0.333,
0.4, 0.4, 0.567, 0.667s.

```
node layers.mjs       # logo / wall-paint masks + app-icon frames -> build/
python3 compose.py    # photos + logo "printed" into each -> build/shot_XX.png  (--sheet for a contact sheet)
python3 encode.py     # -> out/wove-reel.mp4
```

Shot list, crop and ink colour live in `SHOTS` in `compose.py`.

## Photo credits

All photos are from Pexels (free for commercial use, modification allowed, no
attribution required). People are cropped so no faces appear.

| Shot | Pexels photo |
|---|---|
| Painted wall | https://www.pexels.com/photo/white-shabby-concrete-wall-with-cracked-stucco-3968175/ |
| Black tote | https://www.pexels.com/photo/black-tote-bag-1214212/ |
| White tote | https://www.pexels.com/photo/a-person-holding-a-tote-bag-6787035/ |
| Business cards | https://www.pexels.com/photo/stacks-of-blank-white-visiting-cards-on-table-4466176/ |
| Black tee | https://www.pexels.com/photo/man-person-clothes-black-9558233/ |
| White tee | https://www.pexels.com/photo/man-in-white-crew-neck-t-shirt-wearing-black-and-brown-fedora-hat-9558254/ |
| Box | https://www.pexels.com/photo/white-cardboard-box-on-white-surface-12039676/ |
| Black door | https://www.pexels.com/photo/front-exterior-of-a-family-home-8031873/ |
| White door | https://www.pexels.com/photo/white-door-and-window-in-entrance-to-mansion-16313240/ |
