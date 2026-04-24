import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { WalletCard } from '@/components/WalletCard';
import { PaymentCard } from '@/components/PaymentCard';
import { StatusCard } from '@/components/StatusCard';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { StellarHelper } from '@/lib/stellar-helper';

export default function Home() {
  const { wallet, transaction, resetCurrentTransaction, stellarHelper } = useStellarWallet();
  const [showPayment, setShowPayment] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (wallet.isConnected) {
      setShowPayment(true);
    } else {
      setShowPayment(false);
      setShowStatus(false);
    }
  }, [wallet.isConnected]);

  useEffect(() => {
    if (transaction.currentTransaction) {
      setShowStatus(true);
      setShowPayment(false);
    }
  }, [transaction.currentTransaction]);

  const handleConnectSuccess = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000);
  };

  const handleTransactionSuccess = (hash: string) => {
    // Transaction success is handled by the hook
    setShowStatus(true);
  };

  const handleNewTransaction = () => {
    resetCurrentTransaction();
    setShowStatus(false);
    setShowPayment(true);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Stellar Nexus - Next-Generation Payment Protocol</title>
        <meta name="description" content="Enterprise-Grade Payment Infrastructure for Stellar Ecosystem" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/@stellar/freighter-api@latest/lib/index.min.js" async />
        <script src="https://cdn.jsdelivr.net/npm/stellar-sdk@latest/lib/stellar-sdk.min.js" async />
      </Head>

      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">Stellar Nexus</span>
            </div>
            <div className="network-badge">
              <span className="network-dot"></span>
              Testnet
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Wallet Card */}
          <WalletCard onConnectSuccess={handleConnectSuccess} />

          {/* Payment Card */}
          {showPayment && (
            <PaymentCard onTransactionSuccess={handleTransactionSuccess} />
          )}

          {/* Status Card */}
          {showStatus && (
            <StatusCard onNewTransaction={handleNewTransaction} />
          )}

          {/* Transaction History */}
          {wallet.isConnected && transaction.history.length > 0 && (
            <div className="history-card">
              <div className="card-header">
                <h3>Recent Transactions</h3>
                <span className="history-count">{transaction.history.length}</span>
              </div>
              <div className="history-list">
                {transaction.history.slice(0, 5).map((tx, index) => (
                  <div key={tx.hash} className="history-item">
                    <div className="history-header">
                      <span className="history-amount">-{tx.amount.toFixed(7)} XLM</span>
                      <span className={`history-status ${tx.status}`}>{tx.status}</span>
                    </div>
                    <div className="history-details">
                      <div className="history-recipient">
                        To: {stellarHelper.formatAddress(tx.recipient)}
                      </div>
                      <div className="history-time">{formatTime(tx.timestamp)}</div>
                      {tx.memo && (
                        <div className="history-memo">Memo: {tx.memo}</div>
                      )}
                    </div>
                    <div className="history-actions">
                      <a 
                        href={stellarHelper.getExplorerUrl('transaction', tx.hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="history-link"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>Enterprise-Grade Payment Infrastructure for Stellar Ecosystem</p>
          <div className="footer-links">
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer">
              Stellar.org
            </a>
            <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
              Freighter Wallet
            </a>
            <a href="https://github.com/omolobamoyinoluwa-max/Stellar-Nexus" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </footer>
      </div>

      {/* Confetti Effect */}
      {confetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: '50%',
                top: '50%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
                backgroundColor: ['#6B46C1', '#F59E0B', '#10B981', '#EF4444'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}

      {/* Loading Overlay */}
      {wallet.isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Connecting to wallet...</p>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="toast-container" />
    </>
  );
}
