# HALDOR — tank tungku berjalan

HALDOR adalah petarung Mecha ketiga dan karakter keenam di roster: pandai besi tua dalam exoframe tungku uap tembaga, bersenjata palu tempa berkepala landasan. Ia berasal dari 8 karakter showcase dan dibuat playable setelah NAJA. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/haldor/character.md.

## Dari showcase ke playable

Alurnya sama dengan NAJA ([naja-reference.md](naja-reference.md)). Body showcase chibi v2 langsung menjadi base sprite (base-selected.png, job `0f826aeb-57af-4a07-ac46-30dec1e4c6bd`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json HALDOR ditandai `promoted`, jadi showcase kini berisi 6 karakter. Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**. Announcer tetap Grady.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 169 px (kaki sampai bibir cerobong), lebar 164–169 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | 4 PNG alpha 256: slag (bola terak), splash (percikan lelehan), steam (semburan uap), quake (gelombang batu lava) |
| Audio | `select_haldor` “Haldor!” (1.149 s), `haldor_wins` “Haldor wins!” (1.306 s), Grady. Voice ultimate Gideon “Forge Quake!” (1.228 s) |

Ukuran 168 px (hasil 169) dipilih dari lineup 160/168/176/184 (size-candidates.png). Pada ukuran itu kepala dengan jenggot setara NAJA/CORA, sedangkan badannya paling lebar di roster, sesuai peran tank. Wrapper `HALDOR_MANIFEST/METRICS` ada di [assets/haldor/manifest.js](../assets/haldor/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | FORGE CHAIN: hook, uppercut, smash landasan ke lantai. Reach 112/90/95 mengikuti kepala palu terukur (131/83/85 px). Rantai paling lambat (0.42/0.48/0.62 s) dengan knockback terbesar (95/125/235) | 6/8/12 |
| I | SLAG SHOT: bola terak dilempar melambung ke tempat lawan berdiri saat lemparan (180–560 px di depan), waktu terbang 0.9 s, puncak ±200 px di atas lantai. Kena langsung saat melintas atau memercik 72 px saat mendarat. Kontrol lepas saat bola keluar | 16 / 3 s |
| O | STEAM RAM: serudukan bahu, dash 340 px/s (maju ±100 px), reach 118, knockback 320 | 24 / 6 s |
| P | FORGE QUAKE: pose cast 0.5 s, tiga hantaman di kawah depan HALDOR | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [haldor.js](../haldor.js).

Slag Shot berbeda dari proyektil lain: bola jatuh di bawah gravitasi, jadi tidak bisa dilompati. Cara menghindarnya adalah berpindah tempat setelah lemparan. Pada jarak dekat (<±180 px) bola bisa mengenai badan saat masih naik, seperti lemparan jarak dekat.

### Timeline Forge Quake

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner tembaga/bara | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Hantaman 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s di kawah 70 px di depan HALDOR |
| Gelombang | sepasang per hantaman (kiri dan kanan), 760 px/s sepanjang lantai, 16 damage, satu hit per gelombang |
| Selesai | 2.20 s (gelombang terakhir terus berjalan sampai keluar layar) |

Jarak antar hantaman 0.38 s, lebih pendek dari stun 0.42 s, sehingga lawan yang diam terkena 48. Satu lompatan (0.57 s di udara) melewati dua gelombang. Lompatan yang tepat waktu ditambah double jump melewati ketiganya; tes mengunci kedua contoh (184 dan 200 HP). Gelombang berjalan ke dua arah, jadi posisi lawan tidak menentukan. Tidak ada global hit-stop; knockback 60/60/190. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`quake`) dan CPU (`enemyQuake`) memiliki owner terpisah. Gelombang memakai jalur proyektil biasa, jadi CPU yang membaca proyektil otomatis mencoba melompatinya.

## CPU

- HALDOR sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Jangkauan palu yang pendek membuatnya membuka rantai dari ±100 px.
- Aturan baru untuk semua lawan CPU: proyektil melambung (Slag Shot pemain) tidak dilompati. CPU membaca titik jatuhnya setelah jeda `reaction`, lalu (peluang `evade`) berlari keluar dari percikan lewat sisi terdekat sampai bola mendarat. Tes: Excellent minimal 4/6, Easy lebih sedikit.
- Benchmark (HALDOR sebagai CPU): pemain diam K.O. dalam 26.0 / 23.6 / 19.6 / 17.1 s (Easy→Excellent), sedikit lebih lambat dari MIRA/CORA/NAJA, sesuai tank. Proyektil yang mengenai CPU 52 / 39 / 37 / 37%.

## Voice

Katalog preset tidak menyertakan deskripsi suara, jadi “Forge Quake!” digenerate dengan empat preset pria: Gideon, Barrett, Bram dan Knox. Gideon dipilih karena pitch median-nya paling rendah (±81 Hz, di bawah Holden milik FENR ±92 Hz) dan sedikit frame periodik, yang menandakan suara serak cocok untuk pandai besi tua. Angka pitch berasal dari estimasi autokorelasi sederhana dan hanya menjadi panduan; isi dan timbre belum didengar pengguna. Take dipakai apa adanya (ucapan selesai di 0.88 s). Cara mengganti: salin kandidat lain dari `assets/haldor/audio/ultimate-candidates/` ke `haldor-ultimate.mp3`, lalu ganti `VOICE_NAMES.haldor` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `haldor` ke kontrak kit yang sama. HALDOR memiliki `haldorStrike` (lob, tebasan, smash, serudukan) dan summon `startQuake`/`updateQuake` (dipilih lewat `startSummon`). Dash Steam Ram memakai jalur dash yang sama dengan FENR/MIRA.
- Proyektil kini mendukung `gravity` (lintasan lengkung) dan mendarat lewat `slagSplash`. Proyektil lama tanpa `gravity` tidak berubah.
- `bodyGap` 62 px bila HALDOR bertarung (badan lebar), bayangan lebih lebar.
- Snapshot QA berisi `quake`/`enemyQuake`. Cut-in memakai kelas `.haldor-cutin`, art ui/cutin.png, dan judul FORGE QUAKE dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1); UI di ui-requests.json.
2. `tools/haldor_pipeline.py measure`, `tools/haldor_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/haldor_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/haldor/run --character-id haldor --base-image assets/haldor/base/base-selected.png --request assets/haldor/request.json --chroma-key #00FF00`, lalu `normalize` dan `extract`.
4. `tools/haldor_align.py`, lalu `publish`. Hitung emitter (ujung terjauh di frame 2) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/haldor_assets.py` mengekspor portrait/ikon/cut-in/VFX.

Catatan QA: assets/haldor/run/qa-notes.md. Tes: `node tests/haldor.test.cjs` (15 tes).
