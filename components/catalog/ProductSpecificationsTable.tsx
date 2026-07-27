import type { ProductSpecifications } from "@/types";

type Props = {
  specifications: ProductSpecifications;
};

export function ProductSpecificationsTable({ specifications }: Props) {
  const entries = Object.entries(specifications).filter(
    ([, value]) => value != null && String(value).trim() !== ""
  );

  if (entries.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Specifications
      </h2>
      <dl className="mt-4 overflow-hidden rounded-xl border border-border">
        {entries.map(([key, value], index) => (
          <div
            key={key}
            className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${
              index % 2 === 0 ? "bg-surface/30" : "bg-card/20"
            }`}
          >
            <dt className="font-medium capitalize text-muted">{key.replace(/_/g, " ")}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
