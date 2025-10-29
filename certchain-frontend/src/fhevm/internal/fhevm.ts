import { RelayerSDKLoader } from "./RelayerSDKLoader";
import type { ethers } from "ethers";

export type FhevmInstance = any; // 轻量占位；真实类型由 UMD 提供

export async function createFhevmInstance(parameters: {
  provider: ethers.Eip1193Provider | string;
}): Promise<FhevmInstance> {
  const { provider } = parameters;

  // 仅在确认当前链是 31337（本地）时，才尝试连接 localhost:8545 进行 mock 检测
  try {
    const { BrowserProvider, JsonRpcProvider } = await import("ethers");

    let chainId: number | undefined = undefined;
    if (typeof provider !== "string") {
      try {
        const bp = new BrowserProvider(provider);
        const net = await bp.getNetwork();
        chainId = Number(net.chainId);
      } catch {
        chainId = undefined;
      }
    } else {
      // 简单判断：若显式传入的 URL 指向 localhost
      if (/localhost|127\.0\.0\.1/.test(provider)) {
        chainId = 31337;
      }
    }

    if (chainId === 31337) {
      const p = new JsonRpcProvider("http://localhost:8545");
      try {
        const clientVersion = await p.send("web3_clientVersion", []);
        const isHardhat = typeof clientVersion === "string" && clientVersion.includes("hardhat");
        if (isHardhat) {
          const { MockFhevmInstance } = await import("@fhevm/mock-utils");
          const meta = await p.send("fhevm_relayer_metadata", []);
          return await MockFhevmInstance.create(p, p, {
            aclContractAddress: meta.ACLAddress,
            chainId: Number((await p.getNetwork()).chainId),
            gatewayChainId: 55815,
            inputVerifierContractAddress: meta.InputVerifierAddress,
            kmsContractAddress: meta.KMSVerifierAddress,
            verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
            verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
          });
        }
      } catch {
        // 本地节点不可达，直接走 SDK 流程
      }
    }
  } catch {
    // ignore, fallback to relayer-sdk
  }

  // 生产/测试网：使用 relayer-sdk UMD
  const loader = new RelayerSDKLoader();
  await loader.load();
  const relayerSDK = (window as any).relayerSDK;
  await relayerSDK.initSDK();
  const instance = await relayerSDK.createInstance({
    ...relayerSDK.SepoliaConfig,
    network: provider,
  });
  return instance;
}


