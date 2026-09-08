/* MIT License — Copyright (c) 2026 CX Impact contributors */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CXComparison=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const sides=['current','target'],kinds=['stages','nodes','lanes'];
  const items=(map,kind)=>kind==='stages'?map.stages:map.process?.[kind]||[];
  function check(ok,path,message){if(!ok)throw new Error(`${path}: ${message}`);}
  function validateComparison(data){
    check(data?.mode==='comparison'&&data.current?.mode==='current'&&data.target?.mode==='target','comparison','requires explicit current and target');
    const c=data.correspondence;if(c===undefined)return data;
    check(c&&typeof c==='object'&&!Array.isArray(c),'correspondence','expected object');
    for(const key of Object.keys(c))check(kinds.includes(key),`correspondence.${key}`,'unsupported group kind');
    for(const kind of kinds){
      if(c[kind]===undefined)continue;
      check(Array.isArray(c[kind]),`correspondence.${kind}`,'expected array');
      const used={current:new Set(),target:new Set()};
      c[kind].forEach((g,i)=>{
        const path=`correspondence.${kind}[${i}]`;
        check(g&&typeof g==='object'&&!Array.isArray(g),path,'expected group');
        for(const key of Object.keys(g))check(sides.includes(key),`${path}.${key}`,'unsupported field');
        for(const side of sides){
          check(Array.isArray(g[side])&&g[side].length>0,`${path}.${side}`,'expected nonempty IDs');
          const valid=new Set(items(data[side],kind).map(x=>x.id));
          for(const id of g[side]){check(valid.has(id),`${path}.${side}`,`unknown reference ${id}`);check(!used[side].has(id),`${path}.${side}`,`multiply assigned reference ${id}`);used[side].add(id);}
        }
      });
    }
    return data;
  }
  // Content comparison deliberately excludes identity and positioning. Source bodies
  // and linked barrier content participate, so a reused source ID cannot hide changes.
  const placement=new Set(['id','x','y','w','h','row','col','stageId','laneId']);
  function content(value,map){
    if(Array.isArray(value))return value.map(x=>content(x,map));
    if(!value||typeof value!=='object')return value;
    const out={};
    for(const key of Object.keys(value).sort()){
      if(placement.has(key))continue;
      if(key==='sourceIds')out.sources=(value[key]||[]).map(id=>content((map.sources||[]).find(s=>s.id===id),map));
      else if(key==='barrierIds')out.barriers=(value[key]||[]).map(id=>content((map.barriers||[]).find(b=>b.id===id),map));
      else out[key]=content(value[key],map);
    }
    return out;
  }
  function facets(value){
    const out={text:[],status:[],sources:[],conditions:[],other:[]};
    function visit(v,path=''){
      if(v&&typeof v==='object'){for(const [k,x]of Object.entries(v)){if(k==='sources')out.sources.push([path,x]);else if(k==='condition'||(path.includes('.outgoing')&&['label','to','kind'].includes(k)))out.conditions.push([path,k,x]);else if(k==='status')out.status.push([path,x]);else if(['text','title','detail','label'].includes(k))out.text.push([path,k,x]);else visit(x,path+'.'+k);}}
      else out.other.push([path,v]);
    }visit(value);return out;
  }
  function prepareComparison(data){
    validateComparison(data);const groups={},diagnostics=[];
    for(const kind of kinds){
      const list=(data.correspondence?.[kind]||[]).map((g,i)=>({id:`${kind}-${i+1}`,current:[...g.current],target:[...g.target],match:'explicit'}));
      for(const side of sides)for(const item of items(data[side],kind))if(!list.some(g=>g[side].includes(item.id)))list.push({id:`${kind}-${side}-${item.id}`,current:[],target:[],[side]:[item.id],match:'unmatched'});
      // Stable topological alignment preserves both authored orders when possible.
      const links=new Map(list.map(g=>[g,new Set()])),indegree=new Map(list.map(g=>[g,0]));
      for(const side of sides){const sequence=items(data[side],kind).map(x=>list.find(g=>g[side].includes(x.id)));for(let i=1;i<sequence.length;i++){const a=sequence[i-1],b=sequence[i];if(a!==b&&!links.get(a).has(b)){links.get(a).add(b);indegree.set(b,indegree.get(b)+1);}}}
      const ordered=[];while(ordered.length<list.length){let next=list.find(g=>!ordered.includes(g)&&indegree.get(g)===0);if(!next){next=list.find(g=>!ordered.includes(g));diagnostics.push({code:'ALIGNMENT_ORDER_CONFLICT',kind,group:next.id,message:'Correspondence conflicts with authored order; alignment order is not an execution sequence.'});}ordered.push(next);for(const b of links.get(next))indegree.set(b,indegree.get(b)-1);}
      let start=0;groups[kind]=ordered.map(g=>{for(const side of sides)g[side].sort((a,b)=>items(data[side],kind).findIndex(x=>x.id===a)-items(data[side],kind).findIndex(x=>x.id===b));const span=Math.max(g.current.length,g.target.length);return {...g,start:(start+=span)-span,span};});
    }
    function nodeKey(id,side){const g=groups.nodes.find(g=>g[side].includes(id));return g?.match==='explicit'?g.id:`${side}:${id}`;}
    for(const kind of kinds)for(const g of groups[kind]){
      const values=sides.map(side=>g[side].map(id=>{const item=items(data[side],kind).find(x=>x.id===id),v=content(item,data[side]);if(kind==='nodes')v.outgoing=(data[side].process?.edges||[]).filter(e=>e.from===id).map(e=>({...content(e,data[side]),from:undefined,to:nodeKey(e.to,side)}));return v;}));
      g.status=!g.current.length?'only-in-target':!g.target.length?'only-in-current':JSON.stringify(values[0])===JSON.stringify(values[1])?'unchanged':'changed';
      const f=values.map(facets);g.changes=g.status==='changed'?Object.keys(f[0]).filter(k=>JSON.stringify(f[0][k])!==JSON.stringify(f[1][k])):[];
    }
    const slots=kind=>groups[kind].flatMap(g=>Array.from({length:g.span},(_,i)=>({groupId:g.id,current:g.current[i]||null,target:g.target[i]||null})));
    return {groups,stageSlots:slots('stages'),laneSlots:slots('lanes'),diagnostics};
  }
  function layoutComparison(data,Core){
    const prepared=prepareComparison(data),maps=sides.map(side=>data[side]);
    const top=Math.max(120,...maps.flatMap(m=>m.stages.map(s=>Core.wrap(s.title,203,17).length*24+96)))+26;
    const laneHeights=prepared.laneSlots.map(slot=>Math.max(106,...sides.flatMap(side=>(data[side].process?.nodes||[]).filter(n=>n.laneId===slot[side]).map(n=>Core.wrap(n.title,169,16).length*22+(n.artifact?Core.wrap(n.artifact,169,12).length*17:0)+49))));
    const regions=sides.map(side=>{const projection={stageIds:prepared.stageSlots.map(s=>s[side]),lanes:prepared.laneSlots.map((s,i)=>({id:s[side],height:laneHeights[i]})),top};return {side,projection,layout:Core.layoutProcess(data[side],projection)};});
    return {prepared,regions,top:top-26};
  }
  return {validateComparison,prepareComparison,layoutComparison};
});
