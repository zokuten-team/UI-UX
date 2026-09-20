import { TemplateCategory, TemplateItem } from './template-registry';

// Store handles globally in the module so we can retrieve the actual File 
// when the user clicks a template without passing handles through all React props.
const globalFileHandles = new Map<string, any>();

export async function scanDirectoryHandle(directoryHandle: any): Promise<TemplateCategory[]> {
  globalFileHandles.clear();
  const categories: TemplateCategory[] = [];
  
  // First level: Categories (folders)
  for await (const [name, handle] of directoryHandle.entries()) {
    if (handle.kind === 'directory' && !name.startsWith('.')) {
      const templates: TemplateItem[] = [];
      
      // Second level: Template files
      for await (const [fileName, fileHandle] of handle.entries()) {
        if (fileHandle.kind === 'file' && !fileName.startsWith('.')) {
          const id = btoa(name + '/' + fileName);
          globalFileHandles.set(id, fileHandle);
          
          templates.push({
            id,
            category: name,
            name: fileName.replace(/\.[^/.]+$/, ""),
            filename: fileName,
            path: name + '/' + fileName
          });
        }
      }
      
      if (templates.length > 0) {
         templates.sort((a, b) => a.name.localeCompare(b.name));
         categories.push({ name, templates });
      }
    }
  }
  
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

export async function getFileFromHandle(id: string): Promise<File | null> {
  const handle = globalFileHandles.get(id);
  if (!handle) return null;
  return await handle.getFile();
}
