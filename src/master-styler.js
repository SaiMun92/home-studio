import {LG_STYLER} from './styler-product.js';
import {canPlace,footprint,pointInRoom,ROOMS,roomRegions} from './layout.js';
import {getCatalogItem} from './catalog.js';

const round=value=>Math.round(value*10000)/10000;
const masterRegions=roomRegions(ROOMS.find(room=>room.id==='master'));
const inMaster=item=>[[item.x,item.z],...footprint(item)].every(([x,z])=>masterRegions.some(([x1,z1,x2,z2])=>x>=x1-1e-7&&x<=x2+1e-7&&z>=z1-1e-7&&z<=z2+1e-7));
function uniqueId(items){let index=1;while(items.some(item=>item.id==='lg-styler-'+index))index++;return 'lg-styler-'+index;}

// Add beside a wardrobe end, never across its doors. The optional bed shift
// is confined to the reference bed position and is part of the same undo step.
export function applyMasterStyler(design,{allowBedShift=false}={}){
  const existing=design.furniture.find(item=>item.type===LG_STYLER.type&&pointInRoom(item.x,item.z)?.id==='master');
  if(existing)return existing.id;
  const wardrobe=design.furniture.find(item=>item.id==='wardrobe-1'&&item.type==='wardrobe'&&inMaster(item))
    ??design.furniture.find(item=>item.type==='wardrobe'&&inMaster(item));
  if(!wardrobe)throw new Error('Add a wardrobe in the master bedroom before placing the Styler beside it.');
  const spec=getCatalogItem(wardrobe.type),angle=wardrobe.rotation*Math.PI/180;
  const right=[Math.cos(angle),-Math.sin(angle)],front=[Math.sin(angle),Math.cos(angle)];
  const sideDistance=(wardrobe.width??spec.width)/2+LG_STYLER.width/2+.03;
  const frontDistance=(wardrobe.depth??spec.depth)/2-LG_STYLER.depth/2+.025;
  const candidates=[1,-1].map(side=>({
    id:uniqueId(design.furniture),type:LG_STYLER.type,label:LG_STYLER.label,color:LG_STYLER.color,
    x:round(wardrobe.x+right[0]*sideDistance*side+front[0]*frontDistance),
    z:round(wardrobe.z+right[1]*sideDistance*side+front[1]*frontDistance),
    rotation:wardrobe.rotation,variant:'classic',mirrored:false,
  }));
  const variants=[design.furniture.map(item=>({...item}))];
  const bed=design.furniture.find(item=>item.id==='bed-1'&&item.type==='bed');
  if(allowBedShift&&bed&&Math.abs(bed.x-1.2)<1e-6&&Math.abs(bed.z-2.3)<1e-6&&bed.rotation===-90){
    variants.push(design.furniture.map(item=>item.id===bed.id?{...item,z:2.2}:{...item}));
  }
  for(const items of variants)for(const candidate of candidates){
    if(!inMaster(candidate)||!canPlace(candidate,items,design.kitchen,design.yard).ok)continue;
    const placed=[...items,candidate];
    if(!placed.every(item=>canPlace(item,placed,design.kitchen,design.yard).ok))continue;
    design.furniture=placed;return candidate.id;
  }
  throw new Error('There is not enough space beside the master-bedroom wardrobe for the 44.5 cm Styler. Make room beside the wardrobe, then try again.');
}
