import CmsContent from "@/components/CmsContent";
import { IndustryHero, Cta } from "@/components/marketing";
import type { MagentoCmsPage } from "@/lib/cms";

interface ServicePillarPageProps {
  page: MagentoCmsPage | null;
  fallback: {
    eyebrow: string;
    title: string;
    subtitle: string;
    paragraphs: string[];
  };
  ctaHref: string;
  ctaLabel: string;
  ctaHeading: string;
  ctaBody: string;
  secondaryCta?: { href: string; label: string };
}

export default function ServicePillarPage({
  page,
  fallback,
  ctaHref,
  ctaLabel,
  ctaHeading,
  ctaBody,
  secondaryCta,
}: ServicePillarPageProps) {
  return (
    <>
      <IndustryHero
        eyebrow={fallback.eyebrow}
        title={page?.content_heading ?? page?.title ?? fallback.title}
        subtitle={page?.meta_description ?? fallback.subtitle}
      >
        <Cta href={ctaHref} label={ctaLabel} variant="primary" />
        {secondaryCta ? (
          <Cta
            href={secondaryCta.href}
            label={secondaryCta.label}
            variant="ghost"
          />
        ) : null}
      </IndustryHero>

      <div className="swr-page-shell py-12 sm:py-16 flex flex-col gap-12">
        {page ? (
          <CmsContent html={page.content} />
        ) : (
          <div className="swr-prose max-w-[800px]">
            {fallback.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <section
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-8 bg-primary text-white"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <h3 className="text-xl font-black uppercase tracking-[-0.01em]">
              {ctaHeading}
            </h3>
            <p className="text-sm text-white/80 mt-2 max-w-xl">{ctaBody}</p>
          </div>
          <Cta href={ctaHref} label={ctaLabel} variant="primary" />
        </section>
      </div>
    </>
  );
}
