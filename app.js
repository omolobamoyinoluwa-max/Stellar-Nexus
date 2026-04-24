// Stellar Nexus - Next-Generation Payment Protocol
// Enterprise-Grade Infrastructure for Stellar Ecosystem

class StellarNexusApp {
    constructor() {
        this.isConnected = false;
        this.publicKey = null;
        this.network = 'TESTNET';
        this.balance = 0;
        this.transactionHistory = [];
        this.xlmPrice = 0.13; // Mock price - in real app, fetch from API
        
        this.initializeElements();
        this.bindEvents();
        this.checkWalletConnection();
        this.loadTransactionHistory();
    }

    initializeElements() {
        // Wallet elements
        this.elements = {
            // Header
            walletCard: document.getElementById('wallet-card'),
            walletIcon: document.getElementById('wallet-icon'),
            walletStatus: document.getElementById('wallet-status'),
            walletSubtitle: document.getElementById('wallet-subtitle'),
            walletDetails: document.getElementById('wallet-details'),
            
            // Wallet info
            addressText: document.getElementById('address-text'),
            copyAddress: document.getElementById('copy-address'),
            balanceValue: document.getElementById('balance-value'),
            balanceUsd: document.getElementById('balance-usd'),
            refreshBalance: document.getElementById('refresh-balance'),
            maxBalance: document.getElementById('max-balance'),
            
            // Buttons
            connectBtn: document.getElementById('connect-btn'),
            disconnectBtn: document.getElementById('disconnect-btn'),
            
            // Payment form
            paymentCard: document.getElementById('payment-card'),
            paymentForm: document.getElementById('payment-form'),
            recipient: document.getElementById('recipient'),
            amount: document.getElementById('amount'),
            memo: document.getElementById('memo'),
            pasteAddress: document.getElementById('paste-address'),
            sendBtn: document.getElementById('send-btn'),
            
            // Quick amounts
            quickAmounts: document.querySelectorAll('.quick-amount'),
            
            // Status
            statusCard: document.getElementById('status-card'),
            statusIcon: document.getElementById('status-icon'),
            statusTitle: document.getElementById('status-title'),
            statusDescription: document.getElementById('status-description'),
            transactionDetails: document.getElementById('transaction-details'),
            txHash: document.getElementById('tx-hash'),
            copyHash: document.getElementById('copy-hash'),
            explorerLink: document.getElementById('explorer-link'),
            newTransaction: document.getElementById('new-transaction'),
            viewHistory: document.getElementById('view-history'),
            
            // History
            historyCard: document.getElementById('history-card'),
            historyList: document.getElementById('history-list'),
            closeHistory: document.getElementById('close-history'),
            
            // Loading and toasts
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            toastContainer: document.getElementById('toast-container')
        };
    }

    bindEvents() {
        // Wallet events
        this.elements.connectBtn.addEventListener('click', () => this.connectWallet());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        this.elements.refreshBalance.addEventListener('click', () => this.fetchBalance());
        
        // Copy events
        this.elements.copyAddress.addEventListener('click', () => this.copyToClipboard(this.publicKey, 'Address copied'));
        this.elements.copyHash.addEventListener('click', () => this.copyToClipboard(this.elements.txHash.textContent, 'Transaction hash copied'));
        
        // Payment form events
        this.elements.paymentForm.addEventListener('submit', (e) => this.handleTransaction(e));
        this.elements.pasteAddress.addEventListener('click', () => this.pasteFromClipboard());
        this.elements.amount.addEventListener('input', () => this.validateAmount());
        
        // Quick amount buttons
        this.elements.quickAmounts.forEach(btn => {
            btn.addEventListener('click', () => this.setQuickAmount(btn.dataset.amount));
        });
        
        // Status card events
        this.elements.newTransaction.addEventListener('click', () => this.resetToPayment());
        this.elements.viewHistory.addEventListener('click', () => this.showTransactionHistory());
        
        // History events
        this.elements.closeHistory.addEventListener('click', () => this.hideTransactionHistory());
        
        // Input validation
        this.elements.recipient.addEventListener('input', () => this.validateAddress());
        this.elements.amount.addEventListener('input', () => this.updateMaxBalance());
    }

