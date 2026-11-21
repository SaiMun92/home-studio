import { createViewer } from './scene.js';
import { ROOMS, PLAN, canPlace, pointInRoom, roomRegions, footprint, KITCHEN_RUN_LENGTH, kitchenRun } from './layout.js';
import { createDefaultState, createHistory, validateDesign, resetOriginalColors, ORIGINAL_BACKSPLASH_COLOR } from './state.js';
import { createSavedDesignsDialog } from './designs-ui.js';
import { createKitchenMaterialsEditor } from './kitchen-materials-ui.js';
import { getKitchenMaterial, setKitchenColor } from './kitchen-materials.js';
import { KITCHEN_STORAGE, KITCHEN_STORAGE_TYPES } from './kitchen-storage.js';
import { FURNITURE_CATALOG, getCatalogItem } from './catalog.js';
import { VINCENT_DINING, useVincentDining } from './dining-products.js';
import { SOLANGE_CHAIR, VERONICA_COFFEE, getLivingProduct, useLivingProduct } from './living-products.js';
import { applyLivingSeating } from './living-design.js';
import { OMNIDESK, OFFICE_CHAIR, getOfficeProduct, useOfficeProduct } from './office-products.js';
import { applyBedroomOffice } from './bedroom-office.js';
import { kitchenPrepModules } from './kitchen-prep.js';
import { createEditorSections } from './editor-sections.js';
import { LG_STYLER } from './styler-product.js';
import { applyMasterStyler } from './master-styler.js';
import { L_SOFA } from './l-sofa-spec.js';
import { applyLShapedSofa } from './l-sofa-layout.js';
import {DREAME_X60_MODELS,getDreameProduct} from './dreame-product.js';
import {yardRobotVacuum} from './yard-layout.js';

