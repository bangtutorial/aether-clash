# Acuan final game fighting

Status: 27 September 2026, setelah seluruh revisi pengguna. Ini acuan perilaku terbaru; laporan lama mencatat riwayat, bukan pengaturan yang harus dikembalikan. Sumber implementasi: [game.js](../game.js), [index.html](../index.html), dan [style.css](../style.css).

## Lingkup dan visual

- Demo lokal dengan pilihan pemain ARCO (Mecha), FENR (Demi-Human) dan MIRA (Mecha, pilot anak + robot; [mira-reference.md](mira-reference.md)) serta CORA (Demi-Human gagak bersayap; [cora-reference.md](cora-reference.md)) dan NAJA (Demi-Human kobra dengan urumi; [naja-reference.md](naja-reference.md)) serta HALDOR (Mecha tank pandai besi; [haldor-reference.md](haldor-reference.md)) ZANNI (Mecha badut lengan gunting; [zanni-reference.md](zanni-reference.md)) ISOLDE (Mecha ksatria kaki bangau; [isolde-reference.md](isolde-reference.md)) RHEA (Mecha zoner orrery; [rhea-reference.md](rhea-reference.md)) SOLAN (Demi-Human singa pedang besar; [solan-reference.md](solan-reference.md)) NIB (Demi-Human tikus kurir; [nib-reference.md](nib-reference.md)) dan EDDA (Demi-Human nenek kura-kura, counter; [edda-reference.md](edda-reference.md)). FENR menggantikan MOKU-01 sebagai AI lawan aktif. Detail kit dua bentuk dan sumber aset: [fenr-reference.md](fenr-reference.md).
- Main menu kini menyediakan VS Computer, Training, Pengaturan dan About. VS memilih pemain→lawan→arena/difficulty; ARCO, FENR, MIRA, CORA, NAJA, HALDOR, ZANNI, ISOLDE, RHEA, SOLAN, NIB dan EDDA tersedia sebagai CPU, dengan otak yang membaca pemain dan knob per difficulty ([cpu-ai.md](cpu-ai.md)); pilihan arena ada lima. Pertandingan pertama menang2ronde, maksimal3nomor ronde,90detik per ronde. Training memakai pemulihan KO lama dan AI pasif default. Detail [main-menu.md](main-menu.md).
- FENR bertransformasi menjadi werewolf BIPEDAL berpakaian sobek selama12detik; countdown di HUD pemilik, cooldown ultimate24detik setelah bentuk berakhir. Basic/I/O memiliki sprite, damage, ikon, dan efek berbeda pada bentuk werewolf. Skill deck lawan tidak ditampilkan.
- Anime chibi dengan pixel art detail tinggi / hi-bit. Hindari blok 8-bit besar, perubahan proporsi antargerakan, atau frame yang bergantian tajam dan buram.
- Tema abad pertengahan/Renaisans fantasi, siang cerah. Kamera arena diam; tidak mengikuti pemain dan tidak memakai parallax.
- Dunia simulasi 1280×720. Ground ARCO saat ini y=599, diukur dari lantai stage. Ukur ulang bila latar diganti.
- Canvas memenuhi viewport. Proyeksi karakter seragam, tidak diregangkan; latar menggunakan cover yang diselaraskan dengan lantai. Shake menggeser stage dan objek bersama, dengan overscan untuk menutup tepi kosong.

## Kontrol dan gerakan bersama

| Input | Perilaku final |
| --- | --- |
| A / D | Jalan ke kiri/kanan |
| Dua tap A atau D, lalu tahan | Lari; batas antar-tap 260 ms. Ini klarifikasi atas tulisan awal “Double WA” |
| W | Lompat; W kedua juga dapat memakai lompatan udara |
| S | Menunduk di lantai; mempercepat jatuh ketika sedang turun |
| Dua tap S | Salto/double jump; maksimum dua lompatan per airtime |
| Space | Satu serangan per tap; tiga tap mengantre attack1→attack2→attack3 |
| I / O / P | Skill1 / skill2 / ultimate |
| Esc / R | Pause / reset latihan |

Key repeat saat tombol ditahan tidak dianggap tap baru. Antrean kombo dibatasi tiga serangan. Lepas tombol, ganti arah, blur, dan visibility cleanup membersihkan sprint/riwayat tap. Blur tidak membuka menu pause otomatis.

| Parameter | Nilai saat ini |
| --- | --- |
| Jalan / lari | 320 / 520 px per detik |
| Akselerasi tanah / udara | 2800 / 1600 px per detik² |
| Kecepatan awal jump / double jump | 830 / 790 px per detik ke atas |
| Gravitasi / minimum fast fall | 2900 px per detik² / 1180 px per detik |
| Putaran double jump | 360° selama 0,28 detik |
| Simulasi | Fixed step 1/120 detik, render terpisah |

