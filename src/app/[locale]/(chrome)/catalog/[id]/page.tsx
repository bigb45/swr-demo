import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getDocument, listAllDocumentIds } from "@/lib/catalog";
import PdfViewer from "@/components/catalog/PdfViewer";
import VideoViewer from "@/components/catalog/VideoViewer";
import { localeAlternates } from "@/lib/seo";

export const revalidate = 600;

interface DocumentPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  const ids = await listAllDocumentIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const doc = await getDocument(id);
  if (!doc) return { title: "Not found" };
  const t = await getTranslations({ locale, namespace: "catalog" });
  return {
    title: `${doc.title} — ${doc.brand}`,
    description: doc.description ?? t("metaDescription"),
    ...localeAlternates(locale, `/catalog/${id}`),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { locale, id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const t = await getTranslations({ locale, namespace: "catalog" });

  const tSafe = (key: string, fallback: string): string => {
    try {
      return t(key);
    } catch {
      return fallback;
    }
  };

  const metaRows: { label: string; value: string }[] = [
    { label: t("meta.brand"), value: doc.brand },
    { label: t("meta.type"), value: tSafe(`types.${doc.type}`, doc.type) },
    {
      label: t("meta.language"),
      value: tSafe(`languages.${doc.language}`, doc.language.toUpperCase()),
    },
    ...(doc.pageCount
      ? [{ label: t("meta.pages"), value: String(doc.pageCount) }]
      : []),
    ...(doc.fileSize
      ? [{ label: t("meta.fileSize"), value: formatBytes(doc.fileSize) }]
      : []),
    ...(doc.publishedAt
      ? [
          {
            label: t("meta.published"),
            value: new Date(doc.publishedAt).toLocaleDateString(locale),
          },
        ]
      : []),
    {
      label: t("meta.categories"),
      value: doc.categories
        .map((c) => tSafe(`categories.${c}`, c))
        .join(", "),
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
      <nav className="mb-4 text-xs uppercase tracking-[0.08em] text-on-surface-variant flex items-center gap-2">
        <Link href="/catalog" className="hover:text-primary">
          {t("breadcrumbCatalog")}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-on-surface truncate">{doc.brand}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">
          {doc.brand}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black uppercase text-primary tracking-[-0.01em]">
          {doc.title}
        </h1>
        {doc.description ? (
          <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed mt-2">
            {doc.description}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {doc.type === "video" && (doc.videoUrl || doc.pdfUrl) ? (
          <VideoViewer
            doc={doc}
            labels={{
              backToList: t("viewer.backToList"),
              openInNewTab: t("viewer.openInNewTab"),
              watchOnYoutube: t("viewer.watchOnYoutube"),
              videoNotice: t("viewer.videoNotice"),
              unsupportedVideo: t("viewer.unsupportedVideo"),
              unsupportedVideoCta: t("viewer.unsupportedVideoCta"),
            }}
          />
        ) : (
          <PdfViewer
            doc={doc}
            labels={{
              download: t("viewer.download"),
              openInNewTab: t("viewer.openInNewTab"),
              backToList: t("viewer.backToList"),
              viewerNotice: t("viewer.notice"),
              externalNotice: t("viewer.externalNotice"),
              externalCta: t("viewer.externalCta"),
            }}
          />
        )}

        <aside className="flex flex-col gap-3">
          <h2 className="text-xs font-black uppercase tracking-[0.12em] text-on-surface-variant border-b border-outline-variant/40 pb-2">
            {t("meta.heading")}
          </h2>
          <dl className="text-sm">
            {metaRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[100px_1fr] py-1.5 border-b border-outline-variant/20"
              >
                <dt className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                  {row.label}
                </dt>
                <dd className="text-on-surface">{row.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
