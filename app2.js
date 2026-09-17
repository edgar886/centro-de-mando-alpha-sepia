/* ═══════════ señal ═══════════ */
const TIPO={REELS:"Reel",IMAGE:"Post",CAROUSEL_ALBUM:"Carrusel",VIDEO:"Video",STORY:"Story"};
const tipoLbl=t=>TIPO[String(t||"").toUpperCase()]||(t||"—");
function renderSenal(){
  const d30=Date.now()-30*864e5;
  const p30=D.posts.filter(p=>new Date(p.publicado_at)>d30);
  $("sPosts").textContent=p30.length;
  const alc=p30.length?Math.round(p30.reduce((t,p)=>t+ +(p.alcance||0),0)/p30.length):0;
  $("sAlc").textContent=alc.toLocaleString("en-US");
  const v30=D.visitas.filter(v=>new Date(v.fecha)>d30);
  const vis=v30.reduce((t,v)=>t+ +(v.visitas||0),0),atr=v30.filter(v=>v.campana&&v.fuente!=="verificacion").reduce((t,v)=>t+ +(v.visitas||0),0);
  $("sVis").textContent=vis.toLocaleString("en-US");$("sAtr").textContent=atr.toLocaleString("en-US");
  /* por formato */
  const por={};D.posts.forEach(p=>{const k=tipoLbl(p.tipo);(por[k]=por[k]||[]).push(p);});
  const tipos=Object.keys(por).sort((a,b)=>por[b].length-por[a].length);
  if(!D.posts.length){$("formatos").innerHTML='<div class="note" style="margin:0">Aún no hay publicaciones capturadas.</div>';}
  else{
    $("formatos").innerHTML='<div style="overflow-x:auto"><table class="tbl"><tr><th>Formato</th><th class="num">Posts</th><th class="num">Alcance medio</th><th class="num">Guardados /1k</th><th class="num">Visitas</th></tr>'+
      tipos.map(t=>{const L=por[t],n=L.length,a=L.reduce((s,p)=>s+ +(p.alcance||0),0),g=L.reduce((s,p)=>s+ +(p.guardados||0),0),v=L.reduce((s,p)=>s+ +(p.visitas_atribuidas||0),0);
        return "<tr><td class='who'>"+esc(t)+"</td><td class='num'>"+n+"</td><td class='num'>"+Math.round(a/n).toLocaleString("en-US")+"</td><td class='num'>"+(a?(g/a*1000).toFixed(1):"—")+"</td><td class='num'>"+v+"</td></tr>";}).join("")+"</table></div>";
  }
  const nP=D.posts.length,nD=new Set(D.visitas.map(v=>v.fecha)).size;
  $("formatosRead").innerHTML=(nP<8||nD<14)
    ? "<b>Todavía no hay señal.</b> Hay "+nP+" publicaciones y "+nD+" días de visitas; hacen falta 8 y 14. Un patrón inventado sobre pocos datos hace más daño que no decir nada. La cadena ya está tendida: cada post con liga etiquetada suma."
    : "Guardados por mil de alcance es la medida más honesta de si el contenido pegó. Visitas es lo único que conecta con libros y suscripciones — y solo cuenta cuando el post llevó liga.";
  renderPV();
  $("posts").innerHTML=D.posts.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Fecha</th><th>Formato</th><th>Texto</th><th class="num">Alcance</th><th class="num">Guard.</th><th class="num">Visitas</th></tr>'+
    D.posts.slice(0,40).map(p=>"<tr><td>"+fdate(String(p.publicado_at).slice(0,10))+"</td><td>"+esc(tipoLbl(p.tipo))+"</td><td style='max-width:200px'><a href='"+esc(p.permalink)+"' target='_blank' rel='noopener' style='text-decoration:none;color:var(--ink);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'>"+
      esc(String(p.caption||"").slice(0,64))+(String(p.caption||"").length>64?"…":"")+"</a>"+(p.campana?"<span class='sub'>"+esc(campNombre(p.campana))+"</span>":"")+"</td><td class='num'>"+(+p.alcance||0).toLocaleString("en-US")+"</td><td class='num'>"+(+p.guardados||0)+"</td><td class='num'>"+(+p.visitas_atribuidas||0)+"</td></tr>").join("")+"</table></div>"
    :'<div class="note" style="margin:0">Nada capturado todavía.</div>';
  $("lecturas").innerHTML=D.lecturas.length?D.lecturas.map(l=>'<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div class="src" style="margin-bottom:6px">'+fdate(l.fecha)+"</div>"+lecturaHtml(l)+"</div>").join("")
    :'<div class="note" style="margin:0">La primera lectura llega el domingo.</div>';
  renderLigas();
}
function renderPV(){
  const svg=$("pv");svg.innerHTML="";
  const nd=window.innerWidth<560?28:42;
  const dias=[];for(let i=nd-1;i>=0;i--){const d=new Date(Date.now()-i*864e5);dias.push(d.toISOString().slice(0,10));}
  const por={};D.visitas.forEach(v=>por[v.fecha]=(por[v.fecha]||0)+ +(v.visitas||0));
  const posts={};D.posts.forEach(p=>{const k=String(p.publicado_at).slice(0,10);posts[k]=(posts[k]||0)+1;});
  const H=190,W=dims(svg,H),pt=26,pb=28,pd=20,iw=(W-pd*2)/dias.length;
  const mx=Math.max.apply(null,dias.map(d=>por[d]||0).concat([4]))*1.15;
  const y=v=>pt+(mx-v)/mx*(H-pt-pb);
  const c1=css("--c1"),c2=css("--c2"),line=css("--line"),muted=css("--muted");
  svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y(0),y2:y(0),stroke:line}));
  dias.forEach((d,i)=>{const x=pd+iw*i,v=por[d]||0;
    const b=el("rect",{x:x+iw*0.2,y:y(v),width:iw*0.6,height:Math.max(v?2:0.8,y(0)-y(v)),fill:v?c1:line,rx:1.5});hov(b,fdate(d)+" · "+v+" visitas");svg.appendChild(b);
    if(posts[d]){const m=el("circle",{cx:x+iw/2,cy:pt-12,r:5,fill:c2});hov(m,fdate(d)+" · "+posts[d]+" publicación"+(posts[d]>1?"es":""));svg.appendChild(m);}
    if(i%7===0){const t=el("text",{x:x+iw/2,y:H-8,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=fdate(d);svg.appendChild(t);}
  });
  const tot=dias.reduce((t,d)=>t+(por[d]||0),0);
  $("pvRead").innerHTML=tot?"<b>"+tot+" visitas en seis semanas.</b> Cuando una marca azul va seguida de una barra alta, ese post movió gente. Cuando no, no.":"Las visitas empiezan a contarse desde que PostHog quedó instalado. Cada día suma.";
}
/* ligas */
const LIBROS=[["libro-despierta","DESPIERTA"],["libro-self-mastery","SELF MASTERY"],["libro-en-la-arena","EN LA ARENA"],["libro-lidera","LIDERA"],["libro-trascendencia","TRASCENDENCIA"],["libro-caban","CABAN"],
 ["libros/the-way","THE WAY"],["libros/the-way-parejas","THE WAY · Parejas"],["libros/the-way-hijos","THE WAY · Hijos"],["libros/the-way-padres","THE WAY · Padres"],["libros/the-way-emprender","THE WAY · Emprender"],
 ["libro-despues","DESPUES"],["libros/legacy","LEGACY"],["libro-remembrando","REMEMBRANDO"],["libro-semillas-del-alma","SEMILLAS DEL ALMA"],
 ["libro-nada-y-todo","NADA Y TODO"],["libro-salir-del-hoyo","SALIR DEL HOYO"],["libro-volver-a-vivir","VOLVER A VIVIR"],
 ["libro-the-way-of-the-world","THE WAY OF THE WORLD"],["libro-no-point","NO POINT"],["libro-what-holds-you","WHAT HOLDS YOU"]];
const SERIES=[["libros/guia","Todos los libros"],["libros/foundations","Serie FOUNDATIONS"],["libros/inspiracion","Serie INSPIRACIÓN"],["libros/la-travesia","Serie LA TRAVESÍA"],["libros/english-books","Libros en inglés"]];
const campNombre=c=>{const k=String(c||"").replace(/-(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\d{2}$/,"");const hit=LIBROS.concat(SERIES).find(([v])=>lgSlug(v)===k);return hit?hit[1].replace(/ · /,": "):String(c||"").replace(/-/g," ");};
const lgSlug=p=>p.replace(/^libros?\//,"").replace(/^libro-/,"")||"libros";
let lgTocado=false;
function lgSugerir(){const d=new Date();return lgSlug($("lgDest").value)+"-"+MES[d.getMonth()]+String(d.getDate()).padStart(2,"0");}
function lgArmar(){const [f,m]=$("lgMedio").value.split("|");const camp=slug($("lgNom").value)||lgSugerir();
  const u="https://edgarboone.com/"+$("lgDest").value+"?utm_source="+f+"&utm_medium="+m+"&utm_campaign="+camp;$("lgUrl").textContent=u;return{u,camp,f,m};}
function renderLigas(){
  const s=$("lgDest");if(s.options.length)return;
  const g1=document.createElement("optgroup");g1.label="Un libro";LIBROS.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;g1.appendChild(o);});
  const g2=document.createElement("optgroup");g2.label="Serie o catálogo";SERIES.forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;g2.appendChild(o);});
  s.appendChild(g1);s.appendChild(g2);$("lgNom").value=lgSugerir();lgArmar();
  s.addEventListener("change",()=>{if(!lgTocado)$("lgNom").value=lgSugerir();lgArmar();});
  $("lgMedio").addEventListener("change",lgArmar);$("lgNom").addEventListener("input",()=>{lgTocado=true;lgArmar();});
  $("lgCopy").addEventListener("click",async()=>{
    const {u,camp,f,m}=lgArmar();
    try{await navigator.clipboard.writeText(u);}catch(e){}
    const rep=D.campanas.some(c=>c.campana===camp);
    $("lgMsg").innerHTML=rep?"<b>Copiada.</b> Ojo: ya usaste el nombre <i>"+esc(camp)+"</i>. Si es otra pieza, cámbialo o se mezclan.":"<b>Copiada.</b> Pégala en el sticker de la story o en la bio. Los datos llegan en cuanto alguien la toque.";
    await q(sb.from("campanas").upsert({campana:camp,destino:$("lgDest").value,fuente:f,medio:m,libro:$("lgDest").selectedOptions[0].text,liga:u},{onConflict:"campana"}));
    D.campanas.unshift({campana:camp});
  });
}


