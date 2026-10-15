import { useEffect, useState, useCallback } from "react";

export type ThemeId =
  | "serpic-red"
  | "sap-classic-blue"
  | "odoo-minimal"
  | "dynamics-analytics"
  | "charcoal-slate";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  emoji: string;
  className: string; // empty for default
  swatch: string;
}

export const THEMES: ThemeOption[] = [
  { id: "serpic-red", name: "Rojo", emoji: "🔴", className: "", swatch: "#DC2626" },
  { id: "sap-classic-blue", name: "Azul", emoji: "🔷", className: "theme-sap-blue", swatch: "#0A5FA5" },
  { id: "odoo-minimal", name: "Morado", emoji: "🟣", className: "theme-odoo-minimal", swatch: "#714B67" },
  { id: "dynamics-analytics", name: "Verde Azulado", emoji: "🔵", className: "theme-dynamics-analytics", swatch: "#0F7B8A" },
  { id: "charcoal-slate", name: "Gris Oscuro", emoji: "⚫", className: "theme-charcoal", swatch: "#334155" },
];

const STORAGE_KEY = "serpic-theme";

const LEGACY_CLASSES = [
  "theme-dark-slate",
  "theme-blue-executive",
  "theme-emerald",
  "theme-copper",
  "theme-expertis-industrial",
];

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "serpic-red";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  return saved && THEMES.some((t) => t.id === saved) ? saved : "serpic-red";
}

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  [...THEMES.map((t) => t.className), ...LEGACY_CLASSES].forEach((cls) => {
    if (cls) root.classList.remove(cls);
  });
  const theme = THEMES.find((t) => t.id === id);
  if (theme?.className) root.classList.add(theme.className);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeState(id);
  }, []);

  return { theme, setTheme, themes: THEMES };
}

// Apply immediately on module load so first paint uses saved theme
if (typeof window !== "undefined") {
  applyTheme(readStoredTheme());
}
