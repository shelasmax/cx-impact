import test from 'node:test';
import assert from 'node:assert/strict';
import Core from '../skills/cx-impact/assets/map-core.js';

const graph = {
  nodes: [{id:'a',title:'Request'},{id:'b',title:'Decision'},{id:'c',title:'Repair'},{id:'d',title:'Return'}],
  edges: [
    {id:'ab',from:'a',to:'b'},
    {id:'bc',from:'b',to:'c',label:'Yes · only after approval within 24 hours'},
    {id:'bd',from:'b',to:'d',label:'No · return without repair'},
    {id:'cb',from:'c',to:'b',kind:'exception',label:'Retry'}
  ]
};
test('playback starts at authored roots and exposes every full branch without selecting one',()=>{
  const before=JSON.stringify(graph);
  assert.deepEqual(Core.playbackChoices(graph,null,[]).map(c=>c.node.id),['a']);
  const choices=Core.playbackChoices(graph,'b',['a','b']);
  assert.deepEqual(choices.map(c=>c.edge.label),[graph.edges[1].label,graph.edges[2].label]);
  assert.deepEqual(choices.map(c=>c.node.id),['c','d']);
  assert.equal(JSON.stringify(graph),before);
});
test('playback reports cycles and ends without inventing a connection to another node',()=>{
  assert.equal(Core.playbackChoices(graph,'c',['a','b','c'])[0].repeated,true);
  assert.deepEqual(Core.playbackChoices(graph,'d',['a','b','d']),[]);
  assert.deepEqual(Core.playbackChoices(null,null,[]),[]);
  assert.deepEqual(Core.playbackChoices(graph,'absent',[]),[]);
});
test('multiple roots and a rootless graph require an explicit starting point',()=>{
  const multi={...graph,nodes:[...graph.nodes,{id:'extra',title:'Separate entry'}]};
  assert.deepEqual(Core.playbackChoices(multi,null,[]).map(c=>c.node.id),['a','extra']);
  const loop={nodes:graph.nodes.slice(0,2),edges:[{id:'ab',from:'a',to:'b'},{id:'ba',from:'b',to:'a'}]};
  assert.deepEqual(Core.playbackChoices(loop,null,[]).map(c=>c.node.id),['a','b']);
});
