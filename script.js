'use strict';
const menuButton=document.querySelector('.menu-toggle');
const menu=document.querySelector('.main-nav');
function closeMenu(){menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}
menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.querySelector('#year').textContent=new Date().getFullYear();
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const roles=['Electronics system designer & developer','Front-end developer','Mechanical 3D designer','Product developer','Digital marketing analyst'];
const roleText=document.querySelector('#changing-role');
let role=0,letter=0,deleting=false,typingTimer;
function typeRole(){
  if(document.hidden)return;
  const text=roles[role];
  letter+=deleting?-1:1;
  roleText.textContent=text.slice(0,letter);
  let delay=deleting?25:50;
  if(!deleting&&letter===text.length){deleting=true;delay=1200;}
  else if(deleting&&letter===0){deleting=false;role=(role+1)%roles.length;delay=250;}
  typingTimer=setTimeout(typeRole,delay);
}
function resetTyping(){
  clearTimeout(typingTimer);
  role=0;letter=0;deleting=false;
  roleText.textContent=reducedMotion.matches?roles[0]:'';
  if(!reducedMotion.matches)typingTimer=setTimeout(typeRole,250);
}
reducedMotion.addEventListener('change',resetTyping);
document.addEventListener('visibilitychange',()=>{
  clearTimeout(typingTimer);
  if(!document.hidden&&!reducedMotion.matches)typingTimer=setTimeout(typeRole,150);
});
resetTyping();
function updateGallery(track){const prev=document.querySelector('.gallery-prev[data-gallery="'+track.id+'"]');const next=document.querySelector('.gallery-next[data-gallery="'+track.id+'"]');prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-3;}
document.querySelectorAll('.gallery-track').forEach(track=>{track.addEventListener('scroll',()=>updateGallery(track),{passive:true});new ResizeObserver(()=>updateGallery(track)).observe(track);updateGallery(track);});
document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{const track=document.getElementById(button.dataset.gallery);const distance=track.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap);track.scrollBy({left:distance*(button.classList.contains('gallery-prev')?-1:1),behavior:reducedMotion.matches?'instant':'smooth'});}));
const dialog=document.getElementById('project-dialog');let lastProjectButton;
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{lastProjectButton=button;document.getElementById('dialog-content').replaceChildren(document.getElementById(button.dataset.project).content.cloneNode(true));dialog.querySelector(".dialog-title").id="dialog-title";dialog.showModal();dialog.scrollTop=0;document.body.classList.add('dialog-open');}));
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lastProjectButton?.focus({preventScroll:true});});
document.querySelector('.copy-email').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('shahriarfardin123@gmail.com');status.textContent='Email address copied.';}catch{status.textContent='Select and copy the email above, or tap it to open your email app.';}});
const navLinks=[...document.querySelectorAll('.main-nav a')];
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){navLinks.forEach(link=>{const active=link.hash==='#'+entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -65% 0px',threshold:0});
navLinks.forEach(link=>{const target=document.querySelector(link.hash);if(target)observer.observe(target);});
