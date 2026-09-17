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
  if(st==="ok"||st==="normal"||st==="good"||st==="verde") return "ok";
  if(st==="alto"||st==="high"||st==="hi") return "alto";
  if(st==="bajo"||st==="low"||st==="lo"||st==="amarillo") return "bajo";
  if(st==="revisar"||st==="check"||st==="warn"||st==="warning") return "revisar";
  return "off";
};
const laProdMap=list=>{
  const m={};
  if(Array.isArray(list)) for(const p of list){ if(p&&(p.id||p.producto_id)) m[p.id||p.producto_id]=p; }
  return m;
};
const laShortProd=(prod, id)=>{
  if(prod&&prod.nombre){
    const n=String(prod.nombre);
    if(/pH Decreaser|Decreases? pH/i.test(n)) return "pH Decreaser";
    if(/pH BUFFER|Buffer|Alkalinity/i.test(n)) return "pH Buffer";
    if(/POWER BOOST|Power Boost/i.test(n)) return "Power Boost";
    if(/Chlor Brite|Clor Brite/i.test(n)) return "Chlor Brite";
    if(/ACE Cell|Cell Cleaner/i.test(n)) return "ACE Cell Cleaner";
    if(/Disinfectant|Desinfectante/i.test(n)) return "Spa Disinfectant";
    return n.replace(/^White River\s*\/\s*/i,"").replace(/^SimpleBlue\s+(Spa\s+)?/i,"").replace(/^Leslie'?s\s+/i,"").trim()||n;
  }
  const fallback={
    ph_decreaser:"pH Decreaser", ph_buffer:"pH Buffer", power_boost:"Power Boost",
    chlor_brite:"Chlor Brite", ace_cleaner:"ACE Cell Cleaner", disinfectant:"Spa Disinfectant"
  };
  return fallback[id]||"";
};
function laChemRows(casa, jac){
  const q=jac.quimicos??jac.chemicals??casa.quimicos??null;
  const prods=laProdMap(jac.productos||casa.productos||[]);
  const rows=[];
  if(Array.isArray(q)){
    for(const row of q){
      if(!row||typeof row!=="object") continue;
      const label=row.label||row.nombre||row.name||"";
      const valor=row.valor??row.value??row.val;
      const estado=row.estado||row.status||"";
      const hacer=row.hacer||row.accion||row.action||"";
      const dosis=row.dosis||row.dose||"";
      const nota=row.nota||row.note||"";
      const pid=row.producto||row.product_id||row.product||null;
      const prod=pid?prods[pid]:null;
      if((valor==null||valor==="") && !estado && !hacer && !label) continue;
      rows.push({label, valor, estado, hacer, dosis, nota, producto:prod, producto_id:pid});
    }
    return rows;
  }
  if(q && typeof q==="string" && q.trim()) return [{label:"Químicos", valor:q, estado:"", hacer:"", dosis:"", nota:"", producto:null, producto_id:null}];
  /* legacy object — known keys only, NEVER Object.entries dump */
  if(q && typeof q==="object"){
    const map=[
      {k:"ph", label:"pH", st:"ph_status", ac:"ph_accion"},
      {k:"chlorine", label:"Cloro", st:"chlorine_status", ac:"chlorine_accion", alt:"cloro"},
      {k:"orp", label:"ORP", st:"orp_status", ac:"orp_accion"}
    ];
    for(const m of map){
      const valor=q[m.k]??(m.alt?q[m.alt]:null);
      const estado=q[m.st]||"";
      const hacer=q[m.ac]||"";
      if((valor==null||valor==="") && !estado && !hacer) continue;
      rows.push({label:m.label, valor, estado, hacer, dosis:"", nota:"", producto:null, producto_id:null});
    }
  }
  return rows;
}
function laDosePrimary(row, gal){
  const st=String(row.estado||"").toLowerCase();
  if(!st || st==="ok" || st==="normal" || st==="good" || st==="verde") return "";
  const short=laShortProd(row.producto, row.producto_id);
  const dosis=(row.dosis&&String(row.dosis).trim())||"";
  let line="";
  if(dosis && short) line=dosis+" "+short;
  else if(dosis) line=dosis;
  else if(short) line=short;
  else {
    const h=String(row.hacer||"").trim();
    if(!h) return "";
    const cut=h.split(/[.\n]/)[0].trim();
    line=cut.length>72?cut.slice(0,69)+"…":cut;
  }
  const g=laNum(gal);
  if(g!=null && line && !/\bgal\b/i.test(line)) line+=" · en "+g+" gal";
  return line;
}
function laRenderCasa(casa){
  if(casa==null) casa={};
  if(Array.isArray(casa)) casa={alertas:casa};
  const al=Array.isArray(casa.alertas)?casa.alertas:(Array.isArray(casa.alerts)?casa.alerts:[]);
  const jac=casa.jacuzzi||casa.spa||casa.hotspring||{};
  const jTemp=laNum(jac.temp_f??jac.temp??jac.temperatura??casa.jacuzzi_temp??casa.spa_temp??casa.temperatura_jacuzzi_f);
  const jSet=laNum(jac.set_f??jac.setpoint??jac.set);
  const jGal=laNum(jac.galones??jac.gallons??casa.galones??casa.jacuzzi_galones);
  const jUnit="°F";
  const hTemp=laNum(casa.temperatura_casa_f??casa.temp??casa.casa_temp??casa.house_temp??casa.thermostat??(casa.ecobee&&casa.ecobee.temp));
  const hSet=laNum(casa.setpoint_casa_f??casa.setpoint_casa??casa.casa_set);
  const hUnit="°F";
  const lock=laLock(casa);
  const chemRows=laChemRows(casa, jac);
  const resumen=jac.quimicos_resumen||casa.quimicos_resumen||"";

  let lV="—", lOpen=false, lEmpty=true;
  if(lock){
    lEmpty=false;
    lOpen=String(lock).toLowerCase()==="unlocked";
    lV=lOpen?"Unlocked":(String(lock).toLowerCase()==="locked"?"Locked":String(lock));
  }
  const jV=jTemp!=null?(jTemp+jUnit):"—";
  const hV=hTemp!=null?(hTemp+hUnit):"—";
  let jSub="sin lectura";
  if(jTemp!=null){
    const bits=[];
    if(jSet!=null) bits.push("set "+jSet+jUnit);
    if(jGal!=null) bits.push(jGal+" gal");
    if(!bits.length && jac.leido_at) bits.push("leído "+jac.leido_at);
    if(!bits.length) bits.push("temp");
    jSub=bits.join(" · ");
  }
  const hSub=hTemp!=null?(hSet!=null?"set "+hSet+hUnit:"interior"):"sin lectura";

  /* Top row: LOCK | CASA (casa always RIGHT of lock) */
  let html='<div class="la-toprow">';
  html+='<div class="la-lock'+(lOpen?" open":"")+(lEmpty?" empty":"")+'"><span class="ico" aria-hidden="true">'+(lEmpty?"·":(lOpen?"🔓":"🔒"))+'</span><span class="v">'+esc(lV)+'</span></div>';
  html+='<div class="la-house'+(hTemp==null?" empty":"")+'"><div class="k">Casa</div><div class="v">'+esc(hV)+'</div><div class="s">'+esc(hSub)+'</div></div>';
  html+='</div>';

  /* Jacuzzi big temp */
  html+='<div class="la-jacuzzi'+(jTemp==null?" empty":"")+'"><div class="k">Jacuzzi</div><div class="v">'+esc(jV)+'</div><div class="s">'+esc(jSub)+'</div></div>';

  /* Chem rows — label · valor · badge · dose (click expands). Never raw keys / Object.entries. */
  if(chemRows.length){
    html+='<div class="la-chemlist">';
    for(const row of chemRows){
      const st=String(row.estado||"").toLowerCase();
      const hasVal=row.valor!=null&&row.valor!=="";
      const badge=st?('<span class="la-badge '+laBadgeClass(st)+'">'+esc(st)+'</span>'):"";
      const primary=laDosePrimary(row, jGal);
      const detailParts=[];
      if(row.hacer) detailParts.push(String(row.hacer));
      if(row.nota) detailParts.push(String(row.nota));
      if(row.producto&&row.producto.nombre) detailParts.push(String(row.producto.nombre)+(row.producto.uso?" · "+row.producto.uso:""));
      const detail=detailParts.join("\n");
      const needs=!!(st && st!=="ok" && st!=="normal" && st!=="good" && st!=="verde");
      const canExpand=!!(detail && (primary || needs));
      const doseLine=primary?('<span class="la-dose">'+esc(primary)+'</span>'):"";
      const openBtn=canExpand?'<button type="button" class="la-dose-tog" aria-expanded="false" title="Ver detalle">▾</button>':"";
      html+='<div class="la-chemrow'+(canExpand?" has-dose":"")+(needs?" needs":"")+'">';
      html+='<span class="lab">'+esc(String(row.label||""))+'</span>';
      html+='<span class="val">'+(hasVal?esc(String(row.valor)):"—")+'</span>';
      html+=badge;
      if(primary||canExpand){
        html+='<div class="la-dosewrap">'+doseLine+openBtn;
        if(detail) html+='<div class="la-dose-detail" hidden>'+esc(detail).replace(/\n/g,"<br>")+'</div>';
        html+='</div>';
      }
      html+='</div>';
    }
    html+='</div>';
  }else{
    html+='<div class="la-chemlist empty"><div class="la-chemrow empty"><span class="lab">Químicos</span><span class="val">—</span><span class="la-accion">sin lectura</span></div></div>';
  }
  if(resumen) html+='<div class="la-note">'+esc(String(resumen))+'</div>';
  if(casa.texto&&!/^ok$/i.test(casa.texto)) html+='<div class="la-note">'+esc(casa.texto)+'</div>';
  if(al.length) html+='<ul class="la-l la-alerts">'+al.map(x=>'<li class="la-bad">'+esc(typeof x==="string"?x:(x.texto||x.msg||x.message||JSON.stringify(x)))+'</li>').join('')+'</ul>';
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
  const hCasa=laRenderCasa(b.casa_us||b.casa||{});
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
