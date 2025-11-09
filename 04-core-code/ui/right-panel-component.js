// File: 04-core-code/ui/right-panel-component.js

import { DOM_IDS } from '../config/constants.js';
import { paths } from '../config/paths.js'; // [NEW] Import paths for dynamic loading

/**
 * @fileoverview A container/manager component for the Right Panel.
 * Its sole responsibility is to manage the lifecycle of its sub-views (F1, F2, F3, F4)
 * and delegate rendering tasks to the currently active sub-view.
 * [MODIFIED] This component now dynamically loads (lazy loads) views on demand.
 */
export class RightPanelComponent {
    constructor({ panelElement, eventAggregator, stateService, calculationService }) { // [MODIFIED]
        if (!panelElement || !eventAggregator || !stateService || !calculationService) {
            throw new Error("Panel element, event aggregator, stateService, and calculationService are required for RightPanelComponent.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.stateService = stateService; // [NEW] Store injected service
        this.calculationService = calculationService; // [NEW] Store injected service
        this.state = null;

        // [MODIFIED] Views are no longer pre-injected. They will be loaded on demand.
        this.views = {};
        this.activeView = null; // Default active view

        this.tabContainer = this.panelElement.querySelector('.tab-container');
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        this.initialize();
        console.log("RightPanelComponent (Refactored as a Lazy-Loading Manager) Initialized.");
    }

    initialize() {
        if (this.tabContainer) {
            this.tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this.setActiveTab(target.id);
                }
            });
        }
    }

    render(state) {
        this.state = state; // Cache the latest state

        // Only render the currently active sub-view for performance.
        if (this.activeView && typeof this.activeView.render === 'function') {
            this.activeView.render(state);
        }
    }

    // [MODIFIED] Method is now async to support dynamic import()
    async setActiveTab(tabId) {
        const targetContentId = document.getElementById(tabId)?.dataset.tabTarget;
        if (!targetContentId) return;

        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.id === tabId);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', `#${content.id}` === targetContentId);
        });

        // --- [NEW] (Refactor - Lazy Load) ---
        // Check if the view for this tab has been loaded yet.
        if (!this.views[tabId]) {
            // If not, dynamically import and instantiate it.
            try {
                switch (tabId) {
                    case 'f1-tab': {
                        const { F1CostView } = await import('./views/f1-cost-view.js');
                        this.views[tabId] = new F1CostView({
                            panelElement: this.panelElement,
                            eventAggregator: this.eventAggregator,
                            calculationService: this.calculationService,
                            stateService: this.stateService
                        });
                        break;
                    }
                    case 'f2-tab': {
                        const { F2SummaryView } = await import('./views/f2-summary-view.js');
                        this.views[tabId] = new F2SummaryView({
                            panelElement: this.panelElement,
                            eventAggregator: this.eventAggregator,
                            stateService: this.stateService,
                            calculationService: this.calculationService
                        });
                        break;
                    }
                    case 'f3-tab': {
                        const { F3QuotePrepView } = await import('./views/f3-quote-prep-view.js');
                        this.views[tabId] = new F3QuotePrepView({
                            panelElement: this.panelElement,
                            eventAggregator: this.eventAggregator,
                            stateService: this.stateService
                        });
                        break;
                    }
                    case 'f4-tab': {
                        const { F4ActionsView } = await import('./views/f4-actions-view.js');
                        this.views[tabId] = new F4ActionsView({
                            panelElement: this.panelElement,
                            eventAggregator: this.eventAggregator
                        });
                        break;
                    }
                }
            } catch (err) {
                console.error(`Failed to lazy-load view for ${tabId}:`, err);
                return; // Stop execution if loading failed
            }
        }
        // --- End of Lazy Load Logic ---

        this.activeView = this.views[tabId];

        // Call the activate method on the new active view, if it exists.
        // This is useful for one-time actions when a tab is selected.
        if (this.activeView && typeof this.activeView.activate === 'function') {
            this.activeView.activate();
        }
    }
}