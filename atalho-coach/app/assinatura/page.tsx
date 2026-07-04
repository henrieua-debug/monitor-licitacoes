"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function Assinatura() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState<"mensal" | "anual" | "entrar" | null>(null);
  const [premium, setPremium] = useState(false);
  const [mpOn, setMpOn] = useState(true);
  const [notice, setNotice] = useState<"entered" | "notFound" | "codeSent" | "badCode" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/eu")
      .then((r) => r.json())
      .then((d) => {
        setPremium(Boolean(d.premium));
        setMpOn(Boolean(d.mp));
      })
      .catch(() => {});
  }, []);

  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const subscribe = async (plano: "mensal" | "anual") => {
    setBusy(plano);
    setNotice(null);
    try {
      const res = await fetch("/api/assinar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plano }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "erro");
      window.location.href = data.url as string;
    } catch {
      setNotice("error");
      setBusy(null);
    }
  };

  const enter = async (withCode: boolean) => {
    setBusy("entrar");
    setNotice(null);
    try {
      const res = await fetch("/api/entrar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          locale,
          ...(withCode ? { codigo: codigo.trim() } : {}),
        }),
      });
      if (res.status === 403) {
        setNotice("notFound");
        return;
      }
      if (res.status === 401) {
        setNotice("badCode");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { codeSent?: boolean; premium?: boolean };
      if (data.codeSent) {
        setStage("code");
        setNotice("codeSent");
        return;
      }
      setPremium(true);
      setNotice("entered");
    } catch {
      setNotice("error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main>
      <h1>{t.premiumTitle}</h1>
      <p style={{ color: "var(--ink-dim)" }}>{t.premiumSubtitle}</p>

      {premium && <p className="callout callout-ok">{t.premiumActive}</p>}
      {!mpOn && <p className="callout callout-warn">{t.premiumMpMissing}</p>}

      <div className="card" style={{ margin: "20px 0" }}>
        <ol className="steps-list">
          {[t.premiumB1, t.premiumB2, t.premiumB3, t.premiumB4].map((b, i) => (
            <li key={i}>
              <span className="n">⭐</span> {b}
            </li>
          ))}
        </ol>
      </div>

      {!premium && mpOn && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <input
              className="builder-box"
              style={{ minHeight: 0 }}
              type="email"
              value={email}
              placeholder={t.premiumEmailPlaceholder}
              onChange={(e) => {
                setEmail(e.target.value);
                setStage("email");
                setCodigo("");
              }}
            />
            <p style={{ color: "var(--ink-dim)", fontSize: "0.85rem", margin: "8px 0 0" }}>{t.premiumEmailHint}</p>
          </div>

          <div className="grid-3" style={{ margin: "0 0 16px" }}>
            <div className="card">
              <h3>{t.planMonthly}</h3>
              <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink)" }}>{t.planMonthlyPrice}</p>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={!validEmail || busy !== null}
                onClick={() => subscribe("mensal")}
              >
                {busy === "mensal" && <span className="spinner" />}
                {busy === "mensal" ? t.premiumRedirecting : t.premiumSubscribe}
              </button>
            </div>
            <div className="card" style={{ borderColor: "var(--accent-a)" }}>
              <h3>
                {t.planYearly} <span className="badge badge-bold">{t.planYearlySave}</span>
              </h3>
              <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink)" }}>{t.planYearlyPrice}</p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={!validEmail || busy !== null}
                onClick={() => subscribe("anual")}
              >
                {busy === "anual" && <span className="spinner" />}
                {busy === "anual" ? t.premiumRedirecting : t.premiumSubscribe}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 64 }}>
            <h3>{t.premiumAlready}</h3>
            {stage === "email" ? (
              <div className="cta-row">
                <button className="btn btn-ghost" disabled={!validEmail || busy !== null} onClick={() => enter(false)}>
                  {busy === "entrar" && <span className="spinner" />}
                  {t.premiumEnter}
                </button>
              </div>
            ) : (
              <>
                <input
                  className="builder-box"
                  style={{ minHeight: 0, marginBottom: 8 }}
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  placeholder={t.premiumCodePlaceholder}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                />
                <div className="cta-row">
                  <button
                    className="btn btn-primary"
                    disabled={codigo.trim().length !== 6 || busy !== null}
                    onClick={() => enter(true)}
                  >
                    {busy === "entrar" && <span className="spinner" />}
                    {t.premiumCodeConfirm}
                  </button>
                  <button className="btn btn-ghost" disabled={busy !== null} onClick={() => enter(false)}>
                    {t.premiumCodeResend}
                  </button>
                </div>
              </>
            )}
            {notice === "entered" && <p className="callout callout-ok">{t.premiumEntered}</p>}
            {notice === "codeSent" && <p className="callout callout-ok">{t.premiumCodeSent}</p>}
            {notice === "badCode" && <p className="callout callout-warn">{t.premiumCodeBad}</p>}
            {notice === "notFound" && <p className="callout callout-warn">{t.premiumNotFound}</p>}
            {notice === "error" && <p className="callout callout-err">{t.forumError}</p>}
          </div>
        </>
      )}
    </main>
  );
}
