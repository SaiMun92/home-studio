import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {LG_STYLER} from './styler-product.js';

function box(parent,name,width,height,depth,material,x=0,y=0,z=0,radius=.004){
  const geometry=new RoundedBoxGeometry(width,height,depth,4,Math.min(radius,width*.4,height*.4,depth*.4));
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,y,z);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

let mirrorPixels;
function mirrorAppearance(){
  const width=256,height=1024;
  if(!mirrorPixels){
    const pixels=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const u=x/(width-1),v=y/(height-1);
      // The selected reference has a pale upper reflection fading to charcoal
      // below. Soft vertical bands suggest glass without claiming live reflection.
      const gradient=.23+.75*Math.pow(v,.80);
      const band=.026*Math.exp(-Math.pow((u-.23-v*.13)/.19,2));
      const edge=-.025*Math.pow(Math.abs(u-.5)*2,8);
      const value=Math.round(THREE.MathUtils.clamp(gradient+band+edge,0,1)*255),i=(y*width+x)*4;
      pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
    }
    const ink=(x,y,opacity=.26)=>{
      if(x<0||x>=width||y<0||y>=height)return;
      const i=(Math.round(y)*width+Math.round(x))*4;
      for(let c=0;c<3;c++)pixels[i+c]=Math.round(pixels[i+c]*(1-opacity)+248*opacity);
    };
    const line=(x1,y1,x2,y2,opacity=.26)=>{
      const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1),1);
      for(let i=0;i<=steps;i++)ink(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,opacity);
    };
    // Small printed LG mark high on the glass; the touch panel stays subtle.
    for(let step=0;step<50;step++){
      const a=step/50*Math.PI*2;
      ink(213+4*Math.cos(a),1001+4*Math.sin(a),.42);
    }
    line(212,1003,212,998,.42);line(212,998,215,998,.42);
    line(222,1005,222,997,.42);line(222,997,227,997,.42);
    line(235,1004,230,1004,.42);line(230,1004,230,997,.42);
    line(230,997,235,997,.42);line(235,997,235,1001,.42);line(235,1001,232,1001,.42);
    // Printed program marks and a dormant segmented display, not an active UI.
    for(let row=0;row<4;row++){
      const y=719-row*9;
      line(86,y,93,y);line(99,y,115+(row%2)*4,y);
      line(123,y,137+(row%3)*2,y);
    }
    for(const x of [153,165]){
      for(const y of [720,710,700])line(x,y,x+7,y,.30);
      for(const dx of [0,7]){line(x+dx,718,x+dx,712,.30);line(x+dx,708,x+dx,702,.30);}
    }
    for(const x of [88,112,139,165])line(x,678,x+8,678,.24);
    mirrorPixels=pixels;
  }
  // Each instance owns a texture so replacing one piece cannot dispose a copy.
  const map=new THREE.DataTexture(mirrorPixels,width,height,THREE.RGBAFormat);
  map.name='LG Styler mirror appearance and touch markings';map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;return map;
}

// Published exterior dimensions; trim, plinth and controls follow the supplied
// closed-door product photograph. Faces +Z and stays inside its full footprint.
export function createLgStyler(parent,color=LG_STYLER.color){
  const group=new THREE.Group();group.name='LG Styler S3MFC · mirrored finish';
  group.userData.lgStyler=true;parent.add(group);
  const shell=new THREE.MeshStandardMaterial({color,roughness:.31,metalness:.20});
  const trim=new THREE.MeshStandardMaterial({color:'#bfc4c4',roughness:.22,metalness:.62});
  const dark=new THREE.MeshStandardMaterial({color:'#353c3c',roughness:.53,metalness:.15});
  const seal=new THREE.MeshStandardMaterial({color:'#6b7474',roughness:.48,metalness:.12});
  const glass=new THREE.MeshStandardMaterial({color,map:mirrorAppearance(),roughness:.14,metalness:.12});
  glass.userData.furnitureFinish='lg-styler-mirrored-glass';
  const {width,depth,height}=LG_STYLER;
  // The body reaches the published rear and top. The front glass/trim provide
  // the final 17 mm of depth; neither handles nor control geometry protrude.
  box(group,'Styler silver cabinet',width,height-.030,depth-.017,shell,
    0,(height+.030)/2,-.0085,.010);
  box(group,'Styler recessed dark plinth',width-.025,.033,depth-.025,dark,
    0,.0165,-.004,.003);
  box(group,'Styler door gasket',width-.004,height-.055,.014,seal,
    0,(height+.025)/2,depth/2-.022,.006);
  box(group,'Styler silver door surround',width-.009,height-.061,.022,trim,
    0,(height+.026)/2,depth/2-.013,.008);
  const front=box(group,'Styler mirrored glass door',width-.034,height-.076,.003,glass,
    0,(height+.030)/2,depth/2-.0015,.001);
  // RoundedBoxGeometry divides UVs by face. Project the front over its whole
  // height so the photographed gradient and small markings retain proportions.
  const {position,uv}=front.geometry.attributes;
  for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/(width-.034)+.5,position.getY(i)/(height-.076)+.5);
  box(group,'Styler lower silver toe trim',width-.012,.009,.012,trim,
    0,.009,depth/2-.010,.002);
  return group;
}
