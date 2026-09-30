/* Shared HALDOR moves (forge-master mecha, anvil hammer): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, quakeDamage:16, basicRefund:.05 };
  const names = ['FORGE CHAIN','SLAG SHOT','STEAM RAM','FORGE QUAKE'];
  // The heavy tank: the slowest chain in the roster, with the biggest knockback on every link. Reach follows the measured
  // hammer head (131 px hook, 83 px uppercut, 85 px floor smash in emitters.json): short range, heavy hits.
  const combo = [
    {damage:6,knockback:95,reach:112,duration:.42,hitAt:.5},
    {damage:8,knockback:125,reach:90,duration:.48,hitAt:.5},
    {damage:12,knockback:235,reach:95,duration:.62,hitAt:.58}
  ];
  // Slag Shot: a molten slag ball lobbed in an arc that lands where the rival stood at the throw (180-560 px),
  // hitting on contact in flight or with a small splash where it lands. Stepping away after the throw dodges it.
  const slag = { flight:.9, rise:520, minRange:180, maxRange:560, splash:72 };
  // Forge Quake: three hammer slams; each sends a molten shockwave along the floor both ways from the crater.
  // One 16-damage hit per wave (48). Slams are 0.38 s apart, inside the 0.42 s hurt stun, so a standing rival takes all
  // three. One jump (0.57 s airtime) clears two waves; jump + double jump clears all three.
  const quake = { cutinDuration:.78, slams:[.8,1.18,1.56], speed:760, duration:2.2 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.56,knockback:150,projectile:true,lob:true,speed:(slag.minRange+slag.maxRange)/2/slag.flight,hitAt:.55};
    // Steam Ram: a piston-boosted shoulder charge; the biggest knockback in his kit.
    if(name==='skill2')return {name,type:name,damage:24,duration:.7,knockback:320,reach:118,dash:340,hitAt:.6};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Haldor={balance,names,combo,slag,quake,move,start,refund};
})();
