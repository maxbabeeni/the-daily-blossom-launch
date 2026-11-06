/* Approved enhanced Lily pixels, whole-image geometry, bidirectional 2.5D motion.
   No replacement petals, stem patch, diagonal cut, or fabricated 3D petal rig. */
(function(){
 'use strict';
 const POSTERS=['assets/lily-01-bud.webp','assets/lily-06-open.webp'];
 const VERT='attribute vec2 aPosition;attribute vec2 aFlow;attribute vec2 aUV;uniform vec2 uSize;uniform vec2 uRoot;uniform float uScale;uniform float uWarp;uniform float uPulse;varying vec2 vUV;void main(){vec2 q=aPosition+aFlow*uWarp;float lock=clamp((515.-q.y)/250.,0.,1.);q.y+=uPulse*lock;vec2 p=uRoot+(q-vec2(850.,515.))*uScale;gl_Position=vec4(p/uSize*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);vUV=aUV;}';
 const FRAG='precision mediump float;uniform sampler2D uTexture;uniform float uWeight;varying vec2 vUV;void main(){if(vUV.x<0.||vUV.x>1.||vUV.y<0.||vUV.y>1.)discard;vec4 c=texture2D(uTexture,vUV);if(c.a<.003)discard;gl_FragColor=vec4(c.rgb,c.a*uWeight);}';
 function create(canvas,stage,options={}){
  const api=window.BlossomLilyReference,poster=stage?.querySelector('img'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let open=false,dead=false,paused=false,visible=true,raf=0,animating=false,progress=0,began=0,duration=7000,pulse=-10000,downY=0,metrics=[],contextLost=false,loaded=false,needsReveal=true;
  let gl;try{gl=!options.posterOnly&&canvas?.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});}catch(e){}
  function fallback(){stage?.classList.remove('is-ready');stage?.classList.add('is-fallback');if(poster)poster.src=POSTERS[open?1:0];}
  if(!gl||!api){fallback();return {driver:'approved-reference-poster',ready:Promise.resolve(),setBloom(value){open=!!value;fallback();return Promise.resolve();},setProgress(value){open=value>.5;fallback();return Promise.resolve();},pause(){},destroy(){dead=true;}};}
  const buffers=[],textures=[];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VERT));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(program);gl.useProgram(program);
  const loc={};for(const n of ['aPosition','aFlow','aUV'])loc[n]=gl.getAttribLocation(program,n);for(const n of ['uSize','uRoot','uScale','uTexture','uWeight','uWarp','uPulse'])loc[n]=gl.getUniformLocation(program,n);
  // Additive premultiplied accumulation of motion-aligned textures: no dark fringe
  // and no 75%-alpha artefact at the midpoint of two opaque reference regions.
  gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
  function buffer(data,target=gl.ARRAY_BUFFER){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;}
  function decode(s){const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new Float32Array(bytes.buffer);}
  const position=[],indices=[];for(let y=0;y<=api.rows;y++)for(let x=0;x<=api.columns;x++)position.push(x/api.columns*api.width,y/api.rows*api.height);
  for(let y=0;y<api.rows;y++)for(let x=0;x<api.columns;x++){const a=y*(api.columns+1)+x,b=a+1,c=a+api.columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const posBuffer=buffer(new Float32Array(position)),indexBuffer=buffer(new Uint16Array(indices),gl.ELEMENT_ARRAY_BUFFER),zeroFlow=buffer(new Float32Array(position.length)),flows=api.pairs.map(p=>({forward:buffer(decode(p.forward)),backward:buffer(decode(p.backward))}));
  const poses=[];
  function texture(p){return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';img.onload=()=>{if(dead)return resolve(null);const t=gl.createTexture();textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);const uv=new Float32Array(position.length);for(let k=0;k<position.length;k+=2){uv[k]=(position[k]-p.offset[0])/img.width;uv[k+1]=(position[k+1]-p.offset[1])/img.height;}resolve({texture:t,uv:buffer(uv)});};img.onerror=()=>reject(Error('Lily reference image unavailable'));img.src=p.src;});}
  stage.dataset.rendererVersion='approved-reference-flow-v3';stage.dataset.motionDriver='reference-image-optical-flow-2.5d';
  const ready=Promise.all(api.poses.map(texture)).then(items=>{poses.push(...items);loaded=items.every(Boolean);if(loaded)schedule();}).catch(()=>fallback());
  function attribute(name,b){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(loc[name]);gl.vertexAttribPointer(loc[name],2,gl.FLOAT,false,0,0);}
  function drawPose(i,flow,warp,weight){if(weight<.00001)return;attribute('aPosition',posBuffer);attribute('aFlow',flow);attribute('aUV',poses[i].uv);gl.uniform1f(loc.uWarp,warp);gl.uniform1f(loc.uWeight,weight);gl.bindTexture(gl.TEXTURE_2D,poses[i].texture);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);}
  function schedule(){if(!dead&&!contextLost&&!paused&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(draw);}
  function draw(now){
   raf=0;if(dead||paused||!visible||document.hidden||!loaded)return;
   if(animating){progress=Math.min(1,(now-began)/duration);metrics.push(now);if(progress>=1){progress=1;animating=false;report();}}
   const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(!w||!h)return;
   const px=Math.round(w*dpr),py=Math.round(h*dpr);if(canvas.width!==px||canvas.height!==py){canvas.width=px;canvas.height=py;gl.viewport(0,0,px,py);}
   const scale=Math.max(.01,Math.min((w*.66-8)/650,(w*.34-8)/400,(h-12)/710));
   // The shortest reference stem ends at y=704. Keep that endpoint beyond
   // the canvas edge in every pose, with one fixed attachment throughout.
   gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(loc.uSize,w,h);gl.uniform2f(loc.uRoot,w*.66,h-184*scale+2);gl.uniform1f(loc.uScale,scale);gl.uniform1i(loc.uTexture,0);
   const age=(now-pulse)/1000;gl.uniform1f(loc.uPulse,!open&&!reduced&&age>=0&&age<1?Math.sin(age*12)*Math.exp(-age*5)*2:0);
   const seconds=progress*30;let i=0;while(i<4&&seconds>api.times[i+1])i++;
   let f=Math.max(0,Math.min(1,(seconds-api.times[i])/(api.times[i+1]-api.times[i])));f=f*f*(3-2*f);
   // Cross-dissolve over the entire interval instead of switching references
   // in its narrow middle. Quintic easing has no sudden opacity acceleration.
   if(f<.00001)drawPose(i,zeroFlow,0,1);else if(f>.99999)drawPose(i+1,zeroFlow,0,1);else{const weight=f*f*f*(f*(f*6-15)+10);drawPose(i,flows[i].forward,f,1-weight);drawPose(i+1,flows[i].backward,1-f,weight);}
   if(!animating)stage.dataset.masterSeconds=String(Math.round(progress*3000)/100);
   if(needsReveal){stage.classList.add('is-ready');stage.classList.remove('is-fallback');needsReveal=false;}if(animating||age<1.1)schedule();
  }
  function report(publish=true){if(metrics.length<2)return null;const intervals=metrics.slice(1).map((v,i)=>v-metrics[i]).sort((a,b)=>a-b),elapsed=metrics.at(-1)-metrics[0],result={fps:Number(((metrics.length-1)*1000/elapsed).toFixed(1)),p95:Number(intervals[Math.floor(intervals.length*.95)].toFixed(1)),frames:metrics.length};if(publish){stage.dataset.motionFps=result.fps;stage.dataset.motionP95=result.p95;stage.dataset.motionFrames=result.frames;}return result;}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(raf);raf=0;}});observer.observe(stage);
  const resize=new ResizeObserver(schedule);resize.observe(stage);const visibility=()=>schedule();document.addEventListener('visibilitychange',visibility);
  const down=e=>{downY=e.clientY;},tap=e=>{if(!open&&!reduced&&(e.type!=='pointerup'||Math.abs(e.clientY-downY)<12)){pulse=performance.now();schedule();}},key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(e);}};
  stage.addEventListener('pointerdown',down,{passive:true});stage.addEventListener('pointerup',tap,{passive:true});stage.addEventListener('keydown',key);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(raf);fallback();});
  return {driver:'approved-reference-optical-flow-2.5d',ready,getMetrics:()=>report(false),async setProgress(value){await ready;progress=Math.max(0,Math.min(1,value));open=progress>0;animating=false;schedule();},async setBloom(value,animate=false,length=7000){open=!!value;await ready;if(dead)return;if(poster)poster.src=POSTERS[open?1:0];animating=animate&&open&&!reduced;duration=length;progress=animating?0:open?1:0;began=performance.now();metrics=[];schedule();},pause(value){paused=!!value;if(!paused)schedule();},destroy(){dead=true;cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',visibility);stage.removeEventListener('pointerdown',down);stage.removeEventListener('pointerup',tap);stage.removeEventListener('keydown',key);buffers.forEach(b=>gl.deleteBuffer(b));textures.forEach(t=>gl.deleteTexture(t));gl.deleteProgram(program);}};
 }
 window.BlossomFlower={create};
})();
