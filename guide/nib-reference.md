# NIB — kurir atap

NIB adalah petarung Demi-Human kelima dan karakter kesebelas di roster: bocah tikus kurir dengan dua tongkat pendek dan tas surat besar, petarung terkecil dan tercepat. Ia berasal dari 8 karakter showcase dan dibuat playable setelah SOLAN. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/nib/character.md.

## Dari showcase ke playable

Alurnya sama dengan SOLAN ([solan-reference.md](solan-reference.md)). Body showcase v1 (sudah chibi) langsung menjadi base sprite (base-selected.png, job `ccd7d47b-e244-4c21-abc5-91cb2a68cddb`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json NIB ditandai `promoted`, jadi showcase kini tinggal EDDA. Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**, chroma hijau. Announcer tetap Grady. Alat pipeline: `tools/nib_*.py`.

Filter keamanan provider menolak idle dan run v1 sebagai false positive; usia numerik dihapus dari identitas dan v2 langsung lolos (qa-notes).

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 150 px (sepatu sampai puncak telinga), lebar 120–126 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: letter (surat bersegel), plane (pesawat kertas), slip (kilatan selinap), stamp (cap segel saat melepas pesawat) |
| Audio | `select_nib` "Nib!" (0.914 s), `nib_wins` "Nib wins!" (1.411 s), Grady. Voice ultimate Evan "Special Delivery!" (1.254 s, sunyi di akhir dipotong) |

Ukuran 150 px dipilih dari lineup 140/150/160/170 (size-candidates.png). Pada ukuran itu wajah setara RHEA dan NIB tetap yang terkecil. Wrapper `NIB_MANIFEST/METRICS` ada di [assets/nib/manifest.js](../assets/nib/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | BATON FLURRY: jab, ayunan naik, tongkat ganda. Rantai tercepat di roster (0.30/0.34/0.46 s); reach 95/75/95 di dalam ujung tongkat (107/80/101 px); knockback kecil 55/75/170 agar tetap dekat | 6/8/12 |
| I | EXPRESS LETTER: surat bersegel dilempar datar setinggi dada, 1100 px/s (tercepat di roster), hilang setelah 400 px | 16 / 3 s |
| O | ROOFTOP SLIP: dash rendah 650 px/s, reach 100. Bila mengenai, NIB menyelinap 70 px ke belakang lawan dan berbalik menghadapnya (dash berhenti) | 24 / 6 s |
| P | SPECIAL DELIVERY: pose cast 0.5 s, tiga pesawat kertas homing | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [nib.js](../nib.js).

### Timeline Special Delivery

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner biru langit | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Pesawat 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s dari tas NIB, meluncur naik lalu berbelok ke dada lawan |
| Pesawat | 620 px/s, belok maks 3.2 rad/s, hilang setelah 2.2 s; 16 damage, satu hit per pesawat |
| Selesai | setelah 2.6 s dan semua pesawat habis |

Pesawat dilepas 0.38 s berselang, lebih pendek dari stun 0.42 s, sehingga lawan yang diam terkena 48 di mana pun ia berdiri, termasuk di belakang NIB. Karena beloknya terbatas, lompatan saat pesawat tinggal ±100 px membuatnya meleset (tes: 2 dari 3 lolos); lompatan lebih awal atau berlari tetap terkejar. Tidak ada global hit-stop; knockback 40/40/180. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`delivery`) dan CPU (`enemyDelivery`) memiliki owner terpisah.

## CPU

- NIB sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Express Letter memakai `range` 400 untuk jangkauan CPU.
- Benchmark (NIB sebagai CPU): pemain diam K.O. dalam 17.9 / 17.2 / 12.1 / 12.7 s (Easy→Excellent), tercepat di roster pada Hard dan Excellent karena rantainya tercepat. Proyektil yang mengenai CPU 52 / 42 / 34 / 31%. Detail di [cpu-ai.md](cpu-ai.md).

## Voice

"Special Delivery!" digenerate dengan empat preset pria muda: Cody (job gagal di provider), Evan, Ian dan Kevin. Evan dipilih karena pitch mediannya paling tinggi (±267 Hz; Kevin ±227, Ian ±192), paling muda untuk kurir kecil. Ucapan selesai 1.02 s, jadi sunyi di akhir dipotong (1.254 s). Angka pitch hanya panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/nib/audio/ultimate-candidates/` ke `nib-ultimate.mp3`, lalu ganti `VOICE_NAMES.nib` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `nib` ke kontrak kit yang sama. NIB memiliki `nibStrike` (tongkat, surat, selinap) dan summon `startDelivery`/`updateDelivery` (dipilih lewat `startSummon`). Rooftop Slip memakai jalur dash yang sama dengan FENR/MIRA/HALDOR/ISOLDE/SOLAN, lalu memindahkan NIB ke belakang lawan.
- Proyektil kini mendukung `homing` (belok ke dada lawan dengan batas `turn` rad/s, kecepatan `speedH`). Proyektil lama tidak berubah.
- Snapshot QA berisi `delivery`/`enemyDelivery`. Cut-in memakai kelas `.nib-cutin`, art ui/cutin.png, dan judul SPECIAL DELIVERY dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (13 × v1, 2 × v2); UI di ui-requests.json.
2. `tools/nib_pipeline.py measure`, `tools/nib_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/nib_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/nib/run --character-id nib --base-image assets/nib/base/base-selected.png --request assets/nib/request.json --chroma-key #00FF00`, lalu `normalize` dan `extract`.
4. `tools/nib_align.py`, lalu `publish`. Hitung emitter (ujung tongkat di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/nib_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/nib/run/qa-notes.md. Tes: `node tests/nib.test.cjs` (13 tes).
