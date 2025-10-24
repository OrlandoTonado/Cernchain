"use client";

import { useWallet } from "@/context/WalletContext";

export function ConnectWalletButton() {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet();

  if (account) {
    return (
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm border border-green-200">
          {account.slice(0, 6)}...{account.slice(-4)}
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
        >
          断开
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="px-6 py-2 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? "连接中..." : "连接钱包"}
    </button>
  );
}


