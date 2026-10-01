
const menuBtn=document.querySelector('.menuBtn');
const nav=document.querySelector('.navlinks');
if(menuBtn&&nav){menuBtn.addEventListener('click',()=>nav.classList.toggle('open'));}
const current=(location.pathname.split('/').pop()||'index.html');
document.querySelectorAll('.navlinks a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active')});
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal,.reveal-left').forEach(el=>io.observe(el));
const counters=document.querySelectorAll('[data-count]');
const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;const end=+el.dataset.count;let cur=0;const step=Math.max(1,Math.ceil(end/45));const tick=()=>{cur=Math.min(end,cur+step);el.textContent=cur+(el.dataset.suffix||'');if(cur<end)requestAnimationFrame(tick)};tick();cio.unobserve(el)}),{threshold:.5});
counters.forEach(el=>cio.observe(el));
document.querySelectorAll('.service-card,.gallery-card').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(800px) rotateX(${(-y*2.5).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg) translateY(-2px)`});card.addEventListener('mouseleave',()=>card.style.transform='')});
