interface Window {
  ethereum?: {
    isMetaMask?: true;
    request: (...args: unknown[]) => Promise<void>;
    selectedAddress?: string;
  };
}