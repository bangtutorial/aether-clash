"""Tulis geser horizontal BULAT per frame ke curation.json (tanpa resample → tanpa blur).

Pakai:  python write_dx.py <run_dir> <state> <dx0,dx1,...>
        (dx dari: python register_frames.py <run_dir> <state> --dx-only)

Transform lain di state itu diganti. scale selalu 1, dx dibulatkan. Lalu: sprite-gen compose-atlas --run-dir <run_dir>
"""
import json
import sys
from pathlib import Path

from sprite_gen.curate import curation as C


def main():
    run, state, raw = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    dxs = [int(round(float(v))) for v in raw.split(",")]
    path = run / "curation.json"
    cur = json.loads(path.read_text(encoding="utf-8")) if path.exists() else C.empty_curation()
    transforms = {str(i): {"scale": 1.0, "dx": dx, "dy": 0} for i, dx in enumerate(dxs) if dx}
    cur.setdefault("states", {})
    if transforms:
        cur["states"][state] = {"transforms": transforms}
    else:
        cur["states"].pop(state, None)
    C.write_curation_atomic(run, C.stamp_curation(run, cur))
    print(f"{state}: dx = {dxs}")


if __name__ == "__main__":
    main()
