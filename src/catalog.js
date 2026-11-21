import {VINCENT_DINING} from './dining-products.js';
import {LIVING_PRODUCTS} from './living-products.js';
import {OFFICE_PRODUCTS} from './office-products.js';
import {LG_STYLER} from './styler-product.js';
import {L_SOFA} from './l-sofa-spec.js';

export const FURNITURE_CATALOG = [
  {type:'sofa',label:'Sofa',width:2.2,depth:.9,color:'#747674'},
  {type:L_SOFA.type,label:L_SOFA.label,width:L_SOFA.width,depth:L_SOFA.depth,color:L_SOFA.color},
  {type:'armchair',label:'Armchair',width:.82,depth:.85,color:'#c6ac8f'},
  {type:'coffee',label:'Coffee table',width:1.05,depth:.55,color:'#785b42'},
  ...LIVING_PRODUCTS.map(({type,label,width,depth,color})=>({type,label,width,depth,color})),
  {type:'dining',label:'Dining set',width:1.65,depth:1.45,color:'#705342'},
  {type:VINCENT_DINING.type,label:VINCENT_DINING.label,width:VINCENT_DINING.width,depth:VINCENT_DINING.depth,color:VINCENT_DINING.color},
  {type:'bed',label:'Double bed',width:1.6,depth:2,color:'#d1c8ba'},
  {type:'singlebed',label:'Single bed',width:1,depth:2,color:'#afb8b1'},
  {type:'desk',label:'Desk & chair',width:1.2,depth:.95,color:'#b28d60'},
  ...OFFICE_PRODUCTS.map(({type,label,width,depth,color})=>({type,label,width,depth,color})),
  {type:'wardrobe',label:'Wardrobe',width:1.6,depth:.6,color:'#b29170'},
  {type:LG_STYLER.type,label:LG_STYLER.label,width:LG_STYLER.width,depth:LG_STYLER.depth,color:LG_STYLER.color},
  {type:'console',label:'Media console',width:1.8,depth:.4,color:'#725744'},
  {type:'plant',label:'Indoor plant',width:.5,depth:.5,color:'#54745c'}
];
export const getCatalogItem = type => FURNITURE_CATALOG.find(item => item.type === type);
