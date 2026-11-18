import {validateDesign} from './state.js';

export const LIBRARY_STORAGE_KEY = 'home-studio-library-v1';
export const LIBRARY_MAX_BYTES = 5 * 1024 * 1024;

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(label + ' must be a plain object.');
  }
  return value;
}

function own(value, key, label) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new Error(label + ' must contain a plain value.');
  return descriptor.value;
}

function designName(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80 || /[<>\u0000-\u001f\u007f]/.test(value)) {
    throw new Error('Design name must be 1–80 characters of plain text.');
  }
  return value.trim();
}

function snapshot(value, ids) {
  const entry = record(value, 'Saved design');
  const id = own(entry, 'id', 'Saved design ID');
  if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id) || ['constructor', 'prototype'].includes(id) || ids.has(id)) {
    throw new Error('Saved design IDs must be unique and contain 1–80 letters, numbers, hyphens or underscores.');
  }
  ids.add(id);
  const updatedAt = own(entry, 'updatedAt', 'Saved design date');
  if (typeof updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(updatedAt) || !Number.isFinite(Date.parse(updatedAt)) || new Date(updatedAt).toISOString() !== updatedAt) {
    throw new Error('Saved design date must be a valid ISO timestamp.');
  }
  return {
    id, name: designName(own(entry, 'name', 'Design name')), updatedAt,
    design: validateDesign(own(entry, 'design', 'Saved design contents')),
  };
}

function envelope(value) {
  const input = record(value, 'Design library');
  if (own(input, 'version', 'Design library version') !== 1) throw new Error('Design library version must be 1.');
  const entries = own(input, 'designs', 'Saved designs');
  if (!Array.isArray(entries)) throw new Error('Saved designs must be a list.');
  const ids = new Set();
  return {version: 1, designs: Array.from({length: entries.length}, (_, index) => snapshot(own(entries, index, 'Saved design'), ids))};
}

function uniqueId(ids) {
  const seed = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const base = 'design-' + seed;
  let id = base, suffix = 1;
  while (ids.has(id)) id = base + '-' + suffix++;
  return id;
}

function checkSize(text) {
  if (new TextEncoder().encode(text).byteLength > LIBRARY_MAX_BYTES) throw new Error('Design library is too large. Keep saved designs and imports within the 5 MB limit.');
}

// Read on every operation so another tab's saves are visible, and failed writes
// cannot leave an in-memory library that differs from the stored snapshots.
export function createDesignLibrary(storage) {
  function read() {
    let text;
    try { text = storage.getItem(LIBRARY_STORAGE_KEY); }
    catch { throw new Error('Cannot read saved designs. Browser storage is unavailable.'); }
    if (text === null) return {version: 1, designs: []};
    try { return envelope(JSON.parse(text)); }
    catch (error) { throw new Error('Saved designs could not be read. The stored library is invalid: ' + error.message); }
  }

  function write(designs) {
    const text = JSON.stringify({version: 1, designs});
    checkSize(text);
    try { storage.setItem(LIBRARY_STORAGE_KEY, text); }
    catch { throw new Error('Cannot save designs. Browser storage may be full or unavailable. Export a backup before trying again.'); }
  }

  function find(designs, id) {
    const entry = designs.find(item => item.id === id);
    if (!entry) throw new Error('That saved design was not found. It may have been removed in another tab.');
    return entry;
  }

  return {
    list() {
      return read().designs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    save(name, design) {
      const {designs} = read();
      const entry = {
        id: uniqueId(new Set(designs.map(item => item.id))),
        name: designName(name), updatedAt: new Date().toISOString(), design: validateDesign(design),
      };
      entry.design.title=entry.name;
      write([entry, ...designs]);
      return structuredClone(entry);
    },
    load(id) {
      const entry=find(read().designs,id);
      return {...entry.design,title:entry.name};
    },
    remove(id) {
      const {designs} = read();
      find(designs, id);
      write(designs.filter(item => item.id !== id));
      return true;
    },
    exportAll() {
      // Use the same compact encoding as storage, so any saved library fits
      // the import limit when its backup is transferred to another browser.
      return JSON.stringify(read());
    },
    importAll(data) {
      const {designs} = read();
      let input = data;
      if (typeof data === 'string') {
        checkSize(data);
        try { input = JSON.parse(data); }
        catch { throw new Error('Choose a valid saved-design library JSON file.'); }
      }
      const incoming = envelope(input);
      checkSize(JSON.stringify(incoming));
      const ids = new Set(designs.map(item => item.id));
      const additions = incoming.designs.map(entry => {
        const id = ids.has(entry.id) ? uniqueId(ids) : entry.id;
        ids.add(id);
        return {...entry, id};
      });
      if (additions.length) write([...additions, ...designs]);
      return additions.length;
    },
  };
}
