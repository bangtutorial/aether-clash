"""Bangun ulang run/raw/<state>.png dari strip asli generator dengan faktor skala per pose.

Satu kali resample (BOX) per pose → semua frame sama tajam. Ini SATU-SATUNYA tempat skala dikoreksi.

Pakai:
  python rebuild_raw.py <src_strip> <out_strip> --poses N [--target 0.5] [--rel 1,0.95,1,0.987]

  src_strip  strip asli generator (raw-original/<state>.png), latar chroma flat
  out_strip  run/raw/<state>.png
  --target   ukuran 1 px final dalam "pixel palsu" (0.5 = 1 px final per 2 pixel palsu)
  --rel      koreksi per pose (hasil register_frames.py); satu angka = berlaku untuk semua pose
  --key      warna chroma (default ff00ff)

Butuh sprite_gen (untuk mengukur pitch). Setelah ini: sprite-gen extract --run-dir run --states <state>
"""
import argparse

import numpy as np
from PIL import Image
from sprite_gen.frames.extract import estimate_pixel_grid_runlen


def find_poses(fg: np.ndarray, n: int, min_gap: int = 12, min_width: int = 20):
    cols = fg.sum(0) > 2
    runs, x, w = [], 0, len(cols)
    while x < w:
        if cols[x]:
            s = x
            while x < w and cols[x]:
                x += 1
            runs.append([s, x])
        else:
            x += 1
    merged = [runs[0]]
    for r in runs[1:]:
        if r[0] - merged[-1][1] < min_gap:   # potongan kecil (ujung pedang, jubah) digabung
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    merged = [r for r in merged if r[1] - r[0] > min_width]
    counts = fg.sum(0)
    while len(merged) < n:
        # pose bersentuhan (ujung pedang menyentuh jubah tetangga): potong pose terlebar di kolom
        # dengan piksel paling sedikit (bagian tengah 70 %) — biasanya titik sentuh yang tipis
        i = max(range(len(merged)), key=lambda j: merged[j][1] - merged[j][0])
        s, e = merged[i]
        m = int((e - s) * 0.15)
        cut = s + m + int(np.argmin(counts[s + m:e - m]))
        print(f"pose menempel: potong di kolom {cut} (piksel {int(counts[cut])})")
        merged[i:i + 1] = [[s, cut], [cut, e]]
    if len(merged) != n:
        raise SystemExit(f"ditemukan {len(merged)} pose, harusnya {n}: {merged} — cek strip / generate ulang")
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--poses", type=int, required=True)
    ap.add_argument("--target", type=float, default=0.5)
    ap.add_argument("--rel", default="1")
    ap.add_argument("--key", default="ff00ff")
    args = ap.parse_args()

    key = np.array([int(args.key[i:i + 2], 16) for i in (0, 2, 4)])
    im = Image.open(args.src).convert("RGB")
    px, py = estimate_pixel_grid_runlen(im.convert("RGBA"))
    base = args.target / ((px + py) / 2)
    rel = [float(v) for v in args.rel.split(",")]
    rel = rel * args.poses if len(rel) == 1 else rel
    assert len(rel) == args.poses, "--rel harus 1 angka atau sebanyak --poses"

    if len(set(rel)) == 1:
        # satu faktor untuk semua pose → perkecil strip utuh; tidak perlu memisahkan pose
        # (juga aman bila pose di gambar asli saling bersentuhan)
        f = base * rel[0]
        out = im.resize((round(im.width * f), round(im.height * f)), Image.Resampling.BOX)
        out.save(args.out)
        print(f"strip utuh: faktor {f:.4f} (pitch {px:.2f}x{py:.2f}, rel {rel[0]})")
        print("tersimpan:", args.out, out.size)
        return

    # rel mayoritas = skala strip utuh (tata letak & pose yang bersentuhan tetap utuh);
    # hanya pose dengan rel berbeda yang dipotong dari gambar asli, di-resample sekali, lalu ditempel ulang
    common = max(set(rel), key=rel.count)
    fc = base * common
    out = im.resize((round(im.width * fc), round(im.height * fc)), Image.Resampling.BOX)
    print(f"strip utuh: faktor {fc:.4f} (pitch {px:.2f}x{py:.2f}, rel {common})")
    a = np.array(im).astype(int)
    fg = np.sqrt(((a - key) ** 2).sum(-1)) > 110
    runs = find_poses(fg, args.poses)
    pad = 6
    for i, (x0, x1) in enumerate(runs):
        if rel[i] == common:
            continue
        rows = np.nonzero(fg[:, x0:x1].any(1))[0]
        y0, y1 = rows.min(), rows.max() + 1
        # pad hanya ke sisi yang kosong — jangan ikut mengambil piksel pose tetangga yang menempel
        px0 = x0 - pad if i == 0 or runs[i - 1][1] < x0 else x0
        px1 = x1 + pad if i == len(runs) - 1 or runs[i + 1][0] > x1 else x1
        box = (max(0, px0), max(0, y0 - pad), min(im.width, px1), min(im.height, y1 + pad))
        crop = im.crop(box)
        cmask = Image.fromarray((fg[box[1]:box[3], box[0]:box[2]] * 255).astype(np.uint8))
        # hapus pose lama (versi skala strip) dari kanvas
        sbox = tuple(round(v * fc) for v in box)
        old = cmask.resize((sbox[2] - sbox[0], sbox[3] - sbox[1]), Image.Resampling.BOX).point(lambda v: 255 if v > 0 else 0)
        out.paste(Image.new("RGB", old.size, tuple(int(v) for v in key)), sbox[:2], old)
        # tempel versi baru, kaki (tengah-bawah) tetap di tempat yang sama
        f = base * rel[i]
        size = (max(1, round(crop.width * f)), max(1, round(crop.height * f)))
        small = crop.resize(size, Image.Resampling.BOX)
        smask = cmask.resize(size, Image.Resampling.BOX).point(lambda v: 255 if v > 0 else 0)
        cx, bottom = (box[0] + box[2]) / 2 * fc, box[3] * fc
        out.paste(small, (round(cx - small.width / 2), round(bottom - small.height)), smask)
        print(f"pose {i}: faktor {f:.4f} (rel {rel[i]}) ditempel ulang")
    out.save(args.out)
    print("tersimpan:", args.out, out.size)


if __name__ == "__main__":
    main()
