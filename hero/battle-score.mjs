// Each stage keeps its melody. The accompaniment changes over eight bars.
const BATTLE_CHORDS=[[0,7,12],[-2,5,10],[-5,2,7],[-3,4,9]];
const RETREAT_CHORDS=[[0,7,12],[-3,4,9],[-5,2,7],[-2,5,10]];
const CODA_CHORDS=[[0,4,7],[-5,0,4],[-3,2,7],[0,4,7]];
const pitch=note=>440*2**((note-69)/12);

export function playScorePulse(theme,step,pressure,{tone,pluck,noise}){
 const pulse=step%16;
 const section=Math.floor(step/16)%8;
 const harmony=theme.calm?CODA_CHORDS:theme.retreat?RETREAT_CHORDS:BATTLE_CHORDS;
 const chord=harmony[Math.floor(pulse/4)];
 const root=theme.root;
 const note=theme.notes[pulse];
 const beat=theme.beat/1000;

 if(theme.calm){
  if(pulse%4===0){
   tone(pitch(root-17+chord[0]),beat*5,.075,'sine',0,.13);
   tone(pitch(root-12+chord[1]),beat*5,.047,'triangle',0,.16);
  }
  if(note!==null){
   pluck(pitch(root+note),.17);
   if(pulse%2===0)tone(pitch(root+note),beat*2.4,.065,'sine',0,.09);
  }
  return;
 }

 const drums=theme.retreat?.82:1;
 const climax=(section===3||section===7);
 const lead=note===null?null:pitch(root+note+(section===5?-12:0));
 if(lead!==null){
  pluck(lead,section>=4?.24:.19);
  if((section%2===0&&pulse%2===0)||(section%2===1&&pulse%4!==3)){
   tone(lead,beat*(climax?2.35:1.8),.09,'sine',0,.038);
   tone(lead*2,beat*1.25,.035,'triangle',0,.027);
  }
 }
 if(pulse%4===0){
  tone(pitch(root-24+chord[0]),beat*3.8,.14,'sine',0,.026);
  tone(pitch(root-12+chord[1]),beat*4.2,.055,'triangle',0,.11);
  tone(pitch(root-12+chord[2]),beat*4.3,.035,'sine',0,.16);
 }else if(pulse%4===2){
  pluck(pitch(root-12+chord[1]),.13);
 }
 if(pulse%4===0||pulse%8===3||climax&&pulse%4===2){
  const accent=pulse%8===0;
  tone(accent?104:139,accent?.42:.29,(accent?.48:.24)*drums,'sine',accent?40:55,.009);
  noise(.1,(accent?.20:.11)*drums,accent?430:950);
 }
 if((section%2===1||pressure>0)&&pulse%4===2)noise(.12,.14,2100);
 if(pressure===2&&pulse%2===1){
  tone(165+20*(pulse%4),.13,.13,'sine',65);
  noise(.052,.09,2900);
 }
 if(pulse===0&&(section===0||climax)){
  noise(.55,.15,2900);
  tone(pitch(root-5),.9,.06,'triangle',0,.025);
 }
}
