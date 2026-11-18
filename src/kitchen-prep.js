// Split an existing wide sink bay without moving either adjacent appliance.
// A 700 mm bay retains the reference 530 mm cutout and 553 mm sink rim.
export function kitchenPrepModules(kitchen){
  const index=kitchen.modules.findIndex((module,i)=>module.type==='sink'&&module.width>=1&&
    kitchen.modules[i-1]?.type==='dishwasher'&&kitchen.modules[i+1]?.type==='hob');
  if(index<0||kitchen.modules.length>=8)return null;
  const modules=kitchen.modules.map(module=>({...module}));
  let number=1;while(modules.some(module=>module.id==='prep-'+number))number++;
  const width=modules[index].width;
  modules[index].width=.7;
  modules.splice(index+1,0,{id:'prep-'+number,type:'drawers',width:width-.7,storage:'prep'});
  return modules;
}
