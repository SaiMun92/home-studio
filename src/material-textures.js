import * as THREE from 'three';
import {getKitchenMaterial} from './kitchen-materials.js';

// Cache loaded source images, never the map owned by a rendered material.
// Scene rebuilds dispose their maps; another kitchen must retain its own copy.
const sourceTextures=new Map();
function loadSource(image){
  const url=new URL(image,document.baseURI).href;
  if(!sourceTextures.has(url)){
    const promise=new Promise((resolve,reject)=>new THREE.TextureLoader().load(url,resolve,undefined,reject));
    sourceTextures.set(url,promise);
    promise.catch(()=>sourceTextures.delete(url));
  }
  return sourceTextures.get(url);
}

export function kitchenMaterial(id,kind,fallbackColor,properties={}){
  const sample=getKitchenMaterial(id,kind);
  const material=new THREE.MeshStandardMaterial({
    ...properties,color:sample?.color??fallbackColor,roughness:sample?.roughness??properties.roughness??.72,
  });
  if(!sample)return material;
  material.userData.kitchenMaterialId=sample.id;
  material.userData.kitchenMaterialKind=sample.kind;
  if(typeof document==='undefined')return material;
  let disposed=false;
  material.addEventListener('dispose',()=>{disposed=true;});
  loadSource(sample.image).then(source=>{
    if(disposed)return;
    const texture=source.clone();
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.MirroredRepeatWrapping;
    texture.anisotropy=4;
    texture.needsUpdate=true;
    material.map=texture;
    material.color.set('#ffffff');
    material.needsUpdate=true;
  }).catch(()=>{ /* Keep the sample's base color if an image cannot load. */ });
  return material;
}

// Project in the kitchen's unmirrored coordinates so adjacent worktops share
// veining and drawer rows share vertical grain. Pattern scale is illustrative.
export function projectKitchenMaterialUVs(group){
  group.updateMatrixWorld(true);
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  group.traverse(object=>{
    if(!object.isMesh||!object.material.userData.kitchenMaterialId)return;
    const kind=object.material.userData.kitchenMaterialKind;
    const {position,normal:normals,uv}=object.geometry.attributes;
    normalMatrix.getNormalMatrix(object.matrixWorld);
    for(let i=0;i<position.count;i++){
      point.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld);
      if(kind==='countertop'){
        // A single planar projection also wraps the thin slab edges cleanly.
        uv.setXY(i,point.z/1.2,point.x/1.2);
      }else{
        normal.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix);
        const horizontal=Math.abs(normal.y)>Math.max(Math.abs(normal.x),Math.abs(normal.z));
        const side=Math.abs(normal.z)>Math.abs(normal.x);
        uv.setXY(i,(horizontal||!side?point.z:point.x)/.6,(horizontal?point.x:point.y)/1.2);
      }
    }
    uv.needsUpdate=true;
  });
}
