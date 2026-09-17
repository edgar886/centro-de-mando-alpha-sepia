"use strict";

/* ═══════════ base ═══════════ */
const SB_URL="https://jhruvbjybuwwcjbtandn.supabase.co";
const SB_KEY="sb_publishable_LFiNf63DPxx4cIeAg_CRFg_5cvufOpI";
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=v=>{v=Math.round(+v||0);return (v<0?"−":"")+"$"+Math.abs(v).toLocaleString("en-US");};
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MESL=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const mesLbl=k=>{const [y,m]=k.split("-");return MES[+m-1]+" "+y.slice(2);};
const mesLargo=k=>{const [y,m]=k.split("-");return MESL[+m-1]+" "+y;};
const fdate=s=>{if(!s)return "—";const d=new Date(s+(s.length===10?"T12:00:00":""));return isNaN(d)?"—":d.getDate()+" "+MES[d.getMonth()];};
const hoyKey=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");};
const addMes=(k,n)=>{const [y,m]=k.split("-").map(Number);const d=new Date(y,m-1+n,1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const dims=(svg,H)=>{const W=(svg.getBoundingClientRect().width||1000)<560?620:1000;svg.setAttribute("viewBox","0 0 "+W+" "+H);return W;};
const FS=()=>window.innerWidth<560?"15":"13";
const el=(t,a)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const tt=$("tt");
function hov(node,text){node.addEventListener("pointerenter",e=>{tt.textContent=text;tt.style.display="block";});
  node.addEventListener("pointermove",e=>{tt.style.left=e.clientX+"px";tt.style.top=e.clientY+"px";});
  node.addEventListener("pointerleave",()=>{tt.style.display="none";});}
const slug=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}

/* fecha */
(function(){const d=new Date();
  $("fecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});})();

/* ═══════════ estado ═══════════ */
const D={board:null,cobros:[],plantilla:[],gastos:[],regalias:{},plat:null,ment:[],ventas:[],metricas:[],
  posts:[],visitas:[],lecturas:[],campanas:[],gastosMes:[],plan:[],cfg:{tc:17},mes:hoyKey(),amb:"bip",salud:[],ayunos:[]};

/* ═══════════ acceso ═══════════ */
async function arranque(){
  const {data:{session}}=await sb.auth.getSession();
  if(session&&session.user)entrar(session.user); else mostrarLogin();
  sb.auth.onAuthStateChange((ev,s)=>{if(ev==="SIGNED_OUT")mostrarLogin();});
}
function mostrarLogin(){$("login").classList.remove("hidden");$("app").classList.add("hidden");}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const b=$("loginBtn");b.disabled=true;$("loginMsg").innerHTML="";
  const {data,error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("pass").value});
  b.disabled=false;
  if(error){$("loginMsg").innerHTML='<div class="msg">No entró: '+esc(error.message)+'</div>';return;}
  $("pass").value="";entrar(data.user);
});
$("logout").addEventListener("click",async()=>{await sb.auth.signOut();mostrarLogin();});
async function entrar(user){
  if(String(user.email||"").toLowerCase()!=="edgar@booneholdings.com"){
    $("loginMsg").innerHTML='<div class="msg">Esta cuenta no tiene acceso al Centro de Mando.</div>';
    await sb.auth.signOut();return;
  }
  $("login").classList.add("hidden");$("app").classList.remove("hidden");
  /* pinta al instante con la ultima foto guardada en el telefono y luego refresca */
  if(hidratarCache()){ try{renderTodo();}catch(e){console.warn("cache",e);} $("ultima").textContent="Actualizando…"; }
  await cargarTodo();
}
const CACHE_K="cosDatos", CACHE_CAMPOS=["board","plantilla","gastos","regalias","plat","platAt","ment","ventas","metricas","posts","visitas","lecturas","campanas","plan","cfg","qbo","salud","ayunos","lecSalud","clari","clariCom","cobros","gastosMes","mes","banco","movs","ais"];
function guardarCache(){ try{ const o={t:Date.now()}; for(const k of CACHE_CAMPOS) o[k]=D[k]; localStorage.setItem(CACHE_K,JSON.stringify(o)); }catch(e){} }
function hidratarCache(){
  try{ const o=JSON.parse(localStorage.getItem(CACHE_K)||"null"); if(!o||!o.board) return false;
    if(o.mes!==hoyKey()) return false;   /* cambio el mes: mejor cargar limpio */
    for(const k of CACHE_CAMPOS) if(o[k]!==undefined) D[k]=o[k];
    return true; }catch(e){ return false; }
}

/* ═══════════ carga ═══════════ */
async function q(p){const {data,error}=await p;if(error){console.warn(error);return null;}return data;}
async function cargarTodo(){
  const desde60=new Date(Date.now()-60*864e5).toISOString().slice(0,10);
  const desde90=new Date(Date.now()-90*864e5).toISOString();
  const [board,plantilla,gastos,regalias,plat,ment,ventas,metricas,posts,visitas,lecturas,campanas,plan,cfg,qbo,salud,ayunos,lecSalud,clari,clariCom,banco,movs,ais]=await Promise.all([

    q(sb.from("cos_dashboard").select("data").eq("id","board").maybeSingle()),
    q(sb.from("cos_cobros_plantilla").select("*").order("orden")),
    q(sb.from("cos_gastos").select("*").order("orden")),
    q(sb.from("cos_regalias").select("*").order("mes")),
    q(sb.from("cos_plataforma").select("data,updated_at").eq("id","hoy").maybeSingle()),
    q(sb.from("cos_mentoria").select("data").eq("id","hoy").maybeSingle()),
    q(sb.from("ventas_libros").select("fuente,periodo,titulo,serie,ebook,paperback,hardcover,unidades,actualizado_at")),
    q(sb.from("metricas_diarias").select("*").order("fecha",{ascending:false}).limit(120)),
    q(sb.from("posts_instagram").select("*").gte("publicado_at",desde90).order("publicado_at",{ascending:false})),
    q(sb.from("visitas_diarias").select("*").gte("fecha",desde60).order("fecha")),
    q(sb.from("lecturas").select("*").order("fecha",{ascending:false}).limit(12)),
    q(sb.from("campanas").select("campana,fuente,medio,libro,creada_at").order("creada_at",{ascending:false}).limit(30)),
    q(sb.from("cos_planeacion").select("*").order("orden")),
    q(sb.from("cos_dashboard").select("data").eq("id","config").maybeSingle()),
    q(sb.from("cos_dashboard").select("data,updated_at").eq("id","qbo").maybeSingle()),
    q(sb.from("salud_diaria").select("*").order("fecha",{ascending:false}).limit(120)),
    q(sb.from("ayunos").select("*").order("inicio",{ascending:false}).limit(60)),
    q(sb.from("lecturas_salud").select("*").order("fecha",{ascending:false}).limit(8)),
    q(sb.from("clari_followups").select("*").order("asked",{ascending:false})),
    q(sb.from("clari_comentarios").select("*").order("created_at",{ascending:false})),
    q(sb.from("cos_dashboard").select("data").eq("id","banco").maybeSingle()),
    q(sb.from("banco_movimientos").select("*").gte("fecha",desde60).order("fecha",{ascending:false})),
    q(sb.from("cos_dashboard").select("data").eq("id","ais").maybeSingle())
  ]);
  D.board=(board&&board.data)||{};
  D.plantilla=plantilla||[];D.gastos=gastos||[];
  D.regalias={};(regalias||[]).forEach(r=>D.regalias[r.mes]=+r.monto);
  D.plat=plat?plat.data:null;D.platAt=plat?plat.updated_at:null;
  D.ment=(ment&&ment.data)||[];
  D.ventas=ventas||[];D.metricas=metricas||[];D.posts=posts||[];D.visitas=visitas||[];
  D.lecturas=lecturas||[];D.campanas=campanas||[];D.plan=plan||[];D.cfg=(cfg&&cfg.data)||{tc:17};D.qbo=(qbo&&qbo.data)||null;D.salud=(salud||[]).slice().reverse();D.ayunos=ayunos||[];D.lecSalud=lecSalud||[];D.clari=clari||[];D.clariCom=clariCom||[];D.banco=(banco&&banco.data)||null;D.movs=movs||[];D.ais=(ais&&ais.data)||null;
  await cargarMes();
  renderTodo(); guardarCache();
  $("ultima").textContent="Datos leídos "+new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
}
async function cargarMes(){
  let rows=await q(sb.from("cos_cobros").select("*").eq("mes",D.mes));
  /* completa el mes desde la plantilla: lo que falte (solo lo activo) */
  const nuevos=D.plantilla.filter(p=>p.activo!==false&&!(rows||[]).some(x=>x.id===p.id)).map(p=>({mes:D.mes,id:p.id,nombre:p.nombre,monto:p.monto,
    grupo:p.grupo,dia:p.dia,tarde:!!p.tarde,ambito:p.ambito||"bip",estimado:!!p.estimado}));
  if(nuevos.length){await q(sb.from("cos_cobros").upsert(nuevos,{onConflict:"mes,id",ignoreDuplicates:true}));
    rows=await q(sb.from("cos_cobros").select("*").eq("mes",D.mes));}
  D.cobros=(rows||[]).sort((a,b)=>(ordenDe(a.id)-ordenDe(b.id)));
  let gm=await q(sb.from("cos_gastos_mes").select("*").eq("mes",D.mes));
  const faltan=D.gastos.filter(g=>g.activo!==false&&!(gm||[]).some(x=>x.id===g.id)).map(g=>({mes:D.mes,id:g.id,nombre:g.nombre,monto:g.monto,ambito:g.ambito||"bip"}));
  if(faltan.length){await q(sb.from("cos_gastos_mes").upsert(faltan,{onConflict:"mes,id",ignoreDuplicates:true}));gm=await q(sb.from("cos_gastos_mes").select("*").eq("mes",D.mes));}
  D.gastosMes=(gm||[]).sort((a,b)=>(ordenGasto(a.id)-ordenGasto(b.id)));
}
function ordenGasto(id){const g=D.gastos.find(x=>x.id===id);return g?g.orden:999;}
function ordenDe(id){const p=D.plantilla.find(x=>x.id===id);return p?p.orden:999;}
function renderTodo(){renderHoy();renderDinero();renderPlanear();renderSenal();renderLibros();renderPlataforma();renderSalud();renderClari();renderAis();}
/* división de trabajo (AIs): copia de la tabla de Notion, cos_dashboard/ais */
function renderAis(){
  const box=$("aisTabla"); if(!box) return;
  const A=D.ais, F=(A&&A.filas)||[];
  if(A&&A.notion_url) $("aisLink").href=A.notion_url;
  $("aisSrc").textContent=A?((A.fuente||"Notion")+(A.fecha?" · "+fdate(A.fecha.slice(0,10)):"")):"Todavía no llega la tabla";
  if(!F.length){box.innerHTML='<div class="note" style="margin:6px 0">Sin filas.</div>';return;}
  box.innerHTML='<div style="overflow-x:auto"><table class="tbl ais"><tr><th>Quién</th><th>Hace</th><th>No hace</th></tr>'
    +F.map(f=>"<tr><td class='q'>"+esc(f.quien||"")+"</td><td>"+esc(f.hace||"")+(f.no_hace?"<div class='nm'>"+esc(f.no_hace)+"</div>":"")+"</td><td class='n'>"+esc(f.no_hace||"")+"</td></tr>").join("")+"</table></div>";
}

/* ═══════════ navegación ═══════════ */
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>verVista(b.dataset.v)));
function verVista(v){
  document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.v===v)));
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("on",s.dataset.v===v));
  try{history.replaceState(null,"","#"+v);}catch(e){}
  window.scrollTo({top:0});
  /* las gráficas se miden al mostrarse */
  if(D.board){if(v==="plataforma")renderPlataforma();else if(v==="libros")renderLibros();else if(v==="senal")renderPV();else if(v==="salud")renderSalud();else if(v==="clari")renderClari();}
}
document.querySelectorAll(".subtabs button").forEach(b=>b.addEventListener("click",()=>{
  const vw=b.closest(".view")||document;
  vw.querySelectorAll(".subtabs button").forEach(x=>x.setAttribute("aria-selected",String(x===b)));
  vw.querySelectorAll(".sub[data-sub]").forEach(x=>x.classList.toggle("on",x.dataset.sub===b.dataset.sub));
  if(b.dataset.amb&&b.dataset.amb!==D.amb){D.amb=b.dataset.amb;renderDinero();}
}));
const AMB={bip:"BIP · empresa",personal:"Personal",mexico:"México"};

