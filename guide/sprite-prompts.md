# Template Prompt Sprite

Format final proyek: [character-workflow.md](character-workflow.md). Default walk/run empat frame; jump dan doublejump masing-masing satu pose. Bagian enam-frame walk di bawah adalah opsi pengembangan, bukan default template.

Ganti bagian `<…>`. Tulis prompt dalam bahasa Inggris (model gambar paling patuh dengan bahasa Inggris).

## Prinsip

- **Deskripsi fisik karakter hanya ditulis lengkap di prompt base.** Di prompt strip, cukup "match reference 1
  exactly" + palet singkat. Deskripsi panjang di prompt strip bersaing dengan referensi dan mengubah identitas.
- **Prompt strip hanya tentang gerakan + aturan layout.**
- Sebut jumlah pose, arah hadap, "same scale / same ground line", dan larangan efek lepas di **setiap** strip.
- Minta tinggi karakter dalam persen tinggi gambar (mis. 60–70 %) supaya pose tidak terpotong dan ada jarak antar pose.

## Base

```
Game sprite, full-body side view of <deskripsi karakter: usia, peran>, standing in a relaxed idle pose,
facing RIGHT (side view as in a 2D side-scrolling platformer).
<Gaya: mis. Hi-bit pixel art like modern high-detail indie platformers: clean readable pixel clusters,
1 px dark outline, soft hand-placed shading, NOT chunky low-res blocks, NOT blurry painting.>
Character design: <pakaian, warna utama, aksesori, senjata di tangan mana, perisai di tangan mana>.
<Proporsi: mis. about 4 heads tall>.
The whole body<, weapon, cape, hair> fully visible and uncropped, centered, occupying about 70% of the image
height, feet on an invisible ground line near the bottom.
Background: perfectly flat solid pure <magenta #FF00FF>, no gradient, no floor, no shadow, no text, no border.
Do not use any <pink, red or purple> on the character.
```

Setting: rasio 1:1, kualitas high. Generate 2–4 varian, pilih satu.

## Strip gerakan

Lampirkan: **referensi 1 = base**, **referensi 2 = layout guide (N kotak)**. Rasio: selebar yang didukung (mis. 21:9).

```
Create a single horizontal sprite strip for the 2D side-scrolling game character '<id>' in the state '<state>'.

Reference 1 = the canonical character design (identity). Reference 2 = layout guide, used ONLY for frame
count, slot spacing, centering and safe padding; never draw the guide itself.

Style contract: match reference 1 EXACTLY: same pixel density (logical pixel block size), same body
proportions, same outline weight, same palette (<palet singkat>), same shading, same detail level.
Do not restyle, do not change proportions. Same props: <senjata/aksesori + tangan>.

Animation action: <deskripsi gerakan per frame, lihat contoh di bawah>.

Rules: This row owns motion only; keep identity identical in every frame. No detached effects, no motion
lines, no smears, no afterimages, no glows, no floor shadows, no dust, no text, no labels, no frame numbers,
no grid, no scenery.

Layout: exactly <N> full-body poses, left to right, in one horizontal row, all facing RIGHT. Treat the image
as <N> equal-width invisible slots; center exactly one complete, uncropped pose in each slot, all at the
same scale and on the same ground line, each pose about <60–70>% of the image height, with clear
<magenta> gap between neighbouring poses. No pose (including <weapon/cape>) may touch or overlap a
neighbouring pose. Background: perfectly flat pure <magenta #FF00FF> across the whole image.
Do not use <magenta, pink, red or purple> on the character. Output only the sprite strip image.
```

## Contoh deskripsi gerakan

| State | Frame | Deskripsi |
|---|---|---|
| idle | 4 | subtle breathing: chest rises and falls, cape sways slightly, feet planted in the same place in every frame; frames 1 and 4 connect into a loop |
| walk | 4 | near-leg contact, far-leg passing dengan kaki rapat, far-leg contact, near-leg passing |
| run | 4 | pola contact/passing sama, torso condong dan langkah sprint; jangan duplikasi walk |
| jump | 1 | pose udara atletis dengan siku dan lutut menekuk; lintasan naik/turun dari fisika |
| doublejump | 1 | pose tuck dengan kedua lutut rapat; rotasi penuh dari runtime |
| attack ringan | 4 | 1 wind-up (weapon pulled back), 2 swing forward, 3 full extension, 4 recover to guard; feet roughly in place |
| attack berat | 4 | 1 weapon raised high, 2 swinging down, 3 impact low in front, 4 recover |
| tusukan | 4 | 1 weapon pulled back at hip, 2 step forward, 3 full lunge straight forward, 4 back to guard |

