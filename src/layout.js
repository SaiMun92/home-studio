import {getCatalogItem} from './catalog.js';
import {yardCarpentryFixtures,YARD_DB_PROJECTION} from './yard-layout.js';
import {isTuckedOfficeChair} from './office-products.js';
import {L_SOFA,lSofaFootprintRects} from './l-sofa-spec.js';

export const PLAN = {width:10.8,depth:9.05,height:2.7,scale:.018,area:93,estimated:true};
// Estimated from inner-kitchen.jpeg: the working run ends at the forward
// face of a tiled rear-wall projection, beside the fridge.
export const KITCHEN_RUN = {start:4.6,end:8.5,back:8.96};
export const KITCHEN_RUN_LENGTH = KITCHEN_RUN.end-KITCHEN_RUN.start;
// Entrance photo/video show the living-facing counter extending beyond this
// fixed wall endpoint. The estimated architecture does not follow cabinet edits.
export const KITCHEN_PARTITION_START = 5.2;
export function kitchenRun(kitchen){
  const moduleLength=kitchen.modules.reduce((sum,module)=>sum+module.width,0);
  // Extend the outer base cabinet to the grey/white floor seam without
  // shifting the saved module positions, appliances, or upper-cabinet edge.
  const start=ROOMS.find(room=>room.id==='kitchen').bounds[1];
  const frontExtensionLength=KITCHEN_RUN.start-start;
  const length=KITCHEN_RUN.end-start;
  // Photos show uppers ending at the dishwasher, before the living-facing
  // extension. Keep that first bay open if its appliance is replaced.
  const dishwasherIndex=kitchen.modules.findIndex(module=>module.type==='dishwasher');
  const openBays=dishwasherIndex<0?Math.min(1,kitchen.modules.length):dishwasherIndex;
  const upperStart=Math.max(KITCHEN_PARTITION_START,KITCHEN_RUN.start+kitchen.modules.slice(0,openBays).reduce((sum,module)=>sum+module.width,0));
  const upperLength=Math.max(0,KITCHEN_RUN.end-upperStart);
  return {...KITCHEN_RUN,start,length,frontExtensionLength,moduleLength,fillLength:Math.max(0,KITCHEN_RUN_LENGTH-moduleLength),upperStart,upperLength,
    x:KITCHEN_RUN.back-kitchen.depth/2,z:(start+KITCHEN_RUN.end)/2,width:kitchen.depth,depth:length};
}
const room = (id,name,bounds,floor,reference,walkable=true) => ({id,name,bounds,floor,reference,walkable});
export const ROOMS = [
  room('living','Living',[7.35,1.12,10.65,4.5],'tile','living.jpg'),
  room('dining','Dining',[5.5,1.12,7.35,4.5],'tile','living-2.jpg'),
  {...room('master','Master bedroom',[.15,.15,2.78,5.15],'wood',null),regions:[[.15,.15,2.78,3.48],[.15,3.48,2.09,5.15]]},
  room('bedroom2','Bedroom 2',[2.93,.15,5.43,3.48],'wood',null),
  room('study','Study',[2.23,4.58,3.83,6.99],'wood','study.jpg'),
  room('kitchen','Kitchen',[7.5,4.5,8.95,7.13],'dark','current-kitchen.jpg'),
  room('bath2','Bath 2',[3.97,4.58,5.43,6.99],'bath',null),
  room('masterbath','Master bath',[.15,5.29,2.09,8.27],'bath',null),
  room('shelter','Household shelter',[5.57,4.58,7.35,6.99],'tile',null),
  room('yard','Yard',[6.1,7.13,8.95,8.93],'dark','inner-kitchen.jpeg'),
  {...room('entry','Entrance',[9.1,4.5,10.65,8.93],'dark','entrace.jpg'),
    regions:[[9.1,4.5,10.65,8.93],[8.95,4.5,9.1,KITCHEN_PARTITION_START]]},
  room('hall','Hallway',[2.16,3.48,5.5,4.58],'tile',null),
  room('planter','Planter',[5.58,.12,10.65,1.02],'outdoor',null,false),
  room('ac','AC ledge',[3.65,7.14,6.0,8.14],'outdoor',null,false)
];
export const roomRegions=room=>room.regions??[room.bounds];
const containsRoomPoint=(room,x,z,padding=0)=>roomRegions(room).some(([x1,z1,x2,z2])=>x>=x1-padding&&x<=x2+padding&&z>=z1-padding&&z<=z2+padding);
const fixture=(id,room,x,z,width,depth,blocksWalk=true)=>({id,room,x,z,width,depth,blocksWalk});
// Dimensions are estimates from the entrance video and inner-kitchen photo.
// Width/depth describe the world-space footprint before mirroring the home.
export const FLOOR_SURFACE_Y=.0225;
export const BUILT_IN_CABINETS=[
  {id:'entry-cabinet',label:'Entrance shoe cabinet',room:'entry',x:9.3,z:7.16,width:.4,depth:2.4,height:1.06,rotation:90,color:'#aa906c',style:'slatted'},
  {id:'yard-tv-cabinet',label:'Yard DB-box cabinet',room:'yard',x:6.53,z:YARD_DB_PROJECTION.front-.6/2,width:.6,depth:.6,height:2.65,rotation:180,color:'#c76530',style:'flat'}
];
// The homeowner requested half-height ledges in both bedrooms and the study.
// Lengths follow the main window openings; depths/positions remain estimates.
const windowLedge=(id,room,label,x,z,width)=>Object.freeze({id,room,label,x,z,width,depth:.30,height:.375,color:'#f1f0e9'});
export const WINDOW_LEDGES=Object.freeze([
  windowLedge('bedroom2-window-ledge','bedroom2','Bedroom 2 window ledge',4.15,.28,2.30),
  windowLedge('master-window-ledge','master','Master bedroom window ledge',1.42,.28,2.40),
  // The rear 20 mm sits in the window recess, clearing the study desk in place.
  windowLedge('study-window-ledge','study','Study window ledge',2.91,6.85,1.10),
]);
export const BEDROOM_WINDOW_LEDGE=WINDOW_LEDGES[0];
// Footprints match addFixtures in scene.js, including projecting appliance trim.
// The low shower trays exclude furniture but can be stepped onto during a tour.
export const FIXTURES=[
  ...WINDOW_LEDGES.map(l=>fixture(l.id,l.room,l.x,l.z,l.width,l.depth)),
  ...BUILT_IN_CABINETS.map(c=>fixture(c.id,c.room,c.x,c.z,c.width,c.depth)),
  ...ROOMS.filter(r=>r.floor==='bath').flatMap(r=>{
    const [x1,z1,x2,z2]=r.bounds;
    return [
      fixture(`${r.id}-vanity`,r.id,x1+.4,z1+.27,.59,.46),
      fixture(`${r.id}-toilet-tank`,r.id,x1+.45,z1+.83,.43,.18),
      fixture(`${r.id}-toilet-bowl`,r.id,x1+.45,z1+1.12,.42,.42*1.35),
      fixture(`${r.id}-shower`,r.id,(x1+x2)/2,z2-.48,Math.min(x2-x1-.12,1.05),.85,false),
    ];
  }),
  fixture('yard-fridge','yard',7.95,8.52,.69,.72),
  fixture('yard-fridge-trim','yard',7.95,8.52,.71,.74),
  fixture('yard-fridge-handle','yard',7.73,8.14,.07,.04),
  fixture('yard-washer','yard',7.2,8.54,.65,.63),
  fixture('yard-washer-door','yard',7.2,8.21,.44,.05),
  fixture('yard-washer-door-inner','yard',7.2,8.19,.32,.056),
];
const wall=(id,a,b,room,other,openings=[],thickness=.12)=>({id,a,b,room,other,openings,thickness});
export const WALLS = [
  // Homeowner-confirmed solid master-bedroom side wall. Keep the separate
  // master-bath opening farther along this same exterior wall.
  wall('west',[.05,0],[.05,8.38],'master',null,[{offset:6.4,width:1.3,sill:1.4,height:.85}],.18),
  wall('north-master',[0,.04],[2.85,.04],'master',null,[{offset:.22,width:2.4,sill:.78,height:1.65}],.18),
  wall('north-bed',[2.85,.04],[5.5,.04],'bedroom2',null,[{offset:.15,width:2.3,sill:.78,height:1.65}],.18),
  wall('north-planter',[5.5,.04],[10.76,.04],'planter',null,[],.16),
  // The TV backs onto a blank wall; living glazing is on the planter side.
  wall('east',[10.74,0],[10.74,9.02],'living',null,[],.18),
  wall('south-entry',[9.02,9.02],[10.8,9.02],'entry',null,[{offset:.53,width:.96,sill:0,height:2.15}],.16),
  wall('south-yard',[6.0,9.02],[9.02,9.02],'yard',null,[],.16),
  wall('yard-west',[6.0,8.14],[6.0,9.02],'yard',null,[],.16),
  wall('ledge-south',[3.55,8.14],[6.0,8.14],'ac',null,[],.12),
  wall('ledge-west',[3.55,7.06],[3.55,8.14],'study',null,[],.12),
  wall('masterbath-south',[.0,8.38],[2.16,8.38],'masterbath',null,[],.16),
  wall('masterbath-east',[2.16,5.22],[2.16,8.38],'masterbath','study',[],.12),
  wall('bed-divider',[2.85,0],[2.85,3.55],'master','bedroom2'),
  wall('bed2-east',[5.5,0],[5.5,3.55],'bedroom2','dining'),
  wall('bed2-south',[2.85,3.55],[5.5,3.55],'bedroom2','hall',[{offset:1.68,width:.88,sill:0,height:2.15}]),
  wall('master-east',[2.16,4.5],[2.16,5.22],'master','study'),
  wall('masterbath-north',[0,5.22],[2.16,5.22],'masterbath','master',[{offset:1.17,width:.8,sill:0,height:2.1}]),
  wall('study-north',[2.16,4.5],[3.9,4.5],'study','hall',[{offset:.84,width:.83,sill:0,height:2.1}]),
  wall('study-bath',[3.9,4.5],[3.9,7.06],'study','bath2'),
  wall('bath2-north',[3.9,4.5],[5.5,4.5],'bath2','hall',[{offset:1.04,width:.5,sill:0,height:2.1}]),
  wall('bath2-shelter',[5.5,4.5],[5.5,7.06],'bath2','shelter',[],.18),
  wall('shelter-north',[5.5,4.5],[7.43,4.5],'shelter','dining',[{offset:.37,width:.92,sill:0,height:2.1}],.18),
  wall('shelter-kitchen',[7.43,4.5],[7.43,7.06],'shelter','kitchen',[],.18),
  wall('south-inner',[2.16,7.06],[7.43,7.06],'study','yard',[{offset:.2,width:1.1,sill:1.1,height:1.2},{offset:1.95,width:1.05,sill:1.2,height:1.0}],.16),
  // Open behind the living-facing extension; solid beside the front door.
  wall('kitchen-entry',[9.02,KITCHEN_PARTITION_START],[9.02,9.02],'kitchen','entry'),
  // Keep both structural returns visible beside the tall yard cabinetry in
  // dollhouse view, including the newly confirmed wall behind the DB box.
  {...wall(YARD_DB_PROJECTION.id,[YARD_DB_PROJECTION.left,(YARD_DB_PROJECTION.front+YARD_DB_PROJECTION.back)/2],[YARD_DB_PROJECTION.right,(YARD_DB_PROJECTION.front+YARD_DB_PROJECTION.back)/2],'yard','yard',[],YARD_DB_PROJECTION.back-YARD_DB_PROJECTION.front),finish:'wall-tile',fullHeight:true},
  {...wall('kitchen-end-projection',[8.35,8.72],[KITCHEN_RUN.back,8.72],'yard','yard',[],.44),finish:'wall-tile',fullHeight:true},
  wall('yard-entry',[9.02,8.44],[9.5,8.44],'yard','entry'),
  wall('living-glass',[5.5,1.08],[10.7,1.08],'living','planter',[{offset:.12,width:4.96,sill:.08,height:2.35}],.1)
];

