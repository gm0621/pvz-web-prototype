// Romance of the Three Kingdoms, chapter one. Season 3 identifies this separate
// campaign; all combat still runs through the existing defense engine.
const ROMANCE_SEASON=3;
const ROMANCE_ROSTER=['potato','sunflower','wallnut','peashooter','rMilitia','firepea','zhangfei','liubei'];
PLANT_TYPES.rMilitia={...PLANT_TYPES.swordSoldier,name:'義軍刀兵',hidden:false,season:3,cost:75,cooldown:5200,marchingInfantry:true,desc:'主動向前推進，近身接戰；在遭遇戰中可攻擊敵營。'};
const ROMANCE_PORTRAITS={劉備:PLANT_TYPES.liubei.asset,關羽:PLANT_TYPES.firepea.asset,張飛:PLANT_TYPES.zhangfei.asset};
const ROMANCE_ENEMIES={
 rRecruit:['黃巾步卒','normal','assets/characters/ambush-scout.webp'],
 rShield:['黃巾盾兵','cone','assets/characters/shield-general.webp'],
 rArcher:['黃巾弓手','peaZombie','assets/characters/shu-archer.webp'],
 rCaptain:['黃巾頭目','bucket','assets/characters/shield-general.webp'],
 rDengMao:['鄧茂','bucket','assets/characters/shield-general.webp'],
 rChengYuanzhi:['程遠志','bucket','assets/characters/shield-general.webp'],
 rTrainer:['演武教頭','normal','assets/characters/ambush-scout.webp']
};
for(const [key,[name,base,asset]] of Object.entries(ROMANCE_ENEMIES)){
 ZOMBIE_TYPES[key]={...ZOMBIE_TYPES[base],name,season:3,asset,battleAsset:asset,attackFrames:undefined,attackFrameDurations:undefined,attackHitAt:undefined,emoji:'⚔️',desc:'演義篇人類兵將，沿用現有兵種戰鬥規則。'};
}
const romanceLines=rows=>rows.map(([speaker,text])=>({speaker,text}));
const ROMANCE_CHAPTER_OPENING=romanceLines([
 ['旁白','黃巾起事，各地招募義兵。劉備在涿縣結識張飛，又與前來投軍的關羽相遇，三人相約共赴大事。'],
 ['張飛','俺莊後有一片桃園，花開得正盛。明日就在那裡結為兄弟，如何？'],
 ['劉備','備願與二位同心協力，救困扶危，讓百姓重得安寧。'],
 ['關羽','關某願以此心，與兄弟共進退。'],
 ['張飛','從今往後，有難同當，有仗一起打！'],
 ['旁白','桃花為證，天地為盟。三人結為兄弟，劉備為兄、關羽次之、張飛為弟。鄉勇陸續前來，一支義軍就此成形。']
]);
const ROMANCE_CHAPTER_ENDING=romanceLines([
 ['青州百姓','城門守住了！多謝各位將軍！'],
 ['劉備','能讓百姓平安，才不負桃園之誓。'],
 ['關羽','黃巾之亂尚未平定，我們仍須前行。'],
 ['張飛','大哥去哪，俺就去哪！'],
 ['劉備','聽聞恩師盧植正在廣宗與黃巾交戰，我們前去相助。'],
 ['旁白','第一章完。下一章「黃巾烽火」：三兄弟將投奔盧植，走入更大的戰局。下一章尚未開放。']
]);
const ROMANCE_STAGE_SPECS=[
 {name:'義軍初成',place:'涿縣・桃園外',adapted:true,focus:'先補軍糧，再以盾將掩護弓兵。',count:8,food:400,boss:'rTrainer',enemies:['rRecruit'],
  opening:[['劉備','鄉勇雖已聚齊，仍須練好隊形，才能保護鄉里。'],['關羽','軍糧官留在後方，盾將護住弓手，各路照應。'],['張飛','好！就讓教頭帶人試試咱們的防線！']],
  victory:[['演武教頭','陣形已成，鄉勇也懂得互相照應了。'],['劉備','兩位商人願資助馬匹與軍械，我們總算能整軍出發。']],
  defeat:[['關羽','這只是演練，先看清哪一路缺了守軍。'],['劉備','早些部署軍糧官，再把盾將和弓手配成一線。']]},
 {name:'糧道遇襲',place:'涿郡・運糧小徑',adapted:true,focus:'擊退攔路敵軍，保住起兵物資。',count:10,food:425,boss:'rCaptain',enemies:['rRecruit','rShield'],
  opening:[['旁白','張世平、蘇雙資助義軍。運送物資途中，一隊黃巾散兵攔住去路。此段遭遇為遊戲改編。'],['張飛','這是鄉親們託付的糧草，哪能讓你們搶走！'],['劉備','先守住道路。擊退攔路敵軍，再將物資送回營中。']],
  victory:[['張飛','攔路的都退了，糧草一袋也沒少！'],['關羽','軍械已備，接下來便是真正的戰場。']],
  defeat:[['劉備','先帶鄉勇退回安全處，物資不能再落單。'],['關羽','盾兵耐打，集中同路火力，別讓各線只剩單兵。']]},
 {name:'大興山迎敵',place:'涿郡・大興山',focus:'守住五路，擊敗敵將鄧茂。',count:12,food:450,boss:'rDengMao',enemies:['rRecruit','rShield'],
  opening:[['旁白','程遠志率黃巾軍來犯涿郡。義軍奉命出戰，在大興山下與敵軍相遇。'],['鄧茂','區區鄉勇，也敢擋我大軍？'],['張飛','誰說鄉勇就怕你？俺來會會你！']],
  victory:[['張飛','先鋒已敗！大哥，咱們守住了！'],['關羽','莫急，程遠志正在整軍，下一陣交給關某。']],
  defeat:[['劉備','收攏鄉勇，先穩住陣腳。'],['張飛','俺頂住前排，後面的弓手別斷了支援！']]},
 {name:'關羽初揚名',place:'大興山・敵軍本陣',focus:'抵擋主力，擊敗程遠志。',count:14,food:475,boss:'rChengYuanzhi',enemies:['rRecruit','rShield','rArcher'],
  opening:[['程遠志','竟敢敗我先鋒！誰來接戰？'],['關羽','三弟稍歇，此人交給關某。'],['劉備','眾鄉勇守住各路，莫讓敵軍繞過雲長！']],
  victory:[['旁白','程遠志敗，黃巾軍退散。三兄弟初立戰功，涿郡之危暫解。'],['軍使','青州城遭到圍攻，太守龔景遣人求援！']],
  defeat:[['關羽','敵將尚有兵力掩護，不能只顧眼前一路。'],['劉備','留下補防的軍糧，再迎戰下一波。']]},
 {name:'青州告急',place:'青州・城外山道',focus:'擊退阻截部隊，替援軍打開道路。',count:16,food:500,boss:'rCaptain',enemies:['rRecruit','rShield','rArcher'],
  opening:[['劉備','青州百姓正盼著援軍，備願前往相救。'],['鄒靖','我與諸位同行。前方敵軍眾多，先打開進軍道路。'],['關羽','弓手在後，盾兵在前，留意兩側的敵軍。']],
  victory:[['鄒靖','阻截部隊已退，但城外黃巾主力仍多，正面硬攻難以解圍。'],['劉備','先退軍下寨，再設伏誘敵。雲長、翼德，隨我議計。']],
  defeat:[['劉備','求援雖急，也不可讓鄉勇白白折損。'],['關羽','先補足各路防線，再一同推進。']]},
 {name:'三路破黃巾',place:'青州・伏兵山口',focus:'守住誘敵陣地，擊敗黃巾主力。',count:18,food:525,boss:'rCaptain',enemies:['rRecruit','rShield','rArcher'],
  opening:[['劉備','我與鄒校尉引敵追來，二弟、三弟分伏左右。聽見號令，一同出擊。'],['關羽','左路已備妥。'],['張飛','右路也準備好了，就等大哥號令！'],['旁白','號令一響，兩翼伏兵齊出。請以原有部署玩法守住五路；三路夾攻由劇情呈現。']],
  victory:[['關羽','伏兵已出，敵軍陣勢大亂！'],['鄒靖','龔太守帶守軍出城接應了，青州之圍已解！']],
  defeat:[['劉備','伏兵尚未站穩，先撤回山口重整。'],['張飛','別急著把軍糧花光，俺和二哥要一起照應各路！']]}
];
const ROMANCE_LEVELS={},ROMANCE_STORY={plants:{}};
ROMANCE_STAGE_SPECS.forEach((spec,index)=>{
 const level=index+1;
 const battles=['training','escort','clash','duel','clash','clash'],labels=['演武練兵','護送糧車','雙方進攻','敵將決戰','突圍救援','三路夾攻'];
 ROMANCE_LEVELS[level]={...LEVELS[1],level,name:`演義 1-${level}・${spec.name}`,shortName:spec.name,theme:'day',nightMode:false,cardArt:undefined,plantStart:spec.food,plantAI:220+level*30,plantIncome:35,enemyCount:spec.count,openingZombies:[spec.enemies[0]],zombieWeights:spec.enemies,basicEnemy:'rRecruit',bossType:spec.boss,bossHpMultiplier:1.4+level*.1,firstZombieDelay:11000,openingSpacing:6500,minSpawnSpacing:4800,incomeMin:4500,incomeMax:6500,difficulty:level<=2?'入門':level<=4?'普通':'章末挑戰',cardText:spec.focus,plantHint:spec.focus,romance:true,romanceBattle:battles[index],battleLabel:labels[index]};
 ROMANCE_STORY.plants[level]={subtitle:`${spec.place}｜${spec.adapted?'遊戲改編關卡':'依演義事件改編'}`,opening:romanceLines(spec.opening),victory:romanceLines(spec.victory),defeat:romanceLines(spec.defeat)};
});
// The chapter varies its objectives while preserving costs, combat and controls.
ROMANCE_STAGE_SPECS[1].focus='護送中央路糧車抵達右側，並擊敗攔路敵軍。';
ROMANCE_STAGE_SPECS[2].focus='雙方同時進軍：派義軍刀兵向前攻破敵營，保住己方營地。';
ROMANCE_STAGE_SPECS[4].focus='突破青州外圍：以刀兵與武將推進，攻破阻截敵營。';
ROMANCE_STAGE_SPECS[5].focus='上、中、下三路援兵同時出陣，擊破黃巾敵營。';
ROMANCE_STORY.plants[6].opening[3]={speaker:'旁白',text:'號令一響，三路義軍齊出。雙方同時進攻，率領刀兵攻破敵營；軍糧官與盾將留守後方。'};
for(let level=1;level<=6;level++){ROMANCE_LEVELS[level].cardText=ROMANCE_STAGE_SPECS[level-1].focus;ROMANCE_LEVELS[level].plantHint=ROMANCE_STAGE_SPECS[level-1].focus}
