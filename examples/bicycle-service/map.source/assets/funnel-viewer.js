/* Autonomous funnel viewer in the shared CX Impact shell. MIT; see package LICENSE. */
'use strict';
const data=JSON.parse(document.getElementById('map-data').textContent),Funnel=globalThis.CXFunnel,Core=globalThis.CXMap,Design=globalThis.CXDesign;
const layout=Funnel.layoutFunnel(data),analysis=layout.analysis,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const bi=(ru,en)=>data.locale==='en'?en:ru,unknown=bi('Неизвестно','Unknown');
const number=v=>v===null?unknown:new Intl.NumberFormat(data.locale).format(v),percent=v=>v===null?unknown:(v>0&&v<.0001?'< ':'')+new Intl.NumberFormat(data.locale,{style:'percent',maximumFractionDigits:2}).format(v>0&&v<.0001?.0001:v);
const labels={stages:bi('Этапы','Stages'),flows:bi('Потоки','Flows'),table:bi('Таблица','Table')},outcomes={progress:bi('Продвинулись','Progress'),lost:bi('Потеря · задана','Lost · supplied'),pending:bi('Ожидание','Pending'),unknown};
let view='stages',zoom=1,fitMode=false,focusReturn=null,svg=null,colors={},font='',themeChoice='system',designChoice='classic',walk=null,timer=null;
const preference=matchMedia('(prefers-color-scheme: dark)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scopeText=()=>`${bi('Люди · закрытая когорта','People · closed cohort')} ${data.scope.cohortStart} — ${data.scope.cohortEnd} · ${data.scope.timezone} · ${bi('Срез','As of')} ${data.scope.asOf} · ${bi('Окно первой покупки','First-purchase window')}: ${data.scope.conversionDays} ${bi('дней','days')}`;
const limits=bi('Агрегаты и определения заданы автором. Идентификация, порядок событий и зрелость каждого человека независимо не проверены. Остаток означает «не продвинулись в окне», а не причину или потерю.','Aggregates and definitions are authored. Person-level identity, event order and maturity are not independently verified. Residual means not progressed within the window, not a cause or loss.');
function element(tag,parent,attrs={}){
  const n=document.createElementNS(NS,tag);
  for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));
  if(parent)parent.append(n);
  return n;
}
function paragraph(parent,text,tag='p'){
  const p=document.createElement(tag);
  p.textContent=text;
  parent.append(p);
  return p;
}
function text(parent,value,x,y,width=1000,size=16,fill=colors.text,weight=500){
  const lines=Core.wrap(String(value),width,size),n=element('text',parent,{x,y,fill,'font-size':size,'font-family':font,'font-weight':weight});
  lines.forEach((line,i)=>{
    const t=element('tspan',n,{x,dy:i?size*1.4:0});
    t.textContent=line;
  });
  return Math.max(1,lines.length)*size*1.4;
}
function rect(parent,x,y,width,height,fill,stroke='none'){
  return element('rect',parent,{x,y,width,height,fill,stroke,rx:designChoice==='classic'?6:0});
}
function activate(n,callback,label){
  n.setAttribute('tabindex','0');
  n.setAttribute('role','button');
  n.setAttribute('aria-label',label);
  n.style.cursor='pointer';
  const call=()=>{
    focusReturn=n;
    callback();
  };
  n.addEventListener('click',call);
  n.addEventListener('keydown',e=>{
    if(['Enter',' '].includes(e.key)){
      e.preventDefault();
      call();
    }
  });
}
function closeDetails(){
  document.querySelector('.shell').inert=false;
  $('drawer').hidden=true;
  $('drawer-backdrop').hidden=true;
  if(focusReturn?.isConnected)focusReturn.focus();
}
function details(item,body,flowNodeId=null){
  pause();
  $('detail-stage').textContent=labels[view];
  $('detail-title').textContent=item.title||item.label||data.title;
  $('detail-status').textContent=bi('Авторский агрегат','Authored aggregate');
  $('detail-text').textContent=body;
  $('detail-related').replaceChildren();
  $('detail-sources').replaceChildren();
  for(const id of item.sourceIds||data.sources.map(s=>s.id)){
    const s=data.sources.find(s=>s.id===id);
    paragraph($('detail-sources'),`${s.label} · ${s.kind}`,'h3');
    paragraph($('detail-sources'),s.text);
  }if(view==='flows'&&walk&&analysis.graph?.nodes.some(node=>node.id===flowNodeId)){
    const next=document.createElement('button');
    next.className='tool';
    next.textContent=bi('Обзор от этого узла','Explore from this node');
    next.onclick=()=>{
      walk=flowNodeId;
      closeDetails();
      updateWalk();
    };
    $('detail-related').append(next);
  }document.querySelector('.shell').inert=true;
  $('drawer').hidden=false;
  $('drawer-backdrop').hidden=false;
  $('close').focus();
}
$('close').onclick=closeDetails;
$('drawer-backdrop').onclick=closeDetails;
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('drawer').hidden)closeDetails();
});
$('drawer').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const list=[...$('drawer').querySelectorAll('button')],first=list[0],last=list.at(-1);
  if(e.shiftKey&&document.activeElement===first){
    e.preventDefault();
    last.focus();
  }else if(!e.shiftKey&&document.activeElement===last){
    e.preventDefault();
    first.focus();
  }
});
const previousNumber=(s,v)=>s.previousApplicable?number(v):bi('— (вход)','— (entry)'),previousPercent=(s,v)=>s.previousApplicable?percent(v):bi('— (не применимо)','— (not applicable)');
const stageBody=s=>`${s.definition}\n${bi('Людей','People')}: ${number(s.count)}\n${bi('От предыдущего','From previous')}: ${previousPercent(s,s.fromPrevious)} (${number(s.count)} / ${previousNumber(s,s.previousDenominator)})\n${bi('От входа','From entry')}: ${percent(s.fromEntry)} (${number(s.count)} / ${number(s.entryDenominator)})\n${bi('Не продвинулись в окне','Not progressed within window')}: ${previousNumber(s,s.notProgressed)}`;
function drawStages(g){
  const entry=analysis.stages[0],exit=analysis.stages.at(-1);
  const summary=element('g',g,{'data-funnel-summary':'true'});
  const metrics=[
    [bi('Конверсия','Conversion'),percent(exit.fromEntry),bi('из первого в последний этап','first to last stage')],
    [bi('На входе','Entered'),number(entry.count),entry.title],
    [bi('На выходе','Completed'),number(exit.count),exit.title]
  ];
  for(const [i,[label,value,description]] of metrics.entries()){
    const item=element('g',summary,{'data-funnel-metric':i});
    text(item,label,32+i*256,12,232,14,colors.muted);
    // Large cohort integers still fit without wrapping into the explanatory row.
    const size=Core.measure(value,30)>232?22:30;
    text(item,value,32+i*256,49,232,size,colors.text,650);
    const title=element('title',item);title.textContent=description;
  }
  text(summary,bi('Доля от входа · люди','Share of entry · people'),layout.width-304,12,272,14,colors.muted);
  text(summary,bi('Выберите этап, чтобы открыть\nрасчёт и источники','Select a stage to inspect\nits calculation and sources'),layout.width-304,37,272,13,colors.muted);
  element('path',g,{d:`M32 58 H${layout.width-32}`,fill:'none',stroke:colors.border});
  element('path',g,{d:`M32 ${layout.baseline} H${layout.width-56}`,fill:'none',stroke:colors.border,'data-funnel-baseline':layout.baseline});
  const titleHeight=Math.max(...layout.stages.map(s=>Core.wrap(s.title,s.w-28,15).length*21));
  const rowY=layout.baseline+32+titleHeight+10;
  for(const [i,s] of layout.stages.entries()){
    const group=element('g',g,{'data-funnel-stage':s.id,'data-count':s.count===null?'unknown':s.count});
    // An invisible hit area keeps zero/tiny/unknown stages easy to select. It is
    // a path, not a quantitative bar, and has no visible fill in exported SVG.
    element('path',group,{d:`M${s.x} 76 H${s.x+s.w} V${rowY+113} H${s.x} Z`,fill:'transparent','data-stage-hit':'true'});
    function centered(value,y,size,fill,weight){
      const height=text(group,value,s.x+s.w/2,y,s.w,size,fill,weight);
      group.lastElementChild.setAttribute('text-anchor','middle');
      return height;
    }
    centered(percent(s.fromEntry),s.y-34,18,colors.text,650);
    group.lastElementChild.setAttribute('data-stage-share','true');
    centered(number(s.count),s.y-12,14,colors.muted,500);
    if(s.h>0){
      const bar=rect(group,s.x,s.y,s.w,s.h,colors.accent);
      bar.setAttribute('rx',designChoice==='classic'||designChoice==='workshop'?2:0);
      bar.setAttribute('data-stage-bar','true');
    }else {
      // Small neutral status markers are separate from magnitude. The labels
      // above retain the exact zero or Unknown value without crowding the title.
      const marker=s.count===0
        ?element('circle',group,{cx:s.x+s.w/2,cy:layout.baseline+3,r:2,fill:'none',stroke:colors.muted})
        :element('path',group,{d:`M${s.x+s.w/2-6} ${layout.baseline+3} h12`,fill:'none',stroke:colors.muted,'stroke-dasharray':'2 2'});
      marker.setAttribute('data-stage-empty',s.count===0?'zero':'unknown');
    }
    text(group,String(i+1).padStart(2,'0'),s.x,layout.baseline+29,24,12,colors.muted,600);
    group.lastElementChild.setAttribute('data-design-index','true');
    text(group,s.title,s.x+28,layout.baseline+29,s.w-28,15,colors.text,650);
    group.lastElementChild.setAttribute('data-stage-title','true');
    element('path',group,{d:`M${s.x} ${rowY-7} H${s.x+s.w}`,fill:'none',stroke:colors.border});
    text(group,bi('От предыдущего','From previous'),s.x,rowY+13,s.w,12,colors.muted);
    text(group,s.previousApplicable?percent(s.fromPrevious):'—',s.x,rowY+38,s.w,20,colors.text,600);
    // Keep the explicit entry distinction in accessible text and SVG exports.
    element('title',group).textContent=s.previousApplicable?stageBody(s):previousPercent(s,s.fromPrevious);
    text(group,bi('Не прошли дальше','Did not progress'),s.x,rowY+66,s.w,12,colors.muted);
    const residual=s.previousApplicable?`${number(s.notProgressed)}${s.notProgressed!==null&&s.previousDenominator>0?' · '+percent(s.notProgressed/s.previousDenominator):''}`:'—';
    text(group,residual,s.x,rowY+91,s.w,17,s.notProgressed>0?colors.lost:colors.muted,600);
    activate(group,()=>details(s,stageBody(s)),`${s.title}: ${number(s.count)}. ${stageBody(s)}`);
  }
  const noteY=rowY+135;
  return noteY+text(g,bi('Проценты над столбцами — от входа. Показатели под этапом — переход с предыдущего шага в заданном окне; причины не определены.','Percentages above columns use entry as the denominator. Metrics below each stage describe the transition from the previous step within the defined window; causes are not identified.'),32,noteY,layout.width-64,13,colors.muted);
}
function flowColor(outcome){
  return colors[outcome||'accent']||colors.accent;
}
function drawFlows(g){
  const f=layout.flows;
  if(!f){
    text(g,bi('Данные переходов не заданы. Этапы не определяют потоки; используйте Этапы или Таблицу.','Transition data not supplied. Stage totals do not determine flows; use Stages or Table.'),32,60,1000,20);
    return;
  }
  for(const e of f.edges){
    const target=f.nodes.find(n=>n.id===e.to),group=element('g',g,{'data-funnel-edge':e.id,'data-count':e.value,'data-width':e.width});
    if(e.width>0){
      const p=element('path',group,{d:e.path,fill:flowColor(target.outcome),'fill-opacity':.4});
      p.setAttribute('data-ribbon','true');
    }else text(group,`${e.label}: 0`,e.x1+8,e.sy+18,250,12,colors.muted);
    const title=element('title',group);
    title.textContent=`${e.label}: ${number(e.value)}`;
    activate(group,()=>details(e,`${e.label}\n${number(e.value)} / ${number(e.denominator)} = ${percent(e.fromNode)}\n${bi('От подкогорты','From subset')}: ${number(e.value)} / ${number(analysis.graph.rootTotal)} = ${percent(e.fromScope)}\n${data.transitions.scope.description}`,e.to),title.textContent);
  }
  for(const n of f.nodes){
    const group=element('g',g,{'data-funnel-node':n.id,'data-count':n.value});
    if(n.h>0)rect(group,n.x,n.y,n.w,n.h,flowColor(n.outcome));
    else text(group,'0',n.x,n.y+18,40,14);
    const label=`${n.title} · ${number(n.value)}`,labelHeight=Core.wrap(label,300,16).length*22.4;
    rect(group,n.x-4,n.y-labelHeight-40,310,labelHeight+38,colors.surface).setAttribute('data-design-group','label');
    text(group,label,n.x,n.y-labelHeight-18,300,16,colors.text,650);
    text(group,n.outcome?outcomes[n.outcome]:analysis.graph.roots.includes(n.id)?bi('Вход подкогорты','Subset entry'):bi('Промежуточный узел','Intermediate node'),n.x,n.y-16,300,16,colors.muted);
    activate(group,()=>details(n,`${n.title}: ${number(n.value)}\n${n.outcome?outcomes[n.outcome]:bi('Входящий и исходящий объём сбалансированы','Incoming and outgoing values conserve flow')}\n${data.transitions.scope.denominator}\n${data.transitions.scope.description}`,n.id),`${n.title}: ${number(n.value)}`);
  }
}
function table(){
  const wrapper=document.createElement('div');
  wrapper.className='funnel-table';
  const table=document.createElement('table');
  wrapper.append(table);
  const caption=document.createElement('caption');
  caption.textContent=bi('Исходные количества и явные знаменатели. Неизвестно ≠ 0.','Raw counts and explicit denominators. Unknown ≠ 0.');
  table.append(caption);
  const head=table.createTHead().insertRow();
  for(const label of [bi('Этап / поток','Stage / flow'),bi('Людей','People'),bi('Предыдущий / узел','Previous / node'),bi('Вход / подкогорта','Entry / subset'),bi('От предыдущего','From previous'),bi('От входа','From entry'),bi('Не продвинулись в окне','Not progressed within window')]){
    const th=document.createElement('th');
    th.scope='col';
    th.textContent=label;
    head.append(th);
  }
  const body=table.createTBody();
  function row(item,values,description){
    const tr=body.insertRow();
    const td=tr.insertCell(),button=document.createElement('button');
    button.className='tool';
    button.textContent=item.title||item.label;
    button.onclick=()=>{
      focusReturn=button;
      details(item,description);
    };
    td.append(button);
    for(const v of values)tr.insertCell().textContent=v;
  }
  for(const s of analysis.stages)row(s,[number(s.count),previousNumber(s,s.previousDenominator),number(s.entryDenominator),previousPercent(s,s.fromPrevious),percent(s.fromEntry),previousNumber(s,s.notProgressed)],stageBody(s));
  for(const e of analysis.graph?.edges||[])row(e,[number(e.value),number(e.denominator),number(analysis.graph.rootTotal),percent(e.fromNode),percent(e.fromScope),'—'],`${e.label}\n${data.transitions.scope.description}`);
  $('viewport').append(wrapper);
}
function repeatText(){
  const r=analysis.repeat;
  return r?`${bi('Повторная покупка','Repeat purchase')}: ${number(r.purchased)} / ${number(r.eligible)} = ${percent(r.rate)} · ${bi('Окно, дней','Window, days')}: ${r.windowDays} · ${bi('Ожидают полного окна','Await full window')}: ${number(r.pending)}. ${r.definition}`:bi('Повторная покупка: данные не заданы.','Repeat purchase: no data supplied.');
}
function render(){
  closeDetails();
  $('viewport').replaceChildren();
  $('viewport').scrollTop=0;
  $('viewport').scrollLeft=0;
  svg=null;
  document.querySelectorAll('[data-funnel-view]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.funnelView===view)));
  $('view-title').textContent=labels[view];
  document.querySelector('.boardhead small').textContent=view==='stages'?bi('Выберите этап, чтобы увидеть расчёт и источники','Select a stage to see its calculation and sources'):bi('Выберите элемент, чтобы увидеть детали и источники','Select an item to see details and sources');
  $('map-panel').setAttribute('aria-labelledby','funnel-tab-'+view);
  $('export').disabled=view==='table';
  $('export').title=view==='table'?bi('SVG доступен в Этапах и Потоках; таблицу экспортируйте в CSV.','SVG is available in Stages and Flows; export the table as CSV.'):'';
  $('path-toggle').disabled=view!=='flows'||!layout.flows;
  $('legend').textContent=bi('Остаток ≠ потеря · причины не выведены','Residual ≠ loss · no inferred causes');
  if(view==='table')table();
  else {
    const width=view==='flows'&&layout.flows?layout.flows.width:layout.width;
    svg=element('svg',$('viewport'),{xmlns:NS,role:'img','aria-label':data.title,'data-funnel-view':view,width});
    element('title',svg).textContent=data.title;
    element('desc',svg).textContent=scopeText();
    rect(svg,0,0,width,1,colors.surface).setAttribute('data-background','true');
    // Full scope stays visible in the footer and exports; the chart opens with its counting unit.
    let y=30;
    y+=text(svg,data.title,32,y,width-64,20,colors.text,700)+8;
    svg.querySelector('text').setAttribute('data-design-display','true');
    if(view==='flows'&&data.transitions)y+=text(svg,data.transitions.scope.denominator,32,y,width-64,16,colors.muted)+8;
    const group=element('g',svg,{transform:`translate(0 ${y})`,'data-funnel-body':'true'});
    if(view==='stages')y+=drawStages(group)+40;
    else {drawFlows(group);y+=(layout.flows?.height||130)+40;}
    y+=text(svg,data.title,32,y,width-64,26,colors.text,700)+18;
    svg.lastElementChild.setAttribute('data-design-display','true');
    y+=text(svg,scopeText(),32,y,width-64,16,colors.muted)+18;
    if(view==='flows'&&data.transitions)y+=text(svg,data.transitions.scope.description,32,y,width-64,16)+18;
    if(view==='flows'&&analysis.graph){
      y+=text(svg,bi('Переходы · авторские данные','Transitions · authored data'),32,y,width-64,18,colors.text,700)+18;
      for(const e of analysis.graph.edges){
        const label=`${e.label}: ${number(e.value)} / ${number(e.denominator)} = ${percent(e.fromNode)} · ${bi('От подкогорты','From subset')}: ${percent(e.fromScope)} · [${e.sourceIds.join(', ')}]`;
        y+=text(svg,label,32,y,width-64,16)+12;
      }
      y+=18;
    }
    y+=text(svg,data.scope.identityRule,32,y,width-64,16)+10;
    y+=text(svg,data.scope.orderRule,32,y,width-64,16)+20;
    y+=text(svg,repeatText(),32,y,width-64,16)+22;
    y+=text(svg,limits,32,y,width-64,16,colors.muted)+22;
    y+=text(svg,bi('Источники','Sources'),32,y,width-64,18,colors.text,700)+15;
    for(const s of data.sources)y+=text(svg,`[${s.id}] ${s.label} · ${s.kind}: ${s.text}`,32,y,width-64,16)+12;
    y+=text(svg,data.disclaimer,32,y,width-64,16,colors.muted)+20;
    text(svg,'CX Impact · MIT License · Copyright (c) 2026 CX Impact contributors',32,y,width-64,12,colors.muted);
    y+=28;
    const brand=document.querySelector('.brand img');
    if(brand?.src.startsWith('data:image/png;base64,')){
      element('image',svg,{href:brand.src,x:32,y,width:180,height:60,'data-brand':'cx-impact','aria-label':'CX Impact',preserveAspectRatio:'xMidYMid meet'});
      y+=76;
    }
    svg.setAttribute('viewBox',`0 0 ${width} ${y}`);
    svg.dataset.naturalWidth=width;
    svg.dataset.naturalHeight=y;
    svg.querySelector('[data-background]').setAttribute('height',y);
    Design.apply(svg,designChoice,getComputedStyle(document.documentElement));
  }
  $('stage-count').textContent=`${data.stages.length} ${bi('этапов','stages')}`;
  size();
  updateWalk();
  window.cxFunnelChecks={structure:{status:'checked'},geometry:layout.geometry,visual:{status:'not_checked'},interactions:{status:'not_checked'},export:{status:'not_checked'},view};
}
function size(){
  if(svg){
    if(fitMode)zoom=Math.min(1,($('viewport').clientWidth-32)/Number(svg.dataset.naturalWidth));
    svg.setAttribute('width',Number(svg.dataset.naturalWidth)*zoom);
    svg.setAttribute('height',Number(svg.dataset.naturalHeight)*zoom);
  }$('scale').textContent=Math.round(zoom*100)+'%';
}
function pause(){
  clearTimeout(timer);
  timer=null;
  $('path-play').setAttribute('aria-pressed','false');
}
function resetWalk(){
  pause();
  walk=analysis.graph?.roots[0]||null;
  updateWalk();
}
function step(){
  if(!walk)return;
  const edges=analysis.graph.edges.filter(e=>e.from===walk&&e.value>0);
  if(edges.length===1){
    walk=edges[0].to;
    updateWalk();
    return true;
  }pause();
  updateWalk();
  return false;
}
function play(){
  if(timer){
    pause();
    return;
  }if(reduced.matches){
    step();
    return;
  }function tick(){
    if(!step())return;
    timer=setTimeout(tick,1200);
    $('path-play').setAttribute('aria-pressed','true');
  }tick();
}
function updateWalk(){
  document.querySelectorAll('[data-walk]').forEach(node=>{
    node.removeAttribute('data-walk');
    node.style.removeProperty('outline');
  });
  if(!walk)return;
  const node=analysis.graph.nodes.find(node=>node.id===walk);
  $('path-position').textContent=`${node.title} · ${number(node.value)}`;
  $('path-caption').textContent=bi('Обзор заданного графа; не движение людей и не скорость трафика. На развилке выберите переход.','Explore the supplied graph; this is not people movement or traffic speed. Select a transition at branches.');
  $('path-motion').textContent=reduced.matches?bi('Сниженное движение: только статический выбор.','Reduced motion: static selection only.'):bi('Конечный обзор; выключен при открытии.','Finite traversal; off on load.');
  const selected=document.querySelector(`[data-funnel-node="${walk}"]`);
  if(selected){
    selected.dataset.walk='true';
    selected.style.outline=`3px solid ${colors.text}`;
  }
  const choices=$('path-choices');
  choices.replaceChildren();
  const edges=analysis.graph.edges.filter(edge=>edge.from===walk);
  choices.hidden=!edges.length;
  for(const edge of edges){
    const button=document.createElement('button');
    button.className='tool';
    button.textContent=`${edge.label} · ${number(edge.value)}`;
    button.disabled=edge.value===0;
    button.onclick=()=>{
      pause();
      walk=edge.to;
      updateWalk();
    };
    choices.append(button);
  }if(analysis.graph.roots.length>1){
    for(const id of analysis.graph.roots){
      const button=document.createElement('button');
      button.className='tool';
      button.textContent=bi('Корень: ','Root: ')+analysis.graph.nodes.find(node=>node.id===id).title;
      button.onclick=()=>{
        pause();
        walk=id;
        updateWalk();
      };
      choices.append(button);
    }choices.hidden=false;
  }
}
function download(bytes,type,name){
  const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
$('source').onclick=()=>download(Uint8Array.from(atob(globalThis.CXFunnelSourceBase64),c=>c.charCodeAt(0)),'application/json','cx-impact-funnel.json');
$('export').onclick=()=>{
  if(!svg)return;
  const clone=svg.cloneNode(true);
  for(const n of clone.querySelectorAll('[tabindex],[data-walk]')){
    n.removeAttribute('tabindex');
    n.removeAttribute('data-walk');
    n.removeAttribute('style');
  }
  clone.setAttribute('width',svg.dataset.naturalWidth);
  clone.setAttribute('height',svg.dataset.naturalHeight);
  download('<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone),'image/svg+xml',`cx-impact-funnel-${view}.svg`);
};
function applyAppearance(){
  pause();
  walk=null;
  $('journey-player').hidden=true;
  $('path-toggle').setAttribute('aria-expanded','false');
  document.documentElement.dataset.theme=themeChoice==='system'?(preference.matches?'dark':'light'):themeChoice;
  document.documentElement.dataset.design=designChoice;
  const css=getComputedStyle(document.documentElement);
  font=css.getPropertyValue('--font-body').trim()||'sans-serif';
  colors=Object.fromEntries(Object.entries({text:'fg',muted:'muted',surface:'surface',border:'border',accent:'accent',progress:'evidence',lost:'danger',pending:'hypothesis',unknown:'unknown'}).map(([k,v])=>[k,css.getPropertyValue('--'+v).trim()||css.getPropertyValue('--accent').trim()]));
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===themeChoice)));
  document.querySelectorAll('[data-design-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.designChoice===designChoice)));
  render();
}
themeChoice=Design.readChoice('theme');
designChoice=Design.readChoice('design');
for(const b of document.querySelectorAll('[data-theme-choice]'))b.onclick=()=>{
  themeChoice=b.dataset.themeChoice;
  Design.saveChoice('theme',themeChoice);
  applyAppearance();
};
for(const b of document.querySelectorAll('[data-design-choice]'))b.onclick=()=>{
  designChoice=b.dataset.designChoice;
  Design.saveChoice('design',designChoice);
  applyAppearance();
};
preference.addEventListener('change',()=>{
  if(themeChoice==='system')applyAppearance();
});
reduced.addEventListener('change',()=>{
  pause();
  updateWalk();
});
for(const n of document.querySelectorAll('[data-i18n]'))n.textContent=Core.translate(n.dataset.i18n,data);
for(const n of document.querySelectorAll('[data-i18n-aria]'))n.setAttribute('aria-label',Core.translate(n.dataset.i18nAria,data));
$('title').textContent=data.title;
document.title=`CX Impact · ${data.title}`;
$('subtitle').textContent=data.subtitle;
$('scope').textContent=scopeText();
$('map-mode').textContent=bi('Количественная воронка · люди','Quantitative funnel · people');
document.querySelector('.actor').hidden=true;
$('disclaimer').textContent=data.disclaimer;
$('goal').textContent='';
$('comparison-switch').hidden=true;
const tabs=document.querySelector('.tabs');
tabs.replaceChildren();
for(const [key,label]of Object.entries(labels)){
  const b=document.createElement('button');
  b.className='tab';
  b.id='funnel-tab-'+key;
  b.dataset.funnelView=key;
  b.setAttribute('role','tab');
  b.textContent=label;
  b.onclick=()=>{
    pause();
    walk=null;
    $('journey-player').hidden=true;
    $('path-toggle').setAttribute('aria-expanded','false');
    view=key;
    render();
  };
  tabs.append(b);
}
tabs.setAttribute('aria-label',bi('Вид воронки','Funnel view'));
tabs.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  const buttons=[...tabs.children],i=buttons.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;
  buttons[next].click();
  buttons[next].focus();
});
const csv=document.createElement('button');
csv.className='tool';
csv.id='funnel-csv';
csv.textContent='↓ CSV';
csv.onclick=()=>download(Funnel.funnelCSV(data),'text/csv;charset=utf-8','cx-impact-funnel.csv');
$('source').after(csv);
$('questions').textContent=bi('Источники и определения','Sources and definitions');
$('questions').onclick=()=>{
  focusReturn=$('questions');
  details(data,`${scopeText()}\n${data.scope.identityRule}\n${data.scope.orderRule}\n${repeatText()}\n${limits}`);
};
$('natural').onclick=()=>{
  fitMode=false;
  zoom=1;
  size();
};
$('fit').onclick=()=>{
  fitMode=true;
  size();
};
$('plus').onclick=()=>{
  fitMode=false;
  zoom=Math.min(2,zoom+.1);
  size();
};
$('minus').onclick=()=>{
  fitMode=false;
  zoom=Math.max(.2,zoom-.1);
  size();
};
window.addEventListener('resize',()=>{
  if(fitMode)size();
});
$('path-toggle').onclick=()=>{
  const open=$('journey-player').hidden;
  $('journey-player').hidden=!open;
  $('path-toggle').setAttribute('aria-expanded',String(open));
  if(open)resetWalk();
  else{
    pause();
    walk=null;
    updateWalk();
  }
};
$('path-close').onclick=()=>{
  pause();
  walk=null;
  $('journey-player').hidden=true;
  $('path-toggle').setAttribute('aria-expanded','false');
  updateWalk();
};
$('path-prev').hidden=true;
$('path-next').onclick=()=>{
  pause();
  step();
};
$('path-reset').onclick=resetWalk;
$('path-play').onclick=play;
const repeat=document.createElement('section');
repeat.id='funnel-repeat';
repeat.className='funnel-context';
paragraph(repeat,repeatText());
$('map-panel').after(repeat);
const context=document.createElement('section');
context.id='funnel-definitions';
context.className='funnel-context';
for(const s of [data.scope.identityRule,data.scope.orderRule,limits,...(data.transitions?[data.transitions.scope.denominator,data.transitions.scope.description]:[])])paragraph(context,s);
repeat.after(context);
const style=document.createElement('style');
// Center the compact chart on wide screens; long funnels retain horizontal scrolling.
style.textContent='.funnel-context{margin:20px 0;padding:16px 24px;background:var(--surface);border:1px solid var(--border);border-radius:10px}.funnel-context p{max-width:1100px;line-height:1.6}.funnel-table{padding:20px;overflow:auto}.funnel-table table{border-collapse:collapse;min-width:1000px;width:100%;font-variant-numeric:tabular-nums}.funnel-table th,.funnel-table td{text-align:left;padding:14px 12px;border-bottom:1px solid var(--border);vertical-align:top}.funnel-table caption{text-align:left;padding:0 0 20px}.funnel-table button{white-space:normal;text-align:left}#viewport svg{display:block;flex:none}#viewport>svg[data-funnel-view=stages]{margin-inline:auto}#viewport [role=button]:focus-visible{outline:3px solid var(--focus);outline-offset:4px}#detail-text{white-space:pre-wrap}.controls{flex-wrap:wrap}.tools{flex-wrap:wrap}';
document.head.append(style);
applyAppearance();
