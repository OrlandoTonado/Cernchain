"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { useCertChain } from "@/hooks/useCertChain";
import { CertChainRegistryABI, CertChainRegistryAddress } from "@/contracts/CertChainRegistry";
import Link from "next/link";

export default function MyPage() {
  const { account, provider, connectWallet } = useWallet();
  const { signer, revoke, restore } = useCertChain({ provider, contractAddress: CertChainRegistryAddress, abi: CertChainRegistryABI });
  const [items, setItems] = useState<Array<{ certId: string }>>([]);
  const latest = items[items.length - 1];
  const [loading, setLoading] = useState<boolean>(false);

  // 加载该地址的历史发证（通过事件过滤 recipient）
  useEffect(() => {
    (async () => {
      if (!provider || !account) return;
      try {
        setLoading(true);
        const bp = new ethers.BrowserProvider(provider);
        const iFace = new ethers.Interface(CertChainRegistryABI as any);
        const topic0 = iFace.getEvent("CertificateIssued").topicHash;
        const topicRecipient = ethers.zeroPadValue(account as `0x${string}` as string, 32);
        const logs = await bp.getLogs({
          address: CertChainRegistryAddress,
          fromBlock: 0n,
          toBlock: "latest",
          topics: [topic0, null, null, topicRecipient],
        });

        const parsed = logs.map((l) => iFace.decodeEventLog("CertificateIssued", l.data, l.topics));
        const list = parsed.map((p: any) => ({ certId: p[0] as string }));
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [provider, account]);

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="cert-card p-12 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-4">连接钱包</h2>
          <p className="text-gray-600 mb-8">请先连接您的 MetaMask 钱包以查看证书</p>
          <button onClick={connectWallet} className="btn-primary">
            连接 MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">我的证书</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="font-mono text-sm">{account.slice(0, 10)}...{account.slice(-8)}</span>
          </div>
          <span className="badge-verified">已连接</span>
        </div>
      </div>

      {loading && (
        <div className="cert-card p-6 text-center mb-6">正在加载证书...</div>
      )}

      {items.length === 0 && !loading && (
        <div className="cert-card p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">暂无证书</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            当前地址下暂未找到任何证书。您可以联系培训机构为您发放证书，或使用证书 ID 进行验证查询。
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/verify" className="btn-primary">验证证书</Link>
            <Link href="/" className="btn-secondary">了解更多</Link>
          </div>
        </div>
      )}

      {latest && (
        <div className="cert-card p-6">
          <h3 className="font-semibold text-primary mb-2">证书</h3>
          <p className="text-sm text-gray-500 mb-1">证书 ID</p>
          <p className="font-mono text-xs break-all mb-3">{latest.certId}</p>

          <div className="flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={async () => {
                await revoke(latest.certId, "User request");
              }}
            >
              撤销证书
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                await restore(latest.certId);
              }}
            >
              取消撤销
            </button>
          </div>
        </div>
      )}

      <div className="mt-12" />
    </div>
  );
}
