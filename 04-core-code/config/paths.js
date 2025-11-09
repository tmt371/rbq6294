export const paths = {
    partials: {
        leftPanel: './04-core-code/ui/partials/left-panel.html',
        rightPanel: './04-core-code/ui/partials/right-panel.html',
        quoteTemplate: './04-core-code/ui/partials/quote-template-final.html', // [NEW]
        detailedItemList: './04-core-code/ui/partials/detailed-item-list-final.html', // [NEW]
        gmailSimple: './04-core-code/ui/partials/gmail-template-simple.html', // [NEW]
        // [NEW] Add paths for new refactored row/card templates
        quoteTemplateRow: './04-core-code/ui/partials/quote-template-row.html',
        gmailTemplateCard: './04-core-code/ui/partials/gmail-template-card.html',
        // [NEW] Add path for the external client script to be fetched
        quoteClientScript: './04-core-code/ui/partials/quote-template-client.js',
        // [NEW] Add path for the GTH client script to be fetched
        gmailClientScript: './04-core-code/ui/partials/gmail-template-client.js',
        // [NEW] Add path for the detailed list row template
        detailedItemListRow: './04-core-code/ui/partials/detailed-item-list-row.html',
    },
    // [NEW] Add paths for new refactored tabs
    tabs: {
        k1: {
            html: './04-core-code/ui/tabs/k1-tab/k1-tab.html',
            css: './04-core-code/ui/tabs/k1-tab/k1-tab.css'
        },
        // [NEW] Add paths for K2
        k2: {
            html: './04-core-code/ui/tabs/k2-tab/k2-tab.html',
            css: './04-core-code/ui/tabs/k2-tab/k2-tab.css'
        },
        k3: {
            html: './04-core-code/ui/tabs/k3-tab/k3-tab.html',
            css: './04-core-code/ui/tabs/k3-tab/k3-tab.css'
        },
        k5: {
            html: './04-core-code/ui/tabs/k5-tab/k5-tab.html',
            css: './04-core-code/ui/tabs/k5-tab/k5-tab.css'
        },
        // [NEW] Add paths for K4
        k4: {
            html: './04-core-code/ui/tabs/k4-tab/k4-tab.html',
            css: './04-core-code/ui/tabs/k4-tab/k4-tab.css'
        }
    },
    data: {
        priceMatrix: './03-data-models/price-matrix-v1.0.json'
    }
};