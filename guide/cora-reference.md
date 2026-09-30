# CORA — penari langit demi-human gagak

CORA adalah petarung Demi-Human kedua dan karakter keempat di roster: wanita muda demi-human gagak dengan sepasang sayap hitam besar dan dua pisau pendek berbentuk bulu. Pemain dapat memilihnya di roster VS/Training dan Pengaturan → Karakter pemain; CPU memakai kit yang sama. Kartu identitas: assets/cora/character.md.

## Desain yang dipilih

Pengguna meminta rekomendasi demi-human wanita, lalu melihat tiga konsep hasil generate: LEPA (kelinci, kickboxer), MAKO (hiu, petarung pelabuhan) dan CORA (gagak, penari langit). Lineup: assets/concepts/demi-human-female/lineup-round1.png. Pengguna memilih **CORA**. Rambut hitam lurus panjang berkilau biru-violet dengan bulu kecil, mata amber, anting amber, mantel Renaisans violet gelap dengan trim bulu arang, kancing amber, legging dan sepatu bot hitam. Konsep langsung dipakai sebagai base: base-selected.png, job `80fdb0b0-1c88-4ee7-8340-ef27d375b6df`. Chroma hijau #00FF00 karena karakter memakai violet.

Model: sama seperti MIRA, semua gambar CORA dibuat dengan **GPT Image 2.5 Sunburst**, termasuk portrait, ikon, cut-in dan VFX. Announcer tetap Grady.

## Paket siap digunakan ulang

| Paket | Isi |
| --- | --- |
| Sprite | 15 state / 54 frame, atlas 1792×4320, cell 448×288, anchor 224/280, idle 184 px dari kaki sampai ujung bulu rambut |
| State | idle, walk, run, crouch, attack1–3, skill1–2, ultimate, hurt, down, recover masing-masing 4; jump/tuck masing-masing 1 |
| UI | portrait 384, cut-in 1600×686, 4 ikon 256, roster art |
| VFX | 3 PNG alpha: feather (proyektil), gust (sapuan angin), raven (gagak ultimate) |
| Audio | `select_cora` “Cora!” (0.914 s), `cora_wins` “Cora wins!” (1.306 s), Grady. Voice ultimate Anika “Fly, my ravens!” — [mira-cora-voice.md](mira-cora-voice.md) |

Cell 448 dipakai karena sayap yang terbuka membuat pose jauh lebih lebar dan tinggi daripada tubuhnya (jump 216 px, skill2 frame 1 236 px). Ukuran 184 px dipilih dari lineup 176/184/190/198 di samping ARCO, FENR dan MIRA (qa/size-candidates.png): sedikit lebih pendek dari FENR 194. Nilai ini dapat diubah hanya dengan calibration target baru dari original yang sama, tanpa generate ulang. Wrapper `CORA_MANIFEST/METRICS` ada di [assets/cora/manifest.js](../assets/cora/manifest.js). Sprite library memutar semua animasi 1×/0.5× dan kanan/kiri.

## Kemampuan dan balance

| Input | Gerakan | Damage / cooldown |
| --- | --- | --- |
| Space×3 | FEATHER WALTZ: tebasan pisau depan, tebasan naik pisau belakang, tebasan silang X dengan sayap terbuka (reach 90/78/115) | 6/8/12 |
| I | QUILL VOLLEY: kipas tiga bulu (5+5+6). Bulu lurus 840 px/s, dua bulu miring ±0.1 rad 790 px/s, umur 1 s; kontrol lepas saat bulu keluar | 16 / 3 s |
| O | WING GUST: dua sayap menyapu ke depan; area 30 px di belakang sampai 190 px di depan, knockback 300, tanpa dash | 24 / 6 s |
| P | NIGHT MURMURATION: pose cast 0.5 s, tiga gelombang gagak × 16 | 48 / 18 s |

Tiap basic hit valid mengembalikan 5% cooldown maksimum semua skill (I 0.15 s, O 0.30 s, P 0.90 s). HP tetap 200 dalam dua lapis. Semua nilai ada di [cora.js](../cora.js).

Pada jarak dekat–menengah ketiga bulu mengenai target (16). Pada jarak jauh bulu atas melewati kepala; tes mengunci contoh 760 px = 11 damage (bulu lurus 5 + bulu bawah 6). Bulu lurus sedikit lebih cepat sehingga hit terbaca sebagai tiga ketukan, bukan satu tumpukan angka.

### Timeline Night Murmuration

| Bagian | Waktu dari cast |
| --- | --- |
| Cut-in banner violet/amber | 0–0.78 s |
| Pose cast pemain | 0–0.50 s, lalu bebas bergerak/menyerang |
| Gelombang 1 / 2 / 3 terbang | 0.55 / 0.85 / 1.15 s pada ketinggian 70 / 112 / 150 px di atas lantai |
| Gerak gelombang | 1500 px/s searah cast, mulai 140 px di belakang CORA, 10 gagak berjarak 40 px |
| Selesai | 2.40 s |

Setiap gelombang memberi satu hit saat gagak terdepan melewati target. Hit hanya terjadi bila target berada di depan CORA (toleransi 30 px) dan tubuhnya menutupi ketinggian gelombang. Lompatan biasa yang tepat waktu (puncak ±119 px) melewati gelombang terendah; tes mengunci contoh ini (32 damage, bukan 48). Tidak ada global hit-stop; guncangan per gelombang 0.6×. Knockback 60/60/190. Pause membekukan, reset/kembali menu/akhir ronde membatalkan. Kawanan pemain (`flock`) dan CPU (`enemyFlock`) memiliki owner terpisah.

## Integrasi engine

- `KITS` di game.js memetakan `mira` dan `cora` ke kontrak kit yang sama (`start`, `move`, `refund`): durasi basic, cast, reach dan aksi CPU memakai jalur itu. Setiap karakter tetap memiliki fungsi strike sendiri (`coraStrike`) dan summon sendiri (`startMurmuration`, dipilih lewat `startSummon`).
- Proyektil kini dapat membawa `vy` (lintasan miring, sprite diputar searah gerak), `knockback` dan `size`. Proyektil lama tanpa field ini tetap berperilaku sama.
- Snapshot QA berisi `flock`/`enemyFlock`; cut-in memakai kelas `.cora-cutin`, art ui/cutin.png, judul NIGHT MURMURATION dari HTML.

## Reproduksi

1. Prompt/job: konsep concept-requests.json; strip strip-requests.json (15 v1 + skill2/recover v2); UI ui-requests.json.
2. `tools/cora_pipeline.py measure|calibrate|normalize|extract|publish` dengan Python venv sprite-gen. `cleanup.json` kosong (tidak ada goresan yang perlu dihapus).
3. `tools/cora_measure.py` untuk edge-NCC wajah (utama) dan torso (pembanding); hasil di `assets/cora/qa/scale-measure.json` dan `scale-check.png`. Nilai terpilih di rel.json, alasannya di `qa/rel-decision.json`.
4. `tools/cora_align.py` menulis curation integer; `publish` menghasilkan atlas, metrics, playback, contact sheet dan wrapper JS.
5. `tools/cora_assets.py` mengekspor portrait/ikon/cut-in/VFX dan roster art.

Catatan QA dan batas bukti: assets/cora/run/qa-notes.md. Tes: `node tests/cora.test.cjs` (17 tes).
