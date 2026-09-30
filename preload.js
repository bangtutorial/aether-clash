/* First-visit loader. Before the menu opens, every runtime file in precache.js (built by tools/build_dist.mjs) is
   downloaded once behind a progress bar, so later screens never wait for pictures.
   - Secure pages (https, localhost): files go into Cache Storage ('aether-assets') with their content hash. A later visit
     only downloads files whose hash changed, and sw.js serves the pictures straight from that cache.
   - Plain http on a LAN IP (no Cache Storage / service worker there): the download still fills the browser's HTTP cache.
   - file:// or no list: nothing to do, the game boots as before.
   The game and the menu wait for window.AETHER_PRELOAD before they request their own images (no double download). */
(() => {
  'use strict';
  const list = self.AETHER_PRECACHE, boot = document.getElementById('boot');
  const finish = () => { if (!boot) return; boot.classList.add('done'); setTimeout(() => boot.remove(), 500); };
  if (!list || !boot || location.protocol === 'file:' || typeof fetch !== 'function') { window.AETHER_PRELOAD = Promise.resolve(); finish(); return; }
  const bar = boot.querySelector('.boot-bar i'), status = boot.querySelector('.boot-status');
  const mb = n => (n / 1e6).toFixed(1).replace('.', ',');
  let got = 0, downloading = false;
  function paint() {
    const p = Math.min(1, got / Math.max(1, list.total));
    bar.style.transform = `scaleX(${p})`;
    status.textContent = downloading ? `Mengunduh aset game · ${Math.floor(p * 100)}% · ${mb(got)} / ${mb(list.total)} MB` : 'Memuat…';
  }
  const secure = window.isSecureContext && 'caches' in window;
  if (secure && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const INDEX = '__aether-index';

  async function run() {
    const cache = secure ? await caches.open('aether-assets').catch(() => null) : null;
    let index = {};
    if (cache) { try { const hit = await cache.match(INDEX); if (hit) index = await hit.json(); } catch (_) { index = {}; } }
    const todo = [];
    for (const [url, bytes, hash] of list.files) {
      if (cache && index[url] === hash && await cache.match(url)) got += bytes; else todo.push([url, bytes, hash]);
    }
    downloading = todo.length > 0; paint();
    let next = 0;
    async function worker() {
      while (next < todo.length) {
        const [url, bytes, hash] = todo[next++];
        let seen = 0;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(String(res.status));
          const chunks = [], reader = res.body && res.body.getReader ? res.body.getReader() : null;
          if (reader) for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); seen += value.byteLength; got += value.byteLength; paint(); }
          else { const buf = new Uint8Array(await res.arrayBuffer()); chunks.push(buf); seen = buf.byteLength; got += seen; }
          if (cache) {
            const type = res.headers.get('Content-Type') || '';
            await cache.put(url, new Response(new Blob(chunks, { type }), { headers: { 'Content-Type': type } }));
            index[url] = hash;
          }
        } catch (_) { /* a missing file must not block the game; it simply loads normally later */ }
        got += Math.max(0, bytes - seen); paint();
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    if (cache) {
      // Forget files from older deploys, then store the hash index for the next visit.
      const keep = new Set(list.files.map(f => new URL(f[0], location.href).href));
      keep.add(new URL(INDEX, location.href).href);
      for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
      for (const url of Object.keys(index)) if (!list.files.some(f => f[0] === url)) delete index[url];
      await cache.put(INDEX, new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } }));
    }
    downloading = false; got = list.total; paint();
  }
  window.AETHER_PRELOAD = run().catch(() => {}).then(finish);
})();
