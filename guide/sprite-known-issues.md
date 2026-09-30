# Masalah yang Pernah Terjadi & Solusinya

Untuk keputusan gameplay dan format terbaru lihat [gameplay-standard.md](gameplay-standard.md) dan [character-workflow.md](character-workflow.md). Kasus lama tetap berguna sebagai diagnosis; angka koreksinya bukan preset karakter baru.

Format: **gejala → penyebab → solusi → pencegahan**. Tambahkan entri baru setiap menemukan masalah baru,
lalu tambahkan pencegahannya ke checklist di [sprite-qa.md](sprite-qa.md).

---

## 1. Saat diam, satu frame terlihat lebih besar

- **Gejala:** karakter "membesar" sekali tiap siklus idle.
- **Penyebab:** model gambar menggambar satu pose ~5 % lebih besar (78×149 px vs 74×142 px). Extractor hanya
  menyamakan posisi kaki, tidak menyamakan skala antar frame.
- **Solusi:** ukur dengan `measure_head_scale.py` (kepala, di gambar asli), lalu `rebuild_raw.py --rel`
  (koreksi per pose di gambar asli), extract ulang.
- **Pencegahan:** prompt idle berisi "all at the same scale", "feet planted in the same place";
  checklist: skala ±1 %.

## 2. Setelah diperbaiki, frame yang dikoreksi terlihat sedikit buram / animasi berkedip

- **Gejala:** ukuran sudah sama tapi animasi terasa "kejut-kejut"; sebagian frame kurang tajam.
- **Penyebab:** koreksi dilakukan dengan `scale` (dan `dx` pecahan) di `curation.json`. Transform ini
  me-resample frame dengan bicubic → frame yang dikoreksi lebih lembut dari yang tidak.
- **Solusi:** hapus transform skala dari curation; koreksi skala di `rebuild_raw.py` (satu resample dari
  gambar asli); curation hanya berisi `dx` bulat.
- **Pencegahan:** aturan "curation hanya geser bulat" (sprite-qa.md → Yang TIDAK boleh dilakukan).

## 3. Saat berjalan badan goyang maju-mundur (glitch)

- **Gejala:** kepala/badan meloncat ±6 px tiap langkah.
- **Penyebab:** penyelarasan `foot-centroid` menaruh titik tengah **kaki** di tengah sel. Saat kaki melebar
  vs merapat, titik itu berpindah → badan ikut berpindah.
- **Solusi:** `register_frames.py run walk --dx-only` → `write_dx.py` (sejajarkan badan atas ke idle).
- **Pencegahan:** untuk walk/run selalu jalankan registrasi dx; checklist torso_x ±1.5 px.

## 4. Karakter mengecil saat mulai berjalan

