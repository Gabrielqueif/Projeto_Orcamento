import "./globals.css"
import type { Metadata, Viewport } from "next";
import { RegistrarServiceWorker } from "@/components/pwa/RegistrarServiceWorker";

export const metadata: Metadata = {
  title: "GPObras",
  description: "Orçamentos, obras, diário, almoxarifado e financeiro da sua construtora.",
  applicationName: "GPObras",
  appleWebApp: {
    capable: true,
    title: "GPObras",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#001b3d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased h-screen">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
