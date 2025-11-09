// /04-core-code/services/calculation-service.js

/**
 * @fileoverview Service for handling all price and sum calculations.
 * Acts as a generic executor that delegates product-specific logic to a strategy.
 */
export class CalculationService {
    constructor({ stateService, productFactory, configManager }) {
        this.stateService = stateService;
        this.productFactory = productFactory;
        this.configManager = configManager;
        console.log("CalculationService Initialized.");
    }

    /**
     * Calculates line prices for all valid items and the total sum using a provided product strategy.
     */
    calculateAndSum(quoteData, productStrategy) {
        if (!productStrategy) {
            console.error("CalculationService: productStrategy is required for calculateAndSum.");
            return { quoteData, firstError: { message: "Product strategy not provided." } };
        }

        const currentProductKey = quoteData.currentProduct;
        const currentProductData = quoteData.products[currentProductKey];

        let firstError = null;

        const newItems = currentProductData.items.map((item, index) => {
            const newItem = { ...item, linePrice: null };
            if (item.width && item.height && item.fabricType) {
                const priceMatrix = this.configManager.getPriceMatrix(item.fabricType);
                const result = productStrategy.calculatePrice(item, priceMatrix);

                if (result.price !== null) {
                    newItem.linePrice = result.price;
                } else if (result.error && !firstError) {
                    const errorColumn = result.error.toLowerCase().includes('width') ? 'width' : 'height';
                    firstError = {
                        message: `Row ${index + 1}: ${result.error}`,
                        rowIndex: index,
                        column: errorColumn
                    };
                }
            }
            return newItem;
        });

        const itemsTotal = newItems.reduce((sum, item) => sum + (item.linePrice || 0), 0);

        let accessoriesTotal = 0;
        const currentSummary = currentProductData.summary;
        if (currentSummary && currentSummary.accessories) {
            const acc = currentSummary.accessories;
            accessoriesTotal += acc.winder?.price || 0;
            accessoriesTotal += acc.motor?.price || 0;
            accessoriesTotal += acc.remote?.price || 0;
            accessoriesTotal += acc.charger?.price || 0;
            accessoriesTotal += acc.cord3m?.price || 0;
        }

        const newSummary = {
            ...currentSummary,
            totalSum: itemsTotal + accessoriesTotal
        };

        const newProductData = {
            ...currentProductData,
            items: newItems,
            summary: newSummary
        };

        const updatedQuoteData = {
            ...quoteData,
            products: {
                ...quoteData.products,
                [currentProductKey]: newProductData
            }
        };
        return { updatedQuoteData, firstError };
    }

    /**
     * [NEW] Calculates the SALE PRICE for a given accessory.
     * This method is explicit and should be used for calculating prices for the end customer.
     */
    calculateAccessorySalePrice(productType, accessoryName, data) {
        const productStrategy = this.productFactory.getProductStrategy(productType);
        if (!productStrategy) return 0;

        const { accessoryPriceKeyMap, accessoryMethodNameMap } = this.configManager.getAccessoryMappings();
        const priceKey = accessoryPriceKeyMap[accessoryName];

        if (!priceKey) {
            console.error(`No sale price key found for accessory: ${accessoryName}`);
            return 0;
        }

        const pricePerUnit = this.configManager.getAccessoryPrice(priceKey);
        if (pricePerUnit === null) return 0;

        const methodName = accessoryMethodNameMap[accessoryName];

        if (methodName && productStrategy[methodName]) {
            const args = (data.items) ? [data.items, pricePerUnit] : [data.count, pricePerUnit];
            return productStrategy[methodName](...args);
        }


        return 0;
    }

    /**
     * [NEW] Calculates the COST for a given accessory.
     * This method is explicit and should be used for internal cost calculations.
     */
    calculateAccessoryCost(productType, accessoryName, data) {
        const productStrategy = this.productFactory.getProductStrategy(productType);
        if (!productStrategy) return 0;

        // Cost key must be provided in the data object.
        if (!data || !data.costKey) {
            console.error(`Cost calculation for '${accessoryName}' requires a 'costKey' in the data payload.`);
            return 0;
        }
        const priceKey = data.costKey;

        const pricePerUnit = this.configManager.getAccessoryPrice(priceKey);
        if (pricePerUnit === null) return 0;

        const { accessoryMethodNameMap } = this.configManager.getAccessoryMappings();
        const methodName = accessoryMethodNameMap[accessoryName];

        if (methodName && productStrategy[methodName]) {
            const args = (data.items) ? [data.items, pricePerUnit] : [data.count, pricePerUnit];
            return productStrategy[methodName](...args);
        }

        return 0;
    }

