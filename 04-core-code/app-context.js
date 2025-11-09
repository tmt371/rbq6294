// 04-core-code/app-context.js

/**
 * @description
 * AppContext 是此應用程式的「依賴注入容器」(DI Container)。
 * 它的職責是「建立」和「註冊」所有服務 (Services) 和 UI 元件 (Components)。
 * * 1. 建立 Services (例如 StateService, CalculationService)。
 * 2. 建立 UI Components (例如 QuickQuoteView, RightPanelComponent)。
 * 3. 將這些實例 (instances) 儲存在一個中央登錄檔 (this.instances) 中。
 * * 這種模式的好處 (依賴注入):
 * - 「解耦」: 元件不需要知道如何「建立」它們的依賴。
 * 例如，`AppController` 不需要 `new WorkflowService()`。它只需要從 AppContext「請求」一個 `workflowService` 實例。
 * - 「可測試性」: 在進行單元測試時，我們可以輕易地用「假的」(mock) 服務替換掉 AppContext 中的真實服務。
 * - 「集中管理」: 所有物件的建立邏輯都集中在此處，易於管理和維護。
 * * Example:
 * `main.js` (組裝廠) 會請求 AppContext 建立所有零件 (Services, Components)，
 * 然後將這些零件 (例如 `quickQuoteView`, `appController`) 交給 `UIManager` (總指揮) 進行組裝和渲染。
 * */
export class AppContext {
    constructor() {
        this.instances = {};
    }

    /**
     * 註冊一個實例到容器中。
     * @param {string} name - 實例的唯一名稱 (鍵)。
     * @param {object} instance - 要註冊的實例。
     */
    register(name, instance) {
        this.instances[name] =
            instance;
    }

    /**
     * 從容器中獲取一個實例。
     * @param {string} name - 要獲取的實例名稱。
     * @returns {object} - 註冊的實例。
     */
    get(name) {
        const instance = this.instances[name];
        if (!instance) {
            throw new Error(`Instance '${name}' not found.`);
        }
        return instance;
    }

    initialize(startingQuoteData = null) {

        // [MODIFIED] This method now only initializes non-UI services and controllers.
        const eventAggregator = new EventAggregator();
        this.register('eventAggregator', eventAggregator);

        const configManager = new ConfigManager(eventAggregator);
        this.register('configManager', configManager);

        const productFactory = new ProductFactory({ configManager });
        this.register('productFactory', productFactory);

        let initialStateWithData = JSON.parse(JSON.stringify(initialState));
        if (startingQuoteData) {
            initialStateWithData.quoteData = startingQuoteData;
        }

        const stateService = new StateService({

            initialState: initialStateWithData,

            eventAggregator,
            productFactory,
            configManager
        });
        this.register('stateService', stateService);

        const calculationService = new CalculationService({
            stateService,

            productFactory,
            configManager
        });
        this.register('calculationService',
            calculationService);

        const fileService = new FileService({ productFactory });
        this.register('fileService', fileService);

        const focusService = new FocusService({
            stateService
        });
        this.register('focusService', focusService);
    }

