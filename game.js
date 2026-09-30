/* AETHER CLASH — standalone deterministic canvas combat runtime. */
(() => {
  'use strict';
  const W = 1280, H = 720;
  const CONFIG = { groundY: 584, walkSpeed: 320, runSpeed: 520, jumpSpeed: 830, doubleJumpSpeed: 790, gravity: 2900, fastFall: 1180, doubleTapWindow: .26, rollDuration: .28, ...window.STAGE_CONFIG };
  const canvas = document.querySelector('#arena'), ctx = canvas.getContext('2d', { alpha: false });
  const $ = s => document.querySelector(s);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const approach = (v, target, amount) => v < target ? Math.min(target, v + amount) : Math.max(target, v - amount);
  const BALANCE = {
    combo: [{damage:6,knockback:75},{damage:8,knockback:100},{damage:12,knockback:180}],
    skill1: {damage:16,cooldown:3,knockback:140},
    skill2: {damage:24,cooldown:6,knockback:220,radius:220},
    ultimate: {damagePerDrone:12,cooldown:18,castTime:.50,knockback:190},
    dummyMax:200, heroMax:200, hpPerBar:100, basicCooldownRefund:.05
  };
  const cooldownMax = { skill1:BALANCE.skill1.cooldown, skill2:BALANCE.skill2.cooldown, ultimate:BALANCE.ultimate.cooldown };
  const skillNames = { skill1: 'AETHER BOLT', skill2: 'SEISMIC DRIVE', ultimate: 'HELIOS SQUADRON' };
  const images = {}, F = window.Fenr, M = window.Mira && window.MIRA_MANIFEST ? window.Mira : null, C = window.Cora && window.CORA_MANIFEST ? window.Cora : null, N = window.Naja && window.NAJA_MANIFEST ? window.Naja : null, HD = window.Haldor && window.HALDOR_MANIFEST ? window.Haldor : null, Z = window.Zanni && window.ZANNI_MANIFEST ? window.Zanni : null, IS = window.Isolde && window.ISOLDE_MANIFEST ? window.Isolde : null, RH = window.Rhea && window.RHEA_MANIFEST ? window.Rhea : null, SO = window.Solan && window.SOLAN_MANIFEST ? window.Solan : null, NB = window.Nib && window.NIB_MANIFEST ? window.Nib : null, ED = window.Edda && window.EDDA_MANIFEST ? window.Edda : null;
  // Kits that share one start/move/refund contract (mira.js, cora.js, naja.js, haldor.js, zanni.js, isolde.js, rhea.js, solan.js, nib.js, edda.js).
  const KITS = { ...(M ? { mira: M } : {}), ...(C ? { cora: C } : {}), ...(N ? { naja: N } : {}), ...(HD ? { haldor: HD } : {}), ...(Z ? { zanni: Z } : {}), ...(IS ? { isolde: IS } : {}), ...(RH ? { rhea: RH } : {}), ...(SO ? { solan: SO } : {}), ...(NB ? { nib: NB } : {}), ...(ED ? { edda: ED } : {}) };
  let manifest = window.MECHA_MANIFEST || window.SPRITE_MANIFEST || null, metrics = window.MECHA_METRICS || null;
  let selectedCharacter = 'arco', aiEnabled = !!F, fenrCutin = null, hudIdentity = '';
  const Rules = window.MatchRules;
  let opponentCharacter = 'fenr', difficulty = 'medium', stageId = 'bellora', menuOpen = !!window.FRONTEND_ENABLED;
  let match = Rules?.create('training') || null, roundAnnouncer = null;
  const roundCues = [];
  let ready = false, paused = false, settingsOpen = false, hitboxes = false, muted = false, volume = .45;
  let scale = 1, offsetX = 0, offsetY = 0, viewW = W, viewH = H, pixelRatio = 1;
  let time = 0, realTime = 0, lastTime = 0, accumulator = 0, hitstop = 0, trauma = 0, cinematic = 0, announceTimer = 0;
  let seed = 18741, stepCount = 0, totalDamage = 0, comboHits = 0, bestCombo = 0, comboDamage = 0, comboTimer = 0, fps = 60;
  const keys = new Set(), taps = { a: -10, d: -10, s: -10 };
  const particles = [], effects = [], projectiles = [], damageNumbers = [];
  let squad = null, enemySquad = null, parade = null, enemyParade = null, flock = null, enemyFlock = null, serpent = null, enemySerpent = null, quake = null, enemyQuake = null, finale = null, enemyFinale = null, skyfall = null, enemySkyfall = null, orrery = null, enemyOrrery = null, sunroar = null, enemySunroar = null, delivery = null, enemyDelivery = null, tortoise = null, enemyTortoise = null;
  const rechargePulse = {skill1:0,skill2:0,ultimate:0};
  // CPU memory: what it has already read about the player, and its current plan.
  let cpu = { seen: new WeakMap(), decided: new WeakSet(), read: null, followPunish: null, heroActionAt: 0, heroAction: null, airborne: false, airAt: 0, antiAirRead: false, plan: null, doubleAt: 0 };
  const SQUAD = { duration: 2.85, cutinDuration: .78, firstShot: 1.50, shotGap: .095, departure: 2.24, droneWidth: 112 };
  const hero = { x: 350, y: CONFIG.groundY, vx: 0, vy: 0, facing: 1, grounded: true, jumps: 0, state: 'idle', animTime: 0, walkPhase: 0, smokeDistance:0, action: null, runDirection: 0, hp: BALANCE.heroMax, koTime:0, invuln: 0, hurtTime: 0, doublePose: 0, rollDuration: CONFIG.rollDuration, rollBuffer: null, airTime: 0, cooldowns: { skill1: 0, skill2: 0, ultimate: 0 } };
  const dummy = { x: 915, y: CONFIG.groundY, vx: 0, vy: 0, state: 'idle', stateTime: 0, damage: 0, ko:false, flash: 0, invuln: 0, angle: 0, respawnX: 915 };
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  function loadImage(name, src, required = false) { return new Promise(resolve => { const img = new Image(); img.onload = () => { images[name] = img; resolve(true); }; img.onerror = () => resolve(!required); img.src = src; }); }
  function resize() {
    viewW = Math.max(1, innerWidth); viewH = Math.max(1, innerHeight); pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewW * pixelRatio); canvas.height = Math.round(viewH * pixelRatio);
    scale = Math.min(viewW / W, viewH / H); offsetX = (viewW - W * scale) / 2;
    // Keep the same world floor and complete combat width on every screen.
    offsetY = viewH * .815 - CONFIG.groundY * scale;
    ctx.imageSmoothingEnabled = false;
  }
  function announce(text, seconds = 1.3) { $('#announcement').textContent = text; announceTimer = seconds; }
  function state(name) { if (hero.state !== name) { hero.state = name; hero.animTime = 0; } }
  function frames(name) { return manifest?.frame_layout?.rows?.[name] || []; }
  function animationDuration(name, fallback) { const row = manifest?.animation?.rows?.[name]; const count = frames(name).length; return row?.fps && count ? count / row.fps : fallback; }
  function spawnParticles(x, y, color, n, power = 220, kind = 'spark') {
    for (let i = 0; i < n; i++) { const a = random() * Math.PI * 2, speed = (random() * .8 + .3) * power; particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 65, life: .2 + random() * .4, maxLife: .6, size: 2 + random() * 4, color, kind }); }
  }
  function dust(x, n = 9) { spawnParticles(x, CONFIG.groundY - 5, '#d6c6a3', n, 80, 'dust'); }
  function runSmoke(x,facing) {
    for(let i=0;i<2;i++) particles.push({kind:'run-smoke',x:x-facing*(18+i*8),y:CONFIG.groundY-2-i*3-random()*4,vx:-facing*(35+random()*40),vy:-13-random()*12,life:.32+random()*.14,maxLife:.46,size:8+random()*5,color:'#d9e1d5'});
  }

  // A user gesture unlocks audio; AI voices stay silent until then.
  let audio = null, master = null, compressor = null, audioSources = 0;
  let systemAnnouncer = null;
  // Background music: one looping HTMLAudio outside the effects/voice mix. Default 5%; Settings turns it on/off and sets
  // its own volume (remembered on this device). Like every sound it starts only after the first user gesture, pauses in a
  // hidden tab, follows the master mute, and dips while the announcer or an ultimate voice is speaking.
  const MUSIC_PATH = 'assets/audio/music/midday-showdown.mp3';
  const prefs = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  let musicOn = prefs.get('aether.music', '1') !== '0', musicVolume = clamp(Number(prefs.get('aether.musicVolume', document.documentElement.classList.contains('touch') ? '5' : '15')) / 100 || 0, 0, 1), music = null;
  try { if (typeof Audio !== 'undefined') { music = new Audio(); music.loop = true; music.preload = 'none'; music.src = MUSIC_PATH; } } catch (_) { music = null; }
  function syncMusic() {
    if (!music) return;
    const speaking = systemAnnouncer?.speaking || (voiceActive && ultimateVoice && !ultimateVoice.paused);
    music.muted = muted; music.volume = clamp(musicVolume * (speaking ? .55 : 1), 0, 1);
    const want = musicOn && musicVolume > 0 && !!audio && !document.hidden;
    if (want && music.paused) music.play()?.catch?.(() => {});
    else if (!want && !music.paused) music.pause();
  }
  const ULTIMATE_VOICE_PATH = 'assets/audio/arco-ultimate-dylan.mp3';
  const FENR_VOICE_PATH = 'assets/fenr/audio/fenr-ultimate-holden.mp3';
  const MIRA_VOICE_PATH = 'assets/mira/audio/mira-ultimate-luna.mp3', CORA_VOICE_PATH = 'assets/cora/audio/cora-ultimate-anika.mp3', NAJA_VOICE_PATH = 'assets/naja/audio/naja-ultimate-soraya.mp3', HALDOR_VOICE_PATH = 'assets/haldor/audio/haldor-ultimate.mp3', ZANNI_VOICE_PATH = 'assets/zanni/audio/zanni-ultimate.mp3', ISOLDE_VOICE_PATH = 'assets/isolde/audio/isolde-ultimate.mp3', RHEA_VOICE_PATH = 'assets/rhea/audio/rhea-ultimate.mp3', SOLAN_VOICE_PATH = 'assets/solan/audio/solan-ultimate.mp3', NIB_VOICE_PATH = 'assets/nib/audio/nib-ultimate.mp3', EDDA_VOICE_PATH = 'assets/edda/audio/edda-ultimate.mp3';
  const VOICE_NAMES = { arco: 'Dylan', fenr: 'Holden', mira: 'Luna', cora: 'Anika', naja: 'Soraya', haldor: 'Gideon', zanni: 'Julian', isolde: 'Vesper', rhea: 'Chloe', solan: 'Xavier', nib: 'Evan', edda: 'Opal' };
  const voiceBank = {};
  let voiceKind = 'arco', voiceName = 'Dylan', voiceActor = null, voiceClock = 0;
  let ultimateVoice = null, voiceActive = false, voiceSerial = 0, voicePlayToken = 0, voiceStarts = 0, voiceError = '';
  try {
    if (typeof Audio !== 'undefined') {
      for (const [kind, path] of [['arco', ULTIMATE_VOICE_PATH], ...(F ? [['fenr', FENR_VOICE_PATH]] : []), ...(M ? [['mira', MIRA_VOICE_PATH]] : []), ...(C ? [['cora', CORA_VOICE_PATH]] : []), ...(N ? [['naja', NAJA_VOICE_PATH]] : []), ...(HD ? [['haldor', HALDOR_VOICE_PATH]] : []), ...(Z ? [['zanni', ZANNI_VOICE_PATH]] : []), ...(IS ? [['isolde', ISOLDE_VOICE_PATH]] : []), ...(RH ? [['rhea', RHEA_VOICE_PATH]] : []), ...(SO ? [['solan', SOLAN_VOICE_PATH]] : []), ...(NB ? [['nib', NIB_VOICE_PATH]] : []), ...(ED ? [['edda', EDDA_VOICE_PATH]] : [])]) {
        const media = new Audio(); media.preload = 'auto'; voiceBank[kind] = media;
        media.addEventListener('ended', () => { if (ultimateVoice !== media) return; voiceActive = false; applyAudioMix(); });
        media.addEventListener('error', () => { if (ultimateVoice !== media) return; voiceError = 'audio-load-failed'; voiceActive = false; applyAudioMix(); });
        media.addEventListener('playing', () => {
          if (ultimateVoice !== media) { media.pause(); return; }
          if (!voiceActive || !voiceRelevant()) { stopUltimateVoice(); return; }
          const elapsed = voiceElapsed();
          if (media.currentTime < .05 && elapsed > .2 && Number.isFinite(media.duration)) media.currentTime = Math.min(elapsed, media.duration);
          applyAudioMix();
        });
        media.src = path; media.load();
      }
      ultimateVoice = voiceBank.arco;
    }
  } catch (_) { voiceError = 'audio-unavailable'; }
  if(window.SystemAnnouncer && window.ANNOUNCER_MANIFEST)systemAnnouncer=window.SystemAnnouncer.create({
    clips:window.ANNOUNCER_MANIFEST.clips,canPlay:()=>!!audio&&!document.hidden,isPaused:()=>paused||settingsOpen||document.hidden,
    onStart:()=>stopUltimateVoice(),onActivity:()=>applyAudioMix()
  });
  function voiceElapsed() { return voiceKind === 'fenr' ? (voiceActor?.transformElapsed ?? Infinity) : voiceKind === 'arco' ? ((voiceActor === dummy ? enemySquad : squad)?.t ?? Infinity) : voiceClock; }
  function voiceRelevant() {
    if (voiceKind === 'arco') return !!(voiceActor === dummy ? enemySquad : squad);
    const alive = !!voiceActor && (voiceActor === hero ? hero.hp > 0 : !dummy.ko);
    // MIRA/CORA/NAJA/HALDOR/ZANNI/ISOLDE/RHEA/SOLAN/NIB/EDDA lines run longer than their salvo; they finish unless the caster is K.O. or the fight resets.
    if (voiceKind !== 'fenr') return alive;
    return alive && (voiceActor.transformPending > 0 || voiceActor.form === 'wolf');
  }
  function applyAudioMix() {
    if (master) master.gain.value = muted ? 0 : volume * ((systemAnnouncer?.speaking || (voiceActive && ultimateVoice && !ultimateVoice.paused)) ? .38 : 1);
    for (const media of Object.values(voiceBank)) { media.muted = muted; media.volume = clamp(volume * 1.25, 0, 1); }
    systemAnnouncer?.setMix(volume,muted);
    syncMusic();
  }
  function stopUltimateVoice() {
    voiceSerial++; voicePlayToken++; voiceActive = false;
    if (ultimateVoice) { ultimateVoice.pause(); try { ultimateVoice.currentTime = 0; } catch (_) {} }
    applyAudioMix();
  }
  function syncUltimateVoice() {
    systemAnnouncer?.sync();
    if (!ultimateVoice) return;
    if (!voiceActive || paused || settingsOpen || document.hidden) { voicePlayToken++; ultimateVoice.pause(); applyAudioMix(); return; }
    if (!voiceRelevant() || (Number.isFinite(ultimateVoice.duration) && voiceElapsed() >= ultimateVoice.duration)) { stopUltimateVoice(); return; }
    if (ultimateVoice.paused) {
      const serial = voiceSerial, playToken = ++voicePlayToken;
      const play = ultimateVoice.play();
      if (play?.catch) play.catch(error => { if (serial !== voiceSerial || playToken !== voicePlayToken) return; voiceActive = false; voiceError = error?.name || 'audio-playback-failed'; applyAudioMix(); });
    }
    applyAudioMix();
  }
  function startUltimateVoice(kind = 'arco', actor = hero) {
    // One speaking channel. Player calls take priority over an AI transformation.
    if (!audio || systemAnnouncer?.busy || !voiceBank[kind] || (actor === dummy && voiceActive)) return;
    stopUltimateVoice();
    ultimateVoice = voiceBank[kind]; voiceKind = kind; voiceActor = actor; voiceName = VOICE_NAMES[kind]; voiceClock = 0;
    try { ultimateVoice.currentTime = 0; } catch (_) {}
    voiceActive = true; voiceStarts++; voiceError = '';
    syncUltimateVoice();
  }
  function unlockAudio() {
    try { if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; audio = new AC(); master = audio.createGain(); compressor = audio.createDynamicsCompressor(); master.connect(compressor); compressor.connect(audio.destination); } if (audio.state === 'suspended') audio.resume(); applyAudioMix(); } catch (_) { /* Audio is optional; gameplay remains usable. */ }
  }
  function sound(type) {
    if (!audio || audio.state !== 'running' || muted) return;
    const start = audio.currentTime, heavy = type === 'heavy' || type === 'ultimate';
    const duration = type === 'ultimate' ? .7 : heavy ? .26 : type === 'cast' ? .22 : .13;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type === 'jump' || type === 'cast' ? 'sine' : 'triangle';
    const frequency = ({ hit: 210, heavy: 110, cast: 430, jump: 360, ultimate: 72, step: 75, click: 550 })[type] || 190;
    osc.frequency.setValueAtTime(frequency, start); osc.frequency.exponentialRampToValueAtTime(type === 'jump' || type === 'cast' ? frequency * 2.5 : frequency * .22, start + duration);
    gain.gain.setValueAtTime(.001, start); gain.gain.exponentialRampToValueAtTime(heavy ? .32 : .12, start + .008); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + duration + .02); audioSources++;
    if (type !== 'jump' && type !== 'click') { const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate), data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2); const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), noiseGain = audio.createGain(); source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = heavy ? 430 : 1800; filter.Q.value = .7; noiseGain.gain.value = heavy ? .35 : .14; source.connect(filter); filter.connect(noiseGain); noiseGain.connect(master); source.start(start); audioSources++; }
  }

  function menuSound(kind='move') {
    unlockAudio();if(!audio || muted)return;
    // pick: the lock-in chime when a fighter is confirmed; blink: the soft tick of each following flash.
    const notes={move:[580,820],confirm:[440,660,880],back:[440,300],locked:[155,125],round:[330,440],fight:[440,880,1320],pick:[523,784,1047,1568],blink:[1175]}[kind]||[580];
    const gap=kind==='pick'?.045:.035,peak=kind==='blink'?.03:kind==='pick'?.085:.075,tail=kind==='pick'?.24:.095;
    for(const [i,n] of notes.entries()){const at=audio.currentTime+i*gap,o=audio.createOscillator(),g=audio.createGain();o.type=kind==='locked'||kind==='pick'?'triangle':'sine';o.frequency.setValueAtTime(n,at);g.gain.setValueAtTime(.001,at);g.gain.exponentialRampToValueAtTime(peak,at+.005);g.gain.exponentialRampToValueAtTime(.001,at+tail);o.connect(g);g.connect(master);o.start(at);o.stop(at+tail+.015);audioSources++;}
  }
  function setMenuOpen(value) {
    menuOpen=!!value;clearInput();if(menuOpen){systemAnnouncer?.clear();stopUltimateVoice();squad=enemySquad=parade=enemyParade=flock=enemyFlock=serpent=enemySerpent=quake=enemyQuake=finale=enemyFinale=skyfall=enemySkyfall=orrery=enemyOrrery=sunroar=enemySunroar=delivery=enemyDelivery=tortoise=enemyTortoise=null;fenrCutin=null;projectiles.length=effects.length=0;setPaused(false);}
    document.body.classList.toggle('in-menu',menuOpen);$('#front-menu').hidden=!menuOpen;
    window.FrontEnd?.syncBackground();
  }
  function playable() { return ['arco','fenr',...Object.keys(KITS)]; }
  function startMatch(options={}) {
    if(!ready||!Rules)return false;
    const {player='arco',enemy='fenr',stage='bellora',level='medium',mode='versus'}=options;
    if(!playable().includes(player)||!playable().includes(enemy)||!Object.hasOwn(Rules.stages,stage)||!Object.hasOwn(Rules.difficulties,level)||!['versus','training'].includes(mode))return false;
    if(!images['stage-'+stage])return false;
    selectedCharacter=player;opponentCharacter=enemy;stageId=stage;difficulty=level;images.stage=images['stage-'+stage];CONFIG.groundY=Rules.stages[stage].groundY;
    aiEnabled=mode==='versus';match=Rules.create(mode);roundCues.length=0;setMenuOpen(false);resetCombat();warmCutins();
    $('#ai-toggle').checked=aiEnabled;$('#character-select').value=selectedCharacter;document.body.classList.toggle('in-versus',mode==='versus');
    if(mode==='versus'){announceTimer=0;emitRoundCue('round',1);}else announce('TRAINING READY',1.3);
    return true;
  }
  function emitRoundCue(cue,round) {
    const event={cue,round,text:cue==='round'?`Round ${round}`:'Fight!'};roundCues.push(event);if(roundCues.length>12)roundCues.shift();
    if(audio)menuSound(cue);if(roundAnnouncer)try{roundAnnouncer(event);}catch(_){}
    systemAnnouncer?.play(cue==='round'?`round_${round}`:'fight',{replace:cue==='round'});
  }
  function advanceMatch(dt) {
    if(!Rules||!match||match.mode!=='versus')return;
    for(const event of Rules.tick(match,dt,hero.hp,currentDummyHP())) {
      if(event.type==='cue')emitRoundCue(event.cue,event.round);
      if(event.type==='round-end') {
        clearInput();stopUltimateVoice();squad=enemySquad=parade=enemyParade=flock=enemyFlock=serpent=enemySerpent=quake=enemyQuake=finale=enemyFinale=skyfall=enemySkyfall=orrery=enemyOrrery=sunroar=enemySunroar=delivery=enemyDelivery=tortoise=enemyTortoise=null;fenrCutin=null;hero.action=dummy.action=null;projectiles.length=effects.length=0;hitstop=cinematic=trauma=0;
        if(hero.hp<=0)state('down');else state('idle');if(currentDummyHP()>0){dummy.state='idle';dummy.stateTime=0;}
        match.endText=event.doubleKO?'DOUBLE K.O.':event.timeout?'TIME UP':'K.O.';announceTimer=0;sound('heavy');
        const call=event.doubleKO?'double_ko':event.timeout?'time_up':'ko';
        const outcome=event.winner==='draw'?'draw':`${event.winner==='player'?selectedCharacter:opponentCharacter}_wins`;
        const speech=window.ANNOUNCER_MANIFEST?.clips;
        if(speech)match.koDuration=Math.max(2.2,(speech[call]?.duration||0)+(speech[outcome]?.duration||0)+.5);
        systemAnnouncer?.play([call,outcome]);
      }
      if(event.type==='next-round'){resetCombat();announceTimer=0;emitRoundCue('round',event.round);}
      if(event.type==='complete')window.FrontEnd?.showResult({winner:match.winner,playerWins:match.playerWins,enemyWins:match.enemyWins,player:selectedCharacter,enemy:opponentCharacter,stage:stageId,level:difficulty,mode:'versus'});
    }
  }
  function updateMatchHud() {
    if(!Rules)return;
    const versus=match?.mode==='versus',s=Rules.stages[stageId];
    $('#mode-label').textContent=versus?`ROUND ${match.round} / 3`:'FREE TRAINING';$('#match-clock').textContent=versus?String(Math.ceil(match.seconds)).padStart(2,'0'):'∞';
    $('.match-center').setAttribute('aria-label',versus?'Pertandingan, menang dua ronde dari maksimal tiga':'Mode latihan tanpa batas waktu');
    $('#match-score').textContent=versus?`${match.playerWins} — ${match.enemyWins}`:'VS';$('#stage-name').textContent=s.short;$('#stage-subtitle').textContent=s.subtitle;
    $('#round-wins-player').textContent=versus?'◆'.repeat(match.playerWins)+'◇'.repeat(2-match.playerWins):'';$('#round-wins-enemy').textContent=versus?'◆'.repeat(match.enemyWins)+'◇'.repeat(2-match.enemyWins):'';
    const card=$('#round-call'),show=!menuOpen&&versus&&['intro','ko'].includes(match.phase);
    card.hidden=!show;card.dataset.phase=match?.phase||'fight';
    $('#round-call-title').textContent=!show?'':match.phase==='intro'?(match.fightCue?'FIGHT':`ROUND ${match.round}`):match.endText||'K.O.';
    $('#round-call-detail').textContent=match?.phase==='ko'?(match.lastWinner==='draw'?'DRAW · ROUND REPLAY':(match.lastWinner==='player'?selectedCharacter:opponentCharacter).toUpperCase()+' WINS THE ROUND'):'FIRST TO TWO WINS';
    canvas.dataset.mode=match?.mode||'training';canvas.dataset.matchPhase=match?.phase||'fight';canvas.dataset.round=String(match?.round||1);canvas.dataset.opponent=opponentCharacter;canvas.dataset.difficulty=difficulty;canvas.dataset.stage=stageId;
  }

  function canAct() { return ready && !menuOpen && (!match || match.phase === 'fight') && !paused && !settingsOpen && hero.hurtTime <= 0 && hero.hp > 0; }
  function jump(second = false) {
    if (!canAct()) return false;
    // A basic attack never locks the player: after its hit a jump cancels the recovery; pressed during the wind-up it is
    // kept and happens the moment the hit lands (the swing still connects).
    if (hero.action?.type === 'attack') { if (!hero.action.fired) { hero.action.cancelInto = 'jump'; hero.action.queued = 0; return true; } hero.action = null; }
    if (hero.action) return false;
    if (second) {
      if (hero.jumps >= 2) return false;
      hero.jumps = 2; hero.vy = -CONFIG.doubleJumpSpeed; hero.grounded = false; state('doublejump');
      effects.push({ type: 'airpulse', x: hero.x, y: hero.y - 8, life: .5, maxLife: .5 }); spawnParticles(hero.x, hero.y - 7, '#b3fff2', 22, 190); sound('cast');
      hero.rollDuration = CONFIG.rollDuration;
      hero.doublePose = hero.rollDuration; hero.airTime = 0; return true;
    }
    if (!hero.grounded && hero.jumps >= 2) return false;
    if (!hero.grounded) return jump(true);
    hero.jumps = 1; hero.vy = -CONFIG.jumpSpeed; hero.grounded = false; hero.airTime = 0; state('jump'); dust(hero.x, 12); sound('jump'); return true;
  }
  function startAttack(index = 1) {
    if (!canAct()) return false;
    if (hero.doublePose > 0) { hero.rollBuffer = 'attack'; return true; }
    if (hero.action) { if (hero.action.type === 'attack' && hero.action.index < 3) { hero.action.queued = Math.min(3 - hero.action.index, hero.action.queued + 1); hero.action.cancelInto = null; } return false; }
    const name = `attack${index}`, duration = selectedCharacter === 'fenr' ? F.move(hero,'attack',index).duration : KITS[selectedCharacter] ? KITS[selectedCharacter].move('attack',index).duration : animationDuration(name, [.39, .43, .57][index - 1]);
    hero.action = { type: 'attack', index, name, t: 0, duration, hit: false, queued: 0, fired: false };
    hero.runDirection = 0; state(name); return true;
  }
  // Skills cancel a basic attack at any point, so the kit never waits for the combo to finish. A skill that cannot start
  // (cooldown, summon still out) leaves the attack untouched.
  function cast(name) {
    const basic = hero.action?.type === 'attack' ? hero.action : null;
    if (basic && canAct() && (hero.cooldowns[name] || 0) <= 0) hero.action = null;
    const ok = castMove(name);
    if (!ok && basic && !hero.action) { hero.action = basic; state(basic.name); }
    return ok;
  }
  function castMove(name) {
    if(selectedCharacter === 'fenr') {
      if(!canAct() || hero.action || !Object.hasOwn(cooldownMax,name))return false;
      if(hero.doublePose>0){hero.rollBuffer=name;return true;}
      if(!F.start(hero,name))return false;
      hero.animTime=0;hero.runDirection=0;
      if(name==='ultimate')showFenrTransformation(hero);
      sound(name==='ultimate'?'ultimate':'cast');return true;
    }
    if(KITS[selectedCharacter]) {
      if(!canAct() || hero.action || !Object.hasOwn(cooldownMax,name) || (name==='ultimate'&&(parade||flock||serpent||quake||finale||skyfall||orrery||sunroar||delivery||tortoise)))return false;
      if(hero.doublePose>0){hero.rollBuffer=name;return true;}
      if(!KITS[selectedCharacter].start(hero,name))return false;
      hero.animTime=0;hero.runDirection=0;
      if(name==='ultimate')startSummon(hero);
      sound(name==='ultimate'?'ultimate':'cast');return true;
    }
    if (!canAct() || hero.action || hero.cooldowns[name] > 0 || !Object.hasOwn(cooldownMax, name) || (name === 'ultimate' && squad)) return false;
    if (hero.doublePose > 0) { hero.rollBuffer = name; return true; }
    hero.cooldowns[name] = cooldownMax[name]; hero.runDirection = 0;
    const fallback = { skill1: .66, skill2: .85, ultimate: 1.9 }[name];
    hero.action = { type: name, name, t: 0, duration: name === 'ultimate' ? BALANCE.ultimate.castTime : animationDuration(name, fallback), fired: false, hit: false };
    state(name); sound(name === 'ultimate' ? 'ultimate' : 'cast');
    if (name === 'ultimate') startSquadron();
    return true;
  }
  function press(key, fromTest = false) {
    key = key.toLowerCase(); if (!fromTest) unlockAudio();
    if(menuOpen) {if(key==='escape'&&settingsOpen)closeSettings();return;}
    if (key === 'escape') { if (settingsOpen) closeSettings(); else setPaused(!paused); return; }
    if (key === 'r') { reset(); return; }
    if (!canAct() || keys.has(key)) return;
    keys.add(key);
    if (key === 'a' || key === 'd') { const direction = key === 'a' ? -1 : 1; if (time - taps[key] <= CONFIG.doubleTapWindow) hero.runDirection = direction; else if (hero.runDirection !== direction) hero.runDirection = 0; taps[key] = time; taps[key === 'a' ? 'd' : 'a'] = -10; }
    // A new left/right press cuts a basic attack short: right away after its hit, or as soon as the hit lands.
    if ((key === 'a' || key === 'd') && hero.action?.type === 'attack') { if (hero.action.fired) { hero.action = null; state(hero.grounded ? 'idle' : 'jump'); } else { hero.action.cancelInto = 'move'; hero.action.queued = 0; } }
    if (key === 'w') jump();
    if (key === 's') { if (time - taps.s <= CONFIG.doubleTapWindow) jump(true); taps.s = time; }
    if (key === ' ') startAttack();
    if (key === 'i') cast('skill1'); if (key === 'o') cast('skill2'); if (key === 'p') cast('ultimate');
  }
  function release(key) { key = key.toLowerCase(); keys.delete(key); if ((key === 'a' && hero.runDirection === -1) || (key === 'd' && hero.runDirection === 1)) hero.runDirection = 0; }
  function clearInput() { keys.clear(); hero.runDirection = 0; taps.a = taps.d = taps.s = -10; }
  function resetCombat() {
    systemAnnouncer?.clear();
    stopUltimateVoice();
    Object.assign(hero, { x: 350, y: CONFIG.groundY, vx: 0, vy: 0, facing: 1, grounded: true, jumps: 0, state: 'idle', animTime: 0, walkPhase: 0, smokeDistance:0, action: null, runDirection: 0, hp: BALANCE.heroMax, koTime:0, invuln: 0, hurtTime: 0, doublePose: 0, rollDuration: CONFIG.rollDuration, rollBuffer: null, airTime: 0, cooldowns: { skill1: 0, skill2: 0, ultimate: 0 } });
    Object.assign(dummy, { x: 915, y: CONFIG.groundY, vx: 0, vy: 0, state: 'idle', stateTime: 0, damage: 0, ko:false, flash: 0, invuln: 0, angle: 0 });
    if(F) {F.reset(hero);F.reset(dummy);Object.assign(dummy,{facing:-1,action:null,cooldowns:{skill1:0,skill2:0,ultimate:0},aiThink:.4,aiTime:0,aiChain:0,walkPhase:0,jumps:0});cpu={seen:new WeakMap(),decided:new WeakSet(),read:null,heroActionAt:0,heroAction:null,airborne:false,airAt:0,antiAirRead:false,plan:null,doubleAt:0};syncPlayerForm();}
    fenrCutin=null;hudIdentity='';
    particles.length = effects.length = projectiles.length = damageNumbers.length = 0; totalDamage = comboHits = bestCombo = comboDamage = comboTimer = hitstop = trauma = cinematic = 0; clearInput(); setPaused(false); announce('TRAINING READY', 1.25);
    squad = null; enemySquad = null; parade = null; enemyParade = null; flock = null; enemyFlock = null; serpent = null; enemySerpent = null; quake = null; enemyQuake = null; finale = null; enemyFinale = null; skyfall = null; enemySkyfall = null; orrery = null; enemyOrrery = null; sunroar = null; enemySunroar = null; delivery = null; enemyDelivery = null; tortoise = null; enemyTortoise = null;
    for(const name of Object.keys(rechargePulse)) rechargePulse[name]=0;
  }
  function reset() {
    if(Rules)match=Rules.create(match?.mode||'training');
    resetCombat();if(match?.mode==='versus'){announceTimer=0;emitRoundCue('round',1);}
  }
  function hitDummy(damage, power, color, sourceX, impactY, knockdown = false, freezeWorld = true, shake = 1) {
    if (menuOpen || (match && match.phase!=='fight') || dummy.invuln > 0 || dummy.state === 'down' || dummy.state === 'recover') return false;
    if (dummy.action?.guard && shellGuard(dummy)) return false;
    const dir = sourceX <= dummy.x ? 1 : -1;
    dummy.damage += damage; totalDamage += damage; comboHits++; bestCombo = Math.max(bestCombo, comboHits); comboDamage += damage; comboTimer = 2.3;
    // Versus combo limit: after comboCap hits in one continuous stun the CPU gets its immunity (like the player's),
    // so a re-started chain cannot loop it to K.O. Easy has no limit.
    const cap = F && aiEnabled && match?.mode === 'versus' ? cpuProfile().comboCap : 0;
    dummy.stunHits = dummy.state === 'hurt' ? (dummy.stunHits || 0) + 1 : 1;
    if (cap && dummy.stunHits >= cap) dummy.invuln = .5 + cpuProfile().immunity;
    dummy.flash = 0; dummy.vx = dir * power; dummy.stateTime = 0; dummy.state = 'hurt';
    dummy.action=null;
    if(F&&dummy.transformPending>0)F.end(dummy);
    if (freezeWorld) hitstop = Math.max(hitstop, damage >= 30 ? .085 : .045);
    trauma = Math.min(1, trauma + (damage >= 30 ? .45 : .18) * shake);
    damageNumbers.push({ x: dummy.x + (random() - .5) * 20, y: impactY - 20, amount: damage, life: .9, maxLife: .9, color });
    spawnParticles(dummy.x - dir * 21, impactY, color, damage >= 30 ? 22 : 14, damage >= 30 ? 320 : 220);
    effects.push({ type: 'impact', x: dummy.x - dir * 15, y: impactY, life: .2, maxLife: .2, color, heavy: damage >= 30 });
    if (dummy.damage >= BALANCE.dummyMax || knockdown) { dummy.ko=dummy.damage>=BALANCE.dummyMax; dummy.state = 'down'; dummy.vy = -330; dummy.vx = dir * 290; dummy.fallDirection = dir; announce(dummy.ko?'K.O.':'KNOCKDOWN', .9); }
    sound(damage >= 30 ? 'heavy' : 'hit'); return true;
  }
  function attackRange(index) {
    if(selectedCharacter==='fenr')return F.move(hero,'attack',index).reach;
    if(KITS[selectedCharacter])return KITS[selectedCharacter].move('attack',index).reach;
    const name = `attack${index}`, data = manifest?.combat?.hitRanges?.[name];
    const measured = metrics?.states?.[name]?.frames;
    return typeof data === 'number' ? data : data?.reach || (measured?.length ? Math.max(...measured.map(f => f.bounds.right)) : [122, 143, 176][index - 1]);
  }
  function emitter(name) {
    const measured = metrics?.emitters?.[name];
    if (measured && Number.isFinite(measured.x) && Number.isFinite(measured.y)) return { x: hero.x + hero.facing * measured.x, y: hero.y + measured.y };
    // Fallbacks measured on the first atlas, not inferred from the cell dimensions.
    const fallback = { attack1: [61, -105], attack2: [27, -157], attack3: [47, -102], skill1: [89, -113], skill2: [30, 0], ultimate: [88, -93] }[name] || [50, -100];
    return { x: hero.x + hero.facing * fallback[0], y: hero.y + fallback[1] };
  }
  function meleeHit(index) {
    if(selectedCharacter==='fenr'){fenrStrike(hero,F.move(hero,'attack',index));return;}
    if(selectedCharacter==='mira'){miraStrike(hero,M.move('attack',index));return;}
    if(selectedCharacter==='cora'){coraStrike(hero,C.move('attack',index));return;}
    if(selectedCharacter==='naja'){najaStrike(hero,N.move('attack',index));return;}
    if(selectedCharacter==='haldor'){haldorStrike(hero,HD.move('attack',index));return;}
    if(selectedCharacter==='zanni'){zanniStrike(hero,Z.move('attack',index));return;}
    if(selectedCharacter==='isolde'){isoldeStrike(hero,IS.move('attack',index));return;}
    if(selectedCharacter==='rhea'){rheaStrike(hero,RH.move('attack',index));return;}
    if(selectedCharacter==='solan'){solanStrike(hero,SO.move('attack',index));return;}
    if(selectedCharacter==='nib'){nibStrike(hero,NB.move('attack',index));return;}
    if(selectedCharacter==='edda'){eddaStrike(hero,ED.move('attack',index));return;}
    const reach = attackRange(index), dx = (dummy.x - hero.x) * hero.facing, y = emitter(`attack${index}`).y;
    effects.push({ type: 'slash', x: hero.x + hero.facing * 48, y: y + 5, life: .22, maxLife: .22, facing: hero.facing, index, color: index === 3 ? '#ffe4a5' : '#cffbf0' });
    if (dx > -24 && dx < reach + 27 && Math.abs(dummy.y - hero.y) < 113) {
      const connected = hitDummy(BALANCE.combo[index-1].damage, BALANCE.combo[index-1].knockback, index === 3 ? '#ffdf92' : '#c6fff0', hero.x, y);
      if (connected) for (const name of Object.keys(cooldownMax)) {
        if(hero.cooldowns[name]>0) rechargePulse[name]=.22;
        hero.cooldowns[name] = Math.max(0, hero.cooldowns[name] - cooldownMax[name] * BALANCE.basicCooldownRefund);
      }
    }
    else sound('step');
  }
  function fireSkill(action) {
    if(selectedCharacter==='fenr'){fenrStrike(hero,action);return;}
    if(selectedCharacter==='mira'){miraStrike(hero,action);return;}
    if(selectedCharacter==='cora'){coraStrike(hero,action);return;}
    if(selectedCharacter==='naja'){najaStrike(hero,action);return;}
    if(selectedCharacter==='haldor'){haldorStrike(hero,action);return;}
    if(selectedCharacter==='zanni'){zanniStrike(hero,action);return;}
    if(selectedCharacter==='isolde'){isoldeStrike(hero,action);return;}
    if(selectedCharacter==='rhea'){rheaStrike(hero,action);return;}
    if(selectedCharacter==='solan'){solanStrike(hero,action);return;}
    if(selectedCharacter==='nib'){nibStrike(hero,action);return;}
    if(selectedCharacter==='edda'){eddaStrike(hero,action);return;}
    const name = action.type, origin = emitter(name);
    if (name === 'skill1') { projectiles.push({ x: origin.x, y: origin.y, vx: hero.facing * 920, life: 1.6, facing: hero.facing }); effects.push({ type: 'muzzle', x: origin.x, y: origin.y, life: .25, maxLife: .25 }); spawnParticles(origin.x, origin.y, '#a9f8ef', 12, 140); }
    if (name === 'skill2') { const x = origin.x; effects.push({ type: 'slam', x, y: CONFIG.groundY - 2, life: .8, maxLife: .8 }); spawnParticles(x, CONFIG.groundY - 8, '#c7eafd', 40, 370); trauma = Math.min(1, trauma + .35); sound('heavy'); if (Math.abs(dummy.x - x) < BALANCE.skill2.radius && dummy.y > CONFIG.groundY - 125) hitDummy(BALANCE.skill2.damage, BALANCE.skill2.knockback, '#bfe9ff', hero.x, dummy.y - 65); }
  }
  function startSquadron(actor = hero) {
    const target=actor===hero?dummy:hero;
    const centerX = clamp(actor.x, 220, W - 220), baseY = clamp(actor.y, 480, CONFIG.groundY);
    const offsets = [[-150,-240],[-55,-310],[65,-305],[160,-235]];
    const group = { t: 0, owner:actor===hero?'player':'enemy', facing: actor.facing, casterX: actor.x, targeted: (target.x - actor.x) * actor.facing >= 0,
      shots: 0, phase: 'cutin', drones: offsets.map(([dx,dy], i) => ({ id: i, x: centerX + actor.facing * (dx - 360), y: -130 - i * 55,
        startX: centerX + actor.facing * (dx - 360), startY: -130 - i * 55, targetX: centerX + actor.facing * dx,
        targetY: baseY + dy, delay: .46 + i * .10, fired: false, visible: false, alpha: 1, angle: 0 })) };
    if(actor===hero)squad=group;else enemySquad=group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('arco',actor);
  }
  function updateSquadron(dt, s = squad) {
    if (!s) return;
    const target=s.owner==='enemy'?hero:dummy;s.t += dt;
    s.phase = s.t < SQUAD.cutinDuration ? 'cutin' : s.t < SQUAD.firstShot ? 'lock-on' : s.t < SQUAD.departure ? 'firing' : 'departing';
    for (const d of s.drones) {
      const entry = clamp((s.t - d.delay) / .60, 0, 1), ease = 1 - Math.pow(1 - entry, 3);
      d.visible = s.t >= d.delay;
      d.x = d.startX + (d.targetX - d.startX) * ease;
      d.y = d.startY + (d.targetY - d.startY) * ease;
      if (entry === 1) d.y += Math.sin((s.t - d.delay) * 5 + d.id) * 2;
      if (s.t > SQUAD.departure) { const exit = clamp((s.t - SQUAD.departure) / .6, 0, 1); d.x += s.facing * exit * exit * 280; d.y -= exit * exit * 470; d.alpha = 1 - exit; }
      const targetX = s.targeted ? target.x : (s.facing === 1 ? W + 50 : -50);
      const targetY = s.targeted ? target.y - 85 : CONFIG.groundY - 90;
      d.angle = s.facing * Math.atan2(targetY - d.y, Math.abs(targetX - d.x));
      if (!d.fired && s.t >= SQUAD.firstShot + d.id * SQUAD.shotGap) {
        d.fired = true; s.shots++;
        const origin = droneMuzzle(d, s.facing);
        effects.push({ type: 'drone-laser', owner:s.owner, x: origin.x, y: origin.y, endX: targetX, endY: targetY, life: .65, maxLife: .65, droneId: d.id });
        effects.push({ type: 'muzzle', x: origin.x, y: origin.y, life: .19, maxLife: .19, color: '#fff0be' });
        spawnParticles(origin.x, origin.y, '#a8fff0', 8, 90);
        trauma = Math.max(trauma, d.id === 3 ? .5 : .23); sound('cast');
        if (s.targeted && (target.x - s.casterX) * s.facing >= -30) {
          if(s.owner==='enemy')window.__game.receiveHit(BALANCE.ultimate.damagePerDrone,{freeze:false,projectile:true});
          else hitDummy(BALANCE.ultimate.damagePerDrone, d.id === 3 ? BALANCE.ultimate.knockback : 45, '#ffe2a0', s.casterX, targetY, false, false);
        }
      }
    }
    for (const e of effects) {
      if (e.type !== 'drone-laser'||e.owner!==s.owner) continue;
      const origin = droneMuzzle(s.drones[e.droneId], s.facing);
      e.x = origin.x; e.y = origin.y;
      if (s.targeted) { e.endX = target.x; e.endY = target.y - 85; }
    }
    if (s.t >= SQUAD.duration) { if(s.owner==='enemy')enemySquad=null;else squad=null;if (voiceActive && voiceKind === 'arco' && (voiceActor===dummy)===(s.owner==='enemy')) stopUltimateVoice(); }
  }
  // MIRA Rocket Parade: 12 rockets from alternating pods, one 4-damage hit each (48 total), no global hit-stop.
  function startRocketParade(actor = hero) {
    const target = actor === hero ? dummy : hero, P = M.parade;
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, casterX: actor.x,
      targeted: (target.x - actor.x) * actor.facing >= 0, hits: 0, launched: 0, exploded: 0, phase: 'cutin',
      rockets: Array.from({ length: M.balance.rockets }, (_, i) => ({ id: i, pod: i % 2, launchAt: P.launchStart + i * P.launchGap,
        impactAt: P.impactStart + i * P.impactGap, spread: ((i * 7) % 11 - 5) * 9, lift: 250 + ((i * 5) % 4) * 38,
        state: 'loaded', locked: false, x: 0, y: 0, sx: 0, sy: 0, tx: 0, ty: 0, angle: 0 })) };
    if (actor === hero) parade = group; else enemyParade = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('mira', actor);
  }
  function paradeAim(s, r, target) {
    if (s.targeted) return { x: target.x + r.spread, y: target.y - 70 - Math.abs(r.spread) * .6 };
    return { x: clamp(s.casterX + s.facing * (380 + r.id * 22), 40, W - 40), y: CONFIG.groundY - 14 };
  }
  function updateParade(dt, s) {
    if (!s) return;
    const actor = s.owner === 'enemy' ? dummy : hero, target = s.owner === 'enemy' ? hero : dummy, P = M.parade;
    const pods = window.MIRA_METRICS?.emitters?.ultimatePods?.pods || [{ x: -34, y: -168 }, { x: 71, y: -147 }];
    s.t += dt;
    for (const r of s.rockets) {
      if (r.state === 'loaded' && s.t >= r.launchAt) {
        // Rockets leave the pods where the robot stands now; the salvo keeps its own cast direction and target lock.
        const pod = pods[r.pod % pods.length];
        r.state = 'flying'; r.sx = r.x = actor.x + actor.facing * pod.x; r.sy = r.y = actor.y + pod.y; s.launched++;
        effects.push({ type: 'muzzle', x: r.sx, y: r.sy, life: .16, maxLife: .16, color: '#ffe38a' });
        if (r.id % 3 === 0) sound('cast');
      }
      if (r.state !== 'flying') continue;
      const u = clamp((s.t - r.launchAt) / (r.impactAt - r.launchAt), 0, 1);
      if (!r.locked) { const aim = paradeAim(s, r, target); r.tx = aim.x; r.ty = aim.y; r.locked = u >= .8; }
      const cx = r.sx + (r.tx - r.sx) * .35, cy = Math.min(r.sy, r.ty) - r.lift, inv = 1 - u;
      const nx = inv * inv * r.sx + 2 * inv * u * cx + u * u * r.tx, ny = inv * inv * r.sy + 2 * inv * u * cy + u * u * r.ty;
      if (nx !== r.x || ny !== r.y) r.angle = Math.atan2(ny - r.y, nx - r.x);
      r.x = nx; r.y = ny;
      if ((stepCount + r.id) % 4 === 0) particles.push({ kind: 'dust', x: r.x - Math.cos(r.angle) * 24, y: r.y - Math.sin(r.angle) * 24, vx: -Math.cos(r.angle) * 40, vy: -Math.sin(r.angle) * 40, life: .32, maxLife: .32, size: 3 + random() * 3, color: r.id % 2 ? '#ffc7ea' : '#ffe39a' });
      if (u < 1) continue;
      r.state = 'done'; s.exploded++;
      effects.push({ type: 'mira-fx', asset: 'mira-burst', x: r.x, y: r.y, facing: 1, life: .34, maxLife: .34, size: 92 });
      spawnParticles(r.x, r.y, '#ffc6ec', 6, 150);
      if (s.targeted && Math.abs(target.x - r.x) < 85 && Math.abs(target.y - 90 - r.y) < 115) {
        const last = r.id === s.rockets.length - 1;
        const connected = s.owner === 'enemy' ? window.__game.receiveHit(M.balance.rocketDamage, { freeze: false, projectile: true, shake: .3 })
          : hitDummy(M.balance.rocketDamage, last ? 190 : 30, '#ffd86b', s.casterX, r.y, false, false, .3);
        if (connected) s.hits++;
      }
    }
    s.phase = s.t < P.cutinDuration ? 'cutin' : s.exploded < s.rockets.length ? 'barrage' : 'clearing';
    if (s.t >= P.duration) { if (s.owner === 'enemy') enemyParade = null; else parade = null; }
  }
  function startSummon(actor) { const id = actor === hero ? selectedCharacter : opponentCharacter; if (id === 'cora') startMurmuration(actor); else if (id === 'naja') startSerpent(actor); else if (id === 'haldor') startQuake(actor); else if (id === 'zanni') startFinale(actor); else if (id === 'isolde') startSkyfall(actor); else if (id === 'rhea') startOrrery(actor); else if (id === 'solan') startSunroar(actor); else if (id === 'nib') startDelivery(actor); else if (id === 'edda') startTortoise(actor); else startRocketParade(actor); }
  // CORA Night Murmuration: three raven passes sweep forward from behind her wings at three heights,
  // one 16-damage hit each (48 total), no global hit-stop. A pass hits once, when its lead raven crosses the target.
  function startMurmuration(actor = hero) {
    const U = C.murmuration;
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, casterX: actor.x, hits: 0, phase: 'cutin',
      passes: U.passStart.map((at, id) => ({ id, at, y: CONFIG.groundY + U.passHeights[id], front: actor.x - actor.facing * 140, state: 'waiting', hit: false })) };
    if (actor === hero) flock = group; else enemyFlock = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('cora', actor);
  }
  function updateMurmuration(dt, s) {
    if (!s) return;
    const target = s.owner === 'enemy' ? hero : dummy, U = C.murmuration, tail = (U.ravens - 1) * U.spacing;
    s.t += dt;
    for (const p of s.passes) {
      if (p.state === 'waiting' && s.t >= p.at) { p.state = 'flying'; sound('cast'); }
      if (p.state !== 'flying') continue;
      const old = p.front; p.front += s.facing * U.speed * dt;
      if (!p.hit && (target.x - old) * s.facing >= 0 && (target.x - p.front) * s.facing < 0) {
        // Only a target in front of the cast whose body overlaps this pass height is struck; a jump can clear the low pass.
        p.hit = true;
        if ((target.x - s.casterX) * s.facing >= -30 && p.y > target.y - 200 && p.y < target.y + 20) {
          const connected = s.owner === 'enemy' ? window.__game.receiveHit(C.balance.passDamage, { freeze: false, projectile: true, shake: .6 })
            : hitDummy(C.balance.passDamage, p.id === s.passes.length - 1 ? 190 : 60, '#d9c2ff', s.casterX, p.y, false, false, .6);
          if (connected) { s.hits++; spawnParticles(target.x, p.y, '#3a2d58', 10, 180); }
        }
      }
      if ((stepCount + p.id) % 5 === 0) particles.push({ kind: 'dust', x: p.front - s.facing * random() * tail, y: p.y + (random() - .5) * 40, vx: -s.facing * 30, vy: 30, life: .5, maxLife: .5, size: 2 + random() * 2, color: '#3a2d58' });
      const tailX = p.front - s.facing * tail;
      if (s.facing > 0 ? tailX > W + 80 : tailX < -80) p.state = 'done';
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.passes.some(p => p.state !== 'done') ? 'sweeping' : 'clearing';
    if (s.t >= U.duration) { if (s.owner === 'enemy') enemyFlock = null; else flock = null; }
  }
  // NAJA Dune Serpent: a sand ripple leaves her palm, chases the rival and locks `telegraph` seconds before each strike, then a giant
  // sand cobra erupts there. Three strikes x 16 (48), no global hit-stop. Each ripple starts tracking when the previous
  // one locks. The column is too tall to jump; stepping out of the locked ripple dodges it.
  function startSerpent(actor = hero) {
    const U = N.serpent, target = actor === hero ? dummy : hero;
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, casterX: actor.x, hits: 0, phase: 'cutin',
      strikes: U.strikes.map((at, id) => ({ id, at, lockAt: at - U.telegraph, appearAt: id ? U.strikes[id - 1] - U.telegraph : U.follow,
        x: id ? target.x : clamp(actor.x + actor.facing * 90, 60, W - 60), state: 'waiting', lockedAt: 0, hit: false })) };
    if (actor === hero) serpent = group; else enemySerpent = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('naja', actor);
  }
  function updateSerpent(dt, s) {
    if (!s) return;
    const target = s.owner === 'enemy' ? hero : dummy, U = N.serpent;
    s.t += dt;
    for (const k of s.strikes) {
      if (k.state === 'waiting' && s.t >= k.appearAt) { k.state = 'tracking'; if (k.id) k.x = s.strikes[k.id - 1].x; }
      if (k.state === 'tracking') {
        k.x = clamp(approach(k.x, target.x, U.speed * dt), 60, W - 60);
        if (s.t >= k.lockAt) { k.state = 'locked'; k.lockedAt = time; sound('step'); }
      }
      if (k.state === 'locked' && s.t >= k.at) {
        k.state = 'erupting'; trauma = Math.min(1, trauma + .22); sound('heavy');
        spawnParticles(k.x, CONFIG.groundY - 12, '#e3bf78', 22, 300, 'dust'); spawnParticles(k.x, CONFIG.groundY - 60, '#f6dc9c', 12, 260);
        if (!k.hit && Math.abs(target.x - k.x) < U.radius && CONFIG.groundY - target.y < U.height) {
          k.hit = true;
          const last = k.id === s.strikes.length - 1;
          const connected = s.owner === 'enemy' ? window.__game.receiveHit(N.balance.biteDamage, { freeze: false, projectile: true, shake: .6 })
            : hitDummy(N.balance.biteDamage, last ? 190 : 60, '#ffd98a', s.casterX, target.y - 100, false, false, .6);
          if (connected) s.hits++;
        }
      }
      if (k.state === 'erupting' && s.t >= k.at + U.rise) k.state = 'done';
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.strikes.some(k => k.state !== 'done') ? 'striking' : 'clearing';
    if (s.t >= U.duration) { if (s.owner === 'enemy') enemySerpent = null; else serpent = null; }
  }
  // HALDOR Forge Quake: three hammer slams at the crater in front of him; each sends a molten shockwave along the
  // floor both ways (ground projectiles, 16 each, 48 total). HALDOR is free after the 0.5 s cast; a jump clears a wave.
  function startQuake(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, x: clamp(actor.x + actor.facing * 70, 60, W - 60), slams: 0, phase: 'cutin' };
    if (actor === hero) quake = group; else enemyQuake = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('haldor', actor);
  }
  function updateQuake(dt, s) {
    if (!s) return;
    const U = HD.quake;
    s.t += dt;
    while (s.slams < U.slams.length && s.t >= U.slams[s.slams]) {
      const last = s.slams === U.slams.length - 1; s.slams++;
      effects.push({ type: 'haldor-fx', asset: 'haldor-splash', x: s.x, y: CONFIG.groundY - 24, facing: s.facing, life: .35, maxLife: .35, size: 170 });
      spawnParticles(s.x, CONFIG.groundY - 10, '#ff8a2a', 20, 320); dust(s.x, 16); trauma = Math.min(1, trauma + .3); sound('heavy');
      for (const dir of [-1, 1]) projectiles.push({ x: s.x + dir * 30, y: CONFIG.groundY - 22, vx: dir * U.speed, life: 1.9, facing: dir, owner: s.owner, damage: HD.balance.quakeDamage, knockback: last ? 190 : 60, asset: 'haldor-quake', size: 124, color: '#ffb35c' });
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.slams < U.slams.length ? 'slamming' : 'rolling';
    if (s.t >= U.duration) { if (s.owner === 'enemy') enemyQuake = null; else quake = null; }
  }
  // ZANNI Grand Finale: three giant bladed rings flung forward from his hand 0.38 s apart; each flies to the arena edge
  // and boomerangs back to ZANNI (boomerang projectiles, one 16-damage hit per ring, 48 total). ZANNI is free after the
  // 0.5 s cast; a rival behind him at the throw is safe, a jump clears a ring on the way out.
  function startFinale(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, throws: 0, phase: 'cutin' };
    if (actor === hero) finale = group; else enemyFinale = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('zanni', actor);
  }
  function updateFinale(dt, s) {
    if (!s) return;
    const U = Z.finale, a = s.owner === 'enemy' ? dummy : hero, em = window.ZANNI_METRICS?.emitters?.ultimate;
    s.t += dt;
    while (s.throws < U.throws.length && s.t >= U.throws[s.throws]) {
      const last = s.throws === U.throws.length - 1; s.throws++;
      const x = a.x + s.facing * (em?.x ?? 90), y = clamp(a.y + (em?.y ?? -95), a.y - 130, a.y - 70);
      projectiles.push({ x, y, vx: s.facing * U.speed, life: 4, facing: s.facing, owner: s.owner, damage: Z.balance.finaleDamage, knockback: last ? 190 : 50, asset: 'zanni-bigring', size: U.size, color: '#e4f36a',
        boomerang: true, range: Math.max(120, s.facing > 0 ? W - 60 - x : x - 60), travel: 0, spin: 16, freeze: false });
      effects.push({ type: 'zanni-fx', asset: 'zanni-confetti', x: x + s.facing * 20, y, facing: s.facing, life: .35, maxLife: .35, size: 170 });
      spawnParticles(x, y, '#e4f36a', 14, 260); sound('cast');
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.throws < U.throws.length ? 'throwing' : 'returning';
    if (s.t >= U.duration && !projectiles.some(p => p.asset === 'zanni-bigring' && p.owner === s.owner)) { if (s.owner === 'enemy') enemyFinale = null; else finale = null; }
  }
  // ISOLDE Skyfall Lances: three giant ice lances dive from the sky 0.38 s apart, each aimed at the rival's feet when it
  // is called (16 each, 48 total), with a small shatter where it lands. ISOLDE is free after the 0.5 s cast; a standing
  // rival takes all three, a moving one makes them land behind.
  function startSkyfall(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, calls: 0, phase: 'cutin' };
    if (actor === hero) skyfall = group; else enemySkyfall = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('isolde', actor);
  }
  function updateSkyfall(dt, s) {
    if (!s) return;
    const U = IS.skyfall, target = s.owner === 'enemy' ? hero : dummy;
    s.t += dt;
    while (s.calls < U.calls.length && s.t >= U.calls[s.calls]) {
      const last = s.calls === U.calls.length - 1; s.calls++;
      const tx = clamp(target.x, 40, W - 40), land = CONFIG.groundY - 40, x = tx - s.facing * U.back, y = land - U.height;
      projectiles.push({ x, y, vx: s.facing * U.back / U.flight, vy: U.height / U.flight, life: U.flight + .3, facing: s.facing, owner: s.owner, damage: IS.balance.lanceDamage, knockback: last ? 190 : 50,
        asset: 'isolde-skyfall', size: U.size, color: '#bfe6ff', landY: land, shatter: U.shatter, freeze: false });
      spawnParticles(x, y + 40, '#dff3ff', 8, 160);
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.calls < U.calls.length ? 'calling' : 'falling';
    if (s.t >= U.duration && !projectiles.some(p => p.asset === 'isolde-skyfall' && p.owner === s.owner)) { if (s.owner === 'enemy') enemySkyfall = null; else skyfall = null; }
  }
  // Where a Skyfall lance lands: an ice shatter that still catches a rival within `shatter` px.
  function lanceShatter(p) {
    effects.push({ type: 'isolde-fx', asset: 'isolde-shatter', x: p.x, y: CONFIG.groundY - 40, facing: p.facing, life: .4, maxLife: .4, size: 190 });
    spawnParticles(p.x, CONFIG.groundY - 20, '#dff3ff', 18, 280); dust(p.x, 14); sound('heavy'); trauma = Math.min(1, trauma + .18);
    if (p.owner === 'enemy') { if (Math.abs(hero.x - p.x) < p.shatter && hero.y > CONFIG.groundY - 70) window.__game.receiveHit(p.damage, { projectile: true, freeze: false }); }
    else if (Math.abs(dummy.x - p.x) < p.shatter && dummy.y > CONFIG.groundY - 70) hitDummy(p.damage, p.knockback, p.color, p.x - p.facing * 20, CONFIG.groundY - 60, false, false);
  }
  // RHEA Grand Orrery: three giant planets released 0.38 s apart, each making one lap around RHEA (orbit projectiles,
  // one 16-damage hit each, 48 total). RHEA is free after the 0.5 s cast; the planets follow her, and a rival beyond
  // the orbit is safe.
  function startOrrery(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, released: 0, phase: 'cutin' };
    if (actor === hero) orrery = group; else enemyOrrery = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('rhea', actor);
  }
  function updateOrrery(dt, s) {
    if (!s) return;
    const U = RH.orrery, a = s.owner === 'enemy' ? dummy : hero;
    s.t += dt;
    while (s.released < U.releases.length && s.t >= U.releases[s.released]) {
      const last = s.released === U.releases.length - 1; s.released++;
      projectiles.push({ x: a.x + s.facing * U.rx, y: a.y - 90, vx: 0, life: U.lap + .2, facing: s.facing, owner: s.owner, damage: RH.balance.planetDamage, knockback: last ? 190 : 40,
        asset: 'rhea-planet', size: U.size, color: '#f2c77a', orbit: true, angle: 0, lap: U.lap, rx: U.rx, ry: U.ry, spin: 2, freeze: false });
      effects.push({ type: 'rhea-fx', asset: 'rhea-burst', x: a.x + s.facing * U.rx, y: a.y - 90, facing: s.facing, life: .3, maxLife: .3, size: 150 });
      spawnParticles(a.x, a.y - 90, '#f2c77a', 12, 220); sound('cast');
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.released < U.releases.length ? 'releasing' : 'orbiting';
    if (s.t >= U.duration && !projectiles.some(p => p.asset === 'rhea-planet' && p.owner === s.owner)) { if (s.owner === 'enemy') enemyOrrery = null; else orrery = null; }
  }
  // RHEA Gravity Well collapsing: everything within its radius on the floor takes the hit.
  function wellBurst(p) {
    effects.push({ type: 'rhea-fx', asset: 'rhea-burst', x: p.x, y: p.y, facing: p.facing, life: .35, maxLife: .35, size: 200 });
    spawnParticles(p.x, p.y, '#e8b0c0', 18, 260); sound('heavy'); trauma = Math.min(1, trauma + .15);
    if (p.owner === 'enemy') { if (Math.abs(hero.x - p.x) < p.radius && hero.y > CONFIG.groundY - 150) window.__game.receiveHit(p.damage); }
    else if (Math.abs(dummy.x - p.x) < p.radius && dummy.y > CONFIG.groundY - 150) hitDummy(p.damage, p.knockback, p.color, p.x, p.y, false, true);
  }
  // SOLAN Sunmane Roar: three roars 0.38 s apart from wherever SOLAN stands; each sends a tall sound wave both ways
  // along the floor (ground projectiles with `tall`, so a jump does not clear them), 16 each, 48 total, fading after
  // SO.roar.range px. SOLAN is free after the 0.5 s cast; a rival farther away than the range is safe.
  function startSunroar(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, roars: 0, phase: 'cutin' };
    if (actor === hero) sunroar = group; else enemySunroar = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('solan', actor);
  }
  function updateSunroar(dt, s) {
    if (!s) return;
    const U = SO.roar, a = s.owner === 'enemy' ? dummy : hero;
    s.t += dt;
    while (s.roars < U.roars.length && s.t >= U.roars[s.roars]) {
      const last = s.roars === U.roars.length - 1; s.roars++;
      effects.push({ type: 'solan-fx', asset: 'solan-sunburst', x: a.x, y: a.y - 110, facing: s.facing, life: .3, maxLife: .3, size: 160 });
      spawnParticles(a.x, a.y - 95, '#ffd36a', 16, 260); trauma = Math.min(1, trauma + .25); sound('heavy');
      for (const dir of [-1, 1]) projectiles.push({ x: a.x + dir * 40, y: CONFIG.groundY - 110, vx: dir * U.speed, life: U.range / U.speed, facing: dir, owner: s.owner, damage: SO.balance.roarDamage, knockback: last ? 190 : 50,
        asset: 'solan-roar', size: U.size, color: '#ffd36a', tall: U.tall, freeze: false });
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.roars < U.roars.length ? 'roaring' : 'fading';
    if (s.t >= U.duration && !projectiles.some(p => p.asset === 'solan-roar' && p.owner === s.owner)) { if (s.owner === 'enemy') enemySunroar = null; else sunroar = null; }
  }
  // NIB Special Delivery: three paper-plane parcels leave the satchel 0.38 s apart and home in on the rival (homing
  // projectiles with a limited turn rate, 16 each, 48 total). NIB is free after the 0.5 s cast; a late sidestep or a
  // jump makes a plane overshoot.
  function startDelivery(actor = hero) {
    const group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, released: 0, phase: 'cutin' };
    if (actor === hero) delivery = group; else enemyDelivery = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('nib', actor);
  }
  function updateDelivery(dt, s) {
    if (!s) return;
    const U = NB.delivery, a = s.owner === 'enemy' ? dummy : hero;
    s.t += dt;
    while (s.released < U.releases.length && s.t >= U.releases[s.released]) {
      const last = s.released === U.releases.length - 1; s.released++;
      const x = a.x + s.facing * 30, y = a.y - 110;
      projectiles.push({ x, y, vx: s.facing * U.speed * .6, vy: -U.speed * .8, life: U.life, facing: s.facing, owner: s.owner, damage: NB.balance.planeDamage, knockback: last ? 180 : 40,
        asset: 'nib-plane', size: U.size, color: '#8fd4ff', homing: true, speedH: U.speed, turn: U.turn, freeze: false });
      effects.push({ type: 'nib-fx', asset: 'nib-stamp', x, y, facing: s.facing, life: .3, maxLife: .3, size: 130 });
      spawnParticles(x, y, '#f4efe2', 10, 200); sound('cast');
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.released < U.releases.length ? 'releasing' : 'flying';
    if (s.t >= U.duration && !projectiles.some(p => p.asset === 'nib-plane' && p.owner === s.owner)) { if (s.owner === 'enemy') enemyDelivery = null; else delivery = null; }
  }
  // EDDA Elder Tortoise: a giant jade tortoise spirit rises in front of EDDA, lumbers forward and stomps three times
  // 0.38 s apart (16 each, 48). A stomp only hits a rival on the floor within ED.tortoise.half px of the spirit.
  function startTortoise(actor = hero) {
    const U = ED.tortoise, group = { t: 0, owner: actor === hero ? 'player' : 'enemy', facing: actor.facing, x: clamp(actor.x + actor.facing * U.ahead, 60, W - 60), stomped: 0, phase: 'cutin', spirit: null };
    if (actor === hero) tortoise = group; else enemyTortoise = group;
    cinematic = .9; announceTimer = 0;
    startUltimateVoice('edda', actor);
  }
  function updateTortoise(dt, s) {
    if (!s) return;
    const U = ED.tortoise; s.t += dt;
    if (!s.spirit && s.t >= U.appear) {
      s.spirit = { type: 'edda-spirit', asset: 'edda-tortoise', x: s.x, y: CONFIG.groundY + 8, facing: s.facing, life: U.duration - U.appear, maxLife: U.duration - U.appear, size: U.size, lift: 0 };
      effects.push(s.spirit); spawnParticles(s.x, CONFIG.groundY - 20, '#8fe3b4', 24, 260); sound('cast');
    }
    if (s.spirit) {
      s.x = clamp(s.x + s.facing * U.speed * dt, 60, W - 60); s.spirit.x = s.x;
      s.spirit.lift = U.stomps.reduce((m, ts) => Math.max(m, 34 * Math.max(0, 1 - Math.abs(s.t - (ts - .16)) / .16)), 0);
    }
    while (s.stomped < U.stomps.length && s.t >= U.stomps[s.stomped]) {
      const last = s.stomped === U.stomps.length - 1, target = s.owner === 'enemy' ? hero : dummy; s.stomped++;
      effects.push({ type: 'edda-fx', asset: 'edda-stomp', x: s.x + s.facing * 50, y: CONFIG.groundY - 30, facing: s.facing, life: .35, maxLife: .35, size: 220 });
      spawnParticles(s.x + s.facing * 50, CONFIG.groundY - 8, '#d8c089', 22, 320); sound('heavy'); trauma = Math.min(1, trauma + .22);
      if (Math.abs(target.x - s.x) < U.half && target.y > CONFIG.groundY - 40) {
        if (s.owner === 'enemy') window.__game.receiveHit(ED.balance.stompDamage, { freeze: false });
        else hitDummy(ED.balance.stompDamage, last ? 200 : 40, '#8fe3b4', s.x, CONFIG.groundY - 60, false, false);
      }
    }
    s.phase = s.t < U.cutinDuration ? 'cutin' : s.stomped < U.stomps.length ? 'stomping' : 'fading';
    if (s.t >= U.duration) { if (s.owner === 'enemy') enemyTortoise = null; else tortoise = null; }
  }
  // EDDA Shell Counter: the first hit inside the guard window is ignored (EDDA ducks into her shell) and an attacker
  // within ED.counter.reach px is answered with a staff counter. A shot from further away is simply blocked.
  function shellGuard(actor) {
    const a = actor.action; if (!a?.guard || a.countered || a.t >= a.guardEnd) return false;
    a.countered = true; if (a.t < .34) { a.t = .34; actor.stateTime = .34; }
    const target = actor === hero ? dummy : hero, em = window.EDDA_METRICS?.emitters?.skill2, dx = target.x - actor.x;
    effects.push({ type: 'edda-fx', asset: 'edda-shell', x: actor.x, y: actor.y - 80, facing: actor.facing, life: .35, maxLife: .35, size: 170 });
    spawnParticles(actor.x, actor.y - 80, '#e8d9a8', 14, 240); sound('heavy');
    if (Math.abs(dx) < ED.counter.reach && Math.abs(target.y - actor.y) < 115) {
      actor.facing = Math.sign(dx) || actor.facing;
      const hy = actor.y + (em?.y ?? -90);
      effects.push({ type: 'whip', x: actor.x, y: hy, facing: actor.facing, tip: em?.x ?? 130, life: .16, maxLife: .16, index: 3, color: '#ffe9a8' });
      if (actor === hero) hitDummy(ED.counter.damage, ED.counter.knockback, '#ffe9a8', actor.x, hy, false, true); else window.__game.receiveHit(ED.counter.damage);
    }
    return true;
  }
  function droneMuzzle(d, facing) {
    const muzzle = window.DRONE_ASSET?.muzzle || { x: 51, y: 0 };
    const c = Math.cos(d.angle), s = Math.sin(d.angle), x = facing * muzzle.x, y = muzzle.y;
    return { x: d.x + x * c - y * s, y: d.y + x * s + y * c };
  }
  function step(dt) {
    systemAnnouncer?.tick(dt);
    if (menuOpen || paused || settingsOpen) return;
    if(match?.mode==='versus'&&match.phase!=='fight') {
      // Shake is driven by realTime, so trauma must keep decaying here or the K.O./intro screen vibrates.
      realTime+=dt;trauma=Math.max(0,trauma-dt*1.35);cinematic=Math.max(0,cinematic-dt);hero.animTime+=dt;dummy.stateTime+=dt;updateVisuals(dt);
      if(hero.y<CONFIG.groundY){hero.vy+=CONFIG.gravity*dt;hero.y=Math.min(CONFIG.groundY,hero.y+hero.vy*dt);}
      if(dummy.state==='down'&&dummy.y<CONFIG.groundY){dummy.vy+=CONFIG.gravity*dt;dummy.y=Math.min(CONFIG.groundY,dummy.y+dummy.vy*dt);}
      advanceMatch(dt);return;
    }
    realTime += dt; stepCount++; announceTimer = Math.max(0, announceTimer - dt); trauma = Math.max(0, trauma - dt * 1.35); cinematic = Math.max(0, cinematic - dt);
    updateVisuals(dt);
    for(const name of Object.keys(rechargePulse)) rechargePulse[name]=Math.max(0,rechargePulse[name]-dt);
    if (hitstop > 0) { hitstop -= dt; return; }
    time += dt; hero.animTime += dt; hero.invuln = Math.max(0, hero.invuln - dt); hero.doublePose = Math.max(0, (hero.doublePose || 0) - dt);
    if(fenrCutin) {fenrCutin.t+=dt;if(fenrCutin.t>.78)fenrCutin=null;}
    if(F&&selectedCharacter==='fenr'){const changes=hero.formChanges;F.advance(hero,dt,hero.hp>0);if(changes!==hero.formChanges){syncPlayerForm();hero.doublePose=0;state(hero.grounded?'idle':'jump');}}
    hero.airTime = hero.grounded ? 0 : hero.airTime + dt;
    for (const name of Object.keys(hero.cooldowns)) hero.cooldowns[name] = Math.max(0, hero.cooldowns[name] - dt);
    if (hero.doublePose <= 0 && hero.rollBuffer && hero.hurtTime <= 0) { const buffered = hero.rollBuffer; hero.rollBuffer = null; if (buffered === 'attack') startAttack(); else cast(buffered); }
    comboTimer = Math.max(0, comboTimer - dt); if (!comboTimer) comboHits = comboDamage = 0;
    const dir = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0), crouching = keys.has('s') && hero.grounded && !hero.action;
    if (!hero.action && hero.hurtTime <= 0 && hero.hp > 0) {
      if (dir && hero.doublePose <= 0) hero.facing = dir;
      if (hero.runDirection && dir !== hero.runDirection) hero.runDirection = 0;
      const speed = (hero.runDirection === dir && dir ? CONFIG.runSpeed : CONFIG.walkSpeed)*(selectedCharacter==='fenr'&&hero.form==='wolf'?1.08:1);
      hero.vx = approach(hero.vx, crouching ? 0 : dir * speed, dt * (hero.grounded ? 2800 : 1600));
      if (hero.grounded) state(crouching ? 'crouch' : dir ? hero.runDirection ? 'run' : 'walk' : 'idle');
      else state(hero.doublePose > 0 ? 'doublejump' : 'jump');
    } else hero.vx = approach(hero.vx, 0, dt * 1900);
    if (hero.hurtTime > 0) { hero.hurtTime -= dt; state('hurt'); if (hero.hurtTime <= 0) hero.invuln = .9; }
    if(hero.hp<=0) { hero.koTime=Math.max(0,hero.koTime-dt); state('down'); if(!hero.koTime&&match?.mode!=='versus') {hero.hp=BALANCE.heroMax;hero.invuln=.9;state(hero.grounded?'idle':'jump');} }
    if (hero.action) {
      const a = hero.action; a.t += dt; state(a.name);
      if((selectedCharacter==='fenr'||selectedCharacter==='mira'||selectedCharacter==='haldor'||selectedCharacter==='isolde'||selectedCharacter==='solan'||selectedCharacter==='nib')&&a.dash&&a.t>a.duration*.2&&a.t<a.duration*.6)hero.vx=hero.facing*a.dash;
      if (a.type !== 'ultimate' && !a.fired && a.t >= a.duration * (a.hitAt || (a.type === 'skill2' ? .53 : .5))) { a.fired = true; if (a.type === 'attack') meleeHit(a.index); else fireSkill(a); }
      if (a.fired && a.cancelInto && hero.action === a) { const into = a.cancelInto; hero.action = null; state(hero.grounded ? 'idle' : 'jump'); if (into === 'jump') jump(); }
      if (a.t >= a.duration || (a.type === 'skill1' && a.fired)) { const queued = a.queued && a.index < 3, remaining = Math.max(0, a.queued - 1); const next = (a.index || 0) + 1; hero.action = null; if (queued) { startAttack(next); hero.action.queued = remaining; } else state(hero.grounded ? 'idle' : 'jump'); }
    }
    const oldHeroX = hero.x;
    hero.x = clamp(hero.x + hero.vx * dt, 70, W - 70);
    const gap = bodyGap();
    if (dummy.state !== 'down' && dummy.state !== 'recover' && hero.y > CONFIG.groundY - 130 && dummy.y > CONFIG.groundY - 130 && Math.abs(hero.x - dummy.x) < gap) { hero.x = clamp(dummy.x + (oldHeroX <= dummy.x ? -gap : gap), 70, W - 70); hero.vx = 0; }
    const travelled=Math.abs(hero.x-oldHeroX);
    if(hero.grounded && hero.state==='run' && travelled>0) {
      hero.smokeDistance+=travelled;
      while(hero.smokeDistance>=30) { hero.smokeDistance-=30; runSmoke(hero.x,hero.facing); }
    } else hero.smokeDistance=0;
    if (!hero.grounded) { if (keys.has('s') && hero.vy > 0 && hero.doublePose <= 0) hero.vy = Math.max(hero.vy, CONFIG.fastFall); hero.vy += CONFIG.gravity * dt; hero.y += hero.vy * dt; if (hero.y >= CONFIG.groundY) { hero.y = CONFIG.groundY; hero.vy = 0; hero.grounded = true; hero.jumps = 0; hero.doublePose = 0; hero.airTime = 0; dust(hero.x, 11); sound('step'); } }
    const stride = metrics?.states?.[hero.state]?.stride_estimate || manifest?.metrics?.[hero.state === 'run' ? 'runStride' : 'walkStride'] || manifest?.locomotion?.[hero.state]?.stride_px || (hero.state === 'run' ? 184 : 148);
    hero.walkPhase += Math.abs(hero.vx) * dt / stride;
    updateDummy(dt); updateProjectiles(dt); updateSquadron(dt); updateSquadron(dt,enemySquad); updateParade(dt,parade); updateParade(dt,enemyParade); updateMurmuration(dt,flock); updateMurmuration(dt,enemyFlock); updateSerpent(dt,serpent); updateSerpent(dt,enemySerpent); updateQuake(dt,quake); updateFinale(dt,finale); updateFinale(dt,enemyFinale); updateSkyfall(dt,skyfall); updateSkyfall(dt,enemySkyfall); updateOrrery(dt,orrery); updateOrrery(dt,enemyOrrery); updateSunroar(dt,sunroar); updateSunroar(dt,enemySunroar); updateDelivery(dt,delivery); updateDelivery(dt,enemyDelivery); updateTortoise(dt,tortoise); updateTortoise(dt,enemyTortoise); updateQuake(dt,enemyQuake);
    if (voiceActive && (voiceKind === 'mira' || voiceKind === 'cora' || voiceKind === 'naja' || voiceKind === 'haldor' || voiceKind === 'zanni' || voiceKind === 'isolde' || voiceKind === 'rhea' || voiceKind === 'solan' || voiceKind === 'nib' || voiceKind === 'edda')) voiceClock += dt;
    if (voiceActive && voiceKind !== 'arco' && (!voiceRelevant() || (Number.isFinite(ultimateVoice.duration) && voiceElapsed() >= ultimateVoice.duration))) stopUltimateVoice();
    advanceMatch(dt);
  }
  // MIRA's robot and HALDOR's exoframe are much wider than the other fighters; keep bodies from sinking into them.
  function bodyGap() { return selectedCharacter === 'mira' || opponentCharacter === 'mira' ? 66 : selectedCharacter === 'haldor' || opponentCharacter === 'haldor' ? 62 : 54; }
  function currentDummyHP() {return Math.max(0,BALANCE.dummyMax-dummy.damage);}
  function hpLayers(value) {return {front:clamp(value-BALANCE.hpPerBar,0,BALANCE.hpPerBar),reserve:clamp(value,0,BALANCE.hpPerBar)};}
  function updateDummy(dt) {
    if(F){for(const name of Object.keys(dummy.cooldowns))dummy.cooldowns[name]=Math.max(0,dummy.cooldowns[name]-dt);if(opponentCharacter==='fenr')F.advance(dummy,dt,!dummy.ko);}
    dummy.stateTime += dt; dummy.flash = Math.max(0, dummy.flash - dt); dummy.invuln = Math.max(0, dummy.invuln - dt);
    dummy.x = clamp(dummy.x + dummy.vx * dt, 110, W - 100); if(!F || !aiEnabled || dummy.action || ['hurt','down','recover'].includes(dummy.state))dummy.vx = approach(dummy.vx, 0, dt * 950);
    if(F && !['down','recover'].includes(dummy.state) && hero.y>CONFIG.groundY-130 && dummy.y>CONFIG.groundY-130 && Math.abs(dummy.x-hero.x)<bodyGap())dummy.x=clamp(hero.x+(dummy.x>=hero.x?bodyGap():-bodyGap()),110,W-100);
    // Versus CPU follows the player's post-hurt immunity rule by difficulty, so a mashed chain cannot loop it forever.
    // Its stun lasts 0.5 s there, which still covers every 3-hit chain gap; the training dummy stays open for practice.
    if (dummy.state === 'hurt' && dummy.stateTime > (F && aiEnabled && match?.mode === 'versus' ? .5 : .4)) { dummy.state = dummy.y < CONFIG.groundY ? 'jump' : 'idle'; dummy.stateTime = 0; if (F && aiEnabled && match?.mode === 'versus') dummy.invuln = Math.max(dummy.invuln, cpuProfile().immunity); }
    if (dummy.state !== 'down' && (dummy.y < CONFIG.groundY || dummy.vy < 0)) { dummy.vy += CONFIG.gravity * dt; dummy.y += dummy.vy * dt; if (dummy.y >= CONFIG.groundY) { dummy.y = CONFIG.groundY; dummy.vy = 0; dummy.jumps = 0; cpu.doubleAt = 0; if (dummy.state === 'jump') { dummy.state = 'idle'; dummy.stateTime = 0; } dust(dummy.x, 8); } }
    if (dummy.state === 'down') { if (dummy.y < CONFIG.groundY || dummy.vy < 0) { dummy.vy += CONFIG.gravity * dt; dummy.y += dummy.vy * dt; if (dummy.y >= CONFIG.groundY) { dummy.y = CONFIG.groundY; dummy.vy = 0; dust(dummy.x, 24); trauma = Math.min(1, trauma + .3); } } if (dummy.stateTime > 1.7 && match?.mode!=='versus') { dummy.state = 'recover'; dummy.stateTime = 0; } }
    if (dummy.state === 'recover' && dummy.stateTime > .4) { dummy.state = 'idle'; dummy.stateTime = 0; if(dummy.ko) dummy.damage = 0; dummy.ko=false; dummy.invuln = .5; }
    if(F)updateFenrAI(dt);
  }
  // HALDOR Slag Shot landing: a small molten splash on the floor where the lob comes down.
  function slagSplash(p) {
    effects.push({ type: 'haldor-fx', asset: 'haldor-splash', x: p.x, y: CONFIG.groundY - 26, facing: p.facing, life: .4, maxLife: .4, size: 150 });
    spawnParticles(p.x, CONFIG.groundY - 12, '#ff9a3c', 16, 260); sound('heavy'); trauma = Math.min(1, trauma + .12);
    if (p.owner === 'enemy') { if (Math.abs(hero.x - p.x) < p.splash && hero.y > CONFIG.groundY - 60) window.__game.receiveHit(p.damage, { projectile: true }); }
    else if (Math.abs(dummy.x - p.x) < p.splash && dummy.y > CONFIG.groundY - 60) hitDummy(p.damage, p.knockback, p.color, p.x - p.facing * 20, CONFIG.groundY - 45, false, false);
  }
  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) { const p = projectiles[i], oldX = p.x;
      // NIB paper planes steer toward the rival's chest, turning at most p.turn rad/s.
      if (p.homing) { const t = p.owner === 'enemy' ? hero : dummy, want = Math.atan2(t.y - 85 - p.y, t.x - p.x), cur = Math.atan2(p.vy, p.vx); let d = want - cur; d = Math.atan2(Math.sin(d), Math.cos(d)); const ang = cur + clamp(d, -p.turn * dt, p.turn * dt); p.vx = Math.cos(ang) * p.speedH; p.vy = Math.sin(ang) * p.speedH; p.facing = p.vx >= 0 ? 1 : -1; }
      // EDDA Stone Skip: the stone falls under its own gravity and hops off the floor p.bounces more times, then sinks.
      if (p.skip) { p.vy += p.skipG * dt; if (p.vy > 0 && p.y + p.vy * dt >= CONFIG.groundY - 14) { effects.push({ type: 'edda-fx', asset: 'edda-ripple', x: p.x, y: CONFIG.groundY - 14, facing: p.facing, life: .3, maxLife: .3, size: 110 }); if (p.bounces-- > 0) { p.y = CONFIG.groundY - 14; p.vy = -p.hop; sound('step'); } else { projectiles.splice(i, 1); continue; } } }
      if (p.gravity) p.vy += p.gravity * dt; p.x += p.vx * dt; p.y += (p.vy || 0) * dt; p.life -= dt;
      if (p.gravity && p.y >= CONFIG.groundY - 8) { slagSplash(p); projectiles.splice(i, 1); continue; }
      if (p.landY && p.y >= p.landY) { lanceShatter(p); projectiles.splice(i, 1); continue; }
      // RHEA: a Gravity Well waits in place and collapses; an Orrery planet laps around its owner.
      if (p.inert) { if (p.life <= 0) { wellBurst(p); projectiles.splice(i, 1); } continue; }
      if (p.orbit) {
        const home = p.owner === 'enemy' ? dummy : hero; p.angle += Math.PI * 2 * dt / p.lap;
        if (p.angle >= Math.PI * 2) { projectiles.splice(i, 1); continue; }
        p.x = home.x + p.facing * p.rx * Math.cos(p.angle); p.y = home.y - 90 + p.ry * Math.sin(p.angle);
      }
      // ZANNI rings fly out `range` px, then home back to the thrower and vanish in his hand. One hit per ring (`spent`).
      if (p.boomerang) {
        p.travel += Math.abs(p.x - oldX);
        if (!p.returning && p.travel >= p.range) p.returning = true;
        if (p.returning) { const home = p.owner === 'enemy' ? dummy : hero; p.vx = Math.sign(home.x - p.x || 1) * Math.abs(p.vx); p.facing = Math.sign(p.vx); p.y += (clamp(home.y - 95, home.y - 130, home.y - 60) - p.y) * Math.min(1, dt * 6); if (Math.abs(home.x - p.x) < 34 && p.travel > 80) { projectiles.splice(i, 1); continue; } }
      }
      if (p.spent) { if (p.life <= 0) projectiles.splice(i, 1); continue; }
      if(p.owner==='enemy') {
        if(Math.min(oldX,p.x)<=hero.x+28&&Math.max(oldX,p.x)>=hero.x-28&&Math.abs(p.y-(hero.y-85))<(p.tall||75)&&window.__game.receiveHit(p.damage,{projectile:true,freeze:p.freeze}))p.boomerang?(p.spent=true,p.returning=true):p.orbit?(p.spent=true):p.life=0;
        if(p.life<=0||p.x<-100||p.x>W+100)projectiles.splice(i,1);continue;
      }
      // Swept x interval keeps a high-speed bolt from tunneling through a target.
      if (Math.min(oldX, p.x) <= dummy.x + 30 && Math.max(oldX, p.x) >= dummy.x - 30 && Math.abs(p.y - (dummy.y - (F?95:68))) < (p.tall || (F?90:66)) && dummy.state !== 'down' && dummy.state !== 'recover') { if (hitDummy(p.damage||BALANCE.skill1.damage, p.knockback ?? BALANCE.skill1.knockback, p.color || '#94ffde', oldX, p.y, false, false)) { if (p.boomerang) { p.spent = true; p.returning = true; } else if (p.orbit) p.spent = true; else p.life = 0; } }
      if (p.life <= 0 || p.x < -100 || p.x > W + 100) projectiles.splice(i, 1);
    }
  }
  function syncPlayerForm() {
    if(selectedCharacter==='fenr') {const wolf=hero.form==='wolf';manifest=wolf?window.FENR_WOLF_MANIFEST:window.FENR_HUMAN_MANIFEST;metrics=wolf?window.FENR_WOLF_METRICS:window.FENR_HUMAN_METRICS;images.hero=images[wolf?'fenrWolf':'fenrHuman'];Object.assign(cooldownMax,F.balance.cooldowns);}
    else if(selectedCharacter==='mira') {manifest=window.MIRA_MANIFEST;metrics=window.MIRA_METRICS;images.hero=images.mira;Object.assign(cooldownMax,M.balance.cooldowns);}
    else if(selectedCharacter==='cora') {manifest=window.CORA_MANIFEST;metrics=window.CORA_METRICS;images.hero=images.cora;Object.assign(cooldownMax,C.balance.cooldowns);}
    else if(selectedCharacter==='naja') {manifest=window.NAJA_MANIFEST;metrics=window.NAJA_METRICS;images.hero=images.naja;Object.assign(cooldownMax,N.balance.cooldowns);}
    else if(selectedCharacter==='haldor') {manifest=window.HALDOR_MANIFEST;metrics=window.HALDOR_METRICS;images.hero=images.haldor;Object.assign(cooldownMax,HD.balance.cooldowns);}
    else if(selectedCharacter==='edda') {manifest=window.EDDA_MANIFEST;metrics=window.EDDA_METRICS;images.hero=images.edda;Object.assign(cooldownMax,ED.balance.cooldowns);}
    else if(selectedCharacter==='nib') {manifest=window.NIB_MANIFEST;metrics=window.NIB_METRICS;images.hero=images.nib;Object.assign(cooldownMax,NB.balance.cooldowns);}
    else if(selectedCharacter==='solan') {manifest=window.SOLAN_MANIFEST;metrics=window.SOLAN_METRICS;images.hero=images.solan;Object.assign(cooldownMax,SO.balance.cooldowns);}
    else if(selectedCharacter==='rhea') {manifest=window.RHEA_MANIFEST;metrics=window.RHEA_METRICS;images.hero=images.rhea;Object.assign(cooldownMax,RH.balance.cooldowns);}
    else if(selectedCharacter==='isolde') {manifest=window.ISOLDE_MANIFEST;metrics=window.ISOLDE_METRICS;images.hero=images.isolde;Object.assign(cooldownMax,IS.balance.cooldowns);}
    else if(selectedCharacter==='zanni') {manifest=window.ZANNI_MANIFEST;metrics=window.ZANNI_METRICS;images.hero=images.zanni;Object.assign(cooldownMax,Z.balance.cooldowns);}
    else {manifest=window.MECHA_MANIFEST||window.SPRITE_MANIFEST;metrics=window.MECHA_METRICS;images.hero=images.arco||images.hero;Object.assign(cooldownMax,{skill1:3,skill2:6,ultimate:18});}
    hudIdentity='';
  }
  function selectCharacter(id) {
    if(!ready || match?.mode==='versus' || !playable().includes(id) || (id==='fenr'&&!window.FENR_HUMAN_MANIFEST))return false;
    selectedCharacter=id;reset();syncPlayerForm();warmCutins();$('#character-select').value=id;updateHud();return true;
  }
  function showFenrTransformation(actor) {
    fenrCutin={t:0,owner:actor===hero?'PLAYER':'RIVAL'};cinematic=.65;
    startUltimateVoice('fenr', actor);
    effects.push({type:'fenr-fx',asset:'transform',x:actor.x,y:actor.y-95,facing:actor.facing,life:.8,maxLife:.8,size:230});
  }
  function fenrStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,actorMetrics=actor.form==='wolf'?window.FENR_WOLF_METRICS:window.FENR_HUMAN_METRICS,origin=actorMetrics?.emitters?.[move.name],fy=actor.y+(origin?.y??-(actor.form==='wolf'?120:105));
    effects.push({type:'fenr-fx',asset:move.fx,x:move.area?actor.x:actor.x+actor.facing*65,y:fy,facing:actor.facing,life:.32,maxLife:.32,size:move.area?move.reach*2:130});
    if(move.projectile){projectiles.push({x:actor.x+actor.facing*(origin?.x??62),y:fy,vx:actor.facing*720,life:1.15,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,asset:'gale'});sound('cast');return;}
    const dx=(target.x-actor.x)*actor.facing,near=move.area?Math.abs(dx)<move.reach:dx>-22&&dx<move.reach+27;
    if(!near||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,'#ffe6ba',actor.x,fy,false,move.type==='attack');
    if(connected && move.type==='attack') {F.refund(actor);if(!enemy)for(const n of Object.keys(rechargePulse))rechargePulse[n]=.22;}
    if(connected)sound('hit');
  }
  function miraStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.MIRA_METRICS?.emitters?.[move.name];
    const ox=actor.x+actor.facing*(em?.x??100),oy=actor.y+(em?.y??-125);
    if(move.projectile){
      projectiles.push({x:ox,y:oy,vx:actor.facing*move.speed,life:1.3,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,asset:'mira-star',color:'#ffe27a'});
      effects.push({type:'muzzle',x:ox,y:oy,life:.2,maxLife:.2,color:'#fff1a8'});spawnParticles(ox,oy,'#ffe27a',10,140);sound('cast');return;
    }
    if(move.type==='attack')effects.push({type:'slash',x:actor.x+actor.facing*62,y:oy+5,life:.22,maxLife:.22,facing:actor.facing,index:move.index,color:move.index===3?'#ffe27a':'#f0d2ff'});
    else effects.push({type:'mira-fx',asset:'mira-crash',x:ox,y:oy,facing:actor.facing,life:.3,maxLife:.3,size:150});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,'#ffd6f5',actor.x,oy,false,move.type==='attack');
    if(connected&&move.type==='attack') {
      if(enemy)M.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'?'heavy':'hit');
  }
  function coraStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.CORA_METRICS?.emitters?.[move.name];
    const ox=actor.x+actor.facing*(em?.x??95),oy=actor.y+(em?.y??-140),hy=clamp(oy,actor.y-165,actor.y-60);
    if(move.projectile){
      // The straight feather flies a little faster, so the fan lands as a quick three-hit burst instead of one stacked hit.
      move.feathers.forEach((damage,i)=>{const angle=(i-1)*move.spread,speed=move.speed*(1-Math.abs(i-1)*.06);projectiles.push({x:ox,y:oy,vx:actor.facing*speed*Math.cos(angle),vy:speed*Math.sin(angle),life:1,facing:actor.facing,owner:enemy?'enemy':'player',damage,knockback:move.knockback,asset:'cora-feather',size:74,color:'#c9a2ff'});});
      effects.push({type:'muzzle',x:ox,y:oy,life:.18,maxLife:.18,color:'#e0c8ff'});spawnParticles(ox,oy,'#b58cff',10,140);sound('cast');return;
    }
    if(move.type==='attack')effects.push({type:'slash',x:actor.x+actor.facing*55,y:hy+5,life:.22,maxLife:.22,facing:actor.facing,index:move.index,color:move.index===3?'#ffc86b':'#dcc6ff'});
    else {effects.push({type:'cora-fx',asset:'cora-gust',x:actor.x+actor.facing*140,y:actor.y-100,facing:actor.facing,life:.34,maxLife:.34,size:170});spawnParticles(actor.x+actor.facing*120,actor.y-100,'#3a2d58',12,220);}
    const dx=(target.x-actor.x)*actor.facing,near=move.area?dx>-30&&dx<move.reach:dx>-22&&dx<move.reach+27;
    if(!near||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.area?'#e8d8ff':'#e2ccff',actor.x,hy,false,move.type==='attack');
    if(connected&&move.type==='attack') {
      if(enemy)C.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'?'heavy':'hit');
  }
  function najaStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.NAJA_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-100),actor.y-150,actor.y-50);
    if(move.projectile){
      // Sand Fang runs along the floor from her palm slam: any small jump clears it.
      const x=actor.x+actor.facing*(em?.x??90);
      projectiles.push({x,y:actor.y-24,vx:actor.facing*move.speed,life:1.1,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'naja-sandwave',size:130,color:'#f2c86b'});
      dust(x,10);spawnParticles(x,actor.y-14,'#e8c27a',10,160);sound('cast');return;
    }
    // The urumi cracks out to its measured tip; the cyclone spins all the way around her.
    if(move.type==='attack')effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+25,life:.2,maxLife:.2,index:move.index,color:move.index===3?'#ffe7a8':'#f2d9a0'});
    else {effects.push({type:'naja-fx',asset:'naja-cyclone',x:actor.x,y:actor.y-72,facing:actor.facing,life:.36,maxLife:.36,size:270});spawnParticles(actor.x,actor.y-40,'#e3bf78',16,260,'dust');}
    const dx=(target.x-actor.x)*actor.facing,near=move.around?Math.abs(dx)<move.reach:dx>-22&&dx<move.reach+27;
    if(!near||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.around?'#ffe7b0':'#f7dca0',actor.x,hy,false,move.type==='attack');
    if(connected&&move.type==='attack') {
      if(enemy)N.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'?'heavy':'hit');
  }
  function haldorStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.HALDOR_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-90),actor.y-150,actor.y-40);
    if(move.projectile){
      // Slag Shot: lobbed at where the rival stands now (180-560 px ahead), landing after a fixed flight time.
      const L=HD.slag,x0=actor.x+actor.facing*(em?.x??70),y0=clamp(actor.y+(em?.y??-120),actor.y-170,actor.y-60);
      const ahead=(target.x-actor.x)*actor.facing,land=actor.x+actor.facing*clamp(ahead,L.minRange,L.maxRange);
      const g=2*(CONFIG.groundY-8-y0+L.rise*L.flight)/(L.flight*L.flight);
      projectiles.push({x:x0,y:y0,vx:(land-x0)/L.flight,vy:-L.rise,gravity:g,life:L.flight+.4,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'haldor-slag',size:64,color:'#ffae52',landX:land,landAt:time+L.flight,splash:L.splash});
      effects.push({type:'muzzle',x:x0,y:y0,life:.2,maxLife:.2,color:'#ffb35c'});spawnParticles(x0,y0,'#ff9a3c',10,150);sound('cast');return;
    }
    if(move.type==='attack'){
      effects.push({type:'slash',x:actor.x+actor.facing*55,y:hy+5,life:.24,maxLife:.24,facing:actor.facing,index:move.index,color:move.index===3?'#ffd28a':'#ffb05e'});
      // The overhead anvil smash lands on the floor: dust and a small shake even on a miss.
      if(move.index===3){dust(actor.x+actor.facing*(em?.x??110),14);trauma=Math.min(1,trauma+.18);}
    }
    else {effects.push({type:'haldor-fx',asset:'haldor-steam',x:actor.x-actor.facing*70,y:actor.y-80,facing:actor.facing,life:.4,maxLife:.4,size:190});spawnParticles(actor.x+actor.facing*70,actor.y-90,'#f3ecdf',12,220,'dust');}
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.type==='skill2'?'#fff1dc':'#ffc27a',actor.x,hy,false,move.type==='attack');
    if(connected&&move.type==='attack') {
      if(enemy)HD.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'||move.index===3?'heavy':'hit');
  }
  function zanniStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.ZANNI_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-100),actor.y-180,actor.y-50);
    if(move.projectile){
      // Ring Toss: a bladed ring at hand height flies out ZANNI.ring.range px and comes back to his hand.
      const x=actor.x+actor.facing*(em?.x??90),y=clamp(actor.y+(em?.y??-95),actor.y-130,actor.y-70);
      projectiles.push({x,y,vx:actor.facing*move.speed,life:2.2,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'zanni-ring',size:70,color:'#e4f36a',boomerang:true,range:Z.ring.range,travel:0,spin:18});
      effects.push({type:'muzzle',x,y,life:.2,maxLife:.2,color:'#e4f36a'});spawnParticles(x,y,'#e8d27a',10,150);sound('cast');return;
    }
    // The scissor lattice telescopes to its measured tip; Spring Snatch reaches 200 px and reels the rival in.
    if(move.type==='attack')effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+20,life:.18,maxLife:.18,index:move.index,color:move.index===3?'#f4f7a0':'#e4f36a'});
    else effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach,life:.26,maxLife:.26,index:3,color:'#f2d46a'});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.type==='skill2'?'#f6f3c8':'#e9f27a',actor.x,hy,false,move.type==='attack');
    if(connected&&move.pull){
      // Reel the rival in to `pull` px in front of ZANNI (never pushes a closer rival away).
      if(dx>move.pull){target.x=clamp(actor.x+actor.facing*move.pull,70,W-70);target.vx=0;}
      effects.push({type:'zanni-fx',asset:'zanni-snatch',x:target.x,y:target.y-90,facing:actor.facing,life:.32,maxLife:.32,size:150});
    }
    if(connected&&move.type==='attack') {
      if(enemy)Z.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'||move.index===3?'heavy':'hit');
  }
  function isoldeStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.ISOLDE_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-95),actor.y-190,actor.y-40);
    if(move.projectile){
      // Sky Piercer: an ice bolt from the lance point on a rising line (IS.piercer.rise): anti-air, close ground poke.
      const P=IS.piercer,x=actor.x+actor.facing*Math.round((em?.x??140)*.8),y=actor.y-P.y;
      projectiles.push({x,y,vx:actor.facing*P.speed,vy:-P.speed*P.rise,life:1.1,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'isolde-piercer',size:96,color:'#bfe6ff'});
      effects.push({type:'muzzle',x,y,life:.2,maxLife:.2,color:'#dff3ff'});spawnParticles(x,y,'#dff3ff',10,160);sound('cast');return;
    }
    if(move.type==='attack')effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+25,life:.18,maxLife:.18,index:move.index,color:move.index===3?'#eaf7ff':'#bfe6ff'});
    else effects.push({type:'isolde-fx',asset:'isolde-frost',x:actor.x-actor.facing*60,y:actor.y-70,facing:actor.facing,life:.4,maxLife:.4,size:190});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.type==='skill2'?'#eaf7ff':'#bfe6ff',actor.x,hy,false,move.type==='attack');
    if(connected&&move.type==='attack') {
      if(enemy)IS.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.type==='skill2'||move.index===3?'heavy':'hit');
  }
  function rheaStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.RHEA_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-95),actor.y-180,actor.y-40);
    if(move.projectile){
      // Planet Drift: a slow little planet at chest height that crosses the arena.
      const x=actor.x+actor.facing*(em?.x??80),y=actor.y-95;
      projectiles.push({x,y,vx:actor.facing*move.speed,life:RH.drift.life,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'rhea-drift',size:78,color:'#f2c77a',spin:3});
      effects.push({type:'muzzle',x,y,life:.2,maxLife:.2,color:'#f2c77a'});spawnParticles(x,y,'#f2c77a',10,150);sound('cast');return;
    }
    if(move.well){
      // Gravity Well: a vortex opens RH.well.at px ahead and collapses after RH.well.fuse s.
      const W0=RH.well,x=clamp(actor.x+actor.facing*W0.at,40,W-40);
      projectiles.push({x,y:CONFIG.groundY-80,vx:0,life:W0.fuse,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'rhea-well',size:170,color:'#e8b0c0',inert:true,radius:W0.radius,spin:-6});
      sound('cast');return;
    }
    effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+20,life:.18,maxLife:.18,index:move.index,color:move.index===3?'#f7e3b0':'#f2c77a'});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,'#f2c77a',actor.x,hy,false,true);
    if(connected) {
      if(enemy)RH.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.index===3?'heavy':'hit');
  }
  function solanStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.SOLAN_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-95),actor.y-190,actor.y-40);
    if(move.projectile){
      // Solar Crescent: a golden crescent wave from the blade edge at chest height, SO.crescent.range px long.
      const x=actor.x+actor.facing*Math.round((em?.x??110)*.7),y=actor.y-95;
      projectiles.push({x,y,vx:actor.facing*move.speed,life:move.range/move.speed,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'solan-crescent',size:150,color:'#ffd36a'});
      spawnParticles(x,y,'#ffd36a',10,160);sound('cast');return;
    }
    let hitX=null;
    if(move.leap){
      // Leonine Leap lands: the blade hits the floor SO.leap.ahead px in front; everything within the radius is hit.
      hitX=actor.x+actor.facing*SO.leap.ahead;
      effects.push({type:'solan-fx',asset:'solan-impact',x:hitX,y:CONFIG.groundY-40,facing:actor.facing,life:.4,maxLife:.4,size:220});
      dust(hitX,18);spawnParticles(hitX,CONFIG.groundY-10,'#e8c07a',18,300,'dust');trauma=Math.min(1,trauma+.3);
    } else effects.push({type:'slash',x:actor.x+actor.facing*55,y:hy+5,life:.24,maxLife:.24,facing:actor.facing,index:move.index,color:move.index===3?'#ffe7a0':'#ffd36a'});
    if(move.type==='attack'&&move.index===3){dust(actor.x+actor.facing*(em?.x??110),12);trauma=Math.min(1,trauma+.15);}
    const dx=(target.x-actor.x)*actor.facing;
    const inside=hitX!==null?Math.abs(target.x-hitX)<SO.leap.radius&&target.y>CONFIG.groundY-130:dx>-22&&dx<move.reach+27&&Math.abs(target.y-actor.y)<=115;
    if(!inside){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.leap?'#fff1c8':'#ffd36a',hitX??actor.x,hy,false,true);
    if(connected&&move.type==='attack') {
      if(enemy)SO.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.leap||move.index===3?'heavy':'hit');
  }
  function nibStrike(actor,move) {
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.NIB_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-80),actor.y-170,actor.y-40);
    if(move.projectile){
      // Express Letter: a sealed letter thrown flat at chest height; the fastest projectile, NB.letter.range px long.
      const x=actor.x+actor.facing*Math.round((em?.x??80)*.8),y=actor.y-90;
      projectiles.push({x,y,vx:actor.facing*move.speed,life:move.range/move.speed,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'nib-letter',size:70,color:'#f4efe2'});
      spawnParticles(x,y,'#f4efe2',8,150);sound('cast');return;
    }
    effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+15,life:.14,maxLife:.14,index:move.index||3,color:move.slip?'#bfe8ff':'#8fd4ff'});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,move.slip?'#bfe8ff':'#8fd4ff',actor.x,hy,false,true);
    if(connected&&move.slip){
      // Rooftop Slip: slip past the rival and turn around to face them (the dash stops there).
      effects.push({type:'nib-fx',asset:'nib-slip',x:target.x,y:target.y-80,facing:actor.facing,life:.3,maxLife:.3,size:150});
      actor.x=clamp(target.x+actor.facing*NB.slip.behind,70,W-70);actor.facing*=-1;actor.vx=0;if(actor.action)actor.action.dash=0;
    }
    if(connected&&move.type==='attack') {
      if(enemy)NB.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.slip||move.index===3?'heavy':'hit');
  }
  function eddaStrike(actor,move) {
    if(move.guard)return;
    const enemy=actor===dummy,target=enemy?hero:dummy,em=window.EDDA_METRICS?.emitters?.[move.name];
    const hy=clamp(actor.y+(em?.y??-80),actor.y-170,actor.y-30);
    if(move.projectile){
      // Stone Skip: a flat jade stone flicked low; it skips along the floor (ED.stone) and hits once.
      const x=actor.x+actor.facing*Math.round((em?.x??70)*.8),y=clamp(actor.y+(em?.y??-60),actor.y-60,actor.y-40);
      projectiles.push({x,y,vx:actor.facing*move.speed,vy:-ED.stone.rise,skip:true,skipG:ED.stone.gravity,bounces:ED.stone.bounces,hop:ED.stone.hop,life:3,facing:actor.facing,owner:enemy?'enemy':'player',damage:move.damage,knockback:move.knockback,asset:'edda-stone',size:54,color:'#9fe0b8',spin:14});
      spawnParticles(x,y,'#9fe0b8',8,150);sound('cast');return;
    }
    effects.push({type:'whip',x:actor.x,y:hy,facing:actor.facing,tip:em?.x??move.reach+15,life:.14,maxLife:.14,index:move.index||3,color:'#9fe0b8'});
    if(move.index===3)effects.push({type:'edda-fx',asset:'edda-ripple',x:actor.x+actor.facing*(em?.x??100),y:CONFIG.groundY-14,facing:actor.facing,life:.3,maxLife:.3,size:130});
    const dx=(target.x-actor.x)*actor.facing;
    if(dx<=-22||dx>=move.reach+27||Math.abs(target.y-actor.y)>115){sound('step');return;}
    const connected=enemy?window.__game.receiveHit(move.damage):hitDummy(move.damage,move.knockback,'#9fe0b8',actor.x,hy,false,true);
    if(connected&&move.type==='attack') {
      if(enemy)ED.refund(dummy);
      else for(const name of Object.keys(cooldownMax)){if(hero.cooldowns[name]>0)rechargePulse[name]=.22;hero.cooldowns[name]=Math.max(0,hero.cooldowns[name]-cooldownMax[name]*BALANCE.basicCooldownRefund);}
    }
    if(connected)sound(move.index===3?'heavy':'hit');
  }
  function startEnemyAction(name,index=1) {
    if(opponentCharacter==='fenr')return F.start(dummy,name,index);
    if(KITS[opponentCharacter]){if(!KITS[opponentCharacter].start(dummy,name,index))return false;if(name==='ultimate')startSummon(dummy);return true;}
    if(dummy.action||dummy.cooldowns[name]>0||['hurt','down','recover'].includes(dummy.state))return false;
    const stateName=name==='attack'?`attack${index}`:name,row=window.MECHA_MANIFEST.animation.rows[stateName],duration=name==='ultimate'?.5:row.frames/row.fps;
    if(name!=='attack')dummy.cooldowns[name]={skill1:3,skill2:6,ultimate:18}[name];
    dummy.action={type:name,name:stateName,index,t:0,duration,fired:false,hitAt:name==='skill2'?.53:.5};dummy.state=stateName;dummy.stateTime=0;
    if(name==='ultimate')startSquadron(dummy);return true;
  }
  function enemyStrike(a) {
    if(opponentCharacter==='fenr'){fenrStrike(dummy,a);return;}
    if(opponentCharacter==='mira'){miraStrike(dummy,a);return;}
    if(opponentCharacter==='cora'){coraStrike(dummy,a);return;}
    if(opponentCharacter==='naja'){najaStrike(dummy,a);return;}
    if(opponentCharacter==='haldor'){haldorStrike(dummy,a);return;}
    if(opponentCharacter==='zanni'){zanniStrike(dummy,a);return;}
    if(opponentCharacter==='isolde'){isoldeStrike(dummy,a);return;}
    if(opponentCharacter==='rhea'){rheaStrike(dummy,a);return;}
    if(opponentCharacter==='solan'){solanStrike(dummy,a);return;}
    if(opponentCharacter==='nib'){nibStrike(dummy,a);return;}
    if(opponentCharacter==='edda'){eddaStrike(dummy,a);return;}
    const em=window.MECHA_METRICS.emitters[a.name],x=dummy.x+dummy.facing*em.x,y=dummy.y+em.y,dx=(hero.x-dummy.x)*dummy.facing;
    if(a.type==='skill1'){projectiles.push({x,y,vx:dummy.facing*920,life:1.6,facing:dummy.facing,owner:'enemy',damage:16});effects.push({type:'muzzle',x,y,life:.25,maxLife:.25});sound('cast');}
    else if(a.type==='skill2'){effects.push({type:'slam',x,y:CONFIG.groundY-2,life:.8,maxLife:.8});sound('heavy');if(Math.abs(hero.x-x)<220&&Math.abs(hero.y-CONFIG.groundY)<125)window.__game.receiveHit(24);}
    else if(a.type==='attack'){
      effects.push({type:'slash',x:dummy.x+dummy.facing*48,y:y+5,life:.22,maxLife:.22,facing:dummy.facing,index:a.index,color:'#cffbf0'});
      const reach=Math.max(...window.MECHA_METRICS.states[a.name].frames.map(f=>f.bounds.right));
      if(dx>-24&&dx<reach+27&&Math.abs(hero.y-dummy.y)<113&&window.__game.receiveHit(BALANCE.combo[a.index-1].damage))for(const name of ['skill1','skill2','ultimate'])dummy.cooldowns[name]=Math.max(0,dummy.cooldowns[name]-({skill1:3,skill2:6,ultimate:18}[name]*.05));
    }
  }
  // CPU brain. It reads the player after `reaction` seconds (like a person), keeps its own kit spacing, jumps over
  // projectiles, steps out of attacks, punishes recovery, anti-airs, never spends a hit into post-hurt immunity,
  // hit-confirms its chain into a skill, and times its ultimate. Damage and HP are never scaled by difficulty.
  const CPU_DEFAULT = { speed:1, recovery:.72, reaction:.3, combo:1, skillEvery:1, ultimateAfter:7, aggression:.6, evade:.3, punish:.3, antiAir:.3, ender:0, mistakes:.15, wake:.3, immunity:0, comboCap:0 };
  function cpuProfile() { return { ...CPU_DEFAULT, ...(Rules?.difficulties[difficulty] || {}) }; }
  function cpuMove(name, index = 1) {
    if (opponentCharacter === 'fenr') return F.move(dummy, name, index);
    if (KITS[opponentCharacter]) return KITS[opponentCharacter].move(name, index);
    const state = name === 'attack' ? 'attack' + index : name, row = window.MECHA_MANIFEST.animation.rows[state], duration = name === 'ultimate' ? .5 : row.frames / row.fps;
    if (name === 'attack') return { name: state, type: name, index, duration, hitAt: .5, reach: Math.max(...window.MECHA_METRICS.states[state].frames.map(f => f.bounds.right)) };
    if (name === 'skill1') return { name, type: name, duration, hitAt: .5, projectile: true, speed: 920 };
    return { name, type: name, duration, hitAt: name === 'skill2' ? .53 : .5, area: true, reach: 220 };
  }
  // Horizontal distance at which a CPU move connects: projectiles go far, dashes add travel.
  function cpuReach(m) { return m.projectile ? (m.range || 560) : (m.area ? m.reach : m.reach + 27) + (m.dash ? m.dash * m.duration * .4 : 0); }
  // Open a chain only from where every link of it still reaches (knockback slides the player back a little).
  function cpuChainReach(P) { let r = Infinity; for (let i = 1; i <= Math.max(1, P.combo); i++) r = Math.min(r, cpuReach(cpuMove('attack', i))); return Math.max(60, r - 14); }
  function cpuHitTime(m) { return m.duration * (m.hitAt || .5) + (m.projectile ? Math.max(0, Math.abs(hero.x - dummy.x) - 100) / (m.speed || 800) : 0); }
  // True when the hit would land on a vulnerable player: inside the current hurt window, after post-hurt immunity,
  // or after a skill/ultimate the player is immune during. A fresh engagement never starts on a stunned player:
  // only the confirmed chain (combo + one ender) may use the stun, so there are no infinite loops.
  function cpuLands(m, fresh = false) {
    const t = cpuHitTime(m), a = hero.action;
    if (fresh && hero.hurtTime > 0) return false;
    if (a && (a.type.startsWith('skill') || a.type === 'ultimate')) return t >= a.duration - a.t;
    if (hero.hurtTime > 0) return t < hero.hurtTime - .004;
    return hero.invuln < t - .03;
  }
  // Jump timing that puts the feet above a projectile at the moment of contact; double jump for high shots.
  function cpuJumpPlan(height) {
    const need = height + 12, v1 = CONFIG.jumpSpeed, v2 = CONFIG.doubleJumpSpeed, g = CONFIG.gravity, second = .16;
    for (const double of [false, true]) {
      let first = -1, last = -1;
      for (let t = 0; t < 1.2; t += 1 / 120) {
        const y = !double || t < second ? v1 * t - g * t * t / 2 : (v1 * second - g * second * second / 2) + v2 * (t - second) - g * (t - second) ** 2 / 2;
        if (y < 0) break;
        if (y >= need) { if (first < 0) first = t; last = t; }
      }
      if (first >= 0) return { double, at: (first + last) / 2 };
    }
    return null;
  }
  function cpuJump(double) { dummy.vy = -CONFIG.jumpSpeed; dummy.y -= 1; dummy.jumps = 1; dummy.vx = 0; dummy.state = 'jump'; dummy.stateTime = 0; cpu.doubleAt = double ? time + .16 : 0; }
  function cpuStart(name, index = 1) {
    if (!startEnemyAction(name, index)) return false;
    dummy.vx = 0; cpu.plan = null;
    if (name === 'ultimate' && opponentCharacter === 'fenr') showFenrTransformation(dummy);
    return true;
  }
  // Fastest move that reaches the player now (melee first, then area skill), or null.
  // The player walking in or pressing buttons: poke from the full reach of attack1 to win the exchange.
  function cpuPoking() { const toward = Math.sign(dummy.x - hero.x); return hero.vx * toward > 40 || !!hero.action; }
  function cpuPick(P, dist, allowSkill) {
    const options = [['attack', 1], ...(allowSkill ? [['skill2', 1], ['skill1', 1]] : [])];
    for (const [name, index] of options) {
      if (name !== 'attack' && dummy.cooldowns[name] > 0) continue;
      const m = cpuMove(name, index);
      if (m.guard && !(hero.action?.type === 'attack' && !hero.action.fired)) continue;
      const walkIn = Math.max(0, hero.vx * Math.sign(dummy.x - hero.x)) * cpuHitTime(m) * P.evade;
      if (m.projectile ? dist < 180 : dist > (name === 'attack' ? (cpuPoking() ? cpuReach(m) - 6 + walkIn : cpuChainReach(P)) : cpuReach(m) + walkIn)) continue;
      return { name, index, m };
    }
    return null;
  }
  function cpuFollowUp(a, P) {
    const dist = Math.abs(hero.x - dummy.x), connected = hero.hurtTime > 0;
    if (a.type !== 'attack') return;
    if (a.index < P.combo) {
      const m = cpuMove('attack', a.index + 1), reach = cpuReach(m) - 8;
      // Chain only on a confirmed hit (or by mistake on lower levels); a blind chain would hit immunity.
      // Knockback slides the player back, so step in first while the stun still covers the next hit.
      if (connected && cpuLands(m)) {
        if (dist <= reach) { startEnemyAction('attack', a.index + 1); return; }
        if ((dist - reach) / (420 * P.speed) + cpuHitTime(m) < hero.hurtTime - .02) { cpu.plan = { kind: 'chain', index: a.index + 1 }; dummy.aiThink = 0; return; }
      } else if (!connected && dist <= reach && random() < P.mistakes) { startEnemyAction('attack', a.index + 1); return; }
    }
    if (connected && random() < P.ender) for (const name of ['skill2', 'skill1']) {
      if (dummy.cooldowns[name] > 0) continue;
      const m = cpuMove(name);
      if (m.guard) continue;
      if ((m.projectile || dist <= cpuReach(m)) && cpuLands(m) && cpuStart(name)) return;
    }
  }
  function updateFenrAI(dt) {
    const P = cpuProfile();
    dummy.aiTime += dt; dummy.aiThink = Math.max(0, dummy.aiThink - dt);
    if (['hurt', 'down', 'recover'].includes(dummy.state)) { dummy.action = null; cpu.plan = null; dummy.aiThink = Math.max(dummy.aiThink, P.reaction + P.wake); return; }
    if (dummy.action) {
      const a = dummy.action; a.t += dt; dummy.state = a.name;
      if (a.dash && a.t > a.duration * .2 && a.t < a.duration * .6) dummy.vx = dummy.facing * a.dash;
      if (!a.fired && a.type !== 'ultimate' && a.t >= a.duration * a.hitAt) { a.fired = true; enemyStrike(a); }
      if (a.t >= a.duration || (opponentCharacter !== 'fenr' && a.type === 'skill1' && a.fired)) {
        dummy.action = null; dummy.state = 'idle'; dummy.stateTime = 0; dummy.aiThink = P.recovery;
        if (hero.hp > 0) cpuFollowUp(a, P);
      }
      return;
    }
    const airborne = dummy.y < CONFIG.groundY || dummy.vy < 0;
    if (!aiEnabled || hero.hp <= 0) { dummy.vx = approach(dummy.vx, 0, dt * 1500); if (!airborne) dummy.state = 'idle'; return; }
    if (airborne) {
      if (cpu.doubleAt && time >= cpu.doubleAt && dummy.jumps < 2) { dummy.jumps = 2; dummy.vy = -CONFIG.doubleJumpSpeed; cpu.doubleAt = 0; }
      dummy.state = 'jump'; return;
    }
    const dx = hero.x - dummy.x, dist = Math.abs(dx); dummy.facing = dx >= 0 ? 1 : -1;
    // What the player is doing, seen with a human-like delay.
    if (hero.action !== cpu.heroAction) { cpu.heroAction = hero.action; cpu.heroActionAt = time; }
    if (!hero.grounded !== cpu.airborne) { cpu.airborne = !hero.grounded; cpu.airAt = time; cpu.antiAirRead = false; }
    const seen = since => time - since >= P.reaction;
    // 1. Projectiles: jump so the shot passes under the feet at contact (decided once per shot).
    for (const p of projectiles) {
      if (p.gravity) {
        // A lob cannot be jumped: run out of its splash by the nearer side before it lands.
        if (p.owner === 'enemy' || cpu.decided.has(p)) continue;
        if (!cpu.seen.has(p)) cpu.seen.set(p, time);
        if (!seen(cpu.seen.get(p))) continue;
        cpu.decided.add(p);
        let dir = Math.sign(dummy.x - p.landX) || -dummy.facing;
        if ((dir < 0 ? dummy.x - 110 : W - 100 - dummy.x) < p.splash + 20) dir = -dir;
        if (Math.abs(dummy.x - p.landX) < p.splash + 30 && random() < P.evade) cpu.plan = { kind: 'sidestep', dir, until: p.landAt + .05 };
        continue;
      }
      if (p.owner === 'enemy' || cpu.decided.has(p) || Math.sign(p.vx) !== Math.sign(dummy.x - p.x)) continue;
      if (!cpu.seen.has(p)) cpu.seen.set(p, time);
      if (!seen(cpu.seen.get(p))) continue;
      const tti = (Math.abs(dummy.x - p.x) - 30) / Math.abs(p.vx);
      if (tti <= 0) { cpu.decided.add(p); continue; }
      const plan = cpuJumpPlan(CONFIG.groundY - (p.y + (p.vy || 0) * tti));
      if (plan && tti > plan.at + 1 / 60) continue;
      cpu.decided.add(p);
      if (plan && random() < P.evade) { cpuJump(plan.double); return; }
    }
    // 1b. NAJA's locked sand ripple under the CPU: run out of it by the nearer edge (away from a wall) and keep going
    // until the cobra has erupted (decided once per strike). A late read (low levels) cannot get out in time.
    for (const k of serpent?.strikes || []) {
      if (k.state !== 'locked' || cpu.decided.has(k) || time - k.lockedAt < P.reaction) continue;
      cpu.decided.add(k);
      let dir = Math.sign(dummy.x - k.x) || -dummy.facing;
      if ((dir < 0 ? dummy.x - 110 : W - 100 - dummy.x) < N.serpent.radius + 20) dir = -dir;
      if (Math.abs(dummy.x - k.x) < N.serpent.radius + 30 && random() < P.evade) cpu.plan = { kind: 'sidestep', dir, until: k.lockedAt + N.serpent.telegraph + .05 };
    }
    // 2. A player move just started: step out of a melee startup, or plan to punish its recovery (once per move).
    const ha = hero.action;
    if (ha && cpu.read !== ha && seen(cpu.heroActionAt)) {
      const reach = ha.type === 'attack' ? attackRange(ha.index) + 27 : ha.type === 'skill2' ? 230 : 0, room = dummy.facing > 0 ? dummy.x - 110 : W - 100 - dummy.x;
      cpu.read = ha; cpu.respect = room > 90 && random() < P.evade;
      const toHit = ha.duration * (ha.hitAt || (ha.type === 'skill2' ? .53 : .5)) - ha.t, backOff = (reach + 18 - dist) / (380 * P.speed);
      if (!ha.fired && dist < reach + 15 && random() < P.evade) {
        const hop = cpuJumpPlan(122);
        if (room > 90 && backOff < toHit) cpu.plan = { kind: 'retreat', until: time + Math.min(.3, backOff + .06) };
        else if (hop && toHit > hop.at - .02) cpu.plan = { kind: 'hop', at: time + Math.max(0, toHit - hop.at), double: hop.double };
      } else if (random() < P.punish) cpu.plan = { kind: 'punish', action: ha };
      if (cpu.plan?.kind !== 'punish' && random() < P.punish) cpu.followPunish = ha; else cpu.followPunish = null;
    }
    if (cpu.plan?.kind === 'hop' && time >= cpu.plan.at) { const double = cpu.plan.double; cpu.plan = cpu.followPunish ? { kind: 'punish', action: cpu.followPunish } : null; cpuJump(double); return; }
    if (cpu.plan?.kind === 'retreat' && time >= cpu.plan.until && cpu.followPunish) cpu.plan = { kind: 'punish', action: cpu.followPunish };
    // 3. Anti-air: meet a landing jump with a grounded hit (decided once per jump).
    if (cpu.airborne && !cpu.antiAirRead && seen(cpu.airAt)) { cpu.antiAirRead = true; if (random() < P.antiAir) cpu.plan = { kind: 'antiair' }; }
    if (cpu.plan?.kind === 'antiair') {
      const m = cpuMove('attack', 1), t = cpuHitTime(m), landY = hero.y + hero.vy * t + CONFIG.gravity * t * t / 2;
      if (hero.grounded) cpu.plan = null;
      else if (dist <= cpuReach(m) && hero.vy > 0 && Math.abs(Math.min(landY, CONFIG.groundY) - dummy.y) < 105 && cpuLands(m, true) && cpuStart('attack', 1)) return;
    }
    if (cpu.plan?.kind === 'chain') {
      // Finish a confirmed chain: close the knockback gap, then strike while the player is still stunned.
      const m = cpuMove('attack', cpu.plan.index);
      if (!(hero.hurtTime > 0) || !cpuLands(m)) cpu.plan = null;
      else if (dist <= cpuReach(m) - 8 && cpuStart('attack', cpu.plan.index)) return;
    }
    if (cpu.plan?.kind === 'punish') {
      const pa = cpu.plan.action, pick = cpuPick(P, dist, true);
      if (hero.action !== pa) cpu.plan = hero.action || hero.hurtTime > 0 ? null : cpu.plan;
      // A whiffed attack leaves the player open for its whole recovery; skills/ultimate are immune until they end.
      const open = !hero.action ? hero.invuln <= 0 : pa.type === 'attack' ? pa.fired && !(dummy.state === 'hurt') : false;
      if (cpu.plan && pick && (open || !(pa.type === 'attack')) && cpuLands(pick.m, true) && cpuHitTime(pick.m) - Math.max(0, hero.action ? hero.action.duration - hero.action.t : 0) < .15 && cpuStart(pick.name, pick.index)) return;
      if (cpu.plan && !hero.action && !pick && hero.invuln <= 0 && time - cpu.heroActionAt > 1.2) cpu.plan = null;
    }
    // Movement: retreat plan, close in (run when far) or rush a punish, hold just outside a startup, or wait in reach
    // while the player is protected.
    const reach = (cpuPoking() ? cpuReach(cpuMove('attack', 1)) - 6 : cpuChainReach(P)) + 8, protectedNow = hero.invuln > 0 || hero.hurtTime > 0 || (ha && (ha.type.startsWith('skill') || ha.type === 'ultimate'));
    const threat = ha && !ha.fired && (ha.type === 'attack' || ha.type === 'skill2') ? (ha.type === 'attack' ? attackRange(ha.index) + 27 : 230) : 0;
    let wanted = 0;
    if (cpu.plan?.kind === 'retreat' && time < cpu.plan.until) wanted = -dummy.facing * 380;
    else if (cpu.plan?.kind === 'sidestep' && time < cpu.plan.until) wanted = cpu.plan.dir * 420;
    else {
      if (cpu.plan?.kind === 'retreat' || cpu.plan?.kind === 'sidestep') cpu.plan = null;
      const rushing = cpu.plan?.kind === 'punish' || cpu.plan?.kind === 'chain';
      const punishWait = cpu.plan?.kind === 'punish' && threat && !ha.fired;
      // An immune (not stunned) player can still hit: wait just outside their reach, then close in so the hit lands
      // as the immunity ends. A stunned player is approached so the confirmed chain can continue.
      const immuneFor = hero.hurtTime > 0 ? 0 : Math.max(hero.invuln, ha && (ha.type.startsWith('skill') || ha.type === 'ultimate') ? ha.duration - ha.t : 0);
      const closeIn = Math.max(0, dist - reach) / (420 * P.speed) + cpuHitTime(cpuMove('attack', 1)) + .05;
      const outside = attackRange(1) + 27 + 20, keepOut = (threat && (punishWait || (!rushing && cpu.read === ha && cpu.respect))) || immuneFor > closeIn;
      const goal = keepOut ? Math.max(reach, threat ? threat + 18 : outside) : reach - (protectedNow && hero.hurtTime > 0 ? 20 : 12);
      wanted = dist > goal ? dummy.facing * (dist > 300 || (rushing && !punishWait) || immuneFor > 0 ? 420 : 240) : dist < Math.min(55, goal - 20) ? -dummy.facing * 150 : keepOut && dist < goal - 6 ? -dummy.facing * 300 : 0;
    }
    dummy.vx = approach(dummy.vx, clamp(wanted * P.speed, -520, 520), dt * 2200); dummy.walkPhase += Math.abs(dummy.vx) * dt / 150;
    const next = Math.abs(dummy.vx) > 5 ? (Math.abs(dummy.vx) > 300 ? 'run' : 'walk') : 'idle'; if (next !== dummy.state) { dummy.state = next; dummy.stateTime = 0; }
    if (dummy.aiThink > 0 || cpu.plan?.kind === 'chain' || cpu.plan?.kind === 'sidestep') return;
    // 4. Decisions on the think timer.
    const allowSkill = P.skillEvery === 1 || Math.floor(dummy.aiTime / 2) % P.skillEvery === 0;
    if (dummy.aiTime > P.ultimateAfter && dummy.form === 'human' && dummy.cooldowns.ultimate <= 0 && cpuStart('ultimate')) { dummy.aiThink = P.reaction; return; }
    const pick = cpuPick(P, dist, allowSkill);
    if (pick && random() < P.aggression && (cpuLands(pick.m, true) || (hero.hurtTime <= 0 && random() < P.mistakes))) {
      if (cpuStart(pick.name, pick.index)) { if (pick.name === 'attack') dummy.aiChain++; dummy.aiThink = P.reaction; return; }
    }
    // Not landable yet (player protected or hesitation): check again very soon instead of idling a full beat.
    dummy.aiThink = pick || dist < 260 ? Math.min(P.reaction, 1 / 60) : P.reaction * .5;
  }
  function opponentPose() {
    const m=opponentCharacter==='arco'?window.MECHA_MANIFEST:opponentCharacter==='mira'?window.MIRA_MANIFEST:opponentCharacter==='cora'?window.CORA_MANIFEST:opponentCharacter==='naja'?window.NAJA_MANIFEST:opponentCharacter==='haldor'?window.HALDOR_MANIFEST:opponentCharacter==='zanni'?window.ZANNI_MANIFEST:opponentCharacter==='isolde'?window.ISOLDE_MANIFEST:opponentCharacter==='rhea'?window.RHEA_MANIFEST:opponentCharacter==='solan'?window.SOLAN_MANIFEST:opponentCharacter==='nib'?window.NIB_MANIFEST:opponentCharacter==='edda'?window.EDDA_MANIFEST:dummy.form==='wolf'?window.FENR_WOLF_MANIFEST:window.FENR_HUMAN_MANIFEST;
    const name=m?.frame_layout?.rows?.[dummy.state]?dummy.state:'idle',list=m?.frame_layout?.rows?.[name]||[];
    let index=0;
    // Projectile casts that release at 50% show wind-up -> thrust -> full extension, like the player's pose.
    if(dummy.action?.type==='skill1'&&opponentCharacter!=='fenr')index=Math.min(2,list.length-1,Math.floor(dummy.action.t/(dummy.action.duration*.5)*3));
    else if(dummy.action)index=Math.floor(dummy.action.t/dummy.action.duration*list.length);
    else if(name==='walk'||name==='run')index=Math.floor(dummy.walkPhase*list.length)%list.length;
    else if(name==='down')index=Math.floor(dummy.stateTime/.55*list.length);
    else if(name==='recover')index=Math.floor(dummy.stateTime/.4*list.length);
    else index=Math.floor(dummy.stateTime*(m?.animation?.rows?.[name]?.fps||5));
    if(m?.animation?.rows?.[name]?.loop)index%=list.length;
    return {state:name,frame:clamp(index,0,Math.max(0,list.length-1)),manifest:m};
  }
  function updateVisuals(dt) {
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.kind === 'dust' || p.kind==='run-smoke' ? -40 : 680) * dt; p.vx *= Math.exp(-dt * 3); if (p.life <= 0) particles.splice(i, 1); }
    for (let i = effects.length - 1; i >= 0; i--) { effects[i].life -= dt; if (effects[i].life <= 0) effects.splice(i, 1); }
    for (let i = damageNumbers.length - 1; i >= 0; i--) { damageNumbers[i].life -= dt; damageNumbers[i].y -= dt * 55; if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1); }
  }

  function drawBackground(shakeX, shakeY) {
    const stage = images.stage;
    if (stage) {
      // Cover the viewport while aligning the measured stage floor with the combat floor.
      // Combat remains a uniform 16:9 projection, so fighters never stretch on tall screens.
      const backdropScale = Math.max(viewW / W, viewH / H);
      const w = W * backdropScale, h = H * backdropScale;
      const x = (viewW - w) / 2 + shakeX * scale, y = viewH * .815 - CONFIG.groundY * backdropScale + shakeY * scale;
      ctx.drawImage(stage, 0, 0, stage.width, stage.height, x, y, w, h);
      if (x > 0) ctx.drawImage(stage, 0, 0, 1, stage.height, 0, y, x + 1, h);
      if (x + w < viewW) ctx.drawImage(stage, stage.width - 1, 0, 1, stage.height, x + w - 1, y, viewW - x - w + 1, h);
      if (y > 0) ctx.drawImage(stage, 0, 0, stage.width, 1, 0, 0, viewW, y + 1);
      if (y + h < viewH) ctx.drawImage(stage, 0, stage.height - 1, stage.width, 1, 0, y + h - 1, viewW, viewH - y - h + 1);
      // Overscan edge strips hide the shake without zooming or cropping the artwork.
      ctx.drawImage(stage, 0, 0, 1, stage.height, x - 45 * scale, y, 45 * scale + 1, h);
      ctx.drawImage(stage, stage.width - 1, 0, 1, stage.height, x + w - 1, y, 45 * scale + 1, h);
    } else { ctx.fillStyle = '#9fd3df'; ctx.fillRect(0, 0, viewW, viewH); }
    if (cinematic > 0) { ctx.fillStyle = `rgba(9,26,39,${Math.min(.65, cinematic * 1.5)})`; ctx.fillRect(0, 0, viewW, viewH); }
  }
  function shadow(x, y, width, opacity = .22) { ctx.fillStyle = `rgba(29,46,45,${opacity})`; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y + 2), width, 10, 0, 0, Math.PI * 2); ctx.fill(); }
  function heroPose() {
    const list = frames(hero.state).length ? frames(hero.state) : frames('idle');
    const row = manifest?.animation?.rows?.[hero.state] || { fps: 8, loop: true };
    const result = { state: hero.state, frame: 0, phase: hero.grounded ? 'grounded' : hero.airTime < .07 ? 'takeoff' : Math.abs(hero.vy) <= 100 ? 'apex' : hero.vy < 0 ? 'rising' : 'falling', rotation: 0, pivot: null, worldPivot: null, scale: Math.max(1, Math.round(manifest?.runtime?.scale || manifest?.runtime_scale || 1)) };
    let index = 0;
    if (hero.state === 'jump') {
      // The flight arc comes from physics. Hold one calm airborne pose, including at the apex.
      // Replaying the old takeoff/crouch strip in midair caused a visible body-size pop.
      index = metrics?.playback?.jump?.airFrame ?? Math.min(2, list.length - 1);
    } else if (hero.state === 'doublejump') {
      const playback = metrics?.playback?.doublejump;
      index = playback?.frame ?? 0;
      const bounds = metrics?.states?.doublejump?.frames?.[index]?.bounds;
      result.pivot = playback?.pivot || { x: 0, y: bounds ? (bounds.top + bounds.bottom) / 2 : -75 };
      result.worldPivot = metrics?.playback?.jump?.torsoPivot || { x: 0, y: -95 };
      // Positive canvas rotation flips with facing, producing a forward somersault in either direction.
      result.rotation = clamp(1 - hero.doublePose / hero.rollDuration, 0, 1) * Math.PI * 2;
      result.phase = 'somersault';
    } else if (hero.state === 'walk' || hero.state === 'run') index = Math.floor(hero.walkPhase * list.length) % list.length;
    else if (hero.action?.type === 'skill1') index = Math.min(2,list.length-1,Math.floor(hero.action.t/(hero.action.duration*.5)*3));
    else if (hero.action) index = Math.min(list.length - 1, Math.floor(hero.action.t / hero.action.duration * list.length));
    else if (row.loop === false) index = Math.min(list.length - 1, Math.floor(hero.animTime * (row.fps || 8)));
    else index = Math.floor(hero.animTime * (row.fps || 8)) % list.length;
    result.frame = clamp(index, 0, Math.max(0, list.length - 1));
    return result;
  }
  function drawHero() {
    shadow(hero.x, CONFIG.groundY, Math.max(19, (selectedCharacter === 'mira' ? 63 : selectedCharacter === 'haldor' ? 58 : 52) - (CONFIG.groundY - hero.y) * .07), .20);
    if (!images.hero || !manifest) return;
    let list = frames(hero.state); if (!list.length) list = frames('idle'); if (!list.length) return;
    const pose = heroPose(), index = pose.frame;
    const r = list[index], cw = manifest.cell?.width || manifest.cell?.w || r.w, ch = manifest.cell?.height || manifest.cell?.h || r.h;
    const anchorX = manifest.cell?.anchor_x ?? cw / 2, anchorY = manifest.cell?.anchor_y ?? ch - (manifest.cell?.safe_margin_y || 0);
    const spriteScale = pose.scale;
    ctx.save(); ctx.translate(Math.round(hero.x), Math.round(hero.y)); ctx.scale(hero.facing * spriteScale, spriteScale); ctx.imageSmoothingEnabled = false;
    if (pose.pivot) { ctx.translate(pose.worldPivot.x, pose.worldPivot.y); ctx.rotate(pose.rotation); ctx.translate(-pose.pivot.x, -pose.pivot.y); }
    ctx.drawImage(images.hero, r.x, r.y, r.w, r.h, -anchorX, -anchorY, r.w, r.h); ctx.restore();
  }
  function drawDummy() {
    const pose=opponentPose(),m=pose.manifest,img=images[opponentCharacter==='fenr'?(dummy.form==='wolf'?'fenrWolf':'fenrHuman'):opponentCharacter];
    shadow(dummy.x,CONFIG.groundY,dummy.state==='down'?65:opponentCharacter==='mira'?61:opponentCharacter==='haldor'?55:43,.20);
    if(!m||!img)return;
    const r=m.frame_layout.rows[pose.state][pose.frame];
    ctx.save();ctx.translate(Math.round(dummy.x),Math.round(dummy.y));ctx.scale(dummy.facing||-1,1);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,r.x,r.y,r.w,r.h,-m.cell.width/2,-(m.cell.height-m.cell.safe_margin_y),r.w,r.h);ctx.restore();
    if(dummy.action && !dummy.action.fired && dummy.action.type!=='ultimate') {
      ctx.save();ctx.strokeStyle='#f0b15e';ctx.lineWidth=2;ctx.globalAlpha=.7;
      ctx.beginPath();ctx.ellipse(dummy.x,CONFIG.groundY+3,37,7,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  function drawEffects() {
    for (const p of projectiles) {
      if(p.asset && images['fx-'+p.asset]){const w=p.size||84,h=p.size||76;ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.facing,1);if(p.vy)ctx.rotate(Math.atan2(p.vy,Math.abs(p.vx)));if(p.spin)ctx.rotate(realTime*p.spin);ctx.drawImage(images['fx-'+p.asset],-w/2,-h/2,w,h);ctx.restore();continue;}
      ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.scale(p.facing, 1);
      const glow = ctx.createLinearGradient(-75, 0, 15, 0); glow.addColorStop(0, '#73f2dd00'); glow.addColorStop(1, '#affff1bb'); ctx.fillStyle = glow; ctx.beginPath(); ctx.moveTo(-80, -5); ctx.lineTo(10, -11); ctx.lineTo(25, 0); ctx.lineTo(10, 11); ctx.lineTo(-80, 5); ctx.fill();
      ctx.fillStyle = '#234f55'; ctx.fillRect(-17, -8, 31, 16); ctx.fillStyle = '#97b4ad'; ctx.fillRect(-14, -6, 29, 11); ctx.fillStyle = '#dbe4c7'; ctx.fillRect(-12, -6, 25, 3); ctx.fillStyle = '#98723f'; ctx.fillRect(-18, -9, 6, 18); ctx.fillStyle = '#efcc84'; ctx.fillRect(-17, -8, 3, 16); ctx.fillStyle = '#71d9c8'; ctx.beginPath(); ctx.moveTo(13, -6); ctx.lineTo(23, 0); ctx.lineTo(13, 7); ctx.fill(); ctx.restore();
    }
    for (const e of effects) {
      const t = 1 - e.life / e.maxLife; ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.globalAlpha = Math.min(1, e.life / e.maxLife * 2); ctx.lineCap = 'square';
      if((e.type==='fenr-fx'||e.type==='mira-fx'||e.type==='cora-fx'||e.type==='naja-fx'||e.type==='haldor-fx'||e.type==='zanni-fx'||e.type==='isolde-fx'||e.type==='rhea-fx'||e.type==='solan-fx'||e.type==='nib-fx'||e.type==='edda-fx') && images['fx-'+e.asset]){ctx.scale(e.facing||1,1);const size=e.size*(.75+t*.4);ctx.drawImage(images['fx-'+e.asset],-size/2,-size/2,size,size);}
      // EDDA's tortoise spirit keeps one size; it fades in and out and lifts before each stomp.
      if(e.type==='edda-spirit'&&images['fx-'+e.asset]){ctx.globalAlpha=Math.min(1,t*6,(1-t)*5)*.92;ctx.scale(e.facing||1,1);ctx.drawImage(images['fx-'+e.asset],-e.size/2,-e.size-e.lift,e.size,e.size);}
      if (e.type === 'slash') { ctx.scale(e.facing, 1); ctx.rotate(e.index === 2 ? -.5 : .15); ctx.strokeStyle = e.color; ctx.lineWidth = 9 * (1 - t) + 2; ctx.beginPath(); ctx.arc(10, 4, 55 + e.index * 10, -1.2 + t * .3, 1.0 + t * .4); ctx.stroke(); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(4, 4, 46 + e.index * 10, -.85, .7); ctx.stroke(); }
      if (e.type === 'whip') { ctx.scale(e.facing, 1); const bend = (e.index === 2 ? 22 : -26) * (1 - t), end = e.tip * (.7 + .3 * Math.min(1, t * 4)); ctx.lineCap = 'round'; for (const [w, c] of [[7 * (1 - t) + 2, e.color], [2, '#ffffffcc']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(26, 0); ctx.quadraticCurveTo(end * .55, bend, end, e.index === 2 ? 10 : -4); ctx.stroke(); } }
      if (e.type === 'airpulse') { ctx.strokeStyle = '#d0fff1'; ctx.lineWidth = 5 * (1 - t); ctx.beginPath(); ctx.ellipse(0, 0, 25 + t * 60, 8 + t * 20, 0, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 5; i++) { ctx.fillStyle = '#7adbcf'; ctx.fillRect(-38 + i * 18, 10 + t * 35, 4, 17 * (1 - t)); } }
      if (e.type === 'impact' || e.type === 'muzzle') { ctx.rotate(t * .4); ctx.fillStyle = e.color || '#b2ffef'; for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(5, -3); ctx.lineTo((e.heavy ? 60 : 40) * (1 - t) + 7, 0); ctx.lineTo(5, 4); ctx.fill(); } ctx.fillStyle = '#fff9e5'; ctx.fillRect(-7, -7, 14, 14); }
      if (e.type === 'slam') { ctx.strokeStyle = '#ccf0ff'; ctx.lineWidth = 8 * (1 - t) + 1; ctx.beginPath(); ctx.ellipse(0, -2, 35 + t * 240, 10 + t * 35, 0, 0, Math.PI * 2); ctx.stroke(); for (let i = -3; i <= 3; i++) { const height = (95 - Math.abs(i) * 12) * Math.sin(Math.PI * Math.min(t * 1.4, 1)); ctx.fillStyle = i % 2 ? '#76b1c9dd' : '#d7eff2cc'; ctx.beginPath(); ctx.moveTo(i * 48 - 15, 0); ctx.lineTo(i * 48 - 8, -height); ctx.lineTo(i * 48 + 16, -height * .6); ctx.lineTo(i * 48 + 21, 0); ctx.closePath(); ctx.fill(); } }
      if (e.type === 'charge' || e.type === 'ultimate-ring') { ctx.strokeStyle = '#e7bb79'; ctx.lineWidth = 3; const radius = e.type === 'charge' ? 100 - t * 65 : 70 + t * 150; ctx.rotate(realTime * 2); ctx.strokeRect(-radius * .7, -radius * .7, radius * 1.4, radius * 1.4); ctx.rotate(Math.PI / 4); ctx.strokeRect(-radius * .6, -radius * .6, radius * 1.2, radius * 1.2); ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke(); }
      if (e.type === 'drone-laser') {
        const dx = e.endX - e.x, dy = e.endY - e.y, length = Math.hypot(dx, dy);
        ctx.rotate(Math.atan2(dy, dx)); ctx.lineCap = 'round';
        const strength = Math.min(1, (1 - t) * 3), width = 9 * strength;
        ctx.strokeStyle = '#50eedb35'; ctx.lineWidth = width * 3.2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(length,0); ctx.stroke();
        ctx.strokeStyle = '#f9ce78d9'; ctx.lineWidth = width * 1.5; ctx.stroke();
        ctx.strokeStyle = '#fffbe7'; ctx.lineWidth = Math.max(1.4, width * .4); ctx.stroke();
        ctx.fillStyle = '#ffffe6'; ctx.beginPath(); ctx.arc(0,0,width*.85,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    for (const p of particles) {
      ctx.save(); ctx.globalAlpha=clamp(p.life/.3,0,1); ctx.fillStyle=p.color; const size=Math.max(1,Math.round(p.size));
      if(p.kind==='run-smoke') {
        const age=1-p.life/p.maxLife, radius=p.size+age*13, x=Math.round(p.x), y=Math.round(p.y);
        ctx.translate(x,y); ctx.scale(1,.68);
        const fog=ctx.createRadialGradient(0,0,0,0,0,radius); fog.addColorStop(0,'#edf0e0eb'); fog.addColorStop(.45,'#cbd2c2cc'); fog.addColorStop(1,'#b4c0ac00');
        ctx.globalAlpha*=.9; ctx.fillStyle=fog; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill();
      } else if(p.kind==='dust') {ctx.globalAlpha*=.35;ctx.fillRect(Math.round(p.x),Math.round(p.y),size*3,size*2);}
      else ctx.fillRect(Math.round(p.x),Math.round(p.y),size,size);
      ctx.restore();
    }
    for (const n of damageNumbers) { ctx.save(); ctx.globalAlpha = Math.min(1, n.life * 2.5); ctx.font = `900 ${n.amount >= 30 ? 31 : 25}px Rajdhani`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#254247'; ctx.strokeText(n.amount, Math.round(n.x), Math.round(n.y)); ctx.fillStyle = n.color; ctx.fillText(n.amount, Math.round(n.x), Math.round(n.y)); ctx.restore(); }
  }
  function drawSquadron(group = squad) {
    if (!group || !images.drone) return;
    for (const d of group.drones) {
      if (!d.visible || d.alpha <= 0) continue;
      const width = SQUAD.droneWidth, height = images.drone.height / images.drone.width * width;
      ctx.save(); ctx.translate(Math.round(d.x),Math.round(d.y)); ctx.rotate(d.angle); ctx.scale(group.facing,1); ctx.globalAlpha = d.alpha;
      const moving = group.t < d.delay + .6 || group.t > SQUAD.departure;
      ctx.fillStyle = '#83ffe397'; ctx.beginPath(); ctx.moveTo(-width*.38,-5); ctx.lineTo(-width*.5-(moving?38:13),0); ctx.lineTo(-width*.38,5); ctx.fill();
      if (!d.fired && group.t > 1.1) { ctx.strokeStyle = '#7af9e2aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(width*.38,0,11+(group.t% .15)*35,0,Math.PI*2); ctx.stroke(); }
      ctx.imageSmoothingEnabled = false; ctx.drawImage(images.drone,-width/2,-height/2,width,height); ctx.restore();
    }
  }
  function drawParade(group) {
    if (!group) return;
    const img = images['fx-mira-rocket'];
    for (const r of group.rockets) {
      if (r.state !== 'flying') continue;
      ctx.save(); ctx.translate(Math.round(r.x), Math.round(r.y)); ctx.rotate(r.angle); ctx.imageSmoothingEnabled = false;
      if (img) ctx.drawImage(img, -26, -26, 52, 52);
      else { ctx.fillStyle = '#c9a8f2'; ctx.fillRect(-14, -5, 22, 10); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(8, -5); ctx.lineTo(16, 0); ctx.lineTo(8, 5); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawMurmuration(group) {
    if (!group) return;
    const img = images['fx-cora-raven'], U = C.murmuration, tail = (U.ravens - 1) * U.spacing;
    for (const p of group.passes) {
      if (p.state !== 'flying') continue;
      // A faint violet wake marks the height of the pass so the dodge window reads at a glance.
      const tailX = p.front - group.facing * tail, wake = ctx.createLinearGradient(tailX, 0, p.front, 0);
      wake.addColorStop(0, '#3b2a6a00'); wake.addColorStop(1, '#3b2a6a5c'); ctx.fillStyle = wake; ctx.fillRect(Math.min(tailX, p.front), p.y - 6, tail, 12);
      for (let k = 0; k < U.ravens; k++) {
        const x = p.front - group.facing * k * U.spacing;
        if (x < -60 || x > W + 60) continue;
        const y = p.y + (k % 2 ? 16 : -16) + Math.sin(group.t * 9 + k * 1.7 + p.id) * 9, flap = .55 + .45 * Math.abs(Math.cos(group.t * 16 + k * 1.3)), size = 60 - (k % 3) * 6;
        ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(group.facing, flap); ctx.imageSmoothingEnabled = false;
        if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
        else { ctx.fillStyle = '#231a33'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -9); ctx.lineTo(-6, 0); ctx.lineTo(-12, 9); ctx.fill(); }
        ctx.restore();
      }
    }
  }
  function drawSerpent(group) {
    if (!group) return;
    const ripple = images['fx-naja-ripple'], cobra = images['fx-naja-serpent'], U = N.serpent;
    for (const k of group.strikes) {
      if (k.state === 'tracking' || k.state === 'locked') {
        // The ripple pulses while it follows and turns bright and still once locked: that is the cue to move.
        const locked = k.state === 'locked', w = U.radius * 2 + 20, pulse = locked ? 1 : .55 + .2 * Math.sin(group.t * 14 + k.id);
        ctx.save(); ctx.translate(Math.round(k.x + (locked ? Math.sin(realTime * 70) * 2 : 0)), CONFIG.groundY); ctx.globalAlpha = pulse; ctx.imageSmoothingEnabled = false;
        if (ripple) ctx.drawImage(ripple, -w / 2, -w / 2, w, w);
        else { ctx.strokeStyle = '#e3bf78'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, U.radius, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
        if (locked) { ctx.globalAlpha = .5; ctx.strokeStyle = '#fff1c2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, U.radius * (1 - (group.t - k.lockAt) / U.telegraph * .3), 11, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
      }
      if (k.state !== 'erupting') continue;
      // Rise fast, hold, then sink back into the sand; clipped at the floor so it grows out of the ground.
      const u = (group.t - k.at) / U.rise, h = U.height + 40, size = cobra ? h * cobra.width / 496 : h;
      const out = u < .25 ? 1 - Math.pow(1 - u / .25, 3) : u > .7 ? 1 - Math.pow((u - .7) / .3, 2) : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(k.x - size, CONFIG.groundY - h - 40, size * 2, h + 50); ctx.clip();
      ctx.translate(Math.round(k.x), Math.round(CONFIG.groundY + 12 + (1 - out) * h)); ctx.scale(group.facing, 1); ctx.imageSmoothingEnabled = false;
      if (cobra) ctx.drawImage(cobra, -size / 2, -size, size, size);
      else { ctx.fillStyle = '#d9b77a'; ctx.fillRect(-26, -h, 52, h); }
      ctx.restore();
    }
  }
  function drawHitboxes() {
    if (!hitboxes) return; ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeStyle = '#5affce'; ctx.strokeRect(hero.x - 28, hero.y - 128, 56, 128); ctx.strokeStyle = '#ffe186'; ctx.strokeRect(dummy.x - 30, dummy.y - 165, 60, 165); if (hero.action?.type === 'attack') { const reach = attackRange(hero.action.index); ctx.fillStyle = '#ff925c35'; ctx.strokeStyle = '#ff935d'; const x = hero.facing === 1 ? hero.x : hero.x - reach; ctx.fillRect(x, hero.y - 126, reach, 113); ctx.strokeRect(x, hero.y - 126, reach, 113); } ctx.strokeStyle = '#fff8'; ctx.beginPath(); ctx.moveTo(0, CONFIG.groundY); ctx.lineTo(W, CONFIG.groundY); ctx.stroke(); ctx.restore();
  }
  function draw() {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#9ed2dc'; ctx.fillRect(0, 0, viewW, viewH);
    const shakeX = Math.sin(realTime * 93) * trauma * trauma * 13, shakeY = Math.cos(realTime * 111) * trauma * trauma * 9;
    drawBackground(shakeX, shakeY); ctx.save(); ctx.translate(offsetX + shakeX * scale, offsetY + shakeY * scale); ctx.scale(scale, scale);
    // Light motes provide life without moving the fixed stage or camera.
    for (let i = 0; i < 14; i++) { const x = (i * 117 + realTime * (6 + i % 3)) % W, y = 210 + (i * 47) % 330 + Math.sin(realTime + i) * 9; ctx.fillStyle = i % 2 ? '#fff8cb88' : '#f0ffe94d'; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
    if (hero.x < dummy.x) { drawHero(); drawDummy(); } else { drawDummy(); drawHero(); }
    drawSquadron(); drawSquadron(enemySquad); drawParade(parade); drawParade(enemyParade); drawMurmuration(flock); drawMurmuration(enemyFlock); drawSerpent(serpent); drawSerpent(enemySerpent); drawEffects(); drawHitboxes(); ctx.restore(); updateHud();
  }
  function fighterInfo(id,form) {
    if(id==='fenr'){const wolf=form==='wolf';return {name:'FENR',cls:wolf?'WEREWOLF':'DEMI-HUMAN',deck:wolf?'FENR · FERAL':'FENR',title:'WOLF RANGER',portrait:'assets/fenr/ui/portrait-'+(wolf?'wolf':'human')+'.webp',names:F.kits[wolf?'wolf':'human'].names,icons:['basic','skill1','skill2','ultimate'].map((s,i)=>'assets/fenr/ui/icon-'+(i===3?'ultimate':(wolf?'wolf':'human')+'-'+s)+'.webp')};}
    if(id==='cora')return {name:'CORA',cls:'DEMI-HUMAN',deck:'CORA',title:'SKY DANCER',portrait:'assets/cora/ui/portrait.webp',names:C.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/cora/ui/icon-'+s+'.webp')};
    if(id==='edda')return {name:'EDDA',cls:'DEMI-HUMAN',deck:'EDDA',title:'SHELL SAGE',portrait:'assets/edda/ui/portrait.webp',names:ED.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/edda/ui/icon-'+s+'.webp')};
    if(id==='nib')return {name:'NIB',cls:'DEMI-HUMAN',deck:'NIB',title:'ROOFTOP POST',portrait:'assets/nib/ui/portrait.webp',names:NB.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/nib/ui/icon-'+s+'.webp')};
    if(id==='solan')return {name:'SOLAN',cls:'DEMI-HUMAN',deck:'SOLAN',title:'SUNMANE',portrait:'assets/solan/ui/portrait.webp',names:SO.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/solan/ui/icon-'+s+'.webp')};
    if(id==='rhea')return {name:'RHEA',cls:'MECHA',deck:'RHEA',title:'LITTLE ORRERY',portrait:'assets/rhea/ui/portrait.webp',names:RH.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/rhea/ui/icon-'+s+'.webp')};
    if(id==='isolde')return {name:'ISOLDE',cls:'MECHA',deck:'ISOLDE',title:'WHITE STRIDER',portrait:'assets/isolde/ui/portrait.webp',names:IS.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/isolde/ui/icon-'+s+'.webp')};
    if(id==='zanni')return {name:'ZANNI',cls:'MECHA',deck:'ZANNI',title:'CLOCKWORK JESTER',portrait:'assets/zanni/ui/portrait.webp',names:Z.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/zanni/ui/icon-'+s+'.webp')};
    if(id==='haldor')return {name:'HALDOR',cls:'MECHA',deck:'HALDOR',title:'WALKING FORGE',portrait:'assets/haldor/ui/portrait.webp',names:HD.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/haldor/ui/icon-'+s+'.webp')};
    if(id==='naja')return {name:'NAJA',cls:'DEMI-HUMAN',deck:'NAJA',title:'DUNE COBRA',portrait:'assets/naja/ui/portrait.webp',names:N.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/naja/ui/icon-'+s+'.webp')};
    if(id==='mira')return {name:'MIRA',cls:'MECHA',deck:'MIRA',title:'CANDY PILOT',portrait:'assets/mira/ui/portrait.webp',names:M.names,icons:['basic','skill1','skill2','ultimate'].map(s=>'assets/mira/ui/icon-'+s+'.webp')};
    return {name:'ARCO',cls:'MECHA',deck:'ARCO',title:'AETHER ARM',portrait:'assets/ui/arco-avatar.webp',names:['IRON CHAIN','AETHER BOLT','SEISMIC DRIVE','HELIOS SQUADRON'],icons:['attack','skill1','skill2','squadron-icon'].map(s=>'assets/ui/'+s+'.webp')};
  }
  function updateFighterIdentity() {
    if(!F)return;
    const identity=selectedCharacter+':'+hero.form+':'+opponentCharacter+':'+dummy.form;
    if(identity!==hudIdentity) {
      hudIdentity=identity;const me=fighterInfo(selectedCharacter,hero.form),rival=fighterInfo(opponentCharacter,dummy.form);
      $('#player-name').textContent=me.name;$('#player-class').textContent=me.cls;$('#deck-character').textContent=me.deck;
      $('#player-title').textContent=me.title;
      $('#player-portrait').src=me.portrait;$('#player-portrait').alt='Portrait '+me.name;
      $('#enemy-portrait').src=rival.portrait;$('#enemy-portrait').alt='Portrait '+opponentCharacter.toUpperCase();$('#enemy-class').textContent=rival.cls;
      $('#enemy-name').textContent=opponentCharacter.toUpperCase();$('#enemy-title').textContent=rival.title;
      $('.fighter-two').setAttribute('aria-label','Status lawan '+opponentCharacter.toUpperCase());
      document.querySelectorAll('.skill-card').forEach((card,i)=>{card.querySelector('.skill-name').textContent=me.names[i];card.querySelector('img').src=me.icons[i];card.setAttribute('aria-label',me.names[i]+', '+['Spasi','I','O','P'][i]);});
    }
    $('#player-status').textContent=selectedCharacter==='fenr'?(hero.form==='wolf'?'FERAL ACTIVE':'RANGER READY'):selectedCharacter==='mira'?'PILOT READY':selectedCharacter==='cora'?'WINGS READY':selectedCharacter==='naja'?'SANDS READY':selectedCharacter==='haldor'?'FURNACE HOT':selectedCharacter==='zanni'?'SHOWTIME':selectedCharacter==='isolde'?'LANCE READY':selectedCharacter==='rhea'?'ORBITS SET':selectedCharacter==='solan'?'PRIDE READY':selectedCharacter==='nib'?'ON THE ROUTE':selectedCharacter==='edda'?'STEADY AS STONE':'CORE ACTIVE';
    for(const [actor,id] of [[hero,'player-form-timer'],[dummy,'enemy-form-timer']]){const el=$('#'+id),active=actor.form==='wolf';el.hidden=!active;el.textContent=active?'FERAL  '+Math.max(0,actor.formTime).toFixed(1)+' s':'';el.style.setProperty?.('--remaining',String(actor.formTime/F.balance.duration));}
  }
  function updateHud() {
    updateFighterIdentity();
    updateMatchHud();
    if(systemAnnouncer){const a=systemAnnouncer.snapshot();canvas.dataset.announcerVoice=a.voice;canvas.dataset.announcerCue=a.cue;canvas.dataset.announcerLastCue=a.lastCue;canvas.dataset.announcerActive=String(a.active);canvas.dataset.announcerPaused=String(a.paused);canvas.dataset.announcerTime=String(a.time);canvas.dataset.announcerStarts=String(a.starts);canvas.dataset.announcerError=a.error;}
    canvas.dataset.character=selectedCharacter;canvas.dataset.playerForm=hero.form||'human';canvas.dataset.opponentForm=dummy.form||'human';canvas.dataset.opponentState=dummy.state;canvas.dataset.aiEnabled=String(aiEnabled);canvas.dataset.opponentFrame=String(opponentPose().frame);
    canvas.dataset.ready = String(ready);
    canvas.dataset.audioState = audio?.state || 'uninitialized';
    canvas.dataset.audioSources = String(audioSources);
    canvas.dataset.voiceName = voiceName;
    canvas.dataset.voiceOwner = voiceActor === dummy ? 'enemy' : 'player';
    canvas.dataset.fenrVoiceReadyState = String(voiceBank.fenr?.readyState || 0);
    canvas.dataset.voiceActive = String(voiceActive);
    canvas.dataset.voicePaused = String(ultimateVoice?.paused ?? true);
    canvas.dataset.voiceTime = String(ultimateVoice?.currentTime || 0);
    canvas.dataset.voiceDuration = String(Number.isFinite(ultimateVoice?.duration) ? ultimateVoice.duration : 0);
    canvas.dataset.voiceStarts = String(voiceStarts);
    canvas.dataset.voiceReadyState = String(ultimateVoice?.readyState || 0);
    canvas.dataset.voiceError = voiceError;
    canvas.dataset.droneCount = String(squad?.drones.filter(d => d.visible).length || 0);
    canvas.dataset.droneShots = String(squad?.shots || 0);
    canvas.dataset.ultimatePhase = squad?.phase || 'none';
    const currentPose = heroPose();
    canvas.dataset.poseState = currentPose.state;
    canvas.dataset.poseFrame = String(currentPose.frame);
    canvas.dataset.posePhase = currentPose.phase;
    canvas.dataset.poseRotation = currentPose.rotation.toFixed(6);
    canvas.dataset.poseScale = String(currentPose.scale);
    canvas.dataset.posePivot = currentPose.pivot ? `${currentPose.pivot.x},${currentPose.pivot.y}` : '';
    canvas.dataset.poseWorldPivot = currentPose.worldPivot ? `${currentPose.worldPivot.x},${currentPose.worldPivot.y}` : '';
    const h=hpLayers(hero.hp), dh=hpLayers(currentDummyHP());
    $('#health-fill').style.width = `${h.front}%`; $('#health-reserve').style.width = `${h.reserve}%`; $('#health-label').textContent = `${hero.hp} / ${BALANCE.heroMax}`;
    $('#guard-fill').style.width = `${dh.front}%`; $('#guard-reserve').style.width = `${dh.reserve}%`; $('#guard-label').textContent = `HP ${currentDummyHP()} / ${BALANCE.dummyMax}`;
    $('#dummy-state').textContent = dummy.ko?'K.O.':({ idle: aiEnabled?'WATCHING':'PRACTICE', hurt: 'HIT CONFIRMED', down: 'DOWN', recover: 'RECOVERING' })[dummy.state] || (dummy.action?'ATTACKING':'APPROACHING');
    $('#combo').classList.toggle('visible', comboHits > 0); $('#combo-count').textContent = comboHits; $('#combo-damage').textContent = `${comboDamage} DAMAGE`; $('#total-damage').innerHTML = `${totalDamage} <small>DMG</small>`;
    $('#best-combo').innerHTML = `${bestCombo} <small>HITS</small>`;
    $('#announcement').classList.toggle('visible', announceTimer > 0);
    for (const card of document.querySelectorAll('.skill-card')) {
      const name = card.dataset.action, cd = hero.cooldowns[name] || 0;
      card.classList.toggle('active', name === 'attack' ? hero.action?.type === 'attack' : name === 'ultimate' ? (!!squad || !!parade || !!flock || !!serpent || !!quake || !!finale || !!skyfall || !!orrery || !!sunroar || !!delivery || !!tortoise || (selectedCharacter==='fenr'&&(hero.form==='wolf'||hero.transformPending>0))) : hero.action?.type === name);
      card.classList.toggle('on-cooldown', cd > 0); card.setAttribute('aria-disabled', String(cd > 0 || (name==='ultimate'&&selectedCharacter==='fenr'&&(hero.form==='wolf'||hero.transformPending>0))));
      card.classList.toggle('recharged',(rechargePulse[name]||0)>0);
      const wipe = card.querySelector('.cooldown-wipe');
      if (wipe) { const angle = cd > 0 ? (1 - cd / cooldownMax[name]) * 360 : 360; wipe.style.background = `conic-gradient(from 0deg, transparent 0deg ${angle.toFixed(2)}deg, rgba(0,0,0,.68) ${angle.toFixed(2)}deg 360deg)`; }
    }
    // One banner at a time: FENR transformation, then ARCO, then a MIRA/CORA/NAJA/HALDOR summon still inside its cut-in window.
    const cutin=$('#ultimate-cutin'),live=g=>g&&g.t<SQUAD.cutinDuration?g:null;
    const arcoGroup=live(enemySquad)||live(squad),summon=live(enemyParade)||live(parade)||live(enemyFlock)||live(flock)||live(enemySerpent)||live(serpent)||live(enemyQuake)||live(quake)||live(enemyFinale)||live(finale)||live(enemySkyfall)||live(skyfall)||live(enemyOrrery)||live(orrery)||live(enemySunroar)||live(sunroar)||live(enemyDelivery)||live(delivery)||live(enemyTortoise)||live(tortoise);
    const cutinKey=fenrCutin?'fenr':arcoGroup?'arco':summon?(summon===parade||summon===enemyParade?'mira':summon===serpent||summon===enemySerpent?'naja':summon===quake||summon===enemyQuake?'haldor':summon===finale||summon===enemyFinale?'zanni':summon===skyfall||summon===enemySkyfall?'isolde':summon===orrery||summon===enemyOrrery?'rhea':summon===sunroar||summon===enemySunroar?'solan':summon===delivery||summon===enemyDelivery?'nib':summon===tortoise||summon===enemyTortoise?'edda':'cora'):'arco';
    const ct=fenrCutin?.t ?? (arcoGroup||summon)?.t ?? 100;
    cutin.classList.toggle('fenr-cutin',cutinKey==='fenr');cutin.classList.toggle('mira-cutin',cutinKey==='mira');cutin.classList.toggle('cora-cutin',cutinKey==='cora');cutin.classList.toggle('naja-cutin',cutinKey==='naja');cutin.classList.toggle('haldor-cutin',cutinKey==='haldor');cutin.classList.toggle('zanni-cutin',cutinKey==='zanni');cutin.classList.toggle('isolde-cutin',cutinKey==='isolde');cutin.classList.toggle('rhea-cutin',cutinKey==='rhea');cutin.classList.toggle('solan-cutin',cutinKey==='solan');cutin.classList.toggle('nib-cutin',cutinKey==='nib');cutin.classList.toggle('edda-cutin',cutinKey==='edda');
    const cutinArt=cutin.querySelector('.cutin-art'),cutinOwner=cutinKey==='fenr'?fenrCutin.owner:cutinKey==='mira'||cutinKey==='cora'||cutinKey==='naja'||cutinKey==='haldor'||cutinKey==='zanni'||cutinKey==='isolde'||cutinKey==='rhea'||cutinKey==='solan'||cutinKey==='nib'||cutinKey==='edda'?(summon.owner==='enemy'?'RIVAL':'PLAYER'):'';
    if(cutin.dataset.identity!==cutinKey+cutinOwner){cutin.dataset.identity=cutinKey+cutinOwner;cutinArt.src=CUTIN_ART[cutinKey];if(cutinArt.complete)cutinArt.style.visibility='';else{cutinArt.style.visibility='hidden';cutinArt.onload=()=>{cutinArt.style.visibility='';};}cutin.querySelector('.cutin-kicker').textContent={fenr:'FENR / '+cutinOwner,mira:'MIRA / '+cutinOwner,cora:'CORA / '+cutinOwner,naja:'NAJA / '+cutinOwner,haldor:'HALDOR / '+cutinOwner,zanni:'ZANNI / '+cutinOwner,isolde:'ISOLDE / '+cutinOwner,rhea:'RHEA / '+cutinOwner,solan:'SOLAN / '+cutinOwner,nib:'NIB / '+cutinOwner,edda:'EDDA / '+cutinOwner,arco:'ARCO / AETHER COMMAND'}[cutinKey];cutin.querySelector('strong').innerHTML={fenr:'FERAL<br><em>AWAKENING</em>',mira:'ROCKET<br><em>PARADE</em>',cora:'NIGHT<br><em>MURMURATION</em>',naja:'DUNE<br><em>SERPENT</em>',haldor:'FORGE<br><em>QUAKE</em>',zanni:'GRAND<br><em>FINALE</em>',isolde:'SKYFALL<br><em>LANCES</em>',rhea:'GRAND<br><em>ORRERY</em>',solan:'SUNMANE<br><em>ROAR</em>',nib:'SPECIAL<br><em>DELIVERY</em>',edda:'ELDER<br><em>TORTOISE</em>',arco:'HELIOS<br><em>SQUADRON</em>'}[cutinKey];cutin.querySelector('.cutin-detail').textContent={fenr:'THE BEAST WITHIN',mira:'TWELVE-ROCKET SALVO',cora:'THREE-PASS RAVEN STORM',naja:'THREE-STRIKE SAND COBRA',haldor:'THREE-SLAM MOLTEN SHOCKWAVE',zanni:'THREE-RING BLADE BOOMERANG',isolde:'THREE-LANCE ICE DIVE',rhea:'THREE-PLANET ORBIT',solan:'THREE-ROAR SHOCKWAVE',nib:'THREE-PARCEL HOMING RUN',edda:'THREE-STOMP SPIRIT WALK',arco:'ORBITAL LASER STRIKE'}[cutinKey];cutin.setAttribute('aria-label',{fenr:'FENR ultimate: Feral Awakening',mira:'MIRA ultimate: Rocket Parade',cora:'CORA ultimate: Night Murmuration',naja:'NAJA ultimate: Dune Serpent',haldor:'HALDOR ultimate: Forge Quake',zanni:'ZANNI ultimate: Grand Finale',isolde:'ISOLDE ultimate: Skyfall Lances',rhea:'RHEA ultimate: Grand Orrery',solan:'SOLAN ultimate: Sunmane Roar',nib:'NIB ultimate: Special Delivery',edda:'EDDA ultimate: Elder Tortoise',arco:'ARCO ultimate: Helios Squadron'}[cutinKey]);}
    const visible = ct < SQUAD.cutinDuration;
    cutin.classList.toggle('visible', visible); cutin.setAttribute('aria-hidden', String(!visible));
    const slide = !visible ? -110 : ct < .16 ? -110 * Math.pow(1 - ct / .16,3) : ct > .57 ? 110 * Math.pow((ct-.57)/.21,2) : 0;
    cutin.style.transform = `translateX(${slide}%) rotate(-3deg)`;
    cutin.style.opacity = visible ? '1' : '0';
    document.querySelectorAll('.combo-dots i').forEach((dot, i) => dot.classList.toggle('lit', hero.action?.type === 'attack' && hero.action.index > i));
  }
  // Cut-in art per fighter. Only the two fighters of the current fight are warmed (at start/select), so a banner never waits
  // for its image; until the right image is decoded the art stays hidden (see updateHud) instead of showing the last one.
  const CUTIN_ART={fenr:'assets/fenr/ui/cutin.webp',mira:'assets/mira/ui/cutin.webp',cora:'assets/cora/ui/cutin.webp',naja:'assets/naja/ui/cutin.webp',haldor:'assets/haldor/ui/cutin.webp',zanni:'assets/zanni/ui/cutin.webp',isolde:'assets/isolde/ui/cutin.webp',rhea:'assets/rhea/ui/cutin.webp',solan:'assets/solan/ui/cutin.webp',nib:'assets/nib/ui/cutin.webp',edda:'assets/edda/ui/cutin.webp',arco:'assets/ui/ultimate-cutin.webp'};
  let cutinWarm=[];
  function warmCutins(){cutinWarm=[...new Set([selectedCharacter,opponentCharacter])].map(id=>CUTIN_ART[id]).filter(Boolean).map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});}
  function setPaused(value) { paused = value; clearInput(); syncUltimateVoice(); $('#pause-btn').textContent = value ? '▶' : 'Ⅱ'; const panel = $('#pause-panel'); if (value && !panel.open) panel.showModal(); if (!value && panel.open) panel.close(); if (!value) canvas.focus({ preventScroll: true }); }
  function openSettings() { settingsOpen = true; clearInput(); syncUltimateVoice(); window.FrontEnd?.syncBackground(); $('#close-settings').innerHTML=(menuOpen?'Kembali ke menu':'Kembali ke arena')+' <span>↗</span>'; $('#settings-panel').showModal(); }
  function closeSettings() { settingsOpen = false; $('#settings-panel').close(); syncUltimateVoice(); window.FrontEnd?.syncBackground(); canvas.focus({ preventScroll: true }); }
  const handled = new Set(['w','a','s','d',' ','i','o','p','escape','r']);
  window.addEventListener('keydown', e => { if (!handled.has(e.key.toLowerCase()) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return; e.preventDefault(); if (!e.repeat) press(e.key); });
  window.addEventListener('keyup', e => { if (handled.has(e.key.toLowerCase())) { if(!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))e.preventDefault(); release(e.key); } });
  window.addEventListener('blur', clearInput); document.addEventListener('visibilitychange', () => { clearInput(); lastTime = 0; accumulator = 0;if(document.hidden)systemAnnouncer?.clear(); syncUltimateVoice(); syncMusic(); });
  window.addEventListener('resize', resize); canvas.addEventListener('pointerdown', () => { unlockAudio(); canvas.focus(); });
  $('#pause-btn').onclick = () => { unlockAudio(); setPaused(!paused); }; $('#resume-btn').onclick = () => setPaused(false); $('#restart-btn').onclick = reset;
  $('#back-menu').onclick=()=>{closeSettings();setMenuOpen(true);window.FrontEnd?.home();};
  $('#character-select').onchange=e=>selectCharacter(e.target.value);
  $('#ai-toggle').onchange=e=>{aiEnabled=e.target.checked;dummy.action=null;dummy.vx=0;dummy.state='idle';};
  $('#settings-btn').onclick = openSettings; $('#close-settings').onclick = closeSettings;
  $('#settings-panel').addEventListener('cancel', e => { e.preventDefault(); closeSettings(); }); $('#pause-panel').addEventListener('cancel', e => { e.preventDefault(); setPaused(false); });
  $('#hitbox-toggle').onchange = e => { hitboxes = e.target.checked; }; $('#sound-toggle').onchange = e => { unlockAudio(); muted = !e.target.checked; applyAudioMix(); };
  $('#music-toggle').checked = musicOn; $('#music-slider').value = String(Math.round(musicVolume * 100)); $('#music-value').value = `${Math.round(musicVolume * 100)}%`;
  $('#music-toggle').onchange = e => { unlockAudio(); musicOn = e.target.checked; prefs.set('aether.music', musicOn ? '1' : '0'); syncMusic(); };
  $('#music-slider').oninput = e => { unlockAudio(); musicVolume = clamp(Number(e.target.value) / 100, 0, 1); $('#music-value').value = `${e.target.value}%`; prefs.set('aether.musicVolume', e.target.value); syncMusic(); };
  $('#volume-slider').oninput = e => { unlockAudio(); volume = Number(e.target.value) / 100; $('#volume-value').value = `${e.target.value}%`; applyAudioMix(); };
  $('#sound-test').onclick = () => { unlockAudio(); sound('heavy'); }; // Inside the mobile shell the shell owns fullscreen (it also locks landscape); on its own page the game toggles it itself.
  function toggleFullscreen() { if (window.parent !== window) { try { if (window.parent.aetherFullscreen) { window.parent.aetherFullscreen(); return; } } catch (_) {} window.parent.postMessage({ type: 'aether-fullscreen' }, location.origin); return; } if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); }
  $('#fullscreen-btn').onclick = toggleFullscreen;
  for (const button of document.querySelectorAll('[data-action]')) button.onclick = () => { unlockAudio(); const name = button.dataset.action; if (name === 'attack') startAttack(); else cast(name); canvas.focus({ preventScroll: true }); };
  function tick(stamp) { if (lastTime) { const elapsed = Math.min((stamp - lastTime) / 1000, .1); fps += (1 / Math.max(elapsed, .001) - fps) * .05; if (!window.__game?.manual) { accumulator += elapsed; while (accumulator >= 1 / 120) { step(1 / 120); accumulator -= 1 / 120; } } } lastTime = stamp; draw(); requestAnimationFrame(tick); }
  // Deterministic QA interface: set manual=true, reset(), press/release(), advance(seconds).
  // Positions represent feet. No networking or persistent state is changed by this interface.
  window.__game = { hero, dummy, config: CONFIG, balance:BALANCE, particles, effects, projectiles, pose: heroPose, press: key => press(key, true), release, input(key, down) { if (down) press(key); else release(key); }, reset, cast, jump, attack: startAttack, clearInput, draw, manual: false,
    advance(seconds) { for (let i = 0; i < Math.round(seconds * 120); i++) step(1 / 120); draw(); return this.snapshot(); },
    snapshot() { return { ready, paused, settingsOpen, menuOpen, selectedCharacter, opponentCharacter, difficulty, stageId, match:match?{...match}:null,roundCues:[...roundCues],aiEnabled, time, stepCount, hero: JSON.parse(JSON.stringify(hero)), dummy: { ...dummy }, healthBars:{hero:hpLayers(hero.hp),dummy:hpLayers(currentDummyHP())}, squad: squad ? JSON.parse(JSON.stringify(squad)) : null, enemySquad:enemySquad?JSON.parse(JSON.stringify(enemySquad)):null, parade: parade ? JSON.parse(JSON.stringify(parade)) : null, enemyParade: enemyParade ? JSON.parse(JSON.stringify(enemyParade)) : null, flock: flock ? JSON.parse(JSON.stringify(flock)) : null, enemyFlock: enemyFlock ? JSON.parse(JSON.stringify(enemyFlock)) : null, serpent: serpent ? JSON.parse(JSON.stringify(serpent)) : null, enemySerpent: enemySerpent ? JSON.parse(JSON.stringify(enemySerpent)) : null, quake: quake ? JSON.parse(JSON.stringify(quake)) : null, enemyQuake: enemyQuake ? JSON.parse(JSON.stringify(enemyQuake)) : null, finale: finale ? { ...finale } : null, enemyFinale: enemyFinale ? { ...enemyFinale } : null, skyfall: skyfall ? { ...skyfall } : null, enemySkyfall: enemySkyfall ? { ...enemySkyfall } : null, orrery: orrery ? { ...orrery } : null, enemyOrrery: enemyOrrery ? { ...enemyOrrery } : null, sunroar: sunroar ? { ...sunroar } : null, enemySunroar: enemySunroar ? { ...enemySunroar } : null, delivery: delivery ? { ...delivery } : null, enemyDelivery: enemyDelivery ? { ...enemyDelivery } : null, tortoise: tortoise ? { ...tortoise, spirit: undefined } : null, enemyTortoise: enemyTortoise ? { ...enemyTortoise, spirit: undefined } : null, playable: playable(), cutinVisible: !!squad && squad.t < SQUAD.cutinDuration, totalDamage, comboHits, comboDamage, hitstop, cinematic, trauma, projectileCount: projectiles.length, audioState: audio?.state || 'uninitialized', audioSources, stageLoaded: !!images.stage, spriteLoaded: !!images.hero, manifestLoaded: !!manifest }; },
    startMatch,setMenuOpen,menuSound,openSettings,toggleFullscreen,music(){return music?{on:musicOn,volume:musicVolume,playing:!music.paused,src:MUSIC_PATH,element:music}:null;},onRoundCue(fn){roundAnnouncer=typeof fn==='function'?fn:null;},
    announceSelection(id){return menuOpen&&playable().includes(id)?(systemAnnouncer?.play('select_'+id)||false):false;},
    stopAnnouncer(){systemAnnouncer?.clear();},announcerState(){return systemAnnouncer?.snapshot()||null;},
    selectCharacter, setAI(value){aiEnabled=!!value;dummy.action=null;dummy.vx=0;dummy.state='idle';}, opponentPose,
    setPaused, setHitboxes(v) { hitboxes = !!v; $('#hitbox-toggle').checked = hitboxes; },
    receiveHit(damage = 12,options={}) { if (menuOpen || (match&&match.phase!=='fight') || hero.hp<=0 || hero.invuln > 0) return false; if (hero.action?.guard && shellGuard(hero)) return false; if (hero.action?.type?.startsWith('skill') || hero.action?.type === 'ultimate') return false; hero.hp = Math.max(0, hero.hp - damage); hero.action = null; hero.rollBuffer = null; hero.doublePose = 0; hero.hurtTime = hero.hp>0?.42:0; hero.vx = hero.facing * -170; state(hero.hp>0?'hurt':'down'); spawnParticles(hero.x, hero.y - 75, '#ffc694', 14, 200); if(options.freeze!==false)hitstop = .05; trauma = Math.min(1, trauma + .2 * (options.shake ?? 1)); if (!hero.hp) {hero.koTime=1.7;clearInput();if(match?.mode!=='versus')announce('CORE RESTART',1.7);} return true; }
  };
  if(F)reset();
  if(window.FRONTEND_ENABLED)setMenuOpen(true);
  resize(); requestAnimationFrame(tick);
  // Wait for the first-visit download (preload.js) so these requests are served from the cache, not fetched twice.
  Promise.resolve(window.AETHER_PRELOAD).then(() => Promise.all([loadImage('hero', 'assets/mecha/run/sprite-sheet-alpha.webp', true), loadImage('stage', 'assets/stage.webp', true), ...(Rules?Object.entries(Rules.stages).filter(([id])=>id!=='bellora').map(([id,s])=>loadImage('stage-'+id,s.image,true)):[]), ...(F?[loadImage('fenrHuman','assets/fenr/human/run/sprite-sheet-alpha.webp',true),loadImage('fenrWolf','assets/fenr/wolf/run/sprite-sheet-alpha.webp',true),...['claw','gale','rush','bite','howl','transform'].map(name=>loadImage('fx-'+name,'assets/fenr/ui/fx-'+name+'.webp',true))]:[]), ...(M?[loadImage('mira','assets/mira/run/sprite-sheet-alpha.webp',true),...['star','rocket','burst','crash'].map(name=>loadImage('fx-mira-'+name,'assets/mira/ui/fx-'+name+'.webp',true))]:[]), ...(C?[loadImage('cora','assets/cora/run/sprite-sheet-alpha.webp',true),...['feather','gust','raven'].map(name=>loadImage('fx-cora-'+name,'assets/cora/ui/fx-'+name+'.webp',true))]:[]), ...(N?[loadImage('naja','assets/naja/run/sprite-sheet-alpha.webp',true),...['sandwave','cyclone','serpent','ripple'].map(name=>loadImage('fx-naja-'+name,'assets/naja/ui/fx-'+name+'.webp',true))]:[]), ...(HD?[loadImage('haldor','assets/haldor/run/sprite-sheet-alpha.webp',true),...['slag','splash','steam','quake'].map(name=>loadImage('fx-haldor-'+name,'assets/haldor/ui/fx-'+name+'.webp',true))]:[]), ...(Z?[loadImage('zanni','assets/zanni/run/sprite-sheet-alpha.webp',true),...['ring','bigring','snatch','confetti'].map(name=>loadImage('fx-zanni-'+name,'assets/zanni/ui/fx-'+name+'.webp',true))]:[]), ...(IS?[loadImage('isolde','assets/isolde/run/sprite-sheet-alpha.webp',true),...['piercer','skyfall','shatter','frost'].map(name=>loadImage('fx-isolde-'+name,'assets/isolde/ui/fx-'+name+'.webp',true))]:[]), ...(RH?[loadImage('rhea','assets/rhea/run/sprite-sheet-alpha.webp',true),...['drift','planet','well','burst'].map(name=>loadImage('fx-rhea-'+name,'assets/rhea/ui/fx-'+name+'.webp',true))]:[]), ...(SO?[loadImage('solan','assets/solan/run/sprite-sheet-alpha.webp',true),...['crescent','roar','impact','sunburst'].map(name=>loadImage('fx-solan-'+name,'assets/solan/ui/fx-'+name+'.webp',true))]:[]), ...(NB?[loadImage('nib','assets/nib/run/sprite-sheet-alpha.webp',true),...['letter','plane','slip','stamp'].map(name=>loadImage('fx-nib-'+name,'assets/nib/ui/fx-'+name+'.webp',true))]:[]), ...(ED?[loadImage('edda','assets/edda/run/sprite-sheet-alpha.webp',true),...['stone','ripple','shell','tortoise','stomp'].map(name=>loadImage('fx-edda-'+name,'assets/edda/ui/fx-'+name+'.webp',true))]:[]), loadImage('drone', 'assets/ui/drone.png', true), loadImage('cutin', 'assets/ui/ultimate-cutin.webp', true)])).then(results => {
    images['stage-bellora']=images.stage;images.arco=images.hero;if(F)syncPlayerForm();
    ready = results.every(Boolean) && (!F || (!!window.FENR_HUMAN_MANIFEST && !!window.FENR_WOLF_MANIFEST)) && !!manifest && frames('idle').length > 0;
    if (ready) { $('#load-state').classList.add('hidden'); announce('TRAINING READY', 1.65); }
    else { $('#load-state').classList.add('error'); $('#load-message').textContent = 'Aset arena belum lengkap. Periksa atlas/manifest karakter, stage.webp, drone.png, dan ultimate-cutin.webp, lalu muat ulang.'; }
    window.FrontEnd?.assetsReady(ready);
  });
})();
