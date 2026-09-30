# Announcer sistem — Grady

Status: **Grady dipilih pengguna dan dikunci sebagai voice over sistem AETHER CLASH**. Berlaku untuk seluruh roster sekarang dan karakter baru. Voice ultimate karakter tetap terpisah: Dylan untuk ARCO, Holden untuk FENR, Luna untuk MIRA, Anika untuk CORA.

## Identitas dan sumber

- Provider: Higgsfield; model `text2speech_v2`, variant `elevenlabs`.
- Voice: **Grady**, `voice_id=e2a2d2e6-9ed2-59cd-82af-feaa27f8a678`, `voice_type=preset`.
- Bahasa Inggris. Lock resmi: voice-lock.json.
- Generation record menyimpan request persis, job, URL, durasi, SHA256, dan hasil decode setiap MP3. Manifest memasangkan file dan durasi ke cue.
- Dua belas klip awal digenerate terpisah; `select_mira`/`mira_wins` lalu `select_cora`/`cora_wins` ditambahkan dengan pasangan voice yang sama saat MIRA dan CORA masuk roster (total 16). Sampel gabungan Grady/Arthur/Reid di folder announcer-candidates hanya arsip audisi, tidak dipakai runtime.

## Cue aktif

| Cue | Ucapan | Trigger |
| --- | --- | --- |
| select_arco / select_fenr / select_mira / select_cora | Arco! / Fenr! / Mira! / Cora! | Konfirmasi pemain atau lawan, bukan hover panel |
| round_1 / round_2 / round_3 | Round one! / Round two! / Round three! | Awal ronde VS Computer |
| fight | Fight! | Setelah pengumuman nomor ronde |
| ko | K.O.! | Salah satu petarung KO |
| arco_wins / fenr_wins / mira_wins / cora_wins | Arco wins! / Fenr wins! / Mira wins! / Cora wins! | Setelah panggilan hasil ronde, sesuai identitas pemenang |
| time_up | Time up! | Waktu ronde habis |
| draw | Draw! | Hasil seri, nomor ronde diulang |
| double_ko | Double K.O.! | Kedua petarung KO bersamaan |

## Playback dan timing

`announcer.js` menyediakan satu kanal dengan antrean. `game.js` menghubungkan event, `menu.js` memanggil nama saat konfirmasi, dan `match.js` menyesuaikan waktu intro dengan durasi manifest. Tidak ada autoplay sebelum interaksi pengguna. Training tidak memakai pengumuman ronde kompetitif.

FIGHT dimulai setelah `max(1.05, durasi round + 0.12)` detik; fase intro berakhir setelah `max(1.85, waktu FIGHT + durasi fight + 0.10)`. Klip Round two lebih panjang (sekitar 2.194 detik), sehingga intro ronde kedua juga lebih panjang. Jangan mengembalikan durasi tetap yang memotong klip. Fase hasil menunggu paling sedikit `max(2.2, jumlah durasi panggilan hasil + 0.5)` detik.

Announcer berprioritas di atas voice ultimate; voice karakter dihentikan saat pengumuman dimulai. SFX diturunkan selama ucapan. Master volume dan mute berlaku untuk semua klip. Pause dan Pengaturan menjeda lalu melanjutkan posisi suara. Reset, kembali menu, dan halaman tersembunyi membersihkan panggilan lama agar tidak terdengar terlambat. Penolakan playback, file gagal, dan event lama tidak boleh menghentikan pertandingan; watchdog membatasi antrean yang macet.

## Menambah karakter

Baca voice-lock sebelum generate. Gunakan Grady dengan pasangan ID/type yang sama untuk `<Nama>!` dan `<Nama> wins!`, masing-masing satu file. Simpan prompt/job/checksum/durasi, perbarui manifest JSON dan JS, registrasi trigger runtime, serta tes pemilihan dan kemenangan. Jangan mengganti announcer dengan voice ultimate karakter atau preset baru tanpa instruksi pengguna.

## Verifikasi

Semua 12 file awal, dua klip MIRA (1.306 s dan 1.646 s) dan dua klip CORA (0.914 s dan 1.306 s) lolos decode ffmpeg. Sembilan suite berjumlah **142 tes lulus**, termasuk 13 tes announcer untuk gating, antrean, timing, hasil, prioritas, pause, mute, reset, visibility, dan kegagalan playback.

Browser localhost diperiksa di tab QA terpisah: sebelum interaksi starts=0; konfirmasi ARCO dan FENR memulai cue sesuai nama; Round 1 lalu Fight menaikkan starts menjadi 4 dan selesai tanpa announcerError. Playback HTMLAudio teramati berjalan (paused=false dan currentTime positif). Pemeriksaan ini membuktikan integrasi playback, bukan penilaian timbre melalui speaker; pemilihan timbre Grady berasal dari audisi pengguna.
