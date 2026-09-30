# NAJA — kobra gurun demi-human

NAJA adalah petarung Demi-Human ketiga dan karakter kelima di roster: wanita kobra chibi dengan tudung pasir, ekor ular dan urumi (pedang-cambuk perak). Ia berasal dari 8 karakter showcase dan dibuat playable atas permintaan pengguna. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/naja/character.md.

## Dari showcase ke playable

Desain NAJA sudah disetujui sebagai karakter showcase chibi v2. Body showcase itu langsung dipakai sebagai base sprite (base-selected.png, job `6b2c99a8-1b5b-474a-aaed-799182c284c4`), sehingga art di roster sama dengan karakter yang bertarung. Avatar showcase dipakai sebagai portrait HUD tanpa generate ulang. Di roster.json NAJA ditandai `promoted`. `tools/showcase_assets.py` tetap mengekspor art/avatar-nya tetapi tidak lagi memasukkannya ke `showcase.js`, jadi showcase kini berisi 7 karakter.

Model: semua gambar baru (strip, cut-in, ikon, VFX) dibuat dengan **GPT Image 2.5 Sunburst**, sama seperti MIRA dan CORA. Announcer tetap Grady.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 182 px dari kaki sampai puncak tudung |
| State | idle, walk, run, crouch, attack1–3, skill1–2, ultimate, hurt, down, recover masing-masing 4; jump/tuck masing-masing 1 |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha: sandwave (proyektil lantai), cyclone (cincin urumi), ripple (riak pasir), serpent (kobra pasir 512 px) |
| Audio | `select_naja` “Naja!” (1.149 s), `naja_wins` “Naja wins!” (1.411 s), Grady. Voice ultimate Soraya “Dune Serpent!” (1.306 s) |

Wrapper `NAJA_MANIFEST/METRICS` ada di [assets/naja/manifest.js](../assets/naja/manifest.js). Sprite library memutar semua animasi dengan kecepatan 1× atau 0.5×, menghadap kanan maupun kiri. Ukuran 182 px dapat diubah hanya dengan calibration target baru dari original yang sama, tanpa generate ulang.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | VIPER LASH: lecutan, sapuan rendah, lecutan panjang. Reach 135/130/160 (terpanjang di roster; ujung urumi terukur 161/161/196 px). Rantai sedikit lebih lambat (0.38/0.44/0.56 s) sebagai kompensasi | 6/8/12 |
| I | SAND FANG: tepukan telapak mengirim gelombang pasir menyusur lantai, 620 px/s, umur 1.1 s. Kontrol lepas saat gelombang keluar. Lompatan kecil apa pun melewatinya | 16 / 3 s |
| O | URUMI CYCLONE: urumi berputar penuh, mengenai target di depan **atau** belakang sampai 150 px, knockback 260, tanpa dash | 24 / 6 s |
| P | DUNE SERPENT: pose cast 0.5 s, riak pasir memburu lawan, tiga semburan kobra × 16 | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill (I 0.15 s, O 0.30 s, P 0.90 s). HP tetap 200 dalam dua lapis. Semua nilai ada di [naja.js](../naja.js).

### Timeline Dune Serpent

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner teal/indigo/pasir | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Riak 1 keluar dari depan NAJA dan memburu | 0.10 s, 900 px/s (lebih cepat dari lari 520) |
| Riak terkunci / kobra menyembur | 0.83 → 1.25 s, 1.23 → 1.65 s, 1.63 → 2.05 s |
| Kolom kobra | radius hit 70 px, tinggi 240 px, terlihat 0.45 s |
| Selesai | 2.70 s |

