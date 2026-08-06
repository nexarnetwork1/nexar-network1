import { DashboardSection, DashboardEmptyState } from "@/components/dashboard";

// NXR module — backend foundation exists, UI not yet built.
export default function NxrModulePage() {
  return (
    <div className="space-y-8">
      <DashboardSection as="div" level="h1" title="NXR" description="Digital Economy & Token" />
      <DashboardEmptyState
        title="Coming soon"
        description="The NXR module is under construction. Token accounts, rewards, loyalty and AI credits will appear here."
      />
    </div>
  );
}
