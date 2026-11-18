import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SOLANGE_CHAIR} from './living-products.js';

// Product envelope follows the supplied specification. Cushion shaping,
// bouclé loops and whitewashed grain are approximations of the photographs.
let bouclePixels,woodPixels;
const fract=value=>value-Math.floor(value);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7+61.3)*43758.5453123);
const smooth=value=>value*value*(3-2*value);
function noise(x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),fx),
    THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);
}
function boucle(){
  if(bouclePixels)return bouclePixels;
  const size=384,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size*48,v=y/size*48,cellX=Math.floor(u),cellY=Math.floor(v);
    let nearest=2,ring=0;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const cx=cellX+dx,cy=cellY+dy;
      const px=cx+.2+hash(cx,cy)*.6,py=cy+.2+hash(cx+81,cy+43)*.6;
      const distance=Math.hypot(u-px,(v-py)*(.8+hash(cx+10,cy+99)*.5));
      nearest=Math.min(nearest,distance);
      const radius=.17+hash(cx+20,cy+14)*.10;
      ring=Math.max(ring,Math.exp(-(((distance-radius)/.085)**2)));
    }
    const tonal=THREE.MathUtils.clamp(.82+ring*.13-Math.min(nearest,.7)*.07+(hash(x,y)-.5)*.085,.62,.98);
    const value=Math.round(tonal*255),index=(y*size+x)*4;
    data[index]=value;data[index+1]=value;data[index+2]=value;data[index+3]=255;
  }
  bouclePixels={data,width:size,height:size};return bouclePixels;
}
function whitewashedWood(){
  if(woodPixels)return woodPixels;
  const width=512,height=256,data=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=y/height;
    const warp=v+.007*Math.sin(u*13)+.004*Math.sin(u*29+v*7);
    const fibres=Math.sin(warp*1350+noise(u*14,v*18)*3);
    const pores=Math.pow(Math.max(0,Math.sin(warp*850+noise(u*9,v*90)*4)),8);
    const tonal=THREE.MathUtils.clamp(.86+(noise(u*8,warp*170)-.5)*.12+fibres*.028+pores*.095+(hash(x,y)-.5)*.026,.68,1);
    const value=Math.round(tonal*255),index=(y*width+x)*4;
    data[index]=value;data[index+1]=value;data[index+2]=value;data[index+3]=255;
  }
  woodPixels={data,width,height};return woodPixels;
}
function texture(pixels,name,repeat=1){
  // Only CPU pixel data is shared. A rendered chair owns both its textures;
  // disposing one chair therefore cannot invalidate another chair's finish.
  const map=new THREE.DataTexture(pixels.data,pixels.width,pixels.height,THREE.RGBAFormat);
  map.name=name;map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.MirroredRepeatWrapping;map.repeat.set(repeat,repeat);
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;return map;
}
function mesh(parent,name,geometry,mat,x=0,y=0,z=0,part){
  const object=new THREE.Mesh(geometry,mat);object.name=name;object.position.set(x,y,z);
  object.castShadow=true;object.receiveShadow=true;
  if(part)object.userData.solangePart=part;
  parent.add(object);return object;
}
function roundedBox(parent,name,w,h,d,mat,x,y,z,radius,part){
  return mesh(parent,name,new RoundedBoxGeometry(w,h,d,7,Math.min(radius,w*.49,h*.49,d*.49)),mat,x,y,z,part);
}
function sidePanelGeometry(){
  // Shape X becomes -Z after rotation; the long base and continuous rear
  // upright form one substantial L-shaped support on each side of the seat.
  const shape=new THREE.Shape();
  shape.moveTo(-.313,.006);
  shape.quadraticCurveTo(-.335,.006,-.335,.032);
  shape.lineTo(-.302,.226);shape.quadraticCurveTo(-.300,.242,-.282,.242);
  shape.lineTo(.136,.242);shape.quadraticCurveTo(.180,.242,.195,.285);
  shape.lineTo(.286,.599);shape.quadraticCurveTo(.294,.622,.312,.622);
  shape.lineTo(.327,.622);shape.quadraticCurveTo(.350,.622,.350,.598);
  shape.lineTo(.350,.030);shape.quadraticCurveTo(.350,.006,.326,.006);
  shape.lineTo(-.313,.006);shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.036,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:4,curveSegments:16});
  geometry.rotateY(Math.PI/2);geometry.translate(-.018,0,0);
  const {position,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++){
    const y=position.getY(i),z=position.getZ(i);
    const turn=smooth(THREE.MathUtils.clamp((y-.16)/.24,0,1));
    const along=THREE.MathUtils.lerp(.335-z,.60+y-.14,turn)/.8;
    const across=THREE.MathUtils.lerp(y/.32,(z+.356)/.15,turn);
    uv.setXY(i,along,across);
  }
  return geometry;
}
function backCushionGeometry(){
  const width=.632,height=.282,depth=.132;
  const geometry=new RoundedBoxGeometry(width,height,depth,10,.059);
  const {position}=geometry.attributes;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    // Slight recline plus a concave seating face, with the rounded sides
    // wrapping forward. Y remains unchanged so the specified height is exact.
    position.setZ(i,z-.045*y/(height/2)+.045*(x/(width/2))**2);
  }
  geometry.computeVertexNormals();geometry.computeBoundingBox();
  geometry.translate(0,0,-SOLANGE_CHAIR.depth/2-geometry.boundingBox.min.z);
  return geometry;
}
function cushionSeam(parent,mat){
  const points=[],w=.676,d=.586,r=.09,cx=w/2-r,cz=d/2-r;
  for(const [x,z,start] of [[cx,cz,0],[-cx,cz,Math.PI/2],[-cx,-cz,Math.PI],[cx,-cz,Math.PI*1.5]]){
    for(let step=0;step<=12;step++){
      const a=start+step/12*Math.PI/2;
      points.push(new THREE.Vector3(x+Math.cos(a)*r,.347,z+Math.sin(a)*r+.09));
    }
  }
  const path=new THREE.CatmullRomCurve3(points,true,'centripetal');
  return mesh(parent,'Solange cushion stitching',new THREE.TubeGeometry(path,160,.0007,5,true),mat,0,0,0,'seat-seam');
}

