const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),num=v=>parseFloat(String(v).replace(',','.'))||0,fx=(x,d=1)=>isFinite(x)&&x?x.toFixed(d):'–',dt=d=>new Date(d).toLocaleDateString('pt-BR');
const CFG=window.RT_CFG||{},sb=window.supabase&&CFG.url&&CFG.key?window.supabase.createClient(CFG.url,CFG.key):null;
const base=()=>location.origin+location.pathname.replace(/[^/]*$/,'');
const bust=(f,ms=600)=>{let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>f(...a),ms)}};
const TN={rm:'12RM',hop:'Hop tests',sd:'Step down',yb:'Y Balance',om:'Ombro',sk:'Pollock 7 dobras',pe:'Perimetria',sj:'Saltos'};
const IC={clip:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 4.5 1.8 5 5"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',dumb:'<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',chart:'<path d="M5 20v-8M12 20V5M19 20v-12"/>'};
const ic=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2000)}
function copy(t){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Copiado'),()=>prompt('Copie o texto:',t))}
const rowH=([l,v,c])=>`<div class="r ${c||''}"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
const hdr=(t,b)=>`<div class=hd>${b?`<button class=g onclick="${b}" style="width:44px;padding:8px">‹</button>`:''}<h1>${t}</h1></div>`;
const shell=(items,cur,fn,body)=>`<aside class=side><img src="logo.png" class=br alt="ReTreino Studio">${items.map(([k,l,i])=>`<button class="${cur==k?'on':''}" onclick="${fn}('${k}')">${ic(i)}<span>${l}</span></button>`).join('')}</aside><main class=wrap><header class=top><img src="logo.png" alt="ReTreino Studio"></header>${body}</main>`;
function noCfg(){document.body.innerHTML='<main class=wrap style="padding-top:48px"><img src="logo.png" class=lg alt="ReTreino Studio" style="margin-bottom:24px"><div class=card><h2>Falta configurar o Supabase</h2><p class=m>Abra o arquivo config.js, cole a URL e a chave pública do seu projeto e publique de novo. O passo a passo está no LEIAME.md.</p></div></main>'}
async function boot(role){if(!sb){noCfg();return null}
const{data:{session}}=await sb.auth.getSession();if(!session){location.replace('conta.html'+location.search);return null}
const{data:p}=await sb.from('profiles').select('*').eq('id',session.user.id).single();
if(!p){await sb.auth.signOut();location.replace('conta.html');return null}
if(role&&p.role!=role){location.replace(p.role=='treinador'?'treinador.html':'aluno.html');return null}
return{u:session.user,p}}
const out=async()=>{await sb.auth.signOut();location.replace('index.html')};
/* carga de treino */
const age=x=>(Date.now()-new Date(x.created_at))/864e5;
function stats(L){const w=(a,b)=>L.filter(x=>age(x)>=a&&age(x)<b).reduce((s,x)=>s+(x.carga||0),0),ac=w(0,7),cr=w(0,28)/4;return{ac,cr,r:cr?ac/cr:0,n7:L.filter(x=>age(x)<7).length}}
const acwrCls=r=>r?r>1.5?'bad':r>1.3||r<.8?'warn':'ok':'';
function lg(L){const s=stats(L),wk=Array.from({length:6},(_,i)=>L.filter(x=>age(x)>=(5-i)*7&&age(x)<(6-i)*7).reduce((a,x)=>a+(x.carga||0),0)),mx=Math.max(...wk,1);
return`<div class=tiles><div class=tile><b>${s.n7}</b><span>Sessões em 7 dias</span></div><div class=tile><b>${s.ac}</b><span>Carga aguda (UA)</span></div><div class="tile ${acwrCls(s.r)}"><b>${fx(s.r,2)}</b><span>ACWR</span></div></div>
<div class=card><h2>Carga por semana</h2><div class=bars>${wk.map((v,i)=>`<div class=bc><i style="height:${v/mx*100}%"></i><small>${i==5?'Atual':'-'+(5-i)+' sem'}</small></div>`).join('')}</div><p class=m>UA = PSE × minutos. ACWR ideal entre 0,8 e 1,3.</p></div>`
+(L.length?`<h3>Últimas sessões</h3>`+L.slice(0,10).map(x=>`<div class="card row"><div><b>${esc(x.dia)}</b><div class=m>${dt(x.created_at)} · ${x.minutos} min · PSE ${x.pse}</div></div><span class=pill>${x.carga} UA</span></div>`).join(''):'<p class=m>Nenhuma sessão registrada ainda.</p>')}
/* instalar como app */
let dp;addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();dp=ev});
const instBtn=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone?'':'<button class=g onclick="inst()">Instalar como app no celular</button>';
function inst(){if(dp){dp.prompt();dp=null}else alert('iPhone: abra no Safari, toque em Compartilhar e escolha "Adicionar à Tela de Início".\nAndroid: menu ⋮ do Chrome → "Instalar app".')}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
