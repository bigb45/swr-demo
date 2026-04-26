import DOMPurify from "isomorphic-dompurify";

interface CmsContentProps {
  html: string | null | undefined;
  className?: string;
}

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "blockquote", "ul", "ol", "li",
  "a", "strong", "em", "b", "i", "u", "s", "small", "mark",
  "br", "hr", "span", "div", "section", "article",
  "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "code", "pre",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "target", "rel",
  "class", "id", "style",
  "colspan", "rowspan", "scope",
  "loading", "width", "height",
];

export default function CmsContent({ html, className }: CmsContentProps) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
  return (
    <div
      className={["swr-prose", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
