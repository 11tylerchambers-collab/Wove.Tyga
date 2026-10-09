"""Composite the locked Wove mark over 42 real door-to-door / San Diego / Utah photos.

Every segment of the reel gets its own photo (no repeats). Each photo is
cover-cropped to 9:16 so a chosen focus point lands under the logo; the logo
ink (white or Wove ink) is picked from the local brightness so it always reads.
"print" shots (doors, walls) take on the surface's texture and light;
"flat" shots (skies, aerials) get a clean overlay like the reference.

It also builds the end card: the reel holds on the last photo while "wove" and
the slogan fade in, printed into the door exactly like the logo.

Run layers.mjs and endcard.mjs first.  python3 compose.py [--sheet]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
PHOTOS, BUILD = HERE / "photos", HERE / "build"
W, H = 1080, 1920
MX, MY = 540, round(0.449 * H)  # locked logo centre

INK = np.array((0x0E, 0x0E, 0x12), np.float32) / 255
WHITE = np.ones(3, np.float32)

# Order = order on screen. The first 30 flash at 0.1s; the last 12 slow down
# and the final one holds longest, so the strongest shots sit at the end.
# focus: point in the photo (fractions) that lands under the logo
# zoom:  crop width as a fraction of the widest 9:16 crop the photo allows
SHOTS = [
    dict(id=15945544, place="door", mode="print"),
    dict(id=16427010, place="solar"),
    dict(id=8550100, place="doorbell", focus=(.6, .28), zoom=.6),
    dict(id=29478676, place="Oceanside, CA"),
    dict(id=15519060, place="door", mode="print"),
    dict(id=5972941, place="Salt Lake City, UT"),
    dict(id=5066421, place="door", mode="print"),
    dict(id=6035315, place="house"),
    dict(id=36648662, place="San Diego Bay, CA"),
    dict(id=2564866, place="door", mode="print"),
    dict(id=5587962, place="Spanish Fork, UT"),
    dict(id=7898588, place="mailbox", mode="print", focus=(.5, .61), zoom=.65),
    dict(id=12331583, place="Coronado Bridge, CA"),
    dict(id=38031872, place="house number", mode="print", focus=(.5, .68), zoom=.7),
    dict(id=16749859, place="suburb"),
    dict(id=35525173, place="door", mode="print"),
    dict(id=20154999, place="San Diego coast, CA"),
    dict(id=31989061, place="keys", focus=(.62, .62)),
    dict(id=12551303, place="house"),
    dict(id=40008127, place="suburb at dusk"),
    dict(id=17196117, place="door", mode="print", ink="ink"),
    dict(id=14243688, place="South Jordan, UT"),
    dict(id=101808, place="key in door", focus=(.27, .3)),
    dict(id=37640700, place="La Jolla, CA"),
    dict(id=6900686, place="house number", mode="print", focus=(.51, .75), zoom=.6),
    dict(id=12243093, place="solar"),
    dict(id=36350577, place="Park City, UT"),
    dict(id=14463446, place="door", mode="print", ink="ink"),
    dict(id=7706400, place="door knob", focus=(.62, .25), zoom=.55),
    dict(id=5785100, place="house"),
    # slowdown
    dict(id=18558685, place="Sunset Cliffs, San Diego"),
    dict(id=38629967, place="door", mode="print"),
    dict(id=15048771, place="suburb"),
    dict(id=20831616, place="door", mode="print"),
    dict(id=36091793, place="Oceanside, CA"),
    dict(id=9461272, place="doorbell"),
    dict(id=39731276, place="Utah suburb"),
    dict(id=17890099, place="solar"),
    dict(id=7710011, place="house"),
    dict(id=34345018, place="red rock, UT"),
    dict(id=18456676, place="door", mode="print"),
    dict(id=34352084, place="door", mode="print", focus=(.529, .5)),  # final, longest hold + end card (door centred)
]


def lum(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def crop(shot):
    im = Image.open(PHOTOS / f"{shot['id']}.jpg").convert("RGB")
    pw, ph = im.size
    fx, fy = shot.get("focus", (.5, .5))
    cw = min(pw, ph * W / H) * shot.get("zoom", 1.0)
    ch = cw * H / W
    s = W / cw
    x0 = min(max(fx * pw - MX / s, 0), pw - cw)  # clamp: never pad, nudge instead
    y0 = min(max(fy * ph - MY / s, 0), ph - ch)
    out = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    return np.asarray(out, dtype=np.float32) / 255


def put_mark(img, alpha, mode, ink=None):
    L = lum(img)
    area = blur(alpha, 25) > .05
    if ink is None:
        ink = INK if L[area].mean() > .55 else WHITE
    else:
        ink = INK if ink == "ink" else WHITE
    if mode == "print":  # ink sits in the surface: keep its texture and light
        Lb = blur(L, 28)
        shade = np.clip(blur(L, 1.2) / np.maximum(Lb, 1e-3), .8, 1.2) ** .35
        light = np.clip(Lb / max(np.percentile(Lb, 90), 1e-3), .92, 1.0) if ink.mean() > .5 else 1
        col = ink * (shade * light)[..., None] if ink.mean() > .5 else ink * (.75 + .25 * shade[..., None])
        a = blur(alpha, .8)[..., None] * .97
    else:
        col = ink
        a = alpha[..., None]
    return img * (1 - a) + col * a


def mask(name):
    return np.asarray(Image.open(BUILD / f"{name}.png").convert("RGBA"), dtype=np.float32)[..., 3] / 255


def end_card(alpha, fps=30, seconds=2.5):
    """Hold the last shot; fade "wove" then the slogan in from nothing, same ink as the logo."""
    last = SHOTS[-1]
    base = crop(last)
    word, line = mask("text_word"), mask("text_line")
    for f in BUILD.glob("end_*.png"):
        f.unlink()
    ease = lambda x: (lambda c: c * c * (3 - 2 * c))(min(max(x, 0.0), 1.0))
    for f in range(round(fps * seconds)):
        t = f / fps
        a = np.maximum(alpha, np.maximum(word * ease((t - .15) / .7), line * ease((t - .55) / .7)))
        img = put_mark(base, a, last.get("mode", "flat"), last.get("ink", "white"))
        Image.fromarray(np.clip(img * 255 + .5, 0, 255).astype(np.uint8)).save(BUILD / f"end_{f:03d}.png")
    print(f"end card: {round(fps * seconds)} frames -> build/")


def main():
    alpha = mask("mark")
    ids = [s["id"] for s in SHOTS]
    assert len(ids) == 42 and len(set(ids)) == 42, "need 42 different photos"
    for i, shot in enumerate(SHOTS):
        img = put_mark(crop(shot), alpha, shot.get("mode", "flat"), shot.get("ink"))
        Image.fromarray(np.clip(img * 255 + .5, 0, 255).astype(np.uint8)).save(BUILD / f"shot_{i:02d}.png")
    print(f"{len(SHOTS)} shots -> build/")
    end_card(alpha)
    if "--sheet" in sys.argv:
        tw, th = 180, 320
        sheet = Image.new("RGB", (tw * 7, th * 6))
        for i in range(len(SHOTS)):
            t = Image.open(BUILD / f"shot_{i:02d}.png").resize((tw, th))
            sheet.paste(t, ((i % 7) * tw, (i // 7) * th))
        sheet.save(BUILD / "sheet.png")


if __name__ == "__main__":
    main()
