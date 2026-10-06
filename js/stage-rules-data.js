// Canonical stage-rule registry. Rule definitions own objective copy, lifecycle
// hooks, and completion/failure checks; saved battles persist only {id,data}.
function stageRuleObjectiveList(items){return Object.freeze(items)}
function stageRuleRuntime(runtime){return runtime&&typeof runtime==='object'&&!Array.isArray(runtime)?runtime:{startedAt:0,events:0}}
function stageRuleEvent(runtime,event){const data={...stageRuleRuntime(runtime),events:(stageRuleRuntime(runtime).events||0)+1};if(event?.type==='breach')data.breached=true;return data}

var STAGE_RULES=Object.freeze([
 Object.freeze({
  id:'standard-defense',title:'守住五路戰線',brief:'擊退本關全部敵軍與關底大魔王。',
  objective:context=>stageRuleObjectiveList([
   '用三國守方與推車守住 5 路戰線',
   '開場準備時間較長，之後才逐步增加壓力',
   `擊敗 ${context.levelConfig.enemyCount} 名殭屍與最後的大魔王即可過關，不需等待固定秒數`
  ]),
  start:context=>({startedAt:Number.isFinite(context?.time)?context.time:0,events:0}),
  tick:(runtime)=>stageRuleRuntime(runtime),
  onEvent:stageRuleEvent,
  isComplete:(runtime,context)=>!!context.bossSpawned&&context.zombies.length===0,
  isFailed:runtime=>stageRuleRuntime(runtime).breached===true
 }),
 Object.freeze({
  id:'standard-attack',title:'突破守方防線',brief:'在時限內突破推車並抵達戰線左側。',
  objective:context=>stageRuleObjectiveList([
   `突破${context.levelConfig.shortName}防線與推車`,
   '吃掉守方角色直接 +50 腦',
   `可等待腦力補給，${Math.round(context.levelConfig.attackTimeLimit/1000)} 秒內突破即可`
  ]),
  start:context=>({startedAt:Number.isFinite(context?.time)?context.time:0,events:0}),
  tick:(runtime)=>stageRuleRuntime(runtime),
  onEvent:stageRuleEvent,
  isComplete:runtime=>stageRuleRuntime(runtime).breached===true,
  isFailed:(runtime,context)=>context.time>=context.levelConfig.attackTimeLimit
 }),
 Object.freeze({
  id:'qin-finale',title:'虎符破陣・擊敗秦皇',brief:'奪取虎符中斷軍令，擊敗始皇屍帝。',
  objective:()=>stageRuleObjectiveList([
   '削減秦皇生命，迎戰三個階段',
   '擊敗金色百夫長，收集 3 枚虎符',
   '虎符集滿後按「破陣號令」，中斷軍令並打開 8 秒破綻'
  ]),
  start:context=>({startedAt:Number.isFinite(context?.time)?context.time:0,events:0}),
  tick:(runtime)=>stageRuleRuntime(runtime),
  onEvent:stageRuleEvent,
  isComplete:(runtime,context)=>context.qinBossAlive===false,
  isFailed:runtime=>stageRuleRuntime(runtime).breached===true
 })
]);

function stageRuleById(id){return STAGE_RULES.find(rule=>rule.id===id)||null}
function stageRuleFor(context={}){if(context.levelConfig?.qinBoss)return stageRuleById('qin-finale');return stageRuleById(context.faction==='zombies'?'standard-attack':'standard-defense')}
function createStageRuleRuntime(context){const rule=stageRuleFor(context);return {id:rule.id,data:rule.start(context)}}
function normalizeStageRuleRuntime(value,context){const known=stageRuleById(value?.id),resolved=known||stageRuleFor(context),data=known&&value?.data&&typeof value.data==='object'&&!Array.isArray(value.data)?value.data:resolved.start(context);return {id:resolved.id,data:{...data}}}
