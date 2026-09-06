'use strict';
const originalData=JSON.parse(document.getElementById('map-data').textContent);
const Core=globalThis.CXMap, $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
let data=originalData.mode==='comparison'?originalData.current:originalData;
let view=data.defaultView||'cjm',zoom=1,fitMode=false,focusReturn=null,layout=null;
const palette={observed:'#276756',declared:'#52685d',requirement:'#24695a',user_fact:'#596c2f',code:'#526c80',hypothesis:'#a06a24',unknown:'#89938a',proposal:'#4c67a0'};
const viewNames={cjm:'Путь клиента',blueprint:'Как сервис обеспечивает этот путь',process:'Участники, передачи и условия продолжения'};
const sourceKinds={'user-input':'Задание пользователя',requirement:'Требования',research:'Пользовательское исследование',runtime:'Результат выполнения',code:'Исходный код',other:'Другой источник'};
const font='"Avenir Next", "Trebuchet MS", sans-serif';
const LEFT=194,COL=245,GAP=12;
let TOP=120;
const wrap=Core.wrap;
const claimLabel=c=>Core.labelFor(c,data);
const cell=(stage,key)=>Core.cell(data,stage,key);
function el(tag,attrs={},parent){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(parent)parent.append(n);return n;}
function rect(parent,x,y,w,h,fill,stroke='none',radius=8){return el('rect',{x,y,width:w,height:h,rx:radius,fill,stroke},parent);}
function txt(parent,text,x,y,opts={}){
  const size=opts.size||16,lh=opts.lh||size*1.4,lines=opts.lines||wrap(text,opts.width||180,size);
  const node=el('text',{x,y,fill:opts.fill||'#263e35','font-size':size,'font-weight':opts.weight||500,'font-family':font,...(opts.class?{class:opts.class}:{})},parent);
  lines.forEach((line,i)=>{const t=el('tspan',{x,dy:i?lh:0},node);t.textContent=line;});return lines.length*lh;
}
function line(parent,x1,y1,x2,y2,color='#dce3d8',dash){return el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1,...(dash?{'stroke-dasharray':dash}:{})},parent);}
function paragraph(parent,text,cls){const p=document.createElement('p');p.textContent=text;if(cls)p.className=cls;parent.append(p);return p;}
function activate(node,handler,label){node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',label);node.style.cursor='pointer';const call=()=>{focusReturn=node;handler();};node.addEventListener('click',call);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();call();}});}
function sourceBlocks(parent,claim){
  if(!claim.sourceIds?.length){paragraph(parent,claim.status==='proposal'?'Предложение автора; не согласованное правило.':claim.status==='hypothesis'?'Гипотеза автора; подтверждение не представлено.':'Источник не указан.','source-kind');return;}
  for(const id of claim.sourceIds){const source=(data.sources||[]).find(s=>s.id===id);paragraph(parent,source.label);paragraph(parent,sourceKinds[source.kind]||'Тип источника не указан','source-kind');paragraph(parent,source.text);}
}
function claimBlock(parent,title,claim){
  const block=document.createElement('section');block.className='claim-block';const h=document.createElement('h3');h.textContent=title;block.append(h);
  const badge=document.createElement('span');badge.className='badge';badge.textContent=claimLabel(claim);block.append(badge);paragraph(block,claim.text||claim.title);if(claim.detail)paragraph(block,claim.detail);sourceBlocks(block,claim);parent.append(block);
}
function showBarrier(parent,b){
  claimBlock(parent,`Барьер${b.id?' · '+b.id:''}`,b);
  for(const[key,title]of [['consequence','Последствие'],['improvement','Связанное улучшение'],['question','Открытый вопрос']])if(b[key])claimBlock(parent,title,b[key]);
}
function openDrawer(stage,label,claim,related={}){
  $('detail-stage').textContent=stage?`${String(data.stages.indexOf(stage)+1).padStart(2,'0')} / ${stage.title}`:Core.modeLabels[data.mode||'unspecified'];
  $('detail-title').textContent=label;$('detail-status').textContent=claimLabel(claim);$('detail-text').textContent=claim.detail||claim.text||claim.title||'';
  $('detail-related').replaceChildren();$('detail-sources').replaceChildren();sourceBlocks($('detail-sources'),claim);
  if(related.channel)claimBlock($('detail-related'),'Канал',related.channel);
  if(related.artifact)paragraph($('detail-related'),'Результат: '+related.artifact);
  for(const b of related.barriers||[])showBarrier($('detail-related'),b);
  for(const q of data.questions||[])if(!stage||q.stageIds?.includes(stage.id)){claimBlock($('detail-related'),'Допущение / вопрос',q);if(q.impact)paragraph($('detail-related'),'Влияние на сценарий: '+q.impact);}
  $('drawer').hidden=false;$('close').focus();
}
function closeDrawer(restore=true){$('drawer').hidden=true;if(restore&&focusReturn?.isConnected)focusReturn.focus();}
$('close').onclick=()=>closeDrawer();document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
function allStatuses(){
  const set=new Set();const visit=x=>{if(!x||typeof x!=='object')return;if(typeof x.status==='string'&&Core.statusLabels[x.status])set.add(x.status);for(const value of Object.values(x))if(typeof value==='object')visit(value);};visit(data);
  set.add('unknown');return [...set];
}
function legendEntries(){
  const entries=allStatuses().map(status=>({text:claimLabel({status}),color:palette[status]}));
  if(view==='process'){
    for(const kind of Object.keys(Core.edgeStyles)){const style=Core.edgeStyles[kind];entries.push({text:style.label,color:style.color,dash:style.dash,edge:true,kind});}
    entries.push({text:'Пустая ячейка: шаг не описан',color:palette.unknown});
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
function scopeText(){return data.scope?`${data.scope.scenario} · ${data.scope.start} → ${data.scope.end} · Срез: ${data.scope.asOf}`:'Граница и дата среза не уточнены';}
function svgFooterHeight(width){
  let rows=1,x=8;for(const e of legendEntries()){const w=Core.measure(e.text,11)+40;if(x+w>width-20){rows++;x=8;}x+=w;}
  return 64+wrap(`${data.title} · ${viewNames[view]} · ${Core.modeLabels[data.mode||'unspecified']}`,width-30,12).length*16.8+wrap(data.disclaimer,width-32,11).length*15.4+wrap(scopeText(),width-32,11).length*15.4+rows*24;
}
function createSvg(contentHeight,width=LEFT+COL*data.stages.length+32){
  const height=contentHeight+svgFooterHeight(width),svg=el('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,width,height,'aria-label':`${data.title}. ${viewNames[view]}. ${Core.modeLabels[data.mode||'unspecified']}`});
  const title=el('title',{},svg);title.textContent=`${data.title} — ${viewNames[view]} — ${Core.modeLabels[data.mode||'unspecified']}`;
  const desc=el('desc',{},svg);desc.textContent=scopeText()+'. '+data.disclaimer;
  rect(svg,0,0,width,height,'#fdfefa','none',0);
  const style=el('style',{},svg);style.textContent='[role="button"]:focus-visible{outline:none;filter:drop-shadow(0 0 3px #b18d34)}';
  const defs=el('defs',{},svg);
  for(const[k,v]of Object.entries(Core.edgeStyles)){
    const marker=el('marker',{id:k,markerWidth:9,markerHeight:9,refX:8,refY:4.5,orient:'auto',markerUnits:'userSpaceOnUse'},defs);
    el('path',{d:'M1,1 L8,4.5 L1,8',fill:k==='handoff'?'none':v.color,stroke:v.color,'stroke-width':1.4},marker);
  }
  txt(svg,view==='cjm'?'КЛИЕНТСКИЙ ПУТЬ':view==='blueprint'?'СЛОИ СЕРВИСА':'УЧАСТНИКИ',8,31,{size:11,weight:700,width:170,fill:'#78907e'});
  txt(svg,Core.modeLabels[data.mode||'unspecified'],8,54,{size:10,width:175,fill:'#667e6d'});
  data.stages.forEach((stage,i)=>{
    const x=LEFT+i*COL,g=el('g',{'data-card':'stage'},svg);rect(g,x,10,COL-GAP,TOP-30,i===0?'#e4eee5':'#f0f3ec','#dce5d8');
    txt(g,String(i+1).padStart(2,'0'),x+14,31,{size:11,fill:'#77937b'});txt(g,stage.title,x+14,55,{size:17,weight:600,width:COL-42});
    activate(g,()=>openDrawer(stage,stage.title,cell(stage,'goal'),{barriers:Core.barriersFor(data,stage)}),stage.title);
    if(i<data.stages.length-1)el('path',{d:`M${x+COL-GAP+2} 48 h8`,stroke:'#98ac9a','stroke-width':1.2,'marker-end':'url(#flow)'},svg);
  });
  return svg;
}
function footer(svg,y){
  const width=svg.viewBox.baseVal.width;line(svg,8,y,width-12,y);
  y+=24;y+=txt(svg,`${data.title} · ${viewNames[view]} · ${Core.modeLabels[data.mode||'unspecified']}`,8,y,{size:12,width:width-30,fill:'#526b59'});
  y+=4;y+=txt(svg,scopeText(),8,y,{size:11,width:width-32,fill:'#6e806f'});
  y+=4;y+=txt(svg,data.disclaimer,8,y,{size:11,width:width-32,fill:'#6e806f'});
  y+=12;let x=8;
  for(const e of legendEntries()){
    const w=Core.measure(e.text,11)+40;if(x+w>width-20){x=8;y+=24;}
    if(e.edge)el('path',{d:`M${x} ${y-4} h23`,stroke:e.color,'stroke-width':1.5,'stroke-dasharray':e.dash||'none','marker-end':`url(#${e.kind})`},svg);
    else el('circle',{cx:x+5,cy:y-4,r:3,fill:e.color},svg);
    txt(svg,e.text,x+(e.edge?30:14),y,{size:11,width:w-14,fill:e.color});x+=w;
  }
}
function renderGrid(){
  const rows=view==='cjm'?[
    {key:'goal',label:'Цель клиента',sub:'Ради чего этот шаг',min:95},
    {key:'action',label:'Действие и канал',sub:'Что делает клиент',min:125},
    {key:'experience',label:'Переживание',sub:'Основание указано отдельно',min:105},
    {key:'barrier',label:'Барьер',sub:'Препятствие или неизвестность',min:115,tone:'risk'},
    {key:'opportunity',label:'Улучшение',sub:'Связанное предложение',min:115,tone:'proposal'}]:[
    {key:'evidence',label:'Свидетельство',sub:'Что получает клиент',min:95},
    {key:'action',label:'Клиент',sub:'Действие',min:105},
    {key:'frontstage',label:'Видимая работа',sub:'Контакт с сервисом',min:110,boundary:'ЛИНИЯ ВЗАИМОДЕЙСТВИЯ'},
    {key:'backstage',label:'Внутренняя работа',sub:'Скрыто от клиента',min:110,boundary:'ЛИНИЯ ВИДИМОСТИ'},
    {key:'support',label:'Поддержка',sub:'Системы и ресурсы',min:100,boundary:'ВНУТРЕННЕЕ ВЗАИМОДЕЙСТВИЕ'}];
  let cursor=TOP;
  for(const row of rows){
    if(row.boundary)cursor+=30;row.y=cursor;
    row.height=Math.max(row.min,...data.stages.map(stage=>{
      const main=wrap(cell(stage,row.key).text,COL-42,16).length*22.4;
      const channel=row.key==='action'&&view==='cjm'?wrap(cell(stage,'channel').text,COL-42,12).length*17+29:0;
      return main+channel+62;
    }));cursor+=row.height;
  }
  const svg=createSvg(cursor+18);
  for(const row of rows){
    const y=row.y;
    if(row.boundary){line(svg,5,y-13,LEFT+COL*data.stages.length-12,y-13,'#a3b7a3','5 5');rect(svg,8,y-23,Core.measure(row.boundary,10)+20,20,'#fdfefa','none',0);txt(svg,row.boundary,12,y-9,{size:10,weight:600,width:400,fill:'#758972'});}
    txt(svg,row.label,8,y+26,{size:14,weight:600,width:175});txt(svg,row.sub,8,y+48,{size:11,width:170,fill:'#7f8c80'});
    data.stages.forEach((stage,i)=>{
      const claim=cell(stage,row.key),x=LEFT+i*COL,status=claim.status||'unknown',g=el('g',{'data-cell':`${stage.id}:${row.key}`,'data-card':'cell'},svg);
      const fill=row.tone==='risk'?'#f8eee7':row.tone==='proposal'?'#edf1f8':i%2?'#f4f6ef':'#f9faf5';
      rect(g,x,y+1,COL-GAP,row.height-9,fill,'none',7);
      txt(g,claim.text,x+14,y+27,{size:16,width:COL-42,fill:row.tone==='risk'?'#7c4e3d':'#2e463a'});
      if(row.key==='action'&&view==='cjm'){
        const channel=cell(stage,'channel'),lines=wrap(channel.text,COL-42,12),cy=y+row.height-59-(lines.length-1)*17;
        txt(g,channel.text,x+14,cy,{size:12,lh:17,width:COL-42});txt(g,claimLabel(channel),x+14,y+row.height-41,{size:10,width:COL-42,fill:palette[channel.status||'unknown']});
      }
      const by=y+row.height-22;el('circle',{cx:x+17,cy:by-4,r:2.5,fill:palette[status]},g);txt(g,claimLabel(claim),x+25,by,{size:10,width:COL-44,fill:palette[status]});
      const barriers=Core.barriersFor(data,stage);
      if(view==='blueprint'&&barriers.length)txt(g,'!',x+COL-29,y+20,{size:12,fill:'#986339'});
      activate(g,()=>openDrawer(stage,row.label,claim,{channel:row.key==='action'?cell(stage,'channel'):null,barriers:row.key==='barrier'||view==='blueprint'?barriers:[]}),`${stage.title}. ${row.label}: ${claim.text}. ${claimLabel(claim)}`);
    });
  }
  footer(svg,cursor+10);return svg;
}
function renderProcess(){
  if(!data.process){const svg=createSvg(290);txt(svg,'Участники и переходы не описаны.',LEFT,TOP+45,{size:22,width:700});txt(svg,'Нужно уточнить: кто выполняет шаг, что передаёт и кому.',LEFT,TOP+85,{size:16,width:900});footer(svg,275);return svg;}
  layout=Core.layoutProcess(data);const svg=createSvg(layout.height+20,layout.width);
  for(const lane of layout.lanes){
    rect(svg,0,lane.y,layout.width-8,lane.h,lane===layout.lanes[0]?'#f8faf4':'#f1f4ed','none',6);
    txt(svg,lane.title,10,lane.y+35,{size:14,weight:600,width:166});
    if(lane.role)txt(svg,lane.role,10,lane.y+88,{size:11,width:170,fill:'#7e8e79'});
  }
  const edges=el('g',{'data-layer':'edges'},svg);
  for(const edge of layout.edges){
    if(edge.unrouted)continue;const style=Core.edgeStyles[edge.kind||'flow'];
    const path=el('path',{d:Core.pathD(edge.points),stroke:style.color,'stroke-width':1.6,fill:'none','stroke-dasharray':style.dash||'none','marker-end':`url(#${style.marker})`,'data-edge':edge.id,'data-from':edge.from,'data-to':edge.to,'data-kind':edge.kind||'flow'},edges);
    const from=layout.nodes.find(n=>n.id===edge.from),to=layout.nodes.find(n=>n.id===edge.to),description=`${edge.id}: ${from.title} → ${to.title}. ${edge.label||style.label}`;
    const title=el('title',{},path);title.textContent=description;
    const show=()=>openDrawer(data.stages.find(s=>s.id===from.stageId),'Переход', {...edge,text:description,status:edge.status||'unknown'});
    activate(path,show,description);
    if(edge.labelBox){
      const b=edge.labelBox,g=el('g',{'data-edge-label':edge.id},edges);rect(g,b.x,b.y,b.w,b.h,'#fffefa','#d7dfd0',4);
      txt(g,(b.callout?edge.id+': ':'')+edge.label,b.x+8,b.y+19,{size:12,lh:17,lines:b.lines,width:b.w-16,fill:style.color});
      activate(g,show,description);
      for(const target of [g,path]){target.addEventListener('mouseenter',()=>path.setAttribute('stroke-width',4));target.addEventListener('mouseleave',()=>path.setAttribute('stroke-width',1.6));target.addEventListener('focus',()=>path.setAttribute('stroke-width',4));target.addEventListener('blur',()=>path.setAttribute('stroke-width',1.6));}
    }
  }
  for(const node of layout.nodes){
    const stage=data.stages.find(s=>s.id===node.stageId),g=el('g',{'data-node':node.id,'data-card':'node'},svg),status=node.status||'unknown';
    rect(g,node.x,node.y,node.w,node.h,node.kind==='outcome'?'#dfeddf':node.kind==='decision'?'#f5edda':'#fffefa',node.kind==='decision'?'#c3ad77':'#c4d4c2',8);
    txt(g,node.title,node.x+14,node.y+27,{size:16,weight:600,width:node.w-28,lh:22});
    if(node.artifact){const lines=wrap(node.artifact,node.w-28,12);txt(g,node.artifact,node.x+14,node.y+node.h-39-(lines.length-1)*17,{size:12,lh:17,lines,width:node.w-28,fill:'#6b8167'});}
    txt(g,claimLabel(node),node.x+14,node.y+node.h-16,{size:10,width:node.w-28,fill:palette[status]});
    const barriers=Core.barriersFor(data,node);
    if(barriers.length)el('circle',{cx:node.x+node.w-10,cy:node.y+12,r:4,fill:'#a77b42'},g);
    activate(g,()=>openDrawer(stage,node.title,node,{artifact:node.artifact,barriers}),`${node.title}. ${claimLabel(node)}`);
  }
  footer(svg,layout.height+10);return svg;
}
function updateHeading(){
  for(const key of ['title','subtitle','actor','goal','disclaimer'])$(key).textContent=data[key];
  $('map-mode').textContent=Core.modeLabels[data.mode||'unspecified'];$('scope').textContent=scopeText();
  $('stage-count').textContent=`${data.stages.length} этапов · 100% для чтения, «Вписать» для обзора`;
  document.title=`${data.title} · ${Core.modeLabels[data.mode||'unspecified']} · CX Impact`;
}
function setScale(){
  const svg=$('viewport').querySelector('svg');
  if(fitMode){const css=getComputedStyle($('viewport'));zoom=Math.min(1,($('viewport').clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight))/svg.viewBox.baseVal.width);}
  svg.style.width=`${svg.viewBox.baseVal.width*zoom}px`;$('scale').textContent=`${Math.round(zoom*100)}%`;$('minus').disabled=zoom<=.2;$('plus').disabled=zoom>=2;
}
function checkRenderedGeometry(){
  const svg=$('viewport').querySelector('svg'),errors=[...(layout?.geometry.errors||[])];
  for(const card of svg.querySelectorAll('[data-card], [data-edge-label]')){
    const box=card.querySelector('rect').getBBox();
    for(const text of card.querySelectorAll('text')){const b=text.getBBox();if(b.x<box.x-1||b.y<box.y-1||b.x+b.width>box.x+box.width+1||b.y+b.height>box.y+box.height+1)errors.push({code:'TEXT_OUTSIDE_CARD',card:card.dataset.node||card.dataset.cell||'stage',text:text.textContent});}
  }
  const warnings=[...(layout?.geometry.warnings||[])];
  window.cxMapChecks={structure:{status:'checked',scope:'Validated during HTML generation'},geometry:{status:errors.length?'failed':'checked',errors,warnings},visual:{status:'not_checked'},interactions:{status:'not_checked'},export:{status:'not_checked'},mode:data.mode||'unspecified',view};
  const note=$('geometry-note');note.hidden=!errors.length&&!warnings.length;note.textContent=[...errors.map(e=>`Проверьте размещение: ${e.code} (${e.card||e.edge||''})`),...(warnings.length?[`Условий, вынесенных в список под картой: ${warnings.length}. Наведите на подпись, чтобы выделить переход; нажмите для подробностей.`]:[])].join(' · ');
  return window.cxMapChecks;
}
function render(){
  closeDrawer(false);layout=null;updateHeading();$('view-title').textContent=viewNames[view];
  TOP=Math.max(120,...data.stages.map(s=>wrap(s.title,COL-42,17).length*24+66));
  document.querySelectorAll('[data-view]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.view===view));b.tabIndex=b.dataset.view===view?0:-1;b.setAttribute('aria-controls','map-panel');});
  $('map-panel').setAttribute('aria-labelledby',`tab-${view}`);$('viewport').replaceChildren(view==='process'?renderProcess():renderGrid());renderLegend();setScale();$('viewport').scrollTo(0,0);checkRenderedGeometry();
}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();};
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=['cjm','blueprint','process'],i=keys.indexOf(view);view=keys[e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3];render();$(`tab-${view}`).focus();});
$('plus').onclick=()=>{fitMode=false;zoom=Math.min(2,zoom+.25);setScale();};$('minus').onclick=()=>{fitMode=false;zoom=Math.max(.2,zoom-.25);setScale();};
$('natural').onclick=()=>{fitMode=false;zoom=1;setScale();};$('fit').onclick=()=>{fitMode=true;setScale();$('viewport').scrollTo(0,0);};
new ResizeObserver(()=>{if(fitMode)setScale();}).observe($('viewport'));
$('questions').onclick=()=>{
  focusReturn=$('questions');openDrawer(null,'Основания и открытые вопросы',{text:scopeText(),status:'unknown'});
  for(const b of data.barriers||[])if(b.question)showBarrier($('detail-related'),b);
  if(data.participants?.length)for(const p of data.participants)paragraph($('detail-related'),`${p.title}: ${p.roles.join(', ')}. Роль не равна отдельному человеку или аккаунту.`);
  for(const source of data.sources||[])sourceBlocks($('detail-related'),{sourceIds:[source.id]});
};
if(originalData.mode==='comparison'){
  $('comparison-switch').hidden=false;
  for(const key of ['current','target']){const b=document.createElement('button');b.className='comparison-choice';b.textContent=Core.modeLabels[key];b.dataset.scenario=key;b.setAttribute('aria-pressed',String(key==='current'));b.onclick=()=>{data=originalData[key];document.querySelectorAll('[data-scenario]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();};$('comparison-switch').append(b);}
}
const exportURLs=new Map();
function offerDownload(content,type,name){
  if(exportURLs.has(type))URL.revokeObjectURL(exportURLs.get(type));const url=URL.createObjectURL(new Blob([content],{type}));exportURLs.set(type,url);
  let box=document.querySelector(`[data-export-type="${type}"]`);if(!box){box=document.createElement('div');box.dataset.exportType=type;$('export-links').append(box);}box.replaceChildren();
  const a=document.createElement('a');a.href=url;a.download=name;a.textContent=`Сохранить ${name} повторно`;box.append(a);a.click();
  if(type==='image/svg+xml'){const open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener';open.textContent='Открыть SVG отдельно';box.append(document.createTextNode(' · '),open);}
  $('status').textContent='Файл сформирован. Сохранение на диск этим просмотрщиком не подтверждено; ссылка доступна для повторного действия.';
}
function exportedSVG(){
  const svg=$('viewport').querySelector('svg').cloneNode(true);svg.removeAttribute('style');
  for(const path of svg.querySelectorAll('[data-edge]'))path.setAttribute('stroke-width',1.6);
  for(const n of svg.querySelectorAll('[tabindex]')){n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('style');}
  return new XMLSerializer().serializeToString(svg);
}
$('export').onclick=()=>offerDownload(exportedSVG(),'image/svg+xml',`cx-impact-${data.mode||'unspecified'}-${view}.svg`);
$('source').onclick=()=>offerDownload(JSON.stringify(originalData,null,2),'application/json','cx-impact-map.json');
window.addEventListener('unload',()=>{for(const url of exportURLs.values())URL.revokeObjectURL(url);});
render();
