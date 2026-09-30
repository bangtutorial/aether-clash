# EDDA — sang petapa cangkang

EDDA adalah petarung Demi-Human keenam dan karakter kedua belas di roster: nenek kura-kura dengan tongkat panjang dan cangkang kubah besar, satu-satunya petarung counter. Ia berasal dari 8 karakter showcase dan dibuat playable terakhir, setelah NIB. Pemain dapat memilihnya di roster VS/Training dan di Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/edda/character.md.

## Dari showcase ke playable

Alurnya sama dengan NIB ([nib-reference.md](nib-reference.md)). Body showcase v1 (sudah chibi) langsung menjadi base sprite (base-selected.png, job `b9ecaa00-3a50-479f-a295-6e82cd791e49`), dan avatar showcase dipakai sebagai portrait HUD. Di roster.json EDDA ditandai `promoted`, jadi **showcase kini kosong**: kedelapan karakter showcase sudah playable. Semua gambar baru dibuat dengan **GPT Image 2.5 Sunburst**, chroma magenta (palet EDDA hijau giok). Announcer tetap Grady. Alat pipeline: `tools/edda_*.py`.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 170 px (sepatu sampai cincin tongkat), lebar 138 px |
| UI | portrait 384 (avatar showcase), cut-in 1600×686, 4 ikon 256, roster art dari showcase |
| VFX | PNG alpha: stone (batu giok), ripple (riak pantulan), shell (kubah heksagon saat counter), stomp (hentakan batu) 256 px; tortoise (roh kura-kura) 512 px dengan kaki di tepi bawah |
| Audio | `select_edda` "Edda!" (0.993 s), `edda_wins` "Edda wins!" (1.071 s), Grady. Voice ultimate Opal "Elder Tortoise!" (1.411 s, sunyi di akhir dipotong) |

Ukuran 170 px dipilih dari lineup 170/180/190/200 (size-candidates.png). Pada ukuran itu wajah setara RHEA/HALDOR dan kepalanya tetap di bawah petarung dewasa, cocok untuk nenek yang bungkuk. Wrapper `EDDA_MANIFEST/METRICS` ada di [assets/edda/manifest.js](../assets/edda/manifest.js). Sprite library memutar semua animasi.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | STAFF FORMS: tusukan, sapuan naik, hentakan ke lantai. Reach 110/95/80 di dalam ujung tongkat (126/111/82 px); durasi 0.40/0.46/0.58 s | 6/8/12 |
| I | STONE SKIP: batu giok dilempar dari 60 px di atas lantai, memantul dua kali (hop 300 px/s) lalu tenggelam, ±630 px dari EDDA. Tidak pernah lebih tinggi dari ±65 px, jadi lompatan melewatinya | 16 / 3 s |
| O | SHELL COUNTER: jendela guard 0.55 s. Hit pertama diabaikan; penyerang dalam 170 px dibalas 24 (knockback 260). Tembakan dari jauh hanya ditahan. Satu counter per guard | 24 / 6 s |
| P | ELDER TORTOISE: pose cast 0.5 s, roh kura-kura berjalan dan menghentak tiga kali | 48 / 18 s |

Setiap basic hit yang valid mengembalikan 5% cooldown maksimum semua skill. HP tetap 200 dalam dua lapis. Semua nilai ada di [edda.js](../edda.js).

### Timeline Elder Tortoise

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner giok | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Roh muncul | 0.60 s, 140 px di depan EDDA, lalu berjalan maju 120 px/s |
| Hentakan 1 / 2 / 3 | 0.80 / 1.18 / 1.56 s; roh terangkat 34 px sebelum tiap hentakan |
| Hentakan | kena lawan di lantai dalam 150 px dari roh; 16 damage, knockback 40/40/200 |
| Selesai | 2.3 s (roh memudar) |