/* ═══════════ planear ═══════════ */
const tc=()=>+(D.cfg&&D.cfg.tc)||17;
const usd=p=>p.monto_usd!=null&&p.monto_usd!==""?+p.monto_usd:(+p.monto_mxn||0)/tc();
async function guardarCfg(){await q(sb.from("cos_dashboard").upsert({id:"config",data:D.cfg,updated_at:new Date().toISOString()}));}
$("tc").addEventListener("change",debounce(async()=>{D.cfg.tc=parseFloat($("tc").value)||17;await guardarCfg();renderPlanear();},300));
function celda(o,k,opts){
  const i=document.createElement("input");i.className="in bare"+(opts.num?" num":"");
  i.value=o[k]==null?"":(opts.num?Math.round(+o[k]).toLocaleString("en-US"):o[k]);
  if(opts.num)i.inputMode="decimal";if(opts.date){i.type="date";i.value=o[k]||"";}
  i.placeholder=opts.ph||"";i.setAttribute("aria-label",opts.ph||k);
  const aplicaC=()=>{o[k]=opts.num?(i.value===""?null:(parseFloat(String(i.value).replace(/[^0-9.\-]/g,""))||0)):(i.value||null);o.updated_at=new Date().toISOString();};
  const subeC=async()=>{await q(sb.from("cos_planeacion").upsert(o));};
  if(!opts.date)escribible(i,aplicaC,subeC);
  i.addEventListener("change",async()=>{aplicaC();await subeC();renderPlanear();renderAtencion();});
  return i;
}
function tablaPlan(items,tipo,pk){
  const t=document.createElement("table");t.className="tbl plan";
  t.innerHTML='<tr><th>'+(tipo==="entrada"?"Con qué se paga":"Lo que sale")+'</th><th>Cuándo</th><th class="num">Pesos</th><th class="num">Dólares</th><th class="num">En USD</th><th>Listo</th><th></th></tr>';
  let tot=0;
  items.forEach(p=>{
    const tr=document.createElement("tr");if(p.hecho)tr.style.opacity=".5";
    const c=(el,cls)=>{const td=document.createElement("td");if(cls)td.className=cls;td.appendChild(el);tr.appendChild(td);};
    c(celda(p,"nombre",{ph:"Qué"}));c(celda(p,"inicio",{date:true}));c(celda(p,"monto_mxn",{num:true,ph:"—"}),"num");c(celda(p,"monto_usd",{num:true,ph:"—"}),"num");
    const u=document.createElement("b");u.textContent=money(usd(p));c(u,"num");
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=!!p.hecho;cb.style.accentColor=css("--gold-deep");
    cb.addEventListener("change",async()=>{p.hecho=cb.checked;await q(sb.from("cos_planeacion").upsert(p));renderPlanear();renderAtencion();});c(cb);
    const x=document.createElement("button");x.className="btn ghost";x.textContent="×";x.title="Quitar";
    x.addEventListener("click",async()=>{if(!confirm("¿Quitar «"+(p.nombre||"")+"»?"))return;await q(sb.from("cos_planeacion").delete().eq("id",p.id));D.plan=D.plan.filter(z=>z.id!==p.id);renderPlanear();});c(x);
    t.appendChild(tr);if(!p.hecho)tot+=usd(p);
  });
  const tr=document.createElement("tr");tr.className="totalr";
  tr.innerHTML='<td>Total</td><td></td><td class="num">'+(items.filter(p=>!p.hecho).reduce((a,p)=>a+(+p.monto_mxn||0),0)?Math.round(items.filter(p=>!p.hecho).reduce((a,p)=>a+(+p.monto_mxn||0),0)).toLocaleString("en-US"):"")+'</td><td class="num">'+(items.filter(p=>!p.hecho).reduce((a,p)=>a+(+p.monto_usd||0),0)?Math.round(items.filter(p=>!p.hecho).reduce((a,p)=>a+(+p.monto_usd||0),0)).toLocaleString("en-US"):"")+'</td><td class="num">'+money(tot)+'</td><td colspan="2"><button class="btn ghost" data-add="'+tipo+'">+ '+(tipo==="entrada"?"entrada":"gasto")+'</button></td>';
  t.appendChild(tr);
  const wrap=document.createElement("div");wrap.style.overflowX="auto";wrap.appendChild(t);wrap.querySelector("[data-add]").addEventListener("click",()=>addPlanItem(pk,tipo));
  return{wrap,tot};
}
function renderPlanear(){
  $("tc").value=tc();
  const nombres=(D.cfg&&D.cfg.planes)||{};
  const planes=Object.keys(nombres);D.plan.forEach(p=>{if(!planes.includes(p.plan))planes.push(p.plan);});
  const box=$("planes");box.innerHTML="";
  let TS=0,TE=0;
  planes.forEach(pk=>{
    const items=D.plan.filter(p=>p.plan===pk);
    const ord=(a,b)=>(a.hecho-b.hecho)||(a.orden-b.orden);
    const ent=items.filter(p=>p.tipo==="entrada").sort(ord),sal=items.filter(p=>p.tipo==="salida").sort(ord);
    const panel=document.createElement("div");panel.className="panel";
    const head=document.createElement("div");head.className="flex";head.style.marginBottom="10px";
    head.innerHTML='<div><input class="in bare" data-plan="'+esc(pk)+'" value="'+esc(nombres[pk]||pk)+'" style="font-family:var(--disp);font-size:25px;font-weight:700;color:#142039;padding:0;border:0;min-width:260px"><div class="src" style="margin-bottom:0">Igual que en tu Excel: ingresos, gastos, sobra o falta</div></div><div class="spacer"></div><div style="text-align:right"><div class="lg">Sobra / falta</div><div class="pnet" style="font-family:var(--disp);font-size:30px;font-weight:600;line-height:1.1"></div></div>';
    panel.appendChild(head);
    const E=tablaPlan(ent,"entrada",pk),S=tablaPlan(sal,"salida",pk);
    panel.appendChild(E.wrap);const sp=document.createElement("div");sp.style.height="14px";panel.appendChild(sp);panel.appendChild(S.wrap);
    const net=E.tot-S.tot;TS+=S.tot;TE+=E.tot;
    const pn=head.querySelector(".pnet");pn.textContent=money(net);pn.style.color=net>=0?css("--good"):css("--bad");
    const foot=document.createElement("div");foot.className="flex";foot.style.marginTop="10px";
    foot.innerHTML='<span class="small">Marca «listo» cuando ya entró o ya se pagó; deja de contar.</span><span class="spacer"></span><button class="btn ghost" data-del="1">quitar plan</button>';
    panel.appendChild(foot);
    const inPlan=head.querySelector("[data-plan]");
    escribible(inPlan,()=>{D.cfg.planes=Object.assign({},nombres,{[pk]:inPlan.value});},guardarCfg);
    inPlan.addEventListener("change",async e=>{D.cfg.planes=Object.assign({},nombres,{[pk]:e.target.value});await guardarCfg();});
    foot.querySelector("[data-del]").addEventListener("click",async()=>{if(!confirm("¿Quitar el plan «"+(nombres[pk]||pk)+"» con todo lo que tiene?"))return;
      await q(sb.from("cos_planeacion").delete().eq("plan",pk));D.plan=D.plan.filter(x=>x.plan!==pk);delete D.cfg.planes[pk];await guardarCfg();renderPlanear();});
    box.appendChild(panel);
  });
  $("pSal").textContent=money(TS);$("pEnt").textContent=money(TE);
  const n=$("pNet");n.textContent=money(TE-TS);n.className="v "+(TE-TS>=0?"good":"bad");
}
async function addPlanItem(pk,tipo){
  const o={id:pk+"-"+(tipo==="salida"?"s-":"e-")+Date.now().toString(36),plan:pk,tipo,nombre:"",inicio:null,monto_usd:null,monto_mxn:null,fuente:null,hecho:false,orden:900};
  await q(sb.from("cos_planeacion").insert(o));D.plan.push(o);renderPlanear();
  const inputs=$("planes").querySelectorAll('input.in[placeholder="Qué"]');let last=null;inputs.forEach(i=>{if(i.value==="")last=i;});if(last)last.focus();
}
$("addPlan").addEventListener("click",async()=>{const pk="p"+Date.now().toString(36);D.cfg.planes=Object.assign({},D.cfg.planes||{},{[pk]:"Nuevo plan"});await guardarCfg();renderPlanear();});


