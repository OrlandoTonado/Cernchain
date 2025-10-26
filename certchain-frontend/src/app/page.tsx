"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";

export default function Home() {
  const { account, connectWallet, isConnecting } = useWallet();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-accent-gold/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">
              去中心化培训证书
              <span className="block text-accent-gold mt-2">链上验证 · 永久可信</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              基于 FHEVM 全同态加密技术，为培训机构提供可验证、不可篡改的证书发放与验证解决方案
            </p>

            {/* 钱包连接状态 */}
            {account ? (
              <div className="mb-8">
                <div className="inline-flex items-center px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700 font-medium">
                    钱包已连接: {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {isConnecting ? "连接中..." : "连接钱包开始使用"}
                </button>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <Link href="/issue" className="btn-primary">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  发放证书（链上生成ID）
                </span>
              </Link>
              <Link href="/verify" className="btn-secondary">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  验证证书
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-primary mb-16">
            核心特性
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔒",
                title: "隐私保护",
                desc: "基于 FHEVM 全同态加密，敏感信息链上加密存储，仅授权方可解密查看",
              },
              {
                icon: "⛓️",
                title: "不可篡改",
                desc: "证书元数据上传 IPFS，链上记录哈希与签名，保证证书真实性与完整性",
              },
              {
                icon: "✅",
                title: "即时验证",
                desc: "任何人可通过证书 ID 或二维码实时验证证书真伪与有效状态",
              },
            ].map((feature, i) => (
              <div key={i} className="cert-card p-8 text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-center text-primary mb-16">
            如何使用
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "机构注册", desc: "连接钱包并注册为认证机构" },
              { step: "2", title: "上传证书", desc: "填写证书信息并上传至 IPFS" },
              { step: "3", title: "链上发证", desc: "调用智能合约记录证书哈希" },
              { step: "4", title: "验证分享", desc: "学员可随时验证并分享证书" },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="cert-card p-6 text-center h-full">
                  <div className="w-12 h-12 bg-accent-gold text-primary font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-accent-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">
            开始使用 CertChain
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            立即连接钱包，体验去中心化证书管理的便捷与安全
          </p>
          <Link href="/issue" className="inline-block px-8 py-4 bg-accent-gold text-primary font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl">
            立即开始
          </Link>
        </div>
      </section>
    </div>
  );
}
