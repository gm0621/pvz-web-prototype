let currentSeason=1;
// Playable second-season roster. Order is the actual unlock order: two starters, then one first-clear reward per stage.
const SEASON2_UNIT_ORDER={
 plants:['s2Tuntian','s2Crossbow','s2Shield','s2Halberd','s2Xiahou','s2DianWei','s2XuChu','s2ZhangLiao','s2XuHuang','s2GuoJia','s2SimaYi','s2CaoCao'],
 zombies:['s2Rat','s2Nail','s2Coffin','s2Cleaver','s2Smoke','s2Hook','s2Medic','s2Venom','s2Decoy','s2Hexer','s2Ram','s2Overseer']
};
const SEASON2_GUIDE_KEYS={
 s2Tuntian:'tuntian-soldier',s2Crossbow:'crossbow-soldier',s2Shield:'shield-soldier',s2Halberd:'halberd-soldier',s2Xiahou:'xiahou-dun',s2DianWei:'dian-wei',s2XuChu:'xu-chu',s2ZhangLiao:'zhang-liao',s2XuHuang:'xu-huang',s2GuoJia:'guo-jia',s2SimaYi:'sima-yi',s2CaoCao:'cao-cao',
 s2Rat:'rat-fang',s2Nail:'rot-nail-crossbow',s2Coffin:'coffin-shield',s2Cleaver:'shield-cleaver',s2Smoke:'smoke-pot',s2Hook:'chain-hook',s2Medic:'corpse-medic',s2Venom:'venom-sac',s2Decoy:'decoy-puppet',s2Hexer:'banner-hexer',s2Ram:'gate-ram',s2Overseer:'siege-overseer'
};
const SEASON2_UNITS={
 plants:{
  s2Tuntian:{name:'屯田兵',cost:50,emoji:'🌾',hp:125,produce:25,rate:8500,cooldown:4200,desc:'屯田積穀：連續 8 秒未受傷，下次補給多 15 軍糧。'},
  s2Crossbow:{name:'強弩兵',cost:100,emoji:'🏹',hp:160,damage:32,rate:2000,range:9,cooldown:4800,desc:'校射：連續射擊同一目標，每次傷害提高 20%，最多 60%；換目標歸零。'},
  s2Shield:{name:'大盾兵',cost:75,emoji:'🛡️',hp:470,damage:14,rate:1400,range:.8,cooldown:7000,clearRequired:1,desc:'列盾：脫離交戰 4 秒後架盾，正面傷害減少 40%。'},
  s2Halberd:{name:'長戟兵',cost:125,emoji:'🔱',hp:260,damage:38,rate:1500,range:1.6,cooldown:6500,clearRequired:2,desc:'拒馬列戟：攔截快速突進，追加 55 傷害並中止突進。'},
  s2Xiahou:{name:'夏侯惇',cost:150,emoji:'⚔️',hp:440,damage:58,rate:1450,range:1.05,cooldown:8000,clearRequired:3,battleAsset:'assets/characters/future-generals/wei-season2/xiahou-dun/idle.webp',attackFrames:Array.from({length:8},(_,index)=>`assets/characters/future-generals/wei-season2/xiahou-dun/attack-${String(index).padStart(2,'0')}.webp`),attackFrameDurations:[90,80,100,65,150,65,80,100],attackHitAt:335,desc:'拔矢不屈：受傷累積怒氣；滿怒後下一刀追加 60 傷害並短暫減傷。'},
  s2DianWei:{name:'典韋',cost:165,emoji:'🗡️',hp:560,damage:52,rate:1350,range:1,cooldown:8500,clearRequired:4,desc:'帳前死衛：替同路緊鄰後方友軍分擔 35% 傷害，並以雙戟重擊反擊。'},
  s2XuChu:{name:'許褚',cost:185,emoji:'🔨',hp:720,damage:70,rate:2100,range:.9,cooldown:9500,clearRequired:5,desc:'虎軀鎮關：高生命重坦，重錘有機率讓一般敵人短暫停步。'},
  s2ZhangLiao:{name:'張遼',cost:180,emoji:'🏇',hp:400,damage:62,rate:1300,range:1.4,cooldown:8500,clearRequired:6,desc:'先登破陣：標記首次接戰目標，使同路友軍對它造成更高傷害。'},
  s2XuHuang:{name:'徐晃',cost:190,emoji:'🪓',hp:480,damage:68,rate:1550,range:1.15,cooldown:9000,clearRequired:7,desc:'長驅破甲：連續斧擊會逐步提高對同一重裝目標的傷害。'},
  s2GuoJia:{name:'郭嘉',cost:200,emoji:'📜',hp:240,damage:34,rate:2300,range:6.5,cooldown:10000,clearRequired:8,desc:'料敵先機：遠程策令命中後，延後敵方下一次特殊行動。'},
  s2SimaYi:{name:'司馬懿',cost:225,emoji:'🦅',hp:300,damage:42,rate:2100,range:7,cooldown:10500,clearRequired:9,desc:'隱忍蓄謀：在場越久謀略越深，最多使自身攻擊提高 60%。'},
  s2CaoCao:{name:'曹操',cost:250,emoji:'🚩',hp:520,damage:58,rate:1750,range:4.5,cooldown:12000,clearRequired:10,desc:'軍令如山：鼓舞同路魏軍，使一般兵攻擊節奏加快並獲得短暫護盾。'}
 },
 zombies:{
  s2Rat:{name:'鼠牙群屍',cost:45,emoji:'🧟',hp:135,damage:16,rate:750,speed:.015,range:.75,cooldown:2900,desc:'群牙撕咬：同伴一起攻擊同一守軍時傷害 +25%。'},
  s2Nail:{name:'腐釘弩屍',cost:100,emoji:'🎯',hp:150,damage:15,rate:2200,speed:.011,range:4.8,cooldown:6000,desc:'釘骨留傷：射中留下骨釘，近戰消耗後追加傷害。'},
  s2Coffin:{name:'棺盾小屍',cost:90,emoji:'⚰️',hp:260,damage:18,rate:1100,speed:.010,range:.75,cooldown:6500,shieldHp:140,clearRequired:1,desc:'棺板掩護：140 耐久盾牌吸收普通直射傷害，也能掩護緊鄰後方友軍。'},
  s2Cleaver:{name:'裂盾斧屍',cost:135,emoji:'🪓',hp:290,damage:30,rate:1800,speed:.009,range:.8,cooldown:7500,clearRequired:2,desc:'啃盾裂甲：對護盾造成雙倍盾耗，連續斧擊削弱列盾減傷。'},
  s2Smoke:{name:'煙罐小屍',cost:115,emoji:'🌫️',hp:230,damage:16,rate:1400,speed:.011,range:.8,cooldown:7200,clearRequired:3,desc:'屍煙掩行：同路附近友軍受到的普通遠程傷害降低 25%。'},
  s2Hook:{name:'鉤鎖屍卒',cost:145,emoji:'⛓️',hp:320,damage:28,rate:1650,speed:.009,range:2.2,cooldown:8200,clearRequired:4,desc:'勾陣：週期性把同路最前方守軍向前拉一格，拆開前後排支援。'},
  s2Medic:{name:'縫屍醫官',cost:155,emoji:'🩹',hp:230,damage:13,rate:1700,speed:.009,range:1.1,cooldown:9000,clearRequired:5,desc:'補肉縫骨：每 5 秒修補同路受傷最重的一名非醫官僵屍。'},
  s2Venom:{name:'毒囊噴屍',cost:165,emoji:'☠️',hp:270,damage:24,rate:2200,speed:.009,range:2.6,cooldown:9000,clearRequired:6,desc:'腐液殘留：短距離噴吐，命中點附近守軍會受到範圍腐液傷害。'},
  s2Decoy:{name:'替身偶屍',cost:150,emoji:'🎭',hp:390,damage:20,rate:1250,speed:.010,range:.8,cooldown:8500,clearRequired:7,desc:'草偶替身：高耐久誘餌會優先承受普通直射火力。'},
  s2Hexer:{name:'斷旗咒屍',cost:190,emoji:'🏴',hp:250,damage:26,rate:2350,speed:.008,range:4.5,cooldown:10000,clearRequired:8,desc:'孤軍咒：遠程咒符使目標短時間無法獲得友軍增益。'},
  s2Ram:{name:'破門撞屍',cost:205,emoji:'🪵',hp:480,damage:45,rate:1900,speed:.014,range:.85,cooldown:10500,clearRequired:9,desc:'蓄勢破門：前進距離轉為首次接戰傷害，最多追加 90 傷害。'},
  s2Overseer:{name:'陷城屍督',cost:260,emoji:'👑',hp:820,damage:74,rate:1750,speed:.007,range:1.1,cooldown:12500,clearRequired:10,desc:'攻城督令：重甲頭目型單位，接戰時鼓舞同路屍軍並重擊防線。'}
 }
};
for(const side of ['plants','zombies'])for(const [key,d] of Object.entries(SEASON2_UNITS[side])){d.season=2;d.asset=`assets/characters/${side==='plants'?'future-generals/wei-season2':'zombie-army/season2'}/${SEASON2_GUIDE_KEYS[key]}.webp`;Object.assign(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES,{[key]:d})}

