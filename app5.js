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
const laLock=casa=>{
  const L=casa.lock||casa.cerradura||casa.chapa||casa.nest_lock||casa.estado_lock;
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
const laBadgeClass=st=>{
  st=String(st||"").toLowerCase();
  if(st==="ok"||st==="normal"||st==="good") return "ok";
  if(st==="alto"||st==="high"||st==="hi") return "alto";
  if(st==="bajo"||st==="low"||st==="lo") return "bajo";
  return "off";
};
function laChemRows(casa, jac){
  const q=jac.quimicos??jac.chemicals??casa.quimicos??casa.jacuzzi_chemicals??null;
  const rows=[];
  if(Array.isArray(q)){
    for(const row of q){
      if(!row||typeof row!=="object") continue;
      const label=row.label||row.nombre||row.name||"";
      const valor=row.valor??row.value??row.val;
      const estado=row.estado||row.status||"";
      const hacer=row.hacer||row.accion||row.action||"";
      if((valor==null||valor==="") && !estado && !hacer && !label) continue;
      rows.push({label, valor, estado, hacer});
    }
    return rows;
  }
  if(q && typeof q==="string" && q.trim()) return [{label:"Químicos", valor:q, estado:"", hacer:""}];
  if(q && typeof q==="object"){
    /* legacy object shape — map known keys only, NEVER Object.entries dump */
    const map=[
      {k:"ph", label:"pH", st:"ph_status", ac:"ph_accion"},
      {k:"chlorine", label:"Cloro", st:"chlorine_status", ac:"chlorine_accion", alt:"cloro"},
      {k:"orp", label:"ORP", st:"orp_status", ac:"orp_accion"}
    ];
    for(const m of map){
      const valor=q[m.k]??(m.alt?q[m.alt]:null);
      const estado=q[m.st]||"";
      const hacer=q[m.ac]||"";
      if(valor==null||valor===""){
        if(!estado && !hacer) continue;
      }
      rows.push({label:m.label, valor, estado, hacer});
    }
  }
  return rows;
}
function laRenderCasa(casa){
  if(casa==null) casa={};
  if(Array.isArray(casa)) casa={alertas:casa};
  const al=Array.isArray(casa.alertas)?casa.alertas:(Array.isArray(casa.alerts)?casa.alerts:[]);
  const jac=casa.jacuzzi||casa.spa||casa.hotspring||{};
  const jTemp=laNum(jac.temp??jac.temperatura??casa.jacuzzi_temp??casa.spa_temp??casa.temperatura_jacuzzi_f);
  const jUnit=(jac.unit||jac.unidad||casa.jacuzzi_unit||"°F")+"";
  const hTemp=laNum(casa.temperatura_casa_f??casa.temp??casa.casa_temp??casa.house_temp??casa.thermostat??(casa.ecobee&&casa.ecobee.temp));
  const hUnit=(casa.temp_unit||casa.unidad_temp||"°F")+"";
  const lock=laLock(casa);
  const chemRows=laChemRows(casa, jac);
  const resumen=casa.quimicos_resumen||jac.quimicos_resumen||(jac.quimicos&&jac.quimicos.resumen)||"";

  let lV="—", lOpen=false, lEmpty=true;
  if(lock){
    lEmpty=false;
    lOpen=String(lock).toLowerCase()==="unlocked";
    lV=lOpen?"Unlocked":(String(lock).toLowerCase()==="locked"?"Locked":String(lock));
  }
  const jV=jTemp!=null?(jTemp+(jUnit.startsWith("°")?jUnit:" "+jUnit)):"—";
  const hV=hTemp!=null?(hTemp+(hUnit.startsWith("°")?hUnit:" "+hUnit)):"—";

  /* Top row: LOCK | CASA temp (casa always to the RIGHT of lock) */
  let html='<div class="la-toprow">';
  html+='<div class="la-lock'+(lOpen?" open":"")+(lEmpty?" empty":"")+'"><span class="ico" aria-hidden="true">'+(lEmpty?"·":(lOpen?"🔓":"🔒"))+'</span><span class="v">'+esc(lV)+'</span></div>';
  html+='<div class="la-house'+(hTemp==null?" empty":"")+'"><div class="k">Casa</div><div class="v">'+esc(hV)+"</div></div>";
  html+="</div>";

  /* Jacuzzi big temp */
  html+='<div class="la-jacuzzi'+(jTemp==null?" empty":"")+'"><div class="k">Jacuzzi</div><div class="v">'+esc(jV)+"</div></div>";

  /* Chem rows — clean, never raw keys */
  if(chemRows.length){
    html+='<div class="la-chemlist">';
    for(const row of chemRows){
      const st=String(row.estado||"").toLowerCase();
      const hasVal=row.valor!=null&&row.valor!=="";
      const badge=st?('<span class="la-badge '+laBadgeClass(st)+'">'+esc(st)+"</span>"):"";
      const accion=st&&st!=="ok"&&row.hacer?('<span class="la-accion">'+esc(String(row.hacer))+"</span>"):"";
      html+='<div class="la-chemrow"><span class="lab">'+esc(String(row.label||""))+'</span><span class="val">'+(hasVal?esc(String(row.valor)):"—")+"</span>"+badge+accion+"</div>";
    }
    html+="</div>";
  }else{
    html+='<div class="la-chemlist empty"><div class="la-chemrow empty"><span class="lab">Químicos</span><span class="val">—</span><span class="la-accion">sin lectura</span></div></div>';
  }
  if(resumen) html+='<div class="la-note">'+esc(String(resumen))+"</div>";
  if(casa.texto&&!/^ok$/i.test(casa.texto)) html+='<div class="la-note">'+esc(casa.texto)+"</div>";
  if(al.length) html+='<ul class="la-l la-alerts">'+al.map(x=>'<li class="la-bad">'+esc(typeof x==="string"?x:(x.texto||x.msg||x.message||JSON.stringify(x)))+"</li>").join("")+"</ul>";
  return html;
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
