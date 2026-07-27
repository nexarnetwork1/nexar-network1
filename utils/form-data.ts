export function objectToFormData(
  data: Record<string, string | number | boolean | undefined | null>
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === "boolean") {
      formData.set(key, value ? "true" : "false");
    } else if (value !== "") {
      formData.set(key, String(value));
    }
  }
  return formData;
}
