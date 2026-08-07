/** Job categories stored in post metadata — no separate table. */
export const JOB_CATEGORIES = [
  { id: "engineering", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales" },
  { id: "operations", label: "Operations" },
  { id: "finance", label: "Finance" },
  { id: "hr", label: "Human Resources" },
  { id: "other", label: "Other" },
] as const;

export type JobCategoryId = (typeof JOB_CATEGORIES)[number]["id"];

export function jobCategoryLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return JOB_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
