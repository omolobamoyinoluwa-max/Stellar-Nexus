import React from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { StellarHelper } from '@/lib/stellar-helper';

interface StatusCardProps {
  onNewTransaction?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ onNewTransaction }) => {
  const { transaction, stellarHelper } = useStellarWallet();

  if (!transaction.currentTransaction) return null;

  const { hash, recipient, amount, memo, status } = transaction.currentTransaction;

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return 'ℹ️';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Transaction Successful!';
      case 'failed':
        return 'Transaction Failed';
      case 'pending':
        return 'Processing Transaction';
      default:
        return 'Transaction Status';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'success':
        return `Successfully sent ${amount.toFixed(7)} XLM to ${stellarHelper.formatAddress(recipient)}`;
      case 'failed':
        return 'Transaction could not be completed. Please try again.';
      case 'pending':
        return 'Your transaction is being processed...';
      default:
        return 'Transaction status updated';
    }
  };

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(hash);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleNewTransaction = () => {
    onNewTransaction?.();
  };

  return (
    <div className="status-card">
      <div className="status-content">
        <div className={`status-icon ${status}`}>
          {getStatusIcon()}
        </div>
        <div className="status-message">
          <h3>{getStatusTitle()}</h3>
          <p>{getStatusDescription()}</p>
        </div>
      </div>

      {status === 'success' && (
        <div className="transaction-details">
          <div className="detail-row">
            <label>Transaction Hash:</label>
            <div className="hash-wrapper">
              <code>{hash}</code>
              <button 
                className="copy-btn" 
                onClick={handleCopyHash}
                title="Copy hash"
              >
                <span>📋</span>
              </button>
            </div>
          </div>
          <div className="detail-row">
            <label>Explorer:</label>
            <a 
              href={stellarHelper.getExplorerUrl('transaction', hash)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Stellar Expert →
            </a>
          </div>
          {memo && (
            <div className="detail-row">
              <label>Memo:</label>
              <span>{memo}</span>
            </div>
          )}
        </div>
      )}

      <div className="status-actions">
        <button className="btn btn-secondary" onClick={handleNewTransaction}>
          New Transaction
        </button>
        {transaction.history.length > 0 && (
          <button className="btn btn-primary">
            View History
          </button>
        )}
      </div>
    </div>
  );
};