/* ═══════════ dinero ═══════════ */
const cobrosAmb=(a=D.amb)=>D.cobros.filter(c=>(c.ambito||"bip")===a);
const gastosAmb=(a=D.amb)=>D.gastosMes.filter(g=>(g.ambito||"bip")===a);
const plantillaAmb=(a=D.amb)=>D.plantilla.filter(p=>(p.ambito||"bip")===a);
function totales(a=D.amb){
  const cs=cobrosAmb(a),gs=gastosAmb(a);
  const tin=cs.reduce((t,c)=>t+ +c.monto,0),tout=gs.reduce((t,g)=>t+ +g.monto,0);
  const falta=cs.filter(c=>!c.cobrado).reduce((t,c)=>t+ +c.monto,0);
  const pend=gs.filter(g=>!g.pagado).reduce((t,g)=>t+ +g.monto,0);
  const cj=(a==="bip"||a==="personal")?cajaDe(a):null;
  return{tin,tout,falta,pend,caja:cj,proy:(cj||0)+falta-pend,neto:tin-tout,conCaja:cj!=null};
}
function filaMes(o,tipo){
  const esC=tipo==="cobro",hecho=esC?o.cobrado:o.pagado;
  const r=document.createElement("div");r.className="row"+(hecho?(esC?" done":" pag"):"");
  const cb=document.createElement("input");cb.type="checkbox";cb.checked=!!hecho;cb.setAttribute(esC?"data-cobro":"data-gasto",o.id);cb.setAttribute("aria-label",(o.nombre||"")+(esC?" cobrado":" pagado"));
  const nm=document.createElement("input");nm.className="in bare";nm.value=o.nombre||"";nm.placeholder=esC?"Quién paga":"Qué se paga";nm.style.flex="1 1 auto";nm.style.minWidth="0";
  const am=document.createElement("input");am.className="in bare num";am.value=o.monto==null?"":Math.round(+o.monto).toLocaleString("en-US");am.inputMode="decimal";am.style.flex="0 0 96px";am.setAttribute("aria-label","Monto");
  const guardar=async()=>{
    o.nombre=nm.value;o.monto=parseFloat(String(am.value).replace(/[^0-9.\-]/g,""))||0;
    if(esC){await q(sb.from("cos_cobros").update({nombre:o.nombre,monto:o.monto}).match({mes:D.mes,id:o.id}));
      const p=D.plantilla.find(x=>x.id===o.id);if(p){p.nombre=o.nombre;p.monto=o.monto;await q(sb.from("cos_cobros_plantilla").update({nombre:o.nombre,monto:o.monto}).eq("id",o.id));}
      /* meses futuros aún no cobrados siguen la plantilla */
      await q(sb.from("cos_cobros").update({nombre:o.nombre,monto:o.monto}).eq("id",o.id).eq("cobrado",false).gt("mes",D.mes));}
    else{await q(sb.from("cos_gastos_mes").update({nombre:o.nombre,monto:o.monto}).match({mes:D.mes,id:o.id}));
      const g=D.gastos.find(x=>x.id===o.id);if(g){g.nombre=o.nombre;g.monto=o.monto;await q(sb.from("cos_gastos").update({nombre:o.nombre,monto:o.monto}).eq("id",o.id));}
      await q(sb.from("cos_gastos_mes").update({nombre:o.nombre,monto:o.monto}).eq("id",o.id).eq("pagado",false).gt("mes",D.mes));}
  };
  const guardarYPintar=async()=>{await guardar();renderDinero();};
  const aplicar=()=>{o.nombre=nm.value;o.monto=parseFloat(String(am.value).replace(/[^0-9.\-]/g,""))||0;};
  escribible(nm,aplicar,guardar);escribible(am,aplicar,guardar);
  nm.addEventListener("change",guardarYPintar);am.addEventListener("change",guardarYPintar);
  r.appendChild(cb);r.appendChild(nm);
  if(esC){const est=document.createElement("span");est.className="est"+(o.estimado?"":" off");est.textContent="~";est.title=o.estimado?"Estimado — clic para fijarlo":"Fijo — clic para marcarlo estimado";
    est.addEventListener("click",async()=>{o.estimado=!o.estimado;await q(sb.from("cos_cobros").update({estimado:o.estimado}).match({mes:D.mes,id:o.id}));
      const p=D.plantilla.find(x=>x.id===o.id);if(p){p.estimado=o.estimado;await q(sb.from("cos_cobros_plantilla").update({estimado:o.estimado}).eq("id",o.id));}renderDinero();});
    r.appendChild(est);
    if(o.tarde){const dt=document.createElement("span");dt.className="dt";dt.textContent="paga el "+o.dia;r.appendChild(dt);}}
  r.appendChild(am);
  const x=document.createElement("button");x.className="btn ghost";x.textContent="×";x.title="Quitar de todos los meses";x.style.padding="4px 8px";
  x.addEventListener("click",async()=>{if(!confirm("¿Quitar «"+(o.nombre||"")+"» de este mes y los que vienen?"))return;
    if(esC){await q(sb.from("cos_cobros").delete().eq("id",o.id).eq("cobrado",false).gte("mes",D.mes));await q(sb.from("cos_cobros_plantilla").delete().eq("id",o.id));
      D.plantilla=D.plantilla.filter(p=>p.id!==o.id);D.cobros=D.cobros.filter(c=>c.id!==o.id);}
    else{await q(sb.from("cos_gastos_mes").delete().eq("id",o.id).eq("pagado",false).gte("mes",D.mes));await q(sb.from("cos_gastos").delete().eq("id",o.id));
      D.gastos=D.gastos.filter(g=>g.id!==o.id);D.gastosMes=D.gastosMes.filter(g=>g.id!==o.id);}
    renderDinero();});
  r.appendChild(x);
  return r;
}
function renderDinero(){
  const cs=cobrosAmb(),gs=gastosAmb(),T=totales();
  $("mesTitulo").textContent=mesLargo(D.mes).replace(/^./,c=>c.toUpperCase());
  $("mesSrc").textContent=(AMB[D.amb]||D.amb)+" · palomea lo que ya entró y lo que ya pagaste";
  $("qboPanel").classList.toggle("hidden",D.amb!=="bip");
  $("bancoPanel").classList.toggle("hidden",D.amb==="mexico");
  const bi=$("mesIn");bi.innerHTML="";cs.forEach(c=>bi.appendChild(filaMes(c,"cobro")));
  if(!cs.length)bi.innerHTML='<div class="note" style="margin:6px 0">Nada planeado. Agrega un cobro.</div>';
  const bo=$("mesOut");bo.innerHTML="";gs.forEach(g=>bo.appendChild(filaMes(g,"gasto")));
  if(!gs.length)bo.innerHTML='<div class="note" style="margin:6px 0">Nada programado. Agrega un gasto.</div>';
  const rec=T.tin-T.falta,pag=T.tout-T.pend;
  $("mesInTot").textContent=money(T.tin);$("mesOutTot").textContent=money(T.tout);
  $("mesInTotal").innerHTML="<span>Ya entró <b>"+money(rec)+"</b></span><span>Por entrar <b>"+money(T.falta)+"</b></span>";
  $("mesOutTotal").innerHTML="<span>Ya pagado <b>"+money(pag)+"</b></span><span>Por pagar <b>"+money(T.pend)+"</b></span>";
  $("dCaja").textContent=T.conCaja?money(T.caja):"—";$("dCajaN").innerHTML=T.conCaja?cajaNota(D.amb):"sin cuenta conectada";
  $("dRecibir").textContent=money(T.falta);$("dRecibirN").textContent="de "+money(T.tin)+" planeados";
  $("dPend").textContent=money(T.pend);$("dPendN").textContent="de "+money(T.tout)+" del mes";
  const dp=$("dProy");dp.textContent=money(T.proy);dp.className="v "+(T.proy>=0?"good":"bad");$("dProyN").textContent=(T.conCaja?"caja + por entrar − por pagar · ":"por entrar − por pagar · ")+mesLargo(D.mes);
  let t=(T.conCaja?"<b>Tienes "+money(T.caja)+" en caja.</b> ":"")+"Faltan por entrar "+money(T.falta)+" y por pagar "+money(T.pend)+": "+(T.conCaja?"cierras el mes con":"te quedan")+" <b>"+money(T.proy)+"</b>"+(T.proy<0?" — no alcanza.":".");
  if(cs.some(c=>c.estimado&&!c.cobrado))t+=" Lo marcado con ~ es estimado: puede variar.";
  if(D.amb==="bip"&&cs.some(c=>c.tarde))t+=" Kenia paga el 27: sus "+money(cs.find(c=>c.tarde).monto)+" son del cobro del mes anterior, por eso cuentan aquí.";
  $("mesRead").innerHTML=t;
  renderQbo();renderBanco();renderHoyKpis();
}
document.addEventListener("change",async e=>{
  const gid=e.target.getAttribute&&e.target.getAttribute("data-gasto");
  if(gid){const g=D.gastosMes.find(x=>x.id===gid&&x.mes===D.mes);if(!g)return;g.pagado=e.target.checked;
    await q(sb.from("cos_gastos_mes").update({pagado:g.pagado,pagado_at:g.pagado?new Date().toISOString():null}).match({mes:D.mes,id:gid}));renderDinero();return;}
  const id=e.target.getAttribute&&e.target.getAttribute("data-cobro");if(!id)return;
  const c=D.cobros.find(x=>x.id===id&&x.mes===D.mes);if(!c)return;
  c.cobrado=e.target.checked;
  await q(sb.from("cos_cobros").update({cobrado:c.cobrado,cobrado_at:c.cobrado?new Date().toISOString():null}).match({mes:D.mes,id}));
  renderDinero();
});
$("mesPrev").addEventListener("click",async()=>{D.mes=addMes(D.mes,-1);await cargarMes();renderDinero();});
$("mesNext").addEventListener("click",async()=>{D.mes=addMes(D.mes,1);await cargarMes();renderDinero();});

