(async () => {
  const gallery = document.getElementById('proGallery');
  const box = document.getElementById('lightbox');
  const image = document.getElementById('lbImage');
  const counter = document.getElementById('lbCounter');
  if (!gallery || !box || !image || !counter) return;

  const staticRefs = Array.from({length:25}, (_,i) => ({
    id: `initial-${String(i+1).padStart(2,'0')}`,
    url: `assets/images/referanslar/proje-${i+1}.webp`,
    title: `Referans uygulaması ${i+1}`,
    order: i+1,
    active:true
  }));
  let paths = staticRefs.slice();
  let current = 0;
  const isVideo=item=>item.mediaType==='video'||item.resourceType==='video'||/\.(mp4|webm|mov)(?:[?#]|$)/i.test(item.url||'');
  let activeVideo=null;

  function show(i) {
    if (!paths.length) return;
    current=(i+paths.length)%paths.length;
    if(activeVideo){activeVideo.pause();activeVideo.remove();activeVideo=null;}
    const item=paths[current];
    if(isVideo(item)){
      image.hidden=true;
      const video=document.createElement('video');video.src=item.url;video.controls=true;video.autoplay=true;video.playsInline=true;video.preload='metadata';video.className='lb-video';video.setAttribute('aria-label',item.title||'Referans videosu');image.insertAdjacentElement('afterend',video);activeVideo=video;
    }else{image.hidden=false;image.src=item.url;image.alt=item.title;}
    counter.textContent=`${current+1} / ${paths.length}`;
  }
  function open(i) {show(i);box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function close() {if(activeVideo){activeVideo.pause();activeVideo.remove();activeVideo=null;}image.hidden=false;box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function draw() {
    gallery.replaceChildren();
    paths.forEach((item,i) => {
      const button = document.createElement('button');
      button.className='pro-item';button.type='button';button.setAttribute('aria-label',item.title+' büyüt');
      const video=isVideo(item);
      const photo=document.createElement(video?'video':'img');
      photo.src=item.url;
      if(video){photo.preload='metadata';photo.muted=true;photo.playsInline=true;button.classList.add('video-item');}
      else{photo.alt=item.title;photo.loading=i<6?'eager':'lazy';photo.decoding='async';photo.addEventListener('error',()=>{if(item.fallback&&photo.src!==new URL(item.fallback,location.href).href)photo.src=item.fallback;});}
      button.appendChild(photo);if(video){const play=document.createElement('span');play.className='video-play';play.textContent='▶';button.appendChild(play)}button.addEventListener('click',()=>open(i));gallery.appendChild(button);
    });
    const count=document.querySelector('.refs-count');
    if(count)count.textContent=paths.length+' FOTOĞRAF / VİDEO';
  }
  draw();
  box.querySelector('.lb-close').onclick=close;
  box.querySelector('.lb-prev').onclick=()=>show(current-1);
  box.querySelector('.lb-next').onclick=()=>show(current+1);
  box.addEventListener('click', e=>{if(e.target===box)close();});
  document.addEventListener('keydown',e=>{if(!box.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1);});
  let touchX=0;
  box.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});
  box.addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-touchX;if(Math.abs(d)>45)show(current+(d<0?1:-1));},{passive:true});

  try {
    const cms=await window.kepenkCmsReady;
    if(!cms) return;
    const data=(await cms.get(cms.ref(cms.db,'references'))).val()||{};
    const entries=Object.entries(data);
    if(!entries.length) return;
    const imported=entries.some(([id])=>id.startsWith('initial-'));
    const dynamic=entries.map(([id,value])=>{
      if(!value || typeof value!=='object')return null;
      const n=/^initial-(\d+)$/.exec(id);
      if(n){
        const index=Number(n[1]);
        if(index>=1 && index<=25){
          const fallback=staticRefs[index-1].url;
          // Imported original assets always live in the published site's assets directory.
          // In particular, don't use old localhost or invalid absolute URLs stored in Firebase.
          return {id,url:fallback,fallback,title:value.title||`Referans uygulaması ${index}`,order:value.order??index,active:value.active!==false};
        }
      }
      if(typeof value.url!=='string'||!value.url.trim())return null;
      let url=value.url.trim();
      try {
        const parsed=new URL(url,location.href);
        if(['localhost','127.0.0.1'].includes(parsed.hostname)){
          url=parsed.pathname.replace(/^\//,'');
        }
      }catch(_e){}
      return {id,url,mediaType:value.mediaType||value.resourceType||'image',title:value.title||'Referans uygulaması',order:value.order??999,active:value.active!==false};
    }).filter(Boolean);
    const items=(imported?dynamic:[...staticRefs,...dynamic])
      .filter(item=>item.active!==false)
      .sort((a,b)=>Number(a.order||0)-Number(b.order||0));
    if(items.length){paths=items;draw();}
  } catch (err) {
    console.warn('Referanslar güncellenemedi, hazır görseller korunuyor:',err.message);
  }
})();
