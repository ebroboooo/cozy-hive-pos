
import type { Metadata } from "next";
import { FirebaseClientProvider } from "@/firebase";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/context/settings-provider";
import { Poppins, Cairo } from "next/font/google";
import { AppThemeManager } from "@/components/app-theme-manager";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Cozy-Hive POS",
  description: "A simple, real-time POS and time-tracking system for a co-working space.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased h-full bg-background", poppins.variable, cairo.variable)}>
        <SettingsProvider>
          <AppThemeManager>
            <FirebaseClientProvider>
              {children}
              <Toaster />
            </FirebaseClientProvider>
          </AppThemeManager>
        </SettingsProvider>
      </body>
    </html>
  );
}
