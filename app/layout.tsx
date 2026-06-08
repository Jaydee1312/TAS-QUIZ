import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TAS GLOBAL QUIZ",
  description:
    "Website làm bài kiểm tra trắc nghiệm với hệ thống tích lũy điểm thưởng — TAS GLOBAL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster theme="light" position="top-center" richColors />
      </body>
    </html>
  );
}
