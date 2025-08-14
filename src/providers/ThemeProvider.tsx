import { PropsWithChildren, useEffect } from "react";
import { useThemeStore } from "@/store/theme";

export function ThemeProvider({ children }: PropsWithChildren) {
  const isDark = useThemeStore((s) => s.isDark);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    // Initialize from persisted storage early if available
    try {
      const raw = localStorage.getItem("theme");
      if (raw) {
        const parsed = JSON.parse(raw);
        const persisted = parsed?.state?.isDark;
        if (typeof persisted === "boolean") {
          setTheme(persisted);
        }
      }
    } catch (_err) {
      void 0;
    }
  }, [setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return children as JSX.Element;
}

export default ThemeProvider;


