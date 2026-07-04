"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Suggestion {
  id: string;
  titulo: string;
  descricao: string;
  votos: number;
  status: "aberta" | "criada";
}

const VOTED_KEY = "atalho-coach:votos";

function loadVoted(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export default function Forum() {
  const { t, locale } = useI18n();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<"sent" | "error" | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/forum");
    if (res.status === 503) {
      setDisabled(true);
      setSuggestions([]);
      return;
    }
    const data = await res.json();
    setSuggestions((data.suggestions ?? []) as Suggestion[]);
  };

  useEffect(() => {
    setVoted(loadVoted());
    refresh().catch(() => setNotice("error"));
  }, []);

  const vote = async (id: string) => {
    if (voted.has(id)) return;
    const next = new Set(voted).add(id);
    setVoted(next);
    localStorage.setItem(VOTED_KEY, JSON.stringify([...next]));
    setSuggestions((s) => s?.map((x) => (x.id === id ? { ...x, votos: x.votos + 1 } : x)) ?? null);
    await fetch("/api/forum/votar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const submit = async () => {
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ titulo, descricao, idioma: locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setTitulo("");
      setDescricao("");
      setNotice("sent");
      await refresh();
    } catch {
      setNotice("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <h1>{t.forumTitle}</h1>
      <p style={{ color: "var(--ink-dim)" }}>{t.forumSubtitle}</p>

      {disabled ? (
        <p className="callout callout-warn">{t.forumDisabled}</p>
      ) : (
        <>
          <div className="card" style={{ margin: "24px 0" }}>
            <h3>{t.forumFormTitle}</h3>
            <input
              className="builder-box"
              style={{ minHeight: 0, marginBottom: 10 }}
              value={titulo}
              maxLength={120}
              placeholder={t.forumTitlePlaceholder}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <textarea
              className="builder-box"
              style={{ minHeight: 70 }}
              value={descricao}
              maxLength={500}
              placeholder={t.forumDescPlaceholder}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <div className="cta-row">
              <button className="btn btn-primary" disabled={sending || titulo.trim().length < 3} onClick={submit}>
                {sending && <span className="spinner" />}
                {t.forumSend}
              </button>
            </div>
            {notice === "sent" && <p className="callout callout-ok">{t.forumSent}</p>}
            {notice === "error" && <p className="callout callout-err">{t.forumError}</p>}
          </div>

          {suggestions !== null && suggestions.length === 0 && (
            <p style={{ color: "var(--ink-dim)" }}>{t.forumEmpty}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 64 }}>
            {suggestions?.map((s) => (
              <div key={s.id} className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <button
                  className={`btn ${voted.has(s.id) ? "btn-ghost" : "btn-primary"}`}
                  style={{ padding: "8px 14px", flexShrink: 0 }}
                  disabled={voted.has(s.id) || s.status === "criada"}
                  onClick={() => vote(s.id)}
                >
                  ▲ {s.votos}
                </button>
                <div>
                  <strong>{s.titulo}</strong>
                  {s.descricao && (
                    <p style={{ margin: "4px 0 0", color: "var(--ink-dim)", fontSize: "0.9rem" }}>{s.descricao}</p>
                  )}
                </div>
                {s.status === "criada" && (
                  <span className="badge badge-simple" style={{ marginLeft: "auto", flexShrink: 0 }}>
                    {t.forumStatusCreated}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