/* editores (Expense Planning los usa) */
function filaEd(o,campos,onSave,onDel){
  const r=document.createElement("div");r.className="row ed";
  campos.forEach(f=>{
    if(f.bool){const l=document.createElement("label");l.className="small";l.style.flex="0 0 auto";l.title=f.ph||f.k;
      const c=document.createElement("input");c.type="checkbox";c.checked=!!o[f.k];c.style.accentColor=css("--gold-deep");
      c.addEventListener("change",()=>{o[f.k]=c.checked;onSave(o);});l.appendChild(c);l.appendChild(document.createTextNode(" "+(f.ph||f.k)));r.appendChild(l);return;}
    const i=document.createElement("input");i.className="in bare"+(f.num?" num":"");i.value=o[f.k]==null?"":o[f.k];
    i.placeholder=f.ph||"";i.style.flex=f.w||"1";i.setAttribute("aria-label",f.ph||f.k);
    if(f.num)i.inputMode="decimal";if(f.date)i.type="date";
    const aplicaF=()=>{o[f.k]=f.num?(parseFloat(String(i.value).replace(/[^0-9.\-]/g,""))||0):(i.value||null);};
    if(!f.date&&!f.bool)escribible(i,aplicaF,()=>onSave(o,true));
    i.addEventListener("change",()=>{aplicaF();onSave(o);});
    r.appendChild(i);
  });
  const x=document.createElement("button");x.className="btn ghost";x.textContent="×";x.title="Quitar";x.setAttribute("aria-label","Quitar");
  x.addEventListener("click",()=>{if(confirm("¿Quitar «"+(o.nombre||"")+"»?"))onDel(o);});
  r.appendChild(x);return r;
}
$("addCobro").addEventListener("click",async()=>{
  const id=(D.amb==="bip"?"":D.amb.slice(0,2)+"-")+"c-"+Date.now().toString(36);
  const o={id,nombre:"",monto:0,grupo:D.amb==="bip"?"Mentorías":AMB[D.amb]||D.amb,ambito:D.amb,activo:true,orden:900,estimado:false};
  await q(sb.from("cos_cobros_plantilla").insert(o));D.plantilla.push(o);
  const c={mes:D.mes,id,nombre:"",monto:0,grupo:o.grupo,ambito:D.amb,cobrado:false,estimado:false};
  await q(sb.from("cos_cobros").insert(c));D.cobros.push(c);
  renderDinero();const inputs=$("mesIn").querySelectorAll("input.in");if(inputs.length)inputs[inputs.length-2].focus();
});
$("addGasto").addEventListener("click",async()=>{
  const id=(D.amb==="bip"?"":D.amb.slice(0,2)+"-")+"g-"+Date.now().toString(36);
  const o={id,nombre:"",monto:0,ambito:D.amb,frecuencia:"mensual",activo:true,orden:900};
  await q(sb.from("cos_gastos").insert(o));D.gastos.push(o);
  const g={mes:D.mes,id,nombre:"",monto:0,ambito:D.amb,pagado:false};
  await q(sb.from("cos_gastos_mes").insert(g));D.gastosMes.push(g);
  renderDinero();const inputs=$("mesOut").querySelectorAll("input.in");if(inputs.length)inputs[inputs.length-2].focus();
});

