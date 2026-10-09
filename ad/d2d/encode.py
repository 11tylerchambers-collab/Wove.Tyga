"""Sequence build/shot_XX.png (42 unique shots) into the reel with the reference ad's exact cut timing.

Measured from the reference (60fps screen recording, cuts land on even frames,
so the source ad is 30fps): 30 cuts of 3 frames (0.1s), then a slowdown of
5,6,6,6,8,9,9,10,12,12,17,20 frames. 42 segments, each a different photo,
7.0s total, ending on the longest hold so it loops cleanly.
"""
import os
import subprocess
from pathlib import Path

HERE = Path(__file__).parent
FPS = 30
SEGMENTS = [3] * 30 + [5, 6, 6, 6, 8, 9, 9, 10, 12, 12, 17, 20]
SHOTS = 42

seq = HERE / "build" / "seq"
seq.mkdir(parents=True, exist_ok=True)
for f in seq.iterdir():
    f.unlink()
n = 0
for i, frames in enumerate(SEGMENTS):
    src = HERE / "build" / f"shot_{i % SHOTS:02d}.png"
    for _ in range(frames):
        os.symlink(src, seq / f"f_{n:04d}.png")
        n += 1

out = HERE / "out"
out.mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", str(seq / "f_%04d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
                "-movflags", "+faststart", str(out / "wove-d2d.mp4")], check=True)
print(f"wrote out/wove-d2d.mp4: {n} frames, {n / FPS:.2f}s")
