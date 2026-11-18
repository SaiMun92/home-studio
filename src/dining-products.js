// Castlery's selected 150 cm variant; table dimensions are published, while
// the matching chairs and their tucked-in placement remain visual estimates.
export const VINCENT_DINING = Object.freeze({
  type:'vincent-dining',label:'Vincent dining set · 150 cm',color:'#896447',
  width:1.60,depth:1.90,
  tableWidth:1.50,tableDepth:.80,tableHeight:.76,topThickness:.04,
  seats:4,sku:'41960028',
  url:'https://www.castlery.com/sg/products/vincent-dining-table-walnut?length=1_5m',
  image:'./references/inspiration/vincent-dining.jpg',
});

export function useVincentDining(item){
  return {...item,type:VINCENT_DINING.type,label:VINCENT_DINING.label,
    color:VINCENT_DINING.color,variant:'classic'};
}
