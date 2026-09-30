/* Shared RHEA moves (teen orrery scholar mecha, spheres on jointed arms): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, planetDamage:16, basicRefund:.05 };
  const names = ['ORBIT STRIKE','PLANET DRIFT','GRAVITY WELL','GRAND ORRERY'];
  // The spheres swing out on their jointed arms; reach sits inside the measured spheres (109/80/128 px in emitters.json).
  const combo = [
    {damage:6,knockback:75,reach:100,duration:.38,hitAt:.5},
    {damage:8,knockback:100,reach:85,duration:.44,hitAt:.5},
    {damage:12,knockback:190,reach:115,duration:.56,hitAt:.55}
  ];
  // Planet Drift: a slow little planet that crosses the whole arena at chest height. Slow enough to walk behind and
  // control space with (a zoner's tool); a jump clears it.
  const drift = { speed:380, life:3.2 };
  // Gravity Well: a vortex opens `at` px ahead and collapses after `fuse` s, hitting everything within `radius` px
  // of its centre. It is a mid-range tool: a rival hugging RHEA is outside it.
  const well = { at:230, fuse:.3, radius:95 };
  // Grand Orrery: three giant planets are released 0.38 s apart (inside the 0.42 s hurt stun). Each makes one lap
  // around RHEA on an ellipse (rx x ry px) in `lap` s and hits once. A rival inside the orbit takes all three (48),
  // front or back; stepping out past the orbit (about 260 px) dodges them.
  const orrery = { cutinDuration:.78, releases:[.8,1.18,1.56], lap:.9, rx:230, ry:70, size:120, duration:2.6 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.5,knockback:130,projectile:true,speed:drift.speed,hitAt:.55};
    if(name==='skill2')return {name,type:name,damage:24,duration:.62,knockback:220,reach:well.at+well.radius,well:true,hitAt:.55};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Rhea={balance,names,combo,drift,well,orrery,move,start,refund};
})();
