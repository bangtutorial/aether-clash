# Main menu, character select dan VS Computer

Status: main menu menjadi layar awal. Implementasi UI ada di [menu.js](../menu.js)/[menu.css](../menu.css), aturan ronde/difficulty/arena di [match.js](../match.js), dan integrasi combat di [game.js](../game.js).

Branding final: **AETHER CLASH — Mecha vs Demi-Human**, berpusat pada dua faksi dan roster yang akan berkembang. Home/About tidak memakai ARCO/FENR sebagai pasangan tokoh utama. Lihat [branding.md](branding.md); key art aktif `home-factions.png`, sedangkan artwork duo awal diarsipkan.

Background Home memakai [video loop Seedance2.5 1080p](menu-video.md),7.5s,tanpa audio. Artwork statis menjadi poster/fallback; menu dan teks tetap elemen HTML. Pengaturan menyediakan checkbox Animasi latar menu.

## Alur

- **VS Computer**: pilih pemain → pilih lawan → pilih arena dan kesulitan → ROUND1 → FIGHT → pertandingan.
- **Training**: pilih pemain → partner latihan → arena. Waktu tidak terbatas, AI pasif secara default, HP kembali setelah KO. Pengaturan dapat mengaktifkan AI atau mengganti pemain selama Training.
- **Pengaturan**: audio, volume, tes suara, fullscreen, hitbox, panduan kontrol. Pilihan karakter/AI latihan disembunyikan di main menu dan VS agar pertandingan tidak berubah di tengah ronde.
- **About**: pengantar dunia/karakter dan kredit visual, suara, serta font.
- Esc menjeda pertarungan; menu pause menyediakan lanjut, mulai ulang, dan kembali ke main menu. Di menu seleksi, Esc kembali satu tahap.

Pilih karakter dengan klik atau WASD/panah lalu Enter. Slot pemain dikunci terlebih dahulu; baru lawan dipilih. Saat karakter (pemain maupun CPU) dikonfirmasi, gambar panel dan art besarnya menjadi lebih cerah 3 kali (0,3 s tiap kedipan, tanpa glow) dengan bunyi lock-in dan dua ketukan pelan, lalu baru pindah ke langkah berikutnya; input diabaikan selama 0,9 s itu. Mirror match (ARCO vs ARCO atau FENR vs FENR) diperbolehkan. Ada **12 panel**, semuanya karakter playable: ARCO, FENR, MIRA, CORA, NAJA, HALDOR, ZANNI, ISOLDE, RHEA, SOLAN, NIB dan EDDA. Slot terkunci tetap bisa disorot tetapi tidak dapat dikonfirmasi; baik UI maupun engine menolak ID karakter yang tidak tersedia.

Sound navigasi, konfirmasi, kembali, dan locked menggunakan nada arcade Web Audio yang berbeda. Sound mengikuti master volume/mute dan baru diaktifkan setelah interaksi pengguna. Hover/fokus hanya berbunyi saat panel berubah, dengan pembatas75ms agar tidak beruntun terlalu rapat. Ini SFX, bukan voice announcer.

## Pertandingan: pertama menang dua ronde

Pengguna menegaskan **menang2ronde dari maksimal3**. Setiap ronde90detik, HP200perpetarung (dua lapis100pada satu bar). Damage/cooldown karakter tetap sama di semua kesulitan.

Urutan fase: intro ROUNDn → FIGHT → fight → KO/result ronde → ronde berikutnya atau hasil pertandingan. Durasi intro dan hasil menyesuaikan durasi klip Grady di manifest agar pengumuman tidak terpotong; batas minimum lama 1.85s/2.2s tetap berlaku. Lihat [timing announcer](announcer-system.md). Input serangan dan AI diblokir saat intro/KO/menu. Pause membekukan seluruh timer.

- Skor2–0 selesai di ronde2;1–1 masuk ronde3; kemenangan kedua mengakhiri pertandingan.
- Timeout: HP lebih tinggi menang. HP sama atau doubleKO mengulang nomor ronde yang sama tanpa menambah skor; tidak membuat ROUND4.
- Ronde berikutnya membersihkan proyektil, drone, transformasi, voice, cooldown, posisi dan HP. Skor pertandingan tetap.
- Kemenangan/kekalahan menampilkan petarung pemenang, skor, Rematch, Character Select, dan Main Menu.
- R memulai ulang pertandingan dari ronde1 dan skor0–0; di Training tetap reset latihan.

`__game.onRoundCue(callback)` tetap mengeluarkan event round/fight untuk ronde1/2/3. **Grady sudah dikunci dan dipasang** untuk nama karakter saat konfirmasi, ROUND1/2/3, FIGHT, KO dan hasil. Enam belas cue terpisah tersedia; [acuan announcer](announcer-system.md) menjelaskan antrean, prioritas dan sinkronisasi. Voice ultimate Dylan/Holden/Luna/Anika tetap bekerja di kanal karakter.

## CPU

