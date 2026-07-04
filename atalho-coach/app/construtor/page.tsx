"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { KNOWN_APPS, loadProfile } from "@/lib/profile";
import { Delivery, DeliveryPanel } from "../delivery";

function BuilderInner() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ideia = params.get("ideia");
    if (ideia) setPrompt(ideia);
  }, [params]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setDelivery(null);
    try {
      const profile = loadProfile();
      const profileHint = profile
        ? `apps: ${profile.apps
            .map((id) => KNOWN_APPS.find((a) => a.id === id)?.label ?? id)
            .join(", ")}; aparelhos: ${profile.devices.join(", ")}`
        : undefined;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, locale, profileHint }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "no_key" ? "no_key" : "failed");
        return;
      }
      setDelivery(data as Delivery);
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>{t.builderTitle}</h1>
      <p style={{ color: "var(--ink-dim)" }}>{t.builderSubtitle}</p>

      <textarea
        className="builder-box"
        value={prompt}
        placeholder={t.builderPlaceholder}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="cta-row">
        <button className="btn btn-primary" disabled={busy || prompt.trim().length < 8} onClick={generate}>
          {busy && <span className="spinner" />}
          {busy ? t.builderGenerating : t.builderGenerate}
        </button>
      </div>

      {error === "no_key" && <p className="callout callout-warn">{t.builderNoKey}</p>}
      {error === "failed" && (
        <p className="callout callout-err">
          {t.builderErrorTitle}. {t.builderTryAgain}?
        </p>
      )}
      {delivery && <DeliveryPanel delivery={delivery} />}
    </main>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={null}>
      <BuilderInner />
    </Suspense>
  );
}
