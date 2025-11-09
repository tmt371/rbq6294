// File: 04-core-code/ui/tabs/k2-tab/k2-tab-component.js

/**
 * @fileoverview [NEW] A dedicated component for managing and rendering the K2 (Fabric) tab UI,
 * specifically the active/disabled states of its buttons.
 */
export class K2TabComponent {
    constructor() {
        // Cache all DOM elements for K2 in the constructor.
        this.ncButton = document.getElementById('btn-focus-fabric');
        this.lfButton = document.getElementById('btn-light-filter');
        this.lfdButton = document.getElementById('btn-lf-del');
        this.ssetButton = document.getElementById('btn-k2-sset');

        console.log("K2TabComponent Initialized.");
    }

    render(uiState) {
        if (!this.ncButton) return; // Guard clause if elements aren't ready

        const { activeEditMode } = uiState;

        // Define our specific K2 modes
        const isLFMode = activeEditMode === 'K2_LF_MODE';
        const isLFDMode = activeEditMode === 'K2_LF_DELETE_SELECT';
        const isSSetMode = activeEditMode === 'K2_SSET_MODE'; // [NEW] (v6294 SSet)

        // Is *any* K2 mode active?
        const isK2ModeActive = isLFMode || isLFDMode || isSSetMode; // [MODIFIED] (v6294 SSet)

        // Is *another* panel mode active (like K1, K3, K4, K5)?
        const isOtherPanelModeActive = activeEditMode !== null && !isK2ModeActive;

        // Handle LF Button (New Active State)
        this.lfButton.classList.toggle('active', isLFMode);
        this.lfButton.disabled = (isK2ModeActive && !isLFMode) || isOtherPanelModeActive;

        // Handle LFD Button (Existing Active State)
        this.lfdButton.classList.toggle('active', isLFDMode);
        this.lfdButton.disabled = (isK2ModeActive && !isLFDMode) || isOtherPanelModeActive;

        // Handle SSet Button (New Active State) [NEW] (v6294 SSet)
        this.ssetButton.classList.toggle('active', isSSetMode);
        this.ssetButton.disabled = (isK2ModeActive && !isSSetMode) || isOtherPanelModeActive;

        // Handle N&C Button (Disabled only)
        this.ncButton.disabled = isK2ModeActive || isOtherPanelModeActive;
    }
}