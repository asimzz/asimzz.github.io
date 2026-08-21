"use client";

import { useTheme } from "next-themes";
import { FaMoon, FaSun } from "react-icons/fa6";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      // A static label: the resolved theme is unknown during server render, so
      // deriving the text from it would mismatch on hydration.
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-ink-muted hover:text-accent hover:border-accent/40 border-line flex size-9 items-center justify-center rounded-full border transition-colors"
    >
      {/* Both icons render; the active colour scheme decides which is visible,
          so no post-hydration state is needed. */}
      <FaMoon className="size-4 dark:hidden" aria-hidden />
      <FaSun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
