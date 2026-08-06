import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// Mobile module — backend foundation exists, UI not yet built.
export default function MobileModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="Mobile" description="Mobile Platform" />
      <DashboardEmptyState
        title="Coming soon"
        description="The Mobile module is under construction. Device management, offline sync, push and deep links will appear here."
      />
    </div>
  );
}
