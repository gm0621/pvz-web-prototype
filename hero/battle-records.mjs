import {CAMPAIGN_LENGTH} from './campaign-config.mjs?v=xuchang-jia-huangqiao-1';

function recordRule(level){
 switch(level){
  case 87:return {label:'損失隊伍',unit:'隊',min:0,max:999,better:(value,best)=>value<best,measure:b=>b.allyLosses};
  case 124:return {label:'剩餘防線',unit:'道',min:1,max:3,better:(value,best)=>value>best,measure:b=>b.lives};
  case 165:return {label:'城門耐久',unit:'點',min:1,max:100,better:(value,best)=>value>best,measure:b=>b.mission.gate};
  default:return {label:'通關時間',unit:'秒',min:1,max:359999,better:(value,best)=>value<best,measure:b=>Math.max(1,Math.ceil(b.time))};
 }
}

export function normalizeBattleRecords(raw,completed){
 const records={};
 for(let level=1;level<=Math.min(completed,CAMPAIGN_LENGTH);level++){
  const value=raw?.[level],{min,max}=recordRule(level);
  if(Number.isInteger(value)&&value>=min&&value<=max)records[level]=value;
 }
 return records;
}

export function recordBattleVictory(progress,battle){
 if(!battle.won)return null;
 const {level}=battle,rule=recordRule(level);
 const score=Math.min(rule.max,rule.measure(battle)),previous=progress.battleRecords[level];
 const improved=previous===undefined||rule.better(score,previous);
 if(improved)progress.battleRecords[level]=score;
 return {label:rule.label,unit:rule.unit,score,best:progress.battleRecords[level],improved};
}
