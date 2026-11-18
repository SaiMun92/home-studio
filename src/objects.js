import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FURNITURE_CATALOG, getCatalogItem } from './catalog.js';
import { kitchenRun, BUILT_IN_CABINETS, WINDOW_LEDGES } from './layout.js';
import { kitchenMaterial, projectKitchenMaterialUVs } from './material-textures.js';
import { createVincentDining } from './vincent-dining.js';
import { createVeronicaCoffee } from './veronica-coffee.js';
import { createSolangeChair } from './solange-chair.js';
import { endUpperLayout, UPPER_CABINET_DEPTH, UPPER_DOOR_OFFSET } from './kitchen-end-doors.js';
import { createOmnidesk, createOfficeChair } from './office-furniture.js';

export { FURNITURE_CATALOG, getCatalogItem };

// Furniture is centred on its footprint, rests on y = 0, and faces local +Z.
const TAU = Math.PI * 2;
const shade = (color, lightness) => new THREE.Color(color).offsetHSL(0, 0, lightness);
const material = (color, properties = {}) => new THREE.MeshStandardMaterial({
  color, roughness: .72, ...properties,
});

function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function box(parent, w, h, d, mat, x = 0, y = 0, z = 0, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w * .45, h * .45, d * .45))
    : new THREE.BoxGeometry(w, h, d);
  return mesh(parent, geometry, mat, x, y, z);
}

function cylinder(parent, rt, rb, h, mat, x = 0, y = 0, z = 0, segments = 24) {
  return mesh(parent, new THREE.CylinderGeometry(rt, rb, h, segments), mat, x, y, z);
}

function sphere(parent, rx, ry, rz, mat, x, y, z) {
  const object = mesh(parent, new THREE.SphereGeometry(1, 20, 12), mat, x, y, z);
  object.scale.set(rx, ry, rz);
  return object;
}

function rod(parent, start, end, radius, mat, endRadius = radius) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const object = cylinder(parent, endRadius, radius, direction.length(), mat);
  object.position.copy(a.add(b).multiplyScalar(.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return object;
}

function tube(parent, points, radius, mat, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  return mesh(parent, new THREE.TubeGeometry(curve, Math.max(20, points.length * 4), radius, 8, closed), mat);
}

function ring(parent, radius, thickness, mat, x, y, z) {
  const object = mesh(parent, new THREE.TorusGeometry(radius, thickness, 8, 40), mat, x, y, z);
  object.rotation.x = -Math.PI / 2;
  return object;
}

function palette(color) {
  return {
    main: material(color),
    soft: material(shade(color, .045), { roughness: .96 }),
    seam: material(shade(color, -.10), { roughness: 1 }),
    wood: material('#98734d', { roughness: .56 }),
    darkWood: material('#654b37', { roughness: .56 }),
    paleWood: material('#d2b68a', { roughness: .62 }),
    dark: material('#292d2b', { roughness: .62 }),
    brass: material('#b6a173', { metalness: .66, roughness: .3 }),
    cream: material('#eee8dc', { roughness: 1 }),
  };
}

function timberTop(parent, width, depth, y, mat, trim, height = .055, z = 0) {
  box(parent, width, height, depth, mat, 0, y, z, .022);
  // Thin, quiet board joints keep timber legible at room scale.
  for (let i = -1; i <= 1; i++) {
    box(parent, width - .07, .001, .0018, trim, 0, y + height / 2 + .0006, z + depth * i / 4);
  }
}

function feet(parent, width, depth, height, mat, inset = .08, y = 0) {
  for (const x of [-width / 2 + inset, width / 2 - inset]) {
    for (const z of [-depth / 2 + inset, depth / 2 - inset]) {
      cylinder(parent, .028, .019, height, mat, x, y + height / 2, z, 12);
    }
  }
}

function sofa(parent, p, original) {
  const w = 2.2, d = .9;
  feet(parent, w, d, original ? .07 : .15, original ? p.dark : p.darkWood, .12);
  box(parent, w - .05, .21, d - .04, p.main, 0, original ? .20 : .255, 0, .065);
  const seatWidth = (w - .40) / 3;
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * (seatWidth + .007);
    box(parent, seatWidth - .018, .16, .60, p.soft, x, .425, .064, .060);
    const back = box(parent, seatWidth - .015, original ? .49 : .36, .19, p.main, x, original ? .70 : .65, -.32, .07);
    back.rotation.x = -.10;
    if (original) {
      box(parent, seatWidth - .04, .16, .16, p.soft, x, .905, -.345, .057);
      box(parent, seatWidth - .035, .20, .075, p.main, x, .25, .437, .034);
      box(parent, seatWidth - .07, .008, .005, p.seam, x, .305, .477, .002);
    }
  }
  for (const side of [-1, 1]) {
    box(parent, .20, original ? .43 : .33, .85, p.main, side * 1.0, original ? .40 : .45, .01, .065);
    if (original) {
      box(parent, .22, .10, .69, p.soft, side * 1.0, .61, .04, .040);
      const release = sphere(parent, .009, .028, .048, p.dark, side * 1.108, .36, .17);
      release.rotation.x = .15;
    }
  }
  const pillow = box(parent, .35, .32, .11, p.cream, -.64, .64, -.13, .065);
  pillow.rotation.set(-.14, .14, -.18);
  const accent = material(original ? '#adb2a4' : '#ae6c4e', { roughness: 1 });
  const second = box(parent, .33, .30, .10, accent, .65, .62, -.12, .06);
  second.rotation.set(-.17, -.18, .14);
}

