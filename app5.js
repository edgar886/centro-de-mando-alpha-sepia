/* ═══════════ app5: Hoy · Life Admin (Mike) ═══════════
   Lee `cos_mike_brief_diario` (la fila de hoy, que escribe Mike por la edge
   function `mike_brief`) y la pinta debajo de "Los tres de hoy". Edgar
   contesta el ask desde aquí (ask_respuesta). UI 2026-09-17: Life Admin más limpio,
   Clari solo conteo+link a Follow Up, Casa US rica (jacuzzi/temp/lock). Se apaga sin tocar nada más:
   `cos_dashboard/config` → data.life_admin = false, o quitar este script. */
const LA={brief:null,fecha:null};
const laHoy=()=>{const d=new Date(),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());};
try{const c=JSON.parse(localStorage.getItem("cosLA")||"null");if(c&&c.fecha===laHoy()){LA.brief=c.brief;LA.fecha=c.fecha;}}catch(e){}

async function cargarLA(){
  const fecha=laHoy();
  const r=await q(sb.from("cos_mike_brief_diario").select("*").eq("fecha",fecha).maybeSingle());
  LA.brief=r||null; LA.fecha=fecha;
  try{localStorage.setItem("cosLA",JSON.stringify({fecha,brief:LA.brief}));}catch(e){}
}
const _cargarTodo5=cargarTodo;
cargarTodo=async function(){await Promise.all([_cargarTodo5(),cargarLA()]);renderLA();};
const _renderTodo5=renderTodo;
renderTodo=function(){try{_renderTodo5();}finally{renderLA();}};

const laDias=f=>{if(!f)return null;const d=new Date(String(f).slice(0,10)+"T12:00:00");if(isNaN(d))return null;return Math.round((Date.now()-d.getTime())/864e5);};
const laEn=f=>{const n=laDias(f);if(n==null)return "";if(n===0)return "hoy";if(n<0)return "en "+(-n)+" d";return "hace "+n+" d";};
const laHora=t=>{const d=new Date(t);return isNaN(d)?"":d.toLocaleTimeString("es-MX",{hour:"numeric",minute:"2-digit"});};


