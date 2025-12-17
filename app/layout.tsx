// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "@/components/register-sw";
import OfflineBadge from "@/components/OfflineBadge";
import SyncToast from "@/components/SyncToast";
import { getBrandForRequest } from "@/lib/brand-server";

/* -------------------------
   Metadata (UNCHANGED)
-------------------------- */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandForRequest();
  const appTitle = brand?.titleText?.trim() || "Hive";

  return {
    title: {
      default: appTitle,
      template: `%s | ${appTitle}`,
    },
    icons: {
      icon: [
        { url: "/icon", rel: "icon", type: "image/png" },
        { url: "/icon", rel: "shortcut icon", type: "image/png" },
      ],
    },
    manifest: "/manifest.json",
  };
}

/* -------------------------
   Root Layout
-------------------------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* ✅ Service Worker registration */}
        <RegisterServiceWorker />

        {/* ✅ Offline / Online indicator */}
        <OfflineBadge />

        {/* ✅ Sync status toast */}
        <SyncToast />

        <ThemeProvider>
          {children}

          {/* ✅ Global toast portal */}
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "text-sm",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
