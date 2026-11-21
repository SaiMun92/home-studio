import * as THREE from 'three';

// Proportions estimated from the homeowner's directional-fan photograph.
// These are visualization dimensions, not a selected product or installation
// clearance. Overall drop changes slightly with the head's aiming angle.
export const KITCHEN_FAN = Object.freeze({
  bladeDiameter:.30,
  nominalDrop:.45,
  pivotDrop:.33,
  canopyDiameter:.14,
  estimated:true,
});

function mesh(parent,name,geometry,material,x=0,y=0,z=0){
  const result=new THREE.Mesh(geometry,material);
  result.name=name;result.position.set(x,y,z);
  result.castShadow=true;result.receiveShadow=true;
  parent.add(result);return result;
}

function cylinder(parent,name,radius,height,material,x=0,y=0,z=0,segments=64){
  return mesh(parent,name,new THREE.CylinderGeometry(radius,radius,height,segments),material,x,y,z);
}

function ring(parent,name,radius,thickness,material,x=0,y=0,z=0){
  return mesh(parent,name,new THREE.TorusGeometry(radius,thickness,8,64),material,x,y,z);
}

function brushedTexture(){
  const width=64,height=128,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const row=Math.sin(y*71.71)*43758.5453;
    const fine=Math.sin(x*12.9898+y*78.233)*43758.5453;
    const value=Math.round(218+20*(row-Math.floor(row))+6*(fine-Math.floor(fine)));
    const i=(y*width+x)*4;
    pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
  }
  // Each rendered fan owns this map; scene disposal cannot invalidate another.
  const map=new THREE.DataTexture(pixels,width,height,THREE.RGBAFormat);
  map.name='Kitchen fan fine brushed metal roughness';
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(2,2);
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

function paddleGeometry(){
  // A swept, round-ended paddle with a narrower root and a broad outer face.
  // The blade itself has a shallow pressed-metal twist rather than a flat card.
  const outline=new THREE.Shape();
  outline.moveTo(.011,.020);
  outline.bezierCurveTo(-.003,.017,-.029,.043,-.042,.071);
  outline.bezierCurveTo(-.065,.114,-.044,.142,-.017,.148);
  outline.bezierCurveTo(.012,.156,.040,.134,.046,.108);
  outline.bezierCurveTo(.055,.077,.032,.040,.020,.026);
  outline.quadraticCurveTo(.015,.020,.011,.020);
  const geometry=new THREE.ExtrudeGeometry(outline,{
    depth:.0024,bevelEnabled:true,bevelThickness:.0007,
    bevelSize:.0007,bevelSegments:2,steps:1,curveSegments:20,
  });
  const positions=geometry.attributes.position;
  let radius=0;
  for(let i=0;i<positions.count;i++)radius=Math.max(radius,Math.hypot(positions.getX(i),positions.getY(i)));
  const scale=(KITCHEN_FAN.bladeDiameter/2)/radius;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i)*scale,y=positions.getY(i)*scale;
    positions.setXYZ(i,x,y,positions.getZ(i)-.0012+x*.11+(y-.02)*.012);
  }
  geometry.computeVertexNormals();return geometry;
}

