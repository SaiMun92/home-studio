import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

function mesh(parent,name,geometry,material,x=0,y=0,z=0){
  const object=new THREE.Mesh(geometry,material);object.name=name;
  object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;
  parent.add(object);return object;
}
function box(parent,name,w,h,d,material,x=0,y=0,z=0,r=.003){
  return mesh(parent,name,new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.4,h*.4,d*.4)),material,x,y,z);
}
function cylinder(parent,name,r,h,material,x=0,y=0,z=0,segments=64){
  return mesh(parent,name,new THREE.CylinderGeometry(r,r,h,segments),material,x,y,z);
}
function group(parent,name){const result=new THREE.Group();result.name=name;parent.add(result);return result;}
const finish=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});

function frontTexture(){
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const forward=(x+y)%19,backward=(x-y+size*19)%23;
    const value=forward<2||backward<2?213:238;
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  texture.name='Dreame diagonal front texture';texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
function brandTexture(){
  // Small bitmap lettering keeps the model self-contained in browsers and Node.
  const glyphs={D:['11110','10001','10001','10001','10001','10001','11110'],R:['11110','10001','10001','11110','10100','10010','10001'],E:['11111','10000','10000','11110','10000','10000','11111'],A:['01110','10001','10001','11111','10001','10001','10001'],M:['10001','11011','10101','10101','10001','10001','10001']};
  const width=144,height=28,data=new Uint8Array(width*height*4);
  for(const [index,char] of [...'DREAME'].entries())for(let y=0;y<7;y++)for(let x=0;x<5;x++)if(glyphs[char][y][x]==='1'){
    for(let py=0;py<3;py++)for(let px=0;px<3;px++){
      const i=((height-4-y*3-py)*width+index*24+x*3+3+px)*4;
      data[i]=210;data[i+1]=191;data[i+2]=139;data[i+3]=255;
    }
  }
  const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
  texture.name='Dreame gold wordmark';texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

function makeRamp(parent,product,material){
  const result=group(parent,'Dreame entry ramp');
  const half=(product.width-.008)/2,z=product.depth/2,d=product.rampDepth,h=.015;
  // A thin tapered entry plate rests directly on the floor. Its added length
  // is an illustration allowance, separate from the published dock envelope.
  const vertices=[[-half,0,z],[half,0,z],[-half,h,z],[half,h,z],[-half,0,z+d],[half,0,z+d],[-half,.001,z+d],[half,.001,z+d]];
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
  geometry.setIndex([0,2,3,0,3,1,2,6,7,2,7,3,4,5,7,4,7,6,0,4,6,0,6,2,1,3,7,1,7,5,0,1,5,0,5,4]);
  geometry.computeVertexNormals();mesh(result,'Dreame tapered floor ramp',geometry,material);
  const grooves=new THREE.LineBasicMaterial({color:'#1a2023'});
  for(const x of [-.15,-.12,-.09,.09,.12,.15]){
    const points=[.08,.92].map(u=>new THREE.Vector3(x,h*(1-u)+.001*u+.00005,z+d*u));
    const rail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),grooves);
    rail.name='Dreame entry traction groove';result.add(rail);
  }
  result.userData.estimated=true;result.userData.extraDepth=d;return result;
}

