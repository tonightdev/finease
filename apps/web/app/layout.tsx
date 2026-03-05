import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/navigation/ThemeProvider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ClientHeader } from "@/components/navigation/ClientHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { Toaster } from "react-hot-toast";
import { SecurityProvider } from "@/components/providers/SecurityProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FinEase | Architectural Wealth Management",
  description: "Comprehensive wealth management for modern investors. Track your INR assets, investments, and expenses in one secure place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinEase",
    startupImage: [
      "/icon-512x512.png"
    ]
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
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReduxProvider>
            <AuthProvider>
              <SecurityProvider>
                <ClientHeader />
                <main className="flex-grow w-full pb-20 lg:pb-0 min-h-screen">
                  <RequireAuth>
                    {children}
                  </RequireAuth>
                </main>
                <BottomNav />
                <Toaster position="bottom-right" toastOptions={{
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                }} />
              </SecurityProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
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
