import "./globals.css";
import type { Metadata } from "next";
import { Merriweather, Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Wild Stallion Academy AI",
  description:
    "AI-powered homeschool and outdoor education planning for families.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WSA",
  },
  icons: {
    apple: "/wsa/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${merriweather.variable}`}>
        {children}
      </body>
    </html>
  );
}
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#26160f",
};
