# Sprite Pipeline

Untuk proyek fighting ini, mulai dari [character-workflow.md](character-workflow.md) dan [template request](templates/sprite-request.json): 14 state/50 frame, cell 320×288, jump/tuck masing-masing1 pose. Contoh generik di bawah harus mengikuti kontrak tersebut saat dipakai di proyek ini.

Alur dari nol sampai atlas siap pakai. Contoh memakai skill **sprite-gen** (`sprite-gen prepare/extract/compose-atlas`)
dan model gambar yang tidak bisa membuat strip super lebar (mis. GPT Image, maksimal 21:9). Prinsipnya berlaku
juga untuk alat lain.

```
1 base ──► 2 prepare ──► 3 generate strip ──► 4 normalisasi skala ──► 5 extract
                                                     ▲                      │
                                                     └── 7 koreksi per pose ◄┘ 6 ukur
                                                                            │
                                               8 geser bulat (curation) ──► 9 compose atlas ──► 10 QA
```

---

## 1. Buat & kunci karakternya dulu — baru sprite

**Jangan langsung minta sprite sheet.** Urutannya selalu:

1. Buat **satu gambar karakter** (base) sampai benar-benar disetujui: desain, warna, proporsi, gaya.
2. Simpan sebagai **kartu karakter** (di bawah).
3. Baru setelah itu generate strip gerakan — **setiap** strip melampirkan base ini sebagai referensi.

Alasannya: model gambar mengikuti referensi jauh lebih konsisten daripada mengikuti deskripsi teks.
Kalau desain belum dikunci, tiap strip akan "menafsirkan ulang" karakternya (warna, helm, senjata berubah),
dan itu tidak bisa diperbaiki di tahap mana pun setelahnya.

- Generate 2–4 varian, pilih **satu**. Semua gerakan nanti mengacu ke gambar ini.
- Syarat base:
  - full body, tidak terpotong (termasuk senjata, jubah, bulu helm)
  - menghadap **kanan** (kiri didapat dengan flip di game)
  - background **satu warna flat** (chroma key) yang tidak dipakai karakter — lihat bagian Chroma
  - pose netral/idle, proporsi final
- Simpan: `base/base-a.png` (+ job id generator bila perlu dipakai sebagai referensi).

**Chroma key:** pilih warna yang jauh dari warna karakter.
- Karakter biru/perak/emas/hijau → magenta `#FF00FF`
- Karakter merah/pink/ungu → hijau `#00FF00`
- Larang warna itu di prompt ("do not use magenta/pink/purple on the character").

### Kartu karakter

Simpan di `<karakter>/character.md` (atau json) dan **pakai ulang** setiap kali menambah gerakan baru,
walaupun berbulan-bulan kemudian. Gerakan baru yang dibuat tanpa kartu ini hampir pasti tidak cocok.

```markdown
# Kartu karakter: knight
- Base: base/base-a.png   (generator job id: b1469b8f-…, bisa dipakai langsung sebagai referensi)
- Prompt base: <salin prompt lengkap yang menghasilkan base>
- Model: gpt_image_2_5, variant sunburst, quality high, resolution 2k
- Palet: silver steel, gold trim, royal blue tabard & cape, white plume, brown leather
- Chroma key: #FF00FF      Menghadap: kanan
- Skala: target/pitch diukur untuk idle ±180 px; kepala DAN badan dibandingkan; rel.json milik karakter ini
- Sel: 320×288, margin x=10/y=8, anchor kaki (160, 280)
- Gerakan: gunakan 14 state pada template; walk/run 4, jump/tuck 1, attack1-3 4
```

### Karakter kedua dan seterusnya (supaya satu game satu gaya)

