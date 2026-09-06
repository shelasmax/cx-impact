#!/usr/bin/env node
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { dirname, resolve, basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Core from '../assets/map-core.js';

const statuses = new Set(Object.keys(Core.statusLabels));
const cellFields = ['goal','action','channel','experience','barrier','opportunity','evidence','frontstage','backstage','support'];
const sourceKinds = new Set(['user-input','requirement','research','runtime','code','other']);
const skillRoot = fileURLToPath(new URL('../', import.meta.url));
const sha = value => createHash('sha256').update(value).digest('hex');
function check(ok, message) { if (!ok) throw new Error(message); }
function text(value, label, limit=3000) { check(typeof value === 'string' && value.trim().length > 0 && value.length <= limit, `${label}: expected nonempty text, at most ${limit} characters`); }
function ids(list, label) {
  check(Array.isArray(list), `${label}: expected an array`);
  const set = new Set();
  for (const item of list) {
    check(item && typeof item === 'object', `${label}: invalid entry`);
    check(typeof item.id === 'string' && /^[a-z][a-z0-9_-]*$/.test(item.id), `${label}: invalid ID`);
    check(!set.has(item.id), `${label}: duplicate ID ${item.id}`); set.add(item.id);
  }
  return set;
}
function refs(values, allowed, label) {
  check(values === undefined || Array.isArray(values), `${label}: expected an array`);
  for(const id of values || []) check(allowed.has(id), `${label}: unknown reference ${id}`);
}
export function validateMap(data) {
  check(data && data.version === 1, 'Expected map version 1');
  check(data.locale === undefined || ['ru','en'].includes(data.locale), 'locale: use ru or en');
  if(data.mode === 'comparison') {
    check(data.current?.mode === 'current' && data.target?.mode === 'target', 'Comparison requires explicit current and target maps');
    validateMap(data.current); validateMap(data.target); return data;
  }
  for (const key of ['title','subtitle','actor','goal','disclaimer']) text(data[key], key, key === 'disclaimer' ? 700 : 200);
  check(!data.mode || ['current','target'].includes(data.mode), 'mode: use current, target or comparison');
  if(data.mode) {
    check(data.scope && typeof data.scope === 'object', 'An explicit mode requires scope');
    for(const key of ['scenario','start','end','asOf']) text(data.scope[key], `scope.${key}`, 400);
  }
  check(!data.defaultView || ['cjm','blueprint','process'].includes(data.defaultView), 'Invalid defaultView');
  const sourceIds = ids(data.sources || [], 'sources');
  const sources = new Map((data.sources || []).map(s=>[s.id,s]));
  for (const s of data.sources || []) {
    text(s.label, 'source label', 160); text(s.text, 'source text', 8000);
    if(s.kind !== undefined) check(sourceKinds.has(s.kind), `source ${s.id}: unknown kind`);
  }
  function claim(item, label) {
    check(item && typeof item === 'object' && !Array.isArray(item), `${label}: expected a claim object`);
    const status = item.status || 'unknown';
    check(statuses.has(status), `${label}: invalid status`);
    refs(item.sourceIds, sourceIds, `${label}: unknown source`);
    if (['observed','declared','requirement','user_fact','code'].includes(status)) check(item.sourceIds?.length, `${label}: ${status} needs a source`);
    if(status === 'observed' && item.sourceIds?.length && item.sourceIds.every(id=>sources.get(id).kind==='code')) throw new Error(`${label}: code alone is not observed customer behavior; use status code`);
    if(status === 'requirement' && item.sourceIds?.length && item.sourceIds.every(id=>sources.get(id).kind==='code')) throw new Error(`${label}: code alone is not a product requirement`);
    if (item.detail !== undefined) text(item.detail, `${label}.detail`, 8000);
  }
  const stageIds = ids(data.stages, 'stages');
  check(data.stages.length >= 2 && data.stages.length <= 12, 'Use 2–12 stages; split a longer journey');
  const barrierIds = ids(data.barriers || [], 'barriers');
  for(const barrier of data.barriers || []) {
    claim(barrier, barrier.id);text(barrier.text, `${barrier.id}.text`, 180);
    refs(barrier.stageIds,stageIds,`${barrier.id}.stageIds`);
    for(const key of ['consequence','improvement','question']) if(barrier[key]) {claim(barrier[key],`${barrier.id}.${key}`);text(barrier[key].text,`${barrier.id}.${key}.text`,700);}
  }
  const participantIds=ids(data.participants || [],'participants');
  for(const p of data.participants || []) {text(p.title,'participant title',160);check(Array.isArray(p.roles)&&p.roles.length,'participant roles required');p.roles.forEach(r=>text(r,'participant role',100));}
  ids(data.questions || [],'questions');
  for(const q of data.questions || []) {claim(q,q.id);text(q.text,'question text',700);refs(q.stageIds,stageIds,'question stages');if(q.impact)text(q.impact,'question impact',1000);}
  for (const stage of data.stages) {
    text(stage.title, 'stage title', 70);refs(stage.barrierIds,barrierIds,`${stage.id}.barrierIds`);
    for (const field of cellFields) if (stage[field] !== undefined) {claim(stage[field], `${stage.id}.${field}`);text(stage[field].text, `${stage.id}.${field}.text`,field==='barrier'?180:140);}
  }
  if (data.process) {
    const p=data.process,laneIds=ids(p.lanes,'lanes'),nodeIds=ids(p.nodes,'nodes');
    check(p.lanes.length > 0 && p.lanes.length <= 8,'Use 1–8 process lanes');
    for(const lane of p.lanes) {text(lane.title,'lane title',80);if(lane.participantId)check(participantIds.has(lane.participantId),'unknown participant');if(lane.role)text(lane.role,'lane role',100);}
    const positions=new Set();
    for(const node of p.nodes) {
      text(node.title,'node title',100);claim(node,node.id);
      check(stageIds.has(node.stageId)&&laneIds.has(node.laneId),`${node.id}: unknown stage or lane`);
      const pos=`${node.stageId}/${node.laneId}`;
      check(!positions.has(pos),`${node.id}: occupied lane/stage; use a separate linked map`);positions.add(pos);
      check(!node.kind||['action','decision','outcome'].includes(node.kind),`${node.id}: invalid kind`);
      if(node.artifact!==undefined)text(node.artifact,'artifact',120);
      refs(node.barrierIds,barrierIds,`${node.id}.barrierIds`);
      if(node.barrier!==undefined) {
        if(typeof node.barrier==='string')text(node.barrier,'legacy barrier',180);
        else {claim(node.barrier,'node barrier');text(node.barrier.text,'node barrier text',180);}
      }
    }
    check(Array.isArray(p.edges),'process.edges must be an array');
    const edgeIds=new Set();
    for(const [i,edge] of p.edges.entries()) {
      check(nodeIds.has(edge.from)&&nodeIds.has(edge.to),'Edge references an unknown node');
      check(edge.from!==edge.to,'Self edges need a separate recovery step');
      check(!edge.kind||Core.edgeStyles[edge.kind],'Invalid edge kind');
      if(edge.label!==undefined)text(edge.label,'edge label',180);
      if(edge.condition!==undefined)text(edge.condition,'edge condition',180);
      const id=edge.id||`edge-${i+1}`;text(id,'edge id',80);check(!edgeIds.has(id),'Duplicate edge id');edgeIds.add(id);
      if(edge.status!==undefined)claim(edge,`edge ${id}`);
    }
  }
  return data;
}
export function inspectMap(data) {
  validateMap(data);const warnings=[],geometry=[];
  for(const map of Core.scenarios(data)) {
    if(!map.mode)warnings.push({code:'MODE_UNSPECIFIED',message:'Legacy JSON: mode is not inferred. Add mode and scope when known.'});
    if((map.sources||[]).some(s=>!s.kind))warnings.push({code:'SOURCE_KIND_UNSPECIFIED',message:'Some legacy sources have no kind; their type is not inferred.'});
    for(const node of map.process?.nodes||[]) {
      if(typeof node.barrier==='string')warnings.push({code:'LEGACY_BARRIER',node:node.id,message:'String barrier retains unknown basis. Use a typed barrier or barrierIds.'});
      if(node.kind==='decision')for(const edge of map.process.edges.filter(e=>e.from===node.id))if(!edge.label&&!edge.condition)warnings.push({code:'MISSING_CONDITION',node:node.id,message:'An outgoing decision condition is missing; the viewer marks it unknown.'});
    }
    const layout=Core.layoutProcess(map);if(layout)geometry.push({mode:map.mode||'unspecified',...layout.geometry});
  }
  return {structure:{status:'checked',warnings},geometry:{status:geometry.some(g=>g.status==='failed')?'failed':'checked',maps:geometry},visual:{status:'not_checked'},interactions:{status:'not_checked'},export:{status:'not_checked'},reproducibility:{status:'not_checked'}};
}
function safeJSON(value) {return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export async function renderMap(data, options={}) {
  validateMap(data);
  let template=await readFile(options.template || new URL('../assets/map.html',import.meta.url),'utf8');
  const files={'/*__CX_MAP_DATA__*/':safeJSON(data),'/*__CX_MAP_CORE__*/':await readFile(new URL('../assets/map-core.js',import.meta.url),'utf8'),'/*__CX_MAP_VIEWER__*/':await readFile(new URL('../assets/map-viewer.js',import.meta.url),'utf8')};
  for(const [marker,content] of Object.entries(files)) {check(template.split(marker).length===2,`Template marker ${marker} must occur exactly once`);template=template.replace(marker,()=>content);}
  return template.replace('<html lang="ru">', `<html lang="${data.current?.locale||data.locale||'ru'}">`);
}
export async function deliverMap(input, output, options={}) {
  check(resolve(input)!==resolve(output),'Output must not overwrite the source JSON');
  check(extname(output)==='.html','Output must have .html extension');
  const raw=await readFile(input),data=JSON.parse(raw),report=inspectMap(data);
  check(report.geometry.status!=='failed','Geometry has collisions; output was not replaced');
  const html=await renderMap(data,options),dir=dirname(resolve(output)),stem=basename(output,'.html'),adjacent=join(dir,stem+'.json');
  const bundle=join(dir,stem+'.source');
  if(options.bundle!==false) {
    let previous;
    try {previous=JSON.parse(await readFile(join(bundle,'manifest.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(previous) {
      check(!previous.templateCustom||options.template,'Existing bundle has a custom template. Use its rebuild.mjs or explicitly supply --template');
      for(const [name,hash] of Object.entries(previous.files||{})) {
        check(['scripts/render-map.mjs','assets/map.html','assets/map-core.js','assets/map-viewer.js','rebuild.mjs'].includes(name),'Invalid bundle manifest path');
        check(sha(await readFile(join(bundle,name)))===hash,`Local bundle file ${name} was edited. Use its rebuild.mjs or select a new output name`);
      }
    }
  }
  await mkdir(dir,{recursive:true});
  if(resolve(adjacent)!==resolve(input)) {
    try {const existing=await readFile(adjacent);check(existing.equals(raw),'Adjacent JSON differs; choose another output basename or update that source explicitly');} catch(e) {if(e.code!=='ENOENT')throw e;}
    await writeFile(adjacent,raw);
  }
  if(options.bundle!==false) {
    await mkdir(join(bundle,'assets'),{recursive:true});await mkdir(join(bundle,'scripts'),{recursive:true});
    const names=['scripts/render-map.mjs','assets/map.html','assets/map-core.js','assets/map-viewer.js'],hashes={};
    for(const name of names){const source=name==='assets/map.html'&&options.template?options.template:join(skillRoot,name);const bytes=await readFile(source);await writeFile(join(bundle,name),bytes);hashes[name]=sha(bytes);}
    const rebuild=`import { fileURLToPath } from 'node:url';\nimport { deliverMap } from './scripts/render-map.mjs';\nawait deliverMap(fileURLToPath(new URL(${JSON.stringify('../'+stem+'.json')},import.meta.url)),fileURLToPath(new URL(${JSON.stringify('../'+stem+'.html')},import.meta.url)),{bundle:false});\n`;
    await writeFile(join(bundle,'rebuild.mjs'),rebuild);
    hashes['rebuild.mjs']=sha(rebuild);
    await writeFile(join(bundle,'manifest.json'),JSON.stringify({rendererVersion:Core.VERSION,templateCustom:!!options.template,files:hashes,source:stem+'.json',sourceSha256:sha(raw),htmlSha256:sha(html),rebuild:`node ${JSON.stringify(stem+'.source/rebuild.mjs')}`},null,2)+'\n');
    report.reproducibility={status:'checked',scope:'Exact source/template/runtime snapshot written; rebuild execution is a separate check',bundle:stem+'.source'};
  }
  await writeFile(output,html,'utf8');
  report.rendererVersion=Core.VERSION;report.sourceSha256=sha(raw);report.htmlSha256=sha(html);
  await writeFile(join(dir,stem+'.checks.json'),JSON.stringify(report,null,2)+'\n');
  return {output:resolve(output),bytes:Buffer.byteLength(html),report};
}
if(process.argv[1]&&await realpath(process.argv[1]).catch(()=>null)===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),checkOnly=args[0]==='--check';
  try {
    if(checkOnly) {
      check(args.length===2&&args[1]&&!args[1].startsWith('--'),'Usage: node render-map.mjs --check map.json (no output path or rendering flags)');
      const report=inspectMap(JSON.parse(await readFile(args[1],'utf8')));
      console.log(JSON.stringify(report,null,2));
      if(report.geometry.status==='failed')process.exitCode=1;
    } else {
      const [input,output,...flags]=args;check(input&&output,'Usage: node render-map.mjs map.json map.html [--template template.html] [--no-bundle]\n       node render-map.mjs --check map.json');
      let template;for(let i=0;i<flags.length;i++){if(flags[i]==='--template'){template=flags[++i];check(template,'Missing template path');}else check(flags[i]==='--no-bundle',`Unknown flag ${flags[i]}`);}
      const result=await deliverMap(input,output,{template,bundle:!flags.includes('--no-bundle')});
      console.log(`Rendered ${result.output} (${result.bytes} bytes). Structure and geometry checked; visual, interactions and export require separate checks.`);
    }
  }catch(error){console.error(`Map not ${checkOnly?'checked':'rendered'}: ${error.message}`);process.exitCode=1;}
}
