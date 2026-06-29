import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variants = {
  primary: "border-brand bg-brand text-white shadow-[0_12px_28px_rgba(8,145,178,0.24)] hover:bg-brand-dark hover:shadow-lift",
  secondary: "border-teal bg-teal text-white shadow-[0_12px_28px_rgba(5,150,105,0.2)] hover:bg-teal-dark",
  ghost: "border-line bg-white/95 text-ink hover:border-brand hover:text-brand hover:shadow-soft"
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: ButtonLinkProps) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded border px-5 text-center font-extrabold transition duration-200 hover:-translate-y-0.5 ${variants[variant]} ${className}`;
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
