# CPU AI — cara lawan komputer berpikir

Status: 28 September 2026. Pengguna melaporkan CPU level Excellent "biasa aja" dan level di bawahnya makin gampang. CPU lama diganti dengan "otak" baru di [game.js](../game.js) (`updateFenrAI` dan fungsi `cpu*`). Angka per level ada di `MatchRules.difficulties` ([match.js](../match.js)).

## Kenapa CPU lama lemah

- Bergerak berdasarkan timer. Jalannya 135–205 px/s (pemain jalan 320, lari 520), dan hanya menyerang bila jarak < 105 px.
- Tidak membaca pemain sama sekali: tidak melompati proyektil, tidak mundur dari serangan, tidak punish, tidak anti-air.
- Memakai ultimate setelah N detik tanpa melihat situasi.
- Sering memukul saat pemain sedang kebal (0,9 s setelah terkena hit), sehingga pukulannya terbuang.
- Pemain bisa "mengunci" CPU. Setelah rantai 3 hit, CPU masih ter-stun, lalu pemain memulai rantai baru sebelum CPU sempat bergerak. Pemain punya kebal 0,9 s setelah stun, sedangkan CPU tidak.

## Otak CPU baru

1. **Membaca dengan jeda manusia (`reaction`).** Serangan, lompatan dan proyektil pemain baru "terlihat" setelah jeda itu. Setiap gerakan pemain dibaca sekali.
2. **Menghindari proyektil.** CPU menghitung kapan tembakan sampai dan setinggi apa. Ia lalu melompat, atau double jump untuk tembakan tinggi, supaya kakinya di atas proyektil tepat saat kontak.
3. **Menghindari serangan.** Kalau serangan pemain dalam jangkauan, CPU mundur keluar jangkauan. Kalau waktunya tidak cukup atau terpojok di dinding, CPU melompat di atasnya. Sesudah itu CPU bisa langsung punish.
4. **Punish.** Serangan yang meleset membuka pemain selama masa recovery, jadi CPU langsung maju. Skill dan ultimate membuat pemain kebal, jadi CPU menunggu dan memukul tepat saat gerakan itu selesai.
5. **Anti-air.** Pemain yang turun dari lompatan disambut pukulan darat.
6. **Tidak membuang pukulan.** CPU memperhitungkan waktu kena setiap gerakannya. Saat pemain kebal (setelah stun atau selama skill), CPU menunggu di luar jangkauan pemain, lalu maju supaya pukulannya mendarat tepat saat kebal habis.
7. **Combo terkonfirmasi.** Rantai basic hanya dilanjutkan kalau hit sebelumnya kena. Kalau knockback membuat jarak terlalu jauh, CPU melangkah dulu selama stun masih ada. Rantai ditutup dengan skill (ender). CPU tidak pernah memulai serangan baru pada pemain yang sedang ter-stun, jadi CPU tidak punya combo tak terbatas.
8. **Jarak.** Kalau pemain mendekat atau menekan tombol, CPU memukul duluan dari jangkauan penuh (memperhitungkan langkah pemain). Kalau pemain diam, CPU mendekat ke jarak di mana seluruh rantai kena. CPU berlari bila jauh dan memakai proyektil atau skill yang jangkauannya lebih panjang.
9. **Ultimate.** Setelah `ultimateAfter`, CPU memakainya pada kesempatan pertama.
10. **Riak Dune Serpent.** Saat riak ultimate NAJA milik pemain terkunci di bawah CPU, CPU membacanya setelah `reaction`, lalu (peluang `evade`) berlari keluar lewat sisi terdekat yang tidak menabrak dinding sampai kobra menyembur. Riak terkunci 0.42 s sebelum gigitan, jadi Excellent biasanya lolos sedangkan Easy terlambat.
11. **Proyektil melambung.** Slag Shot HALDOR jatuh di bawah gravitasi, jadi tidak dilompati. CPU membaca titik jatuhnya setelah `reaction`, lalu (peluang `evade`) berlari keluar dari percikan lewat sisi terdekat sampai bola mendarat. Gelombang Forge Quake adalah proyektil lantai biasa, jadi aturan lompat (poin 2) berlaku.

## Aturan adil (tanpa curang)

- Damage dan HP **tidak pernah** diubah oleh difficulty.
- Mode Versus: stun CPU 0,5 s, jadi rantai 3 hit pemain tetap tersambung penuh. Setelah stun habis, CPU mendapat kebal (`immunity`) seperti pemain. Batas combo (`comboCap`) memberi kebal lebih awal bila satu stun sudah menerima N hit, supaya rantai yang diulang-ulang tidak mengunci CPU.
- Training tidak memakai kebal maupun batas combo, jadi dummy tetap terbuka untuk latihan combo.

| Level | Kecepatan | Reaksi | Recovery | Rantai | Ultimate | Agresif | Hindar | Punish | Anti-air | Ender | Salah | Kebal CPU | Batas combo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Easy | 0.95 | 0.34 s | 0.60 s | 2 | 10 s | 60% | 25% | 30% | 25% | 15% | 22% | 0.45 s | 6 hit |
| Medium | 1.10 | 0.20 s | 0.38 s | 3 | 7 s | 80% | 55% | 60% | 55% | 50% | 8% | 0.9 s | 5 hit |
| Hard | 1.22 | 0.13 s | 0.22 s | 3 | 5 s | 90% | 78% | 82% | 78% | 85% | 3% | 0.9 s | 4 hit |
| Excellent | 1.32 | 0.08 s | 0.12 s | 3 | 3.5 s | 97% | 92% | 95% | 90% | 100% | 0% | 0.9 s | 4 hit |

