import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/theme";

export const ThemeToggleFloating = React.memo(() => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <div className="fixed top-4 right-8 z-50">
      <Button
        onClick={toggle}
        className={`${
          isDark ? "bg-coral hover:bg-coral/80" : "bg-amber hover:bg-amber/70"
        } text-charcoal font-medium py-1.5 px-3 rounded-md border-2 border-charcoal transition-all duration-200 shadow-[3px_3px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm`}
      >
        {isDark ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
        <span>{isDark ? "Dark" : "Light"}</span>
      </Button>
    </div>
  );
});

export default ThemeToggleFloating;