const laNum=v=>{if(v==null||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null;};
const laChem=q=>{
  if(q==null||q==="")return "";
  if(typeof q==="string")return q;
  if(typeof q!=="object")return String(q);
  const bits=[];
  for(const [k,lab] of [["ph","pH"],["cloro","Cl"],["chlorine","Cl"],["bromo","Br"],["bromine","Br"],["alcalinidad","Alk"],["alkalinity","Alk"],["estado","estado"],["status","estado"],["nota","nota"],["note","nota"],["ok","estado"]]){
    if(q[k]!=null&&q[k]!=="") bits.push(lab+" "+q[k]);
  }
  return bits.length?bits.join(" · "):"";
};
const laLock=casa=>{
  const L=casa.lock||casa.cerradura||casa.chapa||casa.nest_lock;
  if(L==null||L==="")return null;
  if(typeof L==="boolean")return L?"locked":"unlocked";
  if(typeof L==="string"){
    const s=L.toLowerCase();
    if(/unlock|abiert|open/.test(s)) return "unlocked";
    if(/lock|cerrad|secure/.test(s)) return "locked";
    return L;
  }
  if(typeof L==="object"){
    if(typeof L.locked==="boolean") return L.locked?"locked":"unlocked";
    const e=String(L.estado||L.status||L.state||"").toLowerCase();
    if(/unlock|abiert|open/.test(e)) return "unlocked";
    if(/lock|cerrad|secure/.test(e)) return "locked";
    return String(L.estado||L.status||L.state||"")||null;
  }
  return null;
};
function laRenderCasa(casa){
  if(casa==null) casa={};
  if(Array.isArray(casa)) casa={alertas:casa};
  const al=Array.isArray(casa.alertas)?casa.alertas:(Array.isArray(casa.alerts)?casa.alerts:[]);
  const jac=casa.jacuzzi||casa.spa||casa.hotspring||{};
  const chem=jac.chemicals||jac.quimicos||jac.quim||casa.jacuzzi_chemicals||casa.quimicos||{};
  const jTemp=laNum(jac.temp??jac.temperatura??casa.jacuzzi_temp??casa.spa_temp);
  const jUnit=(jac.unit||jac.unidad||casa.jacuzzi_unit||"°F")+"";
  const hTemp=laNum(casa.temp??casa.casa_temp??casa.house_temp??casa.thermostat??(casa.ecobee&&casa.ecobee.temp)??(casa.humidity==null?null:null)??(casa.ecobee&&casa.ecobee.temperature));
  const hUnit=(casa.temp_unit||casa.unidad_temp||"°F")+"";
  const hum=laNum(casa.humidity??casa.humedad??(casa.ecobee&&casa.ecobee.humidity));
  const lock=laLock(casa);
  const jV=jTemp!=null?(jTemp+(jUnit.startsWith("°")?jUnit:" "+jUnit)):"—";
  const hV=hTemp!=null?(hTemp+(hUnit.startsWith("°")?hUnit:" "+hUnit)):"—";
  let lV="—", lS="sin lectura", lBad=false;
  if(lock){
    const open=String(lock).toLowerCase()==="unlocked";
    lV=open?"Unlocked":(String(lock).toLowerCase()==="locked"?"Locked":String(lock));
    lS=open?"abierta":"cerrada";
    lBad=open;
  }
  /* Order: Jacuzzi temp | Chemicals | Lock | House temp (house ALWAYS to the right of Lock) */
  let html='<div class="la-metrics la-metrics-4">';
  html+='<div class="la-metric'+(jTemp==null?" empty":"")+'"><div class="k">Jacuzzi</div><div class="v">'+esc(jV)+'</div><div class="s">'+(jTemp!=null?"temp":"sin lectura")+"</div></div>";
  html+='<div class="la-metric la-chem'+(typeof chem==="object"&&chem&& (chem.ph!=null||chem.chlorine!=null||chem.cloro!=null||chem.orp!=null)?"":" empty")+'"><div class="k">Químicos</div>'+laChemBlock(chem)+"</div>";
  html+='<div class="la-metric'+(lBad?" bad":"")+(!lock?" empty":"")+'"><div class="k">Lock</div><div class="v">'+esc(lV)+'</div><div class="s">'+esc(lS)+"</div></div>";
  html+='<div class="la-metric'+(hTemp==null?" empty":"")+'"><div class="k">Casa</div><div class="v">'+esc(hV)+'</div><div class="s">'+(hTemp!=null?(hum!=null?"humedad "+hum+"%":"interior"):"sin lectura")+"</div></div>";
  html+="</div>";
  if(typeof chem==="object"&&chem&&chem.resumen) html+='<div class="la-note">'+esc(String(chem.resumen))+"</div>";
  if(casa.texto&&!/^ok$/i.test(casa.texto)) html+='<div class="la-note">'+esc(casa.texto)+"</div>";
  if(casa.spa_cover||casa.cover||jac.cover){
    const cov=casa.spa_cover||casa.cover||jac.cover;
    html+='<div class="la-note">Cover: '+esc(typeof cov==="string"?cov:(cov.estado||cov.status||JSON.stringify(cov)))+"</div>";
  }
  if(al.length) html+='<ul class="la-l la-alerts">'+al.map(x=>'<li class="la-bad">'+esc(typeof x==="string"?x:(x.texto||x.msg||x.message||JSON.stringify(x)))+"</li>").join("")+"</ul>";
  return html;
}
function laChemBlock(chem){
  if(chem==null||chem==="") chem={};
  if(typeof chem==="string") return '<div class="v">'+esc(chem)+'</div>';
  if(typeof chem!=="object") return '<div class="v">'+esc(String(chem))+"</div>";
  const rows=[];
  const specs=[
    {k:"ph", label:"pH", st:"ph_status", ac:"ph_accion"},
    {k:"chlorine", label:"Cl", st:"chlorine_status", ac:"chlorine_accion", alt:"cloro"},
    {k:"orp", label:"ORP", st:"orp_status", ac:"orp_accion"}
  ];
  for(const sp of specs){
    const val=chem[sp.k]??(sp.alt?chem[sp.alt]:null);
    const st=String(chem[sp.st]||"").toLowerCase();
    const ac=chem[sp.ac]||"";
    const has=val!=null&&val!=="";
    const badge=st?('<span class="la-badge '+laChemClass(st)+'">'+esc(st)+"</span>"):"";
    const accion=st&&st!=="ok"&&ac?('<span class="la-accion">'+esc(ac)+"</span>"):"";
    rows.push('<div class="la-chemrow'+(has?"":" empty")+'"><span class="lab">'+sp.label+'</span><span class="val">'+(has?esc(String(val)):"—")+"</span>"+badge+accion+"</div>");
  }
  /* Always show pH / Cl / ORP rows — never collapse to green OK or hide nulls */
  return '<div class="la-chemlist">'+rows.join("")+"</div>";
}
function laChemClass(st){
  st=String(st||"").toLowerCase();
  if(st==="ok"||st==="normal"||st==="good") return "ok";
  if(st==="alto"||st==="high"||st==="hi") return "alto";
  if(st==="bajo"||st==="low"||st==="lo") return "bajo";
  return "off";
}

function renderLA(){
  const box=$("laBody"); if(!box) return;
  const panel=$("lifeAdmin");
  const cfg=(D&&D.cfg)||{};
  if(cfg.life_admin===false){panel.classList.add("hidden");return;}
  panel.classList.remove("hidden");
  const b=LA.brief;
  if(!b){ $("laSrc").textContent="Mike · Grok Bot"; box.innerHTML='<div class="note" style="margin:6px 0">Mike aún no escribió el brief de hoy.</div>'; return; }
  $("laSrc").textContent="Mike · "+(b.updated_at?"escrito a las "+laHora(b.updated_at):"hoy");
  const S=(t,inner,cls)=>'<section class="la-sec'+(cls?" "+cls:"")+'"><h4>'+t+'</h4>'+inner+'</section>';
  const li=a=>'<ul class="la-l">'+a.join("")+'</ul>';
  /* 1 · calendario */
  const cal=(b.calendario||[]).slice(0,6);
  const hCal=cal.length?li(cal.map(c=>'<li><b class="la-h">'+esc(c.hora||"")+'</b>'+esc(c.titulo||c.title||"")+'</li>')):'<div class="la-vacio">Sin citas</div>';
  /* 2 · mail */
  const mail=b.mail||[];
  const hMail=mail.length?li(mail.map(m=>'<li><b>'+esc(m.de||"")+'</b> · '+esc(m.asunto||"")+(m.por_que?'<span class="la-why">'+esc(m.por_que)+'</span>':"")+'</li>')):'<div class="la-vacio">Nada nuevo</div>';
  /* 3 · Follow Up (Clari) — solo conteo + link; lista vive en tab Follow Up */
  const cl=Array.isArray(b.clari)?b.clari:[];
  const nCl=cl.length;
  const hCl=nCl
    ?('<div class="la-linkrow"><span class="la-count">'+nCl+" abierto"+(nCl===1?"":"s")+'</span>'
      +'<button type="button" class="la-link" data-la-nav="clari">Ver en Follow Up →</button></div>')
    :'<div class="la-vacio">Nada abierto</div>';
  /* 4 · Casa US — jacuzzi / temp / lock / alertas (payload enriquecido de Mike) */
  const hCasa=laRenderCasa(b.casa_us||b.casa_us||{});
  /* 5 · pagos */
  const pg=(b.pagos||[]).slice().sort((a,c)=>String(a.fecha||"").localeCompare(String(c.fecha||"")));
  const hPg=pg.length?li(pg.map(p=>{const n=laDias(p.fecha);const urg=n!=null&&n>=-3;
    return '<li><b>'+esc(p.que||p.titulo||"")+'</b>'+(p.monto?' · '+money(+p.monto):"")+'<span class="la-tags">'+(p.fecha?'<span class="pill '+(urg?"st-warn":"st-off")+'">'+esc(fdate(String(p.fecha).slice(0,10)))+(n!=null?" · "+laEn(p.fecha).replace("hace","vencido"):"")+'</span>':"")+(p.accion?'<span class="pill st-info">necesita '+esc(p.accion)+'</span>':"")+'</span></li>';})):'<div class="la-vacio">Nada en 14 días</div>';
  /* 6 · ask */
  let hAsk;
  if(!b.ask) hAsk='<div class="la-ask vacio"><span>Nada pendiente de ti</span></div>';
  else if(b.ask_respuesta) hAsk='<div class="la-ask done"><p>'+esc(b.ask)+'</p><div class="la-resp">Respondiste <b>'+(b.ask_respuesta==="ok"?"OK":"Not now")+'</b>'+(b.ask_respondido_at?" · "+laHora(b.ask_respondido_at):"")+' <button class="lk" data-la="deshacer">cambiar</button></div></div>';
  else hAsk='<div class="la-ask"><p>'+esc(b.ask)+'</p><div class="la-btns"><button class="btn" data-la="ok">OK</button><button class="btn ghost" data-la="not_now">Not now</button></div></div>';
  box.innerHTML=S("Calendario hoy",hCal)+S("Mail admin",hMail)+S("Follow Up",hCl)+S("Casa US",hCasa)+S("Pagos · countdowns",hPg)+S("Un solo ask",hAsk,"la-wide");
}
document.addEventListener("click",async e=>{
  const nav=e.target.closest("[data-la-nav]");
  if(nav){ e.preventDefault(); if(typeof verVista==="function") verVista(nav.dataset.laNav); return; }
  const bt=e.target.closest("[data-la]"); if(!bt||!LA.brief) return;
  const v=bt.dataset.la; const patch=v==="deshacer"?{ask_respuesta:null,ask_respondido_at:null}:{ask_respuesta:v,ask_respondido_at:new Date().toISOString()};
  Object.assign(LA.brief,patch); renderLA();
  const {error}=await sb.from("cos_mike_brief_diario").update(patch).eq("fecha",LA.fecha);
  aviso(error?"No se guardó · "+error.message:(v==="deshacer"?"Listo":"Mike lo verá"),!!error);
  try{localStorage.setItem("cosLA",JSON.stringify({fecha:LA.fecha,brief:LA.brief}));}catch(e){}
});
