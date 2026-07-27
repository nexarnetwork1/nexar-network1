import Link from "next/link";

type ExportButtonProps = {
  resource: "orders" | "payments" | "invoices" | "merchants" | "customers" | "audit-logs" | "treasury";
  label?: string;
};

export function ExportButton({ resource, label = "Export CSV" }: ExportButtonProps) {
  return (
    <Link
      href={`/api/admin/export/${resource}`}
      className="inline-flex items-center rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/20"
      download
    >
      {label}
    </Link>
  );
}
