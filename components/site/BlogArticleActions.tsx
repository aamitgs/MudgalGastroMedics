"use client";

import { useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Hash, Link2, Mail, MessageCircle, Pin, Printer, Send, Share2 } from "lucide-react";

type BlogArticleActionsProps = {
  title: string;
  description: string;
  url: string;
  compact?: boolean;
};

export function BlogArticleActions({ title, description, url, compact = false }: BlogArticleActionsProps) {
  const [copied, setCopied] = useState(false);
  const encoded = useMemo(() => ({
    title: encodeURIComponent(title),
    description: encodeURIComponent(description),
    url: encodeURIComponent(url)
  }), [description, title, url]);

  const actions = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encoded.title}%20${encoded.url}`,
      icon: MessageCircle,
      external: true
    },
    {
      label: "Email",
      href: `mailto:?subject=${encoded.title}&body=${encoded.description}%0A%0A${encoded.url}`,
      icon: Mail
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded.url}`,
      icon: Share2,
      external: true
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.url}`,
      icon: Link2,
      external: true
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?text=${encoded.title}&url=${encoded.url}`,
      icon: Hash,
      external: true
    },
    {
      label: "Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encoded.url}&description=${encoded.title}`,
      icon: Pin,
      external: true
    },
    {
      label: "Quora",
      href: `https://www.quora.com/share?url=${encoded.url}&title=${encoded.title}`,
      icon: ExternalLink,
      external: true
    },
    {
      label: "Reddit",
      href: `https://www.reddit.com/submit?url=${encoded.url}&title=${encoded.title}`,
      icon: MessageCircle,
      external: true
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encoded.url}&text=${encoded.title}`,
      icon: Send,
      external: true
    }
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function printArticle() {
    window.print();
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  }

  async function openInstagram() {
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noreferrer");
  }

  return (
    <div className={`rounded-xl border border-line bg-white p-4 shadow-soft ${compact ? "" : "md:p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-dark">Share / Save</p>
          <h2 className={`${compact ? "text-lg" : "text-2xl"} mt-1 font-black text-ink`}>Use this guide later</h2>
        </div>
        <Share2 className="text-brand-dark" size={22} />
      </div>
      <div className={`mt-4 grid gap-2 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {actions.map(({ label, href, icon: Icon, external }) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark"
          >
            <Icon size={16} /> {label}
          </a>
        ))}
        <button type="button" onClick={copyLink} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark">
          <Copy size={16} /> {copied ? "Copied" : "Copy Link"}
        </button>
        <button type="button" onClick={openInstagram} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark">
          <ExternalLink size={16} /> Instagram
        </button>
        <button type="button" onClick={nativeShare} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark">
          <Share2 size={16} /> Share
        </button>
        <button type="button" onClick={printArticle} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark">
          <Printer size={16} /> Print
        </button>
        <button type="button" onClick={printArticle} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line bg-soft/45 px-3 text-sm font-black text-ink transition hover:border-brand hover:bg-white hover:text-brand-dark">
          <Download size={16} /> Save PDF
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">Use Print or Save PDF from your browser to keep this article for appointment discussion.</p>
    </div>
  );
}
