/* Pure quantitative contracts and deterministic geometry. MIT; see package LICENSE. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.CXFunnel=factory();
})(globalThis,function(){
  'use strict';
  const fail=(ok,path,message)=>{
    if(!ok)throw new Error(`${path}: ${message}`);
  };
  const object=(v,path)=>fail(v&&typeof v==='object'&&!Array.isArray(v),path,'expected an object');
  const text=(v,path,max=3000)=>fail(typeof v==='string'&&v.trim().length>0&&v.length<=max,path,`expected nonempty text, at most ${max} characters`);
  const count=(v,path)=>fail(Number.isSafeInteger(v)&&v>=0,path,'expected a nonnegative safe integer');
  const positive=(v,path)=>fail(Number.isFinite(v)&&v>0&&v<=36500,path,'expected positive days, at most 36500');
  function keys(v,allowed,path){
    object(v,path);
    for(const k of Object.keys(v))fail(allowed.includes(k),`${path}.${k}`,'unsupported field');
  }
  function records(v,path,min,max){
    fail(Array.isArray(v)&&v.length>=min&&v.length<=max,path,`expected ${min}–${max} records`);
    const ids=new Set();
    v.forEach((x,i)=>{
      object(x,`${path}[${i}]`);
      fail(typeof x.id==='string'&&/^[a-z][a-z0-9_-]*$/.test(x.id),`${path}[${i}].id`,'invalid ID');
      fail(!ids.has(x.id),`${path}[${i}].id`,'duplicate ID');
      ids.add(x.id);
    });
    return ids;
  }
  function date(v,path){
    fail(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v),path,'expected YYYY-MM-DD');
    const node=Date.parse(v+'T00:00:00Z');
    fail(Number.isFinite(node)&&new Date(node).toISOString().slice(0,10)===v,path,'invalid calendar date');
    return node/86400000;
  }
  function graphOrder(graphData){
    const incoming=new Map(graphData.nodes.map(node=>[node.id,[]])),outgoing=new Map(graphData.nodes.map(node=>[node.id,[]]));
    graphData.edges.forEach(edge=>{
      incoming.get(edge.to).push(edge);
      outgoing.get(edge.from).push(edge);
    });
    const degree=new Map(graphData.nodes.map(node=>[node.id,incoming.get(node.id).length])),queue=graphData.nodes.filter(node=>!degree.get(node.id)).map(node=>node.id),order=[];
    for(let i=0;i<queue.length;i++){
      const id=queue[i];
      order.push(id);
      for(const edge of outgoing.get(id)){
        degree.set(edge.to,degree.get(edge.to)-1);
        if(!degree.get(edge.to))queue.push(edge.to);
      }
    }
    return {incoming,outgoing,order};
  }
  function validateFunnel(data){
    keys(data,['version','kind','locale','title','subtitle','disclaimer','scope','sources','stages','transitions','repeat'],'funnel');
    fail(data.version===1,'version','expected 1');
    fail(data.kind==='sales-funnel','kind','expected sales-funnel');
    fail(['ru','en'].includes(data.locale),'locale','expected ru or en');
    for(const k of ['title','subtitle','disclaimer'])text(data[k],k,k==='disclaimer'?1000:240);
    const scope=data.scope;
    keys(scope,['unit','entry','cohortStart','cohortEnd','asOf','timezone','conversionDays','identityRule','orderRule'],'scope');
    fail(scope.unit==='people','scope.unit','only people supported');
    fail(scope.entry==='closed','scope.entry','only closed ordered cohorts supported');
    const start=date(scope.cohortStart,'scope.cohortStart'),end=date(scope.cohortEnd,'scope.cohortEnd'),asOf=date(scope.asOf,'scope.asOf');
    fail(start<=end,'scope.cohortEnd','must follow cohortStart');
    positive(scope.conversionDays,'scope.conversionDays');
    fail(asOf>=end+scope.conversionDays,'scope.asOf','closed cohort requires full conversion window after cohortEnd');
    text(scope.timezone,'scope.timezone',100);
    fail(!/^[+-]/.test(scope.timezone),'scope.timezone','expected an IANA timezone, not a fixed offset');
    try{
      new Intl.DateTimeFormat('en',{timeZone:scope.timezone}).format();
    }catch{
      fail(false,'scope.timezone','invalid IANA timezone');
    }
    for(const field of ['identityRule','orderRule'])text(scope[field],`scope.${field}`);
    const sources=records(data.sources,'sources',1,100);
    data.sources.forEach((record,i)=>{
      keys(record,['id','label','text','kind'],`sources[${i}]`);
      text(record.label,`sources[${i}].label`,160);
      text(record.text,`sources[${i}].text`,8000);
      fail(['user-input','requirement','research','runtime','code','other'].includes(record.kind),`sources[${i}].kind`,'unsupported source kind');
    });
    function refs(v,path){
      fail(Array.isArray(v)&&v.length>0,path,'at least one source required');
      v.forEach(id=>fail(sources.has(id),path,`unknown source ${id}`));
      fail(new Set(v).size===v.length,path,'duplicate source');
    }
    const stages=records(data.stages,'stages',2,12);
    let previous=null;
    data.stages.forEach((record,i)=>{
      const path=`stages[${i}]`;
      keys(record,['id','title','count','sourceIds','definition'],path);
      text(record.title,path+'.title',100);
      text(record.definition,path+'.definition');
      refs(record.sourceIds,path+'.sourceIds');
      if(record.count!==null){
        count(record.count,path+'.count');
        fail(previous===null||record.count<=previous,path+'.count','closed ordered cohort counts must not increase, including across unknown stages');
        previous=record.count;
      }
    });
    if(data.transitions!==undefined){
      const graphData=data.transitions;
      keys(graphData,['scope','nodes','edges'],'transitions');
      keys(graphData.scope,['stageId','rootTotal','denominator','description'],'transitions.scope');
      fail(stages.has(graphData.scope.stageId),'transitions.scope.stageId','unknown stage');
      count(graphData.scope.rootTotal,'transitions.scope.rootTotal');
      const stage=data.stages.find(stage=>stage.id===graphData.scope.stageId);
      fail(stage.count!==null&&stage.count===graphData.scope.rootTotal,'transitions.scope.rootTotal','must equal referenced known stage count');
      text(graphData.scope.denominator,'transitions.scope.denominator');
      text(graphData.scope.description,'transitions.scope.description');
      const nodes=records(graphData.nodes,'transitions.nodes',2,32);
      records(graphData.edges,'transitions.edges',1,48);
      graphData.nodes.forEach((node,i)=>{
        const path=`transitions.nodes[${i}]`;
        keys(node,['id','title','value','stageId','outcome','sourceIds'],path);
        text(node.title,path+'.title',100);
        count(node.value,path+'.value');
        refs(node.sourceIds,path+'.sourceIds');
        if(node.stageId!==undefined)fail(stages.has(node.stageId),path+'.stageId','unknown stage');
        if(node.outcome!==undefined)fail(['progress','lost','pending','unknown'].includes(node.outcome),path+'.outcome','invalid outcome');
      });
      graphData.edges.forEach((edge,i)=>{
        const path=`transitions.edges[${i}]`;
        keys(edge,['id','from','to','value','label','sourceIds'],path);
        fail(nodes.has(edge.from)&&nodes.has(edge.to),path,'unknown node reference');
        fail(edge.from!==edge.to,path,'self edge; unroll retry');
        count(edge.value,path+'.value');
        text(edge.label,path+'.label',400);
        refs(edge.sourceIds,path+'.sourceIds');
      });
      const {incoming,outgoing,order}=graphOrder(graphData);
      fail(order.length===graphData.nodes.length,'transitions.edges','cycle; unroll retry nodes');
      let rootTotal=0,sinkTotal=0;
      graphData.nodes.forEach((node,i)=>{
        const incomingEdges=incoming.get(node.id);
        const outgoingEdges=outgoing.get(node.id);
        const path=`transitions.nodes[${i}]`;
        fail(incomingEdges.length||outgoingEdges.length,path,'isolated node');
        for(const [edges,label] of [[incomingEdges,'incoming'],[outgoingEdges,'outgoing']]){
          if(edges.length){
            const total=edges.reduce((sum,edge)=>sum+edge.value,0);
            fail(total===node.value,path+'.value',`${label} flow must conserve node value`);
          }
        }
        if(!incomingEdges.length)rootTotal+=node.value;
        if(!outgoingEdges.length){
          sinkTotal+=node.value;
          fail(node.outcome!==undefined,path+'.outcome','sink must explicitly classify outcome');
        }else fail(node.outcome===undefined,path+'.outcome','only sinks classify final outcomes');
      });
      fail(Number.isSafeInteger(rootTotal)&&rootTotal===graphData.scope.rootTotal,'transitions.scope.rootTotal','must equal sum of explicit graph roots');
      fail(sinkTotal===rootTotal,'transitions.nodes','sink total must equal roots');
    }
    if(data.repeat!==undefined){
      const repeat=data.repeat;
      keys(repeat,['eligible','purchased','pending','windowDays','sourceIds','definition'],'repeat');
      for(const field of ['eligible','purchased','pending'])count(repeat[field],`repeat.${field}`);
      positive(repeat.windowDays,'repeat.windowDays');
      text(repeat.definition,'repeat.definition');
      refs(repeat.sourceIds,'repeat.sourceIds');
      const final=data.stages.at(-1).count;
      fail(final!==null,'repeat','requires known final first-purchase stage');
      fail(repeat.eligible+repeat.pending===final,'repeat.pending','eligible + pending must equal first purchasers');
      fail(repeat.purchased<=repeat.eligible,'repeat.purchased','cannot exceed mature eligible cohort');
      fail(asOf>=start+repeat.windowDays||repeat.eligible===0,'repeat.eligible','no first purchaser can yet have matured');
      fail(asOf<end+scope.conversionDays+repeat.windowDays||repeat.pending===0,'repeat.pending','all first-purchase windows have elapsed at cutoff');
    }
    return data;
  }
  const rate=(numerator,denominator)=>numerator===null||denominator===null||denominator===0?null:numerator/denominator;
  function analyzeFunnel(data){
    validateFunnel(data);
    const entry=data.stages[0].count;
    const stages=data.stages.map((s,i)=>{
      const previous=i?data.stages[i-1].count:null;
      return {...s,previousApplicable:i>0,entryDenominator:entry,previousDenominator:previous,fromEntry:rate(s.count,entry),fromPrevious:rate(s.count,previous),notProgressed:i&&s.count!==null&&previous!==null?previous-s.count:null};
    });
    let graph=null;
    if(data.transitions){
      const graphData=data.transitions,{incoming,outgoing,order}=graphOrder(graphData),outcomes={progress:0,lost:0,pending:0,unknown:0};
      const roots=graphData.nodes.filter(node=>!incoming.get(node.id).length).map(node=>node.id),sinks=graphData.nodes.filter(node=>!outgoing.get(node.id).length);
      sinks.forEach(node=>outcomes[node.outcome]+=node.value);
      graph={rootTotal:graphData.scope.rootTotal,sinkTotal:sinks.reduce((s,node)=>s+node.value,0),roots,sinks:sinks.map(node=>node.id),outcomes,order,nodes:graphData.nodes.map(node=>({...node,fromScope:rate(node.value,graphData.scope.rootTotal)})),edges:graphData.edges.map(edge=>({...edge,denominator:graphData.nodes.find(node=>node.id===edge.from).value,fromNode:rate(edge.value,graphData.nodes.find(node=>node.id===edge.from).value),fromScope:rate(edge.value,graphData.scope.rootTotal)}))};
    }
    return {stages,graph,repeat:data.repeat?{...data.repeat,rate:rate(data.repeat.purchased,data.repeat.eligible)}:null,limits:['Counts and identity/cohort definitions are authored aggregates; person-level identity, ordering and maturation are not independently verified.','Stage residual is not progressed within the conversion window, not an inferred loss or cause.']};
  }
  function layoutFunnel(data){
    const analysis=analyzeFunnel(data),width=Math.max(1120,64+200*analysis.stages.length);
    const baseline=292,plotHeight=180,pitch=(width-64)/analysis.stages.length;
    const stageScale=analysis.stages[0].count?plotHeight/analysis.stages[0].count:0;
    const stages=analysis.stages.map((s,i)=>{
      const h=s.fromEntry===null?0:s.count*stageScale;
      return {...s,x:32+i*pitch,y:baseline-h,w:pitch-24,h};
    });
    let flows=null;
    if(analysis.graph){
      const graphData=data.transitions;
      const {incoming,outgoing,order}=graphOrder(graphData);
      const depth=new Map();
      order.forEach(id=>depth.set(id,Math.max(0,...incoming.get(id).map(edge=>depth.get(edge.from)+1))));
      const maxDepth=Math.max(...depth.values());
      const scale=graphData.scope.rootTotal?520/graphData.scope.rootTotal:0;
      const nodes=[];
      const byId=new Map();
      for(const node of graphData.nodes)if(!outgoing.get(node.id).length)depth.set(node.id,maxDepth);
      for(let column=0;column<=maxDepth;column++){
        let y=80;
        for(const node of graphData.nodes.filter(node=>depth.get(node.id)===column)){
          if(outgoing.get(node.id).length&&incoming.get(node.id).length){
            const starts=incoming.get(node.id).map(edge=>{
              const source=byId.get(edge.from);
              const sourceEdges=outgoing.get(edge.from);
              const priorEdges=sourceEdges.slice(0,sourceEdges.indexOf(edge));
              const priorValue=priorEdges.reduce((sum,priorEdge)=>sum+priorEdge.value,0);
              return source.y+priorValue*scale;
            });
            y=Math.max(y,Math.min(...starts));
          }
          const box={...node,x:40+column*340,y,h:node.value*scale,w:20,depth:column};
          nodes.push(box);
          byId.set(node.id,box);
          y+=box.h+115;
        }
      }
      const usedIn=new Map(),usedOut=new Map();
      const edges=analysis.graph.edges.map(edge=>{
        const sourceNode=byId.get(edge.from);
        const targetNode=byId.get(edge.to);
        const width=edge.value*scale;
        const sy=sourceNode.y+(usedOut.get(sourceNode.id)||0);
        const ty=targetNode.y+(usedIn.get(targetNode.id)||0);
        usedOut.set(sourceNode.id,(usedOut.get(sourceNode.id)||0)+width);
        usedIn.set(targetNode.id,(usedIn.get(targetNode.id)||0)+width);
        const x1=sourceNode.x+sourceNode.w;
        const x2=targetNode.x;
        const controlX=(x1+x2)/2;
        return {...edge,width,sy,ty,x1,x2,path:width?`M${x1},${sy} C${controlX},${sy} ${controlX},${ty} ${x2},${ty} L${x2},${ty+width} C${controlX},${ty+width} ${controlX},${sy+width} ${x1},${sy+width} Z`:null};
      });
      flows={nodes,edges,scale,width:Math.max(1120,400+maxDepth*340),height:Math.max(...nodes.map(node=>node.y+node.h+130))};
    }
    const errors=[],warnings=[];
    for(const s of stages)if(!Number.isFinite(s.h)||s.h<0||s.h>plotHeight+1e-7||s.w<=0||!Number.isFinite(s.y))errors.push({code:'INVALID_BAR',id:s.id});
    // Monotonic cubic X can be inverted. Sample both slab boundaries and midpoint;
    // Y is monotonic too, so these bound the ribbon across the full node slab.
    function bandAt(edge,x){
      let lower=0,upper=1;
      const controlX=(edge.x1+edge.x2)/2;
      for(let i=0;i<52;i++){
        const t=(lower+upper)/2,u=1-t,sampleX=u*u*u*edge.x1+3*u*u*t*controlX+3*u*t*t*controlX+t*t*t*edge.x2;
        if(sampleX<x)lower=t;
        else upper=t;
      }
      const t=(lower+upper)/2,u=1-t;
      const y=u*u*u*edge.sy+3*u*u*t*edge.sy+3*u*t*t*edge.ty+t*t*t*edge.ty;
      return [y,y+edge.width];
    }
    if(flows)for(const edge of flows.edges){
      if(!Number.isFinite(edge.width)||edge.width<0)errors.push({code:'INVALID_RIBBON',id:edge.id});
      if(!edge.width)continue;
      for(const node of flows.nodes){
        if(node.id===edge.from||node.id===edge.to||!node.h||node.x>=edge.x2||node.x+node.w<=edge.x1)continue;
        const left=bandAt(edge,Math.max(node.x,edge.x1));
        const right=bandAt(edge,Math.min(node.x+node.w,edge.x2));
        const top=Math.min(left[0],right[0]);
        const bottom=Math.max(left[1],right[1]);
        if(Math.min(bottom,node.y+node.h)-Math.max(top,node.y)>1e-7)errors.push({code:'RIBBON_NODE_OVERLAP',edge:edge.id,node:node.id,overlapY:Math.min(bottom,node.y+node.h)-Math.max(top,node.y),message:'A nonincident ribbon intersects this node; restructure or split the supplied graph before rendering.'});
      }
    }
    if(flows)warnings.push({code:'RIBBON_CROSSINGS_NOT_CAUSAL',message:'Ribbon crossings are not graph joins. Only authored node endpoints define transitions; inspect crossing readability visually.'});
    return {analysis,stages,flows,width,baseline,geometry:{status:errors.length?'failed':'checked',scope:'Finite proportional columns on a shared zero baseline and DAG port stacking; text bounds, crossing readability and visual acceptance require browser inspection',errors,warnings,measurements:{stageScale,flowScale:flows?.scale??null,nodes:flows?.nodes.length||0,edges:flows?.edges.length||0}}};
  }
  // RFC 4180 and spreadsheet formula mitigation; only authored text is prefixed.
  function funnelCSV(data){
    const a=analyzeFunnel(data),rows=[['type','id','label','count','previous_denominator','entry_or_scope_denominator','from_previous','from_entry_or_scope','not_progressed_within_window','definition','source_ids']];
    const unknown=x=>x===null?'unknown':x;
    const safe=s=>/^[\s\u0000-\u001f]*[=+\-@]/.test(String(s))?"'"+s:s;
    for(const s of a.stages)rows.push(['stage',s.id,safe(s.title),unknown(s.count),s.previousApplicable?unknown(s.previousDenominator):'not_applicable',unknown(s.entryDenominator),s.previousApplicable?unknown(s.fromPrevious):'not_applicable',unknown(s.fromEntry),s.previousApplicable?unknown(s.notProgressed):'not_applicable',safe(s.definition),safe(s.sourceIds.join(' '))]);
    for(const edge of a.graph?.edges||[])rows.push(['flow',edge.id,safe(edge.label),edge.value,edge.denominator,a.graph.rootTotal,unknown(edge.fromNode),unknown(edge.fromScope),'','',safe(edge.sourceIds.join(' '))]);
    if(a.repeat)rows.push(['repeat','','repeat purchase',a.repeat.purchased,a.repeat.eligible,'',unknown(a.repeat.rate),'','',safe(a.repeat.definition),safe(a.repeat.sourceIds.join(' '))]);
    rows.push(['scope','','people','','','','','','',safe(JSON.stringify(data.scope)),'']);
    if(data.transitions)rows.push(['flow_scope','','','','','','','','',safe(JSON.stringify(data.transitions.scope)),'']);
    if(a.repeat)rows.push(['repeat_pending','','immature first purchasers',a.repeat.pending,'','','','','',`windowDays=${a.repeat.windowDays}`,'']);
    return rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n')+'\r\n';
  }
  return {validateFunnel,analyzeFunnel,layoutFunnel,funnelCSV};
});
