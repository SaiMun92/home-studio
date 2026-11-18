import {createDesignLibrary,LIBRARY_MAX_BYTES} from './design-library.js';
import {getKitchenMaterial} from './kitchen-materials.js';
import {DESIGNER_KITCHEN,applyDesignerKitchen} from './designer-kitchen.js';
import {KITCHEN_STORAGE} from './kitchen-storage.js';

const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

function designerProposal(){
  const laminate=getKitchenMaterial('cinamon-poplar','laminate');
  const countertop=getKitchenMaterial('calcatta-pottoro-extra','countertop');
  const labels={drawers:'Prep drawers',dishwasher:'Dishwasher',sink:'Single-bowl sink',doors:'Storage',hob:'Hob & oven'};
  return `<section class="designer-proposal" aria-labelledby="designer-kitchen-title">
    <p class="eyebrow">DESIGNER PROPOSAL</p><h3 id="designer-kitchen-title">${escape(DESIGNER_KITCHEN.name)}</h3>
    <p class="library-note">${escape(DESIGNER_KITCHEN.summary)}</p>
    <div class="designer-materials">${[[laminate,'Lower cabinets'],[countertop,'Countertop']].map(([sample,label])=>`<figure><img src="${escape(sample.image)}" alt="${escape(sample.name)} sample" width="170" height="70"><figcaption><span>${label}</span><strong>${escape(sample.name)}</strong></figcaption></figure>`).join('')}</div>
    <p class="library-note">The original-size sink sits beside the dishwasher, leaving about 50 cm of clear prep space before the stove, with drawers below. Warm off-white upper cabinets and yard cabinet, an ivory backsplash, and a clear, level counter at the living-room end.</p>
    <p class="library-note">Cinnamon Poplar carpentry frames the fridge, with a cupboard above. Beside it, an LG FV1413H2BA washer/dryer combo sits below open appliance shelves with an air fryer, multicooker and blender visible in 3D.</p>
    <p class="library-note">The dining table is replaced in place with your selected 150 cm Castlery Vincent in walnut, with four matching chairs and dark upholstered seats. The 150 × 80 × 76 cm table follows the published dimensions; chairs are approximated from your photo.</p>
    <p class="library-note">In the living area, the Sand Veronica round coffee table is paired with two Chalk Bouclé Solange chairs in White Wash. They sit alongside your existing sofa. The coffee table is 70 cm across and 34 cm high; each chair is 68 × 77 × 75 cm.</p>
    <p class="library-note">Bedroom 2 becomes a two-person office: two Small Omnidesk Classic Wildwood desks face opposite side walls, each with a monitor and movable ergonomic chair. The bed is removed; the built-in wardrobe stays in place with its doors facing into the room. Low white window ledges, about 37.5 cm high, are included in Bedroom 2, the master bedroom and the study.</p>
    <details class="designer-details"><summary>View layout and storage plan</summary>
      <p>Cabinet plan, from the living room toward the yard:</p>
      <ol class="designer-run">${DESIGNER_KITCHEN.modules.map(module=>`<li><strong>${escape(module.type==='sink'?labels.sink:KITCHEN_STORAGE[module.storage]||labels[module.type])}</strong><span>${Math.round(module.width*1000)} mm</span></li>`).join('')}</ol>
      <p>About 500 mm of clear worktop separates the stove edge and sink rim. The sink and centered tap move 200 mm toward the dishwasher into a 700 mm cabinet, retaining the basin size. A 400 mm prep-drawer unit replaces the freed part of the previous 1100 mm sink bay. The dishwasher, stove, oven and hood stay in their previous proposal positions. The fitted rear cabinet remains 400 mm, and the drawers at the living end retain their extra 100 mm extension with open space above.</p>
      <p>Use the living-end drawers for drinks and serving items, the new prep drawers for utensils and cookware, allow waste storage around the sink plumbing, and keep small appliances in the bay after the hob. Storage assignments can be viewed and edited under Kitchen → Storage plan when a module is selected. The final upper cabinet beside the fridge has two shorter doors shown open at 90°, with a visible shelf. Their free edges align with the tiled wall edge. Other kitchen fronts remain closed; the yard appliance shelves are open and modeled.</p>
      <p>The space-grey Panasonic NR-F603GT-SS is modeled at 685 W × 1828 H × 745 D mm; the black LG FV1413H2BA washer/dryer at 600 W × 850 H × 615 D mm. Cabinet openings and small appliances are conceptual. Open platforms are shown retracted, on a frame supported separately from the washer/dryer. Confirm ventilation, hoses, vibration and door clearances before fabrication.</p>
    </details>
    <div class="designer-actions"><button class="primary-button" data-library-action="load-designer" aria-label="Load ${escape(DESIGNER_KITCHEN.name)}">Load design</button><button class="secondary-button" data-library-action="save-designer">Save a copy</button><button class="text-button" data-library-action="export-designer">Export design</button></div>
    <p class="designer-scope">Loading applies the kitchen/yard proposal, replaces the existing dining set with the Vincent, adds the Veronica table with two Solange chairs, and converts Bedroom 2 to the two-person office. The coffee table may shift slightly to make room; unrelated furniture stays as edited. Office desks and chairs return to their planned positions while retaining their finishes. Personal saved copies are preserved. Loading opens the Bedroom 2 office view.</p>
  </section>`;
}