Setiap riak baru mulai memburu dari posisi riak sebelumnya saat riak itu terkunci. Riak yang terkunci berhenti, menyala terang dan bergetar; itulah tanda untuk bergerak. Kolom kobra (240 px) lebih tinggi dari puncak double jump (±226 px), jadi melompat tidak cukup. Cara menghindar adalah keluar dari riak (>70 px) dalam 0.42 s setelah terkunci. Tes mengunci contoh ini: berjalan keluar menghindari gigitan pertama (32 damage, bukan 48), sedangkan lompatan tetap terkena 48. Target yang lebih jauh dari ±800 px lolos dari gigitan pertama (riak 1 menempuh ±660 px sebelum terkunci). Tidak ada global hit-stop; guncangan per gigitan 0.6×; knockback 60/60/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`serpent`) dan CPU (`enemySerpent`) memiliki owner terpisah.

## CPU

- NAJA sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Jangkauan cambuk membuatnya membuka rantai dari jarak ±145 px.
- Aturan baru untuk semua lawan CPU: saat riak Dune Serpent pemain terkunci di bawahnya, CPU keluar lewat sisi terdekat (menjauhi dinding) sampai kobra menyembur. Aturan ini dibaca setelah jeda `reaction` dan diputuskan sekali per gigitan dengan peluang `evade`. Excellent (reaksi 0.08 s) biasanya lolos; Easy (0.34 s) terlambat. Tes: minimal 4/6 untuk Excellent, 0/6 untuk Easy.
- Benchmark `node tools/cpu_bench.cjs <root>` (NAJA sebagai CPU): pemain diam K.O. dalam 23.4 / 19.9 / 16.0 / 15.7 s (Easy→Excellent), sejajar MIRA/CORA. Proyektil yang mengenai CPU 54 / 42 / 41 / 43%.

## Voice

**Soraya** (preset Higgsfield ElevenLabs `5c1d2f7f-cdb4-5b1d-bca9-156439e3275e`) dipilih sebagai rekomendasi: suara wanita rendah, gelap dan tenang yang cocok untuk penari kobra. Kalimatnya hanya nama jurus, “Dune Serpent!”, mengikuti permintaan pengguna agar voice ultimate cukup 1–2 kata. Take pertama berdurasi 1.306 s tanpa jeda di tengah, jadi dipakai apa adanya (salinan byte-identik, tanpa potong). Voice ini memakai kanal yang sama dengan Luna/Anika: dimulai saat serangan dibuat, selesai sendiri saat kobra masih menyerang, dan hanya diputar setelah ada interaksi pengguna. Record: generation.json. Untuk mengganti voice, generate ulang satu kalimat ini dengan preset lain, lalu ganti `NAJA_VOICE_PATH` dan `VOICE_NAMES.naja` di game.js.

## Integrasi engine

- `KITS` di game.js kini memetakan `mira`, `cora` dan `naja` ke kontrak kit yang sama (`start`, `move`, `refund`). NAJA memiliki fungsi strike sendiri (`najaStrike`: gelombang lantai, kilat urumi, cyclone dua arah) dan summon sendiri (`startSerpent`/`updateSerpent`/`drawSerpent`, dipilih lewat `startSummon`).
- Efek baru `whip` menggambar kilat urumi dari tangan ke ujung cambuk yang terukur. Efek `naja-fx` memakai sprite cyclone.
- Snapshot QA berisi `serpent`/`enemySerpent`. Cut-in memakai kelas `.naja-cutin`, art ui/cutin.png, dan judul DUNE SERPENT dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1, dibangun dari `request.json`); UI di ui-requests.json.
2. `sprite_gen.cli prepare --out-dir assets/naja/run --character-id naja --base-image assets/naja/base/base-selected.png --request assets/naja/request.json --chroma-key #00FF00`.
3. `tools/naja_measure.py` untuk edge-NCC wajah (utama) dan torso (pembanding); nilai terpilih di rel.json, alasannya di `qa/rel-decision.json`.
4. `tools/naja_pipeline.py calibrate|normalize|extract`, `tools/naja_align.py`, lalu `publish` (atlas, metrics, playback, contact sheet, wrapper JS). Emitter (ujung terjauh di frame 2, wilayah ujung 6 px) disimpan di `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/naja_assets.py` mengekspor portrait/ikon/cut-in/VFX.

Catatan QA dan batas bukti: assets/naja/run/qa-notes.md. Tes: `node tests/naja.test.cjs` (18 tes).
