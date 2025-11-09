// File: 04-core-code/services/quote-generator-service.js

import { paths } from '../config/paths.js';
/**
 * @fileoverview A new, single-responsibility service for generating the final quote HTML.
 * It pre-fetches and caches templates for better performance.
 */
export class QuoteGeneratorService {
    constructor({ calculationService }) {
        this.calculationService = calculationService;
        this.quoteTemplate = '';
        this.detailsTemplate = '';
        this.gmailTemplate = ''; // [NEW]
        // [NEW] Add new template properties
        this.quoteTemplateRow = '';
        this.gmailTemplateCard = '';
        // [NEW] Add property to hold the fetched client script content
        this.quoteClientScript = '';
        // [NEW] Add property to hold the GTH client script content
        this.gmailClientScript = '';
        // [NEW] Add property for the detailed list row
        this.detailedItemListRow = '';

        // [MODIFIED] The script now includes a robust CSS inlining mechanism.
        this.actionBarHtml = `
    <div id="action-bar">
        <button id="copy-html-btn">Copy HTML</button>
        <button id="print-btn">Print / Save PDF</button>
    </div>`;

        // [REMOVED] this.scriptHtml definition has been deleted as per v6293 Task 2.1
        // (This was done in the previous (failed) edit, and remains deleted now)

        // [REMOVED] this.scriptHtmlGmail definition has been deleted as per v6293 Task 2.2

        // [REMOVED] _initialize() is no longer called on construction.
        // this._initialize(); 
        console.log("QuoteGeneratorService Initialized.");
    }

    // [REMOVED] Original _initialize() logic is moved to _loadTemplates()
    async _initialize() {
        // This function is now a placeholder, but we keep it
        // in case the _loadTemplates() call fails, we can re-call it.
        try {
            [
                this.quoteTemplate,
                this.detailsTemplate,
                this.gmailTemplate,
                // [NEW] Load the new templates
                this.quoteTemplateRow,
                this.gmailTemplateCard,
                // [NEW] Fetch the client script content as text
                this.quoteClientScript,
                // [NEW] Fetch the GTH client script content as text
                this.gmailClientScript,
                // [NEW] Fetch the detailed list row template
                this.detailedItemListRow
            ] = await Promise.all([
                fetch(paths.partials.quoteTemplate).then(res => res.text()),
                fetch(paths.partials.detailedItemList).then(res => res.text()),
                fetch(paths.partials.gmailSimple).then(res => res.text()), // [NEW]
                // [NEW] Fetch the new templates
                fetch(paths.partials.quoteTemplateRow).then(res => res.text()),
                fetch(paths.partials.gmailTemplateCard).then(res => res.text()),
                // [NEW] Fetch the client script
                fetch(paths.partials.quoteClientScript).then(res => res.text()),
                // [NEW] Fetch the GTH client script
                fetch(paths.partials.gmailClientScript).then(res => res.text()),
                // [NEW] Fetch the detailed list row
                fetch(paths.partials.detailedItemListRow).then(res => res.text()),
            ]);
            console.log("QuoteGeneratorService: All (6) HTML templates and (2) client scripts pre-fetched and cached.");
        } catch (error) {
            console.error("QuoteGeneratorService: Failed to pre-fetch HTML templates:", error);
            // In a real-world scenario, you might want to publish an error event here.
        }
    }

    // [NEW] (Refactor - Lazy Load)
    // This method ensures templates are loaded, but only fetches them once.
    async _loadTemplates() {
        // Check if templates are already loaded.
        // [MODIFIED] Check for new templates and script as well
        if (this.quoteTemplate && this.detailsTemplate && this.gmailTemplate && this.quoteTemplateRow && this.gmailTemplateCard && this.quoteClientScript && this.gmailClientScript && this.detailedItemListRow) {
            return; // Already loaded, do nothing.
        }

        // If not loaded, call the original _initialize logic to fetch them.
        console.log("QuoteGeneratorService: First click detected, fetching templates...");
        await this._initialize();
    }


