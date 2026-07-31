export type SiteKnowledgeLink = {
  label: string;
  href: string;
};

export type SiteKnowledgeEntry = {
  id: string;
  title: string;
  /** Words and phrases that boost match score for this entry. */
  keywords: string[];
  answer: string;
  links?: SiteKnowledgeLink[];
  /** Primary page when user asks to navigate here. */
  primaryLink?: string;
};
