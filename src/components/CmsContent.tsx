import { sanitizeProductHtml } from "@/lib/sanitize-html";

interface CmsContentProps {
  html: string | null | undefined;
  className?: string;
}

export default function CmsContent({ html, className }: CmsContentProps) {
  if (!html) return null;
  const clean = sanitizeProductHtml(html);
  return (
    <div
      className={["swr-prose", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
