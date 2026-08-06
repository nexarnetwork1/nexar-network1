import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// Connect module — backend foundation exists, UI not yet built.
export default function ConnectModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="Connect" description="Business Collaboration Platform" />
      <DashboardEmptyState
        title="Coming soon"
        description="The Connect module is under construction. Workspaces, channels, meetings and smart actions will appear here."
      />
    </div>
  );
}
