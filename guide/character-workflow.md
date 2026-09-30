# Membuat karakter berikutnya dengan format yang sama

Gunakan bersama [acuan gameplay final](gameplay-standard.md). Dokumen ini menetapkan format proyek, sedangkan [sprite-pipeline.md](sprite-pipeline.md), [sprite-prompts.md](sprite-prompts.md), dan [sprite-qa.md](sprite-qa.md) menjelaskan teknik ekstraksi/koreksi lebih rinci.

## 1. Kunci gaya dan identitas

Gaya bersama: anime chibi hi-bit pixel art, outline gelap halus, cluster pixel detail, palet kaya; bukan 8-bit kotak besar. Mecha boleh menggabungkan manusia dan cyborg; Demi-Human menggabungkan manusia dan hewan. Siluet/warna karakter boleh berbeda, tetapi kepadatan pixel dan skala badan harus terasa satu game.

1. Salin [kartu karakter](templates/character-card.md) ke folder karakter baru dan isi identitas/kelas/palet/sisi aksesori.
2. Desain base baru dari deskripsi gaya bersama, **tanpa melampirkan gambar ARCO atau karakter roster lain**. Revisi pengguna: referensi karakter lama membuat hasil terlalu mirip, bahkan dengan instruksi STYLE ONLY. Kesamaan format berasal dari pixel density, outline, skala runtime, dan pipeline; identitas visual harus berbeda.
3. Buat 2–4 opsi base, pilih/kunci satu desain yang disetujui. Base full-body, hadap kanan, pose netral, semua anggota tubuh/ekor/senjata tidak terpotong.
4. Sesudah dikunci, semua animasi baru memakai **base karakter itu sendiri** sebagai referensi identitas. Idle final boleh ditambahkan sebagai referensi proporsi.
5. Simpan prompt lengkap, parameter, reference ID, job ID, versi sumber, dan alasan pilihan. Gambar ARCO/proyek lama bukan identitas untuk karakter baru.

### Pembeda eksplisit pada setiap prompt base

Sebelum generate, tulis identitas karakter baru serta daftar ciri roster lama yang tidak boleh diwarisi. Wajib bedakan siluet keseluruhan, bentuk/panjang rambut, wajah/ekspresi, palet dominan, konstruksi pakaian, anatomi/alat bertarung, dan aksesori khas. Mengganti telinga atau warna saja tidak cukup.

Untuk karakter setelah ARCO, hindari kombinasi rambut putih/perak pendek berduri, mata turquoise, jaket navy berlis emas, sash turquoise, armor ivory, dan lengan mekanis besar. Sebut larangan tersebut secara eksplisit di prompt, lalu jelaskan pilihan penggantinya secara konkret. Demi-human serigala tetap harus punya wajah/tubuh manusia dan ciri serigala yang terbaca, bukan ARCO yang ditambah telinga/ekor.

Periksa hasil base berdampingan dengan roster lama sebelum animasi: apakah masih bisa dikenali sebagai karakter berbeda jika tanpa warna? Jika siluet, wajah, rambut, atau kostumnya terlalu serupa, revisi base. Jangan meneruskan kandidat yang ditolak ke strip animasi. Setelah base baru dipilih, gunakan base itu sendiri untuk menjaga identitas seluruh animasinya.

## 2. Pembagian model dan aset

| Jenis | Jalur proyek ini | Pengaturan acuan |
| --- | --- | --- |
| Base / sprite karakter | Higgsfield, `gpt_image_2_5` | `variant: sunburst`, `quality: high`, `resolution: 2k` |
| Satu pose jump/tuck | Model sama | 1:1, satu pose |
| Strip gerakan 4 frame | Model sama | 21:9, satu baris; base + guide 4 slot |
| Arena / prop / drone / portrait / cut-in / ikon | Higgsfield, `seedream_v5_pro` | Arena 16:9 2k; portrait/prop 1:1 2k; cut-in 21:9 2k; ikon 1:1 1k |
| Label, HP, timer, cooldown wipe | HTML/CSS/canvas | Tetap elemen UI, jangan dibakar ke gambar |
| Voice karakter bila diminta | Higgsfield, `text2speech_v2`, `variant: elevenlabs` | Pakai pasangan voice_id/voice_type yang valid dan pilihan pengguna; simpan audio/provenance |