function armchair(parent, p, original) {
  feet(parent, .76, .77, .16, p.darkWood, .085);
  box(parent, .75, .17, .73, p.main, 0, .255, .015, .045);
  box(parent, .57, .16, .57, p.soft, 0, .413, .071, .058);
  const back = box(parent, .74, .51, .17, p.main, 0, .63, -.30, .055);
  back.rotation.x = -.12;
  for (const side of [-1, 1]) {
    if (original) {
      box(parent, .125, .30, .75, p.main, side * .347, .435, 0, .044);
    } else {
      rod(parent, [side * .36, .18, -.30], [side * .36, .56, -.30], .023, p.wood);
      rod(parent, [side * .36, .10, .30], [side * .36, .56, .30], .023, p.wood);
      box(parent, .066, .05, .74, p.wood, side * .36, .565, 0, .022);
    }
  }
  const pillow = box(parent, .37, .25, .095, p.cream, 0, .56, -.15, .05);
  pillow.rotation.x = -.12;
}

function coffeeTable(parent, p, original) {
  timberTop(parent, 1.05, .55, .385, p.main, p.darkWood, .06);
  if (original) {
    box(parent, .90, .24, .44, p.main, 0, .20, 0, .016);
    feet(parent, .9, .44, .085, p.darkWood, .055);
    for (const side of [-1, 1]) {
      box(parent, .425, .19, .02, p.main, side * .219, .205, .228, .010);
      box(parent, .13, .012, .022, p.brass, side * .219, .253, .247, .005);
    }
  } else {
    for (const side of [-1, 1]) {
      const leg = box(parent, .085, .35, .38, p.darkWood, side * .35, .18, 0, .012);
      leg.rotation.z = side * -.09;
    }
    box(parent, .77, .03, .37, p.wood, 0, .16, 0, .008);
  }
  box(parent, .24, .025, .17, p.cream, -.19, .43, -.025, .004);
  const book = box(parent, .22, .022, .155, material('#748d83'), -.185, .454, -.015, .003);
  book.rotation.y = -.12;
  cylinder(parent, .063, .055, .034, p.cream, .26, .429, .02);
  cylinder(parent, .047, .048, .065, p.paleWood, .26, .466, .02);
}

function diningChair(parent, p, x, z, rotation) {
  const chair = new THREE.Group();
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  parent.add(chair);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      rod(chair, [sx * .17, .018, sz * .17], [sx * .145, .445, sz * .135], .021, p.darkWood, .026);
    }
    rod(chair, [sx * .155, .40, -.16], [sx * .165, .85, -.205], .02, p.darkWood);
  }
  box(chair, .37, .05, .36, p.darkWood, 0, .425, 0, .014);
  box(chair, .335, .035, .325, p.cream, 0, .465, .01, .022);
  for (let i = 0; i < 3; i++) {
    const rail = box(chair, .355, .057, .035, p.darkWood, 0, .64 + i * .09, -.19 - i * .009, .011);
    rail.rotation.x = -.10;
  }
  return chair;
}

function diningTable(parent, p, original) {
  p = { ...p, darkWood: p.main };
  const glass = new THREE.MeshPhysicalMaterial({
    color: original ? '#b6cec5' : '#e0e6de', roughness: .14, metalness: .10,
    transparent: true, opacity: .43, transmission: 0, clearcoat: 1, side: THREE.DoubleSide,
    depthWrite: false,
  });
  const top = cylinder(parent, .55, .55, .022, glass, 0, .77, 0, 64);
  top.scale.z = .77;
  top.castShadow = false;
  const points = Array.from({ length: 48 }, (_, i) => {
    const a = i / 48 * TAU;
    return [.55 * Math.cos(a), .77, .4235 * Math.sin(a)];
  });
  tube(parent, points, .008, material('#abc0b3', { metalness: .45, roughness: .18 }), true);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    rod(parent, [Math.cos(a) * .32, .035, Math.sin(a) * .25], [Math.cos(a) * .20, .747, Math.sin(a) * .16], .031, p.darkWood, .024);
  }
  box(parent, .45, .055, .055, p.brass, 0, .46, 0, .009);
  box(parent, .055, .055, .40, p.brass, 0, .46, 0, .009);
  diningChair(parent, p, 0, -.51, 0);
  diningChair(parent, p, 0, .51, Math.PI);
  diningChair(parent, p, -.61, 0, Math.PI / 2);
  diningChair(parent, p, .61, 0, -Math.PI / 2);
  cylinder(parent, .085, .075, .025, p.wood, 0, .80, 0);
  cylinder(parent, .036, .050, .12, p.cream, 0, .863, 0);
  for (let i = 0; i < 3; i++) {
    rod(parent, [0, .88, 0], [(i - 1) * .025, 1.025 + i * .027, .015], .003, material('#738567'));
    sphere(parent, .027, .025, .027, material('#f3dec6'), (i - 1) * .025, 1.025 + i * .027, .015);
  }
}

function bed(parent, p, single, original) {
  const width = single ? 1 : 1.6;
  feet(parent, width - .08, 1.91, .14, p.darkWood, .12);
  box(parent, width, .23, 1.97, original ? p.darkWood : p.paleWood, 0, .235, .012, .025);
  box(parent, width, .92, .085, original ? p.darkWood : p.paleWood, 0, .46, -.955, .022);
  if (!original) {
    box(parent, width - .09, .36, .045, p.main, 0, .68, -.9, .04);
  } else {
    for (let i = 1; i < (single ? 7 : 11); i++) {
      box(parent, .004, .45, .004, p.wood, -width / 2 + i * width / (single ? 7 : 11), .63, -.909);
    }
  }
  box(parent, width - .07, .19, 1.86, p.cream, 0, .427, .025, .065);
  box(parent, width - .045, .16, 1.41, p.soft, 0, .521, .25, .06);
  box(parent, width - .036, .045, .19, p.main, 0, .602, -.36, .015);
  for (const x of single ? [0] : [-.38, .38]) {
    const pillow = box(parent, single ? .68 : .65, .125, .37, p.cream, x, .571, -.665, .056);
    pillow.rotation.y = x ? (x < 0 ? -.035 : .035) : 0;
  }
  const throwMat = material(original ? '#8b9485' : '#a36951', { roughness: 1 });
  box(parent, width - .015, .021, .37, throwMat, 0, .609, .645, .008);
  for (const side of [-1, 1]) {
    box(parent, .035, .17, .37, throwMat, side * (width / 2 - .025), .536, .645, .009);
  }
}

