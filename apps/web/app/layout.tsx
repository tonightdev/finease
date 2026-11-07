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
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { EdgeSwipeBack } from "@/components/navigation/EdgeSwipeBack";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
                <OfflineBanner />
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
                  <EdgeSwipeBack />
                </SecurityProvider>
                <Toaster
                  position="top-center"
                  containerClassName="toaster-container"
                  containerStyle={{
                    top: "calc(env(safe-area-inset-top, 0px) + 12px)",
                    zIndex: 999999,
                  }}
                  toastOptions={{
                    duration: 3500,
                    style: {
                      background: "rgba(15, 23, 42, 0.95)",
                      color: "#f8fafc",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      boxShadow:
                        "0 20px 35px -8px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08)",
                      borderRadius: "1.25rem",
                      padding: "12px 20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      maxWidth: "92vw",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#ffffff",
                      },
                      style: {
                        border: "1px solid rgba(16, 185, 129, 0.4)",
                        boxShadow:
                          "0 20px 35px -8px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(16, 185, 129, 0.25)",
                      },
                    },
                    error: {
                      duration: 3500,
                      iconTheme: {
                        primary: "#f43f5e",
                        secondary: "#ffffff",
                      },
                      style: {
                        border: "1px solid rgba(244, 63, 94, 0.4)",
                        boxShadow:
                          "0 20px 35px -8px rgba(0, 0, 0, 0.5), 0 0 20px -3px rgba(244, 63, 94, 0.25)",
                      },
                    },
                    className: "mobile-toast",
                  }}
                />
              </NotificationProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
