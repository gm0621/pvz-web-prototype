// Battle-local tactical orders. Values are multipliers consumed only through
// effectiveBattleModifier(); unit definition tables remain immutable inputs.
var TACTICAL_ORDERS=Object.freeze([
 {id:'tuntian',name:'屯田急令',benefit:'補給收入 +25%',cost:'全軍傷害 -10%',duration:'battle',modifiers:{resourceIncome:1.25,damage:.9},tradeoffs:{benefit:['resourceIncome'],cost:['damage']}},
 {id:'fire-volley',name:'火箭齊射',benefit:'遠程傷害 +20%',cost:'近戰傷害 -12%',duration:'battle',modifiers:{rangedDamage:1.2,meleeDamage:.88},tradeoffs:{benefit:['rangedDamage'],cost:['meleeDamage']}},
 {id:'hold-center',name:'固守中軍',benefit:'護盾與格擋量 +25%',cost:'移動速度 -15%',duration:'battle',modifiers:{shield:1.25,movementSpeed:.85},tradeoffs:{benefit:['shield'],cost:['movementSpeed']}},
 {id:'last-stand',name:'背水一戰',benefit:'攻擊速度 +22%',cost:'承受傷害 +15%',duration:'battle',modifiers:{attackSpeed:1.22,damageTaken:1.15},tradeoffs:{benefit:['attackSpeed'],cost:['damageTaken']}},
 {id:'reinforcements',name:'援軍令',benefit:'部署消耗 -15%',cost:'出戰單位生命 -10%',duration:'battle',modifiers:{deploymentCost:.85,unitHealth:.9},tradeoffs:{benefit:['deploymentCost'],cost:['unitHealth']}},
 {id:'empty-city',name:'空城計',benefit:'敵軍增援間隔 +20%',cost:'己方補給收入 -15%',duration:'battle',modifiers:{enemySpawnInterval:1.2,resourceIncome:.85},tradeoffs:{benefit:['enemySpawnInterval'],cost:['resourceIncome']}},
 {id:'rapid-redeploy',name:'急行換防',benefit:'換防消耗 -50%',cost:'換防單位生命 -10%',duration:'battle',modifiers:{relocationCost:.5,unitHealth:.9},tradeoffs:{benefit:['relocationCost'],cost:['unitHealth']}},
 {id:'medical-camp',name:'醫護營',benefit:'治療與戰後回復 +30%',cost:'攻擊速度 -10%',duration:'battle',modifiers:{healing:1.3,attackSpeed:.9},tradeoffs:{benefit:['healing'],cost:['attackSpeed']}},
 {id:'supply-raid',name:'斷糧奇襲',benefit:'敵方補給收入 -20%',cost:'己方補給收入 -10%',duration:'battle',modifiers:{enemyResourceIncome:.8,resourceIncome:.9},tradeoffs:{benefit:['enemyResourceIncome'],cost:['resourceIncome']}}
].map(order=>Object.freeze({...order,modifiers:Object.freeze({...order.modifiers}),tradeoffs:Object.freeze({benefit:Object.freeze([...order.tradeoffs.benefit]),cost:Object.freeze([...order.tradeoffs.cost])})})));

function tacticalOrderById(id){return TACTICAL_ORDERS.find(order=>order.id===id)||null}
