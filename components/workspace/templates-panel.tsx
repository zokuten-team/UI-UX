"use client";

import { useState, useEffect } from "react";
import { Search, FileText, ChevronRight, Loader2, FilePlus } from "lucide-react";
import { fetchTemplates, getTemplateContent, type TemplateCategory, type TemplateItem } from "@/lib/templates/template-registry";

type Props = {
  onCreateTemplateDoc: (title: string, html: string) => void;
};

export function TemplatesPanel({ onCreateTemplateDoc }: Props) {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTemplates(searchQuery);
        if (active) {
          setCategories(data);
          if (data.length > 0 && !selectedCategory) {
            setSelectedCategory(data[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load templates", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    // Debounce search
    const timer = setTimeout(load, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleUseTemplate = async (template: TemplateItem) => {
    setLoadingTemplateId(template.id);
    try {
      const content = await getTemplateContent(template.id);
      onCreateTemplateDoc(template.name, content);
    } catch (err) {
      console.error("Failed to fetch template content", err);
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const activeCategoryData = categories.find(c => c.name === selectedCategory) || categories[0];

  return (
    <div className="tool-section templates-panel">
      <p className="helper">Browse and load premade legal drafts and forms.</p>
      
      <div className="search-bar" style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "#64748b" }} />
        <input 
          type="text" 
          placeholder="Search templates (e.g. Affidavit, Agreement)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "8px 8px 8px 32px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
      </div>

      {loading && categories.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <Loader2 className="spin" style={{ color: "#3b82f6" }} />
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">No templates found for "{searchQuery}".</div>
      ) : (
        <div className="templates-layout" style={{ display: "flex", gap: "16px", height: "400px" }}>
          {/* Categories Sidebar */}
          <div className="categories-sidebar" style={{ width: "140px", flexShrink: 0, overflowY: "auto", borderRight: "1px solid #e2e8f0", paddingRight: "8px" }}>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px",
                  borderRadius: "6px",
                  marginBottom: "4px",
                  background: selectedCategory === category.name ? "#eff6ff" : "transparent",
                  color: selectedCategory === category.name ? "#2563eb" : "#475569",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: selectedCategory === category.name ? "500" : "normal"
                }}
              >
                {category.name}
                <span style={{ float: "right", fontSize: "0.8rem", color: "#94a3b8" }}>
                  {category.templates.length}
                </span>
              </button>
            ))}
          </div>

          {/* Template List */}
          <div className="template-list" style={{ flexGrow: 1, overflowY: "auto" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#0f172a", fontSize: "1rem" }}>
              {activeCategoryData?.name}
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeCategoryData?.templates.map((template) => (
                <div 
                  key={template.id} 
                  className="template-card"
                  style={{ 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px", 
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "white"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ background: "#f1f5f9", padding: "8px", borderRadius: "6px" }}>
                      <FileText size={18} color="#64748b" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: "#1e293b", fontSize: "0.95rem" }}>{template.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{template.filename}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleUseTemplate(template)}
                    disabled={loadingTemplateId === template.id}
                    className="panel-secondary"
                    style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
                  >
                    {loadingTemplateId === template.id ? (
                      <><Loader2 size={14} className="spin" /> Loading…</>
                    ) : (
                      <><FilePlus size={14} /> Use Template</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
