// Second-season zombie editorial previews only; deliberately outside combat/profile dictionaries.
const ZOMBIE_SEASON2_GUIDE=Object.freeze([
 {key:'coffin-shield',name:'棺盾小屍',role:'替後方擋箭的前排',attack:'近距離撞盾。',intro:'扛著插滿箭的棺材板，替後方投石兵與施法者掩護前進。',talent:'棺板掩護',effect:'盾牌具有獨立耐久；架盾前進時，攔下原本射向同一路緊鄰後方友軍的部分普通直射彈丸，消耗盾牌耐久。',limit:'近戰、穿透與範圍攻擊不能全部擋下。盾牌破裂後不會重新長盾。'},
 {key:'shield-cleaver',name:'裂盾斧屍',role:'專門拆盾的攻堅兵',attack:'慢速近戰斧擊。',intro:'不一定能獨自擊倒前排，但能替身後屍群劈開盾陣。',talent:'啃盾裂甲',effect:'攻擊有護盾的守軍時，優先大幅消耗護盾；連續命中架盾目標可短暫削弱架盾減傷。',skill:'斷盾重劈',skillEffect:'命中護盾或架盾目標時，有機率追加破盾重擊。',limit:'對無盾目標的效率普通。不封鎖典韋承傷或夏侯惇反擊。'},
 {key:'smoke-pot',name:'煙罐小屍',role:'掩護屍群接近的輔助兵',attack:'近距離陶罐敲擊，傷害低。',intro:'背著漏煙陶罐，替行動緩慢的重兵鋪出掩護路線。',talent:'屍煙掩行',effect:'定期在自己附近的同一路留下短暫煙霧，降低煙中僵屍受到的遠距普通直射傷害。',limit:'近戰、地面陷阱與範圍傷害照常有效。煙霧不疊加、不造成無敵。'},
 {key:'chain-hook',name:'鉤鎖屍卒',role:'把前排拉離軍陣',attack:'近距離鐵鉤揮擊。',intro:'不是跳過前排，而是用鉤鏈把守軍拉出隊友的支援位置。',talent:'勾陣',effect:'週期性鉤住同一路最前方守軍；若其朝僵屍方向的相鄰格為空，將它拉近一格。',skill:'纏鏈拖行',skillEffect:'成功鉤中時，有機率附加短暫攻速降低。',limit:'不直接鉤走後排、不拉進佔用格。同目標受拉後有短暫保護；許褚可抵抗拉扯。'},
 {key:'corpse-medic',name:'縫屍醫官',role:'讓舊僵屍撐得更久',attack:'近距離針刺，傷害低。',intro:'背著針線與繃帶，修補已投入戰線的重兵，而不是再召出新兵。',talent:'補肉縫骨',effect:'週期性修補附近同一路的一名受傷僵屍，優先選擇失血比例較高的目標。',skill:'急縫續命',skillEffect:'治療時有機率額外附上短暫護盾。',limit:'不復活、不修盾牌耐久。醫官不治療自己或其他醫官；治療量與頻率有限。'},
 {key:'banner-hexer',name:'斷旗咒屍',role:'暫時切斷支援的軍陣干擾者',attack:'低傷害單路咒符。',intro:'守軍仍能行動，但暫時無法得到完整的團隊支援。',talent:'孤軍咒',effect:'週期性對同一路一名守軍施咒，短暫降低它從其他友軍取得的護盾與增益效果。',skill:'斷旗封援',skillEffect:'施咒時有機率讓目標短暫無法取得新的友軍增益。',limit:'不刪自身天賦、裝備或永久能力，不清除司馬懿謀略；不一次關閉整路光環。郭嘉能干擾施咒。'},
 {key:'decoy-puppet',name:'替身偶屍',role:'打亂集火的誘餌兵',attack:'近距離木刺。',intro:'躲在巨大草偶後偷笑，讓弩兵把時間花在錯的目標上。',talent:'草偶替身',effect:'定期在前方放出短暫存在的草偶；草偶不移動、不攻擊，但會被普通直射攻擊視為前方目標。',skill:'假面脫殼',skillEffect:'草偶被摧毀時，有機率讓本體獲得短暫減傷。',limit:'每名偶屍同時只有一個草偶。草偶耐久低，易受穿透與範圍攻擊；不移除張遼標記、不計入正式波次或重複給獎。'},
 {key:'siege-overseer',name:'陷城屍督',role:'第二季關底頭目／全破獎勵候選',attack:'近距離破城錘。',intro:'穿著攻城重甲、背負屍軍指揮旗，把現有屍群組成攻城隊。',talent:'攻城督令',effect:'週期性指定同一路最前方守軍為攻城目標，讓附近僵屍更擅長破壞其護盾與防禦姿態。',skill:'破陣號令',skillEffect:'攻城目標倒下時，有機率鼓舞附近僵屍短暫提高攻速。',limit:'指令不疊加、不永久加速。頭目擬採披甲→破甲後指揮→蓄勢重擊；郭嘉可延後部分指令。全破獎勵仍為候選，可玩版不照搬頭目血量與階段能力。'}
].map(d=>Object.freeze({...d,asset:`assets/characters/zombie-army/season2/${d.key}.webp`})));
let zombieGuideSeason=1;
function prepareZombieGuide(roster){
 const show=roster==='zombies',preview=show&&zombieGuideSeason===2;
 $('zombieSeasonTabs').hidden=!show;
 $('zombieSeasonIntro').hidden=!preview;
 $('characters').classList.toggle('zombie2-guide',preview);
 document.querySelectorAll('[data-zombie-season]').forEach(b=>{const active=Number(b.dataset.zombieSeason)===zombieGuideSeason;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 if(preview)buildPreviewCharacterGrid('zombie2',ZOMBIE_SEASON2_GUIDE);
 return preview;
}
document.querySelectorAll('[data-zombie-season]').forEach(b=>b.addEventListener('click',()=>{zombieGuideSeason=Number(b.dataset.zombieSeason);buildCharacterGrid('zombies')}));
