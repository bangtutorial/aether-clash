/* Shared ZANNI moves (clockwork jester mecha, scissor-lattice arms and bladed rings): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, finaleDamage:16, basicRefund:.05 };
  const names = ['SCISSOR JAB','RING TOSS','SPRING SNATCH','GRAND FINALE'];
  // The telescoping arms give a long, quick chain (tips measured at 144/110/161 px in emitters.json); the hits are the
  // standard 6/8/12, with a little less knockback than a sword so the long reach does not push rivals out of the chain.
  const combo = [
    {damage:6,knockback:70,reach:125,duration:.36,hitAt:.5},
    {damage:8,knockback:95,reach:100,duration:.42,hitAt:.5},
    {damage:12,knockback:190,reach:140,duration:.54,hitAt:.55}
  ];
  // Ring Toss: a bladed ring flies out `range` px, turns and comes back to ZANNI's hand. It hits once, on the way out or
  // on the way back, so a rival who jumps the outgoing ring still has to watch the return.
  const ring = { speed:820, range:430 };
  // Grand Finale: three giant rings flung forward 0.38 s apart (inside the 0.42 s hurt stun), each flies to the arena edge
  // and boomerangs back to ZANNI. One 16-damage hit per ring (48). A rival behind ZANNI at the throw is safe; a jump
  // clears a ring (they fly at chest height), but a jumped ring can still hit on its way back.
  const finale = { cutinDuration:.78, throws:[.8,1.18,1.56], speed:980, size:150, duration:2.3 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.5,knockback:120,projectile:true,boomerang:true,speed:ring.speed,range:ring.range,hitAt:.5};
    // Spring Snatch: the scissor arm shoots out 200 px (the hand is measured at 207 px) and yanks the rival back in front
    // of ZANNI (`pull` px), ready for a jab. Close rivals are grabbed as well.
    if(name==='skill2')return {name,type:name,damage:24,duration:.7,knockback:0,reach:200,pull:95,hitAt:.5};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Zanni={balance,names,combo,ring,finale,move,start,refund};
})();
