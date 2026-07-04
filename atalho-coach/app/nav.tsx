"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LOCALES } from "@/lib/i18n/dictionaries";

export function Nav() {
  const { t, locale, setLocale } = useI18n();
  const path = usePathname();

  const links = [
    { href: "/propostas", label: t.navProposals },
    { href: "/construtor", label: t.navBuilder },
    { href: "/forum", label: t.navForum },
    { href: "/onboarding", label: t.navOnboarding },
  ];

  return (
    <nav className="nav">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden />
        {t.appName}
      </Link>
      <div className="links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="locale-switch" role="group" aria-label="Idioma">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            className={locale === l.code ? "active" : ""}
            onClick={() => setLocale(l.code)}
          >
            {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    </nav>
  );
}
