// File: 04-core-code/ui/tabs/k3-tab/k3-tab-component.js

/**
 * @fileoverview A dedicated component for managing and rendering the K3 (Options) tab UI.
 */
export class K3TabComponent {
    constructor() {
        // Cache all DOM elements for K3 in the constructor.
        this.k3EditButton = document.getElementById('btn-k3-edit');
        this.k3OverButton = document.getElementById('btn-batch-cycle-over');
        this.k3OiButton = document.getElementById('btn-batch-cycle-oi');
        this.k3LrButton = document.getElementById('btn-batch-cycle-lr');
        
        console.log("K3TabComponent Initialized.");
    }

    render(uiState) {
        const { activeEditMode } = uiState;

        // --- K3 Button Active/Disabled States ---
        const isK3EditMode = activeEditMode === 'K3';
        if (this.k3EditButton) {
            this.k3EditButton.classList.toggle('active', isK3EditMode);
            this.k3EditButton.disabled = activeEditMode !== null && !isK3EditMode;
        }
        
        const k3SubButtonsDisabled = !isK3EditMode;
        if (this.k3OverButton) this.k3OverButton.disabled = k3SubButtonsDisabled;
        if (this.k3OiButton) this.k3OiButton.disabled = k3SubButtonsDisabled;
        if (this.k3LrButton) this.k3LrButton.disabled = k3SubButtonsDisabled;
    }
}