export const SOLANGE_CHAIR=Object.freeze({
  type:'solange-chair',label:'Solange bouclé chair',width:.68,depth:.77,height:.75,seatHeight:.42,
  color:'#e7e2d7',woodColor:'#b5a17b',sku:'54000102-CB4001',
  finish:'Chalk Bouclé · White Wash',
  url:'https://www.castlery.com/sg/products/solange-performance-boucle-chair?material=chalk_boucle&quantity=single&wood=white_wash',
  image:'./references/inspiration/solange-chair.jpg',
});

export const VERONICA_COFFEE=Object.freeze({
  type:'veronica-coffee',label:'Veronica coffee table · Sand',width:.70,depth:.70,height:.34,
  color:'#cbbba1',sku:'185648',finish:'Sand concrete',
  url:'https://www.hipvan.com/products/veronica-concrete-round-coffee-table-sand',
  image:'./references/inspiration/veronica-coffee.jpg',
});

export const LIVING_PRODUCTS=[SOLANGE_CHAIR,VERONICA_COFFEE];
export const getLivingProduct=type=>LIVING_PRODUCTS.find(product=>product.type===type);

export function useLivingProduct(item,type){
  const product=getLivingProduct(type);
  if(!product)throw new Error('Choose a living-room product.');
  return {...item,type:product.type,label:product.label,color:product.color,variant:'classic'};
}