Keenam petarung bisa dipilih sebagai CPU. HALDOR memakai Forge Chain, Slag Shot (lob), Steam Ram dan Forge Quake (gelombang lava tiga kali ke dua arah); CPU lawan keluar dari titik jatuh lob bila membacanya tepat waktu. NAJA memakai Viper Lash, Sand Fang, Urumi Cyclone dan Dune Serpent (riak pasir yang memburu, tiga semburan kobra) dengan serangan per owner; CPU lawan keluar dari riak yang terkunci bila membacanya tepat waktu. CORA memakai Feather Waltz, Quill Volley, Wing Gust dan Night Murmuration (tiga gelombang gagak) dengan kawanan per owner. MIRA memakai Mitten Chain, Star Popper, Candy Crash dan Rocket Parade (12 roket) dengan formasi roket per owner. ARCO mempunyai tiga basic, Aether Bolt, Seismic Drive, dan empat drone Helios Squadron. FENR memakai kit manusia/werewolf serta Holden. Formasi drone pemain dan CPU memiliki owner terpisah sehingga mirror match tidak mencampur target atau efek. Voice tetap satu speaker aktif, dengan prioritas pemain.

| Level | Kecepatan | Reaksi | Recovery | Rantai | Ultimate setelah | Hindar / Punish | Kebal CPU / batas combo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 0.95 | 0.34 s | 0.60 s | 2 | 10 s | 25% / 30% | 0.45 s / 6 hit |
| Medium | 1.10 | 0.20 s | 0.38 s | 3 | 7 s | 55% / 60% | 0.9 s / 5 hit |
| Hard | 1.22 | 0.13 s | 0.22 s | 3 | 5 s | 78% / 82% | 0.9 s / 4 hit |
| Excellent | 1.32 | 0.08 s | 0.12 s | 3 | 3.5 s | 92% / 95% | 0.9 s / 4 hit |

CPU kini membaca pemain: melompati proyektil, mundur atau melompat dari serangan, punish recovery, anti-air, tidak memukul saat pemain kebal, dan menyambung rantai hanya bila hit pertama kena. Di Versus, CPU memakai aturan kebal setelah stun seperti pemain, plus batas combo per stun. Tidak ada bonus HP atau multiplier damage. Penjelasan lengkap dan hasil benchmark ada di [cpu-ai.md](cpu-ai.md).

## Arena dan aset menu

| Arena | File | GroundY |
| --- | --- | ---: |
| Bellora Courtyard | assets/stage.png |599|
| Sunspire Terrace | assets/menu/sunspire.png |599|
| Azure Harbor | assets/menu/azure-harbor.png |599|
| Elderwood Glade (hutan, siang) | assets/menu/elderwood.png | 606 |
| Moonrise Bastion (malam, bulan purnama) | assets/menu/moonrise.png | 618 |

Semua arena berukuran 1280×720 dengan kamera diam. Tiga arena pertama cerah siang hari; Elderwood adalah hutan bercahaya matahari, dan Moonrise adalah benteng malam di bawah bulan purnama dengan lantai tetap terang agar petarung terbaca. Elderwood/Moonrise punya log sendiri (2 varian per arena, groundY diukur dari pita lantai). Dua arena baru dan home key art digenerate melalui Higgsfield Seedream5.0Pro,2k. Log mencatat prompt, referensi, job dan checksum. Sumber immutable ada di `assets/menu/originals/`.

Full-body selection art memakai base ARCO B/FENR C yang telah disetujui, diproses canonical sprite-gen cutout melalui menu_assets.py; identitas tidak digenerate ulang. Avatar lock adalah [SVG](../assets/menu/locked.svg) siluet generik, bukan konsep karakter baru.

## Menambah karakter/arena berikutnya

Tambahkan definisi karakter dan portrait/art di `menu.js`, ganti salah satu slot locked pada roster, lalu daftarkan manifest, atlas, kit, voice dan AI di engine. Jangan membuka panel tanpa aset dan kemampuan yang siap. Arena ditambahkan di `MatchRules.stages` serta loader gambar engine; ukur groundY sebelum digunakan. UI tidak memuat frame intermediate sprite.

## QA

`node tests/match.test.cjs`:16tes aturan/engine baru, mencakup menu freeze, pemilihan terpisah, ID terkunci, input intro,2–0/1–1/round3, timeout/draw/doubleKO, reset ronde, training, NPC ARCO, dua formasi drone bersamaan, difficulty, rematch dan hook announcer. Bersama tes karakter/audio dan 13 tes announcer,103 tes lulus.

Browser diperiksa pada viewport desktop default: home, roster12slot, navigasi keyboard, penolakan lock, pemainFENR→lawanARCO, AzureHarbor/Excellent, pertarungan CPU ARCO, Training, Pengaturan, About, dan layar hasil. SFX diverifikasi melalui AudioContext berjalan dan sumber audio dibuat; tidak ada klaim audisi speaker OS.

qa-match.html memberikan fixture visual deterministik untuk `scene=round1`, `fight`, `round2`, `round3`, `victory`, `defeat`. Ronde3/hasil2–1 pada screenshot berasal dari fixture ini; aturan menang/kalah juga diuji independen di unit test. Screenshot tersimpan di `qa/menu/`. Tata letak responsif tersedia di CSS; bukti browser yang dicatat adalah viewport desktop yang benar-benar diperiksa.
