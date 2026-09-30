# RHEA — orrery kecil

RHEA adalah petarung Mecha keenam dan karakter kesembilan di roster: anak ajaib 14 tahun dengan harness orrery kuningan, dua cincin dan tiga bola planet di lengan engsel. Ia berasal dari 8 karakter showcase dan dibuat playable setelah ISOLDE. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/rhea/character.md.

## Dari showcase ke playable

Alurnya sama dengan ISOLDE ([isolde-reference.md](isolde-reference.md)). Body showcase v1 (sudah chibi) langsung menjadi base sprite (base-selected.png, job `7d4aafa4-898c-4cc4-b7f3-5ada55367b5a`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json RHEA ditandai `promoted`, jadi showcase kini berisi 3 karakter (semua Demi-Human). Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**, chroma hijau. Announcer tetap Grady. Alat pipeline: `tools/rhea_*.py`.

Filter keamanan provider menolak tiga strip v1 (crouch, hurt, recover) sebagai false positive. Kalimat aksinya diubah ke bentuk netral dan v2 langsung lolos; detail di qa-notes.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 170 px (sepatu sampai puncak cepol), lebar 118–119 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: drift (planet kecil), planet (planet raksasa bercincin), well (pusaran gravitasi), burst (ledakan bintang) |
| Audio | `select_rhea` "Rhea!" (0.993 s), `rhea_wins` "Rhea wins!" (1.306 s), Grady. Voice ultimate Chloe "Grand Orrery!" (1.306 s) |

Ukuran 170 px dipilih dari lineup 160/170/180/190 (size-candidates.png). Pada ukuran itu wajah setara NAJA dan badannya tetap kecil sesuai umur. Wrapper `RHEA_MANIFEST/METRICS` ada di [assets/rhea/manifest.js](../assets/rhea/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | ORBIT STRIKE: bola kuningan diayun maju, bola krem naik, tiga bola sejajar. Reach 100/85/115 di dalam bola terukur (109/80/128 px). Knockback 75/100/190 | 6/8/12 |
| I | PLANET DRIFT: planet kecil setinggi dada melayang 380 px/s selama 3.2 s (melintasi arena). Paling lambat di roster: RHEA bisa berjalan di belakangnya. Lompatan melewatinya | 16 / 3 s |
| O | GRAVITY WELL: pusaran terbuka 230 px di depan dan runtuh setelah 0.3 s, mengenai lawan di lantai dalam 95 px dari pusatnya (135–325 px dari RHEA). Lawan yang menempel atau jauh aman | 24 / 6 s |
| P | GRAND ORRERY: pose cast 0.5 s, tiga planet raksasa mengorbit RHEA | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [rhea.js](../rhea.js).

### Timeline Grand Orrery

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner burgundy/kuningan | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Planet 1 / 2 / 3 dilepas | 0.80 / 1.18 / 1.56 s dari titik 230 px di depan RHEA |
| Orbit | satu putaran elips 230×70 px mengelilingi RHEA dalam 0.9 s, mengikuti posisi RHEA; 16 damage, satu hit per planet |
| Selesai | setelah 2.6 s dan semua planet menyelesaikan putarannya |

Ketiga planet berjalan dengan fase yang sama dan dilepas 0.38 s berselang, lebih pendek dari stun 0.42 s, sehingga lawan yang diam di dalam orbit (depan atau belakang) terkena 48. Lawan yang menjaga jarak lebih dari ±260 px aman: ini ultimate zoner, bukan serangan pengejar. Tidak ada global hit-stop; knockback 40/40/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`orrery`) dan CPU (`enemyOrrery`) memiliki owner terpisah.

## CPU

- RHEA sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Planet Drift memakai jangkauan proyektil standar (560 px) karena ia melintasi arena.
- Benchmark (RHEA sebagai CPU): pemain diam K.O. dalam 17.6 / 16.7 / 19.2 / 15.8 s (Easy→Excellent); Hard lebih lambat dari Medium pada pemain diam (belum dianalisis). Proyektil yang mengenai CPU 52 / 42 / 41 / 30%. Detail di [cpu-ai.md](cpu-ai.md).

## Voice

"Grand Orrery!" digenerate dengan empat preset wanita muda: Pixie, Zoe, Chloe dan Gia. Chloe dipilih karena pitch mediannya paling tinggi (±390 Hz; Zoe ±299, Gia ±274, Pixie ±234) dengan take pendek (ucapan selesai 1.08 s), cocok untuk anak ajaib 14 tahun. Angka pitch hanya panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/rhea/audio/ultimate-candidates/` ke `rhea-ultimate.mp3`, lalu ganti `VOICE_NAMES.rhea` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `rhea` ke kontrak kit yang sama. RHEA memiliki `rheaStrike` (ayunan bola, planet melayang, pusaran) dan summon `startOrrery`/`updateOrrery` (dipilih lewat `startSummon`).
- Proyektil kini mendukung `inert` (menunggu di tempat lalu memanggil `wellBurst` saat habis) dan `orbit` (mengelilingi pemiliknya pada elips; `spent` setelah satu hit). Proyektil lama tidak berubah.
- Snapshot QA berisi `orrery`/`enemyOrrery`. Cut-in memakai kelas `.rhea-cutin`, art ui/cutin.png, dan judul GRAND ORRERY dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (12 × v1, 3 × v2); UI di ui-requests.json.
2. `tools/rhea_pipeline.py measure`, `tools/rhea_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/rhea_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/rhea/run --character-id rhea --base-image assets/rhea/base/base-selected.png --request assets/rhea/request.json --chroma-key #00FF00`, lalu `normalize` dan `extract`.
4. `tools/rhea_align.py`, lalu `publish`. Hitung emitter (ujung terjauh di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/rhea_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/rhea/run/qa-notes.md. Tes: `node tests/rhea.test.cjs` (13 tes).
