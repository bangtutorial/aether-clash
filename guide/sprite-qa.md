# Sprite QA — supaya tidak ada frame yang besar sendiri

Mata manusia baru sadar frame "berdenyut" setelah dimainkan. Jadi sprite **diukur dulu** sebelum masuk game.
Semua pemeriksaan dilakukan pada **atlas final** (`sprite-sheet-alpha.png` + `manifest.json`), bukan `frames/`.

Untuk proyek ini baca [character-workflow.md](character-workflow.md) terlebih dahulu. Angka toleransi di bawah adalah target untuk landmark yang valid. Hasil template yang menangkap bahu/sepatu atau gagal karena rotasi harus dicatat sebagai tidak terukur; jangan dilaporkan lolos hanya berdasarkan median lain.

Tool ada di [tools/](tools/). Jalankan dengan Python dari venv sprite-gen (butuh Pillow, NumPy, `sprite_gen`):

```bash
PY=<SPRITE_GEN_ROOT>/.venv/bin/python        # Windows: .venv\Scripts\python.exe, set PYTHONUTF8=1
```

## Checklist (wajib lolos semua)

**Skala antar gerakan — SEMUA gerakan, termasuk serangan, lompat, skill**
- [ ] `measure_head_scale.py` dijalankan untuk **setiap** gerakan terhadap idle frame 0:
      median tiap gerakan **0.97–1.03**
- [ ] `head-check.png` dilihat: semua kepala tampak sama besar dengan TEMPLATE; frame yang kotaknya bukan
      kepala dicatat sebagai "tidak terukur" dan dicek dengan perbandingan badan penuh (lihat langkah 2)
- [ ] Setiap menambah gerakan baru, cek ini diulang untuk gerakan itu (jangan anggap aman karena
      gerakan lain sudah lolos)

**Frame sambungan — frame yang bertemu idle (awal & akhir serangan/kombo, akhir hurt)**
- [ ] Ukur badan penuh dan crown→sabuk→kaki, bukan kepala/rambut saja. Pada ARCO, kepala seragam pernah menyembunyikan recovery 170–176 px dibanding idle 180 px.
- [ ] Frame **pertama dan terakhir** tiap gerakan aksi diukur sendiri terhadap idle frame 0 di atlas
      (bukan cuma median strip): kepala 0.97–1.03, dan untuk pose tegak tinggi helm & helm→sabuk selisih ≤ 3 px
