import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {FIXTURES} from './layout.js';
import {YARD_CARPENTRY,YARD_APPLIANCES} from './yard-layout.js';
import {kitchenMaterial,projectKitchenMaterialUVs} from './material-textures.js';

const material=(color,roughness=.72,properties={})=>new THREE.MeshStandardMaterial({color,roughness,...properties});
function mesh(parent,name,geometry,mat,x=0,y=0,z=0){
  const object=new THREE.Mesh(geometry,mat);
  object.name=name;object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;
  parent.add(object);return object;
}
function box(parent,name,w,h,d,mat,x=0,y=0,z=0,radius=0){
  const geometry=radius?new RoundedBoxGeometry(w,h,d,3,Math.min(radius,w*.45,h*.45,d*.45)):new THREE.BoxGeometry(w,h,d);
  return mesh(parent,name,geometry,mat,x,y,z);
}
function cylinder(parent,name,rt,rb,h,mat,x=0,y=0,z=0,segments=32){
  return mesh(parent,name,new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z);
}
function group(parent,name,id,x=0,y=0,z=0){
  const result=new THREE.Group();result.name=name;
  if(id)result.userData.fixtureId=id;
  result.position.set(x,y,z);parent.add(result);return result;
}
function fixtureBox(parent,id,height,y,mat){
  const f=FIXTURES.find(f=>f.id===id);
  const object=box(parent,id,f.width,height,f.depth,mat,f.x,y,f.z);
  object.userData.fixtureId=id;return object;
}

function refrigerator(parent,white,metal){
  const result=group(parent,'Existing refrigerator','yard-fridge');
  // Keep the reference body, trim, handle and all appliance positions intact.
  fixtureBox(result,'yard-fridge',1.87,.94,white);
  fixtureBox(result,'yard-fridge-trim',.035,1.1,metal);
  fixtureBox(result,'yard-fridge-handle',.45,1.45,metal);
}
function proposedRefrigerator(parent){
  const s=YARD_APPLIANCES.fridge;
  const result=group(parent,'Panasonic NR-F603GT-SS refrigerator','yard-fridge',s.x,0,s.z);
  result.userData.applianceDimensions={width:s.width,height:s.height,depth:s.depth};
  const shell=material('#454b4d',.32,{metalness:.48});
  const front=material('#939b9c',.3,{metalness:.30});
  const shadow=material('#202626',.5);
  // Front panels occupy the final 25 mm of the quoted depth; they do not
  // increase the product's 685 × 1828 × 745 mm rendered envelope.
  box(result,'Refrigerator case',s.width,s.height,s.depth-.025,shell,0,s.height/2,.0125,.006);
  const doorZ=-s.depth/2+.0125;
  const leftWidth=.245,rightWidth=s.width-leftWidth-.010;
  const split=[[-s.width/2+.003+leftWidth/2,leftWidth],[s.width/2-.003-rightWidth/2,rightWidth]];
  for(const [row,low,high] of [['Upper',.935,1.825],['Small drawer',.744,.921]]){
    for(const [index,[x,width]] of split.entries()){
      const door=box(result,`${row} refrigerator front ${index+1}`,width,high-low,.025,front,x,(low+high)/2,doorZ,.004);
      door.userData.refrigeratorFront=true;
    }
  }
  for(const [name,low,high] of [['Middle',.374,.729],['Lower',.005,.359]]){
    const door=box(result,`${name} full-width refrigerator drawer`,s.width-.006,high-low,.025,front,0,(low+high)/2,doorZ,.004);
    door.userData.refrigeratorFront=true;
  }
  for(const y of [.367,.737,.928])box(result,'Recessed refrigerator drawer grip',s.width-.034,.010,.017,shadow,0,y,-s.depth/2+.012);
  box(result,'Refrigerator control strip',.12,.012,.002,shadow,.16,.956,-s.depth/2+.001);
  return result;
}
function laundryStack(parent,white,metal,dark){
  const result=group(parent,'Original washer and dryer stack','yard-washer');
  fixtureBox(result,'yard-washer',1.72,.86,white);
  for(const y of [.44,1.27])for(const id of ['yard-washer-door','yard-washer-door-inner']){
    const f=FIXTURES.find(f=>f.id===id);
    const door=new THREE.Mesh(new THREE.CylinderGeometry(f.width/2,f.width/2,f.depth,30),id.endsWith('inner')?metal:dark);
    door.name=id;door.rotation.x=Math.PI/2;door.position.set(f.x,y,f.z);
    if(id==='yard-washer-door')door.userData.laundryDrum=true;
    result.add(door);
  }
}

