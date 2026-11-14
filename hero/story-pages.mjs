// Pagination preserves every character; it changes reading pace, not historical content.
export function shortPages(lines,limit=64){return lines.flatMap(([speaker,text])=>{
 const chars=Array.from(text),pages=[];while(chars.length>limit){let end=limit;for(let i=limit-1;i>=Math.floor(limit/2);i--)if(/[。！？；，]/u.test(chars[i])){end=i+1;break}if(/[」』”]/u.test(chars[end]||''))end++;pages.push([speaker,chars.splice(0,end).join('')])}if(chars.length)pages.push([speaker,chars.join('')]);return pages;
})}
