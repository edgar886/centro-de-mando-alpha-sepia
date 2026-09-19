/* ═══════════ app5: Hoy · Life Admin (Mike) ═══════════
   Lee `cos_mike_brief_diario` (fila de hoy) y la pinta bajo "Los tres de hoy".
   Edgar contesta el ask aquí. Casa US: Lock|Casa, Jacuzzi, chem dose UI.
   Apagar: cos_dashboard/config → data.life_admin = false. */
const LA = { brief: null, fecha: null };
const laHoy = () => {
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
};
try {
  const c = JSON.parse(localStorage.getItem("cosLA") || "null");
  if (c && c.fecha === laHoy()) { LA.brief = c.brief; LA.fecha = c.fecha; }
} catch (e) {}

async function cargarLA() {
  const fecha = laHoy();
  const r = await q(sb.from("cos_mike_brief_diario").select("*").eq("fecha", fecha).maybeSingle());
  LA.brief = r || null; LA.fecha = fecha;
  try { localStorage.setItem("cosLA", JSON.stringify({ fecha, brief: LA.brief })); } catch (e) {}
}
const _cargarTodo5 = cargarTodo;
cargarTodo = async function () { await Promise.all([_cargarTodo5(), cargarLA()]); renderLA(); };
const _renderTodo5 = renderTodo;
renderTodo = function () { try { _renderTodo5(); } finally { renderLA(); } };

