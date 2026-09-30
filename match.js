/* Deterministic first-to-two round rules; announcer cue names are ready for audio. */
(() => {
  const difficulties={
    // CPU brain knobs (game.js): reaction = delay before it reads the player; evade/punish/antiAir/ender = odds of
    // dodging a shot or startup, punishing recovery, anti-airing a jump, finishing a confirmed chain with a skill;
    // mistakes = odds of attacking into immunity or chaining blindly; wake = extra delay after being hit;
    // immunity = CPU post-hurt immunity in versus (the player always gets 0.9 s; Hard/Excellent use the same rule);
    // comboCap = hits in one continuous stun before that immunity starts early (stops re-started chain loops).
    easy:{label:'Easy',speed:.95,recovery:.6,reaction:.34,combo:2,skillEvery:2,ultimateAfter:10,aggression:.6,evade:.25,punish:.3,antiAir:.25,ender:.15,mistakes:.22,wake:.22,immunity:.45,comboCap:6},
    medium:{label:'Medium',speed:1.1,recovery:.38,reaction:.2,combo:3,skillEvery:1,ultimateAfter:7,aggression:.8,evade:.55,punish:.6,antiAir:.55,ender:.5,mistakes:.08,wake:.12,immunity:.9,comboCap:5},
    hard:{label:'Hard',speed:1.22,recovery:.22,reaction:.13,combo:3,skillEvery:1,ultimateAfter:5,aggression:.9,evade:.78,punish:.82,antiAir:.78,ender:.85,mistakes:.03,wake:.06,immunity:.9,comboCap:4},
    excellent:{label:'Excellent',speed:1.32,recovery:.12,reaction:.08,combo:3,skillEvery:1,ultimateAfter:3.5,aggression:.97,evade:.92,punish:.95,antiAir:.9,ender:1,mistakes:0,wake:.02,immunity:.9,comboCap:4}
  };
  const stages={
    bellora:{name:'Bellora Courtyard',short:'BELLORA',subtitle:'COURTYARD',image:'assets/stage.webp',groundY:599,tag:'The city of aether',time:'SUNNY DAYLIGHT'},
    sunspire:{name:'Sunspire Terrace',short:'SUNSPIRE',subtitle:'TERRACE',image:'assets/menu/sunspire.webp',groundY:599,tag:'Above the kingdom',time:'SUNNY DAYLIGHT'},
    harbor:{name:'Azure Harbor',short:'AZURE',subtitle:'HARBOR',image:'assets/menu/azure-harbor.webp',groundY:599,tag:'Where the tides meet',time:'SUNNY DAYLIGHT'},
    // groundY measured on the 1280x720 floor band (elderwood 560-655, moonrise 570-705); see docs/stage-background.md.
    elderwood:{name:'Elderwood Glade',short:'ELDERWOOD',subtitle:'GLADE',image:'assets/menu/elderwood.webp',groundY:606,tag:'Where the old trees whisper',time:'DAPPLED SUNLIGHT'},
    moonrise:{name:'Moonrise Bastion',short:'MOONRISE',subtitle:'BASTION',image:'assets/menu/moonrise.webp',groundY:618,tag:'Under the full moon',time:'FULL MOON NIGHT'}
  };
  function introTiming(m){const clips=window.ANNOUNCER_MANIFEST?.clips;m.fightAt=Math.max(1.05,(clips?.['round_'+m.round]?.duration||0)+.12);m.introDuration=Math.max(1.85,m.fightAt+(clips?.fight?.duration||0)+.10);}
  function create(mode='training') {const m={mode,phase:mode==='versus'?'intro':'fight',round:1,playerWins:0,enemyWins:0,seconds:90,phaseTime:0,fightCue:false,lastWinner:null,winner:null,koDuration:2.2};introTiming(m);return m;}
  function tick(m,dt,pHp,eHp) {
    const events=[];if(m.mode!=='versus'||m.phase==='complete')return events;
    m.phaseTime+=dt;
    if(m.phase==='intro') {
      if(!m.fightCue && m.phaseTime>=m.fightAt){m.fightCue=true;events.push({type:'cue',cue:'fight',round:m.round});}
      if(m.phaseTime>=m.introDuration){m.phase='fight';m.phaseTime=0;events.push({type:'fight'});}
    } else if(m.phase==='fight') {
      m.seconds=Math.max(0,m.seconds-dt);
      if(pHp<=0||eHp<=0||m.seconds===0){
        const winner=pHp===eHp?'draw':pHp>eHp?'player':'enemy';
        m.lastWinner=winner;if(winner==='player')m.playerWins++;if(winner==='enemy')m.enemyWins++;
        m.winner=m.playerWins===2?'player':m.enemyWins===2?'enemy':null;
        m.phase='ko';m.phaseTime=0;events.push({type:'round-end',winner,timeout:m.seconds===0,doubleKO:pHp<=0&&eHp<=0});
      }
    } else if(m.phase==='ko'&&m.phaseTime>=m.koDuration) {
      if(m.winner){m.phase='complete';events.push({type:'complete',winner:m.winner});}
      else {m.round=m.playerWins+m.enemyWins+1;m.phase='intro';m.phaseTime=0;m.seconds=90;m.fightCue=false;m.koDuration=2.2;introTiming(m);events.push({type:'next-round',round:m.round});}
    }
    return events;
  }
  window.MatchRules={create,tick,difficulties,stages};
})();