    /**
     * @deprecated since v5.93. Use calculateAccessorySalePrice() or calculateAccessoryCost() instead.
     * [REFACTORED] This method is now deprecated and will be removed in a future version.
     */
    calculateAccessoryPrice(productType, accessoryName, data) {
        console.warn("DEPRECATED: `calculateAccessoryPrice` was called. Please update to use `calculateAccessorySalePrice` or `calculateAccessoryCost`.");
        if (data && data.costKey) {
            return this.calculateAccessoryCost(productType, accessoryName, data);
        } else {
            return this.calculateAccessorySalePrice(productType, accessoryName, data);
        }
    }

    /**
     * [REFACTORED] Calculates the total price for a given F1 panel component based on its quantity.
     * It now fetches mappings from the ConfigManager.
     */
    calculateF1ComponentPrice(componentKey, quantity) {
        if (typeof quantity !== 'number' || quantity < 0) {
            return 0;
        }

        const f1KeyMap = {
            'winder': 'cost-winder',
            'motor': 'cost-motor',
            'remote-1ch': 'remoteSingleChannel',
            'remote-16ch': 'remoteMultiChannel16',
            'charger': 'charger',
            '3m-cord': 'cord3m',
            'dual-combo': 'comboBracket',
            'slim': 'slimComboBracket'
        };

        const accessoryKey = f1KeyMap[componentKey];
        if (!accessoryKey) {
            console.error(`No accessory key found for F1 component: ${componentKey}`);
            return 0;
        }

        const unitPrice = this.configManager.getAccessoryPrice(accessoryKey);
        if (unitPrice === null) {
            return 0;
        }

        return unitPrice * quantity;
    }