/* ═══════════ plataforma ═══════════ */
const GRUPO={paga_activo:"Paga y entra",paga_dormido:"Paga, no entra",acceso_activo:"Acceso y entra",acceso_dormido:"Acceso, no entra",solo_registro:"Solo registro",equipo:"Equipo"};
function miniLinea(id,pts,color,fmt){
  const svg=$(id);svg.innerHTML="";if(!pts.length){svg.style.display="none";return;}svg.style.display="";
  const H=160,W=dims(svg,H),pt=22,pb=26,pd=36,n=pts.length,iw=n>1?(W-pd*2)/(n-1):0;
  const vals=pts.map(p=>p.v);const mx=Math.max.apply(null,vals.concat([1]))*1.15,mn=0;
  const y=v=>pt+(mx-v)/(mx-mn)*(H-pt-pb);
  const line=css("--line"),muted=css("--muted");
  svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y(0),y2:y(0),stroke:line}));
  const X=i=>n>1?pd+iw*i:W/2;let d="";pts.forEach((p,i)=>{d+=(i?"L":"M")+X(i)+","+y(p.v);});
  if(n>1)svg.appendChild(el("path",{d,fill:"none",stroke:color,"stroke-width":2.2}));
  pts.forEach((p,i)=>{const x=X(i);const c=el("circle",{cx:x,cy:y(p.v),r:n>30?2.5:4,fill:color});hov(c,fdate(p.f)+" · "+fmt(p.v));svg.appendChild(c);
    if(i===0||i===n-1||(n>8&&i%Math.ceil(n/6)===0)){const t=el("text",{x,y:H-8,"text-anchor":i===0?"start":i===n-1?"end":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=fdate(p.f);svg.appendChild(t);}});
  const last=pts[n-1];const v=el("text",{x:X(n-1),y:y(last.v)-10,"text-anchor":n>1?"end":"middle","font-size":FS(),fill:color,"font-family":"EB Garamond,serif"});v.textContent=fmt(last.v);svg.appendChild(v);
}
function renderPlataforma(){
  const M=D.metricas.slice().sort((a,b)=>a.fecha<b.fecha?-1:1);const mUlt=M[M.length-1]||{},mMrr=M.slice().reverse().find(x=>x.mrr!=null)||{};const m=Object.assign({},mUlt,{mrr:mMrr.mrr,suscripciones:mMrr.suscripciones});
  const P=(D.plat&&D.plat.personas)||[];
  const sus=m.suscripciones!=null?m.suscripciones:P.filter(p=>p.subscription_plan).length;
  $("qSus").textContent=sus;const m7s=M.find(x=>x.fecha>=new Date(Date.now()-7*864e5).toISOString().slice(0,10))||M[0]||{};
  $("qSusN").textContent=(m.mrr!=null?money(m.mrr)+" al mes":"MRR")+((m7s.suscripciones!=null&&m.suscripciones!=null&&M.length>1)?" · "+(m.suscripciones-m7s.suscripciones>=0?"+":"")+(m.suscripciones-m7s.suscripciones)+" esta semana":"");
  const acc=P.filter(p=>p.grupo!=="solo_registro"&&p.grupo!=="equipo");
  $("qAcc").textContent=acc.length;$("qAccN").textContent=acc.filter(p=>p.hechas>0).length+" han tomado clase";
  $("qReg").textContent=P.filter(p=>p.grupo==="solo_registro").length;
  const cla=m.clases_completadas!=null?m.clases_completadas:P.reduce((t,p)=>t+(+p.hechas||0),0);
  $("qCla").textContent=cla;const m7=M.find(x=>x.fecha>=new Date(Date.now()-7*864e5).toISOString().slice(0,10))||M[0]||{};
  $("qClaN").textContent=(m7.clases_completadas!=null&&m.clases_completadas!=null)?"+"+(m.clases_completadas-m7.clases_completadas)+" esta semana":"en total";
  const ptsS=M.filter(x=>x.suscripciones!=null).map(x=>({f:x.fecha,v:+x.suscripciones})),ptsC=M.filter(x=>x.clases_completadas!=null).map(x=>({f:x.fecha,v:+x.clases_completadas}));
  miniLinea("qSvg1",ptsS,css("--c2"),v=>v+" suscripciones");miniLinea("qSvg2",ptsC,css("--c1"),v=>v+" clases");
  $("qSusHoy").textContent=sus;$("qClaHoy").textContent=cla;
  $("qHistSrc").textContent="Foto diaria · "+M.length+" días registrados"+(M.length?" desde el "+fdate(M[0].fecha):"");
  const first=M[0]||{};
  $("qHistRead").innerHTML=M.length>1?"Del "+fdate(first.fecha)+" a hoy: suscripciones "+(first.suscripciones??"—")+" → <b>"+sus+"</b>, clases completadas "+(first.clases_completadas??"—")+" → <b>"+cla+"</b>. Cada día que corre la foto, esta línea se alarga.":"El historial empieza a construirse con la foto diaria.";
  /* personas */
  const ord={paga_activo:0,paga_dormido:1,acceso_activo:2,acceso_dormido:3,solo_registro:4,equipo:5};
  const Ps=P.slice().sort((a,b)=>(ord[a.grupo]-ord[b.grupo])||((b.hechas||0)-(a.hechas||0)));
  $("qPerSrc").textContent=P.length+" personas · clases hechas · última vez"+(D.platAt?" · leído "+fdate(String(D.platAt).slice(0,10)):"");
  $("qPersonas").innerHTML=Ps.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Quién</th><th>Estado</th><th class="num">Clases</th><th class="num">Aperturas</th><th>Última vez</th></tr>'+
    Ps.map(p=>"<tr><td class='who'>"+esc(p.full_name||p.email||"—")+"</td><td><span class='pill "+(p.grupo==="paga_activo"||p.grupo==="acceso_activo"?"ok":p.grupo==="paga_dormido"?"bad":p.grupo==="acceso_dormido"?"warn":"off")+"'>"+esc(GRUPO[p.grupo]||p.grupo)+"</span></td><td class='num'>"+(p.hechas||0)+"</td><td class='num'>"+(p.abiertas||0)+"</td><td>"+(p.ultima?fdate(p.ultima):"nunca")+"</td></tr>").join("")+"</table></div>":'<div class="note">Sin datos de la plataforma todavía.</div>';
  /* uso semanal */
  const U=(D.plat&&D.plat.uso)||[];const svg=$("qSvg3");svg.innerHTML="";svg.style.display=U.length?"":"none";
  if(U.length){const H=170,W=dims(svg,H),pt=24,pb=28,pd=20,iw=(W-pd*2)/U.length;const mx=Math.max.apply(null,U.map(u=>+u.aperturas).concat([1]))*1.15;const y=v=>pt+(mx-v)/mx*(H-pt-pb);
    const c1=css("--c1"),line=css("--line"),muted=css("--muted");svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y(0),y2:y(0),stroke:line}));
    U.forEach((u,i)=>{const x=pd+iw*i;const b=el("rect",{x:x+iw*0.2,y:y(+u.aperturas),width:iw*0.6,height:Math.max(2,y(0)-y(+u.aperturas)),fill:c1,rx:2});hov(b,"semana del "+fdate(u.semana)+" · "+u.aperturas+" clases abiertas · "+u.personas+" personas");svg.appendChild(b);
      const t=el("text",{x:x+iw/2,y:y(+u.aperturas)-6,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=u.aperturas;svg.appendChild(t);
      const t2=el("text",{x:x+iw/2,y:H-8,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t2.textContent=fdate(u.semana);svg.appendChild(t2);});
    const ult=U[U.length-1];$("qUsoRead").innerHTML="La última semana: <b>"+ult.aperturas+" clases abiertas por "+ult.personas+" persona"+(ult.personas==1?"":"s")+"</b>. Lo que importa no es cuántos tienen acceso sino cuántos entran cada semana.";}
  else $("qUsoRead").textContent="Sin uso registrado todavía.";
}

/* ═══════════ libros ═══════════ */
const norm=t=>String(t||"").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
/* un solo nombre por libro, aunque Amazon y Apple lo escriban distinto */
function canon(t){const p=norm(t).split(":").map(x=>x.trim());const h=p[0],sub=p[1]||"";
  if(h==="THE WAY"){if(/^PAREJAS/.test(sub))return "THE WAY: Parejas";if(/^HIJOS/.test(sub))return "THE WAY: Hijos";if(/^PADRES/.test(sub))return "THE WAY: Padres";
    if(/^EMPRENDER/.test(sub))return "THE WAY: Emprender";if(/DIRIGIR|EMPRESA/.test(sub))return "LIDERA";return "THE WAY";}
  if(h==="DESPUES")return "DESPUÉS";if(h==="THE WAY OF THE WORLD")return "THE WAY OF THE WORLD";
  return h;}
const clave=canon,nombreCorto=canon;
function renderLibros(){
  const V=D.ventas.filter(v=>!/^W/.test(String(v.periodo||"")));const VW=D.ventas.filter(v=>/^W/.test(String(v.periodo||"")));const kdp=V.filter(v=>v.fuente==="kdp"),ap=V.filter(v=>v.fuente==="apple"),ar=V.filter(v=>v.fuente==="authors_republic");
  const uK=kdp.reduce((t,v)=>t+ +v.unidades,0),uA=ap.reduce((t,v)=>t+ +v.unidades,0),uR=ar.reduce((t,v)=>t+ +v.unidades,0);
  $("lTot").textContent=(uK+uA+uR).toLocaleString("en-US");$("lTotN").textContent="Amazon "+uK+" · Apple "+uA+" · Audio "+uR;
  const regTot=Object.values(D.regalias).reduce((t,v)=>t+v,0);$("lReg").textContent=money(regTot);
  const porMes={};kdp.forEach(v=>{if(/^\d{4}-\d{2}$/.test(v.periodo))porMes[v.periodo]=(porMes[v.periodo]||{u:0,e:0,p:0,h:0});
    const m=porMes[v.periodo];if(!m)return;m.u+=+v.unidades;m.e+=+v.ebook;m.p+=+v.paperback;m.h+=+v.hardcover;});
  const meses=Object.keys(Object.assign({},porMes,D.regalias)).filter(k=>/^\d{4}-\d{2}$/.test(k)).sort();
  let mejor=null;meses.forEach(m=>{if(porMes[m]&&(!mejor||porMes[m].u>porMes[mejor].u))mejor=m;});
  /* semana */
  const sem={};VW.forEach(v=>{const k=v.periodo.slice(1);sem[k]=sem[k]||{k:0,a:0,r:0,u:0};sem[k].u+=+v.unidades;if(v.fuente==="kdp")sem[k].k+=+v.unidades;else if(v.fuente==="apple")sem[k].a+=+v.unidades;else sem[k].r+=+v.unidades;});
  const semK=Object.keys(sem).sort();
  if(semK.length){const u=sem[semK[semK.length-1]],pv=semK.length>1?sem[semK[semK.length-2]]:null;
    $("lMejor").textContent=u.u;$("lMejorN").textContent="semana al "+fdate(semK[semK.length-1])+(pv?" · antes "+pv.u:"");}
  else{$("lMejor").textContent="—";$("lMejorN").textContent="la trae la tarea del sábado";}
  $("semTabla").innerHTML=semK.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Semana al</th><th class="num">Amazon</th><th class="num">Apple</th><th class="num">Audio</th><th class="num">Total</th></tr>'+
    semK.slice(-12).reverse().map(k=>"<tr><td class='who'>"+fdate(k)+"</td><td class='num'>"+sem[k].k+"</td><td class='num'>"+sem[k].a+"</td><td class='num'>"+sem[k].r+"</td><td class='num'><b>"+sem[k].u+"</b></td></tr>").join("")+"</table></div>":'<div class="note" style="margin:0">Cada sábado la tarea de libros guarda la semana. Aquí se va acumulando.</div>';
  const porTit={};V.forEach(v=>{const k=clave(v.titulo);
    if(!porTit[k])porTit[k]={t:k,u:0,e:0,p:0,h:0,k:0,a:0,r:0};const o=porTit[k];
    o.u+=+v.unidades;o.e+=+v.ebook;o.p+=+v.paperback;o.h+=+v.hardcover;
    if(v.fuente==="kdp")o.k+=+v.unidades;else if(v.fuente==="apple")o.a+=+v.unidades;else o.r+=+v.unidades;});
  const tits=Object.values(porTit).filter(o=>o.u>0).sort((a,b)=>b.u-a.u);
  $("lTit").textContent=tits.length;
  /* gráfica */
  const svg=$("libSvg");svg.innerHTML="";
  const H=220,W=dims(svg,H),pt=22,pb=30,pd=46,n=meses.length||1,iw=(W-pd*2)/n;
  const mxU=Math.max.apply(null,meses.map(m=>porMes[m]?porMes[m].u:0).concat([1]))*1.15;
  const mxR=Math.max.apply(null,meses.map(m=>D.regalias[m]||0).concat([1]))*1.15;
  const y=v=>pt+(mxU-v)/mxU*(H-pt-pb),yr=v=>pt+(mxR-v)/mxR*(H-pt-pb);
  const c1=css("--c1"),c2=css("--c2"),line=css("--line"),muted=css("--muted");
  svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y(0),y2:y(0),stroke:line}));
  let d="";
  meses.forEach((m,i)=>{const x=pd+iw*i+iw/2,u=porMes[m]?porMes[m].u:0,r=D.regalias[m]||0;
    const b=el("rect",{x:x-iw*0.26,y:y(u),width:iw*0.52,height:Math.max(u?3:1,y(0)-y(u)),fill:u?c1:line,rx:3});
    hov(b,mesLbl(m)+" · "+u+" unidades"+(porMes[m]?" ("+porMes[m].e+" ebook, "+porMes[m].p+" impreso, "+porMes[m].h+" pasta dura)":""));svg.appendChild(b);
    if(u){const t=el("text",{x,y:y(u)-7,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=u;svg.appendChild(t);}
    d+=(i?"L":"M")+x+","+yr(r);
    const t2=el("text",{x,y:H-9,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t2.textContent=mesLbl(m);svg.appendChild(t2);
  });
  svg.appendChild(el("path",{d,fill:"none",stroke:c2,"stroke-width":2,"stroke-dasharray":"5 4"}));
  meses.forEach((m,i)=>{const x=pd+iw*i+iw/2,r=D.regalias[m]||0;const c=el("circle",{cx:x,cy:yr(r),r:4,fill:c2});hov(c,mesLbl(m)+" · cobrado "+money(r));svg.appendChild(c);});
  /* tabla */
  let tU=0,tR=0;
  $("ganTabla").innerHTML='<div style="overflow-x:auto"><table class="tbl"><tr><th>Mes</th><th class="num">Unidades</th><th class="num">Cobrado</th><th class="num">Por unidad</th></tr>'+
    meses.map(m=>{const u=porMes[m]?porMes[m].u:0,r=D.regalias[m]||0;tU+=u;tR+=r;
      return "<tr><td>"+mesLbl(m)+"</td><td class='num'>"+(u||"—")+"</td><td class='num'>"+(r?money(r):"—")+"</td><td class='num'>"+(u&&r?money(r/u):"—")+"</td></tr>";}).join("")+
    "<tr style='border-top:2px solid var(--hair)'><td><b>2026</b></td><td class='num'><b>"+tU+"</b></td><td class='num'><b>"+money(tR)+"</b></td><td class='num'><b>"+(tU?money(tR/tU):"—")+"</b></td></tr></table></div>";
  $("libRead").innerHTML="<b>"+money(tR)+" cobrados por "+tU+" unidades en Amazon.</b> Cada renglón es dinero que <i>entró al banco</i> ese mes, no lo vendido: Amazon paga con dos meses de retraso, así que los últimos meses aún no están cobrados. Las copias de autor no aparecen aquí — KDP no las reporta — así que todo esto son ventas reales.";
  $("titulos").innerHTML=tits.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Título</th><th class="num">Uds</th><th class="num">Amazon</th><th class="num">Apple</th><th class="num">Audio</th></tr>'+
    tits.map(o=>"<tr><td class='who'>"+esc(o.t)+"</td><td class='num'><b>"+o.u+"</b></td><td class='num'>"+o.k+"</td><td class='num'>"+o.a+"</td><td class='num'>"+o.r+"</td></tr>").join("")+"</table></div>":'<div class="note">Sin ventas registradas.</div>';
  renderLibDetalle(Object.keys(porTit).sort());
  const E=kdp.reduce((t,v)=>t+ +v.ebook,0),P=kdp.reduce((t,v)=>t+ +v.paperback,0),Hh=kdp.reduce((t,v)=>t+ +v.hardcover,0);
  const tot=E+P+Hh+uA+uR||1;
  const barra=(l,v,c)=>'<div class="row"><span class="nm">'+l+'</span><span style="flex:0 0 42%;height:8px;background:var(--surface2);border-radius:2px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(v/tot*100)+'%;background:'+c+'"></span></span><span class="amt">'+v+"</span></div>";
  $("formatosLib").innerHTML=barra("Ebook · Amazon",E,c1)+barra("Ebook · Apple",uA,c2)+barra("Impreso",P,c1)+barra("Pasta dura",Hh,c1)+barra("Audiolibro · Authors Republic",uR,c2);
  $("formatosLibRead").innerHTML="Pasta dura pesa por mayo: "+Hh+" unidades, casi todas de un solo comprador que se llevó la colección completa. Fuera de eso, el ebook manda."+(uR?"":" Los audiolibros todavía no registran ventas en Authors Republic.");
}

function renderLibDetalle(titulos){
  const sel=$("libSel");if(sel.options.length<=1)titulos.forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t;sel.appendChild(o);});
  const f=sel.value;const V=D.ventas.filter(v=>!/^W/.test(String(v.periodo||""))&&(!f||clave(v.titulo)===f));
  const meses={};V.forEach(v=>{const m=/^\d{4}-\d{2}$/.test(v.periodo)?v.periodo:"2026 · sin mes";
    const o=meses[m]=meses[m]||{e:0,p:0,h:0,a:0,r:0,u:0};
    if(v.fuente==="kdp"){o.e+=+v.ebook;o.p+=+v.paperback;o.h+=+v.hardcover;}else if(v.fuente==="apple")o.a+=+v.unidades;else o.r+=+v.unidades;o.u+=+v.unidades;});
  const ks=Object.keys(meses).sort();const T={e:0,p:0,h:0,a:0,r:0,u:0};
  $("libDetalle").innerHTML=ks.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Mes</th><th class="num">Amazon ebook</th><th class="num">Amazon impreso</th><th class="num">Amazon pasta dura</th><th class="num">Apple ebook</th><th class="num">Audiolibro</th><th class="num">Total</th></tr>'+
    ks.map(k=>{const o=meses[k];for(const x in T)T[x]+=o[x];return "<tr><td class='who'>"+(/^\d{4}-\d{2}$/.test(k)?mesLbl(k):k)+"</td><td class='num'>"+(o.e||"—")+"</td><td class='num'>"+(o.p||"—")+"</td><td class='num'>"+(o.h||"—")+"</td><td class='num'>"+(o.a||"—")+"</td><td class='num'>"+(o.r||"—")+"</td><td class='num'><b>"+o.u+"</b></td></tr>";}).join("")+
    "<tr style='border-top:2px solid var(--hair)'><td><b>Total</b></td><td class='num'><b>"+T.e+"</b></td><td class='num'><b>"+T.p+"</b></td><td class='num'><b>"+T.h+"</b></td><td class='num'><b>"+T.a+"</b></td><td class='num'><b>"+T.r+"</b></td><td class='num'><b>"+T.u+"</b></td></tr></table></div>"+
    '<div class="note small">Apple reporta el año completo, no por mes: aparece en «sin mes».</div>':'<div class="note">Sin ventas.</div>';
}
$("libSel").addEventListener("change",()=>renderLibDetalle([]));
let rz;window.addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(!$("app").classList.contains("hidden")){renderPV();renderLibros();renderSalud();}},200);});
arranque();
