# Latar Stage Game Fighting

Arena aktif: Bellora, Sunspire, Azure Harbor (groundY 599), Elderwood Glade (606) dan Moonrise Bastion (618, malam bulan purnama). Untuk arena malam, minta lantai tetap diterangi cahaya bulan/lentera agar sprite siang tetap terbaca. Untuk proyek ARCO, acuan final ada di [gameplay-standard.md](gameplay-standard.md): dunia1280×720, stage Bellora varian B, groundY599 dari band lantai528–719. Gambar utuh dipakai pada rasio 16:9; viewport lain memakai cover yang sejajar lantai, sementara karakter diproyeksikan seragam. Ini penyesuaian responsif, bukan kamera mengikuti pemain/parallax.

Panduan membuat latar (stage) untuk game **fighting 2D satu layar**: dua petarung di satu arena, kamera diam.
Berlaku untuk game lain juga — ganti tema (padang, dojo, pantai, reruntuhan) tapi pertahankan aturannya.

## Gaya yang dipakai

| Hal | Keputusan |
|---|---|
| Jumlah gambar | **Satu gambar utuh** (langit, latar jauh, dan lantai digambar bersamaan) — bukan layer terpisah |
| Kamera | **Diam.** Tidak ada scrolling, tidak ada parallax. Arena = satu layar |
| Rasio | Sama dengan resolusi game (mis. 960×540 → **16:9**) supaya bisa dipakai utuh tanpa dipotong |
| Model | **Seedream 5.0 Pro** (`seedream_v5_pro`, 16:9, 2k) — komposisi scene utuh paling rapi. Hasilnya gaya ilustrasi lukis halus |
| Lantai | Pita tanah/arena **terlihat dari samping-agak-atas**, memanjang selebar layar, di ±75–90 % tinggi gambar |
| Tengah layar | Kosong/lapang — tidak ada objek besar di depan yang menutupi petarung |

### Kenapa bukan parallax / tanah bergeser

Dicoba dulu: latar jauh + tanah terpisah dengan parallax dan kamera mengikuti pemain. Hasilnya **memusingkan**
untuk game fighting — pemain perlu melihat seluruh arena dan lawan sekaligus. Genre fighting = satu tempat diam.

### Kenapa lantai bukan potongan tanah

Dicoba dulu: strip tanah berupa penampang (rumput di atas, tanah + batu + akar di bawah). Itu gaya platformer.
Stage fighting butuh **lantai tempat berdiri** yang terlihat dari samping-atas (seperti panggung), bukan dinding tanah.

## Prompt

Lampirkan **gambar base karakter utama sebagai referensi gaya** (bukan identitas). Ganti bagian `<…>`.

```
Reference image is a STYLE reference only (a sprite from the same game): match its art style,
color richness and shading. Do NOT draw the character or any character.

Create ONE complete, single-screen background for a 2D side-view FIGHTING GAME stage, <waktu: bright
sunny daytime>, in one coherent image (not layers). Composition from top to bottom: <langit: clear blue
sky with a few fluffy clouds>; <latar jauh: distant mountains with snowy peaks>; <latar tengah: rolling
green hills with pine forests; on a hill at the right third a small castle with a few cottages>; then
<padang: a wide sunlit meadow>. The bottom 30% of the image is the fighting floor seen from the side at a
slightly elevated angle: a wide horizontal band of <material lantai: worn, packed light-brown dirt>
running across the entire width (centered at about 80% of the image height) where two fighters will stand,
<detail: small pebbles and scuffs>, bordered by <tepi: green grass with tufts and tiny wildflowers> in
front and behind. The floor is flat and level, NOT a cross-section, no underground layers. Keep the middle
of the image open and uncluttered for gameplay, nothing large in the foreground. No characters, no
animals, no text, no UI, no border.
```

