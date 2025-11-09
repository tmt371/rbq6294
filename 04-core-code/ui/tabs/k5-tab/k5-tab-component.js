// File: 04-core-code/ui/tabs/k5-tab/k5-tab-component.js

/**
 * @fileoverview A dedicated component for managing and rendering the K5 (Dual/Chain & Summary) tab UI.
 */
export class K5TabComponent {
    constructor() {
        // Cache all DOM elements for K5 in the constructor.
        // [MODIFIED] Corrected 'k4-' IDs to 'k5-'
        this.k5DualButton = document.getElementById('btn-k5-dual');
        this.k5ChainButton = document.getElementById('btn-k5-chain');
        this.k5InputDisplay = document.getElementById('k5-input-display');
        this.k5DualPriceValue = document.querySelector('#k5-dual-price-display .price-value');
        this.k5WinderSummaryDisplay = document.getElementById('k5-display-winder-summary');
        this.k5MotorSummaryDisplay = document.getElementById('k5-display-motor-summary');
        this.k5RemoteSummaryDisplay = document.getElementById('k5-display-remote-summary');
        this.k5ChargerSummaryDisplay = document.getElementById('k5-display-charger-summary');
        this.k5CordSummaryDisplay = document.getElementById('k5-display-cord-summary');
        this.k5AccessoriesTotalDisplay = document.getElementById('k5-display-accessories-total');

        console.log("K5TabComponent Initialized.");
    }

    render(uiState, quoteData) {
        const {
            dualChainMode, targetCell, dualChainInputValue,
            summaryWinderPrice, summaryMotorPrice,
            summaryRemotePrice, summaryChargerPrice, summaryCordPrice, summaryAccessoriesTotal
        } = uiState;

        const currentProductKey = quoteData.currentProduct;
        const productData = quoteData.products[currentProductKey];
        const accessoriesSummary = productData.summary.accessories || {};

        const formatPrice = (price) => (typeof price === 'number') ? `$${price.toFixed(0)}` : '';

        // --- K5 (Dual/Chain & Summary) States ---
        if (this.k5DualButton) {
            const isDisabled = dualChainMode !== null && dualChainMode !== 'dual';
            this.k5DualButton.classList.toggle('active', dualChainMode === 'dual');
            this.k5DualButton.disabled = isDisabled;
        }
        if (this.k5ChainButton) {
            const isDisabled = dualChainMode !== null && dualChainMode !== 'chain';
            this.k5ChainButton.classList.toggle('active', dualChainMode === 'chain');
            this.k5ChainButton.disabled = isDisabled;
        }

        if (this.k5InputDisplay) {
            const isChainInputActive = dualChainMode === 'chain' && targetCell && targetCell.column === 'chain';
            this.k5InputDisplay.disabled = !isChainInputActive;
            this.k5InputDisplay.classList.toggle('active', isChainInputActive);
            if (this.k5InputDisplay.value !== dualChainInputValue) this.k5InputDisplay.value = dualChainInputValue;
        }
        if (this.k5DualPriceValue) {
            const dualPrice = accessoriesSummary.dualCostSum;
            const newText = (typeof dualPrice === 'number') ? `$${dualPrice.toFixed(0)}` : '';
            if (this.k5DualPriceValue.textContent !== newText) this.k5DualPriceValue.textContent = newText;
        }
        if (this.k5WinderSummaryDisplay) this.k5WinderSummaryDisplay.value = formatPrice(summaryWinderPrice);
        if (this.k5MotorSummaryDisplay) this.k5MotorSummaryDisplay.value = formatPrice(summaryMotorPrice);
        if (this.k5RemoteSummaryDisplay) this.k5RemoteSummaryDisplay.value = formatPrice(summaryRemotePrice);
        if (this.k5ChargerSummaryDisplay) this.k5ChargerSummaryDisplay.value = formatPrice(summaryChargerPrice);
        if (this.k5CordSummaryDisplay) this.k5CordSummaryDisplay.value = formatPrice(summaryCordPrice);
        if (this.k5AccessoriesTotalDisplay) this.k5AccessoriesTotalDisplay.value = formatPrice(summaryAccessoriesTotal);
    }
}