// File: 04-core-code/ui/views/f3-quote-prep-view.js

import { EVENTS, DOM_IDS } from '../../config/constants.js';
import * as quoteActions from '../../actions/quote-actions.js'; // [NEW] Import actions

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the F3 (Quote Prep) tab.
 */
export class F3QuotePrepView {
    constructor({ panelElement, eventAggregator, stateService }) { // [MODIFIED] Added stateService
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.stateService = stateService; // [NEW] Store stateService
        this.userOverrodeDueDate = false; // [NEW] Mechanism 3 flag

        this._cacheF3Elements();
        this._initializeF3Listeners();
        console.log("F3QuotePrepView Initialized.");
    }

    // [NEW] Robust helper to format a Date object to "YYYY-MM-DD" in LOCAL time.
    _formatDateToYMD(date) {
        if (!date) return '';
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    }

    // [NEW] Robust helper to parse a "YYYY-MM-DD" string into a Date object at local noon.
    // This avoids all timezone-related "day-before" issues.
    _parseDateFromYMD(dateString) {
        if (!dateString) return null;
        try {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                // Create date at 12:00 (noon) local time to prevent TZ shifts from rolling it back.
                return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
            }
            return new Date(dateString); // Fallback
        } catch (e) {
            return null;
        }
    }

    _cacheF3Elements() {
        const query = (id) => this.panelElement.querySelector(id);
        this.f3 = {
            inputs: {
                quoteId: query('#f3-quote-id'), // [FIXED] Corrected selector from '##' to '#'
                issueDate: query('#f3-issue-date'),
                dueDate: query('#f3-due-date'),
                customerName: query('#f3-customer-name'),
                customerAddress: query('#f3-customer-address'),
                customerPhone: query('#f3-customer-phone'),
                customerEmail: query('#f3-customer-email'),
                // [REMOVED] finalOfferPrice: query('#f3-final-offer-price'),
                generalNotes: query('#f3-general-notes'),
                termsConditions: query('#f3-terms-conditions'),
            },
            buttons: {
                addQuote: query(`#${DOM_IDS.BTN_ADD_QUOTE}`),
                btnGth: query(`#${DOM_IDS.BTN_GTH}`), // [NEW]
            }
        };
    }

    _initializeF3Listeners() {
        if (!this.f3.inputs.issueDate) return;

        // [NEW] Helper to dispatch state updates on 'change' event
        const addStateUpdateListener = (inputElement, actionCreator) => {
            if (inputElement) {
                inputElement.addEventListener('change', (event) => {
                    this.stateService.dispatch(actionCreator(event.target.value));
                });
            }
        };

        // [NEW] Helper for customer properties
        const addCustomerUpdateListener = (inputElement, key) => {
            if (inputElement) {
                inputElement.addEventListener('change', (event) => {
                    this.stateService.dispatch(quoteActions.updateCustomerProperty(key, event.target.value));
                });
            }
        };

        // [NEW] Bind all F3 inputs to update state.
        addStateUpdateListener(this.f3.inputs.quoteId, (value) => quoteActions.updateQuoteProperty('quoteId', value));
        addStateUpdateListener(this.f3.inputs.generalNotes, (value) => quoteActions.updateQuoteProperty('generalNotes', value));
        addStateUpdateListener(this.f3.inputs.termsConditions, (value) => quoteActions.updateQuoteProperty('termsConditions', value));

        addCustomerUpdateListener(this.f3.inputs.customerName, 'name');
        addCustomerUpdateListener(this.f3.inputs.customerAddress, 'address');
        addCustomerUpdateListener(this.f3.inputs.customerPhone, 'phone');
        addCustomerUpdateListener(this.f3.inputs.customerEmail, 'email');


        // --- [NEW] Mechanism 3: Listen for manual override on Due Date ---
        if (this.f3.inputs.dueDate) {
            this.f3.inputs.dueDate.addEventListener('input', () => {
                this.userOverrodeDueDate = true;
            });
            // Also dispatch its value change to state
            addStateUpdateListener(this.f3.inputs.dueDate, (value) => quoteActions.updateQuoteProperty('dueDate', value));
        }

        // --- Date Chaining Logic (MODIFIED for Mechanism 3 & Timezone Fix) ---
        this.f3.inputs.issueDate.addEventListener('input', (event) => {
            const issueDateValue = event.target.value;
            // [NEW] Dispatch issueDate change to state
            this.stateService.dispatch(quoteActions.updateQuoteProperty('issueDate', issueDateValue));

            // [MODIFIED] If user manually changed due date, stop live-updating.
            if (this.userOverrodeDueDate) return;

            // [MODIFIED] Only proceed if we have a valid issue date.
            if (issueDateValue) {
                // [FIX] Use new robust parser
                const issueDate = this._parseDateFromYMD(issueDateValue);
                if (!issueDate) return; // Invalid date input

                const dueDate = new Date(issueDate);
                dueDate.setDate(dueDate.getDate() + 14);

                // [NEW] Mechanism 3: Skip weekends
                const dayOfWeek = dueDate.getDay(); // 0 = Sun, 6 = Sat
                if (dayOfWeek === 6) { // Saturday
                    dueDate.setDate(dueDate.getDate() + 2);
                } else if (dayOfWeek === 0) { // Sunday
                    dueDate.setDate(dueDate.getDate() + 1);
                }
                // [END NEW]

                // [FIX] Use new robust formatter
                const dueDateString = this._formatDateToYMD(dueDate);
                this.f3.inputs.dueDate.value = dueDateString;
                // [NEW] Also dispatch the auto-calculated due date to state
                this.stateService.dispatch(quoteActions.updateQuoteProperty('dueDate', dueDateString));
            }
        });

        // --- Add Quote Button Listener ---
        if (this.f3.buttons.addQuote) {
            this.f3.buttons.addQuote.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_PRINTABLE_QUOTE);
            });
        }

        // --- [NEW] GTH Button Listener ---
        if (this.f3.buttons.btnGth) {
            this.f3.buttons.btnGth.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_REQUESTED_GMAIL_QUOTE);
            });
        }

        // --- Focus Jumping Logic ---
        const focusOrder = [
            'quoteId', 'issueDate', 'dueDate', 'customerName', 'customerAddress',
            'customerPhone', 'customerEmail', /* [REMOVED] 'finalOfferPrice', */ 'generalNotes', 'termsConditions'
        ];

        focusOrder.forEach((key, index) => {
            const currentElement = this.f3.inputs[key];
            if (currentElement) {
                currentElement.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey)) {
                        // Allow default Tab behavior in textareas
                        if (event.key === 'Tab' && currentElement.tagName === 'TEXTAREA') {
                            return;
                        }

                        event.preventDefault();
                        event.stopPropagation(); // Stop the event from bubbling up
                        const nextIndex = index + 1;
                        if (nextIndex < focusOrder.length) {
                            const nextKey = focusOrder[nextIndex];
                            this.f3.inputs[nextKey]?.focus();
                        } else {
                            this.f3.buttons.addQuote?.focus();
                        }
                    }
                });
            }
        });
    }

    // [MODIFIED v6285 Phase 5] Render now fully syncs from state.
    // [MODIFIED v6292] Complete rewrite to fix all timezone bugs.
    render(state) {
        if (!this.f3.inputs.quoteId || !state) return;

        const { quoteData } = state;
        const { customer } = quoteData;

        // [REMOVED] Old buggy formatDate helper is gone.

        // Helper to update value only if it differs AND element is not focused
        const updateInput = (input, newValue) => {
            const value = newValue || '';
            if (input && input.value !== value && document.activeElement !== input) {
                input.value = value;
            }
        };

        // --- 1. Populate Defaults (if state is empty) ---
        let quoteId = quoteData.quoteId;
        let issueDateStr = quoteData.issueDate;
        let dueDateStr = quoteData.dueDate;
        let issueDateObj; // To store the date object for due date calculation

        let needsStateUpdate = false; // Flag to see if we generated new data

        // [MODIFIED] Mechanism 1: Restore Quote ID generation
        if (!quoteId) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            quoteId = `RB${year}${month}${day}${hours}`;
            // [NEW] Dispatch this new value back to state
            this.stateService.dispatch(quoteActions.updateQuoteProperty('quoteId', quoteId));
            needsStateUpdate = true;
        }

        // [MODIFIED] Mechanism 2: Restore Issue Date generation (TIMEZONE-SAFE)
        if (!issueDateStr) {
            issueDateObj = new Date(); // Local "today"
            issueDateStr = this._formatDateToYMD(issueDateObj);
            // [NEW] Dispatch this new value back to state
            this.stateService.dispatch(quoteActions.updateQuoteProperty('issueDate', issueDateStr));
            needsStateUpdate = true;
        } else {
            // It's a string, format it just in case, then parse it for logic
            issueDateStr = this._formatDateToYMD(this._parseDateFromYMD(issueDateStr));
            issueDateObj = this._parseDateFromYMD(issueDateStr);
        }

        // [MODIFIED] Mechanism 3: Restore Due Date generation (TIMEZONE-SAFE)
        if (!dueDateStr) {
            // Use the (potentially new) issueDate object
            // [FIX] Remove timezone offset bug
            const dueDateObj = new Date(issueDateObj); // Start from the clean issueDate
            dueDateObj.setDate(dueDateObj.getDate() + 14);

            // [NEW] Mechanism 3: Skip weekends
            const dayOfWeek = dueDateObj.getDay(); // 0 = Sun, 6 = Sat
            if (dayOfWeek === 6) { // Saturday
                dueDateObj.setDate(dueDateObj.getDate() + 2);
            } else if (dayOfWeek === 0) { // Sunday
                dueDateObj.setDate(dueDateObj.getDate() + 1);
            }

            dueDateStr = this._formatDateToYMD(dueDateObj);
            this.userOverrodeDueDate = false; // We just auto-generated it
            // [NEW] Dispatch this new value back to state
            this.stateService.dispatch(quoteActions.updateQuoteProperty('dueDate', dueDateStr));
            needsStateUpdate = true;
        } else {
            // A due date was loaded from the state, format it and assume it was an override
            dueDateStr = this._formatDateToYMD(this._parseDateFromYMD(dueDateStr));
            this.userOverrodeDueDate = true;
        }

        // --- 2. Sync all inputs with state (NO MORE DOUBLE FORMATTING) ---
        updateInput(this.f3.inputs.quoteId, quoteId);
        updateInput(this.f3.inputs.issueDate, issueDateStr);
        updateInput(this.f3.inputs.dueDate, dueDateStr);

        updateInput(this.f3.inputs.customerName, customer.name);
        updateInput(this.f3.inputs.customerAddress, customer.address);
        updateInput(this.f3.inputs.customerPhone, customer.phone);
        updateInput(this.f3.inputs.customerEmail, customer.email);

        // [NEW] Sync textareas from state
        updateInput(this.f3.inputs.generalNotes, quoteData.generalNotes);
        updateInput(this.f3.inputs.termsConditions, quoteData.termsConditions);
    }

    activate() {
        // [MODIFIED v6285 Phase 5]
        // This method is called when the tab becomes active.
        // We now fetch the latest state and call render to populate/restore data.
        const state = this.stateService.getState();
        this.render(state);
    }
}