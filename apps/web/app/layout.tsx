import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/navigation/ThemeProvider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ClientHeader } from "@/components/navigation/ClientHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PWAInstallGuide } from "@/components/ui/PWAInstallGuide";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { Toaster } from "react-hot-toast";
import { SecurityProvider } from "@/components/providers/SecurityProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { GlobalLoadingBar } from "@/components/ui/GlobalLoadingBar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GlobalModals } from "@/components/modals/GlobalModals";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FinEase | Architectural Wealth Management",
  description:
    "Comprehensive wealth management for modern investors. Track your INR assets, investments, and expenses in one secure place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinEase",
    startupImage: [
      {
        url: "/icon-512x512.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icon-512x512.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icon-512x512.png",
        media:
          "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192x192.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#135bec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} min-h-[100dvh] flex flex-col font-body bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <GlobalLoadingBar />
            <AuthProvider>
              <NotificationProvider>
                <SecurityProvider>
                  <ClientHeader />
                  <CommandPalette />
                  <GlobalModals />
                  <main className="flex flex-col flex-1 w-full">
                    <Suspense fallback={null}>
                      <RequireAuth>{children}</RequireAuth>
                    </Suspense>
                  </main>
                  <BottomNav />
                  <PWAInstallGuide />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: "#333",
                        color: "#fff",
                      },
                      className: "mobile-toast",
                    }}
                  />
                </SecurityProvider>
              </NotificationProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function() {},
                    function() {}
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
