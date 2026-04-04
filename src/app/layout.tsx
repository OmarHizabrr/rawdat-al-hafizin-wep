import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "روضة الحافظين | برنامج تحفيظ السنة النبوية",
  description: "برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية بجمع الشيخ يحيى اليحيى، وفق منهجٍ متدرّج يبدأ بأصح كتب السنة.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "روضة الحافظين | Rawdat Al-Hafizin",
    description: "برنامج علمي متكامل يُعنى بحفظ أحاديث السنة النبوية بجمع الشيخ يحيى اليحيى، وفق منهجٍ متدرّج يبدأ بأصح كتب السنة.",
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
        className={`${inter.variable} ${cairo.variable} font-cairo min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}
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