### Opsi enam frame untuk memperbaiki walk

Model sering menggambar 6 pose "kaki terbuka" yang mirip tanpa pergantian kaki. Sebut kaki mana di depan per
frame, dan lampirkan strip walk yang sudah benar (karakter lain boleh) sebagai **referensi 3 = gerakan saja**:

```
Reference 3 = a walk cycle of a different character: use it ONLY as a motion reference for how the legs
alternate (leg timing and foot contacts). Do NOT copy its character, armor, colors or weapon.

A TRUE ALTERNATING 6-frame walk cycle moving to the RIGHT. The two legs MUST swap: the far leg (his LEFT
leg, slightly darker) and the near leg (his RIGHT leg, lighter) take turns being in front:
- frame 1: CONTACT — near RIGHT leg forward with heel down, far LEFT leg behind on its toes, legs wide apart
- frame 2: DOWN — weight on the right leg, knee bent, left leg starting to lift behind
- frame 3: PASSING — left leg swinging forward and crossing next to the right leg, knees close together
- frame 4: CONTACT — far LEFT leg now forward, near RIGHT leg behind on its toes (mirror of frame 1)
- frame 5: DOWN — weight on the left leg, right leg lifting behind
- frame 6: PASSING — right leg swinging forward crossing next to the left leg, knees close together
In frames 3 and 6 the feet must be close together. In frames 1 and 4 a DIFFERENT leg is in front.
```

Generate 2 varian, cek dengan `measure_atlas.py` (baris "jarak kaki": harus lebar-rapat-lebar-rapat).

## Tips mengurangi frame beda ukuran sejak awal

- Tulis **"all at the same scale and on the same ground line"** dan **"about X% of the image height"** di setiap strip.
- Untuk idle, tulis **"feet planted in the same place in every frame"** — model cenderung "zoom" frame napas.
- Pose dengan senjata terangkat membuat model mengecilkan badan agar muat → minta persen tinggi yang
  sudah memperhitungkan senjata ("at most 70% including the raised sword").
- Tambahkan di strip aksi: **"the character's body and head must be exactly the same size as in reference 1;
  if the weapon does not fit, make the weapon overlap the slot padding — never shrink the character."**
  Tetap wajib diukur (sprite-qa.md) — kalimat ini mengurangi, bukan menghilangkan, masalahnya.
- Tetap anggap hasilnya **tidak** konsisten 100 %: selalu ukur (sprite-qa.md).

## Base karakter baru: identitas berbeda secara eksplisit

Jangan lampirkan gambar karakter roster lama pada generasi base baru. Isi semua pembeda berikut secara konkret; jangan hanya menulis "different character":

    Create an original <Mecha / Demi-Human> fighter from scratch. Shared art style:
    fine hi-bit pixel clusters, crisp dark outlines, rich shading, anime chibi anatomy.
    Unique silhouette: <shape>. Hair: <shape, length, color>. Face: <features/expression>.
    Dominant palette: <colors>. Outfit construction: <specific garments and materials>.
    Anatomy / fighting tools: <specific differences>. Signature accessory: <feature>.
    EXCLUDE these existing-roster identity features: <explicit list of old features>.
    Do not create a recolor or add animal ears to an existing design.
    Keep the full body, ears, tail, weapons and mechanical parts visible, facing RIGHT.
    Pure flat <CHROMA> background; no floor, shadows, scenery, text or effects.

Sesudah base baru dikunci, base itu menjadi referensi identitas semua row. Untuk Demi-Human, telinga/ekor menambah silhouette, bukan alasan mengecilkan badan agar tinggi totalnya sama dengan rambut ARCO. Periksa pembeda visual terhadap roster sebelum membuat animasi.

## Jump final: satu pose atletis, bukan idle melayang

