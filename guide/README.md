# Panduan game fighting dan karakter

> [!NOTE]
> Panduan ini ditulis di workspace produksi lengkap, yang juga berisi bahan generate (strip mentah, original, kandidat voice, QA), tool pipeline (`tools/`), dan halaman lab sprite. Bahan itu tidak ikut di repository ini karena ukurannya beberapa GB. Karena itu, path yang disebut tanpa tautan hanya ada di workspace tersebut; file game yang dirujuk (`game.js`, kit karakter, `index.html`, dan sebagainya) ada di root repository ini.

Dokumentasi ini menyimpan keputusan final dan cara menyiapkan karakter berikutnya dengan format yang sama. Mulai dari acuan di bawah.

## Urutan baca

| Keperluan | Acuan |
| --- | --- |
| Branding umum AETHER CLASH, dunia Mecha vs Demi-Human | [branding.md](branding.md) |
| Framing kepala dan arah avatar pemain/musuh, termasuk transformasi | [avatar-standard.md](avatar-standard.md) |
| Main menu, pemilihan pemain/lawan, arena, difficulty, ronde dan hasil pertandingan | [main-menu.md](main-menu.md) |
| Background main menu looping Seedance2.5 1080p | [menu-video.md](menu-video.md) |
| Mengetahui kontrol, HP, damage, cooldown, summon, HUD, dan VFX final | [gameplay-standard.md](gameplay-standard.md) |
| Membuat karakter Mecha/Demi-Human baru dari nol | [character-workflow.md](character-workflow.md) |
| Melihat contoh nyata, source terpilih, dan parameter ARCO | [arco-reference.md](arco-reference.md) |
| FENR, paket dua bentuk, AI, timer transformasi dan aset lengkap | [fenr-reference.md](fenr-reference.md) |
| MIRA, pilot anak + robot, Rocket Parade, ukuran 182 px | [mira-reference.md](mira-reference.md) |
| CORA, demi-human gagak bersayap, Night Murmuration, ukuran 184 px | [cora-reference.md](cora-reference.md) |
| NAJA, demi-human kobra dengan urumi, Dune Serpent, voice Soraya, ukuran 182 px (dari showcase ke playable) | [naja-reference.md](naja-reference.md) |
| HALDOR, tank mecha pandai besi, Slag Shot melambung, Forge Quake, voice Gideon, ukuran 169 px | [haldor-reference.md](haldor-reference.md) |
| ZANNI, badut mecha lengan gunting, Ring Toss bumerang, Spring Snatch menarik lawan, Grand Finale, voice Julian, ukuran 176 px | [zanni-reference.md](zanni-reference.md) |
| ISOLDE, ksatria mecha kaki bangau, Sky Piercer naik diagonal, Stilt Charge, Skyfall Lances dari langit, voice Vesper, ukuran 200 px | [isolde-reference.md](isolde-reference.md) |
| RHEA, zoner mecha orrery, Planet Drift lambat, Gravity Well, Grand Orrery mengorbit, voice Chloe, ukuran 170 px | [rhea-reference.md](rhea-reference.md) |
| SOLAN, singa demi-human pedang besar, Solar Crescent, Leonine Leap area, Sunmane Roar tak bisa dilompati, voice Xavier, ukuran 176 px | [solan-reference.md](solan-reference.md) |
| NIB, tikus kurir demi-human, rantai dan surat tercepat, Rooftop Slip menyelinap, Special Delivery homing, voice Evan, ukuran 150 px | [nib-reference.md](nib-reference.md) |
| EDDA, nenek kura-kura demi-human, Stone Skip memantul, Shell Counter, Elder Tortoise roh yang menghentak, voice Opal, ukuran 170 px | [edda-reference.md](edda-reference.md) |
| Menulis prompt base/row/jump/tuck | [sprite-prompts.md](sprite-prompts.md) |
| Prepare, normalize, extract, align, compose | [sprite-pipeline.md](sprite-pipeline.md) |
| Memeriksa skala dan integritas atlas | [sprite-qa.md](sprite-qa.md) |
| Memasang atlas, pivot dan emitters ke game | [sprite-runtime.md](sprite-runtime.md) |
| Mendiagnosis frame mengecil, goyang, blur, pose menempel | [sprite-known-issues.md](sprite-known-issues.md) |
| Membuat latar satu arena (5 arena aktif, termasuk hutan dan malam bulan purnama) | [stage-background.md](stage-background.md) |
| Cara CPU berpikir, knob difficulty dan benchmark | [cpu-ai.md](cpu-ai.md) |
| Mengatur hurt, KO, immunity dan hit feedback | [hit-reactions.md](hit-reactions.md) |
| Voice final Dylan, arsip kandidat, dan perilaku audio ultimate | [ultimate-voice.md](ultimate-voice.md) |
| Voice final Holden untuk FENR, arsip audisi dan perilaku pemain/AI | [fenr-voice.md](fenr-voice.md) |
| Voice ultimate Luna (MIRA) dan Anika (CORA), pemilihan dan pemotongan kalimat | [mira-cora-voice.md](mira-cora-voice.md) |
| Announcer sistem final Grady: cue, timing, integrasi dan aturan karakter baru | [announcer-system.md](announcer-system.md) |

