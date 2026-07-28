import { Download } from "lucide-react";
import { BlogArticleActions } from "@/components/site/BlogArticleActions";
import type { PrepChecklistItem } from "@/lib/procedure-prep";
import { site } from "@/lib/site-data";

type ProcedurePrepChecklistProps = {
  slug: string;
  title: string;
  checklist: PrepChecklistItem[];
};

/** Structured, downloadable/shareable pre-visit prep checklist — reduces day-of cancellations from patients arriving unprepared (wrong fasting, no escort, missing reports). */
export function ProcedurePrepChecklist({ slug, title, checklist }: ProcedurePrepChecklistProps) {
  const pageUrl = `${site.url}/procedures/${slug}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
      <div className="rounded border border-line bg-white p-6 shadow-soft">
        <ol className="grid gap-4">
          {checklist.map((item, index) => (
            <li key={`${item.timing}-${index}`} className="flex gap-4 rounded border border-line bg-soft/50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-white">{index + 1}</span>
              <div>
                <p className="inline-lang text-xs font-black uppercase tracking-[0.1em] text-brand-dark">
                  <span data-en>{item.timing}</span>
                  <span data-hi lang="hi">{item.timingHi}</span>
                </p>
                <p className="inline-lang mt-1 leading-relaxed text-muted">
                  <span data-en>{item.instruction}</span>
                  <span data-hi lang="hi">{item.instructionHi}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="inline-lang mt-4 text-xs text-muted">
          <span data-en>General guidance only — your doctor&apos;s specific instructions always take priority. Call reception if anything is unclear.</span>
          <span data-hi lang="hi">केवल सामान्य मार्गदर्शन — आपके डॉक्टर के विशिष्ट निर्देश हमेशा प्राथमिकता रखते हैं। यदि कुछ स्पष्ट न हो तो रिसेप्शन को कॉल करें।</span>
        </p>
      </div>
      <div className="grid gap-4">
        <a
          href={`/api/pdf/procedure-prep?slug=${slug}`}
          className="inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-brand-dark px-5 text-base font-black text-white shadow-[0_18px_46px_rgba(8,145,178,0.34)] transition hover:opacity-90"
        >
          <Download size={19} />
          <span className="inline-lang">
            <span data-en>Download Prep Checklist (PDF)</span>
            <span data-hi lang="hi">Prep Checklist डाउनलोड करें (PDF)</span>
          </span>
        </a>
        <BlogArticleActions
          title={`${title} — Pre-Visit Preparation Guide`}
          description={`Pre-visit prep checklist for ${title} at ${site.name}.`}
          url={pageUrl}
          compact
        />
      </div>
    </div>
  );
}
