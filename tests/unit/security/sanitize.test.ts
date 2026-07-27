import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  sanitizeString,
  stripHtmlTags,
  sanitizeObject,
} from "@/lib/security/sanitize";

describe("sanitize", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;"
    );
  });

  it("strips HTML tags", () => {
    expect(stripHtmlTags("<b>hello</b>")).toBe("hello");
  });

  it("sanitizes strings with length limit", () => {
    const result = sanitizeString("  <img onerror=x>  ", 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result).not.toContain("<");
  });

  it("sanitizes object string fields", () => {
    const result = sanitizeObject({ name: "<b>x</b>", count: 1 });
    expect(result.name).toBe("x");
    expect(result.count).toBe(1);
  });
});
