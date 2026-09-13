'use strict';
const config=window.PORTFOLIO_CONFIG;
const client=supabase.createClient(config.url,config.key,{auth:{storage:sessionStorage}});
const $=s=>document.querySelector(s);
let doc,roles=[],title='',dirty=false,current='introduction',selected=null,versions={},busy=false;
const clean=html=>DOMPurify.sanitize(html,{USE_PROFILES:{html:true},ADD_TAGS:['template'],FORBID_TAGS:['script','style','iframe','object','embed','form','input','textarea','select','base','link','meta'],FORBID_ATTR:['style','srcdoc','contenteditable']});
const status=message=>{$('#status').textContent=message;};
function changed(){dirty=true;status('Unsaved changes. Save a draft or publish when ready.');}
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function button(text,action,cls){const b=element('button',text,cls);b.type='button';b.onclick=action;return b;}
function field(parent,label,value,onchange,large=false){const l=element('label',label),i=document.createElement(large?'textarea':'input');i.value=value||'';i.oninput=()=>{onchange(i.value);changed();};l.append(i);parent.append(l);return i;}
async function task(fn){if(busy)return;busy=true;$('#actions').querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){status(e.message||'Something went wrong. Please try again.');}finally{busy=false;$('#actions').querySelectorAll('button').forEach(b=>b.disabled=false);}}
function urlOK(value){return /^(https?:\/\/|mailto:|tel:|#)/i.test(value)||(!/^[\w+.-]+:/.test(value)&&!value.startsWith('//'));}
function hydrate(payload){doc=new DOMParser().parseFromString(clean(payload.html),'text/html');roles=payload.roles?.length?payload.roles:['an electronic system designer','R&D in mechatronics','a front-end developer','a product designer'];title=payload.title||'Shahriar Fardin — Portfolio';dirty=false;selected=null;render();}
async function loadContent(publishedOnly=false){
 const {data,error}=await client.from('portfolio_content').select('*');if(error)throw error;
 versions={};data.forEach(row=>versions[row.id]=row.version);
 const row=(!publishedOnly&&data.find(r=>r.id==='draft'))||data.find(r=>r.id==='live');
 if(row)hydrate(row.payload);else{const response=await fetch('index.html',{cache:'no-store'});if(!response.ok)throw Error('Could not load portfolio.');const original=new DOMParser().parseFromString(await response.text(),'text/html');hydrate({html:original.body.innerHTML,title:original.title});}
 status(row?(row.id==='draft'?'Saved draft loaded.':'Published portfolio loaded.'):'Your portfolio is ready to edit.');
}
function payload(){return {html:clean(doc.body.innerHTML),roles:roles.map(s=>s.trim()).filter(Boolean),title};}
async function save(id){
 if(!roles.some(s=>s.trim()))throw Error('Add at least one animated role.');
 if(id==='live')await save('draft');
 const p=payload();if(p.html.length>1500000)throw Error('This draft is too large. Use uploaded images rather than embedded images.');
 const row={id,payload:p,version:(versions[id]||0)+1,updated_at:new Date().toISOString()};
 const query=versions[id]?client.from('portfolio_content').update(row).eq('id',id).eq('version',versions[id]):client.from('portfolio_content').insert(row);
 const {data,error}=await query.select('version');if(error)throw error;if(!data?.length)throw Error('A newer edit exists. Reload the saved version before publishing.');versions[id]=data[0].version;
 dirty=false;status(id==='live'?'Published. Your changes are live now.':'Draft saved. Your public portfolio is unchanged.');
}
async function session(){
 const {data:{user}}=await client.auth.getUser();
 if(!user){$('#login').hidden=false;$('#workspace').hidden=true;$('#actions').hidden=true;status('Sign in to your private editor.');return;}
 const {data,error}=await client.rpc('portfolio_owner_access');
 if(error||data!==true){await client.auth.signOut();$('#login').hidden=false;status('This account does not have permission to edit this portfolio. Confirm the owner email before signing in.');return;}
 $('#login').hidden=true;$('#workspace').hidden=false;$('#actions').hidden=false;await loadContent();
}
$('#email').value=config.ownerEmail;
$('#login-form').onsubmit=e=>{e.preventDefault();task(async()=>{const {error}=await client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;$('#password').value='';await session();});};
$('#signup').onclick=()=>task(async()=>{
 if($('#email').value.trim().toLowerCase()!==config.ownerEmail)throw Error('Use the owner email address.');
 if($('#password').value.length<12)throw Error('Choose a password with at least 12 characters.');
 const {error}=await client.auth.signUp({email:config.ownerEmail,password:$('#password').value,options:{emailRedirectTo:new URL('admin.html',location.href).href}});if(error)throw error;$('#password').value='';status('Check your email and confirm your account, then return here to sign in.');
});
$('#reset').onclick=()=>task(async()=>{const {error}=await client.auth.resetPasswordForEmail(config.ownerEmail,{redirectTo:new URL('admin.html',location.href).href});if(error)throw error;status('Check your email for the password reset link.');});
client.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){setTimeout(()=>{const p=prompt('Choose a new password (at least 12 characters):');if(p&&p.length>=12)task(async()=>{const {error}=await client.auth.updateUser({password:p});if(error)throw error;await session();});},0);}else if(event==='SIGNED_OUT'){$('#workspace').hidden=true;$('#actions').hidden=true;$('#login').hidden=false;doc=null;dirty=false;}});
$('#logout').onclick=()=>task(async()=>{if(dirty&&!confirm('Sign out and discard unsaved changes?'))return;await client.auth.signOut();status('Signed out.');});
$('#save').onclick=()=>task(()=>save('draft'));
$('#publish').onclick=()=>task(()=>save('live'));
$('#restore').onclick=()=>task(async()=>{if(dirty&&!confirm('Discard unsaved changes and load the published version?'))return;await loadContent(true);});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
function sectionEntries(){return [['site','Brand & navigation'],['introduction','Introduction'],['about','About'],['skills','Toolkit'],['projects','Projects heading'],...[...doc.querySelectorAll('.gallery-section')].map(s=>[s.id,s.querySelector('h3')?.childNodes[0]?.textContent.trim()||'Category']),['experience','Experience'],['achievements','Achievements'],['contact','Contact'],['footer','Footer']];}
function sectionRoot(){return current==='site'?doc.querySelector('header'):current==='footer'?doc.querySelector('footer'):doc.getElementById(current);}
function collection(root){if(root.matches('.gallery-section'))return root.querySelector('.gallery-track');return root.querySelector('.experience-grid,.milestones,.skills-grid');}
function render(){
 const nav=$('#sections');nav.replaceChildren();for(const [id,name]of sectionEntries())nav.append(button(name,()=>{current=id;selected=null;render();},id===current?'active':''));
 let root=sectionRoot();if(!root){current='introduction';root=sectionRoot();}
 $('#section-title').textContent=sectionEntries().find(e=>e[0]===current)?.[1]||'Section';
 const list=collection(root),items=$('#items');items.replaceChildren();
 if(list){items.append(button('Section details',()=>{selected=null;render();},!selected?'item active':'item'));[...list.children].forEach((item,index)=>{const name=item.querySelector('h3,h4')?.textContent||item.textContent.trim()||'Item';items.append(button((index+1)+'. '+name.slice(0,35),()=>{selected=item;render();},selected===item?'item active':'item'));});items.append(button('+ Add item',()=>addItem(list)));}
 const fields=$('#fields');fields.replaceChildren();
 if(current==='introduction'&&!selected){const panel=element('div',null,'field-card');panel.append(element('h2','Animated roles'));field(panel,'One role per line',roles.join('\n'),v=>{roles=v.split('\n');},true);fields.append(panel);}
 if(current==='site'){const panel=element('div',null,'field-card');panel.append(element('h2','Page title'));field(panel,'Browser page title',title,v=>title=v);fields.append(panel);}
 const target=selected||root;
 if(selected){const tools=element('div',null,'row-actions');tools.append(button('Move earlier',()=>moveItem(-1)),button('Move later',()=>moveItem(1)),button('Duplicate',()=>addItem(list,selected)),button('Delete item',()=>removeItem(),'danger'));fields.append(tools);}
 if(root.matches('.gallery-section')&&!selected){const controls=element('div',null,'row-actions');controls.append(button('Move category earlier',()=>moveCategory(-1)),button('Move category later',()=>moveCategory(1)),button('Delete category',()=>{if(!confirm('Delete this category and all its projects?'))return;root.querySelectorAll('[data-project]').forEach(c=>doc.getElementById(c.dataset.project)?.remove());doc.querySelector('.project-index a[href="#'+root.id+'"]')?.remove();root.remove();current='projects';changed();render();},'danger'));fields.append(controls);}
 editNode(target,fields,list&&!selected?list:null);
 if(selected?.dataset.project){const template=doc.getElementById(selected.dataset.project);if(template){const panel=element('div',null,'field-card');panel.append(element('h2','Project details'),element('p','These details appear when a visitor opens the project.','hint'));editNode(template.content,panel);const actions=element('div',null,'row-actions');actions.append(button('+ Add paragraph',()=>{template.content.querySelector('.dialog-copy').append(element('p','Add your project details here.'));changed();render();}),button('+ Add image',()=>{const img=doc.createElement('img');img.className='dialog-image';img.src=selected.querySelector('img').getAttribute('src');img.alt='Project image';template.content.append(img);changed();render();}),button('+ Add link',()=>{const a=doc.createElement('a');a.className='button secondary';a.href='https://';a.textContent='View project';template.content.querySelector('.dialog-copy').append(a);changed();render();}));panel.append(actions);fields.append(panel);}}
 const more=element('div',null,'row-actions');more.append(button('+ Add paragraph',()=>{const parent=selected?.querySelector('.experience-copy')||selected?.querySelector('.project-info')||selected||root.querySelector('.about-copy,.contact-grid>div,.hero-content')||root;parent.append(element('p','Add more information here.'));changed();render();}));fields.append(more);
}
function editNode(target,parent,exclude){
 const panel=element('div',null,'field-card');parent.append(panel);
 const walker=doc.createTreeWalker(target,NodeFilter.SHOW_TEXT);let n;let count=0;
 while(n=walker.nextNode()){
  const node=n,el=node.parentElement;if(target.id==='projects'&&el?.closest('.gallery-section'))continue;if(!node.textContent.trim()||!el||el.closest('[aria-hidden="true"],.sr-only,.count,.gallery-controls,.menu-toggle,#year,#changing-role,#copy-status')||(exclude&&exclude.contains(el)))continue;
  const tag=el.tagName.toLowerCase();if(['script','style','template'].includes(tag))continue;
  const label=/^h[1-6]$/.test(tag)?'Heading':tag==='a'?'Link label':tag==='p'?'Text':'Text';
  field(panel,label+(++count>1?' '+count:''),node.textContent.trim(),value=>{node.textContent=(/^\s/.test(node.textContent)?' ':'')+value+(/\s$/.test(node.textContent)?' ':''); if(el.matches('h3')&&el.closest('.gallery-section')){const a=doc.querySelector('.project-index a[href="#'+el.closest('.gallery-section').id+'"]');if(a)a.textContent=value;}},node.textContent.length>85);
 }
 for(const node of target.querySelectorAll('img,a')){
  if(exclude?.contains(node)||(target.id==='projects'&&node.closest('.gallery-section')))continue;
  if(node.tagName==='IMG'){
   const preview=element('img');preview.src=node.getAttribute('src');preview.alt='Current image';panel.append(preview);
   field(panel,'Image description',node.getAttribute('alt'),v=>node.setAttribute('alt',v));
   const input=field(panel,'Image URL',node.getAttribute('src'),v=>{if(urlOK(v)){node.setAttribute('src',v);preview.src=v;}});
   uploadField(panel,'Replace image','image/png,image/jpeg,image/webp,image/gif',async url=>{node.setAttribute('src',url);input.value=url;preview.src=url;});
  }else{
   const href=node.getAttribute('href')||'';
   if(href.startsWith('#'))continue;
   field(panel,'Link destination',href,v=>{if(urlOK(v))node.setAttribute('href',v);});
   if(/résumé|resume/i.test(node.textContent)||/\.pdf(?:$|\?)/i.test(href))uploadField(panel,'Replace résumé PDF','application/pdf',async url=>node.setAttribute('href',url));
  }
 }
}
function uploadField(parent,label,accept,done){const l=element('label',label),input=element('input');input.type='file';input.accept=accept;l.append(input);parent.append(l);input.onchange=()=>task(async()=>{const file=input.files[0];if(!file)return;if(file.size>10485760)throw Error('Choose a file smaller than 10 MB.');const extension=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','application/pdf':'pdf'})[file.type];if(!extension)throw Error('Choose a PNG, JPEG, WebP, GIF, or PDF file.');status('Uploading…');const path=crypto.randomUUID()+'.'+extension;const {error}=await client.storage.from('portfolio-media').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data}=client.storage.from('portfolio-media').getPublicUrl(path);await done(data.publicUrl);changed();status('File uploaded. Save or publish to use it.');});}
function remap(node){const map=new Map();node.querySelectorAll('[id]').forEach(el=>{const old=el.id;el.id='item-'+crypto.randomUUID();map.set(old,el.id);});node.querySelectorAll('*').forEach(el=>{for(const attr of ['aria-labelledby','data-gallery'])if(map.has(el.getAttribute(attr)))el.setAttribute(attr,map.get(el.getAttribute(attr)));});}
function cloneProject(card){const old=doc.getElementById(card.dataset.project);if(old){const copy=old.cloneNode(true);copy.id='project-'+crypto.randomUUID();doc.body.append(copy);card.dataset.project=copy.id;}}
function syncCounts(){doc.querySelectorAll('.gallery-section').forEach(section=>{const count=section.querySelector('.count');if(count)count.textContent=String(section.querySelectorAll('.project-card').length).padStart(2,'0');});}
function addItem(list,source){
 let node=(source||list.lastElementChild)?.cloneNode(true);
 if(!node){if(list.matches('.gallery-track')){node=doc.createElement('button');node.className='project-card';node.innerHTML='<div class="project-image contain"><img src="brand.png" alt="New project"><span class="project-open" aria-hidden="true">↗</span></div><div class="project-info"><p>Project category</p><h4>New project</h4></div>';const t=doc.createElement('template');t.id='project-'+crypto.randomUUID();t.innerHTML='<img class="dialog-image" src="brand.png" alt="New project"><div class="dialog-copy"><p class="eyebrow">Project</p><h2 class="dialog-title">New project</h2><p>Describe your project.</p></div>';doc.body.append(t);node.dataset.project=t.id;}else if(list.matches('.skills-grid')){node=doc.createElement('li');node.innerHTML='<img src="brand.png" alt=""><span>New skill</span>';}else{node=doc.createElement('article');node.className=list.matches('.experience-grid')?'experience-card':'';node.innerHTML='<div class="experience-copy"><h3>New entry</h3><p>Add information here.</p></div>';}}
 else if(node.dataset.project)cloneProject(node);
 remap(node);list.append(node);selected=node;syncCounts();changed();render();
}
function moveItem(direction){const sibling=direction<0?selected.previousElementSibling:selected.nextElementSibling;if(!sibling)return;if(direction<0)sibling.before(selected);else sibling.after(selected);changed();render();}
function removeItem(){if(!confirm('Delete this item from the draft?'))return;if(selected.dataset.project)doc.getElementById(selected.dataset.project)?.remove();selected.remove();selected=null;syncCounts();changed();render();}
function moveCategory(direction){const root=sectionRoot(),all=[...doc.querySelectorAll('.gallery-section')],sibling=all[all.indexOf(root)+direction];if(!sibling)return;if(direction<0)sibling.before(root);else sibling.after(root);const nav=doc.querySelector('.project-index');doc.querySelectorAll('.gallery-section').forEach(s=>{const a=nav.querySelector('a[href="#'+s.id+'"]');if(a)nav.append(a);});changed();render();}
$('#add-category').onclick=()=>{const name=prompt('Category name');if(!name?.trim())return;const id='gallery-'+crypto.randomUUID(),track='track-'+crypto.randomUUID();const section=doc.createElement('section');section.id=id;section.className='gallery-section';section.innerHTML='<div class="gallery-heading"><div><h3></h3><p>Add a category description.</p></div><div class="gallery-controls"><button class="gallery-prev" aria-label="Previous projects">←</button><button class="gallery-next" aria-label="Next projects">→</button></div></div><div class="gallery-track"></div>';section.querySelector('h3').textContent=name;section.querySelector('.gallery-track').id=track;section.querySelectorAll('.gallery-controls button').forEach(b=>b.dataset.gallery=track);doc.getElementById('projects').append(section);const a=doc.createElement('a');a.href='#'+id;a.textContent=name;doc.querySelector('.project-index').append(a);current=id;selected=null;changed();render();};
$('#preview').onclick=()=>{const p=payload(),frame=$('#preview-frame');frame.className=$('#view-mode').value==='phone'?'phone':'';const preview=new DOMParser().parseFromString('<!doctype html><html><head></head><body></body></html>','text/html');const base=preview.createElement('base');base.href=new URL('./',location.href).href;preview.head.append(base);for(const href of ['assets/fonts.css','styles.css']){const link=preview.createElement('link');link.rel='stylesheet';link.href=href;preview.head.append(link);}preview.body.innerHTML=clean(p.html);preview.querySelector('#changing-role').textContent=p.roles[0]||'';frame.srcdoc='<!doctype html>'+preview.documentElement.outerHTML;$('#preview-dialog').showModal();};
$('#close-preview').onclick=()=>$('#preview-dialog').close();
task(session);
