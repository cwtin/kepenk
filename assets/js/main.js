
const menuBtn=document.querySelector('.menuBtn');
const nav=document.querySelector('.navlinks');
if(menuBtn&&nav){menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuBtn.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',open?'true':'false');});document.addEventListener('click',e=>{if(!nav.classList.contains('open'))return;if(!nav.contains(e.target)&&!menuBtn.contains(e.target)){nav.classList.remove('open');menuBtn.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}});}
const current=(location.pathname.split('/').pop()||'index.html');
document.querySelectorAll('.navlinks a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal,.reveal-left').forEach(el=>io.observe(el));
const counters=document.querySelectorAll('[data-count]');
const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;const end=+el.dataset.count;let cur=0;const step=Math.max(1,Math.ceil(end/45));const tick=()=>{cur=Math.min(end,cur+step);el.textContent=cur+(el.dataset.suffix||'');if(cur<end)requestAnimationFrame(tick)};tick();cio.unobserve(el)}),{threshold:.5});
counters.forEach(el=>cio.observe(el));
document.querySelectorAll('.service-card,.gallery-card').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(800px) rotateX(${(-y*2.5).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg) translateY(-2px)`});card.addEventListener('mouseleave',()=>card.style.transform='')});


// Prevent accidental double-tap/double-click zoom while keeping normal taps usable.
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
let lastTouchEnd=0;
document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=320){e.preventDefault()}lastTouchEnd=now},{passive:false});

// Keep the mobile navigation trigger visible at every scroll position.
const siteHeader=document.querySelector('header');
const syncHeaderScrollState=()=>{if(!siteHeader)return;siteHeader.classList.toggle('is-scrolled',window.scrollY>8)};
syncHeaderScrollState();
window.addEventListener('scroll',syncHeaderScrollState,{passive:true});
