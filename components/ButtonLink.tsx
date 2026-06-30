import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variants = {
  primary: "border-cyan-300/20 bg-[linear-gradient(135deg,#0ea5c2,#087d9e)] text-white shadow-[0_18px_42px_rgba(8,145,178,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_24px_58px_rgba(8,145,178,0.42),inset_0_1px_0_rgba(255,255,255,0.28)]",
  secondary: "border-emerald-300/20 bg-[linear-gradient(135deg,#10b981,#047857)] text-white shadow-[0_18px_42px_rgba(5,150,105,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_24px_58px_rgba(5,150,105,0.38),inset_0_1px_0_rgba(255,255,255,0.26)]",
  ghost: "border-white/55 bg-[linear-gradient(180deg,#ffffff,#f3f7f8)] text-ink shadow-[0_18px_42px_rgba(8,64,84,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-cyan-200 hover:text-brand hover:shadow-[0_24px_58px_rgba(8,64,84,0.2),inset_0_1px_0_rgba(255,255,255,0.95)]"
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: ButtonLinkProps) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded border px-5 text-center font-bold tracking-[0.01em] transition duration-300 hover:-translate-y-1 active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cyan-200/60 ${variants[variant]} ${className}`;
  const isExternal = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");

  if (isExternal) {
    return (
      <a className={classes} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
