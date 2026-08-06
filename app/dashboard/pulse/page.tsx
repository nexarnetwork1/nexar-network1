import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// Pulse module — backend foundation exists, UI not yet built.
export default function PulseModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="Pulse" description="Business Intelligence Feed" />
      <DashboardEmptyState
        title="Coming soon"
        description="The Pulse module is under construction. Real-time activity, trending and AI insights will appear here."
      />
    </div>
  );
}
