# Kartu karakter: <NAMA>

Status: TEMPLATE — isi semua placeholder. Salin ke assets/<id>/character.md. Acuan bersama berada di guide/gameplay-standard.md dan guide/character-workflow.md; angka koreksi ARCO tidak otomatis berlaku untuk karakter ini.

## Identitas terkunci

| Field | Isi |
| --- | --- |
| ID folder / nama tampilan | <id> / <nama> |
| Kelas | Mecha / Demi-Human / kelas lain yang diminta |
| Ciri anatomi dan siluet | <tubuh, rambut/telinga/ekor, mekanik, senjata> |
| Palet dan outline | <warna utama, aksen, bayangan, kepadatan pixel> |
| Tangan/sisi aksesori | <sisi dekat kamera, kanan/kiri anatomis> |
| Base terpilih | base/base-selected.png |
| Base job ID / model | <ID> / gpt_image_2_5, sunburst, high, 2k |
| Referensi gaya | <deskripsi pixel density/outline; tanpa gambar karakter roster lama> |
| Pembeda dari roster | <siluet, rambut, wajah, palet, pakaian, anatomi/alat, aksesori> |
| Ciri roster yang dilarang di prompt | <daftar eksplisit + pilihan penggantinya> |
| Persetujuan / tanggal | <desain yang sudah dikunci> |
| Facing / chroma | RIGHT / <warna yang tidak ada di karakter> |
| Prompt dan provenance | generation-log.json / selected-sources.json |

## Format sprite

- Request: request.json, disalin dari guide/templates/sprite-request.json.
- Baseline 14 state / 50 frame: idle, walk, run, crouch, attack1–3, skill1, skill2, ultimate, hurt, down masing-masing 4; jump dan doublejump masing-masing 1.
- Cell awal 320×288, safe margin (10,8), anchor (160,280). Catat bila cell perlu lebih besar.
- Tinggi badan idle target sekitar 180 px. Ukur anatomi, bukan memaksa ujung telinga/tanduk/senjata masuk target tinggi dengan mengecilkan tubuh.
- Strip 4 pose: 21:9, guide 4 slot; pose tunggal: 1:1.
- Semua state memakai base baru yang sama sebagai identitas. Efek, bayangan, teks, dan debris terpisah dari sprite.

## Ukuran yang harus diisi dari hasil ukur

| Ukuran / file | Hasil |
| --- | --- |
| Tinggi idle final / range frame | <px> |
| Kepala / leher→sabuk / sabuk→kaki | <landmark dan px> |
| Aksesori yang dikecualikan dari ukuran anatomi | <telinga, ekor, cape, senjata> |
| Calibration target / pitch | <angka terukur; calibration.json> |
| Rel per state/pose | <rel.json; relatif terhadap sumber terpilih> |
| Integer curation shifts | <run/curation.json; scale selalu 1> |
| Pivot jump / tuck | <playback.json; koordinat final relatif anchor> |
| Walk / run stride | <nilai + metode; estimate atau contact-verified> |
| Hit range / titik efek | <frame-metrics.json dan emitters> |
| Atlas checksum | <sha256 dari atlas runtime terbaru> |

## Kemampuan dan aset pendukung

| Slot | Nama / mekanik | Damage / cooldown awal | Gerak dilepas kapan? | Aset dan titik efek |
| --- | --- | --- | --- | --- |
| Space | <3 gesture combo> | 6 / 8 / 12 | <recovery tiap pukulan> | <frame impact, reach> |
| I | <skill 1> | 16 / 3 s | <contoh: proyektil diluncurkan> | <ikon, projectile, muzzle> |
| O | <skill 2> | 24 / 6 s | <komitmen aksi area> | <ikon, effect anchor> |
| P | <ultimate> | <baseline ARCO 48 / 18 s> | <cast terpisah dari efek/summon> | <ikon, cut-in, summon bila ada> |

Angka tersebut adalah titik awal perbandingan, bukan izin menggandakan damage karena mengganti jumlah VFX. Untuk kemampuan baru, catat jumlah sumber damage dan validasi totalnya.

- Portrait khusus: <path + job ID>, hasil generasi baru; bukan crop atlas.
- Kontrak avatar: close-up kepala80–90%, export384×384, kanonis menghadapKANAN; `portrait-image` + `data-portrait-side=player/enemy` menentukan flip UI. Semua bentuk transformasi mengikuti aturan yang sama.
- Cut-in khusus: <path + job ID>, gambar tanpa teks; judul/UI ditambahkan terpisah.
- Ikon setiap slot: <path + job ID>.
- Prop/summon: <path + job ID>, dimensi final, pivot/muzzle terukur.
- Voice ultimate bila diminta: <script, bahasa, nama voice, voice_id, voice_type, model/variant, path audio, job ID, durasi, status kandidat/final>. Catat hasil audisi dan integrasi mute/volume/pause/reset; jangan menganggap kandidat sudah dipasang.
- Announcer sistem wajib Grady sesuai voice lock: generate `<Nama>!` dan `<Nama> wins!` terpisah, daftarkan file/durasi/trigger dan tes. Voice ultimate tidak menggantikan announcer.
- Sifat kelas yang unik: <mis. telinga/ekor atau arm cannon; jaga identitas di semua frame>.

## Checklist selesai

- [ ] Base terkunci; original setiap versi dan log lengkap disimpan.
- [ ] Base jelas berbeda dari roster lama; bukan recolor atau karakter lama ditambah ciri ras.
- [ ] Jumlah pose, facing, celah, anggota tubuh, dan konsistensi aksesori diperiksa.
- [ ] Skala kepala **dan badan/recovery** dibandingkan dengan idle; invalid match ditandai.
- [ ] Normalisasi satu kali dari original; curation hanya integer translation.
- [ ] Canonical extraction/compose berhasil; tidak ada per-frame fit paksa.
- [ ] Atlas final tanpa frame kosong, tepi terpotong, atau chroma terlihat.
- [ ] Jump atletis dan tuck dapat dibedakan; putaran tidak mengganti ukuran tubuh.
- [ ] Efek keluar dari alat/telapak/muzzle yang benar setelah normalisasi.
- [ ] File atlas, manifest, wrapper JS, dan metrics sinkron.
- [ ] Tes kontrol, hit, cooldown/recharge, HP berlapis, cast release, pause/reset dijalankan.
- [ ] Browser dilihat pada keyframe penting; loop yang belum ditonton tidak diklaim mulus.
- [ ] Path loader diperbarui secara sengaja; karakter/aset lama tidak tertimpa.
- [ ] qa-notes.md memisahkan hasil angka, pengamatan render, dan batas yang belum diverifikasi.