    initializeUIComponents() {
        // [NEW] This method initializes all UI-dependent components.
        // It must be called AFTER the HTML partials are loaded.
        const eventAggregator = this.get('eventAggregator');
        const calculationService = this.get('calculationService');
        const stateService = this.get('stateService');
        const configManager = this.get('configManager');
        const productFactory = this.get('productFactory');
        const focusService = this.get('focusService');
        const fileService = this.get('fileService');

        // --- [NEW] Instantiate LeftPanelTabManager (Phase 6 Refactor) ---
        const leftPanelElement = document.getElementById(DOM_IDS.LEFT_PANEL);
        const leftPanelTabManager = new LeftPanelTabManager(leftPanelElement, eventAggregator);
        this.register('leftPanelTabManager', leftPanelTabManager);

        // --- [NEW] Instantiate K1 Tab Components (Phase 1 Refactor) ---
        const k1TabInputHandler = new K1TabInputHandler({ eventAggregator });
        this.register('k1TabInputHandler', k1TabInputHandler);
        const k1TabComponent = new K1TabComponent();
        this.register('k1TabComponent', k1TabComponent);

        // --- [NEW] Instantiate K2 Tab Components (Phase 5 Refactor) ---
        const k2TabInputHandler = new K2TabInputHandler({ eventAggregator });
        this.register('k2TabInputHandler', k2TabInputHandler);

        // --- [NEW] Instantiate K3 Tab Components (Phase 2 Refactor) ---
        const k3TabInputHandler = new K3TabInputHandler({ eventAggregator });
        this.register('k3TabInputHandler', k3TabInputHandler);
        const k3TabComponent = new K3TabComponent();
        this.register('k3TabComponent', k3TabComponent);

        // --- [NEW] Instantiate K4 Tab Components (Phase 4 Refactor) ---
        const k4TabInputHandler = new K4TabInputHandler({ eventAggregator });
        this.register('k4TabInputHandler', k4TabInputHandler);
        const k4TabComponent = new K4TabComponent();
        this.register('k4TabComponent', k4TabComponent);

        // --- [NEW] Instantiate K5 Tab Components (Phase 3 Refactor) ---
        const k5TabInputHandler = new K5TabInputHandler({ eventAggregator });
        this.register('k5TabInputHandler', k5TabInputHandler);
        const k5TabComponent = new K5TabComponent();
        this.register('k5TabComponent', k5TabComponent);

        // --- [NEW] Instantiate the new QuoteGeneratorService ---
        const quoteGeneratorService = new QuoteGeneratorService({ calculationService });
        this.register('quoteGeneratorService', quoteGeneratorService);

        // --- [REMOVED] (Refactor - Lazy Load) Instantiate Right Panel Sub-Views ---
        // const rightPanelElement = document.getElementById('function-panel');
        // const f1View = new F1CostView(...);
        // const f2View = new F2SummaryView(...);
        // const f3View = new F3QuotePrepView(...);
        // const f4View = new F4ActionsView(...);
        const rightPanelElement = document.getElementById('function-panel'); // [NEW] Still need this

        // --- Instantiate Main RightPanelComponent Manager ---
        // [MODIFIED] (Refactor - Lazy Load)
        // Removed f1View-f4View dependencies.
        // Injected services (stateService, calculationService) so the component
        // can dynamically instantiate views itself.
        const rightPanelComponent = new RightPanelComponent({
            panelElement: rightPanelElement,
            eventAggregator,
            stateService,
            calculationService
            // f1View, // [REMOVED]
            // f2View, // [REMOVED]
            // f3View, // [REMOVED]
            // f4View  // [REMOVED]
        });
        this.register('rightPanelComponent', rightPanelComponent);

        // --- [REMOVED] Quote Preview Component instantiation ---


        // --- Instantiate Main Left Panel Views ---
        const k1LocationView = new K1LocationView({ stateService });
        // --- [REMOVED] (Phase 3 Cleanup) Get K2 DOM elements for injection
        // const fabricBatchTable = document.getElementById(DOM_IDS.FABRIC_BATCH_TABLE);
        const k2FabricView = new K2FabricView({
            stateService,
            eventAggregator
            // [REMOVED] (Phase 3 Cleanup) fabricBatchTable
        });
        const k3OptionsView = new K3OptionsView({ stateService });
        const dualChainView = new DualChainView({ stateService, calculationService, eventAggregator });
        const driveAccessoriesView = new DriveAccessoriesView({ stateService, calculationService, eventAggregator });

        // --- [MODIFIED] Removed obsolete publishStateChangeCallback from DetailConfigView dependencies ---
        const detailConfigView
            = new DetailConfigView({
                stateService,
                eventAggregator,
                k1LocationView,
                k2FabricView,
                k3OptionsView,
                dualChainView,
                driveAccessoriesView
            });
        this.register('detailConfigView', detailConfigView);

        const workflowService = new WorkflowService({
            eventAggregator,
            stateService,
            fileService,
            calculationService,
            productFactory,
            detailConfigView,
            quoteGeneratorService // [NEW] Inject the new service

        });
        // [REMOVED]
        this.register('workflowService', workflowService);

        const quickQuoteView = new QuickQuoteView({
            stateService,
            calculationService,
            focusService,
            fileService,
            eventAggregator,
            productFactory,
            configManager
        });
        this.register('quickQuoteView', quickQuoteView);

        const appController = new AppController({
            eventAggregator,
            stateService,
            workflowService,
            quickQuoteView,
            detailConfigView
        });
        this.register('appController', appController);

        // [NEW] Initialize LeftPanelTabManager (Phase 6 Refactor)
        leftPanelTabManager.initialize();
        // [NEW] Initialize K1 Input Handler (Phase 1 Refactor)
        k1TabInputHandler.initialize();
        // [NEW] Initialize K2 Input Handler (Phase 5 Refactor)
        k2TabInputHandler.initialize();
        // [NEW] Initialize K3 Input Handler (Phase 2 Refactor)
        k3TabInputHandler.initialize();
        // [NEW] Initialize K4 Input Handler (Phase 4 Refactor)
        k4TabInputHandler.initialize();
        // [NEW] Initialize K5 Input Handler (Phase 3 Refactor)
        k5TabInputHandler.initialize();
    }
}

