/* ═══════════ app4: Libros · Status  +  Lifestyle · Vinos ═══════════
   Lee `libros_status` y `vinos` (Supabase). Notion es la fuente: la tarea
   de sincronización de la nube copia Notion → Supabase y sube a Notion lo
   que se cambió aquí (`vinos.pendiente_notion = true`).
   Se engancha envolviendo cargarTodo / renderTodo / verVista de app1. */

const V={vinos:[],libros:[],loc:"todas",fil:"todos",reg:"",bus:"",serie:"",abierto:null,nuevo:false,exp:null};
const NOTION_VINOS="https://www.notion.so/29ee91a69c214ca38e322ee10469be8f";
const NOTION_LIBROS="https://www.notion.so/816ba77600774774a70424721f03d728";
const REGIONES=["Toro","Rioja","Ribera del Duero","Napa Valley","Fronsac · Burdeos"];
const UVAS=["Tempranillo / Tinta de Toro","Cabernet Sauvignon","Merlot","Cabernet Franc","Garnacha","Blend Burdeos"];

try{const c=JSON.parse(localStorage.getItem("cosV4")||"null");if(c){V.vinos=c.vinos||[];V.libros=c.libros||[];}}catch(e){}

async function cargarV4(){
  const [vin,lib]=await Promise.all([
    q(sb.from("vinos").select("*").order("vino")),
    q(sb.from("libros_status").select("*").order("libro"))
  ]);
  if(vin)V.vinos=vin; if(lib)V.libros=lib;
  try{localStorage.setItem("cosV4",JSON.stringify({vinos:V.vinos,libros:V.libros}));}catch(e){}
}
const _cargarTodo=cargarTodo;
cargarTodo=async function(){await Promise.all([_cargarTodo(),cargarV4()]);renderV4();};
const _renderTodo=renderTodo;
renderTodo=function(){try{_renderTodo();}finally{renderV4();}};
const _verVista=verVista;
verVista=function(v){_verVista(v);if(v==="lifestyle"||v==="libros")renderV4();};
function renderV4(){try{renderStatus();renderVinos();}catch(e){console.warn("v4",e);}}

/* pestañas internas (no usan .subtabs: ese manejador es global de Dinero) */
document.querySelectorAll(".lstabs button").forEach(b=>b.addEventListener("click",()=>{
  const g=b.parentElement.dataset.grp;
  b.parentElement.querySelectorAll("button").forEach(x=>x.setAttribute("aria-selected",String(x===b)));
  document.querySelectorAll('.lpane[data-grp="'+g+'"]').forEach(p=>p.classList.toggle("on",p.dataset.p===b.dataset.p));
  if(g==="lib"&&b.dataset.p==="ventas"&&D.board)renderLibros();
}));

const hace=t=>{if(!t)return"";const m=Math.round((Date.now()-new Date(t))/6e4);
  return m<2?"hace un momento":m<60?"hace "+m+" min":m<1440?"hace "+Math.round(m/60)+" h":"hace "+Math.round(m/1440)+" d";};
const ultimaSync=L=>L.reduce((a,r)=>r.sync_at&&r.sync_at>a?r.sync_at:a,"");

/* ═══════════ LIBROS · STATUS ═══════════ */
const PASO={"Publicado":"ok","En tiendas":"ok","Listo para subir":"info","Aprobado AR":"info","Paquete listo":"info",
  "En revisión AR":"info","En producción":"warn","Pendiente":"off","No se hará":"no"};