// The mount and target are expressed in the parent's coordinate system. A home
// mirror on the parent therefore mirrors both the ceiling position and aim.
export function createKitchenFan(parent,{mount=[0,0,0],target=null}={}){
  const result=new THREE.Group();result.name='Kitchen directional ceiling fan';
  result.position.fromArray(mount);
  result.userData.kitchenFan=true;result.userData.estimated=true;
  result.userData.dimensions={...KITCHEN_FAN};parent.add(result);

  const grain=brushedTexture();
  const nickel=new THREE.MeshStandardMaterial({color:'#a4a7a2',roughness:.38,metalness:.50,roughnessMap:grain});
  const bladeFinish=new THREE.MeshStandardMaterial({color:'#a0a39e',roughness:.42,metalness:.46,roughnessMap:grain});
  const bodyFinish=new THREE.MeshStandardMaterial({color:'#777b78',roughness:.39,metalness:.48,roughnessMap:grain});
  const dark=new THREE.MeshStandardMaterial({color:'#353b39',roughness:.60,metalness:.23});
  const polished=new THREE.MeshStandardMaterial({color:'#b6b9b3',roughness:.25,metalness:.60});

  // All ceiling furniture lies below y=0, so it meets the ceiling underside.
  cylinder(result,'Fan ceiling canopy',.070,.014,nickel,0,-.007);
  cylinder(result,'Fan canopy lower step',.059,.016,bodyFinish,0,-.022);
  const canopyRing=ring(result,'Fan canopy rim',.064,.0027,polished,0,-.014);
  canopyRing.rotation.x=Math.PI/2;
  cylinder(result,'Fan vertical mounting stem',.041,.105,nickel,0,-.0815);
  cylinder(result,'Fan housing dark seam',.042,.004,dark,0,-.136);
  cylinder(result,'Fan faceted lower housing',.043,.094,bodyFinish,0,-.185,0,6);
  const cap=mesh(result,'Fan tapered housing cap',new THREE.CylinderGeometry(.043,.020,.027,6),bodyFinish,0,-.2455);
  cap.rotation.y=Math.PI/6;

  const pivot=new THREE.Vector3(0,-KITCHEN_FAN.pivotDrop,0);
  const targetPoint=target?new THREE.Vector3().fromArray(target):new THREE.Vector3(mount[0],mount[1]-.95,mount[2]+.55);
  const axis=targetPoint.sub(new THREE.Vector3().fromArray(mount)).sub(pivot);
  if(axis.lengthSq()<1e-10)axis.set(0,0,1);
  axis.normalize();
  const yaw=Math.atan2(axis.x,axis.z);
  const pitch=Math.atan2(-axis.y,Math.hypot(axis.x,axis.z));

  // A fixed yoke swivels horizontally; the motor pivots vertically on its two
  // visible axle caps. The quaternion keeps the rotor axis pointing at target.
  const yoke=new THREE.Group();yoke.name='Fan swivel yoke';yoke.rotation.y=yaw;result.add(yoke);
  for(const side of [-1,1]){
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(side*.030,-.216,-.024),
      new THREE.Vector3(side*.059,-.235,-.023),
      new THREE.Vector3(side*.069,-.273,-.014),
      new THREE.Vector3(side*.069,-.317,0),
      new THREE.Vector3(side*.066,-KITCHEN_FAN.pivotDrop,0),
    ]);
    mesh(yoke,`Fan ${side<0?'left':'right'} curved yoke arm`,new THREE.TubeGeometry(path,32,.0065,10,false),nickel);
    const axle=cylinder(yoke,`Fan ${side<0?'left':'right'} tilt pivot`,.015,.018,polished,side*.065,pivot.y,0,32);
    axle.rotation.z=Math.PI/2;
    const screw=cylinder(yoke,`Fan ${side<0?'left':'right'} pivot screw`,.006,.0015,dark,side*.075,pivot.y,0,24);
    screw.rotation.z=Math.PI/2;
  }

  const head=new THREE.Group();head.name='Fan adjustable motor and blades';head.position.copy(pivot);
  const yawQuaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const pitchQuaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),pitch);
  head.quaternion.copy(yawQuaternion).multiply(pitchQuaternion);result.add(head);
  head.userData.airflowAxis=axis.toArray();
  const motor=cylinder(head,'Fan round motor body',.056,.083,bodyFinish,0,0,-.011);
  motor.rotation.x=Math.PI/2;
  const rear=mesh(head,'Fan rounded rear motor cover',new THREE.SphereGeometry(.054,48,24),bodyFinish,0,0,-.050);
  rear.scale.z=.30;
  ring(head,'Fan motor rear seam',.054,.0015,dark,0,0,-.044);
  const collar=cylinder(head,'Fan motor front collar',.060,.008,nickel,0,0,.0315);
  collar.rotation.x=Math.PI/2;
  ring(head,'Fan front collar seam',.0575,.0012,dark,0,0,.036);
  for(let i=0;i<12;i++){
    const angle=i/12*Math.PI*2;
    const vent=mesh(head,`Fan rear cooling slot ${i+1}`,new THREE.BoxGeometry(.0025,.009,.001),dark,
      Math.sin(angle)*.041,Math.cos(angle)*.041,-.064);
    vent.rotation.z=-angle;
  }

  const rotor=new THREE.Group();rotor.name='Fan three-blade rotor';rotor.position.z=.043;head.add(rotor);
  rotor.rotation.z=.17;
  const paddle=paddleGeometry();
  for(let i=0;i<3;i++){
    const blade=new THREE.Group();blade.name=`Fan paddle assembly ${i+1}`;blade.rotation.z=i*Math.PI*2/3;rotor.add(blade);
    const surface=mesh(blade,`Fan rounded metal blade ${i+1}`,paddle,bladeFinish);
    surface.userData.kitchenFanBlade=true;
    const rootShape=new THREE.Shape();
    rootShape.moveTo(-.010,.018);rootShape.quadraticCurveTo(-.022,.033,-.020,.053);
    rootShape.quadraticCurveTo(-.006,.058,.013,.046);rootShape.lineTo(.015,.024);rootShape.closePath();
    mesh(blade,`Fan blade ${i+1} root bracket`,new THREE.ExtrudeGeometry(rootShape,{depth:.0015,bevelEnabled:false,curveSegments:10}),bodyFinish,0,0,.003);
    for(const [j,x,y] of [[1,-.010,.034],[2,-.010,.049]]){
      const rivet=cylinder(blade,`Fan blade ${i+1} rivet ${j}`, .0025,.0018,polished,x,y,.006,16);
      rivet.rotation.x=Math.PI/2;
    }
  }
  ring(rotor,'Fan polished hub rim',.027,.0032,polished,0,0,.008);
  const hub=mesh(rotor,'Fan domed central hub',new THREE.SphereGeometry(.027,48,24),nickel,0,0,.010);
  hub.scale.z=.62;
  const hubTip=mesh(rotor,'Fan hub centre highlight',new THREE.SphereGeometry(.020,32,20),bodyFinish,0,0,.015);
  hubTip.scale.z=.58;
  result.userData.aimTarget=target?[...target]:[mount[0],mount[1]-.95,mount[2]+.55];
  return result;
}
