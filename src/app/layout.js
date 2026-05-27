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

export const metadata = {
  title: "FirmaCheck - Rychlé ověření českých firem podle IČO",
  description: "Moderní produkční nástroj pro okamžité vyhledávání a ověřování českých ekonomických subjektů v registru ARES s chytrou mezipamětí Turso DB.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

