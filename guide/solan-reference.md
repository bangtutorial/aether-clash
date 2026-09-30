# SOLAN — surai matahari

SOLAN adalah petarung Demi-Human keempat dan karakter kesepuluh di roster: manusia singa dengan surai saffron raksasa dan pedang besar baja. Ia berasal dari 8 karakter showcase dan dibuat playable setelah RHEA. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/solan/character.md.

## Dari showcase ke playable

Alurnya sama dengan RHEA ([rhea-reference.md](rhea-reference.md)). Body showcase chibi v2 langsung menjadi base sprite (base-selected.png, job `0e447e38-2109-4817-b778-06d3955118e0`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json SOLAN ditandai `promoted`, jadi showcase kini berisi 2 karakter (NIB, EDDA). Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**, chroma hijau. Announcer tetap Grady. Alat pipeline: `tools/solan_*.py`.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 176 px (sepatu sampai ujung pedang di bahu), lebar 153–155 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: crescent (gelombang bulan sabit), roar (gelombang auman tinggi), impact (hantaman lantai), sunburst (matahari saat mengaum) |
| Audio | `select_solan` "Solan!" (0.914 s), `solan_wins` "Solan wins!" (1.384 s, sunyi di akhir dipotong), Grady. Voice ultimate Xavier "Sunmane Roar!" (1.306 s) |

Ukuran 176 px dipilih dari lineup 176/188/200/212 (size-candidates.png). Pada ukuran itu wajah setara NAJA, dan surainya membuatnya tampak besar sesuai peran powerhouse. Wrapper `SOLAN_MANIFEST/METRICS` ada di [assets/solan/manifest.js](../assets/solan/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | SUNBLADE: tebasan mendatar, tebasan naik, belahan ke lantai. Reach 130/100/95 di dalam ujung pedang terukur (149/95/74 px). Knockback 90/120/230 | 6/8/12 |
| I | SOLAR CRESCENT: gelombang bulan sabit emas setinggi dada, 700 px/s, hilang setelah 480 px (jangkauan total ±590 px dari SOLAN) | 16 / 3 s |
| O | LEONINE LEAP: melompat maju (dash 420 px/s) lalu menghantam lantai 70 px di depan. Semua lawan di lantai dalam 120 px dari titik hantam terkena, tanpa perlu kontak | 24 / 6 s |
| P | SUNMANE ROAR: pose cast 0.5 s, tiga auman | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [solan.js](../solan.js).

### Timeline Sunmane Roar

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner saffron/umber | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Auman 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s dari posisi SOLAN saat itu |
| Gelombang | sepasang per auman (kiri dan kanan), 520 px/s, tinggi ±190 px (`tall`), hilang setelah 480 px; 16 damage, satu hit per gelombang |
| Selesai | setelah 2.6 s dan semua gelombang hilang |

Jarak antar auman 0.38 s, lebih pendek dari stun 0.42 s, sehingga lawan dalam ±480 px terkena 48, di depan maupun di belakang. Berbeda dari Forge Quake HALDOR, gelombang auman terlalu tinggi untuk dilompati; satu-satunya cara menghindar adalah menjauh sebelum auman. Tidak ada global hit-stop; knockback 50/50/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`sunroar`) dan CPU (`enemySunroar`) memiliki owner terpisah.

## CPU

- SOLAN sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Solar Crescent memakai `range` 480 untuk jangkauan CPU. CPU akan mencoba melompati gelombang auman seperti proyektil lain; itu tidak menolong, dan tes menguncinya.
- Benchmark (SOLAN sebagai CPU): pemain diam K.O. dalam 25.6 / 22.5 / 19.9 / 18.6 s (Easy→Excellent), turun rapi per level. Proyektil yang mengenai CPU 52 / 43 / 36 / 35%. Detail di [cpu-ai.md](cpu-ai.md).

## Voice

"Sunmane Roar!" digenerate dengan empat preset pria: Brooks, Marcus, Orion dan Xavier. Xavier dipilih karena take-nya paling pendek (ucapan selesai 1.03 s, yang lain 1.6–2.1 s) dengan pitch menengah-rendah (±142 Hz). Angka pitch hanya panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/solan/audio/ultimate-candidates/` ke `solan-ultimate.mp3`, lalu ganti `VOICE_NAMES.solan` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `solan` ke kontrak kit yang sama. SOLAN memiliki `solanStrike` (tebasan, gelombang, lompatan area) dan summon `startSunroar`/`updateSunroar` (dipilih lewat `startSummon`). Leonine Leap memakai jalur dash yang sama dengan FENR/MIRA/HALDOR/ISOLDE.
- Proyektil kini mendukung `tall`: toleransi vertikal tabrakan yang lebih besar, sehingga gelombang tidak bisa dilompati. Proyektil lama tidak berubah.
- Snapshot QA berisi `sunroar`/`enemySunroar`. Cut-in memakai kelas `.solan-cutin`, art ui/cutin.png, dan judul SUNMANE ROAR dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1); UI di ui-requests.json.
2. `tools/solan_pipeline.py measure`, `tools/solan_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/solan_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/solan/run --character-id solan --base-image assets/solan/base/base-selected.png --request assets/solan/request.json --chroma-key #00FF00`, lalu `normalize` dan `extract`.
4. `tools/solan_align.py`, lalu `publish`. Hitung emitter (ujung pedang di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/solan_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/solan/run/qa-notes.md. Tes: `node tests/solan.test.cjs` (13 tes).
