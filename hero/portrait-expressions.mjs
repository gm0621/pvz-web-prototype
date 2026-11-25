// File numbers are stable. Append new portraits through the named mapping.
const cast=[
 "司馬懿","楊儀","姜維","馬謖","王平","曹真","郝昭","郭淮","劉禪",
 "李嚴","鄧芝","高定","李恢","孟獲","吳班","馮習","黃權","孫桓",
 "龐德","呂蒙","陸遜","關平","張郃","陳式","黃忠","法正","張魯",
 "馬超","韓遂","許褚","徐晃","曹丕","劉琮","趙雲","諸葛亮","孫權",
 "周瑜","魯肅","高幹","袁熙","田疇","蹋頓","公孫康","袁譚","袁尚",
 "審配","辛毗","劉表","袁紹","顏良","文醜","許攸","張遼","淳于瓊",
 "于禁","曹仁","夏侯淵","劉備","關羽","張飛","曹操","夏侯惇","曹洪",
 "孫堅","程普","黃蓋","漢獻帝","袁術","典韋","曹昂","曹安民","賈詡",
 "郭嘉","荀攸","棗祗","董卓","王允","荀彧","程昱","陳宮","鮑信",
 "張繡","橋蕤","呂布","盧植","皇甫嵩","朱儁","張角","張梁","張寶",
 "徐榮","華雄","鄧茂","程遠志","石魁","雷烈","韓旌","焦魯","杜衡"
];
const portraits=new Map(cast.map((name,index)=>[name,`./assets/portraits/expressions/${String(index+5).padStart(3,"0")}.webp`]));
for(const [name,file] of Object.entries({'魏延':'wei-yan','蔣琬':'jiang-wan','費禕':'fei-yi','曹爽':'cao-shuang','夏侯霸':'xiahou-ba','郭循':'guo-xun','陳泰':'chen-tai','王經':'wang-jing','鄧艾':'deng-ai','鍾會':'zhong-hui','廖化':'liao-hua','張翼':'zhang-yi','諸葛瞻':'zhuge-zhan','黃崇':'huang-chong','諸葛尚':'zhuge-shang','譙周':'qiao-zhou'})){
 portraits.set(name,`./assets/portraits/${file}.webp?v=expression-1`);
}
export function expressionPortrait(name){return portraits.get(name)}
export function portraitForDisplay(person){
 const asset=expressionPortrait(person.name);
 return asset?{name:person.name,asset}:person;
}
