/* Shared NIB moves (mouse demi-human courier, twin batons): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, planeDamage:16, basicRefund:.05 };
  const names = ['BATON FLURRY','EXPRESS LETTER','ROOFTOP SLIP','SPECIAL DELIVERY'];
  // The fastest chain in the roster with the shortest reach (baton tips measured at 107/80/101 px in emitters.json);
  // small knockback keeps him close.
  const combo = [
    {damage:6,knockback:55,reach:95,duration:.3,hitAt:.5},
    {damage:8,knockback:75,reach:75,duration:.34,hitAt:.5},
    {damage:12,knockback:170,reach:95,duration:.46,hitAt:.55}
  ];
  // Express Letter: the fastest projectile in the roster, but it only flies `range` px.
  const letter = { speed:1100, range:400 };
  // Rooftop Slip: a very fast low dash strike; when it connects NIB slips past the rival and turns to face them.
  const slip = { dash:650, behind:70 };
  // Special Delivery: three paper-plane parcels leave the satchel 0.38 s apart (inside the 0.42 s hurt stun) and home
  // in on the rival at `speed` px/s, turning at most `turn` rad/s. Each hits once for 16 (48). A late sidestep or jump
  // makes a plane overshoot, and it gives up after `life` s.
  const delivery = { cutinDuration:.78, releases:[.8,1.18,1.56], speed:620, turn:3.2, life:2.2, size:96, duration:2.6 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.45,knockback:110,projectile:true,speed:letter.speed,range:letter.range,hitAt:.55};
    if(name==='skill2')return {name,type:name,damage:24,duration:.6,knockback:160,reach:100,dash:slip.dash,slip:true,hitAt:.45};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Nib={balance,names,combo,letter,slip,delivery,move,start,refund};
})();