/* caja + proyección */
const cajaParte=k=>{const c=D.qbo?+D.qbo[k]:0;return isFinite(c)?c:0;};
/* caja real: saldo del banco via SimpleFIN (cos_dashboard/banco). Si no hay foto, BIP cae a QuickBooks. */
const cajaDe=a=>{const b=D.banco&&D.banco.caja; if(b&&isFinite(+b[a])) return +b[a]; if(a==="bip") return cajaParte("chequera")+cajaParte("ahorros"); return null;};
const caja=()=>cajaDe("bip");
/* debajo del total: chequera y ahorros por separado, cada uno en su renglon */
const cajaNota=a=>{const b=D.banco; if(b&&b.caja&&isFinite(+b.caja[a])){const det=(b.detalle&&b.detalle[a])||[];
    const tipo=n=>/saving/i.test(n)?"Ahorros":"Chequera";
    return det.map(x=>'<span class="cj"><span>'+tipo(x.nombre)+'</span><b>'+money(x.saldo)+'</b></span>').join("")
      +'<span class="cj src">Chase · '+fdate(b.fecha)+'</span>';}
  return esc(D.qbo?"QuickBooks · "+fdate(D.qbo.fecha):"sin foto de QuickBooks");};
let avisoT=null;
function aviso(txt,mal){
  const el=document.getElementById("saved");if(!el)return;
  el.textContent=txt;el.classList.toggle("err",!!mal);el.classList.add("on");
  clearTimeout(avisoT);avisoT=setTimeout(()=>el.classList.remove("on"),mal?4000:1300);
}
/* Los guardados del tablero van EN FILA. Antes se disparaban en paralelo
   (el debounce de "input" y el "change" al salir del campo, o dos clics
   seguidos): dos upsert al mismo renglon se pisaban y uno regresaba error,
   aunque el dato si acabara guardado. De ahi salia el "No se guardó" falso.
   Ademas: un reintento, refresco de sesion si el token vencio, y el motivo
   real en el aviso cuando de verdad no se pudo. */
