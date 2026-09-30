/* Shared CORA moves (raven demi-human sky dancer): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, passDamage:16, basicRefund:.05 };
  const names = ['FEATHER WALTZ','QUILL VOLLEY','WING GUST','NIGHT MURMURATION'];
  // Reach follows the measured blade emitters of the 184 px atlas (assets/cora/emitters.json): slash 87, rising 68, cross 115 px.
  const combo = [
    {damage:6,knockback:75,reach:90,duration:.34,hitAt:.5},
    {damage:8,knockback:100,reach:78,duration:.40,hitAt:.5},
    {damage:12,knockback:180,reach:115,duration:.50,hitAt:.55}
  ];
  // Night Murmuration: three raven passes sweep across the arena in the cast direction at three heights,
  // 16 damage each (48 total). Passes 0.3 s apart stay inside one hurt window; a jump can clear the lowest pass.
  const murmuration = { cutinDuration:.78, passStart:[.55,.85,1.15], passHeights:[-70,-112,-150], speed:1500, ravens:10, spacing:40, duration:2.4 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    // Quill Volley: three feathers in a narrow fan, 5+5+6 = 16 like other I skills.
    if(name==='skill1')return {name,type:name,damage:16,duration:.46,knockback:60,projectile:true,speed:840,feathers:[5,5,6],spread:.1,hitAt:.5};
    // Wing Gust: forward area out to the far edge of the gust sprite (see coraStrike), no dash.
    if(name==='skill2')return {name,type:name,damage:24,duration:.62,knockback:300,reach:190,area:true,hitAt:.55};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Cora={balance,names,combo,murmuration,move,start,refund};
})();
