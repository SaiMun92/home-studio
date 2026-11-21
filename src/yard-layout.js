import {getDreameProduct} from './dreame-product.js';

// Estimated carpentry envelopes in the home's unmirrored coordinates.
// Side panels stand independently of the appliances. Exact product sizes,
// ventilation and installation clearances still need a site/product check.
const MATCHED_CABINET = Object.freeze({width:.74,depth:.74,height:2.64,z:8.51});
const MATCHED_DB_CENTER_X = 6.47;
// The wall return meets the DB cupboard's outer edge and the adjoining
// laundry side panel. Its depth/height match the fridge-side projection.
// Bounds are estimates before home mirroring.
export const YARD_DB_PROJECTION = Object.freeze({
  id:'yard-db-projection',left:6.08,right:MATCHED_DB_CENTER_X+MATCHED_CABINET.width/2,front:8.50,back:8.94,
});

export const YARD_APPLIANCES = Object.freeze({
  fridge:Object.freeze({model:'Panasonic NR-F603GT-SS',x:7.95,z:8.52,width:.685,height:1.828,depth:.745}),
  // Manufacturer diagram confirms W600 × H850 × D615 mm; the table's axis
  // label is transposed. FV1413H2BA is the homeowner's final 13/8 kg combo.
  laundry:Object.freeze({model:'LG FV1413H2BA',x:7.2,z:8.54,width:.600,height:.850,depth:.615}),
});

export const YARD_CARPENTRY = Object.freeze({
  fridge:Object.freeze({
    id:'yard-fridge-surround',x:7.95,z:8.51,width:.78,depth:.74,height:2.64,
    panelThickness:.018,cupboardBottom:2.04,
  }),
  laundry:Object.freeze({
    id:'yard-appliance-tower',x:7.2,z:8.52,width:.70,depth:.70,height:2.64,
    panelThickness:.018,platformThickness:.024,
    platformHeights:Object.freeze([.98,1.74]),
  }),
  combo:YARD_APPLIANCES.laundry,
});

// Match the cabinet fronts, widths and tops. The DB cupboard is shallower
// in front of its wall return; fridge/laundry dimensions stay unchanged.
const MATCHED_FRONT = MATCHED_CABINET.z-MATCHED_CABINET.depth/2;
const MATCHED_YARD_CARPENTRY = Object.freeze({
  fridge:Object.freeze({...YARD_CARPENTRY.fridge,...MATCHED_CABINET,x:7.95}),
  laundry:Object.freeze({...YARD_CARPENTRY.laundry,...MATCHED_CABINET,x:7.21}),
  tv:Object.freeze({id:'yard-tv-cabinet',...MATCHED_CABINET,x:MATCHED_DB_CENTER_X,
    depth:YARD_DB_PROJECTION.front-MATCHED_FRONT,z:(YARD_DB_PROJECTION.front+MATCHED_FRONT)/2}),
  combo:YARD_APPLIANCES.laundry,
});

// An omitted layout retains the existing dimensions in older designs. The
// optional TV specification overrides only its matched cabinet envelope.
export function yardCabinetSpecs(yard){
  return yard?.cabinetLayout==='matched'?MATCHED_YARD_CARPENTRY:YARD_CARPENTRY;
}

// Keep the existing backing wall and cabinet front fixed. The dock rests on
// the room floor; its published depth plus the estimated ramp may project.
export function yardRobotVacuum(yard){
  const product=getDreameProduct(yard?.robotVacuum);if(!product)return null;
  const matched=yard?.cabinetLayout==='matched';
  const back=YARD_DB_PROJECTION.front-product.rearGap;
  const cabinetFront=matched?MATCHED_FRONT:YARD_DB_PROJECTION.front-.6;
  return {product,x:matched?MATCHED_DB_CENTER_X:6.53,z:back-product.depth/2,
    rotation:180,back,front:back-product.depth,cabinetFront,
    projection:Math.max(0,cabinetFront-(back-product.depth)),
    rampProjection:Math.max(0,cabinetFront-(back-product.depth-product.rampDepth))};
}

// Existing refrigerator and laundry appliance collision reservations remain
// owned by layout.js. A matched TV cabinet replaces its static reservation.
export function yardCarpentryFixtures(yard){
  const specs=yardCabinetSpecs(yard);
  const selected=[];
  if(specs.tv)selected.push(specs.tv);
  if(yard?.fridgeSurround===true)selected.push(specs.fridge);
  else if(yard?.fridgeModel==='panasonic-nr-f603gt-ss')selected.push({id:'yard-fridge-product',...YARD_APPLIANCES.fridge});
  if(yard?.laundry==='combo-tower')selected.push(specs.laundry);
  const vacuum=yardRobotVacuum(yard);
  if(vacuum)selected.push({id:'yard-robot-vacuum',x:vacuum.x,z:vacuum.z-vacuum.product.rampDepth/2,
    width:vacuum.product.width,depth:vacuum.product.depth+vacuum.product.rampDepth});
  return selected.map(({id,x,z,width,depth})=>({id,room:'yard',x,z,width,depth,blocksWalk:true}));
}
