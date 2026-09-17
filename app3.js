/* ═══════════ salud ═══════════ */
const n1=v=>v==null?"—":(Math.round(+v*10)/10).toLocaleString("en-US");
const hrs=h=>{if(h==null)return "—";const H=Math.floor(h),M=Math.round((h-H)*60);return H+"h"+(M?" "+String(M).padStart(2,"0"):"");};
const ftime=s=>{const d=new Date(s);return isNaN(d)?"—":d.toLocaleTimeString("es-MX",{hour:"numeric",minute:"2-digit"});};
const fdt=s=>{const d=new Date(s);return isNaN(d)?"—":d.getDate()+" "+MES[d.getMonth()]+" · "+ftime(s);};
/* línea con rango propio (no desde cero): peso, pulso */
function lineaRango(svg,series,H,fmt){
  svg.innerHTML="";const pts=series.flatMap(s=>s.pts);if(!pts.length){svg.style.display="none";return;}svg.style.display="";
  const W=dims(svg,H),pt=22,pb=26,pd=36;
  const vals=pts.map(p=>p.v);let mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);const pad=(mx-mn)||1;mn-=pad*.25;mx+=pad*.25;
  const fechas=[...new Set(pts.map(p=>p.f))].sort();const n=fechas.length;const X=f=>{const i=fechas.indexOf(f);return n>1?pd+(W-pd*2)*i/(n-1):W/2;};
  const y=v=>pt+(mx-v)/(mx-mn)*(H-pt-pb);
  const line=css("--line"),muted=css("--muted");
  svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:H-pb,y2:H-pb,stroke:line}));
  series.forEach(s=>{if(!s.pts.length)return;let d="";s.pts.forEach((p,i)=>{d+=(i?"L":"M")+X(p.f)+","+y(p.v);});
    if(s.pts.length>1)svg.appendChild(el("path",{d,fill:"none",stroke:s.color,"stroke-width":2.2}));
    s.pts.forEach(p=>{const c=el("circle",{cx:X(p.f),cy:y(p.v),r:s.pts.length>30?2.5:4,fill:s.color});hov(c,fdate(p.f)+" · "+fmt(p.v,s));svg.appendChild(c);});
    const l=s.pts[s.pts.length-1];const t=el("text",{x:X(l.f),y:y(l.v)-10,"text-anchor":n>1?"end":"middle","font-size":FS(),fill:s.color,"font-family":"EB Garamond,serif"});t.textContent=fmt(l.v,s);svg.appendChild(t);});
  fechas.forEach((f,i)=>{if(i===0||i===n-1||(n>8&&i%Math.ceil(n/6)===0)){const t=el("text",{x:X(f),y:H-8,"text-anchor":i===0?"start":i===n-1?"end":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=fdate(f);svg.appendChild(t);}});
}
function barrasSueno(svg,rows){
  svg.innerHTML="";const R=rows.filter(r=>r.sueno_h!=null);if(!R.length){svg.style.display="none";return;}svg.style.display="";
  const H=150,W=dims(svg,H),pt=22,pb=26,pd=20,iw=(W-pd*2)/R.length,mx=Math.max(9,Math.max.apply(null,R.map(r=>+r.sueno_h)))*1.1;
  const y=v=>pt+(mx-v)/mx*(H-pt-pb);const c2=css("--c2"),c1=css("--c1"),line=css("--line"),muted=css("--muted");
  svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y(0),y2:y(0),stroke:line}));
  const y7=y(7);svg.appendChild(el("line",{x1:pd,x2:W-pd,y1:y7,y2:y7,stroke:c1,"stroke-dasharray":"4 4",opacity:.6}));
  R.forEach((r,i)=>{const x=pd+iw*i,v=+r.sueno_h;const b=el("rect",{x:x+iw*.2,y:y(v),width:iw*.6,height:Math.max(2,y(0)-y(v)),fill:v>=7?c2:css("--bad"),rx:2,opacity:.85});
    hov(b,fdate(r.fecha)+" · "+hrs(v)+(r.sueno_profundo!=null?" · profundo "+hrs(r.sueno_profundo):"")+(r.dormir_at?" · "+ftime(r.dormir_at)+"–"+ftime(r.despertar_at):""));svg.appendChild(b);
    if(i===0||i===R.length-1||(R.length>10&&i%Math.ceil(R.length/6)===0)){const t=el("text",{x:x+iw/2,y:H-8,"text-anchor":"middle","font-size":FS(),fill:muted,"font-family":"EB Garamond,serif"});t.textContent=fdate(r.fecha);svg.appendChild(t);}});
}
const prom=(rows,k)=>{const v=rows.map(r=>r[k]).filter(x=>x!=null).map(Number);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
/* tarjetas como en la app del iPhone: valor, delta vs 7 días, sparkline 14 días */
let hUnidad="pasos";try{hUnidad=localStorage.getItem("cosUnidadPasos")||"pasos";}catch(e){}
const HU={pasos:{k:"pasos",lb:"Pasos",u:"",f:v=>Math.round(v).toLocaleString("en-US")},km:{k:"distancia_km",lb:"Distancia",u:"km",f:v=>(Math.round(v*10)/10).toFixed(1)},mi:{k:"distancia_km",lb:"Distancia",u:"mi",f:v=>(Math.round(v*0.621371*10)/10).toFixed(1)}};
function hSpark(svg,vals){svg.innerHTML="";const v=vals.filter(x=>x!=null).map(Number);if(v.length<2){svg.style.display="none";return;}svg.style.display="";
  const mn=Math.min.apply(null,v),mx=Math.max.apply(null,v),rg=(mx-mn)||1,W=140,H=26;
  const pts=vals.map((x,i)=>x==null?null:[(i/(vals.length-1))*W,H-2-((x-mn)/rg)*(H-4)]).filter(Boolean);
  const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  svg.appendChild(el("path",{d,fill:"none",stroke:css("--gold-soft"),"stroke-width":1.6}));const l=pts[pts.length-1];svg.appendChild(el("circle",{cx:l[0],cy:l[1],r:2.4,fill:css("--gold-deep")}));}
function hCard(id,S,k,fmt,up,opts){opts=opts||{};const rows=S.filter(r=>r[k]!=null);const u=rows[rows.length-1];const isoL=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");const hoy=isoL(new Date()),ayer=isoL(new Date(Date.now()-864e5));
  const V=$(id),W=$(id+"W"),Dd=$(id+"D"),Sv=$(id+"S");
  if(!u){V.textContent="—";W.textContent="";Dd.textContent="";Dd.className="d";Sv.style.display="none";return null;}
  const i=S.indexOf(u);const prev=S.slice(Math.max(0,i-7),i).map(r=>r[k]).filter(x=>x!=null).map(Number);const base=prev.length?prev.reduce((a,b)=>a+b,0)/prev.length:null;
  V.textContent=fmt(+u[k]);W.textContent=u.fecha===hoy?"hoy":u.fecha===ayer?"ayer":fdate(u.fecha);
  let cls="",txt="";
  if(base!=null){const p=Math.round((+u[k]-base)/base*100);const good=up?p>=0:p<=0;cls=Math.abs(p)<4?"":(good?"good":"bad");txt=(p>0?"▲ +":p<0?"▼ ":"= ")+Math.abs(p)+"% vs 7 días";}
  if(opts.parcial&&u.fecha===hoy){const y=S[i-1];txt="en curso · ayer "+(y&&y[k]!=null?fmt(+y[k]):"—");cls="";}
  Dd.textContent=txt;Dd.className="d "+cls;
  hSpark(Sv,S.slice(Math.max(0,i-13),i+1).map(r=>r[k]));return u;}
function renderSalud(){
  const S=D.salud;const ult=S[S.length-1];
  const hoy=new Date().toISOString().slice(0,10);
  const d7=S.filter(r=>r.fecha>=new Date(Date.now()-7*864e5).toISOString().slice(0,10)),d30=S.filter(r=>r.fecha>=new Date(Date.now()-30*864e5).toISOString().slice(0,10)),d90=S.filter(r=>r.fecha>=new Date(Date.now()-90*864e5).toISOString().slice(0,10));
  const conPeso=S.filter(r=>r.peso_kg!=null);const p=conPeso[conPeso.length-1];
  hCard("hPeso",S,"peso_kg",v=>n1(v),false);$("hPesoN").textContent=p?"kg · "+fdate(p.fecha):"kg";
  const fc=hCard("hFc",S,"fc_reposo",v=>Math.round(v),false);const fcP=prom(d30,"fc_reposo");
  $("hFcN").textContent=fc?"por minuto · base 30 días "+Math.round(fcP):"por minuto";
  const hv=hCard("hHrv",S,"hrv",v=>Math.round(v),true);const hvP=prom(d30,"hrv");
  $("hHrvN").textContent=hv?"ms · base 30 días "+Math.round(hvP):"ms · recuperación";
  /* una siesta o un sueño a medias en el día más reciente no cuenta como "la noche" */
  const S2=S.map((r,i)=>(i===S.length-1&&r.sueno_h!=null&&+r.sueno_h<3)?{...r,sueno_h:null,sueno_profundo:null,dormir_at:null}:r);
  const su=hCard("hSue",S2,"sueno_h",v=>hrs(v),true);
  $("hSueN").textContent=su?((su.sueno_profundo!=null?"profundo "+hrs(su.sueno_profundo):"")+(su.dormir_at?" · "+ftime(su.dormir_at)+"–"+ftime(su.despertar_at):"")).replace(/^ · /,""):"anoche";
  const HUc=HU[hUnidad];$("hPasL").textContent=HUc.lb;const pa=hCard("hPas",S,HUc.k,HUc.f,true,{parcial:true});$("hPasN").textContent=pa?(HUc.u||"pasos")+" · promedio 7 días "+HUc.f(prom(d7,HUc.k)||0):"";
  $("hUnits").querySelectorAll("span").forEach(sp=>{sp.classList.toggle("on",sp.dataset.u===hUnidad);sp.onclick=()=>{hUnidad=sp.dataset.u;try{localStorage.setItem("cosUnidadPasos",hUnidad);}catch(e){}renderSalud();};});
  renderLecturaSalud();
  /* gráficas */
  lineaRango($("hSvg1"),[{pts:d90.filter(r=>r.peso_kg!=null).map(r=>({f:r.fecha,v:+r.peso_kg})),color:css("--c1")}],160,v=>n1(v)+" kg");
  lineaRango($("hSvg2"),[{pts:d30.filter(r=>r.fc_reposo!=null).map(r=>({f:r.fecha,v:+r.fc_reposo})),color:css("--bad"),k:"fc"},{pts:d30.filter(r=>r.hrv!=null).map(r=>({f:r.fecha,v:+r.hrv})),color:css("--c2"),k:"hrv"}],160,(v,s)=>s.k==="fc"?Math.round(v)+" lpm":Math.round(v)+" ms HRV");
  barrasSueno($("hSvg3"),d30);
  $("hPesoHoy").textContent=p?n1(p.peso_kg)+" kg":"";$("hFcHoy").textContent=fc?Math.round(fc.fc_reposo)+" lpm"+(hv?" · "+Math.round(hv.hrv)+" ms":""):"";$("hSueHoy").textContent=su?hrs(su.sueno_h):"";
  $("hHistSrc").textContent=S.length?"Del iPhone y el reloj · "+S.length+" días · último "+fdate(ult.fecha):"Del iPhone y el reloj · todavía no llega nada";
  if(!S.length){$("hRead").innerHTML="<b>Falta conectar el iPhone.</b> Instala <i>Health Auto Export</i>, crea una automatización REST API con la dirección y la llave que te di, y elige peso, pulso, HRV, sueño, pasos y entrenamientos. Desde ese día esto se llena solo.";}
  else{const s7=prom(d7,"sueno_h"),e7=d7.reduce((t,r)=>t+ +(r.ejercicio_min||0),0),en7=d7.reduce((t,r)=>t+((r.entrenos||[]).length),0);
    $("hRead").innerHTML="Últimos 7 días: sueño promedio <b>"+hrs(s7)+"</b>, "+en7+" entrenamiento"+(en7==1?"":"s")+", "+Math.round(e7)+" minutos de ejercicio."+(s7!=null&&s7<6.5?" <b>Estás durmiendo poco</b> — el patrón sprint-agotamiento empieza ahí.":"")+(hv&&hvP&&hv.hrv<hvP*.8?" HRV por debajo de tu promedio: el cuerpo pide un día suave.":"");}
  /* tabla */
  const T=S.slice(-14).reverse();
  $("hTabla").innerHTML=T.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Día</th><th class="num">Peso</th><th class="num">Reposo</th><th class="num">HRV</th><th class="num">Sueño</th><th class="num">Pasos</th><th class="num">Ejercicio</th><th>Entreno</th></tr>'+
    T.map(r=>"<tr><td class='who nw'>"+fdate(r.fecha)+"</td><td class='num'>"+(r.peso_kg!=null?n1(r.peso_kg):"—")+"</td><td class='num'>"+(r.fc_reposo!=null?Math.round(r.fc_reposo):"—")+"</td><td class='num'>"+(r.hrv!=null?Math.round(r.hrv):"—")+"</td><td class='num'>"+hrs(r.sueno_h)+"</td><td class='num'>"+(r.pasos!=null?Math.round(r.pasos).toLocaleString("en-US"):"—")+"</td><td class='num'>"+(r.ejercicio_min!=null?Math.round(r.ejercicio_min)+" min":"—")+"</td><td>"+((r.entrenos||[]).map(e=>esc(e.tipo||"")+(e.min?" "+e.min+"′":"")).join(", ")||"—")+"</td></tr>").join("")+"</table></div>":'<div class="note" style="margin:0">Aquí aparecen los días conforme el iPhone los mande.</div>';
  renderAyuno();
}
/* lectura del Oráculo (lecturas_salud) */
let lecRango="hoy";try{lecRango=localStorage.getItem("cosRangoLectura")||"hoy";}catch(e){}
function renderLecturaSalud(){
  const L=D.lecSalud||[];const R=[["hoy","Hoy"],["3d","3 días"],["semana","Semana"],["mes","Mes"]];
  const f0=L.length?L[0].fecha:null;const del=L.filter(l=>l.fecha===f0);
  const rng=$("lecRng");rng.innerHTML=R.map(([id,lb])=>"<span data-r='"+id+"' class='"+(id===lecRango?"on":"")+"'>"+lb+"</span>").join("");
  rng.querySelectorAll("span").forEach(sp=>sp.onclick=()=>{lecRango=sp.dataset.r;try{localStorage.setItem("cosRangoLectura",lecRango);}catch(e){}renderLecturaSalud();});
  const l=del.find(x=>x.rango===lecRango);
  if(!l){$("lecTitle").textContent=L.length?"Sin lectura para este rango.":"Todavía no hay lectura.";$("lecBody").innerHTML="";$("lecSrc").textContent="Cada mañana a las 6:30";return;}
  $("lecTitle").textContent=l.titulo;$("lecBody").innerHTML=l.texto.split(/\n\s*\n/).map(t=>"<p>"+esc(t.trim())+"</p>").join("");
  $("lecSrc").textContent="Oráculo · "+fdate(l.fecha)+" · también en tu iPhone";
}
/* ayuno */
let ayTick=null;
function renderAyuno(){
  const A=D.ayunos;const abierto=A.find(a=>!a.fin);const btn=$("ayunoBtn");clearInterval(ayTick);
  const cerrados=A.filter(a=>a.fin).sort((a,b)=>a.inicio<b.inicio?1:-1);
  const pinta=()=>{if(!abierto)return;const h=(Date.now()-new Date(abierto.inicio))/36e5;$("ayunoEstado").textContent="Ayunando · "+hrs(h);$("ayunoEstado").style.color=h>=16?css("--good"):css("--ink");};
  if(abierto){btn.textContent="Romper ayuno";btn.classList.remove("ghost");pinta();ayTick=setInterval(pinta,60000);
    $("ayunoSrc").textContent="Desde "+fdt(abierto.inicio);
    $("ayunoEdit").innerHTML='<span>Empezó a las</span><input class="in bare" type="datetime-local" id="ayInicio" style="width:auto"><span class="small">corrige si lo abriste tarde</span>';
    const inp=$("ayInicio");const d=new Date(abierto.inicio);inp.value=new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
    inp.addEventListener("change",async()=>{let d=new Date(inp.value);if(isNaN(d))return;
      /* el selector del telefono a veces cambia el dia al mover la hora: un inicio en el futuro se recorre al dia anterior */
      while(d.getTime()>Date.now())d=new Date(d.getTime()-864e5);
      abierto.inicio=d.toISOString();await q(sb.from("ayunos").update({inicio:abierto.inicio}).eq("id",abierto.id));renderAyuno();});}
  else{btn.textContent="Empezar ayuno";const u=cerrados[0];
    $("ayunoEstado").textContent=u?"Sin ayuno abierto · último "+hrs(u.horas):"Sin ayuno abierto";$("ayunoEstado").style.color="";
    $("ayunoSrc").textContent=u?"Rompiste el último "+fdt(u.fin):"Un toque al empezar, otro al romper";$("ayunoEdit").innerHTML="";}
  const ini=new Date(new Date().getFullYear(),0,1).toISOString();
  const largos=cerrados.filter(a=>a.horas>=36&&a.inicio>=ini).length;
  const s7=cerrados.filter(a=>a.fin>=new Date(Date.now()-7*864e5).toISOString());const p7=s7.length?s7.reduce((t,a)=>t+ +a.horas,0)/s7.length:null;
  $("ayunosTabla").innerHTML=cerrados.length?'<div style="overflow-x:auto"><table class="tbl"><tr><th>Empezó</th><th>Rompió</th><th class="num">Horas</th><th></th></tr>'+
    cerrados.slice(0,10).map(a=>"<tr><td class='who nw'>"+fdt(a.inicio)+"</td><td class='nw'>"+fdt(a.fin)+"</td><td class='num'><b>"+hrs(a.horas)+"</b>"+(a.horas>=36?" <span class='pill si'>largo</span>":"")+"</td><td class='num'><button class='btn ghost' data-ayx='"+esc(a.id)+"' style='padding:3px 7px'>×</button></td></tr>").join("")+"</table></div>":"";
  $("ayunoRead").innerHTML=cerrados.length?"Promedio de la semana: <b>"+hrs(p7)+"</b>"+(p7!=null&&p7<16?" — por debajo de tu 16:8.":".")+" Ayunos largos (36 h o más) este año: <b>"+largos+"</b>.":"Zero se queda con tus ayunos adentro; aquí quedan en tu propio registro y se cruzan con peso, pulso y sueño.";
  $("ayunosTabla").querySelectorAll("[data-ayx]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("¿Borrar este ayuno?"))return;await q(sb.from("ayunos").delete().eq("id",b.dataset.ayx));D.ayunos=D.ayunos.filter(a=>a.id!==b.dataset.ayx);renderAyuno();}));
}
$("ayunoBtn").addEventListener("click",async()=>{
  const abierto=D.ayunos.find(a=>!a.fin);
  if(abierto){abierto.fin=new Date().toISOString();await q(sb.from("ayunos").update({fin:abierto.fin}).eq("id",abierto.id));
    const r=await q(sb.from("ayunos").select("*").eq("id",abierto.id).maybeSingle());if(r)Object.assign(abierto,r);}
  else{const a={id:"ay-"+Date.now().toString(36),inicio:new Date().toISOString(),fin:null};await q(sb.from("ayunos").insert(a));D.ayunos.unshift(a);}
  renderAyuno();renderAtencion();
});

/* ═══════════ follow up · Clari ═══════════ */
const CANAL={"Clari Business":"Business","Clari Cordero":"Cordero"};
const CEST=["Not started","In progress","Done"];
const CESTL={"Not started":"Sin empezar","In progress":"En curso","Done":"Hecho"};
function diasDesde(f){ if(!f) return null; const d=new Date(f+"T12:00:00"); if(isNaN(d)) return null;
  return Math.max(0, Math.round((Date.now()-d.getTime())/864e5)); }
const cEdad=r=>{const d=diasDesde(r.asked);return d==null?-1:d;};

function renderClari(){
  const R=(D.clari||[]);
  const abiertos=R.filter(r=>!r.hecho).sort((a,b)=>cEdad(b)-cEdad(a));
  const hechos=R.filter(r=>r.hecho).sort((a,b)=>String(b.asked||"").localeCompare(String(a.asked||"")));
  const viejos=abiertos.filter(r=>cEdad(r)>=14);
  const nuevos=abiertos.filter(r=>r.estado==="Not started");
  $("cAbi").textContent=abiertos.length;
  $("cVie").textContent=viejos.length; $("cVie").className="v"+(viejos.length?" bad":"");
  $("cNue").textContent=nuevos.length;
  $("cHec").textContent=hechos.length; $("cHec").className="v"+(hechos.length?" good":"");

  const lista=$("cLista");
  if(!abiertos.length) lista.innerHTML='<li><div class="bd"><div class="m" style="color:var(--muted);font-size:15px">Nada abierto. Todo cerrado.</div></div></li>';
  else lista.innerHTML=abiertos.map(r=>{
    const d=cEdad(r), cls=d>=14?"old":d>=7?"warm":"";
    const opts=CEST.filter(e=>e!=="Done").map(e=>'<option value="'+e+'"'+(r.estado===e?" selected":"")+'>'+CESTL[e]+'</option>').join("");
    return '<li class="'+cls+'" data-id="'+esc(r.id)+'">'
      +'<div class="age">'+(d<0?"—":d)+'<s>'+(d===1?"día":"días")+'</s></div>'
      +'<div class="bd">'
      +'<input class="in bare t" data-f="nombre" value="'+esc(r.nombre)+'">'
      +'<textarea class="in bare m" data-f="notas" placeholder="Notas…" rows="1">'+esc(r.notas||"")+'</textarea>'
      +'<div class="tags">'
      +'<select class="fus" data-f="estado">'+opts+'</select>'
      +'<button class="btn ghost" data-a="done">Hecho</button>'
      +(r.canal?'<span class="pill off">'+esc(CANAL[r.canal]||r.canal)+'</span>':"")
      +(r.url?'<a class="lk" href="'+esc(r.url)+'" target="_blank" rel="noopener">Notion</a>':"")
      +'<span class="spacer"></span><button class="x" data-a="del" title="Borrar">✕</button>'
      +'</div>'+cNotasHtml(r.id)+'</div></li>';
  }).join("");
  /* notas de varias lineas: crecen con el texto, y guardan mientras escribes */
  lista.querySelectorAll("textarea.m").forEach(t=>{cCrecer(t);t.addEventListener("input",()=>cCrecer(t));});
  lista.querySelectorAll('[data-f="nombre"],[data-f="notas"]').forEach(el=>{
    const id=el.closest("[data-id]").dataset.id, f=el.dataset.f;
    escribible(el,()=>{},()=>cGuardar(id,f,el.value.trim()));
  });

  const hp=$("cPanelHecho");
  if(!hechos.length) hp.classList.add("hidden");
  else{ hp.classList.remove("hidden");
    $("cHechos").innerHTML=hechos.map(r=>'<div class="fudone" data-id="'+esc(r.id)+'"><span class="nm">'+esc(r.nombre)+'</span>'
      +'<span class="dt">'+(r.asked?esc(fdate(r.asked)):"—")+'</span>'
      +'<button class="btn ghost" data-a="reabrir">Reabrir</button>'
      +'<button class="x" data-a="del" title="Borrar">✕</button></div>').join("");
  }

  const sync=R.length?R.map(r=>r.sync_at).filter(Boolean).sort().pop():null;
  $("cSrc").textContent="Clari · Life Admin"+(sync?" · última anotación "+fdt(sync):"");

  let n="";
  if(!abiertos.length) n="No hay nada pendiente de Clari.";
  else{
    const v=abiertos[0];
    n="<b>"+abiertos.length+(abiertos.length===1?" abierto":" abiertos")+".</b> ";
    if(viejos.length) n+="El más viejo lleva <b>"+cEdad(v)+" días</b>: "+esc(v.nombre)+". ";
    if(viejos.length>=3) n+="Son "+viejos.length+" cosas con más de dos semanas sin cerrar. Eso ya no es carga de trabajo — es un canal que no cierra. Vale una llamada, no otro mensaje.";
    else if(nuevos.length) n+=(nuevos.length===1?"Una no la ha empezado nadie.":nuevos.length+" no las ha empezado nadie.");
  }
  $("cRead").innerHTML=n;
}

/* Clari Notes: bitacora por pendiente, plegada por defecto */
const cAbiertas=new Set();
const cQuien=e=>e==="pa@booneholdings.com"?"Clari":e==="edgar@booneholdings.com"?"Edgar":(e||"—");
const cFecha=s=>{const d=new Date(s);return isNaN(d)?"":d.getDate()+" "+["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()];};
function cNotasHtml(id){
  const L=(D.clariCom||[]).filter(c=>c.followup_id===id), ab=cAbiertas.has(id);
  return '<div class="cn'+(ab?" on":"")+'"><button class="cnt" data-a="notas">Clari Notes'+(L.length?" ("+L.length+")":"")+'<i>'+(ab?"▴":"▾")+'</i></button>'
    +'<div class="cnb">'+(L.map(c=>'<div class="cni"><b>'+esc(cQuien(c.autor))+'</b> <s>'+cFecha(c.created_at)+'</s> '+esc(c.texto)+'</div>').join("")||'<div class="cni" style="color:var(--faint)">Sin notas todavía.</div>')
    +'<div class="cna"><input class="in" data-cn="1" placeholder="Escribe una nota…" autocomplete="off"><button class="btn ghost" data-a="cnadd">Agregar</button></div></div></div>';
}
async function cComentar(id,texto){
  texto=(texto||"").trim(); if(!texto) return;
  const c={id:"cn-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),followup_id:id,texto,created_at:new Date().toISOString(),autor:"edgar@booneholdings.com"};
  D.clariCom=[c,...(D.clariCom||[])]; cAbiertas.add(id); renderClari();
  const {error}=await sb.from("clari_comentarios").insert({id:c.id,followup_id:id,texto});
  aviso(error?"No se guardó · "+error.message:"Guardado",!!error);
}
const cCrecer=t=>{t.style.height="auto";t.style.height=(t.scrollHeight+2)+"px";};
async function cGuardar(id,campo,valor){
  const r=(D.clari||[]).find(x=>x.id===id); if(!r) return;
  r[campo]=valor; r.sync_at=new Date().toISOString();
  const patch={}; patch[campo]=valor; patch.sync_at=r.sync_at;
  await q(sb.from("clari_followups").update(patch).eq("id",id));
}
function cBind(cont){
  cont.addEventListener("change",async e=>{
    const li=e.target.closest("[data-id]"); if(!li) return; const id=li.dataset.id;
    const f=e.target.dataset.f; if(!f) return;
    if(f==="estado"){ await cGuardar(id,"estado",e.target.value); renderClari(); }
    else await cGuardar(id,f,e.target.value.trim());
  });
  cont.addEventListener("keydown",e=>{
    if(e.key==="Enter"&&e.target.dataset.cn){ e.preventDefault(); const li=e.target.closest("[data-id]"); if(li) cComentar(li.dataset.id,e.target.value); }
  });
  cont.addEventListener("click",async e=>{
    const btn=e.target.closest("[data-a]"); if(!btn) return;
    const li=e.target.closest("[data-id]"); if(!li) return; const id=li.dataset.id;
    const r=(D.clari||[]).find(x=>x.id===id); if(!r) return;
    if(btn.dataset.a==="notas"){ cAbiertas.has(id)?cAbiertas.delete(id):cAbiertas.add(id); renderClari(); return; }
    if(btn.dataset.a==="cnadd"){ const i=li.querySelector("[data-cn]"); await cComentar(id,i&&i.value); return; }
    if(btn.dataset.a==="done"){ r.hecho=true; r.estado="Done";
      await q(sb.from("clari_followups").update({hecho:true,estado:"Done",sync_at:new Date().toISOString()}).eq("id",id)); renderClari(); }
    else if(btn.dataset.a==="reabrir"){ r.hecho=false; r.estado="In progress";
      await q(sb.from("clari_followups").update({hecho:false,estado:"In progress",sync_at:new Date().toISOString()}).eq("id",id)); renderClari(); }
    else if(btn.dataset.a==="del"){
      if(!confirm("¿Borrar \""+r.nombre+"\"?")) return;
      D.clari=D.clari.filter(x=>x.id!==id);
      await q(sb.from("clari_followups").delete().eq("id",id)); renderClari(); }
  });
}
async function cAgregar(){
  const inp=$("cNuevo"), nombre=inp.value.trim(); if(!nombre) return;
  const hoy=new Date(); const iso=hoy.getFullYear()+"-"+String(hoy.getMonth()+1).padStart(2,"0")+"-"+String(hoy.getDate()).padStart(2,"0");
  const o={id:"fu-"+Date.now().toString(36),nombre,canal:"Clari Business",estado:"Not started",hecho:false,
    asked:iso,due:null,notas:null,fuente:"Centro de Mando",url:null,sync_at:new Date().toISOString()};
  D.clari.unshift(o); inp.value=""; renderClari();
  await q(sb.from("clari_followups").insert(o));
}
cBind(document.getElementById("cLista"));
cBind(document.getElementById("cHechos"));
document.getElementById("cAdd").addEventListener("click",cAgregar);
document.getElementById("cNuevo").addEventListener("keydown",e=>{if(e.key==="Enter")cAgregar();});


/* ═══════════ movimientos del banco: aprender y palomear ═══════════ */
const mvTitulo=m=>{const c=(m.clave||m.descripcion||"").replace(/\b\w/g,x=>x.toUpperCase());return c.length>48?c.slice(0,46)+"…":c;};
const nid=p=>p+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function renderBanco(){
  const box=$("bancoLista"); if(!box) return;
  const mes=D.mes, amb=D.amb;
  const L=(D.movs||[]).filter(m=>m.ambito===amb&&m.fecha&&m.fecha.slice(0,7)===mes&&!m.pendiente);
  const sueltos=L.filter(m=>!m.match_tipo&&!m.ignorado), hechos=L.filter(m=>m.match_tipo);
  /* los traspasos entre tus propias cuentas no son cobro ni gasto: fuera */
  const esTraspaso=m=>/^online transfer (to|from) (sav|chk)\b/.test(m.clave||"");
  const lista=sueltos.filter(m=>!esTraspaso(m));
  $("bancoSrc").textContent=(D.banco?"Chase · "+fdate(D.banco.fecha)+" · ":"")+lista.length+" por confirmar · "+hechos.length+" reconocidos";
  if(!lista.length){box.innerHTML='<div class="note" style="margin:6px 0">Todo lo que cayó este mes ya está reconocido.</div>';}
  else box.innerHTML=lista.map(m=>{
    const entra=m.monto>0;
    const cand=entra?D.cobros.filter(c=>!c.cobrado):D.gastosMes.filter(g=>!g.pagado);
    const ops=cand.map(c=>'<option value="'+(entra?"cobro":"gasto")+":"+esc(c.id)+'">'+(entra?"Es el cobro de ":"Es el pago de ")+esc(c.nombre)+" ("+money(c.monto)+")</option>").join("");
    return '<div class="mv" data-id="'+esc(m.id)+'"><span class="dt">'+fdate(m.fecha)+'</span><span class="ds" title="'+esc(m.descripcion||"")+'">'+esc(mvTitulo(m))+'</span>'
      +'<span class="am '+(entra?"in":"out")+'">'+(entra?"+":"−")+money(Math.abs(m.monto)).replace("$","$")+'</span>'
      +'<select data-mv="'+esc(m.id)+'"><option value="">¿Qué es?</option>'+ops
      +'<option value="nuevo:1">'+(entra?"Es un cobro nuevo… (lo nombro yo)":"Es un gasto nuevo… (lo nombro yo)")+'</option>'
      +'<option value="ignorar:1">No es de esta lista, ignóralo</option><option value="ignorar:siempre">Ignorar siempre los "'+esc(mvTitulo(m))+'"</option></select></div>';
  }).join("");
  $("bancoRead").innerHTML=lista.length?"Dime qué es cada uno una vez. La próxima vez que caiga el mismo cargo, se palomea solo.":(hechos.length?"Se reconocieron "+hechos.length+" movimientos este mes sin que hicieras nada.":"");
}
async function mvResolver(id,valor){
  const m=(D.movs||[]).find(x=>x.id===id); if(!m||!valor) return;
  let [tipo,ref]=valor.split(":");
  if(tipo==="nuevo"){
    const nombre=(window.prompt("¿Cómo se llama este "+(m.monto>0?"cobro":"gasto")+"?", mvTitulo(m))||"").trim(); if(!nombre) return;
    const id=(m.ambito==="personal"?"pe-":m.ambito==="bip"?"":"bre-")+nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)+"-"+Math.random().toString(36).slice(2,5);
    const mes=m.fecha.slice(0,7), monto=Math.abs(+m.monto);
    if(m.monto>0){
      const p={id,nombre,monto,grupo:m.ambito==="personal"?"Personal":"Otros",dia:null,tarde:false,ambito:m.ambito,activo:true,orden:900,estimado:false};
      const e=await sb.from("cos_cobros_plantilla").insert(p); if(e.error){aviso("No se guardó · "+e.error.message,true);return;}
      const c={mes,id,nombre,monto,grupo:p.grupo,dia:null,tarde:false,ambito:m.ambito,cobrado:false,estimado:false};
      await q(sb.from("cos_cobros").upsert(c,{onConflict:"mes,id"})); D.plantilla.push(p); if(mes===D.mes) D.cobros.push(c);
      tipo="cobro"; ref=id;
    }else{
      const g={id,nombre,monto,ambito:m.ambito,frecuencia:"mensual",dia:null,activo:true,orden:900};
      const e=await sb.from("cos_gastos").insert(g); if(e.error){aviso("No se guardó · "+e.error.message,true);return;}
      const gm={mes,id,nombre,monto,ambito:m.ambito,pagado:false};
      await q(sb.from("cos_gastos_mes").upsert(gm,{onConflict:"mes,id"})); D.gastos.push(g); if(mes===D.mes) D.gastosMes.push(gm);
      tipo="gasto"; ref=id;
    }
  }
  if(tipo==="ignorar"){
    m.ignorado=true;
    await q(sb.from("banco_movimientos").update({ignorado:true}).eq("id",id));
    if(ref==="siempre"){const r={id:nid("rg"),patron:m.clave,tipo:"ignorar",ref_id:"-",ambito:m.ambito,nombre:mvTitulo(m)};
      await q(sb.from("banco_reglas").insert(r));
      /* aplica de una vez a los demas iguales que esten sueltos */
      for(const o of D.movs.filter(x=>!x.match_tipo&&!x.ignorado&&x.clave===m.clave&&x.ambito===m.ambito)){o.ignorado=true;await q(sb.from("banco_movimientos").update({ignorado:true}).eq("id",o.id));}}
    aviso("Listo");renderBanco();return;
  }
  const mes=m.fecha.slice(0,7), ahora=new Date().toISOString();
  const fila=tipo==="cobro"?D.cobros.find(c=>c.id===ref):D.gastosMes.find(g=>g.id===ref); if(!fila) return;
  const r={id:nid("rg"),patron:m.clave,tipo,ref_id:ref,ambito:m.ambito,nombre:fila.nombre};
  const e1=await sb.from("banco_reglas").insert(r);
  if(e1.error){aviso("No se guardó · "+e1.error.message,true);return;}
  if(tipo==="cobro"){fila.cobrado=true;fila.cobrado_at=ahora;await q(sb.from("cos_cobros").update({cobrado:true,cobrado_at:ahora}).match({mes,id:ref}));}
  else{fila.pagado=true;fila.pagado_at=ahora;await q(sb.from("cos_gastos_mes").update({pagado:true,pagado_at:ahora}).match({mes,id:ref}));}
  m.match_tipo=tipo;m.match_id=ref;m.match_mes=mes;m.regla_id=r.id;
  await q(sb.from("banco_movimientos").update({match_tipo:tipo,match_id:ref,match_mes:mes,regla_id:r.id}).eq("id",id));
  aviso("Aprendido: "+fila.nombre);renderDinero();
}
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("select[data-mv]");if(s)mvResolver(s.dataset.mv,s.value);});
