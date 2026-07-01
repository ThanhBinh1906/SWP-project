import DOMPurify from "dompurify";

const DEFAULT_ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "class",
  "style",
];

export function sanitizeHtml(html = "") {
  return DOMPurify.sanitize(String(html || ""), {
    USE_PROFILES: { html: true },
    ADD_ATTR: DEFAULT_ALLOWED_ATTR,
  });
}

export default function SafeHtml({ html, className = "" }) {
  const cleanHtml = sanitizeHtml(html);

  if (!cleanHtml) return null;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
