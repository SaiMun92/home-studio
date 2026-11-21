import {validateDesign} from './state.js';
import {getKitchenMaterial} from './kitchen-materials.js';
import {useVincentDining} from './dining-products.js';
import {applyLivingSeating} from './living-design.js';
import {applyLShapedSofa} from './l-sofa-layout.js';
import {applyBedroomOffice} from './bedroom-office.js';
import {applyMasterStyler} from './master-styler.js';
import {pointInRoom} from './layout.js';

export const DESIGNER_KITCHEN = Object.freeze({
  id:'cinnamon-ivory',
  name:'Designer inspiration',
  summary:'Coordinated cabinetry, a grey L-shaped sofa with its chaise at the balcony end, selected dining and living furniture, a two-person office, and the LG Styler beside the master-bedroom wardrobe.',
  laminateId:'cinamon-poplar',
  countertopId:'calcatta-pottoro-extra',
  yard:Object.freeze({fridgeSurround:true,laundry:'combo-tower',fridgeModel:'panasonic-nr-f603gt-ss',laundryModel:'lg-fv1413h2ba',cabinetLayout:'matched',cabinetMaterial:'cinamon-poplar',robotVacuum:'dreame-x60-ultra'}),
  // From the open living end toward the yard. The existing model adds its
  // 100 mm floor-edge extension and 400 mm fitted rear cabinet. The
  // 700 mm sink bay sits beside the dishwasher; 400 mm prep drawers give
  // about 500 mm between the unchanged sink rim and the stationary hob.
  modules:Object.freeze([
    {id:'designer-drinks',type:'drawers',width:.6,storage:'drinks'},
    {id:'designer-dishwasher',type:'dishwasher',width:.6},
    {id:'designer-sink',type:'sink',width:.7,storage:'waste'},
    {id:'designer-prep',type:'drawers',width:.4,storage:'prep'},
    {id:'designer-hob',type:'hob',width:.6},
    {id:'designer-appliances',type:'doors',width:.6,storage:'appliances'},
  ].map(module=>Object.freeze(module))),
});

// Apply the proposed kitchen to the current home, retaining the owner's
// room edits and worktop height/depth. The requested Vincent set replaces
// the existing dining set in place; the selected coffee table and lounge
// chairs and the balcony-end chaise sofa are applied together. Other furniture stays as edited. Cabinet internals
// remain storage notes; the new yard appliance shelves are open in 3D.
export function applyDesignerKitchen(baseDesign){
  const design=validateDesign(baseDesign);
  const laminate=getKitchenMaterial(DESIGNER_KITCHEN.laminateId,'laminate');
  const countertop=getKitchenMaterial(DESIGNER_KITCHEN.countertopId,'countertop');
  Object.assign(design.kitchen,{
    modules:DESIGNER_KITCHEN.modules.map(module=>({...module})),
    lowerMaterial:laminate.id,color:laminate.color,
    counterMaterial:countertop.id,counterColor:countertop.color,
    upperColor:'#f2f0e8',backsplashColor:'#e8e2d5',
    upper:true,style:'flat',taskLighting:true,endUpperDoors:'short-open',frontUpperShelves:true,directionalFan:true,
  });
  delete design.kitchen.upperMaterial;
  design.yard={...DESIGNER_KITCHEN.yard};
  design.yardCabinetColor=laminate.color;
  const dining=design.furniture.find(item=>item.id==='dining-1'&&item.type==='dining')??design.furniture.find(item=>item.type==='dining');
  if(dining)Object.assign(dining,useVincentDining(dining));
  applyLivingSeating(design);
  applyLShapedSofa(design);
  applyBedroomOffice(design,{arrange:true});
  if(design.furniture.some(item=>item.type==='wardrobe'&&pointInRoom(item.x,item.z)?.id==='master'))applyMasterStyler(design,{allowBedShift:true});
  design.title=DESIGNER_KITCHEN.name;
  return validateDesign(design);
}
