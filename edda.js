/* Shared EDDA moves (tortoise demi-human sage, staff and shell guard): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, stompDamage:16, basicRefund:.05 };
  const names = ['STAFF FORMS','STONE SKIP','SHELL COUNTER','ELDER TORTOISE'];
  // A steady staff chain (reach inside the measured staff tip 126/111/82 px); the old sage is not in a hurry.
  const combo = [
    {damage:6,knockback:80,reach:110,duration:.4,hitAt:.5},
    {damage:8,knockback:105,reach:95,duration:.46,hitAt:.5},
    {damage:12,knockback:210,reach:80,duration:.58,hitAt:.58}
  ];
  // Stone Skip: a flat jade stone flicked low (60 px up) and skipped along the floor. It hops `bounces` more times (each hop `hop` px/s up) before
  // it sinks, so it stays low: a jump clears it.
  const stone = { speed:520, rise:120, gravity:1600, bounces:2, hop:300 };
  // Shell Counter: EDDA ducks into her shell for `window` s. The first hit that reaches her in that window is ignored and
  // answered with a staff counter on the attacker if they are within `reach` px (projectiles are simply blocked).
  const counter = { window:.55, reach:170, damage:24, knockback:260 };
  // Elder Tortoise: a giant jade tortoise spirit rises `ahead` px in front of EDDA and lumbers forward (`speed` px/s),
  // stomping three times 0.38 s apart (inside the 0.42 s hurt stun). Each stomp hits a rival on the floor within
  // `half` px of the spirit (16 each, 48). A jump at the stomp avoids it; so does keeping away.
  const tortoise = { cutinDuration:.78, stomps:[.8,1.18,1.56], appear:.6, ahead:140, speed:120, half:150, size:300, duration:2.3 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.5,knockback:110,projectile:true,speed:stone.speed,range:600,hitAt:.55};
    if(name==='skill2')return {name,type:name,damage:0,duration:.7,knockback:0,reach:counter.reach,guard:true,guardEnd:counter.window,hitAt:.99};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Edda={balance,names,combo,stone,counter,tortoise,move,start,refund};
})();
