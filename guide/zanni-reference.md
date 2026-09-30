# ZANNI — badut jam kuningan

ZANNI adalah petarung Mecha keempat dan karakter ketujuh di roster: badut commedia dell'arte dengan lengan bawah berupa kisi gunting kuningan yang bisa memanjang, bersenjata tiga cincin juggling bermata pisau. Ia berasal dari 8 karakter showcase dan dibuat playable setelah HALDOR. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/zanni/character.md.

## Dari showcase ke playable

Alurnya sama dengan NAJA dan HALDOR ([haldor-reference.md](haldor-reference.md)). Body showcase chibi v2 langsung menjadi base sprite (base-selected.png, job `c90ac556-95c7-41db-a3ce-14ba5b331656`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json ZANNI ditandai `promoted`, jadi showcase kini berisi 5 karakter. Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**. Announcer tetap Grady.

Berbeda dari HALDOR, semua strip dan FX ZANNI memakai chroma **magenta** (#FF00FF), karena paletnya chartreuse. Alat pipeline HALDOR disalin menjadi `tools/zanni_*.py` dengan kunci magenta.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 176 px (kaki sampai puncak topi), lebar 134–143 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: ring (cincin Ring Toss), bigring (cincin raksasa Grand Finale), snatch (ledakan tarikan), confetti (tebasan confetti saat melempar) |
| Audio | `select_zanni` "Zanni!" (1.149 s), `zanni_wins` "Zanni wins!" (1.489 s, sunyi di akhir dipotong), Grady. Voice ultimate Julian "Grand Finale!" (1.071 s) |

Ukuran 176 px dipilih dari lineup 176/188/200/212 (size-candidates.png). Pada ukuran itu wajah setara NAJA/CORA, sedangkan topi tiga cabang membuatnya tampak setinggi roster lain. Wrapper `ZANNI_MANIFEST/METRICS` ada di [assets/zanni/manifest.js](../assets/zanni/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | SCISSOR JAB: jab, uppercut, jab ganda dengan lengan gunting yang memanjang. Reach 125/100/140 mengikuti ujung lengan terukur (144/110/161 px). Rantai cepat (0.36/0.42/0.54 s), knockback 70/95/190 | 6/8/12 |
| I | RING TOSS: cincin bermata terbang lurus setinggi tangan (820 px/s), berbalik setelah 430 px dan kembali ke tangan ZANNI. Kena sekali, saat pergi atau saat pulang. Kontrol lepas saat cincin keluar | 16 / 3 s |
| O | SPRING SNATCH: lengan gunting memanjang sampai 200 px dan menarik lawan ke 95 px di depan ZANNI, siap untuk jab | 24 / 6 s |
| P | GRAND FINALE: pose cast 0.5 s, tiga cincin raksasa dilempar ke depan | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [zanni.js](../zanni.js).

Ring Toss adalah proyektil bumerang pertama. Lompatan melewati cincin yang pergi, tetapi cincin yang pulang masih bisa mengenai lawan yang mendarat di jalurnya. Cincin yang sudah mengenai (`spent`) tetap terbang pulang tanpa bisa mengenai lagi. Spring Snatch tidak mendorong lawan yang sudah lebih dekat dari 95 px.

### Timeline Grand Finale

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner chartreuse/arang | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Lemparan 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s dari tangan ZANNI, setinggi dada |
| Cincin | 980 px/s ke tepi arena, lalu pulang ke ZANNI; 16 damage, satu hit per cincin |
| Selesai | setelah 2.3 s dan semua cincin kembali |

Jarak antar lemparan 0.38 s, lebih pendek dari stun 0.42 s, sehingga lawan yang diam di depan terkena 48. Lawan di belakang ZANNI saat lemparan aman. Tidak ada global hit-stop; knockback 50/50/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`finale`) dan CPU (`enemyFinale`) memiliki owner terpisah. Cincin memakai jalur proyektil biasa, jadi CPU yang membaca proyektil otomatis mencoba melompatinya.

## CPU

- ZANNI sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`.
- `cpuReach` kini memakai `range` sebuah proyektil bila ada, jadi CPU ZANNI melempar Ring Toss dari jarak 430 px, bukan 560.
- Benchmark (ZANNI sebagai CPU): pemain diam K.O. dalam 21.2 / 19.7 / 16.7 / 15.7 s (Easy→Excellent), sejajar MIRA/CORA/NAJA. Proyektil yang mengenai CPU 52 / 42 / 42 / 33%. Detail di [cpu-ai.md](cpu-ai.md).

## Voice

"Grand Finale!" digenerate dengan empat preset pria: Jasper, Benji, Caspian dan Julian. Julian dipilih karena pitch median bersihnya paling tinggi (±200 Hz, Jasper ±163, Benji ±178; estimasi Caspian tidak andal), cocok untuk badut yang ringan dan jahil, dengan take pendek 1.07 s. Angka pitch berasal dari estimasi autokorelasi sederhana dan hanya menjadi panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/zanni/audio/ultimate-candidates/` ke `zanni-ultimate.mp3`, lalu ganti `VOICE_NAMES.zanni` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `zanni` ke kontrak kit yang sama. ZANNI memiliki `zanniStrike` (jab, bumerang, tarikan) dan summon `startFinale`/`updateFinale` (dipilih lewat `startSummon`).
- Proyektil kini mendukung `boomerang` (berbalik setelah `range` px dan pulang ke pemiliknya), `spent` (satu hit) dan `spin` (rotasi gambar). Proyektil lama tidak berubah.
- Snapshot QA berisi `finale`/`enemyFinale`. Cut-in memakai kelas `.zanni-cutin`, art ui/cutin.png, dan judul GRAND FINALE dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1); UI di ui-requests.json.
2. `tools/zanni_pipeline.py measure`, `tools/zanni_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/zanni_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/zanni/run --character-id zanni --base-image assets/zanni/base/base-selected.png --request assets/zanni/request.json --chroma-key #FF00FF`, lalu `normalize` dan `extract`.
4. `tools/zanni_align.py`, lalu `publish`. Hitung emitter (ujung terjauh di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/zanni_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/zanni/run/qa-notes.md. Tes: `node tests/zanni.test.cjs` (14 tes).