function makeRobot(parent,product){
  const robot=group(parent,'Dreame robot');
  const radius=product.robotWidth/2,height=product.robotHeight;
  const dark=finish('#292f32',.36,.18),top=finish('#373e42',.37,.2),black=finish('#12191d',.34,.12);
  const rubber=finish('#1e2223',.9),glass=finish('#60737b',.2,.45),cyan=finish('#70b3c3',.3,.25);
  const shape=new THREE.LatheGeometry([
    new THREE.Vector2(0,.016),new THREE.Vector2(radius-.010,.016),
    new THREE.Vector2(radius,.026),new THREE.Vector2(radius,height-.012),
    new THREE.Vector2(radius-.006,height-.006),new THREE.Vector2(0,height-.006),
  ],128);
  // Flatten only the sensor recess; the round bumper retains its published
  // width/depth, and the inset lenses do not grow the product dimensions.
  const positions=shape.getAttribute('position');
  for(let i=0;i<positions.count;i++)if(Math.abs(positions.getX(i))<.083&&positions.getZ(i)>.158)positions.setZ(i,.158);
  positions.needsUpdate=true;shape.computeVertexNormals();
  mesh(robot,'Dreame round robot body',shape,dark);
  cylinder(robot,'Dreame circular top cover',radius-.007,.006,top,0,height-.003);
  for(const side of [-1,1]){
    const wheel=cylinder(robot,'Dreame drive wheel',.018,.020,rubber,side*.128,.018,-.007,24);wheel.rotation.z=Math.PI/2;
    cylinder(robot,'Dreame docked mop pad',.053,.008,finish('#626a68',.98),side*.065,.008,-.065,32);
  }
  box(robot,'Dreame front sensor surround',.144,.041,.016,black,0,.045,radius-.008,.009);
  box(robot,'Dreame dual camera window',.125,.027,.001,finish('#0b1216',.22,.24),0,.047,radius-.001,.006);
  for(const side of [-1,1]){
    const lens=cylinder(robot,'Dreame front camera lens',.009,.0005,glass,side*.043,.047,radius-.00065,24);lens.rotation.x=Math.PI/2;
    const pupil=cylinder(robot,'Dreame front camera pupil',.004,.0004,black,side*.043,.047,radius-.0002,20);pupil.rotation.x=Math.PI/2;
  }
  box(robot,'Dreame front structured light sensor',.019,.008,.0004,glass,0,.047,radius-.0002,.001);
  const lidarHeight=product.robotRaisedHeight-height,lidarZ=-.037;
  cylinder(robot,'Dreame raised lidar turret',.034,lidarHeight-.002,black,0,height+(lidarHeight-.002)/2,lidarZ,64);
  cylinder(robot,'Dreame lidar top',.032,.002,top,0,product.robotRaisedHeight-.001,lidarZ,64);
  const rim=mesh(robot,'Dreame cyan lidar rim',new THREE.TorusGeometry(.0345,.0012,8,64),cyan,0,product.robotRaisedHeight-.0016,lidarZ);rim.rotation.x=Math.PI/2;
  for(const x of [-.011,.011])cylinder(robot,'Dreame top control button',.003,.0006,glass,x,height-.0003,.030,16);
  robot.userData.applianceDimensions={width:product.robotWidth,depth:product.robotDepth,height:product.robotRaisedHeight};
  robot.position.set(0,.015,product.depth/2-.08);
  return robot;
}

// Faces local +Z. Product body proportions are illustrative within the exact
// published envelope; the detachable ramp has its own estimated allowance.
export function createDreameVacuum(parent,product){
  const result=group(parent,product.label+' dock and robot');result.userData.productId=product.id;
  const dock=group(result,'Dreame dock');
  const {width,depth,height}=product,t=.009,front=depth/2,back=-depth/2,bayTop=.135;
  // The floor tray extends ahead of the tower, leaving the robot's lidar
  // and top visible while docked. Internal proportions are photo estimates.
  const towerDepth=depth-.13,towerCenter=-.065,towerFront=front-.13;
  const shell=finish('#2d3337',.4,.22),tray=finish('#30383b',.66,.1),trim=finish('#c0a469',.32,.7);
  const panel=finish('#4d5155',.48,.2);panel.map=frontTexture();
  box(dock,'Dreame floor tray',width,.015,depth,tray,0,.0075,0,.002);
  for(const side of [-1,1])box(dock,side<0?'Dreame dock left shell':'Dreame dock right shell',t,height,towerDepth,shell,side*(width-t)/2,height/2,towerCenter,.002);
  box(dock,'Dreame dock rear shell',width-2*t,height,.015,shell,0,height/2,back+.0075,.002);
  box(dock,'Dreame dock upper body',width-2*t,height-bayTop,towerDepth-.032,shell,0,(height+bayTop)/2,towerCenter-.007,.002);
  box(dock,'Dreame dock roof',width-2*t,.006,towerDepth-.015,shell,0,height-.003,towerCenter-.0075,.002);
  const panelBottom=bayTop+.005,panelTop=height-.006,seam=panelBottom+(panelTop-panelBottom)*.39;
  for(const [name,low,high] of [['lower',panelBottom,seam-.001],['upper',seam+.001,panelTop]])
    box(dock,`Dreame textured ${name} front`,width-.027,high-low,.010,panel,-.002,(low+high)/2,towerFront-.014,.0015);
  box(dock,'Dreame gold vertical edge',.003,height-bayTop-.010,.003,trim,width/2-.011,(height+bayTop)/2,towerFront-.0055,.001);
  box(dock,'Dreame dark docking back panel',width-2*t,bayTop-.025,.018,finish('#182024',.64),0,(bayTop+.015)/2,back+.025,.001);
  for(const x of [-.050,.050])box(dock,'Dreame recessed charging contact',.014,.020,.002,finish('#9e9f8b',.35,.6),x,.060,back+.036,.001);
  const brand=finish('#ffffff',.48,.25);brand.map=brandTexture();brand.transparent=true;brand.alphaTest=.1;
  mesh(dock,'Dreame front wordmark',new THREE.PlaneGeometry(.081,.014),brand,-width/2+.062,height-.024,towerFront-.0088);
  dock.userData.applianceDimensions={width,depth,height};
  makeRamp(result,product,tray);makeRobot(result,product);
  return result;
}
