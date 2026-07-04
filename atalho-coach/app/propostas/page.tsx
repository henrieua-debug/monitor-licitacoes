"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GOALS, KNOWN_APPS, ROUTINES, UserProfile, loadProfile } from "@/lib/profile";
import { RECIPES } from "@/lib/proposals/recipes";
import { ScoredRecipe, scoreRecipes } from "@/lib/proposals/engine";
import { Delivery, DeliveryPanel } from "../delivery";

const LEVEL_BADGE = { simple: "badge-simple", medium: "badge-medium", bold: "badge-bold" } as const;

export default function Proposals() {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<Record<string, Delivery>>({});
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
  }, []);

  const scored: ScoredRecipe[] = useMemo(
    () => (profile ? scoreRecipes(RECIPES, profile) : []),
    [profile]
  );

  const levelLabel = { simple: t.levelSimple, medium: t.levelMedium, bold: t.levelBold };

  const whyText = (s: ScoredRecipe): string => {
    const bits: string[] = [];
    for (const id of s.matchedApps) {
      const app = KNOWN_APPS.find((a) => a.id === id);
      if (app) bits.push(app.label);
    }
    for (const id of s.matchedRoutines) {
      const r = ROUTINES.find((x) => x.id === id);
      if (r) bits.push(r[locale]);
    }
    for (const id of s.matchedGoals) {
      const g = GOALS.find((x) => x.id === id);
      if (g) bits.push(g[locale]);
    }
    return bits.slice(0, 3).join(" · ");
  };

  const generate = async (id: string) => {
    setBusy(id);
    setFailed(null);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as Delivery;
      setDelivered((d) => ({ ...d, [id]: payload }));
    } catch {
      setFailed(id);
    } finally {
      setBusy(null);
    }
  };

  if (!loaded) return null;

  if (!profile) {
    return (
      <main>
        <h1>{t.proposalsTitle}</h1>
        <p style={{ color: "var(--ink-dim)" }}>{t.proposalsEmpty}</p>
        <Link href="/onboarding" className="btn btn-primary">
          {t.ctaStart}
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1>{t.proposalsTitle}</h1>
      <p style={{ color: "var(--ink-dim)" }}>{t.proposalsSubtitle}</p>
      <div className="proposal-grid">
        {scored.map((s) => {
          const r = s.recipe;
          const why = whyText(s);
          return (
            <div key={r.id} className="card proposal-card">
              <span className="emoji">{r.emoji}</span>
              <div>
                <span className={`badge ${LEVEL_BADGE[r.level]}`}>{levelLabel[r.level]}</span>
              </div>
              <h3>{r.title[locale]}</h3>
              <p>{r.description[locale]}</p>
              {why && (
                <p className="why">
                  {t.whyThis} {why}
                </p>
              )}
              <div className="proposal-actions">
                <button className="btn btn-primary" disabled={busy !== null} onClick={() => generate(r.id)}>
                  {busy === r.id ? <span className="spinner" /> : null}
                  {busy === r.id ? t.builderGenerating : t.generateThis}
                </button>
                <Link
                  className="btn btn-ghost"
                  href={`/construtor?ideia=${encodeURIComponent(r.title[locale] + ": " + r.description[locale])}`}
                >
                  {t.customize}
                </Link>
              </div>
              {failed === r.id && <p className="callout callout-err">✕</p>}
              {delivered[r.id] && <DeliveryPanel delivery={delivered[r.id]} />}
            </div>
          );
        })}
      </div>
    </main>
  );
}
