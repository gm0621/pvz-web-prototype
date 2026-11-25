const {expect}=require('@playwright/test');

async function expectExpressionPortrait(image,name){
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const expected=expressionPortrait(name);
 expect(expected,name).toBeTruthy();
 await expect(image).toHaveAttribute('alt',name);
 await expect(image).toHaveAttribute('src',expected);
 expect(await image.evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
}

module.exports={expectExpressionPortrait};
