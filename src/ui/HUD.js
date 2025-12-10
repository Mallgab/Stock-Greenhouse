export class HUD {
    constructor(gameState) {
        this.gameState = gameState;
        this.moneyDisplay = document.getElementById('money-display');
        this.dayDisplay = document.getElementById('day-display');

        if (!this.moneyDisplay || !this.dayDisplay) {
            console.error("HUD display elements not found!");
        }

        this.update();
    }

    update() {
        if (this.moneyDisplay) {
            this.moneyDisplay.textContent = this.gameState.money.toFixed(2); // Display money with 2 decimal places
        }
        if (this.dayDisplay) {
            this.dayDisplay.textContent = this.gameState.timeSystem.getCurrentDay();
        }
    }
}