const base={theme:'night',nightMode:false,plantIncome:28,zombieIncome:43,plantAIIncome:28,zombieAIIncome:38,incomeMin:5200,incomeMax:6300,firstZombieDelay:11000,openingSpacing:7000,minSpawnSpacing:4200,plantAIMin:5200,plantAIMax:7600,zombieAIMin:7200,zombieAIMax:9800,attackTimeLimit:210000};
const configs=[
 [1,'霜土前哨','入門',325,260,180,240,14,['s2Rat','s2Rat','s2Rat','s2Nail'],['s2Rat','s2Rat','s2Rat','s2Nail'],'s2Coffin',1.5,'先建屯田補給，再讓強弩分路校射；棺盾領隊最後單獨登場。','鼠牙集中一路，腐釘先留下骨釘，再由近戰接手。'],
 [2,'石壘營門','盾陣',350,300,200,270,18,['s2Rat','s2Rat','s2Nail','s2Coffin'],['s2Rat','s2Rat','s2Nail','s2Coffin'],'s2Cleaver',1.8,'盾在前、弩在後；裂盾斧屍出現後集中火力。','棺盾先走、腐釘接上，集中較薄的一路突破。'],
 [3,'拒馬長道','普通',375,325,225,295,20,['s2Rat','s2Cleaver','s2Nail'],['s2Rat','s2Nail','s2Cleaver'],'s2Ram',1.7,'長戟兵守住缺口並保留攔截冷卻，優先處理伴隨的斧屍。','裂盾斧先削弱盾線，腐釘與群屍依序接手。'],
 [4,'風沙糧倉','普通',400,350,245,320,22,['s2Smoke','s2Rat','s2Cleaver'],['s2Rat','s2Smoke','s2Cleaver'],'s2Hook',1.8,'遠射被煙霧壓制時，用夏侯惇在煙口近戰接敵。','煙罐掩護近身但不是無敵；避開夏侯惇最完整的一路。'],
 [5,'乾谷斷橋','進階',425,375,265,345,24,['s2Hook','s2Coffin','s2Nail'],['s2Hook','s2Coffin','s2Nail','s2Cleaver'],'s2Cleaver',2.0,'典韋護住脆弱後排，並替鉤鎖拉扯預留重整空格。','用鉤鎖切開前後排，再讓群屍集中拆掉失去支援的前排。'],
 [6,'鐵爐兵坊','進階',450,400,285,370,26,['s2Medic','s2Coffin','s2Cleaver'],['s2Medic','s2Coffin','s2Cleaver'],'s2Ram',2.1,'許褚卡住重兵，弩隊逐個擊倒，別讓醫官把傷害補回。','醫官留在前排身後續戰；正面過厚時改打較薄路線。'],
 [7,'烽臺夜哨','進階',475,425,305,395,28,['s2Decoy','s2Venom','s2Nail'],['s2Decoy','s2Venom','s2Nail','s2Coffin'],'s2Coffin',2.25,'張遼標出真正威脅，先處理毒囊，別把校射耗在誘餌上。','棺盾掩護毒囊接近，用腐液逼守軍不能只靠密集站樁。'],
 [8,'霜骨古道','將軍',500,450,325,420,30,['s2Coffin','s2Medic','s2Ram'],['s2Coffin','s2Medic','s2Ram','s2Hexer'],'s2Hexer',2.35,'徐晃拆盾、張遼集火，把破甲與集中輸出接成完整攻擊鏈。','誘餌、煙霧與治療輪換，避免只依賴棺盾。'],
 [9,'魏武中軍','將軍',525,475,345,445,32,['s2Hexer','s2Decoy','s2Medic','s2Cleaver'],['s2Hexer','s2Decoy','s2Medic','s2Cleaver'],'s2Ram',2.5,'郭嘉把干擾留給施咒與破門蓄勢，普通敵交給軍陣處理。','先用普通攻勢逼出郭嘉干擾，再抓空窗重新施咒。'],
 [10,'北境鐵壁','決戰',550,500,370,470,36,['s2Rat','s2Nail','s2Coffin','s2Cleaver'],['s2Rat','s2Nail','s2Coffin','s2Cleaver','s2Smoke','s2Hook','s2Medic','s2Venom','s2Decoy','s2Hexer','s2Ram'],'s2Overseer',3.1,'卡位、破甲、集火與封策依序接上；混合波清完後迎戰唯一屍督。','輪換盾、偶、煙與醫官，讓破門撞屍累積衝勢突破薄弱路。']
];
const SEASON2_LEVELS={};
for(const c of configs){const [level,shortName,difficulty,plantStart,zombieStart,plantAI,zombieAI,enemyCount,openingZombies,zombieWeights,bossType,bossHpMultiplier,plantHint,zombieHint]=c,stage=SEASON2_PLAN.stages[level-1];SEASON2_LEVELS[level]={...base,level,name:`第二季・${shortName}`,shortName,difficulty,cardArt:stage.cardArt,cardText:stage.defense.story,plantHint,zombieHint,plantStart,zombieStart,plantAI,zombieAI,enemyCount,openingZombies,bossType,bossHpMultiplier,zombieWeights,firstZombieDelay:Math.max(7500,12000-level*450),openingSpacing:Math.max(4700,8500-level*360),minSpawnSpacing:Math.max(3000,6100-level*270),attackTimeLimit:180000+level*9000}}

