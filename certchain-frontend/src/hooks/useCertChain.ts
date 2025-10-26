"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { createFhevmInstance } from "@/fhevm/internal/fhevm";

type CertView = {
  certId: string;
  issuer: string;
  owner: string;
  cid: string;
  issuedAt: bigint;
  validUntil: bigint;
  revokedHandle: string;
  courseTagHandle: string;
};

export function useCertChain(params: {
  provider: ethers.Eip1193Provider | undefined;
  contractAddress?: `0x${string}`;
  abi?: any;
}) {
  const { provider, contractAddress, abi } = params;

  const [instance, setInstance] = useState<any>();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>();
  const [readonly, setReadonly] = useState<ethers.Provider | undefined>();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!provider) return;
    const p = new ethers.BrowserProvider(provider);
    p.getSigner().then(setSigner).catch(() => setSigner(undefined));
    setReadonly(p);
    createFhevmInstance({ provider }).then(setInstance).catch(() => setInstance(undefined));
  }, [provider]);

  const contractReadonly = useMemo(() => {
    if (!readonly || !contractAddress || !abi) return undefined;
    return new ethers.Contract(contractAddress, abi, readonly);
  }, [readonly, contractAddress, abi]);

  const contractWrite = useMemo(() => {
    if (!signer || !contractAddress || !abi) return undefined;
    return new ethers.Contract(contractAddress, abi, signer);
  }, [signer, contractAddress, abi]);

  const issue = useCallback(
    async (args: { recipient: `0x${string}`; cid: string; certId: string; validUntil: bigint; courseTag: number }) => {
      if (!instance || !contractWrite) return;
      const input = instance.createEncryptedInput(contractAddress, await signer!.getAddress());
      input.add32(BigInt(args.courseTag));
      const enc = await input.encrypt();
      const tx = await contractWrite.issueCertificate(args.recipient, args.cid, args.certId, args.validUntil, enc.handles[0], enc.inputProof);
      setMessage(`tx: ${tx.hash}`);
      await tx.wait();
      setMessage("issue done");
    },
    [instance, contractWrite, signer, contractAddress]
  );

  const issueAuto = useCallback(
    async (args: { recipient: `0x${string}`; cid: string; validUntil: bigint; courseTag: number }) => {
      if (!instance || !contractWrite) return;
      const input = instance.createEncryptedInput(contractAddress, await signer!.getAddress());
      input.add32(BigInt(args.courseTag));
      const enc = await input.encrypt();
      const tx = await contractWrite.issueCertificateAuto(args.recipient, args.cid, args.validUntil, enc.handles[0], enc.inputProof);
      setMessage(`tx: ${tx.hash}`);
      await tx.wait();
      setMessage("issue auto done");
    },
    [instance, contractWrite, signer, contractAddress]
  );

  const get = useCallback(
    async (certId: string): Promise<CertView | undefined> => {
      if (!contractReadonly) return undefined;
      const res = await contractReadonly.getCertificate(certId);
      return {
        certId: res[0],
        issuer: res[1],
        owner: res[2],
        cid: res[3],
        issuedAt: res[4],
        validUntil: res[5],
        revokedHandle: res[6],
        courseTagHandle: res[7],
      } as unknown as CertView;
    },
    [contractReadonly]
  );

  const revoke = useCallback(
    async (certId: string, reason: string) => {
      if (!contractWrite) return;
      const tx = await contractWrite.revokeCertificate(certId, reason);
      setMessage(`revoke tx: ${tx.hash}`);
      await tx.wait();
      setMessage("revoke done");
    },
    [contractWrite]
  );

  const restore = useCallback(
    async (certId: string) => {
      if (!contractWrite) return;
      const tx = await (contractWrite as any).restoreCertificate(certId);
      setMessage(`restore tx: ${tx.hash}`);
      await tx.wait();
      setMessage("restore done");
    },
    [contractWrite]
  );

  const decryptHandles = useCallback(
    async (items: { handle: string; contractAddress: string }[]) => {
      if (!instance || !signer) return {} as Record<string, bigint | boolean | string>;
      const userAddress = await signer.getAddress();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;
      const eip712 = instance.createEIP712(keypair.publicKey, [contractAddress], startTimestamp, durationDays);
      const signature = await signer.signTypedData(eip712.domain, { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification }, eip712.message);
      return await instance.userDecrypt(
        items,
        keypair.privateKey,
        keypair.publicKey,
        signature,
        [contractAddress],
        userAddress,
        startTimestamp,
        durationDays
      );
    },
    [instance, signer, contractAddress]
  );

  const checkIsIssuer = useCallback(async (): Promise<boolean> => {
    if (!contractReadonly || !signer) return false;
    try {
      const addr = await signer.getAddress();
      const res = await (contractReadonly as any).isIssuer(addr);
      return Boolean(res);
    } catch {
      return false;
    }
  }, [contractReadonly, signer]);

  const registerIssuer = useCallback(
    async (name: string, metadataURI: string) => {
      if (!contractWrite) return;
      const tx = await (contractWrite as any).registerIssuer(name, metadataURI);
      setMessage(`register tx: ${tx.hash}`);
      await tx.wait();
      setMessage("register done");
    },
    [contractWrite]
  );

  const payForView = useCallback(
    async (certId: string, ethAmount: string) => {
      if (!contractWrite) return;
      const tx = await (contractWrite as any).tipForView(certId, { value: ethers.parseEther(ethAmount) });
      setMessage(`tip tx: ${tx.hash}`);
      await tx.wait();
      setMessage("tip done");
    },
    [contractWrite]
  );

  return { instance, signer, issue, issueAuto, get, revoke, restore, decryptHandles, message, checkIsIssuer, registerIssuer, payForView };
}


