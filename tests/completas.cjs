// Completas según el Ordinario de la Liturgia de las Horas: asignaciones por día,
// tiempo litúrgico, noche después de medianoche y antífona a la Virgen.
// Ejecutar: node tests/completas.cjs (requiere Playwright)
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
global.window={};eval(fs.readFileSync(path.join(root,'data.js'),'utf8'));
const C=window.HORAS_DATA.completas;
const txt=h=>h.replace(/<span class="tp">[^<]*<\/span>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const P=(d,t)=>C[d].partes.find(x=>x.t===t);

// 1. Ordinario: salmos, lectura breve y oración de cada noche (0 = domingo tras II Vísperas, 6 = sábado noche)
const ORD={
  6:{sal:['4','133'],lect:'Dt 6, 4-7',ora:'Visita, Señor, esta casa'},
  0:{sal:['90'],lect:'Ap 22, 4-5',ora:'misterio de la resurrección'},
  1:{sal:['85'],lect:'1 Ts 5, 9-10',ora:'concede a nuestros cuerpos'},
  2:{sal:['142, 1-11'],lect:'1 Pe 5, 8-9',ora:'Ilumina, Señor Dios, nuestras tinieblas'},
  3:{sal:['30, 2-6','129'],lect:'Ef 4, 26-27',ora:'manso y humilde de corazón'},
  4:{sal:['15'],lect:'1 Ts 5, 23',ora:'repara nuestras fuerzas'},
  5:{sal:['87'],lect:'Jer 14, 9',ora:'sepultado tu Unigénito'},
};
const ORDEN=['Invocación inicial','Examen de conciencia','Himno','Salmodia','Lectura breve','Responsorio','Cántico de Simeón','Oración conclusiva','Bendición','Antífona final a la Virgen'];
for(const [d,o] of Object.entries(ORD)){
  assert.deepEqual(C[d].partes.map(p=>p.t),ORDEN,`orden de las partes, día ${d}`);
  const sal=P(d,'Salmodia').c;
  assert.deepEqual([...sal.matchAll(/Salmo ([0-9, -]+) ·/g)].map(m=>m[1].trim()),o.sal,`salmos del día ${d}`);
  assert.equal((sal.match(/Gloria al Padre/g)||[]).length,o.sal.length,`un Gloria tras cada salmo, día ${d}`);
  assert.equal((sal.match(/class="ant"/g)||[]).length,o.sal.length*2,`antífona antes y después de cada salmo, día ${d}`);
  assert.ok(P(d,'Lectura breve').c.includes(`(${o.lect})`),`lectura del día ${d}: ${txt(P(d,'Lectura breve').c).slice(-20)}`);
  assert.ok(txt(P(d,'Oración conclusiva').c).includes(o.ora),`oración del día ${d}`);
  assert.match(txt(P(d,'Himno').c),/^Antes de que la luz termine/,'el Te lucis de Fernando es el himno');
  assert.match(txt(P(d,'Examen de conciencia').c),/nos lleve a la vida eterna\. Amén\.$/,'conclusión del acto penitencial');
  assert.ok(P(d,'Invocación inicial').c.includes('<span class="alel">Aleluya.</span>'),'aleluya marcable en la invocación');
  assert.ok(P(d,'Responsorio').c.includes('<span class="no-tp">Encomiendo mi espíritu.</span>'),'forma breve del responsorio');
}
// ninguna oración ni lectura repetida en dos noches
for(const t of ['Lectura breve','Oración conclusiva']) assert.equal(new Set(Object.keys(ORD).map(d=>P(d,t).c)).size,7,`${t}: una distinta cada noche`);

const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const errors=[];
  async function at(iso,width=390){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,timezoneId:'Europe/Madrid',serviceWorkers:'block',reducedMotion:'reduce'});
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date(iso)});
    await page.goto(url);
    return {ctx,page};
  }
  const vis=(page,sel)=>page.evaluate(s=>[...document.querySelectorAll(s)].filter(el=>el.offsetParent!==null).map(el=>el.textContent.trim()),sel);
  try{
    // 2. Domingo de Pascua (algoritmo gregoriano) y tiempos
    {const {ctx,page}=await at('2027-07-07T22:00:00+02:00');
     const pascuas=await page.evaluate(()=>[2024,2025,2026,2027,2028,2038].map(y=>{const d=HORAS.pascua(y);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}));
     assert.deepEqual(pascuas,['2024-3-31','2025-4-20','2026-4-5','2027-3-28','2028-4-16','2038-4-25']);
     const t=await page.evaluate(()=>['2027-02-09','2027-02-10','2027-03-27','2027-03-28','2027-05-16','2027-05-17'].map(s=>{const [y,m,d]=s.split('-').map(Number);return HORAS.tiempo(new Date(y,m-1,d))}));
     assert.deepEqual(t,['ordinario','cuaresma','cuaresma','pascua','pascua','ordinario'],'Ceniza, Sábado Santo, Pascua, Pentecostés');
     // 3. Tiempo ordinario, miércoles 22:00
     await page.locator('#pta-completas').click();
     assert.equal(await page.evaluate(()=>document.querySelector('#osub').textContent),'Miércoles');
     assert.ok((await vis(page,'.alel')).includes('Aleluya.'),'aleluya en la invocación fuera de Cuaresma');
     assert.deepEqual(await vis(page,'.tp'),[],'sin aleluyas pascuales');
     assert.deepEqual(await vis(page,'.antv[data-ant="salve"]').then(x=>x.length),1,'Salve por defecto');
     // 4. Después de medianoche sigue siendo la noche del miércoles
     await page.clock.setFixedTime(new Date('2027-07-08T01:30:00+02:00'));
     await page.reload();
     await page.locator('#pta-completas').click();
     assert.equal(await page.evaluate(()=>document.querySelector('#osub').textContent),'Miércoles','a la 1:30 del jueves, Completas del miércoles');
     assert.match(await page.locator('#odia').textContent(),/7 de julio/);
     await page.locator('#completar').click();
     assert.deepEqual(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('horas_hechos'))).filter(k=>JSON.parse(localStorage.getItem('horas_hechos'))[k].includes('completas'))),['2027-07-07'],'cuenta para la noche del miércoles');
     await ctx.close();}
    // 5. Cuaresma: sin aleluya
    {const {ctx,page}=await at('2027-03-10T22:00:00+01:00');
     await page.locator('#pta-completas').click();
     assert.deepEqual(await vis(page,'.alel'),[],'sin aleluya en Cuaresma');
     assert.match(await page.locator('#odia').textContent(),/Cuaresma/);
     await ctx.close();}
    // 6. Pascua: aleluyas, responsorio pascual y Regina caeli, que se puede cambiar esa noche
    {const {ctx,page}=await at('2027-04-14T22:00:00+02:00',320);
     await page.locator('#pta-completas').click();
     const ants=await page.evaluate(()=>[...document.querySelectorAll('.parte .ant')].filter(el=>el.offsetParent).map(el=>el.textContent.trim()));
     assert.ok(ants.length>=4&&ants.every(a=>/Aleluya\.$/.test(a)),'antífonas con aleluya en Pascua: '+ants.join(' | '));
     const resp=await page.evaluate(()=>[...document.querySelectorAll('.parte')].find(p=>p.querySelector('h3').textContent==='Responsorio').innerText);
     assert.match(resp,/Aleluya, aleluya/); assert.doesNotMatch(resp,/Encomiendo mi espíritu/);
     assert.equal(await page.locator('.ant-final').getAttribute('data-sel'),'regina','Regina caeli por defecto en Pascua');
     const sel=await page.locator('.antsel button').evaluateAll(b=>b.map(x=>{const r=x.getBoundingClientRect();return [x.textContent,Math.round(r.height)]}));
     assert.ok(sel.every(([,h])=>h>=44),'botones de antífona de 44 px: '+JSON.stringify(sel));
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'sin desbordar a 320 px');
     await page.locator('.antsel button[data-ant="salve"]').click();
     assert.equal(await page.locator('.ant-final').getAttribute('data-sel'),'salve');
     await page.reload(); await page.locator('#pta-completas').click();
     assert.equal(await page.locator('.ant-final').getAttribute('data-sel'),'salve','la elección dura toda la noche');
     await page.clock.setFixedTime(new Date('2027-04-15T22:00:00+02:00'));
     await page.reload(); await page.locator('#pta-completas').click();
     assert.equal(await page.locator('.ant-final').getAttribute('data-sel'),'regina','a la noche siguiente vuelve la del tiempo');
     await ctx.close();}
    assert.deepEqual(errors,[]);
    console.log('PASS: Ordinario de Completas, tiempos litúrgicos, noche tras medianoche y antífona a la Virgen.');
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
