(function(){
 'use strict';
 const config=window.BLOSSOM_CONFIG,core=window.BlossomCore,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const preview=config.previewEnabled===true,query=new URLSearchParams(location.search),start=core.timestamp(config.campaignStart),launch=core.timestamp(config.launchAt);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const storage={get(key){try{return localStorage.getItem(key);}catch(e){return null;}},set(key,value){try{localStorage.setItem(key,value);}catch(e){}},remove(key){try{localStorage.removeItem(key);}catch(e){}}};
 const registrationKey=config.registrationKey+(preview?'.preview':''),introKey=config.introKey+(preview?'.preview':'');
 let virtualTime=preview?Date.parse(config.previewAt):null,virtualBegan=performance.now(),phase=null,day=null,products=core.previewProducts(core.normaliseProducts(window.BLOSSOM_PRODUCTS||[])),limit=6,registered=storage.get(registrationKey)==='1',modal=null,intro=null,visibleProducts=[];
 let sourceRequested=false,selectedSku='',pending=false;
 const content=window.BLOSSOM_CONTENT,hints=content.hints,palette=content.palette;
 const lockSvg='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M12 14v3"/></svg>';
 function flowerSvg(open=true){return '<svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M22 35L20 25" stroke="currentColor" stroke-width="1.7"/>'+(open?'<path d="M20 27C7 27 4 20 3 17C12 17 18 21 20 27ZM20 27C12 22 13 9 18 3C23 12 25 21 20 27ZM20 27C22 15 31 13 35 5C35 19 30 27 20 27Z" fill="currentColor"/>':'<path d="M20 27C8 23 12 9 17 3C25 11 30 24 20 27Z" fill="currentColor"/>')+'</svg>';}
 function now(){return virtualTime===null?Date.now():virtualTime+(performance.now()-virtualBegan);}
 function isUnlocked(i){return now()>=start+i*core.DAY;}
 function artwork(h,locked=false,modalView=false){
   if(locked)return '<div class="hint-cover cover-locked">'+flowerSvg(false)+'<span class="hint-lock-label">'+lockSvg+' OPENS '+esc(h.date.toUpperCase())+'</span></div>';
   if(h.images)return '<div class="'+(modalView?'modal-cover':'hint-cover')+' hint-image-pair">'+h.images.map((src,n)=>'<img src="'+esc(src)+'" width="884" height="1250" alt="'+esc(h.label)+' — look '+(n+1)+'" loading="lazy">').join('')+'</div>';
   if(h.image)return '<div class="'+(modalView?'modal-cover':'hint-cover')+'"><img src="'+esc(h.image)+'" width="1200" height="1600" alt="'+esc(h.label)+' from The Daily Blossom" loading="lazy"></div>';
   if(h.cover==='palette')return '<div class="hint-cover cover-palette">'+palette.map(p=>'<span class="colour-stick" style="background:'+p[1]+'"></span>').join('')+'</div>';
   return '<div class="hint-cover cover-intro"><small>BABEENI / SS27</small><span>Little moments.<br>A fresh bloom.</span></div>';
 }
 function renderRail(){
   $('#reveal-rail').innerHTML=hints.map((h,i)=>{const unlocked=isUnlocked(i),current=i===day;return '<button type="button" class="reveal-dot '+(unlocked?'is-open':'is-locked')+(current?' is-current':'')+'" data-reveal="'+i+'" aria-label="'+esc(h.date+' — '+h.label+(unlocked?'':' — Locked'))+'" '+(current?'aria-current="step"':'')+'>'+flowerSvg(unlocked)+(unlocked?'':'<span class="dot-lock">'+lockSvg+'</span>')+'<span class="dot-tooltip"><strong>'+esc(h.date)+' · 00:00 GMT+7 '+(unlocked?'':' · Locked')+'</strong>'+esc(h.label)+'</span></button>';}).join('');
 }
 function renderHints(){
   $('#hint-grid').innerHTML=hints.slice(0,5).map((h,i)=>{const unlocked=isUnlocked(i);return '<article class="hint-card '+(unlocked?'unlocked':'locked')+'">'+artwork(h,!unlocked)+'<div class="hint-copy"><span class="hint-date">'+esc(h.date.toUpperCase())+' / '+(unlocked?'REVEALED':'COMING SOON')+'</span><h3>'+esc(unlocked?h.title:h.label)+'</h3><p>'+esc(unlocked?h.description:'A little more will unfold at 00:00 GMT+7 on '+h.date+'.')+'</p><button type="button" data-reveal="'+i+'">'+(unlocked?esc(h.cta)+' ↗':'View reveal time '+String.fromCharCode(8599))+'</button></div></article>';}).join('');
 }
 function closeModal(){if(!modal)return;const {node,previous}=modal;node.remove();all('body > [inert]').forEach(el=>{if(el.dataset.blossomInert==='true'){el.inert=false;delete el.dataset.blossomInert;}});document.body.style.overflow='';modal=null;previous?.focus();}
 function openHint(i){
   closeModal();const h=hints[i];if(!h)return;const unlocked=isUnlocked(i),previous=document.activeElement;
   const node=document.createElement('div');node.className='modal-backdrop';node.innerHTML='<div class="hint-dialog" role="dialog" aria-modal="true" aria-labelledby="hint-dialog-title" tabindex="-1"><button class="modal-close" type="button" aria-label="Close hint">×</button>'+artwork(h,!unlocked,true)+'<div class="modal-copy"><span class="eyebrow">'+esc(h.date)+' · 00:00 GMT+7</span><h2 id="hint-dialog-title">'+esc(unlocked?h.title:'A little patience. A little wonder.')+'</h2><p>'+esc(unlocked?h.description:'This little reveal opens on '+h.date+' at 00:00 GMT+7. Leave your details and follow the collection as it unfolds.')+'</p>'+(unlocked&&i===1?'<div class="modal-palette">'+palette.map(p=>'<div class="palette-item"><span style="background:'+p[1]+'"></span><small>'+p[0]+'</small></div>').join('')+'</div>':'')+'<a href="'+(i===5&&unlocked?'#products':i===3&&unlocked?'#detail-study':'#signup')+'" class="button button-dark">'+(i===5&&unlocked?'Explore the collection':i===3&&unlocked?'Take a closer look':'Get collection updates')+' ↗</a></div></div>';
   all('body > *').filter(el=>!['SCRIPT','STYLE','LINK'].includes(el.tagName)&&!el.inert).forEach(el=>{el.inert=true;el.dataset.blossomInert='true';});document.body.append(node);document.body.style.overflow='hidden';modal={node,previous};node.querySelector('button').focus();
   node.addEventListener('click',e=>{if(e.target===node||e.target.closest('.modal-close')||e.target.closest('a'))closeModal();});
   node.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeModal();}if(e.key==='Tab'){const focus=[...node.querySelectorAll('button,a[href]')];if(e.shiftKey&&document.activeElement===focus[0]){e.preventDefault();focus.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===focus.at(-1)){e.preventDefault();focus[0].focus();}}});
 }
 const detail=window.BlossomDetails.create($('#detail-magnifier'));window.BlossomDetails.decorate();window.BlossomDetails.createGallery($('#detail-gallery'),content.details);
 let flower=window.BlossomFlower.create($('#flower-canvas'),$('#flower-stage'),{posterOnly:preview&&query.get('render')==='poster'});
 function endIntro(immediate=false){
   if(!intro)return;const current=intro;intro=null;clearTimeout(current.timer);const motion=current.flower.getMetrics?.();if(motion){document.body.dataset.motionFps=motion.fps;document.body.dataset.motionP95=motion.p95;document.body.dataset.motionFrames=motion.frames;}
   all('[data-intro-phase-held]').forEach(el=>{el.hidden=phase!=='live';delete el.dataset.introPhaseHeld;});flower.pause(false);flower.setBloom(true,false);storage.set(introKey,'1');
   const finish=()=>{current.flower.destroy();current.node.remove();all('body > [data-intro-inert]').forEach(el=>{el.inert=false;delete el.dataset.introInert;});document.body.classList.remove('is-intro-playing');document.body.style.overflow='';if(current.previous&&current.previous!==document.body&&current.previous.isConnected)current.previous.focus();};
   if(immediate===true||reduced){finish();return;}current.node.style.animation='none';current.node.classList.add('is-leaving');setTimeout(finish,450);
 }
 function playIntro(force=false){
   endIntro(true);if(reduced||(!force&&storage.get(introKey)==='1')){flower.setBloom(true,false);storage.set(introKey,'1');return;}
   const node=document.createElement('div');node.className='launch-intro';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-labelledby','intro-collection-title');node.innerHTML='<button type="button" class="intro-skip">Skip intro ↗</button><div class="intro-garden" aria-hidden="true"><img class="garden-sun" src="assets/garden-sun.svg" width="180" height="180" alt=""><img class="garden-cloud" src="assets/cloud.svg" width="440" height="160" alt=""><img class="garden-line" src="assets/botanical-line.svg" width="360" height="580" alt=""></div><div class="intro-copy"><p class="eyebrow">BABEENI · SPRING / SUMMER 2027</p><h2 id="intro-collection-title"><span class="intro-welcome">Welcome to</span><span class="intro-collection">The Daily Blossom</span></h2><p class="intro-tagline">Childhood Blooms in Everyday Moments.</p></div><div class="flower-stage"><img class="flower-poster" src="assets/lily-01-bud.webp" width="1280" height="720" alt="Pink Lily opening into bloom"><canvas width="1280" height="900" aria-hidden="true"></canvas></div><div class="intro-progress" aria-hidden="true"></div>';
   const previous=document.activeElement;all('body > *').filter(el=>!['SCRIPT','STYLE','LINK'].includes(el.tagName)&&!el.inert).forEach(el=>{el.inert=true;el.dataset.introInert='true';});
   all('[data-phase="live"]').forEach(el=>{el.hidden=true;el.dataset.introPhaseHeld='true';});document.body.classList.add('is-intro-playing');document.body.append(node);document.body.style.overflow='hidden';flower.pause(true);
   const introFlower=window.BlossomFlower.create(node.querySelector('canvas'),node.querySelector('.flower-stage'));const current={node,flower:introFlower,timer:null,previous};intro=current;
   node.querySelector('.intro-progress').style.animationPlayState='paused';
   introFlower.setBloom(true,true,config.introDuration).then(()=>{if(intro!==current)return;node.querySelector('.intro-progress').style.animationPlayState='running';current.timer=setTimeout(endIntro,config.introDuration);});
   node.querySelector('button').focus();node.querySelector('button').addEventListener('click',endIntro);node.addEventListener('keydown',e=>{if(e.key==='Escape')endIntro();if(e.key==='Tab'){e.preventDefault();node.querySelector('button').focus();}});
 }
 function renderFilters(){
   for(const [key,id,label] of [['patterns','filter-pattern','All patterns'],['colours','filter-colour','All colours']]){const select=$('#'+id),value=select.value;select.innerHTML='<option value="">'+label+'</option>'+[...new Set(products.filter(p=>p.published).flatMap(p=>p[key]))].sort().map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');if([...select.options].some(o=>o.value===value))select.value=value;}
 }
 function renderProducts(){
   visibleProducts=core.filterProducts(products,$('#filter-pattern').value,$('#filter-colour').value);const shown=visibleProducts.slice(0,limit);
   $('#product-grid').innerHTML=shown.map(p=>'<article class="product-card"><div class="product-image"><img src="'+esc(p.image)+'" width="'+p.width+'" height="'+p.height+'" alt="'+esc(p.sku+' — '+p.name)+'" loading="lazy"></div><p class="product-sku">'+esc(p.sku)+'</p><h3>'+esc(p.name)+'</h3><dl class="product-meta"><dt>Pattern</dt><dd>'+esc(p.patterns.join(' / '))+'</dd><dt>Main Colour</dt><dd>'+esc(p.colours.join(' / ')||'Ask our team')+'</dd>'+(p.optionalColours.length?'<dt>Optional</dt><dd>'+esc(p.optionalColours.join(' | '))+'</dd>':'')+'<dt>Fabric</dt><dd>'+esc(p.fabric||'Details available from our team')+'</dd></dl><a href="#signup" data-product-enquiry="'+esc(p.sku)+'">Enquire about this design ↗</a></article>').join('');
   $('#product-grid').insertAdjacentHTML('beforeend',window.BlossomCatalogue.lockedCards());
   $('#product-count').textContent=shown.length+' preview looks · Full collection in the catalogue';$('#empty-products').hidden=visibleProducts.length!==0;$('#load-more').hidden=true;
 }
 async function updateProducts(){
   if(sourceRequested||!config.productsCsvUrl)return;sourceRequested=true;
   try{const url=new URL(config.productsCsvUrl);if(url.protocol!=='https:')return;const response=await fetch(url.href,{signal:AbortSignal.timeout(8000),credentials:'omit'});if(!response.ok)throw Error('Product source unavailable');const fresh=core.normaliseProducts(core.parseCsv(await response.text()));if(!fresh.length)throw Error('Empty product feed');products=core.previewProducts(fresh);renderFilters();renderProducts();}catch(e){console.warn('Product feed unavailable. Using the bundled catalogue snapshot.');}
 }
 function showCatalogue(scroll=false){
   if(phase!=='live'||!registered)return;const section=$('#catalogue');section.hidden=false;
   if(!$('#catalogue-viewer iframe')){const frame=document.createElement('iframe');frame.src=config.catalogUrl;frame.title='The Daily Blossom SS27 full catalogue';frame.allow='autoplay; fullscreen; clipboard-write';frame.allowFullscreen=true;frame.scrolling='no';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';$('#catalogue-viewer').append(frame);}
   $('.catalogue-pdf-link').href=config.catalogPdfUrl;$('.catalogue-pdf-link').target='_blank';$('.catalogue-pdf-link').rel='noopener';window.BlossomCatalogue.requestDownload(config.catalogPdfUrl,registrationKey);
   if(scroll)section.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 }
 function syncRegistration(){
   $('#lead-form').hidden=registered;$('#registered-panel').hidden=!registered;
   const copy=content.success[phase||'teaser'];
   $('#registered-title').textContent=copy.title;$('#registered-copy').textContent=copy.description;
   $('#registration-preview-notice').hidden=!preview;
   $('#registered-cta').hidden=phase!=='live';
   $('#success-whatsapp').innerHTML=(phase==='live'?'Request wholesale pricing':copy.cta)+' <span aria-hidden="true">↗</span>';
   if(registered&&phase==='live')showCatalogue(false);else{$('#catalogue').hidden=true;$('#catalogue-viewer').replaceChildren();}
 }
 function accepted(receipt){
   if(!core.acknowledged(receipt))return false;registered=true;storage.set(registrationKey,'1');storage.remove(registrationKey+'.pdf-download.v1');syncRegistration();if(phase==='live')showCatalogue(true);else $('#registered-panel').scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});return true;
 }
 window.Blossom=Object.freeze({onLeadAccepted:accepted,onNativeLeadAccepted:()=>{if(config.formMode!=='ladipage'||preview)return false;registered=true;storage.set(registrationKey,'1');storage.remove(registrationKey+'.pdf-download.v1');syncRegistration();if(phase==='live')showCatalogue(true);return true;},getPhase:()=>phase});
 function applyPhase(next,animate){
   const changed=phase!==next;if(changed)closeModal();phase=next;document.body.classList.toggle('is-live',next==='live');all('[data-phase]').forEach(el=>{el.hidden=el.dataset.phase!==next;});
   $('#countdown-wrap').hidden=next==='live';$('#hero-live-copy').hidden=next!=='live';$('#hero-update-box').hidden=next==='live';$('#reveal-rail').hidden=next==='live';
   $('#hero-title').innerHTML='The Daily <span>Blossom</span><span class="title-dot" aria-hidden="true">.</span>';
   $('#hero .hero-topline .eyebrow').innerHTML=next==='live'?'<em>'+content.hero.live.season+'</em>':'<span class="tiny-sun" aria-hidden="true">✷</span> '+content.hero.teaser.season;
   $('#hero .hero-description').textContent=content.hero[next].description;
   $('#flower-stage').setAttribute('aria-label',next==='live'?'A pink Lily in full bloom.':'An unopened pink Lily. Touch to gently wake the bud.');
   $('[data-nav-story]').href=next==='live'?'#story':'#discover';$('.scroll-cue').href=next==='live'?'#story':'#discover';$('.scroll-cue>span:first-child').textContent=next==='live'?'DISCOVER THE STORY':'LET IT UNFOLD';
   $('.nav-cta').innerHTML=(next==='live'?'Get the catalogue':'Get collection updates')+' <span aria-hidden="true">↗</span>';
   $('#signup-title').textContent=content.form[next].title;
   $('#signup-description').textContent=content.form[next].description;
   $('#form-submit').innerHTML=content.form[next].button+' <span aria-hidden="true">↗</span>';
   $('#campaign-phase').value=next==='live'?'catalogue_quote_request':'collection_updates';
   flower.setBloom(next==='live',animate&&next==='live');syncRegistration();
   if(changed&&next==='live'){renderProducts();updateProducts();playIntro(preview||animate);}else if(next!=='live')endIntro();
 }
 function tick(){if(intro)return;const time=now(),state=config.launchMode==='live'?{phase:'live',day:5}:core.state(time,start,launch);if(state.phase!==phase)applyPhase(state.phase,phase!==null);if(state.day!==day){day=state.day;renderRail();renderHints();detail.setUnlocked(isUnlocked(3));}const parts=core.countdown(time,launch);for(const key of Object.keys(parts))$('#time-'+key).textContent=String(parts[key]).padStart(2,'0');}
 function selectPreview(value){closeModal();endIntro();virtualTime=value==='real'?null:value==='cross'?launch-5000:value==='live'?launch+1000:start+Number(value)*core.DAY;virtualBegan=performance.now();day=null;tick();$('#hero').scrollIntoView({behavior:'auto'});}
 function initPreview(){
   document.body.classList.add('has-preview');const toolbar=document.createElement('div');toolbar.className='preview-toolbar';toolbar.setAttribute('aria-label','Preview controls');toolbar.innerHTML='<label for="preview-stage">Bản xem trước</label><select id="preview-stage"><option value="0">31/10 · D−5</option><option value="1">01/11 · D−4</option><option value="2">02/11 · D−3</option><option value="3">03/11 · D−2</option><option value="4">04/11 · D−1</option><option value="live">05/11 · Ra mắt</option><option value="real">Thời gian thật</option><option value="cross">Thử chuyển mốc (5s)</option></select><button id="replay-intro" type="button">Thử hoa nở</button><button id="preview-reset" type="button">Xóa đăng ký thử</button><span class="preview-tag">Không gửi lead thật</span>';
   document.body.append(toolbar);$('#preview-stage').addEventListener('change',e=>selectPreview(e.target.value));$('#replay-intro').addEventListener('click',()=>{selectPreview('live');$('#preview-stage').value='live';if(!intro)playIntro(true);});$('#preview-reset').addEventListener('click',()=>{registered=false;storage.remove(registrationKey);syncRegistration();});
   $('#preview-stage').value='2';const notice=document.createElement('p');notice.className='preview-notice';notice.textContent='Preview mode · Try the form with sample details. Nothing is sent to Babeeni or Google Sheets.';$('#lead-form').prepend(notice);
   if(query.get('view')==='live'){virtualTime=launch+1000;$('#preview-stage').value='live';}else if(query.has('day')){const n=Number(query.get('day'));if(Number.isInteger(n)&&n>=0&&n<=4){virtualTime=start+n*core.DAY;$('#preview-stage').value=String(n);}}
 }
 const regions='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
 let displayNames;try{displayNames=new Intl.DisplayNames(['en'],{type:'region'});}catch(e){}
 const countries=regions.map(code=>[code,displayNames?.of(code)||code]).sort((a,b)=>a[1].localeCompare(b[1]));$('#lead-country').insertAdjacentHTML('beforeend',countries.map(([code,name])=>'<option value="'+code+'">'+esc(name)+'</option>').join(''));
 const form=$('#lead-form');form.addEventListener('submit',async e=>{
   if(config.formMode==='ladipage'&&!preview)return;
   e.preventDefault();if(pending)return;const data=Object.fromEntries(new FormData(form));data.emailUpdates=$('#email-updates').checked;data.phone=String(data.phone||'').trim().replace(/[\s().-]/g,'').replace(/^00/,'+');$('#lead-phone').value=data.phone;const errors=core.validate(data);if(data.country&&!regions.includes(data.country))errors.country='Please choose your country.';
   all('.field-error').forEach(el=>el.textContent='');all('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));$('#form-status').textContent='';
   for(const [key,message] of Object.entries(errors)){$('#error-'+key).textContent=message;$('#lead-'+key).setAttribute('aria-invalid','true');}
   if(Object.keys(errors).length){$('#lead-'+Object.keys(errors)[0]).focus();return;}
   if(preview){accepted({ok:true,receiptId:'preview-only'});return;}
   if(config.formMode!=='endpoint'||!config.formEndpoint){$('#form-status').innerHTML='Registration is temporarily unavailable. Please <a href="mailto:'+esc(config.email)+'">email our team</a> or <a href="https://wa.me/84823776668" target="_blank" rel="noopener">chat on WhatsApp</a>.';return;}
   pending=true;$('#form-submit').disabled=true;$('#form-status').textContent='Sending your request…';
   const utm=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].map(k=>[k,query.get(k)||'']));
   const payload={...data,name:data.name.trim(),email:data.email.trim(),phone:data.phone.replace(/[\s().-]/g,''),company:data.company.trim(),businessRole:String(data.businessRole||'').trim(),message:String(data.message||'').trim(),phase,selectedSku,consentVersion:config.consentVersion,submittedAt:new Date().toISOString(),source:location.origin+location.pathname,utm};
   try{const endpoint=new URL(config.formEndpoint,location.href);if(endpoint.protocol!=='https:'&&endpoint.hostname!=='127.0.0.1'&&endpoint.hostname!=='localhost')throw Error('Invalid endpoint');const response=await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Registration failed');const receipt=await response.json();if(!accepted(receipt))throw Error('Missing receipt');$('#form-status').textContent='';}catch(error){$('#form-status').textContent="We couldn't confirm your registration. Your details are still here. Please try again or contact our team.";}finally{pending=false;$('#form-submit').disabled=false;}
 });
 $('#edit-registration').addEventListener('click',()=>{registered=false;storage.remove(registrationKey);syncRegistration();$('#lead-name').focus();});
 document.addEventListener('click',e=>{const reveal=e.target.closest('[data-reveal]');if(reveal)openHint(Number(reveal.dataset.reveal));const product=e.target.closest('[data-product-enquiry]');if(product){selectedSku=product.dataset.productEnquiry;$('#success-whatsapp').href='https://wa.me/84823776668?text='+encodeURIComponent("Hello Babeeni, I'd like wholesale pricing for "+selectedSku+' from The Daily Blossom SS27.');}});
 function resetFilters(){$('#filter-pattern').value='';$('#filter-colour').value='';limit=6;renderProducts();}
 for(const id of ['filter-pattern','filter-colour'])$('#'+id).addEventListener('change',()=>{limit=6;renderProducts();});
 $('#reset-filters').addEventListener('click',resetFilters);$('#empty-reset').addEventListener('click',resetFilters);$('#load-more').addEventListener('click',()=>{limit=6;renderProducts();});
 if(preview)initPreview();renderFilters();tick();setInterval(()=>{if(!document.hidden)tick();},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
})();