    async checkWalletConnection() {
        try {
            if (window.freighter && window.freighter.isConnected()) {
                const publicKey = await window.freighter.getPublicKey();
                if (publicKey) {
                    this.publicKey = publicKey;
                    this.isConnected = true;
                    this.updateWalletUI();
                    await this.fetchBalance();
                }
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }

    async connectWallet() {
        try {
            this.showLoading('Connecting wallet...');
            
            if (!window.freighter) {
                throw new Error('Freighter wallet is not installed. Please install Freighter extension.');
            }

            const publicKey = await window.freighter.getPublicKey();
            
            if (!publicKey) {
                throw new Error('Failed to get public key from Freighter wallet.');
            }

            this.publicKey = publicKey;
            this.isConnected = true;
            
            this.updateWalletUI();
            await this.fetchBalance();
            
            this.showToast('Wallet connected successfully!', 'success');
            this.showConfetti();
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showToast(`Connection failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async disconnectWallet() {
        try {
            this.showLoading('Disconnecting wallet...');
            
            this.isConnected = false;
            this.publicKey = null;
            this.balance = 0;
            
            this.updateWalletUI();
            this.hideAllCards();
            this.showToast('Wallet disconnected', 'info');
            
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            this.showToast(`Disconnection failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateWalletUI() {
        if (this.isConnected) {
            // Update wallet card
            this.elements.walletCard.classList.add('wallet-connected');
            this.elements.walletIcon.querySelector('.wallet-avatar').textContent = '🔓';
            this.elements.walletStatus.textContent = 'Wallet Connected';
            this.elements.walletSubtitle.textContent = 'Ready to send XLM';
            
            // Show wallet details
            this.elements.walletDetails.classList.remove('hidden');
            this.elements.addressText.textContent = this.formatAddress(this.publicKey);
            
            // Update buttons
            this.elements.connectBtn.classList.add('hidden');
            this.elements.disconnectBtn.classList.remove('hidden');
            
            // Show payment card
            this.elements.paymentCard.classList.remove('hidden');
            
        } else {
            // Reset wallet card
            this.elements.walletCard.classList.remove('wallet-connected');
            this.elements.walletIcon.querySelector('.wallet-avatar').textContent = '🔒';
            this.elements.walletStatus.textContent = 'Wallet Not Connected';
            this.elements.walletSubtitle.textContent = 'Connect your Freighter wallet to start';
            
            // Hide wallet details
            this.elements.walletDetails.classList.add('hidden');
            this.elements.addressText.textContent = '';
            this.elements.balanceValue.textContent = '0.0000000';
            this.elements.balanceUsd.textContent = '≈ $0.00 USD';
            
            // Update buttons
            this.elements.connectBtn.classList.remove('hidden');
            this.elements.disconnectBtn.classList.add('hidden');
            
            // Hide payment card
            this.elements.paymentCard.classList.add('hidden');
        }
    }

    async fetchBalance() {
        try {
            if (!this.publicKey) return;

            this.elements.refreshBalance.style.animation = 'spin 1s linear';

            const response = await fetch(
                `https://horizon-testnet.stellar.org/accounts/${this.publicKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch balance from Stellar network');
            }

            const accountData = await response.json();
            
            const xlmBalance = accountData.balances.find(
                balance => balance.asset_type === 'native'
            );

            this.balance = xlmBalance ? parseFloat(xlmBalance.balance) : 0;
            
            this.elements.balanceValue.textContent = this.balance.toFixed(7);
            this.elements.balanceUsd.textContent = `≈ $${(this.balance * this.xlmPrice).toFixed(2)} USD`;
            
            this.updateMaxBalance();
            
        } catch (error) {
            console.error('Error fetching balance:', error);
            this.showToast('Failed to fetch balance', 'error');
        } finally {
            this.elements.refreshBalance.style.animation = '';
        }
    }

    updateMaxBalance() {
        const amount = parseFloat(this.elements.amount.value) || 0;
        const availableBalance = Math.max(0, this.balance - 0.00001); // Reserve for fees
        this.elements.maxBalance.textContent = `Max: ${availableBalance.toFixed(7)} XLM`;
        
        // Validate if amount exceeds balance
        if (amount > availableBalance) {
            this.elements.amount.setCustomValidity('Amount exceeds available balance');
        } else {
            this.elements.amount.setCustomValidity('');
        }
    }

    validateAddress() {
        const address = this.elements.recipient.value.trim();
        const isValid = /^G[A-Z0-9]{55}$/.test(address);
        
        if (address && !isValid) {
            this.elements.recipient.setCustomValidity('Invalid Stellar address format');
        } else {
            this.elements.recipient.setCustomValidity('');
        }
    }

    validateAmount() {
        const amount = parseFloat(this.elements.amount.value);
        const availableBalance = Math.max(0, this.balance - 0.00001);
        
        if (amount <= 0) {
            this.elements.amount.setCustomValidity('Amount must be greater than 0');
        } else if (amount > availableBalance) {
            this.elements.amount.setCustomValidity('Amount exceeds available balance');
        } else {
            this.elements.amount.setCustomValidity('');
        }
    }

    setQuickAmount(amount) {
        this.elements.amount.value = amount;
        this.validateAmount();
        this.updateMaxBalance();
        
        // Visual feedback
        this.elements.quickAmounts.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.amount === amount);
        });
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.elements.recipient.value = text.trim();
            this.validateAddress();
            this.showToast('Address pasted', 'info');
        } catch (error) {
            this.showToast('Failed to paste from clipboard', 'error');
        }
    }

    async handleTransaction(event) {
        event.preventDefault();
        
        try {
            const recipientAddress = this.elements.recipient.value.trim();
            const amount = parseFloat(this.elements.amount.value);
            const memo = this.elements.memo.value.trim();

            // Validate inputs
            this.validateAddress();
            this.validateAmount();
            
            if (!this.elements.paymentForm.checkValidity()) {
                this.elements.paymentForm.reportValidity();
                return;
            }

            this.showLoading('Creating transaction...');
            
            // Show pending status
            this.showTransactionStatus('pending', 'Processing Transaction', 'Your transaction is being processed...');
            
            // Create transaction
            const transaction = await this.createTransaction(recipientAddress, amount, memo);
            
            // Sign and submit transaction
            this.showLoading('Waiting for signature...');
            const signedTransaction = await window.freighter.signTransaction(transaction, this.network);
            
            this.showLoading('Submitting transaction...');
            const response = await fetch('https://horizon-testnet.stellar.org/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `tx=${encodeURIComponent(signedTransaction)}`
            });

            const result = await response.json();

            if (response.ok) {
                // Success
                this.showTransactionStatus('success', 'Transaction Successful!', `Successfully sent ${amount.toFixed(7)} XLM to ${this.formatAddress(recipientAddress)}`);
                this.showTransactionDetails(result.hash, recipientAddress, amount, memo);
                
                // Add to history
                this.addToHistory({
                    hash: result.hash,
                    recipient: recipientAddress,
                    amount: amount,
                    memo: memo,
                    timestamp: new Date().toISOString(),
                    status: 'success'
                });
                
                // Refresh balance
                await this.fetchBalance();
                
                // Show history button
                this.elements.viewHistory.classList.remove('hidden');
                
                this.showToast('Transaction completed successfully!', 'success');
                
            } else {
                throw new Error(result.extras?.result_codes?.transaction || 'Transaction failed');
            }

        } catch (error) {
            console.error('Transaction error:', error);
            this.showTransactionStatus('error', 'Transaction Failed', error.message);
            this.showToast(`Transaction failed: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async createTransaction(recipientAddress, amount, memo) {
        try {
            // Get account details
            const accountResponse = await fetch(
                `https://horizon-testnet.stellar.org/accounts/${this.publicKey}`
            );
            const account = await accountResponse.json();

            // Create transaction using Stellar SDK
            const stellarSdk = window.StellarSdk;
            
            let builder = new stellarSdk.TransactionBuilder(account, {
                fee: stellarSdk.BASE_FEE,
                networkPassphrase: stellarSdk.Networks.TESTNET
            })
            .addOperation(stellarSdk.Operation.payment({
                destination: recipientAddress,
                asset: stellarSdk.Asset.native(),
                amount: amount.toFixed(7)
            }))
            .setTimeout(30);

            // Add memo if provided
            if (memo) {
                builder = builder.addMemo(stellarSdk.Memo.text(memo));
            }

            const transaction = builder.build();

            return transaction.toXDR();

        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error('Failed to create transaction');
        }
    }

    showTransactionStatus(type, title, description) {
        this.elements.statusCard.classList.remove('hidden');
        this.elements.paymentCard.classList.add('hidden');
        
        // Update status icon
        this.elements.statusIcon.className = `status-icon ${type}`;
        this.elements.statusIcon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : '⏳';
        
        // Update status message
        this.elements.statusTitle.textContent = title;
        this.elements.statusDescription.textContent = description;
        
        // Hide transaction details for pending/error
        if (type !== 'success') {
            this.elements.transactionDetails.classList.add('hidden');
        }
    }

    showTransactionDetails(hash, recipient, amount, memo) {
        this.elements.transactionDetails.classList.remove('hidden');
        this.elements.txHash.textContent = hash;
        this.elements.explorerLink.href = `https://stellar.expert/explorer/testnet/tx/${hash}`;
    }

    resetToPayment() {
        this.elements.statusCard.classList.add('hidden');
        this.elements.paymentCard.classList.remove('hidden');
        this.elements.transactionDetails.classList.add('hidden');
        this.elements.paymentForm.reset();
        
        // Reset quick amount buttons
        this.elements.quickAmounts.forEach(btn => btn.classList.remove('active'));
    }

    showTransactionHistory() {
        this.elements.historyCard.classList.remove('hidden');
        this.renderTransactionHistory();
    }

    hideTransactionHistory() {
        this.elements.historyCard.classList.add('hidden');
    }

    renderTransactionHistory() {
        if (this.transactionHistory.length === 0) {
            this.elements.historyList.innerHTML = '<div class="history-empty">No transactions yet</div>';
            return;
        }

        this.elements.historyList.innerHTML = this.transactionHistory.map(tx => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-amount">-${tx.amount.toFixed(7)} XLM</span>
                    <span class="history-status ${tx.status}">${tx.status}</span>
                </div>
                <div class="history-details">
                    <div class="history-recipient">To: ${this.formatAddress(tx.recipient)}</div>
                    <div class="history-time">${this.formatTime(tx.timestamp)}</div>
                    ${tx.memo ? `<div class="history-memo">Memo: ${tx.memo}</div>` : ''}
                </div>
                <div class="history-actions">
                    <a href="https://stellar.expert/explorer/testnet/tx/${tx.hash}" target="_blank" class="history-link">View on Explorer</a>
                </div>
            </div>
        `).join('');
    }

    addToHistory(transaction) {
        this.transactionHistory.unshift(transaction);
        this.saveTransactionHistory();
    }

    saveTransactionHistory() {
        localStorage.setItem('stellar-pay-history', JSON.stringify(this.transactionHistory));
    }

    loadTransactionHistory() {
        try {
            const saved = localStorage.getItem('stellar-pay-history');
            if (saved) {
                this.transactionHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load transaction history:', error);
        }
    }

    hideAllCards() {
        this.elements.paymentCard.classList.add('hidden');
        this.elements.statusCard.classList.add('hidden');
        this.elements.historyCard.classList.add('hidden');
    }

    // Utility methods
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return date.toLocaleDateString();
    }

    async copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(message, 'success');
        } catch (error) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
    }

    showLoading(text = 'Loading...') {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showConfetti() {
        // Simple confetti effect
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                background: ${['#6B46C1', '#F59E0B', '#10B981', '#EF4444'][Math.floor(Math.random() * 4)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: confetti ${1 + Math.random()}s ease-out forwards;
                transform: translate(-50%, -50%);
            `;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }
        
        // Add confetti animation
        if (!document.querySelector('#confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confetti {
                    to {
                        transform: translate(
                            ${Math.random() * 400 - 200}px,
                            ${Math.random() * 400 - 200}px
                        ) rotate(${Math.random() * 720}deg);
                        opacity: 0;
                    }
                }
                @keyframes slideOut {
                    to {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load Stellar SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/stellar-sdk@latest/lib/stellar-sdk.min.js';
    script.onload = () => {
        new StellarNexusApp();
    };
    script.onerror = () => {
        console.error('Failed to load Stellar SDK');
        document.body.innerHTML = '<div style="text-align: center; padding: 2rem; color: #EF4444;">Failed to load Stellar SDK. Please refresh the page.</div>';
    };
    document.head.appendChild(script);
});
