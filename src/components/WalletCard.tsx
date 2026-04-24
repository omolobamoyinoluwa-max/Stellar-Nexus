import React, { useState } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { StellarHelper } from '@/lib/stellar-helper';

interface WalletCardProps {
  onConnectSuccess?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ onConnectSuccess }) => {
  const { wallet, connectWallet, disconnectWallet, refreshBalance, stellarHelper } = useStellarWallet();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleConnect = async () => {
    try {
      await connectWallet();
      onConnectSuccess?.();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleCopyAddress = async () => {
    if (wallet.publicKey) {
      try {
        await navigator.clipboard.writeText(wallet.publicKey);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  const handleRefreshBalance = async () => {
    await refreshBalance();
  };

  if (wallet.error) {
    return (
      <div className="wallet-card">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{wallet.error}</span>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleConnect}
          disabled={wallet.isLoading}
        >
          {wallet.isLoading ? 'Connecting...' : 'Retry Connection'}
        </button>
      </div>
    );
  }

  return (
    <div className={`wallet-card ${wallet.isConnected ? 'wallet-connected' : ''}`}>
      <div className="wallet-header">
        <div className="wallet-icon">
          <div className="wallet-avatar">
            {wallet.isConnected ? '🔓' : '🔒'}
          </div>
        </div>
        <div className="wallet-info">
          <h2 id="wallet-status">
            {wallet.isConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
          </h2>
          <p id="wallet-subtitle">
            {wallet.isConnected ? 'Ready to send XLM' : 'Connect your Freighter wallet to start'}
          </p>
        </div>
      </div>

      {wallet.isConnected && wallet.publicKey && (
        <div className="wallet-details">
          <div className="address-section">
            <label>Your Address</label>
            <div className="address-display">
              <span id="address-text">
                {stellarHelper.formatAddress(wallet.publicKey)}
              </span>
              <button 
                className="copy-btn" 
                onClick={handleCopyAddress}
                title="Copy address"
              >
                <span className="copy-icon">{copiedAddress ? '✅' : '📋'}</span>
              </button>
            </div>
          </div>

          <div className="balance-section">
            <div className="balance-header">
              <label>XLM Balance</label>
              <button 
                className="refresh-btn" 
                onClick={handleRefreshBalance}
                title="Refresh balance"
              >
                <span className="refresh-icon">🔄</span>
              </button>
            </div>
            <div className="balance-amount">
              <span className="balance-value">
                {stellarHelper.formatBalance(wallet.balance)}
              </span>
              <span className="balance-currency">XLM</span>
            </div>
            <div className="balance-usd">
              ≈ ${stellarHelper.convertXLMtoUSD(wallet.balance).toFixed(2)} USD
            </div>
          </div>
        </div>
      )}

      <div className="wallet-actions">
        {!wallet.isConnected ? (
          <button 
            className="btn btn-primary" 
            onClick={handleConnect}
            disabled={wallet.isLoading}
          >
            <span className="btn-icon">🔗</span>
            {wallet.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={handleDisconnect}
          >
            <span className="btn-icon">🔓</span>
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