Hentakan 0.38 s berselang, lebih pendek dari stun 0.42 s, sehingga lawan yang diam di depan EDDA terkena 48. Melompat saat hentakan (tes: lawan di udara pada ketiga hentakan tidak kena) atau berada lebih dari 150 px dari roh menghindarinya; roh tidak berbalik, jadi lawan di belakang EDDA aman. Tidak ada global hit-stop. Pause membekukan serangan ini, sedangkan reset, kembali ke menu dan akhir ronde membatalkannya. Serangan pemain (`tortoise`) dan CPU (`enemyTortoise`) memiliki owner terpisah.

## CPU

- EDDA sebagai CPU memakai otak yang sama ([cpu-ai.md](cpu-ai.md)) dan kit-nya lewat `KITS`. Shell Counter hanya dipilih saat pemain sedang memulai serangan dasar yang belum mengenai, dan tidak pernah dipakai sebagai penutup combo.
- Benchmark (EDDA sebagai CPU): pemain diam K.O. dalam 28.0 / 27.4 / 25.8 / 18.8 s (Easy→Excellent), paling lambat di roster: rantainya pelan, dan counter tidak berguna melawan pemain diam. Proyektil yang mengenai CPU 52 / 43 / 42 / 33%. Detail di [cpu-ai.md](cpu-ai.md).

## Voice

"Elder Tortoise!" digenerate dengan empat preset wanita: Mabel, Opal, Vera dan Delia. Opal dipilih karena pitch mediannya paling rendah (±258 Hz; Vera ±299, Mabel ±314, Delia ±381), paling matang untuk nenek petapa. Ucapan selesai 1.19 s, jadi sunyi di akhir dipotong (1.411 s). Angka pitch hanya panduan; timbre belum didengar pengguna. Cara mengganti: salin kandidat lain dari `assets/edda/audio/ultimate-candidates/` ke `edda-ultimate.mp3`, lalu ganti `VOICE_NAMES.edda` di game.js. Record: generation.json.

## Integrasi engine

- `KITS` memetakan `edda` ke kontrak kit yang sama. EDDA memiliki `eddaStrike` (tongkat, batu) dan summon `startTortoise`/`updateTortoise` (dipilih lewat `startSummon`).
- Proyektil kini mendukung `skip` (gravitasi sendiri `skipG`, `bounces` pantulan dengan kecepatan `hop`, riak di setiap sentuhan). Proyektil lama tidak berubah.
- Aksi dengan `guard` (Shell Counter) diperiksa di awal `receiveHit` (pemain) dan `hitDummy` (CPU) lewat `shellGuard`: hit pertama di jendela `guardEnd` dibatalkan, animasi lompat ke frame serangan balik, dan penyerang dalam jangkauan terkena 24.
- Roh kura-kura adalah efek `edda-spirit` berukuran tetap (300 px) yang digambar dari lantai; x-nya diperbarui oleh summon.
- Snapshot QA berisi `tortoise`/`enemyTortoise` (tanpa referensi efek). Cut-in memakai kelas `.edda-cutin`, art ui/cutin.png, dan judul ELDER TORTOISE dari HTML.

## Reproduksi

1. Prompt/job: desain di roster.json; strip di strip-requests.json (15 × v1); UI di ui-requests.json.
2. `tools/edda_pipeline.py measure`, `tools/edda_measure.py`, lalu tulis `rel.json` (alasan di `qa/rel-decision.json`).
3. `tools/edda_pipeline.py calibrate`, `sprite_gen.cli prepare --out-dir assets/edda/run --character-id edda --base-image assets/edda/base/base-selected.png --request assets/edda/request.json --chroma-key #FF00FF`, lalu `normalize` dan `extract`.
4. `tools/edda_align.py`, lalu `publish`. Hitung emitter (ujung tongkat di frame 3) ke `emitters.json`, lalu jalankan `publish` sekali lagi.
5. `tools/edda_assets.py` mengekspor portrait/ikon/cut-in/VFX, lalu `tools/web_images.py` dan `node tools/build_dist.mjs`.

Catatan QA: assets/edda/run/qa-notes.md. Tes: `node tests/edda.test.cjs` (14 tes).
