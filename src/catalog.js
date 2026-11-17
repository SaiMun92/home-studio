export const FURNITURE_CATALOG = [
  {type:'sofa',label:'Sofa',width:2.2,depth:.9,color:'#747674'},
  {type:'armchair',label:'Armchair',width:.82,depth:.85,color:'#c6ac8f'},
  {type:'coffee',label:'Coffee table',width:1.05,depth:.55,color:'#785b42'},
  {type:'dining',label:'Dining set',width:1.65,depth:1.45,color:'#705342'},
  {type:'bed',label:'Double bed',width:1.6,depth:2,color:'#d1c8ba'},
  {type:'singlebed',label:'Single bed',width:1,depth:2,color:'#afb8b1'},
  {type:'desk',label:'Desk & chair',width:1.2,depth:.95,color:'#b28d60'},
  {type:'wardrobe',label:'Wardrobe',width:1.6,depth:.6,color:'#b29170'},
  {type:'console',label:'Media console',width:1.8,depth:.4,color:'#725744'},
  {type:'plant',label:'Indoor plant',width:.5,depth:.5,color:'#54745c'}
];
export const getCatalogItem = type => FURNITURE_CATALOG.find(item => item.type === type);
