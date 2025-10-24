import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/context/WalletContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CertChain - 去中心化证书验证平台",
  description: "基于 FHEVM 的去中心化培训证书发放与验证系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-white border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600">
                © 2025 CertChain - Powered by FHEVM & Zama
              </p>
            </div>
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}
