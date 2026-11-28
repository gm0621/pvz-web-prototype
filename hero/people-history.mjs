import {hasPersonMention} from './characters.mjs?v=yuesui-wukou-taoxi-1';

const sourceLocations=new Map([
 ['https://zh.wikisource.org/wiki/三國志/卷9','https://zh.wikisource.org/wiki/三國志/卷09'],
 ['https://zh.wikisource.org/zh-hant/晉書/卷039#王浚','https://zh.wikisource.org/zh-hant/晉書/卷039#子浚']
]);

const records={
 '劉備': {
  source:{title:'《三國志・先主傳》',url:'https://zh.wikisource.org/zh-hant/三國志/卷32'},
  events:[
   ['年少時 · 涿郡','劉備小時候失去了父親，和母親靠賣鞋、編蓆維生。十五歲時，他外出向盧植求學，和公孫瓚成為朋友。'],
   ['184 年 · 黃巾起事','馬商張世平、蘇雙曾給劉備錢財，幫他招集部眾。黃巾起事後，他跟隨鄒靖作戰，因軍功當上安喜縣尉。縣尉是協助維持地方治安的官。']
  ]
 },
 '關羽': {
  source:{title:'《三國志・關羽傳》',url:'https://zh.wikisource.org/zh-hant/三國志/卷36#關羽'},
  events:[['早年 · 跟隨劉備','關羽離開家鄉河東，到了涿郡，和張飛一起跟隨劉備。劉備任平原相時，讓兩人各自帶領一隊士兵。史書形容三人感情親近得像兄弟。']]
 },
 '關平': {
  source:{title:'《三國志・關羽傳》',url:'https://zh.wikisource.org/zh-hant/三國志/卷36#關羽'},
  events:[['219 年 · 荊州失守','關平是關羽的兒子。關羽在樊城無法繼續進攻，回軍時江陵已落入孫權手中。孫權派兵截住關羽，史書記載關羽和關平都在臨沮遇害。']]
 },
 '張飛': {
  source:{title:'《三國志・張飛傳》',url:'https://zh.wikisource.org/zh-hant/三國志/卷36#張飛'},
  events:[['早年 · 涿郡','張飛年輕時就與關羽一道跟隨劉備。關羽年長，張飛以兄長待他。後來劉備取下益州，張飛出任巴西太守，負責管理當地。']]
 },
 '盧植': {
  source:{title:'《後漢書・盧植傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷64#盧植'},
  events:[['東漢末年 · 治學與帶兵','盧植曾向馬融求學，後來也研究、解說古代典籍。黃巾起事後，朝廷派他帶兵到廣宗。他築起工事圍困張角的部隊，後來遭撤換。']]
 },
 '皇甫嵩': {
  source:{title:'《後漢書・皇甫嵩傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷71#皇甫嵩'},
  events:[['184 年 · 長社到廣宗','皇甫嵩的部隊在長社被黃巾軍包圍。他見敵軍營地靠近草地，趁風勢用火，打開局面。後來他又領兵到廣宗、下曲陽，先後擊敗張梁和張寶。']]
 },
 '朱儁': {
  source:{title:'《後漢書・朱儁傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷71#朱儁'},
  events:[['184 年 · 討伐黃巾','朱儁奉命和皇甫嵩出兵，後來轉往南陽對抗黃巾軍。宛城攻防持續了好一陣子，他調動兵力在不同方向進攻，最後攻下城池。']]
 },
 '張角': {
  source:{title:'《後漢書・皇甫嵩傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷71#皇甫嵩'},
  events:[['184 年 · 黃巾起事','張角的追隨者遍及多地，起事時以黃巾當作辨認彼此的記號。朝廷派兵鎮壓。廣宗的戰事結束前，張角已病逝。']]
 },
 '張梁': {
  source:{title:'《後漢書・皇甫嵩傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷71#皇甫嵩'},
  events:[['184 年 · 廣宗','張梁是張角的弟弟。他帶領黃巾軍在廣宗抵抗皇甫嵩，後來在交戰中身亡。遊戲第三章的風勢和護民任務屬於改編。']]
 },
 '張寶': {
  source:{title:'《後漢書・皇甫嵩傳》',url:'https://zh.wikisource.org/zh-hant/後漢書/卷71#皇甫嵩'},
  events:[['184 年 · 下曲陽','張寶和兄長張角一同參與黃巾起事。廣宗一帶的戰事之後，皇甫嵩和郭典攻打他所在的下曲陽，張寶在這場戰事中身亡。']]
 }
};

export function historyEntries(person,stages){
 if(person.kind!=='史實人物')return [];
 const authored=Object.hasOwn(records,person.name)?records[person.name]:null;
 const entries=authored?.events.map(([label,text])=>({label,text,source:authored.source}))??[];
 const seen=new Set();
 for(const level of person.levels){
  const stage=stages[level-1];
  if(!stage.history||seen.has(stage.history)||!hasPersonMention(stage.history,person.portrait,[person.name]))continue;
  seen.add(stage.history);
  const sources=stage.references??[];
  const reference=sources.find(item=>item.title.includes(person.name))??sources[0];
  const location=sourceLocations.get(reference?.url);
  const source=location?{...reference,url:location}:reference;
  entries.push({label:`${stage.year} 年 · 第 ${level} 關 ${stage.name}`,text:stage.history,source});
 }
 return entries;
}