- **Gejala:** transisi idle → walk terlihat "zoom out".
- **Penyebab:** strip walk digambar lebih kecil oleh model; normalisasi pitch tidak sempurna (sisa ~4.5 %).
- **Solusi:** ukur dengan `measure_head_scale.py` → median skala → `rebuild_raw.py --rel`.
  ⚠ Koreksi pertama memakai registrasi siluet (1.045) dan ternyata **berlebihan** — walk jadi ±6 % lebih
  besar dari idle (lihat #12). Nilai yang benar setelah diukur lewat kepala: 0.990.
- **Pencegahan:** setiap gerakan diukur terhadap **idle frame 0** lewat kepala, bukan siluet.

## 5. Ukuran karakter berbeda-beda antar gerakan

- **Gejala:** walk jauh lebih kecil dari idle, attack lebih besar, dst.
- **Penyebab:** tiap strip hasil generate punya skala sendiri (idle 860 px, walk 675 px tinggi).
- **Solusi:** normalisasi per strip dengan pitch (`0.5 / pitch`) — sudah otomatis di `rebuild_raw.py`.

## 6. Extractor: `pitch disagreement … detect 1.00x1.00` dan frame dikecilkan paksa

- **Penyebab:** gambar AI adalah pixel art "palsu" (tidak ada grid asli), sementara mode `pixel-unfake` aktif;
  dan sel terlalu kecil untuk resolusi asli.
- **Solusi:** `--no-fit-pixel-unfake`, perkecil strip dulu (langkah normalisasi), pakai sel yang cukup besar.

## 7. Warning `native logical exceeds the physical cap … capped frames`

- **Penyebab:** pose tidak muat di sel → dikecilkan **per frame** → skala tidak konsisten.
- **Solusi:** perbesar sel (`--cell-width/--cell-height`) sampai warning hilang. Jangan diabaikan.

## 8. Model tidak bisa membuat strip selebar layout guide

- **Gejala:** layout guide 768×160 (4.8:1), model maksimal 21:9.
- **Solusi:** gambar ulang guide di rasio yang didukung dengan jumlah slot sama. Extractor memisahkan pose
  per komponen, jadi rasio strip tidak harus sama dengan sel.

## 9. `rebuild_raw.py`: "ditemukan X pose, harusnya N"

- **Penyebab:** dua pose saling menempel (pedang/jubah menyentuh tetangga) atau ada efek lepas.
- **Solusi:** generate ulang strip itu dengan persen tinggi lebih kecil dan "clear gap between poses".

## 10. Makhluk terbang: posisi melompat-lompat antar frame kepak sayap

- **Gejala:** naga/burung "meloncat" naik-turun 30–90 px saat sayap turun.
- **Penyebab:** tidak ada kaki untuk dijadikan anchor, dan registrasi siluet penuh tertipu sayap
  (sayap adalah bagian terbesar dan bergerak paling jauh; IoU hanya 0.4–0.5).
- **Solusi:** sejajarkan dengan bagian yang memang diam di gerakan itu:
  - kepak sayap / hover → **ujung moncong** (titik paling kanan di 45 % atas siluet) atau kepala
  - serangan yang menggerakkan kepala (semburan) → **badan/perut** (kotak tengah siluet), IoU harus ≥ 0.85
  - tetap geser **bulat** saja. Goyang naik-turun (bob) ditambahkan di kode game, bukan dari sprite.
- **Pencegahan:** di prompt tulis bagian mana yang harus diam ("head and neck stay steady").

## 11. Sayap / ekor terpotong di tepi sel setelah digeser

- **Penyebab:** geser (curation) memindahkan frame di dalam sel; sel yang pas-pasan jadi terlalu kecil.
- **Solusi:** perbesar sel lalu extract + compose ulang. Cek: tidak ada piksel alpha di baris/kolom tepi sel.
- **Pencegahan:** ukuran sel = pose terbesar + jangkauan geser terbesar + margin.

## 12. Karakter mengecil setiap menyerang / memakai skill, lalu "membesar" lagi saat diam

- **Gejala:** kepala dan badan terlihat lebih kecil selama serangan/skill; begitu kembali ke idle/jalan,
  karakter seperti membesar. Paling terasa di frame pedang terangkat (dipakai berkali-kali oleh skill).
- **Penyebab:**
  1. Normalisasi skala hanya memakai **pitch** (ukuran pixel palsu). Model menggambar strip serangan dengan
     pitch yang sama tapi karakter **lebih kecil** (±6–15 %) — supaya senjata yang terangkat muat di slot.
  2. Cek skala sebelumnya hanya dilakukan untuk idle & walk. Gerakan aksi tidak pernah diukur.
  3. Walk malah dikoreksi berlebihan (+4.5 %) karena registrasi siluet: hasilnya walk ±6 % lebih besar dari idle.
     Transisi serang (kecil) → jalan (besar) memperparah kesan "membesar".
- **Kenapa sulit diukur:** tinggi & siluet berubah karena pose (lutut ditekuk, lengan & pedang), pencocokan
  warna gagal karena tiap strip diberi pencahayaan berbeda, dan di atlas kepala hanya ±20 px.
- **Solusi:** `measure_head_scale.py` — cocokkan **tepi helm** di **gambar asli** untuk setiap frame semua
  gerakan terhadap idle frame 0 → median per gerakan → `rebuild_raw.py --rel` → extract → ukur lagi →
  ukur ulang hitbox & titik efek. Hasil kasus ini: walk 1.056→1.00, jump 0.97→1.00, attack1 0.94→1.00,
  attack2 ~0.93→1.015, attack3 1.03→1.00.
- **Pencegahan:** checklist "Skala antar gerakan — SEMUA gerakan" di sprite-qa.md; `rel.json` per karakter;
  setiap gerakan baru wajib diukur terhadap idle sebelum dipakai.

## 13. Gerakan yang ditambah belakangan skalanya jauh berbeda

- **Gejala:** gerakan baru (mis. "hurt" yang dibuat setelah gerakan lain selesai) tampil ±30 % lebih kecil.
- **Penyebab:** tiap generate adalah undian baru; strip baru tidak "ingat" ukuran strip lama walau base sama.
- **Solusi:** gerakan baru diperlakukan sama seperti yang pertama — `measure_head_scale.py` terhadap idle frame 0
  (pakai `rel.json` + `--head-box` dari kartu karakter) → `rebuild_raw.py --rel` → tambah state ke
  `sprite-request.json` → extract → compose.
- **Pencegahan:** simpan `--head-box`, `--landmark`, `--target`, dan `rel.json` di kartu karakter supaya pengukuran
  gerakan baru tinggal dijalankan ulang.

## 14. Pose jatuh / rebahan tidak bisa diukur lewat kepala

- **Gejala:** `head-check.png` untuk strip "down"/"knockdown" berisi lengan atau senjata, bukan kepala.
- **Penyebab:** kepala miring atau terbalik; template kepala tegak tidak cocok.
- **Solusi:** pakai `rel` dari strip lain dengan pitch sama yang terbukti pas, lalu cek visual: jajarkan frame jatuh
  di samping idle (ukuran badan, lebar bahu, panjang kaki harus sebanding).

## 15. Jalan terlihat "berselancar": kaki tidak pernah bergantian

- **Gejala:** karakter bergerak tapi kakinya seperti meluncur; di setiap frame kaki yang sama selalu di belakang.
- **Penyebab (dua sekaligus):**
  1. **Sprite salah dari generate:** model menggambar 6 pose dengan kaki terbuka yang mirip-mirip, tanpa pose
     "melintas" (kaki merapat saat satu kaki mengayun melewati yang lain). Tidak ada frame yang duplikat persis,
     jadi tidak tertangkap cek duplikat.
  2. **Animasi tidak sinkron dengan gerak:** fps tetap (9) sementara badan bergerak 95 px/s → kaki "menempuh"
     ±312 px/s, badan hanya 95 → kaki meluncur.
- **Deteksi:** `measure_atlas.py` sekarang mengukur **jarak kaki per frame** untuk walk/run. Siklus benar: lebar →
  rapat → lebar → rapat (rasio terkecil/terbesar ≤ 0.45). Kasus ini: `[93, 62, 78, 88, 69, 83]` rasio 0.67 ✗;
  setelah diperbaiki `[102, 31, 38, 106, 31, 43]` rasio 0.29 ✓.
- **Solusi sprite:** generate ulang dengan prompt yang **menyebut kaki mana di depan tiap frame** dan bahwa kaki
  **bersilang di frame melintas**, plus lampirkan strip walk karakter lain yang sudah benar sebagai **referensi
  gerakan saja** (lihat [sprite-prompts.md](sprite-prompts.md)). Strip baru tetap diukur skalanya (kasus ini: 7 % kecil).
- **Solusi game:** kecepatan animasi dihitung dari jarak tempuh, bukan fps tetap — lihat
  [sprite-runtime.md](sprite-runtime.md#kecepatan-animasi).

## 16. Hasil jalan masih sedikit "kejut" setelah skala & posisi benar

- **Penyebab:** pose kaki hasil generate memang tidak sempurna berurutan (bukan masalah ukuran).
- **Solusi:** generate ulang strip walk 2–3 kali, pilih yang paling halus; atau buang/ulang frame lewat
  curation (`selected`/`order`). Tidak bisa diperbaiki dengan skala/geser.

## 17. Frame terakhir serangan/kombo lebih kecil → karakter "membesar" saat kembali ke idle

- **Gejala:** median skala gerakan sudah lolos (1.00), tapi di game pada perpindahan frame terakhir serangan
  → idle, karakter terlihat membesar sedikit dan bergeser beberapa piksel.
- **Penyebab:** koreksi `--rel` satu angka per strip memakai **median** semua frame. Model tetap menggambar tiap
  pose dengan ukuran/proporsi sedikit berbeda; kebetulan frame terakhir (pose kembali siaga) lebih kecil.
  Contoh nyata (kombo knight): median strip 1.000, tapi frame terakhir kepala ±0.96, dan pose berdiri tegak
  11 px lebih pendek dari idle (helm→sabuk 55 vs 58 px), badan bergeser 1–7 px.
- **Kenapa lolos QA:** median menyembunyikan satu frame yang meleset; frame putar/menunduk tidak terukur
  sehingga frame terakhir tidak mendapat perhatian khusus.
- **Solusi:** ukur **frame pertama & terakhir** tiap serangan langsung terhadap idle frame 0 di atlas
  (ukuran kepala + tinggi helm→sabuk untuk pose tegak) → koreksi **per pose** hanya untuk frame itu
  (`rebuild_raw.py --rel 1.143,1.143,1.143,1.143,1.143,1.223`) → geser bulat supaya posisi kepala sama dengan
  idle (`write_dx.py … 0,0,0,0,0,1`) → extract → compose → cek ulang berdampingan dengan idle.
  Hasil kasus ini: kepala 0.96 → 0.99 (= idle), combo3 f5 helm 130 → 139 px (idle 141), posisi kepala ±0 px.
- **Catatan alat:** pose di strip kombo saling menempel (ujung pedang menyentuh jubah tetangga).
  `rebuild_raw.py` sekarang memotong di kolom tersentuh-tipis, lalu **hanya** pose yang dikoreksi ditempel ulang;
  strip lainnya tetap di-resize utuh (versi lama menata ulang semua pose → pedang tetangga terbelah).
- **Pencegahan:** checklist "Frame sambungan" di sprite-qa.md.

## 18. Kepala sudah lolos tetapi badan aksi masih tampak mengecil

- Penyebab: luas rambut/median kepala tidak menangkap pemendekan torso atau kaki, terutama recovery dan ultimate.
- Perbaikan: bandingkan tubuh utuh pada garis kaki sama; ukur crown→sabuk dan sabuk→kaki. Koreksi secukupnya dari original atau regenerate proporsi yang salah. Jangan membesarkan atlas per frame.
- ARCO membutuhkan perbaikan body presence dan ultimate upright baru; hasil rambut saja tidak cukup sebagai bukti.

## 19. Jump ramai, kaku, atau mengecil sesudah double jump

- Empat pose jump lama memutar crouch ketika karakter sudah airborne; setelah double jump timer berakhir, animasi mengulang crouch dari awal.
- Satu pose pengganti yang terlalu mirip berdiri juga ditolak karena kaku. Solusi final: satu pose jump atletis dengan siku/lutut menekuk, ditahan sepanjang lintasan fisika.
- Double jump menggunakan satu tuck yang benar-benar diputar360°/0,28 s, bukan pose menendang. Keluar dari roll langsung ke jump, dengan pivot terukur.

## 20. Summon selesai menembak baru karakter bisa bergerak

- Penyebab: durasi pose cast disamakan dengan umur seluruh efek.
- Solusi: cast ultimate ARCO0,50 s terpisah dari drone 2,85 s; I melepas karakter saat peluru keluar. Drone/peluru tidak memakai global hit-stop untuk pemiliknya.

## 21. Cutout prop tampak kecil dan muzzle meleset

- Satu piksel liar di(0,0) ikut memperbesar bbox drone walaupun hampir tidak tampak. Resize ke112 px lalu membuat objek utama terlalu kecil.
- Solusi: periksa komponen alpha, ambil bbox komponen utama yang benar dengan padding aman, lalu resize sekali dari cutout resolusi asli. Ukur muzzle di output final.
- Jangan memakai pusat gambar sebagai nozzle; wing/ekor dapat menggeser center bbox.

## 22. HP dua lapis salah ditafsirkan

- Damage trail dan dua baris vertikal bukan yang diminta pengguna.
- Solusi final: satu track, dua fill bertumpuk pada koordinat yang sama; setiap fill mewakili 100HP nyata. Warna depan terkikis lalu reserve. Total200HP, KO hanya pada 0.
- Ultimate tidak memaksa KO atau mengosongkan bar. Nilai final damage ada di gameplay-standard.

## 23. Asap lari terus keluar saat tertahan

- Penyebab: emisi berbasis waktu atau status tombol, tanpa memeriksa jarak yang benar-benar ditempuh.
- Solusi: emisi tiap 30 px perjalanan di tanah saat state run. Jangan memunculkan asap saat walk/jump atau ketika collision membuat posisi tidak bergerak. Soft gradient harus mengikuti bentuk puff agar tidak menjadi lingkaran keras seperti gelembung.
