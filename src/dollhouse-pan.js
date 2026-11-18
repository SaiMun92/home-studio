export const DOLLHOUSE_PAN_KEYS=new Set(['w','a','s','d']);

// Translate the camera and its orbit target together along the floor. Camera
// right remains well-defined even when looking almost vertically down.
export function panDollhouse(camera,target,keys,dt){
  const forward=Number(keys.has('w'))-Number(keys.has('s'));
  const sideways=Number(keys.has('d'))-Number(keys.has('a'));
  const inputLength=Math.hypot(forward,sideways);
  if(!inputLength||dt<=0)return false;
  camera.updateMatrixWorld();
  const matrix=camera.matrixWorld.elements;
  const rightLength=Math.hypot(matrix[0],matrix[2])||1;
  const rx=matrix[0]/rightLength,rz=matrix[2]/rightLength;
  const speed=2*Math.max(1,Math.min(8,camera.position.distanceTo(target)*.25));
  const step=speed*dt/inputLength;
  const dx=(rx*sideways+rz*forward)*step;
  const dz=(rz*sideways-rx*forward)*step;
  camera.position.x+=dx;camera.position.z+=dz;
  target.x+=dx;target.z+=dz;
  return true;
}
