import {PLAN,kitchenRun} from './layout.js';

// Illustrative placement beside the blank wall at the living-facing end.
// Coordinates precede the home's mirror transform; no site clearance is implied.
export function kitchenFanPlacement(kitchen){
  const run=kitchenRun(kitchen);
  return {
    mount:[7.88,PLAN.height,5.38],
    target:[run.back-kitchen.depth-.22,1.25,5.88],
  };
}
