(function(){
"use strict";
var D = window.HORAS_DATA;
var MANANA = D.manana, COMPLETAS = D.completas, MISA = D.misa;
var DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function claveCompletas(d){ var g=d.getDay(); if(g===6) return 6; if(g===0) return 0; return g; }
function fechaLarga(d){ return DIAS_ES[d.getDay()].charAt(0).toUpperCase()+DIAS_ES[d.getDay()].slice(1)+", "+d.getDate()+" de "+MESES[d.getMonth()]+" de "+d.getFullYear(); }

var HOY = new Date();
var CLAVE = claveCompletas(HOY);
var RUB = false;
var SECCION = null;
var LISTA_ACTUAL = [];

var $ = function(id){ return document.getElementById(id); };

$("fecha").textContent = DIAS_ES[HOY.getDay()]+" · "+HOY.getDate()+" de "+MESES[HOY.getMonth()]+" de "+HOY.getFullYear();
$("scomp").textContent = "Oración de la noche · "+COMPLETAS[CLAVE].nombre.split(" · ")[0].toLowerCase();

/* ---------- Preferencias (tema y tamaño de letra) ---------- */
var root = document.documentElement;
function cargarPrefs(){
  try{
    var t = localStorage.getItem("horas_tema");
    if(t === "dark" || t === "light"){ root.setAttribute("data-theme", t); }
    var f = parseFloat(localStorage.getItem("horas_fuente"));
    if(f && f >= 0.85 && f <= 1.35){ root.style.setProperty("--font-scale", f); }
  }catch(e){}
  actualizarBotonTema();
  actualizarFuenteVal();
}
function temaActual(){
  var a = root.getAttribute("data-theme");
  if(a) return a;
  return "light";
}
function actualizarBotonTema(){
  var b = $("btema");
  if(!b) return;
  b.setAttribute("aria-pressed", temaActual()==="dark" ? "true" : "false");
}
function toggleTema(){
  var nuevo = temaActual()==="dark" ? "light" : "dark";
  root.setAttribute("data-theme", nuevo);
  try{ localStorage.setItem("horas_tema", nuevo); }catch(e){}
  actualizarBotonTema();
}
function fuenteVal(){
  return parseFloat(getComputedStyle(root).getPropertyValue("--font-scale")) || 1;
}
function actualizarFuenteVal(){
  var v = $("fsval");
  if(v) v.textContent = Math.round(fuenteVal()*100)+"%";
}
function cambiarFuente(delta){
  var v = Math.min(1.35, Math.max(0.85, +(fuenteVal()+delta).toFixed(2)));
  root.style.setProperty("--font-scale", v);
  try{ localStorage.setItem("horas_fuente", v); }catch(e){}
  actualizarFuenteVal();
}
$("btema").addEventListener("click", toggleTema);
$("fmenos").addEventListener("click", function(){ cambiarFuente(-0.05); });
$("fmas").addEventListener("click", function(){ cambiarFuente(0.05); });
function togglePanel(){ $("panelfuente").classList.toggle("abierto"); }
$("bajustes1").addEventListener("click", togglePanel);
$("bajustes2").addEventListener("click", togglePanel);
document.addEventListener("click", function(e){
  var p = $("panelfuente");
  if(p && p.classList.contains("abierto") && !p.contains(e.target) && e.target !== $("bajustes1") && e.target !== $("bajustes2")){
    p.classList.remove("abierto");
  }
});
cargarPrefs();

/* ---------- Render de un oficio ---------- */
function render(lista){
  var h = "";
  for(var i=0;i<lista.length;i++){
    var p = lista[i];
    if(p.g) h += '<div class="grupo" id="grupo'+i+'">'+p.g+'</div>';
    h += '<div class="parte" id="parte'+i+'" data-n="'+p.n+'" data-t="'+p.t.replace(/"/g,"&quot;")+'"><div class="ptit"><span class="n">'+p.n+'</span>'+p.t+
       '<button class="cald'+(RUB?"":" oculto")+'" id="cald'+i+'" aria-label="Ver explicación" onclick="HORAS.toggle('+i+')">¶</button></div>'+
       p.c+'<div class="rubrica" id="rub'+i+'">'+p.r+'</div></div>';
  }
  $("cuerpo").innerHTML = h;
}

function toggle(i){
  var abierta = $("rub"+i).classList.toggle("abierta");
  $("cald"+i).classList.toggle("abierto", abierta);
  $("parte"+i).classList.toggle("abierta", abierta);
}

function rubs(){
  RUB = !RUB;
  var bt = $("rt");
  bt.classList.toggle("on", RUB);
  bt.innerHTML = '<span class="pt">¶</span>'+(RUB?"Ocultar":"Entender");
  var cs = document.querySelectorAll(".cald");
  for(var i=0;i<cs.length;i++) cs[i].classList.toggle("oculto", !RUB);
  if(!RUB){
    var rs = document.querySelectorAll(".rubrica");
    for(var j=0;j<rs.length;j++) rs[j].classList.remove("abierta");
    var ks = document.querySelectorAll(".cald");
    for(var k=0;k<ks.length;k++) ks[k].classList.remove("abierto");
    var ps = document.querySelectorAll(".parte");
    for(var m=0;m<ps.length;m++) ps[m].classList.remove("abierta");
  }
}

/* ---------- Índice (tabla de contenidos) ---------- */
function construirIndice(lista){
  var h = "<ul>";
  for(var i=0;i<lista.length;i++){
    var p = lista[i];
    if(p.g) h += '<li class="gsep">'+p.g+'</li>';
    h += '<li><a href="#parte'+i+'" onclick="HORAS.irA('+i+');return false;"><b>'+p.n+'</b>'+p.t+'</a></li>';
  }
  h += "</ul>";
  $("listaindice").innerHTML = h;
}
function abrirIndice(){
  $("velo").classList.add("abierto");
  $("hoja").classList.add("abierto");
}
function cerrarIndice(){
  $("velo").classList.remove("abierto");
  $("hoja").classList.remove("abierto");
}
function irA(i){
  cerrarIndice();
  var el = $("parte"+i);
  if(el) setTimeout(function(){ el.scrollIntoView({behavior:"smooth", block:"start"}); }, 220);
}

/* ---------- Navegación entre secciones ---------- */
function guardarProgreso(){
  if(!SECCION) return;
  try{
    localStorage.setItem("horas_progreso", JSON.stringify({
      seccion: SECCION, scroll: window.scrollY, fecha: new Date().toISOString().slice(0,10)
    }));
  }catch(e){}
}
var guardarThrottle = null;
function onScroll(){
  actualizarProgresoBarra();
  if(guardarThrottle) return;
  guardarThrottle = setTimeout(function(){ guardarProgreso(); guardarThrottle = null; }, 400);
}
function actualizarProgresoBarra(){
  var b = $("progreso");
  if(!b) return;
  var h = document.documentElement;
  var max = h.scrollHeight - h.clientHeight;
  var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY/max)*100)) : 0;
  b.style.width = pct+"%";
}

