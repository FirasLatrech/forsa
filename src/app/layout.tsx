import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/index";
import SubHeader from "@/components/SubHeader/index";
import Banner from "@/components/Banner/index";
import ChatWidget from "@/components/ChatWidget/index";
import { TRPCReactProvider } from "@/trpc/client";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "ثري دينار | ThreeDinar",
  description: "متجر إلكتروني تونسي - Tunisian E-commerce Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased font-sans`} style={{ fontFamily: 'var(--font-cairo), sans-serif' }}>
        <TRPCReactProvider>
          <header className="sticky top-0 z-50">
            <Banner /> 
            <Header />
           <div className="hidden lg:block">
            <SubHeader />
           </div>
          </header>
            {children}
            <ChatWidget />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
