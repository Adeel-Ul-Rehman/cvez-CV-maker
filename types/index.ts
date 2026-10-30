export type TemplateCategory =
  | "ATS"
  | "Modern"
  | "Classic"
  | "EU"
  | "UK"
  | "USA"
  | "Asian"
  | "Creative"
  | "Minimal"
  | "Academic";

export type SupportedSection =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "strengths"
  | "interests"
  | "references"
  | "awards"
  | "custom";

export type TemplateDefinition = {
  key: string; // e.g. "europass"
  name: string;
  description: string;
  category: TemplateCategory;
  sourceFile: string; // reference only, e.g. "downloaded_templates/europass_cv_template.docx"
  supportedSections: Array<SupportedSection>;
  defaultConfig: {
    fontFamily: string;
    fontSizePt: number;
    primaryColor: string; // hex
    spacingScale: number; // 0.8–1.2
    showPhoto: boolean;
    pageSize: "A4" | "LETTER";
  };
  layoutHints: {
    columns: 1 | 2;
    hasSidebar: boolean;
    sidebarPosition?: "left" | "right";
    headerStyle: "centered" | "left" | "banner";
  };
};
