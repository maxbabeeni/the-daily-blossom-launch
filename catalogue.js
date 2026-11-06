(function(){
 'use strict';
 const filename='The-Daily-Blossom-SS27-Catalogue.pdf';
 function lockedCards(){
  const items=[['More looks to discover','Unlock the next chapter of The Daily Blossom.'],['Little details, a closer look','Discover every design in the complete catalogue.'],['Unlock the full collection','Complete the form to receive the full catalogue.']];
  return items.map((item,i)=>'<article class="product-card product-lock"><a class="locked-look locked-look-'+i+'" href="#signup" data-catalogue-unlock><span class="locked-icon" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M12 14v3"/></svg></span><span class="eyebrow">UNLOCK THE CATALOGUE</span><h3>'+item[0]+'</h3><p>'+item[1]+'</p><span class="locked-cta">'+(i===2?'Fill in the form':'Unlock more looks')+' <span aria-hidden="true">↗</span></span></a></article>').join('');
 }
 function requestDownload(url,key){
  if(!url)return false;
  const marker=key+'.pdf-download.v1';
  try{if(localStorage.getItem(marker)==='1')return false;localStorage.setItem(marker,'1');}catch(e){}
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='Catalogue PDF download';frame.src=url;document.body.append(frame);setTimeout(()=>frame.remove(),120000);return true;
 }
 window.BlossomCatalogue={lockedCards,requestDownload,filename};
})();
