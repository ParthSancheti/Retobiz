import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreBoot } from "@/components/shell/store-boot";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: { default: "Retobiz — Aas-paas ki dukaanein, aaj ke offers", template: "%s · Retobiz" },
  description: "Hyperlocal discovery for Bharat's dukaans — offers, verified shops and VIP passes in Pune, Nashik and Malegaon.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const PRELOAD = [
  "/fonts/plus-jakarta-sans-latin-800-normal.woff2",
  "/fonts/be-vietnam-pro-latin-400-normal.woff2",
  "/fonts/be-vietnam-pro-latin-600-normal.woff2",
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <head>
        {PRELOAD.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body className="min-h-dvh">
        <StoreBoot />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
