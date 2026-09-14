// Authored battle interludes; no new objectives, troop promises or progression.
const DEFENSE_WAVE_STORY={
 1:{
  1:{scout:['坡後還有身影！送糧的人尚未回城，別把路讓出去。','草叢又在動……先把空路補上，這次我不退。'],charge:['來了！各路看緊，別只顧眼前這一隻！','守住草坪！身後的人還等著回家！']},
  2:{scout:['糧道旁又聚起一群！糧車後面還跟著撤離的人。','牠們又往糧道擠了！留些軍糧，別把補給全花光。'],charge:['護住糧道，讓後面的人跟上！','糧袋今天只裝糧，不拿來擋僵屍！']},
  3:{scout:['城門外還有人沒跟上，遠處的屍群卻聚起來了。','最後一隊還在後面！先補缺口，別讓接應線斷掉。'],charge:['各路互相照應，不讓任何人落單！','弓拉穩！我們就是他們回城的路！']},
  4:{scout:['先看屍群往哪聚！演武場上的補防不能再慢半拍。','又聚起來了！守住陣線，才能把號令的規律記下。'],charge:['今天不是演習，各路補位！','記住牠們的動向，別只追著一隻打！']},
  5:{scout:['夜裡看不清……先看身影，別被遠處的聲響引走。','側翼又有動靜！確認屍群再調兵，別把防線抽空。'],charge:['看準了再放箭，別跟著假鈴亂跑！','側翼不退！讓後排安心出手！']},
  6:{scout:['旗影附近又聚起屍兵。守住前線，線索才帶得回去。','不是散兵了！牠們正往前線靠，先留糧補防。','最後一批屍兵在集結！把空路補齊，別丟了線索。'],charge:['盯住前線！別讓旗影把我們的目光帶走！','鈴又響了……前面的，往前走！','這次我看清了！守住，回去就能把話說明白！']},
  7:{scout:['牠們又朝缺口聚來。後面是住家，不是退路！','屍群還在往前擠，預留補防，別只顧最熱鬧的一路。','最後一批正往缺口靠！今天不能再往後退。'],charge:['缺口有人頂著，各路照常放箭！','前面還沒倒……後面怎麼又推了！','守住這裡！別讓身後的人再搬一次家！']},
  8:{scout:['新的屍群正在集結，役魂紋的消息還得送進主城。','牠們一批接一批！看好各路，別讓傳令的路斷了。','最後一批正在逼近。真相就在手上，不能倒在這裡。'],charge:['穩住陣線，把消息帶回去！','號令沒停……腳就停不下來！','守住！這次我們知道自己在對抗什麼！']},
  9:{scout:['官道那頭又聚起屍群！不能讓役魂旗繼續往外送。','主城外圍還在受壓，先補薄弱處，再準備下一輪。','最後一批屍兵在集結！守住官道，別把災禍放出去。'],charge:['城外每一路都要有人看著！','前面是城，後面是鈴……還能往哪走！','守穩主城外圍，讓旗影停在這裡！']},
  10:{scout:['最後防線前又有屍群聚起。別急，先把陣站穩。','屍巫還沒現身，屍兵又聚過來了！留力應付後面。','最後一波正在集結，頭目還在後方！軍糧別全用盡。'],charge:['各路報清楚，這次我們不會亂！','鈴還在響……到底要我們走到哪裡！','最後一波來了！守住，再把屍巫擋回去！']}
 },
 2:{
  1:{scout:['官道上的腳印又多了。糧隊已收回來，先把前哨守穩。','屍群又聚向前哨！補給在後，別讓各路斷了聯繫。'],charge:['弩手看準目標，補給跟上！','前哨不退！把每一路的聯繫守住！']},
  2:{scout:['營門外又聚起屍群。門後是糧隊，隊形不能散。','新一批正往石壘靠！留好補給，別被旁邊的動靜帶走。'],charge:['盾穩住正面，弩手盯緊目標！','營門守穩！各哨的糧還等著送出去！']}
 }
};
function waveStorySpeaker(kind,index){
 if(kind==='charge'&&index===1&&state.waveDirector.plan.length===3&&state.season!==2)return ZOMBIE_TYPES.normal;
 if(state.season===2)return PLANT_TYPES[kind==='scout'?'s2Crossbow':'s2Tuntian'];
 return PLANT_TYPES[state.level===2&&kind==='charge'&&index===1?'sunflower':'peashooter'];
}
function emitDefenseWaveStory(kind,index){
 const story=state.waveDirector?.story,copy=DEFENSE_WAVE_STORY[state.season||1]?.[state.level];
 if(!story||!copy)return;
 const key=`${kind}-${index+1}`;if(story.seen[key])return;
 const unit=waveStorySpeaker(kind,index),text=copy[kind]?.[index];if(!unit||!text)return;
 story.seen[key]=true;story.event={key,speaker:unit.name,asset:unit.asset,text,until:state.time+(kind==='scout'?7000:4000),dismissed:false};
 log(`${unit.name}：「${text}」`);persistBattleState();
}
function prepareDefenseWaveStory(){
 const d=state.waveDirector;if(!d?.story||state.over||state.paused||state.bossSpawned||d.active)return;
 const next=d.plan[d.index];if(next&&state.enemiesSpawned>=next.after-1&&state.time>=state.levelConfig.firstZombieDelay)emitDefenseWaveStory('scout',d.index);
}
function dismissDefenseWaveStory(){
 const event=state.waveDirector?.story?.event;if(!event)return;
 event.dismissed=true;persistBattleState();updateDefenseWaveHUD();
}
function renderDefenseWaveStory(){
 const d=state.waveDirector,story=d?.story,el=document.getElementById('waveStory'),brief=document.getElementById('waveBrief');
 document.getElementById('waveStatus').dataset.story=story?'on':'off';
 const event=story?.event,visible=!!event&&!event.dismissed&&state.time<event.until&&!state.over;
 el.hidden=!visible;
 if(visible){
  const img=document.getElementById('waveStoryPortrait');if(img.getAttribute('src')!==event.asset)img.setAttribute('src',event.asset);img.alt=event.speaker;
  const text=document.getElementById('waveStoryText'),line=`${event.speaker}：${event.text}`;if(text.textContent!==line)text.textContent=line;
 }
 const next=d?.plan[d.index],announced=story?.seen[`scout-${d.index+1}`];
 const forecast=!!story&&!!next&&!!announced&&!state.over&&!state.bossSpawned&&(!d.active||!d.active.rallied);
 brief.hidden=!forecast;
 if(forecast){const text=`軍情：第 ${d.index+1}/${d.plan.length} 波共 ${next.count} 名，分路來襲；留糧補防。`;if(brief.textContent!==text)brief.textContent=text}
}
