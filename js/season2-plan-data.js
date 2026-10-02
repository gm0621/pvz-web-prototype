// Editorial campaign plan only. Do not merge into LEVELS, match RPCs or player profiles.
// Rewards are granted AFTER the listed clear, never before that stage's first attempt.
const SEASON2_PLAN = {
  season: 2,
  name: '北境鐵壁',
  status: 'playable_complete',
  progression: {
    entry: '第二季卡片直接顯示；魏國守城與僵屍進攻都可各自從第一關開始。',
    modesIndependent: true,
    stageRule: '同模式依序通關；已通關關卡可自由重玩，不能跨關解鎖。',
    rewardRule: '每關首次通關後取得一位本方角色；當關首次挑戰不能使用該獎勵。',
    finalRewardRule: '曹操與陷城屍督於各自第十關通關後取得，只供重玩與後續季度使用。'
  },
  storyArc: {
    premise: '第一季北運棺車上的役魂紋一路指向魏境。屍軍不是漫無目的襲擊，而是在測量北境補給線、拆解軍陣，準備奪取能號令守軍與亡魂的中軍旗臺。',
    defenseGoal: '魏軍從臨時前哨一路後撤整軍，在補給線未斷前辨認屍軍戰法，最後於北境主城以完整軍陣守住中軍旗臺。',
    attackGoal: '僵屍方沿同一條戰線試探、拆盾、拉陣、斷援，逐步組成真正攻城隊；此路線是另一種可能，不推翻守城結局。',
    phases: [
      {stages:'1–3',name:'外圍試探',beat:'屍軍測量前哨、營門與軍道；玩家學會補給、盾弩軍陣與破盾／攔截。'},
      {stages:'4–7',name:'軍需爭奪',beat:'戰線進入糧倉、斷橋、兵坊與烽臺；雙方開始拉扯、治療、誘餌與集火協同。'},
      {stages:'8–10',name:'中軍決戰',beat:'屍軍以斷旗與破門隊逼近中軍；魏軍以破甲、封策與蓄謀反制，最終在北境鐵壁決戰。'}
    ],
    ending: '守城結局由曹操接掌整軍，確認役魂紋背後仍有更大的操旗者；攻城結局則由陷城屍督奪下旗臺，留下第四季跨陣營會戰的危機。兩條結局不把第三季吳國水戰提前混入。'
  },
  difficultyCurve: [
    {stages:'1–2',band:'入門',pressure:'少量、錯開出兵；先教單一組合，頭目獨立登場。'},
    {stages:'3–4',band:'普通',pressure:'加入突進／煙霧，但保留明顯前搖與可重整空格。'},
    {stages:'5–7',band:'進階',pressure:'開始拉陣、治療、毒液與誘餌協同；每波只突出一個主要問題。'},
    {stages:'8–9',band:'將軍',pressure:'破甲、干擾與多種支援分批混合，避免永久控制或無限治療。'},
    {stages:'10',band:'決戰',pressure:'有限混合波次後只出一名最終頭目；清場即勝，不用倒數拖時間。'}
  ],
  initial: {
    defense: ['tuntian-soldier','crossbow-soldier'],
    attack: ['rat-fang','rot-nail-crossbow']
  },
  rewards: {
    defense: ['shield-soldier','halberd-soldier','xiahou-dun','dian-wei','xu-chu','zhang-liao','xu-huang','guo-jia','sima-yi','cao-cao'],
    attack: ['coffin-shield','shield-cleaver','smoke-pot','chain-hook','corpse-medic','venom-sac','decoy-puppet','banner-hexer','gate-ram','siege-overseer']
  },
  stages: [
    {
      number:1, name:'霜土前哨', region:'外圍防區', light:'冷白清晨', hue:'#a7c1d2', cardArt:'assets/backgrounds/season2/s2-01.webp',
      artBrief:'灰白霜土、低矮木柵、遠處北境丘陵與少量靛藍魏旗。小型前哨，不是大城堡；保留清楚的平坦前景，不畫綠草坪。',
      defense:{
        story:'北境第一班哨兵發現屍群踏過霜土。屯田兵先建立補給，強弩兵逐路迎擊，守住尚未築好的防線。',
        focus:'學會後勤與分路配置；先用少量、錯開出現的敵人建立節奏。',
        beats:['哨兵回報霜土腳印分成多路。','腐釘弩屍進入射程，弩手要求分路校射。','插滿箭的棺板逼近，前哨迎戰第一名領隊。'],
        enemies:['rat-fang','rot-nail-crossbow'], leader:'coffin-shield',
        counter:'領隊最後單獨出場，沒有後排讓棺盾掩護；不要求尚未解鎖的破甲武將。'
      },
      attack:{
        story:'屍群先試探尚未成形的前哨。鼠牙群屍咬住前排，腐釘弩屍留下傷口，合力打開第一處缺口。',
        focus:'學會近戰接手骨釘標記；從薄弱路線集中突破。',
        beats:['屍群看見木柵尚未合攏，先分路試探。','腐釘留下第一處傷口，群屍收到集中撕咬的號令。','強弩領隊鎖住缺口，最後一波必須換路或搶先壓制。'],
        enemies:['tuntian-soldier','crossbow-soldier'], leader:'crossbow-soldier',
        counter:'守軍分批上場、沒有完整盾牆；基礎腦力自動補給，首關不依賴額外經濟角色。'
      }
    },
    {
      number:2, name:'石壘營門', region:'外圍防區', light:'陰天冷灰', hue:'#92a9b9', cardArt:'assets/backgrounds/season2/s2-02.webp',
      artBrief:'粗石堆砌的營門、木製橫樑、厚重石板路，兩側有破損旗架與箭孔。遠景是矮城壘，前景不用草地。',
      defense:{
        story:'第一批盾兵趕到營門，棺盾屍群也開始掩護後排。魏軍必須讓大盾承傷，為強弩爭取校射時間。',
        focus:'第一次建立盾在前、弩在後的同路軍陣。',
        beats:['營門回報棺板正掩護腐釘靠近。','大盾列陣後，強弩收到集中射擊命令。','裂盾斧聲撞上石門，守軍準備迎接破盾領隊。'],
        enemies:['rat-fang','coffin-shield','rot-nail-crossbow'], leader:'shield-cleaver',
        counter:'裂盾領隊數量有限，搭配後排輸出而非只補盾；仍有可調整的空格。'
      },
      attack:{
        story:'石壘弩箭開始集中射擊。把剛取得的棺盾放在前方，掩護腐釘弩屍靠近，避開最厚的守備點。',
        focus:'學會棺盾保護緊鄰後方；盾牌耐久不是無限資源。',
        beats:['屍兵發現石壘有一條尚未補齊的薄線。','棺盾被令到前方承箭，腐釘在後準備開傷口。','大盾領隊封住營門，屍群必須在棺板破裂前選定突破路。'],
        enemies:['crossbow-soldier','tuntian-soldier','shield-soldier'], leader:'shield-soldier',
        counter:'大盾先少量登場、路線不全封；裂盾斧屍要通關後才取得，不能作為必需解法。'
      }
    },
    {
      number:3, name:'拒馬長道', region:'外圍防區', light:'風起午後', hue:'#b7b3a2', cardArt:'assets/backgrounds/season2/s2-03.webp',
      artBrief:'延伸向遠方的灰褐軍道，道路外側交錯木拒馬、削尖木樁與破車輪。背景塵土低揚，五路前景仍完整平坦。',
      defense:{
        story:'屍群沿長道加速推進，破門撞屍開始蓄勢。長戟兵接管缺口，讓衝擊停在軍陣前方。',
        focus:'運用剛解鎖的長戟兵攔截突進，保留攔截冷卻。',
        beats:['遠哨看見長道盡頭的撞木開始加速。','長戟兵報告攔截冷卻，守軍先處理伴隨的斧屍與腐釘。','破門撞屍蓄滿衝勢，最後直線壓向缺口。'],
        enemies:['rat-fang','shield-cleaver','rot-nail-crossbow'], leader:'gate-ram',
        counter:'領隊只做可辨識的直線蓄勢，不跳到後勤身後；沒有強制封路地形。'
      },
      attack:{
        story:'魏軍把盾兵架在道路入口。裂盾斧屍先拆護盾，群屍與弩屍接續攻擊，不能只靠棺盾硬撐。',
        focus:'第一次安排掩護、破盾、輸出的先後順序。',
        beats:['屍軍辨認出盾兵與長戟交錯的入口。','裂盾斧先行開路，後隊等待盾勢削弱。','長戟領隊封住長道，普通步兵必須正面拆陣而非假裝突進。'],
        enemies:['shield-soldier','crossbow-soldier','halberd-soldier'], leader:'halberd-soldier',
        counter:'玩家此時沒有突進單位，長戟不會額外壓制所有普通步行兵。'
      }
    },
    {
      number:4, name:'風沙糧倉', region:'軍需腹地', light:'砂金傍晚', hue:'#d6b382', cardArt:'assets/backgrounds/season2/s2-04.webp',
      artBrief:'北地夯土糧倉、堆疊糧袋、棚架、半埋風沙的石板，暖金夕照配冷藍旗幟。風沙只做遠景氣氛，不遮滿畫面。',
      defense:{
        story:'煙罐屍群趁風接近糧倉。夏侯惇守在煙霧出口，以近戰反擊接住第一波壓力，讓屯田兵繼續補給。',
        focus:'遠程遇上煙霧減傷時，改用前排近戰接戰。',
        beats:['糧官聞到逆風飄來的屍煙，先撤開密集後勤。','煙中斧屍接近，夏侯惇要求前排留出近戰接敵位置。','鉤鏈越過煙幕，末段開始拉扯最前方守軍。'],
        enemies:['rat-fang','smoke-pot','shield-cleaver'], leader:'chain-hook',
        counter:'鉤鎖最後少量登場，仍保留空格可重整；不讓風沙造成命中率隨機懲罰。'
      },
      attack:{
        story:'糧倉外的弩箭密度提高。煙罐小屍掩護隊伍接近，裂盾斧屍與群屍在近距離拆開防線。',
        focus:'學會煙霧只減遠距直射傷害，不能無視近戰反擊。',
        beats:['煙罐開始順風鋪路，屍群等待弩線變暗。','裂盾斧與群屍離開煙幕接戰，近戰反擊仍然有效。','夏侯惇在糧倉口滿怒迎敵，最後一波不能只靠煙霧硬闖。'],
        enemies:['tuntian-soldier','crossbow-soldier','xiahou-dun'], leader:'xiahou-dun',
        counter:'夏侯惇只守少數路線；新取得的煙罐不是近戰無敵盾，可轉向突破後勤較弱的一路。'
      }
    },
    {
      number:5, name:'乾谷斷橋', region:'軍需腹地', light:'峽谷斜光', hue:'#c5a58e', cardArt:'assets/backgrounds/season2/s2-05.webp',
      artBrief:'乾涸裂谷上的寬石橋，遠處有斷裂舊橋與峭壁。主戰線是完整橋面，不畫河水、船隻或棋盤破洞，水戰留給吳國。',
      defense:{
        story:'鉤鎖越過橋面拉扯前排。典韋要守住身後弩兵，但整條防線也必須預留重整位置。',
        focus:'理解緊鄰承傷與站位被拉開的差別。',
        beats:['橋頭哨報鉤鎖已瞄準最前排，軍陣先留一格重整空間。','棺盾與腐釘接著上橋，典韋護住緊鄰後排。','裂盾領隊趁陣形被拉開時逼近，守軍集中火力收口。'],
        enemies:['chain-hook','coffin-shield','rot-nail-crossbow'], leader:'shield-cleaver',
        counter:'許褚在本關通過後才解鎖；首次挑戰可用交錯站位與火力處理，不能要求免拉扯。'
      },
      attack:{
        story:'典韋在橋頭護住後排，正面硬打損耗太大。鉤鎖屍卒把前排拉離支援位置，再交給群屍集中攻擊。',
        focus:'第一次以拉扯切開同路的前後排支援。',
        beats:['屍軍確認典韋只保護緊鄰後方的一人。','鉤鎖等待合法空位，把最前排拉離護衛關係。','典韋領隊親自守橋，最後衝線要避開完整護衛路。'],
        enemies:['shield-soldier','crossbow-soldier','dian-wei'], leader:'dian-wei',
        counter:'只拉最前方目標且落點必須空著，不直接把後排軍師拖出；守方佈陣保留可拉的空間。'
      }
    },
    {
      number:6, name:'鐵爐兵坊', region:'軍需腹地', light:'爐火與鐵藍', hue:'#e6a575', cardArt:'assets/backgrounds/season2/s2-06.webp',
      artBrief:'石造軍械工坊、熔爐暖光、鐵砧、兵器架與煤灰。不是燃燒中的城市；中央保持深灰石板，火光放兩側與遠景。',
      defense:{
        story:'兵坊外的屍軍靠縫補維持戰力。許褚先卡住重兵，魏軍再集中弩火，避免各路零散傷害被補回。',
        focus:'學會卡住威脅、逐個擊倒，而不是平均消耗所有敵人。',
        beats:['工匠回報受傷屍兵正在後方被重新縫合。','許褚卡住重兵，弩隊改為逐個完成擊倒。','破門撞屍從爐火外蓄勢，末段不能讓醫官持續補回。'],
        enemies:['coffin-shield','corpse-medic','shield-cleaver'], leader:'gate-ram',
        counter:'醫官治療有空窗且不互補；張遼尚未取得，普通弩兵集中配置也必須能突破治療量。'
      },
      attack:{
        story:'許褚擋住通往兵坊的重點路線。縫屍醫官保住前排，腐釘與裂盾接力消耗，或選另一條較薄的防線。',
        focus:'學會續戰與保護醫官，不讓醫官走到最前面。',
        beats:['醫官檢查前排傷勢，屍軍先選定需要續戰的主路。','腐釘與裂盾輪流接戰，醫官保持在可治療但不貼臉的位置。','許褚領隊鎮住兵坊入口，重兵路與薄弱路的取捨進入最後階段。'],
        enemies:['shield-soldier','halberd-soldier','xu-chu'], leader:'xu-chu',
        counter:'許褚站穩後不易被拉扯；不要把上一關的鉤鎖變成萬用解法，也不全路堆滿許褚。'
      }
    },
    {
      number:7, name:'烽臺夜哨', region:'軍需腹地', light:'靛藍夜色', hue:'#90aaf0', cardArt:'assets/backgrounds/season2/s2-07.webp',
      artBrief:'高處石造烽火臺、城垛、冷月與稀疏橘色火盆。天空偏靛藍，剪影清楚；不用全黑或濃霧遮住角色。',
      defense:{
        story:'草偶與毒液拖慢夜哨的判斷。張遼標記真正威脅，帶同路火力優先處理噴屍，避免把所有弩箭耗在誘餌上。',
        focus:'分辨誘餌、持續傷害與真正需要集火的目標。',
        beats:['夜哨先看見草偶影子，張遼要求確認本體再集火。','毒囊開始鼓脹，軍情標出真正的短射程威脅。','棺盾領隊護送末段隊伍，守軍輪換目標避免浪費校射。'],
        enemies:['decoy-puppet','venom-sac','rot-nail-crossbow'], leader:'coffin-shield',
        counter:'草偶數量與存活時間有限，標記不被草偶直接移除；每波間保留毒液消退的空窗。'
      },
      attack:{
        story:'張遼指揮弩兵集中火力。毒囊噴屍在棺盾後方接近，把腐液留在密集陣位，逼魏軍不能只靠站樁輸出。',
        focus:'學會短射程持續範圍傷害與前排掩護配合。',
        beats:['屍軍發現張遼開始標記主攻路的第一個目標。','棺盾掩護毒囊接近，噴吐前搖成為關鍵窗口。','張遼領隊完成集火號令，末段改以輪換掩護突破。'],
        enemies:['shield-soldier','crossbow-soldier','zhang-liao'], leader:'zhang-liao',
        counter:'腐液不附加暈眩或永久減防；噴屍需冒著接近風險，不能站在出場點就攻擊全圖。'
      }
    },
    {
      number:8, name:'霜骨古道', region:'內城決戰', light:'雪後薄暮', hue:'#b4c9d8', cardArt:'assets/backgrounds/season2/s2-08.webp',
      artBrief:'古老石道、覆霜斷碑、枯松與散落盔甲，遠處出現高城牆輪廓。淡雪只是裝飾，不做冰面滑動或暴風特效。',
      defense:{
        story:'厚盾與急縫護盾層層掩護屍群。徐晃拆開防護，張遼與弩兵跟上；斷旗咒屍在最後試探軍陣的支援。',
        focus:'把破甲與集火接成完整攻擊鏈。',
        beats:['古道前段出現棺盾與急縫護盾的雙層防護。','徐晃先拆盾，張遼標記暴露的關鍵目標。','斷旗咒屍開始蓄咒，軍師尚未到場也能用普通火力處理。'],
        enemies:['coffin-shield','corpse-medic','gate-ram'], leader:'banner-hexer',
        counter:'郭嘉通關後才取得；斷旗先以單一領隊登場，普通攻擊仍可擊倒，不把封策當唯一解。'
      },
      attack:{
        story:'徐晃開始快速拆盾，單靠棺盾已撐不住。替身偶屍分擔普通直射火力，煙霧與醫官接手，輪換掩護手段。',
        focus:'學會不只依賴盾牌；使用誘餌、煙霧與治療交替推進。',
        beats:['屍軍確認徐晃會持續削弱同一面盾。','草偶先吸收直射，煙霧與醫官接續補上掩護空窗。','徐晃領隊踏上古道，末段必須靠多種掩護輪換而非單一棺盾。'],
        enemies:['crossbow-soldier','xu-huang','dian-wei'], leader:'xu-huang',
        counter:'草偶不能吸走所有指定技能；魏軍不全路配置徐晃，仍保留普通小兵路線。'
      }
    },
    {
      number:9, name:'魏武中軍', region:'內城決戰', light:'戰前暗金', hue:'#c2ad80', cardArt:'assets/backgrounds/season2/s2-09.webp',
      artBrief:'靛藍中軍帳、排列整齊的魏旗、戰鼓與木製議事臺，後方是高城牆。深藍布帳配少量金色晨光，不放人物大頭或文字。',
      defense:{
        story:'斷旗、草偶與醫官開始協同推進。郭嘉抓住施咒前搖，魏軍在技能空窗拆掉關鍵支援，迎接最後城門戰。',
        focus:'判斷值得干擾的技能，不把控制平均分給每個小屍。',
        beats:['中軍報告斷旗、草偶與醫官分批入場，先辨認施咒者。','郭嘉只干擾最急迫的蓄勢，普通敵仍由軍陣處理。','破門撞屍在末段蓄勢，守軍把最後干擾留給真正的攻城窗口。'],
        enemies:['banner-hexer','decoy-puppet','corpse-medic','shield-cleaver'], leader:'gate-ram',
        counter:'同目標有干擾保護；先分批介紹組合，末段再混合，不堆成永久封控。'
      },
      attack:{
        story:'郭嘉與護衛守住中軍。斷旗咒屍暫時削弱友軍支援，屍軍用普通攻擊先逼出干擾，再抓空窗重新施咒。',
        focus:'理解切斷外部增益，不等於刪掉武將自身天賦。',
        beats:['屍軍看見郭嘉正在監視第一個施法前搖。','普通攻擊先逼出干擾，斷旗咒屍等待保護時間結束。','司馬懿領隊進入中軍並開始蓄謀，末段要在層數成形前突破。'],
        enemies:['guo-jia','dian-wei','crossbow-soldier','shield-soldier'], leader:'sima-yi',
        counter:'司馬懿最後才增援，先保留低謀略窗口；郭嘉可被普通輸出擊倒，不要求技能一定觸發。'
      }
    },
    {
      number:10, name:'北境鐵壁', region:'內城決戰', light:'破曉決戰', hue:'#aac3ee', cardArt:'assets/backgrounds/season2/s2-10.webp',
      artBrief:'巨大北境要塞主門、層疊城牆、對稱城樓與靛藍魏旗，冷白破曉穿過雲層，少量戰火。宏大但保持乾淨中央前景，不畫河道與船。',
      defense:{
        story:'陷城屍督帶著破陣屍軍抵達主城門。司馬懿在護衛後方蓄謀，魏軍用卡位、破甲、集火與封策守住最後一線。',
        focus:'有限混合波次後迎戰唯一的陷城屍督；清完敵軍與頭目立即勝利。',
        beats:['城樓逐波回報已排定的破盾、毒液與支援兵力，不猜測隨機兵種。','司馬懿完成蓄謀前，魏軍依序卡位、破甲、集火並封住關鍵技能。','混合波次清空後陷城屍督單獨進場，披甲、指揮與蓄勢重擊依階段明示。'],
        enemies:['rat-fang','rot-nail-crossbow','coffin-shield','shield-cleaver','smoke-pot','chain-hook','corpse-medic','venom-sac','decoy-puppet','banner-hexer','gate-ram'], leader:'siege-overseer',
        counter:'曹操是本關通關獎勵，首次挑戰不得要求他的軍旗。頭目有披甲、指揮、蓄勢重擊階段，但不無限召兵。'
      },
      attack:{
        story:'曹操在城門後整軍，魏國小兵也成為完整防線。破門撞屍利用前進距離累積衝勢，搭配全隊掩護與拆盾，攻破最後城門。',
        focus:'整合破盾、誘餌、治療、斷旗與第一擊突破，而非只堆最貴角色。',
        beats:['屍軍逐波偵察魏軍旗臺，軍情標出每波真實守備人數與薄弱路。','破門撞屍累積衝勢，盾、偶、煙與醫官輪流覆蓋其接近窗口。','曹操最後整軍登場，小兵在軍令下強化；屍軍集中全部協同攻破一條合法路線。'],
        enemies:['tuntian-soldier','crossbow-soldier','shield-soldier','halberd-soldier','xiahou-dun','dian-wei','xu-chu','zhang-liao','xu-huang','guo-jia','sima-yi'], leader:'cao-cao',
        counter:'陷城屍督是本關通關獎勵，首次挑戰不能使用。精英分波分路上場，不同時塞滿所有武將；可破壞的薄弱路線必須存在。'
      }
    }
  ]
};
// Read-only design data, no storage or actual unlock mutation.
(function freezePlan(value){Object.values(value).forEach(v=>{if(v&&typeof v==='object')freezePlan(v)});Object.freeze(value)})(SEASON2_PLAN);
