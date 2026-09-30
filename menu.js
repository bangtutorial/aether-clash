/* Front door: player -> rival -> arena/difficulty, with future locked roster slots. */
(() => {
  'use strict';
  const root=document.querySelector('#front-menu'),game=window.__game;
  const fighters={
    arco:{name:'ARCO',tag:'THE AETHER ARM',race:'MECHA',portrait:'assets/ui/arco-avatar.webp',art:'assets/menu/arco-select.webp',detail:'Steel resolve. Unbreakable spirit.',basic:'IRON CHAIN',ultimate:'HELIOS SQUADRON',style:'Brawler / drone summon',color:'#8ae3d3'},
    fenr:{name:'FENR',tag:'THE WOLF RANGER',race:'DEMI-HUMAN',portrait:'assets/fenr/ui/portrait-human.webp',art:'assets/menu/fenr-select.webp',detail:'The wild never bows.',basic:'RANGER CHAIN',ultimate:'FERAL AWAKENING',style:'Agile / werewolf transformation',color:'#eab27a'},
    ...(window.Mira&&window.MIRA_MANIFEST?{mira:{name:'MIRA',tag:'THE CANDY PILOT',race:'MECHA',portrait:'assets/mira/ui/portrait.webp',art:'assets/menu/mira-select.webp',detail:'Small pilot. Big robot. Bigger fireworks.',basic:'MITTEN CHAIN',ultimate:'ROCKET PARADE',style:'Heavy mech / rocket barrage',color:'#d9b4ff'}}:{}),
    ...(window.Cora&&window.CORA_MANIFEST?{cora:{name:'CORA',tag:'THE RAVEN DANCER',race:'DEMI-HUMAN',portrait:'assets/cora/ui/portrait.webp',art:'assets/menu/cora-select.webp',detail:'Every feather is a blade.',basic:'FEATHER WALTZ',ultimate:'NIGHT MURMURATION',style:'Agile / raven swarm',color:'#c4a6ff'}}:{}),
    ...(window.Naja&&window.NAJA_MANIFEST?{naja:{name:'NAJA',tag:'THE DUNE COBRA',race:'DEMI-HUMAN',portrait:'assets/naja/ui/portrait.webp',art:'assets/menu/naja-select.webp',detail:'Sways like sand. Strikes like venom.',basic:'VIPER LASH',ultimate:'DUNE SERPENT',style:'Mid-range / urumi whip & sand serpent',color:'#d9b77a'}}:{}),
    ...(window.Haldor&&window.HALDOR_MANIFEST?{haldor:{name:'HALDOR',tag:'THE WALKING FORGE',race:'MECHA',portrait:'assets/haldor/ui/portrait.webp',art:'assets/menu/haldor-select.webp',detail:'Old forge master. Walking furnace. Heavy hammer.',basic:'FORGE CHAIN',ultimate:'FORGE QUAKE',style:'Heavy tank / steam forge hammer',color:'#d9803f'}}:{}),
    ...(window.Zanni&&window.ZANNI_MANIFEST?{zanni:{name:'ZANNI',tag:'THE CLOCKWORK JESTER',race:'MECHA',portrait:'assets/zanni/ui/portrait.webp',art:'assets/menu/zanni-select.webp',detail:'Arms that stretch. Jokes that sting.',basic:'SCISSOR JAB',ultimate:'GRAND FINALE',style:'Trickster / extending scissor-arm strikes and bladed rings',color:'#c9d64a'}}:{}),
    ...(window.Isolde&&window.ISOLDE_MANIFEST?{isolde:{name:'ISOLDE',tag:'THE WHITE STRIDER',race:'MECHA',portrait:'assets/isolde/ui/portrait.webp',art:'assets/menu/isolde-select.webp',detail:'Long legs, longer lance, zero mercy.',basic:'LANCE LINE',ultimate:'SKYFALL LANCES',style:'Long-range lancer / stilt-leg charges',color:'#9fd4ff'}}:{}),
    ...(window.Rhea&&window.RHEA_MANIFEST?{rhea:{name:'RHEA',tag:'THE LITTLE ORRERY',race:'MECHA',portrait:'assets/rhea/ui/portrait.webp',art:'assets/menu/rhea-select.webp',detail:'Homework done. Planets armed. Class dismissed.',basic:'ORBIT STRIKE',ultimate:'GRAND ORRERY',style:'Zoner / orbiting orrery spheres',color:'#c7485e'}}:{}),
    ...(window.Solan&&window.SOLAN_MANIFEST?{solan:{name:'SOLAN',tag:'THE SUNMANE',race:'DEMI-HUMAN',portrait:'assets/solan/ui/portrait.webp',art:'assets/menu/solan-select.webp',detail:'Golden mane, heavy blade, louder roar.',basic:'SUNBLADE',ultimate:'SUNMANE ROAR',style:'Powerhouse / greatsword and roar',color:'#f2b632'}}:{}),
    ...(window.Nib&&window.NIB_MANIFEST?{nib:{name:'NIB',tag:'THE ROOFTOP POST',race:'DEMI-HUMAN',portrait:'assets/nib/ui/portrait.webp',art:'assets/menu/nib-select.webp',detail:'Every letter delivered. Every punch, too.',basic:'BATON FLURRY',ultimate:'SPECIAL DELIVERY',style:'Rushdown / twin courier batons',color:'#8fd4ff'}}:{}),
    ...(window.Edda&&window.EDDA_MANIFEST?{edda:{name:'EDDA',tag:'THE SHELL SAGE',race:'DEMI-HUMAN',portrait:'assets/edda/ui/portrait.webp',art:'assets/menu/edda-select.webp',detail:'Slow to anger, impossible to knock down.',basic:'STAFF FORMS',ultimate:'ELDER TORTOISE',style:'Counter defender / staff and shell guard',color:'#8fe3b4'}}:{})
  };
  // Showcase fighters (assets/showcase/showcase.js) fill roster slots with avatar and art; they cannot be confirmed yet.
  const showcase=Object.fromEntries(Object.entries(window.SHOWCASE_FIGHTERS||{}).filter(([id])=>!fighters[id]));
  const info=id=>fighters[id]||showcase[id],soon=id=>!!showcase[id];
  const opened=[...Object.keys(fighters),...Object.keys(showcase)];
  // Touch screens have no hover: a tap only previews a fighter; the yellow CONFIRM button picks it.
  const touch=document.documentElement.classList.contains('touch');
  // Phones get a fullscreen button on the home screen (no trip to Settings). Hidden where the page cannot go fullscreen
  // (iPhone Safari); inside the mobile shell the shell's document is the one that goes fullscreen.
  const canFullscreen=touch&&(()=>{try{const d=window.parent!==window?window.parent.document:document;return !!(d.fullscreenEnabled||d.webkitFullscreenEnabled);}catch(_){return false;}})();
  // Until the phone has been fullscreen once (button or the shell's first-touch fullscreen), the button glows.
  const hintKey='aether.fullscreenHint';
  let fullscreenHint=canFullscreen&&(()=>{try{return localStorage.getItem(hintKey)!=='seen';}catch(_){return true;}})();
  function dismissFullscreenHint(){if(!fullscreenHint)return;fullscreenHint=false;try{localStorage.setItem(hintKey,'seen');}catch(_){}root.querySelector('.menu-fullscreen')?.classList.remove('hinted');}
  if(fullscreenHint)try{const d=window.parent!==window?window.parent.document:document;d.addEventListener('fullscreenchange',()=>{if(d.fullscreenElement)dismissFullscreenHint();});}catch(_){}
  // Warm the small roster portraits so the grid appears at once. The large select art and arena pictures are fetched when
  // shown and then come from the browser cache; holding all of them decoded would waste a phone's image memory.
  const warm=opened.map(id=>info(id).portrait).filter(Boolean).map(src=>{const im=new Image();im.decoding='async';im.src=src;return im;});
  const roster=[...opened,...Array.from({length:Math.max(0,12-opened.length)},(_,i)=>'locked-'+i)];
  // lockIn: the pending step change while a confirmed fighter flashes 3 times (PICK_FLASH s each); input waits for it.
  const PICK_FLASH=.3;let lockIn=null,lockTicks=[];
  let screen='home',step=0,mode='versus',player='arco',enemy='fenr',hover='arco',stage='bellora',level='medium',result=null,interacted=false,lastSound=0;
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let backgroundEnabled=!reducedMotion?.matches,backgroundVideo=null,videoPlayToken=0;
  const backgroundToggle=document.querySelector('#menu-video-toggle');
  function shouldAnimate(){return backgroundEnabled && screen==='home' && !root.hidden && !document.hidden && !game.snapshot().settingsOpen;}
  function syncBackground(){
    if(!backgroundVideo)return;const token=++videoPlayToken;
    if(!shouldAnimate()){backgroundVideo.pause();return;}
    if(backgroundVideo.paused){const p=backgroundVideo.play();p?.catch(()=>{if(token===videoPlayToken)backgroundVideo.dataset.state='autoplay-blocked';});}
  }
  function attachBackground(){
    if(screen!=='home')return;
    if(!backgroundVideo && backgroundEnabled){
      backgroundVideo=document.createElement('video');backgroundVideo.id='menu-background-video';backgroundVideo.className='menu-background-video';
      backgroundVideo.muted=true;backgroundVideo.defaultMuted=true;backgroundVideo.autoplay=true;backgroundVideo.loop=true;backgroundVideo.playsInline=true;backgroundVideo.preload='auto';
      backgroundVideo.setAttribute('muted','');backgroundVideo.setAttribute('playsinline','');backgroundVideo.setAttribute('aria-hidden','true');backgroundVideo.tabIndex=-1;backgroundVideo.disablePictureInPicture=true;
      backgroundVideo.poster='assets/menu/home-factions.webp';backgroundVideo.dataset.state='loading';
      backgroundVideo.addEventListener('playing',()=>{if(!shouldAnimate()){backgroundVideo.pause();return;}backgroundVideo.classList.add('is-playing');backgroundVideo.dataset.state='playing';});
      backgroundVideo.addEventListener('error',()=>{backgroundVideo.classList.remove('is-playing');backgroundVideo.dataset.state='poster-fallback';});
      backgroundVideo.src='assets/menu/home-factions-loop.mp4';
    }
    if(backgroundVideo)root.querySelector('.home-art')?.prepend(backgroundVideo);
    syncBackground();
  }
  if(backgroundToggle){backgroundToggle.checked=backgroundEnabled;backgroundToggle.onchange=e=>{backgroundEnabled=e.target.checked;attachBackground();syncBackground();};}
  document.addEventListener('visibilitychange',syncBackground);
  function sfx(kind='move',explicit=false){if(!interacted&&!explicit)return;interacted=true;const now=performance.now();if(kind==='move'&&now-lastSound<75)return;lastSound=now;game.menuSound(kind);}
  root.addEventListener('pointerdown',()=>{interacted=true;},true);
  const brand='<span class="wordmark">AETHER<span>CLASH</span><i>✦</i></span>';
  const footer=()=>'<footer class="menu-footer"><span><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> SELECT &nbsp; <kbd>ENTER</kbd> CONFIRM &nbsp; <kbd>ESC</kbd> BACK</span><span>LOCAL PLAY <i></i> BUILD 02</span></footer>';
  function navHeader(title,subtitle){return `<header class="select-header"><button class="menu-back" data-cmd="back" aria-label="Kembali">← <span>BACK</span></button><div><span class="eyebrow">${subtitle}</span><h1>${title}</h1></div>${brand}</header>`;}
  function fighterPanel(id,side){const f=info(id);return `<div class="fighter-plinth ${side} ${f?'':'unknown'} ${soon(id)?'soon':''}"><div class="plinth-light"></div><span class="side-tag">${side==='player'?'P1 / YOUR FIGHTER':'CPU / YOUR RIVAL'}</span><img class="selection-art" src="${f?.art||'assets/menu/locked.svg'}" alt="${f?.name||'Karakter belum dipilih'}"><div class="fighter-copy"><span>${f?.tag||'AWAITING CHALLENGER'}</span><h2>${f?.name||'???'}</h2><p>${f?.race||'ROSTER EXPANDING'}</p><small>${f?.detail||'A new challenger is on the way.'}</small></div></div>`;}
  function render(){
    if(lockIn){clearTimeout(lockIn);lockIn=null;}for(const t of lockTicks)clearTimeout(t);lockTicks=[];
    if(backgroundVideo){videoPlayToken++;backgroundVideo.pause();backgroundVideo.remove();}
    root.dataset.screen=screen;root.dataset.step=String(step);root.dataset.mode=mode;
    if(screen==='home'){
      root.innerHTML=`<div class="home-art video-backed"></div><div class="menu-grain"></div><header class="home-top"><span></span><span class="home-top-right"><span class="build-tag">FIGHTING DEMO / VOL. 02</span>${canFullscreen?`<button class="menu-fullscreen${fullscreenHint?' hinted':''}" data-cmd="fullscreen" aria-label="Layar penuh" title="Layar penuh"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>`:''}</span></header><div class="home-content"><div class="home-title"><h1>AETHER<br><em>CLASH</em><i>✦</i></h1><p>Two factions. One arena.</p></div><nav class="home-nav" aria-label="Main menu"><button data-cmd="versus"><span class="nav-index">01</span><span>VS COMPUTER<small>Choose your rival. Claim the arena.</small></span><b>↗</b></button><button data-cmd="training"><span class="nav-index">02</span><span>TRAINING<small>Learn your fighter. Refine your combo.</small></span><b>↗</b></button><button data-cmd="settings"><span class="nav-index">03</span><span>PENGATURAN</span><b>↗</b></button><button data-cmd="about"><span class="nav-index">04</span><span>ABOUT</span><b>↗</b></button></nav></div><div class="home-caption"><span>MECHA</span><i>VS</i><span>DEMI-HUMAN</span><small>TECHNOLOGY MEETS INSTINCT</small></div><footer class="home-footer"><span></span><span id="menu-ready">${game.snapshot().ready?'READY TO FIGHT':'PREPARING ARENA…'}</span></footer>`;
    } else if(screen==='select'){
      root.innerHTML=`<div class="selection-backdrop"></div>${navHeader(step===0?'SELECT YOUR FIGHTER':'SELECT YOUR RIVAL',mode==='versus'?'VERSUS COMPUTER':'TRAINING ROOM')}<div class="selection-steps"><span class="${step===0?'current':'done'}">01 <b>PLAYER</b></span><i></i><span class="${step===1?'current':''}">02 <b>RIVAL</b></span><i></i><span>03 <b>ARENA</b></span></div><div class="select-stage"><div id="player-preview">${fighterPanel(step===0?hover:player,'player')}</div><div class="roster-center"><div class="roster-caption"><strong>${step===0?'PLAYER 1':'COMPUTER'}</strong><span>CHOOSE A FIGHTER</span></div><div class="roster-grid" role="group" aria-label="Roster karakter">${roster.map((id,i)=>{const f=info(id);return `<button class="roster-tile ${id===hover?'highlight':''} ${!f?'locked':''} ${soon(id)?'soon':''}" data-fighter="${id}" aria-label="${f?f.name+' — '+f.race+(soon(id)?', belum bisa dimainkan':''):'Slot '+(i+1)+' terkunci'}" aria-disabled="${!fighters[id]}"><img class="${f?'portrait-image':''}" data-portrait-side="${step===1?'enemy':'player'}" src="${f?.portrait||'assets/menu/locked.svg'}" alt=""><span>${f?.name||'LOCKED'}</span><b>${step===1&&id===player?'P1':''}</b></button>`;}).join('')}</div><div id="fighter-moves" class="fighter-moves"></div><button class="menu-primary confirm-fighter" data-cmd="confirm">${step===0?'CONFIRM FIGHTER':'CONFIRM RIVAL'} <b>→</b></button><p id="roster-notice" class="roster-notice" aria-live="polite">${roster.length>opened.length?(roster.length-opened.length)+' challenger slots reserved.':''}</p></div><div id="enemy-preview">${fighterPanel(step===1?hover:null,'enemy')}</div></div>${footer()}`;
      updatePreview(false);
    } else if(screen==='arena'){
      const st=MatchRules.stages[stage];root.innerHTML=`<div class="arena-screen-bg" style="background-image:url('${st.image}')"></div>${navHeader('SET THE STAGE',mode==='versus'?'VERSUS COMPUTER / MATCH SETUP':'TRAINING / ARENA SETUP')}<div class="arena-content"><div class="versus-strip"><div><img class="portrait-image" data-portrait-side="player" src="${fighters[player].portrait}" alt=""><span>P1<strong>${fighters[player].name}</strong></span></div><b>VS</b><div><span>CPU<strong>${fighters[enemy].name}</strong></span><img class="portrait-image" data-portrait-side="enemy" src="${fighters[enemy].portrait}" alt=""></div></div><div class="arena-window"><span class="arena-number">${String(Object.keys(MatchRules.stages).indexOf(stage)+1).padStart(2,'0')} / ${String(Object.keys(MatchRules.stages).length).padStart(2,'0')}</span><div><small>${st.tag}</small><h2>${st.name}</h2></div><span class="arena-day">✦ ${st.time||'SUNNY DAYLIGHT'}</span></div><div class="arena-tiles" role="group" aria-label="Pilih arena">${Object.entries(MatchRules.stages).map(([id,a])=>`<button class="arena-tile ${id===stage?'selected':''}" data-stage="${id}" aria-pressed="${id===stage}"><img src="${a.image}" alt=""><span>${a.name}</span></button>`).join('')}</div><div class="match-options"><div class="difficulty-area"><span class="eyebrow">${mode==='versus'?'CPU DIFFICULTY':'PRACTICE MODE'}</span>${mode==='versus'?`<div class="difficulty-buttons" role="group" aria-label="Tingkat kesulitan">${Object.entries(MatchRules.difficulties).map(([id,d],i)=>`<button data-level="${id}" class="${id===level?'selected':''}" aria-pressed="${id===level}"><i>${'▰'.repeat(i+1)}</i>${d.label}</button>`).join('')}</div>`:'<p class="training-note">Unlimited time · Passive rival · Reset anytime</p>'}</div><div class="match-rules">${mode==='versus'?'<b>FIRST TO 2 WINS</b><span>BEST OF 3 ROUNDS · 90 SECONDS</span>':'<b>MAKE EVERY HIT COUNT</b><span>COMBO TRACKER · FULL MOVE SET</span>'}</div></div><button class="menu-primary start-battle" data-cmd="start" ${game.snapshot().ready?'':'disabled'}>${game.snapshot().ready?(mode==='versus'?'LET’S FIGHT':'ENTER TRAINING'):'PREPARING ARENA…'} <b>↗</b></button><p id="setup-error" role="status"></p></div>${footer()}`;
    } else if(screen==='about'){
      root.innerHTML=`<div class="home-art dim"></div>${navHeader('ABOUT AETHER CLASH','MECHA VS DEMI-HUMAN')}<article class="about-panel"><span class="eyebrow">CHRONICLES OF AETHER</span><h2>Steel meets<br><em>the untamed.</em></h2><p>Di dunia Renaisans yang ditenagai aether, dua faksi bertemu di arena: Mecha dengan rekayasa tubuh dan mesin, serta Demi-Human dengan kekuatan manusia dan hewan. Para petarung membawa asal-usul, kemampuan, dan tujuan mereka sendiri.</p><div class="about-fighters"><p><b>MECHA</b><span>Perpaduan manusia dan teknologi. Rekayasa mekanis, persenjataan aether, dan teknik bertarung yang beragam.</span></p><p><b>DEMI-HUMAN</b><span>Perpaduan manusia dan hewan. Setiap ras memiliki anatomi, naluri, dan kekuatan khasnya sendiri.</span></p></div><div class="about-stats"><span><b>02</b>FACTIONS</span><span><b>12</b>ROSTER SLOTS</span><span><b>∞</b>RIVALRIES</span></div><small>Visuals · Higgsfield &nbsp; Voices · ElevenLabs &nbsp; Typography · Rajdhani<br>Local fighting demo · Single player</small><button class="menu-primary" data-cmd="home">BACK TO MAIN MENU <b>↗</b></button></article>`;
    } else if(screen==='result'){
      const won=result.winner==='player',winner=won?result.player:result.enemy;root.innerHTML=`<div class="result-bg"></div>${navHeader('MATCH COMPLETE',MatchRules.stages[result.stage].name.toUpperCase())}<div class="result-layout"><img class="result-fighter" src="${fighters[winner].art}" alt="${fighters[winner].name}"><div class="result-copy"><span class="eyebrow">${won?'PLAYER 1':'COMPUTER'} TAKES THE MATCH</span><h1>${won?'VICTORY':'DEFEAT'}</h1><p>${fighters[winner].name} WINS</p><div class="final-score"><span>${result.playerWins}</span><i>—</i><span>${result.enemyWins}</span></div><small>${fighters[result.player].name} vs ${fighters[result.enemy].name} · ${MatchRules.difficulties[result.level].label}</small><button class="menu-primary" data-cmd="rematch">REMATCH <b>↗</b></button><button class="result-secondary" data-cmd="reselect">CHARACTER SELECT</button><button class="result-secondary" data-cmd="home">MAIN MENU</button></div></div>`;
    }
    bind();attachBackground();
  }
  function updatePreview(play=true){
    root.querySelectorAll('[data-fighter]').forEach(b=>b.classList.toggle('highlight',b.dataset.fighter===hover));
    const panel=root.querySelector(step===0?'#player-preview':'#enemy-preview');if(panel)panel.innerHTML=fighterPanel(hover,step===0?'player':'enemy');
    const f=info(hover),moves=root.querySelector('#fighter-moves');if(moves)moves.innerHTML=f?`<span>${f.style}</span>${soon(hover)?'':`<b>${f.ultimate}</b>`}`:'<span>NEW CHALLENGER</span><b>COMING LATER</b>';
    const confirm=root.querySelector('.confirm-fighter');if(confirm)confirm.setAttribute('aria-disabled',String(!fighters[hover]));if(play)sfx('move');
  }
  function focusFighter(id){if(hover===id||lockIn)return;hover=id;updatePreview();}
  function confirm(){if(lockIn)return;if(!fighters[hover]){sfx('locked',true);root.querySelector('#roster-notice').textContent=soon(hover)?showcase[hover].name+' belum bisa dimainkan.':'Karakter ini belum terbuka.';return;}
    // The pick flashes 3 times (tile and big art) with a lock-in chime before the next step, so the screen does not jump.
    sfx('pick',true);game.announceSelection(hover);root.dataset.picking='true';
    root.querySelector(`[data-fighter="${hover}"]`)?.classList.add('picked');root.querySelector(step===0?'#player-preview':'#enemy-preview')?.classList.add('picked');
    lockTicks=[1,2].map(i=>setTimeout(()=>sfx('blink',true),i*PICK_FLASH*1000));
    lockIn=setTimeout(()=>{lockIn=null;delete root.dataset.picking;if(step===0){player=hover;step=1;hover=player==='arco'?'fenr':'arco';}else{enemy=hover;screen='arena';step=2;}render();},3*PICK_FLASH*1000);
  }
  function back(){if(lockIn)return;game.stopAnnouncer();sfx('back',true);if(screen==='arena'){screen='select';step=1;hover=enemy;}else if(screen==='select'&&step===1){step=0;hover=player;}else screen='home';render();}
  function start(){if(game.startMatch({player,enemy,stage,level,mode})){document.querySelector('#arena').focus();}else {const error=root.querySelector('#setup-error');if(error)error.textContent='Aset belum siap. Tunggu sebentar lalu coba lagi.';sfx('locked',true);}}
  function command(cmd){
    if(lockIn)return;
    if(cmd==='fullscreen'){sfx('move',true);dismissFullscreenHint();game.toggleFullscreen?.();return;}
    if(cmd==='confirm'){confirm();return;}if(cmd==='back'){back();return;}sfx('confirm',true);
    if(cmd==='versus'||cmd==='training'){mode=cmd;screen='select';step=0;hover=player;render();}
    if(cmd==='settings')game.openSettings();if(cmd==='about'){screen='about';render();}
    if(cmd==='home'){game.stopAnnouncer();screen='home';render();}if(cmd==='start')start();
    if(cmd==='rematch'){({player,enemy,stage,level,mode}=result);start();}
    if(cmd==='reselect'){screen='select';step=0;hover=player;render();}
  }
  function bind(){
    root.querySelectorAll('[data-cmd]').forEach(b=>{b.onclick=()=>command(b.dataset.cmd);b.onpointerenter=()=>sfx('move');b.onfocus=()=>sfx('move');});
    root.querySelectorAll('[data-fighter]').forEach(b=>{b.onpointerenter=()=>focusFighter(b.dataset.fighter);b.onfocus=()=>focusFighter(b.dataset.fighter);b.onclick=()=>{focusFighter(b.dataset.fighter);if(!touch)confirm();};});
    root.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage;sfx('move',true);render();root.querySelector(`[data-stage="${stage}"]`).focus();});
    root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;sfx('move',true);render();root.querySelector(`[data-level="${level}"]`).focus();});
  }
  document.addEventListener('keydown',e=>{
    if(root.hidden||document.querySelector('dialog[open]')||e.repeat)return;interacted=true;
    if(lockIn){e.preventDefault();return;}
    if(e.key==='Escape'){e.preventDefault();back();return;}
    if(screen==='select'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){e.preventDefault();const offset={ArrowLeft:-1,a:-1,ArrowRight:1,d:1,ArrowUp:-4,w:-4,ArrowDown:4,s:4}[e.key],i=(roster.indexOf(hover)+offset+roster.length)%roster.length;focusFighter(roster[i]);root.querySelector(`[data-fighter="${hover}"]`).focus();return;}
    if(screen==='select'&&(e.key==='Enter'||e.key===' ')){const cmd=e.target.closest?.('[data-cmd]')?.dataset.cmd;if(cmd&&cmd!=='confirm')return;e.preventDefault();confirm();return;}
    if(screen==='arena'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){
      e.preventDefault();const levels=Object.keys(MatchRules.difficulties),stages=Object.keys(MatchRules.stages),vertical=['ArrowUp','ArrowDown','w','s'].includes(e.key),backward=['ArrowLeft','ArrowUp','a','w'].includes(e.key);
      if(vertical&&mode==='versus'){level=levels[(levels.indexOf(level)+(backward?-1:1)+levels.length)%levels.length];}else{stage=stages[(stages.indexOf(stage)+(backward?-1:1)+stages.length)%stages.length];}sfx('move');render();return;
    }
    if(screen==='arena'&&e.key==='Enter'&&!e.target.closest?.('button')){e.preventDefault();command('start');return;}
    if(screen==='home'&&e.key==='Enter'&&!e.target.closest?.('button')){e.preventDefault();command('versus');return;}
    if(screen==='home'&&['ArrowUp','ArrowDown','w','s'].includes(e.key)){e.preventDefault();const list=[...root.querySelectorAll('.home-nav button')],current=list.indexOf(document.activeElement),next=(current+(['ArrowUp','w'].includes(e.key)?-1:1)+list.length)%list.length;list[next].focus();}
  });
  window.FrontEnd={syncBackground,home(){screen='home';game.setMenuOpen(true);render();},showResult(data){result=data;({player,enemy,stage,level,mode}=data);screen='result';game.setMenuOpen(true);render();},assetsReady(ok=true){if(game.snapshot().menuOpen){render();if(!ok){const status=root.querySelector('#menu-ready');if(status)status.textContent='ASSET ERROR · RELOAD REQUIRED';}}}};
  // First paint after the loading screen's download, so menu pictures come straight from the cache.
  Promise.resolve(window.AETHER_PRELOAD).then(render);
})();
