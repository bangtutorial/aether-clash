"""Cek skala SEMUA gerakan terhadap idle lewat ukuran kepala/helm — dijalankan di gambar ASLI generator.

Kenapa kepala: pose aksi (serang, lompat, skill) mengubah tinggi & siluet (lutut ditekuk, lengan & senjata
terangkat), jadi tinggi/siluet tidak bisa menilai skala. Kepala/helm bentuknya tetap.
Kenapa di gambar asli: di atlas kepala hanya ~20 px (selisih 1 px = 5 %); di gambar asli ~6× lebih besar.
Kenapa tepi (edge), bukan warna: model menggambar tiap strip dengan pencahayaan berbeda → pencocokan warna
gagal; garis kontur helm tetap sama.

Pakai:
  python measure_head_scale.py <char_dir> --poses idle:4,walk:6,jump:4,attack1:4 \
      [--ref idle:0] [--head-box x0,y0,x1,y1] [--rel-json rel.json] [--target 0.5] [--key ff00ff] [--landmark white]

  char_dir     folder karakter berisi raw-original/<state>.png
  --head-box   kotak kepala di pose acuan, koordinat relatif crop pose (kolom pose, baris dari atas gambar).
               Kosongkan untuk otomatis (pita 10–30 % teratas siluet) — lalu CEK tile TEMPLATE di head-check.png.
  --rel-json   {"walk": [1.045], "idle": [1,0.95,1,0.987]} = --rel yang SEKARANG dipakai rebuild_raw.py
  --landmark   white: cari kepala di dekat gumpalan putih (bulu helm / rambut putih) — mencegah tertukar dengan bahu

Keluaran: rasio ukuran kepala di atlas vs idle per frame, median per gerakan, saran --rel baru, dan
<char_dir>/head-check.png: setiap kepala yang ditemukan DIKEMBALIKAN ke ukuran template memakai skala terbaca.
Kalau skalanya benar, semua kepala di lembar itu tampak sama besar dengan TEMPLATE. Kotak yang tidak berisi
kepala (tertutup lengan / menghadap depan) = angka frame itu tidak valid → abaikan, pakai median gerakannya.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from sprite_gen.frames.extract import estimate_pixel_grid_runlen

WHITE_MIN = 215
MIN_SCORE = 0.30          # skor NCC tepi di bawah ini = kepala tidak tertangkap dengan baik


def corr(a, b):
    H, W = a.shape; h, w = b.shape
    fa = np.fft.rfft2(a, (H + h, W + w)); fb = np.fft.rfft2(b[::-1, ::-1], (H + h, W + w))
    return np.fft.irfft2(fa * fb, (H + h, W + w))[h - 1:H, w - 1:W]


def edges(img, key):
    a = np.asarray(img).astype(float)
    fg = np.sqrt(((a - key) ** 2).sum(-1)) > 110
    g = a.mean(2) * fg
    gy, gx = np.gradient(g)
    return np.hypot(gx, gy), fg, a


def white_center(a, fg):
    ys, xs = np.nonzero(fg & (a.min(2) > WHITE_MIN))
    if len(xs) < 50:
        return None
    rows = np.nonzero(fg.any(1))[0]
    sel = ys < rows.min() + 0.45 * (rows.max() - rows.min())
    return (float(np.median(xs[sel])), float(np.median(ys[sel]))) if sel.any() else None


def split_poses(img, n, key):
    a = np.array(img).astype(int)
    cols = (np.sqrt(((a - key) ** 2).sum(-1)) > 110).sum(0) > 2
    runs, x = [], 0
    while x < len(cols):
        if cols[x]:
            s = x
            while x < len(cols) and cols[x]:
                x += 1
            runs.append([s, x])
        else:
            x += 1
    merged = [runs[0]] if runs else []
    for r in runs[1:]:
        if r[0] - merged[-1][1] < 12:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    merged = [r for r in merged if r[1] - r[0] > 20]
    if len(merged) != n:   # pose saling menempel → pakai slot sama lebar
        merged = [[round(k * img.width / n), round((k + 1) * img.width / n)] for k in range(n)]
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("char_dir")
    ap.add_argument("--poses", required=True, help="state:jumlah,... mis. idle:4,walk:6,attack1:4")
    ap.add_argument("--ref", default="idle:0")
    ap.add_argument("--head-box", default="")
    ap.add_argument("--rel-json", default="")
    ap.add_argument("--target", type=float, default=0.5)
    ap.add_argument("--key", default="ff00ff")
    ap.add_argument("--landmark", default="", choices=["", "white"])
    args = ap.parse_args()

    root = Path(args.char_dir)
    key = np.array([int(args.key[i:i + 2], 16) for i in (0, 2, 4)])
    poses = [(p.split(":")[0], int(p.split(":")[1])) for p in args.poses.split(",")]
    rel = json.loads(Path(args.rel_json).read_text()) if args.rel_json else {}

    def load(state, n):
        im = Image.open(root / "raw-original" / f"{state}.png").convert("RGB")
        px, py = estimate_pixel_grid_runlen(im.convert("RGBA"))
        return im, split_poses(im, n, key), args.target / ((px + py) / 2)

    def rel_of(state, i, n):
        r = rel.get(state, [1.0])
        return r[0] if len(r) == 1 else r[i]

    rs, ri = args.ref.split(":"); ri = int(ri)
    nref = dict(poses)[rs]
    im, runs, base_ref = load(rs, nref)
    x0, x1 = runs[ri]
    pose = im.crop((x0, 0, x1, im.height))
    if args.head_box:
        hb = [int(v) for v in args.head_box.split(",")]
    else:
        _, fg, _ = edges(pose, key)
        rows = np.nonzero(fg.any(1))[0]; top, h = rows.min(), rows.max() - rows.min()
        y0, y1 = top + int(h * 0.10), top + int(h * 0.30)
        cols = np.nonzero(fg[y0:y1].any(0))[0]
        hb = [int(cols.min()), int(y0), int(cols.max() + 1), int(y1)]
    tmpl = pose.crop(hb)
    tE, tfg, ta = edges(tmpl, key)
    tmask = (tfg & ~(ta.min(2) > WHITE_MIN)).astype(np.float32)
    ref_scale_atlas = base_ref * rel_of(rs, ri, nref)

    offset = None
    if args.landmark == "white":
        _, pfg, pa = edges(pose, key)
        c = white_center(pa, pfg)
        if c:
            offset = ((hb[0] + hb[2]) / 2 - c[0], (hb[1] + hb[3]) / 2 - c[1])

    def find(img):
        E, fg, a = edges(img, key)
        c = white_center(a, fg) if offset else None
        best = (-9.0, 1.0, 0, 0)
        for s in np.arange(0.70, 1.401, 0.01):
            tw, th = round(tmpl.width * s), round(tmpl.height * s)
            if tw >= img.width or th >= img.height:
                continue
            T = np.array(Image.fromarray(tE.astype(np.float32)).resize((tw, th), Image.BILINEAR)).astype(float)
            M = (np.array(Image.fromarray((tmask * 255).astype(np.uint8)).resize((tw, th), Image.BILINEAR)) > 127).astype(float)
            n = M.sum()
            tz = (T - (T * M).sum() / n) * M
            sc = corr(E, tz) / np.sqrt(np.maximum(corr(E * E, M) - corr(E, M) ** 2 / n, 1e-9) * (tz * tz).sum())
            if c is not None:
                yy, xx = np.mgrid[0:sc.shape[0], 0:sc.shape[1]]
                ex, ey = c[0] + offset[0] * s, c[1] + offset[1] * s
                sc = np.where((abs(xx + tw / 2 - ex) < 90) & (abs(yy + th / 2 - ey) < 90), sc, -9)
            k = np.unravel_index(np.argmax(sc), sc.shape)
            if sc[k] > best[0]:
                best = (float(sc[k]), float(s), int(k[1]), int(k[0]))
        return best

    tiles = [("TEMPLATE", tmpl)]
    print(f"template kepala: {tmpl.width}x{tmpl.height}px dari {args.ref} (box {hb})")
    suggestions = {}
    for state, n in poses:
        im, runs, base = load(state, n)
        ratios = []
        for i, (a0, a1) in enumerate(runs):
            p = im.crop((a0, 0, a1, im.height))
            score, s, bx, by = find(p)
            ratio = s * base * rel_of(state, i, n) / ref_scale_atlas
            ok = score >= MIN_SCORE
            if ok:
                ratios.append(ratio)
            tw, th = round(tmpl.width * s), round(tmpl.height * s)
            tiles.append((f"{state}{i} {ratio:.2f}{'' if ok else ' ?'}",
                          p.crop((bx, by, bx + tw, by + th)).resize(tmpl.size, Image.LANCZOS)))
            print(f"{state:>10} {i}: kepala di atlas = {ratio:.3f} × idle  (skor {score:.2f}){'' if ok else '  TIDAK VALID'}")
        if ratios:
            med = float(np.median(ratios))
            cur = rel.get(state, [1.0])
            new = [round(v / med, 3) for v in cur]
            suggestions[state] = new
            flag = "OK" if abs(med - 1) <= 0.03 else "PERLU KOREKSI"
            print(f"{'':>10}    median {med:.3f} → {flag}; --rel baru {','.join(map(str, new))}")
    W, H = tmpl.size; cols = 9
    sheet = Image.new("RGB", (W * cols, (H + 14) * ((len(tiles) + cols - 1) // cols)), (0, 0, 0))
    for k, (name, t) in enumerate(tiles):
        x, y = (k % cols) * W, (k // cols) * (H + 14)
        sheet.paste(t, (x, y + 14)); ImageDraw.Draw(sheet).text((x + 2, y + 1), name, fill=(255, 255, 0))
    sheet.save(root / "head-check.png")
    print(f"\nLIHAT {root / 'head-check.png'}: semua kepala harus sama besar dengan TEMPLATE.")
    print("saran --rel (salin ke rel.json bila setuju):", json.dumps(suggestions))


if __name__ == "__main__":
    main()