const laDias = f => {
  if (!f) return null;
  const d = new Date(String(f).slice(0, 10) + "T12:00:00");
  return isNaN(d) ? null : Math.round((Date.now() - d.getTime()) / 864e5);
};
const laEn = f => {
  const n = laDias(f);
  if (n == null) return "";
  if (n === 0) return "hoy";
  if (n < 0) return "en " + (-n) + " d";
  return "hace " + n + " d";
};
const laHora = t => {
  const d = new Date(t);
  return isNaN(d) ? "" : d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
};
const laNum = v => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const laTxt = v => {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    return v.texto || v.msg || v.message || v.nombre || v.label || "";
  }
  return "";
};
const laLock = casa => {
  const L = casa.lock || casa.cerradura || casa.chapa || casa.nest_lock || casa.estado_lock || casa.lock_texto;
  if (L == null || L === "") return null;
  if (typeof L === "boolean") return L ? "locked" : "unlocked";
  if (typeof L === "string") {
    const s = L.toLowerCase();
    if (/unlock|abiert|open/.test(s)) return "unlocked";
    if (/lock|cerrad|secure/.test(s)) return "locked";
    return L;
  }
  if (typeof L === "object") {
    if (typeof L.locked === "boolean") return L.locked ? "locked" : "unlocked";
    const e = String(L.estado || L.status || L.state || "").toLowerCase();
    if (/unlock|abiert|open/.test(e)) return "unlocked";
    if (/lock|cerrad|secure/.test(e)) return "locked";
    return String(L.estado || L.status || L.state || "") || null;
  }
  return null;
};
const laBadgeClass = st => {
  st = String(st || "").toLowerCase();
  if (st === "ok" || st === "normal" || st === "good" || st === "verde") return "ok";
  if (st === "alto" || st === "high" || st === "hi") return "alto";
  if (st === "bajo" || st === "low" || st === "lo" || st === "amarillo") return "bajo";
  if (st === "revisar" || st === "check" || st === "warn" || st === "warning") return "revisar";
  return "off";
};
const laIsOk = st => {
  st = String(st || "").toLowerCase();
  return !st || st === "ok" || st === "normal" || st === "good" || st === "verde";
};
/** Mike: jacuzzi.quimicos = [{label,badge,detalle}] or string[] fallback. Never String(obj). */
function laChemChips(casa, jac) {
  const q = jac.quimicos ?? jac.chemicals ?? casa.quimicos ?? null;
  const out = [];
  const pushChip = (label, badge, detalle) => {
    label = String(label || "").trim();
    if (!label || label === "[object Object]") return;
    badge = String(badge || "").trim().toLowerCase();
    detalle = String(detalle || "").trim();
    if (detalle === "[object Object]") detalle = "";
    out.push({ label, badge, detalle });
  };
  if (Array.isArray(q)) {
    for (const item of q) {
      if (item == null || item === "") continue;
      if (typeof item === "string") {
        const t = item.trim();
        if (t && t !== "[object Object]") pushChip(t, "", "");
        continue;
      }
      if (typeof item === "object") {
        const label = item.label || item.etiqueta || item.nombre || item.name || "";
        const badge = item.badge || item.estado || item.status || "";
        const detalle = item.detalle || item.detail || item.hacer || item.accion || "";
        /* only structured chip fields — never dump keys */
        if (label) pushChip(label, badge, detalle);
      }
    }
    return out;
  }
  if (typeof q === "string" && q.trim() && q.trim() !== "[object Object]") {
    pushChip(q.trim(), "", "");
  }
  return out;
}
const laChipClass = badge => {
  badge = String(badge || "").toLowerCase();
  if (badge === "ok" || badge === "normal" || badge === "good" || badge === "verde") return "ok";
  if (badge === "alto" || badge === "high" || badge === "hi") return "alto";
  if (badge === "bajo" || badge === "low" || badge === "lo") return "bajo";
  if (badge === "revisar" || badge === "warn" || badge === "warning") return "revisar";
  return "off";
}
/** Alertas: only dose lines (→ / oz / producto). Drop "mide antes", cartridge, water-change noise. */
function laAlertas(casa) {
  const raw = Array.isArray(casa.alertas) ? casa.alertas : (Array.isArray(casa.alerts) ? casa.alerts : []);
  const out = [];
  for (const a of raw) {
    const t = laTxt(a).trim();
    if (!t) continue;
    const low = t.toLowerCase();
    if (/\bmide\b|\bmedir\b|antes de dosif|confirma con|\btiras\b|fwiq|sensor/.test(low)) continue;
    if (/cartridge|cartucho|\bfiltro\b/.test(low)) continue;
    if (/cambio de agua|water change|post-?cambio/.test(low)) continue;
    /* dose lines only */
    if (/→/.test(t) || (/\boz\b/.test(low) && /ph|cloro|chlor|bromo|alk|alc|orp/.test(low))) {
      out.push(t);
      continue;
    }
    if (/(alto|bajo).*(→|oz|pon |añade|agrega)/.test(low)) out.push(t);
  }
  return out;
}
function laRenderCasa(casa) {
  if (casa == null) casa = {};
  if (Array.isArray(casa)) casa = { alertas: casa };
  const jac = casa.jacuzzi || casa.jacuzzi || casa.spa || casa.hotspring || {};
  const jTemp = laNum(jac.temp_f ?? jac.temp ?? jac.temperatura ?? casa.jacuzzi_temp ?? casa.spa_temp);
  const jSet = laNum(jac.set_f ?? jac.setpoint ?? jac.set);
  const jGal = laNum(jac.galones ?? jac.gallons ?? casa.galones ?? casa.jacuzzi_galones);
  const jUnit = "°F";
  /* Casa temp ALWAYS — temperatura_casa_f or casa_texto */
  const hTemp = laNum(casa.temperatura_casa_f ?? casa.temp_casa_f ?? casa.temp ?? casa.casa_temp ?? casa.house_temp);
  const hSet = laNum(casa.setpoint_casa_f ?? casa.setpoint_casa ?? casa.casa_set);
  const casaTexto = laTxt(casa.casa_texto || casa.texto_casa || "");
  const hUnit = "°F";
  const lock = laLock(casa);
  const chemChips = laChemChips(casa, jac);
  const jacNota = laTxt(jac.nota || casa.nota || "");
  const resumen = laTxt(jac.quimicos_resumen || casa.quimicos_resumen || "");
  const alertas = laAlertas(casa);

  let lV = "—", lOpen = false, lEmpty = true;
  if (lock) {
    lEmpty = false;
    lOpen = String(lock).toLowerCase() === "unlocked";
    lV = lOpen ? "Unlocked" : (String(lock).toLowerCase() === "locked" ? "Locked" : String(lock));
  }
  /* Casa value: prefer number, else casa_texto, never blank if either exists */
  let hV = "—", hSub = "sin lectura", hEmpty = true;
  if (hTemp != null) {
    hEmpty = false;
    hV = hTemp + hUnit;
    hSub = hSet != null ? ("set " + hSet + hUnit) : (casaTexto || "interior");
  } else if (casaTexto) {
    hEmpty = false;
    hV = casaTexto;
    hSub = hSet != null ? ("set " + hSet + hUnit) : "interior";
  }
  const jV = jTemp != null ? (jTemp + jUnit) : "—";
  let jSub = "sin lectura";
  if (jTemp != null) {
    const bits = [];
    if (jSet != null) bits.push("set " + jSet + jUnit);
    if (jGal != null) bits.push(jGal + " gal");
    if (!bits.length && jac.leido_at) bits.push("leído " + jac.leido_at);
    if (!bits.length) bits.push("temp");
    jSub = bits.join(" · ");
  } else if (jac.temp_texto) {
    jSub = laTxt(jac.temp_texto);
  }

  /* Top: LOCK | CASA (casa ALWAYS to the right of lock) */
  let html = '<div class="la-toprow">';
  html += '<div class="la-lock' + (lOpen ? " open" : "") + (lEmpty ? " empty" : "") + '"><span class="ico" aria-hidden="true">' + (lEmpty ? "·" : (lOpen ? "🔓" : "🔒")) + '</span><span class="v">' + esc(lV) + "</span></div>";
  html += '<div class="la-house' + (hEmpty ? " empty" : "") + '"><div class="k">Casa</div><div class="v">' + esc(hV) + '</div><div class="s">' + esc(hSub) + "</div></div>";
  html += "</div>";

  html += '<div class="la-jacuzzi' + (jTemp == null ? " empty" : "") + '"><div class="k">Jacuzzi</div><div class="v">' + esc(jV) + '</div><div class="s">' + esc(jSub) + "</div></div>";

  if (chemChips.length) {
    html += '<div class="la-chemlist">';
    for (let i = 0; i < chemChips.length; i++) {
      const chip = chemChips[i];
      const bcls = laChipClass(chip.badge);
      const needs = bcls === "alto" || bcls === "bajo" || bcls === "revisar";
      const hasDet = !!chip.detalle;
      const clickable = hasDet;
      html += '<button type="button" class="la-chemchip' + (needs ? " needs" : "") + (clickable ? " tap" : "") + (bcls !== "off" ? " b-" + bcls : "") + '"' + (clickable ? ' data-la-chip="' + i + '" aria-expanded="false"' : " disabled") + '>';
      html += '<span class="la-chemlabel">' + esc(chip.label) + "</span>";
      if (chip.badge) html += '<span class="la-badge ' + bcls + '">' + esc(chip.badge) + "</span>";
      if (clickable) html += '<span class="la-chip-hint" aria-hidden="true">▾</span>';
      html += "</button>";
      if (hasDet) {
        html += '<div class="la-chip-detail" data-la-chip-detail="' + i + '" hidden>' + esc(chip.detalle) + "</div>";
      }
    }
    html += "</div>";
  } else {
    html += '<div class="la-chemlist empty"><div class="la-chemrow empty"><span class="la-chemline">Químicos — sin lectura</span></div></div>';
  }
  if (jacNota) html += '<div class="la-note">' + esc(jacNota) + "</div>";
  if (resumen) html += '<div class="la-note">' + esc(resumen) + "</div>";
  if (alertas.length) {
    html += '<ul class="la-l la-alerts">' + alertas.map(t => '<li class="la-bad">' + esc(t) + "</li>").join("") + "</ul>";
  }
  return html;
}

