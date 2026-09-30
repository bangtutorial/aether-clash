# Voice ultimate FENR — Holden

Status: pengguna memilih **Holden**, sudah dipasang pada awal Feral Awakening/cut-in pemain maupun AI. File runtime: [fenr-ultimate-holden.mp3](../assets/fenr/audio/fenr-ultimate-holden.mp3). Archie dan Grady tetap menjadi arsip kandidat.

Kalimat Inggris yang sama untuk Holden, Archie, dan Grady:

> Unleash the beast!

Provider: Higgsfield. Model `text2speech_v2`, varian `elevenlabs`, `voice_type: preset`. Ini audio hasil generasi baru untuk FENR, bukan sample preview katalog atau audio ARCO.

| Voice | ID preset | File |
| --- | --- | --- |
| Holden | 3c9d6053-6334-592c-8997-4e325286af3f | holden.mp3 |
| Archie | bd072316-f77c-588b-b6e5-e46b9b03d008 | archie.mp3 |
| Grady | e2a2d2e6-9ed2-59cd-82af-feaa27f8a678 | grady.mp3 |

Generation record menyimpan prompt, parameter lengkap, job ID, URL hasil, durasi, format, SHA256, dan hasil decode ffmpeg. Pemeriksaan decode memastikan file audio valid; tidak menilai timbre/akting atau memastikan suara sudah dimainkan speaker.

## Perilaku runtime

- Holden dan Dylan dipreload sebagai dua file lokal, dengan satu saluran percakapan aktif. Tidak ada autoplay sebelum interaksi pengguna membuka audio. AI yang sudah terlewat tidak memutar ucapan tertunda saat audio baru dibuka.
- Ultimate pemain memprioritaskan voice pemain; AI tidak menyela voice yang sedang aktif. Jika pemain memulai ultimate ketika AI sedang berbicara, ucapan AI berhenti agar tidak bertumpuk.
- Voice mengikuti volume/mute; SFX diturunkan menjadi38% selama ucapan berjalan. Pause/pengaturan/halaman tersembunyi menjeda voice; resume melanjutkan posisinya.
- Reset/pergantian karakter menghentikan voice dan mengembalikannya ke awal. Cast AI yang terputus atau pemilik KO menghentikan ucapan yang tidak lagi relevan.
- Voice tetap bisa selesai sesudah banner cut-in0.78s berlalu. Audio tidak memperpanjang cast0.62s atau transformasi12s dan tidak menahan gerakan.
- Akhir summon ARCO tidak menghentikan Holden yang berasal dari transformasi FENR. Event/rejection dari file atau pemutaran lama tidak mengambil alih voice baru.

## Verifikasi

File runtime identik dengan kandidat Holden terpilih: SHA256 `367de2be24809ba23d308181e7fe9a0af2b13c3ecf2e89b23e33cbe48177477e`. Durasi container1.410612s, durasi playable browser1.36s. Browser: preload readyState4, voiceHolden/ownerplayer, playback melaju dari0.016471s sebelum pause ke0.067883s setelah resume, tanpa error.

`node tests/fenr-voice.test.cjs`:9tes meliputi pemain/AI, gating interaksi, durasi voice melewati cut-in, pause/settings/volume/mute, prioritas satu speaker, interruption/reset, pergantian karakter, visibility, playback rejection dan race antarfile. Semua74tes proyek lulus (41gameplay,15FENR,9Dylan,9Holden). Bukti playback/decoding bukan penilaian timbre atau volume speaker OS.
