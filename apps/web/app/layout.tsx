import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/navigation/ThemeProvider";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ClientHeader } from "@/components/navigation/ClientHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FinEase | Your Financial North Star",
  description: "Comprehensive wealth management for modern investors. Track your INR assets, investments, and expenses in one secure place.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
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
          <AuthProvider>
            <ClientHeader />
            
            <main className="flex-grow flex flex-col items-center w-full pb-20 lg:pb-0 min-h-screen">
              <RequireAuth>
                {children}
              </RequireAuth>
            </main>
            
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
