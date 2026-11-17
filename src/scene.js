import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {PLAN,ROOMS,WALLS,FIXTURES,kitchenRun,wallSegments,splitWallByRooms,wallSurfaceRooms,roomRegions,canPlace,canWalk} from './layout.js';
import {createFurniture,createKitchen,createBuiltInCabinets} from './objects.js';

const material=(color,roughness=.72)=>new THREE.MeshStandardMaterial({color,roughness});
function box(group,w,h,d,x,y,z,mat){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function floorTexture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
  if(kind==='wood'){
    c.fillStyle='#b78e5b';c.fillRect(0,0,512,512);
    for(let row=0;row<8;row++){
      const offset=row%2*128;
      for(let col=-1;col<3;col++){const x=col*256+offset;c.fillStyle=['#b98f5c','#be9867','#b48a58','#c19a69'][(row+col+8)%4];c.fillRect(x+1,row*64+1,254,62);
        c.strokeStyle='#876a4620';for(let k=0;k<7;k++){c.beginPath();c.moveTo(x+7,row*64+8+k*7);c.bezierCurveTo(x+100,row*64+3+k*7,x+140,row*64+15+k*7,x+244,row*64+8+k*7);c.stroke();}}
    }
  }else{
    const colors={tile:['#e8e4da','#ccc7ba'],dark:['#525654','#666b67'],bath:['#bdb6aa','#d1cbc0'],outdoor:['#b7b6ab','#96968c'],'wall-tile':['#ffffff','#d2d2ce']};
    const [base,line]=colors[kind]??colors.tile;c.fillStyle=base;c.fillRect(0,0,512,512);c.strokeStyle=line;c.lineWidth=2;
    for(let x=0;x<=512;x+=128){c.beginPath();c.moveTo(x,0);c.lineTo(x,512);c.stroke();c.beginPath();c.moveTo(0,x);c.lineTo(512,x);c.stroke();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
function labelSprite(text){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=88;const ctx=canvas.getContext('2d');
  ctx.font='500 38px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  const width=ctx.measureText(text.toUpperCase()).width+30;ctx.fillStyle='rgba(255,255,250,.78)';ctx.beginPath();ctx.roundRect((512-width)/2,15,width,55,8);ctx.fill();ctx.fillStyle='#4c5148';ctx.fillText(text.toUpperCase(),256,44);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(2.8,.48,1);sprite.renderOrder=10;return sprite;
}
function dispose(group){
  const materials=new Set();group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  const textures=new Set();materials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());group.clear();
}

export function createViewer(canvas,callbacks={}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#eeede7');
  const camera=new THREE.PerspectiveCamera(38,1,.08,130);camera.position.set(16,17,20);
  const topCamera=new THREE.OrthographicCamera(-9,9,9,-9,.1,100);topCamera.position.set(5.4,30,4.525);topCamera.up.set(0,0,-1);topCamera.lookAt(5.4,0,4.525);
  let activeCamera=camera;
  const controls=new OrbitControls(camera,canvas);controls.target.set(5.4,0,4.45);controls.enableDamping=true;controls.dampingFactor=.1;controls.maxPolarAngle=Math.PI/2-.08;controls.minDistance=3;controls.maxDistance=65;controls.update();
  scene.add(new THREE.HemisphereLight('#fff8e8','#c2c1b5',2.1));
  const sun=new THREE.DirectionalLight('#fff9ed',2.5);sun.position.set(-3,17,2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.5,far:45});sun.shadow.normalBias=.035;sun.shadow.bias=-.0003;scene.add(sun);
  const fill=new THREE.DirectionalLight('#dfeafa',.75);fill.position.set(16,9,12);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),material('#eeede7'));ground.rotation.x=-Math.PI/2;ground.position.y=-.27;ground.receiveShadow=true;scene.add(ground);
  const root=new THREE.Group(),architecture=new THREE.Group(),furnishings=new THREE.Group(),kitchenGroup=new THREE.Group(),ceilings=new THREE.Group(),labels=new THREE.Group();root.add(architecture,furnishings,kitchenGroup,ceilings);scene.add(root,labels);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const textures=Object.fromEntries(['tile','wood','dark','bath','outdoor','wall-tile'].map(k=>[k,floorTexture(k)]));
  let state,view='dollhouse',fullWalls=false,showCeiling=false,showLabels=true,selection=null,outline=null,drag=null,down=null,walkYaw=Math.PI,walkPitch=0,focusAnimation=null;
  const keys=new Set();const furnitureMap=new Map();
  const worldX=x=>state?.mirrored?PLAN.width-x:x;
  const localPoint=p=>root.worldToLocal(p.clone());
  function fitDollhouse(){
    const target=new THREE.Vector3(5.4,.3,4.525),direction=new THREE.Vector3(10.6,17,15.5).normalize();let distance=22;
    controls.target.copy(target);camera.up.set(0,1,0);camera.fov=38;camera.updateProjectionMatrix();
    for(let iteration=0;iteration<5;iteration++){
      camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld();let ratio=1;
      for(const x of [0,PLAN.width])for(const y of [0,2.7])for(const z of [0,PLAN.depth]){const p=new THREE.Vector3(x,y,z).project(camera);ratio=Math.max(ratio,Math.abs(p.x)/.86,Math.abs(p.y)/.62);}
      if(ratio<=1.001)break;distance*=ratio;
    }
    controls.update();
  }
  function resize(){const {width,height}=canvas.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();const aspect=width/height;const half=Math.max(6.5,6.1/aspect);topCamera.left=-half*aspect;topCamera.right=half*aspect;topCamera.top=half;topCamera.bottom=-half;topCamera.updateProjectionMatrix();if(view==='dollhouse')fitDollhouse();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  function addFixtures(){
    architecture.add(createBuiltInCabinets());
    const white=material('#f3f2eb',.25),metal=material('#b7bbb7',.28),dark=material('#282d2b');
    for(const r of ROOMS.filter(r=>r.floor==='bath')){const [x1,z1,x2,z2]=r.bounds;
      const toilet=new THREE.Mesh(new THREE.CylinderGeometry(.21,.16,.39,24),white);toilet.position.set(x1+.45,.25,z1+1.12);toilet.scale.z=1.35;toilet.castShadow=true;architecture.add(toilet);box(architecture,.43,.62,.18,x1+.45,.36,z1+.83,white);
      box(architecture,.55,.78,.43,x1+.4,.39,z1+.27,material('#b29d80'));box(architecture,.59,.08,.46,x1+.4,.82,z1+.27,white);
      box(architecture,Math.min(x2-x1-.12,1.05),.1,.85,(x1+x2)/2,.06,z2-.48,white);
      const glass=new THREE.MeshStandardMaterial({color:'#c5e1df',transparent:true,opacity:.18,roughness:.2,depthWrite:false});box(architecture,x2-x1-.1,1.9,.025,(x1+x2)/2,.98,z2-.94,glass);
    }
    // Rear appliances face the galley, with the fridge beside the wall step.
    const fixtureBox=(id,height,y,mat)=>{const f=FIXTURES.find(f=>f.id===id);return box(architecture,f.width,height,f.depth,f.x,y,f.z,mat);};
    fixtureBox('yard-fridge',1.87,.94,white);fixtureBox('yard-fridge-trim',.035,1.1,metal);fixtureBox('yard-fridge-handle',.45,1.45,metal);
    fixtureBox('yard-washer',1.72,.86,white);
    for(const y of [.44,1.27])for(const id of ['yard-washer-door','yard-washer-door-inner']){const f=FIXTURES.find(f=>f.id===id);const door=new THREE.Mesh(new THREE.CylinderGeometry(f.width/2,f.width/2,f.depth,30),id.endsWith('inner')?metal:dark);door.rotation.x=Math.PI/2;door.position.set(f.x,y,f.z);architecture.add(door);}
    // Planter and restrained greenery visible behind the living windows.
    box(architecture,4.9,.2,.68,8.1,.14,.55,material('#747c65'));
    for(let i=0;i<12;i++){const plant=new THREE.Mesh(new THREE.IcosahedronGeometry(.19,1),material(i%2?'#6c7e54':'#8a956a'));plant.position.set(5.9+i*.4,.39,.52);plant.scale.y=1.5;plant.castShadow=true;architecture.add(plant);}
    // Narrow kitchen splashback and living window mullions.
    const run=kitchenRun(state.kitchen);
    if(run.upperLength>.001)box(architecture,.025,.6,run.upperLength,run.back-.013,state.kitchen.height+.34,(run.upperStart+run.end)/2,material('#ab6844',.26));
    if(fullWalls||view==='walk'){
      for(let i=0;i<8;i++)box(architecture,.032,2.3,.04,5.72+i*.69,1.3,1.08,metal);
    }
  }
  function buildArchitecture(){
    dispose(architecture);dispose(ceilings);
    const height=fullWalls||view==='walk'?PLAN.height:.72;
    const slabShape=new THREE.Shape();[[0,0],[10.8,0],[10.8,9.05],[6,9.05],[6,8.2],[3.55,8.2],[3.55,7.1],[2.16,7.1],[2.16,8.4],[0,8.4]].forEach(([x,z],i)=>i?slabShape.lineTo(x,-z):slabShape.moveTo(x,-z));slabShape.closePath();
    const slab=new THREE.Mesh(new THREE.ExtrudeGeometry(slabShape,{depth:.22,bevelEnabled:false}),material('#dedbd0'));slab.rotation.x=-Math.PI/2;slab.position.y=-.22;slab.receiveShadow=true;architecture.add(slab);
    for(const r of ROOMS)for(const [x1,z1,x2,z2] of roomRegions(r)){const w=x2-x1,d=z2-z1;const texture=textures[r.floor].clone();texture.needsUpdate=true;texture.repeat.set(w/2.4,d/2.4);const mat=material('#ffffff',r.floor==='tile'?.3:.7);mat.map=texture;
      const floor=box(architecture,w,.035,d,(x1+x2)/2,.005,(z1+z2)/2,mat);floor.userData.roomId=r.id;
      if(r.walkable)box(ceilings,w,.08,d,(x1+x2)/2,PLAN.height+.04,(z1+z2)/2,material('#faf8ef'));
    }
    ceilings.visible=showCeiling;
    for(const wall of WALLS){for(const s of wallSegments(wall,height).flatMap(splitWallByRooms)){
      const surfaceRooms=wallSurfaceRooms(s),mats=surfaceRooms.map((id,index)=>material(index===2?'#fbf9f1':state.wallColors[id]??'#e3dfd4'));
      if(wall.finish==='wall-tile')mats.forEach((mat,index)=>{if(index===2||index===3)return;const texture=textures['wall-tile'].clone();texture.repeat.set((index<2?s.depth:s.width)/2.4,s.height/1.2);texture.needsUpdate=true;mat.map=texture;mat.roughness=.35;});
      const mesh=box(architecture,s.width,s.height,s.depth,s.x,s.y,s.z,mats);mesh.userData.roomId=s.room;mesh.userData.surfaceRooms=surfaceRooms;mesh.userData.wallId=wall.id;
      if(s.y-s.height/2<.05){const skirting=box(architecture,s.width+.014,.055,s.depth+.014,s.x,.045,s.z,material('#b6ad9d'));skirting.userData.roomId=s.room;}
    }}
    addFixtures();
  }
  function rebuildLabels(){for(const sprite of labels.children){sprite.material.map?.dispose();sprite.material.dispose();}labels.clear();for(const r of ROOMS.filter(r=>r.walkable&&r.id!=='hall')){const s=labelSprite(r.name),bounds=roomRegions(r)[0];s.position.set(worldX((bounds[0]+bounds[2])/2),.12,(bounds[1]+bounds[3])/2);labels.add(s);}labels.visible=showLabels&&view!=='walk';}
  function setState(next){
    state=next;root.scale.x=state.mirrored?-1:1;root.position.x=state.mirrored?PLAN.width:0;
    buildArchitecture();dispose(furnishings);dispose(kitchenGroup);furnitureMap.clear();
    for(const item of state.furniture){const object=createFurniture(item);furnishings.add(object);furnitureMap.set(item.id,object);}
    kitchenGroup.add(createKitchen(state.kitchen));root.updateMatrixWorld(true);rebuildLabels();setSelected(selection);
  }
  function setSelected(id){selection=id;if(outline){scene.remove(outline);outline.geometry.dispose();outline.material.dispose();outline=null;}const object=furnitureMap.get(id);if(object){root.updateMatrixWorld(true);outline=new THREE.BoxHelper(object,'#607c51');outline.material.depthTest=false;outline.material.transparent=true;outline.material.opacity=.9;outline.renderOrder=9;scene.add(outline);}}
  function setView(mode){
    view=mode;focusAnimation=null;keys.clear();controls.enabled=mode==='dollhouse';activeCamera=mode==='top'?topCamera:camera;
    if(mode==='walk'){camera.fov=65;camera.updateProjectionMatrix();camera.position.set(worldX(9.8),1.62,8.4);walkYaw=0;walkPitch=-.03;updateWalkLook();}
    else if(mode==='dollhouse')fitDollhouse();
    else if(mode==='top'){topCamera.zoom=1;topCamera.position.set(5.4,30,4.525);topCamera.lookAt(5.4,0,4.525);}
    buildArchitecture();rebuildLabels();resize();callbacks.onView?.(mode);
  }
  function focusRoom(id){const r=ROOMS.find(r=>r.id===id);if(!r)return;const x=worldX((r.bounds[0]+r.bounds[2])/2),z=(r.bounds[1]+r.bounds[3])/2;
    if(view==='walk'){
      const localX=(r.bounds[0]+r.bounds[2])/2,localZ=(r.bounds[1]+r.bounds[3])/2;let candidate=canWalk(localX,localZ,.18,state)?[localX,localZ]:null;
      if(!candidate){const options=[];for(const [x1,z1,x2,z2] of roomRegions(r))for(let px=x1+.23;px<x2-.2;px+=.12)for(let pz=z1+.23;pz<z2-.2;pz+=.12)if(canWalk(px,pz,.18,state))options.push([px,pz]);options.sort((a,b)=>Math.hypot(a[0]-localX,a[1]-localZ)-Math.hypot(b[0]-localX,b[1]-localZ));candidate=options[0];}
      if(candidate)camera.position.set(worldX(candidate[0]),1.62,candidate[1]);walkYaw=0;updateWalkLook();return;
    }
    if(view==='top'){topCamera.position.set(x,30,z);topCamera.lookAt(x,0,z);return;}
    focusAnimation={from:camera.position.clone(),targetFrom:controls.target.clone(),to:new THREE.Vector3(x+4.8,7.7,z+6.5),target:new THREE.Vector3(x,.2,z),start:performance.now()};
  }
  function coords(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,activeCamera);}
  function pick(event){coords(event);for(const hit of raycaster.intersectObjects([furnishings,kitchenGroup,architecture],true)){let object=hit.object;while(object&&object!==root){if(object.userData.furnitureId)return {kind:'furniture',id:object.userData.furnitureId};if(object.userData.cabinetId)return {kind:'cabinet',id:object.userData.cabinetId};if(object.userData.kitchenInfill)return {kind:'kitchen'};if(object.userData.roomId)return {kind:'room',id:object.userData.surfaceRooms?.[hit.face?.materialIndex]??object.userData.roomId};object=object.parent;}}return null;}
  function floorPoint(event){coords(event);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(plane,p)?localPoint(p):null;}
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;canvas.focus();focusAnimation=null;const hit=pick(event);down={x:event.clientX,y:event.clientY,hit};
    if(view!=='walk'&&hit?.kind==='furniture'){const item=state.furniture.find(f=>f.id===hit.id);const p=floorPoint(event);if(p){drag={id:item.id,start:{...item},offset:{x:item.x-p.x,z:item.z-p.z},last:{...item},moved:false};controls.enabled=false;canvas.setPointerCapture(event.pointerId);}}
    if(view==='walk')canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(view==='walk'&&down){walkYaw-=(event.clientX-down.x)*.004;walkPitch=Math.max(-1.1,Math.min(1.1,walkPitch-(event.clientY-down.y)*.004));down.x=event.clientX;down.y=event.clientY;updateWalkLook();return;}
    if(drag){const p=floorPoint(event);if(!p)return;const candidate={...drag.start,x:Math.round((p.x+drag.offset.x)*20)/20,z:Math.round((p.z+drag.offset.z)*20)/20};const result=canPlace(candidate,state.furniture,state.kitchen);
      if(Math.hypot(event.clientX-down.x,event.clientY-down.y)>4)drag.moved=true;
      if(result.ok){drag.last=candidate;furnitureMap.get(drag.id).position.set(candidate.x,0,candidate.z);outline?.update();canvas.style.cursor='grabbing';}else canvas.style.cursor='not-allowed';
    }else{const hit=pick(event);canvas.style.cursor=hit?.kind==='furniture'?'grab':hit?'pointer':'default';}
  });
  function finishPointer(event,cancelled=false){if(drag){const completed=drag;drag=null;controls.enabled=view==='dollhouse';if(completed.moved&&!cancelled)callbacks.onMove?.(completed.id,completed.last.x,completed.last.z);else{furnitureMap.get(completed.id)?.position.set(completed.start.x,0,completed.start.z);if(!cancelled)callbacks.onSelect?.('furniture',completed.id);}}else if(down&&view!=='walk'&&Math.hypot(event.clientX-down.x,event.clientY-down.y)<5&&down.hit)callbacks.onSelect?.(down.hit.kind,down.hit.id);down=null;canvas.style.cursor='default';if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}
  canvas.addEventListener('pointerup',event=>finishPointer(event));canvas.addEventListener('pointercancel',event=>finishPointer(event,true));
  function updateWalkLook(){camera.rotation.order='YXZ';camera.rotation.set(walkPitch,walkYaw,0);}
  const editable=target=>target instanceof HTMLElement&&(target.matches('input,select,textarea,button')||target.isContentEditable);
  window.addEventListener('keydown',event=>{if(editable(event.target))return;if(view==='walk'&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(event.key.toLowerCase())){event.preventDefault();keys.add(event.key.toLowerCase());}});
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  let last=performance.now();
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
    if(focusAnimation){const f=focusAnimation,t=Math.min(1,(now-f.start)/650),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(f.from,f.to,ease);controls.target.lerpVectors(f.targetFrom,f.target,ease);if(t===1)focusAnimation=null;}
    if(view==='walk'){let f=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),r=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const n=Math.hypot(f,r)||1;f/=n;r/=n;const dx=(-Math.sin(walkYaw)*f+Math.cos(walkYaw)*r)*dt*1.65,dz=(-Math.cos(walkYaw)*f-Math.sin(walkYaw)*r)*dt*1.65;const can=(x,z)=>canWalk(state.mirrored?PLAN.width-x:x,z,.18,state);if(can(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(can(camera.position.x,camera.position.z+dz))camera.position.z+=dz;callbacks.onWalkPosition?.(state.mirrored?PLAN.width-camera.position.x:camera.position.x,camera.position.z);}
    else if(view==='dollhouse')controls.update();
    if(labels.visible){for(const label of labels.children){const worldHeight=activeCamera.isOrthographicCamera?(activeCamera.top-activeCamera.bottom)/activeCamera.zoom:2*Math.tan(THREE.MathUtils.degToRad(activeCamera.fov/2))*activeCamera.position.distanceTo(label.position);const spriteHeight=9*worldHeight/(Math.max(canvas.clientHeight,1)*(38/88));label.scale.set(spriteHeight*512/88,spriteHeight,1);}}
    renderer.render(scene,activeCamera);
  }
  resize();requestAnimationFrame(animate);
  return {setState,setSelected,setView,focusRoom,setWalkInput(key,active){if(active&&view==='walk')keys.add(key);else keys.delete(key);},setWalls(value){fullWalls=value;buildArchitecture();},setCeiling(value){showCeiling=value;ceilings.visible=value;},setLabels(value){showLabels=value;labels.visible=value&&view!=='walk';},zoom(delta){if(view==='walk')return;if(view==='top'){topCamera.zoom=Math.max(.6,Math.min(3,topCamera.zoom+delta*.2));topCamera.updateProjectionMatrix();}else{const dir=camera.position.clone().sub(controls.target);dir.multiplyScalar(delta>0?.85:1.18);camera.position.copy(controls.target).add(dir);}},screenshot(){renderer.render(scene,activeCamera);return canvas.toDataURL('image/png');},get view(){return view;},get renderer(){return renderer;},getSceneStats(){return {furnitureCount:furnitureMap.size,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};}};
}
