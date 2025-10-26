import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export {};


