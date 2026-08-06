import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// Apps module — backend foundation exists, UI not yet built.
export default function AppsModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="Apps" description="Business Applications Platform" />
      <DashboardEmptyState
        title="Coming soon"
        description="The Apps module is under construction. The app store, installed apps and developer console will appear here."
      />
    </div>
  );
}
