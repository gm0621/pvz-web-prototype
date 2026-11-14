let controller;
export function beginReading(ending=false){controller?.start(ending)}
export function installStoryReader(){
 const $=id=>document.getElementById(id),story=$('story'),next=$('storyNext'),back=$('storyPrevious');
 const advanceDialogue=next.onclick,rewindDialogue=back.onclick;let phase='journey',ending=false;
 const nav=document.createElement('nav');nav.id='storyReaderNav';nav.setAttribute('aria-label','劇情翻頁');
 const count=document.createElement('span');count.id='readerCount';count.setAttribute('aria-live','polite');nav.append(back,count,next);story.append(nav);
 const more=document.createElement('button');more.id='storyMore';more.className='quiet-button';more.textContent='歷史補充';more.setAttribute('aria-haspopup','dialog');story.querySelector('.story-toolbar').append(more);
 const details=document.createElement('dialog');details.id='storyDetails';details.setAttribute('aria-labelledby','storyDetailsTitle');details.innerHTML='<header><h2 id="storyDetailsTitle">想多知道一點</h2><button type="button" class="quiet-button">關閉 ✕</button></header><div class="story-details-body"></div>';
 document.body.append(details);const body=details.querySelector('.story-details-body');const background=document.createElement('section');background.id='storyBackground';body.append(background,$('storyAdaptation'));const link=document.createElement('a');link.href='people.html';link.target='_blank';link.rel='noopener';link.textContent='人物圖鑑 ↗';body.append(link);
 more.onclick=()=>{const history=$('historyLesson');if(history)body.prepend(history);details.showModal();details.querySelector('button').focus()};details.querySelector('button').onclick=()=>details.close();details.addEventListener('close',()=>more.focus({preventScroll:true}));
 function sync(){story.dataset.readerPhase=phase;$('storyScene').dataset.readerPhase=phase;back.textContent='← 上一步';
  const [current,total]=$('storyCount').textContent.split('/').map(Number);
  back.disabled=phase==='journey'||phase==='dialogue'&&current===1;
  count.textContent=phase==='journey'?'行軍':phase==='novel'?$('novelCount').textContent:phase==='quiz'?'想一想':`${current} / ${total}`;
  next.textContent=phase==='dialogue'&&current===total?(ending?'繼續故事 →':'出發 →'):'下一步 →';
  next.setAttribute('aria-label',phase==='quiz'&&$('storyTask').dataset.solved!=='true'?'略過問答，繼續故事':next.textContent);
 }
 function setPhase(value){phase=value;sync();$('storyPrologue').scrollTop=0;$('storyLine').scrollTop=0;$('novelText').scrollTop=0}
 next.onclick=()=>{if(phase==='journey'){const button=$('journeyIntro')?.querySelector('button');if($('journeyIntro')?.dataset.arrived!=='true')button?.click();setPhase('novel')}
  else if(phase==='novel'){$('novelNext').click();setPhase($('storyTask').hidden?'novel':'quiz')}
  else if(phase==='quiz'){$('prologueContinue').click();setPhase('dialogue')}
  else{advanceDialogue();if(!story.hidden&&phase==='dialogue')sync()}
 };
 back.onclick=()=>{if(phase==='novel'){if($('novelPrevious').disabled)setPhase('journey');else{$('novelPrevious').click();sync()}}
  else if(phase==='quiz'){$('novelPage').hidden=false;$('storyTask').hidden=true;setPhase('novel')}
  else if(phase==='dialogue'){rewindDialogue();sync()}
 };
 // Legacy skip controls keep their explicit skip behaviour; normal reading uses one footer.
 const enter=$('prologueContinue').onclick;$('prologueContinue').onclick=()=>{enter();setPhase('dialogue')};
 controller={start(isEnding){ending=isEnding;details.close();const history=$('historyLesson');if(history)body.prepend(history);setPhase(ending?'dialogue':'journey');next.focus({preventScroll:true})}};
 return controller;
}
