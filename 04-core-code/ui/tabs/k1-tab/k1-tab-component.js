// File: 04-core-code/ui/tabs/k1-tab/k1-tab-component.js

import { DOM_IDS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated component for managing and rendering the K1 (Location) tab UI.
 */
export class K1TabComponent {
    constructor() {
        // Cache all DOM elements for K1 in the constructor.
        this.locationButton = document.getElementById('btn-focus-location');
        this.locationInput = document.getElementById(DOM_IDS.LOCATION_INPUT_BOX);
        
        console.log("K1TabComponent Initialized.");
    }

    render(uiState) {
        const { activeEditMode, locationInputValue } = uiState;

        // --- K1 Location Input State ---
        if (this.locationInput) {
            const isLocationActive = activeEditMode === 'K1';
            this.locationInput.disabled = !isLocationActive;
            this.locationInput.classList.toggle('active', isLocationActive);
            if (this.locationInput.value !== locationInputValue) {
                this.locationInput.value = locationInputValue;
            }
        }
        
        if (this.locationButton) {
            this.locationButton.classList.toggle('active', activeEditMode === 'K1');
        }
    }
}