function desk(parent, p) {
  timberTop(parent, 1.2, .56, .74, p.main, p.darkWood, .046, -.195);
  for (const x of [-.54, .54]) {
    for (const z of [-.43, .035]) rod(parent, [x, 0, z], [x, .72, z], .017, p.dark);
    rod(parent, [x, .09, -.43], [x, .09, .035], .013, p.dark);
  }
  box(parent, .34, .22, .49, p.main, .36, .595, -.19, .012);
  box(parent, .29, .015, .015, p.dark, .36, .605, .064, .004);
  box(parent, .17, .022, .13, p.dark, -.14, .779, -.30, .008);
  box(parent, .04, .17, .04, p.dark, -.14, .85, -.34, .01);
  box(parent, .45, .29, .027, p.dark, -.14, 1.012, -.337, .012);
  box(parent, .415, .254, .004, material('#52756f', { emissive: '#243f39', emissiveIntensity: .25 }), -.14, 1.014, -.32, .005);
  box(parent, .30, .012, .105, p.dark, -.14, .772, -.08, .01);
  box(parent, .06, .022, .095, p.dark, .09, .773, -.08, .02);
  const chair = new THREE.Group();
  parent.add(chair);
  chair.position.z = .245;
  cylinder(chair, .027, .027, .39, p.dark, 0, .25, 0);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    const x = Math.cos(a) * .21, z = Math.sin(a) * .21;
    rod(chair, [0, .11, 0], [x, .048, z], .016, p.dark);
    sphere(chair, .027, .026, .019, p.dark, x, .027, z);
  }
  box(chair, .43, .09, .39, p.seam, 0, .455, 0, .045);
  box(chair, .06, .35, .05, p.dark, 0, .60, .16, .015);
  const back = box(chair, .40, .32, .065, p.seam, 0, .735, .165, .045);
  back.rotation.x = .07;
}

function bookshelf(parent, p, width = 1.2) {
  const height = 1.65, depth = .34;
  box(parent, width - .03, height - .09, .025, p.main, 0, height / 2 + .025, -depth / 2 + .012);
  for (const x of [-width / 2 + .018, width / 2 - .018]) box(parent, .036, height, depth, p.main, x, height / 2, 0);
  for (const y of [.07, .44, .83, 1.22, 1.63]) box(parent, width, .032, depth, p.main, 0, y, 0, .004);
  box(parent, .028, 1.56, depth, p.main, .09, .85, 0);
  const colors = ['#88765e', '#708b84', '#bb9f79', '#bd795e', '#ddd3bd', '#54615c'];
  for (let shelf = 0; shelf < 4; shelf++) {
    let x = -width / 2 + .075;
    const baseY = [.07, .44, .83, 1.22][shelf] + .016;
    const count = shelf === 2 ? 4 : 7;
    for (let i = 0; i < count; i++) {
      const h = .21 + ((i + shelf) % 3) * .035;
      const w = .035 + (i % 3) * .01;
      box(parent, w, h, .21, material(colors[(i + shelf * 2) % colors.length]), x + w / 2, baseY + h / 2, .025, .002);
      box(parent, w - .008, .004, .003, p.cream, x + w / 2, baseY + h - .035, .132);
      x += w + .01;
    }
    if (shelf === 1 || shelf === 3) {
      cylinder(parent, .04, .075, .17, p.cream, width * .29, baseY + .085, .015);
    } else {
      box(parent, width * .27, .15, .255, material('#c1b394'), width * .29, baseY + .075, 0, .008);
      box(parent, .085, .026, .004, p.darkWood, width * .29, baseY + .09, .13, .004);
    }
  }
}

function wardrobe(parent, p, original) {
  const width = 1.6, height = 2.15, depth = .6;
  box(parent, width - .06, .10, depth - .08, p.darkWood, 0, .05, 0);
  box(parent, width, height - .10, depth - .027, p.main, 0, height / 2 + .05, -.013, .012);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * width / 3;
    box(parent, width / 3 - .008, height - .145, .029, p.main, x, height / 2 + .047, depth / 2, .008);
    if (!original) {
      box(parent, width / 3 - .085, height - .235, .006, p.soft, x, height / 2 + .047, depth / 2 + .018, .006);
    }
    box(parent, .015, .20, .032, p.brass, x + width / 6 - .057, 1.03, depth / 2 + .036, .006);
  }
}

function consoleUnit(parent, p, original) {
  feet(parent, 1.72, .35, .10, p.darkWood, .085);
  box(parent, 1.8, .36, .4, p.main, 0, .28, 0, .015);
  for (const side of [-1, 1]) {
    box(parent, .575, .29, .023, p.soft, side * .585, .28, .207, .006);
    box(parent, .11, .012, .023, p.brass, side * .585, .357, .225, .004);
  }
  box(parent, .56, .285, .013, p.dark, 0, .28, .207);
  box(parent, .555, .018, .25, p.wood, 0, .28, .085);
  box(parent, .37, .055, .13, p.dark, 0, .183, .16, .007);
  box(parent, .045, .19, .045, p.dark, 0, .55, -.05, .008);
  box(parent, .40, .025, .22, p.dark, 0, .475, 0, .007);
  box(parent, 1.30, .74, .042, p.dark, 0, .955, -.045, .015);
  box(parent, 1.256, .697, .005, material(original ? '#28352f' : '#354940', { roughness: .18, metalness: .10 }), 0, .961, -.020, .007);
}

