// File: 04-core-code/main.js

import { AppContext } from './app-context.js';
import { MigrationService } from './services/migration-service.js';
import { UIManager } from './ui/ui-manager.js';
import { InputHandler } from './ui/input-handler.js';
import { paths } from './config/paths.js';
import { EVENTS, DOM_IDS } from './config/constants.js';
// [REMOVED]

class App {
    constructor() {

        this.appContext = new AppContext();
        const migrationService = new MigrationService();

        const restoredData = migrationService.loadAndMigrateData();

        // [MODIFIED] Initialize only non-UI services first.
        this.appContext.initialize(restoredData);
    }

    async _loadPartials() {
        const eventAggregator = this.appContext.get('eventAggregator');
        const loadPartial = async (url, targetElement, injectionMethod = 'append') => {
            try {
                const
                    response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${url}`);
                }
                const html = await response.text();
                if (injectionMethod === 'innerHTML') {
                    targetElement.innerHTML = html;
                } else {

                    targetElement.insertAdjacentHTML('beforeend', html);
                }
            } catch (error) {
                console.error(`Failed to load HTML partial from ${url}:`, error);
                eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message: `Error: Could not load UI component from ${url}!`, type: 'error' });
            }
        };

        // [NEW] Helper function to load CSS files dynamically
        const loadCss = (url) => {
            try {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = url;
                document.head.appendChild(link);
            } catch (error) {
                console.error(`Failed to load CSS 
from ${url}:`, error);
            }
        };

        // --- Load Main Panel Skeletons ---
        await loadPartial(paths.partials.leftPanel, document.body);

        const functionPanel = document.getElementById(DOM_IDS.FUNCTION_PANEL);
        if (functionPanel) {
            await loadPartial(paths.partials.rightPanel, functionPanel, 'innerHTML');
        }

        // --- [NEW] Load K1 Tab Bundle ---
        const k1ContentContainer =
            document.getElementById('k1-content');
        if (k1ContentContainer) {
            await loadPartial(paths.tabs.k1.html, k1ContentContainer, 'innerHTML');
            loadCss(paths.tabs.k1.css);
        }

        // --- [NEW] Load K2 Tab Bundle ---
        const k2ContentContainer = document.getElementById('k2-content');
        if (k2ContentContainer) {
            await loadPartial(paths.tabs.k2.html, k2ContentContainer, 'innerHTML');
            loadCss(paths.tabs.k2.css);
        }

        // --- [NEW] Load K3 Tab Bundle ---
        const k3ContentContainer = document.getElementById('k3-content');
        if (k3ContentContainer) {
            await loadPartial(paths.tabs.k3.html, k3ContentContainer, 'innerHTML');
            loadCss(paths.tabs.k3.css);
        }

        // --- [NEW] Load K4 Tab Bundle ---

        const k4ContentContainer = document.getElementById('k4-content');
        if (k4ContentContainer) {
            await loadPartial(paths.tabs.k4.html, k4ContentContainer, 'innerHTML');
            loadCss(paths.tabs.k4.css);
        }

        // --- [NEW] Load K5 Tab Bundle ---
        const k5ContentContainer = document.getElementById('k5-content');
        if (k5ContentContainer) {
            await loadPartial(paths.tabs.k5.html, k5ContentContainer, 'innerHTML');
            loadCss(paths.tabs.k5.css);
        }
    }

    async run() {

        console.log("Application starting...");

        // Step 1: Load all HTML templates into the DOM.
        await this._loadPartials();

        // Step 2: [NEW] Initialize all UI components now that their DOM elements exist.
        this.appContext.initializeUIComponents();

        // Step 3: Get all fully initialized instances from the context.
        const eventAggregator = this.appContext.get('eventAggregator');
        const calculationService = this.appContext.get('calculationService');
        const configManager = this.appContext.get('configManager');
        const appController = this.appContext.get('appController');
        const rightPanelComponent = this.appContext.get('rightPanelComponent');
        const leftPanelTabManager = this.appContext.get('leftPanelTabManager'); // [NEW] Get LeftPanelTabManager
        const k1TabComponent = this.appContext.get('k1TabComponent'); // [NEW] Get K1 component
        const k3TabComponent =
            this.appContext.get('k3TabComponent'); // [NEW] Get K3 component
        const k4TabComponent = this.appContext.get('k4TabComponent'); // [NEW] Get K4 component
        const k5TabComponent = this.appContext.get('k5TabComponent'); // [NEW] Get K5 component

        // [REMOVED]

        // Step 4: Initialize the main UI manager.
        this.uiManager = new UIManager({
            appElement: document.getElementById(DOM_IDS.APP),

            eventAggregator,
            calculationService,
            rightPanelComponent,
            leftPanelTabManager, // [NEW] Inject LeftPanelTabManager
            k1TabComponent, // [NEW] Inject K1 component
            k3TabComponent, // [NEW] Inject K3 component
            k4TabComponent, // [NEW] Inject K4 component

            k5TabComponent, // [NEW] Inject K5 component
            // [REMOVED]
        });
        // Step 5: Continue with the rest of the application startup.
        await configManager.initialize();

        eventAggregator.subscribe(EVENTS.STATE_CHANGED, (state) => {
            this.uiManager.render(state);
        });

        appController.publishInitialState();

        this.inputHandler = new InputHandler(eventAggregator);
        this.inputHandler.initialize();

        eventAggregator.subscribe(EVENTS.APP_READY, () => {

            setTimeout(() => {
                eventAggregator.publish(EVENTS.FOCUS_CELL, { rowIndex: 0, column: 'width' });
            }, 100);
        });

        eventAggregator.publish(EVENTS.APP_READY);

        console.log("Application running and interactive.");

        document.body.classList.add('app-is-ready');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.run();
});