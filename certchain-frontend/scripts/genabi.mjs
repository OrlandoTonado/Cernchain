#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// 将 action/certchain-hardhat 部署产物写入前端合约常量文件
const root = resolve(process.cwd(), "..");
const hardhatDeployments = resolve(
  root,
  "certchain-hardhat/deployments/sepolia/CertChainRegistry.json"
);

function main() {
  try {
    const deployed = JSON.parse(readFileSync(hardhatDeployments, "utf-8"));
    const abi = JSON.stringify(deployed.abi, null, 2);
    const addr = deployed.address;
    const out = resolve(process.cwd(), "src/contracts/CertChainRegistry.ts");
    const content = `export const CertChainRegistryABI = ${abi} as const;\nexport const CertChainRegistryAddress = "${addr}" as const;\n`;
    writeFileSync(out, content);
    console.log("ABI/address generated:", out);
  } catch (e) {
    console.error("genabi failed:", e.message);
    process.exit(0);
  }
}

main();



