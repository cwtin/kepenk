(async function(){try{
 const cms=await window.kepenkCmsReady;if(!cms)return;
 const d=cms.content||{},images=d.images||{},settings=d.settings||{};
 for(const [key,url] of Object.entries(images)){if(!/^https:\/\//.test(url)&&!url.startsWith('assets/'))continue;document.querySelectorAll('[data-cms-img="'+key+'"]').forEach(el=>el.src=url)}
 if(settings.phone){const ph=settings.phone.replace(/[^\d+]/g,'');document.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:'+ph;if(a.textContent.includes('547 543'))a.textContent=settings.phone})}
 for(const type of ['facebook','instagram','whatsapp'])if(settings[type]){document.querySelectorAll('a[href*="'+type+'.com"],a[href*="'+type+'.me/"]').forEach(a=>{if(type==='whatsapp'&&a.href.includes('wa.me/')||type!=='whatsapp'&&a.href.includes(type+'.com'))a.href=settings[type]})}
 if(settings.address)document.querySelectorAll('[data-cms-address]').forEach(el=>el.textContent=settings.address);
 }catch(err){console.warn('Ek icerikler yuklenemedi',err)}})();