function sidePanels(parent,spec,finish){
  const t=spec.panelThickness;
  for(const side of [-1,1])box(parent,side<0?'Left supporting panel':'Right supporting panel',t,spec.height,spec.depth,finish,side*(spec.width-t)/2,spec.height/2,0);
  box(parent,'Carpentry top panel',spec.width-2*t,t,spec.depth,finish,0,spec.height-t/2,0);
}
function fridgeSurround(parent,finish,upper,handles){
  const s=YARD_CARPENTRY.fridge,t=s.panelThickness;
  const result=group(parent,'Fridge surround and overhead cupboard',s.id,s.x,0,s.z);
  sidePanels(result,s,finish);
  const h=s.height-s.cupboardBottom;
  const cupboard=group(result,'Over-fridge cupboard');
  box(cupboard,'Cupboard base above ventilation gap',s.width-2*t,t,s.depth,finish,0,s.cupboardBottom+t/2,0);
  box(cupboard,'Cupboard back',s.width-2*t,h-2*t,t,finish,0,s.cupboardBottom+h/2,(s.depth-t)/2);
  const doorWidth=(s.width-2*t)/2-.004,doorHeight=h-2*t-.008;
  const front=-s.depth/2+.036;
  for(const side of [-1,1]){
    const door=box(cupboard,side<0?'Left overhead cupboard door':'Right overhead cupboard door',doorWidth,doorHeight,.020,upper,side*(s.width-2*t)/4,s.cupboardBottom+h/2,front,.003);
    door.userData.cabinetDoor=true;
    box(cupboard,'Overhead cupboard handle',.014,.12,.023,handles,side*.035,s.cupboardBottom+.11,front-.0235,.004);
  }
}

function comboWasher(parent,white,metal,dark){
  const s=YARD_CARPENTRY.combo;
  const result=group(parent,'LG FV1413H2BA washer dryer combo','yard-washer',s.x,0,s.z);
  result.userData.applianceDimensions={width:s.width,height:s.height,depth:s.depth};
  const finish=material('#353b3d',.3,{metalness:.25});
  // Reserve the forward 55 mm for the ring, glass, and controls so the whole
  // model remains inside the selected LG product envelope.
  const front=-s.depth/2+.055;
  box(result,'Single machine body',s.width,s.height,s.depth-.055,finish,0,s.height/2,.0275,.012);
  box(result,'Single machine control fascia',s.width-.022,.105,.014,finish,0,s.height-.064,front-.007,.003);
  box(result,'Detergent drawer',.16,.048,.006,dark,-.182,s.height-.065,front-.017,.003);
  box(result,'Single machine control display',.17,.040,.006,dark,.165,s.height-.065,front-.017,.004);
  box(result,'Single machine display indicator',.045,.006,.003,material('#aec1b8',.4,{emissive:'#536b60',emissiveIntensity:.35}),.14,s.height-.065,front-.022);
  const knob=cylinder(result,'Single machine programme dial',.031,.031,.019,metal,0,s.height-.064,front-.022);
  knob.rotation.x=Math.PI/2;
  const surround=cylinder(result,'Single machine drum surround',.208,.208,.033,dark,0,.405,front-.018);
  surround.rotation.x=Math.PI/2;surround.userData.laundryDrum=true;
  const rim=cylinder(result,'Single machine drum black rim',.184,.184,.018,finish,0,.405,front-.034);
  rim.rotation.x=Math.PI/2;
  const glass=cylinder(result,'Single machine drum glass',.155,.155,.020,material('#334044',.15,{metalness:.25}),0,.405,front-.044);
  glass.rotation.x=Math.PI/2;
  const inner=cylinder(result,'Single machine drum reflection',.123,.123,.002,material('#6d7776',.3,{metalness:.5}),0,.386,front-.054);
  inner.rotation.x=Math.PI/2;
  box(result,'Single machine drum handle',.018,.085,.020,finish,.177,.405,front-.044,.006);
  box(result,'Single machine plinth seam',s.width-.05,.006,.004,dark,0,.095,front-.003);
  return result;
}

