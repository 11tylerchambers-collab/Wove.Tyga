# Wove door-to-door reel

9.5s, 1080×1920, 30fps reel for door-to-door sales teams: a 7.0s photo
sequence, then a 2.5s end card with "wove" and the slogan "Every door coached.
Every deal verified." (the headline on gowove.com). 42 different real
photos (doors, doorbells, houses, solar, San Diego, Utah), mostly blue to match
Wove's palette with green, purple and warm accents. Nothing repeats.

Matched to the reference ad:
- **Cut timing**: 30 cuts at 0.1s, then holds of 0.167, 0.2, 0.2, 0.2, 0.267,
  0.3, 0.3, 0.333, 0.4, 0.4, 0.567, 0.667s (measured frame by frame).
- **Logo size**: the mark spans 35.7% of the frame width, centred 44.9% down,
  and stays that size the whole time (the reference logo does not scale).

```
./fetch-photos.sh     # downloads the 42 Pexels photos into photos/
node layers.mjs       # logo mask -> build/mark.png
python3 compose.py    # photos + logo -> build/shot_XX.png  (--sheet for a contact sheet)
node endcard.mjs      # "wove" + slogan end card -> build/end_XXX.png
python3 encode.py     # -> out/wove-d2d.mp4
```

Order, crop (`focus`, `zoom`) and logo treatment per shot live in `SHOTS` in
`compose.py`.

## Photos

All from Pexels (free for commercial use, modification allowed, no
attribution required).

| # | Shot | Pexels photo |
|---|---|---|
| 1 | door | https://www.pexels.com/photo/15945544/ |
| 2 | solar | https://www.pexels.com/photo/16427010/ |
| 3 | doorbell | https://www.pexels.com/photo/8550100/ |
| 4 | Oceanside, CA | https://www.pexels.com/photo/29478676/ |
| 5 | door | https://www.pexels.com/photo/15519060/ |
| 6 | Salt Lake City, UT | https://www.pexels.com/photo/5972941/ |
| 7 | door | https://www.pexels.com/photo/5066421/ |
| 8 | house | https://www.pexels.com/photo/6035315/ |
| 9 | San Diego Bay, CA | https://www.pexels.com/photo/36648662/ |
| 10 | door | https://www.pexels.com/photo/2564866/ |
| 11 | Spanish Fork, UT | https://www.pexels.com/photo/5587962/ |
| 12 | mailbox | https://www.pexels.com/photo/7898588/ |
| 13 | Coronado Bridge, CA | https://www.pexels.com/photo/12331583/ |
| 14 | house number | https://www.pexels.com/photo/38031872/ |
| 15 | suburb | https://www.pexels.com/photo/16749859/ |
| 16 | door | https://www.pexels.com/photo/35525173/ |
| 17 | San Diego coast, CA | https://www.pexels.com/photo/20154999/ |
| 18 | keys | https://www.pexels.com/photo/31989061/ |
| 19 | house | https://www.pexels.com/photo/12551303/ |
| 20 | suburb at dusk | https://www.pexels.com/photo/40008127/ |
| 21 | door | https://www.pexels.com/photo/17196117/ |
| 22 | South Jordan, UT | https://www.pexels.com/photo/14243688/ |
| 23 | key in door | https://www.pexels.com/photo/101808/ |
| 24 | La Jolla, CA | https://www.pexels.com/photo/37640700/ |
| 25 | house number | https://www.pexels.com/photo/6900686/ |
| 26 | solar | https://www.pexels.com/photo/12243093/ |
| 27 | Park City, UT | https://www.pexels.com/photo/36350577/ |
| 28 | door | https://www.pexels.com/photo/14463446/ |
| 29 | door knob | https://www.pexels.com/photo/7706400/ |
| 30 | house | https://www.pexels.com/photo/5785100/ |
| 31 | Sunset Cliffs, San Diego | https://www.pexels.com/photo/18558685/ |
| 32 | door | https://www.pexels.com/photo/38629967/ |
| 33 | suburb | https://www.pexels.com/photo/15048771/ |
| 34 | door | https://www.pexels.com/photo/20831616/ |
| 35 | Oceanside, CA | https://www.pexels.com/photo/36091793/ |
| 36 | doorbell | https://www.pexels.com/photo/9461272/ |
| 37 | Utah suburb | https://www.pexels.com/photo/39731276/ |
| 38 | solar | https://www.pexels.com/photo/17890099/ |
| 39 | house | https://www.pexels.com/photo/7710011/ |
| 40 | red rock, UT | https://www.pexels.com/photo/34345018/ |
| 41 | door | https://www.pexels.com/photo/18456676/ |
| 42 | door | https://www.pexels.com/photo/34352084/ |