"Salah" adalah peluang CPU menyerang saat pemain kebal atau menyambung rantai secara buta. "Ender" adalah peluang menutup rantai yang kena dengan skill.

## Hasil benchmark

`node tools/cpu_bench.cjs <root> [<salinan versi lama>]` menjalankan tiga skenario untuk setiap level dan keempat lawan:

- **A:** pemain diam, diukur detik sampai K.O.
- **B:** pemain terus menembak proyektil, diukur persentase tembakan yang mengenai CPU.
- **C:** bot pemain sederhana yang mendekat, menekan rantai basic dan memakai skill saat siap. Bot memainkan keempat karakter, lalu dihitung ronde yang dimenangkan bot vs CPU.

| Level | A: K.O. pemain diam (lama → baru) | B: tembakan kena CPU (lama → baru) | C: bot vs CPU (lama → baru) |
| --- | --- | --- | --- |
| Easy | 26–34 s → 21–32 s | ~95% → ~53% | 32–0 → 32–0 |
| Medium | 24–40 s → 12–29 s | 100% → ~44% | 32–0 → 29–8 |
| Hard | 21–27 s → 11–22 s | 100% → ~38% | 32–0 → 21–14 |
| Excellent | 21–29 s → 10–18 s | 100% → ~35% | 32–2 → **15–20** |

Setelah NAJA playable (5 lawan, bot memainkan kelima karakter, 25 pasangan): bot vs CPU Easy 48–5, Medium 35–23, Hard 28–29, Excellent 17–38. Waktu K.O. pemain diam untuk CPU NAJA 23.4 / 19.9 / 16.0 / 15.7 s, sejajar MIRA dan CORA.

Setelah HALDOR playable (6 lawan, 36 pasangan): bot vs CPU Easy 68–7, Medium 53–28, Hard 44–36, Excellent 32–46. Waktu K.O. pemain diam untuk CPU HALDOR 26.0 / 23.6 / 19.6 / 17.1 s, sedikit lebih lambat dari yang lain (tank).

Setelah ZANNI playable (7 lawan, 49 pasangan): bot vs CPU Easy 94–7, Medium 75–31, Hard 63–47, Excellent 45–64. Waktu K.O. pemain diam untuk CPU ZANNI 21.2 / 19.7 / 16.7 / 15.7 s, sejajar MIRA/CORA/NAJA. Ring Toss dilempar dari jarak `range` 430 px (`cpuReach`), bukan 560 px seperti proyektil lurus.

Setelah ISOLDE playable (8 lawan, 64 pasangan): bot vs CPU Easy 123–9, Medium 96–42, Hard 77–69, Excellent 55–88. Waktu K.O. pemain diam untuk CPU ISOLDE 21.3 / 15.5 / 19.4 / 18.5 s; Medium lebih cepat dari Hard/Excellent pada pemain diam (belum dianalisis). Proyektil yang mengenai CPU ISOLDE di Hard hanya 14%.

Setelah RHEA playable (9 lawan, 81 pasangan): bot vs CPU Easy 157–9, Medium 125–52, Hard 100–87, Excellent 68–113. Waktu K.O. pemain diam untuk CPU RHEA 17.6 / 16.7 / 19.2 / 15.8 s; Hard lebih lambat dari Medium pada pemain diam (belum dianalisis).

Setelah SOLAN playable (10 lawan, 100 pasangan): bot vs CPU Easy 194–11, Medium 158–59, Hard 129–99, Excellent 94–129. Waktu K.O. pemain diam untuk CPU SOLAN 25.6 / 22.5 / 19.9 / 18.6 s, turun rapi per level; proyektil yang mengenai CPU SOLAN 52 / 43 / 36 / 35%.

Setelah NIB playable (11 lawan, 121 pasangan): bot vs CPU Easy 236–11, Medium 194–68, Hard 154–120, Excellent 110–158. Waktu K.O. pemain diam untuk CPU NIB 17.9 / 17.2 / 12.1 / 12.7 s, tercepat di roster pada Hard/Excellent (rantai tercepat); proyektil yang mengenai CPU NIB 52 / 42 / 34 / 31%.

Setelah EDDA playable (12 lawan, 144 pasangan): bot vs CPU Easy 281–13, Medium 233–78, Hard 184–138, Excellent 139–177. Waktu K.O. pemain diam untuk CPU EDDA 28.0 / 27.4 / 25.8 / 18.8 s, paling lambat di roster: rantainya pelan dan Shell Counter tidak dipakai melawan pemain yang tidak menyerang. CPU hanya memilih Shell Counter saat pemain sedang memulai serangan dasar yang belum mengenai, dan tidak memakainya sebagai penutup combo. Proyektil yang mengenai CPU EDDA 52 / 43 / 42 / 33%.

Bot ini sangat konsisten: menyerang tepat saat masuk jangkauan dan selalu mendapat kebal 0,9 s. Excellent kini menang lebih sering melawannya. Easy tetap bisa dimenangkan dengan menekan tombol terus, tetapi CPU-nya sudah menghindari sekitar separuh proyektil. Angka benchmark adalah bukti relatif antarlevel, bukan penilaian terhadap pemain manusia. Tes: `node tests/cpu-ai.test.cjs`.
