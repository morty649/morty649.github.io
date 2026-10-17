import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.title}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — ${SITE.title}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE.name} portfolio` }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: `${SITE.name} — ${SITE.title}`,
    description: SITE.description,
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#12151c" },
  ],
};

function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />
      <div className="ambient-orb ambient-orb-4" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider delayDuration={0}>
            <AmbientBackground />
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <div className="relative z-10 mx-auto max-w-3xl px-container-padding pb-24">
              {children}
            </div>
            <Navbar />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
