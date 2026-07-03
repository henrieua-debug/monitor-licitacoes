"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Boldness,
  DEVICES,
  GOALS,
  KNOWN_APPS,
  ROUTINES,
  loadProfile,
  saveProfile,
} from "@/lib/profile";

type MultiStep = { kind: "multi"; key: "devices" | "apps" | "routine" | "goals"; title: string; options: { id: string; label: string }[] };
type BoldStep = { kind: "bold"; title: string };
type Step = MultiStep | BoldStep;

export default function Onboarding() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [devices, setDevices] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [routine, setRoutine] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [boldness, setBoldness] = useState<Boldness | null>(null);
  const [showErr, setShowErr] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setDevices(p.devices);
      setApps(p.apps);
      setRoutine(p.routine);
      setGoals(p.goals);
      setBoldness(p.boldness);
    }
  }, []);

  const localized = (o: { id: string; pt: string; en: string; es: string }) => ({
    id: o.id,
    label: o[locale],
  });

  const steps: Step[] = [
    { kind: "multi", key: "devices", title: t.qDevices, options: DEVICES.map((d) => ({ id: d.id, label: d.label })) },
    { kind: "multi", key: "apps", title: t.qApps, options: KNOWN_APPS.map((a) => ({ id: a.id, label: a.label })) },
    { kind: "multi", key: "routine", title: t.qRoutine, options: ROUTINES.map(localized) },
    { kind: "multi", key: "goals", title: t.qGoals, options: GOALS.map(localized) },
    { kind: "bold", title: t.qBoldness },
  ];

  const stateFor = {
    devices: [devices, setDevices] as const,
    apps: [apps, setApps] as const,
    routine: [routine, setRoutine] as const,
    goals: [goals, setGoals] as const,
  };

  const current = steps[step];
  const isValid =
    current.kind === "bold" ? boldness !== null : stateFor[current.key][0].length > 0;

  const toggle = (key: MultiStep["key"], id: string) => {
    const [values, set] = stateFor[key];
    set(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
    setShowErr(false);
  };

  const advance = () => {
    if (!isValid) {
      setShowErr(true);
      return;
    }
    setShowErr(false);
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    saveProfile({
      devices,
      apps,
      routine,
      goals,
      boldness: boldness as Boldness,
      completedAt: new Date().toISOString(),
    });
    router.push("/propostas");
  };

  const boldOptions: { id: Boldness; title: string; desc: string }[] = [
    { id: "safe", title: t.boldnessSafe, desc: t.boldnessSafeDesc },
    { id: "bold", title: t.boldnessBold, desc: t.boldnessBoldDesc },
    { id: "wild", title: t.boldnessWild, desc: t.boldnessWildDesc },
  ];

  return (
    <main>
      <h1>{t.onboardingTitle}</h1>
      <p style={{ color: "var(--ink-dim)" }}>{t.onboardingSubtitle}</p>

      <div className="quiz-progress">
        <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <h2>{current.title}</h2>

      {current.kind === "multi" ? (
        <div className="chips">
          {current.options.map((o) => (
            <button
              key={o.id}
              className={`chip ${stateFor[current.key][0].includes(o.id) ? "selected" : ""}`}
              onClick={() => toggle(current.key, o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="option-cards">
          {boldOptions.map((o) => (
            <button
              key={o.id}
              className={`option-card ${boldness === o.id ? "selected" : ""}`}
              onClick={() => {
                setBoldness(o.id);
                setShowErr(false);
              }}
            >
              <strong>{o.title}</strong>
              <span>{o.desc}</span>
            </button>
          ))}
        </div>
      )}

      {showErr && <p className="hint-err">{t.selectAtLeastOne}</p>}

      <div className="quiz-nav">
        <button className="btn btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          {t.back}
        </button>
        <button className="btn btn-primary" onClick={advance}>
          {step === steps.length - 1 ? t.finish : t.next}
        </button>
      </div>
    </main>
  );
}
