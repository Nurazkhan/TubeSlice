import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubeSlice",
  description: "Download full videos or selected segments from YouTube URLs.",
  icons: {
    icon: "/logo_without_background.png",
    shortcut: "/logo_without_background.png",
    apple: "/logo_without_background.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
