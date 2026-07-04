"use client";

// Painel de entrega: mostra o resultado (nome, resumo, selo de validação) e o
// botão de download do .shortcut, com aviso quando o arquivo não está assinado.

import { useI18n } from "@/lib/i18n";

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

export function DeliveryPanel({ delivery }: { delivery: Delivery }) {
  const { t } = useI18n();
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
        <div className="cta-row">
          <button className="btn btn-primary" onClick={() => downloadDelivery(delivery)}>
            ⬇︎ {delivery.signed ? t.builderDownloadSigned : t.builderDownload}
          </button>
        </div>
        {!delivery.signed && <p className="callout callout-warn">{t.builderUnsignedWarning}</p>}
        <h3 style={{ marginTop: 14 }}>{t.installTitle}</h3>
        <ol className="steps-list">
          {[t.installStep1, t.installStep2, t.installStep3].map((s, i) => (
            <li key={i}>
              <span className="n">{i + 1}</span> {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
