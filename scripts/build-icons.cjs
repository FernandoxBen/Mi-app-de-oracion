const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
  const svg=await fs.readFile(path.join(root,'icons/icon.svg'));
  for(const dir of ['icons','']){
    for(const [name,size] of [['icon-192',192],['icon-512',512],['icon-maskable-192',192],['icon-maskable-512',512],['apple-touch-icon',180],['favicon-32',32]]){
      await sharp(svg).resize(size,size).flatten({background:'#393354'}).png().toFile(path.join(root,dir,name+'.png'));
    }
    // The cross fits entirely within the central maskable safe area.
    await fs.writeFile(path.join(root,dir,'icon-maskable.svg'),svg);
    if(!dir)await fs.writeFile(path.join(root,'icon.svg'),svg);
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
