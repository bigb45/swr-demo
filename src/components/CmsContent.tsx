import sanitizeHtml from "sanitize-html";
import type { IOptions } from "sanitize-html";

interface CmsContentProps {
  html: string | null | undefined;
  className?: string;
}

const SANITIZE_OPTIONS: IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "small",
    "mark",
    "br",
    "hr",
    "span",
    "div",
    "section",
    "article",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "caption",
    "code",
    "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title", "class", "id"],
    img: ["src", "alt", "title", "loading", "width", "height", "class", "id"],
    th: ["colspan", "rowspan", "scope", "class", "id"],
    td: ["colspan", "rowspan", "class", "id"],
    "*": ["class", "id", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowedStyles: {
    "*": {
      color: [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
        /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/,
      ],
      "background-color": [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
        /^transparent$/,
      ],
      "text-align": [/^left|right|center|justify$/],
      "font-weight": [/^bold|normal|\d{3}$/],
      "font-size": [/^\d+(?:px|em|rem|%)$/],
      margin: [/^\d+(?:px|em|rem|%)?(?:\s+\d+(?:px|em|rem|%)?){0,3}$/],
      padding: [/^\d+(?:px|em|rem|%)?(?:\s+\d+(?:px|em|rem|%)?){0,3}$/],
      width: [/^\d+(?:px|em|rem|%)$/],
      "max-width": [/^\d+(?:px|em|rem|%)$/],
    },
  },
  transformTags: {
    a: (tagName, attribs) => {
      const next = { ...attribs };
      if (next.target === "_blank" && !next.rel?.includes("noopener")) {
        next.rel = "noopener noreferrer";
      }
      return { tagName, attribs: next };
    },
  },
};

export default function CmsContent({ html, className }: CmsContentProps) {
  if (!html) return null;
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  return (
    <div
      className={["swr-prose", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