Nama/parameter di atas mencatat model yang dipakai. Saat menjalankan generasi berikutnya, periksa parameter yang didukung bila perlu. Gunakan tool Higgsfield untuk generation sesuai pilihan pengguna; sprite-gen menangani prepare, chroma removal, extraction, curation, dan compose. Jangan beralih ke generator CLI/provider lain tanpa alasan atau pilihan pengguna.

Project/folder Higgsfield dibuat atau dipakai ulang sesuai konteks chat yang benar. ID dalam log lama adalah provenance; jangan menjadikannya folder tujuan otomatis untuk chat baru. Tunggu job yang sudah terkirim, simpan hasilnya, dan ulangi hanya item yang jelas gagal. Jangan membuat ulang satu batch penuh hanya karena satu request terkena rate limit.

Bentuk request referensi:

    {
      "params": {
        "model": "gpt_image_2_5",
        "variant": "sunburst",
        "quality": "high",
        "resolution": "2k",
        "aspect_ratio": "21:9",
        "folder_id": "<folder chat yang sah>",
        "medias": [
          {"role": "image", "value": "<job/media base karakter baru>"},
          {"role": "image", "value": "<media layout guide 4 slot>"}
        ],
        "prompt": "<prompt state dan layout>"
      }
    }

Chroma harus berbeda dari material karakter: magenta #FF00FF untuk palet ARCO; hijau #00FF00 bila karakter memakai pink/ungu. Larang warna chroma di tubuh/aksesori. Background flat, tanpa floor shadow, efek, teks, garis guide, atau nomor frame.

## 3. Paket 14 state / 50 frame

Salin [sprite-request.json](templates/sprite-request.json) lalu sesuaikan deskripsi aksi dengan anatomi/alat karakter. Angka fps adalah metadata default; pemilihan frame jump, locomotion, dan timing skill mengikuti gameplay.

| State | Frame | FPS metadata | Loop | Isi |
| --- | ---: | ---: | --- | --- |
| idle | 4 | 5 | ya | Napas halus, kaki tetap |
| walk | 4 | 10 | ya | Contact → passing → opposite contact → passing |
| run | 4 | 13 | ya | Sprint jelas berbeda dari walk, kaki bergantian |
| jump | 1 | 10 | tidak | Pose udara atletis, satu gambar yang ditahan |
| doublejump | 1 | 12 | tidak | Pose tuck, lutut rapat; diputar runtime |
| crouch | 4 | 8 | tidak | Menunduk/guard rendah |
| attack1 | 4 | 13 | tidak | Pembuka: wind-up, ayun, impact, recovery |
| attack2 | 4 | 13 | tidak | Serangan sambungan, siluet berbeda |
| attack3 | 4 | 11 | tidak | Finisher, recovery kembali seukuran idle |
| skill1 | 4 | 11 | tidak | Cast/aim/fire/recovery sesuai kemampuan |
| skill2 | 4 | 10 | tidak | Aksi area sesuai kemampuan |
| ultimate | 4 | 9 | tidak | Pose cast/command; efek ultimate terpisah |
| hurt | 4 | 9 | tidak | Recoil lalu kembali ke guard |
| down | 4 | 7 | tidak | Terpental, jatuh, mendarat, rebah |

Jumlah ini baseline ARCO untuk konsistensi. Jika perlu menambah frame, ubah request, guide, manifest, dan QA bersama; jangan memotong grid dengan asumsi jumlah lama.

### Jump yang disetujui

Gunakan **satu pose atletis**, bukan idle melayang kaku. Torso sedikit condong, siku menekuk, lutut dekat terangkat wajar dengan tulang kering ke bawah, kaki jauh rileks ke belakang. Tidak ada tendangan lurus atau rangkaian jongkok/takeoff di udara. Lintasan naik-turun berasal dari fisika.

### Double jump yang disetujui

