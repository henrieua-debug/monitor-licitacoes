"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { loadProfile } from "@/lib/profile";

export default function Home() {
  const { t } = useI18n();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(Boolean(loadProfile()));
  }, []);

  return (
    <main>
      <section className="hero">
        <h1>{t.tagline}</h1>
        <p>{t.heroLead}</p>
        <div className="cta-row">
          {hasProfile ? (
            <Link href="/propostas" className="btn btn-primary">
              {t.ctaProposals}
            </Link>
          ) : (
            <Link href="/onboarding" className="btn btn-primary">
              {t.ctaStart}
            </Link>
          )}
          <Link href="/construtor" className="btn btn-ghost">
            {t.ctaBuilder}
          </Link>
        </div>
      </section>

      <section>
        <h2>{t.howTitle}</h2>
        <div className="grid-3">
          {[
            { n: 1, title: t.how1Title, body: t.how1Body },
            { n: 2, title: t.how2Title, body: t.how2Body },
            { n: 3, title: t.how3Title, body: t.how3Body },
          ].map((s) => (
            <div key={s.n} className="card">
              <span className="step-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>{t.privacyNote}</span>
        <span>{t.footerDisclaimer}</span>
      </footer>
    </main>
  );
}
