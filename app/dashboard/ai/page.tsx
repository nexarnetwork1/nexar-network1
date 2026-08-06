import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// AI module — backend foundation exists, UI not yet built.
export default function AiModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="AI" description="Business Intelligence Engine" />
      <DashboardEmptyState
        title="Coming soon"
        description="The AI module is under construction. Agents, workflows, insights and automations will appear here."
      />
    </div>
  );
}
