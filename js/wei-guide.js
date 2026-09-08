// Season 2 editorial preview only. Never add these records to combat/profile dictionaries.
const WEI_GUIDE = [
  {key:'tuntian-soldier',name:'屯田兵',role:'經濟與補給',attack:'定期生產軍糧。',intro:'保護後勤才能養出穩定的軍糧收益，是魏國持久戰的起點。',talent:'屯田積穀',effect:'一段時間沒有受傷，下一次補給增加；受傷後重新累積。',limit:'遭到遠程騷擾會打斷屯田收益。'},
  {key:'shield-soldier',name:'大盾兵',role:'軍陣前排',attack:'近距離盾擊。',intro:'架起大盾穩住正面戰線，讓身後弩兵有時間完成校射。',talent:'列盾',effect:'停止交戰一段時間後架盾，減少來自正面的傷害。',limit:'側路濺射、範圍傷害與持續消耗仍能威脅防線。'},
  {key:'crossbow-soldier',name:'強弩兵',role:'後排集火',attack:'射速較慢的單路弩箭。',intro:'越專注同一個敵人，弩箭越有威脅；是獵殺厚血敵人的主力。',talent:'校射',effect:'連續攻擊同一目標，逐步提高對其傷害；換目標重新累積。',limit:'大量低血小屍會頻繁打斷校射收益。'},
  {key:'halberd-soldier',name:'長戟兵',role:'攔截突進',attack:'近距離戟刺。',intro:'把長戟列在防線缺口，專門阻擋跑屍、跳屍的突然突破。',talent:'拒馬列戟',effect:'敵人快速接近或跳入守備範圍時，觸發攔截傷害並中止該次突進；有獨立冷卻。',limit:'不直接取消頭目的特殊位移。'},
  {key:'xiahou-dun',name:'夏侯惇',role:'受傷反擊型前排',attack:'近戰大刀。',intro:'把承受的傷害化成怒氣，越是激烈的正面交鋒，反擊越有威脅。',talent:'拔矢不屈',effect:'受到敵方傷害時累積怒氣；滿怒後下一次普通攻擊追加反擊傷害。',skill:'獨目修羅',skillEffect:'反擊時有機率短暫進入不屈狀態，降低受傷並向面前敵人追加一刀。',limit:'怒氣有上限，不由反傷或自傷重複觸發。'},
  {key:'dian-wei',name:'典韋',role:'替隊友承傷的護衛',attack:'雙戟近戰。',intro:'以自身血肉守住身後隊友，讓脆弱的弩兵、軍師與後勤繼續發揮。',talent:'帳前死衛',effect:'替同一路緊鄰後方的一名友軍分擔部分傷害；分擔量有上限。',skill:'惡來護主',skillEffect:'被保護友軍遭受重擊時，有機率獲得短暫護盾；典韋同時向面前敵人發動雙戟重擊。',limit:'一次只保護一個目標，典韋之間不能互相分擔。'},
  {key:'xu-chu',name:'許褚',role:'卡住大型敵人的重坦',attack:'慢速重錘。',intro:'不把敵人打走，而是把它留在前線，交給後排慢慢處理。',talent:'虎軀鎮關',effect:'接戰後不易被推移；纏住與自己近戰的一般敵人，阻止其穿越。',skill:'虎痴擒王',skillEffect:'重擊大型敵人時，有機率短暫壓制其普通行動並造成額外傷害。',limit:'纏鬥目標數有限；頭目壓制時間縮短，不能永久控制。'},
  {key:'zhang-liao',name:'張遼',role:'指定集火的突擊指揮官',attack:'近戰長戟。',intro:'帶全隊先拆掉關鍵目標，再乘勝鼓舞同路軍隊持續進攻。',talent:'先登破陣',effect:'首次接戰標記破陣目標；同一路友軍對其傷害提高。目標倒下後需短暫間隔才能再標記。',skill:'威震逍遙津',skillEffect:'擊倒破陣目標時，有機率短時間提高同一路友軍的攻擊速度。',limit:'標記不疊加；鼓舞不影響軍糧生產或技能冷卻。'},
  {key:'xu-huang',name:'徐晃',role:'拆護甲與護盾',attack:'近戰大斧。',intro:'拆開重裝敵人的防護，把原本難打的目標變成全隊都能處理的弱點。',talent:'長驅破甲',effect:'連續斧擊逐步削弱目標的護甲效果；換目標後重新破甲。',skill:'斷壁開山',skillEffect:'攻擊帶護甲或護盾的敵人時，有機率施展破盾重斬，額外消耗護盾並延長破甲時間。',limit:'破甲有下限；護甲與護盾敵人預計隨第二季設計。'},
  {key:'guo-jia',name:'郭嘉',role:'干擾敵方技能的軍師',attack:'低傷害遠程策令。',intro:'看穿敵方蓄勢，打亂施咒與召喚的節奏，不靠全場傷害取勝。',talent:'料敵先機',effect:'偵測同一路敵人的技能蓄勢，延後其中一個目標的下一次技能；有干擾冷卻。',skill:'遺計定局',skillEffect:'成功干擾時，有機率短暫封策，禁止目標施放特殊能力；仍可移動與普通攻擊。',limit:'同目標不能連續被延後；不取消死亡自爆，頭目具抗性。'},
  {key:'sima-yi',name:'司馬懿',role:'越打越有利的持久戰軍師',attack:'單路遠程謀略攻擊。',intro:'先保住他，等謀略成形後，讓整條戰線的火力一起放大。',talent:'隱忍蓄謀',effect:'在場存活一段時間便累積謀略，提高自己的攻擊效果；層數有上限。',skill:'鷹視狼顧',skillEffect:'普通攻擊時有機率消耗部分謀略，暴露目標弱點；短時間內每承受一定次數友軍攻擊，就追加一次傷害。',limit:'追加傷害有觸發間隔，不能再次觸發自身效果。'},
  {key:'cao-cao',name:'曹操',role:'讓小兵真正成軍的核心',attack:'中距離指揮劍氣，個人輸出中等。',intro:'不是叫出更多士兵，而是把已部署的小兵培養成值得留到終局的精兵。',talent:'軍令如山',effect:'強化附近魏國小兵：大盾兵架盾更穩、強弩兵校射更快、長戟兵攔截後更快備戰。',skill:'魏武揚旌',skillEffect:'交戰時有機率展開短暫軍旗，範圍內魏軍獲得護盾，小兵額外獲得短暫攻速提升。',limit:'同類加成不疊加，不直接增加資源生產。'}
].map(d=>Object.freeze({...d,asset:`assets/characters/future-generals/wei-season2/${d.key}.webp`}));
Object.freeze(WEI_GUIDE);