function plant(parent, p) {
  const pot = material('#d5c7ae', { roughness: .92 });
  cylinder(parent, .155, .112, .29, pot, 0, .155, 0);
  ring(parent, .145, .012, pot, 0, .299, 0);
  cylinder(parent, .136, .136, .014, material('#473e30'), 0, .292, 0);
  cylinder(parent, .12, .13, .024, p.darkWood, 0, .012, 0);
  const stems = material('#686e42');
  const leaves = [p.main, material('#42654c'), material('#789165')];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    const tipX = Math.cos(a) * .115, tipZ = Math.sin(a) * .115;
    const tipY = .91 + (i % 3) * .10;
    tube(parent, [[0, .28, 0], [tipX * .4, .58, tipZ * .4], [tipX, tipY, tipZ]], .005, stems);
    for (let j = 0; j < 4; j++) {
      const angle = a + (j % 2 ? .76 : -.76);
      const x = tipX * (.35 + j * .18) + Math.cos(angle) * .057;
      const z = tipZ * (.35 + j * .18) + Math.sin(angle) * .057;
      const y = .53 + j * .135 + (i % 3) * .055;
      const leaf = sphere(parent, .063, .013, .115, leaves[(i + j) % 3], x, y, z);
      leaf.rotation.set(.25 + j * .08, -angle + Math.PI / 2, (j % 2 ? 1 : -1) * .25);
    }
  }
}

export function createFurniture(item) {
  const aliases = { coffeeTable: 'coffee', diningTable: 'dining', storage: 'storage' };
  const type = aliases[item.type] || item.type;
  const spec = getCatalogItem(type);
  const color = item.color || spec?.color || '#a88c69';
  const p = palette(color);
  const group = new THREE.Group();
  group.name = `Furniture · ${spec?.label || type}`;
  group.userData.furnitureId = item.id;
  group.userData.type = type;
  const original = item.variant !== 'modern';
  switch (type) {
    case 'sofa': sofa(group, p, original); break;
    case 'armchair': armchair(group, p, original); break;
    case 'solange-chair': createSolangeChair(group, color); break;
    case 'coffee': coffeeTable(group, p, original); break;
    case 'veronica-coffee': createVeronicaCoffee(group, color); break;
    case 'dining': diningTable(group, p, original); break;
    case 'vincent-dining': createVincentDining(group, color); break;
    case 'bed': bed(group, p, false, original); break;
    case 'singlebed': bed(group, p, true, original); break;
    case 'desk': desk(group, p); break;
    case 'omnidesk-classic': createOmnidesk(group, color); break;
    case 'office-chair': createOfficeChair(group, color); break;
    case 'wardrobe': wardrobe(group, p, original); break;
    case 'console': consoleUnit(group, p, original); break;
    case 'storage': bookshelf(group, p); break;
    case 'plant': plant(group, p); break;
    default: box(group, spec?.width || .8, .65, spec?.depth || .6, p.main, 0, .325, 0, .03);
  }
  // Keep every model grounded, including angled timber feet.
  const bounds = new THREE.Box3().setFromObject(group);
  for (const child of group.children) child.position.y -= bounds.min.y;
  // Handles, cushions and leaves stay inside the same centred footprint used
  // by placement validation. Preserve the model's height and rotation pivot.
  const extentX = 2 * Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x));
  const extentZ = 2 * Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z));
  group.scale.x = (spec ? Math.min(1, spec.width / extentX) : 1) * (item.mirrored ? -1 : 1);
  group.scale.z = spec ? Math.min(1, spec.depth / extentZ) : 1;
  group.position.set(Number(item.x) || 0, 0, Number(item.z) || 0);
  group.rotation.y = (Number(item.rotation) || 0) * Math.PI / 180;
  return group;
}

function cabinetFront(parent, width, height, x, y, z, mat, style, detailMat) {
  box(parent, width, height, .021, mat, x, y, z, .003);
  if (style === 'shaker') {
    const rail = Math.min(.055, width * .14, height * .2);
    box(parent, width - rail * 2, height - rail * 2, .007, detailMat, x, y, z + .012, .002);
    for (const side of [-1, 1]) {
      box(parent, rail, height, .010, mat, x + side * (width - rail) / 2, y, z + .016, .002);
      box(parent, width - rail * 2, rail, .010, mat, x, y + side * (height - rail) / 2, z + .016, .002);
    }
  } else if (style === 'slatted') {
    const count = Math.max(2, Math.floor(width / .032));
    const pitch = width / count;
    for (let i = 0; i < count; i++) {
      box(parent, pitch * .67, height - .007, .012, mat, x - width / 2 + pitch * (i + .5), y, z + .014, .003);
    }
  }
}

function cabinetHandle(parent, width, x, y, z, mat, vertical = false) {
  const length = Math.min(.17, width * .5);
  if (vertical) {
    for (const side of [-1, 1]) box(parent, .009, .010, .022, mat, x, y + side * length * .36, z + .016, .003);
    box(parent, .011, length, .012, mat, x, y, z + .028, .004);
  } else {
    for (const side of [-1, 1]) box(parent, .009, .010, .022, mat, x + side * length * .36, y, z + .016, .003);
    box(parent, length, .011, .012, mat, x, y, z + .028, .004);
  }
}

