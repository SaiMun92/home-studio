import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {OMNIDESK,OFFICE_CHAIR} from './office-products.js';

function mesh(parent,name,geometry,material,x=0,y=0,z=0){
  const result=new THREE.Mesh(geometry,material);result.name=name;result.position.set(x,y,z);
  result.castShadow=true;result.receiveShadow=true;parent.add(result);return result;
}
function box(parent,name,w,h,d,material,x=0,y=0,z=0,r=.004){
  return mesh(parent,name,new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.4,h*.4,d*.4)),material,x,y,z);
}
function rod(parent,name,a,b,r,material){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const result=mesh(parent,name,new THREE.CylinderGeometry(r,r,delta.length(),12),material);
  result.position.copy(start.add(end).multiplyScalar(.5));result.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return result;
}
const mat=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
let grainPixels;
function grain(){
  const width=512,height=256;
  if(!grainPixels){
    grainPixels=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const u=x/width,v=y/height;
      const warp=v+.025*Math.sin(u*7+v*8)+.007*Math.sin(u*19+v*26);
      const broad=Math.sin(warp*93+Math.sin(u*7)*2),fine=Math.sin(warp*710+u*9);
      const value=THREE.MathUtils.clamp(.79+broad*.14+Math.sin(warp*210)*.05+fine*.035,.46,.99);
      const index=(y*width+x)*4,byte=Math.round(value*255);
      grainPixels[index]=grainPixels[index+1]=grainPixels[index+2]=byte;grainPixels[index+3]=255;
    }
  }
  const map=new THREE.DataTexture(grainPixels,width,height,THREE.RGBAFormat);map.name='Pheasantwood grain';
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

// Fixed at the published minimum working height; the actuator and accessories
// are modeled details. Each desk owns its materials and texture resources.
export function createOmnidesk(parent,color=OMNIDESK.color){
  const wood=mat(color,.42);wood.map=grain();
  const frame=mat('#303432',.52,.25),black=mat('#202725',.6),keys=mat('#89918e');
  const {width,depth,height,topThickness}=OMNIDESK;
  const top=box(parent,'Pheasantwood desktop',width,topThickness,depth,wood,0,height-topThickness/2,0,.005);
  const {position,normal,uv}=top.geometry.attributes;
  for(let i=0;i<position.count;i++){
    if(Math.abs(normal.getY(i))>.5)uv.setXY(i,(position.getX(i)+width/2)/width,(position.getZ(i)+depth/2)/depth);
    else uv.setXY(i,(position.getX(i)+width/2)/width,position.getY(i)*3);
  }
  for(const x of [-.43,.43]){
    box(parent,'T foot',.10,.048,.64,frame,x,.024,0,.015);
    box(parent,'Lower telescopic column',.078,.40,.076,frame,x,.248,0);
    box(parent,'Upper telescopic column',.066,.30,.064,frame,x,.565,0);
    box(parent,'Desktop support',.095,.028,.59,frame,x,.697,0);
  }
  box(parent,'Frame crossbar',.95,.05,.075,frame,0,.682,0);
  box(parent,'Cable management tray',.80,.07,.15,frame,0,.63,-.245);
  box(parent,'Cable grommet',.15,.005,.055,black,0,height+.0025,-.28,.005);
  box(parent,'Wood grommet lid',.137,.006,.042,wood,0,height+.006,-.28,.003);
  box(parent,'Height controller',.14,.038,.045,black,.40,.695,.345,.004);
  box(parent,'Controller display',.040,.017,.002,mat('#8cad9a'),.365,.698,.369,.001);
  for(let i=0;i<4;i++)box(parent,'Height memory button',.010,.010,.003,keys,.401+i*.016,.698,.369,.002);
  box(parent,'Monitor stand base',.24,.014,.17,black,0,height+.007,-.16,.02);
  box(parent,'Monitor stand',.045,.16,.045,black,0,height+.087,-.22);
  box(parent,'27-inch monitor',.622,.368,.030,black,0,height+.328,-.23,.010);
  const screen=mat('#5f827a',.35);screen.emissive=new THREE.Color('#27473d');screen.emissiveIntensity=.22;
  box(parent,'Monitor screen',.599,.337,.003,screen,0,height+.328,-.213,.004);
  box(parent,'Screen sidebar',.11,.31,.001,mat('#314842'),-.23,height+.328,-.211);
  for(let row=0;row<4;row++)box(parent,'Screen document line',.30-row*.025,.009,.001,mat('#bdcfc2'),.05,height+.41-row*.046,-.211,.002);
  box(parent,'Desk mat',.69,.003,.31,mat('#5e6158'),0,height+.0015,.12,.016);
  box(parent,'Keyboard',.43,.016,.135,black,-.085,height+.011,.105,.009);
  for(let row=0;row<4;row++)for(let col=0;col<13;col++)box(parent,'Keyboard key',.026,.005,.020,keys,-.270+col*.031,height+.021,.059+row*.029,.002);
  box(parent,'Mouse',.059,.026,.095,black,.275,height+.016,.12,.023);
  return parent;
}

// Generic chair: the user chose an office-chair accessory, not a chair model.
// Faces local +Z, with an estimated 580 mm caster envelope and 460 mm seat.
export function createOfficeChair(parent,color=OFFICE_CHAIR.color){
  const frame=mat('#282f2d',.55,.18),fabric=mat(color,.92),meshFabric=mat(color,.97);
  rod(parent,'Gas lift',[0,.06,0],[0,.445,0],.030,frame);
  for(let i=0;i<5;i++){
    const angle=i/5*Math.PI*2,x=Math.cos(angle)*.25,z=Math.sin(angle)*.25;
    rod(parent,'Chair spoke',[0,.12,0],[x,.05,z],.016,frame);
    const caster=mesh(parent,'Caster',new THREE.SphereGeometry(.029,12,8),frame,x,.029,z);caster.scale.z=.75;
  }
  box(parent,'Padded seat',.49,.08,.47,fabric,0,.42,0,.040);
  rod(parent,'Back support',[0,.35,-.17],[0,.91,-.24],.024,frame);
  const back=box(parent,'Mesh back',.47,.52,.055,meshFabric,0,.77,-.23,.050);back.rotation.x=-.08;
  for(const x of [-.245,.245]){
    rod(parent,'Arm support',[x,.42,.01],[x,.66,.01],.016,frame);
    box(parent,'Armrest',.068,.032,.27,frame,x,.66,.02,.014);
  }
  box(parent,'Headrest',.31,.15,.066,fabric,0,1.08,-.255,.035);
  return parent;
}