let filaBoard=Promise.resolve();
const dormir=ms=>new Promise(r=>setTimeout(r,ms));
function subirBoard(){
  return sb.from("cos_dashboard").upsert({id:"board",data:D.board,updated_at:new Date().toISOString()});
}
function guardarBoard(silencio){
  D.board.updatedAt=Date.now();
  const t=filaBoard.then(async()=>{
    let {error}=await subirBoard();
    if(error){
      console.warn("board, primer intento:",error);
      const m=(error.message||"")+" "+(error.code||"");
      if(/jwt|token|expired|401/i.test(m)){ try{ await sb.auth.refreshSession(); }catch(e){} }
      await dormir(700);
      ({error}=await subirBoard());
    }
    if(!silencio) aviso(error?("No se guardó · "+(error.message||"sin conexión")):"Guardado", !!error);
    if(error) console.warn("board, no se pudo:",error);
    return error?null:true;
  });
  filaBoard=t.catch(()=>{});
  return t;
}
/* guarda mientras escribe: el evento "change" solo llega al salir del campo,
   y si cierras la pestaña antes, lo escrito se perdia */
const guardarBoardPronto=debounce(()=>guardarBoard(),900);

/* ── captura segura ──────────────────────────────────────────────
   El evento "change" solo llega cuando el campo pierde el foco. Si
   cierras la pestaña o el telefono se duerme antes, lo escrito se
   pierde. Todo campo de texto del tablero pasa por aqui: guarda
   mientras escribes (sin redibujar, para no perder el cursor) y
   ademas vacia lo pendiente si la pagina se va a cerrar. */
