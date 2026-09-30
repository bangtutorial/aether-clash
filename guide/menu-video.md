# Background video main menu

Main menu memakai video loop dari **Higgsfield Seedance2.5,1080p**. Artwork faksi yang sama (`home-factions.png`, job `e0ac186a-ef20-4b0d-849c-c35d718e14c3`) dipakai sebagai start/end reference. Kamera tetap; banner dan partikel aether bergerak halus, tanpa karakter atau teks yang digenerate.

## File dan provenance

- Job video: `fc8bbce3-416c-494a-af1e-d7e4dde7ec05`.
- Model `seedance_2_5`, mode `omni_reference`, resolution `1080p`, ratio16:9, requested duration8s, `generate_audio:false`, bitrate high.
- Original: `assets/menu/originals/home-factions-seedance-1080p.mp4`, HEVC1920×1080/24fps,8.041667s.
- Runtime: [home-factions-loop.mp4](../assets/menu/home-factions-loop.mp4), H.264/yuv420p,1920×1080/24fps,180frame,**7.5s**, tanpa audio, sekitar1.42MB.
- video-generation.json menyimpan request, job, durasi, hasil probe/decode, metode loop, dan SHA256.

build_menu_loop.ps1 membuat export kompatibel browser, fast-start MP4, serta overlap0.5s antara akhir dan awal. Urutan gerak tetap maju, bukan ping-pong/reverse. Sumber generator tetap disimpan. Ukuran gambar tetap native1080p; tidak di-upscale dari720p.

## Runtime

- Video dekoratif `autoplay muted loop playsinline`, tidak menangkap klik/fokus. Tombol dan teks tetap HTML di atas gradient gelap yang sama.
- Poster tampil selama video belum siap atau tidak dapat mulai. Tidak ada layar kosong ketika media loading.
- Satu video element digunakan ulang saat kembali ke Home. Berpindah ke karakter/arena/About/result menjeda dan melepaskannya dari DOM; pertempuran tidak memutar video di belakangnya.
- Video dijeda saat Pengaturan terbuka atau tab tersembunyi, lalu dilanjutkan jika Home aktif.
- Checkbox **Animasi latar menu** di Pengaturan dapat menghentikan animasi. Preferensi OS reduced-motion menonaktifkan video secara default; pengguna dapat mengubah checkbox pada sesi berjalan.
- Suara video tidak ada, sehingga SFX menu dan voice petarung tetap terpisah. About/arena pertarungan tidak diganti video.
- Server lokal memberi MIME video/mp4 dan HTTP byte ranges untuk seek/loop. HEAD dan suffix range juga didukung.

## Verifikasi

Decode ffmpeg berhasil, file final1920×1080,H.264,24fps,7.5s tanpa audio. Contact sheet0–7s diperiksa untuk komposisi stabil dan identitas faksi. Nilai perbedaan frame dicatat di metadata sebagai diagnostik; tidak berarti sambungan generatif identik pixel demi pixel.

Browser nyata: videoWidth1920,videoHeight1080,readyState4,duration7.5,muted=true,loop=true,paused=false,error=null. Pause settings mempertahankan currentTime sekitar7.317s dan resume berjalan kembali. HTTPGET range0–1023 mengembalikan206/video/mp4 dan1024byte; HEAD200, suffix128byte206, range di luar file416. Semua90tes gameplay/voice/match tetap lolos.

Checkbox animasi diuji melalui UI: unchecked membuat paused=true dan waktu berhenti sekitar4.638s; diaktifkan kembali melanjutkan playback. Saat pindah ke character select, jumlah video di DOM menjadi0. Bukti tampilan main menu: `qa/menu-video/main-menu-loop.png`.