function renderLA() {
  const box = $("laBody"); if (!box) return;
  const panel = $("lifeAdmin");
  const cfg = (D && D.cfg) || {};
  if (cfg.life_admin === false) { panel.classList.add("hidden"); return; }
  panel.classList.remove("hidden");
  const b = LA.brief;
  if (!b) {
    $("laSrc").textContent = "Mike · Grok Bot";
    box.innerHTML = '<div class="note" style="margin:6px 0">Mike aún no escribió el brief de hoy.</div>';
    return;
  }
  $("laSrc").textContent = "Mike · " + (b.updated_at ? "escrito a las " + laHora(b.updated_at) : "hoy");
  const S = (t, inner, cls) => '<section class="la-sec' + (cls ? " " + cls : "") + '"><h4>' + t + "</h4>" + inner + "</section>";
  const li = a => '<ul class="la-l">' + a.join("") + "</ul>";
  const cal = (b.calendario || []).slice(0, 6);
  const hCal = cal.length
    ? li(cal.map(c => '<li><b class="la-h">' + esc(c.hora || "") + "</b>" + esc(c.titulo || c.title || "") + "</li>"))
    : '<div class="la-vacio">Sin citas</div>';
  const mail = b.mail || [];
  const hMail = mail.length
    ? li(mail.map(m => "<li><b>" + esc(m.de || "") + "</b> · " + esc(m.asunto || "") + (m.por_que ? '<span class="la-why">' + esc(m.por_que) + "</span>" : "") + "</li>"))
    : '<div class="la-vacio">Nada nuevo</div>';
  const nCl = (Array.isArray(b.clari) ? b.clari : []).length;
  const hCl = nCl
    ? ('<div class="la-linkrow"><span class="la-count">' + nCl + " abierto" + (nCl === 1 ? "" : "s") + '</span><button type="button" class="la-link" data-la-nav="clari">Ver en Follow Up →</button></div>')
    : '<div class="la-vacio">Nada abierto</div>';
  const hCasa = laRenderCasa(b.casa_us || b.casa || {});
  const pg = (b.pagos || []).slice().sort((a, c) => String(a.fecha || "").localeCompare(String(c.fecha || "")));
  const hPg = pg.length
    ? li(pg.map(p => {
        const n = laDias(p.fecha); const urg = n != null && n >= -3;
        return "<li><b>" + esc(p.que || p.titulo || "") + "</b>" + (p.monto ? " · " + money(+p.monto) : "") +
          '<span class="la-tags">' + (p.fecha ? '<span class="pill ' + (urg ? "st-warn" : "st-off") + '">' + esc(fdate(String(p.fecha).slice(0, 10))) + (n != null ? " · " + laEn(p.fecha).replace("hace", "vencido") : "") + "</span>" : "") +
          (p.accion ? '<span class="pill st-info">necesita ' + esc(p.accion) + "</span>" : "") + "</span></li>";
      }))
    : '<div class="la-vacio">Nada en 14 días</div>';
  let hAsk;
  if (!b.ask) hAsk = '<div class="la-ask vacio"><span>Nada pendiente de ti</span></div>';
  else if (b.ask_respuesta) hAsk = '<div class="la-ask done"><p>' + esc(b.ask) + '</p><div class="la-resp">Respondiste <b>' + (b.ask_respuesta === "ok" ? "OK" : "Not now") + "</b>" + (b.ask_respondido_at ? " · " + laHora(b.ask_respondido_at) : "") + ' <button class="lk" data-la="deshacer">cambiar</button></div></div>';
  else hAsk = '<div class="la-ask"><p>' + esc(b.ask) + '</p><div class="la-btns"><button class="btn" data-la="ok">OK</button><button class="btn ghost" data-la="not_now">Not now</button></div></div>';
  box.innerHTML = S("Calendario hoy", hCal) + S("Mail admin", hMail) + S("Follow Up", hCl) + S("Casa US", hCasa) + S("Pagos · countdowns", hPg) + S("Un solo ask", hAsk, "la-wide");
}

