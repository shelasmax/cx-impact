/* Shared deterministic geometry. No DOM, network or external packages. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CXMap = factory();
})(globalThis, function () {
  'use strict';
  const VERSION = '0.3.0';
  const statusLabels = {
    observed: 'Наблюдение', declared: 'Заявлено в источнике', requirement: 'Требование / намерение',
    user_fact: 'Факт из задания', code: 'Наблюдение в коде', hypothesis: 'Гипотеза',
    unknown: 'Не установлено', proposal: 'Предложение'
  };
  const modeLabels = { current:'Текущая картина · AS-IS', target:'Целевая картина · TO-BE', comparison:'Сравнение AS-IS / TO-BE', unspecified:'Режим не указан' };
  const edgeStyles = {
    flow: {label:'Последовательность / обычная ветвь', color:'#527368', dash:'', marker:'flow'},
    handoff: {label:'Передача между участниками', color:'#476e83', dash:'8 4', marker:'handoff'},
    exception: {label:'Исключение / восстановление', color:'#a36249', dash:'2 4', marker:'exception'}
  };
  const english = {
  "Наблюдение": "Observation",
  "Заявлено в источнике": "Stated in source",
  "Требование / намерение": "Requirement / intent",
  "Факт из задания": "Fact from brief",
  "Наблюдение в коде": "Code observation",
  "Гипотеза": "Hypothesis",
  "Не установлено": "Unknown",
  "Предложение": "Proposal",
  "Текущая картина · AS-IS": "Current state · AS-IS",
  "Целевая картина · TO-BE": "Target state · TO-BE",
  "Сравнение AS-IS / TO-BE": "AS-IS / TO-BE comparison",
  "Режим не указан": "State not specified",
  "Последовательность / обычная ветвь": "Sequence / normal branch",
  "Передача между участниками": "Handoff between participants",
  "Исключение / восстановление": "Exception / recovery",
  "Старая строковая аннотация. Тип основания и источник не заданы.": "Legacy text annotation. Evidence type and source are not specified.",
  "Условие не задано": "Condition not specified",
  "Не удалось проложить переход. Добавьте свободное пространство или разделите карту.": "Could not route this transition. Add space or split the map.",
  "Условие показано в нумерованном списке под картой; текст сохранён полностью.": "The full condition is shown in a numbered list below the map.",
  "Путь клиента": "Customer journey",
  "Как сервис обеспечивает этот путь": "How the service supports this journey",
  "Участники, передачи и условия продолжения": "Participants, handoffs and decision conditions",
  "Задание пользователя": "User brief",
  "Требования": "Requirements",
  "Пользовательское исследование": "User research",
  "Результат выполнения": "Runtime result",
  "Исходный код": "Source code",
  "Другой источник": "Other source",
  "Предложение автора; не согласованное правило.": "Author proposal; not an agreed rule.",
  "Гипотеза автора; подтверждение не представлено.": "Author hypothesis; no supporting evidence supplied.",
  "Источник не указан.": "No source specified.",
  "Тип источника не указан": "Source type not specified",
  "Последствие": "Consequence",
  "Связанное улучшение": "Related improvement",
  "Открытый вопрос": "Open question",
  "Канал": "Channel",
  "Результат: ": "Output: ",
  "Допущение / вопрос": "Assumption / question",
  "Влияние на сценарий: ": "Effect on the scenario: ",
  "Пустая ячейка: шаг не описан": "Empty cell: step not described",
  "Граница и дата среза не уточнены": "Scope and reference date are not specified",
  "КЛИЕНТСКИЙ ПУТЬ": "CUSTOMER JOURNEY",
  "СЛОИ СЕРВИСА": "SERVICE LAYERS",
  "УЧАСТНИКИ": "PARTICIPANTS",
  "Цель клиента": "Customer goal",
  "Ради чего этот шаг": "Purpose of this step",
  "Действие и канал": "Action & channel",
  "Что делает клиент": "What the customer does",
  "Переживание": "Experience",
  "Основание указано отдельно": "Evidence stated separately",
  "Барьер": "Barrier",
  "Препятствие или неизвестность": "Obstacle or uncertainty",
  "Улучшение": "Improvement",
  "Связанное предложение": "Related proposal",
  "Свидетельство": "Service evidence",
  "Что получает клиент": "What the customer receives",
  "Клиент": "Customer",
  "Действие": "Action",
  "Видимая работа": "Frontstage",
  "Контакт с сервисом": "Visible service interaction",
  "ЛИНИЯ ВЗАИМОДЕЙСТВИЯ": "LINE OF INTERACTION",
  "Внутренняя работа": "Backstage",
  "Скрыто от клиента": "Hidden from the customer",
  "ЛИНИЯ ВИДИМОСТИ": "LINE OF VISIBILITY",
  "Поддержка": "Support",
  "Системы и ресурсы": "Systems and resources",
  "ВНУТРЕННЕЕ ВЗАИМОДЕЙСТВИЕ": "INTERNAL INTERACTION",
  "Участники и переходы не описаны.": "Participants and transitions are not described.",
  "Нужно уточнить: кто выполняет шаг, что передаёт и кому.": "Clarify who performs each step, what they hand over and to whom.",
  "Переход": "Transition",
  "Основания и открытые вопросы": "Evidence and open questions",
  "Открыть SVG отдельно": "Open SVG separately",
  "Файл сформирован. Сохранение на диск этим просмотрщиком не подтверждено; ссылка доступна для повторного действия.": "File generated. This viewer cannot confirm it was saved to disk; use the link to try again.",
  "Срез:": "As of:",
  "этапов · 100% для чтения, «Вписать» для обзора": "stages · 100% to read, Fit for an overview",
  "Проверьте размещение:": "Check placement:",
  "Условий, вынесенных в список под картой:": "Conditions listed below the map:",
  "Наведите на подпись, чтобы выделить переход; нажмите для подробностей.": "Hover over a label to highlight its transition; click for details.",
  "Роль не равна отдельному человеку или аккаунту.": "A role is not necessarily a separate person or account.",
  "Сохранить": "Save",
  "повторно": "again",
  "АТЛАС ПОЛЬЗОВАТЕЛЬСКОГО ОПЫТА · 01": "CUSTOMER EXPERIENCE ATLAS · 01",
  "Для кого строим карту": "Who this map is for",
  "Управление картой": "Map controls",
  "Вид карты": "Map view",
  "Процесс и опыт": "Process & experience",
  "Уменьшить": "Zoom out",
  "Увеличить": "Zoom in",
  "Вписать": "Fit",
  "Основания и вопросы": "Evidence & questions",
  "↓ Исходник": "↓ Source JSON",
  "Нажмите на карточку, чтобы увидеть детали и источник": "Click a card to see details and its source",
  "Полотно карты. Прокрутка стрелками; 100 процентов для чтения, Вписать для обзора": "Map canvas. Use arrow keys to scroll; 100 percent to read, Fit for an overview",
  "Детали карты": "Map details",
  "Закрыть детали": "Close details",
  "Основание": "Evidence",
  "Светлая": "Light",
  "Тёмная": "Dark",
  "Системная": "System",
  "Тема": "Theme",
  "Дизайн": "Design",
  "Классическая": "Classic",
  "Цветовой режим": "Color mode",
  "Обзор пути": "Path walkthrough",
  "Воспроизвести": "Play",
  "Пауза": "Pause",
  "Назад": "Previous",
  "Далее": "Next",
  "Сначала": "Reset",
  "Закрыть обзор": "Close walkthrough",
  "Выберите начало": "Choose a starting point",
  "Выберите ветвь": "Choose a branch",
  "Начните обзор": "Start the walkthrough",
  "Путь завершён": "Path complete",
  "Цикл: автоматический проход завершён": "Cycle: automatic walkthrough complete",
  "Обзор этапов, не порядок внутренних операций": "Stage overview, not an internal operation sequence",
  "Переходы из карты, не фактическое выполнение": "Authored transitions, not actual execution",
  "Уменьшение движения: используйте шаги": "Reduced motion: use step controls",
  "Шаг": "Step",
  "Этап": "Stage",
  "Нет описанного пути": "No authored path",
  "Переход не проложен": "Transition could not be drawn"
};
  function translate(value, map) {
    return map?.locale === 'en' && Object.prototype.hasOwnProperty.call(english, value) ? english[value] : value;
  }
  function labelFor(claim, map) {
    const status = claim?.status || 'unknown';
    if (status === 'declared' && map.mode === 'target') return translate('Требование / намерение', map);
    return translate(statusLabels[status] || statusLabels.unknown, map);
  }
  function scenarios(data) { return data.mode === 'comparison' ? [data.current, data.target].map(map=>({...map,locale:map.locale||data.locale})) : [data]; }
  function barriersFor(map, item) {
    const refs = item?.barrierIds || [];
    const result = refs.map(id => (map.barriers || []).find(b => b.id === id)).filter(Boolean);
    if (item?.barrier) result.push(typeof item.barrier === 'string' ? {text:item.barrier,status:'unknown',detail:translate('Старая строковая аннотация. Тип основания и источник не заданы.', map)} : item.barrier);
    return result;
  }
  function cell(map, stage, key) {
    if (key === 'barrier') return barriersFor(map, stage)[0] || {text:translate('Не установлено', map),status:'unknown'};
    if (key === 'opportunity') return stage.opportunity || barriersFor(map, stage)[0]?.improvement || {text:translate('Не установлено', map),status:'unknown'};
    return stage[key] || {text:translate('Не установлено', map),status:'unknown'};
  }
  function measure(text, size=16) {
    return Array.from(String(text)).reduce((sum,c) => sum + size * (/\s/.test(c) ? .35 : /[ЖШЩЮМЫW@%]/.test(c) ? 1 : /[ilI1.,:;!|’']/ .test(c) ? .34 : .67), 0);
  }
  function wrap(text, width, size=16) {
    const lines=[]; let line='';
    for (const word of String(text).split(/\s+/)) {
      if (line && measure(line+' '+word,size)>width) {lines.push(line);line='';}
      if (measure(word,size)>width) {
        for (const c of word) {if(measure(line+c,size)>width){lines.push(line);line='';}line+=c;}
      } else line += (line?' ':'')+word;
    }
    if(line) lines.push(line);
    return lines.length?lines:[''];
  }
  function overlap(a,b,pad=0) { return a.x < b.x+b.w+pad && a.x+a.w+pad > b.x && a.y < b.y+b.h+pad && a.y+a.h+pad > b.y; }
  function hitSegment(a,b,r,pad=0) {
    const x=r.x-pad,y=r.y-pad,w=r.w+2*pad,h=r.h+2*pad;
    if(a.x===b.x) return a.x>x+.01&&a.x<x+w-.01&&Math.max(Math.min(a.y,b.y),y)<Math.min(Math.max(a.y,b.y),y+h)-.01;
    if(a.y===b.y) return a.y>y+.01&&a.y<y+h-.01&&Math.max(Math.min(a.x,b.x),x)<Math.min(Math.max(a.x,b.x),x+w)-.01;
    throw new Error('Expected an orthogonal segment');
  }
  function segments(points) { return points.slice(1).map((p,i)=>[points[i],p]); }
  function simplify(points) {
    const out=[];
    for(const p of points){const a=out.at(-2),b=out.at(-1);if(b&&p.x===b.x&&p.y===b.y)continue;if(a&&((a.x===b.x&&b.x===p.x)||(a.y===b.y&&b.y===p.y)))out.pop();out.push(p);}
    return out;
  }
  function pathD(points) {return points.map((p,i)=>i===0?`M${p.x} ${p.y}`:p.x===points[i-1].x?`V${p.y}`:`H${p.x}`).join(' ');}
  class Heap {
    constructor(){this.a=[];}
    push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].cost<=v.cost)break;a[i]=a[p];i=p;}a[i]=v;}
    pop(){const a=this.a,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].cost<a[c].cost)c++;if(a[c].cost>=last.cost)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
  }
  function ports(rect, rank, count) {
    const f=(rank+1)/(count+1),x=rect.x+22+(rect.w-44)*f,y=rect.y+20+(rect.h-40)*f,m=14;
    return [
      {p:{x,y:rect.y},q:{x,y:rect.y-m},dir:2}, {p:{x,y:rect.y+rect.h},q:{x,y:rect.y+rect.h+m},dir:2},
      {p:{x:rect.x,y},q:{x:rect.x-m,y},dir:1}, {p:{x:rect.x+rect.w,y},q:{x:rect.x+rect.w+m,y},dir:1}
    ];
  }
  function sharedLength(a,b,c,d) {
    if(a.y===b.y&&c.y===d.y&&Math.abs(a.y-c.y)<.1)return Math.max(0,Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))-Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x)));
    if(a.x===b.x&&c.x===d.x&&Math.abs(a.x-c.x)<.1)return Math.max(0,Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))-Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y)));
    return 0;
  }
  function route(source,target,rects,labels,previous,rankA,countA,rankB,countB) {
    const starts=ports(source,rankA,countA),ends=ports(target,rankB,countB);
    const obstacles=[...rects.map(r=>({...r,x:r.x-8,y:r.y-8,w:r.w+16,h:r.h+16})),...labels.map(r=>({...r,x:r.x-6,y:r.y-6,w:r.w+12,h:r.h+12}))];
    const xs=new Set(),ys=new Set();
    for(const r of obstacles){xs.add(r.x-4);xs.add(r.x+r.w+4);ys.add(r.y-4);ys.add(r.y+r.h+4);}
    for(const t of [...starts,...ends]){xs.add(t.q.x);ys.add(t.q.y);}
    xs.add(Math.min(...rects.map(r=>r.x))-38);xs.add(Math.max(...rects.map(r=>r.x+r.w))+38);
    ys.add(Math.min(...rects.map(r=>r.y))-38);ys.add(Math.max(...rects.map(r=>r.y+r.h))+38);
    const X=[...xs].sort((a,b)=>a-b),Y=[...ys].sort((a,b)=>a-b),W=X.length,points=[];
    for(let j=0;j<Y.length;j++)for(let i=0;i<X.length;i++)points.push({x:X[i],y:Y[j]});
    const index=p=>Y.indexOf(p.y)*W+X.indexOf(p.x), blocked=new Set();
    points.forEach((p,i)=>{if(obstacles.some(r=>p.x>r.x+.01&&p.x<r.x+r.w-.01&&p.y>r.y+.01&&p.y<r.y+r.h-.01))blocked.add(i);});
    const heap=new Heap(),dist=new Map(),back=new Map(),roots=new Map(),goals=new Map();
    starts.forEach((t,k)=>{if(blocked.has(index(t.q))||rects.some(r=>r.id!==source.id&&hitSegment(t.p,t.q,r,8))||labels.some(r=>hitSegment(t.p,t.q,r,6)))return;const state=index(t.q)*3+t.dir;dist.set(state,14);roots.set(state,k);heap.push({state,cost:14});});
    ends.forEach((t,k)=>{if(!blocked.has(index(t.q))&&!labels.some(r=>hitSegment(t.q,t.p,r,6)))goals.set(index(t.q),k);});
    const cache=new Map();
    while(heap.a.length){const {state,cost}=heap.pop();if(cost!==dist.get(state))continue;const idx=Math.floor(state/3),dir=state%3,a=points[idx];
      if(goals.has(idx)){let s=state,chain=[a];while(back.has(s)){s=back.get(s);chain.push(points[Math.floor(s/3)]);}chain.reverse();return simplify([starts[roots.get(s)].p,...chain,ends[goals.get(idx)].p]);}
      const col=idx%W,row=Math.floor(idx/W),neighbors=[];
      if(col)neighbors.push(idx-1);if(col<W-1)neighbors.push(idx+1);if(row)neighbors.push(idx-W);if(row<Y.length-1)neighbors.push(idx+W);
      for(const next of neighbors){if(blocked.has(next))continue;const b=points[next],key=Math.min(idx,next)+':'+Math.max(idx,next);let edgeCost=cache.get(key);
        if(edgeCost===undefined){edgeCost=obstacles.some(r=>hitSegment(a,b,r))?Infinity:Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+previous.reduce((sum,[c,d])=>sum+sharedLength(a,b,c,d)*2,0);cache.set(key,edgeCost);}
        if(!Number.isFinite(edgeCost))continue;const ndir=a.x===b.x?2:1,nstate=next*3+ndir,ncost=cost+edgeCost+(dir!==ndir?22:0);
        if(ncost<(dist.get(nstate)??Infinity)){dist.set(nstate,ncost);back.set(nstate,state);heap.push({state:nstate,cost:ncost});}
      }
    }
    return null;
  }
  function placeLabel(edge,points,rects,labels,otherSegments,minY=120) {
    if(!edge.label)return null;
    const lines=wrap(edge.label,184,12),w=Math.max(...lines.map(s=>measure(s,12)))+16,h=lines.length*17+10;
    const candidates=[];
    for(const[a,b]of segments(points)){
      const length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(length<22)continue;
      for(const f of [.5,.3,.7]){const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;
        for(const offset of [0,-(h/2+8),h/2+8,-(h+20),h+20]){
          const horizontal=a.y===b.y;
          const r={x:x-w/2+(horizontal?0:offset?Math.sign(offset)*(w/2+12):0),y:y-h/2+(horizontal?offset:0),w,h,lines};
          if(r.y<minY||r.x<194)continue;
          const nearest={x,y};
          if(rects.some(n=>overlap(r,n,7))||labels.some(l=>overlap(r,l,7))||otherSegments.some(([c,d])=>hitSegment(c,d,r,5)))continue;
          // Keep an adjacent annotation close to its own authored route.
          candidates.push({...r,anchor:nearest,score:Math.abs(offset)+(horizontal?0:15)+(length<w?25:0)});
        }
      }
    }
    return candidates.sort((a,b)=>a.score-b.score)[0]||null;
  }
  function checkGeometry(layout) {
    const errors=[],warnings=[...(layout.warnings||[])],rects=layout.nodes||[],edges=layout.edges||[];
    for(const edge of edges){if(edge.unrouted)errors.push({code:'ROUTE_UNAVAILABLE',edge:edge.id});for(const[a,b]of segments(edge.points))for(const n of rects){if(n.id!==edge.from&&n.id!==edge.to&&hitSegment(a,b,n,1))errors.push({code:'EDGE_NODE_COLLISION',edge:edge.id,node:n.id});}}
    const labels=edges.filter(e=>e.labelBox);
    labels.forEach((e,i)=>{for(const n of rects)if(overlap(e.labelBox,n,2))errors.push({code:'LABEL_NODE_COLLISION',edge:e.id,node:n.id});for(const b of labels.slice(i+1))if(overlap(e.labelBox,b.labelBox,2))errors.push({code:'LABEL_LABEL_COLLISION',edge:e.id,other:b.id});});
    return {status:errors.length?'failed':'checked',errors,warnings};
  }
  function layoutProcess(map) {
    const p=map.process;if(!p)return null;
    const left=194,colWidth=245,nodeWidth=197,top=Math.max(120,...map.stages.map(s=>wrap(s.title,203,17).length*24+66))+26;
    const heights=p.lanes.map(lane=>Math.max(106,...p.nodes.filter(n=>n.laneId===lane.id).map(n=>wrap(n.title,nodeWidth-28,16).length*22+(n.artifact?wrap(n.artifact,nodeWidth-28,12).length*17:0)+49)));
    const ys=[];let cursor=top;for(const h of heights){ys.push(cursor);cursor+=h+100;}
    const nodes=p.nodes.map(n=>{const row=p.lanes.findIndex(l=>l.id===n.laneId),col=map.stages.findIndex(s=>s.id===n.stageId);return {...n,x:left+col*colWidth+18,y:ys[row]+24,w:nodeWidth,h:heights[row],row,col};});
    const index=new Map(nodes.map(n=>[n.id,n])),edges=[],labelRects=[],oldSegments=[],warnings=[];
    const incident=new Map(nodes.map(n=>[n.id,p.edges.map((e,i)=>({e,i})).filter(({e})=>e.from===n.id||e.to===n.id).map(({i})=>i)]));
    let calloutY=cursor+40;
    p.edges.forEach((originalEdge,i)=>{
      const fromNode=index.get(originalEdge.from);
      const condition=originalEdge.label&&originalEdge.condition&&originalEdge.label!==originalEdge.condition?originalEdge.label+' · '+originalEdge.condition:originalEdge.label||originalEdge.condition;
      const edge={...originalEdge,label:condition||(fromNode.kind==='decision'?translate('Условие не задано',map):undefined)};
      const id=edge.id||`edge-${i+1}`,a=index.get(edge.from),b=index.get(edge.to),aInc=incident.get(a.id),bInc=incident.get(b.id);
      const points=route(a,b,nodes,labelRects,oldSegments,aInc.indexOf(i),aInc.length,bInc.indexOf(i),bInc.length);
      if(!points){warnings.push({code:'ROUTE_UNAVAILABLE',edge:id,message:translate('Не удалось проложить переход. Добавьте свободное пространство или разделите карту.', map)});edges.push({...edge,id,points:[],unrouted:true});return;}
      let labelBox=placeLabel(edge,points,nodes,labelRects,oldSegments,top-24);
      if(edge.label&&!labelBox){const lines=wrap(id+': '+edge.label,260,12);labelBox={x:left,y:calloutY,w:Math.max(...lines.map(s=>measure(s,12)))+16,h:lines.length*17+10,lines,callout:true};calloutY+=labelBox.h+18;warnings.push({code:'LABEL_CALLOUT',edge:id,message:translate('Условие показано в нумерованном списке под картой; текст сохранён полностью.', map)});}
      if(labelBox)labelRects.push(labelBox);
      edges.push({...edge,id,points,labelBox});oldSegments.push(...segments(points));
    });
    const width=Math.max(left+colWidth*map.stages.length+32,...labelRects.map(r=>r.x+r.w+24),...edges.flatMap(e=>e.points.map(p=>p.x+24)));
    const height=Math.max(cursor+30,...labelRects.map(r=>r.y+r.h+30),...edges.flatMap(e=>e.points.map(p=>p.y+24)));
    const result={left,colWidth,top,width,height,nodes,edges,lanes:p.lanes.map((l,i)=>({...l,y:ys[i],h:heights[i]+94})),warnings};result.geometry=checkGeometry(result);return result;
  }
  // Viewer traversal uses the authored graph; it never chooses a branch or synthesizes an edge.
  function playbackChoices(graph,currentId,visited=[]) {
    if(!graph)return [];
    if(!currentId){
      const roots=graph.nodes.filter(n=>!graph.edges.some(e=>e.to===n.id));
      return (roots.length?roots:graph.nodes).map(node=>({node,edge:null,repeated:false}));
    }
    return graph.edges.filter(e=>e.from===currentId).map(edge=>({
      node:graph.nodes.find(n=>n.id===edge.to),edge,repeated:visited.includes(edge.to)
    })).filter(choice=>choice.node);
  }
  return {VERSION,translate,statusLabels,modeLabels,edgeStyles,labelFor,scenarios,barriersFor,cell,measure,wrap,overlap,hitSegment,segments,pathD,checkGeometry,layoutProcess,playbackChoices};
});
