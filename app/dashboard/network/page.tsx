import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// Network module — backend foundation exists, UI not yet built.
// No placeholder screen: uses the standard DashboardEmptyState only.
export default function NetworkModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="Network" description="Business Social Network" />
      <DashboardEmptyState
        title="Coming soon"
        description="The Network module is under construction. Profiles, connections, feed and discovery will appear here."
      />
    </div>
  );
}
