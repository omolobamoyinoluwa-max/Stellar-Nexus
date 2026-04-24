import React, { useState } from 'react';
import { useStellarWallet } from '@/hooks/useStellarWallet';
import { StellarHelper } from '@/lib/stellar-helper';

interface PaymentCardProps {
  onTransactionSuccess?: (hash: string) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ onTransactionSuccess }) => {
  const { wallet, sendPayment, transaction, stellarHelper } = useStellarWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [pastedAddress, setPastedAddress] = useState(false);

  const quickAmounts = [1, 5, 10];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amountNum = parseFloat(amount);
      const result = await sendPayment(recipient, amountNum, memo);
      onTransactionSuccess?.(result.hash);
      
      // Reset form
      setRecipient('');
      setAmount('');
      setMemo('');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handlePasteAddress = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipient(text.trim());
      setPastedAddress(true);
      setTimeout(() => setPastedAddress(false), 2000);
    } catch (error) {
      console.error('Paste failed:', error);
    }
  };

  const validateRecipient = (address: string) => {
    const validation = stellarHelper.validateAddress(address);
    return validation.isValid;
  };

  const validateAmount = (value: string) => {
    const amountNum = parseFloat(value);
    const maxBalance = Math.max(0, wallet.balance - 0.00001);
    return amountNum > 0 && amountNum <= maxBalance;
  };

  const isFormValid = recipient && amount && 
                     validateRecipient(recipient) && 
                     validateAmount(amount);

  return (
    <div className="payment-card">
      <div className="card-header">
        <h3>Send XLM</h3>
        <div className="quick-amounts">
          {quickAmounts.map(quickAmount => (
            <button
              key={quickAmount}
              className="quick-amount"
              onClick={() => handleQuickAmount(quickAmount)}
            >
              {quickAmount} XLM
            </button>
          ))}
        </div>
      </div>

      <form className="payment-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="G..."
              required
              pattern="^G[A-Z0-9]{55}$"
              title="Stellar addresses start with 'G' and are 56 characters long"
              className={!recipient || validateRecipient(recipient) ? '' : 'error'}
            />
            <button 
              type="button" 
              className="paste-btn" 
              onClick={handlePasteAddress}
              title="Paste address"
            >
              <span>{pastedAddress ? '✅' : '📋'}</span>
            </button>
          </div>
          <div className="input-hint">
            Enter a Stellar address (starts with G)
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (XLM)</label>
          <div className="amount-wrapper">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.0000001"
              min="0.0000001"
              required
              className={!amount || validateAmount(amount) ? '' : 'error'}
            />
            <div className="amount-info">
              <span className="max-balance">
                Max: {Math.max(0, wallet.balance - 0.00001).toFixed(7)} XLM
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="memo">Memo (Optional)</label>
          <input
            type="text"
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note..."
            maxLength={28}
          />
          <div className="input-hint">
            Optional message for the recipient
          </div>
        </div>

        {transaction.error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{transaction.error}</span>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary btn-large"
          disabled={!isFormValid || transaction.isProcessing}
        >
          <span className="btn-icon">💸</span>
          {transaction.isProcessing ? 'Processing...' : 'Send XLM'}
        </button>
      </form>
    </div>
  );
};