const STORAGE_KEY = 'home-studio-design-v1';
const PAINTS = [['Off-white','#eeeae2'],['Linen','#d6cbbb'],['Sage','#a6b29a'],['Clay','#bf8b72'],['Mist','#b5c3c5'],['Olive','#778166'],['Ink','#485b65'],['Chalk','#faf8f1']];
const FINISHES = [['Original','#c76530'],['Oak','#b39268'],['White','#f0eee7'],['Sage','#8b9b80'],['Charcoal','#404642'],['Blue','#697e8b']];
const UPPER_FINISHES = [['White','#f0eee7'],['Ivory','#f2f0e8'],['Oak','#b39268'],['Sage','#8b9b80'],['Charcoal','#404642'],['Blue','#697e8b']];
const BACKSPLASH_FINISHES = [['Copper',ORIGINAL_BACKSPLASH_COLOR],['White','#f0eee7'],['Warm grey','#b8b1a6'],['Sage','#8b9b80'],['Charcoal','#404642'],['Blue','#697e8b']];
const MODULE_TYPES = {doors:'Double doors',drawers:'Drawers',sink:'Sink unit',hob:'Hob & oven',dishwasher:'Dishwasher',pantry:'Tall pantry'};
const STORAGE_NOTES = {drinks:'Mugs, cutlery and serving pieces in the living-facing drawers. Keep part of the worktop clear.',waste:'A pull-out waste and recycling unit, sized around the sink plumbing.',prep:'A shallow utensil drawer above deep cookware drawers, with full-extension runners.',trays:'Vertical dividers for baking trays and chopping boards.',appliances:'Store occasional-use appliances below and reserve the counter as an appliance landing area.'};
const NAV_ROOMS = ROOMS.filter(r=>r.walkable&&!['shelter','hall'].includes(r.id));
const ROOM_ALIASES = {master:'master-bedroom',bedroom2:'bedroom-2',bath2:'bath-2',masterbath:'master-bath',entry:'entrance',hall:'hallway'};
const esc = value => String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const fmt = value => Number(value).toFixed(2);
const mm = value => Math.round(value*1000)+' mm';
const round = value => Math.round(value*1000)/1000;
const roomById = id => ROOMS.find(r=>r.id===id);
const paths = {
 home:'<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/>',
 undo:'<path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12"/>', redo:'<path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',
 cube:'<path d="m12 2 10 5v10l-10 5-10-5V7l10-5Z"/><path d="m2 7 10 5 10-5M12 12v10M7 4.5l10 5"/>',
 plan:'<path d="M3 3h18v18H3V3Zm0 10h8V3m0 10v8m0-13h10m-5 0v7h5"/>',
 walk:'<circle cx="13" cy="4" r="2"/><path d="m7 21 3-6m6 6-2-8 1-5m-9 5 4-5h5l3 5h3M10 8l-1 7h5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',reset:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',left:'<path d="M20 12H4m6-6-6 6 6 6"/>',up:'<path d="M12 20V4m-6 6 6-6 6 6"/>',down:'<path d="M12 4v16m-6-6 6 6 6-6"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
 palette:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="8" r="1"/><circle cx="14" cy="7" r="1"/><circle cx="17" cy="12" r="1"/><path d="M4 16h6a3 3 0 0 1 3 3v2"/>',
 cabinet:'<rect x="3" y="4" width="18" height="17" rx="1"/><path d="M3 10h18M12 10v11M7 7h2m6 0h2m-8 7v3m6-3v3"/>',
 sofa:'<path d="M5 11V5h14v6M3 10h4v5h10v-5h4v10H3V10Zm2 10v2m14-2v2"/>',
 armchair:'<path d="M6 11V4h12v7M3 10h4v6h10v-6h4v10H3V10Zm2 10v2m14-2v2"/>',
 coffee:'<path d="M2 8h20v5H2V8Zm3 5v7m14-7v7"/>',dining:'<path d="M4 7h16v6H4V7Zm3 6v7m10-7v7M1 5v12h3m19-12v12h-3"/>',
 bed:'<path d="M3 21V5h18v16M3 10h18M3 18h18M6 6v4m6-4v4m6-4v4"/>',singlebed:'<path d="M6 21V4h12v17M6 10h12M6 18h12M9 5v5m6-5v5"/>',
 desk:'<path d="M2 8h20M4 8v13m16-13v13M8 8V3h8v5M9 14h6v6H9v-6Zm3 6v3"/>',wardrobe:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M12 2v20m-3-12v4m6-4v4"/>',
 console:'<rect x="2" y="10" width="20" height="9" rx="1"/><path d="M8 10v9m8-9v9M4 19v3m16-3v3M6 10V3h12v7"/>',
 plant:'<path d="m7 16 2 6h6l2-6H7Zm5 0V7m0 5c-7 0-9-5-7-8 5 0 7 4 7 8Zm0-3c0-5 3-8 8-7 0 5-3 7-8 7Z"/>',
 bath:'<path d="M3 12h18l-2 7H5l-2-7Zm2 7v3m14-3v3M5 12V5a3 3 0 0 1 6 0H8"/>'
};
const icon = name => '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths[({'vincent-dining':'dining','veronica-coffee':'coffee','solange-chair':'armchair','omnidesk-classic':'desk','office-chair':'armchair','lg-styler-s3mfc':'wardrobe','l-sofa':'sofa'})[name]||'home'])+'</svg>';
const roomIcon = r => ({living:'sofa',dining:'dining',master:'bed',bedroom2:'singlebed',study:'desk',kitchen:'cabinet',bath2:'bath',masterbath:'bath',yard:'plant',entry:'home'})[r.id]||'plan';
function normalizeDesign(input,previous=null){
 const next=validateDesign(input);
 for(const item of next.furniture){
  const placement=canPlace(item,next.furniture,next.kitchen,next.yard);if(placement.ok)continue;
  // Geometry corrections can expose overlaps in a saved design. Keep unchanged
  // pieces editable while the owner moves them, but reject new invalid placements.
  const old=previous?.furniture.find(f=>f.id===item.id);
  const unchanged=old&&['type','x','z','rotation'].every(key=>old[key]===item[key])&&previous.kitchen.depth===next.kitchen.depth;
  if(unchanged&&!canPlace(old,previous.furniture,previous.kitchen,previous.yard).ok)continue;
  throw new Error(item.label+': '+placement.reason);
 }
 return next;
}
let recoveryMessage='',storageAvailable=true;
function restoreStoredDesign(){
 let stored;
 try{stored=localStorage.getItem(STORAGE_KEY);}catch{storageAvailable=false;recoveryMessage='Browser storage is unavailable. Export your design to keep a copy.';}
 if(stored){try{
  const saved=validateDesign(JSON.parse(stored));
  if(saved.furniture.some(item=>!canPlace(item,saved.furniture,saved.kitchen,saved.yard).ok))recoveryMessage='Your saved design is loaded. Some furniture overlaps the updated layout; move these pieces to a clear space.';
  return saved;
 }catch{try{localStorage.setItem(STORAGE_KEY+'-recovery',stored);}catch{}recoveryMessage='The saved design could not be loaded. The original layout has been restored.';}}
 return createDefaultState();
}
const history=createHistory(restoreStoredDesign());
let state=history.current,currentRoom='living',selectedFurniture=null,selectedCabinet=state.kitchen.modules[0].id,activeTab='walls',cameraMode='dollhouse',viewRoomName=null;
let viewer,designLibraryUI,kitchenMaterialsUI,manifest=null,manifestError=false,galleryTab='photos',galleryDetail=null,toastTimer,lightingPreview=false;
const $=selector=>document.querySelector(selector);
$('#app').innerHTML=[
 '<header class="app-header"><a class="brand" href="#" aria-label="Home Studio, show whole home"><span class="brand-mark">'+icon('home')+'</span><span>home<span class="brand-light">studio</span></span></a>',
 '<div class="header-project"><span class="slash">/</span><span class="project-dot"></span><span class="project-title"><span class="project-title-name" id="project-name">Our next chapter</span><span class="muted">· Type C1</span></span></div>',
 '<div class="header-actions"><span class="save-status" id="save-status" aria-live="polite">'+icon('check')+' Saved on this device</span><div class="history-buttons">',
 '<button class="icon-button" data-action="undo" title="Undo (⌘/Ctrl Z)" aria-label="Undo">'+icon('undo')+'</button><button class="icon-button" data-action="redo" title="Redo (⌘/Ctrl Shift Z)" aria-label="Redo">'+icon('redo')+'</button></div>',
 '<button class="secondary-button design-library-button" data-action="saved-designs" aria-label="Saved designs" title="Saved designs">'+icon('copy')+'<span>Saved designs</span></button><button class="secondary-button" data-action="references">'+icon('image')+'<span>References</span></button><button class="icon-button bordered" data-action="import" title="Import a design" aria-label="Import design">'+icon('upload')+'</button><button class="primary-button" data-action="export">'+icon('download')+'<span>Export design</span></button></div></header>',
 '<main class="workspace"><aside class="room-sidebar" aria-label="Rooms"><div class="panel-bar"><span>Rooms</span><button class="panel-toggle" data-action="toggle-rooms" aria-label="Hide rooms panel" title="Hide rooms panel" aria-expanded="true" aria-controls="rooms-panel-content">'+icon('left')+'<span class="toggle-label">Hide</span></button></div><div class="panel-body" id="rooms-panel-content"><div class="project-intro"><p class="eyebrow">A PLACE TO CALL YOURS</p><h1>Your space,<br>reimagined.</h1><p class="project-meta"><span>2 beds + study</span><span>'+PLAN.area+' m² <small>on plan</small></span></p></div>',
 '<div class="section-heading"><span>YOUR ROOMS</span><span class="count">'+NAV_ROOMS.length+'</span></div><nav class="room-list" id="room-list" aria-label="Choose a room"></nav>',
 '<div class="sidebar-bottom"><button class="plan-card" data-action="plan"><span class="plan-image"><img src="./references/floorplan-original.png" alt="Original Type C1 floor plan"></span><span><strong>The original plan</strong><small>93 m² · mirrored layout</small></span>'+icon('arrow')+'</button><p class="privacy-note">'+icon('lock')+' Your home stays on this device.</p></div></div></aside>',
 '<section class="scene-panel" aria-label="Interactive 3D home"><canvas id="scene" tabindex="0" aria-label="Interactive home. In dollhouse, use W A S D to pan, drag to orbit, and scroll to zoom. Select furniture to move it."></canvas>',
 '<div class="scene-heading"><p class="eyebrow">HOME, FROM A NEW PERSPECTIVE</p><h2 id="view-title" aria-live="polite">The whole picture.</h2><p id="view-subtitle">A little imagination. A space that feels like you.</p></div>',
 '<div class="scene-top-tools"><span class="tiny-count" id="scene-count">'+state.furniture.length+' pieces</span><button class="glass-button" data-action="screenshot" title="Download this view" aria-label="Download screenshot">'+icon('camera')+'</button><button class="glass-button" data-action="reset-view" title="Show the whole home" aria-label="Reset camera">'+icon('cube')+'</button></div>',
 '<div id="loading" class="loading"><span class="loader"></span><span>Making room for your ideas…</span></div><div class="scene-zoom"><button class="glass-button" data-action="zoom-in" title="Zoom in" aria-label="Zoom in">'+icon('plus')+'</button><button class="glass-button" data-action="zoom-out" title="Zoom out" aria-label="Zoom out">'+icon('minus')+'</button></div>',
 '<div class="walk-controls" id="walk-controls" hidden><strong>Make yourself at home</strong><span>W A S D / arrow keys to move · drag to look</span><div class="walk-touch"><button data-walk="a" aria-label="Walk left">←</button><button data-walk="w" aria-label="Walk forward">↑</button><button data-walk="s" aria-label="Walk backward">↓</button><button data-walk="d" aria-label="Walk right">→</button></div></div>',
 '<button id="lighting-preview-status" class="glass-button" data-action="lighting-preview" hidden>Evening preview · Return to daylight</button>',
 '<div class="scene-bottom"><div class="view-switch" aria-label="Camera view"><button data-view="dollhouse" class="active" aria-pressed="true">'+icon('cube')+'<span>Dollhouse</span></button><button data-view="top" aria-pressed="false">'+icon('plan')+'<span>Floor plan</span></button><button data-view="walk" aria-pressed="false">'+icon('walk')+'<span>Walk through</span></button></div>',
 '<div class="scene-options"><label><input type="checkbox" id="show-labels" checked> Room labels</label><label><input type="checkbox" id="full-walls"> Full walls</label><label><input type="checkbox" id="show-ceiling"> Ceiling</label></div></div>',
 '<div class="scene-footnote"><span id="interaction-hint">W A S D to pan · drag to orbit · scroll to zoom</span><span>Concept model · dimensions estimated</span></div></section>',
 '<aside class="inspector" aria-label="Design editor"><div class="panel-bar"><span>Design editor</span><button class="panel-toggle" data-action="toggle-editor" aria-label="Hide editor panel" title="Hide editor panel" aria-expanded="true" aria-controls="editor-panel-content">'+icon('arrow')+'<span class="toggle-label">Hide</span></button></div><div class="panel-body" id="editor-panel-content"><div class="inspector-heading"><p class="eyebrow">MAKE IT YOURS</p><h2>A change of feeling.</h2></div><div class="inspector-tabs" role="tablist" aria-label="Design tools">',
 '<button id="tab-walls" data-tab="walls" class="active" role="tab" aria-selected="true" aria-controls="inspector-content">'+icon('palette')+'Walls</button><button id="tab-kitchen" data-tab="kitchen" role="tab" aria-selected="false" aria-controls="inspector-content">'+icon('cabinet')+'Kitchen</button><button id="tab-furniture" data-tab="furniture" role="tab" aria-selected="false" aria-controls="inspector-content">'+icon('sofa')+'Furniture</button></div>',
 '<div id="inspector-content" role="tabpanel" aria-labelledby="tab-walls"></div><div class="inspector-footer"><button class="text-button" data-action="reset-colors">'+icon('palette')+' Reset original colors</button><button class="text-button" data-action="restore">'+icon('reset')+' Restore original design</button><span>Every idea can be undone.</span></div></div></aside></main>',
 '<input type="file" id="import-file" accept=".json,application/json" hidden><dialog id="reference-dialog" aria-labelledby="reference-title"><div class="dialog-header"><div><p class="eyebrow">THE STARTING POINT</p><h2 id="reference-title">Your home, as it is.</h2></div><button class="icon-button" data-action="close-gallery" aria-label="Close reference library">'+icon('close')+'</button></div><div class="gallery-tabs" id="gallery-tabs"></div><div id="gallery-content"></div></dialog><div class="toast" id="toast" role="status" aria-live="polite"></div>'
].join('');
const editorSections=createEditorSections($('#inspector-content'));
function toast(message){const element=$('#toast');element.textContent=message;element.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove('visible'),4800);}
function saveDesign(){
 if(storageAvailable){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageAvailable=false;toast('This browser could not save your changes. Export your design to keep a copy.');}}
 $('#save-status').innerHTML=icon(storageAvailable?'check':'download')+' '+(storageAvailable?'Saved on this device':'Session only · export to save');
}
function syncDesign(){
 state=history.current;
 if(selectedFurniture&&!state.furniture.some(i=>i.id===selectedFurniture))selectedFurniture=null;
 if(!state.kitchen.modules.some(m=>m.id===selectedCabinet))selectedCabinet=state.kitchen.modules[0].id;
 viewer?.setState(state);viewer?.setSelected(selectedFurniture);renderRoomList();renderInspector();
 $('[data-action="undo"]').disabled=!history.canUndo;$('[data-action="redo"]').disabled=!history.canRedo;
 $('#scene-count').textContent=state.furniture.length+' pieces';$('.plan-card small').textContent='93 m² · '+(state.mirrored?'mirrored layout':'brochure layout');saveDesign();
 updateViewCopy(viewRoomName);
}
function commit(mutator,message=''){
 try{const draft=history.current,result=mutator(draft);history.commit(normalizeDesign(result===undefined?draft:result,result===undefined?state:null));syncDesign();if(message)toast(message);return true;}
 catch(error){toast(error instanceof Error?error.message:'That change could not be applied.');renderInspector();viewer?.setState(state);viewer?.setSelected(selectedFurniture);return false;}
}
function renderRoomList(){
 $('#room-list').innerHTML=NAV_ROOMS.map(r=>'<button class="room-button '+(r.id===currentRoom?'active':'')+'" data-room="'+r.id+'" aria-current="'+(r.id===currentRoom)+'"><span class="room-symbol">'+icon(roomIcon(r))+'</span><span>'+esc(r.name)+'</span><span class="room-color" style="--color:'+state.wallColors[r.id]+'" aria-label="Wall paint '+state.wallColors[r.id]+'"></span></button>').join('');
}
function selectRoom(id,focus=true){const room=roomById(id);if(!room?.walkable)return;currentRoom=id;selectedFurniture=null;viewer?.setSelected(null);if(focus){$('.scene-panel').classList.remove('yard-storage-view');viewer?.focusRoom(id);}renderRoomList();renderInspector();updateViewCopy(focus?room.name:null);}
function selectFurniture(id,focus=false){
 const item=state.furniture.find(i=>i.id===id);selectedFurniture=item?.id||null;
 if(item){const room=pointInRoom(item.x,item.z);if(room?.walkable)currentRoom=room.id;if(focus&&room)viewer?.focusRoom(room.id);}
 viewer?.setSelected(selectedFurniture);renderRoomList();setTab('furniture');if(item)editorSections.open('furniture:selected-furniture');
}
function setTab(tab){if(!['walls','kitchen','furniture'].includes(tab))return;activeTab=tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',String(b.dataset.tab===tab));});$('#inspector-content').setAttribute('aria-labelledby','tab-'+tab);renderInspector();}
function roomOptions(){return ROOMS.filter(r=>r.walkable).map(r=>'<option value="'+r.id+'" '+(r.id===currentRoom?'selected':'')+'>'+esc(r.name)+'</option>').join('');}
function swatches(values,selected,action){return '<div class="swatch-grid">'+values.map(([label,color])=>'<button class="swatch '+(color===selected?'selected':'')+'" data-'+action+'="'+color+'" title="'+label+'" aria-label="'+label+'" aria-pressed="'+(color===selected)+'"><span style="--swatch:'+color+'">'+(color===selected?icon('check'):'')+'</span><small>'+label+'</small></button>').join('')+'</div>';}
function colorField(id,label,value){return '<label class="custom-color" for="'+id+'"><input type="color" id="'+id+'" value="'+value+'" data-field="'+id+'" aria-label="'+label+'"><span>'+label+'</span><code>'+value.toUpperCase()+'</code></label>';}
function rangeField(field,label,value,min,max,step){return '<div class="range-field"><label for="'+field+'"><span>'+label+'</span><output id="'+field+'-output" for="'+field+'">'+mm(value)+'</output></label><input type="range" id="'+field+'" data-field="'+field+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" aria-label="'+label+'"></div>';}
function referenceCallout(room){
 const alias=ROOM_ALIASES[room.id]||room.id,photos=manifest?.photos||[],frames=manifest?.videos.flatMap(v=>v.frames)||[];
 const item=photos.find(p=>room.reference&&p.sourcePath===room.reference)||photos.find(p=>p.rooms.includes(alias))||frames.find(f=>f.rooms.includes(alias));
 if(item)return '<button class="reference-callout" data-reference="'+esc(item.id)+'"><span class="reference-thumb"><img src="'+esc(item.src)+'" alt="'+esc(item.label)+'"></span><span><strong>A look at the original</strong><small>Open room reference '+icon('arrow')+'</small></span></button>';
 return '<p class="body-note subtle">'+(['master','masterbath','shelter'].includes(room.id)?'Based on the floor plan. Furnishings and finishes in this room are placeholders.':'Dimensions and finishes are visual estimates from the supplied references.')+'</p>';
}

function yardStoragePanel(){
 const yard=state.yard??{fridgeSurround:false,laundry:'stacked'};
 return '<section class="editor-section" data-editor-section="yard-storage"><div class="field-heading"><h3>Fridge & appliance storage</h3><p>Carpentry inspired by your reference photos.</p></div>'+
 '<button class="secondary-button wide" data-action="focus-yard-storage">View fridge & appliance cabinet</button>'+
 (yard.cabinetLayout==='matched'?'<p class="body-note">Matching yard cabinets: 740 W × 2640 H mm each, with aligned fronts and tops. The DB cupboard is 360 mm deep to fit the wall behind it; the other two are 740 mm deep. Change their shared finish under Yard → Walls → Yard cabinet color.</p>':'')+
 '<label class="toggle-row"><span>Fridge surround & top cupboard<small>'+(yard.cabinetLayout==='matched'?'Frame and doors match the other yard cabinets.':'Wood frame with matching upper-cabinet doors.')+'</small></span><input type="checkbox" id="fridge-surround" '+(yard.fridgeSurround?'checked':'')+'></label>'+
 '<label class="field-label spaced" for="yard-laundry">Laundry arrangement</label><select id="yard-laundry"><option value="stacked" '+(yard.laundry==='stacked'?'selected':'')+'>Original washer and dryer stack</option><option value="combo-tower" '+(yard.laundry==='combo-tower'?'selected':'')+'>Combo + open appliance shelves</option></select>'+
 (yard.fridgeSurround||yard.fridgeModel?'<p class="body-note"><strong>Panasonic NR-F603GT-SS</strong><br>685 W × 1828 H × 745 D mm · space grey<br><a href="https://www.courts.com.sg/panasonic-6-dr-fridge-588l---space-grey-nr-f603gt-ss-IP178847.html" target="_blank" rel="noopener">View fridge specifications ↗</a></p>':'')+
 (yard.laundry==='combo-tower'?'<p class="body-note"><strong>LG FV1413H2BA</strong><br>13 kg wash / 8 kg dry<br>600 W × 850 H × 615 D mm · black<br><a href="https://www.lg.com/sg/washing-machines/washer-dryers/fv1413h2ba/" target="_blank" rel="noopener">View washer/dryer specifications ↗</a></p><p class="body-note">Open shelves show an air fryer, multicooker and blender. Shelf runners are shown retracted; the frame supports the shelves separately from the machine.</p>':'')+
 '<p class="body-note subtle">Cabinet openings and small appliances are approximate. Allowances for ventilation, hoses, vibration and door opening need checking against the installation manuals and site measurements.</p>'+
 '<div class="yard-inspiration-links"><a href="./references/inspiration/fridge-surround.jpg" target="_blank" rel="noopener">Fridge inspiration ↗</a><a href="./references/inspiration/appliance-shelves.jpg" target="_blank" rel="noopener">Appliance shelves inspiration ↗</a></div></section>';
}

function setYardCabinetColor(design,color){
 design.yardCabinetColor=color;
 if(design.yard)delete design.yard.cabinetMaterial;
}

function yardColorPanel(){
 const matched=state.yard?.cabinetLayout==='matched';
 const sample=matched?getKitchenMaterial(state.yard.cabinetMaterial,'laminate'):null;
 return '<section class="editor-section" data-editor-section="yard-color"><div class="field-heading"><h3>Yard cabinet color</h3><p>'+(matched?'Choose one finish for all three yard cabinets.':'Choose a finish for the tall DB-box cabinet.')+'</p></div>'+
 (sample?'<p class="body-note">Current finish: '+esc(sample.name)+'. Choosing a color replaces the wood texture on all three cabinets.</p>':'')+
 swatches(FINISHES,sample?null:state.yardCabinetColor,'yard-finish')+colorField('yard-cabinet-color',matched?'All yard cabinets':'Yard cabinet color',state.yardCabinetColor)+'<button class="secondary-button wide" data-action="reset-yard-color">Restore original orange</button></section>';
}

function dbVacuumPanel(){
 const product=getDreameProduct(state.yard?.robotVacuum),fit=yardRobotVacuum(state.yard);
 return '<section class="editor-section" data-editor-section="db-vacuum"><div class="field-heading"><h3>Robot vacuum in DB cabinet</h3><p>A floor-level opening below the retained DB cupboard.</p></div><label class="field-label" for="db-robot-vacuum">Lower DB cabinet</label><select id="db-robot-vacuum"><option value="">Closed lower cabinet</option>'+Object.values(DREAME_X60_MODELS).map(p=>'<option value="'+p.id+'" '+(p.id===product?.id?'selected':'')+'>Open + '+p.label+'</option>').join('')+'</select>'+
 (product?'<p class="body-note"><strong>'+product.label+'</strong><br>Dock: '+mm(product.width)+' W × '+mm(product.depth)+' D × '+mm(product.height)+' H<br>Robot: 350 × 350 mm; 79.5 mm high with sensor retracted, 102.8 mm raised.</p><button class="secondary-button wide" data-action="focus-db-vacuum">View robot vacuum</button><p class="body-note">Lower doors and the base threshold are removed. The upper cupboard and cabinet front stay in place.'+(fit.projection>0?' The dock projects about '+Math.round(fit.projection*1000)+' mm beyond the cabinet; its entry ramp extends farther.':' The dock sits within the cabinet depth.')+'</p><p class="body-note subtle">The ramp and 20 mm rear service gap are illustrative; installation access and connections need checking.</p><p class="body-note"><a href="'+product.url+'" target="_blank" rel="noopener">Dreame product page ↗</a> · <a href="'+product.specification+'" target="_blank" rel="noopener">Published dimensions ↗</a></p>':'<p class="body-note subtle">Choose a dock to open only the lower DB cabinet. You can undo this change.</p>')+'</section>';
}

function wallsPanel(){
 const room=roomById(currentRoom),color=state.wallColors[currentRoom];
 return [
 '<section class="editor-section" data-editor-section="wall-colors"><div class="field-heading"><h3>Wall colors</h3><p>A fresh coat. A whole new feeling.</p></div><label class="field-label" for="paint-room">Your room</label><select id="paint-room">'+roomOptions()+'</select>',
 '<div class="paint-preview" style="--paint:'+color+'" role="img" aria-label="Preview of '+esc(room.name)+' wall paint"><div class="preview-window"><i></i><i></i></div><div class="preview-floor"></div><div class="preview-plant">'+icon('plant')+'</div><span>'+esc(room.name)+'</span></div>',
 '<label class="field-label spaced">A considered palette</label>'+swatches(PAINTS,color,'paint'),colorField('wall-color','Choose a custom color',color),
 '<button class="secondary-button wide" data-action="paint-all">Apply color throughout '+icon('arrow')+'</button></section>',
 currentRoom==='yard'?dbVacuumPanel()+yardColorPanel():'',
 currentRoom==='yard'?yardStoragePanel():'',
 '<section class="editor-section" data-editor-section="room-reference"><div class="field-heading"><h3>Room references & layout</h3></div>',referenceCallout(room),
 '<label class="toggle-row"><span>Mirrored floor plan<small>Your confirmed home orientation.</small></span><input id="mirror-home" type="checkbox" '+(state.mirrored?'checked':'')+'></label><p class="body-note subtle">93 m² as shown on the brochure. Room sizes and ceiling height are estimated; colors vary with light and screen.</p></section>'
 ].join('');
}
function kitchenPanel(){
 const k=state.kitchen,m=k.modules.find(m=>m.id===selectedCabinet)||k.modules[0],total=k.modules.reduce((n,m)=>n+m.width,0);
 const storageOptions=Object.entries(KITCHEN_STORAGE).filter(([id])=>KITCHEN_STORAGE_TYPES[id].includes(m.type));
 const samples=[['Lower cabinets',k.lowerMaterial],['Upper cabinets',k.upperMaterial],['Countertop',k.counterMaterial]].map(([label,id])=>[label,getKitchenMaterial(id)]).filter(([,sample])=>sample);
 return [
 '<section class="editor-section" data-editor-section="kitchen-view"><div class="field-heading"><h3>Kitchen view</h3><p>Explore the materials and the details.</p></div><button class="secondary-button wide" data-action="focus-kitchen">'+icon('cabinet')+' Take me to the kitchen '+icon('arrow')+'</button></section>',
 kitchenPrepModules(k)?'<section class="editor-section" data-editor-section="prep-space"><div class="field-heading"><h3>More preparation space</h3><p>Move the sink closer to the dishwasher and put prep drawers beneath the freed worktop. The sink keeps its size; the stove stays in place.</p></div><button class="primary-button wide" data-action="apply-kitchen-prep">Move sink next to dishwasher</button><p class="body-note subtle">Applies just this kitchen adjustment and can be undone.</p></section>':'',
 yardStoragePanel(),
 '<section class="editor-section" data-editor-section="directional-fan"><div class="field-heading"><h3>Kitchen directional fan</h3><p>Ceiling mounted near the entrance, toward the blank wall, angled down toward the sink/prep position.</p></div>',
 '<label class="toggle-row"><span>Three-blade metal fan<small>Inspired by your first reference photo.</small></span><input type="checkbox" id="kitchen-directional-fan" '+(k.directionalFan?'checked':'')+'></label>',
 '<button class="secondary-button wide" data-action="focus-kitchen-fan">View fan placement</button><button class="text-button" data-action="focus-kitchen-fan-detail">View fan close up</button><p class="body-note"><a href="./references/inspiration/kitchen-directional-fan.jpg" target="_blank" rel="noopener">Your fan reference</a></p><p class="body-note subtle">Illustrative 300 mm blade sweep and approximately 450 mm drop. Exact product dimensions, mounting height and clearances need confirmation.</p></section>',
 '<section class="editor-section" data-editor-section="front-upper"><div class="field-heading"><h3>Upper cabinet at the living-room end</h3><p>The first upper beside the sink cupboards, above the dishwasher in Designer inspiration.</p></div>',
 '<label class="toggle-row"><span>Three open ledges<small>Three shelves and an outer side panel in the upper-cabinet finish, with no doors.</small></span><input type="checkbox" id="front-upper-shelves" '+(k.frontUpperShelves?'checked':'')+'></label>',
 '<button class="secondary-button wide" data-action="focus-front-upper">View upper shelves</button></section>',
 '<section class="editor-section" data-editor-section="end-upper"><div class="field-heading"><h3>Upper cabinet beside the fridge</h3><p>Open door edges align with the outer edge of the tiled wall beside the fridge.</p></div>',
 '<label class="field-label" for="end-upper-doors">End-cabinet doors</label><select id="end-upper-doors"><option value="" '+(!k.endUpperDoors?'selected':'')+'>Original doors · closed</option><option value="short-closed" '+(k.endUpperDoors==='short-closed'?'selected':'')+'>Shorter doors · closed</option><option value="short-open" '+(k.endUpperDoors==='short-open'?'selected':'')+'>Shorter doors · open 90°</option></select>',
 '<button class="secondary-button wide" data-action="focus-end-upper">View door clearance</button><p class="body-note subtle">Re-divides the end upper cabinets into two 258 mm doors, with a shelf inside. Lower cabinets stay in place. Clearances follow the estimated wall and fridge dimensions.</p></section>',
 '<section class="editor-section" data-editor-section="lighting"><div class="field-heading"><h3>Lighting</h3><p>See the light on your worktop and backsplash.</p></div>',
 '<label class="toggle-row"><span>Warm task lighting<small>'+(k.upper?'Along the wall-side edge beneath the upper cabinets, plus the hood lamps.':'Enable upper cabinets to show these lights.')+'</small></span><input type="checkbox" id="task-lighting" '+(k.taskLighting?'checked':'')+'></label>',
 '<button class="secondary-button wide" data-action="lighting-preview" aria-pressed="'+lightingPreview+'">'+(lightingPreview?'Return to daylight':'Preview lighting')+'</button><p class="body-note subtle">Preview at eye level with evening light, then switch the task lights on and off to compare.</p></section>',
 '<div id="kitchen-materials-slot"></div><section class="editor-section" data-editor-section="colors"><div class="field-heading"><h3>Colors and cabinet fronts</h3><p>Choose preset or custom colors, a backsplash finish or a different front style.</p></div>',
 '<label class="field-label spaced">Lower cabinet finish</label>'+swatches(FINISHES,k.color,'finish'),colorField('kitchen-color','Custom lower color',k.color),
 '<div role="group" aria-labelledby="upper-finish-label"><div id="upper-finish-label" class="field-label spaced">Upper cabinet finish</div>'+swatches(UPPER_FINISHES,k.upperMaterial?null:k.upperColor,'upper-finish')+colorField('upper-color','Custom upper color',k.upperColor)+'</div>',
 colorField('counter-color','Countertop',k.counterColor),
 samples.length?'<div class="kitchen-selected-materials">'+samples.map(([label,sample])=>'<p class="body-note"><strong>'+label+':</strong> '+esc(sample.name)+' · '+esc(sample.code)+'</p>').join('')+'<p class="body-note subtle">Choosing a color replaces that surface’s sample texture.</p></div>':'',
 '<label class="field-label spaced">Backsplash panel</label>'+swatches(BACKSPLASH_FINISHES,k.backsplashColor,'backsplash-finish'),
 colorField('backsplash-color','Custom backsplash color',k.backsplashColor),
 '<button class="secondary-button wide" data-action="reset-backsplash-color">Restore original copper</button>',
 '<label class="field-label spaced">Front style</label><div class="segmented" aria-label="Cabinet front style">'+['flat','shaker','slatted'].map(style=>'<button data-style="'+style+'" class="'+(k.style===style?'active':'')+'" aria-pressed="'+(k.style===style)+'">'+style[0].toUpperCase()+style.slice(1)+'</button>').join('')+'</div>',
 '<label class="toggle-row"><span>Upper cabinets<small>Over the inner working run.</small></span><input type="checkbox" id="upper-cabinets" '+(k.upper?'checked':'')+'></label></section>',
 '<section class="editor-section" data-editor-section="cabinet-layout"><div class="field-heading"><h3>Cabinet layout & dimensions</h3><p>Select a module to shape the working run.</p></div><div class="cabinet-diagram" aria-label="Kitchen cabinet modules">',
 k.modules.map((entry,i)=>'<button data-module="'+entry.id+'" class="'+(entry.id===m.id?'active':'')+'" style="flex:'+entry.width+'" title="Module '+(i+1)+': '+MODULE_TYPES[entry.type]+', '+mm(entry.width)+'" aria-label="Select module '+(i+1)+': '+MODULE_TYPES[entry.type]+'" aria-pressed="'+(entry.id===m.id)+'">'+icon(entry.type==='pantry'?'wardrobe':'cabinet')+'<small>'+(i+1)+'</small></button>').join(''),
 '</div><p class="module-caption"><span>Module '+(k.modules.indexOf(m)+1)+' selected</span><span>'+fmt(total)+' / '+fmt(KITCHEN_RUN_LENGTH)+' m</span></p>',
 kitchenRun(k).fillLength>.001?'<p class="body-note subtle">'+mm(kitchenRun(k).fillLength)+' fitted end section continues to the wall. Add modules or increase their widths to replace it.</p>':'',
 '<label class="field-label" for="module-type">Module function</label><select id="module-type">'+Object.entries(MODULE_TYPES).map(([type,label])=>'<option value="'+type+'" '+(m.type===type?'selected':'')+'>'+label+'</option>').join('')+'</select>',
 storageOptions.length?'<label class="field-label spaced" for="module-storage">Storage plan</label><select id="module-storage"><option value="">General storage</option>'+storageOptions.map(([id,label])=>'<option value="'+id+'" '+(m.storage===id?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select>'+(m.storage?'<p class="body-note">'+esc(STORAGE_NOTES[m.storage])+'</p><p class="body-note subtle">Interior fittings are specified in this plan; cabinets are shown closed in 3D.</p>':''):'',
 rangeField('module-width','Module width',m.width,.3,1.2,.05),
 m===k.modules[0]&&['drawers','doors'].includes(m.type)?'<p class="body-note subtle">This cabinet extends an additional '+mm(kitchenRun(k).frontExtensionLength)+' to meet the living-room tile edge.</p>':'',
 '<div class="button-row"><button class="secondary-button" data-action="add-module" '+(total>KITCHEN_RUN_LENGTH-.3+1e-9||k.modules.length>=8?'disabled':'')+'>'+icon('plus')+' Add module</button><button class="icon-button bordered danger" data-action="remove-module" title="Remove selected module" aria-label="Remove selected module" '+(k.modules.length===1?'disabled':'')+'>'+icon('trash')+'</button></div>',
 rangeField('kitchen-depth','Cabinet depth',k.depth,.45,.75,.01),rangeField('kitchen-height','Worktop height',k.height,.72,1.02,.01),
 '<p class="body-note subtle">A design study with estimated dimensions. Confirm measurements, appliance clearances and service connections before fabrication.</p>',referenceCallout(roomById('kitchen')),'</section>'
 ].join('');
}
function livingProductDetails(item){
 const product=getLivingProduct(item.type);if(!product)return '';
 const chair=product.type===SOLANGE_CHAIR.type;
 return '<p class="body-note"><strong>'+esc(product.label)+'</strong><br>'+esc(product.finish)+'<br>'+(chair?'68 W × 77 D × 75 H cm · 42 cm seat height':'70 cm diameter × 34 cm high')+'</p><p class="body-note"><a href="'+product.url+'" target="_blank" rel="noopener">View product specifications ↗</a> · <a href="'+product.image+'" target="_blank" rel="noopener">Your reference photo ↗</a></p><button class="secondary-button wide" data-action="focus-living-seating">View living seating</button>';
}
function lSofaPanel(){
 const sofa=state.furniture.find(item=>item.type===L_SOFA.type&&pointInRoom(item.x,item.z)?.id==='living');
 const row=sofa?.rotation===0&&sofa.mirrored;
 return '<section class="editor-section" data-editor-section="l-sofa"><div class="field-heading"><h3>L-shaped sofa</h3><p>Grey upholstered seating with a longer lounge at one end. Estimated 240 × 155 cm overall, 88 cm high.</p></div><label class="field-label" for="l-sofa-layout">Position by the balcony</label><select id="l-sofa-layout"><option value="balcony-chaise" '+(!row?'selected':'')+'>Chaise at the balcony end</option><option value="balcony-row" '+(row?'selected':'')+'>Long seating row along the balcony</option></select><button class="primary-button wide" data-action="apply-l-sofa">'+(sofa?'Arrange L-shaped sofa':'Replace sofa with L shape')+'</button>'+(sofa?'<button class="secondary-button wide" data-action="focus-l-sofa">View sofa and balcony</button>':'')+'<p class="body-note subtle">Keeps your sofa color and coffee table. Nearby lounge chairs or the plant move only if needed to make room. The arrangement can be undone.</p></section>';
}
function lSofaDetails(){
 return '<p class="body-note"><strong>L-shaped upholstered sofa</strong><br>Estimated 240 × 155 cm overall · 88 cm high.<br>Three seats with an extended lounge; the inside corner remains open.</p><button class="secondary-button wide" data-action="focus-l-sofa">View sofa and balcony</button>';
}
function livingSeatingPanel(){
 return '<section class="editor-section" data-editor-section="living-seating"><div class="field-heading"><h3>Living seating</h3><p>A Sand Veronica coffee table with two Chalk Bouclé Solange chairs in White Wash, beside your existing sofa.</p></div><button class="primary-button wide" data-action="apply-living-seating">Apply table + two chairs</button><p class="body-note subtle">Adds the missing chairs and leaves existing Solange edits intact. The table or plant may move to make room. All pieces remain individually movable.</p></section>';
}
function officePanel(){
 return '<section class="editor-section" data-editor-section="office"><div class="field-heading"><h3>Two-person office</h3><p>Two Pheasantwood Omnidesks face opposite side walls, staggered with compact, partly tucked chairs to clear the window ledge and keep access to the built-in wardrobe and doorway.</p></div><button class="primary-button wide" data-action="apply-bedroom-office">Arrange two-person office</button><button class="secondary-button wide" data-action="focus-bedroom-office">View office</button><p class="body-note subtle">Replaces Bedroom 2’s bed and any old desk; keeps the built-in wardrobe in place with its doors facing into the room. Adds two 122 × 76 cm desks with monitors and two movable chairs. Reapplying restores these desk and chair positions. Other rooms stay as edited. You can undo this change.</p></section>';
}
function officeProductDetails(item){
 if(item.type===OFFICE_CHAIR.type)return '<p class="body-note"><strong>Ergonomic office chair</strong><br>Estimated 58 × 58 cm footprint, 46 cm seat height. Generic chair styling; movable independently from the desk.</p><button class="secondary-button wide" data-action="focus-bedroom-office">View office</button>';
 return '<p class="body-note"><strong>Omnidesk Classic Wildwood · Small</strong><br>Pheasantwood · Black frame<br>122 × 76 cm desktop · shown at 74 cm height<br>27-inch monitor, keyboard, mouse and cable tray. Accessories and wood grain are illustrative; height adjustment is not animated.</p><p class="body-note"><a href="'+OMNIDESK.url+'" target="_blank" rel="noopener">View desk specifications ↗</a> · <a href="'+OMNIDESK.image+'" target="_blank" rel="noopener">Your reference image ↗</a></p><button class="secondary-button wide" data-action="focus-bedroom-office">View office</button>';
}
function stylerPanel(){
 const existing=state.furniture.some(item=>item.type===LG_STYLER.type&&pointInRoom(item.x,item.z)?.id==='master');
 return '<section class="editor-section" data-editor-section="master-styler"><div class="field-heading"><h3>LG Styler beside wardrobe</h3><p>S3MFC · Essence Mirrored Finish<br>44.5 cm wide × 58.5 cm deep × 185 cm high.</p></div><button class="primary-button wide" data-action="'+(existing?'focus-master-styler':'apply-master-styler')+'">'+(existing?'View Styler and wardrobe':'Add Styler beside wardrobe')+'</button><p class="body-note subtle">Fits beside the wardrobe facing into the room. If needed, the original bed moves 10 cm toward the window. The whole change can be undone.</p><p class="body-note"><a href="'+LG_STYLER.url+'" target="_blank" rel="noopener">LG product specifications ↗</a> · <a href="'+LG_STYLER.image+'" target="_blank" rel="noopener">Your reference image ↗</a></p></section>';
}
function stylerProductDetails(){
 return '<p class="body-note"><strong>LG Styler S3MFC</strong><br>Essence Mirrored Finish<br>445 W × 585 D × 1850 H mm<br>Closed mirror door, touch controls and silver surround. Mirror appearance is illustrative.</p><p class="body-note"><a href="'+LG_STYLER.url+'" target="_blank" rel="noopener">View LG specifications ↗</a> · <a href="'+LG_STYLER.image+'" target="_blank" rel="noopener">Your reference image ↗</a></p><button class="secondary-button wide" data-action="focus-master-styler">View Styler and wardrobe</button>';
}
function furniturePanel(){
 const item=state.furniture.find(i=>i.id===selectedFurniture),entry=item&&getCatalogItem(item.type);
 const options=state.furniture.map(i=>'<option value="'+i.id+'" '+(i.id===selectedFurniture?'selected':'')+'>'+esc(i.label)+' · '+esc(pointInRoom(i.x,i.z)?.name||'Home')+'</option>').join('');
 const selection=item?[
 '<div class="selected-item"><span class="item-icon">'+icon(item.type)+'</span><span><strong>'+esc(item.label)+'</strong><small>'+fmt(entry.width)+' × '+fmt(entry.depth)+' m · estimated footprint</small></span></div>',
 '<label class="field-label" for="replace-furniture">Replace with</label><select id="replace-furniture">'+FURNITURE_CATALOG.map(i=>'<option value="'+i.type+'" '+(i.type===item.type?'selected':'')+'>'+esc(i.label)+'</option>').join('')+'</select>',
 item.type===VINCENT_DINING.type?'<p class="body-note"><strong>Castlery Vincent · Walnut</strong><br>150 W × 80 D × 76 H cm · 4 cm tabletop<br>Four seats. Chair dimensions and the footprint with chairs are approximate.</p><p class="body-note"><a href="'+VINCENT_DINING.url+'" target="_blank" rel="noopener">View table specifications ↗</a> · <a href="'+VINCENT_DINING.image+'" target="_blank" rel="noopener">Your inspiration photo ↗</a></p><button class="secondary-button wide" data-action="focus-dining">View dining set</button>':getLivingProduct(item.type)?livingProductDetails(item):getOfficeProduct(item.type)?officeProductDetails(item):item.type===LG_STYLER.type?stylerProductDetails():item.type===L_SOFA.type?lSofaDetails():'<label class="field-label spaced">A different character</label><div class="segmented" aria-label="Furniture style">'+['classic','modern'].map(v=>'<button data-variant="'+v+'" class="'+(item.variant===v?'active':'')+'" aria-pressed="'+(item.variant===v)+'">'+(v==='classic'?'Classic':'Modern')+'</button>').join('')+'</div>',
 colorField('furniture-color',[SOLANGE_CHAIR.type,L_SOFA.type].includes(item.type)?'Upholstery color':item.type===VERONICA_COFFEE.type?'Concrete color':item.type===OMNIDESK.type?'Desktop wood color':item.type===OFFICE_CHAIR.type?'Chair upholstery':item.type===LG_STYLER.type?'Appliance surround':'Material color',item.color),
 '<div class="position-controls"><div><label class="field-label">Move · 20 cm</label><div class="move-pad"><button class="icon-button bordered" data-move="up" title="Move toward the top of the plan" aria-label="Move up">'+icon('up')+'</button><button class="icon-button bordered" data-move="left" title="Move left on the plan" aria-label="Move left">'+icon('left')+'</button><span>'+icon('plan')+'</span><button class="icon-button bordered" data-move="right" title="Move right on the plan" aria-label="Move right">'+icon('arrow')+'</button><button class="icon-button bordered" data-move="down" title="Move toward the bottom of the plan" aria-label="Move down">'+icon('down')+'</button></div></div>',
 '<div class="rotation-controls"><label class="field-label">Rotate · 45°</label><div class="button-row"><button class="icon-button bordered" data-rotate="-45" title="Rotate counterclockwise" aria-label="Rotate counterclockwise">'+icon('undo')+'</button><button class="icon-button bordered" data-rotate="45" title="Rotate clockwise" aria-label="Rotate clockwise">'+icon('redo')+'</button></div><button class="secondary-button" data-rotate="180" title="Face the opposite direction without moving the piece">Turn 180°</button><small>'+Math.round(item.rotation)+'° rotation</small></div></div>',
 '<div class="button-row"><button class="secondary-button" data-action="duplicate">'+icon('copy')+' Duplicate</button><button class="secondary-button danger" data-action="delete">'+icon('trash')+' Remove</button></div><p class="body-note subtle">Drag a piece in the model, or use arrow keys to move and R to rotate. Moves keep walls, cabinets and other furniture clear.</p>'
 ].join(''):'<div class="empty-selection">'+icon('sofa')+'<strong>Make a little room.</strong><p>Choose a piece in the model to move it, change its finish or try another style.</p></div>';
 return (currentRoom==='living'?lSofaPanel()+livingSeatingPanel():currentRoom==='bedroom2'?officePanel():currentRoom==='master'?stylerPanel():'')+'<section class="editor-section" data-editor-section="selected-furniture"><div class="field-heading"><h3>Selected furniture</h3><p>Find the pieces that make it feel like home.</p></div><label class="field-label" for="selected-furniture">Selected piece</label><select id="selected-furniture"><option value="">Choose a piece in your home</option>'+options+'</select>'+selection+'</section><section class="editor-section" data-editor-section="add-furniture"><div class="field-heading"><h3>Add furniture</h3><p>Add a piece to '+esc(roomById(currentRoom).name.toLowerCase())+'.</p></div><label class="field-label" for="furniture-room">Place new pieces in</label><select id="furniture-room">'+roomOptions()+'</select><div class="catalog-grid">'+FURNITURE_CATALOG.map(i=>'<button data-add="'+i.type+'" title="Add '+esc(i.label.toLowerCase())+'" aria-label="Add '+esc(i.label)+'"><span>'+icon(i.type)+'</span><strong>'+esc(i.label)+'</strong><small>'+fmt(i.width)+' × '+fmt(i.depth)+' m</small><i>'+icon('plus')+'</i></button>').join('')+'</div><p class="body-note subtle">Pieces are illustrative and sized approximately. A clear position is found automatically in your chosen room.</p></section>';
}
function renderInspector(){
 editorSections.capture();
 kitchenMaterialsUI?.sync();
 $('#inspector-content').innerHTML=activeTab==='walls'?wallsPanel():activeTab==='kitchen'?kitchenPanel():furniturePanel();
 if(activeTab==='kitchen'&&kitchenMaterialsUI)$('#kitchen-materials-slot').append(kitchenMaterialsUI.element);
 editorSections.decorate(activeTab);
}
function updateViewCopy(roomName=null){
 viewRoomName=roomName;
 const titles={dollhouse:'The whole picture.',top:'Every room, in view.',walk:'Step inside your ideas.'};
 const subtitles={dollhouse:'A little imagination. A space that feels like you.',top:state.mirrored?'Your confirmed mirrored layout, seen from above.':'The brochure layout, seen from above.',walk:'Explore the home at eye level.'};
 const viewNames={dollhouse:'Dollhouse',top:'Floor plan',walk:'Walk through'};
 $('#view-title').textContent=state.title||(roomName?roomName+', reimagined.':titles[cameraMode]);
 $('#view-title').title=state.title||'';
 $('#view-subtitle').textContent=state.title?(roomName?roomName+' · ':'')+viewNames[cameraMode]:subtitles[cameraMode];
 $('.scene-heading').classList.toggle('has-design-title',Boolean(state.title));
 $('#project-name').textContent=state.title||'Our next chapter';$('#project-name').title=state.title||'';
 document.title=state.title?state.title+' — Home Studio':'Home Studio — Your space, reimagined';
 $('#interaction-hint').textContent=cameraMode==='walk'?'W A S D / arrows to move · drag to look around':cameraMode==='top'?'Select a room · drag furniture to rearrange · + / − to zoom':'W A S D to pan · drag to orbit · scroll to zoom';
 $('#walk-controls').hidden=cameraMode!=='walk';$('.scene-zoom').hidden=cameraMode==='walk';
}
function setView(mode){if(!['dollhouse','top','walk'].includes(mode))return;$('.scene-panel').classList.remove('yard-storage-view');cameraMode=mode;viewer?.setView(mode);document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===mode);b.setAttribute('aria-pressed',String(b.dataset.view===mode));});updateViewCopy();}
function uniqueId(prefix){return prefix+'-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9));}
function findSpace(item,roomId=currentRoom){
 const room=roomById(roomId);if(!room?.walkable)return null;
 const [x1,z1,x2,z2]=room.bounds,center={x:(x1+x2)/2,z:(z1+z2)/2},regions=roomRegions(room);
 const positions=regions.map(([left,top,right,bottom])=>({x:(left+right)/2,z:(top+bottom)/2}));
 for(const [left,top,right,bottom] of regions)for(let x=left+.1;x<right;x+=.2)for(let z=top+.1;z<bottom;z+=.2)positions.push({x:round(x),z:round(z)});
 positions.sort((a,b)=>Math.hypot(a.x-center.x,a.z-center.z)-Math.hypot(b.x-center.x,b.z-center.z));
 for(const rotation of [...new Set([item.rotation||0,0,90])])for(const p of positions){
  const candidate={...item,...p,rotation},inside=[[candidate.x,candidate.z],...footprint(candidate)].every(([x,z])=>pointInRoom(x,z)?.id===roomId);
  if(inside&&canPlace(candidate,state.furniture,state.kitchen,state.yard).ok)return candidate;
 }
 return null;
}
function addFurniture(type,source=null){
 const entry=getCatalogItem(type);if(!entry)return;
 const item=source?{...source,id:uniqueId(type)}:{id:uniqueId(type),type,label:entry.label,color:entry.color,variant:'classic',mirrored:false,rotation:0};
 const candidate=findSpace(item);
 if(!candidate){toast('There is no clear space for that '+entry.label.toLowerCase()+' in '+roomById(currentRoom).name+'. Try another room or move an existing piece.');return;}
 if(commit(draft=>{draft.furniture.push(candidate);})){selectFurniture(candidate.id);toast(entry.label+' added to '+roomById(currentRoom).name+'.');}
}
function editFurniture(mutator){if(!selectedFurniture)return false;return commit(draft=>{const item=draft.furniture.find(i=>i.id===selectedFurniture);if(!item)throw new Error('Select a piece of furniture first.');mutator(item);});}
function moveFurniture(direction){const mirror=state.mirrored?-1:1,offset={up:[0,-.2],down:[0,.2],left:[-.2*mirror,0],right:[.2*mirror,0]}[direction];if(offset)editFurniture(i=>{i.x=round(i.x+offset[0]);i.z=round(i.z+offset[1]);});}
function removeFurniture(){if(selectedFurniture)commit(draft=>{draft.furniture=draft.furniture.filter(i=>i.id!==selectedFurniture);},'Piece removed. Undo brings it back.');}
function download(data,filename,type){const dataUrl=typeof data==='string'&&data.startsWith('data:'),url=dataUrl?data:URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();if(!dataUrl)setTimeout(()=>URL.revokeObjectURL(url),1000);}


const videoFrames=()=>manifest?manifest.videos.flatMap(video=>video.frames.map(frame=>({...frame,videoLabel:video.label,videoSource:video.sourcePath}))):[];
const allReferences=()=>manifest?[...manifest.photos,...videoFrames(),manifest.floorplan]:[];
function openGallery(tab='photos',detail=null){galleryTab=tab;galleryDetail=detail;renderGallery();const dialog=$('#reference-dialog');if(!dialog.open)dialog.showModal();}
function showReference(id){const item=allReferences().find(i=>i.id===id);if(!item){openGallery();return;}openGallery(item.kind==='video-frame'?'videos':item.kind==='floorplan'?'plan':'photos',item.kind==='floorplan'?null:item.id);}
function renderGallery(){
 const content=$('#gallery-content');
 $('#gallery-tabs').innerHTML=[['photos','Photos <span>'+(manifest?.photos.length||10)+'</span>'],['videos','Video moments <span>'+(manifest?.videos.reduce((n,v)=>n+v.frames.length,0)||28)+'</span>'],['plan','Original plan']].map(([tab,label])=>'<button data-gallery-tab="'+tab+'" class="'+(galleryTab===tab?'active':'')+'" aria-pressed="'+(galleryTab===tab)+'">'+label+'</button>').join('');
 if(!manifest){content.innerHTML='<p class="gallery-note">'+(manifestError?'The reference library could not be loaded. Reload the page to try again.':'Opening your reference library…')+'</p>';return;}
 if(galleryTab==='plan'){
  content.innerHTML='<div class="plan-view"><img src="'+esc(manifest.floorplan.src)+'" alt="Original Type C1 floorplan showing 93 square metres"><div><p class="eyebrow">TYPE C1 · 2 BEDROOMS + STUDY</p><h3>Where the ideas begin.</h3><p>The brochure shows 93 m² (1,001 sq ft). Your home uses the mirrored arrangement you confirmed.</p><p>Room dimensions, furnishings and ceiling height in the model are estimates. The original plan has no dimension lines or scale bar.</p><a class="secondary-button" href="'+esc(manifest.floorplan.src)+'" target="_blank" rel="noopener">'+icon('image')+' Open original plan</a></div></div>';return;
 }
 const items=galleryTab==='photos'?manifest.photos:videoFrames(),detail=items.find(i=>i.id===galleryDetail);
 if(detail){
  content.innerHTML='<button class="text-button" data-action="gallery-back">'+icon('left')+' Back to '+(galleryTab==='photos'?'photos':'video moments')+'</button><div class="photo-detail"><img src="'+esc(detail.src)+'" alt="'+esc(detail.label)+'"><div><p class="eyebrow">'+(galleryTab==='photos'?'SUPPLIED PHOTOGRAPH':'VIDEO FRAME · '+detail.timestampSeconds.toFixed(1)+' SECONDS')+'</p><h3>'+esc(detail.label)+'</h3><p>'+esc(detail.observation)+'</p><p class="body-note subtle">'+(detail.videoLabel?esc(detail.videoLabel)+'<br>':'')+'Source: '+esc(detail.sourcePath||detail.videoSource)+'<br>Dimensions are unmeasured. Camera colors are indicative.</p><a class="secondary-button" href="'+esc(detail.src)+'" target="_blank" rel="noopener">'+icon('image')+' Open image</a></div></div>';
 }else{
  content.innerHTML='<p class="gallery-note">'+(galleryTab==='photos'?'The details, textures and everyday moments behind your model.':'28 moments from your 3 supplied walkthroughs. Select a frame for a closer look.')+'</p><div class="gallery-grid">'+items.map(i=>'<button data-reference="'+esc(i.id)+'"><img src="'+esc(i.src)+'" alt="'+esc(i.label)+'" loading="lazy"><strong>'+esc(i.label)+'</strong><small>'+(galleryTab==='photos'?esc(i.sourcePath):i.timestampSeconds.toFixed(1)+'s · '+esc(i.videoSource.split('/').pop()))+'</small></button>').join('')+'</div>';
 }
}
function togglePanel(name){
 const content=$('#'+name+'-panel-content'),button=$('[data-action="toggle-'+name+'"]');
 const collapsed=!content.hidden;
 content.hidden=collapsed;
 $('.workspace').classList.toggle(name+'-collapsed',collapsed);
 button.setAttribute('aria-expanded',String(!collapsed));
 const label=(collapsed?'Show ':'Hide ')+name+' panel';
 button.setAttribute('aria-label',label);button.title=label;
 button.innerHTML=icon((name==='rooms')===collapsed?'arrow':'left')+'<span class="toggle-label">'+(collapsed?'Show':'Hide')+'</span>';
 viewer?.resizeKeepingView();
}
const actions={
 'toggle-rooms'(){togglePanel('rooms');},'toggle-editor'(){togglePanel('editor');},
 'saved-designs'(){designLibraryUI.open();},
 'reset-colors'(){if(commit(draft=>{Object.assign(draft,resetOriginalColors(draft));},'Original colors restored. Your layout is unchanged.'))kitchenMaterialsUI.sync({reset:true});},
 'reset-backsplash-color'(){commit(draft=>{draft.kitchen.backsplashColor=ORIGINAL_BACKSPLASH_COLOR;},'Original copper backsplash restored.');},
 'reset-yard-color'(){commit(draft=>{setYardCabinetColor(draft,createDefaultState().yardCabinetColor);},'Yard cabinet finish restored to original orange.');},
 undo(){if(history.canUndo){history.undo();syncDesign();kitchenMaterialsUI.sync({reset:true});}},redo(){if(history.canRedo){history.redo();syncDesign();kitchenMaterialsUI.sync({reset:true});}},
 references(){openGallery();},plan(){openGallery('plan');},'close-gallery'(){$('#reference-dialog').close();},'gallery-back'(){galleryDetail=null;renderGallery();},
 import(){$('#import-file').click();},
 export(){download(JSON.stringify(state,null,2)+'\n','home-studio-design.json','application/json');toast('Design exported. Import it here whenever you are ready.');},
 screenshot(){if(!viewer){toast('The 3D view is not available yet.');return;}try{download(viewer.screenshot(),'home-studio-'+cameraMode+'.png','image/png');toast('Your view is ready to keep.');}catch{toast('The screenshot could not be created in this browser.');}},
 'reset-view'(){setView('dollhouse');},'zoom-in'(){viewer?.zoom(1);},'zoom-out'(){viewer?.zoom(-1);},
 'paint-all'(){const color=state.wallColors[currentRoom];commit(d=>{for(const id of Object.keys(d.wallColors))d.wallColors[id]=color;},'One palette, throughout your home.');},
 'focus-kitchen'(){selectRoom('kitchen');},
 'apply-master-styler'(){if(commit(draft=>{applyMasterStyler(draft,{allowBedShift:true});},'LG Styler added beside the master-bedroom wardrobe. Undo restores the previous arrangement.'))actions['focus-master-styler']();},
 'focus-master-styler'(){
  const item=state.furniture.find(i=>i.id===selectedFurniture&&i.type===LG_STYLER.type)||state.furniture.find(i=>i.type===LG_STYLER.type&&pointInRoom(i.x,i.z)?.id==='master');if(!item)return;
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectFurniture(item.id);viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusFurniture(item.id);updateViewCopy('LG Styler and wardrobe');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'apply-kitchen-prep'(){
  if(commit(draft=>{const modules=kitchenPrepModules(draft.kitchen);if(!modules)throw new Error('This adjustment needs a wide sink cabinet between the dishwasher and stove.');draft.kitchen.modules=modules;},'Sink moved next to the dishwasher. More worktop is now clear beside the stove.')){
   if(lightingPreview)actions['lighting-preview']();
   setView('dollhouse');selectRoom('kitchen');setTab('kitchen');editorSections.open('kitchen:cabinet-layout');$('.scene-panel').scrollIntoView({block:'nearest'});
  }
 },
 'apply-living-seating'(){if(commit(draft=>{if(!applyLivingSeating(draft))throw new Error('Add a coffee table first, then apply the living seating.');},'Veronica table and two Solange chairs applied.'))actions['focus-living-seating']();},
 'apply-l-sofa'(){const layout=$('#l-sofa-layout')?.value??'balcony-chaise';if(commit(draft=>{if(!applyLShapedSofa(draft,{layout,arrange:true}))throw new Error('Add a sofa in the living room first.');},'L-shaped sofa arranged beside the balcony.'))actions['focus-l-sofa']();},
 'focus-l-sofa'(){
  const item=state.furniture.find(i=>i.id===selectedFurniture&&i.type===L_SOFA.type)||state.furniture.find(i=>i.type===L_SOFA.type&&pointInRoom(i.x,i.z)?.id==='living');if(!item)return;
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectFurniture(item.id);viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusFurniture(item.id);updateViewCopy('L-shaped sofa by the balcony');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-living-seating'(){
  const item=state.furniture.find(i=>i.type===VERONICA_COFFEE.type)||state.furniture.find(i=>i.type===SOLANGE_CHAIR.type);if(!item)return;
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectFurniture(item.id);viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusFurniture(item.id);updateViewCopy('Living seating');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-dining'(){
  const item=state.furniture.find(i=>i.id===selectedFurniture)||state.furniture.find(i=>i.type===VINCENT_DINING.type||i.type==='dining');if(!item)return;
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectFurniture(item.id);viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusFurniture(item.id);updateViewCopy('Dining');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-yard-storage'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectRoom('yard',false);viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusYardStorage();$('.scene-panel').classList.add('yard-storage-view');updateViewCopy('Fridge & appliance storage');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-db-vacuum'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectRoom('yard',false);setTab('walls');editorSections.open('walls:db-vacuum');viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusYardStorage(true);$('.scene-panel').classList.add('yard-storage-view');updateViewCopy('Robot vacuum in lower DB cabinet');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'apply-bedroom-office'(){if(commit(s=>{applyBedroomOffice(s,{arrange:true});},'Bedroom 2 is now a two-person office. Undo restores the previous room.'))actions['focus-bedroom-office']();},
 'focus-bedroom-office'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectRoom('bedroom2',false);setTab('furniture');selectedFurniture=state.furniture.find(i=>i.type===OMNIDESK.type&&pointInRoom(i.x,i.z)?.id==='bedroom2')?.id??null;viewer?.setSelected(selectedFurniture);renderInspector();if(selectedFurniture)editorSections.open('furniture:selected-furniture');viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusBedroomOffice();updateViewCopy('Two-person office');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-end-upper'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectRoom('kitchen',false);setTab('kitchen');viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusEndUpper();updateViewCopy('End-cabinet door clearance');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-front-upper'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('dollhouse');selectRoom('kitchen',false);setTab('kitchen');editorSections.open('kitchen:front-upper');viewer?.setWalls(false);viewer?.setCeiling(false);$('#full-walls').checked=false;$('#show-ceiling').checked=false;viewer?.focusFrontUpper();updateViewCopy('Living-end upper cabinet');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-kitchen-fan'(){
  if(lightingPreview)actions['lighting-preview']();
  setView('walk');selectRoom('kitchen',false);setTab('kitchen');editorSections.open('kitchen:directional-fan');viewer?.setWalls(true);viewer?.setCeiling(true);$('#full-walls').checked=true;$('#show-ceiling').checked=true;viewer?.focusKitchenFan();$('.scene-panel').classList.add('yard-storage-view');updateViewCopy('Kitchen fan placement');$('.scene-panel').scrollIntoView({block:'nearest'});
 },
 'focus-kitchen-fan-detail'(){actions['focus-kitchen-fan']();viewer?.focusKitchenFan(true);updateViewCopy('Kitchen fan close up');},
 'lighting-preview'(){
  lightingPreview=!lightingPreview;viewer?.setLightingPreview(lightingPreview);
  if(lightingPreview){setView('walk');selectRoom('kitchen',false);viewer?.focusKitchenLighting();updateViewCopy('Kitchen');$('.scene-panel').scrollIntoView({block:'nearest'});}
  $('#lighting-preview-status').hidden=!lightingPreview;$('.scene-panel').classList.toggle('lighting-preview',lightingPreview);renderInspector();
 },
 'add-module'(){
  const total=state.kitchen.modules.reduce((n,m)=>n+m.width,0),width=Math.min(.6,Math.floor((KITCHEN_RUN_LENGTH-total+1e-9)*20)/20);
  if(width<.3||state.kitchen.modules.length>=8){toast('The kitchen run is full. Reduce a module width to make room.');return;}
  const id=uniqueId('cab');if(commit(d=>{d.kitchen.modules.push({id,type:'doors',width});})){selectedCabinet=id;renderInspector();}
 },
 'remove-module'(){if(state.kitchen.modules.length<=1){toast('Keep at least one module in the kitchen.');return;}commit(d=>{d.kitchen.modules=d.kitchen.modules.filter(m=>m.id!==selectedCabinet);});},
 duplicate(){const item=state.furniture.find(i=>i.id===selectedFurniture);if(item)addFurniture(item.type,item);},delete:removeFurniture,
 restore(){if(commit(()=>createDefaultState(),'The original design is back. Undo to return to your ideas.')){selectedFurniture=null;viewer?.setSelected(null);kitchenMaterialsUI.sync({reset:true});renderInspector();updateViewCopy();}}
};
document.addEventListener('click',event=>{
 const button=event.target.closest('button,a.brand');if(!button||button.disabled)return;
 if(button.matches('.brand')){event.preventDefault();actions['reset-view']();return;}
 const d=button.dataset;
 if(d.action&&actions[d.action]){actions[d.action]();return;}
 if(d.room){selectRoom(d.room);return;}if(d.tab){setTab(d.tab);return;}if(d.view){setView(d.view);return;}
 if(d.paint){commit(s=>{s.wallColors[currentRoom]=d.paint;});return;}if(d.finish){commit(s=>{setKitchenColor(s.kitchen,'color',d.finish);});return;}if(d.style){commit(s=>{s.kitchen.style=d.style;});return;}
 if(d.yardFinish){commit(s=>{setYardCabinetColor(s,d.yardFinish);});return;}
 if(d.upperFinish){commit(s=>{setKitchenColor(s.kitchen,'upperColor',d.upperFinish);});return;}
 if(d.backsplashFinish){commit(s=>{s.kitchen.backsplashColor=d.backsplashFinish;});return;}
 if(d.module){selectedCabinet=d.module;renderInspector();return;}if(d.variant){editFurniture(i=>{i.variant=d.variant;});return;}
 if(d.move){moveFurniture(d.move);return;}if(d.rotate){editFurniture(i=>{i.rotation+=Number(d.rotate);});return;}
 if(d.add){addFurniture(d.add);return;}if(d.reference){showReference(d.reference);return;}
 if(d.galleryTab){galleryTab=d.galleryTab;galleryDetail=null;renderGallery();}
});
document.addEventListener('input',event=>{
 const input=event.target;
 if(input.matches('input[type="range"][data-field]'))$('#'+input.id+'-output').textContent=mm(Number(input.value));
 if(input.matches('input[type="color"]')){const code=input.closest('.custom-color')?.querySelector('code');if(code)code.textContent=input.value.toUpperCase();if(input.id==='wall-color')$('.paint-preview')?.style.setProperty('--paint',input.value);}
});
document.addEventListener('change',async event=>{
 const input=event.target;
 if(input.id==='import-file'){
  const file=input.files[0];input.value='';if(!file)return;if(file.size>2*1024*1024){toast('Choose a Home Studio JSON design smaller than 2 MB.');return;}
  try{const imported=JSON.parse(await file.text());if(commit(()=>imported,'Design imported. Your next idea starts here.')){selectedFurniture=null;viewer?.setSelected(null);kitchenMaterialsUI.sync({reset:true});renderInspector();updateViewCopy();}}catch{toast('That file is not valid JSON. Choose a design exported by Home Studio.');}return;
 }
 if(input.id==='paint-room'||input.id==='furniture-room'){selectRoom(input.value);return;}
 if(input.id==='selected-furniture'){selectFurniture(input.value,true);return;}
 if(input.id==='show-labels'){viewer?.setLabels(input.checked);return;}if(input.id==='full-walls'){viewer?.setWalls(input.checked);return;}if(input.id==='show-ceiling'){viewer?.setCeiling(input.checked);return;}
 if(input.id==='mirror-home'){commit(s=>{s.mirrored=input.checked;});updateViewCopy();return;}
 if(input.id==='upper-cabinets'){commit(s=>{s.kitchen.upper=input.checked;});return;}
 if(input.id==='fridge-surround'){commit(s=>{s.yard??={fridgeSurround:false,laundry:'stacked'};s.yard.fridgeSurround=input.checked;if(input.checked)s.yard.fridgeModel='panasonic-nr-f603gt-ss';});return;}
 if(input.id==='yard-laundry'){commit(s=>{s.yard??={fridgeSurround:false,laundry:'stacked'};s.yard.laundry=input.value;if(input.value==='combo-tower')s.yard.laundryModel='lg-fv1413h2ba';else delete s.yard.laundryModel;});return;}
 if(input.id==='db-robot-vacuum'){if(commit(s=>{s.yard??={fridgeSurround:false,laundry:'stacked'};if(input.value)s.yard.robotVacuum=input.value;else delete s.yard.robotVacuum;}))if(input.value)actions['focus-db-vacuum']();return;}
 if(input.id==='task-lighting'){commit(s=>{s.kitchen.taskLighting=input.checked;});return;}
 if(input.id==='kitchen-directional-fan'){if(commit(s=>{s.kitchen.directionalFan=input.checked;}))actions['focus-kitchen-fan']();return;}
 if(input.id==='end-upper-doors'){if(commit(s=>{if(input.value)s.kitchen.endUpperDoors=input.value;else delete s.kitchen.endUpperDoors;}))actions['focus-end-upper']();return;}
 if(input.id==='front-upper-shelves'){if(commit(s=>{s.kitchen.frontUpperShelves=input.checked;}))actions['focus-front-upper']();return;}
 if(input.id==='module-type'){commit(s=>{const module=s.kitchen.modules.find(m=>m.id===selectedCabinet);module.type=input.value;if(module.storage&&!KITCHEN_STORAGE_TYPES[module.storage].includes(module.type))delete module.storage;});return;}
 if(input.id==='module-storage'){commit(s=>{const module=s.kitchen.modules.find(m=>m.id===selectedCabinet);if(input.value)module.storage=input.value;else delete module.storage;});return;}
 if(input.id==='replace-furniture'){const entry=getCatalogItem(input.value);if(entry){const replaced=editFurniture(i=>{if(entry.type===VINCENT_DINING.type)Object.assign(i,useVincentDining(i));else if(getLivingProduct(entry.type))Object.assign(i,useLivingProduct(i,entry.type));else if(getOfficeProduct(entry.type))Object.assign(i,useOfficeProduct(i,entry.type));else{i.type=entry.type;i.label=entry.label;i.color=entry.color;}});if(replaced&&entry.type===VINCENT_DINING.type)actions['focus-dining']();else if(replaced&&getLivingProduct(entry.type))actions['focus-living-seating']();else if(replaced&&getOfficeProduct(entry.type))actions['focus-bedroom-office']();}return;}
 const field=input.dataset.field,value=input.type==='range'?Number(input.value):input.value;
 if(field==='wall-color')commit(s=>{s.wallColors[currentRoom]=value;});
 else if(field==='yard-cabinet-color')commit(s=>{setYardCabinetColor(s,value);});
 else if(field==='furniture-color')editFurniture(i=>{i.color=value;});
 else if(field==='module-width')commit(s=>{s.kitchen.modules.find(m=>m.id===selectedCabinet).width=value;});
 else if(['kitchen-color','upper-color','counter-color','backsplash-color','kitchen-depth','kitchen-height'].includes(field)){const key={'kitchen-color':'color','upper-color':'upperColor','counter-color':'counterColor','backsplash-color':'backsplashColor','kitchen-depth':'depth','kitchen-height':'height'}[field];commit(s=>{setKitchenColor(s.kitchen,key,value);});}
});
document.addEventListener('keydown',event=>{
 const target=event.target,editing=target instanceof HTMLElement&&(target.matches('input,select,textarea,button,summary')||target.isContentEditable);
 if(editing||document.querySelector('dialog[open]'))return;
 const key=event.key.toLowerCase();
 if((event.ctrlKey||event.metaKey)&&!event.altKey){if(key==='z'){event.preventDefault();actions[event.shiftKey?'redo':'undo']();}else if(key==='y'){event.preventDefault();actions.redo();}return;}
 if(cameraMode==='walk'||!selectedFurniture||event.altKey)return;
 const direction={arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right'}[key];
 if(direction){event.preventDefault();moveFurniture(direction);}else if(key==='r'){event.preventDefault();editFurniture(i=>{i.rotation+=event.shiftKey?-45:45;});}else if(key==='delete'){event.preventDefault();removeFurniture();}else if(key==='escape')selectFurniture(null);
});
$('#reference-dialog').addEventListener('click',event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();});
document.querySelectorAll('[data-walk]').forEach(button=>{
 button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);viewer?.setWalkInput(button.dataset.walk,true);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>viewer?.setWalkInput(button.dataset.walk,false));
});
function loadDesignSnapshot(design,title){
  // Saved snapshots can predate a geometry correction, just like the active
  // browser design. Preserve their contents so any overlaps can be repaired.
  const next=validateDesign(design);if(title!==undefined)next.title=title;
  history.commit(next);selectedFurniture=null;
  syncDesign();kitchenMaterialsUI.sync({reset:true});updateViewCopy();
  if(state.furniture.some(item=>!canPlace(item,state.furniture,state.kitchen,state.yard).ok))return 'Some pieces overlap the updated layout; move them to a clear space. Undo returns to your previous design.';
}
kitchenMaterialsUI=createKitchenMaterialsEditor({
 getDesign:()=>state,notify:toast,
 applyDesign(design,title){
  const note=loadDesignSnapshot(design,title);
  setView('dollhouse');selectRoom('kitchen');setTab('kitchen');
  return note;
 }
});
designLibraryUI=createSavedDesignsDialog({
 getDesign:()=>state,download,notify:toast,loadDesign:loadDesignSnapshot,
 onKitchenDesignLoaded(){if(state.kitchen.directionalFan)actions['focus-kitchen-fan']();else if(getDreameProduct(state.yard?.robotVacuum))actions['focus-db-vacuum']();else if(state.furniture.some(item=>item.type===L_SOFA.type&&pointInRoom(item.x,item.z)?.id==='living'))actions['focus-l-sofa']();else if(state.furniture.some(item=>item.type===LG_STYLER.type&&pointInRoom(item.x,item.z)?.id==='master'))actions['focus-master-styler']();else if(state.furniture.some(item=>item.type===OMNIDESK.type&&pointInRoom(item.x,item.z)?.id==='bedroom2'))actions['focus-bedroom-office']();else if(state.furniture.some(item=>item.type===VERONICA_COFFEE.type))actions['focus-living-seating']();else{const dining=state.furniture.find(item=>item.type===VINCENT_DINING.type);if(dining){selectedFurniture=dining.id;actions['focus-dining']();}else{setTab('kitchen');actions['focus-yard-storage']();}}}
});
syncDesign();
try{
 viewer=createViewer($('#scene'),{
  onSelect(kind,id){if(kind==='furniture')selectFurniture(id);else if(kind==='cabinet'){selectedCabinet=id;selectRoom('kitchen',false);setTab('kitchen');editorSections.open('kitchen:cabinet-layout');}else if(kind==='kitchen'){selectRoom('kitchen',false);setTab('kitchen');editorSections.open('kitchen:cabinet-layout');}else if(kind==='room'&&roomById(id)?.walkable){selectRoom(id,false);setTab('walls');}},
  onMove(id,x,z){selectedFurniture=id;if(commit(s=>{const i=s.furniture.find(i=>i.id===id);if(i){i.x=round(x);i.z=round(z);}}))selectFurniture(id);}
 });
 viewer.setState(state);$('#loading').remove();
}catch(error){const loading=$('#loading');loading.innerHTML=icon('cube')+'<strong>The 3D view could not start.</strong><span>Try reloading in a browser with WebGL enabled. You can still edit and export your design.</span>';loading.setAttribute('role','alert');console.error('Home Studio viewer initialization failed:',error);}
fetch('./references/manifest.json').then(response=>{if(!response.ok)throw new Error('Reference library unavailable.');return response.json();}).then(data=>{if(!Array.isArray(data.photos)||!Array.isArray(data.videos)||!data.floorplan)throw new Error('Invalid reference library.');manifest=data;renderInspector();if($('#reference-dialog').open)renderGallery();}).catch(()=>{manifestError=true;if($('#reference-dialog').open)renderGallery();});
if(recoveryMessage)toast(recoveryMessage);

