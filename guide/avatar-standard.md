# Standar avatar seluruh karakter

Keputusan pengguna: avatar harus berupa **close-up kepala yang terbaca besar seperti ARCO**, dengan orientasi sesuai slot. Berlaku untuk semua karakter dan semua bentuk transformasi.

## Aset kanonis

- Buat satu portrait baru dengan kepala/face dominan sekitar80–90%frame; cukup leher dan sedikit collar di bawah. Hindari torso, tangan, atau tubuh penuh yang membuat kepala kecil saat masuk HUD.
- Sumber **selalu menghadap KANAN**: hidung/moncong dan tatapan mengarah ke sisi kanan gambar. Pertahankan identitas, warna mata/rambut, telinga, dan ciri bentuk yang dipilih.
- Gaya sama dengan avatar ARCO: ilustrasi anime detail, outline rapi, shading halus bertekstur pixel, pencahayaan jelas. ARCO boleh menjadi referensi framing/style portrait untuk karakter yang identitasnya sudah dikunci; identitas tetap dari base karakter itu sendiri. Jangan mewarisi wajah/rambut/armor ARCO.
- Export384×384. Kepala tetap besar pada ikon kecil dan slot HUD vertikal. Background/ornamen tidak boleh mengalahkan wajah.
- Setiap transformasi mempunyai portrait close-up tersendiri dengan arah kanonis yang sama. Tidak mengambil crop sprite tubuh sebagai pengganti portrait.

## Pemakaian UI

Semua avatar menggunakan class `portrait-image` dan atribut `data-portrait-side`:

    <img class="portrait-image" data-portrait-side="player" src="portrait-right.png" alt="Portrait karakter">
    <img class="portrait-image" data-portrait-side="enemy" src="portrait-right.png" alt="Portrait karakter">

`style.css` memberikan `--portrait-direction:1` untuk pemain dan `-1` untuk musuh. Flip hanya gambar, bukan frame, label, atau ikon lock. Aturan ini sama untuk ARCO, FENR, werewolf, dan karakter berikutnya tanpa CSS khusus per nama karakter.

- HUD pemain kiri: kanan. HUD musuh kanan: kiri.
- Roster tahap PLAYER: kandidat kanan. Tahap RIVAL: kandidat kiri.
- Ringkasan VS/setup arena: avatar pemain kanan, avatar CPU kiri.
- Roster mempertahankan skew/zoom bingkainya sambil menerapkan flip pada gambar.
- Arah avatar ditentukan peran/slot UI, tidak berubah ketika petarung berbalik arah selama gameplay. Sprite gameplay tetap mengikuti kontrol/facing dunia.

## FENR versi final

Human v2: job `d84ea4fb-c7c8-4b99-9e33-9c0fc6bc1823`. Werewolf v2: job `3a84d5ee-37fb-4436-9f43-3828b4238ed3`. Keduanya Higgsfield Seedream5.0Pro2k, base masing-masing sebagai identitas dan portrait ARCO job `fa8a1337-f486-4172-b4e6-9368e297f392` sebagai acuan framing/rendering saja.

Prompt, job dan checksum export: portrait-revision.json. Sumber v1/v2 di `assets/fenr/ui/originals/`; alias original dan file runtime memakai v2. `fenr_assets.py` melewati arsip versi dan mengekspor portrait384px sehingga rebuild tidak mengembalikan framing lama.

## Verifikasi browser

Human dan werewolf diperiksa pada kedua slot HUD: file384px termuat, pemain memakai matrix(1,0,0,1,0,0), lawan matrix(-1,0,0,1,0,0). Roster PLAYER/RIVAL mempertahankan skew sambil mengubah tanda skala horizontal; ringkasanVS FENR pemain dan ARCO CPU juga mengikuti arah yang benar. Screenshot: `qa/fenr/avatar-human-sides.png` dan `qa/fenr/avatar-werewolf-sides.png`. Framing kepala dan arah kanan pada kedua sumber v2 diperiksa langsung sebelum pemasangan.