- [ ] Posisi kepala frame terakhir sama dengan idle (± 2 px) — kalau tidak, geser bulat (`write_dx.py`)
- [ ] Dilihat berdampingan: frame terakhir | idle f0 dengan garis tinggi yang sama (known-issues #17)

**Per gerakan tegak (idle, walk, run)**
- [ ] Tinggi frame idle selisih **≤ 2 px** satu sama lain
- [ ] Posisi badan (`torso_x`) tidak goyang lebih dari **±1.5 px** dalam satu gerakan
- [ ] Naik-turun badan saat jalan (bob) wajar, **bukan** hasil skala yang berbeda
- [ ] Walk/run: **kaki bergantian** — `measure_atlas.py` baris "jarak kaki" lebar→rapat→lebar→rapat,
      rasio terkecil/terbesar ≤ 0.45 (kalau tidak: generate ulang, lihat known-issues #15)
- [ ] Walk/run di game: frame maju berdasarkan jarak tempuh (`stride`), bukan fps tetap

**Makhluk terbang / tanpa kaki**
- [ ] Bagian yang seharusnya diam (kepala saat hover, badan saat menyerang) tidak bergeser > 2 px antar frame
- [ ] Tidak ada piksel di tepi sel (sayap/ekor terpotong)

**Semua gerakan**
- [ ] Jump hanya memakai pose atletis yang dipilih; tidak replay crouch di udara. Tuck doublejump tidak memiliki kaki menendang.
- [ ] Normal jump → tuck → spin → kembali jump dilihat di runtime dengan pivot terukur dan skala konstan.
- [ ] Source, request, jumlah frame, manifest, wrapper JS, metrics, dan titik efek sama-sama versi terbaru.
- [ ] Gerakan baru dibuat dengan base dari kartu karakter yang sama (bukan base baru / deskripsi teks saja)
- [ ] Kaki semua frame di baris yang sama (`bottom` sama) — untuk karakter yang berdiri
- [ ] Tidak ada frame kosong / terpotong / pose menempel ke tetangga
- [ ] Tidak ada sisa warna chroma (pinggiran magenta/hijau) — lihat di atas latar gelap **dan** terang
- [ ] Ketajaman sama di semua frame (tidak ada frame yang sedikit buram) — artinya tidak ada `scale ≠ 1`
      atau `dx` pecahan di `curation.json`
- [ ] Identitas konsisten: warna, senjata di tangan yang sama, aksesori tidak hilang
- [ ] GIF preview tiap gerakan dilihat sekali dengan kecepatan asli dan 0.5×

**Terakhir**
- [ ] `qa-notes.md` diisi: faktor skala, koreksi per pose, dx, hasil `measure_atlas.py`
- [ ] Pisahkan bukti angka, contact sheet/screenshot, dan loop yang benar-benar ditonton. Jangan menyebut full motion sudah mulus bila baru keyframe yang diperiksa.
- [ ] Jika menggunakan tool landmark putih ARCO untuk karakter berambut gelap/bertanduk, ganti landmark; jangan membiarkan alat memilih armor sebagai rambut.

## Langkah pemeriksaan

### 1. Ukur atlas

```bash
$PY guide/tools/measure_atlas.py run
```

Contoh keluaran yang **baik**:

```
      idle 0: h=141 bottom=199 head_w=38 torso_x=112.0 ok
      idle 1: h=140 bottom=199 head_w=40 torso_x=111.6 ok
      ...
              rentang tinggi 140–141  rentang torso_x 111.6–112.3
SEMUA LOLOS
```

Contoh yang **buruk** (kasus nyata sebelum diperbaiki): idle frame 1 `h=149` sementara lainnya `142`
→ karakter terlihat membesar sekali tiap siklus napas.

### 2. Cek skala SEMUA gerakan lewat kepala (di gambar asli)

Aturan: **samanya ukuran pixel palsu (pitch) TIDAK berarti samanya ukuran karakter.** Model bisa menggambar
strip serangan dengan karakter lebih kecil (supaya pedang terangkat muat di slot), dengan pitch yang sama.
Jadi setiap gerakan diukur terhadap idle memakai bagian yang bentuknya tetap: **kepala/helm**.

Simpan `--rel` yang sedang dipakai di `rel.json` (satu sumber kebenaran, juga dicatat di kartu karakter):

```json
{ "idle": [1, 0.95, 1, 0.987], "walk": [0.990], "jump": [1.032],
  "attack1": [1.059], "attack2": [1.075], "attack3": [0.974] }
```

```bash
$PY guide/tools/measure_head_scale.py <char_dir> --poses idle:4,walk:6,jump:4,attack1:4,attack2:4,attack3:4 \
    --rel-json rel.json --landmark white [--head-box x0,y0,x1,y1]
```

```
   attack1 0: kepala di atlas = 0.878 × idle  (skor 0.45)
   ...
              median 0.944 → PERLU KOREKSI; --rel baru 1.059
```

- Pengukuran di **gambar asli** (kepala ±120 px) dengan pencocokan **tepi** — di atlas kepala cuma ±20 px dan
  model memberi pencahayaan berbeda per strip, jadi pencocokan warna/siluet di atlas tidak bisa dipercaya.
- `--head-box`: kotak kepala di pose acuan (lihat tile TEMPLATE di `head-check.png`; harus berisi kepala saja).
- `--landmark white`: untuk karakter dengan bulu helm/rambut putih, mencegah kepala tertukar dengan bahu.
- **Wajib buka `head-check.png`.** Tiap kepala dikembalikan ke ukuran template memakai skala terbaca;
  kalau benar, semuanya sama besar. Kotak yang bukan kepala = "TIDAK VALID" → frame itu dinilai dengan
  median gerakannya, lalu dicek manual dengan perbandingan badan penuh berjajar (kaki di garis yang sama).
- Koreksi **per gerakan** (satu angka untuk satu strip), bukan per frame, kecuali frame idle yang jelas beda.

Jangan pakai registrasi siluet (`register_frames.py` tanpa `--dx-only`) untuk menilai skala pose aksi:
lutut ditekuk menurunkan kepala dan alat "membesarkan" karakter untuk mengejarnya; lengan/senjata juga
mengacaukan kecocokan. `register_frames.py` hanya untuk mencari **geser bulat** pada pose tegak.

## Perbaiki skala di gambar asli

```bash
# satu angka --rel = strip diperkecil utuh (aman walau pose di gambar asli saling menempel)
$PY guide/tools/rebuild_raw.py raw-original/attack1.png run/raw/attack1.png --poses 4 --rel 1.059
# angka per pose (khusus frame yang beda sendiri, mis. idle)
$PY guide/tools/rebuild_raw.py raw-original/idle.png run/raw/idle.png --poses 4 --rel 1,0.95,1,0.987
# pose saling menempel juga bisa: dipotong di titik sentuh, hanya pose dengan rel berbeda yang ditempel ulang
$PY guide/tools/rebuild_raw.py raw-original/combo3.png combo-run/raw/combo3.png --poses 6 --rel 1.143,1.143,1.143,1.143,1.143,1.223
sprite-gen extract --run-dir run --states idle,attack1
```

- `--rel` di `rel.json` selalu relatif terhadap **gambar asli** (bukan terhadap raw sebelumnya).
  `measure_head_scale.py` sudah memperhitungkan rel yang sedang dipakai dan mencetak `--rel baru`.
- Setelah extract ulang → ukur lagi sampai semua median 0.97–1.03 → **ukur ulang hitbox & titik efek** di game
  (lihat [sprite-runtime.md](sprite-runtime.md#hitbox-dari-data-bukan-tebakan)).

## Perbaiki goyang dengan geser bulat

```bash
$PY guide/tools/register_frames.py run walk --dx-only   # → dx bulat: 1,-5,-4,0,0,-4
$PY guide/tools/write_dx.py run walk 1,-5,-4,0,0,-4
sprite-gen compose-atlas --run-dir run
$PY guide/tools/measure_atlas.py run                    # harus SEMUA LOLOS
```

Geser bulat = piksel dipindah utuh, tanpa blur (sudah diverifikasi: selisih piksel ≤ 2/255).

## Yang TIDAK boleh dilakukan

| Jangan | Kenapa |
|---|---|
| Koreksi ukuran dengan `scale` di `curation.json` | Di-resample bicubic → frame itu sedikit buram → berkedip tajam/buram saat animasi |
| `dx`/`dy` pecahan (0.5, 1.5) | Sama: resample → buram sebelah |
| Mengecilkan tiap frame agar muat sel | Tiap frame dapat skala berbeda → karakter berdenyut. Perbesar sel |
| Memeriksa di `frames/` | Belum termasuk curation; yang dipakai game adalah atlas |
| Menilai hanya dengan mata di gambar diam | Selisih 2 px tidak terlihat di atlas, tapi terasa saat animasi |
| Menyembunyikan pose jelek dengan mengubah fps | Masalah tetap ada; generate ulang strip itu |
| Menganggap strip "sudah sama skala" karena pitch-nya sama | Pitch sama ≠ karakter sama besar; serangan bisa 6–15 % lebih kecil |
| Hanya mengecek idle & walk | Justru serangan/skill yang paling sering meleset (pose senjata terangkat) |
| Percaya angka alat tanpa membuka `head-check.png` | Alat bisa menangkap bahu/lambang sebagai "kepala" dan tetap mencetak angka |
