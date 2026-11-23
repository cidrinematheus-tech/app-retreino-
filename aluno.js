let U,P,PL=null,LG=[],TS=[],V={tab:'inicio'},W=null,IV;
const NAV=[['inicio','Início','home'],['treino','Treino','dumb'],['evolucao','Evolução','chart'],['perfil','Perfil','user']];
async function init(){const r=await boot('aluno');if(!r)return;U=r.u;P=r.p;
const c=sessionStorage.rt_invite||new URLSearchParams(location.search).get('c');
if(c&&!P.coach_id)await vincular(c,true);
await loadAll();render()}
async function vincular(c,quiet){try{const{data,error}=await sb.rpc('vincular',{codigo:c});if(error)throw error;sessionStorage.removeItem('rt_invite');const r=await sb.from('profiles').select('*').eq('id',U.id).single();P=r.data;toast('Vinculado a '+data);if(!quiet){await loadAll();render()}}catch{sessionStorage.removeItem('rt_invite');toast('Código de convite inválido')}}
async function loadAll(){const[p,l,t]=await Promise.all([sb.from('plans').select('*').eq('aluno_id',U.id).maybeSingle(),sb.from('logs').select('*').eq('aluno_id',U.id).order('created_at',{ascending:false}),sb.from('tests').select('*').eq('aluno_id',U.id).order('created_at',{ascending:false})]);PL=p.data&&p.data.dias&&p.data.dias.length?p.data.dias:null;LG=l.data||[];TS=t.data||[]}
const tab=k=>{if(W&&!confirm('Sair do treino em andamento?'))return;if(W){W=null;clearInterval(IV)}V.tab=k;render();scrollTo(0,0)};
const vincBox=()=>`<div class=card><h2>Vincule-se ao seu treinador</h2><p class=m>Abra o link de convite que ele enviou ou digite o código aqui.</p><input id=cod placeholder="Código do treinador" autocapitalize=characters><button class=b onclick="vinc()">Vincular</button></div>`;
const vinc=()=>{const c=$('#cod').value.trim();if(c)vincular(c)};

function inicio(){const s=stats(LG),i=PL?LG.length%PL.length:0,d=PL&&PL[i];
return`<h1>Olá, ${esc(P.name.split(' ')[0])}</h1><p class=m style="margin:6px 0 14px">${P.coach_nome?'Treinador: '+esc(P.coach_nome):'Sem treinador vinculado'}</p>`
+(d?`<div class="card hero"><span class=m>Próximo treino</span><h2 style="font-size:32px">${esc(d.nome)}</h2><p class=m>${d.exs.length} exercícios</p><button class=b onclick="ini(${i})">Iniciar treino</button></div>`:!P.coach_id?vincBox():'<div class=card><h2>Aguardando treino</h2><p class=m>Seu treinador ainda não montou seu treino. Assim que ele salvar, aparece aqui.</p></div>')
+`<div class=tiles><div class=tile><b>${s.n7}</b><span>Sessões em 7 dias</span></div><div class=tile><b>${s.ac}</b><span>Carga aguda (UA)</span></div><div class="tile ${acwrCls(s.r)}"><b>${fx(s.r,2)}</b><span>ACWR</span></div></div>`}

function treino(){if(!PL)return hdr('Treino')+'<p class=m>Seu treinador ainda não enviou um treino.</p>';
if(W){const d=PL[W.i];return`<div class="card hero"><div id=tm>00:00</div><div class=m>${esc(d.nome)}</div><div class=prog><i id=pb></i></div></div>${d.exs.map((x,j)=>`<div class=card><label class=ck><input type=checkbox ${W.k[j]?'checked':''} onchange="W.k[${j}]=this.checked;bar()"> <b>${esc(x.n)}</b></label><div class=m>${esc(x.s)} × ${esc(x.r)} · descanso ${esc(x.d||'—')}</div><label>Carga usada (kg)<input inputmode="decimal" value="${esc(W.c[j]??x.c??'')}" oninput="W.c[${j}]=this.value"></label></div>`).join('')}<button class=b onclick="fin()">Finalizar treino</button><div style="height:10px"></div><button class=g onclick="W=null;clearInterval(IV);render()">Cancelar</button>`}
return hdr('Treino')+PL.map((d,i)=>`<div class=card><h2>${esc(d.nome)}</h2><div class=m>${d.exs.map(x=>esc(x.n)).join(' · ')}</div><button class=b onclick="ini(${i})">Iniciar treino</button></div>`).join('')}
function bar(){const d=PL[W.i],k=d.exs.filter((_,j)=>W.k[j]).length;$('#pb').style.width=(k/Math.max(d.exs.length,1)*100)+'%'}
function ini(i){W={i,t0:Date.now(),k:{},c:{}};V.tab='treino';clearInterval(IV);IV=setInterval(()=>{const el=$('#tm');if(!el)return;const s=((Date.now()-W.t0)/1000)|0;el.textContent=String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},1000);render()}
async function fin(){const m=Math.max(1,Math.round((Date.now()-W.t0)/60000)),p=num(prompt('Quão pesado foi o treino? PSE de 0 a 10','6'));if(!p)return;const d=PL[W.i],{error}=await sb.from('logs').insert({aluno_id:U.id,dia:d.nome,minutos:m,pse:p,carga:Math.round(p*m),detalhes:d.exs.map((x,j)=>[x.n,W.c[j]??x.c??'',!!W.k[j]])});if(error)return toast('Erro ao registrar');W=null;clearInterval(IV);await loadAll();toast('Treino registrado');V.tab='evolucao';render()}
const evolucao=()=>`${hdr('Evolução')}${lg(LG)}<h3>Avaliações</h3>${TS.map(x=>`<div class=card><h2>${TN[x.tipo]||esc(x.tipo)}${x.x?' · '+esc(x.x):''}</h2><div class=m>${dt(x.created_at)}</div>${x.resultado.map(rowH).join('')}</div>`).join('')||'<p class=m>Nenhuma avaliação registrada ainda.</p>'}`;
const perfil=()=>`${hdr(esc(P.name))}<div class=card><div class=r><span>Treinador</span><b>${esc(P.coach_nome||'—')}</b></div><div class=r><span>Aluno desde</span><b>${dt(P.created_at)}</b></div></div>${P.coach_id?'':vincBox()}<div class=card>${instBtn()}<button class=g onclick="out()">Sair</button></div>`;
function render(){const h=({inicio,treino,evolucao,perfil}[V.tab]||inicio)();$('#app').innerHTML=shell(NAV,V.tab,'tab',h);if(W&&V.tab=='treino')bar()}
init();
