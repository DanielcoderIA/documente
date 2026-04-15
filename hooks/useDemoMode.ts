/**
 * useDemoMode — Hook centralizado para Guest Mode
 * Detecta la cookie `documente-demo=1` establecida por /login?demo=true
 */
"use client";

import { useMemo } from "react";

export function useDemoMode(): boolean {
  return useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("documente-demo=1"));
  }, []);
}
