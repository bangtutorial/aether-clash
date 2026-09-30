/* Touch controls for phones and tablets: an arrow pad on the left, a MOBA-style action cluster on the right.
   They feed the same key handlers as the keyboard (window.__game.input), so every rule (double-tap run, double jump,
   combo queue, cooldowns) behaves exactly like WASD + Space/I/O/P. Only active when <html> has the .touch class. */
(() => {
  'use strict';
  if (!document.documentElement.classList.contains('touch')) return;
  const root = document.getElementById('touch-controls');
  if (!root) return;
  const game = () => window.__game;
  const capture = (el, id) => { try { el.setPointerCapture(id); } catch (_) { /* capture is a nicety; input still works without it */ } };
  const input = (key, down) => game()?.input?.(key, down);

  // Inside the mobile shell the first touch asks the shell to go fullscreen and lock landscape (Android).
  if (window.parent !== window) {
    let sent = false;
    addEventListener('pointerdown', () => { if (sent) return; sent = true; try { if (window.parent.aetherActivate) { window.parent.aetherActivate(); return; } } catch (_) {} window.parent.postMessage({ type: 'aether-activate' }, location.origin); }, { capture: true });
  }
  // No long-press menus, selection or double-tap zoom anywhere on the game.
  addEventListener('contextmenu', e => e.preventDefault());

  // Arrow pad: left / down / right in a row, up above down. Each finger holds the arrow under it and can slide to a
  // neighbour without lifting (left <-> right to turn, down -> up to jump). Up is W (jump; again in the air = double jump).
  const pad = root.querySelector('.dpad');
  const fingers = new Map(); // pointerId -> key
  function refresh() {
    const down = new Set(fingers.values());
    for (const arrow of pad.querySelectorAll('.dbtn')) arrow.classList.toggle('pressed', down.has(arrow.dataset.key));
  }
  function setFinger(id, key) {
    const old = fingers.get(id);
    if (old === key) return;
    if (old) { fingers.delete(id); if (![...fingers.values()].includes(old)) input(old, false); }
    if (key) { const already = [...fingers.values()].includes(key); fingers.set(id, key); if (!already) input(key, true); }
    refresh();
  }
  pad.addEventListener('pointerdown', e => {
    const arrow = e.target.closest?.('.dbtn');
    if (!arrow) return;
    e.preventDefault(); capture(pad, e.pointerId); setFinger(e.pointerId, arrow.dataset.key);
  });
  pad.addEventListener('pointermove', e => {
    if (!fingers.has(e.pointerId)) return;
    const arrow = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.dbtn');
    if (arrow && pad.contains(arrow)) setFinger(e.pointerId, arrow.dataset.key);
  });
  const lift = e => { if (fingers.has(e.pointerId)) setFinger(e.pointerId, null); };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, lift);

  // Action buttons: big basic attack, three small skills around it. Each finger holds its own button.
  const buttons = [...root.querySelectorAll('.tbtn')].map(el => ({ el, key: el.dataset.key, slot: el.dataset.slot, img: el.querySelector('img'), wipe: el.querySelector('.cooldown-wipe'), num: el.querySelector('.cooldown-num'), pointer: null }));
  for (const b of buttons) {
    b.el.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (b.pointer !== null) return;
      b.pointer = e.pointerId; capture(b.el, e.pointerId); b.el.classList.add('pressed'); input(b.key, true);
    });
    const end = e => { if (e.pointerId !== b.pointer) return; b.pointer = null; b.el.classList.remove('pressed'); input(b.key, false); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) b.el.addEventListener(type, end);
  }

  // Mirror the HUD skill cards (icon, cooldown wipe, active/recharged state) onto the round buttons every frame.
  function sync() {
    const g = game();
    // The game clears its keys when a menu opens; forget the held arrows too.
    if (document.body.classList.contains('in-menu') && fingers.size) { fingers.clear(); refresh(); }
    for (const b of buttons) {
      const card = document.querySelector(`.skill-card[data-action="${b.slot}"]`);
      if (card) {
        const src = card.querySelector('img')?.getAttribute('src');
        if (src && b.img.getAttribute('src') !== src) b.img.setAttribute('src', src);
        for (const cls of ['on-cooldown', 'active', 'recharged']) b.el.classList.toggle(cls, card.classList.contains(cls));
        const wipe = card.querySelector('.cooldown-wipe');
        if (wipe && b.wipe) b.wipe.style.background = wipe.style.background;
      }
      if (b.num) { const cd = g?.hero?.cooldowns?.[b.slot] || 0; b.num.textContent = cd > 0 ? String(Math.ceil(cd)) : ''; }
    }
    requestAnimationFrame(sync);
  }
  requestAnimationFrame(sync);
})();
