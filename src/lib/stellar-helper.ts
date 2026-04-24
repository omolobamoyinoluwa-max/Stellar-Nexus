import { 
  StellarAccount, 
  Transaction, 
  WalletState, 
  PaymentParams, 
  ValidationResult, 
  StellarNetworkConfig,
  PerformanceMetrics 
} from '@/types/stellar';

export class StellarHelper {
  private static instance: StellarHelper;
  private networkConfig: StellarNetworkConfig;
  private performanceMetrics: PerformanceMetrics;

  private constructor() {
    this.networkConfig = {
      network: 'TESTNET',
      horizonUrl: 'https://horizon-testnet.stellar.org',
      passphrase: 'Test SDF Network ; September 2015',
      fee: 100
    };
    this.performanceMetrics = {
      transactionSpeed: 0,
      uiResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0
    };
  }

  public static getInstance(): StellarHelper {
    if (!StellarHelper.instance) {
      StellarHelper.instance = new StellarHelper();
    }
    return StellarHelper.instance;
  }

  /**
   * Check if Freighter wallet is available
   */
  public async isWalletAvailable(): Promise<boolean> {
    try {
      return typeof window !== 'undefined' && !!window.freighter;
    } catch (error) {
      console.error('Wallet availability check failed:', error);
      return false;
    }
  }

  /**
   * Check if wallet is connected
   */
  public async isWalletConnected(): Promise<boolean> {
    try {
      if (!window.freighter) return false;
      return await window.freighter.isConnected();
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }

  /**
   * Get public key from connected wallet
   */
  public async getPublicKey(): Promise<string> {
    const startTime = performance.now();
    
    try {
      if (!window.freighter) {
        throw new Error('Freighter wallet is not installed');
      }

      const publicKey = await window.freighter.getPublicKey();
      
      this.performanceMetrics.uiResponseTime = performance.now() - startTime;
      return publicKey;
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw new Error(`Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch account details from Horizon
   */
  public async getAccount(publicKey: string): Promise<StellarAccount> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.networkConfig.horizonUrl}/accounts/${publicKey}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account: ${response.statusText}`);
      }

      const accountData = await response.json();
      const xlmBalance = accountData.balances.find((balance: any) => balance.asset_type === 'native');
      
      this.performanceMetrics.uiResponseTime = performance.now() - startTime;
      
      return {
        publicKey: accountData.id,
        balance: xlmBalance ? parseFloat(xlmBalance.balance) : 0,
        sequence: parseInt(accountData.sequence),
        subentry_count: accountData.subentry_count,
        last_modified_ledger: accountData.last_modified_ledger,
        thresholds: accountData.thresholds,
        flags: accountData.flags,
        balances: accountData.balances,
        signers: accountData.signers,
        data: accountData.data
      };
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw new Error(`Account fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Stellar address
   */
  public validateAddress(address: string): ValidationResult {
    const errors: string[] = [];
    
    if (!address) {
      errors.push('Address is required');
    } else if (!/^G[A-Z0-9]{55}$/.test(address)) {
      errors.push('Invalid Stellar address format. Must start with G and be 56 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate payment parameters
   */
  public validatePayment(params: PaymentParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate recipient
    const addressValidation = this.validateAddress(params.recipient);
    if (!addressValidation.isValid) {
      errors.push(...addressValidation.errors);
    }

    // Validate amount
    if (!params.amount || params.amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (params.amount < 0.0000001) {
      errors.push('Minimum amount is 0.0000001 XLM');
    }

    // Validate memo
    if (params.memo && params.memo.length > 28) {
      errors.push('Memo must be 28 characters or less');
    }

    // Warnings
    if (params.amount > 1000) {
      warnings.push('Large transaction amount detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create transaction
   */
  public async createTransaction(params: PaymentParams): Promise<string> {
    const startTime = performance.now();
    
    try {
      if (!window.StellarSdk) {
        throw new Error('Stellar SDK not loaded');
      }

      // Get account details
      const account = await this.getAccount(params.recipient);
      
      // Build transaction
      const transaction = new window.StellarSdk.TransactionBuilder(account, {
        fee: this.networkConfig.fee,
        networkPassphrase: this.networkConfig.passphrase
      })
      .addOperation(window.StellarSdk.Operation.payment({
        destination: params.recipient,
        asset: window.StellarSdk.Asset.native(),
        amount: params.amount.toFixed(7)
      }));

      // Add memo if provided
      if (params.memo) {
        transaction.addMemo(window.StellarSdk.Memo.text(params.memo));
      }

      transaction.setTimeout(30);
      
      const builtTransaction = transaction.build();
      
      this.performanceMetrics.transactionSpeed = performance.now() - startTime;
      return builtTransaction.toXDR();
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw new Error(`Transaction creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign transaction with Freighter
   */
  public async signTransaction(xdr: string): Promise<string> {
    const startTime = performance.now();
    
    try {
      if (!window.freighter) {
        throw new Error('Freighter wallet is not available');
      }

      const signedXdr = await window.freighter.signTransaction(xdr, this.networkConfig.network);
      
      this.performanceMetrics.uiResponseTime = performance.now() - startTime;
      return signedXdr;
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw new Error(`Transaction signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit transaction to Horizon
   */
  public async submitTransaction(signedXdr: string): Promise<{ hash: string; ledger: number }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.networkConfig.horizonUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tx=${encodeURIComponent(signedXdr)}`
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.extras?.result_codes?.transaction || 'Transaction submission failed');
      }

      this.performanceMetrics.transactionSpeed = performance.now() - startTime;
      return {
        hash: result.hash,
        ledger: result.ledger
      };
    } catch (error) {
      this.performanceMetrics.errorRate++;
      throw new Error(`Transaction submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete payment flow
   */
  public async sendPayment(params: PaymentParams): Promise<{ hash: string; ledger: number }> {
    // Validate parameters
    const validation = this.validatePayment(params);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Create transaction
    const xdr = await this.createTransaction(params);

    // Sign transaction
    const signedXdr = await this.signTransaction(xdr);

    // Submit transaction
    return await this.submitTransaction(signedXdr);
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      transactionSpeed: 0,
      uiResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0
    };
  }

  /**
   * Format address for display
   */
  public formatAddress(address: string, length: number = 8): string {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  /**
   * Format balance
   */
  public formatBalance(balance: number, decimals: number = 7): string {
    return balance.toFixed(decimals);
  }

  /**
   * Convert XLM to USD (mock implementation)
   */
  public convertXLMtoUSD(xlmAmount: number, rate: number = 0.13): number {
    return xlmAmount * rate;
  }

  /**
   * Get explorer URL
   */
  public getExplorerUrl(type: 'account' | 'transaction', id: string): string {
    const baseUrl = 'https://stellar.expert/explorer/testnet';
    return type === 'account' 
      ? `${baseUrl}/account/${id}`
      : `${baseUrl}/tx/${id}`;
  }
}
