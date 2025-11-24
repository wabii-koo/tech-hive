import "./globals.css";

import { AppToaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Hive",
  description: "Multi-tenant hive dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {/* Global toast system */}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
