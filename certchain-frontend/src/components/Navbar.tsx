"use client";

import Link from "next/link";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function Navbar() {
  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-serif font-bold text-primary">CertChain</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary font-medium transition">
              首页
            </Link>
            <Link href="/issue" className="text-gray-700 hover:text-primary font-medium transition">
              发放证书
            </Link>
            <Link href="/verify" className="text-gray-700 hover:text-primary font-medium transition">
              验证证书
            </Link>
            <Link href="/my" className="text-gray-700 hover:text-primary font-medium transition">
              我的证书
            </Link>
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}