const pillE=v=>v?'<span class="pill st-'+(PASO[v]||"off")+'">'+esc(v)+'</span>':'<span class="pill st-off">—</span>';
function renderStatus(){
  const box=$("stLista"); if(!box) return;
  const L=V.libros;
  const pub=L.filter(r=>r.interior==="Publicado").length;
  const aud=L.filter(r=>r.audiolibro==="En tiendas").length;
  const prod=L.filter(r=>[r.interior,r.epub,r.portadas,r.audiolibro].some(x=>x&&x!=="Publicado"&&x!=="En tiendas"&&x!=="Pendiente"&&x!=="No se hará")).length;
  const pend=L.filter(r=>r.audiolibro==="Pendiente").length;
  $("stPub").textContent=pub; $("stPubN").textContent="de "+L.length+" títulos";
  $("stAud").textContent=aud; $("stProd").textContent=prod; $("stPend").textContent=pend;
  const series=[...new Set(L.map(r=>r.serie||"Otro"))].sort();
  $("stSeries").innerHTML=['<span class="'+(V.serie?"":"on")+'" data-s="">Todas</span>']
    .concat(series.map(s=>'<span class="'+(V.serie===s?"on":"")+'" data-s="'+esc(s)+'">'+esc(s)+'</span>')).join("");
  const R=L.filter(r=>!V.serie||(r.serie||"Otro")===V.serie);
  box.innerHTML='<div class="st-row st-h"><div>Libro</div><div>Interior</div><div>EPUB</div><div>Portada</div><div>Audiolibro</div></div>'
   +R.map(r=>'<div class="st-row" data-id="'+esc(r.id)+'">'
    +'<div class="st-t"><b>'+esc(r.libro)+'</b><span class="st-s">'+esc(r.serie||"")+(r.paginas?" · "+r.paginas+" pp":"")+'</span></div>'
    +'<div data-l="Interior">'+pillE(r.interior)+'</div><div data-l="EPUB">'+pillE(r.epub)+'</div>'
    +'<div data-l="Portada">'+pillE(r.portadas)+'</div><div data-l="Audio">'+pillE(r.audiolibro)+'</div>'
    +'<div class="st-more">'+(r.notas?esc(r.notas):"")+(r.isbn?'<span class="st-isbn">'+esc(r.isbn)+'</span>':"")
    +(r.url?' <a class="lk" href="'+esc(r.url)+'" target="_blank" rel="noopener">Abrir en Notion →</a>':"")+'</div>'
    +'</div>').join("");
  const s=ultimaSync(L); $("stSync").textContent="Notion · 📚 Libros — Edgar Boone"+(s?" · sincronizado "+hace(s):"");
}
document.addEventListener("click",e=>{
  const sp=e.target.closest("#stSeries span"); if(sp){V.serie=sp.dataset.s;renderStatus();return;}
  const row=e.target.closest(".st-row[data-id]"); if(row&&!e.target.closest("a")) row.classList.toggle("open");
});

/* ═══════════ LIFESTYLE · VINOS ═══════════ */
const botellas=w=>(+w.waterford||0)+(+w.monterrey||0);
const enLoc=w=>V.loc==="waterford"?(+w.waterford||0):V.loc==="monterrey"?(+w.monterrey||0):botellas(w);
const estrellas=(n,id)=>'<span class="vn-stars" data-id="'+esc(id)+'">'+[1,2,3,4,5].map(i=>'<i data-n="'+i+'" class="'+(i<=(n||0)?"on":"")+'">★</i>').join("")+'</span>';

