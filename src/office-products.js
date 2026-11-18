export const OMNIDESK=Object.freeze({
  type:'omnidesk-classic',label:'Omnidesk Classic Wildwood · Small',
  width:1.22,depth:.76,height:.74,topThickness:.026,color:'#95653f',
  finish:'Pheasantwood · Black frame',
  url:'https://theomnidesk.com/products/classic-wildwood?desk=table-top-wildwood-straight-edge-small_42678804938921_43170103197865&cmb=advanced-cable-management-bar-copy_47064120262825',
  image:'./references/inspiration/omnidesk-classic.jpg',
});
export const OFFICE_CHAIR=Object.freeze({type:'office-chair',label:'Ergonomic office chair',width:.58,depth:.58,color:'#424a48'});
export const OFFICE_PRODUCTS=[OMNIDESK,OFFICE_CHAIR];
export const getOfficeProduct=type=>OFFICE_PRODUCTS.find(product=>product.type===type);

// A chair can tuck a little below this desk's open centre: its arms are below
// the 714 mm underside and its back remains in front of the desktop. Keep this
// exception narrow; walls, wardrobes, other desks and other chairs still block.
export function isTuckedOfficeChair(a,b){
  const desk=a.type===OMNIDESK.type?a:b.type===OMNIDESK.type?b:null;
  const chair=a.type===OFFICE_CHAIR.type?a:b.type===OFFICE_CHAIR.type?b:null;
  if(!desk||!chair)return false;
  if([desk,chair].some(item=>item.width!==undefined||item.depth!==undefined))return false;
  const angle=(desk.rotation??0)*Math.PI/180,dx=chair.x-desk.x,dz=chair.z-desk.z;
  const along=dx*Math.cos(angle)-dz*Math.sin(angle),front=dx*Math.sin(angle)+dz*Math.cos(angle);
  const facing=(((chair.rotation??0)-(desk.rotation??0))%360+360)%360;
  return Math.abs(facing-180)<1e-6&&Math.abs(along)<=.16+1e-9&&front>=.53-1e-9&&front<=.70+1e-9;
}
export function useOfficeProduct(item,type){
  const product=getOfficeProduct(type);
  if(!product)throw new Error('Choose an office product.');
  return {...item,type,label:product.label,color:product.color,variant:'classic'};
}