function weiText(tag,text,className){
  const el=document.createElement(tag);
  el.textContent=text;
  if(className)el.className=className;
  return el;
}
function buildWeiCharacterGrid(){
  const grid=$('characterGrid');
  grid.replaceChildren();
  WEI_GUIDE.forEach(d=>{
    const card=document.createElement('article');
    card.className='char-profile wei-profile';
    card.dataset.weiKey=d.key;
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.setAttribute('aria-label',`查看${d.name}介紹`);
    const img=document.createElement('img');img.src=d.asset;img.alt=d.name;img.decoding='async';
    const summary=document.createElement('div');summary.className='ability-summary wei-ability-summary';
    summary.append(weiText('b',`天賦：${d.talent}`),weiText('span',d.effect));
    if(d.skill)summary.append(weiText('b',`機率技能：${d.skill}`),weiText('span',d.skillEffect));
    else summary.append(weiText('small','小兵以固定天賦為主'));
    card.append(img,weiText('h3',d.name),weiText('div',d.role,'wei-role'),weiText('span','第二季預告｜尚未開放','wei-preview-badge'),weiText('p',d.intro),summary,weiText('div','查看普通行動與設計限制 →','statusline'));
    card.onclick=()=>showCharacterDetail('wei',d.key);
    card.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();card.click()}};
    grid.appendChild(card);
  });
}
function showWeiCharacterDetail(key){
  const d=WEI_GUIDE.find(unit=>unit.key===key);
  if(!d)return;
  $('charModal').classList.add('wei-preview');
  $('charModalImg').src=d.asset;$('charModalImg').alt=d.name;
  $('charModalName').textContent=d.name;
  $('charModalRole').textContent=`魏國｜第二季預告｜${d.role}`;
  $('charModalIntro').textContent=d.intro;
  $('charModalSkillTitle').textContent='天賦與技能提案';
  $('charModalStatsTitle').textContent='定位與設計限制';
  $('charModalSkill').textContent=`普通行動：${d.attack}\n\n天賦：${d.talent}（固定生效）\n${d.effect}\n\n${d.skill?`機率技能：${d.skill}\n${d.skillEffect}`:'小兵以固定天賦為主，不另設機率大招。'}`;
  $('charModalRange').replaceChildren();
  $('charModalStats').replaceChildren();
  [['開放狀態','僅供介紹，尚未開放出戰。'],['戰術定位',d.role],['設計限制',d.limit],['數值規劃','費用、血量、範圍、冷卻與機率尚未定案。']].forEach(([title,text])=>{
    const item=document.createElement('div');item.className='stat-pill';item.append(weiText('b',title),weiText('span',text));$('charModalStats').appendChild(item);
  });
  $('charModal').classList.add('show');
  document.querySelector('#charModal .char-detail-card').scrollTop=0;
  sfx('click');
}
