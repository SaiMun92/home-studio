// Estimated carpentry envelopes in the home's unmirrored coordinates.
// Side panels stand independently of the appliances. Exact product sizes,
// ventilation and installation clearances still need a site/product check.
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

// Only additions: the existing refrigerator and laundry appliance collision
// reservations remain owned by layout.js for compatibility with older saves.
export function yardCarpentryFixtures(yard){
  const selected=[];
  if(yard?.fridgeSurround===true)selected.push(YARD_CARPENTRY.fridge);
  else if(yard?.fridgeModel==='panasonic-nr-f603gt-ss')selected.push({id:'yard-fridge-product',...YARD_APPLIANCES.fridge});
  if(yard?.laundry==='combo-tower')selected.push(YARD_CARPENTRY.laundry);
  return selected.map(({id,x,z,width,depth})=>({id,room:'yard',x,z,width,depth,blocksWalk:true}));
}
