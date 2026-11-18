import {KITCHEN_RUN, WALLS} from './layout.js';

export const UPPER_CABINET_DEPTH = .34;
export const UPPER_DOOR_OFFSET = .012;

// The door swing must stay inside the short tiled return beside the fridge.
// Allow room for the door thickness and handles at the hinges as well as
// alignment at the free edge. These use the existing estimated wall model.
export function endUpperDoorPlan(count = 2) {
  const wall = WALLS.find(wall => wall.id === 'kitchen-end-projection');
  const wallEdge = Math.min(wall.a[0], wall.b[0]);
  const frontX = KITCHEN_RUN.back - UPPER_CABINET_DEPTH - UPPER_DOOR_OFFSET;
  const hingeInset = .045, gap = .009;
  const leafWidth = frontX - wallEdge;
  const width = count * leafWidth + hingeInset * 2 + gap * (count - 1);
  return {wallEdge, frontX, hingeInset, gap, count, leafWidth, width};
}

export function endUpperLayout(kitchen, modules, run) {
  if (!kitchen.endUpperDoors || kitchen.upper === false) return null;
  let available = 0, cursor = run.end;
  for (const module of modules.slice().reverse()) {
    const start = cursor - module.width;
    if (module.type === 'hob' || module.type === 'pantry' || start < run.upperStart - 1e-9) break;
    available += module.width;cursor = start;
  }
  for (const count of [2, 1]) {
    const plan = endUpperDoorPlan(count);
    if (plan.width <= available + 1e-9) return {...plan, start:run.end - plan.width, end:run.end};
  }
  return null;
}
