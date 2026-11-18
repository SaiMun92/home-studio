// Disclosure state belongs to this page session, never to saved design data.
// Keep section bodies intact: the Materials editor owns its DOM and listeners.
export function createEditorSections(container){
  const opened=new Map(),wrappers=new WeakMap();
  let renderedScope=null,scrollTop=0;
  function capture(){
    scrollTop=container.scrollTop;
    for(const details of container.querySelectorAll('.editor-disclosure'))opened.set(details.dataset.editorKey,details.open);
  }
  function decorate(scope){
    for(const section of container.querySelectorAll('section[data-editor-section]')){
      const key=scope+':'+section.dataset.editorSection;
      let details=wrappers.get(section);
      if(!details){
        const heading=section.querySelector(':scope > .field-heading > h3');
        if(!heading)continue;
        details=document.createElement('details');
        details.className='editor-disclosure';
        const summary=document.createElement('summary');
        summary.append(heading);details.append(summary);
        wrappers.set(section,details);
      }
      details.dataset.editorKey=key;
      details.open=opened.get(key)??false;
      if(section.parentElement!==details){section.replaceWith(details);details.append(section);}
    }
    container.scrollTop=scope===renderedScope?scrollTop:0;
    renderedScope=scope;
  }
  function open(key){
    opened.set(key,true);
    const details=[...container.querySelectorAll('.editor-disclosure')].find(element=>element.dataset.editorKey===key);
    if(details)details.open=true;
  }
  return {capture,decorate,open};
}
