# ARCO sebagai contoh format

Dokumen ini mencatat sumber ARCO yang benar-benar dipakai sebagai contoh format/pipeline. Untuk base karakter baru, gunakan deskripsi gaya dan aturan pembeda di character-workflow.md tanpa melampirkan gambar ARCO; jangan menyalin job ID, rel, atau pivot sebagai data karakter baru.

## Identitas dan paket final

- Base B yang dipilih pengguna: base-b.png, job `196220ec-23d8-464b-bf86-87c73307d220`.
- Mecha anime chibi: rambut putih gading, kulit tan, mata teal, navy/ivory/brass, sash teal, lengan mekanis besar di sisi dekat kamera.
- Atlas sprite-sheet-alpha.png, manifest.json, [wrapper JS](../assets/mecha/manifest.js), metrics.
- 14 state / 50 frame; cell 320×288, safe margin 10/8, anchor 160/280. Posisi piksel terbawah umumnya y=279.
- Idle180 px; jump v3 sekitar 177 px; recovery action/skill sekitar 179–181 px. Tuck sekitar 130 px karena tubuh dilipat, bukan dikecilkan di runtime.
- Runtime scale sprite1; smoothing mati. Pembesaran viewport memakai proyeksi seragam.

## Sumber revisi yang dipilih

| Aset | Versi / job | Log prompt |
| --- | --- | --- |
| Base | B / 196220ec-23d8-464b-bf86-87c73307d220 | generation-log.json |
| Walk | v2 / 4253dd82-2a16-40da-9bed-8aa45a2f779e | walk-regeneration.json |
| Down | v2 / 7cff3fae-dc6d-4d2e-8949-ddf888550d8b | down-regeneration.json |
| Jump atletis | v3 / c327f505-b8f8-40bb-8dab-8d8352e06214 | hud-revision-requests.json, index 22 |
| Doublejump tuck | v2 / 177d4a53-00d5-4f8d-bfe8-6b0f032e5996 | motion-revision-requests.json, index 20 |
| Ultimate upright/cast | v2 / 59f55272-032f-4cf5-a05b-107e09962ff8 | motion-revision-requests.json, index 21 |
| Stage Bellora | B / d7eefba6-0006-4658-ab30-43e269426dc9 | generation-log.json |
| Portrait ARCO | fa8a1337-f486-4172-b4e6-9368e297f392 | hud-revision-requests.json |
| Portrait dummy | 1852cb5b-aa79-4e40-985f-da3a2f903a11 | hud-revision-requests.json |
| Drone | 78d149d0-8bab-4711-830c-b297749f7638 | drone-ultimate-requests.json |
| Cut-in ARCO | 749d8da3-1b94-42f4-87c7-ceb5a5209db5 | drone-ultimate-requests.json |
| Ikon summon | d8f67c29-a2f6-4795-9e22-2fe41b5f1563 | drone-ultimate-requests.json |

Semua log di atas berada di [assets](../assets/). State lain dan ikon I/O/basic tercatat di generation-log.json, download-batch1/2/3.json, dan hud-revision-jobs.json. Prompt di run/prompts adalah salinan terpilih; catatan versi generator tetap sumber provenance.

## Nilai kalibrasi ARCO — contoh, jangan dijadikan default universal

Calibration target 0.4675632617, idle original frame 0 tinggi 911 px. Rel final:

| State | rel |
| --- | --- |
| idle | 1.0 |
| walk / run | 1.05 / 1.02 |
| jump v3 / doublejump | 0.922293 / 0.98 |
| crouch | 0.905 |
| attack1 / attack2 | 1.17 / 1.105 |
| attack3 | 1.159, 1.159, 1.159, 1.177 |
| skill1 / skill2 | 1.096 / 1.178 |
| ultimate / hurt / down | 0.998 / 1.0 / 1.609 |

Data aktual: calibration.json, rel.json, playback.json, curation.json.

Jump v3: original tinggi 1801 px, satu BOX resample dengan faktor≈0.098279 untuk target 177 px. Integer dx−39 menyelaraskan landmark bagian atas dengan idle; tidak ada per-frame scale runtime. Landmark pale-color ini bisa mengandung bentuk tergantung pose, sehingga bukan jaminan ukuran anatomi kepala subpixel.

Pivot relatif anchor: jump torso(5,−105); tuck local(−1,−65); putaran360° dalam 0,28 s. Titik ini mengurangi lompatan posisi kepala saat berganti pose, dan wajib diukur ulang pada karakter lain.

Drone final112×95 dengan muzzle(50.12,5.62) relatif pusat. Sprite-gen cutout membuang chroma; pemilihan komponen utama menghindari satu piksel liar di(0,0) yang sempat membuat bbox terlalu besar. drone-config.json berisi hasil ukur.

## Bukti dan batas

Integrity report mencatat50 frame, tanpa frame kosong, edge alpha, chroma terlihat, dan hanya integer curation. Checksum atlas saat pendokumentasian: `5f6f4e7861b04306c9739e5dfdc4c46cc4166b13e375a9cc64380c3d44ac715c`.

Template edge matching kepala tidak selalu valid pada pose miring; beberapa hasil lama menangkap sepatu/bahu dan ditolak setelah montage dilihat. Hair area yang seragam juga sempat menyembunyikan badan/recovery yang lebih pendek. Karena itu QA akhir menggunakan kepala, badan utuh, rentang crown→sash→foot, dan render transisi.

Walk/run masih animasi demo empat frame. Periksa pergantian kaki dan kontinuitasnya secara nyata; angka drift atau contact sheet saja tidak membuktikan gait seamless. Tes41 yang lulus adalah tes logika, bukan sertifikasi kualitas gambar atau speaker.

Lihat catatan QA sprite dan halaman sprite lab / preview skenario.
