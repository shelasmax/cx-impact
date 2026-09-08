'use strict';
const originalData=JSON.parse(document.getElementById('map-data').textContent);
const Core=globalThis.CXMap, $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const scenarioData=key=>({...originalData[key],locale:originalData[key].locale||originalData.locale});
let data=originalData.mode==='comparison'?scenarioData('current'):originalData;
const Comparison=globalThis.CXComparison;
const pairLayout=originalData.mode==='comparison'?Comparison.layoutComparison(originalData,Core):null;
let comparing=false,renderingSide=null;
const bilingual=(ru,en)=>data.locale==='en'?en:ru;
const comparisonLabels={changed:['Δ Изменено','Δ Changed'],unchanged:['= Без изменений','= Unchanged'],'only-in-current':['− Только AS IS · без соответствия','− Only AS IS · unmatched'],'only-in-target':['+ Только TO BE · без соответствия','+ Only TO BE · unmatched']};
const comparisonLabel=g=>bilingual(...comparisonLabels[g.status]);
const stageColumn=stage=>comparing?pairLayout.prepared.stageSlots.findIndex(s=>s[renderingSide]===stage.id):data.stages.indexOf(stage);
const stageCount=()=>comparing?pairLayout.prepared.stageSlots.length:data.stages.length;
const markerId=id=>comparing?`${renderingSide}-${id}`:id;
const t=value=>Core.translate(value,data);
const modeLabel=mode=>t(Core.modeLabels[mode||'unspecified']);
let view=data.defaultView||'cjm',zoom=1,fitMode=false,focusReturn=null,layout=null;
let palette={},colors={},edgeStyles={};
const viewNames={cjm:'Путь клиента',blueprint:'Как сервис обеспечивает этот путь',process:'Участники, передачи и условия продолжения'};
const sourceKinds={'user-input':'Задание пользователя',requirement:'Требования',research:'Пользовательское исследование',runtime:'Результат выполнения',code:'Исходный код',other:'Другой источник'};
let font='"Avenir Next", "Trebuchet MS", sans-serif';
const LEFT=194,COL=245,GAP=12;
let TOP=120;
const wrap=Core.wrap;
const claimLabel=c=>Core.labelFor(c,data);
const cell=(stage,key)=>Core.cell(data,stage,key);
function el(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(parent)parent.append(n);return n;}
function rect(parent,x,y,w,h,fill,stroke='none',radius=8){return el('rect',{x,y,width:w,height:h,rx:radius,fill,stroke},parent);}
function txt(parent,text,x,y,opts={}){
  const size=opts.size||16,lh=opts.lh||size*1.4,lines=opts.lines||wrap(text,opts.width||180,size);
  const node=el('text',{x,y,fill:opts.fill||colors.text,'font-size':size,'font-weight':opts.weight||500,'font-family':opts.family||font,...(opts.class?{class:opts.class}:{})},parent);
  lines.forEach((line,i)=>{const t=el('tspan',{x,dy:i?lh:0},node);t.textContent=line;});return lines.length*lh;
}
function line(parent,x1,y1,x2,y2,color=colors.border,dash){return el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1,...(dash?{'stroke-dasharray':dash}:{})},parent);}
function paragraph(parent,text,cls){const p=document.createElement('p');p.textContent=text;if(cls)p.className=cls;parent.append(p);return p;}
function activate(node,handler,label){node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',label);node.style.cursor='pointer';const scenario=data,side=renderingSide;const call=()=>{const previous=data;data=scenario;focusReturn=node;try{handler();if(comparing&&side)comparisonDetails(node,side);}finally{data=previous;}};node.addEventListener('click',call);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();call();}});}
function sourceBlocks(parent,claim){
  if(!claim.sourceIds?.length){paragraph(parent,claim.status==='proposal'?t('Предложение автора; не согласованное правило.'):claim.status==='hypothesis'?t('Гипотеза автора; подтверждение не представлено.'):t('Источник не указан.'),'source-kind');return;}
  for(const id of claim.sourceIds){const source=(data.sources||[]).find(s=>s.id===id);paragraph(parent,source.label);paragraph(parent,t(sourceKinds[source.kind])||t('Тип источника не указан'),'source-kind');paragraph(parent,source.text);}
}
function claimBlock(parent,title,claim){
  const block=document.createElement('section');block.className='claim-block';const h=document.createElement('h3');h.textContent=title;block.append(h);
  const badge=document.createElement('span');badge.className='badge';badge.textContent=claimLabel(claim);block.append(badge);paragraph(block,claim.text||claim.title);if(claim.detail)paragraph(block,claim.detail);sourceBlocks(block,claim);parent.append(block);
}
function showBarrier(parent,b){
  claimBlock(parent,`${t('Барьер')}${b.id?' · '+b.id:''}`,b);
  for(const[key,title]of [['consequence',t('Последствие')],['improvement',t('Связанное улучшение')],['question',t('Открытый вопрос')]])if(b[key])claimBlock(parent,title,b[key]);
}
function openDrawer(stage,label,claim,related={}){
  $('detail-stage').textContent=stage?`${String(data.stages.indexOf(stage)+1).padStart(2,'0')} / ${stage.title}`:modeLabel(data.mode);
  $('detail-title').textContent=label;$('detail-status').textContent=claimLabel(claim);$('detail-text').textContent=claim.detail||claim.text||claim.title||'';
  $('detail-related').replaceChildren();$('detail-sources').replaceChildren();sourceBlocks($('detail-sources'),claim);
  if(related.channel)claimBlock($('detail-related'),t('Канал'),related.channel);
  if(related.artifact)paragraph($('detail-related'),t('Результат: ')+related.artifact);
  for(const b of related.barriers||[])showBarrier($('detail-related'),b);
  for(const q of data.questions||[])if(!stage||q.stageIds?.includes(stage.id)){claimBlock($('detail-related'),t('Допущение / вопрос'),q);if(q.impact)paragraph($('detail-related'),t('Влияние на сценарий: ')+q.impact);}
  pauseWalk();updateWalk();document.querySelector('.shell').inert=true;if($('drawer-backdrop'))$('drawer-backdrop').hidden=false;$('drawer').hidden=false;$('close').focus();
}
function closeDrawer(restore=true){for(const n of document.querySelectorAll('[data-counterpart]'))n.removeAttribute('data-counterpart');$('drawer').hidden=true;document.querySelector('.shell').inert=false;if($('drawer-backdrop'))$('drawer-backdrop').hidden=true;if(restore&&focusReturn?.isConnected)focusReturn.focus();}
$('close').onclick=()=>closeDrawer();if($('drawer-backdrop'))$('drawer-backdrop').onclick=()=>closeDrawer();
$('drawer').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=[...$('drawer').querySelectorAll('button,a[href],[tabindex="0"]')].filter(n=>!n.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
function allStatuses(){
  const set=new Set();const visit=x=>{if(!x||typeof x!=='object')return;if(typeof x.status==='string'&&Core.statusLabels[x.status])set.add(x.status);for(const value of Object.values(x))if(typeof value==='object')visit(value);};visit(data);
  set.add('unknown');return [...set];
}
function legendEntries(){
  const entries=allStatuses().map(status=>({text:claimLabel({status}),color:palette[status]}));
  if(view==='process'){
    for(const kind of Object.keys(edgeStyles)){const style=edgeStyles[kind];entries.push({text:t(style.label),color:style.color,dash:style.dash,edge:true,kind});}
    entries.push({text:t('Пустая ячейка: шаг не описан'),color:palette.unknown});
  }
  return entries;
}
function renderLegend(){
  $('legend').replaceChildren();for(const entry of legendEntries()){
    const span=document.createElement('span');span.className='legend-item';
    if(entry.edge){const svg=el('svg',{viewBox:'0 0 24 14'});line(svg,1,7,23,7,entry.color,entry.dash);span.append(svg);}
    else{const dot=document.createElement('i');dot.className='dot';dot.style.background=entry.color;span.append(dot);}
    span.append(document.createTextNode(entry.text));$('legend').append(span);
  }
}
function scopeText(){return data.scope?`${data.scope.scenario} · ${data.scope.start} → ${data.scope.end} · ${t('Срез:')} ${data.scope.asOf}`:t('Граница и дата среза не уточнены');}
function svgFooterHeight(width){
  let rows=1,x=8;for(const e of legendEntries()){const w=Core.measure(e.text,11)+40;if(x+w>width-20){rows++;x=8;}x+=w;}
  return 128+wrap(`${data.title} · ${t(viewNames[view])} · ${modeLabel(data.mode)}`,width-30,12).length*16.8+wrap(data.disclaimer,width-32,11).length*15.4+wrap(scopeText(),width-32,11).length*15.4+rows*24;
}
function createSvg(contentHeight,width=LEFT+COL*stageCount()+32){
  const height=contentHeight+svgFooterHeight(width),svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,width,height,'aria-label':`${data.title}. ${t(viewNames[view])}. ${modeLabel(data.mode)}`});
  const title=el('title',{},svg);title.textContent=`${data.title} — ${t(viewNames[view])} — ${modeLabel(data.mode)}`;
  const desc=el('desc',{},svg);desc.textContent=scopeText()+'. '+data.disclaimer;
  rect(svg,0,0,width,height,colors.surface,'none',0);
  const style=el('style',{},svg);style.textContent=`[role="button"]:focus-visible{outline:none} [data-card]:focus-visible>rect:first-child,[data-card]:hover>rect:first-child{stroke:${colors.focus};stroke-width:2} [data-edge]:focus-visible{stroke-width:4} [data-counterpart]>rect:first-child{stroke:${colors.focus};stroke-width:3;stroke-dasharray:6 3} [data-card]>rect:first-child{transition:stroke 150ms} [data-walk="process"] [data-node]:not([data-traced]),[data-walk="process"] [data-edge]:not([data-traced]),[data-walk="process"] [data-edge-label]:not([data-traced]){opacity:.45} [data-walk="stages"] [data-cell]:not([data-active]){opacity:.5} [data-active][data-card]>rect:first-child{stroke:${colors.accent};stroke-width:2.5} [data-active][data-edge]{stroke-width:3} @media(prefers-reduced-motion:reduce){*{transition:none!important}}`;
  const defs=el('defs',{},svg);
  for(const[k,v]of Object.entries(edgeStyles)){
    const marker=el('marker',{id:markerId(k),markerWidth:9,markerHeight:9,refX:8,refY:4.5,orient:'auto',markerUnits:'userSpaceOnUse'},defs);
    el('path',{d:'M1,1 L8,4.5 L1,8',fill:k==='handoff'?'none':v.color,stroke:v.color,'stroke-width':1.4},marker);
  }
  txt(svg,view==='cjm'?t('КЛИЕНТСКИЙ ПУТЬ'):view==='blueprint'?t('СЛОИ СЕРВИСА'):t('УЧАСТНИКИ'),8,31,{size:11,weight:700,width:170,fill:colors.muted});
  txt(svg,modeLabel(data.mode),8,54,{size:10,width:175,fill:colors.muted});
  data.stages.forEach((stage,i)=>{
    const classic=designChoice==='classic',x=LEFT+stageColumn(stage)*COL,g=el('g',{'data-card':'stage','data-stage':stage.id},svg);
    rect(g,x,10,COL-GAP,TOP-30,classic?(i===0?colors.accentSoft:colors.stage):colors.surface,classic?colors.border:'none');
    txt(g,String(i+1).padStart(2,'0'),x+14,31,{size:classic?11:22,fill:colors.accent,family:classic?font:'Georgia, serif'});txt(g,stage.title,x+14,55,{size:17,weight:600,width:COL-42});
    if(comparing){const group=pairLayout.prepared.groups.stages.find(g=>g[renderingSide].includes(stage.id));g.dataset.comparisonGroup=group.id;txt(g,comparisonLabel(group),x+14,TOP-43,{size:10,width:COL-42,fill:colors.muted});}
    activate(g,()=>openDrawer(stage,stage.title,cell(stage,'goal'),{barriers:Core.barriersFor(data,stage)}),stage.title);
    if(!comparing&&i<data.stages.length-1)el('path',{d:`M${x+COL-GAP+2} 48 h8`,stroke:colors.strong,'stroke-width':1.2,'marker-end':`url(#${markerId('flow')})`},svg);
  });
  if(comparing)for(const [i,slot]of pairLayout.prepared.stageSlots.entries())if(!slot[renderingSide]){
    const x=LEFT+i*COL,g=el('g',{'data-alignment-gap':slot.groupId},svg);
    rect(g,x,10,COL-GAP,TOP-30,colors.subtle,colors.border);txt(g,bilingual('Нет сопоставленного этапа','No aligned stage'),x+14,45,{size:14,width:COL-42,fill:colors.muted});
  }
  return svg;
}
function footer(svg,y){
  const width=svg.viewBox.baseVal.width;line(svg,8,y,width-12,y);
  const brand=document.querySelector('.brand img');
  if(brand?.src.startsWith('data:image/png;base64,'))el('image',{href:brand.src,x:8,y:svg.viewBox.baseVal.height-72,width:180,height:60,'data-brand':'cx-impact','aria-label':'CX Impact',preserveAspectRatio:'xMidYMid meet'},svg);
  y+=24;y+=txt(svg,`${data.title} · ${t(viewNames[view])} · ${modeLabel(data.mode)}`,8,y,{size:12,width:width-30,fill:colors.muted});
  y+=4;y+=txt(svg,scopeText(),8,y,{size:11,width:width-32,fill:colors.muted});
  y+=4;y+=txt(svg,data.disclaimer,8,y,{size:11,width:width-32,fill:colors.muted});
  y+=12;let x=8;
  for(const e of legendEntries()){
    const w=Core.measure(e.text,11)+40;if(x+w>width-20){x=8;y+=24;}
    if(e.edge)el('path',{d:`M${x} ${y-4} h23`,stroke:e.color,'stroke-width':1.5,'stroke-dasharray':e.dash||'none','marker-end':`url(#${markerId(e.kind)})`},svg);
    else el('circle',{cx:x+5,cy:y-4,r:3,fill:e.color},svg);
    txt(svg,e.text,x+(e.edge?30:14),y,{size:11,width:w-14,fill:e.color});x+=w;
  }
}
function renderGrid(){
  const rows=view==='cjm'?[
    {key:'goal',label:t('Цель клиента'),sub:t('Ради чего этот шаг'),min:95},
    {key:'action',label:t('Действие и канал'),sub:t('Что делает клиент'),min:125},
    {key:'experience',label:t('Переживание'),sub:t('Основание указано отдельно'),min:105},
    {key:'barrier',label:t('Барьер'),sub:t('Препятствие или неизвестность'),min:115,tone:'risk'},
    {key:'opportunity',label:t('Улучшение'),sub:t('Связанное предложение'),min:115,tone:'proposal'}]:[
    {key:'evidence',label:t('Свидетельство'),sub:t('Что получает клиент'),min:95},
    {key:'action',label:t('Клиент'),sub:t('Действие'),min:105},
    {key:'frontstage',label:t('Видимая работа'),sub:t('Контакт с сервисом'),min:110,boundary:t('ЛИНИЯ ВЗАИМОДЕЙСТВИЯ')},
    {key:'backstage',label:t('Внутренняя работа'),sub:t('Скрыто от клиента'),min:110,boundary:t('ЛИНИЯ ВИДИМОСТИ')},
    {key:'support',label:t('Поддержка'),sub:t('Системы и ресурсы'),min:100,boundary:t('ВНУТРЕННЕЕ ВЗАИМОДЕЙСТВИЕ')}];
  let cursor=TOP;
  for(const row of rows){
    if(row.boundary)cursor+=30;row.y=cursor;
    row.height=Math.max(row.min,...(comparing?[...originalData.current.stages,...originalData.target.stages]:data.stages).map(stage=>{
      const map=comparing?(originalData.current.stages.includes(stage)?originalData.current:originalData.target):data;
      const main=wrap(Core.cell(map,stage,row.key).text,COL-42,16).length*22.4;
      const channel=row.key==='action'&&view==='cjm'?wrap(Core.cell(map,stage,'channel').text,COL-42,12).length*17+29:0;
      return main+channel+62;
    }));cursor+=row.height;
  }
  const svg=createSvg(cursor+18);
  for(const row of rows){
    const y=row.y;
    if(row.boundary){line(svg,5,y-13,LEFT+COL*stageCount()-12,y-13,colors.strong,'5 5');rect(svg,8,y-23,Core.measure(row.boundary,10)+20,20,colors.surface,'none',0);txt(svg,row.boundary,12,y-9,{size:10,weight:600,width:400,fill:colors.muted});}
    txt(svg,row.label,8,y+26,{size:14,weight:600,width:175});txt(svg,row.sub,8,y+48,{size:11,width:170,fill:colors.muted});
    data.stages.forEach((stage,i)=>{
      const claim=cell(stage,row.key),x=LEFT+stageColumn(stage)*COL,status=claim.status||'unknown',g=el('g',{'data-cell':`${stage.id}:${row.key}`,'data-card':'cell','data-status':status},svg);
      const classic=designChoice==='classic',fill=row.tone==='risk'?colors.riskSoft:row.tone==='proposal'?colors.proposalSoft:classic?(i%2?colors.cellOdd:colors.cellEven):colors.raised;
      rect(g,x,y+1,COL-GAP,row.height-9,fill,classic?'none':colors.border,classic?7:4);
      txt(g,claim.text,x+14,y+27,{size:16,width:COL-42,fill:row.tone==='risk'?colors.risk:colors.text});
      if(row.key==='action'&&view==='cjm'){
        const channel=cell(stage,'channel'),lines=wrap(channel.text,COL-42,12),cy=y+row.height-59-(lines.length-1)*17;
        txt(g,channel.text,x+14,cy,{size:12,lh:17,width:COL-42});txt(g,claimLabel(channel),x+14,y+row.height-41,{size:10,width:COL-42,fill:palette[channel.status||'unknown']});
      }
      const by=y+row.height-22;el('circle',{cx:x+17,cy:by-4,r:2.5,fill:palette[status]},g);txt(g,claimLabel(claim),x+25,by,{size:10,width:COL-44,fill:palette[status]});
      if(comparing)g.dataset.comparisonGroup=pairLayout.prepared.groups.stages.find(g=>g[renderingSide].includes(stage.id)).id;
      const barriers=Core.barriersFor(data,stage);
      if(view==='blueprint'&&barriers.length)txt(g,'!',x+COL-29,y+20,{size:12,fill:colors.hypothesis});
      activate(g,()=>openDrawer(stage,row.label,claim,{channel:row.key==='action'?cell(stage,'channel'):null,barriers:row.key==='barrier'||view==='blueprint'?barriers:[]}),`${stage.title}. ${row.label}: ${claim.text}. ${claimLabel(claim)}`);
    });
  }
  footer(svg,cursor+10);return svg;
}
function renderProcess(){
  if(!data.process){const svg=createSvg(290);txt(svg,t('Участники и переходы не описаны.'),LEFT,TOP+45,{size:22,width:700});txt(svg,t('Нужно уточнить: кто выполняет шаг, что передаёт и кому.'),LEFT,TOP+85,{size:16,width:900});footer(svg,275);return svg;}
  layout=comparing?pairLayout.regions.find(r=>r.side===renderingSide).layout:Core.layoutProcess(data);const svg=createSvg(layout.height+20,layout.width);
  for(const lane of layout.lanes){
    rect(svg,0,lane.y,layout.width-8,lane.h,lane===layout.lanes[0]?colors.surface:colors.subtle,'none',6);
    txt(svg,lane.title,10,lane.y+35,{size:14,weight:600,width:166});
    if(lane.role)txt(svg,lane.role,10,lane.y+88,{size:11,width:170,fill:colors.muted});
  }
  const edges=el('g',{'data-layer':'edges'},svg);
  for(const edge of layout.edges){
    if(edge.unrouted)continue;const style=edgeStyles[edge.kind||'flow'];
    const path=el('path',{d:Core.pathD(edge.points),stroke:style.color,'stroke-width':2,fill:'none','stroke-dasharray':style.dash||'none','marker-end':`url(#${markerId(style.marker)})`,'data-edge':edge.id,'data-from':edge.from,'data-to':edge.to,'data-kind':edge.kind||'flow'},edges);
    const from=layout.nodes.find(n=>n.id===edge.from),to=layout.nodes.find(n=>n.id===edge.to),description=`${edge.id}: ${from.title} → ${to.title}. ${edge.label||t(style.label)}`;
    const title=el('title',{},path);title.textContent=description;
    const show=()=>openDrawer(data.stages.find(s=>s.id===from.stageId),t('Переход'), {...edge,text:description,status:edge.status||'unknown'});
    activate(path,show,description);
    if(edge.labelBox){
      const b=edge.labelBox,g=el('g',{'data-edge-label':edge.id},edges);rect(g,b.x,b.y,b.w,b.h,colors.raised,colors.border,4);
      txt(g,(b.callout?edge.id+': ':'')+edge.label,b.x+8,b.y+19,{size:12,lh:17,lines:b.lines,width:b.w-16,fill:style.color});
      activate(g,show,description);
      for(const target of [g,path]){target.addEventListener('mouseenter',()=>path.setAttribute('stroke-width',4));target.addEventListener('mouseleave',()=>path.setAttribute('stroke-width',2));target.addEventListener('focus',()=>path.setAttribute('stroke-width',4));target.addEventListener('blur',()=>path.setAttribute('stroke-width',2));}
    }
  }
  for(const node of layout.nodes){
    const stage=data.stages.find(s=>s.id===node.stageId),g=el('g',{'data-node':node.id,'data-card':'node','data-kind':node.kind||'action'},svg),status=node.status||'unknown';
    const classic=designChoice==='classic';
    rect(g,node.x,node.y,node.w,node.h,node.kind==='outcome'?(classic?colors.outcome:colors.proposalSoft):node.kind==='decision'?colors.hypothesisSoft:colors.raised,node.kind==='decision'?colors.hypothesis:colors.border,classic?8:node.kind==='decision'?1:4);
    if(node.kind==='decision'&&!classic)el('path',{d:`M${node.x+node.w-12} ${node.y} L${node.x+node.w} ${node.y+12}`,fill:'none',stroke:colors.hypothesis,'stroke-width':2},g);
    txt(g,node.title,node.x+14,node.y+27,{size:16,weight:600,width:node.w-28,lh:22});
    if(node.artifact){const lines=wrap(node.artifact,node.w-28,12);txt(g,node.artifact,node.x+14,node.y+node.h-39-(lines.length-1)*17,{size:12,lh:17,lines,width:node.w-28,fill:colors.muted});}
    txt(g,claimLabel(node),node.x+14,node.y+node.h-16,{size:10,width:node.w-28,fill:palette[status]});
    const barriers=Core.barriersFor(data,node);
    if(barriers.length)el('circle',{cx:node.x+node.w-10,cy:node.y+12,r:4,fill:colors.hypothesis},g);
    if(comparing){const group=pairLayout.prepared.groups.nodes.find(g=>g[renderingSide].includes(node.id));g.dataset.comparisonGroup=group.id;txt(svg,comparisonLabel(group),node.x,node.y+node.h+17,{size:10,width:node.w,fill:colors.muted});}
    activate(g,()=>openDrawer(stage,node.title,node,{artifact:node.artifact,barriers}),`${node.title}. ${claimLabel(node)}`);
  }
  footer(svg,layout.height+10);return svg;
}
// All paired handlers retain their authored scenario closure via activate().
function comparisonDetails(node,side){
  const other=side==='current'?'target':'current',key=node.dataset.node?'nodes':'stages';
  const id=node.dataset.node||node.dataset.stage||node.dataset.cell?.split(':')[0];
  const from=node.dataset.from||data.process?.edges.find((e,i)=>(e.id||`edge-${i+1}`)===node.dataset.edgeLabel)?.from;
  const group=pairLayout.prepared.groups[from?'nodes':key].find(g=>g[side].includes(from||id));
  $('detail-stage').textContent=`${side==='current'?'AS IS':'TO BE'} · ${$('detail-stage').textContent}`;
  if(!group)return;
  const related=$('detail-related');paragraph(related,comparisonLabel(group),'comparison-summary');
  paragraph(related,bilingual('Соответствие задано автором; это сравнение сценариев, не история редакций.','Correspondence is authored; this compares scenarios, not revision history.'));
  for(const n of $('viewport').querySelectorAll('[data-comparison-group]'))if(n.dataset.comparisonGroup===group.id)n.setAttribute('data-counterpart','true');
  if(!group[other].length){paragraph(related,bilingual('Соответствие другой стороне не задано.','No correspondence to the other side was supplied.'));return;}
  const previous=data;data=scenarioData(other);
  try{for(const counterpart of group[other]){
    const heading=`${other==='current'?'AS IS':'TO BE'} · ${bilingual('Соответствие','Counterpart')}`;
    if(from){
      const n=data.process.nodes.find(n=>n.id===counterpart);claimBlock(related,`${heading}: ${n.title}`,n);
      for(const [i,e]of data.process.edges.entries())if(e.from===counterpart)claimBlock(related,`${heading} · ${bilingual('Исходящий переход','Outgoing transition')} ${e.id||i+1}`,{...e,text:[e.label,e.condition].filter(Boolean).join(' · ')||bilingual('Условие не задано','Condition unspecified')});
    }else if(key==='nodes'){
      const n=data.process.nodes.find(n=>n.id===counterpart);claimBlock(related,`${heading}: ${n.title}`,n);for(const b of Core.barriersFor(data,n))showBarrier(related,b);
    }else{
      const stage=data.stages.find(s=>s.id===counterpart),field=node.dataset.cell?.split(':')[1]||'goal';
      claimBlock(related,`${heading}: ${stage.title}`,cell(stage,field));
      if(field==='action')claimBlock(related,t('Канал'),cell(stage,'channel'));
      for(const b of Core.barriersFor(data,stage))showBarrier(related,b);
    }
  }}finally{data=previous;}
}
function renderComparison(){
  const previous=data,regions=[];
  for(const side of ['current','target']){
    renderingSide=side;data=scenarioData(side);const svg=view==='process'?renderProcess():renderGrid();svg.dataset.scenarioRegion=side;regions.push({side,svg});
  }
  data=previous;renderingSide=null;layout=null;
  const width=Math.max(...regions.map(r=>r.svg.viewBox.baseVal.width)),height=regions.reduce((h,r)=>h+r.svg.viewBox.baseVal.height+76,60);
  const svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,width,height,'aria-label':'AS IS / TO BE','data-comparison':'true'});
  rect(svg,0,0,width,height,colors.surface,'none',0);
  txt(svg,bilingual('Сценарии · Δ Изменено · = Без изменений · − / + Только одна сторона · без соответствия','Scenarios · Δ Changed · = Unchanged · − / + Only one side · unmatched'),8,25,{size:13,width:width-32});
  let y=60;
  for(const r of regions){txt(svg,r.side==='current'?'AS IS':'TO BE',8,y+24,{size:22,weight:700,width:width-32});r.svg.setAttribute('x',0);r.svg.setAttribute('y',y+42);svg.append(r.svg);y+=r.svg.viewBox.baseVal.height+76;}
  return svg;
}
function updateComparisonControl(){
  const b=$('compare-toggle');if(b)b.setAttribute('aria-pressed',String(comparing));
  document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(!comparing&&b.dataset.scenario===data.mode)));
}
function initComparison(){
  const box=$('comparison-switch');box.hidden=false;
  const button=document.createElement('button');button.id='compare-toggle';button.className='comparison-choice';button.textContent=bilingual('Сравнить AS IS / TO BE','Compare AS IS / TO BE');button.setAttribute('aria-pressed','false');button.disabled=!pairLayout;box.append(button);
  const explanation=document.createElement('p');explanation.className='comparison-explanation';explanation.textContent=pairLayout?bilingual('Сценарии сопоставляются только по явно заданным соответствиям.','Scenarios align only through explicit correspondence.'):bilingual('Сравнение недоступно: нужны оба сценария current и target.','Comparison unavailable: both current and target scenarios are required.');box.after(explanation);button.setAttribute('aria-describedby','comparison-explanation');explanation.id='comparison-explanation';
  const nav=document.createElement('div');nav.id='comparison-navigation';nav.className='comparison-navigation';nav.hidden=true;
  const label=document.createElement('label');label.textContent=bilingual('Сопоставленные этапы: ','Aligned stages: ');const select=document.createElement('select');select.id='comparison-stage';label.append(select);nav.append(label);
  if(pairLayout)for(const group of pairLayout.prepared.groups.stages){const option=document.createElement('option');option.value=String(group.start);option.textContent=['current','target'].map(side=>group[side].map(id=>originalData[side].stages.find(s=>s.id===id).title).join(' + ')||'—').join(' ↔ ');select.append(option);}
  select.onchange=()=>{const vp=$('viewport');vp.scrollTo({left:(LEFT+Number(select.value)*COL)*zoom,top:vp.scrollTop});};
  for(const side of ['current','target']){const b=document.createElement('button');b.className='comparison-choice';b.textContent=side==='current'?'AS IS':'TO BE';b.onclick=()=>{const region=$('viewport').querySelector(`[data-scenario-region="${side}"]`);$('viewport').scrollTo({left:$('viewport').scrollLeft,top:(Number(region.getAttribute('y'))-42)*zoom});};nav.append(b);}
  $('viewport').before(nav);
  button.onclick=()=>{comparing=!comparing;updateComparisonControl();render();};
}
function updateHeading(){
  document.documentElement.lang=data.locale||'ru';
  for(const node of document.querySelectorAll('[data-i18n]'))node.textContent=t(node.dataset.i18n);
  for(const node of document.querySelectorAll('[data-i18n-aria]'))node.setAttribute('aria-label',t(node.dataset.i18nAria));
  for(const node of document.querySelectorAll('[data-scenario]'))node.textContent=modeLabel(node.dataset.scenario);
  for(const key of ['title','subtitle','actor','goal','disclaimer'])$(key).textContent=data[key];
  $('map-mode').textContent=comparing?'AS IS / TO BE':modeLabel(data.mode);$('scope').textContent=scopeText();
  $('stage-count').textContent=comparing?bilingual(`${originalData.current.stages.length} / ${originalData.target.stages.length} этапов · общее выравнивание`,`${originalData.current.stages.length} / ${originalData.target.stages.length} stages · shared alignment`):`${data.stages.length} ${t('этапов · 100% для чтения, «Вписать» для обзора')}`;
  document.title=`${data.title} · ${comparing?'AS IS / TO BE':modeLabel(data.mode)} · CX Impact`;
}
function setScale(){
  const svg=$('viewport').querySelector('svg');
  if(fitMode){const css=getComputedStyle($('viewport'));zoom=Math.min(1,($('viewport').clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight))/svg.viewBox.baseVal.width);}
  svg.style.width=`${svg.viewBox.baseVal.width*zoom}px`;$('scale').textContent=`${Math.round(zoom*100)}%`;$('minus').disabled=zoom<=.2;$('plus').disabled=zoom>=2;
}
function warningSummaries(warnings){
  const groups=new Map();
  for(const warning of warnings){
    const message=warning.code==='ALIGNMENT_ORDER_CONFLICT'?bilingual('Соответствие конфликтует с порядком этапов; выравнивание не задаёт порядок выполнения.','Correspondence conflicts with stage order; alignment is not an execution sequence.'):warning.message||warning.code;
    const key=warning.code+':'+message;
    if(!groups.has(key))groups.set(key,{message,count:0,locations:new Set()});
    const group=groups.get(key);group.count++;
    const side=warning.side==='current'?'AS IS':warning.side==='target'?'TO BE':warning.side;
    const location=[side,warning.edge||warning.group].filter(Boolean).join(': ');if(location)group.locations.add(location);
  }
  return [...groups.values()].map(g=>`${g.message} (${g.count}${g.locations.size?' · '+[...g.locations].join(', '):''})`);
}
function checkRenderedGeometry(){
  const svg=$('viewport').querySelector('svg'),regions=comparing?pairLayout.regions.map(r=>({side:r.side,geometry:(view==='process'?r.layout?.geometry:null)||{status:'not_applicable',errors:[],warnings:[]}})):[{side:data.mode,geometry:layout?.geometry||{errors:[],warnings:[]}}],errors=regions.flatMap(r=>r.geometry.errors.map(e=>({...e,side:r.side})));
  for(const card of svg.querySelectorAll('[data-card], [data-edge-label]')){
    const box=card.querySelector('rect').getBBox();
    for(const text of card.querySelectorAll('text')){const b=text.getBBox();if(b.x<box.x-1||b.y<box.y-1||b.x+b.width>box.x+box.width+1||b.y+b.height>box.y+box.height+1)errors.push({code:'TEXT_OUTSIDE_CARD',card:card.dataset.node||card.dataset.cell||'stage',text:text.textContent});}
  }
  const warnings=regions.flatMap(r=>(r.geometry.warnings||[]).map(w=>({...w,side:r.side})));if(comparing)warnings.push(...pairLayout.prepared.diagnostics);
  window.cxMapChecks={structure:{status:'checked',scope:'Validated during HTML generation'},geometry:{status:errors.length?'failed':'checked',errors,warnings,regions,scope:comparing?'Both aligned SVG regions; text bounds checked in browser':'Selected map'},visual:{status:'not_checked'},interactions:{status:'not_checked'},export:{status:'not_checked'},mode:comparing?'comparison':data.mode||'unspecified',view};
  const note=$('geometry-note');note.hidden=!errors.length&&!warnings.length;note.textContent=[...errors.map(e=>`${t('Проверьте размещение:')} ${e.code} (${e.card||e.edge||''})`),...warningSummaries(warnings)].join(' · ');
  return window.cxMapChecks;
}
function render(){
  pauseWalk();walkHistory=[];walkIndex=-1;readTheme();
  closeDrawer(false);layout=null;updateHeading();$('view-title').textContent=t(viewNames[view]);
  TOP=comparing?pairLayout.top:Math.max(120,...data.stages.map(s=>wrap(s.title,COL-42,17).length*24+66));
  document.querySelectorAll('[data-view]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.view===view));b.tabIndex=b.dataset.view===view?0:-1;b.setAttribute('aria-controls','map-panel');});
  $('map-panel').setAttribute('aria-labelledby',`tab-${view}`);$('viewport').replaceChildren(comparing?renderComparison():view==='process'?renderProcess():renderGrid());$('comparison-navigation').hidden=!comparing;if($('path-toggle'))$('path-toggle').disabled=comparing;renderLegend();setScale();$('viewport').scrollTo(0,0);checkRenderedGeometry();updateWalk();
}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();};
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=['cjm','blueprint','process'],i=keys.indexOf(view);view=keys[e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3];render();$(`tab-${view}`).focus();});
$('plus').onclick=()=>{fitMode=false;zoom=Math.min(2,zoom+.25);setScale();};$('minus').onclick=()=>{fitMode=false;zoom=Math.max(.2,zoom-.25);setScale();};
$('natural').onclick=()=>{fitMode=false;zoom=1;setScale();};$('fit').onclick=()=>{fitMode=true;setScale();$('viewport').scrollTo(0,0);};
new ResizeObserver(()=>{if(fitMode)setScale();}).observe($('viewport'));
$('questions').onclick=()=>{
  focusReturn=$('questions');openDrawer(null,t('Основания и открытые вопросы'),{text:scopeText(),status:'unknown'});
  for(const b of data.barriers||[])if(b.question)showBarrier($('detail-related'),b);
  if(data.participants?.length)for(const p of data.participants)paragraph($('detail-related'),`${p.title}: ${p.roles.join(', ')}. ${t('Роль не равна отдельному человеку или аккаунту.')}`);
  for(const source of data.sources||[])sourceBlocks($('detail-related'),{sourceIds:[source.id]});
};
if(originalData.mode==='comparison'){
  $('comparison-switch').hidden=false;
  for(const key of ['current','target']){const b=document.createElement('button');b.className='comparison-choice';b.textContent=modeLabel(key);b.dataset.scenario=key;b.setAttribute('aria-pressed',String(key==='current'));b.onclick=()=>{comparing=false;updateComparisonControl();data=scenarioData(key);document.querySelectorAll('[data-scenario]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();};$('comparison-switch').append(b);}
}
initComparison();
const exportURLs=new Map();
function offerDownload(content,type,name){
  if(exportURLs.has(type))URL.revokeObjectURL(exportURLs.get(type));const url=URL.createObjectURL(new Blob([content],{type}));exportURLs.set(type,url);
  let box=document.querySelector(`[data-export-type="${type}"]`);if(!box){box=document.createElement('div');box.dataset.exportType=type;$('export-links').append(box);}box.replaceChildren();
  const a=document.createElement('a');a.href=url;a.download=name;a.textContent=`${t('Сохранить')} ${name} ${t('повторно')}`;box.append(a);a.click();
  if(type==='image/svg+xml'){const open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener';open.textContent=t('Открыть SVG отдельно');box.append(document.createTextNode(' · '),open);}
  $('status').textContent=t('Файл сформирован. Сохранение на диск этим просмотрщиком не подтверждено; ссылка доступна для повторного действия.');
}
function exportedSVG(){
  const svg=$('viewport').querySelector('svg').cloneNode(true);svg.removeAttribute('style');svg.removeAttribute('data-walk');
  for(const n of svg.querySelectorAll('[data-viewer-only], style'))n.remove();
  for(const n of svg.querySelectorAll('[data-active], [data-traced], [data-counterpart]')){n.removeAttribute('data-active');n.removeAttribute('data-traced');n.removeAttribute('data-counterpart');}
  for(const path of svg.querySelectorAll('[data-edge]'))path.setAttribute('stroke-width',2);
  for(const n of svg.querySelectorAll('[tabindex]')){n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('style');}
  return new XMLSerializer().serializeToString(svg);
}
$('export').onclick=()=>offerDownload(exportedSVG(),'image/svg+xml',`cx-impact-${comparing?'comparison':data.mode||'unspecified'}-${view}.svg`);
$('source').onclick=()=>offerDownload(JSON.stringify(originalData,null,2),'application/json','cx-impact-map.json');
window.addEventListener('unload',()=>{for(const url of exportURLs.values())URL.revokeObjectURL(url);});
// Finite, reader-controlled playback. State is never written into map data.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let walkHistory=[],walkIndex=-1,walkPlaying=false,walkTimer=null,walkAnimation=null;
function walkCurrent(){return walkHistory[walkIndex];}
function walkCycle(){return walkIndex>0&&walkHistory.slice(0,walkIndex).some(step=>step.nodeId===walkCurrent().nodeId);}
function walkChoices(){
  if(view==='process')return Core.playbackChoices(layout,walkCurrent()?.nodeId,walkHistory.slice(0,walkIndex+1).map(s=>s.nodeId));
  const stage=data.stages[walkIndex+1];return stage?[{node:stage,edge:null,repeated:false}]:[];
}
function pauseWalk(){
  walkPlaying=false;clearTimeout(walkTimer);walkTimer=null;
  walkAnimation?.cancel();walkAnimation=null;
  if($('path-play')){$('path-play').textContent=t('Воспроизвести');$('path-play').setAttribute('aria-pressed','false');}
}
function clearWalkMarks(){
  const svg=$('viewport').querySelector('svg');if(!svg)return;
  svg.removeAttribute('data-walk');
  for(const n of svg.querySelectorAll('[data-active], [data-traced], [data-counterpart]')){n.removeAttribute('data-active');n.removeAttribute('data-traced');n.removeAttribute('data-counterpart');}
  for(const n of svg.querySelectorAll('[data-viewer-only]'))n.remove();
}
function resetWalk(){
  pauseWalk();walkHistory=[];walkIndex=-1;readTheme();clearWalkMarks();updateWalk();
}
function walkNodeElement(step){
  const key=view==='process'?'node':'stage';
  return [...$('viewport').querySelectorAll(`[data-${key}]`)].find(n=>n.dataset[key]===step.nodeId);
}
function markWalk(animate=false){
  clearWalkMarks();const step=walkCurrent(),svg=$('viewport').querySelector('svg');if(!step||!svg)return;
  svg.setAttribute('data-walk',view==='process'?'process':'stages');
  const seen=walkHistory.slice(0,walkIndex+1);
  if(view==='process'){
    for(const n of svg.querySelectorAll('[data-node]')){if(seen.some(s=>s.nodeId===n.dataset.node))n.setAttribute('data-traced','true');if(n.dataset.node===step.nodeId)n.setAttribute('data-active','true');}
    for(const n of svg.querySelectorAll('[data-edge], [data-edge-label]')){const id=n.dataset.edge||n.dataset.edgeLabel;if(seen.some(s=>s.edgeId===id))n.setAttribute('data-traced','true');if(step.edgeId===id)n.setAttribute('data-active','true');}
  }else{
    for(const n of svg.querySelectorAll('[data-stage], [data-cell]')){const id=n.dataset.stage||n.dataset.cell.split(':')[0];if(id===step.nodeId)n.setAttribute('data-active','true');}
  }
  if(animate&&step.edgeId&&!reducedMotion.matches){
    const path=[...svg.querySelectorAll('[data-edge]')].find(p=>p.dataset.edge===step.edgeId);
    if(path){
      const length=path.getTotalLength();
      const overlay=el('path',{d:path.getAttribute('d'),fill:'none',stroke:colors.accent,'stroke-width':3,'stroke-linecap':'round','stroke-dasharray':length,'data-viewer-only':'trace','pointer-events':'none'},svg);
      walkAnimation=overlay.animate([{'strokeDashoffset':length},{'strokeDashoffset':0}],{duration:520,easing:'linear'});
    }
  }
  const node=walkNodeElement(step);
  if(node){ // Pan only the canvas; never steal page scroll or keyboard focus.
    const vp=$('viewport'),b=node.getBoundingClientRect(),v=vp.getBoundingClientRect();
    if(b.left<v.left+20||b.right>v.right-20||b.top<v.top+20||b.bottom>v.bottom-20){
      vp.scrollTo({left:vp.scrollLeft+b.left-v.left-(v.width-b.width)/2,top:vp.scrollTop+b.top-v.top-(v.height-b.height)/2,behavior:'auto'});
    }
  }
}
function updateWalk(){
  if(!$('journey-player'))return;
  if(comparing){$('journey-player').hidden=true;$('path-toggle').setAttribute('aria-expanded','false');return;}
  const choices=walkChoices(),step=walkCurrent(),cycle=walkCycle(),hasFuture=walkIndex<walkHistory.length-1;
  const complete=!!step&&!choices.length;
  $('path-play').textContent=t(walkPlaying?'Пауза':'Воспроизвести');$('path-play').setAttribute('aria-pressed',String(walkPlaying));
  $('path-play').disabled=reducedMotion.matches||cycle||(!choices.length&&!hasFuture);
  $('path-prev').disabled=walkIndex<0;$('path-next').disabled=cycle||(!choices.length&&!hasFuture);
  $('path-reset').disabled=walkHistory.length===0;
  $('path-kind').textContent=t(view==='process'?'Переходы из карты, не фактическое выполнение':'Обзор этапов, не порядок внутренних операций');
  $('path-motion').textContent=reducedMotion.matches?t('Уменьшение движения: используйте шаги'):'';
  const node=view==='process'?layout?.nodes.find(n=>n.id===step?.nodeId):data.stages.find(n=>n.id===step?.nodeId);
  const edge=layout?.edges.find(e=>e.id===step?.edgeId);
  const state=cycle?t('Цикл: автоматический проход завершён'):complete?t('Путь завершён'):choices.length>1?t(step?'Выберите ветвь':'Выберите начало'):t('Начните обзор');
  $('path-position').textContent=node?`${t(view==='process'?'Шаг':'Этап')} ${walkIndex+1}${view==='process'?'':` / ${data.stages.length}`} · ${node.title}`:state;
  $('path-caption').textContent=[node&&(cycle||complete||choices.length>1)?state:'',edge?.label,edge?.unrouted?t('Переход не проложен'):''].filter(Boolean).join(' · ');
  const box=$('path-choices');box.replaceChildren();box.hidden=choices.length<2||cycle;
  if(!box.hidden)for(const choice of choices){
    const button=document.createElement('button');button.className='path-choice';
    button.textContent=choice.edge?`${choice.edge.label||t(Core.edgeStyles[choice.edge.kind||'flow'].label)} → ${choice.node.title}`:choice.node.title;
    button.onclick=()=>{pauseWalk();takeWalkStep(choice);};box.append(button);
  }
}
function takeWalkStep(choice){
  walkHistory=walkHistory.slice(0,walkIndex+1);walkHistory.push({nodeId:choice.node.id,edgeId:choice.edge?.id});walkIndex++;
  markWalk(walkPlaying);const choices=walkChoices();
  if(choice.repeated||!choices.length||choices.length>1)pauseWalk();
  updateWalk();if(walkPlaying)walkTimer=setTimeout(advanceWalk,1800);
}
function advanceWalk(){
  clearTimeout(walkTimer);
  if(walkCycle()){pauseWalk();updateWalk();return;}
  if(walkIndex<walkHistory.length-1){walkIndex++;markWalk(walkPlaying);updateWalk();if(walkPlaying)walkTimer=setTimeout(advanceWalk,1800);return;}
  const choices=walkChoices();
  if(choices.length===1)takeWalkStep(choices[0]);
  else{pauseWalk();updateWalk();if(choices.length>1)$('path-choices').querySelector('button')?.focus();}
}
function initWalk(){
  if(!$('journey-player'))return; // Saved custom templates can keep their original controls.
  $('path-toggle').onclick=()=>{const opening=$('journey-player').hidden;$('journey-player').hidden=!opening;$('path-toggle').setAttribute('aria-expanded',String(opening));resetWalk();};
  $('path-close').onclick=()=>{$('journey-player').hidden=true;$('path-toggle').setAttribute('aria-expanded','false');resetWalk();$('path-toggle').focus();};
  $('path-play').onclick=()=>{if(walkPlaying){pauseWalk();updateWalk();}else if(!reducedMotion.matches){walkPlaying=true;advanceWalk();}};
  $('path-next').onclick=()=>{pauseWalk();advanceWalk();};
  $('path-prev').onclick=()=>{pauseWalk();walkIndex=Math.max(-1,walkIndex-1);markWalk();updateWalk();};
  $('path-reset').onclick=resetWalk;
  reducedMotion.addEventListener('change',()=>{pauseWalk();updateWalk();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseWalk();updateWalk();}});
}

const themePreference=window.matchMedia('(prefers-color-scheme: dark)');
let themeChoice='system',designChoice='classic';
try{const saved=localStorage.getItem('cx-impact-theme');if(['light','dark','system'].includes(saved))themeChoice=saved;}catch{}
try{const saved=localStorage.getItem('cx-impact-design');if(['classic','graphite'].includes(saved))designChoice=saved;}catch{}
function resolvedTheme(){return themeChoice==='system'?(themePreference.matches?'dark':'light'):themeChoice;}
function readTheme(){
  const css=getComputedStyle(document.documentElement);
  font=css.getPropertyValue('--font-body').trim()||font;
  const roles={surface:'surface',raised:'surface-raised',subtle:'surface-subtle',text:'fg',muted:'muted',border:'border',strong:'border-strong',accent:'accent',accentSoft:'accent-soft',focus:'focus',risk:'danger',riskSoft:'danger-soft',proposal:'proposal',proposalSoft:'proposal-soft',evidence:'evidence',hypothesis:'hypothesis',hypothesisSoft:'hypothesis-soft',unknown:'unknown',unknownSoft:'unknown-soft'};
  const fallback={surface:'#fffefa',raised:'#ffffff',subtle:'#f1f4ed',text:'#263e35',muted:'#667e6d',border:'#dce5d8',strong:'#98ac9a',accent:'#24695a',accentSoft:'#e4eee5',focus:'#b18d34',risk:'#7c4e3d',riskSoft:'#f8eee7',proposal:'#4c67a0',proposalSoft:'#edf1f8',evidence:'#276756',hypothesis:'#a06a24',hypothesisSoft:'#f5edda',unknown:'#667e6d',unknownSoft:'#f1f4ed'};
  colors=Object.fromEntries(Object.entries(roles).map(([key,name])=>[key,css.getPropertyValue('--'+name).trim()||fallback[key]]));
  for(const [key,name]of Object.entries({cellEven:'cell-even',cellOdd:'cell-odd',stage:'stage',outcome:'outcome'}))colors[key]=css.getPropertyValue('--'+name).trim()||colors.surface;
  palette={observed:colors.evidence,declared:colors.evidence,requirement:colors.evidence,user_fact:colors.evidence,code:colors.evidence,hypothesis:colors.hypothesis,unknown:colors.unknown,proposal:colors.proposal};
  if(designChoice==='classic'&&resolvedTheme()==='light')Object.assign(palette,{declared:'#52685d',requirement:'#24695a',user_fact:'#596c2f',code:'#526c80'});
  edgeStyles=Object.fromEntries(Object.entries(Core.edgeStyles).map(([kind,style])=>[kind,{...style,color:css.getPropertyValue('--edge-'+(kind==='exception'?'recovery':kind)).trim()||style.color}]));
}
function applyTheme(redraw=true){
  document.documentElement.dataset.theme=resolvedTheme();
  document.documentElement.dataset.design=designChoice;
  for(const b of document.querySelectorAll('[data-design-choice]'))b.setAttribute('aria-pressed',String(b.dataset.designChoice===designChoice));
  for(const b of document.querySelectorAll('[data-theme-choice]'))b.setAttribute('aria-pressed',String(b.dataset.themeChoice===themeChoice));
  if(redraw){const vp=$('viewport'),left=vp.scrollLeft,top=vp.scrollTop;render();vp.scrollTo(left,top);}
}
function initTheme(){
  applyTheme(false);
  for(const b of document.querySelectorAll('[data-theme-choice]'))b.onclick=()=>{themeChoice=b.dataset.themeChoice;try{localStorage.setItem('cx-impact-theme',themeChoice);}catch{}applyTheme();};
  for(const b of document.querySelectorAll('[data-design-choice]'))b.onclick=()=>{designChoice=b.dataset.designChoice;try{localStorage.setItem('cx-impact-design',designChoice);}catch{}applyTheme();};
  themePreference.addEventListener('change',()=>{if(themeChoice==='system')applyTheme();});
}

initTheme();
initWalk();
render();
