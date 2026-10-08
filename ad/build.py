"""Inline the Wove mark path into template.html -> wove-ad.html."""
from pathlib import Path
here = Path(__file__).parent
d = (here / "assets/mark-path.txt").read_text().strip()
(here / "wove-ad.html").write_text((here / "template.html").read_text().replace("__MARK_D__", d))
print("built wove-ad.html")
