/* ── Template Registry ─────────────────────────────────────────────
 *
 * Reads and categorises the "English Law Drafts" directory structure
 * to provide a browsable list of legal templates.
 * ────────────────────────────────────────────────────────────────── */

export type TemplateItem = {
  id: string;
  category: string;
  name: string;
  filename: string;
  path: string;
};

export type TemplateCategory = {
  name: string;
  templates: TemplateItem[];
};

/**
 * In a real application, this would read the filesystem on the server
 * during the build step or via a dynamic API. For the frontend demonstration,
 * we provide a static list of the main categories found in the workspace.
 */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    name: "Affidavit",
    templates: [
      { id: "aff-1", category: "Affidavit", name: "General Affidavit", filename: "General Affidavit.rtf", path: "/templates/Affidavit/General Affidavit.rtf" },
      { id: "aff-2", category: "Affidavit", name: "Affidavit of Service", filename: "Affidavit of Service.rtf", path: "/templates/Affidavit/Affidavit of Service.rtf" },
      { id: "aff-3", category: "Affidavit", name: "Affidavit of Evidence", filename: "Affidavit of Evidence.rtf", path: "/templates/Affidavit/Affidavit of Evidence.rtf" },
    ]
  },
  {
    name: "Agreement",
    templates: [
      { id: "agr-1", category: "Agreement", name: "Non-Disclosure Agreement", filename: "Non-Disclosure Agreement.rtf", path: "/templates/Agreement/Non-Disclosure Agreement.rtf" },
      { id: "agr-2", category: "Agreement", name: "Partnership Agreement", filename: "Partnership Agreement.rtf", path: "/templates/Agreement/Partnership Agreement.rtf" },
      { id: "agr-3", category: "Agreement", name: "Service Agreement", filename: "Service Agreement.rtf", path: "/templates/Agreement/Service Agreement.rtf" },
    ]
  },
  {
    name: "Civil Pleadings",
    templates: [
      { id: "civ-1", category: "Civil Pleadings", name: "Plaint for Injunction", filename: "Plaint for Injunction.rtf", path: "/templates/Civil Pleadings/Plaint for Injunction.rtf" },
      { id: "civ-2", category: "Civil Pleadings", name: "Written Statement", filename: "Written Statement.rtf", path: "/templates/Civil Pleadings/Written Statement.rtf" },
      { id: "civ-3", category: "Civil Pleadings", name: "Application for Interim Relief", filename: "Application for Interim Relief.rtf", path: "/templates/Civil Pleadings/Application for Interim Relief.rtf" },
    ]
  },
  {
    name: "Company Law",
    templates: [
      { id: "com-1", category: "Company Law", name: "Board Resolution", filename: "Board Resolution.rtf", path: "/templates/Company Law/Board Resolution.rtf" },
      { id: "com-2", category: "Company Law", name: "Shareholders Agreement", filename: "Shareholders Agreement.rtf", path: "/templates/Company Law/Shareholders Agreement.rtf" },
    ]
  },
  {
    name: "Business / HR",
    templates: [
      { id: "bhr-1", category: "Business / HR", name: "Employment Contract", filename: "Employment Contract.rtf", path: "/templates/Business / HR/Employment Contract.rtf" },
      { id: "bhr-2", category: "Business / HR", name: "Consultancy Agreement", filename: "Consultancy Agreement.rtf", path: "/templates/Business / HR/Consultancy Agreement.rtf" },
      { id: "bhr-3", category: "Business / HR", name: "Notice of Termination", filename: "Notice of Termination.rtf", path: "/templates/Business / HR/Notice of Termination.rtf" },
    ]
  }
];

export async function fetchTemplates(query?: string): Promise<TemplateCategory[]> {
  // Simulating an API call to fetch templates
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!query) return TEMPLATE_CATEGORIES;
  
  const lowerQuery = query.toLowerCase();
  
  return TEMPLATE_CATEGORIES.map(category => {
    const matchedTemplates = category.templates.filter(
      t => t.name.toLowerCase().includes(lowerQuery) || category.name.toLowerCase().includes(lowerQuery)
    );
    return { ...category, templates: matchedTemplates };
  }).filter(category => category.templates.length > 0);
}

export async function getTemplateContent(templateId: string): Promise<string> {
  // In a real app, this would fetch the actual .rtf/.docx file and parse it.
  // For demonstration, we return a mock HTML representation of a template.
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return `
    <h1 style="text-align: center;">Draft Template</h1>
    <p style="text-align: right;">Date: <strong>[Insert Date]</strong></p>
    <p>This document serves as a template placeholder for ID: ${templateId}.</p>
    <p>In a full implementation, this will load the content of the corresponding .rtf or .docx file from the "English Law Drafts" directory.</p>
    <br/>
    <h3>1. Definitions</h3>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <br/>
    <h3>2. Terms</h3>
    <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  `;
}
