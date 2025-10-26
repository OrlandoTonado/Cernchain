"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { useCertChain } from "@/hooks/useCertChain";
import { pinFileToIPFS, pinJSONToIPFS } from "@/lib/pinata";
import { CertChainRegistryABI, CertChainRegistryAddress } from "@/contracts/CertChainRegistry";

export default function IssuePage() {
  const { account, provider, connectWallet } = useWallet();
  const { issue, issueAuto, message, signer, checkIsIssuer, registerIssuer } = useCertChain({ provider, contractAddress: CertChainRegistryAddress, abi: CertChainRegistryABI });
  const [step, setStep] = useState(1);

  // Form data
  const [recipient, setRecipient] = useState<string>("");
  const [cid, setCid] = useState<string>("");
  const [certId, setCertId] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [courseTag, setCourseTag] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      const ok = await checkIsIssuer();
      setIsIssuer(ok);
    })();
  }, [checkIsIssuer]);

  const generateCertId = () => {
    const random = ethers.hexlify(ethers.randomBytes(32));
    setCertId(random);
  };

  const onIssue = async () => {
    if (!recipient || !cid || !certId) return;
    setIsSubmitting(true);
    try {
      const vu = validUntil ? BigInt(validUntil) : 0n;
      await issue({ recipient: recipient as `0x${string}`, cid, certId, validUntil: vu, courseTag: Number(courseTag) });
      setStep(4);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="cert-card p-12 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-primary mb-4">连接钱包</h2>
          <p className="text-gray-600 mb-8">请先连接您的 MetaMask 钱包以发放证书</p>
          <button onClick={connectWallet} className="btn-primary">
            连接 MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-bold text-primary text-center mb-4">发放证书</h1>
      <p className="text-center text-gray-600 mb-12">完成以下步骤以上链发放培训证书</p>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? "bg-primary" : "bg-gray-200"}`}></div>}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>填写信息</span>
          <span>上传元数据</span>
          <span>确认发证</span>
          <span>完成</span>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="cert-card p-8">
          <h2 className="text-2xl font-semibold mb-6">填写证书信息</h2>
          {!isIssuer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-900">当前地址尚未注册为 Issuer。点击下方按钮快速注册（链上写入机构名称，可随时更新）。</p>
              <button
                className="btn-primary mt-3"
                onClick={async () => {
                  await registerIssuer("Default Issuer", "");
                  const ok = await checkIsIssuer();
                  setIsIssuer(ok);
                }}
              >
                一键注册机构
              </button>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学员地址 *</label>
              <input
                type="text"
                className="input-field"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">接收证书的学员钱包地址</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">课程标签</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={courseTag}
                onChange={(e) => setCourseTag(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">课程分类标识（数字，加密存储）</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">有效期（Unix 时间戳）</label>
              <input
                type="text"
                className="input-field"
                placeholder="留空表示永久有效"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={() => setStep(2)} disabled={!recipient} className="btn-primary disabled:opacity-50">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2: IPFS 上传或填入 CID */}
      {step === 2 && (
        <div className="cert-card p-8">
          <h2 className="text-2xl font-semibold mb-6">上传证书元数据</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上传 JSON 文件（或 PDF/图片）</label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="application/json,application/pdf,image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadBusy(true);
                      const key = process.env.NEXT_PUBLIC_PINATA_JWT || "";
                      if (!key) {
                        alert("缺少 Pinata Key: NEXT_PUBLIC_PINATA_JWT");
                        return;
                      }
                      const isJson = file.type === "application/json";
                      if (isJson) {
                        const text = await file.text();
                        const json = JSON.parse(text);
                        const cidUrl = await pinJSONToIPFS(json, key);
                        setCid(cidUrl);
                      } else {
                        const cidUrl = await pinFileToIPFS(file, key);
                        setCid(cidUrl);
                      }
                    } catch (err: any) {
                      console.error(err);
                      alert("上传失败: " + (err?.message || "unknown"));
                    } finally {
                      setUploadBusy(false);
                    }
                  }}
                  className="block"
                />
                {uploadBusy && <span className="text-sm text-gray-500">上传中...</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">支持将 JSON/PDF/图片直接上传到 IPFS（Pinata）</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IPFS CID *</label>
              <input
                type="text"
                className="input-field"
                placeholder="ipfs://Qm... 或 bafybei..."
                value={cid}
                onChange={(e) => setCid(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">请先将证书 JSON 上传到 IPFS 并获取 CID</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 提示：元数据 JSON 示例</p>
              <pre className="text-xs bg-white p-3 rounded overflow-auto">
{`{
  "title": "区块链开发结业证书",
  "recipientName": "张三",
  "issuerName": "培训机构",
  "course": "区块链全栈",
  "grade": "优秀",
  "issuedDate": "2025-06-30"
}`}
              </pre>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="btn-secondary">
              上一步
            </button>
            <button onClick={() => setStep(3)} disabled={!cid} className="btn-primary disabled:opacity-50">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="cert-card p-8">
          <h2 className="text-2xl font-semibold mb-6">确认发证信息</h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">学员地址</span>
              <span className="font-mono text-sm">{recipient.slice(0, 10)}...{recipient.slice(-8)}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">IPFS CID</span>
              <span className="font-mono text-sm">{cid.slice(0, 20)}...</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">课程标签</span>
              <span className="font-semibold">{courseTag}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">证书 ID</span>
              {certId ? (
                <span className="font-mono text-sm">{certId.slice(0, 10)}...{certId.slice(-8)}</span>
              ) : (
                <button onClick={generateCertId} className="text-primary hover:underline">
                  生成证书 ID
                </button>
              )}
            </div>
          </div>
          {message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">{message}</p>
            </div>
          )}
            <div className="flex justify-between flex-wrap gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary" disabled={isSubmitting}>
              上一步
            </button>
            <button onClick={onIssue} disabled={!certId || isSubmitting} className="btn-primary disabled:opacity-50">
              {isSubmitting ? "发证中..." : "用自定义ID发证"}
            </button>
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const vu = validUntil ? BigInt(validUntil) : 0n;
                  await issueAuto({ recipient: recipient as `0x${string}`, cid, validUntil: vu, courseTag: Number(courseTag) });
                  setStep(4);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? "发证中..." : "链上生成ID并发证"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="cert-card p-12 text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif font-bold text-primary mb-4">发证成功！</h2>
          <p className="text-gray-600 mb-8">证书已成功上链，学员可通过以下证书 ID 进行验证</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-xs text-gray-500 mb-1">证书 ID</p>
            <p className="font-mono text-sm break-all">{certId}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button onClick={() => {
              setStep(1);
              setRecipient("");
              setCid("");
              setCertId("");
              setValidUntil("");
              setCourseTag("0");
            }} className="btn-secondary">
              继续发证
            </button>
            <button onClick={() => window.location.href = `/verify?id=${certId}`} className="btn-primary">
              查看证书
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
