(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function create(mount){
  if(!mount)return {setUnlocked(){}};
  const photo=mount.querySelector('.detail-photo'),lens=mount.querySelector('.magnifier-lens'),button=mount.querySelector('.magnifier-toggle');
  let unlocked=false,pinned=false,hovering=false;
  function position(x=.5,y=.45){
   const box=mount.getBoundingClientRect(),size=lens.offsetWidth||150,radius=size/2;
   const px=Math.min(box.width-radius,Math.max(radius,x*box.width)),py=Math.min(box.height-radius,Math.max(radius,y*box.height));
   lens.style.left=(px-radius)+'px';lens.style.top=(py-radius)+'px';
   // Match the source image's object-fit:cover transform, then magnify that same point.
   const iw=photo.naturalWidth||1200,ih=photo.naturalHeight||1600,scale=Math.max(box.width/iw,box.height/ih),zoom=2.1;
   const dw=iw*scale,dh=ih*scale,ox=(box.width-dw)/2,oy=(box.height-dh)*.30;
   lens.style.backgroundImage='url("'+photo.src+'")';lens.style.backgroundSize=(dw*zoom)+'px '+(dh*zoom)+'px';
   lens.style.backgroundPosition=(radius-(px-ox)*zoom)+'px '+(radius-(py-oy)*zoom)+'px';
  }
  function render(){const active=unlocked&&(pinned||hovering);mount.classList.toggle('is-magnifying',active);button.setAttribute('aria-pressed',String(unlocked&&pinned));button.innerHTML=(pinned?'Close magnifier':'Magnify detail')+' <span aria-hidden="true">'+(pinned?'−':'＋')+'</span>';if(active)position();}
  button.addEventListener('click',()=>{pinned=!pinned;hovering=false;render();});
  mount.addEventListener('pointermove',e=>{if(!unlocked||e.pointerType==='touch'||e.target.closest('button'))return;hovering=true;render();const r=mount.getBoundingClientRect();position((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);});
  mount.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'){hovering=false;render();}});
  mount.addEventListener('pointerdown',e=>{if(!unlocked||e.target.closest('button'))return;if(e.pointerType==='touch')pinned=true;else hovering=true;render();const r=mount.getBoundingClientRect();position((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);},{passive:true});
  mount.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;hovering=false;render();}});
  return {setUnlocked(value){unlocked=!!value;mount.classList.toggle('is-locked',!unlocked);photo.hidden=!unlocked;button.disabled=!unlocked;if(!unlocked){pinned=false;hovering=false;}render();}};
 }
 function createGallery(root,items){
  if(!root||!items?.length)return;
  const mount=root.querySelector('.detail-magnifier'),detail=create(mount),photo=mount.querySelector('.detail-photo'),outfit=root.querySelector('.detail-outfit img'),label=root.querySelector('.detail-selected-label');
  const buttons=[...root.querySelectorAll('[data-detail-sku]')];
  function select(sku){
   const item=items.find(x=>x.sku===sku);if(!item)return;
   detail.setUnlocked(false);
   outfit.src=item.image;outfit.width=item.width;outfit.height=item.height;outfit.alt=item.sku+' — complete outfit';
   photo.src=item.closeup||item.image;photo.width=item.width;photo.height=item.height;photo.alt=item.sku+' — '+(item.technique||'catalogue detail');
   label.textContent=item.sku;
   buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.detailSku===sku)));
   detail.setUnlocked(true);
  }
  buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.detailSku)));
  select(items[0].sku);
 }
 function decorate(root=document){
  if(reduced||navigator.connection?.saveData)return;
  root.querySelectorAll('.petal-rain').forEach(mount=>{if(mount.children.length)return;const count=Math.min(5,Math.max(1,Number(mount.dataset.count)||5));for(let i=0;i<count;i++){const blossom=i%3===0,img=document.createElement('img');img.src=blossom?'assets/falling-blossom.svg':'assets/falling-petal.svg';img.alt='';img.width=blossom?48:32;img.height=blossom?48:64;img.className='falling-petal'+(blossom?' is-blossom':'');img.style.left=(12+(i+.5)*76/count)+'%';img.style.setProperty('--delay',(-i*4.7-3)+'s');img.style.setProperty('--fall-time',(23+i*3)+'s');mount.append(img);}});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-garden-offscreen',!entry.isIntersecting)),{rootMargin:'100px'});root.querySelectorAll('.hero-atmosphere,.section-atmosphere').forEach(mount=>observer.observe(mount));}
 }
 window.BlossomDetails={create,createGallery,decorate};
})();