document.addEventListener("click", async e => {
  const chipBtn = e.target.closest("[data-la-chip]");
  if (chipBtn) {
    e.preventDefault();
    const id = chipBtn.getAttribute("data-la-chip");
    const list = chipBtn.closest(".la-chemlist");
    const det = list && list.querySelector('[data-la-chip-detail="' + id + '"]');
    if (!det) return;
    const open = det.hasAttribute("hidden");
    /* close siblings */
    list.querySelectorAll(".la-chip-detail").forEach(d => d.setAttribute("hidden", ""));
    list.querySelectorAll("[data-la-chip]").forEach(b => { b.setAttribute("aria-expanded", "false"); const h=b.querySelector(".la-chip-hint"); if(h) h.textContent="▾"; });
    if (open) {
      det.removeAttribute("hidden");
      chipBtn.setAttribute("aria-expanded", "true");
      const h = chipBtn.querySelector(".la-chip-hint"); if (h) h.textContent = "▴";
    }
    return;
  }
  const tog = e.target.closest(".la-dose-tog");
  if (tog) {
    e.preventDefault();
    const wrap = tog.closest(".la-dosewrap") || tog.closest(".la-chemrow");
    const det = wrap && wrap.querySelector(".la-dose-detail");
    if (!det) return;
    const open = det.hasAttribute("hidden");
    if (open) { det.removeAttribute("hidden"); tog.setAttribute("aria-expanded", "true"); tog.textContent = "▴"; }
    else { det.setAttribute("hidden", ""); tog.setAttribute("aria-expanded", "false"); tog.textContent = "▾"; }
    return;
  }
  const nav = e.target.closest("[data-la-nav]");
  if (nav) { e.preventDefault(); if (typeof verVista === "function") verVista(nav.dataset.laNav); return; }
  const bt = e.target.closest("[data-la]"); if (!bt || !LA.brief) return;
  const v = bt.dataset.la;
  const patch = v === "deshacer"
    ? { ask_respuesta: null, ask_respondido_at: null }
    : { ask_respuesta: v, ask_respondido_at: new Date().toISOString() };
  Object.assign(LA.brief, patch); renderLA();
  const { error } = await sb.from("cos_mike_brief_diario").update(patch).eq("fecha", LA.fecha);
  aviso(error ? "No se guardó · " + error.message : (v === "deshacer" ? "Listo" : "Mike lo verá"), !!error);
  try { localStorage.setItem("cosLA", JSON.stringify({ fecha: LA.fecha, brief: LA.brief })); } catch (err) {}
});