function tituloSeccion(c){
  if(c==="manana") return "Mañana";
  if(c==="misa") return "La Misa";
  return "Completas";
}

function abrir(c, scrollGuardado){
  SECCION = c;
  if(c==="manana"){
    $("titulo").textContent = "Mañana";
    $("subfecha").innerHTML = fechaLarga(HOY);
    LISTA_ACTUAL = MANANA;
  }else if(c==="misa"){
    $("titulo").textContent = "La Misa";
    $("subfecha").innerHTML = "Rito romano · explicación de cada parte";
    LISTA_ACTUAL = MISA;
  }else{
    $("titulo").textContent = "Completas";
    $("subfecha").innerHTML = fechaLarga(HOY)+" · <b>"+COMPLETAS[CLAVE].nombre+"</b>";
    LISTA_ACTUAL = COMPLETAS[CLAVE].partes;
  }
  render(LISTA_ACTUAL);
  construirIndice(LISTA_ACTUAL);
  $("portada").style.display = "none";
  $("oficio").style.display = "block";
  window.scrollTo(0, scrollGuardado || 0);
  actualizarProgresoBarra();
}

function volver(){
  guardarProgreso();
  $("oficio").style.display = "none";
  $("portada").style.display = "block";
  RUB = false;
  var bt = $("rt");
  bt.classList.remove("on");
  bt.innerHTML = '<span class="pt">¶</span>Entender';
  window.scrollTo(0,0);
  revisarContinuar();
}

/* ---------- Chip "Continuar" en portada ---------- */
function revisarContinuar(){
  var chip = $("continuar");
  if(!chip) return;
  try{
    var raw = localStorage.getItem("horas_progreso");
    if(!raw){ chip.classList.remove("on"); return; }
    var p = JSON.parse(raw);
    var hoyStr = new Date().toISOString().slice(0,10);
    if(p.fecha !== hoyStr || p.scroll < 80){ chip.classList.remove("on"); return; }
    $("continuartxt").textContent = "Retomar " + tituloSeccion(p.seccion).toLowerCase() + " donde lo dejaste";
    chip.classList.add("on");
    chip.onclick = function(){ abrir(p.seccion, p.scroll); };
  }catch(e){ chip.classList.remove("on"); }
}

/* ---------- Instalación (PWA) ---------- */
var deferredPrompt = null;
window.addEventListener("beforeinstallprompt", function(e){
  e.preventDefault();
  deferredPrompt = e;
  var b = $("instalar");
  if(b) b.classList.add("on");
});
function instalar(){
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(){ deferredPrompt = null; $("instalar").classList.remove("on"); });
}
window.addEventListener("appinstalled", function(){
  var b = $("instalar");
  if(b) b.classList.remove("on");
});

if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
  });
}

window.addEventListener("scroll", onScroll, {passive:true});
window.addEventListener("pagehide", guardarProgreso);
document.addEventListener("visibilitychange", function(){ if(document.hidden) guardarProgreso(); });

$("bindice").addEventListener("click", abrirIndice);
$("velo").addEventListener("click", cerrarIndice);

revisarContinuar();

window.HORAS = { abrir:abrir, volver:volver, toggle:toggle, rubs:rubs, irA:irA, instalar:instalar };
})();
