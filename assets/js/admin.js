import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getDatabase,ref,get,update,set,remove} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
const $=id=>document.getElementById(id),status=$('status'),cfg=window.KEPENK_FIREBASE_CONFIG||{},definitions=JSON.parse($('cmsDefinitions').textContent),defaults=Object.fromEntries(Object.entries(definitions.text).map(([k,v])=>[k,v.default]));let auth,db,user,items=[];let galleryLoaded=false;
const CLOUD_NAME='juspjoy9',UPLOAD_PRESET='alioglu_referanslar';
const notify=m=>{status.textContent=m;if(m&&/kaydedildi|hata|başarısız|yüklenemedi/i.test(m))status.scrollIntoView({behavior:'smooth',block:'nearest'})};
const busy=(b,on)=>{if(!b)return;b.disabled=on;b.setAttribute('aria-busy',String(on));if(on){b.dataset.originalLabel=b.textContent;b.textContent='Kaydediliyor…'}else if(b.dataset.originalLabel){b.textContent=b.dataset.originalLabel;delete b.dataset.originalLabel}};
// Realtime Database: Firebase Authentication ile giris yapmis kullanicilar veri yazabilir.
function readableError(err){
 const message=String(err?.message||err||'Bilinmeyen hata');
 if(/PERMISSION_DENIED|permission_denied|permission denied/i.test(message))return Error('Realtime Database yetkisi reddedildi. Realtime Database Rules ve oturum acilmis hesabi kontrol edin.');
 if(/network|offline|unavailable/i.test(message))return Error('Realtime Database baglantisi kurulamadi. Internet ve databaseURL adresini kontrol edin.');
 return Error(message);
}
async function timed(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Firebase yanit vermedi (15 saniye). Baglantiyi kontrol edin.')),15000)})])}finally{clearTimeout(timer)}}
async function dbRead(path){try{return (await timed(get(ref(db,path)))).val()}catch(e){throw readableError(e)}}
async function dbWrite(path,value){if(!user)throw Error('Oturum acmaniz gerekiyor.');try{await timed(set(ref(db,path),value))}catch(e){throw readableError(e)}}
async function dbUpdate(path,value){if(!user)throw Error('Oturum acmaniz gerekiyor.');try{await timed(update(ref(db,path),value))}catch(e){throw readableError(e)}}
async function dbRemove(path){if(!user)throw Error('Oturum acmaniz gerekiyor.');try{await timed(remove(ref(db,path)))}catch(e){throw readableError(e)}}
function referencePath(id){return 'references/'+id}
function resolveReferencePhoto(item){
  const found=/^initial-(\d+)$/.exec(item.id||'');
  if(found){const n=Number(found[1]);if(n>=1&&n<=25)return 'assets/images/referanslar/proje-'+n+'.webp';}
  if(typeof item.url!=='string')return '';
  const raw=item.url.trim();
  try{const parsed=new URL(raw,location.href);if(['localhost','127.0.0.1'].includes(parsed.hostname))return parsed.pathname.replace(/^\//,'');}catch(_){ }
  return raw;
}
async function fetchReferences(){const obj=await dbRead('references')||{};return Object.entries(obj).map(([id,data])=>({id,...data,url:resolveReferencePhoto({id,...data})})).sort((a,b)=>(a.order||0)-(b.order||0))}
async function patchReference(id,changes){return dbUpdate(referencePath(id),changes)}
async function createReference(data){const id='ref-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);await dbWrite(referencePath(id),data);return id}
async function removeReference(id){return dbRemove(referencePath(id))}

if(!cfg.apiKey||!cfg.databaseURL){notify('Realtime Database adresi eksik. assets/js/firebase-config.js icindeki databaseURL alanina Firebase Console adresinizi yazin.');$('loginForm').querySelector('button').disabled=true}
else{
const app=initializeApp(cfg);auth=getAuth(app);db=getDatabase(app);
$('loginForm').onsubmit=async e=>{e.preventDefault();let b=e.submitter;busy(b,true);try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value)}catch(err){notify('Giriş başarısız: '+err.message)}finally{busy(b,false)}};
$('logout').onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{$('login').hidden=!!u;$('dashboard').hidden=!u;$('logout').hidden=!u;user=u;if(u){$('password').value='';renderGallery();renderContent();renderImages();loadExtras();void load()}});
}
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{for(const x of document.querySelectorAll('[data-tab]'))x.classList.toggle('active',x===b);for(const id of ['overview','gallery','content','images','settings'])$(id).hidden=b.dataset.tab!==id};
async function load(){await Promise.allSettled([loadGallery(),loadContent()])}
const staticReferences=Array.from({length:25},(_,i)=>({url:`assets/images/referanslar/proje-${i+1}.webp`,title:`Referans fotoğrafı ${i+1}`,order:i+1,active:true}));
function toggleUpload(open){$('uploadForm').hidden=!open;$('showUpload').setAttribute('aria-expanded',String(open));if(open){$('uploadForm').scrollIntoView({behavior:'smooth',block:'nearest'})}else{$('uploadForm').reset();$('uploadPreview').replaceChildren()}}
$('showUpload').onclick=()=>toggleUpload($('uploadForm').hidden);
$('closeUpload').onclick=$('cancelUpload').onclick=()=>toggleUpload(false);
$('photos').onchange=()=>{const box=$('uploadPreview');box.replaceChildren();for(const file of Array.from($('photos').files).slice(0,12)){const img=document.createElement('img');img.src=URL.createObjectURL(file);img.alt=file.name;img.onload=()=>URL.revokeObjectURL(img.src);box.append(img)}};
async function loadGallery(){try{items=await fetchReferences();galleryLoaded=true;try{localStorage.setItem('kepenk_ref_cache_v5',JSON.stringify(items))}catch(_){}renderGallery()}catch(e){console.warn('Referans verisi alınamadı:',e);notify('Referanslar güncellenemedi: '+e.message+' Mevcut fotoğraflar gösteriliyor.')}}
function renderGallery(){const initialIds=new Set(items.map(x=>x.id));const isImported=items.some(x=>x.id.startsWith('initial-'));const originals=isImported?[]:staticReferences.map((x,i)=>({...x,id:'local-'+i,local:true}));const display=[...originals,...items.map(item=>({...item,url:resolveReferencePhoto(item)}))].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));$('refCount').textContent=display.filter(x=>x.active!==false).length;$('galleryCount').textContent=display.length;$('importBanner').hidden=isImported;
const grid=$('galleryList');grid.replaceChildren();for(const item of display){const card=document.createElement('article');card.className='item';const image=document.createElement('img');image.src=resolveReferencePhoto(item);image.addEventListener('error',()=>{if(/^initial-/.test(item.id)){const n=Number(item.id.slice(8));const local='assets/images/referanslar/proje-'+n+'.webp';if(!image.src.endsWith('/'+local))image.src=local;}});image.loading=display.indexOf(item)<8?'eager':'lazy';image.decoding='async';image.alt=item.title||'Referans';const thumb=document.createElement('div');thumb.className='item-photo';thumb.append(image);const badge=document.createElement('span');badge.className='photo-badge';badge.textContent=item.local?'Mevcut fotoğraf':item.active===false?'Gizli':'Yayında';thumb.append(badge);card.append(thumb);if(item.local){const label=document.createElement('div');label.className='static-caption';label.textContent=item.title;card.append(label);grid.append(card);continue}
const title=document.createElement('input');title.value=item.title||'';title.placeholder='Fotoğraf açıklaması';title.setAttribute('aria-label','Referans açıklaması');const order=document.createElement('input');order.type='number';order.min='1';order.value=Number(item.order)||0;order.title='Sıra numarası';const save=document.createElement('button');save.textContent='Kaydet';save.onclick=async()=>{busy(save,true);try{await patchReference(item.id,{title:title.value.trim(),order:Number(order.value)||0});notify('Referans güncellendi');await loadGallery()}catch(e){notify('Hata: '+e.message)}finally{busy(save,false)}};const remove=document.createElement('button');remove.textContent='Sil';remove.className='danger';remove.onclick=async()=>{if(!confirm('Bu referansı siteden kaldırmak istiyor musunuz?'))return;busy(remove,true);try{await removeReference(item.id);notify('Referans siteden kaldırıldı. Cloudinary hesabındaki dosya silinmez.');await loadGallery()}catch(e){notify('Silme hatası: '+e.message)}finally{busy(remove,false)}};const visible=document.createElement('label');visible.className='toggle';const check=document.createElement('input');check.type='checkbox';check.checked=item.active!==false;check.onchange=async()=>{try{await patchReference(item.id,{active:check.checked});notify('Görünürlük güncellendi');await loadGallery()}catch(err){notify('Hata: '+err.message)}};visible.append(check,document.createTextNode(' Sitede göster'));const orderWrap=document.createElement('label');orderWrap.className='order-wrap';orderWrap.textContent='Sıra';orderWrap.append(order);const actions=document.createElement('div');actions.className='card-actions';actions.append(save,remove);card.append(title,orderWrap,visible,actions);grid.append(card)}}
$('uploadForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;const files=Array.from($('photos').files);if(!files.length)return;for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){notify('Yalnızca JPG, PNG veya WebP ve en fazla 8 MB dosyalar yüklenebilir.');return}}busy(b,true);try{let pos=items.reduce((m,x)=>Math.max(m,Number(x.order)||0),0);for(const file of files){
  // Unsigned presets allow browser-side uploads; no secret credentials are included.
  const payload=new FormData();
  payload.append('file',file);
  payload.append('upload_preset',UPLOAD_PRESET);
  const response=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,{method:'POST',body:payload});
  const result=await response.json().catch(()=>({}));
  if(!response.ok||!result.secure_url)throw Error(result.error?.message||'Cloudinary fotoğrafı yükleyemedi. Preset Unsigned olduğundan emin olun.');
  await createReference({url:result.secure_url,cloudinaryPublicId:result.public_id,title:$('photoTitle').value.trim()||'Referans uygulaması',order:++pos,active:true,createdAt:Date.now()});
}e.target.reset();toggleUpload(false);notify(files.length+' fotoğraf yüklendi');await loadGallery()}catch(err){notify('Yükleme hatası: '+err.message)}finally{busy(b,false)}};
$('importInitial').onclick=async e=>{if(items.some(x=>x.id.startsWith('initial-'))){notify('Eski fotoğraflar zaten içe aktarılmış.');return}if(!confirm('Mevcut 25 fotoğrafı yönetime aktarmak istiyor musunuz?'))return;const b=e.target;busy(b,true);try{for(let i=1;i<=25;i++){const id='initial-'+String(i).padStart(2,'0');await dbWrite(referencePath(id),{url:new URL('assets/images/referanslar/proje-'+i+'.webp',location.href).href,title:'Referans uygulaması '+i,order:i,active:true,createdAt:Date.now()})}notify('25 referans içe aktarıldı');await loadGallery()}catch(err){notify('İçe aktarma başarısız: '+err.message+' Tekrar denemek eksik kalanları tamamlar.')}finally{busy(b,false)}};