export function wallSegments(wall,height=PLAN.height){
  const dx=wall.b[0]-wall.a[0], dz=wall.b[1]-wall.a[1], length=Math.hypot(dx,dz);
  const result=[]; const t=wall.thickness??.12;
  const add=(start,end,bottom,top)=>{
    top=Math.min(height,top); if(end-start<.001||top-bottom<.001)return;
    const center=(start+end)/2;
    result.push({x:wall.a[0]+dx/length*center,z:wall.a[1]+dz/length*center,y:(bottom+top)/2,width:Math.abs(dx)>.01?end-start:t,depth:Math.abs(dz)>.01?end-start:t,height:top-bottom,wallId:wall.id,room:wall.room,other:wall.other});
  };
  let previous=0;
  for(const op of [...(wall.openings??[])].sort((a,b)=>a.offset-b.offset)){
    const start=Math.max(previous,op.offset),end=Math.min(length,op.offset+op.width);
    add(previous,start,0,height); add(start,end,0,op.sill);add(start,end,op.sill+op.height,height);previous=end;
  }
  add(previous,length,0,height);return result;
}
export function pointInRoom(x,z){return ROOMS.find(r=>containsRoomPoint(r,x,z));}
export function splitWallByRooms(segment){
  const horizontal=segment.width>segment.depth,axis=horizontal?'x':'z',size=horizontal?'width':'depth';
  const start=segment[axis]-segment[size]/2,end=segment[axis]+segment[size]/2;
  const boundaries=[start,end,...ROOMS.flatMap(r=>roomRegions(r).flatMap(bounds=>horizontal?[bounds[0],bounds[2]]:[bounds[1],bounds[3]]))].filter(n=>n>=start&&n<=end);
  const points=[...new Set(boundaries)].sort((a,b)=>a-b);
  return points.slice(1).flatMap((point,index)=>point-points[index]>.001?[{...segment,[axis]:(point+points[index])/2,[size]:point-points[index],horizontal}]:[]);
}
export function wallSurfaceRooms(s){
  // BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
  const roomAt=(x,z)=>pointInRoom(x,z)?.id??null;
  const east=roomAt(s.x+s.width/2+.09,s.z),west=roomAt(s.x-s.width/2-.09,s.z);
  const south=roomAt(s.x,s.z+s.depth/2+.09),north=roomAt(s.x,s.z-s.depth/2-.09);
  if(s.horizontal??s.width>s.depth)return [south??north,south??north,null,null,south,north];
  return [east,west,null,null,east??west,east??west];
}
export function footprint(item){
  const entry=getCatalogItem(item.type);if(!entry)return [];
  const w=(item.width??entry.width)/2,d=(item.depth??entry.depth)/2,a=(item.rotation??0)*Math.PI/180;
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>[item.x+x*Math.cos(a)+z*Math.sin(a),item.z-x*Math.sin(a)+z*Math.cos(a)]);
}
export function footprintParts(item){
  if(item.type!==L_SOFA.type){const points=footprint(item);return points.length?[points]:[];}
  const a=(item.rotation??0)*Math.PI/180,mirror=item.mirrored?-1:1;
  return lSofaFootprintRects(item.width??L_SOFA.width,item.depth??L_SOFA.depth).map(part=>
    [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>{
      const x=(part.x+sx*part.width/2)*mirror,z=part.z+sz*part.depth/2;
      return [item.x+x*Math.cos(a)+z*Math.sin(a),item.z-x*Math.sin(a)+z*Math.cos(a)];
    }));
}
export function overlap(a,b,padding=.01){
  for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
    const q=polygon[i],r=polygon[(i+1)%polygon.length],axis=[-(r[1]-q[1]),r[0]-q[0]];
    const proj=p=>p.map(v=>v[0]*axis[0]+v[1]*axis[1]);const pa=proj(a),pb=proj(b);
    if(Math.max(...pa)<=Math.min(...pb)+padding||Math.max(...pb)<=Math.min(...pa)+padding)return false;
  }return true;
}
const rect=(x,z,w,d)=>[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
const physicalWalls=WALLS.flatMap(w=>wallSegments(w)).filter(s=>s.y-s.height/2<.1);
function fixedFixtures(yard){
  const carpentry=yardCarpentryFixtures(yard);
  const replacements=new Set(carpentry.map(fixture=>fixture.id));
  return [...FIXTURES.filter(fixture=>!replacements.has(fixture.id)),...carpentry];
}
export function canPlace(item,others=[],kitchen=null,yard=null){
  const parts=footprintParts(item);if(!parts.length)return {ok:false,reason:'Choose a furniture type.'};
  const samples=parts.flatMap(corners=>[...corners,...corners.map((p,i)=>[(p[0]+corners[(i+1)%4][0])/2,(p[1]+corners[(i+1)%4][1])/2]),[corners.reduce((n,p)=>n+p[0],0)/4,corners.reduce((n,p)=>n+p[1],0)/4]]);
  if(samples.some(([x,z])=>!ROOMS.some(r=>r.walkable&&containsRoomPoint(r,x,z,.08))))return {ok:false,reason:'Keep the furniture inside a room.'};
  if(physicalWalls.some(s=>parts.some(corners=>overlap(corners,rect(s.x,s.z,s.width+.03,s.depth+.03)))))return {ok:false,reason:'That position intersects a wall.'};
  if(fixedFixtures(yard).some(f=>parts.some(corners=>overlap(corners,rect(f.x,f.z,f.width,f.depth),0))))return {ok:false,reason:'That position overlaps a fixed fixture.'};
  if(others.some(other=>other.id!==item.id&&!isTuckedOfficeChair(item,other)&&parts.some(corners=>footprintParts(other).some(otherCorners=>overlap(corners,otherCorners)))))return {ok:false,reason:'That position overlaps another piece of furniture.'};
  if(kitchen){const run=kitchenRun(kitchen);if(parts.some(corners=>overlap(corners,rect(run.x,run.z,run.width,run.depth))))return {ok:false,reason:'Leave the kitchen cabinets clear.'};}
  return {ok:true};
}
export function canWalk(x,z,radius=.18,design={}){
  if(!ROOMS.some(r=>r.walkable&&containsRoomPoint(r,x,z,.12)))return false;
  const blocks=s=>x>s.x-s.width/2-radius&&x<s.x+s.width/2+radius&&z>s.z-s.depth/2-radius&&z<s.z+s.depth/2+radius;
  if(physicalWalls.some(blocks)||fixedFixtures(design.yard).some(f=>f.blocksWalk&&blocks(f)))return false;
  const body=rect(x,z,radius*2,radius*2);
  if(design.furniture?.some(item=>footprintParts(item).some(corners=>overlap(body,corners,0))))return false;
  if(design.kitchen){
    const run=kitchenRun(design.kitchen);
    if(overlap(body,rect(run.x,run.z,run.width,run.depth),0))return false;
  }
  return true;
}