Satu pose tubuh menggulung, kedua lutut rapat dan tangan/alat dekat badan. Pertahankan ukuran kepala serta panjang anatomi saat menekuk. Runtime memutarnya 360° dalam 0,28 s dengan pivot tubuh terukur. Simpan pivot lokal pose tuck dan world-pivot untuk transisi dari jump. Jangan memakai koordinat pivot ARCO untuk karakter lain tanpa mengukur ulang.

## 4. Struktur folder dan sumber asli

    assets/<character-id>/
      character.md
      base/base-selected.png
      raw-original/<state>-v1.png     # file generator asli, tidak di-resample
      raw-original/<state>-v2.png     # revisi tetap disimpan
      raw-original/<state>.png        # salinan sumber terpilih untuk tool
      guides/
      request.json
      generation-log.json
      selected-sources.json
      calibration.json
      rel.json
      playback.json
      frame-metrics.json
      manifest.js
      run/raw/                       # hasil normalisasi sekali dari sumber asli
      run/frames/                    # intermediate, bukan input runtime
      run/curation.json
      run/sprite-sheet-alpha.png
      run/manifest.json
      run/qa-notes.md
      qa/

UI/prop boleh berada di folder bersama assets/ui, tetapi nama portrait/cut-in/ikon harus jelas memiliki karakter tertentu agar tidak menimpa karakter lama. Simpan raw UI di originals. `selected-sources.json` menggunakan [template provenance](templates/selected-sources.example.json).

## 5. Prepare dan guide