const pageLabels=definitions.pages;let siteData={};try{const cache=JSON.parse(localStorage.getItem('kepenk_ref_cache_v5')||'[]');if(Array.isArray(cache))items=cache}catch(_){}try{siteData=JSON.parse(localStorage.getItem('kepenk_site_cache_v5')||'{}')||{}}catch(_){}const pages=Object.keys(pageLabels);
for(const id of ['contentPage','imagePage']){const select=$(id);for(const page of pages){const opt=document.createElement('option');opt.value=page;opt.textContent=pageLabels[page];select.append(opt)}}
for(const button of document.querySelectorAll('[data-go]'))button.onclick=()=>document.querySelector('[data-tab="'+button.dataset.go+'"]').click();
function makeField(key,entry,value,container,isImage=false){
 const wrapper=document.createElement('div');wrapper.className='field'+(isImage?' image-card':'');
 const label=document.createElement('label');label.textContent=entry.label||key;
 if(isImage){
  const photo=document.createElement('img');photo.className='image-preview';photo.alt=entry.label||'Mevcut fotoğraf';photo.src=value||entry.default;wrapper.append(photo);
  const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.className='visually-hidden';file.id='file-'+key;file.dataset.imageField=key;
  const button=document.createElement('label');button.className='replace-photo';button.htmlFor=file.id;button.textContent='📷 Fotoğrafı Değiştir';
  const hint=document.createElement('small');hint.className='photo-hint';hint.textContent='Mevcut fotoğraf kullanılıyor';
  let previewUrl=null;
  file.addEventListener('change',()=>{
   const selected=file.files?.[0];if(!selected)return;
   if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>8*1024*1024){notify('JPG, PNG veya WebP seçin (en fazla 8 MB).');file.value='';return}
   if(previewUrl)URL.revokeObjectURL(previewUrl);
   previewUrl=URL.createObjectURL(selected);photo.src=previewUrl;hint.textContent='Yeni fotoğraf seçildi • Kaydet ile yayınlanacak';hint.classList.add('pending-photo');
  });
  wrapper.append(label,file,button,hint);
 }else{const input=document.createElement(value.length>110?'textarea':'input');input.value=value;input.dataset.field=key;label.append(input);wrapper.append(label)}
 container.append(wrapper)
}
function renderContent(){const page=$('contentPage').value,box=$('contentFields');box.replaceChildren();for(const [key,entry] of Object.entries(definitions.text))if(entry.page===page)makeField(key,entry,(siteData.fields||{})[key]??entry.default,box)}
function renderImages(){const page=$('imagePage').value,box=$('imageFields');box.replaceChildren();for(const [key,entry] of Object.entries(definitions.images))if(entry.page===page)makeField(key,entry,(siteData.images||{})[key]??entry.default,box,true)}
$('contentPage').onchange=renderContent;$('imagePage').onchange=renderImages;
async function loadContent(){try{const result=await dbRead('site/content');if(document.activeElement?.matches('#contentFields input,#contentFields textarea,#settingsForm input,#settingsForm textarea'))return;siteData=result||{};try{localStorage.setItem('kepenk_site_cache_v5',JSON.stringify(siteData))}catch(_){}renderContent();renderImages();loadExtras()}catch(e){if(!/NOT_FOUND|404|not found/i.test(e.message)){console.warn('Site içerikleri okunamadı:',e);notify('İçerikler güncellenemedi: '+e.message)}renderContent();renderImages();loadExtras()}}
async function savePartial(patch){await dbUpdate('site/content',{...patch,updatedAt:Date.now()})}
$('contentForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;busy(b,true);try{const fields={...(siteData.fields||{})};for(const input of document.querySelectorAll('[data-field]'))fields[input.dataset.field]=input.value.trim();await savePartial({fields});siteData.fields=fields;try{localStorage.setItem('kepenk_site_cache_v5',JSON.stringify(siteData))}catch(_){}notify('Sayfa yazıları kaydedildi.')}catch(err){notify('Kaydetme hatası: '+err.message)}finally{busy(b,false)}};
async function uploadCloudinary(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('JPG, PNG, WebP ve en fazla 8 MB kullanılabilir.');const payload=new FormData();payload.append('file',file);payload.append('upload_preset',UPLOAD_PRESET);const response=await fetch('https://api.cloudinary.com/v1_1/'+CLOUD_NAME+'/image/upload',{method:'POST',body:payload});const result=await response.json().catch(()=>({}));if(!response.ok||!result.secure_url)throw Error(result.error?.message||'Cloudinary yüklemesi başarısız');return result.secure_url}
$('imagesForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;busy(b,true);try{
 const images={...(siteData.images||{})};let uploads=0;
 for(const input of document.querySelectorAll('[data-image-field]')){
  const file=input.files?.[0];if(!file)continue;
  notify('Fotoğraf yükleniyor: '+(uploads+1));
  images[input.dataset.imageField]=await uploadCloudinary(file);uploads++;
 }
 if(!uploads){notify('Henüz değiştirilmiş fotoğraf yok.');return}
 await savePartial({images});siteData.images=images;
 try{localStorage.setItem('kepenk_site_cache_v5',JSON.stringify(siteData))}catch(_){}
 renderImages();notify(uploads+' fotoğraf kaydedildi ve sitede yayına alındı.');
 }catch(err){notify('Kaydetme hatası: '+err.message+' • Yeniden denemeden önce fotoğrafları kontrol edin.')}finally{busy(b,false)}};
async function loadExtras(){const settings=siteData.settings||{};for(const field of $('settingsForm').elements)if(field.name)field.value=settings[field.name]??({phone:'+90 547 543 35 35',whatsapp:'https://wa.me/905475433535',facebook:'https://www.facebook.com/huseyin.aydemir.75873',instagram:'https://www.instagram.com/huseyinaydemirr43/',address:'Gediz, Kütahya'}[field.name]||'')}
$('refCount').textContent='25';$('galleryCount').textContent='25';
$('settingsForm').onsubmit=async e=>{e.preventDefault();const b=e.submitter;busy(b,true);try{const settings={};for(const x of e.target.elements)if(x.name)settings[x.name]=x.value.trim();await savePartial({settings});siteData.settings=settings;try{localStorage.setItem('kepenk_site_cache_v5',JSON.stringify(siteData))}catch(_){}notify('İletişim bilgileri kaydedildi')}catch(err){notify('Hata: '+err.message)}finally{busy(b,false)}};
