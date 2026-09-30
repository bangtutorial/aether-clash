# MIRA — pilot anak dan robot lilac

MIRA adalah petarung Mecha ketiga: anak perempuan sekitar 9 tahun yang duduk di kokpit terbuka robot telur lilac. Pemain dapat memilihnya di roster VS/Training dan Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/mira/character.md.

## Desain yang dipilih

Empat konsep base dibuat tanpa gambar roster lama (A Sunflower Brawler, B Lilac Candy Walker, C Scarlet Organ Knight, D Tangerine Twin-Stack). Pengguna memilih **B**: rambut twin tail pink dengan jepit bintang, headset berantena, jas hujan kuning lemon, robot telur lilac bersendi grafit dengan dua mata visor kuning, kepalan mitten dan dua pod roket drum. Base terpilih, job `0b3326ad-4c9b-4ff2-9a5e-ccce6ac2cebf`. Chroma hijau #00FF00 karena karakter memakai pink/ungu.

Keputusan model: pengguna meminta MIRA dibuat dengan **GPT Image 2.5 Sunburst**, termasuk portrait, ikon, cut-in dan VFX (acuan umum proyek memakai Seedream untuk UI art). Announcer tetap Grady.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 182 px termasuk antena |
| State | idle, walk, run, crouch, attack1–3, skill1–2, ultimate, hurt, down, recover masing-masing 4; jump/tuck masing-masing 1 |
| UI | portrait 384, cut-in 1600 lebar, 4 ikon 256, roster art |
| VFX | 4 PNG alpha: star, rocket, burst, crash |
| Audio | `select_mira` “Mira!”, `mira_wins` “Mira wins!” (Grady). Voice ultimate Luna “Rocket Parade!” — [mira-cora-voice.md](mira-cora-voice.md) |

Ukuran: versi awal 214 px membuat pilot terlihat seukuran orang dewasa di samping ARCO 180 dan FENR 194. Pengguna memilih **182 px** dari lineup 182/170/160; perubahan dilakukan dengan calibration target baru dari original yang sama, tanpa generate ulang. Wrapper `MIRA_MANIFEST/METRICS` ada di [assets/mira/manifest.js](../assets/mira/manifest.js). Sprite library memutar semua animasi 1×/0.5× dan kanan/kiri.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | MITTEN CHAIN: jab, hook, hammer dua kepalan (reach 100/85/82) | 6/8/12 |
| I | STAR POPPER: bintang dari telapak, 760 px/s; kontrol lepas saat bintang keluar | 16 / 3 s |
| O | CANDY CRASH: tackle dengan dash 240 px/s pada 20–60% aksi 0.68 s, reach 128 | 24 / 6 s |
| P | ROCKET PARADE: pose cast 0.5 s, 12 roket × 4 | 48 / 18 s |

Tiap basic hit valid mengembalikan 5% cooldown maksimum semua skill (I 0.15 s, O 0.30 s, P 0.90 s). HP tetap 200 dalam dua lapis. Semua nilai di [mira.js](../mira.js).

### Timeline Rocket Parade

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner lilac | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Peluncuran | 0.40 s + 0.05 s × n dari pod belakang/depan bergantian (posisi robot saat itu) |
| Tumbukan | 1.40 s + 0.032 s × n; semua 12 mendarat dalam satu jendela hurt |
| Selesai | 2.30 s |

Target dikunci saat cast: roket hanya melukai bila target berada di depan. Roket mengikuti target sampai 80% lintasan lalu terkunci. Setiap roket memberi satu hit, tanpa global hit-stop; guncangan dikurangi (0.3×) agar 12 hit tidak menjadi getaran panjang. Pause membekukan, reset/kembali menu/akhir ronde membatalkan. Formasi pemain dan CPU memiliki owner terpisah.

## Reproduksi

1. Prompt/job strip: strip-requests.json; UI: ui-requests.json; base: base-requests.json.
2. `tools/mira_pipeline.py measure|calibrate|normalize|extract|publish` dengan Python venv sprite-gen. `normalize` juga menerapkan cleanup.json.
3. `tools/mira_measure.py` untuk edge-NCC kepala pilot + mata visor; hasil di `assets/mira/qa/scale-measure.json` dan `scale-check.png`. Nilai terpilih di rel.json, alasannya di `qa/rel-decision.json`.
4. `tools/mira_align.py` menulis curation integer; `publish` menghasilkan atlas, metrics, playback, contact sheet dan wrapper JS.
5. `tools/mira_assets.py` mengekspor portrait/ikon/cut-in/VFX dan roster art.

Catatan QA dan batas bukti: assets/mira/run/qa-notes.md. Tes: `node tests/mira.test.cjs` (14 tes).