export function createWindowLedges() {
  const group = new THREE.Group();
  group.name = 'Window ledges';
  for (const ledge of WINDOW_LEDGES) {
    const object = box(group, ledge.width, ledge.height, ledge.depth, material(ledge.color, {roughness:.5}), ledge.x, ledge.height / 2, ledge.z);
    object.name = ledge.label;
    object.userData.roomId = ledge.room;
    object.userData.fixtureId = ledge.id;
  }
  return group;
}

export function createBuiltInCabinets(yardCabinetColor) {
  const group = new THREE.Group();
  group.name = 'Existing built-in cabinets';
  for (const spec of BUILT_IN_CABINETS) {
    const cabinet = new THREE.Group();
    cabinet.name = spec.label;
    cabinet.userData.fixtureId = spec.id;
    cabinet.userData.roomId = spec.room;
    cabinet.position.set(spec.x, 0, spec.z);
    cabinet.rotation.y = THREE.MathUtils.degToRad(spec.rotation);
    group.add(cabinet);
    const sideways = spec.rotation === 90;
    const width = sideways ? spec.depth : spec.width;
    const depth = sideways ? spec.width : spec.depth;
    const height = spec.height;
    const tall = spec.id === 'yard-tv-cabinet';
    const finishColor = tall ? (yardCabinetColor ?? spec.color) : spec.color;
    const finish = tall
      ? new THREE.MeshPhysicalMaterial({color:finishColor,roughness:.23,clearcoat:.7,clearcoatRoughness:.18})
      : material(finishColor, {roughness:.65});
    const carcass = material(shade(finishColor, -.06));
    const top = tall ? finish : material('#bbaa8e', {roughness:.53});
    box(cabinet, width-.03, .08, depth-.07, material('#514637'), 0, .04, -.015);
    box(cabinet, width, height-.11, depth-.045, carcass, 0, .08+(height-.11)/2, -.0225);
    box(cabinet, width, .03, depth, top, 0, height-.015, 0);
    // Closed doors match the references; the yard cabinet conceals the TV box.
    const frontZ = depth/2-.035;
    if (tall) {
      for (const x of [-width/4, width/4]) {
        cabinetFront(cabinet, width/2-.007, .625, x, .4075, frontZ, finish, 'flat', finish);
        cabinetFront(cabinet, width/2-.007, height-1.05, x, .75+(height-1.05)/2, frontZ, finish, 'flat', finish);
      }
      box(cabinet, width, .27, .025, finish, 0, height-.165, frontZ);
    } else {
      const count = Math.max(1, Math.round(width/.75)), pitch = width/count;
      for (let i=0;i<count;i++) {
        const x = -width/2+pitch*(i+.5);
        cabinetFront(cabinet, pitch-.008, height-.346, x, .09+(height-.346)/2, frontZ, finish, 'slatted', finish);
        box(cabinet, pitch-.008, .195, .024, top, x, height-.1375, frontZ);
      }
    }
  }
  return group;
}

function sink(parent, width, depth, height, counterMat, steel, dark) {
  const holeWidth = Math.min(width - .14, .53);
  const holeDepth = Math.min(depth - .19, .39);
  const slabDepth = depth + .035;
  const slabY = height - .018;
  for (const side of [-1, 1]) {
    box(parent, (width - holeWidth) / 2, .036, slabDepth, counterMat, side * (width + holeWidth) / 4, slabY, .008, .005);
    box(parent, holeWidth, .036, (slabDepth - holeDepth) / 2, counterMat, 0, slabY, .008 + side * (slabDepth + holeDepth) / 4, .004);
  }
  const fixture = new THREE.Group();
  fixture.name = 'Sink basin and tap';
  parent.add(fixture);
  parent = fixture;
  const bottomY = height - .143;
  box(parent, holeWidth, .014, holeDepth, steel, 0, bottomY, .008, .015);
  for (const side of [-1, 1]) {
    box(parent, .012, .135, holeDepth, steel, side * (holeWidth / 2 - .006), height - .07, .008, .004);
    box(parent, holeWidth, .135, .012, steel, 0, height - .07, .008 + side * (holeDepth / 2 - .006), .004);
    box(parent, .019, .006, holeDepth + .025, steel, side * (holeWidth / 2 + .002), height + .004, .008, .004);
    box(parent, holeWidth + .023, .006, .019, steel, 0, height + .004, .008 + side * (holeDepth / 2 + .002), .004);
  }
  cylinder(parent, .027, .027, .003, dark, 0, bottomY + .009, .008);
  ring(parent, .027, .003, steel, 0, bottomY + .011, .008);
  const faucetZ = -depth / 2 + .054;
  const tap = new THREE.Group();
  tap.name = 'Sink tap';
  parent.add(tap);
  cylinder(tap, .025, .025, .045, steel, 0, height + .02, faucetZ).name = 'Sink tap base';
  tube(tap, [[0, height + .02, faucetZ], [0, height + .23, faucetZ], [0, height + .28, faucetZ + .08], [0, height + .25, faucetZ + .155], [0, height + .19, faucetZ + .155]], .010, steel).name = 'Sink tap gooseneck';
  rod(tap, [.02, height + .045, faucetZ], [.06, height + .09, faucetZ], .006, steel).name = 'Sink tap lever';
}

function hob(parent, width, depth, height, steel, dark) {
  const fixture = new THREE.Group();
  fixture.name = 'Hob';
  parent.add(fixture);
  parent = fixture;
  const hobWidth = Math.min(.55, width - .035);
  const hobDepth = Math.min(.49, depth - .08);
  box(parent, hobWidth, .014, hobDepth, dark, 0, height + .007, 0, .016);
  for (const x of [-hobWidth * .245, hobWidth * .245]) {
    for (const z of [-hobDepth * .24, hobDepth * .24]) {
      const radius = x > 0 && z < 0 ? .058 : .070;
      cylinder(parent, radius, radius, .012, steel, x, height + .022, z, 32);
      cylinder(parent, radius * .66, radius * .66, .018, dark, x, height + .03, z, 24);
      ring(parent, radius * 1.07, .005, dark, x, height + .036, z);
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        rod(parent, [x + Math.cos(a) * .043, height + .041, z + Math.sin(a) * .043], [x + Math.cos(a) * .090, height + .041, z + Math.sin(a) * .090], .005, dark);
      }
    }
  }
  for (let i = 0; i < 4; i++) cylinder(parent, .012, .012, .015, steel, (i - 1.5) * .06, height + .021, hobDepth / 2 - .031);
}

