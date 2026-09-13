/* Only public content is loaded here. Authentication is confined to admin.html. */
window.PortfolioContent={
 clean(html){return DOMPurify.sanitize(html,{USE_PROFILES:{html:true},ADD_TAGS:['template'],FORBID_TAGS:['script','style','iframe','object','embed','form','input','textarea','select','base','link','meta'],FORBID_ATTR:['style','srcdoc','contenteditable'],ALLOW_DATA_ATTR:true});},
 apply(payload){
  if(!payload||typeof payload.html!=='string')return;
  const fragment=document.createElement('template');fragment.innerHTML=this.clean(payload.html);
  if(!fragment.content.querySelector('#introduction')||!fragment.content.querySelector('#project-dialog'))return;
  document.body.replaceChildren(fragment.content);
  window.portfolioRoles=Array.isArray(payload.roles)?payload.roles.filter(x=>typeof x==='string'&&x.trim()).slice(0,30):undefined;
  if(payload.title)document.title=String(payload.title);
  const logo=document.querySelector('.brand img');if(logo)document.querySelector('link[rel="icon"]').href=logo.src;
 }
};
(async()=>{
 try{
  const c=window.PORTFOLIO_CONFIG;
  const r=await fetch(c.url+'/rest/v1/portfolio_content?id=eq.live&select=payload',{headers:{apikey:c.key},signal:AbortSignal.timeout(4000),cache:'no-store'});
  if(r.ok){const rows=await r.json();if(rows[0])PortfolioContent.apply(rows[0].payload);}
 }catch(e){console.info('Using the built-in portfolio while live content is unavailable.');}
 const script=document.createElement('script');script.src='script.js?v=editor-1';document.head.append(script);
})();
