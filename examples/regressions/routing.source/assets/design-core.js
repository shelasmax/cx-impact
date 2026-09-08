/* Shared appearance for CX Impact's standalone viewers. MIT; see package LICENSE. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CXDesign=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const choices={design:['classic','graphite','workshop','signal'],theme:['system','light','dark']};
  function readChoice(kind,storage){
    try {
      const value=(storage||globalThis.localStorage).getItem('cx-impact-'+kind);
      if(choices[kind].includes(value))return value;
    } catch {}
    return choices[kind][0];
  }
  function saveChoice(kind,value,storage){
    if(!choices[kind]?.includes(value))return false;
    try {
      (storage||globalThis.localStorage).setItem('cx-impact-'+kind,value);
    } catch {}
    return true;
  }
  // Permanent inset accents are only for grouping containers, never quantitative shapes.
  function outlinePoints({x,y,width,height},index=0){
    const wobble=(index%5)*.17,inset=2.5;
    return [[x+inset,y+inset+wobble],[x+width*.47,y+inset+.6-wobble],
      [x+width-inset,y+inset],[x+width-inset-.6,y+height*.53],
      [x+width-inset,y+height-inset-wobble],[x+width*.51,y+height-inset-.7],
      [x+inset+wobble,y+height-inset],[x+inset,y+height*.48]];
  }
  function element(parent,tag,attrs){
    const node=parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const[key,value]of Object.entries(attrs))node.setAttribute(key,String(value));
    parent.append(node);
    return node;
  }
  function apply(svg,design,css){
    if(!svg)return;
    const token=(name,fallback)=>css.getPropertyValue('--'+name).trim()||fallback;
    const accent=token('accent','#24695a'),border=token('border','#dce5d8');
    const display=token('font-display','Georgia, serif'),mono=token('font-mono','monospace');
    svg.setAttribute('data-design',design);
    svg.setAttribute('data-theme',svg.ownerDocument.documentElement.dataset.theme);
    // Explicit attributes survive both export pipelines, which strip transient CSS.
    for(const text of svg.querySelectorAll('[data-design-display]'))text.setAttribute('font-family',display);
    if(design==='classic')return;
    for(const [index,frame]of [...svg.querySelectorAll('[data-design-group]')].entries()){
      const b=Object.fromEntries(['x','y','width','height'].map(key=>[key,Number(frame.getAttribute(key))]));
      const role=frame.getAttribute('data-design-group');
      frame.setAttribute('rx',design==='workshop'?3:0);
      const decor=element(frame.parentNode,'g',{'data-design-decoration':design,'pointer-events':'none','aria-hidden':'true'});
      frame.after(decor);
      if(design==='workshop'){
        frame.setAttribute('fill',token(index%2?'group-alternate':'group-surface','#edf0e7'));
        frame.setAttribute('stroke','none');
        element(decor,'polygon',{points:outlinePoints(b,index).map(p=>p.join(',')).join(' '),fill:'none',stroke:token('group-outline',border),'stroke-width':1});
      } else if(design==='signal'){
        frame.setAttribute('fill',token('group-surface','#edf3f6'));
        frame.setAttribute('stroke',border);
        element(decor,'path',{d:`M${b.x+1} ${b.y+1} h${Math.min(28,b.width-2)} M${b.x+1} ${b.y+1} v${Math.min(15,b.height-2)}`,fill:'none',stroke:accent,'stroke-width':2});
      } else {
        frame.setAttribute('stroke','none');
        element(decor,'path',{d:role==='lane'?`M${b.x+2} ${b.y+8} v${b.height-16}`:`M${b.x+2} ${b.y+b.height-2} h${b.width-4}`,fill:'none',stroke:role==='lane'?border:accent,'stroke-width':role==='lane'?1:2});
      }
    }
    for(const node of svg.querySelectorAll('[data-design-index]')){
      node.setAttribute('font-family',design==='signal'?mono:display);
      if(design==='signal'){
        node.setAttribute('font-size',13);
        node.setAttribute('font-weight',700);
      }
      if(design==='workshop')node.setAttribute('font-style','italic');
    }
    if(design==='signal'){
      for(const card of svg.querySelectorAll('[data-card="cell"]>rect:first-child,[data-card="node"]>rect:first-child'))card.setAttribute('rx',0);
      for(const path of svg.querySelectorAll('[data-edge]')){
        path.setAttribute('stroke-width',path.dataset.kind==='flow'?3:2);
        path.setAttribute('data-static-stroke-width',path.getAttribute('stroke-width'));
      }
      for(const node of svg.querySelectorAll('[data-card="node"]')){
        const box=node.querySelector('rect');
        const x=+box.getAttribute('x'),y=+box.getAttribute('y');
        const w=+box.getAttribute('width'),h=+box.getAttribute('height');
        const ports=element(node,'g',{'data-design-decoration':'signal','pointer-events':'none','aria-hidden':'true'});
        for(const px of [x+2,x+w-5])element(ports,'rect',{x:px,y:y+h/2-2,width:3,height:4,fill:accent});
      }
    }
    for(const text of svg.querySelectorAll('text'))text.setAttribute('font-variant-numeric','tabular-nums');
  }
  return {choices,readChoice,saveChoice,outlinePoints,apply};
});
