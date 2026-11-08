import {stepBattle} from './engine.mjs?v=enemy-archer-1';
export const BATTLE_SPEEDS=Object.freeze([1,1.5,2]);
export function normalizeBattleSpeed(value){const n=Number(value);return BATTLE_SPEEDS.includes(n)?n:1}
// 1x retains the existing pacing. Split scaled time to respect the engine's
// 0.1s step cap; re-read the phase between steps so duel entry never speeds up.
export function advanceBattleFrame(b,seconds,speed=1){
 let remaining=Math.min(.1,Math.max(0,Number(seconds)||0));
 while(remaining>1e-9&&b&&!b.over&&!b.paused&&!b.introPending){
  const rate=b.duel?.805:.7*normalizeBattleSpeed(speed);
  const wallStep=Math.min(remaining,.1/rate);
  stepBattle(b,wallStep*rate);remaining-=wallStep;
 }
}
