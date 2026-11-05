(function(root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BlossomCore=api;
})(typeof window==='undefined'?this:window,function(){
  'use strict';
  const DAY=86400000;
  const timestamp=value=>{const n=Date.parse(value);if(!Number.isFinite(n))throw Error('Invalid campaign timestamp');return n;};
  function state(now,start,launch){return {phase:now>=launch?'live':'teaser',day:now<start?-1:Math.min(5,Math.floor((now-start)/DAY))};}
  function countdown(now,launch){const n=Math.max(0,Math.ceil((launch-now)/1000));return {days:Math.floor(n/86400),hours:Math.floor(n/3600)%24,minutes:Math.floor(n/60)%60,seconds:n%60};}
  function validate(data){
    const e={};
    if(!String(data.name||'').trim()||String(data.name).trim().length>120)e.name='Please enter your name (up to 120 characters).';
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email||'').trim())||String(data.email).length>254)e.email='Please enter a valid email address.';
    if(!/^\+[1-9]\d{6,14}$/.test(String(data.phone||'').replace(/[\s().-]/g,'')))e.phone='Include your country code, for example +1 202 555 0123.';
    if(!/^[A-Z]{2}$/.test(String(data.country||'')))e.country='Please choose your country.';
    if(String(data.company||'').length>160)e.company='Please use no more than 160 characters.';
    if(String(data.businessRole||'').length>160)e.businessRole='Please use no more than 160 characters.';
    if(data.retailLocations&&!['Online only','1 store','2–5 stores','6+ stores'].includes(data.retailLocations))e.retailLocations='Please choose one of the listed options.';
    if(String(data.message||'').length>2000)e.message='Please use no more than 2,000 characters.';
    return e;
  }
  function filterProducts(products,pattern,colour){return products.filter(p=>p.published!==false&&(!pattern||p.patterns.includes(pattern))&&(!colour||p.colours.includes(colour)));}
  function parseCsv(input){
    const rows=[];let row=[],s='',quoted=false;
    for(let i=0;i<input.length;i++){const c=input[i];if(c==='"'){if(quoted&&input[i+1]==='"'){s+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(s);s='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(s);if(row.some(Boolean))rows.push(row);row=[];s='';}else s+=c;}
    row.push(s);if(row.some(Boolean))rows.push(row);if(quoted)throw Error('Unclosed CSV field');
    const header=(rows.shift()||[]).map(x=>x.trim().replace(/^\uFEFF/,''));
    return rows.map(r=>Object.fromEntries(header.map((k,i)=>[k,r[i]||''])));
  }
  function safeImage(value){return /^(https:\/\/|assets\/[a-z\d._-]+$|data:image\/(jpeg|png|webp);base64,)/i.test(String(value));}
  function normaliseProducts(rows){
    const seen=new Set();return rows.map(r=>{
      const p={sku:String(r.sku||'').trim(),name:String(r.name||'').trim(),image:String(r.image||'').trim(),width:Number(r.width)||900,height:Number(r.height)||1250,patterns:Array.isArray(r.patterns)?r.patterns:String(r.patterns||'').split('|').map(x=>x.trim()).filter(Boolean),colours:Array.isArray(r.colours)?r.colours:String(r.colours||'').split('|').map(x=>x.trim()).filter(Boolean),fabric:String(r.fabric||''),published:r.published!==false&&String(r.published).toLowerCase()!=='false'};
      if(!p.sku||!p.name||!safeImage(p.image)||seen.has(p.sku))throw Error('Invalid or duplicate product record');seen.add(p.sku);return p;
    });
  }
  function acknowledged(response){return !!response&&response.ok===true&&typeof response.receiptId==='string'&&response.receiptId.trim().length>0;}
  return Object.freeze({DAY,timestamp,state,countdown,validate,filterProducts,parseCsv,normaliseProducts,acknowledged});
});
