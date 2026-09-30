# FENR — Demi-Human dan Werewolf

FENR menggantikan MOKU-01 sebagai lawan AI aktif. Pemain dapat memilih ARCO atau FENR melalui Pengaturan → Karakter pemain. Hanya pemain memiliki skill deck; lawan menampilkan HP, portrait, status, serta timer transformasi. Sakelar Lawan aktif memungkinkan latihan tanpa serangan AI.

## Desain yang dipilih

Pengguna memilih konsep pertama dari revisi terakhir: ranger laki-laki, rambut chestnut terikat, mata hijau, jerkin hijau hutan, linen krem, scarf rust, ekor serigala cokelat. Base terpilih, job `ca8a528c-cc64-4697-8d7e-409aac2d126b`.

Ultimate berupa **werewolf bipedal berpakaian sobek**, bukan hewan empat kaki. Kepala bermoncong serigala, badan berbulu, dua tangan bercakar, dua kaki, pakaian hijau/scarf/celana tetap dikenakan. Base werewolf, job `72f241fe-234f-4844-a7cb-ff45aa842fcc`. Base empat kaki `base/wolf.png` adalah hasil yang ditolak dan tidak dimuat runtime. Konsep manusia A/B sebelumnya juga ditolak karena mirip ARCO.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Human | 15 state / 54 frame, atlas1280×4320, cell320×288, anchor160/280 |
| Werewolf | 15 state / 54 frame, atlas1792×4320, cell448×288, anchor224/280 |
| State tiap bentuk | idle, walk, run, crouch, attack1–3, skill1–2, ultimate, hurt, down, recover masing-masing4; jump/tuck masing-masing1 |
| UI | 2 portrait, 7 ikon skill/kombo, 1 cut-in |
| VFX | 6 PNG alpha: claw, gale, rush, bite, howl, transform |

Jumlah total108 frame dan16 aset UI/VFX. Werewolf memakai cell lebih lebar agar cakar pada pounce tidak terpotong; skala sprite tetap1. Jangan mengecilkan seluruh werewolf untuk memasukkan cakar ke cell320. Tinggi idle final human194px termasuk telinga; werewolf216–217px termasuk telinga. Perbedaan tinggi walk/run merupakan pose kaki/torso, bukan normalisasi seluruh bounding box per animasi.

Revisi avatar: kedua portrait runtime sekarang memakai v2 close-up kepala,384×384, kanonis menghadap kanan. Sumber v1 yang terlalu jauh disimpan sebagai arsip. Pemain kanan, musuh kiri pada semua bentuk dan layar; lihat [avatar-standard.md](avatar-standard.md).

Atlas/manifest berada di `assets/fenr/human/` dan `assets/fenr/wolf/`. Wrapper globals `FENR_HUMAN_MANIFEST/METRICS` dan `FENR_WOLF_MANIFEST/METRICS` berbeda dari ARCO. Sprite library menyediakan semua animasi kedua bentuk, preview0.5×/1× dan facing kanan/kiri. Paket sudah mencakup gerakan untuk pengujian sebagai pemain; tidak perlu generate ulang ketika sekadar memilih FENR.

## Kemampuan dan balance

| Input | Demi-Human | Werewolf | Damage / cooldown |
| --- | --- | --- | --- |
| Space×3 | Ranger Chain: claw jab, rising palm, heel kick | Savage Chain: bite, claw uppercut, cross claw | 6/8/12 versus7/9/13 |
| I | Gale Claw, proyektil angin | Fang Pounce, lompatan serang dengan cakar | 16 versus18; CD3s |
| O | Ranger Rush, lunge dua telapak | Moon Howl, gelombang area | 24 versus22; CD6s |
| P | Feral Awakening, cast0.62s lalu transformasi | Tidak bisa diaktifkan ulang selama transformasi | Durasi12s; CD24s mulai saat transformasi berakhir |

Transformasi tidak memberi damage langsung, tidak mengisi ulang HP, dan tidak mereset cooldown I/O. HUD menunjukkan sisa durasi dalam detik dan bar menurun. Kedaluwarsa membatalkan serangan werewolf yang belum dilepas supaya tidak menghasilkan damage bentuk lama. Pause membekukan timer; reset/KO membatalkan bentuk. Tiap basic hit valid mengembalikan5% cooldown maksimum:0.15/0.30/1.20s pada FENR. Kedua HP tetap200 dengan dua lapis100 pada satu bar.

AI memakai kit/damage yang sama dengan FENR pemain. Ia mendekat, menjaga jarak, memilih basic/skill, dan bertransformasi setelah7s saat bisa bertindak. Serangan memiliki wind-up yang dapat dilihat; ring amber di kaki menandai ancang-ancang. Ada recovery/jeda keputusan dan hit-stun; AI tidak menyerang saat KO atau lawan sedang KO. Mode latihan mengembalikan petarung setelah KO.

## Reproduksi aset

Generator: Higgsfield GPT Image2.5 Sunburst, high,2k untuk sprite; Seedream5.0Pro untuk UI/VFX. Referensi gerakan adalah base FENR sendiri serta guide empat slot. Semua prompt/parameter/job tersimpan pada human requests, werewolf requests, UI requests, dan koreksi.

Human ultimate v1 hanya menghasilkan3 badan sehingga ditolak. Runtime memakai v2 lengkap4pose, job `e13394c5-6902-447a-b2ac-f00b0914f556`. Selected sources menetapkan file yang benar dan hash sumber. Original berversi tidak diubah.

Gunakan Python venv sprite-gen. Urutan: prepare → kalibrasi dari original → normalize → canonical extract → integer curation → publish. Wrapper fenr_pipeline.py menerima bentuk human/wolf. Jangan menjalankan prepare/calibrate otomatis pada atlas final tanpa menjaga rel/curation terpilih. `rel.json` dan `calibration.json` adalah parameter final. Resample BOX hanya sekali dari original; runtime tidak mengubah skala antarframe.

QA ukuran memakai edge-template pada salinan analisis tinggi288px, dengan konversi skala kembali ke original dicatat dalam `qa/edge-head-measurements.json`. Match kepala miring/tertutup yang menangkap sepatu/tangan **ditolak**, lalu memakai kepala tegak yang valid pada strip dan pemeriksaan badan di contact sheet. Detektor warna rambut pernah menangkap pakaian dan tidak dipakai sebagai otoritas skala final. Tidak semua kepala miring memiliki pengukuran template independen yang valid.

`fenr_align.py` menstabilkan torso idle/walk/run serta posisi kepala jump/tuck dengan translasi integer dari frame hasil extract; tidak mengubah anatomi atau skala. Pivot dihitung ulang dari atlas sesudah curation. Titik emisi diukur pada endpoint impact final; detector uppercut yang sempat menangkap kaki ditolak dan diganti ROI cakar teratas. `fenr_assets.py` memakai canonical sprite-gen cutout untuk enam efek. Manifest, metrics dan atlas diterbitkan bersama, cek108frame kosong/terpotong=0.
