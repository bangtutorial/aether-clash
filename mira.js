/* Shared MIRA moves (pilot girl + lilac robot): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, rockets:12, rocketDamage:4, basicRefund:.05 };
  const names = ['MITTEN CHAIN','STAR POPPER','CANDY CRASH','ROCKET PARADE'];
  // Reach follows the measured fist emitters of the 182 px atlas (assets/mira/emitters.json): jab 98, hook 80, hammer 56 px.
  const combo = [
    {damage:6,knockback:75,reach:100,duration:.36,hitAt:.5},
    {damage:8,knockback:100,reach:85,duration:.42,hitAt:.5},
    {damage:12,knockback:180,reach:82,duration:.52,hitAt:.55}
  ];
  // Rocket Parade timeline (seconds from cast). Launches stream from alternating pods; impacts ripple 0.032 s
  // apart so all 12 land inside one hurt window (player invulnerability only starts after hurt ends).
  const parade = { cutinDuration:.78, launchStart:.40, launchGap:.05, impactStart:1.40, impactGap:.032, duration:2.3 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    if(name==='skill1')return {name,type:name,damage:16,duration:.48,knockback:140,projectile:true,speed:760,hitAt:.5};
    if(name==='skill2')return {name,type:name,damage:24,duration:.68,knockback:220,reach:128,dash:240,hitAt:.56};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Mira={balance,names,combo,parade,move,start,refund};
})();