- Generate **2 varian** sekaligus (`count: 2`), pilih yang komposisinya paling enak. Biaya ±2.5 kredit/gambar.
- Landmark (kastil, kuil, menara) taruh di **sepertiga kiri/kanan**, jangan di tengah.
- Untuk tema lain cukup ganti isi `<…>`; kalimat soal lantai, tengah kosong, dan "NOT a cross-section" jangan dihapus.

## Memasang di game

1. **Skala** gambar ke resolusi game dengan resample BOX (mis. 2720×1536 → 960×540). Jangan crop kecuali rasionya beda.
2. **Cari garis kaki** — baris tengah pita lantai. Ukur, jangan tebak:

   ```python
   import numpy as np
   from PIL import Image
   a = np.array(Image.open("stage.png").convert("RGB")).astype(int)
   r, g, b = a[..., 0], a[..., 1], a[..., 2]
   dirt = ((r > g) & (r > b + 40)).mean(1)          # baris yang >50 % warnanya tanah/coklat
   rows = [y for y in range(len(dirt)) if dirt[y] > 0.5]
   print("pita lantai", rows[0], "-", rows[-1], "tengah", (rows[0] + rows[-1]) // 2)
   ```

   Set `GROUND_Y` (garis kaki petarung) di dalam pita itu, sedikit di bawah tengahnya. Untuk lantai yang
   bukan coklat (batu, kayu), ganti rumus warnanya.
3. **Kamera diam**, arena selebar layar; petarung dibatasi di tepi kiri/kanan (mis. 40 px dari tepi).
4. **Screen shake** menggeser seluruh stage — gambar tepi terluar gambar direntangkan ±40 px ke luar layar
   supaya getaran tidak memperlihatkan pinggiran kosong:

   ```js
   ctx.drawImage(img, 0, 0, 1, H, -M, 0, M, H);           // kiri
   ctx.drawImage(img, W - 1, 0, 1, H, W, 0, M, H);        // kanan
   ctx.drawImage(img, 0, 0, W, 1, -M, -M, W + 2 * M, M);  // atas
   ctx.drawImage(img, 0, H - 1, W, 1, -M, H, W + 2 * M, M); // bawah
   ctx.drawImage(img, 0, 0);
   ```

5. **Efek yang menggelapkan layar** (skill besar) → overlay gelap di atas stage, di bawah karakter dan efek.
6. Simpan beberapa varian dan pilih lewat parameter (mis. `?stage=`) supaya mudah dibandingkan di game.

## Konsistensi gaya dengan sprite

- Seedream 5.0 Pro menghasilkan **ilustrasi lukis**, walau diberi referensi gaya pixel. Sprite pixel art di
  atasnya tetap terbaca jelas (kontras tinggi, outline gelap) dan hasilnya diterima untuk proyek ini.
- Kalau proyek butuh latar **pixel art ketat**: pakai `gpt_image_2_5` (21:9 lalu crop, atau 16:9) dengan prompt
  yang sama — lebih patuh pada gaya pixel, komposisi sedikit kurang rapi.
- Karakter besar (bos/naga) yang muncul di stage: generate dari deskripsi gaya bersama dan identitas baru yang eksplisit, tanpa gambar karakter roster lama
  (lihat [sprite-pipeline.md](sprite-pipeline.md#karakter-kedua-dan-seterusnya-supaya-satu-game-satu-gaya)).

## Checklist stage

- [ ] Satu gambar, rasio = resolusi game, dipakai utuh
- [ ] Pita lantai terlihat dari samping-atas, selebar layar; bukan penampang tanah; tidak ada platform melayang
- [ ] Tengah layar lapang; landmark di sepertiga kiri/kanan
- [ ] `GROUND_Y` diukur dari pita lantai; kaki petarung terlihat berdiri di atas lantai
- [ ] Kamera diam; screen shake tidak memperlihatkan tepi kosong
- [ ] Sumber, job id, prompt, dan varian yang dipilih dicatat (mis. `background/layers.md`)
