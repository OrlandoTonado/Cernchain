"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useCertChain } from "@/hooks/useCertChain";
import { CertChainRegistryABI, CertChainRegistryAddress } from "@/contracts/CertChainRegistry";

export default function VerifyPage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [certId, setCertId] = useState<string>("");
  const { get, decryptHandles, signer } = useCertChain({ provider, contractAddress: CertChainRegistryAddress, abi: CertChainRegistryABI });
  const [result, setResult] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setProvider((window as any).ethereum);
    }
  }, []);

  const onVerify = async () => {
    if (!certId) return;
    setLoading(true);
    setError("");
    setResult(undefined);

    try {
      const view = await get(certId);
      if (!view) {
        setError("未找到该证书");
        return;
      }

      // Decrypt handles if wallet connected
      let decrypted = null;
      if (signer) {
        try {
          decrypted = await decryptHandles([
            { handle: view.revokedHandle, contractAddress: CertChainRegistryAddress },
            { handle: view.courseTagHandle, contractAddress: CertChainRegistryAddress },
          ]);
        } catch (e) {
          console.error("解密失败", e);
        }
      }

      setResult({ view, decrypted });
    } catch (e: any) {
      setError(e.message || "查询失败");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">验证证书</h1>
        <p className="text-gray-600">输入证书 ID 查询链上证书信息</p>
      </div>

      {/* Search Box */}
      <div className="cert-card p-8 mb-8">
        <div className="flex space-x-4">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="输入证书 ID (bytes32 hex, 以 0x 开头)"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
          />
          <button onClick={onVerify} disabled={loading || !certId} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {loading ? "查询中..." : "验证"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-lg">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="cert-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-primary">证书信息</h2>
              {result.decrypted && result.decrypted[result.view.revokedHandle] === false ? (
                <span className="badge-verified">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  有效证书
                </span>
              ) : result.decrypted && result.decrypted[result.view.revokedHandle] === true ? (
                <span className="badge-revoked">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  已撤销
                </span>
              ) : (
                <span className="badge-warning">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  需连接钱包解密状态
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">证书 ID</p>
                  <p className="font-mono text-sm break-all">{result.view.certId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">颁发时间</p>
                  <p className="font-medium">{new Date(Number(result.view.issuedAt) * 1000).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">颁发机构</p>
                <p className="font-mono text-sm break-all">{result.view.issuer}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">学员地址</p>
                <p className="font-mono text-sm break-all">{result.view.owner || "未指定"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">IPFS CID</p>
                <a href={`https://ipfs.io/ipfs/${result.view.cid.replace("ipfs://", "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-sm break-all">
                  {result.view.cid}
                </a>
              </div>

              {result.view.validUntil !== "0" && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">有效期至</p>
                  <p className="font-medium">{new Date(Number(result.view.validUntil) * 1000).toLocaleString()}</p>
                </div>
              )}

              {result.decrypted && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">解密信息</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm">
                      <span className="text-gray-600">撤销状态：</span>
                      <span className="font-semibold ml-2">
                        {result.decrypted[result.view.revokedHandle] === true ? "已撤销" : "有效"}
                      </span>
                    </p>
                    <p className="text-sm mt-2">
                      <span className="text-gray-600">课程标签：</span>
                      <span className="font-semibold ml-2">
                        {result.decrypted[result.view.courseTagHandle]?.toString() || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!signer && (
            <div className="cert-card p-6 text-center">
              <p className="text-gray-600 mb-4">连接钱包以解密证书状态和课程标签</p>
              <button onClick={connectWallet} className="btn-primary">
                连接 MetaMask
              </button>
            </div>
          )}

          {/* Blockchain Proof */}
          <div className="cert-card p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              链上证明
            </h3>
            <p className="text-sm text-gray-600">此证书已记录在 Sepolia 测试网</p>
            <p className="text-xs text-gray-500 mt-1">合约地址：{CertChainRegistryAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
}
