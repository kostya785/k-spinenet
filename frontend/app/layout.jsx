import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";

import Header from "./components/Header";
import { LanguageProvider } from "./i18n/LanguageProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** @type {import("next").Metadata} */
export const metadata = {
  title: "Konstantinopol SpineNet",
  description: "Spine detection demo",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
     <body className="min-h-full flex flex-col">
  <LanguageProvider>
    <Header />
    <main className={styles.main}>{children}</main>
  </LanguageProvider>
</body>
    </html>
  );
}
