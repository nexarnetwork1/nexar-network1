export function PresalePanelSkeleton() {
  return (
    <div className="luxury-border animate-pulse rounded-3xl bg-card/60 p-6 backdrop-blur-md">
      <div className="mb-5 flex justify-between">
        <div className="h-6 w-32 rounded-lg bg-border/80" />
        <div className="h-6 w-20 rounded-full bg-border/80" />
      </div>
      <div className="mb-4 h-2 rounded-full bg-border/80" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-border/60" />
        <div className="h-20 rounded-xl bg-border/60" />
      </div>
      <div className="mt-6 h-24 rounded-xl bg-border/60" />
      <div className="mt-4 h-12 rounded-xl bg-border/60" />
    </div>
  );
}
