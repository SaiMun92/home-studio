import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {VINCENT_DINING} from './dining-products.js';

// The product envelope is 1500 × 800 × 760 mm; chair dimensions and grain
// are visual approximations of the supplied Castlery photographs.
const TABLE={width:VINCENT_DINING.tableWidth,depth:VINCENT_DINING.tableDepth,height:VINCENT_DINING.tableHeight,topThickness:VINCENT_DINING.topThickness};
const DEFAULT_WALNUT=VINCENT_DINING.color;
let woodPixels,fabricPixels;
const fract=value=>value-Math.floor(value);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7+43.83)*43758.5453123);
const smooth=value=>value*value*(3-2*value);
function noise(x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  const a=THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),fx);
  const b=THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx);
  return THREE.MathUtils.lerp(a,b,fy);
}
function walnutPixels(){
  if(woodPixels)return woodPixels;
  const width=768,height=384,data=new Uint8Array(width*height*4);
  const boardTones=[.02,-.025,.013,-.015,.028,-.009];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=y/height,board=Math.min(5,Math.floor(v*6)),across=v*6-board;
    const warp=v+.008*Math.sin(u*11+board*.7)+.004*Math.sin(u*29+board*2.1);
    const longNoise=noise(u*9,warp*170);
    const fibres=Math.sin(warp*1650+noise(u*22,v*32)*4.8);
    const cathedral=Math.sqrt((u-(.25+board*.11))**2*.12+(across-.49)**2);
    const rings=Math.sin(cathedral*55+noise(u*12,v*40)*1.8);
    const fine=noise(u*190,v*410)-.5;
    const seam=Math.min(across,1-across)<.006?-.035:0;
    // A neutral tonal map lets the owner's custom wood color remain the
    // actual finish color. It is independent of the kitchen laminate maps.
    const value=THREE.MathUtils.clamp(.83+boardTones[board]+(longNoise-.5)*.19+fibres*.027+rings*.043+fine*.035+seam,.53,.99);
    const index=(y*width+x)*4,byte=Math.round(value*255);
    data[index]=byte;data[index+1]=byte;data[index+2]=byte;data[index+3]=255;
  }
  woodPixels={data,width,height};return woodPixels;
}
function clothPixels(){
  if(fabricPixels)return fabricPixels;
  const size=128,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const weave=(x%4<2?1:-1)*(y%4<2?1:-1);
    const value=Math.round((.83+weave*.025+(hash(x,y)-.5)*.13)*255),index=(y*size+x)*4;
    data[index]=value;data[index+1]=value;data[index+2]=value;data[index+3]=255;
  }
  fabricPixels={data,width:size,height:size};return fabricPixels;
}
function texture(pixels,name){
  // Share only immutable CPU pixels. Every rendered set owns its texture,
  // so deleting one furniture item cannot dispose another item's finish.
  const map=new THREE.DataTexture(pixels.data,pixels.width,pixels.height,THREE.RGBAFormat);
  map.name=name;map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.MirroredRepeatWrapping;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;return map;
}
function addMesh(parent,name,geometry,material,x=0,y=0,z=0,part){
  const object=new THREE.Mesh(geometry,material);object.name=name;
  object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;
  if(part)object.userData.vincentPart=part;
  parent.add(object);return object;
}
function box(parent,name,width,height,depth,material,x=0,y=0,z=0,radius=.004,part){
  const geometry=new RoundedBoxGeometry(width,height,depth,4,Math.min(radius,width*.45,height*.45,depth*.45));
  return addMesh(parent,name,geometry,material,x,y,z,part);
}
function roundedRectangle(width,height,radius){
  const x=-width/2,y=-height/2,r=radius,shape=new THREE.Shape();
  shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
  shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);shape.closePath();return shape;
}
function topGeometry(){
  const bevel=.006;
  const geometry=new THREE.ExtrudeGeometry(roundedRectangle(TABLE.width-2*bevel,TABLE.depth-2*bevel,.09-bevel),{
    depth:TABLE.topThickness-2*bevel,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,curveSegments:16,
  });
  geometry.rotateX(-Math.PI/2);
  const {position,normal,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    if(Math.abs(normal.getY(i))>.45)uv.setXY(i,(x+TABLE.width/2)/TABLE.width,(z+TABLE.depth/2)/TABLE.depth);
    else if(Math.abs(normal.getX(i))>.7)uv.setXY(i,(z+TABLE.depth/2)/TABLE.depth,(y+.02)*2);
    else uv.setXY(i,(x+TABLE.width/2)/TABLE.width,(y+.02)*2);
  }
  return geometry;
}
function taperedLeg(parent,name,from,to,bottomRadius,topRadius,wood,part){
  const height=to[1]-from[1];
  const geometry=new THREE.CylinderGeometry(topRadius,bottomRadius,height,8,1,false);
  geometry.rotateY(Math.PI/8);
  const {position,uv}=geometry.attributes;
  for(let i=0;i<position.count;i++){
    const along=(position.getY(i)+height/2)/height;
    position.setXYZ(i,position.getX(i)+THREE.MathUtils.lerp(from[0],to[0],along),position.getY(i)+height/2+from[1],position.getZ(i)+THREE.MathUtils.lerp(from[2],to[2],along));
    const oldU=uv.getX(i),oldV=uv.getY(i);uv.setXY(i,oldV,oldU*.25);
  }
  geometry.computeVertexNormals();
  return addMesh(parent,name,geometry,wood,0,0,0,part);
}
function brace(parent,name,from,to,width,material){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
  const object=box(parent,name,width,direction.length(),width,material,0,0,0,.004,'metal-brace');
  object.position.copy(a.add(b).multiplyScalar(.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());return object;
}
function curvedBackGeometry(){
  const width=.438,height=.208,r=.028,thickness=.024,columns=32,rows=8;
  const positions=[],uvs=[],indices=[];
  for(const layer of [-1,1])for(let ix=0;ix<=columns;ix++){
    const x=(ix/columns-.5)*width,corner=Math.max(0,Math.abs(x)-(width/2-r));
    const halfHeight=height/2-r+Math.sqrt(Math.max(0,r*r-corner*corner));
    for(let iy=0;iy<=rows;iy++){
      const y=(iy/rows*2-1)*halfHeight;
      positions.push(x,y,-.223-y*.16+x*x*.64+layer*thickness/2);
      uvs.push(ix/columns,iy/rows*.50+.23);
    }
  }
  const stride=rows+1,layerSize=(columns+1)*stride;
  const quad=(a,b,c,d)=>indices.push(a,b,d,b,c,d);
  for(let ix=0;ix<columns;ix++)for(let iy=0;iy<rows;iy++){
    const a=ix*stride+iy,b=(ix+1)*stride+iy;
    quad(a,a+1,b+1,b);quad(layerSize+a,layerSize+b,layerSize+b+1,layerSize+a+1);
  }
  for(let ix=0;ix<columns;ix++){
    const a=ix*stride,b=(ix+1)*stride;
    quad(a,b,layerSize+b,layerSize+a);
    quad(a+rows,layerSize+a+rows,layerSize+b+rows,b+rows);
  }
  for(let iy=0;iy<rows;iy++){
    quad(iy,layerSize+iy,layerSize+iy+1,iy+1);
    const a=columns*stride+iy;quad(a,a+1,layerSize+a+1,layerSize+a);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function chair(parent,index,x,z,rotation,wood,cloth,metal){
  const result=new THREE.Group();result.name=`Vincent matching chair ${index}`;result.userData.vincentChair=true;
  result.position.set(x,0,z);result.rotation.y=rotation;parent.add(result);
  for(const sx of [-1,1])for(const sz of [-1,1])taperedLeg(result,'Tapered walnut chair leg',[sx*.202,0,sz*.197],[sx*.176,.426,sz*.157],.014,.022,wood,'chair-leg');
  for(const side of [-1,1])taperedLeg(result,'Walnut back support',[side*.178,.416,-.157],[side*.188,.836,-.23],.021,.014,wood,'chair-back-support');
  box(result,'Walnut seat frame',.446,.034,.416,wood,0,.406,.012,.010,'chair-frame');
  box(result,'Charcoal upholstered seat',.416,.042,.389,cloth,0,.444,.018,.019,'seat-upholstery');
  const back=addMesh(result,'Curved solid walnut chair back',curvedBackGeometry(),wood,0,.739,0,'chair-back');
  for(const side of [-1,1]){
    const pin=addMesh(result,'Chair back fixing',new THREE.CylinderGeometry(.0035,.0035,.003,12),metal,side*.185,.738,-.214,'chair-fixing');
    pin.rotation.x=Math.PI/2;
  }
  return result;
}

export function createVincentDining(parent,color=DEFAULT_WALNUT){
  const result=new THREE.Group();result.name='Castlery Vincent walnut dining set';result.userData.vincentDining=true;
  parent.add(result);
  const grain=texture(walnutPixels(),'Vincent natural walnut grain');
  const wood=new THREE.MeshPhysicalMaterial({color:color||DEFAULT_WALNUT,map:grain,bumpMap:grain,bumpScale:.0005,roughness:.48,metalness:0,clearcoat:.18,clearcoatRoughness:.46});
  wood.userData.furnitureFinish='vincent-walnut';
  const weave=texture(clothPixels(),'Vincent charcoal upholstery weave');
  const cloth=new THREE.MeshStandardMaterial({color:'#3b3d3c',map:weave,bumpMap:weave,bumpScale:.0007,roughness:.94});
  const metal=new THREE.MeshStandardMaterial({color:'#333532',metalness:.58,roughness:.43});
  const table=new THREE.Group();table.name='Vincent walnut table 150 cm';table.userData.dimensions={...TABLE};result.add(table);
  addMesh(table,'Vincent 150 cm solid walnut tabletop',topGeometry(),wood,0,TABLE.height-TABLE.topThickness+.006,0,'table-top');
  let legIndex=0;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    taperedLeg(table,`Vincent table leg ${++legIndex}`,[sx*.642,0,sz*.328],[sx*.553,.725,sz*.245],.022,.040,wood,'table-leg');
    box(table,'Walnut corner support',.105,.054,.095,wood,sx*.553,.693,sz*.245,.013,'table-support');
  }
  for(const side of [-1,1]){
    brace(table,'Long underside metal brace',[-.555,.682,side*.245],[.555,.682,side*.245],.024,metal);
    brace(table,'End underside metal brace',[side*.555,.682,-.245],[side*.555,.682,.245],.024,metal);
  }
  brace(table,'Diagonal underside metal brace',[-.48,.682,-.22],[.48,.682,.22],.019,metal);
  let chairIndex=0;
  for(const side of [-1,1])for(const x of [-.40,.40])chair(result,++chairIndex,x,side*.64,side<0?0:Math.PI,wood,cloth,metal);
  return result;
}
