// Opt-in per hero, scoped to this battle. Uses the ordinary MP/cooldown rules.
export function advanceAutoSkills(b,cast){
 if(!b?.heroMode||b.paused||b.over||b.duel||b.introPending||b.time<(b.autoSkillCheckAt||0))return;
 b.autoSkillCheckAt=b.time+.5;
 for(const u of b.allies){
  if(u.hp<=0||!u.heroId||!b.autoSkills?.[u.heroId])continue;
  const g=b.roster[u.key],r=b.heroResources[u.heroId];if(!g||!r)continue;
  for(let i=g.skills.length-1;i>=0;i--){
   const s=g.skills[i];if(g.heroLevel<s.level||r.mp<s.mp||b.time<(r.ready[i]||0))continue;
   const nearby=b.enemies.some(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.03&&e.x-u.x<=((b.peachMode||b.sunMode)?.17:g.ranged?.4:.28));
   const wounded=b.allies.some(a=>a.hp>0&&a.hp<a.maxHp&&(s.effects?.allies==='self'?a.id===u.id:s.effects?.allies==='all'||['rally','supply'].includes(s.id)||a.lane===u.lane));
   if(s.effects?.heal||['heal','rally','supply'].includes(s.id)){
    if(!wounded&&!((s.effects?.food||s.id==='supply')&&b.food<240))continue;
   }else if(!nearby)continue;
   const notice=b.notice,until=b.noticeUntil;
   if(cast(b,u.key,i))break;
   // An automatic failed attempt must not replace the player's current reminder.
   b.notice=notice;b.noticeUntil=until;
  }
 }
}
