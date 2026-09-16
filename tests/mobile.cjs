const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce',timezoneId:'Europe/Madrid'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=`http://127.0.0.1:${server.address().port}/`;
    await page.goto(url);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
    const shot=async name=>page.screenshot({path:path.join(__dirname,'artifacts',name+'.png'),fullPage:false});
    const fit=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
    await fit();await shot('home');
    await page.locator('#pta-manana').click();
    await page.locator('.bookmark').first().click();
    assert.equal(await page.locator('.bookmark').first().getAttribute('aria-pressed'),'true');
    await page.locator('#parte-siguiente').click();
    await page.waitForFunction(()=>document.getElementById('tspy').textContent.startsWith('02'));
    assert.match(await page.locator('#tspy').textContent(),/2/);
    assert.equal(await page.locator('#fab').isVisible(),true);
    await page.locator('#fab').click();
    assert.equal(await page.locator('#hojaindice').isVisible(),true);
    await page.locator('#indlista a').nth(3).click();
    await page.waitForTimeout(350);
    await page.locator('#bajustes2').click();
    await page.locator('[data-t="noche"]').click();
    for(let i=0;i<8;i++)await page.locator('#fmas').click();
    assert.equal(await page.locator('#fsval').textContent(),'140%');
    await shot('settings');
    await page.locator('#hojaajustes [data-cerrar]').click();
    await page.waitForTimeout(100);
    await page.locator('#rt').click();
    await page.locator('#cald3').click();
    assert.equal(await page.locator('#rub3').isVisible(),true);
    await fit();await shot('reader-night');
    await page.locator('#rt').click();
    assert.equal(await page.locator('#cald3').getAttribute('aria-expanded'),'false');
    await page.locator('#completar').click();
    await page.locator('[aria-label="Volver"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#hecho-manana').isVisible(),true);
    assert.equal(await page.locator('#continuar').isVisible(),true);
    await page.locator('#nav-oraciones').click();
    await page.locator('#filtro-favoritos').click();
    assert.equal(await page.locator('.result').count(),1);
    await page.locator('.result').click();
    assert.equal(await page.locator('#onombre').textContent(),'Mañana');
    await page.locator('[aria-label="Volver"]').click();await page.waitForTimeout(100);
    assert.equal(await page.locator('#biblioteca').isVisible(),true);
    await page.locator('#filtro-todas').click();await page.locator('#buscar').fill('simeon');
    assert.equal(await page.locator('.result').count(),7);
    await shot('library');
    await page.locator('.result').first().click();
    assert.equal(await page.locator('#dia-completas').inputValue(),'0');
    await page.locator('#dia-completas').selectOption('4');
    assert.equal(await page.locator('#dia-completas').inputValue(),'4');
    await page.locator('.bookmark').nth(2).click();
    await page.locator('[aria-label="Volver"]').click();await page.waitForTimeout(100);
    await page.locator('#limpiar-busqueda').click();await page.locator('#filtro-favoritos').click();
    assert.equal(await page.locator('.result').count(),2);
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'noche');
    assert.equal(await page.locator('#fsval').textContent(),'140%');
    assert.equal(await page.locator('#hecho-manana').isVisible(),true);
    await page.locator('#nav-oraciones').click();await page.locator('#filtro-favoritos').click();
    assert.equal(await page.locator('.result').count(),2);
    await page.locator('.result').last().click();
    assert.equal(await page.locator('#dia-completas').inputValue(),'4');
    // Browser back dismisses a sheet first, then the reading, then the library.
    await page.locator('#fab').click();await page.goBack();await page.waitForTimeout(100);
    assert.equal(await page.locator('#hojaindice').isVisible(),false);
    assert.equal(await page.locator('#oficio').isVisible(),true);
    await page.goBack();await page.waitForTimeout(100);
    assert.equal(await page.locator('#biblioteca').isVisible(),true);
    await page.goBack();await page.waitForTimeout(100);
    assert.equal(await page.locator('#portada').isVisible(),true);
    await page.locator('#nav-ajustes').click();await page.locator('[data-t="papel"]').click();
    await page.locator('#hojaajustes [data-cerrar]').click();await page.waitForTimeout(100);
    for(const width of [320,390,430,900]){
      await page.setViewportSize({width,height:844});await fit();
      for(const section of ['manana','misa','completas']){
        await page.evaluate(s=>HORAS.abrir(s),section);await fit();
        await page.evaluate(()=>HORAS.volver());await page.waitForTimeout(100);
      }
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#pta-misa').click();assert.equal(await page.locator('#completar-titulo').textContent(),'Marcar como leída');
    await page.evaluate(()=>HORAS.volver());await page.waitForTimeout(100);
    await context.setOffline(true);await page.reload();await fit();
    await page.locator('#pta-manana').click();assert.ok(await page.locator('.parte').count()>0);
    await page.locator('#bajustes2').click();await page.locator('[data-t="sepia"]').click();await shot('settings-sepia');
    assert.deepEqual(errors,[]);
    console.log('PASS: mobile layout, bookmarks, search, reading controls, browser back, themes, 140% text, storage and offline.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
