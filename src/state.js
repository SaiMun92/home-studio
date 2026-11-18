import { FURNITURE_CATALOG } from './catalog.js';
import { ROOMS, KITCHEN_RUN_LENGTH, BUILT_IN_CABINETS } from './layout.js';
import { KITCHEN_MATERIALS, KITCHEN_MATERIAL_FIELDS } from './kitchen-materials.js';
import { KITCHEN_STORAGE, KITCHEN_STORAGE_TYPES } from './kitchen-storage.js';

const PAINTABLE_ROOMS = ROOMS.filter(room => room.walkable);
const ROOM_IDS = PAINTABLE_ROOMS.map(room => room.id);
const CABINET_TYPES = new Set(['doors', 'drawers', 'sink', 'hob', 'dishwasher', 'pantry']);
const CABINET_STYLES = new Set(['flat', 'shaker', 'slatted']);
const FURNITURE_VARIANTS = new Set(['classic', 'modern']);
const YARD_LAUNDRY_LAYOUTS = new Set(['stacked', 'combo-tower']);
const CATALOG = new Map(FURNITURE_CATALOG.map(item => [item.type, item]));
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const MAX_HISTORY = 100;
const ORIGINAL_YARD_COLOR = BUILT_IN_CABINETS.find(cabinet => cabinet.id === 'yard-tv-cabinet').color;
export const ORIGINAL_BACKSPLASH_COLOR = '#ab6844';

export function createDefaultState() {
  const placements = [
    ['sofa-1', 'sofa', 8.1, 2.8, 90],
    ['coffee-1', 'coffee', 9.0, 2.8, 90],
    ['console-1', 'console', 10.35, 2.8, 90],
    ['dining-1', 'dining', 6.48, 2.2, 0],
    ['bed-1', 'bed', 1.2, 2.3, -90],
    ['wardrobe-1', 'wardrobe', 0.45, 4.3, 90],
    ['singlebed-1', 'singlebed', 4.05, 1.25, 90],
    ['wardrobe-2', 'wardrobe', 3.8, 3.0, 0],
    ['desk-1', 'desk', 2.85, 6.1, 90],
    ['plant-1', 'plant', 10.15, 1.5, 0],
  ];
  return {
    version: 1,
    mirrored: true,
    yardCabinetColor: ORIGINAL_YARD_COLOR,
    wallColors: Object.fromEntries(PAINTABLE_ROOMS.map(room => [room.id, room.floor === 'bath' ? '#e3ded3' : '#eeeae2'])),
    kitchen: {
      color: '#c76530',
      upperColor: '#f0eee7',
      counterColor: '#ece8df',
      backsplashColor: ORIGINAL_BACKSPLASH_COLOR,
      style: 'flat',
      depth: 0.6,
      height: 0.86,
      upper: true,
      modules: [
        { id: 'cab-1', type: 'drawers', width: 0.6 },
        { id: 'cab-2', type: 'dishwasher', width: 0.6 },
        { id: 'cab-3', type: 'sink', width: 0.8 },
        { id: 'cab-4', type: 'hob', width: 0.6 },
        { id: 'cab-5', type: 'doors', width: 0.6 },
      ],
    },
    furniture: placements.map(([id, type, x, z, rotation]) => ({
      id, type, label: CATALOG.get(type).label, x, z, rotation,
      color: CATALOG.get(type).color, variant: 'classic', mirrored: false,
    })),
  };
}

function record(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${name} must be a plain object.`);
  }
  return value;
}

// Read only own data properties. Import validation never invokes accessors.
function field(value, key, name, optional = false) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) {
    if (optional) return undefined;
    throw new Error(`${name} is required.`);
  }
  if (!Object.hasOwn(descriptor, 'value')) {
    throw new Error(`${name} must contain a plain value.`);
  }
  return descriptor.value;
}

function color(value, name) {
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) {
    throw new Error(`${name} must be a color in #RRGGBB format.`);
  }
  return value.toLowerCase();
}