function airFryer(parent,y,black,metal){
  const result=group(parent,'Air fryer placeholder',null,0,y,-.025);
  result.userData.appliance='air-fryer';
  box(result,'Air fryer housing',.40,.35,.365,black,0,.193,0,.042);
  box(result,'Air fryer top',.405,.062,.37,black,0,.40,0,.020);
  const face=material('#202527',.24);
  box(result,'Air fryer basket front',.34,.23,.020,face,0,.16,-.183,.025);
  box(result,'Air fryer basket handle',.14,.032,.048,metal,0,.238,-.213,.01);
  box(result,'Air fryer display',.15,.037,.006,material('#090f11',.14),0,.397,-.188,.004);
  box(result,'Air fryer display indicator',.035,.006,.003,material('#b4ccc6',.45),0,.397,-.192);
  for(const x of [-.10,.10])box(result,'Air fryer control button',.013,.013,.004,metal,x,.397,-.191,.005);
  for(const x of [-.14,.14])for(const z of [-.13,.13])box(result,'Air fryer foot',.035,.026,.042,black,x,.013,z,.006);
  return result;
}
function multiCooker(parent,y,black,metal){
  const result=group(parent,'Multicooker placeholder',null,-.13,y,.005);
  result.userData.appliance='multicooker';
  const body=cylinder(result,'Multicooker pot housing',.15,.137,.25,black,0,.145,0);body.scale.z=.92;
  const lid=cylinder(result,'Multicooker lid',.165,.153,.04,black,0,.29,0);lid.scale.z=.94;
  for(const side of [-1,1])box(result,'Multicooker side handle',.04,.03,.085,black,side*.17,.243,0,.013);
  box(result,'Multicooker lid handle',.10,.037,.033,black,0,.327,0,.012);
  box(result,'Multicooker controls',.145,.084,.018,metal,0,.18,-.139,.012);
  box(result,'Multicooker display',.080,.025,.004,material('#111719',.15),0,.202,-.151,.003);
  for(const x of [-.044,0,.044])box(result,'Multicooker button',.012,.01,.004,black,x,.165,-.152,.003);
  return result;
}
function blender(parent,y,black,metal){
  const result=group(parent,'Blender placeholder',null,.16,y,.01);
  result.userData.appliance='blender';
  box(result,'Blender motor base',.172,.106,.178,black,0,.053,0,.013);
  box(result,'Blender control panel',.125,.04,.008,metal,0,.052,-.090,.004);
  const jar=cylinder(result,'Transparent blender pitcher',.077,.060,.246,material('#b0c5c7',.12,{transparent:true,opacity:.44,depthWrite:false}),0,.229,0,6);
  jar.rotation.y=Math.PI/6;
  cylinder(result,'Blender blade spindle',.010,.017,.20,metal,0,.206,0,12);
  box(result,'Blender pitcher lid',.17,.028,.17,black,0,.366,0,.008);
  box(result,'Blender lid cap',.055,.018,.047,black,0,.389,0,.005);
  for(const y of [.157,.311])box(result,'Blender handle bracket',.041,.014,.025,black,.097,y,.015,.005);
  box(result,'Blender pitcher handle',.018,.17,.025,black,.111,.234,.015,.006);
  return result;
}
function applianceTower(parent,finish,white,metal,dark){
  const s=YARD_CARPENTRY.laundry,t=s.panelThickness;
  comboWasher(parent,white,metal,dark);
  const result=group(parent,'Open appliance cabinet above washer dryer',s.id,s.x,0,s.z);
  sidePanels(result,s,finish);
  box(result,'Open cabinet back',s.width-2*t,s.height-s.platformHeights[0]-t,t,finish,0,(s.height+s.platformHeights[0]-t)/2,(s.depth-t)/2);
  for(const [index,y] of s.platformHeights.entries()){
    const shelf=box(result,index===0?'Lower appliance platform':'Upper appliance platform',s.width-2*t,s.platformThickness,s.depth-.032,finish,0,y-s.platformThickness/2,-.006);
    shelf.userData.applianceShelf=true;
    // Visible runners are shown retracted. The support frame carries the
    // shelves rather than resting their weight on the washer/dryer.
    for(const side of [-1,1])box(result,'Retracted shelf runner',.012,.018,s.depth-.09,metal,side*(s.width/2-t-.009),y-.032,.008);
  }
  const black=material('#292c2c',.43);
  airFryer(result,s.platformHeights[0],black,metal);
  multiCooker(result,s.platformHeights[1],black,metal);
  blender(result,s.platformHeights[1],black,metal);
}

export function createYardAppliances(design={}){
  const result=new THREE.Group();result.name='Yard appliances and carpentry';result.userData.roomId='yard';
  const white=material('#f3f2eb',.25),metal=material('#b7bbb7',.28),dark=material('#282d2b');
  if(design.yard?.fridgeModel==='panasonic-nr-f603gt-ss'||design.yard?.fridgeSurround===true)proposedRefrigerator(result);
  else refrigerator(result,white,metal);
  const kitchen=design.kitchen??{};
  const finish=design.yard?.fridgeSurround===true||design.yard?.laundry==='combo-tower'
    ? kitchenMaterial(kitchen.lowerMaterial,'laminate',kitchen.color??'#c76530',{roughness:.52}):null;
  if(design.yard?.fridgeSurround===true){
    const upper=kitchenMaterial(kitchen.upperMaterial,'laminate',kitchen.upperColor??'#f0eee7',{roughness:.58});
    fridgeSurround(result,finish,upper,material('#a99b79',.3,{metalness:.74}));
  }
  if(design.yard?.laundry==='combo-tower')applianceTower(result,finish,white,metal,dark);
  else laundryStack(result,white,metal,dark);
  projectKitchenMaterialUVs(result);
  return result;
}
