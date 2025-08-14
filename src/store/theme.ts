import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ThemeState {
  isDark: boolean;
  setTheme: (isDark: boolean) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      setTheme: (isDark: boolean) => set({ isDark }),
      toggle: () => set({ isDark: !get().isDark }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ isDark: state.isDark }),
    }
  )
);