export function createSavedDesignsDialog({getDesign,loadDesign,download,notify,onKitchenDesignLoaded}){
  // Defer browser-storage access so an unavailable library cannot prevent editing.
  const library=createDesignLibrary({
    getItem:key=>localStorage.getItem(key),
    setItem:(key,value)=>localStorage.setItem(key,value),
  });
  const dialog=document.createElement('dialog');
  dialog.id='saved-designs-dialog';
  dialog.className='design-library';
  dialog.setAttribute('aria-labelledby','saved-designs-title');
  dialog.innerHTML=`
    <div class="dialog-header"><div><p class="eyebrow">KEEP YOUR IDEAS
    </p><h2 id="saved-designs-title" tabindex="-1">Saved designs</h2></div>
    <button class="icon-button" data-library-action="close" aria-label="Close saved designs">✕</button></div>
    <p class="library-message" role="status" aria-live="polite"></p>
    ${designerProposal()}
    <section class="library-personal-designs" aria-labelledby="personal-designs-title">
    <div class="library-section-heading"><h3 id="personal-designs-title">Your saved copies</h3></div>
    <p class="library-note">Keep named copies of your whole home, including colors, cabinetry and furniture.</p>
    <form id="save-design-form" class="library-save-form">
      <label for="saved-design-name">Design name</label>
      <div><input id="saved-design-name" name="designName" type="text" maxlength="80" required placeholder="e.g. Warm oak kitchen" autocomplete="off">
      <button type="submit" class="primary-button">Save current design</button></div>
      <small>Each save creates a separate copy. Later edits leave your saved copies intact.</small>
    </form>
    <div class="library-entries" aria-label="Saved design list"></div>
    <div class="library-transfer">
      <button class="secondary-button" data-library-action="export-all">Export all designs</button>
      <button class="secondary-button" data-library-action="import-all">Import saved designs</button>
      <input type="file" id="import-design-library" accept=".json,application/json" hidden>
    </div>
    <p class="library-note">Your copies are saved in this browser on this device. Export all designs to keep a backup or transfer them to another device.</p>
    </section>`;
  document.body.append(dialog);
  const find=selector=>dialog.querySelector(selector);
  let deleting=null;
  function message(text,error=false){
    const element=find('.library-message');
    element.textContent=text;element.classList.toggle('is-error',error);
    if(text&&dialog.open)element.scrollIntoView({block:'nearest'});
  }
  function render(){
    find('[data-library-action="export-all"]').disabled=true;
    let entries;
    try{entries=library.list();}catch(error){
      find('.library-entries').innerHTML='<p class="library-empty">Your saved copies are unavailable. Your current home design is still open for editing.</p>';
      throw error;
    }
    find('[data-library-action="export-all"]').disabled=entries.length===0;
    find('.library-entries').innerHTML=entries.length?entries.map(entry=>{
      const design=entry.design;
      const colors=[design.wallColors.living,design.kitchen.color,design.kitchen.upperColor,design.kitchen.counterColor,design.kitchen.backsplashColor,design.yardCabinetColor];
      const lower=getKitchenMaterial(design.kitchen.lowerMaterial,'laminate');
      const upper=getKitchenMaterial(design.kitchen.upperMaterial,'laminate');
      const counter=getKitchenMaterial(design.kitchen.counterMaterial,'countertop');
      const finishes=lower&&lower.id===upper?.id?[[lower,'Cabinets']]:[[lower,'Lower cabinets'],[upper,'Upper cabinets']];
      finishes.push([counter,'Countertop']);
      const stamp=new Date(entry.updatedAt??entry.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
      const id=escape(entry.id),name=escape(entry.name);
      return `<article class="library-entry"><div class="library-entry-heading"><div><h3>${name}</h3><small>${escape(stamp)}</small></div>
        <div class="library-palette" aria-hidden="true">${colors.filter(Boolean).map(color=>`<span style="background:${escape(color)}"></span>`).join('')}</div></div>
        ${finishes.some(([sample])=>sample)?`<ul class="library-material-summary">${finishes.filter(([sample])=>sample).map(([sample,label])=>`<li><span>${label}</span> ${escape(sample.name)}</li>`).join('')}</ul>`:''}
        <div class="library-entry-actions">
          <button class="primary-button" data-library-action="load" data-id="${id}" aria-label="Load ${name}">Load design</button>
          <button class="secondary-button" data-library-action="export" data-id="${id}" aria-label="Export ${name}">Export</button>
          <button class="text-button" data-library-action="delete" data-id="${id}" aria-label="Delete ${name}">Delete</button>
        </div>
        ${deleting===entry.id?`<div class="library-delete-confirm"><span>Delete this saved copy?</span><button class="secondary-button danger" data-library-action="confirm-delete" data-id="${id}">Delete saved copy</button><button class="text-button" data-library-action="cancel-delete">Cancel</button></div>`:''}
      </article>`;
    }).join(''):'<p class="library-empty">No saved designs yet. Give your current design a name to keep your first copy.</p>';
  }
  function attempt(action){try{action();}catch(error){message(error instanceof Error?error.message:'The saved designs could not be updated.',true);}}
  find('form').addEventListener('submit',event=>{
    event.preventDefault();attempt(()=>{
      const saved=library.save(find('#saved-design-name').value,getDesign());
      find('#saved-design-name').value='';deleting=null;render();
      message(`Saved “${saved.name}”.`);
    });
  });
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('[data-library-action]');if(!button)return;
    const action=button.dataset.libraryAction,id=button.dataset.id;
    attempt(()=>{
      if(action==='close'){dialog.close();return;}
      if(['load-designer','save-designer','export-designer'].includes(action)){
        const design=applyDesignerKitchen(getDesign());
        if(action==='load-designer'){
          const note=loadDesign(design);dialog.close();onKitchenDesignLoaded?.();
          notify(`Loaded “${DESIGNER_KITCHEN.name}”. ${note||'Undo returns to your previous design.'}`);
        }else if(action==='save-designer'){
          library.save(DESIGNER_KITCHEN.name,design);deleting=null;render();
          message(`Saved “${DESIGNER_KITCHEN.name}”. Your working design is unchanged.`);
        }else download(JSON.stringify(design,null,2)+'\n','designer-inspiration.json','application/json');
        return;
      }
      if(action==='load'){
        const entry=library.list().find(item=>item.id===id);
        const note=loadDesign(library.load(id));dialog.close();
        notify(`Loaded “${entry.name}”. ${note||'Undo returns to your previous design.'}`);return;
      }
      if(action==='export'){
        const entry=library.list().find(item=>item.id===id);
        const filename=entry.name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,60)||'home-studio-design';
        download(JSON.stringify(library.load(id),null,2)+'\n',filename+'.json','application/json');return;
      }
      if(action==='delete'){deleting=id;render();return;}
      if(action==='cancel-delete'){deleting=null;render();return;}
      if(action==='confirm-delete'){library.remove(id);deleting=null;render();message('Saved copy deleted. Your current design is unchanged.');return;}
      if(action==='export-all'){download(library.exportAll(),'home-studio-designs.json','application/json');return;}
      if(action==='import-all'){find('#import-design-library').click();}
    });
  });
  find('#import-design-library').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    try{
      if(file.size>LIBRARY_MAX_BYTES)throw new Error('Choose a saved-design library of 5 MB or less.');
      const count=library.importAll(await file.text());deleting=null;render();
      message(`Imported ${count} saved ${count===1?'design':'designs'}.`);
    }catch(error){message(error instanceof Error?error.message:'That saved-design library could not be imported.',true);}
  });
  return {open(){deleting=null;message('');attempt(render);if(!dialog.open)dialog.showModal();find('#saved-designs-title').focus({preventScroll:true});dialog.scrollTop=0;}};
}
