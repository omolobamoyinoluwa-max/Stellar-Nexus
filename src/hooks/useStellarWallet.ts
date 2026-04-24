import { useState, useEffect, useCallback } from 'react';
import { WalletState, Transaction, TransactionState } from '@/types/stellar';
import { StellarHelper } from '@/lib/stellar-helper';

export const useStellarWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    balance: 0,
    network: 'TESTNET',
    isLoading: false,
    error: null
  });

  const [transactionState, setTransactionState] = useState<TransactionState>({
    isProcessing: false,
    currentTransaction: null,
    history: [],
    error: null
  });

  const stellarHelper = StellarHelper.getInstance();

  // Load transaction history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('stellar-nexus-history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setTransactionState(prev => ({ ...prev, history }));
      }
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    }
  }, []);

  // Save transaction history to localStorage
  const saveTransactionHistory = useCallback((history: Transaction[]) => {
    try {
      localStorage.setItem('stellar-nexus-history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save transaction history:', error);
    }
  }, []);

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isAvailable = await stellarHelper.isWalletAvailable();
        if (!isAvailable) {
          setWalletState(prev => ({ 
            ...prev, 
            error: 'Freighter wallet is not installed' 
          }));
          return;
        }

        const isConnected = await stellarHelper.isWalletConnected();
        if (isConnected) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const publicKey = await stellarHelper.getPublicKey();
      const account = await stellarHelper.getAccount(publicKey);

      setWalletState({
        isConnected: true,
        publicKey,
        balance: account.balance,
        network: 'TESTNET',
        isLoading: false,
        error: null
      });

      return { publicKey, balance: account.balance };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      publicKey: null,
      balance: 0,
      network: 'TESTNET',
      isLoading: false,
      error: null
    });

    setTransactionState({
      isProcessing: false,
      currentTransaction: null,
      history: [],
      error: null
    });
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletState.publicKey) return;

    try {
      const account = await stellarHelper.getAccount(walletState.publicKey);
      setWalletState(prev => ({ ...prev, balance: account.balance }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Balance refresh failed';
      setWalletState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [walletState.publicKey]);

  // Send payment
  const sendPayment = useCallback(async (recipient: string, amount: number, memo?: string) => {
    setTransactionState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null 
    }));

    try {
      const result = await stellarHelper.sendPayment({
        recipient,
        amount,
        memo
      });

      const transaction: Transaction = {
        hash: result.hash,
        recipient,
        amount,
        memo,
        timestamp: new Date().toISOString(),
        status: 'success',
        ledger: result.ledger
      };

      // Update transaction history
      const newHistory = [transaction, ...transactionState.history];
      setTransactionState(prev => ({
        ...prev,
        currentTransaction: transaction,
        history: newHistory,
        isProcessing: false
      }));

      // Save to localStorage
      saveTransactionHistory(newHistory);

      // Refresh balance
      await refreshBalance();

      return transaction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setTransactionState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [transactionState.history, refreshBalance, saveTransactionHistory]);

  // Clear transaction error
  const clearTransactionError = useCallback(() => {
    setTransactionState(prev => ({ ...prev, error: null }));
  }, []);

  // Clear wallet error
  const clearWalletError = useCallback(() => {
    setWalletState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset current transaction
  const resetCurrentTransaction = useCallback(() => {
    setTransactionState(prev => ({ ...prev, currentTransaction: null }));
  }, []);

  return {
    // Wallet state
    wallet: walletState,
    transaction: transactionState,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    
    // Transaction actions
    sendPayment,
    clearTransactionError,
    clearWalletError,
    resetCurrentTransaction,
    
    // Utility
    stellarHelper
  };
};
