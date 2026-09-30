# Voice ultimate ARCO — Dylan

Status: pengguna memilih **Dylan**. File final [arco-ultimate-dylan.mp3](../assets/audio/arco-ultimate-dylan.mp3) sudah dipasang pada awal ultimate/cut-in ARCO. Holden dan Archie tetap disimpan sebagai kandidat arsip, tidak dimainkan oleh runtime.

Script Inggris yang sama untuk setiap kandidat:

> Helios Squadron! Open fire!

Provider Higgsfield, model `text2speech_v2`, varian `elevenlabs`, `voice_type: preset`. Voice ID berasal dari daftar resmi Higgsfield dan ketiga voice dipilih pengguna untuk percobaan. Ini hasil generasi kalimat ultimate baru, bukan sampel preview bawaan voice.

| Kandidat | Voice ID | File |
| --- | --- | --- |
| Dylan | b847bc29-f184-583a-8ad9-d1f1e16d1a60 | dylan.mp3 |
| Holden | 3c9d6053-6334-592c-8997-4e325286af3f | holden.mp3 |
| Archie | bd072316-f77c-588b-b6e5-e46b9b03d008 | archie.mp3 |

generation.json menyimpan pilihan final, prompt, parameter, job ID, URL sumber, file lokal, durasi hasil probe, checksum, dan hasil verifikasi decode. File runtime identik dengan kandidat Dylan: SHA-256 `25ef0d218a87f53186f73363438dcea65dd5a065c103bee15fb9dd7e9d8aa249`. Durasi container hasil ffprobe sekitar 2,273 s; browser melaporkan durasi playable 2,24 s.

## Perilaku runtime

- Dylan dan Holden FENR dipreload pada HTMLAudioElement lokal terpisah tanpa autoplay, dengan satu voice aktif agar tidak bertumpuk. Tidak membutuhkan stream Higgsfield saat game dimainkan. Aturan prioritas voice pemain/AI: [fenr-voice.md](fenr-voice.md).
- Voice dimulai pada startSquadron setelah input pengguna yang valid. Tombol P yang ditolak cooldown tidak mengulang voice.
- Volume voice mengikuti slider game dengan pengali 1,25 (dibatasi 1); mute berlaku pada voice dan SFX. Gain SFX menjadi 38% selama voice sedang berjalan, lalu pulih setelah voice berakhir/berhenti.
- Pause dan pengaturan menjeda voice; resume melanjutkan posisi yang sama. Reset menghentikan dan mengembalikannya ke awal.
- Saat tab disembunyikan voice dijeda tanpa mengubah preferensi pause game. Voice yang sudah tidak relevan tidak diputar terlambat setelah summon selesai.
- Tidak ada perubahan pada cast 0,50 s, damage, cooldown, atau kebebasan bergerak. Audio tidak menahan karakter.
- Rejection autoplay/load ditangani tanpa merusak gameplay. Token tiap percobaan mencegah Promise play lama membatalkan voice baru setelah reset/pause/resume.
- Preview visual yang dipicu programmatically tanpa user gesture tidak mengeluarkan voice otomatis.

## Verifikasi

41 tes gameplay tetap lulus, ditambah 9 tes pada `node tests/ultimate-voice.test.cjs` untuk preload/start, duplikasi cast, pause/settings, reset, volume/mute/ducking, visibility, dan race/error Promise play.

Browser nyata: readyState4, durasi2,24 s, voiceActive=true, paused=false, playback time bergerak, start counter1, dan error kosong. Pause cepat saat awal voice mempertahankan active state; resume melanjutkan playback dengan start counter tetap1. Bukti ini memverifikasi pemutaran browser dan perilaku kontrol, bukan volume speaker/OS atau penilaian timbre melalui tool.