// Import all necessary classes
import { EventAggregator } from './event-aggregator.js';
import { ConfigManager } from './config-manager.js';
import { AppController } from './app-controller.js';
import { ProductFactory } from './strategies/product-factory.js';
import { StateService } from './services/state-service.js';
import { CalculationService } from './services/calculation-service.js';
import { FocusService } from './services/focus-service.js';
import { FileService } from './services/file-service.js';
import { WorkflowService } from './services/workflow-service.js';
import { QuoteGeneratorService } from './services/quote-generator-service.js'; // [NEW]
import { RightPanelComponent } from './ui/right-panel-component.js';
import { QuickQuoteView } from './ui/views/quick-quote-view.js';
import { DetailConfigView } from './ui/views/detail-config-view.js';
import {
    K1LocationView
} from './ui/views/k1-location-view.js';
import { K2FabricView } from './ui/views/k2-fabric-view.js';
import { K3OptionsView } from './ui/views/k3-options-view.js';
import { DualChainView } from './ui/views/dual-chain-view.js';
import { DriveAccessoriesView } from './ui/views/drive-accessories-view.js';
import { initialState } from './config/initial-state.js';
// [REMOVED] (Refactor - Lazy Load) Static imports for F1-F4 views
// import { F1CostView } from './ui/views/f1-cost-view.js';
// import { F2SummaryView } from './ui/views/f2-summary-view.js';
// import { F3QuotePrepView } from './ui/views/f3-quote-prep-view.js';
// import { F4ActionsView } from './ui/views/f4-actions-view.js';
import { LeftPanelTabManager } from './ui/left-panel-tab-manager.js'; // [MODIFIED]
import { DOM_IDS } from './config/constants.js'; // [MODIFIED]

// [NEW IMPORTS]
import { K1TabInputHandler } from './ui/tabs/k1-tab/k1-tab-input-handler.js';
import { K1TabComponent } from './ui/tabs/k1-tab/k1-tab-component.js';
import { K2TabInputHandler } from './ui/tabs/k2-tab/k2-tab-input-handler.js'; // [NEW]
import { K3TabInputHandler } from './ui/tabs/k3-tab/k3-tab-input-handler.js';
import { K3TabComponent } from './ui/tabs/k3-tab/k3-tab-component.js';
import { K4TabInputHandler } from './ui/tabs/k4-tab/k4-tab-input-handler.js';
import { K4TabComponent } from './ui/tabs/k4-tab/k4-tab-component.js';
import { K5TabInputHandler } from './ui/tabs/k5-tab/k5-tab-input-handler.js';
import { K5TabComponent } from './ui/tabs/k5-tab/k5-tab-component.js';