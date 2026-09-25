"""Makes the two background botanicals from public-domain plates on Wikimedia Commons:

  rose      Pierre-Joseph Redouté, "Rosa centifolia anglica rubra (Rosier de Cumberland)", Les Roses, 1817-1824
  lavender  Otto Wilhelm Thomé, "Lavandula angustifolia", Flora von Deutschland, Österreich und der Schweiz, 1885

Only the flowering tops are kept (the rose bloom with its buds, the lavender spikes). Each is lifted off its paper
(the paper colour is estimated locally, since the plates are stained unevenly), redrawn as a fine pencil line by a
colour-dodge sketch, inked in the site's old gold with a trace of the plate's own colour, and dissolved toward the
bottom so it has no hard edge. The result is faint on purpose: it must never compete with text.
Writes site/img/botanical/<name>.webp and a mirrored <name>-rtl.webp for the Arabic page. Run: python tools/botanicals.py. Needs Pillow and numpy.
"""
import io, os, urllib.request
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "img", "botanical")
UA = {"User-Agent": "DrydownProfiler/1.0 (botanical backgrounds)"}
THUMB = "https://thumb.wikimedia.org/wikipedia/commons/thumb/{0}/1280px-{1}"

PLATES = {
    # name: (Commons path, crop box as fractions of the plate, paper threshold low/high, height in px, strength)
    "rose": ("2/28/Rosa_Centifolia_Anglica_rubra_%28Rosier_de_Cumberland%29_-_Redout%C3%A9%2C_Pierre-Joseph_-_btv1b10568049b.jpg",
             (.22, .07, .97, .50), (16, 60), 520, .5),
    "lavender": ("f/f6/Illustration_Lavandula_angustifolia0.jpg",
                 (.40, .015, .99, .46), (20, 70), 520, .5),
}

def fetch(path):
    name = path.rsplit("/", 1)[1]
    with urllib.request.urlopen(urllib.request.Request(THUMB.format(path, name), headers=UA), timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")

def lift(im, box, lo, hi, rounds=2):
    W, H = im.size
    im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    a = np.asarray(im).astype(np.float32)
    edge = np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3), a[:, :20].reshape(-1, 3), a[:, -20:].reshape(-1, 3)])
    paper = np.broadcast_to(np.median(edge, axis=0), a.shape).copy()
    for _ in range(rounds):                                   # re-estimate the paper with the plant filled in
        plant = np.sqrt(((a - paper) ** 2).sum(axis=2)) > lo
        fill = np.where(plant[..., None], paper, a)
        paper = np.asarray(Image.fromarray(fill.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))).astype(np.float32)
    d = np.sqrt(((a - paper) ** 2).sum(axis=2))
    alpha = np.clip((d - lo) / (hi - lo), 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))).astype(np.float32) / 255
    return a, alpha

def sketch(a, alpha, strength, blur=5, ink=(140, 95, 0), keep=.18, dissolve=.42):
    """Colour-dodge pencil sketch of the plant, inked in old gold, fading out over the bottom `dissolve` share."""
    gray = a @ np.array([.299, .587, .114], np.float32)
    inv = np.asarray(Image.fromarray((255 - gray).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))).astype(np.float32)
    dodge = np.clip(gray * 255 / np.maximum(1, 255 - inv), 0, 255)
    line = np.clip((1 - dodge / 255) ** .9 * 1.6, 0, 1)
    h = a.shape[0]
    fall = np.clip((1 - np.linspace(0, 1, h)) / dissolve, 0, 1) ** 1.4          # 1 at the top, 0 at the bottom edge
    al = line * np.clip(alpha * 1.4, 0, 1) * strength * fall[:, None]
    g = a.mean(axis=2, keepdims=True)
    rgb = np.array(ink, np.float32) * (1 - keep) + (g + (a - g) * .5) * keep
    return Image.fromarray(np.dstack([rgb, al[..., None] * 255]).clip(0, 255).astype(np.uint8), "RGBA")

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, (path, box, (lo, hi), height, strength) in PLATES.items():
        a, alpha = lift(fetch(path), box, lo, hi)
        im = sketch(a, alpha, strength)
        im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
        target = os.path.join(OUT, name + ".webp")
        im.save(target, "WEBP", quality=80, method=6)
        mirrored = os.path.join(OUT, name + "-rtl.webp")           # the Arabic page mirrors the composition
        im.transpose(Image.FLIP_LEFT_RIGHT).save(mirrored, "WEBP", quality=80, method=6)
        print(name, im.size, os.path.getsize(target), "bytes, plus a mirrored copy")