export function createSolangeChair(parent,color=SOLANGE_CHAIR.color){
  const result=new THREE.Group();result.name='Castlery Solange bouclé chair';result.userData.solangeChair=true;
  result.userData.dimensions={width:SOLANGE_CHAIR.width,depth:SOLANGE_CHAIR.depth,height:SOLANGE_CHAIR.height,seatHeight:SOLANGE_CHAIR.seatHeight};
  parent.add(result);
  const clothMap=texture(boucle(),'Solange fine bouclé loops',3);
  const cloth=new THREE.MeshStandardMaterial({color:color||SOLANGE_CHAIR.color,map:clothMap,bumpMap:clothMap,bumpScale:.0012,roughness:.96});
  cloth.userData.furnitureFinish='solange-boucle';
  const woodMap=texture(whitewashedWood(),'Solange whitewashed oak grain');
  const wood=new THREE.MeshStandardMaterial({color:SOLANGE_CHAIR.woodColor,map:woodMap,bumpMap:woodMap,bumpScale:.00045,roughness:.62});
  wood.userData.furnitureFinish='solange-whitewash';
  for(const side of [-1,1])mesh(result,side<0?'Solange left L-shaped side panel':'Solange right L-shaped side panel',sidePanelGeometry(),wood,side*.253,0,0,'wood-side-panel');
  for(const z of [-.13,.20])roundedBox(result,'Solange concealed seat support',.478,.030,.037,wood,0,.226,z,.006,'seat-support');
  roundedBox(result,'Solange broad rounded seat cushion',SOLANGE_CHAIR.width,.198,.590,cloth,0,SOLANGE_CHAIR.seatHeight-.099,.090,.073,'seat-cushion');
  mesh(result,'Solange curved padded back',backCushionGeometry(),cloth,0,SOLANGE_CHAIR.height-.141,0,'back-cushion');
  const seam=new THREE.MeshStandardMaterial({color:new THREE.Color(color||SOLANGE_CHAIR.color).multiplyScalar(.89),roughness:.98});
  cushionSeam(result,seam);
  return result;
}
