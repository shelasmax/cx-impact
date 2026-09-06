import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,symlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import Core from '../skills/cx-impact/assets/map-core.js';
import {validateMap,inspectMap,deliverMap} from '../skills/cx-impact/scripts/render-map.mjs';
const fixture=async name=>JSON.parse(await readFile(new URL(`fixtures/${name}.json`,import.meta.url)));
for(const name of ['routing','eight-stages','twelve-stages','comparison'])test(`${name}: routes avoid foreign nodes; full labels remain separate`,async()=>{
 const data=await fixture(name),before=JSON.stringify(data);
 assert.equal(inspectMap(data).geometry.status,'checked');
 for(const map of Core.scenarios(data)){
  const layout=Core.layoutProcess(map);
  assert.equal(layout.edges.length,map.process.edges.length);
  for(const [i,e] of layout.edges.entries()){
   assert.ok(e.points.length>1);
   const source=layout.nodes.find(n=>n.id===e.from),target=layout.nodes.find(n=>n.id===e.to);
   for(const [p,n] of [[e.points[0],source],[e.points.at(-1),target]])assert.ok(p.x>=n.x&&p.x<=n.x+n.w&&p.y>=n.y&&p.y<=n.y+n.h,'endpoint belongs to requested node');
   for(const [a,b] of Core.segments(e.points))for(const node of layout.nodes)if(![e.from,e.to].includes(node.id))assert.equal(Core.hitSegment(a,b,node),false,`${e.id} crosses ${node.id}`);
   if(map.process.edges[i].label){assert.equal(e.label,map.process.edges[i].label);assert.ok(e.labelBox);assert.equal(e.labelBox.lines.join(' ').includes(e.label),true);}
   if(e.labelBox)assert.ok(e.labelBox.x>=0&&e.labelBox.y+e.labelBox.h<layout.height);
  }
  assert.deepEqual(layout.geometry.errors,[]);
 }
 assert.equal(JSON.stringify(data),before,'layout must not alter authored claims or labels');
});
test('geometry detects supplied collisions, not only successful layouts',async()=>{
 const layout=Core.layoutProcess(await fixture('routing'));
 const edge=layout.edges[0],foreign=layout.nodes.find(n=>![edge.from,edge.to].includes(n.id));
 edge.points=[{x:foreign.x+10,y:foreign.y-10},{x:foreign.x+10,y:foreign.y+foreign.h+10}];
 assert.ok(Core.checkGeometry(layout).errors.some(e=>e.code==='EDGE_NODE_COLLISION'));
 layout.edges[0].labelBox=layout.edges[1].labelBox={x:foreign.x,y:foreign.y,w:30,h:30};
 const codes=Core.checkGeometry(layout).errors.map(e=>e.code);
 assert.ok(codes.includes('LABEL_NODE_COLLISION'));assert.ok(codes.includes('LABEL_LABEL_COLLISION'));
});
test('modes, source kinds and shared barriers preserve knowledge boundaries',async()=>{
 const m=await fixture('routing');
 const b=m.barriers[0];assert.equal(b.status,'unknown');
 for(const stage of m.stages.filter(s=>s.barrierIds?.includes(b.id)))assert.equal(Core.cell(m,stage,'barrier'),b);
 for(const node of m.process.nodes.filter(n=>n.barrierIds?.includes(b.id)))assert.equal(Core.barriersFor(m,node)[0],b);
 assert.equal(Core.barriersFor(m,{barrier:'An old annotation'})[0].status,'unknown');
 assert.equal(Core.labelFor({status:'declared'},m),'Требование / намерение');
 const legacy=structuredClone(m);delete legacy.mode;delete legacy.scope;
 assert.ok(inspectMap(legacy).structure.warnings.some(w=>w.code==='MODE_UNSPECIFIED'));
 const invalid=structuredClone(m);delete invalid.scope;assert.throws(()=>validateMap(invalid),/scope/);
 const source={id:'code-only',kind:'code',label:'Code',text:'Synthetic source code excerpt'};m.sources.push(source);m.stages[0].goal={text:'Customers do this',status:'observed',sourceIds:[source.id]};
 assert.throws(()=>validateMap(m),/code alone/);m.stages[0].goal.status='code';assert.doesNotThrow(()=>validateMap(m));
});
test('missing decision conditions are visible unknowns; duplicate generated IDs rejected',async()=>{
 const m=await fixture('routing'),node=m.process.nodes.find(n=>n.kind==='decision'),edge=m.process.edges.find(e=>e.from===node.id);
 delete edge.label;delete edge.condition;
 assert.ok(inspectMap(m).structure.warnings.some(w=>w.code==='MISSING_CONDITION'));
 assert.ok(Core.layoutProcess(m).edges.some(e=>e.label==='Условие не задано'));
 m.process.edges[0].id='edge-2';assert.throws(()=>validateMap(m),/Duplicate edge id/);
});
test('a short label cannot hide a separately authored full condition',async()=>{
 const m=await fixture('routing');m.process.edges[0].label='Да';m.process.edges[0].condition='Только после подтверждения представителем в течение 24 часов';
 const edge=Core.layoutProcess(m).edges[0];assert.ok(edge.label.includes(m.process.edges[0].label));assert.ok(edge.label.includes(m.process.edges[0].condition));
});
test('a portable customized bundle rebuilds byte-identically without installed skill',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cx-portable-'));
 try{
  const input=join(dir,'authored.json'),output=join(dir,'result.html'),template=join(dir,'local.html');
  const raw=JSON.stringify(await fixture('routing'),null,3)+'\n';await writeFile(input,raw);
  const base=await readFile(new URL('../skills/cx-impact/assets/map.html',import.meta.url),'utf8');
  await writeFile(template,base.replace('CX IMPACT / VISUAL DRAFT','LOCAL TEMPLATE / CUSTOM'));
  const {report}=await deliverMap(input,output,{template});
  assert.equal(report.visual.status,'not_checked');assert.equal(report.export.status,'not_checked');
  assert.equal(await readFile(join(dir,'result.json'),'utf8'),raw);
  await assert.rejects(deliverMap(input,output),/custom template/);
  const before=await readFile(output);await rm(input);await rm(template);
  execFileSync(process.execPath,[join(dir,'result.source/rebuild.mjs')],{cwd:tmpdir()});
  assert.deepEqual(await readFile(output),before);
  assert.match(before.toString(),/LOCAL TEMPLATE \/ CUSTOM/);
  assert.equal(await readFile(join(dir,'result.json'),'utf8'),raw);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('legacy flat input renders without inventing a mode or upgrading string barriers',async()=>{
 const m=await fixture('routing');delete m.mode;delete m.scope;
 m.process.nodes[0].barrier='Legacy annotation without an evidence type';
 const {renderMap}=await import('../skills/cx-impact/scripts/render-map.mjs');
 const html=await renderMap(m),embedded=JSON.parse(html.match(/<script id="map-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(embedded,m);assert.equal(Core.barriersFor(m,m.process.nodes[0])[0].status,'unknown');
});
test('CLI executes through a symlinked installation directory',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cx-symlink-'));
 try{
  const alias=join(dir,'installed-skill'),input=join(dir,'source.json'),output=join(dir,'output.html');
  await symlink(fileURLToPath(new URL('../skills/cx-impact/',import.meta.url)),alias,'dir');
  await writeFile(input,JSON.stringify(await fixture('routing')));
  execFileSync(process.execPath,[join(alias,'scripts/render-map.mjs'),input,output],{stdio:'pipe'});
  assert.match(await readFile(output,'utf8'),/<!doctype html>/);
  assert.equal(JSON.parse(await readFile(join(dir,'output.checks.json'))).geometry.status,'checked');
 }finally{await rm(dir,{recursive:true,force:true});}
});
