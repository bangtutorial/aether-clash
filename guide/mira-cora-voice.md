# Voice ultimate MIRA dan CORA — Luna dan Anika

Status: pengguna memilih **Luna** untuk MIRA dan **Anika** untuk CORA dari katalog preset Higgsfield, lalu meminta kalimat pendek 1–2 kata. Keduanya sudah dipasang pada ultimate pemain maupun CPU. Voice NAJA (Soraya, “Dune Serpent!”) dan HALDOR (Gideon, “Forge Quake!”) memakai kanal dan aturan yang sama; detailnya di [naja-reference.md](naja-reference.md#voice) dan [haldor-reference.md](haldor-reference.md#voice).

| Karakter | Kalimat runtime | File | Durasi |
| --- | --- | --- | --- |
| MIRA | Rocket Parade! | [mira-ultimate-luna.mp3](../assets/mira/audio/mira-ultimate-luna.mp3) | 1.44 s container, 1.40 s di browser |
| CORA | Fly, my ravens! | [cora-ultimate-anika.mp3](../assets/cora/audio/cora-ultimate-anika.mp3) | 1.78 s container, 1.75 s di browser |

Provider: Higgsfield. Model `text2speech_v2`, varian `elevenlabs`, `voice_type: preset`. Ini audio hasil generasi baru, bukan sample preview katalog.

| Voice | ID preset | Take asli (arsip) |
| --- | --- | --- |
| Luna | 375a3398-e3b4-4f91-845d-42181e352899 | “Rocket Parade! Fire everything!” 3.24 s — luna.mp3 |
| Anika | 4b2dc8f3-5e8b-59a9-9a5c-85620e44c033 | “Fly, my ravens! Night Murmuration!” 3.63 s — anika.mp3; variasi nama di depan 3.87 s — anika-name-first.mp3 |

Generation record (MIRA, CORA) menyimpan prompt, parameter, job ID, URL hasil, durasi, format, SHA256, hasil decode ffmpeg, dan cara file runtime diturunkan.

## Pemilihan dan pemotongan

- Katalog hanya memberi nama dan gender. Sebagai bantu, 70 preview suara wanita diukur: pitch median, rentang pitch, kecerahan dan tempo. Luna termasuk yang tertinggi (median ±281 Hz), cocok untuk pilot anak. Anika berada di tengah-rendah (±186 Hz) dengan rentang sempit, sehingga terdengar tenang. Angka ini bukan penilaian akting; pilihan akhir dari pengguna.
- Take pertama 3.2–3.9 s, lebih lama dari salvo roket (2.3 s) dan gelombang gagak (2.4 s). Pengguna meminta 1–2 kata dengan contoh “Rocket Parade!” dan “Fly, my ravens!”.
- Kedua frasa itu sudah ada di awal take. File runtime adalah frasa pertama tersebut, dipotong di tengah jeda antarkalimat (−50 dB: Luna 1.27–1.60 s, Anika 1.62–2.04 s), fade-out 80 ms, lalu encode ulang MP3 128 kbps mono. Tidak ada generate ulang, jadi intonasi sama dengan take yang sudah didengar.

## Perilaku runtime

- Luna dan Anika dipreload bersama Dylan dan Holden pada satu saluran suara karakter. Tidak ada autoplay sebelum interaksi pengguna.
- Voice dimulai saat summon dibuat (Rocket Parade / Night Murmuration), untuk pemain maupun CPU. Tombol P yang ditolak cooldown tidak mengulang voice.
- Ucapan pemain menggantikan ucapan CPU; CPU tidak memotong pemain. Announcer Grady tetap berprioritas di atas voice karakter.
- Kalimat tidak terikat umur summon. Jam voice sendiri hanya berjalan saat pertandingan berjalan. Kalimat berhenti saat file selesai, caster K.O., reset, kembali ke menu, atau akhir ronde. Kalimat pendek sekarang selesai sebelum roket/gagak habis; kalimat yang lebih panjang pun tidak akan terpotong ketika summon selesai.
- Pause, Pengaturan dan halaman tersembunyi menjeda lalu melanjutkan posisi yang sama. Volume/mute dan penurunan SFX menjadi 38% sama seperti Dylan/Holden.

## Verifikasi

- Kedua file runtime lolos decode ffmpeg; checksum ada di generation record.
- `node tests/summon-voice.test.cjs`: 7 tes untuk preload tanpa autoplay, satu kali per cast, kalimat selesai saat salvo masih terbang, kalimat panjang (simulasi 3 s) tetap utuh setelah summon selesai, reset/restart, pause/resume, K.O. caster, serta CPU CORA yang digantikan ultimate MIRA pemain. Sembilan suite proyek: 142 tes lulus.
- Browser localhost dengan klik dan tombol P nyata: Luna (1.40 s) dan Anika (1.75 s) aktif dengan waktu playback berjalan, tanpa error, dan selesai sebelum summon berakhir. Ini bukti pemutaran di browser, bukan penilaian timbre atau volume speaker.