    /**
     * Calculates all values for the F2 summary panel.
     */
    calculateF2Summary(quoteData, uiState) {
        const currentProductKey = quoteData.currentProduct;
        const items = quoteData.products[currentProductKey].items;
        const productSummary = quoteData.products[currentProductKey].summary;
        const totalSumFromQuickQuote = productSummary.totalSum || 0;

        const f2Config = this.configManager.getF2Config();
        const UNIT_PRICES = f2Config.unitPrices || {};

        const accessories = productSummary.accessories || {};
        const winderPrice = accessories.winderCostSum || 0;
        const dualPrice = accessories.dualCostSum || 0;
        const motorPrice = accessories.motorCostSum || 0;
        const remotePrice = accessories.remoteCostSum || 0;
        const chargerPrice = accessories.chargerCostSum || 0;
        const cordPrice = accessories.cordCostSum || 0;

        const f1State = uiState.f1;
        const f2State = uiState.f2;

        const wifiQty = f2State.wifiQty || 0;
        const deliveryQty = f2State.deliveryQty || 0;
        const installQty = f2State.installQty || 0;
        const removalQty = f2State.removalQty || 0;
        const mulTimes = (f2State.mulTimes === null || f2State.mulTimes === undefined) ? 1 : f2State.mulTimes;
        const discount = f2State.discount || 0;

        const wifiSum = wifiQty * UNIT_PRICES.wifi;
        const deliveryFee = deliveryQty * UNIT_PRICES.delivery;
        const installFee = installQty * UNIT_PRICES.install;
        const removalFee = removalQty * UNIT_PRICES.removal;

        const acceSum = winderPrice + dualPrice;
        const eAcceSum = motorPrice + remotePrice + chargerPrice + cordPrice + wifiSum;
        const surchargeFee =
            (f2State.deliveryFeeExcluded ? 0 : deliveryFee) +
            (f2State.installFeeExcluded ? 0 : installFee) +
            (f2State.removalFeeExcluded ? 0 : removalFee);

        const firstRbPrice = totalSumFromQuickQuote * mulTimes;
        const disRbPriceValue = firstRbPrice * (1 - (discount / 100));
        const disRbPrice = Math.round(disRbPriceValue * 100) / 100;

        // [MODIFIED] (Phase 2) New calculation logic
        const f2_17_pre_sum = acceSum + eAcceSum + surchargeFee;
        const sumPrice = disRbPrice + f2_17_pre_sum; // This is the new f2-b22-sumprice

        // --- [MODIFIED] (F1/F2 Refactor Phase 3) ---
        // --- Start: Read F1 Cost Totals from State (Refactored) ---
        // Read the pre-calculated cost totals directly from the UI state.
        const f1SubTotal = uiState.f1.f1_subTotal || 0;
        const f1_final_total = uiState.f1.f1_finalTotal || 0;
        // --- End: Read F1 Cost Totals from State ---

        // [MODIFIED] (F1/F2 Refactor Phase 3) We must still calculate f1_rb_price
        // because it is used for the "RB Profit" calculation.
        const f1DiscountPercentage = f1State.discountPercentage || 0;
        const retailTotalFromF1 = quoteData.products.rollerBlind.summary.totalSum || 0;
        const f1_rb_price = retailTotalFromF1 * (1 - (f1DiscountPercentage / 100));
        // --- End of modification ---

        const rbProfit = disRbPrice - f1_rb_price;
        const validItemCount = items.filter(item => typeof item.linePrice === 'number' && item.linePrice > 0).length;
        const singleprofit = validItemCount > 0 ? rbProfit / validItemCount : 0;

        // [MODIFIED] (Phase 2) Keep old calculations for compatibility
        const sumProfit = sumPrice - f1SubTotal; // Old `sumProfit` (REMOVED IN PHASE 3)
        const old_gst = sumPrice * 1.1; // Old `gst` (GST-inclusive total) for getQuoteTemplateData

        // [MODIFIED] (Phase 2) New calculations based on `newOffer`
        const newOffer = (f2State.newOffer !== null && f2State.newOffer !== undefined) ? f2State.newOffer : sumPrice;

        // [MODIFIED] (Phase 11) Calculate *both* potential and actual GST
        const potential_gst = newOffer * 0.1; // The value to display

        const actual_gst = f2State.gstExcluded ? 0 : potential_gst; // The value to use in calculations

        const grandTotal = newOffer + actual_gst; // [MODIFIED] Uses actual_gst

        // [MODIFIED v6290 Task 1 & 2] netProfit logic now depends on gstExcluded state
        const netProfit = f2State.gstExcluded
            ? grandTotal - f1SubTotal
            : grandTotal - f1_final_total;

        return {
            totalSumForRbTime: totalSumFromQuickQuote,
            wifiSum,
            deliveryFee,
            installFee,
            removalFee,
            acceSum,
            eAcceSum,
            firstRbPrice,
            disRbPrice,
            sumPrice, // (new value for f2-b22)
            rbProfit,
            singleprofit,

            // --- Old values (for compatibility + render) ---
            sumProfit: sumProfit, // (for f2-b23 - will be removed in Phase 3)
            gst: old_gst, // (for getQuoteTemplateData compatibility - will be removed in Phase 4)

            // --- New values (for Phase 2+) ---
            f2_17_pre_sum: f2_17_pre_sum,
            newOffer: newOffer,
            new_gst: potential_gst, // [MODIFIED] Always return the potential_gst for display
            grandTotal: grandTotal,
            netProfit: netProfit, // (new value for f2-b25)

            mulTimes // [FIX] Add mulTimes to the return object so its value can be persisted.
        };
    }

