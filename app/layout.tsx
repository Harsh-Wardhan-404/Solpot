import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import AppWalletProvider from "@/components/AppWalletProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOLPOT - Last Depositor Wins on Solana",
  description: "Deposit SOL and be the last depositor to win the pot! Built on Solana blockchain.",
  icons: {
    icon: '/logos/pot.png',
    shortcut: '/logos/pot.png',
    apple: '/logos/pot.png',
  },
  openGraph: {
    title: "SOLPOT - Last Depositor Wins on Solana",
    description: "Deposit SOL and be the last depositor to win the pot! Built on Solana blockchain.",
    images: ['/logos/pot.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "SOLPOT - Last Depositor Wins on Solana",
    description: "Deposit SOL and be the last depositor to win the pot! Built on Solana blockchain.",
    images: ['/logos/pot.png'],
  },
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
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
      </body>
    </html>
  );
}
