import type { Metadata } from "next";
// import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import { Inter } from "next/font/google"; // Use only Inter for now
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// const notoKufiArabic = Noto_Kufi_Arabic({
//   subsets: ["arabic"],
//   weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
//   variable: "--font-noto-kufi",
// });

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "روضة الحافظين | Rawdat Al-Hafizin",
  description: "منصة متكاملة لإدارة حلقات تحفيظ القرآن الكريم والسنة النبوية.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "روضة الحافظين | Rawdat Al-Hafizin",
    description: "منصة متكاملة لإدارة حلقات تحفيظ القرآن الكريم والسنة النبوية.",
    url: "https://qursunnah-wep.vercel.app",
    siteName: "Rawdat Al-Hafizin",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Rawdat Al-Hafizin Logo",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              {/* Background Gradients */}
              <div className="fixed inset-0 -z-10 h-full w-full bg-background transition-colors duration-300">
                <div className="absolute left-[20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute right-[20%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
              </div>

              <Navbar />
              <main className="flex-1 pt-24 pb-12 px-6">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
