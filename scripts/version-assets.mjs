import {readdir,readFile,writeFile} from 'node:fs/promises';
const version=process.env.GITHUB_SHA||'local';
if(!/^[a-zA-Z0-9.-]+$/.test(version))throw new Error('Invalid asset version');
const root=new URL('../dist/',import.meta.url);
for(const file of await readdir(root)){
  if(!file.endsWith('.js'))continue;
  const path=new URL(file,root),source=await readFile(path,'utf8');
  const updated=source.replace(/(from\s+['"])(\.\/[^'"?]+\.js)(?:\?v=[^'"]+)?(['"])/g,`$1$2?v=${version}$3`);
  await writeFile(path,updated);
}
const index=new URL('index.html',root),html=await readFile(index,'utf8');
await writeFile(index,html.replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css))(?:\?v=[^"]*)?("?)/g,`$1?v=${version}$2`));
console.log('Versioned local JS/CSS references for deployment:',version);
