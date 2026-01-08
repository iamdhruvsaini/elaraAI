import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header/Header";
import ReduxProvider from "@/redux/provider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
      <body className={`${outfit.className} antialiased flex flex-col px-4 `}>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
        >
          <ReduxProvider>
            <AuthProvider>
              <Toaster position="top-right" />
              <div className="flex flex-col px-4 min-h-screen">
                <Header />

                <main className="max-w-[440px] w-full sm:mx-auto">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </ReduxProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
