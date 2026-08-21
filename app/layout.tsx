import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { profile, site, siteUrl } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.title,
    template: `%s · ${site.title}`,
  },
  description: site.description,
  authors: [{ name: profile.name, url: siteUrl }],
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${siteUrl}/feed.xml` },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={site.locale}
      // next-themes writes the theme class here before hydration.
      suppressHydrationWarning
      // Opts route transitions out of the smooth scrolling set in globals.css,
      // so navigating does not animate the scroll position.
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="bg-surface text-ink focus:ring-accent sr-only rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:ring-2"
          >
            Skip to content
          </a>
          <Navbar />
          <main
            id="main"
            className="mx-auto w-full max-w-3xl flex-1 px-6 py-12"
          >
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