Referensi1=base baru; referensi2=idle karakter yang sama untuk proporsi.

    ONE SINGLE full-body sprite of the same character as reference 1; reference 2 is
    the idle anatomy reference. Match head-to-torso size, neck-to-belt length, limb
    lengths, palette, outline weight and pixel density exactly. Facing RIGHT.
    A natural athletic airborne JUMP: slight forward torso lean, bent elbows with
    weapon/large arm near the ribs for balance; near knee moderately lifted with
    lower leg pointing DOWN; far leg relaxed behind with a soft knee bend, boot down.
    No rigid standing-hover pose, no arms hanging straight, no deep crouch or tuck,
    no straight kicking leg. The game will HOLD this one pose during the flight arc.
    Complete uncropped body and accessories, centered, about 70 percent canvas height.
    Pure flat <CHROMA> background. No shadow, ground, glow, particles, text, or guides.

Rasio1:1. Jangan menambah beberapa gerakan hanya untuk membuat jump terlihat hidup. Pilih pose yang sudah atletis, lalu periksa ukuran badan/kepalanya terhadap idle pada baseline sama.

## Double jump final: satu pose menggulung

    ONE SINGLE full-body airborne TUCK pose of the exact same character as reference 1.
    Both knees pulled TOGETHER toward the chest, both arms and accessories close around
    the folded legs, boots together. Compact rounded silhouette for a forward somersault.
    Head initially upright and visible, facing RIGHT; the game rotates the WHOLE pose.
    Keep the same head size, torso thickness and anatomical limb lengths as idle.
    Limbs fold through their joints; do not shrink the character. No extended kick,
    no punch, no running stride, no detached effects or duplicate limbs.
    Generous padding on pure flat <CHROMA>. No shadow, glow, scenery, text, or guides.

Rasio1:1. Tuck boleh lebih pendek sebagai silhouette karena lutut ditekuk. Jangan membesarkannya sampai tinggi idle; ukur kepala/torso, lalu pilih pivot yang menjaga perpindahan pusat tubuh/head tetap wajar.

## Recovery dan pose ultimate tidak mengecil

Untuk row aksi tambahkan:

    Preserve the same anatomical scale in every pose. The final upright recovery must
    match the idle reference in head size, shoulder width, crown-to-belt span and leg
    length. Never compress the torso or shorten the legs to fit an extended weapon.
    Maintain clear blank gaps between poses; no limb may touch a neighboring pose.

Untuk summon gunakan empat pose command singkat, bukan empat gambar VFX:

    Four poses: upright preparation, raise/brace the casting arm, open hand or command
    gesture, return to the original upright idle stance. Knees only slightly soft;
    keep head and pelvis height consistent. No summoned creatures, drones, laser,
    magic circle, aura or particles in the character row.

Pose rebah/serangan memanjang sering perlu persen tinggi sumber lebih kecil (contoh35–50%) agar badan horizontal muat di slot. Minta **semua pose pada skala anatomi sama**, lalu lakukan normalisasi dari original; jangan membiarkan model mengecilkan hanya pose rebah/impact.

## Portrait, cut-in, ikon, dan prop

Gunakan Seedream sesuai [character-workflow.md](character-workflow.md). Referensi identitas boleh base, tetapi hasil harus ilustrasi baru, bukan crop sprite lama.

- Portrait1:1: close-up wajah/bahu, ekspresi khas, siluet terbaca dalam frame HUD kecil, palet karakter konsisten; tanpa border/teks yang akan dibuat oleh UI.
- Cut-in21:9: wajah/gesture di kiri, ruang gelap di kanan untuk judul HTML; komposisi dinamis, tanpa tulisan. Desain baru sesuai karakter. Referensi game lain hanya pola presentasi banner, bukan materi yang disalin.
- Ikon1:1: satu simbol serangan yang terbaca pada 64 px, background navy gelap, tidak ada angka/keybind/border. Buat gambar berbeda untuk setiap skill.
- Prop summon: objek penuh, arah/muzzle jelas, background chroma, tanpa laser/trail baked. Setelah cutout, ukur titik keluarnya efek pada aset final.

Prompt aktual ARCO tersedia pada log yang ditautkan di [arco-reference.md](arco-reference.md). Gunakan sebagai contoh struktur; ganti identitas, anatomi, gesture, dan palet untuk karakter baru.
