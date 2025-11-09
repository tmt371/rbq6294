// File: 04-core-code/ui/tabs/k2-tab/k2-tab-input-handler.js

import { EVENTS, DOM_IDS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K2 (Fabric) tab.
 */
export class K2TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K2TabInputHandler Initialized.");
    }

    initialize() {
        // This logic was moved from LeftPanelInputHandler's _setupK2Inputs
        const fabricButton = document.getElementById('btn-focus-fabric');
        if (fabricButton) {
            // [MODIFIED] Changed event to trigger new dialog flow
            fabricButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_NC_DIALOG);
            });
        }
        const lfButton = document.getElementById('btn-light-filter');
        if (lfButton) {
            lfButton.addEventListener('click', () => {
                // [MODIFIED] (Phase 2) Changed event to trigger new dialog flow
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_LF_DIALOG);
            });
        }
        const lfDelButton = document.getElementById('btn-lf-del');
        if (lfDelButton) {
            lfDelButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_LF_DELETE_MODE);
            });
        }

        // [MODIFIED] (Phase 3) Add listener for SSet button
        const sSetButton = document.getElementById('btn-k2-sset');
        if (sSetButton) {
            sSetButton.addEventListener('click', () => {
                // [MODIFIED] Changed event to trigger new dialog flow
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_SSET_DIALOG);
            });
        }

        // [REMOVED] (Phase 3 Cleanup) Obsolete listeners for the deleted table
        // const batchTable = document.getElementById(DOM_IDS.FABRIC_BATCH_TABLE);
        // if (batchTable) {
        //     batchTable.addEventListener('keydown', (event) => { ... });
        //     batchTable.addEventListener('blur', (event) => { ... });
        // }
    }
}