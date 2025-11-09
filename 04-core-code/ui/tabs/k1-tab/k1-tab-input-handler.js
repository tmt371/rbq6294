// File: 04-core-code/ui/tabs/k1-tab/k1-tab-input-handler.js

import { EVENTS, DOM_IDS } from '../../../config/constants.js';

/**
 * @fileoverview A dedicated input handler for all user interactions
 * within the K1 (Location) tab.
 */
export class K1TabInputHandler {
    constructor({ eventAggregator }) {
        this.eventAggregator = eventAggregator;
        console.log("K1TabInputHandler Initialized.");
    }

    initialize() {
        const locationButton = document.getElementById('btn-focus-location');
        if (locationButton) {
             locationButton.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_FOCUS_MODE, { column: 'location' });
            });
        }

        const locationInput = document.getElementById(DOM_IDS.LOCATION_INPUT_BOX);
        if (locationInput) {
            locationInput.addEventListener('keydown', (event) => {
                 if (event.key === 'Enter') {
                    event.preventDefault();
                    this.eventAggregator.publish(EVENTS.LOCATION_INPUT_ENTER_PRESSED, {
                        value: event.target.value
                     });
                }
            });
        }
    }
}