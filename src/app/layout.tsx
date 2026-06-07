import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://poker-tracker-lemon.vercel.app"),
  title: "Poker Home Tracker",
  description:
    "Las cuentas de vuestras partidas de poker caseras, sin discusiones: buy-ins, quién paga a quién y ranking del grupo.",
  applicationName: "Poker",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Poker Home Tracker",
    description:
      "Las cuentas de vuestras partidas de poker, sin discusiones. Buy-ins, quién paga a quién y ranking del grupo.",
    type: "website",
    locale: "es_ES",
    siteName: "Poker Home Tracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Poker Home Tracker",
    description:
      "Las cuentas de vuestras partidas de poker, sin discusiones.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Poker",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