Jika pedoman generik bertentangan dengan keputusan proyek ini, gunakan gameplay-standard dan character-workflow. Instruksi pengguna berikutnya tetap dapat mengubah acuan; perbarui dokumen final bersamaan dengan implementasinya.

## Template untuk karakter berikutnya

- [Kartu karakter](templates/character-card.md): identitas, ukuran, skill, aset, dan checklist.
- [Sprite request](templates/sprite-request.json): cell 320×288, 14 state, 50 frame.
- [Selected sources](templates/selected-sources.example.json): versi sumber, model, job, dan hash. Isi semua placeholder.
- [Playback](templates/playback.example.json): struktur jump/tuck; ukur seluruh pivot sebelum dipakai.
- [Balance reference](templates/balance-reference.json): nilai final untuk pembanding, bukan config loader game.

## Aturan yang tidak boleh terlewat

1. Kunci satu base karakter; semua animasi memakai identitas base itu. Base baru memakai deskripsi gaya bersama tanpa gambar karakter lama, dengan pembeda siluet/rambut/wajah/palet/kostum eksplisit.
2. Gambar karakter memakai Higgsfield GPT Image 2.5 **Sunburst**; arena/prop/portrait/ikon/cut-in memakai Seedream 5.0 Pro.
3. Ukur kepala **dan badan utuh**, khususnya recovery → idle. Median rambut yang sama tidak menjamin tubuh tidak mengecil.
4. Simpan original setiap versi. Normalisasi satu kali dari original; curation hanya pergeseran integer dengan scale=1.
5. Gunakan canonical component-row extraction. Jangan mengganti row pipeline dengan generate grid sekali lalu memotong cell buta.
6. Format saat ini: jump satu pose atletis; doublejump satu pose tuck diputar 360°/0,28 s. Jangan ulang crouch di udara atau gunakan pose kick untuk salto.
7. Pakai atlas dan manifest hasil compose terbaru bersama; jangan memuat frame intermediate. Anchor di kaki, smoothing mati, skala tubuh tidak berubah per state.
8. Pose cast terpisah dari umur efek. Proyektil/summon yang sudah dilepas tidak mengunci pemain sampai efek selesai.
9. HP memakai **satu bar fisik dengan dua lapis nyata**, total 200 HP. Bukan dua baris dan bukan damage trail.
10. Bedakan pemeriksaan angka, screenshot, dan gerakan yang benar-benar dilihat. Catat batas QA secara jujur.
11. Jangan menyalin rel/pivot/muzzle ARCO ke karakter baru tanpa pengukuran ulang.
12. Pilihan pemain ARCO/FENR/MIRA/CORA/NAJA/HALDOR/ZANNI/ISOLDE/RHEA/SOLAN/NIB/EDDA sudah tersedia melalui roster dan pengaturan. Registrasinya masih eksplisit pada game.js (kit MIRA/CORA/NAJA/HALDOR/ZANNI/ISOLDE/RHEA/SOLAN/NIB/EDDA lewat peta `KITS`); penambahan folder saja tidak otomatis menambahkan karakter playable.

## Tool yang tersedia

| Lokasi | Fungsi | Lingkup |
| --- | --- | --- |
| guide/tools/measure_atlas.py | Ukur atlas final | Menerima path run; landmark tertentu tetap perlu adaptasi |
| guide/tools/measure_head_scale.py | Perbandingan kepala di original | Pilih template/landmark yang sesuai karakter |
| guide/tools/rebuild_raw.py | Single BOX resample, koreksi per pose | Menerima source/output/count/rel |
| guide/tools/register_frames.py + write_dx.py | Alignment badan dengan integer dx | Tinjau region dan hasilnya |
| tools/mecha_pipeline.py | Wrapper canonical pipeline dan ekspor metrics | Terikat ARCO/assets/mecha; adaptasi path sebelum reuse |
| tools/hair_landmark_audit.py | QA landmark rambut | Warna putih ARCO; bukan detector semua karakter |
| tools/transition_body_audit.py | Bandingkan body/recovery dengan idle | Terikat ARCO; adaptasi landmark |
| tools/check_hud_jump.py | Alignment/pivot jump v3 | Terikat ARCO, bukan default karakter baru |
| tools/verify_atlas_integrity.py | Frame kosong/edge/chroma/hash | Terikat path ARCO saat ini |
| tools/prepare_drone_assets.py | Cutout export, ukuran dan muzzle drone | Terikat aset drone ARCO |
| tools/serve.mjs | Server lokal demo | Jalankan dari proyek dengan Node |

Venv sprite-gen yang dipakai ada di C:/Users/effen/.codex/skills/sprite-gen/.venv/Scripts/python.exe. Contoh perintah dan penjelasan portabilitas ada di character-workflow. Tidak perlu menjalankan generator atau membangun ulang aset hanya untuk membaca dokumentasi.

## Istilah singkat

Base = identitas; row = satu gerakan; original = keluaran generator yang belum di-resample; cell = kotak frame; anchor = titik acuan posisi; rel = koreksi skala terhadap original terpilih; curation = pilihan/pergeseran integer; atlas = PNG frame final; manifest = koordinat dan timing; playback/metrics = pivot, stride, hit range, dan titik efek yang terukur.


