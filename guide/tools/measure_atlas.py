"""Ukur setiap frame di atlas final dan tandai yang melenceng.

Pakai:  python measure_atlas.py <run_dir> [--ref idle] [--states idle,walk]

Per frame dicetak:
  h        tinggi siluet (px)
  bottom   baris kaki (harus sama untuk semua frame di tanah)
  head_w   lebar kepala/helm — info saja (rambut/bulu helm yang bergoyang membuatnya berisik);
           cek skala yang akurat pakai register_frames.py
  torso_x  posisi horizontal badan — indikator goyang kiri-kanan
Tanda '!' hanya diberikan untuk state "tegak" (--stable, default idle,walk,run): tinggi & goyang-x.
Pose aksi (jump, attack) memang berubah bentuk — untuk itu cukup lihat GIF dan pastikan bottom sama.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image

HEAD_BAND = (0.13, 0.28)   # bagian siluet (dari atas) yang dianggap kepala
TORSO_BAND = (0.32, 0.56)  # bagian siluet yang dianggap badan
ALPHA_MIN = 40


def frame_stats(cell: Image.Image) -> dict:
    al = np.array(cell.getchannel("A")) > ALPHA_MIN
    ys, xs = np.nonzero(al)
    if len(ys) == 0:
        return {"empty": True}
    top, bottom = ys.min(), ys.max()
    h = bottom - top
    def band(a, b):
        return al[top + int(h * a): top + int(h * b)]
    hx = np.nonzero(band(*HEAD_BAND))[1]
    tx = np.nonzero(band(*TORSO_BAND))[1]
    feet = np.nonzero(al[bottom - 8: bottom + 1].any(0))[0]  # lowest 9 rows ≈ the feet
    return {"h": int(h), "top": int(top), "bottom": int(bottom),
            "head_w": int(hx.max() - hx.min()) if len(hx) else 0,
            "torso_x": round(float(tx.mean()), 1) if len(tx) else 0.0,
            "feet": int(feet.max() - feet.min()) if len(feet) else 0}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run_dir")
    ap.add_argument("--ref", default="idle", help="state acuan skala (frame 0)")
    ap.add_argument("--states", default="", help="daftar state dipisah koma; kosong = semua")
    ap.add_argument("--stable", default="idle,walk,run", help="state tegak yang diperiksa ketat")
    ap.add_argument("--max-h-diff", type=int, default=2)
    ap.add_argument("--max-torso-drift", type=float, default=1.5)
    ap.add_argument("--max-feet-ratio", type=float, default=0.45,
                    help="walk/run: jarak kaki terkecil / terbesar harus ≤ ini (kaki merapat saat melintas)")
    args = ap.parse_args()
    stable = set(args.stable.split(","))

    run = Path(args.run_dir)
    manifest = json.loads((run / "manifest.json").read_text(encoding="utf-8"))
    atlas = Image.open(run / manifest.get("sprite_sheet_alpha", "sprite-sheet-alpha.png")).convert("RGBA")
    rows = manifest["frame_layout"]["rows"]
    wanted = [s for s in args.states.split(",") if s] or list(rows)

    def cell(state, i):
        r = rows[state][i]
        return atlas.crop((r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]))

    ref = frame_stats(cell(args.ref, 0))
    print(f"acuan: {args.ref}[0]  h={ref['h']}  head_w={ref['head_w']}  torso_x={ref['torso_x']}  bottom={ref['bottom']}")
    problems = 0
    for state in wanted:
        stats = [frame_stats(cell(state, i)) for i in range(len(rows[state]))]
        hs = [s["h"] for s in stats]
        tx = [s["torso_x"] for s in stats]
        for i, s in enumerate(stats):
            flags = []
            if s.get("empty"):
                flags.append("KOSONG")
            elif state in stable:
                if state == args.ref and abs(s["h"] - ref["h"]) > args.max_h_diff:
                    flags.append("tinggi")
                if abs(s["torso_x"] - np.median(tx)) > args.max_torso_drift:
                    flags.append("goyang-x")
            if not s.get("empty") and s["bottom"] != ref["bottom"]:
                flags.append("kaki-tidak-di-garis")
            problems += bool(flags)
            print(f"{state:>10} {i}: h={s.get('h')} bottom={s.get('bottom')} head_w={s.get('head_w')} "
                  f"torso_x={s.get('torso_x')} {'! ' + ','.join(flags) if flags else 'ok'}")
        print(f"{'':>10}    rentang tinggi {min(hs)}–{max(hs)}  rentang torso_x {min(tx)}–{max(tx)}")
        if state in ("walk", "run"):
            # a real walk cycle closes the legs when one passes the other: min feet spread << max
            fs = [s["feet"] for s in stats if not s.get("empty")]
            ratio = min(fs) / max(fs) if max(fs) else 1
            ok = ratio <= args.max_feet_ratio
            problems += not ok
            print(f"{'':>10}    jarak kaki per frame {fs} → rapat/lebar {ratio:.2f} "
                  f"{'ok (kaki bergantian)' if ok else '! kaki-tidak-bergantian: kaki tidak pernah merapat — generate ulang strip ini'}")
    print("\nSEMUA LOLOS" if problems == 0 else f"\n{problems} frame perlu dicek (lihat sprite-qa.md)")


if __name__ == "__main__":
    main()