function numberInRange(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a finite number between ${min} and ${max}.`);
  }
  return value;
}

function supported(value, choices, name) {
  if (typeof value !== 'string' || !choices.has(value)) {
    throw new Error(`${name} is not supported.`);
  }
  return value;
}

function itemId(value, ids, name) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value) || value === 'constructor' || value === 'prototype') {
    throw new Error(`${name} must be 1–80 letters, numbers, hyphens or underscores, starting with a letter or number.`);
  }
  if (ids.has(value)) throw new Error(`${name} must be unique; duplicate id found.`);
  ids.add(value);
  return value;
}

function list(value, name, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`${name} must contain between ${min} and ${max} items.`);
  }
  return value;
}

export function validateDesign(input) {
  const design = record(input, 'Design');
  if (field(design, 'version', 'Design version') !== 1) {
    throw new Error('Design version must be 1.');
  }
  let title;
  if (Object.hasOwn(design, 'title')) {
    title = field(design, 'title', 'Design title');
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 80 || /[<>\u0000-\u001f\u007f]/.test(title)) {
      throw new Error('Design title must be 1–80 characters of plain text.');
    }
    title = title.trim();
  }
  const mirrored = field(design, 'mirrored', 'Home mirrored orientation', true);
  if (mirrored !== undefined && typeof mirrored !== 'boolean') {
    throw new Error('Home mirrored orientation must be true or false.');
  }
  // Old v1 designs omitted this finish. Only an absent field receives the
  // original color; a present invalid value or accessor remains an error.
  const yardCabinetColor = Object.hasOwn(design, 'yardCabinetColor')
    ? color(field(design, 'yardCabinetColor', 'Yard cabinet color'), 'Yard cabinet color')
    : ORIGINAL_YARD_COLOR;
  // An omitted plan keeps the reference fridge and stacked laundry. Do not
  // add designer carpentry to older working designs or saved snapshots.
  let yard;
  if (Object.hasOwn(design, 'yard')) {
    const suppliedYard = record(field(design, 'yard', 'Yard plan'), 'Yard plan');
    const fridgeSurround = field(suppliedYard, 'fridgeSurround', 'Yard fridge surround');
    if (typeof fridgeSurround !== 'boolean') throw new Error('Yard fridge surround must be true or false.');
    yard = {
      fridgeSurround,
      laundry: supported(field(suppliedYard, 'laundry', 'Yard laundry arrangement'), YARD_LAUNDRY_LAYOUTS, 'Yard laundry arrangement'),
    };
    for (const [key,model] of [['fridgeModel','panasonic-nr-f603gt-ss'],['laundryModel','lg-fv1413h2ba']]) {
      if (Object.hasOwn(suppliedYard,key)) yard[key]=supported(field(suppliedYard,key,`Yard ${key}`),new Set([model]),`Yard ${key}`);
    }
  }

  const rooms = record(field(design, 'wallColors', 'Room wall colors'), 'Room wall colors');
  const suppliedRooms = Object.keys(rooms);
  if (suppliedRooms.length !== ROOM_IDS.length || suppliedRooms.some(id => !ROOM_IDS.includes(id))) {
    throw new Error('Wall colors must include exactly the supported rooms.');
  }
  const wallColors = Object.fromEntries(ROOM_IDS.map(id => [id, color(field(rooms, id, `${id} wall color`), `${id} wall color`)]));

  const cabinets = record(field(design, 'kitchen', 'Kitchen'), 'Kitchen');
  const upper = field(cabinets, 'upper', 'Kitchen upper cabinets');
  if (typeof upper !== 'boolean') throw new Error('Kitchen upper cabinets must be true or false.');
  const cabinetIds = new Set();
  const modules = Array.from(list(field(cabinets, 'modules', 'Kitchen modules'), 'Kitchen modules', 1, 8), (value, index) => {
    const name = `Kitchen module ${index + 1}`;
    const module = record(value, name);
    const normalized = {
      id: itemId(field(module, 'id', `${name} id`), cabinetIds, `${name} id`),
      type: supported(field(module, 'type', `${name} type`), CABINET_TYPES, `${name} type`),
      width: numberInRange(field(module, 'width', `${name} width`), `${name} width`, 0.3, 1.2),
    };
    if (Object.hasOwn(module, 'storage')) {
      const storage = supported(field(module, 'storage', `${name} storage`), new Set(Object.keys(KITCHEN_STORAGE)), `${name} storage`);
      if (!KITCHEN_STORAGE_TYPES[storage].includes(normalized.type)) {
        throw new Error(`${name} storage does not fit this cabinet type.`);
      }
      normalized.storage = storage;
    }
    return normalized;
  });
  if (modules.reduce((total, module) => total + module.width, 0) > KITCHEN_RUN_LENGTH + 1e-9) {
    throw new Error(`Kitchen module widths must total ${KITCHEN_RUN_LENGTH.toFixed(1)} metres or less.`);
  }
  const kitchen = {
    color: color(field(cabinets, 'color', 'Kitchen color'), 'Kitchen color'),
    upperColor: color(field(cabinets, 'upperColor', 'Kitchen upper color'), 'Kitchen upper color'),
    counterColor: color(field(cabinets, 'counterColor', 'Kitchen counter color'), 'Kitchen counter color'),
    backsplashColor: Object.hasOwn(cabinets,'backsplashColor')
      ? color(field(cabinets,'backsplashColor','Kitchen backsplash color'),'Kitchen backsplash color')
      : ORIGINAL_BACKSPLASH_COLOR,
    style: supported(field(cabinets, 'style', 'Kitchen style'), CABINET_STYLES, 'Kitchen style'),
    depth: numberInRange(field(cabinets, 'depth', 'Kitchen depth'), 'Kitchen depth', 0.45, 0.75),
    height: numberInRange(field(cabinets, 'height', 'Kitchen height'), 'Kitchen height', 0.72, 1.02),
    upper, modules,
  };
  if (Object.hasOwn(cabinets, 'taskLighting')) {
    const taskLighting = field(cabinets, 'taskLighting', 'Kitchen task lighting');
    if (typeof taskLighting !== 'boolean') throw new Error('Kitchen task lighting must be true or false.');
    kitchen.taskLighting = taskLighting;
  }
  if (Object.hasOwn(cabinets, 'endUpperDoors')) {
    kitchen.endUpperDoors = supported(field(cabinets, 'endUpperDoors', 'Kitchen end upper doors'), new Set(['short-open','short-closed']), 'Kitchen end upper doors');
  }
  for(const [key,kind] of Object.entries(KITCHEN_MATERIAL_FIELDS)){
    if(!Object.hasOwn(cabinets,key))continue;
    const choices=new Set(KITCHEN_MATERIALS.filter(material=>material.kind===kind).map(material=>material.id));
    kitchen[key]=supported(field(cabinets,key,`Kitchen ${key} material`),choices,`Kitchen ${key} material`);
  }

  const furnitureIds = new Set();
  const furniture = Array.from(list(field(design, 'furniture', 'Furniture'), 'Furniture', 0, 100), (value, index) => {
    const name = `Furniture item ${index + 1}`;
    const item = record(value, name);
    const label = field(item, 'label', `${name} label`);
    if (typeof label !== 'string' || !label.trim() || label.length > 120 || /[<>\u0000-\u001f\u007f]/.test(label)) {
      throw new Error(`${name} label must be 1–120 characters of plain text.`);
    }
    const rotation = field(item, 'rotation', `${name} rotation`);
    if (typeof rotation !== 'number' || !Number.isFinite(rotation)) {
      throw new Error(`${name} rotation must be a finite number.`);
    }
    const variant = field(item, 'variant', `${name} variant`, true);
    const mirrored = field(item, 'mirrored', `${name} mirrored`, true);
    if (mirrored !== undefined && typeof mirrored !== 'boolean') {
      throw new Error(`${name} mirrored must be true or false.`);
    }
    return {
      id: itemId(field(item, 'id', `${name} id`), furnitureIds, `${name} id`),
      type: supported(field(item, 'type', `${name} type`), CATALOG, `${name} type`),
      label: label.trim(),
      x: numberInRange(field(item, 'x', `${name} x position`), `${name} x position`, 0, 10.82),
      z: numberInRange(field(item, 'z', `${name} z position`), `${name} z position`, 0, 9.1),
      rotation: ((rotation % 360) + 540) % 360 - 180,
      color: color(field(item, 'color', `${name} color`), `${name} color`),
      variant: supported(variant === undefined ? 'classic' : variant, FURNITURE_VARIANTS, `${name} variant`),
      mirrored: mirrored === undefined ? false : mirrored,
    };
  });
  const normalized = { version: 1, mirrored: mirrored === undefined ? false : mirrored, yardCabinetColor, wallColors, kitchen, furniture };
  if (yard !== undefined) normalized.yard = yard;
  if (title !== undefined) normalized.title = title;
  return normalized;
}

export function resetOriginalColors(design) {
  const reset = validateDesign(design);
  const original = createDefaultState();
  reset.wallColors = original.wallColors;
  for (const field of ['color', 'upperColor', 'counterColor', 'backsplashColor']) reset.kitchen[field] = original.kitchen[field];
  for (const field of Object.keys(KITCHEN_MATERIAL_FIELDS)) delete reset.kitchen[field];
  reset.yardCabinetColor = original.yardCabinetColor;
  for (const item of reset.furniture) item.color = CATALOG.get(item.type).color;
  return reset;
}

export function createHistory(initial) {
  const snapshots = [validateDesign(initial)];
  let position = 0;
  const current = () => structuredClone(snapshots[position]);
  return {
    get current() { return current(); },
    get canUndo() { return position > 0; },
    get canRedo() { return position < snapshots.length - 1; },
    commit(next) {
      const normalized = validateDesign(next);
      if (JSON.stringify(normalized) === JSON.stringify(snapshots[position])) return current();
      snapshots.splice(position + 1);
      snapshots.push(normalized);
      if (snapshots.length > MAX_HISTORY) snapshots.shift();
      position = snapshots.length - 1;
      return current();
    },
    undo() {
      if (position > 0) position -= 1;
      return current();
    },
    redo() {
      if (position < snapshots.length - 1) position += 1;
      return current();
    },
  };
}