function kitchenTaskLight(light, parent, width, worktopHeight, sourceY, sourceZ, name, targetZ = sourceZ - .1) {
  const drop = Math.max(.35, sourceY - worktopHeight - .01);
  const angle = Math.min(Math.PI / 3, Math.atan2(width * .65, drop) + .18);
  // Aim across the worktop from the selected fixture position, letting the
  // soft beam also wash the backsplash. This remains an illustrative
  // lighting preview, not a specification for real-world fixture output.
  light.color.set('#ffdbb5');
  light.intensity = Math.min(9.6, Math.max(2.4, width * 8));
  light.distance = 1.6;
  light.angle = angle;
  light.penumbra = .65;
  light.decay = 2;
  light.name = name;
  light.userData.kitchenTaskLight = true;
  light.castShadow = false;
  light.position.set(0, sourceY, sourceZ);
  light.target.name = 'Kitchen task-light target';
  light.target.position.set(0, worktopHeight + .01, targetZ);
  // Targets must share the cabinet transform, including the home's mirror.
  parent.add(light, light.target);
}

function endUpperCabinet(parent, plan, upperZ, upper, upperInset, handles, style, open) {
  const {width} = plan;
  const height = .75, depth = UPPER_CABINET_DEPTH, thickness = .018, bottom = 1.55;
  const frontZ = upperZ + depth / 2 + UPPER_DOOR_OFFSET;
  const shell = new THREE.Group();shell.name = 'Fridge-side upper cabinet';parent.add(shell);
  for (const side of [-1, 1]) {
    box(shell, thickness, height, depth, upper, side * (width - thickness) / 2, bottom + height / 2, upperZ);
    box(shell, width - thickness * 2, thickness, depth, upper, 0, bottom + (side < 0 ? thickness / 2 : height - thickness / 2), upperZ);
  }
  box(shell, width - thickness * 2, height - thickness * 2, thickness, upper, 0, bottom + height / 2, upperZ - (depth - thickness) / 2);
  const shelf = box(shell, width - thickness * 2, thickness, depth - thickness - .02, upper, 0, bottom + height / 2, upperZ + thickness / 2 - .01);
  shelf.name = 'End upper cabinet shelf';
  // Small end fillers leave space for handles when a door is at 90 degrees.
  for (const side of [-1, 1]) box(shell, .04, height - .008, .021, upper, side * (width / 2 - .02), bottom + height / 2, frontZ, .003);
  for (let i = 0; i < plan.count; i++) {
    const left = -width / 2 + plan.hingeInset + i * (plan.leafWidth + plan.gap);
    const rightHinge = i % 2 === 1 || i === plan.count - 1;
    const direction = rightHinge ? -1 : 1;
    const hinge = new THREE.Group();hinge.name = 'Short end-upper door';
    hinge.position.set(left + (rightHinge ? plan.leafWidth : 0), 0, frontZ);
    hinge.userData.endUpperDoor = true;
    hinge.userData.leafWidth = plan.leafWidth;
    hinge.userData.openDirection = -direction;
    hinge.rotation.y = open ? -direction * Math.PI / 2 : 0;
    shell.add(hinge);
    const x = direction * plan.leafWidth / 2;
    cabinetFront(hinge, plan.leafWidth, height - .008, x, bottom + height / 2, 0, upper, style, upperInset);
    cabinetHandle(hinge, plan.leafWidth, x, 1.595, 0, handles);
  }
  return shell;
}

