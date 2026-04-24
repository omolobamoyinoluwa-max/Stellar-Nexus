export interface StellarAccount {
  publicKey: string;
  balance: number;
  sequence: number;
  subentry_count: number;
  last_modified_ledger: number;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
  };
  balances: Balance[];
  signers: Signer[];
  data: Record<string, string>;
}

export interface Balance {
  balance: string;
  limit: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface Signer {
  public_key: string;
  weight: number;
  key: string;
  type: string;
}

export interface Transaction {
  hash: string;
  recipient: string;
  amount: number;
  memo?: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  fee_paid?: number;
  ledger?: number;
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  balance: number;
  network: 'TESTNET' | 'PUBLIC';
  isLoading: boolean;
  error: string | null;
}

export interface TransactionState {
  isProcessing: boolean;
  currentTransaction: Transaction | null;
  history: Transaction[];
  error: string | null;
}

export interface StellarNetworkConfig {
  network: 'TESTNET' | 'PUBLIC';
  horizonUrl: string;
  passphrase: string;
  fee: number;
}

export interface PaymentParams {
  recipient: string;
  amount: number;
  memo?: string;
  fee?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PerformanceMetrics {
  transactionSpeed: number;
  uiResponseTime: number;
  errorRate: number;
  memoryUsage: number;
}

declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      signTransaction: (xdr: string, network: string) => Promise<string>;
      getNetwork: () => Promise<string>;
      getUserInfo: () => Promise<any>;
    };
    StellarSdk?: any;
  }
}
