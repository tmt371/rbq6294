// File: 04-core-code/ui/tabs/k5-tab/k5-tab-input-handler.js

import { EVENTS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K5 (Dual/Chain & Summary) tab.
 */
export class K5TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K5TabInputHandler Initialized.");
    }

    initialize() {
        // This logic was moved from LeftPanelInputHandler's _setupK4Inputs
        // [MODIFIED] Renamed function from setupK4... to setupK5...
        const setupK5Button = (buttonId, mode) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.DUAL_CHAIN_MODE_CHANGED, { mode });
                });
            }
        };
        // [MODIFIED] Corrected IDs from 'btn-k4-' to 'btn-k5-'
        setupK5Button('btn-k5-dual', 'dual');
        setupK5Button('btn-k5-chain', 'chain');

        // [MODIFIED] Corrected ID from 'k4-input-display' to 'k5-input-display'
        const k5Input = document.getElementById('k5-input-display');
        if (k5Input) {
            k5Input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.eventAggregator.publish(EVENTS.CHAIN_ENTER_PRESSED, {
                        value: event.target.value
                    });
                }
            });
        }
    }
}