Base karakter baru dibuat dari **deskripsi gaya bersama tanpa gambar karakter lama**. Sesuai revisi pengguna, label STYLE ONLY belum cukup mencegah kemiripan. Prompt wajib menentukan siluet, rambut, wajah, palet, kostum, anatomi/alat, dan aksesori baru serta menyebut ciri roster lama yang harus dihindari. Lihat [aturan pembeda](character-workflow.md#pembeda-eksplisit-pada-setiap-prompt-base).
Setelah base baru disetujui, kartu dan base miliknya sendiri menjadi referensi identitas untuk seluruh strip.

Karakter yang jauh lebih besar (bos, naga) boleh punya `target` skala lebih besar (pixel sedikit lebih tebal)
supaya tampil besar di layar — tulis di kartunya.

## 2. Siapkan run

Default proyek: empat frame untuk sebagian besar gerakan, satu pose atletis untuk jump dan satu pose tuck untuk doublejump. Enam frame walk adalah opsi pengembangan yang harus mengubah request/guide/QA bersama, bukan default tersembunyi. Berikut cuplikan; template menyediakan semua 14 state.

```json
{
  "cell": { "width": 320, "height": 288, "safe_margin_x": 10, "safe_margin_y": 8 },
  "states": {
    "idle":   { "frames": 4, "fps": 5,  "loop": true },
    "walk":   { "frames": 4, "fps": 10, "loop": true },
    "jump":   { "frames": 1, "fps": 10, "loop": false },
    "doublejump": { "frames": 1, "fps": 12, "loop": false },
    "attack1": { "frames": 4, "fps": 13, "loop": false }
  }
}
```

```bash
sprite-gen prepare --out-dir run --character-id hero --base-image base/base-a.png \
  --request request.json \
  --chroma-key "#FF00FF" --no-fit-pixel-unfake --fit-align-x foot-centroid --fit-align-y bottom
```

**Ukuran sel:** harus muat pose **terbesar** (pedang terangkat, tusukan maksimal) di skala final tanpa dikecilkan.
Hitung setelah langkah 4; kalau ragu, lebih besar lebih aman. Frame yang tidak muat akan dikecilkan otomatis
**per frame** → ukuran karakter jadi tidak konsisten.

**`pixel-unfake` mati** bila gambar AI bukan pixel art asli (grid tidak terdeteksi). Tanda: extractor melaporkan
`pitch disagreement … detect 1.00x1.00`.

## 3. Generate strip per gerakan

- Satu strip = satu gerakan, N pose dari kiri ke kanan.
- Referensi yang dilampirkan: **(1) base**, **(2) layout guide** berisi N kotak.
- Model dengan rasio terbatas: buat ulang layout guide di rasio yang didukung (mis. 21:9) dengan jumlah kotak sama.
  Extractor memisahkan pose berdasarkan bentuk, jadi strip tidak harus persis rasio sel.
- Prompt: lihat [sprite-prompts.md](sprite-prompts.md).
- Simpan hasil asli **tanpa diubah** di `raw-original/<state>.png`. Ini sumber untuk semua koreksi berikutnya.

Simpan pula versi immutable `<state>-v1.png`, `<state>-v2.png`, dan seterusnya. `<state>.png` boleh menjadi salinan sumber terpilih untuk tool; jangan me-resample file versi aslinya. Jump/tuck satu pose memakai 1:1 dan `--poses 1`, bukan strip empat pose.

Periksa cepat dengan mata: jumlah pose benar, tidak saling menempel, tidak ada efek lepas (garis gerak, debu).
Kalau gagal, generate ulang strip itu saja.

## 4. Normalisasi skala antar strip

Model menggambar tiap strip dengan ukuran berbeda (contoh nyata: idle 860 px tinggi, walk 675 px).
Langkah pertama: samakan **pitch** (ukuran pixel palsu) tiap strip. Ini hanya **perkiraan awal** — model bisa
menggambar karakter lebih kecil dengan pitch yang sama (terutama strip serangan). Skala sebenarnya dipastikan
di langkah 6 lewat ukuran kepala.

```python
from PIL import Image
from sprite_gen.frames.extract import estimate_pixel_grid_runlen
im = Image.open("raw-original/walk.png").convert("RGB")
px, py = estimate_pixel_grid_runlen(im.convert("RGBA"))
factor = TARGET / ((px + py) / 2)      # TARGET mis. 0.5 → 1 px final = 2 pixel palsu
```

`TARGET` menentukan seberapa "kotak-kotak" hasil akhirnya: 0.5 = detail halus (hi-bit), 0.33 = lebih chunky.

## 5. Extract

Tulis strip hasil normalisasi ke `run/raw/<state>.png`, lalu:

```bash
sprite-gen extract --run-dir run
```

Harus `errors: []`. Warning `native logical exceeds the physical cap` = sel kekecilan → perbesar sel (langkah 2).

## 6. Ukur

Jalankan pengukuran di [sprite-qa.md](sprite-qa.md) untuk **setiap** gerakan — termasuk serangan, lompat,
dan pose yang dipakai skill. Yang dicari:
- skala tiap gerakan relatif terhadap idle frame 0 lewat **ukuran kepala** (`measure_head_scale.py`, di gambar
  asli). Pitch yang sama **tidak** menjamin karakter sama besar.
- posisi horizontal badan (`torso_x`) per frame
- tinggi badan/recovery, crown→sabuk dan sabuk→kaki pada baseline yang sama. Kepala/rambut seragam saja pernah menyembunyikan tubuh ARCO yang mengecil.

Hasil pencocokan kepala yang menangkap sepatu/bahu atau terhalang alat adalah tidak valid. Buka montage, pilih landmark sesuai karakter, lalu lakukan perbandingan badan penuh. Jangan menerapkan faktor skala besar dari hasil yang salah atau menyalin faktor ARCO ke karakter lain.

## 7. Koreksi skala per pose — di gambar asli

Kalau ada gerakan yang median skalanya di luar 0.97–1.03 (atau satu pose yang jelas beda): **bangun ulang**
`run/raw/<state>.png` dari `raw-original/`
dengan faktor per pose = `factor_strip × koreksi_pose`, satu kali resample (BOX). Script: lihat
[sprite-qa.md → Perbaiki skala](sprite-qa.md#perbaiki-skala-di-gambar-asli). Lalu extract ulang gerakan itu.

Catat semua nilai `--rel` di `rel.json` karakter. Contoh nyata (knight):
`idle [1,0.95,1,0.987]`, `walk 0.990`, `jump 1.032`, `attack1 1.059`, `attack2 1.075`, `attack3 0.974`.

## 8. Sejajarkan dengan geser bulat

Setelah skala benar, tulis `curation.json` hanya berisi geser **integer** (`dx`, bila perlu `dy`), `scale` = 1.
Hitung dx dengan registrasi badan atas ke idle frame 0 (script di sprite-qa.md).

## 9. Compose

```bash
sprite-gen compose-atlas --run-dir run
sprite-gen compose-gif  --run-dir run --out-dir run/previews
```

Output: `sprite-sheet-alpha.png` + `manifest.json` (+ GIF preview per gerakan).

## 10. QA & kirim ke game

- Checklist [sprite-qa.md](sprite-qa.md) harus lolos **pada atlas final**.
- Salin atlas + manifest ke folder aset game. Jangan pernah mengambil dari `run/frames/` (belum ter-curation).
- Catat di `run/qa-notes.md`: provider, faktor skala, koreksi per pose, dx, hasil ukur.

## Struktur folder yang disarankan

```
<karakter>/
  base/                 base-a.png (identitas)
  raw-original/         strip asli dari generator — tidak pernah diedit
  guides/               layout guide rasio generator
  request.json
  run/                  run sprite-gen (raw/, frames/, curation.json, atlas, manifest, qa-notes.md)
```

## Windows

- Set `PYTHONUTF8=1` sebelum memanggil `sprite-gen` (help/log memakai karakter unicode).
- Venv Windows ada di `.venv\Scripts`; bila dokumen menulis `.venv/bin`, buat junction `bin → Scripts`.
