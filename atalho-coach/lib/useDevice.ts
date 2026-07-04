"use client";

import { useEffect, useState } from "react";

// Detecta o aparelho para adaptar as instruções de instalação:
//  - "ios"     iPhone/iPad (App Atalhos existe; scheme shortcuts:// funciona)
//  - "mac"     Mac (instala pelo arquivo .shortcut)
//  - "android" celular sem Atalhos da Apple
//  - "desktop" Windows/Linux (nem tem Atalhos)
//  - null      ainda não sabemos (SSR / primeiro render)
export type Device = "ios" | "mac" | "android" | "desktop";

export function useDevice(): Device | null {
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const touch = navigator.maxTouchPoints ?? 0;
    // iPadOS moderno se apresenta como "Macintosh" com tela sensível ao toque.
    const isIpad = /Macintosh/.test(ua) && touch > 1;
    if (/iPhone|iPod|iPad/.test(ua) || isIpad) setDevice("ios");
    else if (/Android/.test(ua)) setDevice("android");
    else if (/Macintosh|Mac OS X/.test(ua)) setDevice("mac");
    else setDevice("desktop");
  }, []);

  return device;
}
