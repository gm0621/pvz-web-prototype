// A native details element keeps the complete chapter menu accessible without JS.
const picker=document.getElementById('chapterPicker');
document.querySelector('.home-secondary a[href="#chapterPicker"]').addEventListener('click',event=>{
 event.preventDefault();picker.open=true;picker.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});picker.querySelector('summary').focus({preventScroll:true});
});
