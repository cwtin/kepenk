(function(){
 const cfg=window.KEPENK_FIREBASE_CONFIG||{};
 if(!cfg.databaseURL){window.kepenkCmsReady=Promise.resolve(null);return}
 window.kepenkCmsReady=(async()=>{
  try{
   const {initializeApp,getApps,getApp}=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
   const {getDatabase,ref,get}=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js');
   const app=getApps().length?getApp():initializeApp(cfg),db=getDatabase(app);
   const snap=await get(ref(db,'site/content'));const data=snap.val()||{};
   for(const [key,value] of Object.entries(data.fields||{}))document.querySelectorAll('[data-cms="'+key+'"]').forEach(el=>{el.textContent=String(value??'')});
   return {db,ref,get,content:data};
  }catch(e){console.warn('Realtime Database okunamadi:',e.message);return null}
 })();
})();
