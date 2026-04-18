import type { Metadata, Viewport } from "next";
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
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "FinEase | Architectural Wealth Management",
  description:
    "Comprehensive wealth management for modern investors. Track your INR assets, investments, and expenses in one secure place.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinEase",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#135bec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
                  <ServiceWorkerRegistration />
                  <ClientHeader />
                  <CommandPalette />
                  <GlobalModals />
                  <main className="flex flex-col flex-1 w-full relative">
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
      </body>
    </html>
  );
}

