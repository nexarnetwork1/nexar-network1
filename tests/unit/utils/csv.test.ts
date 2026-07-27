import { describe, expect, it } from "vitest";
import { toCsv, csvResponse } from "@/utils/export/csv";

describe("csv export", () => {
  it("escapes commas and quotes", () => {
    const csv = toCsv(
      [{ name: 'Acme, "LLC"', amount: 10 }],
      [
        { key: "name", label: "Name" },
        { key: "amount", label: "Amount" },
      ]
    );
    expect(csv).toContain('"Acme, ""LLC"""');
    expect(csv.split("\n")).toHaveLength(2);
  });

  it("returns downloadable response", async () => {
    const response = csvResponse("a,b", "export.csv");
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("export.csv");
    expect(await response.text()).toBe("a,b");
  });
});
