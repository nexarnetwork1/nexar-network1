import { cn } from "@/lib/utils/cn";

export function AtlasIdentityField({
  label,
  error,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
        {label}
      </span>
      <input
        id={id}
        className={cn("w-full nxr-input", error && "border-red-500/50")}
        {...props}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

export function AtlasIdentityDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="text-[10px] tracking-[0.2em] text-muted uppercase">or continue with</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function AtlasIdentityMessage({
  tone,
  children,
}: {
  tone: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-gold/30 bg-gold/5 text-gold-secondary",
    success: "border-success/30 bg-success/10 text-success",
    error: "border-red-500/25 bg-red-500/5 text-red-400",
  } as const;

  return (
    <p className={cn("rounded-xl border px-4 py-3 text-xs leading-relaxed", styles[tone])}>
      {children}
    </p>
  );
}
