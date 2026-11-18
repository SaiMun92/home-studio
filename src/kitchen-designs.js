import {KITCHEN_MATERIALS,getKitchenMaterial} from './kitchen-materials.js';
import {validateDesign} from './state.js';

const shortNames={'jamaica-walnut':'Walnut','cinamon-poplar':'Cinnamon','houston-ash':'Ash','bianco-dolomite':'Dolomite','calcatta-pottoro-extra':'Potoro'};
export const KITCHEN_DESIGNS=KITCHEN_MATERIALS.filter(material=>material.kind==='laminate').flatMap(laminate=>
  KITCHEN_MATERIALS.filter(material=>material.kind==='countertop').map(countertop=>Object.freeze({
    id:laminate.id+'-'+countertop.id,
    name:shortNames[laminate.id]+' & '+shortNames[countertop.id],
    laminateId:laminate.id,countertopId:countertop.id,
  }))
);

// Apply the finishes to the owner's current layout, never a stale starter home.
export function applyKitchenDesign(baseDesign,id){
  const option=KITCHEN_DESIGNS.find(design=>design.id===id);
  if(!option)throw new Error('That kitchen design was not found.');
  const design=validateDesign(baseDesign);
  const laminate=getKitchenMaterial(option.laminateId,'laminate');
  const countertop=getKitchenMaterial(option.countertopId,'countertop');
  Object.assign(design.kitchen,{lowerMaterial:laminate.id,upperMaterial:laminate.id,counterMaterial:countertop.id,
    color:laminate.color,upperColor:laminate.color,counterColor:countertop.color});
  return design;
}
