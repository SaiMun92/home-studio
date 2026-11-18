import {canPlace,footprint,pointInRoom} from './layout.js';
import {SOLANGE_CHAIR,VERONICA_COFFEE,useLivingProduct} from './living-products.js';

const round=value=>Math.round(value*1000)/1000;
function chairId(items){let index=1;while(items.some(item=>item.id==='solange-'+index))index++;return 'solange-'+index;}
function fits(item,items,design){
  return [ [item.x,item.z],...footprint(item) ].every(([x,z])=>pointInRoom(x,z)?.id==='living')&&canPlace(item,items,design.kitchen,design.yard).ok;
}

// Apply the user's table and two-chair arrangement atomically. Existing
// selected products retain their edits; all other furniture is left alone.
export function applyLivingSeating(design){
  const items=design.furniture.map(item=>({...item}));
  const table=items.find(item=>item.type===VERONICA_COFFEE.type)??items.find(item=>item.id==='coffee-1'&&item.type==='coffee')??items.find(item=>item.type==='coffee');
  if(!table)return false;
  const replacing=table.type!==VERONICA_COFFEE.type;
  if(replacing)Object.assign(table,useLivingProduct(table,VERONICA_COFFEE.type));
  const chairs=items.filter(item=>item.type===SOLANGE_CHAIR.type&&pointInRoom(item.x,item.z)?.id==='living');
  if(chairs.length>=2){
    if(!canPlace(table,items,design.kitchen,design.yard).ok)throw new Error('Make room around the coffee table before applying the living seating.');
    design.furniture=items;return true;
  }
  // Favor a little more room beside the sofa when replacing the old narrow
  // table. Search only nearby positions; never move the sofa or TV console.
  const origin={x:table.x,z:table.z};
  const offsets=replacing?[[.22,0],[0,0],[.12,0],[.32,0],[0,.15],[0,-.15]]:[[0,0]];
  for(const [dx,dz] of offsets){
    const candidate={...table,x:round(origin.x+dx),z:round(origin.z+dz)};
    const placed=items.map(item=>item.id===table.id?candidate:item);
    if(!fits(candidate,placed,design))continue;
    let missing=2-chairs.length;
    // Opposite ends face the table. Alternative offsets allow an owner's
    // nearby furniture edits while retaining the same conversation layout.
    const slots=[[-1.2,0],[1.2,180],[-1.1,0],[1.1,180],[-1.3,0],[1.3,180]];
    for(const [offset,rotation] of slots){
      if(!missing)break;
      const chair={id:chairId(placed),type:SOLANGE_CHAIR.type,label:SOLANGE_CHAIR.label,color:SOLANGE_CHAIR.color,
        x:candidate.x,z:round(candidate.z+offset),rotation,variant:'classic',mirrored:false};
      if(!fits(chair,placed,design))continue;
      placed.push(chair);missing--;
    }
    if(!missing){design.furniture=placed;return true;}
  }
  throw new Error('There is not enough clear space for both Solange chairs here. Move the coffee table or nearby furniture, then apply the living seating again.');
}
