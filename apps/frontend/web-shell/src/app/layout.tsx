import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@leanstart/commons";
import { Toaster } from "@leanstart/commons";
import { Providers } from "@/components/providers";
import { LiveSync } from "@/components/live-sync";
import { InactivityLogout } from "@/components/inactivity-logout";
import { InitialLoadOverlay } from "@/components/initial-load-overlay";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LeanStart",
  description: "Plataforma de validación de ideas de negocio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={poppins.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <LiveSync />
          <InactivityLogout />
          <InitialLoadOverlay />
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
