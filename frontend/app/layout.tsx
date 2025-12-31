import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElaraAI - Intelligent Makeup Planning",
  description:
    "A cutting-edge AI platform that leverages advanced machine learning algorithms to deliver intelligent makeup planning and personalized beauty recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased px-4`}>
        <Header />
        <main className="container mx-auto ">
          {children}
        </main>
      </body>
    </html>
  );
}
