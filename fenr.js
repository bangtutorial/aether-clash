/* Shared FENR moves and transformation state: player and AI use the same rules. */
(() => {
  'use strict';
  const balance = { duration:12, ultimateCooldown:24, castTime:.62, cooldowns:{skill1:3,skill2:6,ultimate:24} };
  const kits = {
    human:{names:['RANGER CHAIN','GALE CLAW','RANGER RUSH','FERAL AWAKENING'],combo:[6,8,12],reach:[96,108,130],skill1:16,skill2:24},
    wolf:{names:['SAVAGE CHAIN','FANG POUNCE','MOON HOWL','FERAL AWAKENING'],combo:[7,9,13],reach:[116,130,145],skill1:18,skill2:22}
  };
  function reset(a) {Object.assign(a,{form:'human',formTime:0,transformPending:0,transformElapsed:99,formChanges:0});}
  function begin(a) {
    if(a.form==='wolf'||a.transformPending>0||a.cooldowns.ultimate>0)return false;
    a.transformPending=balance.castTime;a.transformElapsed=0;return true;
  }
  function end(a) {a.form='human';a.formTime=0;a.transformPending=0;a.formChanges++;a.cooldowns.ultimate=balance.ultimateCooldown;a.action=null;}
  function advance(a,dt,alive=true) {
    a.transformElapsed+=dt;
    if(!alive) {if(a.form==='wolf'||a.transformPending>0)end(a);return;}
    if(a.transformPending>0) {
      a.transformPending=Math.max(0,a.transformPending-dt);
      if(a.transformPending<=1e-8) {a.transformPending=0;a.form='wolf';a.formTime=balance.duration;a.formChanges++;}
    } else if(a.form==='wolf') {a.formTime=Math.max(0,a.formTime-dt);if(a.formTime<=1e-8)end(a);}
  }
  function move(a,name,index=1) {
    const wolf=a.form==='wolf',kit=kits[wolf?'wolf':'human'];
    if(name==='attack')return {name:`attack${index}`,type:'attack',index,damage:kit.combo[index-1],reach:kit.reach[index-1],duration:[.38,.44,.55][index-1],knockback:80+index*25,fx:wolf?'bite':'claw',hitAt:.5};
    if(name==='skill1')return {name,type:name,damage:kit.skill1,reach:wolf?175:600,duration:wolf?.66:.48,knockback:150,fx:wolf?'bite':'gale',projectile:!wolf,dash:wolf?230:0,hitAt:wolf?.58:.5};
    if(name==='skill2')return {name,type:name,damage:kit.skill2,reach:wolf?205:155,duration:wolf?.85:.68,knockback:190,fx:wolf?'howl':'rush',area:wolf,dash:wolf?0:190,hitAt:.56};
    return {name:'ultimate',type:'ultimate',duration:balance.castTime,damage:0,hitAt:1};
  }
  function start(a,name,index=1) {
    if(a.action||a.transformPending>0||a.state==='hurt'||a.state==='down'||a.state==='recover')return false;
    if(name!=='attack' && (a.cooldowns[name]>0 || (name==='ultimate'&&a.form==='wolf')))return false;
    if(name==='ultimate') {if(!begin(a))return false;} else if(name!=='attack')a.cooldowns[name]=balance.cooldowns[name];
    a.action={...move(a,name,index),t:0,fired:false,queued:0,form:a.form};a.state=a.action.name;a.stateTime=0;return true;
  }
  function refund(a) {for(const name of Object.keys(balance.cooldowns))a.cooldowns[name]=Math.max(0,a.cooldowns[name]-balance.cooldowns[name]*.05);}
  window.Fenr={balance,kits,reset,begin,end,advance,move,start,refund};
})();