export function createKitchen(kitchen, taskLightPool = []) {
  // The viewer retains a bounded set of IDs for Three.js's light-uniform
  // cache. Detach targets too, so unused lights cannot retain old cabinets.
  for (const light of taskLightPool) {
    light.removeFromParent();
    light.target.removeFromParent();
  }
  let taskLightIndex = 0;
  const addTaskLight = (parent, width, height, sourceY, sourceZ, name, targetZ) => {
    const light = taskLightPool[taskLightIndex] ?? (taskLightPool[taskLightIndex] = new THREE.SpotLight());
    taskLightIndex++;
    kitchenTaskLight(light, parent, width, height, sourceY, sourceZ, name, targetZ);
  };
  const group = new THREE.Group();
  group.name = 'Kitchen cabinetry';
  const depth = Number(kitchen.depth) || .6;
  const height = Number(kitchen.height) || .86;
  const finishColor = kitchen.color || '#c76530';
  const upperColor = kitchen.upperColor || '#f0eee7';
  const finish = kitchenMaterial(kitchen.lowerMaterial,'laminate',finishColor,{roughness:.52});
  const inset = kitchenMaterial(kitchen.lowerMaterial,'laminate',shade(finishColor,-.055),{roughness:.6});
  const upper = kitchenMaterial(kitchen.upperMaterial,'laminate',upperColor,{roughness:.58});
  const upperInset = kitchenMaterial(kitchen.upperMaterial,'laminate',shade(upperColor,-.035));
  const counter = kitchenMaterial(kitchen.counterMaterial,'countertop',kitchen.counterColor||'#ece8df',{roughness:.37});
  const carcass = kitchenMaterial(kitchen.lowerMaterial,'laminate',shade(finishColor,-.075));
  const dark = material('#292d2c', { roughness: .46 });
  const steel = material('#afb4b1', { metalness: .78, roughness: .25 });
  const handles = material('#a99b79', { metalness: .74, roughness: .3 });
  const style = kitchen.style || 'flat';
  const taskLighting = kitchen.taskLighting === true;
  const addUpperStrip = (parent, width, upperZ, upperDepth) => {
    // Wall-side placement remains fixed when the upper bays are redivided.
    const stripZ = upperZ - upperDepth / 2 + .055;
    const stripMaterial = taskLighting
      ? material('#fff5e7', { emissive: '#ffdbb5', emissiveIntensity: 1.1 })
      : material('#ffefd1', { emissive: '#ffe2a9', emissiveIntensity: kitchen.taskLighting === false ? 0 : .7 });
    const strip = box(parent, width - .04, .008, .014, stripMaterial, 0, 1.544, stripZ, .002);
    strip.name = 'Under-cabinet task-light diffuser';
    if (taskLighting) addTaskLight(parent, width, height, 1.533, stripZ, 'Under-cabinet task illumination', stripZ + .14);
  };
  const run = kitchenRun({...kitchen,depth,modules:kitchen.modules || []});
  // Close the remaining span without rewriting saved module widths or IDs.
  // Adding/widening modules replaces this fitted end section automatically.
  const fillCount = run.fillLength > .000001 ? Math.ceil(run.fillLength / .9) : 0;
  const modules = [...(kitchen.modules || []), ...Array.from({length:fillCount},()=>({type:'doors',width:run.fillLength/fillCount,fittedEnd:true}))];
  if (run.frontExtensionLength > .000001) {
    if (['drawers', 'doors'].includes(modules[0]?.type)) {
      modules[0] = {...modules[0], width:modules[0].width + run.frontExtensionLength};
    } else {
      // If the user replaces/removes the drawer bay, keep the floor-edge
      // extension as a narrow base section without stretching an appliance.
      modules.unshift({type:'doors',width:run.frontExtensionLength,fittedFront:true});
    }
  }
  const endUpper = endUpperLayout(kitchen, modules, run);
  let cursor = run.start;
  for (const module of modules) {
    const width = Number(module.width) || .6;
    const moduleStart = cursor;
    const cabinet = new THREE.Group();
    const fitted = module.fittedEnd || module.fittedFront;
    cabinet.name = module.fittedFront ? 'Fitted floor-edge section' : module.fittedEnd ? 'Fitted end section' : `Cabinet · ${module.type}`;
    if(fitted) cabinet.userData.kitchenInfill = true;
    else cabinet.userData.cabinetId = module.id;
    cabinet.position.set(run.back - depth / 2, 0, cursor + width / 2);
    cabinet.rotation.y = -Math.PI / 2;
    group.add(cabinet);
    cursor += width;
    const bodyHeight = height - .13;
    const bodyY = .095 + bodyHeight / 2;
    const frontZ = depth / 2 + .001;
    box(cabinet, Math.max(width / 2, width - .028), .095, depth - .13, dark, 0, .0475, -.035);
    if (module.type === 'pantry') {
      const pantryHeight = 2.3;
      box(cabinet, width, pantryHeight - .095, depth - .025, carcass, 0, (pantryHeight + .095) / 2, -.012, .003);
      const doors = width > .68 ? 2 : 1;
      const doorWidth = width / doors;
      for (let i = 0; i < doors; i++) {
        const x = -width / 2 + doorWidth * (i + .5);
        const handleX = doors === 2
          ? x + (i === 0 ? 1 : -1) * (doorWidth / 2 - .05)
          : x + doorWidth / 2 - .052;
        cabinetFront(cabinet, doorWidth - .009, 1.425, x, .8125, frontZ, finish, style, inset);
        cabinetFront(cabinet, doorWidth - .009, .745, x, 1.9125, frontZ, finish, style, inset);
        cabinetHandle(cabinet, doorWidth, handleX, 1.29, frontZ + .015, handles, true);
        cabinetHandle(cabinet, doorWidth, handleX, 1.68, frontZ + .015, handles, true);
      }
      // A pantry already fills the full height, so it has neither worktop nor uppers.
      continue;
    }
    if (module.type === 'sink') {
      // The basin must sit in an open carcass, rather than intersect a solid box.
      for (const side of [-1, 1]) {
        box(cabinet, .019, bodyHeight, depth - .025, carcass, side * (width / 2 - .0095), bodyY, -.012);
      }
      box(cabinet, width - .038, .025, depth - .025, carcass, 0, .1075, -.012);
      box(cabinet, width - .038, bodyHeight, .019, carcass, 0, bodyY, -depth / 2 + .0095);
    } else {
      box(cabinet, width, bodyHeight, depth - .025, carcass, 0, bodyY, -.012, .003);
    }
    if (module.type !== 'sink') {
      box(cabinet, width, .036, depth + .035, counter, 0, height - .018, .008, .005);
    }
    // A narrow upstand closes the joint against the tiled wall.
    box(cabinet, width, .05, .022, counter, 0, height + .025, -depth / 2 + .008, .003);
    const narrowFill = fitted && width < .3;
    if (narrowFill) {
      box(cabinet, width, bodyHeight, .021, finish, 0, bodyY, frontZ);
    } else if (module.type === 'drawers') {
      const drawerHeights = [.22, (bodyHeight - .22) / 2, (bodyHeight - .22) / 2];
      let top = height - .047;
      for (const drawerHeight of drawerHeights) {
        const y = top - drawerHeight / 2;
        cabinetFront(cabinet, width - .009, drawerHeight - .007, 0, y, frontZ, finish, style, inset);
        cabinetHandle(cabinet, width, 0, y + drawerHeight / 2 - .048, frontZ + .015, handles);
        top -= drawerHeight;
      }
    } else if (module.type === 'hob') {
      cabinetFront(cabinet, width - .009, .12, 0, .16, frontZ, finish, style, inset);
      box(cabinet, width - .035, bodyHeight - .12, .034, steel, 0, .22 + (bodyHeight - .12) / 2, frontZ + .006, .006);
      box(cabinet, width - .105, bodyHeight - .265, .009, dark, 0, .245 + (bodyHeight - .265) / 2, frontZ + .029, .012);
      box(cabinet, width - .15, .024, .039, steel, 0, height - .205, frontZ + .062, .008);
      for (const x of [-width * .30, 0, width * .30]) {
        const knob = cylinder(cabinet, .02, .02, .025, steel, x, height - .102, frontZ + .034);
        knob.rotation.x = Math.PI / 2;
      }
      box(cabinet, .084, .027, .003, dark, 0, height - .103, frontZ + .049, .003);
      hob(cabinet, width, depth, height, steel, dark);
    } else if (module.type === 'dishwasher') {
      box(cabinet, width - .012, bodyHeight - .005, .029, steel, 0, bodyY, frontZ, .007);
      box(cabinet, width - .023, .075, .015, dark, 0, height - .086, frontZ + .016, .004);
      box(cabinet, width * .48, .018, .026, steel, 0, height - .092, frontZ + .039, .005);
      box(cabinet, .031, .010, .003, material('#8ea48a', { emissive: '#537647', emissiveIntensity: .4 }), width * .33, height - .084, frontZ + .025, .002);
      box(cabinet, width - .057, .010, .008, dark, 0, .17, frontZ + .018, .002);
    } else {
      const doors = width > .68 ? 2 : 1;
      const doorWidth = width / doors;
      for (let i = 0; i < doors; i++) {
        const x = -width / 2 + doorWidth * (i + .5);
        cabinetFront(cabinet, doorWidth - .009, bodyHeight - .007, x, bodyY, frontZ, finish, style, inset);
        const handleX = doors === 2 ? x + (i === 0 ? 1 : -1) * (doorWidth / 2 - .05) : x + doorWidth / 2 - .052;
        cabinetHandle(cabinet, doorWidth, handleX, height - .18, frontZ + .015, handles, true);
      }
      if (module.type === 'sink') sink(cabinet, width, depth, height, counter, steel, dark);
    }
    // Only add uppers to whole bays backed by the fixed partition.
    if (kitchen.upper !== false && moduleStart >= run.upperStart - 1e-9) {
      const upperHeight = .75, upperDepth = UPPER_CABINET_DEPTH;
      const upperZ = -depth / 2 + upperDepth / 2;
      if (module.type === 'hob') {
        box(cabinet, width - .025, .075, .46, steel, 0, 1.67, -depth / 2 + .23, .009);
        box(cabinet, width - .085, .012, .35, dark, 0, 1.627, -depth / 2 + .24, .004);
        box(cabinet, width * .46, .60, .23, steel, 0, 1.995, -depth / 2 + .125, .01);
        for (const x of [-width * .30, width * .30]) {
          const lampMaterial = taskLighting
            ? material('#fff5e7', { emissive: '#ffdbb5', emissiveIntensity: 1.1 })
            : material('#fff2cc', { emissive: '#ffe5b1', emissiveIntensity: kitchen.taskLighting === false ? 0 : .9 });
          const lamp = cylinder(cabinet, .022, .022, .009, lampMaterial, x, 1.625, -.015);
          lamp.name = 'Hood task-light diffuser';
        }
        if (taskLighting) addTaskLight(cabinet, width, height, 1.614, -.015, 'Hood task illumination');
      } else {
        const upperWidth = endUpper ? Math.max(0, Math.min(cursor, endUpper.start) - moduleStart) : width;
        if (upperWidth < .000001) continue;
        let upperBay = cabinet;
        if (Math.abs(upperWidth - width) > 1e-9) {
          upperBay = new THREE.Group();upperBay.name = 'Upper bay before end cabinet';
          upperBay.position.x = (upperWidth - width) / 2;cabinet.add(upperBay);
        }
        box(upperBay, upperWidth, upperHeight, upperDepth, upper, 0, 1.55 + upperHeight / 2, upperZ, .004);
        if (narrowFill || upperWidth < .15) continue;
        const count = upperWidth > .68 ? 2 : 1;
        const doorWidth = upperWidth / count;
        for (let i = 0; i < count; i++) {
          const x = -upperWidth / 2 + doorWidth * (i + .5);
          const z = upperZ + upperDepth / 2 + UPPER_DOOR_OFFSET;
          cabinetFront(upperBay, doorWidth - .009, upperHeight - .008, x, 1.925, z, upper, style, upperInset);
          cabinetHandle(upperBay, doorWidth, x, 1.595, z + .015, handles);
        }
        addUpperStrip(upperBay, upperWidth, upperZ, upperDepth);
      }
    }
  }
  if (endUpper) {
    const cabinet = new THREE.Group();cabinet.name = 'Fitted upper end section';cabinet.userData.kitchenInfill = true;
    cabinet.position.set(run.back - depth / 2, 0, (endUpper.start + endUpper.end) / 2);
    cabinet.rotation.y = -Math.PI / 2;group.add(cabinet);
    const upperDepth = UPPER_CABINET_DEPTH, upperZ = -depth / 2 + upperDepth / 2;
    endUpperCabinet(cabinet, endUpper, upperZ, upper, upperInset, handles, style, kitchen.endUpperDoors === 'short-open');
    addUpperStrip(cabinet, endUpper.width, upperZ, upperDepth);
  }
  projectKitchenMaterialUVs(group);
  return group;
}