Lompat normal menahan **satu pose atletis** selama lintasan fisika: siku/kaki menekuk, bukan berdiri kaku. Jangan memutar ulang pose jongkok/takeoff ketika karakter sudah di udara. Double jump memakai satu pose menggulung, diputar mengelilingi pivot tubuh terukur. Bukan pose menendang. Sesudah putaran selesai, kembali langsung ke pose jump. Skala sprite tetap.

Selama salto, arah visual tidak berubah mendadak dan fast fall ditunda sampai putaran selesai. Satu input attack/skill valid terakhir dapat disimpan lalu dijalankan setelah roll. Reset atau hurt membatalkan antrean itu.

## HP: satu bar fisik, dua lapis nyata

Pemain dan target masing-masing **200 HP**, terdiri dari dua lapis 100 HP dalam **satu area bar HUD**. Warna cadangan berada di belakang warna utama.

    front   = clamp(hp - 100, 0, 100)
    reserve = clamp(hp,       0, 100)

| HP | Isi lapis depan | Isi cadangan | Tampilan |
| --- | --- | --- | --- |
| 200 | 100% | 100% | Warna depan menutupi seluruh cadangan |
| 140 | 40% | 100% | 40% warna depan, sisanya warna cadangan |
| 100 | 0% | 100% | Satu lapis cadangan penuh |
| 75 | 0% | 75% | Cadangan mulai berkurang |
| 0 | 0% | 0% | K.O. |

Ini **bukan dua baris vertikal**, bukan shield tambahan yang regenerasi sendiri, dan bukan damage trail yang turun terlambat. Kedua fill berada di parent `.life-track` yang sama. Target tidak dipaksa KO oleh ultimate; hanya total HP nol memicu KO. HP tidak direset setelah menerima skill biasa. Di mode latihan, target pulih setelah animasi KO/recovery; pemain memakai core restart ketika benar-benar kehabisan HP.

## Baseline power dan recharge

Nilai berada di objek `BALANCE` pada game.js. Ini baseline demo; karakter baru boleh punya efek/identitas berbeda, tetapi perubahan power harus dicatat dan diuji. Jangan menyebut baseline ini sebagai hasil keseimbangan multiplayer.

| Serangan | Damage | Cooldown | Knockback awal | Peran |
| --- | --- | --- | --- | --- |
| Basic 1 | 6 | Tidak ada | 75 px/s | Pembuka kombo |
| Basic 2 | 8 | Tidak ada | 100 px/s | Sambungan |
| Basic 3 | 12 | Tidak ada | 180 px/s | Finisher; total kombo 26 |
| I — Aether Bolt | 16 | 3 s | 140 px/s | Proyektil cepat, gerak bebas setelah peluru keluar |
| O — Seismic Drive | 24 | 6 s | 220 px/s | Hantaman area, radius damage 220 px |
| P — Helios Squadron | 4×12 = 48 | 18 s | 45 px/s tiap hit awal; 190 pada hit terakhir | Summon mandiri, dapat dibarengi aksi pemain |

Satu ultimate penuh menyisakan **152 dari 200 HP** pada target segar. Tidak ada forced KO/forced knockdown dari ultimate. Satu ayunan, peluru, atau laser hanya memberi satu hit pada target; efek yang masih terlihat tidak terus memberikan damage per frame.

Setiap basic attack yang mengenai target valid memajukan cooldown **semua skill sebesar 5% dari total cooldown masing-masing**:

    remaining = max(0, remaining - maxCooldown * 0.05)

- I: −0,15 s; O: −0,30 s; P: −0,90 s per hit.
- Tiga pukulan kombo yang masuk memberi 15%, selain berjalannya timer biasa.
- Meleset, target kebal/KO/down, dan hit skill tidak memberi bonus.
- Skill yang sudah siap tetap nol; bonus tidak disimpan sebagai saldo.
- Bingkai ikon mendapat kilatan mint singkat 0,22 s saat memperoleh bonus.

## Pisahkan pose cast, efek, dan cooldown

Tiga durasi ini bukan satu timer. Jangan mengunci karakter sampai seluruh VFX selesai.

- I melepas karakter saat proyektil diluncurkan, sekitar 0,18 s untuk atlas ARCO saat ini. Pose tembak tampil sebelum release; proyektil tetap bergerak sendiri.
- O memakai komitmen animasi sekitar 0,4 s dari empat frame pada 10 fps, impact sekitar 53% durasi.
- P hanya memakai pose summon **0,50 s**. Setelah itu karakter bebas jalan, lompat, berbalik, atau menggunakan serangan lain sementara drone masih aktif.
- Summon menyimpan arah dan posisi cast/target sendiri. Pemain berjalan atau terkena damage setelah cast tidak membatalkan drone. Cooldown dan guard terhadap summon ganda tetap berlaku.
- Hit-stop berlaku pada pukulan langsung/slam. Peluru dan laser summon tidak membekukan gerak pemiliknya.

