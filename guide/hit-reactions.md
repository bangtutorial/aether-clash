# Hit feedback, hurt, dan KO

Acuan ini mengikuti [gameplay final](gameplay-standard.md).

## Aset karakter

Petarung baru tetap menyiapkan hurt 4 dan down 4 dengan base yang sama. Hurt: recoil → stagger → regain balance → guard. Down: jatuh ke belakang relatif facing, lalu rebah. Hadap kanan berarti kepala jatuh ke kiri; arah lain memakai runtime flip.

Jaga ukuran kepala, torso, dan anggota tubuh. Pose rebah tidak boleh mengecil agar muat slot. Kurangi ukuran gambar SEMUA pose dalam prompt/generator untuk memberi ruang, lalu normalisasi anatomi terhadap idle. Jika pose saling menempel, utamakan regenerasi row dengan gap yang jelas. Tidak ada efek/blood/impact star yang dibakar ke sprite.

Demo saat ini memakai satu prop dummy, bukan petarung musuh beranimasi. Hurt dummy ditunjukkan lewat state, knockback dan VFX; tidak memakai row hurt ARCO. Jangan mengklaim musuh AI atau animasi bangkit petarung baru sudah tersedia hanya karena asetnya ada.

## Feedback saat hit valid

| Bagian | Perilaku saat ini |
| --- | --- |
| Hit-stop | Melee/slam boleh: ringan0,045 s, kategori berat saat damage≥30 memakai0,085 s |
| Proyektil / drone | Tidak memakai global hit-stop agar pemilik tetap dapat bergerak |
| Warna target | Tidak diberi brightness putih, filter merah, atau blink alpha |
| Pose idle/hurt dummy | Tidak diberi rotasi kecil berulang; hindari pixel shimmer/glitch |
| Percikan / angka / suara | Di titik benturan atau emitter terukur, satu event per hit |
| Knockback | Mengikuti arah benturan; parameter sumber serangan ada di BALANCE |
| Shake | Seluruh stage, singkat dan terkendali; tepi kosong ditutup overscan. Trauma selalu meluruh ke nol, termasuk saat fase intro/K.O. Akhir ronde (K.O., double K.O., time up) mengenolkan trauma sehingga layar K.O. diam, tidak bergetar |

O saat ini damage 24 sehingga tidak otomatis masuk kategori hit-stop≥30; jangan menganggap nama “heavy” sama dengan cabang threshold kode. Sumber kebenaran adalah parameter dan kondisi engine saat ini.

## Pemain

- Hurt mengunci input sekitar 0,42 s, lalu immunity 0,9 s; immunity tidak berarti sprite berkedip.
- Skill memiliki perlindungan hanya selama komitmen cast yang masih aktif. Setelah pose summon0,5 s selesai, pemain dapat bergerak **dan dapat terkena damage**; drone tetap melanjutkan tugas.
- Projectile I melepas karakter ketika peluru keluar. Jangan memakai durasi visual proyektil untuk memperpanjang input lock.
- Kedua lapis HP total 200 harus habis sebelum pemain down/core restart. Latihan memulihkan pemain setelah sekitar 1,7 s; ini belum sistem ronde kompetitif.
- Pada demo, receiveHit diuji lewat hook diagnostik; dummy normal belum menyerang pemain.

## Target latihan

HP target juga200 dalam satu bar berlapis. Hit biasa tetap mengurangi HP, tanpa refill setelah hurt. Ultimate tidak memaksa jatuh/KO.

Saat HP benar-benar nol: state down, recoil/jatuh, kemudian recover setelah 1,7 s. Recovery sekitar 0,4 s, setelah itu target latihan mengisi HP kembali dan kebal0,5 s. Target down/recover/kebal tidak menerima hit baru dan tidak memberi bonus recharge basic.

Jika kelak ada mekanik knockdown nonfatal, jangan mengisi HP hanya karena target bangkit. KO dan knockdown adalah kondisi berbeda.

## Checklist integrasi karakter lain

- [ ] Hurt/down berasal dari identitas yang sama dan skalanya diperiksa terhadap idle.
- [ ] Satu ayunan/peluru/laser tidak memberi damage ulang setiap frame.
- [ ] Hit yang ditolak tidak memberi bonus cooldown.
- [ ] Tidak ada brightness flash, shimmer idle, atau alpha blink yang sebelumnya ditolak pengguna.
- [ ] Owner summon bebas setelah cast dan tidak dibekukan oleh hit laser.
- [ ] Target baru KO setelah kedua lapis HP habis; damage biasa tidak direset.
- [ ] Pause/reset menghentikan atau membersihkan seluruh state yang relevan.
- [ ] Jika menambahkan AI lawan, telegraph/range/recovery dan animasinya dibuat serta diuji tersendiri.

