# ISOLDE — ksatria kaki bangau

ISOLDE adalah petarung Mecha kelima dan karakter kedelapan di roster: ksatria muda dengan prostetik kaki bangau perak dan tombak aether ramping. Ia berasal dari 8 karakter showcase dan dibuat playable setelah ZANNI. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/isolde/character.md.

## Dari showcase ke playable

Alurnya sama dengan HALDOR dan ZANNI ([zanni-reference.md](zanni-reference.md)). Body showcase chibi v2 langsung menjadi base sprite (base-selected.png, job `00d58d0c-5c3a-41d7-81bd-f463ae5bca82`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json ISOLDE ditandai `promoted`, jadi showcase kini berisi 4 karakter. Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**, chroma hijau. Announcer tetap Grady. Alat pipeline: `tools/isolde_*.py`.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 199 px (kaki sampai ujung tombak tegak), lebar 129–133 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: piercer (baut es), skyfall (tombak es raksasa), shatter (pecahan es di lantai), frost (jejak serbuan) |
| Audio | `select_isolde` "Isolde!" (0.679 s), `isolde_wins` "Isolde wins!" (1.489 s), Grady. Voice ultimate Vesper "Skyfall Lances!" (1.907 s, sunyi di awal dipotong) |

Ukuran 200 px dipilih dari lineup 200/212/224/236 (size-candidates.png). Pada ukuran itu wajah setara NAJA/ZANNI; tombak tegak membuatnya tokoh tertinggi di roster, sesuai desain "tallest, thinnest". Wrapper `ISOLDE_MANIFEST/METRICS` ada di [assets/isolde/manifest.js](../assets/isolde/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | LANCE LINE: tusukan lurus, sapuan naik, tusukan lunge. Reach 140/115/165 di dalam ujung tombak terukur (157/131/184 px); finisher terjauh di roster. Knockback 80/105/210 | 6/8/12 |
| I | SKY PIERCER: baut es dari tombak yang terangkat, lepas setinggi dada (105 px) dan naik 0.25 px per piksel maju (900 px/s). Mengenai lawan di darat sampai ±240 px, di atasnya lewat; lawan yang melompat terkena jauh lebih jauh. Anti-air | 16 / 3 s |
| O | STILT CHARGE: serbuan tombak di atas kaki bangau, dash 560 px/s (maju ±160 px), reach 150, knockback 300 | 24 / 6 s |
| P | SKYFALL LANCES: pose cast 0.5 s, tiga tombak es raksasa menukik dari langit | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [isolde.js](../isolde.js).

### Timeline Skyfall Lances

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner baja/biru es | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Panggilan 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s: tiap tombak muncul 520 px di atas dan 260 px di belakang kaki lawan saat itu |
| Tombak | 0.55 s menukik diagonal ke titik itu; kena saat melintas, atau pecahan es 70 px saat mendarat; 16 damage, satu hit per tombak |
| Selesai | setelah 2.4 s dan semua tombak mendarat |

Jarak antar panggilan 0.38 s, lebih pendek dari stun 0.42 s, sehingga lawan yang diam terkena 48 di mana pun ia berdiri, termasuk di belakang ISOLDE. Lompatan tidak menolong karena tombak datang dari atas; lawan yang terus berlari membuat tombak jatuh di belakangnya. Tidak ada global hit-stop; knockback 50/50/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`skyfall`) dan CPU (`enemySkyfall`) memiliki owner terpisah.

## CPU

- ISOLDE sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. `range` 240 membuat CPU hanya memakai Sky Piercer bila lawan cukup dekat.
- Benchmark (ISOLDE sebagai CPU): pemain diam K.O. dalam 21.3 / 15.5 / 19.4 / 18.5 s (Easy→Excellent). Medium lebih cepat dari Hard dan Excellent pada pemain diam; penyebabnya belum dianalisis. Proyektil yang mengenai CPU 54 / 45 / 14 / 42%.

## Voice

"Skyfall Lances!" digenerate dengan empat preset wanita: Elena, Vesper, Imogen dan Sloane (Soraya, Luna dan Anika sudah dipakai). Vesper dipilih karena rentang ucapannya paling pendek (±1.77 s) dengan frame bersuara terbanyak, yaitu penyampaian jernih dan tenang untuk ksatria. Jeda 0.18 s di awal dipotong. Take Imogen 4.3 s, terlalu panjang. Angka pitch hanya panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/isolde/audio/ultimate-candidates/` ke `isolde-ultimate.mp3`, lalu ganti `VOICE_NAMES.isolde` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `isolde` ke kontrak kit yang sama. ISOLDE memiliki `isoldeStrike` (tusukan, baut naik, serbuan) dan summon `startSkyfall`/`updateSkyfall` (dipilih lewat `startSummon`). Stilt Charge memakai jalur dash yang sama dengan FENR/MIRA/HALDOR.
- Proyektil kini mendukung `landY`: tombak yang mencapai lantai memanggil `lanceShatter` (pecahan es 70 px). Proyektil lama tidak berubah.
- Snapshot QA berisi `skyfall`/`enemySkyfall`. Cut-in memakai kelas `.isolde-cutin`, art ui/cutin.png, dan judul SKYFALL LANCES dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1); UI di ui-requests.json.
2. `tools/isolde_pipeline.py measure`, `tools/isolde_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/isolde_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/isolde/run --character-id isolde --base-image assets/isolde/base/base-selected.png --request assets/isolde/request.json --chroma-key #00FF00`, lalu `normalize` dan `extract`.
4. `tools/isolde_align.py`, lalu `publish`. Hitung emitter (ujung tombak di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/isolde_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/isolde/run/qa-notes.md. Tes: `node tests/isolde.test.cjs` (13 tes).