Gunakan Python dari venv sprite-gen, bukan interpreter global acak. Jalankan dari root proyek. Contoh Windows berikut membuat run baru setelah base-selected.png tersedia; ganti ID/path sesuai karakter baru.

    $spriteRoot = 'C:\Users\effen\.codex\skills\sprite-gen'
    $spritePy = Join-Path $spriteRoot '.venv\Scripts\python.exe'
    $characterId = 'new-character'
    $charDir = Join-Path (Get-Location) ('assets\' + $characterId)
    $runDir = Join-Path $charDir 'run'
    & $spritePy -X utf8 -m sprite_gen.cli prepare `
      --out-dir $runDir --character-id $characterId `
      --base-image (Join-Path $charDir 'base\base-selected.png') `
      --request (Join-Path $charDir 'request.json') `
      --chroma-key '#FF00FF' --no-fit-pixel-unfake `
      --fit-resample nearest --fit-align-x foot-centroid `
      --fit-align-y bottom --fit-ground-frames

Template cell **320×288**, safe margin x=10/y=8, anchor (160,280). Idle manusia/chibi target sekitar 180 px. Cell boleh diperbesar bila ekor/sayap/alat tidak muat, tanpa mengecilkan frame tertentu. Semua angka ini harus dicatat bila diubah.

Untuk row empat pose, guide generasi 1680×720 (21:9), empat slot420 px. Gunakan renderer guide sprite-gen seperti contoh implementasi mecha_pipeline.py. Guide hanya untuk spacing; extractor memisahkan komponen, bukan memotong cell generator secara buta. Jump/tuck satu pose menggunakan guide satu slot / rasio 1:1.

## 6. Normalize → extract → ukur → koreksi

1. Simpan original setiap job. Cek jumlah pose, arah, gap, dan kelengkapan anggota tubuh sebelum memproses.
2. Kalibrasi tinggi idle terhadap target 180 px. Pitch hanya perkiraan awal. Faktor akhir per state/pose: `target / mean(pitchX,pitchY) × rel`.
3. Ukur kepala **dan badan**: crown→sabuk, sabuk→kaki, shoulder/alat, serta recovery→idle pada baseline sama. Kesamaan luas rambut saja tidak menjamin karakter tidak mengecil.
4. Lakukan satu resample BOX langsung dari original ke run/raw. Catat target dan rel. Jangan memperbaiki skala dengan memperbesar atlas yang sudah kecil.
5. Jalankan canonical component extraction. Perbesar cell bila ada per-frame fit/cap warning. Jangan mengganti canonical extractor dengan crop grid sementara.
6. Jalankan pengukuran kepala/body untuk semua aksi. Buka montagenya. Template kepala miring bisa menangkap sepatu/bahu; hasil itu tidak valid, bukan angka untuk diterapkan.
7. Koreksi kembali dari original, lalu extract ulang state yang berubah. Curation hanya `dx/dy` integer dan `scale=1`.

Contoh satu state (nilai harus berasal dari pengukuran karakter baru):

    $target = 0.5       # perkiraan awal, kalibrasikan dari idle
    $rel = 1.0         # contoh, ganti hasil ukur state ini
    & $spritePy -X utf8 guide/tools/rebuild_raw.py `
      (Join-Path $charDir 'raw-original\walk.png') `
      (Join-Path $runDir 'raw\walk.png') --poses 4 --target $target --rel $rel
    & $spritePy -X utf8 -m sprite_gen.cli extract --run-dir $runDir --states walk

Untuk jump/doublejump gunakan `--poses 1`. Angka rel ARCO bukan preset universal. Salin struktur file, lalu ukur ulang nilainya.

## 7. Compose dan QA akhir

    & $spritePy -X utf8 -m sprite_gen.cli compose-atlas --run-dir $runDir
    & $spritePy -X utf8 -m sprite_gen.cli compose-gif --run-dir $runDir --out-dir (Join-Path $runDir 'exports')
    & $spritePy -X utf8 -m sprite_gen.cli inspect --run-dir $runDir
    & $spritePy -X utf8 guide/tools/measure_atlas.py $runDir

- Atlas final: tidak ada frame kosong, tepi terpotong, atau chroma terlihat. Simpan checksum/integrity report.
- Idle selisih tinggi maksimum 2 px; torso tidak bergeser lebih dari sekitar±1,5 px pada loop tegak. Recovery/action body jangan terlihat mengecil ketika kembali ke idle.
- Walk/run harus punya contact/passing dan pergantian kaki yang benar. Rasio jarak kaki kecil/besar≤0,45 hanya indikator, bukan bukti tunggal gait sudah mulus.
- Bandingkan kepala dan tubuh di original serta atlas; pisahkan toleransi target dari hasil yang benar-benar tercapai. Rotasi/occlusion yang tidak terukur harus ditandai.
- Periksa di latar gelap/terang, kanan/kiri, seluruh pose, serta transisi di game. Simpan screenshot keyframe. Jangan menyebut sudah menonton full loop bila hanya membuka contact sheet.
- Reukur jangkauan serangan dan titik emisi setelah compose. Muzzle laser/peluru harus menyambung ke alat/telapak, bukan posisi hardcoded lama.

## 8. Integrasi runtime dan aset pendukung

Koordinat frame dibaca dari `manifest.frame_layout.rows[state][index]`; timing default dari `manifest.animation.rows[state]`. Dimensi/anchor dari `manifest.cell`. Jump/tuck satu frame adalah pengecualian playback yang disengaja, bukan kegagalan animasi.

Runtime saat ini membaca `window.MECHA_MANIFEST` dan `window.MECHA_METRICS` dari assets/mecha/manifest.js. Metrics memuat `states`, stride estimate, `emitters`, dan `playback`. Manifest.js adalah wrapper otomatis dari hasil compose supaya file:// tidak membutuhkan fetch JSON. Lihat [sprite-runtime.md](sprite-runtime.md).

| Field metrics | Arti / cara mendapatkannya |
| --- | --- |
| `states.<state>.frames[i].bounds` | left/right/top/bottom alpha final relatif anchor; dihitung dari atlas setelah curation |
| `states.<state>.frames[i].height` | Tinggi silhouette final; bukan ukuran anatomi jika pose menekuk |
| `states.<state>.stride_estimate` | Estimasi siklus walk/run; beri catatan metode dan batas verifikasi |
| `emitters.<state>.x/y` | Titik efek relatif anchor, diukur pada pose impact/cast yang benar |
| `playback.jump.airFrame` | Index satu pose airborne yang dipilih |
| `playback.jump.torsoPivot` | Posisi pivot dunia relatif kaki saat beralih ke tuck |
| `playback.doublejump.pivot` | Pivot lokal tuck relatif anchor |
| `playback.doublejump.duration` | Catatan baseline 0,28 s; CONFIG.rollDuration di game.js mengendalikan timer runtime saat ini |

Setelah frame-metrics.json lengkap dan semua pivot/emitter terukur, wrapper dapat dibuat ulang tanpa menyalin koordinat manual:

    @'
    import json, sys
    from pathlib import Path
    char = Path(sys.argv[1])
    manifest = json.loads((char / 'run/manifest.json').read_text(encoding='utf-8'))
    metrics = json.loads((char / 'frame-metrics.json').read_text(encoding='utf-8'))
    (char / 'manifest.js').write_text(
        'window.MECHA_MANIFEST = ' + json.dumps(manifest) + ';\n'
        + 'window.MECHA_METRICS = ' + json.dumps(metrics) + ';\n', encoding='utf-8')
    '@ | & $spritePy -X utf8 - $charDir

Contoh memakai global kompatibel slot demo sekarang, bukan registry multi-karakter. Atlas tetap menunjuk file yang sama dengan manifest yang baru diekspor.

**Demo kini memiliki pilihan pemain ARCO/FENR/MIRA/CORA di roster dan pengaturan**, dengan integrasi eksplisit `syncPlayerForm` dalam game.js, bukan registry otomatis. Menaruh folder karakter baru saja belum membuatnya playable. Sesuaikan script index.html, loader atlas, pilihan karakter, metadata, kit, portrait dan ikon. Setiap manifest memakai global terpisah. FENR memberi contoh dua bentuk lengkap, recovery tambahan, timer transformasi, serta AI memakai kit yang sama: [fenr-reference.md](fenr-reference.md). MIRA memberi contoh pilot + kendaraan: cell 448, chroma hijau, summon roket, ukuran dikoreksi lewat calibration tanpa generate ulang ([mira-reference.md](mira-reference.md)). CORA memberi contoh karakter bersayap: cell 448 untuk sayap terbuka, proyektil kipas dengan `vy`, summon bergelombang yang dapat dihindari dengan lompatan, dan kit yang didaftarkan lewat peta `KITS` ([cora-reference.md](cora-reference.md)).

Tool di folder proyek `tools/` seperti mecha_pipeline.py, hair_landmark_audit.py, check_hud_jump.py, dan verify_atlas_integrity.py masih terikat ke assets/mecha/ARCO. Jangan menjalankannya dengan harapan otomatis memilih karakter baru. Parameterisasikan/copy dengan path yang ditinjau, atau pakai CLI generik di atas dan tool guide/tools yang menerima path.

Generate portrait baru, ikon setiap skill, dan cut-in tersendiri. Ekor/senjata/prop harus konsisten dengan kartu identitas. Untuk summon, buat aset terpisah dan ukur muzzle/pivot setelah cutout. Gunakan sprite-gen cutout untuk chroma removal; jika satu piksel terpisah membuat bbox terlalu besar, pilih komponen utama yang benar dan periksa hasilnya. Jangan mengambil portrait dari crop atlas lama.

Avatar mengikuti [avatar-standard.md](avatar-standard.md): close-up kepala besar, export384×384, sumber kanonis menghadap kanan. UI pemain memakai kanan dan UI musuh mencerminkan gambar ke kiri, termasuk portrait transformasi. Gunakan class/atribut slot yang sama untuk semua karakter baru.

## 9. Syarat penyerahan karakter berikutnya

- Kartu identitas, base, original berversi, prompt/job log, pilihan sumber, request, rel, calibration, dan playback terisi.
- Atlas + manifest terbaru dipublikasikan bersama; semua state tersedia dengan jumlah frame yang dicatat.
- Nilai skala, pivot, emisi, hit range, dan stride tidak diwarisi tanpa pengukuran.
- HUD/avatar/ikon/cut-in mengikuti format visual yang sama; nama/kemampuan bisa berbeda sesuai kelas.
- HP, basic-hit recharge, input, pause/reset, dan pemisahan cast/efek mengikuti gameplay-standard.
- Tes relevan dan browser QA dilakukan; batas bukti ditulis. Jangan mengubah sprite/karakter lama ketika menambah yang baru.

Contoh nyata dan jejak revisinya: [ARCO reference](arco-reference.md).
