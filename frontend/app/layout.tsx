import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header/Header";
import ReduxProvider from "@/redux/provider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased px-4`}>
        <ReduxProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <Header />
            <main className="container mx-auto">{children}</main>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
