"""Composite the Wove logo onto real photos -> build/shot_XX.png (1080x1920).

Each shot crops a photo so the printable surface sits under the locked logo
position, optionally recolours that surface (amber / violet pairs), then
"prints" the logo using the photo's own light and texture so it reads as
ink on the object rather than a sticker on top.

Run layers.mjs first.  python3 compose.py [--sheet]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
PHOTOS, BUILD = HERE / "photos", HERE / "build"
W, H, MX, MY = 1080, 1920, 540, 860  # frame size and locked logo centre

INK = (0x0E, 0x0E, 0x12)
WHITE = (255, 255, 255)
AMBER = (0xE3, 0x9A, 0x62)
VIOLET = (0x98, 0x73, 0xD9)

# photo id, logo centre (fraction of photo w/h), crop width (fraction of photo w)
SHOTS = [
    dict(name="wall-amber", photo=3968175, at=(.50, .50), cw=.33, paint=AMBER, ink=WHITE),
    dict(name="wall-violet", photo=3968175, at=(.50, .50), cw=.33, paint=VIOLET, ink=INK),
    dict(name="tote-black", photo=1214212, at=(.408, .667), cw=.333, ink=WHITE, bright=.88),
    dict(name="tote-white", photo=6787035, at=(.596, .63), cw=.21, ink=INK),
    dict(name="cards-amber", photo=4466176, at=(.50, .372), cw=.69, tint=AMBER, ink=WHITE, bright=.97),
    dict(name="cards-violet", photo=4466176, at=(.50, .372), cw=.69, tint=VIOLET, ink=INK),
    dict(name="tee-black", photo=9558233, at=(.458, .653), cw=.31, ink=WHITE, bright=.90),
    dict(name="tee-white", photo=9558254, at=(.333, .75), cw=.31, ink=INK),
    dict(name="box-amber", photo=12039676, at=(.504, .494), cw=.45, rect=(.198, .2295, .796, .7625), tint=AMBER, ink=WHITE, bright=.97),
    dict(name="box-violet", photo=12039676, at=(.504, .494), cw=.45, rect=(.198, .2295, .796, .7625), tint=VIOLET, ink=INK),
    dict(name="door-black", photo=8031873, at=(.783, .513), cw=.225, ink=WHITE, bright=.88),
    dict(name="door-white", photo=16313240, at=(.319, .39), cw=.30, ink=INK),
    dict(name="icon-white", frame="icon_white"),
    dict(name="icon-black", frame="icon_black"),
]


def lum(a):
    return a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def crop(photo, at, cw):
    im = Image.open(PHOTOS / f"{photo}.jpg").convert("RGB")
    pw, ph = im.size
    s = W / (cw * pw)  # output px per photo px
    x0, y0 = at[0] * pw - MX / s, at[1] * ph - MY / s
    x1, y1 = x0 + W / s, y0 + H / s
    xf = (x0, y0, s, pw, ph)
    if x0 < 0 or y0 < 0 or x1 > pw or y1 > ph:
        print(f"  ! crop for {photo} leaves the photo ({x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f} of {pw}x{ph}); mirroring edges")
        pad = int(max(0, -x0, -y0, x1 - pw, y1 - ph)) + 2
        im = Image.fromarray(np.pad(np.asarray(im), ((pad, pad), (pad, pad), (0, 0)), mode="reflect"))
        x0, y0, x1, y1 = x0 + pad, y0 + pad, x1 + pad, y1 + pad
    out = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x1, y1))
    return np.asarray(out, dtype=np.float32) / 255, xf


def card_mask(img):
    """Card stock is cool/neutral, the plywood is warm: split on blue - red."""
    m = smoothstep(-.035, -.005, img[..., 2] - img[..., 0]) * smoothstep(.45, .6, img.min(axis=2))
    return blur(m, 1.5)


def rect_mask(xf, rect):
    """Rectangle given as fractions of the photo, mapped into the crop."""
    x0, y0, s, pw, ph = xf
    l, t, r, b = ((rect[0] * pw - x0) * s, (rect[1] * ph - y0) * s, (rect[2] * pw - x0) * s, (rect[3] * ph - y0) * s)
    yy, xx = np.mgrid[0:H, 0:W]
    m = ((xx >= l) & (xx <= r) & (yy >= t) & (yy <= b)).astype(np.float32)
    return blur(m, 1.2)


def recolour(img, mask, colour):
    c = np.array(colour, np.float32) / 255
    L = lum(img)
    ref = np.percentile(L[mask > .5], 95) if (mask > .5).any() else 1
    shade = np.clip(L / ref, 0, 1.06)[..., None]
    return img * (1 - mask[..., None]) + c * shade * mask[..., None]


def paint(img, alpha, colour, bright=1.0, opacity=.97):
    """Lay ink/paint into the surface: keeps the photo's folds, grain and light."""
    c = np.array(colour, np.float32) / 255
    L = lum(img)
    Lb = blur(L, 28)
    shading = np.clip(L / np.maximum(Lb, 1e-3), .6, 1.35)
    if c.mean() > .5:  # light ink on a dark surface: dark fabric is noisy, keep only soft texture
        soft = np.clip(blur(L, 1.2) / np.maximum(Lb, 1e-3), .8, 1.2)
        ink = c * bright * soft[..., None] ** .35
    else:  # dark ink on a light surface
        ink = c * (.7 + .3 * shading[..., None])
    a = (blur(alpha, .8) * opacity)[..., None]
    return img * (1 - a) + ink * a


def layer(name):
    return np.asarray(Image.open(BUILD / f"{name}.png").convert("RGBA"), dtype=np.float32)[..., 3] / 255


def render(shot):
    if "frame" in shot:
        return np.asarray(Image.open(BUILD / f"{shot['frame']}.png").convert("RGB"), dtype=np.float32) / 255
    img, xf = crop(shot["photo"], shot["at"], shot["cw"])
    if "tint" in shot:
        mask = rect_mask(xf, shot["rect"]) if "rect" in shot else card_mask(img)
        img = recolour(img, mask, shot["tint"])
    if "paint" in shot:
        img = paint(img, layer("wall_giant"), shot["paint"], opacity=.96)
        img = paint(img, layer("wall_type"), INK)
    return paint(img, layer("mark"), shot["ink"], shot.get("bright", 1.0))


def main():
    for i, shot in enumerate(SHOTS):
        print(f"shot {i:02d} {shot['name']}")
        out = np.clip(render(shot) * 255 + .5, 0, 255).astype(np.uint8)
        Image.fromarray(out).save(BUILD / f"shot_{i:02d}.png")
    if "--sheet" in sys.argv:
        thumbs = [Image.open(BUILD / f"shot_{i:02d}.png").resize((216, 384)) for i in range(len(SHOTS))]
        sheet = Image.new("RGB", (216 * 7, 384 * 2))
        for i, t in enumerate(thumbs):
            sheet.paste(t, ((i % 7) * 216, (i // 7) * 384))
        sheet.save(BUILD / "sheet.png")


if __name__ == "__main__":
    main()
