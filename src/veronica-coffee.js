import * as THREE from 'three';
import {VERONICA_COFFEE} from './living-products.js';

let concretePixels;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
function concreteMap(){
  if(!concretePixels){
    const size=256,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const cloud=Math.sin(x*.071+Math.sin(y*.093))*Math.sin(y*.053+x*.022);
      const grain=hash(x,y),pore=grain<.012?-.09:0;
      const value=Math.round((.93+cloud*.025+(grain-.5)*.035+pore)*255),i=(y*size+x)*4;
      data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
    }
    concretePixels=data;
  }
  const map=new THREE.DataTexture(concretePixels,256,256,THREE.RGBAFormat);
  map.name='Veronica subtle concrete mottling';map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.MirroredRepeatWrapping;map.magFilter=THREE.LinearFilter;
  map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  return map;
}

export function createVeronicaCoffee(parent,color=VERONICA_COFFEE.color){
  const group=new THREE.Group();group.name='Veronica round coffee table · Sand';
  group.userData.veronicaCoffee=true;parent.add(group);
  const map=concreteMap();
  const material=new THREE.MeshStandardMaterial({color,map,bumpMap:map,bumpScale:.0006,roughness:.86,metalness:0});
  material.userData.furnitureFinish='veronica-sand-concrete';
  // The published envelope is exact. The rounded bowl underside and pedestal
  // profile are estimated from the selected Sand product photographs.
  const radius=VERONICA_COFFEE.width/2,height=VERONICA_COFFEE.height;
  const points=[
    [0,0],[.164,0],[.171,.002],[.175,.009],[.178,.028],[.178,.078],
    [.176,.128],[.168,.172],[.154,.202],[.138,.221],[.136,.229],
    [.176,.231],[.213,.240],[.247,.254],[.279,.272],[.306,.291],
    [.329,.310],[.343,.325],[radius,.334],[radius,.337],[.348,height],[0,height],
  ].map(([r,y])=>new THREE.Vector2(r,y));
  const geometry=new THREE.LatheGeometry(points,96);
  const {position,normal,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++)if(normal.getY(i)>.7)uv.setXY(i,position.getX(i)/VERONICA_COFFEE.width+.5,position.getZ(i)/VERONICA_COFFEE.depth+.5);
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Veronica sculpted concrete top and pedestal';
  mesh.userData.veronicaPart='body';mesh.castShadow=true;mesh.receiveShadow=true;
  group.add(mesh);return group;
}
