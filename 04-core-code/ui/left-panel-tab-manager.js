// File: 04-core-code/ui/left-panel-tab-manager.js
// [NEW] This file combines the remaining logic from left-panel-component.js
// and left-panel-input-handler.js, using the correct kebab-case filename.

import { DOM_IDS, EVENTS } from '../config/constants.js';

/**
 * @fileoverview A dedicated component for managing the Left Panel's
 * tab switching (UI state) and navigation toggle (Input).
 */
export class LeftPanelTabManager {
    constructor(panelElement, eventAggregator) {
        if (!panelElement || !eventAggregator) {
            throw new Error("Panel element and event aggregator are required for LeftPanelTabManager.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.panelToggle = document.getElementById(DOM_IDS.LEFT_PANEL_TOGGLE);

        // Cache tab elements (from left-panel-component)
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        console.log("LeftPanelTabManager Initialized.");
    }

    /**
     * Initializes the input handlers for the panel.
     * (Logic from left-panel-input-handler.js)
     */
    initialize() {
        this._setupNavigationToggle();
        this._setupTabButtons();
    }

    /**
     * Sets up the listener for the main navigation toggle (handle).
     * (Logic from left-panel-input-handler.js)
     */
    _setupNavigationToggle() {
        const leftPanelToggle = document.getElementById(DOM_IDS.LEFT_PANEL_TOGGLE);
        if (leftPanelToggle) {
            leftPanelToggle.addEventListener('click', () => {
                this.eventAggregator.publish(EVENTS.USER_NAVIGATED_TO_DETAIL_VIEW);
            });
        }
    }

    /**
     * Sets up the listener for the tab buttons (K1-K5).
     * (Logic from left-panel-input-handler.js)
     */
    _setupTabButtons() {
        const tabContainer = document.querySelector('#left-panel .tab-container');
        if (tabContainer) {
            tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this.eventAggregator.publish(EVENTS.USER_SWITCHED_TAB, { tabId: target.id });
                }
            });
        }
    }

    /**
     * Renders the UI state of the tabs (e.g., active tab, background color).
     * (Logic from left-panel-component.js)
     */
    render(uiState) {
        // This component is now only responsible for the tab states.
        // The _updatePanelButtonStates method (which contained K2 logic)
        // has been intentionally removed.
        this._updateTabStates(uiState);
    }

    /**
     * Updates the active state of tabs and panel background color.
     * (Logic from left-panel-component.js)
     */
    _updateTabStates(uiState) {
        const { activeEditMode, activeTabId, dualChainMode, driveAccessoryMode } = uiState;
        const isInEditMode = activeEditMode !== null || dualChainMode !== null || driveAccessoryMode !== null;
        const activeTabButton = document.getElementById(activeTabId);
        const activeContentTarget = activeTabButton ? activeTabButton.dataset.tabTarget : null;

        this.tabButtons.forEach(button => {
            const isThisButtonActive = button.id === activeTabId;
            button.classList.toggle('active', isThisButtonActive);
            button.disabled = isInEditMode && !isThisButtonActive;
        });

        if (this.panelToggle) {
            this.panelToggle.style.pointerEvents = isInEditMode ? 'none' : 'auto';
            this.panelToggle.style.opacity = isInEditMode ? '0.5' : '1';
        }

        this.tabContents.forEach(content => {
            const isThisContentActive = activeContentTarget && `#${content.id}` === activeContentTarget;
            content.classList.toggle('active', isThisContentActive);
        });

        const panelBgColors = {
            'k1-tab': 'var(--k1-bg-color)',
            'k2-tab': 'var(--k2-bg-color)',
            'k3-tab': 'var(--k3-bg-color)',
            'k4-tab': 'var(--k4-bg-color)',
            'k5-tab': 'var(--k5-bg-color)',
        };
        this.panelElement.style.backgroundColor = panelBgColors[activeTabId] || 'var(--k1-bg-color)';
    }
}