const PEND=new Set();
function escribible(input, aplicar, persistir){
  const lento=debounce(async()=>{
    if(!PEND.has(tarea))return;
    PEND.delete(tarea); aplicar(); await persistir(); aviso("Guardado");
  },900);
  const tarea=async()=>{ PEND.delete(tarea); aplicar(); await persistir(); };
  input.addEventListener("input",()=>{ PEND.add(tarea); lento(); });
  return tarea;
}
async function vaciarPendientes(){
  if(!PEND.size)return;
  const t=[...PEND];PEND.clear();
  for(const f of t){try{await f();}catch(e){}}
}
document.addEventListener("visibilitychange",()=>{if(document.hidden)vaciarPendientes();});
window.addEventListener("pagehide",vaciarPendientes);
window.addEventListener("beforeunload",vaciarPendientes);
function renderQbo(){
  const Q=D.qbo;
  if(!Q){$("qboSrc").textContent="Todavía no hay foto de QuickBooks";$("qboIn").innerHTML=$("qboOut").innerHTML='<div class="note" style="margin:6px 0">La tarea diaria la trae mañana a las 7.</div>';$("qboRead").textContent="";return;}
  $("qboSrc").textContent="Foto del "+fdate(Q.fecha)+" · lo que ya entró y ya salió en "+mesLargo(Q.mes||D.mes);
  const tE=(Q.entro||[]).reduce((t,x)=>t+ +x.monto,0),tS=(Q.salio||[]).reduce((t,x)=>t+ +x.monto,0);
  $("qboInTot").textContent=money(tE);$("qboOutTot").textContent=money(tS);
  $("qboIn").innerHTML=(Q.entro||[]).length?Q.entro.map(x=>'<div class="row"><span class="nm">'+esc(x.quien||"")+'</span><span class="dt">'+fdate(x.fecha)+'</span><span class="amt">'+money(x.monto)+'</span></div>').join(""):'<div class="note" style="margin:6px 0">Nada registrado aún este mes.</div>';
  $("qboOut").innerHTML=(Q.salio||[]).length?Q.salio.map(x=>'<div class="row"><span class="nm">'+esc(x.que||"")+'</span><span class="dt">'+fdate(x.fecha)+'</span><span class="amt">'+money(x.monto)+'</span></div>').join(""):'<div class="note" style="margin:6px 0">Nada registrado aún este mes.</div>';
  const tj=(Q.tarjetas||[]).filter(t=>+t.saldo>0);
  $("qboTarj").innerHTML=tj.length?tj.map(t=>esc(t.nombre)+" "+money(t.saldo)).join("<br>"):"sin saldo";
  $("qboRead").innerHTML="QuickBooks va unos días atrás de la cuenta (la contadora registra después). Lo que aquí falta, lo palomeas arriba. Chequera "+money(Q.chequera)+" · ahorros "+money(Q.ahorros)+".";
}
/* ═══════════ hoy ═══════════ */
function renderHoyKpis(){
  const T=totales("bip");
  const kq=$("kQueda");kq.textContent=money(T.proy);kq.className="v "+(T.proy>=0?"good":"bad");
  $("kQuedaN").textContent="BIP · al cerrar "+mesLargo(D.mes);
  $("kFalta").textContent=money(T.falta);$("kFaltaN").textContent="de "+money(T.tin)+" planeados";
}
function renderHoy(){
  renderHoyKpis();
  const m=D.metricas[0]||{};
  /* si la foto de hoy vino sin Stripe, usa el ultimo dia que si lo trajo */
  const mm=D.metricas.find(x=>x.mrr!=null)||{};
  $("kMrr").textContent=mm.mrr!=null?money(mm.mrr):"—";$("kMrrN").textContent=(mm.suscripciones!=null?mm.suscripciones+" suscripciones"+(mm!==m&&mm.fecha?" · "+fdate(mm.fecha):""):"plataforma");
  const u=D.ventas.reduce((t,v)=>t+ +v.unidades,0);
  $("kLib").textContent=u.toLocaleString("en-US");
  renderFocos();renderAtencion();renderLectura();
}
function semanaLbl(){const d=new Date(),dow=(d.getDay()+6)%7,a=new Date(d);a.setDate(d.getDate()-dow);const z=new Date(a);z.setDate(a.getDate()+6);
  return a.getDate()+(a.getMonth()===z.getMonth()?"":" "+MES[a.getMonth()])+"–"+z.getDate()+" "+MES[z.getMonth()];}
