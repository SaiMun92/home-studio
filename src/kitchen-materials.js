// Material IDs are portable design data; image paths are bundled with the app.
// Photo-derived colors and pattern scale are visual approximations.
export const KITCHEN_MATERIALS = [
  {id:'jamaica-walnut',name:'Jamaica Walnut',code:'DM 6451 W',kind:'laminate',color:'#83653d',roughness:.55},
  {id:'cinamon-poplar',name:'Cinnamon Poplar',code:'AK 6646 W',kind:'laminate',color:'#896739',roughness:.55},
  {id:'houston-ash',name:'Houston Ash',code:'PA 6972 W',kind:'laminate',color:'#5e4322',roughness:.55},
  {id:'bianco-dolomite',name:'Bianco Dolomite',code:'3S 3128',kind:'countertop',color:'#d2bf8d',roughness:.32},
  {id:'calcatta-pottoro-extra',name:'Calacatta Potoro Extra',code:'3S 3715',kind:'countertop',color:'#e3d1a9',roughness:.32},
].map(material=>Object.freeze({...material,image:'./materials/textures/'+material.id+'.jpg',swatch:'./materials/swatches/'+material.id+'.jpg'}));

export const KITCHEN_MATERIAL_FIELDS = {lowerMaterial:'laminate',upperMaterial:'laminate',counterMaterial:'countertop'};
export const getKitchenMaterial=(id,kind)=>KITCHEN_MATERIALS.find(material=>material.id===id&&(!kind||material.kind===kind));

// Choosing a custom color replaces the texture on just that kitchen surface.
export function setKitchenColor(kitchen,key,value){
  kitchen[key]=value;
  const materialKey={color:'lowerMaterial',upperColor:'upperMaterial',counterColor:'counterMaterial'}[key];
  if(materialKey)delete kitchen[materialKey];
}
