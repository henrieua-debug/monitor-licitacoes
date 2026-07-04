"use client";

// Painel de entrega: mostra o resultado (nome, resumo, selo de validação) e a
// forma MAIS SIMPLES de instalar para o aparelho de quem está acessando.
// Ordem de preferência: 1 toque (link do iCloud, tratado na página) →
// abrir direto no app Atalhos (iPhone) → baixar arquivo (Mac) →
// aviso de "aparelho errado" (Android/PC).

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useDevice, type Device } from "@/lib/useDevice";

export interface Delivery {
  name: string;
  fileName: string;
  fileBase64: string;
  signed: boolean;
  summary: string[];
  attempts?: number;
}

export function downloadDelivery(d: Delivery) {
  const bytes = Uint8Array.from(atob(d.fileBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = d.fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Deep link que abre o app Atalhos e importa o arquivo da nossa URL pública. */
function importSchemeUrl(recipeId: string, locale: string, name: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fileUrl = `${origin}/api/instalar/${recipeId}?locale=${locale}`;
  return `shortcuts://import-shortcut?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(name)}`;
}

export function CopyLinkButton() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(t.installCopyLink, window.location.href);
    }
  };
  return (
    <button className="btn btn-ghost" onClick={copy}>
      {copied ? `✓ ${t.installCopied}` : `🔗 ${t.installCopyLink}`}
    </button>
  );
}

/** Card de "aparelho errado": Atalhos só existem em iPhone/iPad/Mac. */
export function WrongDeviceCard() {
  const { t } = useI18n();
  return (
    <div className="card callout callout-warn" style={{ display: "block" }}>
      <strong>{t.installWrongDeviceTitle}</strong>
      <p style={{ margin: "6px 0 10px" }}>{t.installWrongDeviceBody}</p>
      <CopyLinkButton />
    </div>
  );
}

/** Botões e orientações de instalação, adaptados ao aparelho. */
function InstallActions({
  delivery,
  recipeId,
  locale,
  device,
}: {
  delivery: Delivery;
  recipeId?: string;
  locale?: string;
  device: Device | null;
}) {
  const { t } = useI18n();
  if (device === null) return null; // ainda detectando

  if (device === "android" || device === "desktop") return <WrongDeviceCard />;

  const canScheme = device === "ios" && recipeId && locale;

  return (
    <div>
      <div className="cta-row">
        {canScheme && (
          <a className="btn btn-primary" href={importSchemeUrl(recipeId!, locale!, delivery.name)}>
            ⚡ {t.installOpenInShortcuts}
          </a>
        )}
        <button
          className={canScheme ? "btn btn-ghost" : "btn btn-primary"}
          onClick={() => downloadDelivery(delivery)}
        >
          ⬇︎ {canScheme ? t.installDownloadFallback : delivery.signed ? t.builderDownloadSigned : t.builderDownload}
        </button>
      </div>
      <p style={{ color: "var(--ink-dim)", fontSize: "0.85rem", margin: "8px 0 0" }}>{t.installOpensInApp}</p>
      {!delivery.signed && (
        <div className="callout callout-warn" style={{ display: "block", marginTop: 10 }}>
          <strong>{t.installUntrustedTitle}</strong>
          <p style={{ margin: "6px 0 0" }}>{t.installUntrustedBody}</p>
        </div>
      )}
    </div>
  );
}

export function DeliveryPanel({
  delivery,
  recipeId,
  locale,
}: {
  delivery: Delivery;
  recipeId?: string;
  locale?: string;
}) {
  const { t } = useI18n();
  const device = useDevice();
  return (
    <div className="result-panel">
      <div className="card">
        <h3>
          ✅ {t.builderResultTitle}: {delivery.name}
        </h3>
        <p className="callout callout-ok" style={{ display: "inline-block" }}>
          {t.builderValidated}
          {delivery.attempts ? ` · ${delivery.attempts} ${t.builderAttempts}` : ""}
        </p>
        <h3 style={{ marginTop: 14 }}>{t.builderStepsTitle}</h3>
        <ol className="steps-list">
          {delivery.summary.map((s, i) => (
            <li key={i}>
              <span className="n">{i + 1}</span> {s}
            </li>
          ))}
        </ol>
        <h3 style={{ marginTop: 14 }}>{t.installTitle}</h3>
        <InstallActions delivery={delivery} recipeId={recipeId} locale={locale} device={device} />
      </div>
    </div>
  );
}
