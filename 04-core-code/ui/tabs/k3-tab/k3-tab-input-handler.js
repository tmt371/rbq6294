// File: 04-core-code/ui/tabs/k3-tab/k3-tab-input-handler.js

import { EVENTS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K3 (Options) tab.
 */
export class K3TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K3TabInputHandler Initialized.");
    }

    initialize() {
        const editButton = document.getElementById('btn-k3-edit');
        if (editButton) {
            editButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_TOGGLED_K3_EDIT_MODE);
             });
        }

        const setupBatchCycleButton = (buttonId, column) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.eventAggregator.publish(EVENTS.USER_REQUESTED_BATCH_CYCLE, { column });
                });
            }
        };
        setupBatchCycleButton('btn-batch-cycle-over', 'over');
        setupBatchCycleButton('btn-batch-cycle-oi', 'oi');
        setupBatchCycleButton('btn-batch-cycle-lr', 'lr');
    }
}