    /**
     * [NEW] (Phase 3, Step C) Generates the simple HTML for Gmail.
     */
    async generateGmailQuoteHtml(quoteData, ui, f3Data) {
        // [NEW] (Refactor - Lazy Load) Ensure templates are loaded before proceeding.
        await this._loadTemplates();

        if (!this.gmailTemplate || !this.gmailClientScript) {
            console.error("QuoteGeneratorService: Gmail template or client script is not loaded yet.");
            return null;
        }

        // 1. Get common data
        // [MODIFIED v6291] 步驟 5: getQuoteTemplateData 確保總是返回 ourOffer
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                 <tr>
                    <td class="summary-label"
                         style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; padding-right: 20px; color: #555555;">
                         GST</td>
                     <td class="summary-value"
                         style="padding: 8px 0; border: 1px solid #dddddd; font-size: 13.3px; text-align: right; font-weight: 500; padding-right: 10px;">
                         ${templateData.gst}</td>
                </tr>
            `; // [FIX v6291] 移除錯誤的 `\`
        }

        // 3. Populate the GTH template
        let finalHtml = this._populateTemplate(this.gmailTemplate, {
            ...templateData,
            // [MODIFIED] v6290 Bind to correct F2 values
            total: templateData.grandTotal,
            deposit: templateData.deposit,
            balance: templateData.balance,
            ourOffer: templateData.ourOffer, // [FIX v6291] 步驟 5: 確保 ourOffer 被傳遞

            // Ensure customer info is formatted
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Ensure item list is formatted
            itemsTableBody: this._generatePageOneItemsTableHtml_GTH(templateData),
            // [NEW v6290 Task 2] Pass the conditional GST row
            gstRowHtml: gstRowHtml
        });

        // 4. [REMOVED v6290 Task 2] Remove the faulty regex replacement
        // const gstRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?GST[\s\S]*?<\/td>[\s\S]*?<\/tr>/i;
        // finalHtml = finalHtml.replace(gstRowRegex, '');


        // 5. [MODIFIED] Inject the GTH script content (fetched from file)
        finalHtml = finalHtml.replace(
            '</body>',
            `<script>${this.gmailClientScript}</script></body>`
        );

        return finalHtml;
    }

    /**
     * Generates the full HTML for PDF/Print.
     */
    async generateQuoteHtml(quoteData, ui, f3Data) {
        // [NEW] (Refactor - Lazy Load) Ensure templates are loaded before proceeding.
        await this._loadTemplates();

        if (!this.quoteTemplate || !this.detailsTemplate || !this.quoteClientScript) {
            console.error("QuoteGeneratorService: Templates or client script are not loaded yet.");
            return null;
        }

        // 1. Delegate all data preparation to CalculationService.
        // [MODIFIED v6291] 步驟 5: getQuoteTemplateData 確保總是返回 ourOffer
        const templateData = this.calculationService.getQuoteTemplateData(quoteData, ui, f3Data);

        // 2. [NEW v6290 Task 2] Conditionally create the GST row HTML for the *Original Table*
        let gstRowHtml = '';
        if (!templateData.uiState.f2.gstExcluded) {
            gstRowHtml = `
                 <tr> 
                    <td class="summary-label">GST (10%)</td> 
                    <td class="summary-value">${templateData.gst}</td>
                 </tr>
            `;
        }

        // 3. Generate HTML snippets using the prepared data.
        const populatedDataWithHtml = {
            ...templateData,
            customerInfoHtml: this._formatCustomerInfo(templateData),
            // [MODIFIED v6290 Task 1] Use the single-table generator
            // [FIX v6291] (步驟 1, 2) 此函數現在只返回 <tr>...</tr>
            itemsTableBody: this._generatePageOneItemsTableHtml_Original(templateData),
            // [MODIFIED] Call renamed function and use new placeholder key
            rollerBlindsTableRows: this._generateItemsTableHtml_RowsOnly(templateData),
            gstRowHtml: gstRowHtml // [NEW] Pass the conditional GST row
        };

        // 4. Populate templates
        const populatedDetailsPageHtml = this._populateTemplate(this.detailsTemplate, populatedDataWithHtml);

        const styleMatch = populatedDetailsPageHtml.match(/<style>([\s\S]*)<\/style>/i);
        const detailsBodyMatch = populatedDetailsPageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        if (!detailsBodyMatch) {
            throw new Error("Could not find body content in the details template.");
        }

        const detailsStyleContent = styleMatch ? styleMatch[0] : '';
        const detailsBodyContent = detailsBodyMatch[1];

        let finalHtml = this.quoteTemplate.replace('</head>', `${detailsStyleContent}</head>`);
        finalHtml = finalHtml.replace('</body>', `${detailsBodyContent}</body>`);
        finalHtml = this._populateTemplate(finalHtml, populatedDataWithHtml);

        // 5. Inject the action bar and script into the final HTML
        finalHtml = finalHtml.replace(
            '<body>',
            `<body>${this.actionBarHtml}`
        );

        // [MODIFIED] Re-add the script injection, but wrap the fetched script content
        finalHtml = finalHtml.replace(
            '</body>',
            `<script>${this.quoteClientScript}</script></body>`
        );

        return finalHtml;
    }

    _populateTemplate(template, data) {
        return template.replace(/\{\{\{?([\w\-]+)\}\}\}?/g, (match, key) => {
            // [MODIFIED] Handle GTH template keys which are different
            const value = data.hasOwnProperty(key) ? data[key] : null;

            // Allow `null` or `0` to be rendered
            if (value !== null && value !== undefined) {
                return value;
            }

            // Fallback for GTH keys that might not be in templateData root
            if (key === 'total') return data.grandTotal;
            if (key === 'deposit') return data.deposit;
            if (key === 'balance') return data.balance;
            // [NEW v6291] 步驟 5: 增加 ourOffer 的 fallback
            if (key === 'ourOffer') return data.ourOffer;

            return match; // Keep original placeholder if key not found
        });
    }

    _formatCustomerInfo(templateData) {
        let html = `<strong>${templateData.customerName || ''}</strong><br>`;
        if (templateData.customerAddress) html += `${templateData.customerAddress.replace(/\n/g, '<br>')}<br>`;
        if (templateData.customerPhone) html += `Phone: ${templateData.customerPhone}<br>`;
        if (templateData.customerEmail) html += `Email: ${templateData.customerEmail}`;
        return html;
    }

    // [MODIFIED] Renamed function
    _generateItemsTableHtml_RowsOnly(templateData) {
        const { items, mulTimes } = templateData;
        // [REMOVED] Headers are now defined in detailed-item-list-final.html
        // const headers = ['#', 'F-NAME', 'F-COLOR', 'Location', 'HD', 'Dual', 'Motor', 'Price'];

        const rows = items
            .filter(item => item.width && item.height)
            .map((item, index) => {

                let fabricClass = '';
                if (item.fabric && item.fabric.toLowerCase().includes('light-filter')) {
                    fabricClass = 'bg-light-filter';
                } else if (item.fabricType === 'SN') {
                    fabricClass = 'bg-screen';
                } else if (['B1', 'B2', 'B3', 'B4', 'B5'].includes(item.fabricType)) {
                    fabricClass = 'bg-blockout';
                }

                const finalPrice = (item.linePrice || 0) * mulTimes;

                // [REMOVED] The inline 'cell' helper function is removed.

                // [NEW] Create data object for the template
                const winderText = item.winder === 'HD' ? 'Y' : '';
                const dualText = item.dual === 'D' ? 'Y' : '';
                const motorText = item.motor ? 'Y' : '';

                const rowData = {
                    index: index + 1,
                    fabricClass: fabricClass,
                    fabric: item.fabric || '',
                    color: item.color || '',
                    location: item.location || '',
                    winder: winderText,
                    dual: dualText,
                    motor: motorText,
                    price: `$${finalPrice.toFixed(2)}`,
                    isEmptyClassHD: winderText ? '' : 'is-empty-cell',
                    isEmptyClassDual: dualText ? '' : 'is-empty-cell',
                    isEmptyClassMotor: motorText ? '' : 'is-empty-cell',
                };

                // [NEW] Populate the new external template
                return this._populateTemplate(this.detailedItemListRow, rowData);
            })
            .join('');

        // [REMOVED] The <table> wrapper string is deleted.
        return rows;
    }

    // [NEW v6290 Task 1] This is the new function for "Original" (Add Quote)
    // It generates a SINGLE table
    _generatePageOneItemsTableHtml_Original(templateData) {
        const { summaryData, uiState, items } = templateData;
        const rows = [];
        const validItemCount = items.filter(i => i.width && i.height).length;

        // [MODIFIED] Remove inline helper function
        const createRowData = (number, description, qty, price, discountedPrice, isExcluded = false) => {
            // [FIX v6291] 步驟 3: 如果 Price 被排除，Discounted Price 顯示為 0
            const discountedPriceValue = isExcluded ? 0 : discountedPrice;
            const isDiscounted = discountedPriceValue < price;

            // [FIX v6291] (修復 PDF 步驟 1.2, 1.3, 1.4) 實現正確的顏色樣式邏輯
            let priceStyle = 'style="color: #333;"'; // (1.3) 預設 Price 為黑色
            // (1.3) 預設 Discounted Price 為黑色 (CSS 會使其為紅色，style 用於覆蓋)
            let discountedPriceStyle = 'style="color: #333;"';

            if (isExcluded) {
                // (1.4) Price: 灰色刪除線 Discounted: 紅色 (並顯示 0)
                priceStyle = 'style="text-decoration: line-through; color: #999999;"';
                discountedPriceStyle = 'style="color: #d32f2f;"';
            } else if (isDiscounted) {
                // (1.2) Price: 灰色 Discounted: 紅色
                priceStyle = 'style="color: #999999;"';
                discountedPriceStyle = 'style="color: #d32f2f;"'; // 保持紅色 (CSS 預設)
            }
            // (1.3) 情況 (isExcluded = false 且 isDiscounted = false) 已在預設中處理 (兩者皆為黑色)

            // [MODIFIED] Return data object instead of string
            return {
                number,
                description,
                qty,
                price: price.toFixed(2),
                discountedPrice: discountedPriceValue.toFixed(2),
                priceStyle,
                discountedPriceStyle
            };
        };

        let itemNumber = 1;

        // Row 1: Roller Blinds
        rows.push(createRowData(
            itemNumber++,
            'Roller Blinds',
            validItemCount,
            summaryData.firstRbPrice || 0,
            summaryData.disRbPrice || 0,
            false // 確保 Roller Blinds Price 永遠不會被劃掉
        ));

        // Row 2: Installation Accessories (Optional)
        // [FIX v6291] 步驟 1: 修正 isExcluded 邏輯，確保 Price 永遠不會被劃掉
        if (summaryData.acceSum > 0) {
            rows.push(createRowData(
                itemNumber++,
                'Installation Accessories',
                'NA',
                summaryData.acceSum || 0,
                summaryData.acceSum || 0,
                false // 確保此項目 Price 永遠不會被劃掉
            ));
        }

        // Row 3: Motorised Package (Optional)
        // [MODIFIED v6291] 步驟 2 & 5: 註解
        // [FIX v6291] 步驟 2: 修正 isExcluded 邏輯，確保 Price 永遠不會被劃掉
        if (summaryData.eAcceSum > 0) {
            rows.push(createRowData(
                itemNumber++,
                'Motorised Package',
                'NA',
                summaryData.eAcceSum || 0,
                summaryData.eAcceSum || 0,
                false // 確保此項目 Price 永遠不會被劃掉
            ));
        }

        // Row 4: Delivery
        // [註] 步驟 6: 此處邏輯已正確，isExcluded 會繼承 deliveryExcluded
        const deliveryExcluded = uiState.f2.deliveryFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Delivery',
            uiState.f2.deliveryQty || 1,
            summaryData.deliveryFee || 0,
            summaryData.deliveryFee || 0,
            deliveryExcluded
        ));

        // Row 5: Installation
        // [註] 步驟 7: 此處邏輯已正確，isExcluded 會繼承 installExcluded
        const installExcluded = uiState.f2.installFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Installation',
            uiState.f2.installQty || 0, // Use installQty from F2 state
            summaryData.installFee || 0,
            summaryData.installFee || 0,
            installExcluded
        ));

        // Row 6: Removal
        // [註] 步驟 8: 此處邏輯已正確，isExcluded 會繼承 removalExcluded
        const removalExcluded = uiState.f2.removalFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Removal',
            uiState.f2.removalQty || 0,
            summaryData.removalFee || 0,
            summaryData.removalFee || 0,
            removalExcluded
        ));

        // [MODIFIED] Map data objects to HTML strings using the template
        return rows.map(rowData =>
            this._populateTemplate(this.quoteTemplateRow, rowData)
        ).join('');
    }

    // [NEW v6290 Task 1] This is the restored function for GTH
    // It generates MULTIPLE tables (cards)
    _generatePageOneItemsTableHtml_GTH(templateData) {
        const { summaryData, uiState, items } = templateData;
        const rows = [];
        const validItemCount = items.filter(i => i.width && i.height).length;

        // [MODIFIED] Remove inline helper function
        const createRowData = (number, description, qty, price, discountedPrice, isExcluded = false) => {
            // [FIX v6291] 步驟 3: 如果 Price 被排除，Discounted Price 顯示為 0
            const discountedPriceValue = isExcluded ? 0 : discountedPrice;
            const isDiscounted = discountedPriceValue < price;

            // [FIX v6291] (修復 PDF 步驟 1.2, 1.3, 1.4) 實現正確的顏色樣式邏輯 (GTH 版本)
            let priceStyle = 'style="color: #333;"'; // (1.3) 預設 Price 為黑色
            let discountedPriceStyle = 'style="font-weight: bold; color: #333;"'; // (1.3) GTH 預設黑色粗體

            if (isExcluded) {
                // (1.4) Price: 灰色刪除線 Discounted: 紅色
                priceStyle = 'style="text-decoration: line-through; color: #999999;"';
                discountedPriceStyle = 'style="font-weight: bold; color: #d32f2f;"';
            } else if (isDiscounted) {
                // (1.2) Price: 灰色 Discounted: 紅色
                priceStyle = 'style="color: #999999;"';
                discountedPriceStyle = 'style="font-weight: bold; color: #d32f2f;"';
            }
            // (1.3) 情況 (isExcluded = false 且 isDiscounted = false) 已在預設中處理

            // [MODIFIED] Return data object instead of string
            return {
                number,
                description,
                qty,
                price: price.toFixed(2),
                discountedPrice: discountedPriceValue.toFixed(2),
                priceStyle,
                discountedPriceStyle
            };
        };

        let itemNumber = 1;

        // Row 1: Roller Blinds
        rows.push(createRowData(
            itemNumber++,
            'Roller Blinds',
            validItemCount,
            summaryData.firstRbPrice || 0,
            summaryData.disRbPrice || 0,
            false // 確保 Roller Blinds Price 永遠不會被劃掉
        ));

        // Row 2: Installation Accessories (Optional)
        // [FIX v6291] 步驟 1: 修正 isExcluded 邏輯，確保 Price 永遠不會被劃掉
        if (summaryData.acceSum > 0) {
            rows.push(createRowData(
                itemNumber++,
                'Installation Accessories',
                'NA',
                summaryData.acceSum || 0,
                summaryData.acceSum || 0,
                false // 確保此項目 Price 永遠不會被劃掉
            ));
        }

        // Row 3: Motorised Accessories (Optional)
        // [FIX v6291] 步驟 2: 修正 isExcluded 邏輯，確保 Price 永遠不會被劃掉
        // [MODIFIED v6291] 步驟 2: 註解
        if (summaryData.eAcceSum > 0) {
            rows.push(createRowData(
                itemNumber++,
                'Motorised Package',
                'NA',
                summaryData.eAcceSum || 0,
                summaryData.eAcceSum || 0,
                false // 確保此項目 Price 永遠不會被劃掉
            ));
        }

        // Row 4: Delivery
        const deliveryExcluded = uiState.f2.deliveryFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Delivery',
            uiState.f2.deliveryQty || 1,
            summaryData.deliveryFee || 0,
            summaryData.deliveryFee || 0,
            deliveryExcluded
        ));

        // Row 5: Installation
        // [MODIFIED v6290 Bug 1 Fix]
        const installExcluded = uiState.f2.installFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Installation',
            uiState.f2.installQty || 0, // Use installQty from F2 state
            summaryData.installFee || 0,
            summaryData.installFee || 0,
            installExcluded
        ));

        // Row 6: Removal
        const removalExcluded = uiState.f2.removalFeeExcluded;
        rows.push(createRowData(
            itemNumber++,
            'Removal',
            uiState.f2.removalQty || 0,
            summaryData.removalFee || 0,
            summaryData.removalFee || 0,
            removalExcluded
        ));

        // [MODIFIED] Map data objects to HTML strings using the template
        return rows.map(rowData =>
            this._populateTemplate(this.gmailTemplateCard, rowData)
        ).join('');
    }
}