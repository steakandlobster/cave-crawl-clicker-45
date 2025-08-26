import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useSiweAuth as useSiweAuthHook } from "@/hooks/useSiweAuth";

// Shape inferred from the existing hook
type SiweAuthReturn = ReturnType<typeof useSiweAuthHook>;

const SiweAuthContext = createContext<SiweAuthReturn | undefined>(undefined);

export function SiweAuthProvider({ children }: { children: ReactNode }) {
  const value = useSiweAuthHook();
  return (
    <SiweAuthContext.Provider value={value}>{children}</SiweAuthContext.Provider>
  );
}

export function useSiweAuth() {
  const ctx = useContext(SiweAuthContext);
  if (!ctx) {
    throw new Error("useSiweAuth must be used within a SiweAuthProvider");
  }
  return ctx;
}