// Turn the approved three-beat campaign plan into complete in-game story scenes.
for(const faction of ['plants','zombies'])for(const stage of SEASON2_PLAN.stages){if(SEASON2_STORY[faction][stage.number])continue;const route=stage[faction==='plants'?'defense':'attack'],defending=faction==='plants';SEASON2_STORY[faction][stage.number]={subtitle:defending?'魏軍沿北境整軍迎戰。':'另一種可能：屍軍沿北境組成攻城隊。',opening:route.beats.map((text,i)=>({speaker:i===0?(defending?'北境哨兵':'屍軍斥候'):i===1?(defending?'魏軍軍令':'攻城軍令'):(defending?'本關新援':'屍軍領隊'),text})),victory:[{speaker:defending?'魏軍軍令':'屍軍軍令',text:`${stage.name}戰線已拿下，下一段北境路線正式展開。`},{speaker:defending?'新援武將':'新編屍軍',text:`這場勝利證明了「${route.focus}」；新戰力已加入。`}],defeat:[{speaker:defending?'北境哨兵':'屍軍斥候',text:`${stage.name}的陣線仍有缺口，先重整出兵順序。`},{speaker:defending?'魏軍軍令':'攻城軍令',text:route.counter}]}}
function campaignLevels(season=currentSeason){return season===2?SEASON2_LEVELS:LEVELS}
function allCharacterKeys(side){return [...UNIT_ORDER[side],...SEASON2_UNIT_ORDER[side]]}
function seasonUnitAvailable(side,key,level,forPlayer=false){const d=(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[key];if(!d||(d.season||1)!==currentSeason)return false;if(currentSeason===1)return level>=(UNLOCK_LEVEL[side]?.[key]||1);return !d.clearRequired||(forPlayer?isCampaignLevelCompleted(side,d.clearRequired,2):level>d.clearRequired)}
function season2GuideForCombat(side,key){const guideKey=SEASON2_GUIDE_KEYS[key],list=side==='plants'?WEI_GUIDE:ZOMBIE_SEASON2_GUIDE;return list.find(x=>x.key===guideKey)}
