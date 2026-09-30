# Memakai Atlas di Game

Kontrak proyek terbaru: [gameplay-standard.md](gameplay-standard.md) dan [character-workflow.md](character-workflow.md). Saat ini loader masih satu karakter ARCO; format baru tidak otomatis menjadi registry multi-karakter.

Atlas yang sudah lolos QA masih bisa terlihat salah kalau cara menggambarnya keliru. Aturan di sini
berlaku untuk canvas 2D, Phaser, PixiJS, Godot, Unity, dll.

## File yang dipakai

- `sprite-sheet-alpha.png` — semua frame, latar transparan
- `manifest.json` — koordinat tiap frame

Salin keduanya dari **run** (hasil `compose-atlas`), bukan dari `frames/`. Setiap kali atlas di-compose ulang,
salin ulang **keduanya** bersamaan.

Bila game dibuka lewat `file://` (tanpa server), `fetch` JSON diblok browser: bungkus manifest jadi file JS
(`window.SPRITE_MANIFEST = {...}`) yang dibuat otomatis dari `manifest.json` — jangan diedit manual.

## Baca koordinat dari manifest, jangan menebak grid

```js
const r = manifest.frame_layout.rows[state][frameIndex];   // {x, y, w, h}
const fps = manifest.animation.rows[state].fps;
const loop = manifest.animation.rows[state].loop;
```

Jumlah frame per gerakan bisa berubah setelah curation — selalu ambil dari manifest.

## Anchor di kaki

Frame sudah disejajarkan sehingga **kaki** berada di:

```
anchorX = cellWidth / 2
anchorY = cellHeight - safe_margin_y      // dari manifest.cell
```

Posisi karakter di dunia game = posisi kaki. Gambar frame dengan offset `(-anchorX, -anchorY)`.

```js
ctx.save();
ctx.translate(Math.round(x), Math.round(y));   // x,y = kaki
ctx.scale(facing, 1);                           // facing: 1 kanan, -1 kiri
ctx.drawImage(sheet, r.x, r.y, r.w, r.h, -anchorX, -anchorY, r.w, r.h);
ctx.restore();
```

- **Flip kiri/kanan di sekitar anchor** (bukan di sekitar pojok sel) → karakter tidak "teleport" saat berbalik.
- Semua sprite digambar menghadap kanan; arah kiri selalu hasil flip.

## Jangan menambah blur di runtime

| Aturan | Canvas 2D | Lainnya |
|---|---|---|
| Matikan smoothing | `ctx.imageSmoothingEnabled = false` + CSS `image-rendering: pixelated` | Phaser `pixelArt: true`; Pixi `SCALE_MODES.NEAREST`; Godot filter *Nearest*; Unity Filter Mode *Point*, Compression *None* |
| Posisi dibulatkan | `Math.round(x)` saat menggambar (simulasi boleh float) | "pixel snap" / round di shader |
| Skala sprite lokal konstan | 1× pada ARCO; jangan mengubah skala per pose | sama |
| Proyeksi viewport seragam | Dunia dapat diproyeksikan fractional untuk responsif, tetapi x/y memakai rasio yang sama | jangan meregangkan badan |
| Efek tidak mengubah ukuran tubuh | Tanpa squash/stretch per state; VFX terpisah | sama |

Kalau salah satu dilanggar, frame yang sudah rapi di atlas bisa terlihat berbeda ketajamannya di layar —
gejalanya persis seperti masalah ukuran frame.

## Kecepatan animasi

- Pakai `fps` dari manifest sebagai default untuk gerakan di tempat (idle, serang, hurt).
- **Jalan/lari: frame maju berdasarkan jarak yang ditempuh**, supaya kaki yang menapak tidak meluncur:

  ```js
  // stride = jarak satu siklus penuh (2 langkah) ≈ 2 × jarak kaki saat menapak (lihat measure_atlas.py)
  walkPhase += dt * (Math.abs(vx) / stride) * frameCount;
  frame = Math.floor(walkPhase) % frameCount;
  ```

  Ukur `stride` dari atlas (jarak kaki terbesar × 2), jangan ditebak. Kalau hasil fps terlalu lambat/cepat,
  ubah **kecepatan gerak** karakter, bukan fps-nya. Contoh: orc stride 208 px, jalan 170 px/s → ±4.9 fps.

  Nilai dari lebar siluet kaki adalah **estimate**, bukan pengukuran stride same-foot contact yang terverifikasi. Runtime ARCO memakai estimate tersebut; jangan menyebutnya gait yang sudah tersertifikasi mulus. Periksa pose contact/passing dan pergantian kaki secara visual.
- Gerakan non-loop (`loop: false`) berhenti di frame terakhir, lalu kembali ke idle.

## Hitbox dari data, bukan tebakan

Ukur jangkauan senjata dari atlas (bounding box alpha tiap frame relatif anchor) dan simpan sebagai angka di
kode. Setelah atlas di-compose ulang dengan skala berbeda, **ukur ulang** hitbox.

## Checklist integrasi

- [ ] Atlas dan manifest disalin bersamaan dari run terbaru
- [ ] Anchor = (cellWidth/2, cellHeight − safe_margin_y)
- [ ] Flip dengan `scale(-1, 1)` di anchor
- [ ] Smoothing mati, posisi sprite dibulatkan, skala tubuh konstan dan proyeksi viewport seragam
- [ ] Kecepatan walk ikut kecepatan gerak

## Playback khusus ARCO yang menjadi baseline

- Jump menahan satu pose atletis pada rise/apex/fall; tidak replay crouch di udara.
- Doublejump memutar satu tuck pose360° dalam 0,28 s. Baca pivot lokal dan world-pivot dari metrics, lalu ukur ulang untuk karakter baru.
- Skill I menampilkan pose persiapan/tembak sebelum projectile release, lalu melepas input saat peluru keluar; tidak menunggu frame recovery nominal habis.
- Ultimate menggunakan pose cast 0,50 s, sementara drone/cut-in memakai timeline terpisah2,85 s. Jangan mengunci owner sepanjang durasi efek.
- `MECHA_METRICS.playback`, `states`, dan `emitters` melengkapi manifest. Koordinat emitter relatif anchor, bukan koordinat layar.
- Salto, facing flip, dan transform viewport tidak boleh menyebabkan per-state scale yang berbeda.
