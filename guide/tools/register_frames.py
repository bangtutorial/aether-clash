"""Cari skala dan geser tiap frame relatif ke frame acuan (default idle frame 0).

Membandingkan bagian badan atas yang kaku (kepala → sabuk), jadi gerakan kaki/jubah tidak mengganggu.
Kaki dijaga tetap di garis tanah saat skala dicoba.

Pakai:
  python register_frames.py <run_dir> <state>            # cari skala + dx (diagnosis)
  python register_frames.py <run_dir> <state> --dx-only  # skala dikunci 1.0, cari dx bulat (untuk curation)

Baca frame dari run/frames/<state>/ (sebelum curation). Butuh paket sprite_gen (venv skill sprite-gen).
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from sprite_gen.curate import curation as C

UPPER_BAND = (0.10, 0.50)  # bagian siluet acuan yang dipakai untuk mencocokkan (dari atas)


def alpha(img):
    return np.array(img.getchannel("A")) > 40


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("state")
    ap.add_argument("--ref", default="idle:0", help="state:index acuan")
    ap.add_argument("--dx-only", action="store_true")
    ap.add_argument("--bob", type=int, default=None, help="toleransi naik-turun (px); default 4 untuk walk/run, 0 lainnya")
    args = ap.parse_args()

    run = Path(args.run_dir)
    req = json.loads((run / "sprite-request.json").read_text(encoding="utf-8"))
    cw, ch = req["cell"]["width"], req["cell"]["height"]
    foot_y = ch - req["cell"]["safe_margin_y"]
    cy = ch / 2
    ref_state, ref_i = args.ref.split(":")
    ref = alpha(Image.open(run / "frames" / ref_state / f"frame-{ref_i}.png"))
    ys = np.nonzero(ref.any(1))[0]
    top, h = ys.min(), ys.max() - ys.min()
    y0, y1 = top + int(h * UPPER_BAND[0]), top + int(h * UPPER_BAND[1])
    bob = args.bob if args.bob is not None else (4 if args.state in ("walk", "run") else 0)

    scales = [1.0] if args.dx_only else np.arange(0.90, 1.101, 0.005)
    dxs = range(-10, 11) if args.dx_only else np.arange(-10, 10.5, 0.5)
    frames = sorted((run / "frames" / args.state).glob("frame-*.png"),
                    key=lambda p: int(p.stem.split("-")[1].split(".")[0]))
    frames = [p for p in frames if p.stem.count(".") == 0]
    result = []
    for p in frames:
        src = Image.open(p)
        best = (-1.0, 1.0, 0.0)
        for s in scales:
            dy = (foot_y - cy) * (1 - s)          # kaki tetap di garis tanah
            for dx in dxs:
                t = {"scale": float(s), "dx": float(dx), "dy": float(dy)}
                out = alpha(C.apply_transform(src, t, (cw, ch)))
                for sh in range(-bob, bob + 1):
                    o = np.roll(out, sh, axis=0)[y0:y1]
                    r = ref[y0:y1]
                    iou = (o & r).sum() / max(1, (o | r).sum())
                    if iou > best[0]:
                        best = (iou, float(s), float(dx))
        iou, s, dx = best
        result.append({"frame": p.stem, "scale": round(s, 3), "dx": int(dx) if args.dx_only else dx, "iou": round(iou, 3)})
        note = "" if abs(s - 1) <= 0.01 else "  <- skala meleset >1%, koreksi di gambar asli"
        print(f"{p.stem}: scale={s:.3f} dx={dx:+.1f} iou={iou:.3f}{note}")
    if args.dx_only:
        print("dx bulat:", ",".join(str(r["dx"]) for r in result))
    else:
        # 'scale' = pengali yang membuat frame cocok dengan acuan → langsung jadi --rel untuk rebuild_raw.py
        print("--rel untuk rebuild_raw.py:", ",".join(f"{r['scale']:.3f}" for r in result))


if __name__ == "__main__":
    main()
