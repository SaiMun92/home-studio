import {L_SOFA} from './l-sofa-spec.js';
import {SOLANGE_CHAIR} from './living-products.js';
import {canPlace,footprintParts,pointInRoom,ROOMS} from './layout.js';

export const L_SOFA_LAYOUTS=Object.freeze({
  'balcony-chaise':Object.freeze({x:8.5,z:2.6,rotation:90,mirrored:false}),
  'balcony-row':Object.freeze({x:8.8,z:2.07,rotation:0,mirrored:true}),
});
export const L_SOFA_CHAIR_SLOTS=Object.freeze({
  'balcony-row':[{x:8.05,z:3.63,rotation:125},{x:9.22,z:4,rotation:180},{x:9.72,z:3.9,rotation:180}],
  'balcony-chaise':[{x:9.72,z:1.6,rotation:0},{x:9.22,z:4,rotation:180},{x:9.65,z:3.95,rotation:180}],
});
const living=ROOMS.find(room=>room.id==='living').bounds;
function fits(item,items,design){
  return footprintParts(item).flat().every(([x,z])=>x>=living[0]-1e-7&&x<=living[2]+1e-7&&z>=living[1]-1e-7&&z<=living[3]+1e-7)
    &&canPlace(item,items,design.kitchen,design.yard).ok;
}

// Keep the sofa ID/finish and every existing piece. Relocate only the selected
// living chairs, coffee table or plant when the new L would otherwise overlap.
export function applyLShapedSofa(design,{layout='balcony-chaise',arrange=false}={}){
  const pose=L_SOFA_LAYOUTS[layout];if(!pose)throw new Error('Choose an L-shaped sofa orientation.');
  const sofa=design.furniture.find(item=>['sofa',L_SOFA.type].includes(item.type)&&pointInRoom(item.x,item.z)?.id==='living');
  if(!sofa)return false;
  if(sofa.type===L_SOFA.type&&!arrange)return sofa.id;
  const replacement={...sofa,type:L_SOFA.type,label:L_SOFA.label,variant:'modern',...pose};
  const inLiving=item=>pointInRoom(item.x,item.z)?.id==='living';
  const chairs=design.furniture.filter(item=>item.type===SOLANGE_CHAIR.type&&inLiving(item));
  const table=design.furniture.find(item=>['coffee','veronica-coffee'].includes(item.type)&&inLiving(item));
  const plant=design.furniture.find(item=>item.type==='plant'&&inLiving(item));
  const movable=[...(table?[table]:[]),...chairs],moving=new Set([sofa.id,...movable.map(item=>item.id),...(plant?[plant.id]:[])]);
  const fixed=design.furniture.filter(item=>!moving.has(item.id));
  const chairSlots=L_SOFA_CHAIR_SLOTS[layout];
  function arrangePieces(index,placed){
    if(index===movable.length)return placed;
    const item=movable[index],slots=item===table?[{x:9.22,z:2.8}]:chairSlots;
    for(const candidate of [item,...slots.map(slot=>({...item,...slot}))]){
      if(!fits(candidate,placed,design))continue;
      const result=arrangePieces(index+1,[...placed,candidate]);if(result)return result;
    }
    return null;
  }
  const plantOptions=plant?[plant,{...plant,x:10.3,z:4.12}]:[null];
  for(const candidatePlant of plantOptions){
    const placed=[...fixed,replacement];
    if(!fits(replacement,fixed,design))continue;
    if(candidatePlant){if(!fits(candidatePlant,placed,design))continue;placed.push(candidatePlant);}
    const result=arrangePieces(0,placed);if(!result)continue;
    const byId=new Map(result.map(item=>[item.id,item]));
    design.furniture=design.furniture.map(item=>({...byId.get(item.id)}));return replacement.id;
  }
  throw new Error('There is not enough clear space for this L-shaped sofa. Move the nearby furniture, then try again.');
}
