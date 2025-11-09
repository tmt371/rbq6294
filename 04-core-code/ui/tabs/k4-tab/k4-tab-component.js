// File: 04-core-code/ui/tabs/k4-tab/k4-tab-component.js

/**
 * @fileoverview A dedicated component for managing and rendering the K4 (Drive/Accessories) tab UI.
 */
export class K4TabComponent {
    constructor() {
        // Cache all DOM elements for K4 in the constructor.
        // [MODIFIED] IDs corrected from 'k5-' to 'k4-'
        this.k4WinderButton = document.getElementById('btn-k4-winder');
        this.k4MotorButton = document.getElementById('btn-k4-motor');
        this.k4RemoteButton = document.getElementById('btn-k4-remote');
        this.k4ChargerButton = document.getElementById('btn-k4-charger');
        this.k4CordButton = document.getElementById('btn-k4-3m-cord');
        this.k4WinderDisplay = document.getElementById('k4-display-winder');
        this.k4MotorDisplay = document.getElementById('k4-display-motor');
        this.k4RemoteDisplay = document.getElementById('k4-display-remote');
        this.k4ChargerDisplay = document.getElementById('k4-display-charger');
        this.k4CordDisplay = document.getElementById('k4-display-cord');
        this.k4RemoteAddBtn = document.getElementById('btn-k4-remote-add');
        this.k4RemoteSubtractBtn = document.getElementById('btn-k4-remote-subtract');
        this.k4RemoteCountDisplay = document.getElementById('k4-display-remote-count');
        this.k4ChargerAddBtn = document.getElementById('btn-k4-charger-add');
        this.k4ChargerSubtractBtn = document.getElementById('btn-k4-charger-subtract');
        this.k4ChargerCountDisplay = document.getElementById('k4-display-charger-count');
        this.k4CordAddBtn = document.getElementById('btn-k4-cord-add');
        this.k4CordSubtractBtn = document.getElementById('btn-k4-cord-subtract');
        this.k4CordCountDisplay = document.getElementById('k4-display-cord-count');
        this.k4TotalDisplay = document.getElementById('k4-display-total');

        console.log("K4TabComponent Initialized.");
    }

    render(uiState) {
        const {
            driveAccessoryMode, driveRemoteCount, driveChargerCount, driveCordCount,
            driveWinderTotalPrice, driveMotorTotalPrice, driveRemoteTotalPrice, driveChargerTotalPrice, driveCordTotalPrice,
            driveGrandTotal
        } = uiState;

        const formatPrice = (price) => (typeof price === 'number') ? `$${price.toFixed(0)}` : '';

        // --- K4 (Drive/Accessories) States ---
        const k4Buttons = [
            { el: this.k4WinderButton, mode: 'winder' },
            { el: this.k4MotorButton, mode: 'motor' },
            { el: this.k4RemoteButton, mode: 'remote' },
            { el: this.k4ChargerButton, mode: 'charger' },
            { el: this.k4CordButton, mode: 'cord' }
        ];

        const isAnyK4ModeActive = driveAccessoryMode !== null;
        k4Buttons.forEach(({ el, mode }) => {
            if (el) {
                const isActive = driveAccessoryMode === mode;
                el.classList.toggle('active', isActive);
                el.disabled = isAnyK4ModeActive && !isActive;
            }
        });

        if (this.k4WinderDisplay) this.k4WinderDisplay.value = formatPrice(driveWinderTotalPrice);
        if (this.k4MotorDisplay) this.k4MotorDisplay.value = formatPrice(driveMotorTotalPrice);
        if (this.k4RemoteDisplay) this.k4RemoteDisplay.value = formatPrice(driveRemoteTotalPrice);
        if (this.k4ChargerDisplay) this.k4ChargerDisplay.value = formatPrice(driveChargerTotalPrice);
        if (this.k4CordDisplay) this.k4CordDisplay.value = formatPrice(driveCordTotalPrice);
        if (this.k4RemoteCountDisplay) this.k4RemoteCountDisplay.value = driveRemoteCount;
        if (this.k4ChargerCountDisplay) this.k4ChargerCountDisplay.value = driveChargerCount;
        if (this.k4CordCountDisplay) this.k4CordCountDisplay.value = driveCordCount;
        if (this.k4TotalDisplay) this.k4TotalDisplay.value = formatPrice(driveGrandTotal);

        const remoteBtnsDisabled = driveAccessoryMode !== 'remote';
        if (this.k4RemoteAddBtn) this.k4RemoteAddBtn.disabled = remoteBtnsDisabled;
        if (this.k4RemoteSubtractBtn) this.k4RemoteSubtractBtn.disabled = remoteBtnsDisabled;
        const chargerBtnsDisabled = driveAccessoryMode !== 'charger';
        if (this.k4ChargerAddBtn) this.k4ChargerAddBtn.disabled = chargerBtnsDisabled;
        if (this.k4ChargerSubtractBtn) this.k4ChargerSubtractBtn.disabled = chargerBtnsDisabled;
        const cordBtnsDisabled = driveAccessoryMode !== 'cord';
        if (this.k4CordAddBtn) this.k4CordAddBtn.disabled = cordBtnsDisabled;
        if (this.k4CordSubtractBtn) this.k4CordSubtractBtn.disabled = cordBtnsDisabled;
    }
}