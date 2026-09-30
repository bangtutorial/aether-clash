/* Shared NAJA moves (cobra demi-human, urumi whip-sword): player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { cooldowns:{skill1:3,skill2:6,ultimate:18}, castTime:.5, biteDamage:16, basicRefund:.05 };
  const names = ['VIPER LASH','SAND FANG','URUMI CYCLONE','DUNE SERPENT'];
  // The urumi gives NAJA the longest basic reach in the roster (tips measured at 161/161/196 px; the hit reach sits
  // inside the tip); the chain is a touch slower to compensate.
  const combo = [
    {damage:6,knockback:75,reach:135,duration:.38,hitAt:.5},
    {damage:8,knockback:100,reach:130,duration:.44,hitAt:.5},
    {damage:12,knockback:180,reach:160,duration:.56,hitAt:.55}
  ];
  // Dune Serpent: a sand ripple leaves her palm at `follow` s, chases the rival at `speed` px/s (faster than a run) and
  // locks `telegraph` s before each strike, then a giant sand cobra erupts there. Three strikes x 16 (48). The column
  // is too tall to jump; stepping out of the locked ripple dodges it. A rival more than ~800 px away escapes the first bite.
  const serpent = { cutinDuration:.78, strikes:[1.25,1.65,2.05], follow:.1, speed:900, telegraph:.42, radius:70, height:240, rise:.45, duration:2.7 };
  function move(name,index=1) {
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,...combo[index-1]};
    // Sand Fang: a low sand wave along the floor, 16 like other I skills. Any small jump clears it.
    if(name==='skill1')return {name,type:name,damage:16,duration:.5,knockback:120,projectile:true,ground:true,speed:620,hitAt:.55};
    // Urumi Cyclone: the blade spins all the way around her and hits in front and behind.
    if(name==='skill2')return {name,type:name,damage:24,duration:.66,knockback:260,reach:150,area:true,around:true,hitAt:.55};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack'&&a.cooldowns[name]>0)return false;
    if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(name,index),t:0,fired:false,queued:0};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*balance.basicRefund);}
  window.Naja={balance,names,combo,serpent,move,start,refund};
})();
