/* ==========================================================================
   Horas · Devocionario — lógica de la app
   ========================================================================== */
(function(){
"use strict";

var D = window.HORAS_DATA;
var MANANA = D.manana, COMPLETAS = D.completas, MISA = D.misa;
var DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
var TEMAS = ["papel","sepia","noche"];

var HOY = new Date();
var CLAVE = HOY.getDay();
var RUB = false;
var SECCION = null;
var LISTA = [];
var PARTES = [];
var ACTUAL = -1;

var $ = function(id){ return document.getElementById(id); };
var raiz = document.documentElement;

function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function fechaLarga(d){ return cap(DIAS[d.getDay()]) + ", " + d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear(); }
function fechaLocal(d){ return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function actualizaDia(){
  var ahora = new Date();
  HOY = ahora;
  CLAVE = HOY.getDay();
}

/* ---------------------------------------------------------------- Ajustes */
function tema(){ return raiz.getAttribute("data-theme") || "papel"; }
function ponTema(t){
  if(TEMAS.indexOf(t) < 0) t = "papel";
  raiz.setAttribute("data-theme", t);
  try{ localStorage.setItem("horas_tema", t); }catch(e){}
  var botones = document.querySelectorAll(".tema");
  for(var i=0;i<botones.length;i++) botones[i].classList.toggle("sel", botones[i].getAttribute("data-t") === t);
  var meta = document.querySelector('meta[name="theme-color"]');
  var color = t === "noche" ? "#10161E" : (t === "sepia" ? "#F2E9D8" : "#F7F5F0");
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  for(var j=0;j<metas.length;j++) metas[j].setAttribute("content", color);
  if(meta) meta.setAttribute("content", color);
}
function escala(){ return parseFloat(getComputedStyle(raiz).getPropertyValue("--font-scale")) || 1; }
function ponEscala(v){
  v = Math.min(1.4, Math.max(0.85, +v.toFixed(2)));
  raiz.style.setProperty("--font-scale", v);
  try{ localStorage.setItem("horas_fuente", v); }catch(e){}
  $("fsval").textContent = Math.round(v * 100) + "%";
}
function cargaAjustes(){
  var t = "papel", f = 1;
  try{
    t = localStorage.getItem("horas_tema") || "papel";
    f = parseFloat(localStorage.getItem("horas_fuente")) || 1;
  }catch(e){}
  ponTema(t);
  ponEscala(f);
}

/* ------------------------------------------------------------------ Hojas */
/* Historial: cada vista que abrimos añade una entrada, para que el botón
   "atrás" del móvil cierre la hoja o el oficio en vez de salir de la app. */
var PROF = 0;          /* entradas que hemos añadido nosotros */
var IGNORA_POP = false;
var FOCO_ANTERIOR = null;

function apila(v){ PROF++; history.pushState({ v:v }, ""); }
function desapila(){
  if(PROF > 0){ PROF--; IGNORA_POP = true; history.back(); }
}

function hojaAbierta(){ return document.querySelector(".hoja.on"); }
function pintaHojaCerrada(){
  var hs = document.querySelectorAll(".hoja.on");
  for(var i=0;i<hs.length;i++) hs[i].classList.remove("on");
  $("scrim").classList.remove("on");
  document.body.style.overflow = "";
}
function abreHoja(id){
  if(hojaAbierta()){ pintaHojaCerrada(); desapila(); }
  FOCO_ANTERIOR = document.activeElement;
  $(id).classList.add("on");
  $("scrim").classList.add("on");
  document.body.style.overflow = "hidden";
  apila("hoja");
  setTimeout(function(){ $(id).focus(); }, 30);
}
function cierraHojas(){
  if(!hojaAbierta()) return;
  pintaHojaCerrada();
  desapila();
  if(FOCO_ANTERIOR && FOCO_ANTERIOR.focus) FOCO_ANTERIOR.focus();
}

/* ------------------------------------------------------------- Contenidos */
function minutos(lista){
  var n = 0;
  for(var i=0;i<lista.length;i++){
    var txt = (lista[i].c || "").replace(/<[^>]+>/g, " ");
    n += txt.split(/\s+/).length;
  }
  return Math.max(1, Math.round(n / 130));
}

function render(lista){
  var h = "", d = 0;
  for(var i=0;i<lista.length;i++){
    var p = lista[i];
    if(p.g) h += '<div class="grupo"><i></i><span>' + p.g + '</span><i></i></div>';
    d = Math.min(i * 45, 360);
    h += '<article class="parte" id="parte' + i + '" style="animation-delay:' + d + 'ms">' +
           '<header class="ptit">' +
             '<span class="n">' + p.n + '</span>' +
             '<h3>' + p.t + '</h3>' +
             '<button class="cald' + (RUB ? "" : " oculto") + '" id="cald' + i + '" aria-label="Ver explicación" aria-expanded="false" aria-controls="rub' + i + '" onclick="HORAS.toggle(' + i + ')">¶</button>' +
           '</header>' +
           p.c +
           '<div class="rubrica" id="rub' + i + '">' + p.r + '</div>' +
         '</article>';
  }
  $("cuerpo").innerHTML = h;
  PARTES = [].slice.call(document.querySelectorAll(".parte"));
  versos();
}

/* Cada verso pasa a ser una línea propia con sangría francesa: si no cabe en
   el ancho del móvil, la continuación queda entrada en vez de fingir un verso
   nuevo. Se hace sobre el DOM para no romper las etiquetas del texto. */
function versos(){
  var ps = $("cuerpo").querySelectorAll(".bloque p");
  for(var i=0;i<ps.length;i++){
    var p = ps[i];
    if(!p.getElementsByTagName("br").length) continue;
    var lineas = [], linea = document.createElement("span");
    linea.className = "v";
    while(p.firstChild){
      var n = p.firstChild;
      if(n.nodeName === "BR"){ p.removeChild(n); lineas.push(linea); linea = document.createElement("span"); linea.className = "v"; }
      else linea.appendChild(n);
    }
    lineas.push(linea);
    for(var j=0;j<lineas.length;j++) if(lineas[j].childNodes.length) p.appendChild(lineas[j]);
  }
}

function indice(lista){
  var h = "";
  for(var i=0;i<lista.length;i++){
    var p = lista[i];
    if(p.g) h += '<li class="gs">' + p.g + '</li>';
    h += '<li><a href="#parte' + i + '" data-i="' + i + '" onclick="HORAS.irA(' + i + ');return false;"><b>' + p.n + '</b>' + p.t + '</a></li>';
  }
  $("indlista").innerHTML = h;
}


/* Saltar de un momento del día a otro sin pasar por la portada */
var ICONOS = {
  manana: '<svg viewBox="0 0 24 24"><path d="M3.5 18.5h17"/><path d="M7 18.5a5 5 0 0 1 10 0"/><path d="M12 4.5v2.6"/><path d="M5.4 7.6l1.9 1.9"/><path d="M18.6 7.6l-1.9 1.9"/></svg>',
  completas: '<svg viewBox="0 0 24 24"><path d="M18.5 15.2A7.2 7.2 0 0 1 9.3 5.6a7.2 7.2 0 1 0 9.2 9.6z"/><path d="M17.2 3.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/></svg>',
  misa: '<svg viewBox="0 0 24 24"><path d="M6.6 4h10.8v2.6c0 3-2.4 5.4-5.4 5.4S6.6 9.6 6.6 6.6z"/><path d="M12 12v5.2"/><path d="M9.4 20h5.2"/><path d="M9.6 20c0-1.4 1.1-2.5 2.4-2.5s2.4 1.1 2.4 2.5"/></svg>'
};
function saltos(actual){
  var otros = ["manana","completas","misa"], h = '<span class="et">Ir a otro momento</span><div class="bs">';
  for(var i=0;i<otros.length;i++){
    if(otros[i] === actual) continue;
    h += '<button onclick="HORAS.cambia(\'' + otros[i] + '\')">' + ICONOS[otros[i]] + titulo(otros[i]) + '</button>';
  }
  $("saltos").innerHTML = h + '</div>';
}
function cambia(c){
  cierraHojas();
  setTimeout(function(){ abrir(c); }, 280);
}

function toggle(i){
  var abierta = $("rub" + i).classList.toggle("abierta");
  $("cald" + i).classList.toggle("abierto", abierta);
  $("cald" + i).setAttribute("aria-expanded", abierta ? "true" : "false");
  $("parte" + i).classList.toggle("abierta", abierta);
}

function rubs(){
  RUB = !RUB;
  var bt = $("rt");
  bt.classList.toggle("on", RUB);
  bt.innerHTML = '<span>¶</span> ' + (RUB ? "Ocultar" : "Entender");
  var cs = document.querySelectorAll(".cald");
  for(var i=0;i<cs.length;i++) cs[i].classList.toggle("oculto", !RUB);
  if(!RUB){
    var rs = document.querySelectorAll(".rubrica.abierta");
    for(var j=0;j<rs.length;j++) rs[j].classList.remove("abierta");
    var ab = document.querySelectorAll(".cald.abierto");
    for(var k=0;k<ab.length;k++) ab[k].classList.remove("abierto");
    var ps = document.querySelectorAll(".parte.abierta");
    for(var m=0;m<ps.length;m++) ps[m].classList.remove("abierta");
  }
}

/* -------------------------------------------------------------- Navegación */
function titulo(c){ return c === "manana" ? "Mañana" : (c === "misa" ? "La Misa" : "Completas"); }

function abrir(c, scroll){
  actualizaDia();
  SECCION = c;
  if(c === "manana"){
    LISTA = MANANA;
    $("odia").textContent = fechaLarga(HOY);
    $("onombre").textContent = "Mañana";
    $("osub").textContent = "Ofrecimiento del día";
  }else if(c === "misa"){
    LISTA = MISA;
    $("odia").textContent = "Rito romano";
    $("onombre").textContent = "La Misa";
    $("osub").textContent = "Explicación de cada parte, paso a paso";
  }else{
    LISTA = COMPLETAS[CLAVE].partes;
    $("odia").textContent = fechaLarga(HOY);
    $("onombre").textContent = "Completas";
    $("osub").textContent = COMPLETAS[CLAVE].nombre;
  }
  $("ttitulo").textContent = titulo(c);
  $("tspy").textContent = LISTA.length + " partes · ≈" + minutos(LISTA) + " min";
  $("indice-tit").textContent = "Índice · " + titulo(c);
  render(LISTA);
  indice(LISTA);
  saltos(c);
  ACTUAL = -1;

  $("portada").classList.add("oculto");
  $("oficio").classList.add("on");
  $("fab").classList.add("on");
  pintaCompletar();
  window.scrollTo(0, scroll || 0);
  barraProgreso();
  apila("oficio");
}

function volverInterno(){
  guarda();
  $("oficio").classList.remove("on");
  $("portada").classList.remove("oculto");
  $("fab").classList.remove("on");
  RUB = false;
  var bt = $("rt");
  bt.classList.remove("on");
  bt.innerHTML = '<span>¶</span> Entender';
  SECCION = null;
  window.scrollTo(0, 0);
  revisaContinuar();
}

function volver(){
  volverInterno();
  desapila();
}

function irA(i){
  cierraHojas();
  var el = $("parte" + i);
  if(!el) return;
  setTimeout(function(){ el.scrollIntoView({ behavior:"smooth", block:"start" }); }, 260);
}

window.addEventListener("popstate", function(){
  if(IGNORA_POP){ IGNORA_POP = false; return; }   /* cierre iniciado por nosotros */
  if(PROF > 0) PROF--;
  if(hojaAbierta()){ pintaHojaCerrada(); return; }
  if(SECCION) volverInterno();
});

/* ----------------------------------------------------------- Scroll y spy */
function barraProgreso(){
  var h = document.documentElement;
  var max = h.scrollHeight - h.clientHeight;
  var pct = max > 20 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
  $("progreso").style.width = pct + "%";
  $("progreso").setAttribute("aria-valuenow", Math.round(pct));
}
function spy(){
  if(!PARTES.length) return;
  var i, idx = 0;
  for(i=0;i<PARTES.length;i++){
    if(PARTES[i].getBoundingClientRect().top <= 130) idx = i; else break;
  }
  if(idx === ACTUAL) return;
  ACTUAL = idx;
  var p = LISTA[idx];
  if(p) $("tspy").textContent = p.n + " · " + p.t;
  var enlaces = document.querySelectorAll("#indlista a");
  for(i=0;i<enlaces.length;i++) enlaces[i].classList.toggle("actual", +enlaces[i].getAttribute("data-i") === idx);
}
/* El botón de índice se aparta al bajar y vuelve al subir */
var yPrev = 0;
function fab(){
  var y = window.scrollY;
  if(!SECCION){ yPrev = y; return; }
  var baja = y > yPrev + 8, sube = y < yPrev - 8;
  if(baja && y > 260) $("fab").classList.add("esconde");
  else if(sube) $("fab").classList.remove("esconde");
  if(baja || sube) yPrev = y;
}

var pend = false;
window.addEventListener("scroll", function(){
  if(pend) return;
  pend = true;
  requestAnimationFrame(function(){
    barraProgreso();
    if(SECCION){ spy(); fab(); }
    pend = false;
    programaGuardado();
  });
}, { passive:true });

/* -------------------------------------------------------------- Continuar */
var tGuardado = null;
function programaGuardado(){
  if(tGuardado || !SECCION) return;
  tGuardado = setTimeout(function(){ guarda(); tGuardado = null; }, 500);
}
function guarda(){
  if(!SECCION) return;
  try{
    localStorage.setItem("horas_pos", JSON.stringify({
      s:SECCION, y:window.scrollY, i:ACTUAL, d:fechaLocal(new Date())
    }));
  }catch(e){}
}
function revisaContinuar(){
  var chip = $("continuar");
  try{
    var raw = localStorage.getItem("horas_pos");
    if(!raw){ chip.classList.remove("on"); return; }
    var p = JSON.parse(raw);
    if(p.d !== fechaLocal(new Date()) || p.y < 120){ chip.classList.remove("on"); return; }
    var lista = p.s === "manana" ? MANANA : (p.s === "misa" ? MISA : COMPLETAS[CLAVE].partes);
    var parte = lista[p.i] ? lista[p.i].t : "";
    $("continuartxt").textContent = titulo(p.s) + (parte ? " · " + parte : "");
    chip.classList.add("on");
    chip.onclick = function(){ abrir(p.s, p.y); };
  }catch(e){ chip.classList.remove("on"); }
}

/* ---------------------------------------------------------------- Portada */
function leeHechos(){
  try{
    var datos = JSON.parse(localStorage.getItem("horas_hechos") || "{}");
    return datos && typeof datos === "object" ? datos : {};
  }catch(e){ return {}; }
}
function hechosHoy(){
  var todos = leeHechos(), xs = todos[fechaLocal(new Date())];
  return Array.isArray(xs) ? xs.filter(function(x){ return ["manana","misa","completas"].indexOf(x) >= 0; }) : [];
}
function guardaHechos(xs){
  try{
    var todos = leeHechos(), hoy = fechaLocal(new Date()), claves = Object.keys(todos).sort().slice(-59);
    var limpio = {};
    for(var i=0;i<claves.length;i++) limpio[claves[i]] = todos[claves[i]];
    limpio[hoy] = xs;
    localStorage.setItem("horas_hechos", JSON.stringify(limpio));
  }catch(e){}
}
function pintaRitmo(){
  var xs = hechosHoy(), nombres = ["manana","misa","completas"];
  $("ritmo-txt").textContent = xs.length + " de 3 momentos";
  for(var i=0;i<nombres.length;i++){
    var hecho = xs.indexOf(nombres[i]) >= 0;
    $("punto-" + nombres[i]).classList.toggle("on", hecho);
    $("hecho-" + nombres[i]).hidden = !hecho;
  }
}
function pintaCompletar(){
  if(!SECCION) return;
  var hecho = hechosHoy().indexOf(SECCION) >= 0;
  $("completar").classList.toggle("on", hecho);
  $("completar").setAttribute("aria-pressed", hecho ? "true" : "false");
  $("completar-titulo").textContent = hecho ? "Rezado hoy" : "Marcar como rezado";
  $("completar-sub").textContent = hecho ? "Toca para desmarcar" : "Se guardará solo en este dispositivo";
}
function completar(){
  if(!SECCION) return;
  var xs = hechosHoy(), pos = xs.indexOf(SECCION);
  if(pos >= 0) xs.splice(pos,1); else xs.push(SECCION);
  guardaHechos(xs); pintaCompletar(); pintaRitmo();
}
function pintaPortada(){
  actualizaDia();
  $("fecha").textContent = DIAS[HOY.getDay()] + " · " + HOY.getDate() + " de " + MESES[HOY.getMonth()];
  $("meta-manana").textContent = MANANA.length + " oraciones · ≈" + minutos(MANANA) + " min";
  var comp = COMPLETAS[CLAVE];
  var nombreComp = CLAVE === 6 ? "Sábado noche" : comp.nombre.split(" · ")[0];
  $("meta-completas").textContent = nombreComp + " · ≈" + minutos(comp.partes) + " min";
  $("meta-misa").textContent = MISA.length + " partes explicadas";

  var hora = HOY.getHours();
  var ahora = hora < 12 ? "manana" : (hora < 20 ? "misa" : "completas");
  var nombres = ["manana","misa","completas"];
  for(var i=0;i<nombres.length;i++){
    $("pta-" + nombres[i]).classList.remove("ahora");
    $("badge-" + nombres[i]).hidden = true;
  }
  $("pta-" + ahora).classList.add("ahora");
  $("badge-" + ahora).hidden = false;
  pintaRitmo();
}

/* -------------------------------------------------- Pantalla siempre encendida */
var wakeLock = null, wakeOn = false;
function soportaWake(){ return "wakeLock" in navigator; }
async function pideWake(){
  if(wakeLock && !wakeLock.released) return;
  try{
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", function(){ wakeLock = null; });
  }
  catch(e){ wakeOn = false; pintaPalanca(); }
}
function pintaPalanca(){
  var p = $("palanca-pantalla");
  p.classList.toggle("on", wakeOn);
  p.setAttribute("aria-checked", wakeOn ? "true" : "false");
}
function alternaWake(){
  wakeOn = !wakeOn;
  try{ localStorage.setItem("horas_pantalla", wakeOn ? "1" : "0"); }catch(e){}
  pintaPalanca();
  if(wakeOn) pideWake();
  else if(wakeLock){ wakeLock.release(); wakeLock = null; }
}
function iniciaWake(){
  if(!soportaWake()) return;
  $("grupo-pantalla").hidden = false;
  try{ wakeOn = localStorage.getItem("horas_pantalla") === "1"; }catch(e){}
  pintaPalanca();
  if(wakeOn) pideWake();
  $("palanca-pantalla").addEventListener("click", alternaWake);
  document.addEventListener("visibilitychange", function(){
    if(wakeOn && !document.hidden) pideWake();
  });
}

/* ------------------------------------------------------------ Instalación */
var promptInstalar = null;
window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault();
  promptInstalar = e;
  $("instalar").classList.add("on");
});
window.addEventListener("appinstalled", function(){ $("instalar").classList.remove("on"); });
function instalar(){
  if(!promptInstalar) return;
  promptInstalar.prompt();
  promptInstalar.userChoice.then(function(){ promptInstalar = null; $("instalar").classList.remove("on"); });
}

/* ------------------------------------------------------------------ Enlaces */
$("bajustes1").addEventListener("click", function(){ abreHoja("hojaajustes"); });
$("bajustes2").addEventListener("click", function(){ abreHoja("hojaajustes"); });
$("fab").addEventListener("click", function(){ abreHoja("hojaindice"); });
$("scrim").addEventListener("click", function(){ cierraHojas(); });
var cerrar = document.querySelectorAll("[data-cerrar]");
for(var q=0;q<cerrar.length;q++) cerrar[q].addEventListener("click", function(){ cierraHojas(); });
var temas = document.querySelectorAll(".tema");
for(var w=0;w<temas.length;w++) temas[w].addEventListener("click", function(){ ponTema(this.getAttribute("data-t")); });
$("fmenos").addEventListener("click", function(){ ponEscala(escala() - 0.05); });
$("fmas").addEventListener("click", function(){ ponEscala(escala() + 0.05); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape" && hojaAbierta()) cierraHojas(); });

/* Arrastrar la hoja hacia abajo para cerrarla */
(function(){
  var hojas = document.querySelectorAll(".hoja");
  for(var i=0;i<hojas.length;i++){
    (function(hoja){
      var y0 = null;
      hoja.addEventListener("touchstart", function(e){
        var cuerpo = hoja.querySelector(".hcuerpo");
        if(cuerpo.scrollTop > 0 && cuerpo.contains(e.target)) return;
        y0 = e.touches[0].clientY;
      }, { passive:true });
      hoja.addEventListener("touchmove", function(e){
        if(y0 === null) return;
        var dy = e.touches[0].clientY - y0;
        if(dy > 0){ hoja.style.transform = "translateY(" + dy + "px)"; hoja.style.transition = "none"; }
      }, { passive:true });
      hoja.addEventListener("touchend", function(){
        if(y0 === null) return;
        var m = /translateY\((\d+(?:\.\d+)?)px\)/.exec(hoja.style.transform);
        hoja.style.transition = "";
        hoja.style.transform = "";
        if(m && parseFloat(m[1]) > 90) cierraHojas();
        y0 = null;
      });
    })(hojas[i]);
  }
})();

window.addEventListener("pagehide", guarda);
document.addEventListener("visibilitychange", function(){ if(document.hidden) guarda(); });

if("serviceWorker" in navigator){
  window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
}

$("ttitulo").addEventListener("click", function(){ window.scrollTo({ top:0, behavior:"smooth" }); });

cargaAjustes();
pintaPortada();
revisaContinuar();
iniciaWake();

window.HORAS = { abrir:abrir, volver:volver, toggle:toggle, rubs:rubs, irA:irA, instalar:instalar, cambia:cambia, completar:completar };
var acceso = new URLSearchParams(location.search).get("abrir");
if(["manana","completas","misa"].indexOf(acceso) >= 0) setTimeout(function(){ abrir(acceso); }, 0);
})();
