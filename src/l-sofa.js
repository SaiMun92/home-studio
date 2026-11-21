import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {L_SOFA} from './l-sofa-spec.js';

let weavePixels;
function upholsteryTexture(){
  const size=128;
  if(!weavePixels){
    weavePixels=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const grain=Math.sin(x*127.1+y*311.7)*43758.5453;
      const noise=grain-Math.floor(grain);
      const thread=(x%3===0?.018:0)+(y%3===0?.014:0);
      const value=Math.round((.95-thread+noise*.035)*255),index=(y*size+x)*4;
      weavePixels[index]=weavePixels[index+1]=weavePixels[index+2]=value;
      weavePixels[index+3]=255;
    }
  }
  // Share only CPU pixels. Each sofa owns its map and all of its materials.
  const map=new THREE.DataTexture(weavePixels,size,size,THREE.RGBAFormat);
  map.name='L sofa fine upholstery weave';map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(3,3);
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

function box(parent,name,w,h,d,material,x,y,z,radius=.035,part=null){
  const geometry=new RoundedBoxGeometry(w,h,d,5,Math.min(radius,w*.45,h*.45,d*.45));
  const result=new THREE.Mesh(geometry,material);result.name=name;result.position.set(x,y,z);
  result.castShadow=true;result.receiveShadow=true;
  if(part)result.userData.lSofaPart=part;
  parent.add(result);return result;
}

// An estimated generic upholstered sectional, facing local +Z. The chaise
// belongs to the +X end; no mesh or support fills the open front-left corner.
export function createLSofa(parent,color=L_SOFA.color){
  const group=new THREE.Group();group.name='L-shaped upholstered sofa';
  group.userData.lSofa=true;parent.add(group);
  const weave=upholsteryTexture();
  const fabric=new THREE.MeshStandardMaterial({color,map:weave,roughness:.94});
  const cushion=new THREE.MeshStandardMaterial({color:new THREE.Color(color).offsetHSL(0,0,.025),map:weave,roughness:.96});
  const legMaterial=new THREE.MeshStandardMaterial({color:'#2d3231',roughness:.48,metalness:.28});
  const pillowMaterial=new THREE.MeshStandardMaterial({color:'#dad7cc',map:weave,roughness:.98});
  const accentMaterial=new THREE.MeshStandardMaterial({color:'#adb3a7',map:weave,roughness:.98});
  const {width,depth,height,mainDepth,chaiseWidth}=L_SOFA;
  const left=-width/2,right=width/2,rear=-depth/2,mainFront=rear+mainDepth;
  const chaiseLeft=right-chaiseWidth,chaiseX=right-chaiseWidth/2;
  const armWidth=.16,seatGap=.014;

  // Independent rear and projecting bases preserve the actual L footprint.
  box(group,'L sofa main base',width,.21,mainDepth,fabric,0,.225,rear+mainDepth/2,.045,'main-base');
  box(group,'L sofa chaise base',chaiseWidth,.21,depth-mainDepth,fabric,
    chaiseX,.225,(mainFront+depth/2)/2,.045,'chaise-base');
  box(group,'L sofa upholstered back rail',width,.50,.17,fabric,
    0,.60,rear+.085,.038,'back');

  const seatLeft=left+armWidth+.012;
  const regularWidth=(chaiseLeft-seatLeft-seatGap*2)/2;
  const regularCenters=[seatLeft+regularWidth/2,seatLeft+regularWidth*1.5+seatGap];
  const seatRear=rear+.34,seatFront=mainFront-.014;
  for(const [index,x] of regularCenters.entries()){
    box(group,`L sofa seat cushion ${index+1}`,regularWidth,.15,seatFront-seatRear,cushion,
      x,.405,(seatRear+seatFront)/2,.055,'seat');
  }
  const chaiseSeatLeft=chaiseLeft+.007,chaiseSeatRight=right-armWidth-.012;
  const chaiseSeatX=(chaiseSeatLeft+chaiseSeatRight)/2;
  box(group,'L sofa chaise cushion',chaiseSeatRight-chaiseSeatLeft,.15,depth/2-.025-seatRear,cushion,
    chaiseSeatX,.405,(seatRear+depth/2-.025)/2,.055,'chaise-seat');

  const backs=[...regularCenters.map(x=>({x,width:regularWidth})),{x:chaiseSeatX,width:chaiseSeatRight-chaiseSeatLeft}];
  for(const [index,back] of backs.entries()){
    const mesh=box(group,`L sofa back cushion ${index+1}`,back.width,.44,.17,cushion,
      back.x,height-.22,rear+.215,.065,'back-cushion');
    // A slight recline keeps the specified height and leaves the rear clear.
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)-positions.getY(i)*.15);
    positions.needsUpdate=true;mesh.geometry.computeVertexNormals();
  }

  for(const [side,x] of [['left',left+armWidth/2],['right',right-armWidth/2]]){
    box(group,`L sofa ${side} arm`,armWidth,.37,mainDepth-.012,fabric,
      x,.415,rear+mainDepth/2,.055,'arm');
    box(group,`L sofa ${side} arm cushion`,armWidth,.11,mainDepth-.055,cushion,
      x,.615,rear+mainDepth/2,.043,'arm');
  }

  const feet=[
    [left+.10,rear+.12],[0,rear+.12],[right-.10,rear+.12],
    [left+.10,mainFront-.10],[0,mainFront-.10],[right-.10,mainFront-.10],
    [chaiseLeft+.10,depth/2-.10],[right-.10,depth/2-.10],
  ];
  for(const [index,[x,z]] of feet.entries()){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.019,.023,.12,12),legMaterial);
    leg.name=`L sofa dark foot ${index+1}`;leg.position.set(x,.06,z);
    leg.castShadow=true;leg.receiveShadow=true;leg.userData.lSofaPart='foot';group.add(leg);
  }

  const pillow=box(group,'L sofa light accent pillow',.29,.27,.105,pillowMaterial,
    left+.34,.615,rear+.48,.048,'pillow');pillow.rotation.set(-.12,.05,-.13);
  const accent=box(group,'L sofa sage accent pillow',.28,.25,.10,accentMaterial,
    right-.34,.605,rear+.48,.047,'pillow');accent.rotation.set(-.12,-.04,.10);
  return group;
}