## Timeline ultimate ARCO

| Bagian | Waktu simulasi dari cast |
| --- | --- |
| Banner cut-in | 0–0,78 s; masuk sampai 0,16 s, keluar mulai 0,57 s |
| Pose pemanggilan pemain | 0–0,50 s |
| Drone mulai masuk | 0,46 / 0,56 / 0,66 / 0,76 s |
| Perjalanan masuk tiap drone | 0,60 s |
| Empat laser | Mulai 1,50 s, selang 0,095 s |
| Umur visual setiap laser | 0,65 s; damage hanya sekali |
| Drone berangkat pergi / selesai | Mulai 2,24 s / seluruh rangkaian 2,85 s |

Drone berjumlah empat, memakai posisi formasi terpisah, dibatasi agar tidak terpotong di tepi arena. Target harus berada di arah cast yang valid. Titik laser berasal dari muzzle terukur pada aset drone, bukan pusat gambar. Pause membekukan banner/drone/cooldown bersama; reset membatalkan seluruh rangkaian dan damage yang belum terjadi.

Cut-in menggunakan ilustrasi ARCO baru, banner miring navy–cyan–emas, nama jurus besar dalam HTML, dan peredupan arena sesaat. Referensi pengguna hanya menjadi acuan pola interaksi; jangan menyalin karakter, teks, atau ornamen referensi mentah-mentah.

## HUD, efek, audio

- Dua status petarung saling berhadapan, portrait hasil generasi khusus, mode latihan ∞ di tengah, ikon skill bergambar.
- Portrait bukan crop sprite yang sedang dipakai. Generate ilustrasi avatar dan cut-in tersendiri memakai base sebagai referensi identitas.
- Font Rajdhani lokal di assets/fonts, dengan OFL.txt. Label/angka UI dibuat dengan HTML/canvas agar tetap tajam.
- Countdown memakai sapuan **hitam transparan radial searah jarum jam** pada ikon; tidak memakai angka countdown. Key binding statis Space/I/O/P tetap boleh ditampilkan.
- Tidak ada riwayat/chip tombol yang sedang ditekan pada layar.
- Setiap skill punya VFX berbeda. Efek tidak dibakar ke sprite karakter.
- Asap lari muncul tiap 30 px perjalanan nyata di tanah, dua puff kecil per emisi. Tidak muncul saat jalan, melompat, atau tertahan. Puff lama tetap memudar alami.
- Tidak ada kilatan brightness putih pada dummy, filter merah/blink pada hero, atau rotasi kecil terus-menerus saat dummy idle/hurt. Gunakan recoil/knockback, percikan, damage number, audio, dan stage shake yang terkendali.
- Audio diaktifkan dari input pengguna. Mute, volume, tes audio, fullscreen, dan hitbox tersedia dalam pengaturan.
- Voice ultimate final: **Dylan**, dibuat lewat Higgsfield/ElevenLabs, kalimat “Helios Squadron! Open fire!”. Diputar mulai cut-in, mengikuti mute/volume, pause/resume, dan reset. SFX direndahkan saat dialog berjalan. Lihat [ultimate-voice.md](ultimate-voice.md).
- Voice ultimate MIRA **Luna** “Rocket Parade!” dan CORA **Anika** “Fly, my ravens!” (juga NAJA **Soraya** “Dune Serpent!” HALDOR **Gideon** “Forge Quake!” ZANNI **Julian** “Grand Finale!” ISOLDE **Vesper** “Skyfall Lances!” RHEA **Chloe** “Grand Orrery!” SOLAN **Xavier** “Sunmane Roar!” NIB **Evan** “Special Delivery!” dan EDDA **Opal** “Elder Tortoise!”): kanal yang sama dengan Dylan/Holden, dimulai saat summon dibuat dan selesai sendiri walaupun summon masih berjalan. Lihat [mira-cora-voice.md](mira-cora-voice.md).

## Verifikasi wajib setelah perubahan

Jalankan `node tests/gameplay.test.cjs` dan `node --check game.js`. Saat acuan ini ditulis ada **41 tes gameplay lulus**. Tes memakai shim DOM/canvas/audio dan tidak membuktikan mutu render atau speaker.

Untuk voice, jalankan juga `node tests/ultimate-voice.test.cjs` (**9 tes audio-control**) dan `node tests/summon-voice.test.cjs` (**7 tes Luna/Anika**). Periksa file audio dimuat dan playback berjalan pada browser dari input pengguna.

Periksa browser: seluruh aset dimuat; gerak/jump; release I; berjalan saat drone menembak; kedua lapis HP pada 200/140/100/75/0; bonus cooldown; asap di kaki; cut-in dan radial cooldown; pause/reset; layout lebar dan sempit. Bedakan bukti kode, angka atlas, screenshot, dan gerakan yang benar-benar diamati. Lihat [character-workflow.md](character-workflow.md) untuk membuat karakter berikutnya.
