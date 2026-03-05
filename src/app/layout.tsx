import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8f6f3",
};

export const metadata: Metadata = {
  title: "RoastTrack — AI Diss Track Generator",
  description: "Generate a personalized AI roast song about your friend. Enter their name, drop some facts, and get a fire diss track in seconds.",
  keywords: ["AI", "roast", "diss track", "music", "generator", "fun", "friends"],
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RoastTrack",
  },
  openGraph: {
    title: "RoastTrack — AI Diss Track Generator",
    description: "Generate a personalized AI roast song about your friend in seconds.",
    type: "website",
    locale: "en_US",
    siteName: "RoastTrack",
    url: "https://roasttrack.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "RoastTrack — AI Diss Track Generator",
    description: "Generate a personalized AI roast song about your friend in seconds.",
    creator: "@roasttrack",
  },
  metadataBase: new URL("https://roasttrack.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
