export function validateDocumentRenameInput(body: unknown): {
  isValid: boolean;
  data?: { title: string };
  errors: string[];
} {
  const title =
    typeof (body as { title?: unknown })?.title === "string"
      ? (body as { title: string }).title.trim()
      : "";
  if (!title)
    return { isValid: false, errors: ["Document title is required."] };
  if (title.length > 255)
    return {
      isValid: false,
      errors: ["Document title cannot exceed 255 characters."],
    };
  return { isValid: true, data: { title }, errors: [] };
}
