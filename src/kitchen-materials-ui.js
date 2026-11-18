import {createDesignLibrary} from './design-library.js';
import {KITCHEN_DESIGNS,applyKitchenDesign} from './kitchen-designs.js';
import {KITCHEN_MATERIALS,getKitchenMaterial} from './kitchen-materials.js';

const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const materialFields=[['laminate','Cabinet laminate','lowerMaterial'],['countertop','Countertop','counterMaterial']];

export function createKitchenMaterialsEditor({getDesign,applyDesign,notify}){
  // Opening the editor and previewing samples do not require browser storage.
  const library=createDesignLibrary({
    getItem:key=>localStorage.getItem(key),
    setItem:(key,value)=>localStorage.setItem(key,value),
  });
  const element=document.createElement('section');
  element.className='editor-section kitchen-materials-editor';
  element.dataset.editorSection='materials';
  element.setAttribute('aria-labelledby','kitchen-materials-title');
  element.innerHTML=`
    <div class="field-heading"><h3 id="kitchen-materials-title">Materials</h3><p>Explore your laminate and countertop samples.</p></div>
    <div class="kitchen-material-picker">${materialFields.map(([kind,label])=>{
      const materials=KITCHEN_MATERIALS.filter(material=>material.kind===kind);
      const sample=materials[0];
      return `<div class="kitchen-material-option">
        <label for="kitchen-${kind}">${label}</label>
        <select id="kitchen-${kind}">${materials.map(material=>`<option value="${escape(material.id)}">${escape(material.name)}</option>`).join('')}</select>
        <figure class="kitchen-material-preview" id="kitchen-${kind}-preview">
          <img src="${escape(sample.image)}" alt="${escape(sample.name)} material sample" width="260" height="110">
          <figcaption><strong>${escape(sample.name)}</strong><span>${escape(sample.code)}</span>
            <a href="${escape(sample.swatch)}" target="_blank" rel="noopener" aria-label="View labeled sample photo: ${escape(sample.name)}">View labeled sample photo ↗</a>
          </figcaption>
        </figure>
      </div>`;
    }).join('')}</div>
    <div class="kitchen-material-selection">
      <div class="kitchen-material-pairing"><span>Selected pairing</span><h4 id="kitchen-material-pairing" aria-live="polite">${escape(KITCHEN_DESIGNS[0].name)}</h4></div>
      <div class="kitchen-material-actions"><button type="button" class="primary-button" data-kitchen-material-action="apply">Apply to kitchen</button>
      <button type="button" class="secondary-button" data-kitchen-material-action="save">Save a copy</button></div>
    </div>
    <p class="kitchen-material-note">The selected laminate covers both upper and lower cabinets. Apply to kitchen to see the materials in 3D, or save a copy to try later.</p>
    <p class="kitchen-material-note subtle">Previews use your photographed samples; color and grain scale are approximate.</p>
    <p class="kitchen-material-message" role="status" aria-live="polite"></p>`;
  const find=selector=>element.querySelector(selector);
  let actualSignature;

  function selectedOption(){
    const option=KITCHEN_DESIGNS.find(item=>item.laminateId===find('#kitchen-laminate').value&&item.countertopId===find('#kitchen-countertop').value);
    if(!option)throw new Error('Choose a cabinet laminate and countertop to continue.');
    return option;
  }
  function renderSelection(){
    for(const [kind] of materialFields){
      const sample=getKitchenMaterial(find(`#kitchen-${kind}`).value,kind);
      const preview=find(`#kitchen-${kind}-preview`);
      const img=preview.querySelector('img'),link=preview.querySelector('a');
      img.src=sample.image;img.alt=`${sample.name} material sample`;
      preview.querySelector('strong').textContent=sample.name;
      preview.querySelector('figcaption span').textContent=sample.code;
      link.href=sample.swatch;link.setAttribute('aria-label',`View labeled sample photo: ${sample.name}`);
    }
    const option=selectedOption();
    find('#kitchen-material-pairing').textContent=option.name;
    find('[data-kitchen-material-action="apply"]').setAttribute('aria-label',`Apply to kitchen: ${option.name}`);
    find('[data-kitchen-material-action="save"]').setAttribute('aria-label',`Save a copy of ${option.name}`);
  }
  function message(text,error=false){
    const status=find('.kitchen-material-message');
    status.textContent=text;status.classList.toggle('is-error',error);
  }
  function attempt(action){
    message('');
    try{action();}
    catch(error){message(error instanceof Error?error.message:'The kitchen materials could not be updated.',true);}
  }
  function sync({reset=false}={}){
    const kitchen=getDesign().kitchen;
    const signature=JSON.stringify([kitchen.lowerMaterial,kitchen.upperMaterial,kitchen.counterMaterial,kitchen.color,kitchen.upperColor,kitchen.counterColor]);
    // Reattaching this element after an unrelated edit must retain pending choices.
    if(!reset&&signature===actualSignature)return;
    for(const [kind,,field] of materialFields){
      const current=getKitchenMaterial(kitchen[field],kind);
      const upper=kind==='laminate'?getKitchenMaterial(kitchen.upperMaterial,kind):null;
      const sample=current||upper||KITCHEN_MATERIALS.find(material=>material.kind===kind);
      find(`#kitchen-${kind}`).value=sample.id;
    }
    actualSignature=signature;
    renderSelection();message('');
  }
  for(const [kind] of materialFields)find(`#kitchen-${kind}`).addEventListener('change',()=>attempt(renderSelection));
  element.addEventListener('click',event=>{
    const button=event.target.closest('[data-kitchen-material-action]');if(!button)return;
    const action=button.dataset.kitchenMaterialAction;
    if(action!=='apply'&&action!=='save')return;
    attempt(()=>{
      const option=selectedOption();
      const design=applyKitchenDesign(getDesign(),option.id);
      if(action==='apply'){
        const note=applyDesign(design,option.name);
        notify(`Applied “${option.name}”. ${note||'Undo returns to your previous design.'}`);
      }else{
        const saved=library.save(option.name,design);
        notify(`Saved “${saved.name}”. Find this copy in Saved designs.`);
      }
    });
  });
  return {element,sync};
}
