// Read-only guide adapter. Never inserts proposed units into combat dictionaries.
const WEI_GUIDE_CANDIDATES={
 'xiahou-dun':{cost:175,hp:640,damage:42,range:1,rate:1600,cooldown:12000},
 'dian-wei':{cost:200,hp:820,damage:34,range:1,rate:1500,cooldown:15000},
 'xu-chu':{cost:225,hp:1050,damage:58,range:.9,rate:2300,cooldown:18000},
 'zhang-liao':{cost:200,hp:460,damage:40,range:1.5,rate:1400,cooldown:13000},
 'xu-huang':{cost:200,hp:580,damage:46,range:1.1,rate:1800,cooldown:14000},
 'guo-jia':{cost:175,hp:210,damage:18,range:6,rate:2400,cooldown:15000,ranged:true},
 'sima-yi':{cost:250,hp:300,damage:30,range:7,rate:2000,cooldown:18000,ranged:true},
 'cao-cao':{cost:300,hp:580,damage:28,range:3,rate:1800,cooldown:22000,ranged:true}
};
function guideSeconds(ms){return ms==null?'待定':`${Number((ms/1000).toFixed(3))} 秒`}
function guideAbility(id,label,opts={}){return {id,label,kind:'attack',shape:'line',reach:1,rows:0,min:0,damage:0,condition:'目標存活且在合法範圍，行動間隔已到。',effect:'命中單一目標。',timing:'依普通行動間隔；不另抽技能。',limits:'超出範圍不生效；不跨路、不保證穿透。',rangeText:'同路前方 1 格',...opts}}
function guideV2Model(roster,key,mode='current'){
 const editorial=roster==='wei'?WEI_GUIDE.find(d=>d.key===key):roster==='zombie2'?ZOMBIE_SEASON2_GUIDE.find(d=>d.key===key):null;
 const side=roster==='wei'?'plants':roster==='zombie2'?'zombies':roster;
 const combatKey=editorial?Object.keys(SEASON2_GUIDE_KEYS).find(k=>SEASON2_GUIDE_KEYS[k]===key):key;
 const base=(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[combatKey];
 const candidate=WEI_GUIDE_CANDIDATES[key];
 if(!base&&!editorial)return null;
 const d=base?(mode==='base'?{...base}:effectiveUnit(side,combatKey,mode==='next'?1:0)):{...candidate,name:editorial.name,asset:editorial.asset};
 const season=editorial?2:1,preview=!base,level=base?charLevel(side,combatKey)+(mode==='next'?1:0):1;
 const m={roster,key,side,combatKey,base,d,editorial,season,preview,level,mode,name:editorial?.name||d.name,asset:editorial?.asset||base.guideAsset||base.asset,abilities:[]};
 if(preview){m.status='設計預覽｜尚未開放出戰';m.statusDetail=candidate?'候選數值・未平衡驗證，不代表已實裝。':'能力方向預覽；費用、生命值、範圍、冷卻與機率待定。';}
 else if(base.hidden){m.status='召喚物｜不可獨立部署';m.statusDetail='由召喚者產生，不新增卡片或解鎖。';}
 else if(season===2){const n=base.clearRequired,open=!n||isCampaignLevelCompleted(side,n,2);m.status=open?'已實裝・已解鎖':'已實裝・尚未解鎖';m.statusDetail=n?`第${levelLabel(n)}關通關獎勵：通過第二季同模式第${levelLabel(n)}關後可用。`:'第一關初始角色。';}
 else {m.status=isCharacterGuideUnlocked(side,key)?'已實裝・已解鎖':'已實裝・尚未解鎖';m.statusDetail=unlockLabel(side,key);}
 m.intro=editorial?.intro||CHARACTER_EXTRAS[key]||d.desc;
 m.notes=editorial?.limit||'先用前排保護輸出／補給，再依射程配置；圖鑑不會改變部署與解鎖規則。';
 const add=(id,label,o)=>m.abilities.push(guideAbility(id,label,o));
 const ranged=!!(d.ranged||d.shoot||d.tripleShot||d.slow||d.fire||['peashooter','s2Crossbow','s2Nail'].includes(combatKey));
 const reach=combatKey==='peaZombie'?4.8:d.range;
 const ordinaryRate=combatKey==='peaZombie'?1200:(d.rate||(side==='zombies'?700:null));
 const direction=side==='plants'?'右':'左';
 const rangeText=reach==null?'範圍待定':`同路向${direction}，前方 ${reach} 格`;
 const common={reach:reach??null,rangeText,damage:d.damage||0,timing:`行動間隔 ${guideSeconds(ordinaryRate)}；技能與部署冷卻另列。`,effect:d.damage!=null?`每擊 ${d.damage} 傷害。`:'傷害待定。'};
 if(!base&&!candidate){
  add('ordinary','普通行動（概念）',{...common,kind:'concept',effect:editorial.attack,condition:'接近合法目標後進行普通行動；具體選敵與距離待定。',timing:'普通行動間隔待定。',limits:editorial.limit});
 }else if(d.produce){
  add('ordinary','普通行動｜補給',{kind:'supply',shape:'self',reach:0,rangeText:'自身產出，加入所屬陣營資源',amount:d.produce,effect:`每次 +${d.produce} 軍糧；不是攻擊傷害。`,condition:'角色仍在場、補給週期已到；不需要敵人。',timing:`每 ${guideSeconds(d.rate)} 補給一次。`,limits:'受混亂時不能行動；不把補給量列為遠程攻擊力。'});
 }else if(d.summon){
  const unit=side==='plants'?'swordSoldier':'terracottaSoldier';
  add('ordinary','普通行動｜召喚',{...common,kind:'summon',damage:0,summons:[unit],effect:`召喚一名${(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[unit].name}；召喚者不發射普通傷害彈。`,condition:`同路前方 ${d.range} 格內有敵人、召喚間隔已到。`,timing:`召喚間隔 ${guideSeconds(d.summonRate)}。`,limits:side==='plants'?'鄉勇出現在同路前方；召喚物屬性可另點查看。':'秦俑出現在同路身後位置（朝左推進）；無接敵目標不召喚。'});
 }else if(d.oneUse){
  add('ordinary','普通行動｜一次性施放',{...common,shape:d.oneUse==='global'?'all':'rows',rows:d.oneUse==='global'?4:1,reach:9,rangeText:d.oneUse==='global'?'全棋盤所有敵人':'自身路及相鄰上下路，全列、不分前後',condition:'部署後首次可行動時施放，不需要抽籤。',effect:`範圍內每名敵人 ${d.damage} 傷害；施放後退場。`,timing:'一次性；重用需再次部署，受卡片冷卻限制。',limits:'邊路會裁切，不會繞到另一側；不是週期普攻。'});
 }else if(combatKey==='potato'){
  add('ordinary','普通行動｜伏兵陷阱',{...common,reach:.42,shape:'around',rangeText:'同路，以自身為中心、距離小於 0.42 格',condition:`部署超過 ${guideSeconds(d.armedAfter)} 後，敵人進入觸發距離。`,timing:`啟動等待 ${guideSeconds(d.armedAfter)}；只觸發一次。`,effect:`單體 ${d.damage} 傷害，伏兵消耗。`,limits:'準備中不能引爆；不造成九宮格傷害。'});
 }else if(d.damage){
  if(d.meleeDamage)add('melee','普通攻擊｜近戰青釭劍',{...common,reach:1.2,rangeText:'同路前方，距離 ≤ 1.2 格',damage:d.meleeDamage,effect:`每擊 ${d.meleeDamage} 傷害，固定緩速 3.2 秒。`,condition:'同路最近的存活敵人在前方 1.2 格內；近戰優先。'});
  add(ranged?'ranged':'melee',ranged?'普通攻擊｜遠程':'普通攻擊｜近戰',{...common,kind:ranged?'projectile':'attack',min:d.meleeDamage?1.2:0,rows:d.tripleShot?1:0,rangeText:d.tripleShot?`向${direction}前方 ${reach} 格、自身及相鄰上下路`:d.meleeDamage?`同路前方，1.2 格 < 距離 ≤ ${reach} 格`:rangeText,
   effect:d.pierce?`每名 ${d.damage} 傷害，最多貫穿最近三名敵人。`:d.tripleShot?`每路一箭，每箭 ${d.damage} 傷害；只向有目標的路發射。`:common.effect,
   limits:d.pierce?'以精確 3.1 格判定，最多三名；不是遠程彈丸。':ranged?'彈丸沿路命中碰到的首位目標，不保證追蹤；跨路射擊另依招式標示。':'僅前方合法目標；沒有獨立遠程普攻。'});
 }else add('ordinary','普通行動｜阻擋',{kind:'guard',shape:'self',reach:0,rangeText:'自身所在位置',effect:'阻擋敵人；沒有近戰或遠程傷害。',condition:'角色存活且敵人接近。',timing:'持續阻擋，不抽技能。',limits:'生命值不是護甲；不能阻擋所有跳越能力。'});
 // All first-season special effects are described independently from ordinary damage.
 if(base&&season===1){
  const info=GENERAL_TALENTS[key],fixed=FIXED_TALENTS[key],first=m.abilities.find(a=>a.id==='ranged')||m.abilities[0];
  if(info){
   const effect={firepea:'所有彈丸帶火焰外觀；目前沒有額外燃燒扣血。',zhaoyun:'近戰與遠程命中固定緩速 3.2 秒；僵屍移速為原本 45%。',zhangfei:`每次近戰將目標向右推 ${d.knockback} 格，右邊界為 8.9。`,huangzhong:'最多三路各一箭；每條有敵人的路才發射。',machao:'前方 3.1 格，最近三名敵人各受一次穿刺。',liubei:first.effect,qinEmperor:first.effect}[key];
   add('talent',`天賦｜${info.name}`,{...first,id:'talent',label:`天賦｜${info.name}`,effect,condition:first.condition,timing:first.timing,limits:`固定生效，不需機率成功。${first.limits}`});
   const chance=Math.round(superSkillChance(key,mode==='base'?1:level)*100),summon=d.summon;
   add('skill',`機率技能｜${info.random}`,{...first,id:'skill',label:`機率技能｜${info.random}`,chance,damage:summon?0:superSkillDamage(d.damage),kind:summon?'summon':first.kind,rows:summon||d.tripleShot?1:first.rows,summons:summon?[side==='plants'?'whiteFeatherGuard':'blackArmorGuard']:null,
    condition:`${first.condition} 每次合法${summon?'召喚':'攻擊'}判定一次 ${chance}%；不是每個受擊者分別抽。`,
    effect:summon?`改召相鄰上下與同路的${side==='plants'?'白毦禁衛':'玄甲禁軍'}，最多三名。`:`${info.bonus} 本模式每擊 ${superSkillDamage(d.damage)}${d.meleeDamage?`；近戰劍擊 ${superSkillDamage(d.meleeDamage)}`:''} 傷害。`,
    reach:d.meleeDamage?d.range:first.reach,min:d.meleeDamage?1.2:first.min,
    rangeText:summon?'同路及相鄰上下路，棋盤邊緣裁切':d.meleeDamage?`同路前方，1.2 格 < 距離 ≤ ${d.range} 格`:first.rangeText,
    timing:`依${summon?'召喚':'普攻'}週期；沒有獨立技能冷卻。Lv.1 25%，每級 +2 個百分點，上限 60%。`,limits:summon?'取代本次普通召喚，不同時加召普通兵。':'未觸發仍保留固定天賦；傷害採四捨五入，不另追加一輪普通傷害。'});
   if(d.meleeDamage)add('skill-melee','機率技能｜近戰冰龍爆擊',{...m.abilities.find(a=>a.id==='skill'),id:'skill-melee',label:'機率技能｜近戰冰龍爆擊',kind:'attack',reach:1.2,min:0,condition:'同路最近存活敵人在前方 1.2 格內；近戰優先，合法攻擊時判定技能機率。',rangeText:'同路前方 ≤ 1.2 格',damage:superSkillDamage(d.meleeDamage),effect:`青釭劍爆擊 ${superSkillDamage(d.meleeDamage)} 傷害，緩速 3.2 秒。`});
  }else if(fixed){
   const o={...first,damage:0,kind:'control',effect:fixed.effect};
   if(key==='kongming')Object.assign(o,{effect:'倖存敵人緩速 4 秒，移速為原本 45%。',condition:'八陣雷擊結算後敵人仍存活。'});
   if(key==='pangtong')Object.assign(o,{damage:25,kind:'dot',effect:'倖存敵人每秒灼燒 25，持續 3 秒。',condition:'三列鳳火後敵人仍存活。',timing:'每 1 秒一跳，持續 3 秒；同目標刷新、不無限疊加。'});
   if(key==='football')Object.assign(o,{kind:'move',shape:'self',reach:0,rangeText:'所在路朝左推進',condition:'前方沒有可近戰守軍，且未被推車清除。',effect:`每遊戲步移動 ${d.speed} 格；緩速時乘 0.45。`,timing:'依遊戲步前進，不是瞬移。'});
   if(key==='jester')Object.assign(o,{shape:'line',reach:3.2,rangeText:'同路向左前方 3.2 格，全部目標',damage:d.laughDamage,effect:`每名 ${d.laughDamage} 傷害、混亂 ${guideSeconds(d.laughStun)}。`,condition:'範圍內有守軍且狂笑冷卻已到。',timing:`冷卻 ${guideSeconds(d.laughRate)}。`});
   if(key==='bombJester')Object.assign(o,{shape:'around',reach:1,rows:1,rangeText:'死亡位置為中心，上下各一路、前後各一格',damage:d.bombDamage,effect:`每名 ${d.bombDamage} 傷害；只爆一次。`,condition:'本體生命歸零、死亡清理時。',timing:'死亡時觸發，無存活期間技能冷卻。'});
   if(key==='corpseTitan')Object.assign(o,{shape:'target',reach:d.range,rows:1,rangeText:`前方 ${d.range} 格鎖定近戰目標，再以目標為中心九宮格`,damage:d.smashDamage,splash:d.smashDamage*.55,effect:`中心 ${d.smashDamage}、其他受波及者 ${Number((d.smashDamage*.55).toFixed(2))}；混亂 ${guideSeconds(d.smashStun)}。`,condition:'有近戰目標、震擊冷卻已到。',timing:`冷卻 ${guideSeconds(d.smashRate)}；冷卻中仍可能普攻。`});
   if(key==='fireCatapult')Object.assign(o,{shape:'target',reach:d.catapultRange,rows:1,rangeText:`同路向左 ${d.catapultRange} 格選敵，落點為中心九宮格`,damage:d.catapultDamage,splash:d.catapultDamage*d.catapultSplash,effect:`中心 ${d.catapultDamage}、濺射 ${Number((d.catapultDamage*d.catapultSplash).toFixed(2))} 傷害。`,condition:'同路射程內有目標；偏好密集處，評分包含隨機項。',timing:`冷卻 ${guideSeconds(d.catapultRate)}；特技冷卻中可近戰。`});
   if(key==='necromancer')Object.assign(o,{reach:d.curseRange,rangeText:`同路向左 ${d.curseRange} 格最近目標`,damage:d.curseDamage,effect:`${d.curseDamage} 傷害，混亂 ${guideSeconds(d.curseStun)}。`,condition:'合法射程內有守軍，禁咒冷卻已到。',timing:`冷卻 ${guideSeconds(d.curseRate)}。`});
   add('talent',`天賦｜${fixed.name}`,{...o,id:'talent',label:`天賦｜${fixed.name}`,limits:`${o.limits} 固定條件觸發，沒有額外機率大招。`});
  }
  if(d.canJump)add('talent','天賦｜竹竿跳越',{kind:'move',reach:.95,rangeText:'同路向左 0.95 格內的最近守軍',condition:'尚未使用跳越、前方遇到守軍。',effect:`越過一名，跳到目標左側 0.78 格；之後速度 ${d.spentSpeed} 格／遊戲步。`,timing:'每名僵屍一生只跳一次。',limits:'不是持續穿越；跳後仍會被後排阻擋。'});
 }
 if(editorial&&base)guideV2Season2Abilities(m,add);
 if(editorial&&!base)guideV2PreviewAbilities(m,add);
 if(!m.abilities.some(a=>a.id==='talent'))m.fixedNote='無額外固定天賦；普通行動條件如上。';
 m.randomNote=m.abilities.some(a=>a.chance||a.id==='skill')?'機率技能／條件以選取技能為準。':'無機率技能，不會額外抽籤。';
 return m;
}
function guideV2Season2Abilities(m,add){
 const {combatKey:k,d,editorial:e}=m,first=m.abilities[0];let a={...first,id:'talent',label:`天賦｜${e.talent}`,condition:first.condition,limits:e.limit};
 if(k==='s2Tuntian')Object.assign(a,{kind:'supply',amount:d.produce+15,effect:`安全補給 ${d.produce+15} 軍糧（普通 ${d.produce} +15）。`,condition:'連續 8 秒沒有受到傷害，且本次補給週期已到。',timing:`補給每 ${guideSeconds(d.rate)}；受傷重新累積安全時間。`});
 if(k==='s2Shield')Object.assign(a,{kind:'guard',damage:0,shape:'self',reach:0,rangeText:'自身受擊',effect:'架盾時傷害 ×0.6；列盾被削弱期間 ×0.85。實際程式未分前後方向。',condition:'脫離近戰目標 4 秒；近戰受擊／接敵即收盾。',timing:'脫戰等待 4 秒；不是持續 40% 減傷。',limits:'不把生命當護甲；目前直接傷害函式沒有方向檢查，近戰會先收盾。'});
 if(k==='s2Crossbow')Object.assign(a,{kind:'projectile',damage:Math.round(d.damage*1.6),effect:`連續同目標：${[0,1,2,3].map(n=>Math.round(d.damage*(1+.2*n))).join(' → ')}，上限三層 +60%。示範為滿層一箭。`,condition:'持續鎖定同一目標；換目標或找不到目標歸零。',timing:first.timing,limits:'判定於射擊時，不是命中才加層；實際彈丸可能先撞到路上另一目標。'});
 if(k==='s2Halberd')Object.assign(a,{damage:55,kind:'attack',effect:'追加 55 攔截傷害，中止本次突進。',condition:'非頭目敵人在 1.6 格內快速移動／跳入；最近 100ms 的位移至少 0.4 格。',timing:'獨立冷卻 6 秒；普通戟刺週期另算。',limits:'普通步行不觸發，頭目不攔截；不把 55 當每次普攻附加。'});
 if(k==='s2Rat')Object.assign(a,{damage:d.damage*1.25,effect:`協攻 ${d.damage*1.25} 傷害（普通 ${d.damage} ×1.25）。`,condition:'另一名存活鼠牙群屍也在同路同一守軍的近戰範圍。',limits:'程式要求鼠牙同伴，不是任意僵屍；不隨數量疊加。'});
 if(k==='s2Nail')Object.assign(a,{kind:'mark',damage:0,effect:'射中後留骨釘；友軍後續近戰消耗一枚，追加 20 傷害。',condition:'腐釘命中且守軍仍存活，之後在期限內受到友軍近戰。',timing:'標記維持 5 秒，最多 2 枚；再次命中刷新期限。',limits:'此頁展示標記與後續追加；不是腐釘本身每擊直接多 20。'});
 if(k==='s2Coffin')Object.assign(a,{kind:'guard',damage:0,reach:.9,shape:'behind',rangeText:'自身與同路身後距離 ≤ 0.9 格的友軍',effect:`獨立 ${d.shieldHp} 耐久，吸收直射傷害 60%，餘額扣被保護者 HP。`,condition:'盾牌仍有耐久、普通直射彈丸命中自身或緊鄰身後友軍。',timing:'被動吸收至盾破，不再生。',limits:'護盾耗盡後剩餘傷害會扣 HP；不是近戰全面減傷。'});
 if(k==='s2Cleaver')Object.assign(a,{kind:'shield',damage:0,effect:`盾耗 ${d.damage*2}；盾未吸完的部分才按比例扣 HP。對大盾連擊兩次，削弱列盾 8 秒。`,condition:'目標有獨立護盾；或在 4 秒內連續斧擊同一大盾兵。',timing:`普攻間隔 ${guideSeconds(d.rate)}；破甲延續 8 秒。`,limits:'對無盾目標只普攻；近戰結算使大盾收盾，不表示破甲讓所有傷害倍增。'});
 add('talent',`天賦｜${e.talent}`,a);
 if(k==='s2Nail')add('skill',`機率技能｜${e.skill}`,{...first,id:'skill',label:`機率技能｜${e.skill}`,chance:20,damage:d.damage*2,effect:`一次雙釘彈丸 ${d.damage*2} 傷害，最多留下兩枚骨釘。`,condition:'每次合法射擊判定一次 20%。',timing:`依射擊間隔 ${guideSeconds(d.rate)}；不隨角色等級提高機率。`,limits:'不突破兩枚標記上限；不再額外發射普通一箭。'});
 if(k==='s2Cleaver')add('skill',`機率技能｜${e.skill}`,{...a,id:'skill',label:`機率技能｜${e.skill}`,chance:20,kind:'shield',effect:`獨立盾耗改為 ${d.damage*3}；若只有列盾、無獨立盾，該次傷害為 ${d.damage*2}。`,condition:'命中時目標有獨立護盾或正架盾，才判定一次 20%。',timing:'依普通攻擊週期；沒有另外一個技能冷卻。',limits:'無盾且未架盾不抽籤；不重複追加通用 1.8 倍爆擊。'});
}
function guideV2PreviewAbilities(m,add){
 const {key:k,d,editorial:e}=m,first=m.abilities[0];
 // [condition,effect,timing,rangeText,shape,reach,kind,damage]
 const rows={
 'xiahou-dun':['敵方直接傷害造成 HP 損失，每次 +20 怒氣，100 滿怒；滿怒後下次普攻。',`消耗滿怒，追加普攻的 80%（${Number((d.damage*.8).toFixed(2))}）。`,'同次攻擊 0.5 秒內只計一次怒氣；無目標保留。','同路前方 1 格','line',1,'attack',d.damage*.8],
 'dian-wei':['同路後方緊鄰一格有非典韋友軍，且受到敵方直接傷害。','分擔剩餘 HP 傷害 30%，每次最多 80；不能相互分攤。','持續保護；離位／死亡解除。','同路後方一格','behind',1,'guard',0],
 'xu-chu':['持續近戰接敵，最近一名非頭目。','抵抗拉扯／推移、纏住一名；目標仍能攻擊與施技。','脫離範圍或任一方死亡解除。','同路前方 0.9 格','line',.9,'control',0],
 'zhang-liao':['普攻首次命中且無自己的有效標記。','標記最多 8 秒，同路魏軍直接傷害 +15%。','標記結束後等 3 秒才能再標。','同路前方 1.5 格選敵，同路隊友受益','line',1.5,'mark',0],
 'xu-huang':['連續斧擊同一可破壞減傷目標。','每層減傷降低 10 個百分點，最多三層、最低 0。','破甲維持 5 秒；換敵個人連擊重置。','同路前方 1.1 格','line',1.1,'shield',0],
 'guo-jia':['同路有可干擾的敵方技能正在蓄勢，優先剩餘讀條最短者。','本次施法延後 1 秒；頭目候選 0.3 秒。','冷卻 8 秒；同目標 6 秒保護。','同路前方 6 格','line',6,'control',0],
 'sima-yi':['角色在場存活，每 10 秒一層謀略。','每層普攻傷害 +8%，最多五層。','暫停／離線不計時，重新部署歸零。','自身','self',0,'mark',0],
 'cao-cao':['指定魏國小兵在周圍光環內。','大盾架盾等待 -1 秒；強弩每層 +25%（三層）；長戟攔截冷卻 -1 秒。','離開解除，同類不疊加。','自身上下各一路、前後各一格','around',1,'guard',0]
 };
 const r=rows[k];
 add('talent',`天賦｜${e.talent}`,r?{condition:r[0],effect:r[1],timing:r[2],rangeText:r[3],shape:r[4],reach:r[5],kind:r[6],damage:r[7],rows:k==='cao-cao'?1:0,limits:e.limit}:{...first,id:'talent',label:`天賦｜${e.talent}`,kind:'concept',damage:0,effect:e.effect,condition:`設計條件：${e.effect}`,timing:'條件門檻／冷卻／持續時間待定。',rangeText:'設計範圍待定；圖上只展示概念站位。',limits:e.limit});
 if(!e.skill)return;
 const skills={
 'xiahou-dun':['滿怒反擊命中時，且技能就緒。','3 秒減傷 30%，同目標追加一刀 100% 普攻。','冷卻 8 秒','同路前方 1 格','line',1,'attack',d.damage],
 'dian-wei':['被保護者本次分攤前待扣 HP 達最大 HP 的 15%。','結算後給存活友軍 100 盾、4 秒；前方敵人追加 60 傷害。','冷卻 10 秒','同路後方一格友軍；前方一格敵人','around',1,'guard',60],
 'xu-chu':['普攻命中具有大型標籤的目標。','追加 70 傷害、壓制 1.5 秒；頭目 0.5 秒，同目標之後 6 秒免同類控制。','冷卻 10 秒','同路前方 0.9 格','line',.9,'control',70],
 'zhang-liao':['有效標記目標被任一己方單位擊倒，且張遼仍存活。','同路魏軍普通攻擊頻率 +20%，4 秒。','冷卻 10 秒','自身同一路友軍','rows',9,'guard',0],
 'xu-huang':['命中有獨立護盾或可破壞減傷的目標。','額外削盾 100，不溢出為 HP 傷害；破甲刷新為 8 秒。','冷卻 6 秒','同路前方 1.1 格','line',1.1,'shield',0],
 'guo-jia':['天賦成功延後敵方施法。','封策 2 秒，頭目 0.5 秒；不能開新特殊技能，移動／普攻照常。','冷卻 12 秒','同路前方 6 格','line',6,'control',0],
 'sima-yi':['普攻命中、至少三層謀略、技能就緒。','消耗兩層，附加 6 秒弱點；同路魏軍每三次普攻追加 40 傷害，最短間隔 0.8 秒。','冷卻 12 秒','同路前方 7 格單一目標','line',7,'mark',0],
 'cao-cao':['合法普通攻擊命中、技能就緒。','光環內魏軍 +80 護盾 4 秒；小兵普攻頻率 +15%，4 秒，不加產糧。','冷卻 12 秒','自身上下各一路、前後各一格','around',1,'guard',0]
 };
 const s=skills[k];
 add('skill',`機率技能｜${e.skill}`,s?{condition:`${s[0]} 符合才判定一次候選 25%。`,effect:s[1],timing:`${s[2]}；候選 Lv.1 25%、每級 +2 個百分點、上限 60%。`,rangeText:s[3],shape:s[4],reach:s[5],kind:s[6],damage:s[7],rows:k==='cao-cao'?1:0,chance:25,limits:e.limit}:{kind:'concept',reach:null,condition:`${e.skillEffect}（具體門檻待定）`,effect:e.skillEffect,timing:'機率、冷卻與持續時間待定。',rangeText:'設計範圍待定；不代表實際戰鬥範圍。',limits:e.limit});
}
