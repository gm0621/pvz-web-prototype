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
  2:{scout:['營門外又聚起屍群。門後是糧隊，隊形不能散。','新一批正往石壘靠！留好補給，別被旁邊的動靜帶走。'],charge:['盾穩住正面，弩手盯緊目標！','營門守穩！各哨的糧還等著送出去！']},
  3:{scout:['拒馬長道上塵霜揚起，屍群正沿窄路加速逼近。','第二批繞向側翼！長戟隊預留位置，別讓牠們撞散陣形。'],charge:['長戟向前，截住第一個衝陣者！','側翼補上！拒馬後方不能留空！']},
  4:{scout:['風沙裡的煙罐正在靠近，先看旗影再調動弩手。','又一批借煙幕逼近！守軍保持交叉火力。'],charge:['不要追著煙走，守住自己的路！','煙會散，陣不能散！']},
  5:{scout:['斷橋對岸傳來鉤鏈聲，牠們想把前排拖出陣線。','第二批已踏上橋面！護住被拖動後留下的缺口。'],charge:['盾兵站穩，長戟盯住鉤鎖！','斷橋只能容一路通過，把牠們擋在橋頭！']},
  6:{scout:['鐵爐兵坊外又有屍群聚集，縫屍醫官藏在後排。','第二批沿爐牆靠近！先斷救援，再處理前排。','最後一批正在集結，糧道不能被火爐截斷。'],charge:['集火醫官，別讓倒下的屍兵再站起來！','兵坊各路補齊，火光會照出牠們的位置！','最後一波來了，守住鍛爐與補給線！']},
  7:{scout:['烽臺下的咒旗又亮了，守軍增益可能被暫時封住。','第二批趁夜色靠近！靠隊形，不要只靠一名猛將。','臺階下還有最後一群，火號已送出，必須撐住。'],charge:['號火不滅，魏軍不退！','被封住招式也別亂，各路照原陣迎敵！','最後一波！讓援軍看見烽火仍在！']},
  8:{scout:['霜骨古道上出現替身偶，先辨明真身再集中火力。','第二批沿裂谷分路逼近，別被假目標帶走。','古道深處還有動靜，最後一批正跨過霜谷。'],charge:['看準會前進的真身，別浪費箭！','各路報數，假偶不能打亂防線！','守住古道出口，敵軍支援到此為止！']},
  9:{scout:['魏武中軍外旗影密集，屍督正在後方催動全軍。','第二批從營壘兩側壓來，先保住中軍號令。','決戰前最後一批正在集結，軍糧全部回到防線。'],charge:['中軍旗不倒，各路照令迎敵！','左右營壘同時接戰，誰也不准後退！','清掉最後一波，直取敵軍指揮！']},
  10:{scout:['北境鐵塞前傳來撞木聲，破門屍正蓄勢衝擊。','第二批沿城牆陰影逼近，護住被撞擊的薄弱路線。','城門前最後一批已集結，真正的總攻到了。'],charge:['盾牆頂住撞擊，弩手瞄準後排！','城門還在，魏軍就還有陣地！','最後一戰！守住北境鐵塞！']}
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
