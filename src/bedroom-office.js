import {canPlace,footprint,pointInRoom} from './layout.js';
import {OMNIDESK,OFFICE_CHAIR} from './office-products.js';
import {createDefaultState} from './state.js';

const inBedroom=item=>pointInRoom(item.x,item.z)?.id==='bedroom2';
const round=value=>Math.round(value*1000)/1000;
function nextId(items,prefix){let n=1;while(items.some(item=>item.id===prefix+n))n++;return prefix+n;}
function fits(item,items,design){
  return [[item.x,item.z],...footprint(item)].every(([x,z])=>pointInRoom(x,z)?.id==='bedroom2')&&canPlace(item,items,design.kitchen,design.yard).ok;
}
function piece(items,product,prefix,x,z,rotation){
  return {id:nextId(items,prefix),type:product.type,label:product.label,color:product.color,x:round(x),z:round(z),rotation,variant:'classic',mirrored:false};
}

// Remove the bed for the office, preserving the homeowner's built-in wardrobe
// and its position/finish. Explicit arrangement faces its doors into the room.
// Commit only when the complete arrangement fits.
export function applyBedroomOffice(design,{arrange=false}={}){
  const items=design.furniture.filter(item=>!inBedroom(item)||!['bed','singlebed','desk'].includes(item.type)).map(item=>({...item}));
  let restoredWardrobe=false;
  let builtIn=items.find(item=>inBedroom(item)&&item.type==='wardrobe'&&item.id==='wardrobe-2')??items.find(item=>inBedroom(item)&&item.type==='wardrobe'&&/^bedroom-wardrobe-\d+$/.test(item.id));
  if(!items.some(item=>inBedroom(item)&&item.type==='wardrobe')){
    restoredWardrobe=true;
    const wardrobe=createDefaultState().furniture.find(item=>item.id==='wardrobe-2');
    if(items.some(item=>item.id===wardrobe.id))wardrobe.id=nextId(items,'bedroom-wardrobe-');
    items.push(wardrobe);builtIn=wardrobe;
  }
  // The south-wall built-in opens into the room. Explicit arrangement also
  // corrects earlier previews with wall-facing doors, without moving the cabinet.
  if(builtIn&&arrange)builtIn.rotation=-180;
  const desks=items.filter(item=>inBedroom(item)&&item.type===OMNIDESK.type);
  const chairs=items.filter(item=>inBedroom(item)&&item.type===OFFICE_CHAIR.type);
  const refitOffice=arrange||restoredWardrobe||![...desks,...chairs].every(item=>fits(item,items,design));
  const slots=[[3.34,1.04,90],[5.02,1.68,-90]];
  for(const [x,z,rotation] of slots){
    if(desks.length>=2)break;
    const candidate=piece(items,OMNIDESK,'omnidesk-',x,z,rotation);
    // During reapplication, existing office pieces will move together. Their
    // old positions must not block creating a missing desk or chair first.
    if(refitOffice||fits(candidate,items,design)){items.push(candidate);desks.push(candidate);}
  }
  if(desks.length<2)throw new Error('Make room along both side walls of Bedroom 2 for the two desks. No furniture has been changed.');
  for(const desk of desks){
    if(chairs.length>=2)break;
    const angle=desk.rotation*Math.PI/180;
    const candidate=piece(items,OFFICE_CHAIR,'office-chair-',desk.x+Math.sin(angle)*.53+Math.cos(angle)*.16,desk.z+Math.cos(angle)*.53-Math.sin(angle)*.16,desk.rotation+180);
    if(refitOffice||fits(candidate,items,design)){items.push(candidate);chairs.push(candidate);}
  }
  if(chairs.length<2)throw new Error('Make room for a chair at each desk in Bedroom 2. No furniture has been changed.');
  if(refitOffice){
    // An earlier office preview may have occupied the wardrobe area. Refit
    // only the office pieces around the restored built-in, retaining finishes.
    for(let i=0;i<2;i++){
      const [x,z,rotation]=slots[i];Object.assign(desks[i],{x,z,rotation});
      const angle=rotation*Math.PI/180;
      Object.assign(chairs[i],{x:round(x+Math.sin(angle)*.53+Math.cos(angle)*.16),z:round(z+Math.cos(angle)*.53-Math.sin(angle)*.16),rotation:rotation+180});
    }
    if(![...desks,...chairs].every(item=>fits(item,items,design)))throw new Error('Move the office furniture clear of the walls and other pieces before applying this arrangement.');
  }
  design.furniture=items;return true;
}
