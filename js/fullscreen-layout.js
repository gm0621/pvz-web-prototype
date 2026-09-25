// VisualViewport is the visible area on mobile browsers, including CSS fullscreen fallback.
// No battle timers, data or persisted settings are changed here.
(()=>{
 const game=document.getElementById('game');if(!game)return;
 let frame=0;
 function update(){
  frame=0;const active=game.classList.contains('fullscreen-mode');
  document.documentElement.classList.toggle('battle-fullscreen-open',active);
  if(!active){for(const key of ['width','height','top','left'])game.style.removeProperty('--battle-view-'+key);return}
  const view=window.visualViewport,values={width:view?view.width:innerWidth,height:view?view.height:innerHeight,top:view?view.offsetTop:0,left:view?view.offsetLeft:0};
  for(const [key,value] of Object.entries(values))game.style.setProperty('--battle-view-'+key,value+'px');
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update)}
 new MutationObserver(schedule).observe(game,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);
 document.addEventListener('fullscreenchange',schedule);
 if(window.visualViewport){visualViewport.addEventListener('resize',schedule);visualViewport.addEventListener('scroll',schedule)}
 schedule();
})();