function renderVinos(){
  const box=$("vnLista"); if(!box) return;
  const W=V.vinos;
  const tw=W.reduce((t,w)=>t+(+w.waterford||0),0), tm=W.reduce((t,w)=>t+(+w.monterrey||0),0);
  const valor=W.reduce((t,w)=>t+enLoc(w)*(+w.precio_mercado||0),0);
  $("vnCava").textContent=V.loc==="waterford"?tw:V.loc==="monterrey"?tm:tw+tm;
  $("vnCavaN").textContent="Waterford "+tw+" · Monterrey "+tm;
  $("vnFav").textContent=W.filter(w=>w.favorito).length;
  $("vnPor").textContent=W.filter(w=>w.estado==="Por probar").length;
  $("vnValor").textContent=money(valor);
  document.querySelectorAll("#vnLoc span").forEach(s=>s.classList.toggle("on",s.dataset.l===V.loc));
  document.querySelectorAll("#vnFil span").forEach(s=>s.classList.toggle("on",s.dataset.f===V.fil));
  document.querySelectorAll(".kpi[data-vf]").forEach(k=>k.classList.toggle("on",k.dataset.vf===V.fil));
  const rs=$("vnReg"), regs=[...new Set(REGIONES.concat(W.map(w=>w.region).filter(Boolean)))];
  rs.innerHTML='<option value="">Todas las regiones</option>'+regs.map(r=>'<option'+(r===V.reg?" selected":"")+'>'+esc(r)+'</option>').join("");

  const b=V.bus.trim().toLowerCase();
  let R=W.filter(w=>(!V.reg||w.region===V.reg)
    &&(V.fil==="todos"||(V.fil==="fav"&&w.favorito)||(V.fil==="por"&&w.estado==="Por probar")||(V.fil==="cava"&&enLoc(w)>0))
    &&(V.loc==="todas"||V.fil!=="cava"||enLoc(w)>0)
    &&(!b||[w.vino,w.bodega,w.region,(w.uvas||[]).join(" "),w.notas,w.donde].join(" ").toLowerCase().includes(b)));
  R.sort((a,c)=>(c.favorito-a.favorito)||(enLoc(c)-enLoc(a))||String(a.vino).localeCompare(c.vino));

  const nb=$("vnNuevoBox"); if(V.nuevo!==!!nb.firstChild) nb.innerHTML=V.nuevo?formNuevo():"";
  box.innerHTML=R.length?R.map(cardVino).join(""):'<div class="note">Nada con ese filtro.</div>';

  /* por región */
  const pr={}; W.forEach(w=>{const k=w.region||"Sin región";(pr[k]=pr[k]||{n:0,b:0,f:0});pr[k].n++;pr[k].b+=enLoc(w);if(w.favorito)pr[k].f++;});
  $("vnRegiones").innerHTML='<table class="tbl"><tr><th>Región</th><th class="num">Vinos</th><th class="num">Favoritos</th><th class="num">Botellas</th></tr>'
    +Object.entries(pr).sort((a,c)=>c[1].n-a[1].n).map(([k,o])=>'<tr data-reg="'+esc(k)+'" class="vn-rr'+(V.reg===k?" on":"")+'"><td class="who">'+esc(k)+'</td><td class="num">'+o.n+'</td><td class="num">'+o.f+'</td><td class="num">'+o.b+'</td></tr>').join("")+'</table>';
  const s=ultimaSync(W), pend=W.filter(w=>w.pendiente_notion).length;
  $("vnSync").textContent="Cava · Vinos (Notion)"+(s?" · "+hace(s):"")+(pend?" · "+pend+" cambio"+(pend>1?"s":"")+" por subir a Notion":"");
}
function cardVino(w){
  const ab=V.abierto===w.id, ex=V.exp===w.id||ab, uvas=(w.uvas||[]), por=w.estado==="Por probar";
  const bt=(k,s)=>'<span class="vn-b" title="'+(k==="waterford"?"Waterford":"Monterrey")+'"><i>'+s+'</i><button data-a="menos" data-k="'+k+'" aria-label="Quitar botella">−</button><b>'+(+w[k]||0)+'</b><button data-a="mas" data-k="'+k+'" aria-label="Agregar botella">+</button></span>';
  const meta=[w.bodega,w.anada,por?null:null].filter(Boolean).join(" · ");
  const cuando=w.cuando?new Date(w.cuando+"T12:00").toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}):"";
  return '<article class="vn-card vn-row'+(por?" por":"")+(ex?" open":"")+'" data-id="'+esc(w.id)+'">'
   +'<button class="vn-fav'+(w.favorito?" on":"")+'" data-a="fav" title="Favorito">'+(w.favorito?"♥":"♡")+'</button>'
   +'<div class="vn-main"><div class="vn-name">'+esc(w.vino)+(por?'<span class="vn-por">por probar</span>':"")+'</div>'
   +'<div class="vn-meta">'+esc(meta)+(w.region?(meta?' · ':'')+'<span class="vn-reg">'+esc(w.region)+'</span>':"")+(w.precio_mercado?'<span class="vn-pm"> · '+money(w.precio_mercado)+'</span>':"")+'</div></div>'
   +estrellas(w.calificacion,w.id)
   +'<div class="vn-price">'+(w.precio_mercado?'<b>'+money(w.precio_mercado)+'</b>':'<b class="vn-nop">—</b>')+'</div>'
   +'<div class="vn-cava">'+bt("waterford","W")+bt("monterrey","M")+'</div>'
   +'<span class="vn-chev" aria-hidden="true">›</span>'
   +'<div class="vn-more">'
   +'<div class="vn-tags">'+uvas.map(u=>'<span class="pill st-off">'+esc(u)+'</span>').join("")+(w.pais?'<span class="pill st-off">'+esc(w.pais)+'</span>':"")+(w.tipo?'<span class="pill st-off">'+esc(w.tipo)+'</span>':"")+(w.precio_pagado?'<span class="pill st-info">pagué $'+(+w.precio_pagado).toFixed(2)+'</span>':"")+'</div>'
   +((w.donde||cuando||w.notas)?'<div class="vn-nota">'+((cuando||w.donde)?'<span class="vn-when">'+esc([cuando,w.donde].filter(Boolean).join(" · "))+'</span>':"")+esc(w.notas||"")+'</div>':"")
   +(ab?formTome(w):'<div class="vn-act"><button class="btn ghost" data-a="tome">🍷 Lo tomé</button>'
     +(w.url?'<a class="lk" href="'+esc(w.url)+'" target="_blank" rel="noopener">Notion</a>':"")+'</div>')
   +'</div></article>';
}
function formTome(w){
  const hoy=new Date().toISOString().slice(0,10);
  const loc=(+w.waterford||0)>0?"waterford":(+w.monterrey||0)>0?"monterrey":"";
  return '<div class="vn-form">'
   +'<label class="f"><span>Dónde</span><input class="in" data-t="donde" placeholder="Casa Waterford, restaurante…" value="'+esc(w.donde||"")+'"></label>'
   +'<label class="f"><span>Cuándo</span><input class="in" type="date" data-t="cuando" value="'+hoy+'"></label>'
   +'<label class="f"><span>De la cava</span><select class="in" data-t="loc"><option value="">No era de la cava</option>'
   +'<option value="waterford"'+(loc==="waterford"?" selected":"")+'>Waterford (−1)</option><option value="monterrey"'+(loc==="monterrey"?" selected":"")+'>Monterrey (−1)</option></select></label>'
   +'<label class="f vn-wide"><span>Notas</span><textarea class="in" rows="2" data-t="notas" placeholder="Cómo estuvo, con quién, con qué…">'+esc(w.notas||"")+'</textarea></label>'
   +'<div class="vn-act"><button class="btn" data-a="guardarTome">Guardar</button><button class="btn ghost" data-a="cerrar">Cancelar</button></div></div>';
}
function formNuevo(){
  return '<div class="panel vn-form nuevo"><h2 style="grid-column:1/-1">Nuevo vino</h2>'
   +'<label class="f vn-wide"><span>Vino</span><input class="in" id="nvVino" placeholder="Nombre"></label>'
   +'<label class="f"><span>Bodega</span><input class="in" id="nvBod"></label>'
   +'<label class="f"><span>Añada</span><input class="in" id="nvAn" inputmode="numeric" placeholder="2021"></label>'
   +'<label class="f"><span>Región</span><input class="in" id="nvReg" list="nvRegL"><datalist id="nvRegL">'+REGIONES.map(r=>'<option value="'+esc(r)+'">').join("")+'</datalist></label>'
   +'<label class="f"><span>Uva</span><input class="in" id="nvUva" list="nvUvaL"><datalist id="nvUvaL">'+UVAS.map(r=>'<option value="'+esc(r)+'">').join("")+'</datalist></label>'
   +'<label class="f"><span>Precio pagado</span><input class="in" id="nvPre" inputmode="decimal" placeholder="$"></label>'
   +'<label class="f"><span>Estado</span><select class="in" id="nvEst"><option>Por probar</option><option>Probado</option></select></label>'
   +'<label class="f"><span>Botellas Waterford</span><input class="in" id="nvW" inputmode="numeric" value="0"></label>'
   +'<label class="f"><span>Botellas Monterrey</span><input class="in" id="nvM" inputmode="numeric" value="0"></label>'
   +'<div class="vn-act"><button class="btn" data-a="crear">Agregar</button><button class="btn ghost" data-a="nocrear">Cancelar</button></div></div>';
}
async function guardarVino(id,patch){
  const w=V.vinos.find(x=>x.id===id); if(!w) return;
  patch.pendiente_notion=true; patch.sync_at=new Date().toISOString();
  Object.assign(w,patch); renderVinos();
  const {error}=await sb.from("vinos").update(patch).eq("id",id);
  aviso(error?"No se guardó · "+error.message:"Guardado",!!error);
}
document.addEventListener("click",async e=>{
  const l=e.target.closest("#vnLoc span"); if(l){V.loc=l.dataset.l;renderVinos();return;}
  const k=e.target.closest(".kpi[data-vf]"); if(k){V.fil=V.fil===k.dataset.vf?"todos":k.dataset.vf;V.reg="";renderVinos();const p=$("vnLista");if(p)p.scrollIntoView({behavior:"smooth",block:"start"});return;}
  const rr=e.target.closest("#vnRegiones tr[data-reg]"); if(rr){const r=rr.dataset.reg;V.reg=V.reg===r?"":r;renderVinos();const p=$("vnLista");if(p)p.scrollIntoView({behavior:"smooth",block:"start"});return;}
  const f=e.target.closest("#vnFil span"); if(f){V.fil=f.dataset.f;renderVinos();return;}
  if(e.target.closest("#vnAdd")){V.nuevo=true;renderVinos();setTimeout(()=>$("nvVino")&&$("nvVino").focus(),0);return;}
  const st=e.target.closest(".vn-stars i");
  if(st){const id=st.parentElement.dataset.id,w=V.vinos.find(x=>x.id===id),n=+st.dataset.n;
    guardarVino(id,{calificacion:w&&w.calificacion===n?null:n});return;}
  let bt=e.target.closest("[data-a]");
  if(!bt){const row=e.target.closest(".vn-row"); if(row&&!e.target.closest("button,a,input,select,textarea,label,.vn-more")){bt=row;bt.dataset.a="abrir";}}
  if(!bt) return;
  const a=bt.dataset.a;
  if(a==="nocrear"){V.nuevo=false;renderVinos();return;}
  if(a==="crear"){
    const nom=$("nvVino").value.trim(); if(!nom){$("nvVino").focus();return;}
    const num=(x,d)=>{const v=parseFloat(String($(x).value).replace(/[^0-9.]/g,""));return isNaN(v)?d:v;};
    const o={id:"nuevo-"+(crypto.randomUUID?crypto.randomUUID():Date.now()),vino:nom,bodega:$("nvBod").value.trim()||null,
      anada:num("nvAn",null),region:$("nvReg").value.trim()||null,uvas:$("nvUva").value.trim()?[$("nvUva").value.trim()]:[],
      estado:$("nvEst").value,favorito:false,precio_pagado:num("nvPre",null),waterford:num("nvW",0),monterrey:num("nvM",0),
      pendiente_notion:true,sync_at:new Date().toISOString()};
    V.vinos.push(o); V.nuevo=false; renderVinos();
    const {error}=await sb.from("vinos").insert(o);
    aviso(error?"No se guardó · "+error.message:"Agregado · sube a Notion en la próxima sincronización",!!error);
    return;
  }
  const card=bt.closest(".vn-card"); if(!card) return;
  const id=card.dataset.id, w=V.vinos.find(x=>x.id===id); if(!w) return;
  if(a==="abrir"){V.exp=V.exp===id?null:id;if(V.exp!==id&&V.abierto===id)V.abierto=null;renderVinos();return;}
  if(a==="fav") guardarVino(id,{favorito:!w.favorito});
  else if(a==="mas") guardarVino(id,{[bt.dataset.k]:(+w[bt.dataset.k]||0)+1});
  else if(a==="menos"){ if((+w[bt.dataset.k]||0)>0) guardarVino(id,{[bt.dataset.k]:(+w[bt.dataset.k])-1}); }
  else if(a==="tome"){V.abierto=id;renderVinos();}
  else if(a==="cerrar"){V.abierto=null;renderVinos();}
  else if(a==="guardarTome"){
    const g=k=>card.querySelector('[data-t="'+k+'"]').value;
    const p={estado:"Probado",donde:g("donde").trim()||null,cuando:g("cuando")||null,notas:g("notas").trim()||null};
    const loc=g("loc"); if(loc&&(+w[loc]||0)>0) p[loc]=(+w[loc])-1;
    V.abierto=null; guardarVino(id,p);
  }
});
document.addEventListener("change",e=>{if(e.target.id==="vnReg"){V.reg=e.target.value;renderVinos();}});
document.addEventListener("input",e=>{if(e.target.id==="vnBus"){V.bus=e.target.value;renderVinos();}});
