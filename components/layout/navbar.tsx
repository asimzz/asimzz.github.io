"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { nav, profile } from "@/content/site";

function isActive(pathname: string, href: string): boolean {
  // trailingSlash: true means pathname always ends in "/".
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-line bg-canvas/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4"
      >
        <Link
          href="/"
          className="hover:text-accent font-serif text-lg font-semibold tracking-tight transition-colors"
        >
          {profile.name}
        </Link>

        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-6 sm:flex">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={
                    isActive(pathname, item.href) ? "page" : undefined
                  }
                  className={
                    isActive(pathname, item.href)
                      ? "text-accent text-sm font-medium"
                      : "text-ink-muted hover:text-ink text-sm transition-colors"
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-ink-muted hover:text-accent border-line flex size-9 items-center justify-center rounded-full border transition-colors sm:hidden"
          >
            {open ? (
              <FaXmark className="size-4" aria-hidden />
            ) : (
              <FaBars className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <ul
          id="mobile-nav"
          className="border-line mx-auto max-w-3xl border-t px-6 py-3 sm:hidden"
        >
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={
                  isActive(pathname, item.href) ? "page" : undefined
                }
                className={
                  isActive(pathname, item.href)
                    ? "text-accent block py-2 text-sm font-medium"
                    : "text-ink-muted hover:text-ink block py-2 text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