function focoDe(k){
  if(!D.board.focus)D.board.focus={};
  const f=D.board.focus[k]=D.board.focus[k]||{items:[]};
  if(!Array.isArray(f.items))f.items=[];
  while(f.items.length<3)f.items.push({text:"",status:"open",learning:""});
  const d=new Date();
  const clave={day:d.toISOString().slice(0,10),week:d.getFullYear()+"-w"+semanaLbl(),month:hoyKey(),year:String(d.getFullYear())}[k];
  if(f.fecha!==clave){ /* nuevo plazo: lo cerrado se archiva, lo abierto se queda */
    if(f.fecha)f.items=f.items.map(it=>it.status==="done"?{text:"",status:"open",learning:""}:it);f.fecha=clave;}
  return f;
}
function focosHoy(){return focoDe("day");}
let focoNuevo=null;
function bloqueFoco(k,lbl,per,box,cnt){
  const f=focoDe(k);const col=document.createElement("div");col.className="fbloque";
  if(lbl)col.innerHTML='<div class="colhead">'+lbl+' <span style="font-size:14px;color:var(--muted)">'+esc(per)+'</span></div>';
  f.items.forEach((it,i)=>{
    const r=document.createElement("div");r.className="foco";
    const dd=document.createElement("div");dd.className="d"+(it.status==="done"?" done":"");dd.textContent=it.status==="done"?"✓":"◆";
    dd.addEventListener("click",()=>{it.status=it.status==="done"?"open":"done";guardarBoard();renderFocos();renderAtencion();});
    const inp=document.createElement("input");inp.className="in bare"+(it.status==="done"?" done":"");inp.value=it.text||"";inp.placeholder="Foco "+(i+1);
    inp.addEventListener("input",()=>{it.text=inp.value;guardarBoardPronto();});
    inp.addEventListener("change",()=>{it.text=inp.value;guardarBoard();renderAtencion();});
    r.appendChild(dd);r.appendChild(inp);col.appendChild(r);
    if(it.text){cnt.n++;if(it.status==="done")cnt.d++;}
    if(focoNuevo&&focoNuevo.k===k&&focoNuevo.i===i){focoNuevo=null;setTimeout(()=>inp.focus(),0);}
  });
  /* cuando ya cerraste alguno y no queda renglon vacio, puedes abrir otro */
  if(f.items.every(it=>it.text)&&f.items.some(it=>it.status==="done")){
    const b=document.createElement("button");b.className="btn ghost";b.type="button";b.textContent="+ Otro";b.style.marginTop="8px";
    b.addEventListener("click",()=>{f.items.push({text:"",status:"open",learning:""});focoNuevo={k,i:f.items.length-1};guardarBoard();renderFocos();});
    col.appendChild(b);
  }
  box.appendChild(col);
}
function renderFocos(){
  const d=new Date();
  const bd=$("focosDia");bd.innerHTML="";const c1={n:0,d:0};
  $("focoFecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
  bloqueFoco("day","","",bd,c1);
  $("focoNote").textContent=c1.n?c1.d+" de "+c1.n+" cerrados.":"Tres cosas. No más.";
  const bf=$("focos");bf.innerHTML="";const c2={n:0,d:0};
  [["year","Año",String(d.getFullYear())],["month","Mes",MESL[d.getMonth()]+" "+d.getFullYear()],["week","Semana",semanaLbl()]].forEach(([k,l,p])=>bloqueFoco(k,l,p,bf,c2));
  $("focoNoteAll").textContent=c2.n?c2.d+" de "+c2.n+" cerrados.":"Escribe primero el año.";
}
function renderAtencion(){
  const items=[];const T=totales("bip");const P2=totales("personal");
  const hoyD=new Date().getDate();
  if(P2.tin&&P2.proy<0)items.push({hi:true,t:"<b>Lo personal no cierra: "+money(P2.proy)+".</b> El salario no cubre lo que sale de él."});
  const vencidos=cobrosAmb("bip").filter(c=>!c.cobrado&&c.dia&&!c.tarde&&hoyD>c.dia);
  if(vencidos.length)items.push({hi:true,t:"<b>"+vencidos.length+" cobro"+(vencidos.length>1?"s":"")+" ya pasó de fecha</b> — "+vencidos.map(v=>esc(v.nombre)).join(", ")+"."});
  if(T.proy<0)items.push({hi:true,t:"<b>Así como va, el mes cierra en "+money(T.proy)+".</b> O entra algo de Planear, o se recorta."});
  const salidas=D.plan.filter(p=>p.tipo==="salida"&&!p.hecho&&p.inicio&&(new Date(p.inicio)-Date.now())/864e5<45&&(new Date(p.inicio)-Date.now())/864e5>-1);
  if(salidas.length)items.push({t:"<b>Viene grande en los próximos 45 días:</b> "+salidas.map(p=>esc(p.nombre)+" ("+money(usd(p))+", "+fdate(p.inicio)+")").join(", ")+". Está en Planear."});
  const P=(D.plat&&D.plat.personas)||[];
  const pagaDormido=P.filter(p=>p.grupo==="paga_dormido");
  if(pagaDormido.length)items.push({hi:true,t:"<b>"+pagaDormido.length+" paga y no ha entrado</b> — "+pagaDormido.map(p=>esc(p.full_name||p.email)).join(", ")+". Se va solo en cuanto vea el cargo. Una llamada."});
  const dormidos=P.filter(p=>p.grupo==="acceso_dormido");
  if(dormidos.length)items.push({t:"<b>"+dormidos.length+" con acceso que nunca entraron</b> — "+dormidos.map(p=>esc(p.full_name||p.email)).join(", ")+". El acceso no es activación."});
  const solo=P.filter(p=>p.grupo==="solo_registro");
  if(solo.length)items.push({t:solo.length+" registrados sin membresía — "+solo.map(p=>esc(p.full_name||p.email)).join(", ")+". Se convierten o se sueltan."});
  const frios=D.ment.filter(m=>m.status==="active"&&m.ultima&&(Date.now()-new Date(m.ultima))/864e5>45);
  if(frios.length)items.push({t:"<b>"+frios.length+" mentoree"+(frios.length>1?"s":"")+" activo"+(frios.length>1?"s":"")+" sin sesión en 45+ días</b> — "+frios.map(m=>esc(m.full_name)).join(", ")+"."});
  const ult=D.salud[D.salud.length-1];const diasSin=ult?Math.floor((Date.now()-new Date(ult.fecha+"T12:00:00"))/864e5):null;
  if(ult&&diasSin>2)items.push({t:"El iPhone no ha mandado datos de salud desde el "+fdate(ult.fecha)+". Abre Health Auto Export."});
  const ay=D.ayunos.find(x=>!x.fin);if(ay){const hh=(Date.now()-new Date(ay.inicio))/36e5;if(hh>=36)items.push({t:"<b>Llevas "+Math.floor(hh)+" horas de ayuno.</b> Electrolitos, agua, y sin pesas hoy."});}
  const f=focosHoy();if(!f.items.some(x=>x.text))items.push({t:"<b>No has escrito los tres de hoy.</b>"});
  if(!focoDe("year").items.some(x=>x.text))items.push({t:"El foco del año está vacío. Sin eso, el del día es reacción."});
  $("atencion").innerHTML=items.length?items.map(i=>"<li><i"+(i.hi?' class="hi"':"")+"></i><span>"+i.t+"</span></li>").join("")
    :'<li><span>Nada urgente. Buen día para producir.</span></li>';
}
function lecturaHtml(l){
  if(!l)return '<div class="note" style="margin:0">Todavía no hay lectura. La primera llega el domingo.</div>';
  let h='<p style="margin:0 0 8px;font-family:var(--disp);font-size:20px;color:var(--ink);font-weight:600">'+esc(l.titular||"")+"</p>";
  if(l.datos_suficientes===false)h+='<p class="note" style="margin:0 0 8px"><b>Todavía no hay señal.</b> '+esc(l.que_funciona||"")+"</p>";
  else{ if(l.que_funciona)h+='<p style="margin:0 0 6px"><b>Funciona:</b> '+esc(l.que_funciona)+"</p>";
        if(l.que_no)h+='<p style="margin:0 0 6px"><b>No:</b> '+esc(l.que_no)+"</p>";}
  if(l.recomendacion)h+='<p style="margin:0"><b>Esta semana:</b> '+esc(l.recomendacion)+"</p>";
  return h;
}
function renderLectura(){const l=D.lecturas[0];$("lectura").innerHTML=lecturaHtml(l);
  if(l)$("lecturaSrc").textContent="Domingo "+fdate(l.fecha)+" · "+(l.n_posts||0)+" posts · "+(l.n_dias_visitas||0)+" días de visitas";}

