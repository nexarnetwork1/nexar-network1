type CsvRow = Record<string, string | number | boolean | null | undefined>;

export function toCsv(rows: CsvRow[], columns: { key: keyof CsvRow; label: string }[]): string {
  const escape = (value: unknown): string => {
    if (value == null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(","))
    .join("\n");

  return `${header}\n${body}`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