    /**
     * [NEW] Gathers all necessary data for the quote template.
     * This method is the new home for the logic previously in QuoteGeneratorService._prepareTemplateData.
     * @param {object} quoteData - The *original* quote data from the state (used for items).
     * @param {object} ui - The current UI state.
     * @param {object} liveQuoteData - The *live, up-to-date* quoteData, passed from workflow service.
     * @returns {object} A comprehensive data object ready for template population.
     */
    getQuoteTemplateData(quoteData, ui, liveQuoteData) {
        const summaryData = this.calculateF2Summary(quoteData, ui);

        // [MODIFIED] (Phase 4) Grand total is now derived from F2's newOffer state, not F3.
        const newOfferValue = (ui.f2.newOffer !== null && ui.f2.newOffer !== undefined) ? ui.f2.newOffer : summaryData.sumPrice;

        // [MODIFIED] (Phase 11) Use new_gst (potential) and grandTotal (calculated) from summaryData
        const gstValue = summaryData.new_gst;
        const grandTotal = summaryData.grandTotal; // This value is already correct (newOffer + actual_gst)

        // [NEW v6290 Task 3] Get correct Deposit/Balance from F2 state, not rough calculation
        const depositValue = ui.f2.deposit;
        const balanceValue = ui.f2.balance;

        const items = quoteData.products.rollerBlind.items;
        const formatPrice = (price) => (typeof price === 'number' && price > 0) ? `$${price.toFixed(2)}` : '';

        const motorQty = items.filter(item => !!item.motor).length;
        const motorPrice = (this.configManager.getAccessoryPrice('motorStandard') || 0) * motorQty;

        const totalRemoteQty = ui.driveRemoteCount || 0;
        const remote1chQty = ui.f1.remote_1ch_qty;
        const remote16chQty = (ui.f1.remote_1ch_qty === null) ? totalRemoteQty : (totalRemoteQty - remote1chQty);
        const remotePricePerUnit = this.configManager.getAccessoryPrice('remoteStandard') || 0;
        const remote1chPrice = remotePricePerUnit * remote1chQty;
        const remote16chPrice = remotePricePerUnit * remote16chQty;

        const chargerQty = ui.driveChargerCount || 0;
        const chargerPrice = (this.configManager.getAccessoryPrice('chargerStandard') || 0) * chargerQty;

        const cord3mQty = ui.driveCordCount || 0;
        const cord3mPrice = (this.configManager.getAccessoryPrice('cord3m') || 0) * cord3mQty;

        // [MODIFIED] Read from the liveQuoteData object instead of f3Data(DOM)
        let documentTitleParts = [];
        if (liveQuoteData.quoteId) documentTitleParts.push(liveQuoteData.quoteId);
        if (liveQuoteData.customer.name) documentTitleParts.push(liveQuoteData.customer.name);
        if (liveQuoteData.customer.phone) documentTitleParts.push(liveQuoteData.customer.phone);
        const documentTitle = documentTitleParts.join(' ');

        return {
            documentTitle: documentTitle,
            quoteId: liveQuoteData.quoteId,
            issueDate: liveQuoteData.issueDate,
            dueDate: liveQuoteData.dueDate,
            customerName: liveQuoteData.customer.name, // [MODIFIED]
            customerAddress: liveQuoteData.customer.address, // [MODIFIED]
            customerPhone: liveQuoteData.customer.phone, // [MODIFIED]
            customerEmail: liveQuoteData.customer.email, // [MODIFIED]

            // [MODIFIED] (Phase 4) All totals are now based on the new grandTotal
            subtotal: `$${(summaryData.sumPrice || 0).toFixed(2)}`,
            gst: `$${gstValue.toFixed(2)}`,
            grandTotal: `$${grandTotal.toFixed(2)}`,

            // [FIX v6291] ? é? 5: ç¢ºä? ourOffer è¢«æ­£ç¢ºå‚³??
            ourOffer: `$${newOfferValue.toFixed(2)}`,

            // [MODIFIED v6290 Task 3] Use correct values from F2 state
            deposit: `$${(depositValue || 0).toFixed(2)}`,
            balance: `$${(balanceValue || 0).toFixed(2)}`,

            savings: `$${((summaryData.firstRbPrice || 0) - (summaryData.disRbPrice || 0)).toFixed(2)}`,
            generalNotes: (liveQuoteData.generalNotes || '').replace(/\n/g, '<br>'), // [MODIFIED]
            termsAndConditions: (liveQuoteData.termsConditions || 'Standard terms and conditions apply.').replace(/\n/g, '<br>'), // [MODIFIED]


            // Data for the detailed list (Appendix)
            items: items,
            mulTimes: summaryData.mulTimes || 1,

            // Data for the accessories table (Appendix)
            motorQty: motorQty || '',
            motorPrice: formatPrice(motorPrice),
            remote1chQty: remote1chQty || '',
            remote1chPrice: formatPrice(remote1chPrice),
            remote16chQty: remote16chQty || '',
            remote16chPrice: formatPrice(remote16chPrice),
            chargerQty: chargerQty || '',
            chargerPrice: formatPrice(chargerPrice),
            cord3mQty: cord3mQty || '',
            cord3mPrice: formatPrice(cord3mPrice),
            eAcceSum: formatPrice(summaryData.eAcceSum),

            // Pass the entire summary for flexibility
            summaryData: summaryData,
            uiState: ui
        };
    }
}