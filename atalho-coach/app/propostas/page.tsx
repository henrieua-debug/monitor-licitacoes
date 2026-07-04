"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { GOALS, KNOWN_APPS, ROUTINES, UserProfile, loadProfile } from "@/lib/profile";
import { ALL_RECIPES, icloudLinkFor } from "@/lib/proposals/recipes";
import { ScoredRecipe, scoreRecipes } from "@/lib/proposals/engine";
import { useDevice } from "@/lib/useDevice";
import { Delivery, DeliveryPanel, WrongDeviceCard } from "../delivery";

const LEVEL_BADGE = { simple: "badge-simple", medium: "badge-medium", bold: "badge-bold" } as const;

export default function Proposals() {
  const { t, locale } = useI18n();
  const device = useDevice();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<Record<string, Delivery>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
    fetch("/api/eu")
      .then((r) => r.json())
      .then((d) => setIsPremium(Boolean(d.premium)))
      .catch(() => {});
  }, []);

  const scored: ScoredRecipe[] = useMemo(
    () => (profile ? scoreRecipes(ALL_RECIPES, profile) : []),
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
      {(device === "android" || device === "desktop") && (
        <div style={{ margin: "12px 0" }}>
          <WrongDeviceCard />
        </div>
      )}
      <div className="proposal-grid">
        {scored.map((s) => {
          const r = s.recipe;
          const why = whyText(s);
          const oneTap = icloudLinkFor(r.icloud, locale);
          const unlocked = !r.premium || isPremium;
          return (
            <div key={r.id} className="card proposal-card">
              <span className="emoji">{r.emoji}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`badge ${LEVEL_BADGE[r.level]}`}>{levelLabel[r.level]}</span>
                {r.premium && <span className="badge badge-bold">{t.premiumBadge}</span>}
              </div>
              <h3>{r.title[locale]}</h3>
              <p>{r.description[locale]}</p>
              {why && (
                <p className="why">
                  {t.whyThis} {why}
                </p>
              )}
              <div className="proposal-actions">
                {!unlocked ? (
                  <Link href="/assinatura" className="btn btn-primary" style={{ justifyContent: "center" }}>
                    {t.premiumLockedCta}
                  </Link>
                ) : oneTap ? (
                  <a
                    className="btn btn-primary"
                    style={{ justifyContent: "center" }}
                    href={oneTap}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ⚡ {t.installOneTap}
                  </a>
                ) : (
                  <button className="btn btn-primary" disabled={busy !== null} onClick={() => generate(r.id)}>
                    {busy === r.id ? <span className="spinner" /> : null}
                    {busy === r.id ? t.builderGenerating : t.generateThis}
                  </button>
                )}
                <Link
                  className="btn btn-ghost"
                  href={`/construtor?ideia=${encodeURIComponent(r.title[locale] + ": " + r.description[locale])}`}
                >
                  {t.customize}
                </Link>
              </div>
              {unlocked && oneTap && (
                <p className="why" style={{ marginTop: 8 }}>
                  {t.installOpensInApp}
                </p>
              )}
              {failed === r.id && <p className="callout callout-err">✕</p>}
              {delivered[r.id] && <DeliveryPanel delivery={delivered[r.id]} recipeId={r.id} locale={locale} />}
            </div>
          );
        })}
      </div>
    </main>
  );
}
