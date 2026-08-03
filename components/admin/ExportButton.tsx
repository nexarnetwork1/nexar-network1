import Link from "next/link";

type ExportButtonProps = {
  resource: "orders" | "payments" | "invoices" | "merchants" | "customers" | "audit-logs" | "treasury";
  label?: string;
};

export function ExportButton({ resource, label = "Export CSV" }: ExportButtonProps) {
  return (
    <Link
      href={`/api/admin/export/${resource}`}
      className="inline-flex h-11 items-center rounded-xl border border-gold/30 bg-gold/10 px-4 text-sm font-medium text-gold transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      download
    >
      {label}
    </Link>
  );
}
