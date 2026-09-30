/* Grady is the locked system announcer. One serialized speaker, never overlapping cues. */
(() => {
  'use strict';
  function create({clips,canPlay,isPaused,onStart=()=>{},onActivity=()=>{}}){
    const bank={},failed=new Set();let queue=[],active=null,serial=0,playToken=0,starts=0,lastCue='',error='',volume=.45,muted=false;
    function mix(){for(const media of Object.values(bank)){media.volume=Math.max(0,Math.min(1,volume*1.25));media.muted=muted;}onActivity();}
    function clear(){serial++;playToken++;queue=[];if(active){active.media.pause();try{active.media.currentTime=0;}catch(_){}}active=null;onActivity();}
    function finish(){if(active)active.media.pause();active=null;playToken++;next();}
    function next(){
      if(active)return;
      const key=queue.shift();if(!key){onActivity();return;}
      if(failed.has(key)){next();return;}
      const media=bank[key];active={key,media,elapsed:0,serial:++serial};lastCue=key;starts++;error='';try{media.currentTime=0;}catch(_){}
      onStart();mix();sync();
    }
    function sync(){
      if(!active)return;
      const entry=active;
      if(!canPlay()||isPaused()){playToken++;entry.media.pause();onActivity();return;}
      if(!entry.media.paused)return;
      const token=++playToken;
      try{const p=entry.media.play();p?.catch(e=>{if(active!==entry||token!==playToken)return;error=e?.name||'audio-playback-failed';finish();});}
      catch(e){if(active===entry&&token===playToken){error=e?.name||'audio-playback-failed';finish();}}
    }
    for(const [key,clip] of Object.entries(clips)){
      try{
        const media=new Audio();bank[key]=media;media.preload='auto';
        media.addEventListener('ended',()=>{if(active?.media===media)finish();});
        media.addEventListener('error',()=>{failed.add(key);if(active?.media===media){error='audio-load-failed';finish();}});
        media.addEventListener('playing',()=>{if(active?.media!==media||!canPlay()||isPaused()){media.pause();return;}mix();});
        media.src=clip.file;media.load();
      }catch(_){failed.add(key);}
    }
    return {
      play(keys,{replace=true}={}){
        if(!canPlay())return false;
        const valid=(Array.isArray(keys)?keys:[keys]).filter(k=>Object.hasOwn(bank,k)&&!failed.has(k));
        if(!valid.length)return false;if(replace)clear();queue.push(...valid);queue=queue.slice(0,4);next();return true;
      },
      clear,sync,setMix(v,m){volume=v;muted=m;for(const media of Object.values(bank)){media.volume=Math.max(0,Math.min(1,v*1.25));media.muted=m;}},
      tick(dt){if(!active||!canPlay()||isPaused())return;active.elapsed+=dt;const duration=clips[active.key].duration||3;if(active.elapsed>duration+.4)finish();},
      get busy(){return !!active||queue.length>0;},
      get speaking(){return !!active&&!active.media.paused;},
      snapshot(){return {voice:'Grady',cue:active?.key||'',lastCue,active:!!active,paused:active?.media.paused??true,time:active?.media.currentTime||0,readyState:active?.media.readyState||0,starts,error,queue:[...queue]};}
    };
  }
  window.SystemAnnouncer={create};
})();
