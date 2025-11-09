// File: 04-core-code/ui/views/k2-fabric-view.js

import { EVENTS, DOM_IDS } from '../../config/constants.js';
import * as uiActions from '../../actions/ui-actions.js';
import * as quoteActions from '../../actions/quote-actions.js';

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the K2 (Fabric) tab.
 */
export class
    K2FabricView {
    constructor({ stateService, eventAggregator }) { // [MODIFIED] (Phase 3 Cleanup) fabricBatchTable removed
        this.stateService = stateService;
        this.eventAggregator = eventAggregator;
        // [REMOVED] (Phase 3 Cleanup)
        // this.fabricBatchTable = fabricBatchTable; 

        this.indexesToExcludeFromBatchUpdate = new Set();
        // [REMOVED] (Phase 3)
        // this.lastSSetInput = null;

        // [NEW] Listen for the new N&C dialog event
        this.eventAggregator.subscribe(EVENTS.USER_REQUESTED_NC_DIALOG, () => this.handleNCDialogRequest());
        // [NEW] (Phase 2) Listen for the new LF dialog event
        this.eventAggregator.subscribe(EVENTS.USER_REQUESTED_LF_DIALOG, () => this.handleLFDialogRequest());
        // [NEW] (Phase 3) Listen for the new SSet dialog event
        this.eventAggregator.subscribe(EVENTS.USER_REQUESTED_SSET_DIALOG, () => this.handleSSetDialogRequest());

        console.log("K2FabricView Initialized.");
    }

    _getState() {
        return this.stateService.getState();
    }

    _getItems() {
        const
            { quoteData } = this._getState();
        return quoteData.products[quoteData.currentProduct].items;
    }

    handleFocusModeRequest() {
        const { ui } = this._getState();
        const currentMode = ui.activeEditMode;
        // [REMOVED] 'K2' mode is no longer handled here.
        const newMode = null; // K2 mode is now dialog-based

        if (newMode) {
            // ... (This block is now unreachable for K2)
        } else {
            // [REMOVED] (Phase 3 Cleanup) No panel input to blur
            // if (/* currentMode === 'K2' && */ document.activeElement.matches('.panel-input')) {
            //     document.activeElement.blur();
            // }
            this._exitAllK2Modes();
        }
    }

    // [REMOVED] (Phase 3 Cleanup)
    // _enterFCMode(isOverwriting) { ... }
    // handlePanelInputBlur({ type, field, value }) { ... }
    // handlePanelInputEnter() { ... }

    handleSequenceCellClick({ rowIndex }) {
        const { activeEditMode } = this._getState().ui;
        const item = this._getItems()[rowIndex];
        if (!item || (item.width === null && item.height === null)) return; // Ignore empty rows

        // [MODIFIED] (Phase 3 Cleanup) Only LF_DELETE_SELECT logic remains
        if (activeEditMode === 'K2_LF_DELETE_SELECT') {

            const { lfModifiedRowIndexes } = this._getState().quoteData.uiMetadata;
            if (!lfModifiedRowIndexes.includes(rowIndex)) {
                this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'Only items with a Light-Filter setting (pink background) can be selected for deletion.', type: 'error' });
                return;
            }
            this.stateService.dispatch(uiActions.toggleLFSelection(rowIndex));

        }
        // [REMOVED] (Phase 3 Cleanup) K2_LF_SELECT logic removed
        // [REMOVED] (Phase 3 Cleanup) K2_SSET_SELECT logic removed
    }

    // [REMOVED] (Phase 3 Cleanup)
    // handleLFEditRequest() { ... }

    handleLFDeleteRequest() {
        const { activeEditMode } = this._getState().ui;

        if (activeEditMode === 'K2_LF_DELETE_SELECT') {
            const { lfSelectedRowIndexes } = this._getState().ui;
            if (lfSelectedRowIndexes.length > 0) {

                this.stateService.dispatch(quoteActions.removeLFProperties(lfSelectedRowIndexes));
                this.stateService.dispatch(quoteActions.removeLFModifiedRows(lfSelectedRowIndexes));
                this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'Light-Filter settings have been cleared.' });
            }
            this._exitAllK2Modes();
        } else {
            // Clear other K2 mode selections
            this.stateService.dispatch(uiActions.clearLFSelection());
            // [REMOVED] (Phase 3 Cleanup) this.stateService.dispatch(uiActions.clearSSetSelection());
            this.stateService.dispatch(uiActions.setActiveEditMode('K2_LF_DELETE_SELECT'));
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'Please select the roller blinds for which you want to cancel the Light-Filter fabric setting. After selection, click the LF-Del button again.' });
        }
    }

    // [REMOVED] (Phase 3 Cleanup) Old Handler for the SSet button
    // handleSSetRequest() { ... }

    // [MODIFIED] (Stage 2.B) Refactored to handle LF conflict
    handleNCDialogRequest() {
        // 1. Lock the UI
        this.stateService.dispatch(uiActions.setModalActive(true));

        // 2. Check for conflict
        const { lfModifiedRowIndexes } = this._getState().quoteData.uiMetadata;
        const lfItemsExist = lfModifiedRowIndexes.length > 0;

        if (!lfItemsExist) {
            // 3.A. No conflict, show N&C dialog immediately
            this._showNCDialog(false); // 'false' means do not overwrite LF
            return;
        }

        // 3.B. Conflict exists, show intermediate conflict dialog
        this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
            message: 'This quote contains Light-Filter (LF) items. How would you like to proceed?',
            closeOnOverlayClick: false,
            gridTemplateColumns: '1fr', // Single column for these buttons
            layout: [
                [
                    {
                        type: 'button',
                        text: 'Overwrite LF items (Update All)',
                        className: 'primary-confirm-button',
                        callback: () => {
                            // User chose to overwrite. Show N&C dialog targeting all items.
                            this._showNCDialog(true); // 'true' means overwrite LF
                            return false; // [FIX] Prevent this dialog from closing
                        }
                    }
                ],
                [
                    {
                        type: 'button',
                        text: 'Preserve LF items (Update Non-LF Only)',
                        callback: () => {
                            // User chose to preserve. Show N&C dialog targeting only non-LF items.
                            this._showNCDialog(false); // 'false' means do not overwrite LF
                            return false; // [FIX] Prevent this dialog from closing
                        }
                    }
                ],
                [
                    {
                        type: 'button',
                        text: 'Cancel',
                        className: 'secondary',
                        callback: () => {
                            // User cancelled. Just unlock the UI.
                            this.stateService.dispatch(uiActions.setModalActive(false));
                            return true; // Close this dialog
                        }
                    }
                ]
            ]
        });
    }

    // [NEW] (Stage 2.B) Private helper to show the actual N&C dialog
    _showNCDialog(overwriteLF = false) {
        // 1. Pre-processing: Find all unique types, respecting the overwriteLF flag
        const items = this._getItems();
        const { lfModifiedRowIndexes } = this._getState().quoteData.uiMetadata;
        const indexesToExclude = overwriteLF ? new Set() : new Set(lfModifiedRowIndexes);

        const eligibleTypes = new Set();
        const typeData = {};

        items.forEach((item, index) => {
            if (item.width && item.height && item.fabricType) {
                // Exclude rows based on the overwriteLF flag
                if (!indexesToExclude.has(index)) {
                    eligibleTypes.add(item.fabricType);
                    // Store the first found data for pre-filling
                    if (!typeData[item.fabricType]) {
                        typeData[item.fabricType] = {
                            fabric: item.fabric || '',
                            color: item.color || ''
                        };
                    }
                }
            }
        });

        const sortedTypes = Array.from(eligibleTypes).sort();
        if (sortedTypes.length === 0) {
            const message = overwriteLF
                ? 'No items to overwrite.'
                : 'No non-LF items available to edit.';
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: message });
            this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
            return;
        }

        // 2. Build the dialog layout
        const layout = [];
        const inputIds = []; // For Enter key navigation
        layout.push([
            { type: 'text', text: 'Type', className: 'font-bold text-right' },
            { type: 'text', text: 'F-Name', className: 'font-bold' },
            { type: 'text', text: 'F-Color', className: 'font-bold' },
        ]);

        sortedTypes.forEach(type => {
            const fNameId = `k2-dialog-fname-${type}`;
            const fColorId = `k2-dialog-fcolor-${type}`;
            layout.push([
                { type: 'text', text: type, className: 'text-right' },
                { type: 'input', id: fNameId, value: typeData[type].fabric, 'data-type': type, 'data-field': 'fabric', inputType: 'text', disableEnterConfirm: true },
                { type: 'input', id: fColorId, value: typeData[type].color, 'data-type': type, 'data-field': 'color', inputType: 'text', disableEnterConfirm: true },
            ]);
            inputIds.push(fNameId, fColorId);
        });

        // 3. Show the N&C dialog
        this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
            message: 'Batch Edit Fabric (N&C)',
            closeOnOverlayClick: false,
            gridTemplateColumns: '0.8fr 1.2fr 1.2fr',
            layout: [
                ...layout,
                [
                    {
                        type: 'button',
                        text: 'Confirm',
                        className: 'primary-confirm-button',
                        colspan: 2,
                        callback: () => {
                            // 4.A Post-processing (Confirm)
                            try {
                                // We must re-fetch the indexesToExclude set for the dispatches
                                const { lfModifiedRowIndexes } = this._getState().quoteData.uiMetadata;
                                const finalIndexesToExclude = overwriteLF ? new Set() : new Set(lfModifiedRowIndexes);

                                sortedTypes.forEach(type => {
                                    const fName = document.getElementById(`k2-dialog-fname-${type}`).value;
                                    const fColor = document.getElementById(`k2-dialog-fcolor-${type}`).value;
                                    if (fName || fColor) {
                                        this.stateService.dispatch(quoteActions.batchUpdatePropertyByType(type, 'fabric', fName, finalIndexesToExclude));
                                        this.stateService.dispatch(quoteActions.batchUpdatePropertyByType(type, 'color', fColor, finalIndexesToExclude));
                                    }
                                });

                                // If we overwrote LF items, we must clear their "LF modified" status
                                if (overwriteLF && lfModifiedRowIndexes.length > 0) {
                                    this.stateService.dispatch(quoteActions.removeLFModifiedRows(lfModifiedRowIndexes));
                                }

                            } catch (e) {
                                console.error('Error applying N&C batch update:', e);
                            } finally {
                                this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                            }
                            return true; // Close dialog
                        }
                    },
                    {
                        type: 'button', text: 'Cancel', className: 'secondary', colspan: 1,
                        callback: () => {
                            // 4.B Post-processing (Cancel)
                            this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                            return true; // Close dialog
                        }
                    }
                ]
            ],
            onOpen: () => {
                // 5. Setup Enter key navigation
                inputIds.forEach((id, index) => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextId = inputIds[index + 1];
                                if (nextId) {
                                    document.getElementById(nextId)?.focus();
                                } else {
                                    const confirmButton = document.querySelector('.dialog-overlay .primary-confirm-button');
                                    confirmButton?.focus();
                                }
                            }
                        });
                    }
                });
                if (inputIds.length > 0) {
                    setTimeout(() => {
                        const firstInput = document.getElementById(inputIds[0]);
                        firstInput?.focus();
                        firstInput?.select();
                    }, 50);
                }
            }
        });
    }

    // [MODIFIED] (Stage 2.A) Handler for the LF Dialog request
    handleLFDialogRequest() {
        // 1. Lock the UI
        this.stateService.dispatch(uiActions.setModalActive(true));

        // 2. Pre-processing: Check for eligible types IN THE SELECTION
        const { ui, quoteData } = this._getState();
        const { multiSelectSelectedIndexes } = ui;
        const { lfModifiedRowIndexes } = quoteData.uiMetadata;
        const items = this._getItems();

        // 2A. Check if anything is selected
        if (multiSelectSelectedIndexes.length === 0) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'Please select items from the main table first.' });
            this.stateService.dispatch(uiActions.setModalActive(false));
            return;
        }

        const eligibleTypes = ['B2', 'B3', 'B4'];

        // 2B. Filter the selection for eligible items
        const eligibleIndexes = multiSelectSelectedIndexes.filter(index => {
            const item = items[index];
            return item && item.width && item.height &&
                eligibleTypes.includes(item.fabricType) &&
                !lfModifiedRowIndexes.includes(index); // Exclude items already LF
        });

        if (eligibleIndexes.length === 0) {
            const msg = multiSelectSelectedIndexes.length > 0
                ? 'The selection contains no eligible B2, B3, or B4 items, or they are already set as LF.'
                : 'No non-LF items available to edit.';
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: msg });
            this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
            return;
        }

        // 3. Build the dialog layout
        const fNameId = 'k2-dialog-fname-lf';
        const fColorId = 'k2-dialog-fcolor-lf';
        const layout = [
            [
                { type: 'text', text: 'Type', className: 'font-bold text-right' },
                { type: 'text', text: 'F-Name', className: 'font-bold' },
                { type: 'text', text: 'F-Color', className: 'font-bold' },
            ],
            [
                { type: 'text', text: 'LF', className: 'text-right' },
                { type: 'input', id: fNameId, value: '', 'data-type': 'LF', 'data-field': 'fabric', inputType: 'text', disableEnterConfirm: true },
                { type: 'input', id: fColorId, value: '', 'data-type': 'LF', 'data-field': 'color', inputType: 'text', disableEnterConfirm: true },
            ]
        ];
        const inputIds = [fNameId, fColorId];

        // 4. Show the dialog
        this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
            message: `Batch Edit Light-Filter (${eligibleIndexes.length} selected items)`,
            closeOnOverlayClick: false,
            gridTemplateColumns: '0.8fr 1.2fr 1.2fr',
            layout: [
                ...layout,
                [
                    {
                        type: 'button',
                        text: 'Confirm',
                        className: 'primary-confirm-button',
                        colspan: 2,
                        callback: () => {
                            // 5.A Post-processing (Confirm)
                            try {
                                const fName = document.getElementById(fNameId).value;
                                const fColor = document.getElementById(fColorId).value;

                                if (fName && fColor) {
                                    const fabricNameWithPrefix = `Light-filter ${fName}`;
                                    // Apply ONLY to eligible selected indexes
                                    this.stateService.dispatch(quoteActions.batchUpdateLFProperties(eligibleIndexes, fabricNameWithPrefix, fColor));
                                    this.stateService.dispatch(quoteActions.addLFModifiedRows(eligibleIndexes));
                                    this.stateService.dispatch(uiActions.clearMultiSelectSelection()); // Clear selection
                                    this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: `Light-Filter applied to ${eligibleIndexes.length} items.` });
                                } else {
                                    this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'No changes applied. Both F-Name and F-Color are required.', type: 'error' });
                                    return false; // Keep dialog open
                                }
                            } catch (e) {
                                console.error('Error applying LF batch update:', e);
                            } finally {
                                // Only unlock if successful
                                if (document.getElementById(fNameId).value && document.getElementById(fColorId).value) {
                                    this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                                }
                            }
                            // Close dialog only if successful
                            return (document.getElementById(fNameId).value && document.getElementById(fColorId).value);
                        }
                    },
                    {
                        type: 'button', text: 'Cancel', className: 'secondary', colspan: 1,
                        callback: () => {
                            // 5.B Post-processing (Cancel)
                            this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                            return true; // Close dialog
                        }
                    }
                ]
            ],
            onOpen: () => {
                // 6. Setup Enter key navigation
                inputIds.forEach((id, index) => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextId = inputIds[index + 1];
                                if (nextId) {
                                    document.getElementById(nextId)?.focus();
                                } else {
                                    const confirmButton = document.querySelector('.dialog-overlay .primary-confirm-button');
                                    confirmButton?.focus();
                                }
                            }
                        });
                    }
                });
                if (inputIds.length > 0) {
                    setTimeout(() => {
                        const firstInput = document.getElementById(inputIds[0]);
                        firstInput?.focus();
                        firstInput?.select();
                    }, 50);
                }
            }
        });
    }

    // [NEW] (Phase 3) Handler for the SSet Dialog request
    handleSSetDialogRequest() {
        // 1. Lock the UI
        this.stateService.dispatch(uiActions.setModalActive(true));

        // 2. Pre-processing: Check for eligible types IN THE SELECTION
        const { ui, quoteData } = this._getState();
        const { multiSelectSelectedIndexes } = ui;
        const { lfModifiedRowIndexes } = quoteData.uiMetadata;
        const items = this._getItems();

        // 2A. Check if anything is selected
        if (multiSelectSelectedIndexes.length === 0) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'Please select items from the main table first.' });
            this.stateService.dispatch(uiActions.setModalActive(false));
            return;
        }

        // 2B. Find all unique, non-LF types present in the selection
        const eligibleTypes = new Set();
        const typeData = {}; // Store first-found data for pre-filling

        multiSelectSelectedIndexes.forEach(index => {
            const item = items[index];
            if (item && item.width && item.height && item.fabricType) {
                // Exclude rows that are marked as LF-modified
                if (!lfModifiedRowIndexes.includes(index)) {
                    eligibleTypes.add(item.fabricType);
                    // Store the first found data for pre-filling
                    if (!typeData[item.fabricType]) {
                        typeData[item.fabricType] = {
                            fabric: item.fabric || '',
                            color: item.color || ''
                        };
                    }
                }
            }
        });

        const sortedTypes = Array.from(eligibleTypes).sort();

        if (sortedTypes.length === 0) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'All selected items are LF items. SSet cannot be used. Please use N&C (Overwrite) or LF-Del instead.' });
            this.stateService.dispatch(uiActions.setModalActive(false));
            return;
        }

        // 3. Build the dialog layout (Dynamic layout like N&C)
        const layout = [];
        const inputIds = []; // For Enter key navigation
        layout.push([
            { type: 'text', text: 'Type', className: 'font-bold text-right' },
            { type: 'text', text: 'F-Name', className: 'font-bold' },
            { type: 'text', text: 'F-Color', className: 'font-bold' },
        ]);

        sortedTypes.forEach(type => {
            const fNameId = `k2-dialog-fname-sset-${type}`;
            const fColorId = `k2-dialog-fcolor-sset-${type}`;
            layout.push([
                { type: 'text', text: type, className: 'text-right' },
                { type: 'input', id: fNameId, value: typeData[type].fabric, 'data-type': type, 'data-field': 'fabric', inputType: 'text', disableEnterConfirm: true },
                { type: 'input', id: fColorId, value: typeData[type].color, 'data-type': type, 'data-field': 'color', inputType: 'text', disableEnterConfirm: true },
            ]);
            inputIds.push(fNameId, fColorId);
        });

        // 4. Show the SSet dialog
        this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
            message: `Selective Set (${multiSelectSelectedIndexes.length} selected items)`,
            closeOnOverlayClick: false,
            gridTemplateColumns: '0.8fr 1.2fr 1.2fr',
            layout: [
                ...layout,
                [
                    {
                        type: 'button',
                        text: 'Confirm',
                        className: 'primary-confirm-button',
                        colspan: 2,
                        callback: () => {
                            // 5.A Post-processing (Confirm)
                            try {
                                const typeMap = {};
                                let typesApplied = 0;

                                sortedTypes.forEach(type => {
                                    const fName = document.getElementById(`k2-dialog-fname-sset-${type}`).value;
                                    const fColor = document.getElementById(`k2-dialog-fcolor-sset-${type}`).value;
                                    if (fName && fColor) {
                                        if (!typeMap[type]) typeMap[type] = {};
                                        typeMap[type]['fabric'] = fName;
                                        typeMap[type]['color'] = fColor;
                                        typesApplied++;
                                    }
                                });

                                if (typesApplied === 0) {
                                    this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: 'No changes applied. Please fill in both F-Name and F-Color for a type.', type: 'error' });
                                    return false; // Keep dialog open
                                }

                                // Apply updates only to the selected items
                                this.stateService.dispatch(quoteActions.batchUpdatePropertiesForIndexes(multiSelectSelectedIndexes, typeMap));
                                this.stateService.dispatch(uiActions.clearMultiSelectSelection()); // Clear selection
                                this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: `SSet applied to items.` });

                            } catch (e) {
                                console.error('Error applying SSet batch update:', e);
                            } finally {
                                this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                            }
                            return true; // Close dialog
                        }
                    },
                    {
                        type: 'button', text: 'Cancel', className: 'secondary', colspan: 1,
                        callback: () => {
                            // 5.B Post-processing (Cancel)
                            this.stateService.dispatch(uiActions.setModalActive(false)); // Unlock UI
                            return true; // Close dialog
                        }
                    }
                ]
            ],
            onOpen: () => {
                // 6. Setup Enter key navigation
                inputIds.forEach((id, index) => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const nextId = inputIds[index + 1];
                                if (nextId) {
                                    document.getElementById(nextId)?.focus();
                                } else {
                                    const confirmButton = document.querySelector('.dialog-overlay .primary-confirm-button');
                                    confirmButton?.focus();
                                }
                            }
                        });
                    }
                });
                if (inputIds.length > 0) {
                    setTimeout(() => {
                        const firstInput = document.getElementById(inputIds[0]);
                        firstInput?.focus();
                        firstInput?.select();
                    }, 50);
                }
            }
        });
    }


    _exitAllK2Modes() {
        this.stateService.dispatch(uiActions.setActiveEditMode(null));
        this.stateService.dispatch(uiActions.clearMultiSelectSelection());
        this.stateService.dispatch(uiActions.clearLFSelection());
        // [REMOVED] (Phase 3 Cleanup) this.stateService.dispatch(uiActions.clearSSetSelection());

        this.indexesToExcludeFromBatchUpdate.clear();
        // [REMOVED] (Phase 3 Cleanup) this.lastSSetInput = null;

        this._updatePanelInputsState();
    }

    // [REMOVED] (Phase 3 Cleanup)
    // _applyLFChanges() { ... }

    // [REMOVED] (Phase 3 Cleanup)
    // _applySSetChanges() { ... }


    _updatePanelInputsState() {
        if (!this.fabricBatchTable) return; // Guard clause

        const { ui, quoteData } = this._getState();
        // [MODIFIED] (Phase 3 Cleanup) Removed sSetSelectedRowIndexes
        const { activeEditMode, lfSelectedRowIndexes } = ui;
        const items = this._getItems();
        const { lfModifiedRowIndexes } = quoteData.uiMetadata;
        const presentTypes = new Set(items.map(item => item.fabricType).filter(Boolean));

        // [REFACTORED] Use injected this.fabricBatchTable
        const allPanelInputs = this.fabricBatchTable.querySelectorAll('.panel-input');
        let firstEnabledInput = null;
        // [REMOVED] (Phase 3 Cleanup) this.lastSSetInput = null;

        if (activeEditMode === 'K2_LF_SELECT') {
            allPanelInputs.forEach(input => {
                const isLFRow = input.dataset.type === 'LF';
                const hasSelection = lfSelectedRowIndexes.length > 0;
                input.disabled
                    = !(isLFRow && hasSelection);

                // [FIX] Auto-fill LF inputs from first selected item
                if (isLFRow && hasSelection) {
                    const firstItem
                        = items[lfSelectedRowIndexes[0]];
                    if (firstItem && lfModifiedRowIndexes.includes(lfSelectedRowIndexes[0])) {
                        // [FIX] Remove "Light-filter " prefix when populating input
                        input.value = (firstItem[input.dataset.field] ||
                            '').replace('Light-filter ', '');
                    }
                }
            });
        }
        // [REMOVED] (Phase 3 Cleanup) SSet input logic removed
        // else if (activeEditMode === 'K2_SSET_SELECT') { ... } 
        else {
            // [MODIFIED] This is now the default state (all inputs disabled)
            allPanelInputs.forEach(input => {
                input.disabled = true;
                input.value = '';
            });
        }
    }

    activate() {
        this.stateService.dispatch(uiActions.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'fabric', 'color']));
        // [MODIFIED] When tab activates, ensure all K2 modes are exited

        this._exitAllK2Modes();
    }
}