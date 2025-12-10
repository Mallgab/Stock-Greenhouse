export class ShopUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.shopPanel = document.getElementById('shop-ui');
        this.shopItemsContainer = document.getElementById('shop-items');
        this.shopUpgradesContainer = document.createElement('div'); // New container for upgrades
        this.shopUpgradesContainer.id = 'shop-upgrades';
        this.shopPanel.appendChild(this.shopUpgradesContainer);

        this.shopPanel.style.display = 'none'; // Hidden by default

        this.currentView = 'items'; // 'items' or 'upgrades'

        this.setupEventListeners();
        this.createToggleButtons(); // Create toggle buttons
        this.updateView(); // Initial view
    }

    createToggleButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 10px;
        `;

        const itemsButton = document.createElement('button');
        itemsButton.textContent = 'Items';
        itemsButton.className = 'shop-toggle-button';
        itemsButton.addEventListener('click', () => { this.currentView = 'items'; this.updateView(); });
        buttonContainer.appendChild(itemsButton);

        const upgradesButton = document.createElement('button');
        upgradesButton.textContent = 'Upgrades';
        upgradesButton.className = 'shop-toggle-button';
        upgradesButton.addEventListener('click', () => { this.currentView = 'upgrades'; this.updateView(); });
        buttonContainer.appendChild(upgradesButton);

        this.shopPanel.insertBefore(buttonContainer, this.shopItemsContainer); // Insert before items container
    }

    updateView() {
        if (this.currentView === 'items') {
            this.shopItemsContainer.style.display = 'block';
            this.shopUpgradesContainer.style.display = 'none';
            this.populateShopItems();
        } else {
            this.shopItemsContainer.style.display = 'none';
            this.shopUpgradesContainer.style.display = 'block';
            this.populateUpgrades();
        }
        // Highlight active button
        this.shopPanel.querySelectorAll('.shop-toggle-button').forEach(button => {
            if (button.textContent.toLowerCase() === this.currentView) {
                button.style.backgroundColor = '#555';
            } else {
                button.style.backgroundColor = '#333';
            }
        });
    }

    setupEventListeners() {
        // Close button already handled in index.html
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hide();
            }
        });
    }

    populateShopItems() {
        this.shopItemsContainer.innerHTML = ''; // Clear previous items

        // Add seeds from gameState.plantSystem.seedsData
        if (this.gameState.plantSystem && this.gameState.plantSystem.seedsData) {
            Object.values(this.gameState.plantSystem.seedsData).forEach(seed => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'shop-item';
                itemDiv.innerHTML = `
                    <h3>${seed.displayName}</h3>
                    <p>Rarity: ${seed.rarity}</p>
                    <p>Price: $${seed.basePrice.toFixed(2)}</p>
                    <p>In Inventory: ${this.gameState.economySystem.inventory[seed.id] || 0}</p>
                    <button class="buy-button" data-item-id="${seed.id}" data-item-price="${seed.basePrice}" ${this.gameState.money < seed.basePrice ? 'disabled' : ''}>Buy</button>
                `;
                this.shopItemsContainer.appendChild(itemDiv);
            });
        }

        // Add fertilizer (hardcoded for now)
        const fertilizerItemDiv = document.createElement('div');
        fertilizerItemDiv.className = 'shop-item';
        fertilizerItemDiv.innerHTML = `
            <h3>Fertilizer</h3>
            <p>Increases growth rate.</p>
            <p>Price: $10.00</p>
            <p>In Inventory: ${this.gameState.economySystem.inventory['fertilizer'] || 0}</p>
            <button class="buy-button" data-item-id="fertilizer" data-item-price="10" ${this.gameState.money < 10 ? 'disabled' : ''}>Buy</button>
        `;
        this.shopItemsContainer.appendChild(fertilizerItemDiv);

        // Add water can (hardcoded for now)
        const waterCanItemDiv = document.createElement('div');
        waterCanItemDiv.className = 'shop-item';
        waterCanItemDiv.innerHTML = `
            <h3>Water Can</h3>
            <p>Allows you to water plants.</p>
            <p>Price: $20.00</p>
            <p>In Inventory: ${this.gameState.economySystem.inventory['water_can'] || 0}</p>
            <button class="buy-button" data-item-id="water_can" data-item-price="20" ${this.gameState.money < 20 || this.gameState.economySystem.inventory['water_can'] > 0 ? 'disabled' : ''}>Buy</button>
        `;
        this.shopItemsContainer.appendChild(waterCanItemDiv);

        // Add a message display area
        let messageDisplay = document.getElementById('shop-message');
        if (!messageDisplay) {
            messageDisplay = document.createElement('div');
            messageDisplay.id = 'shop-message';
            messageDisplay.style.cssText = `
                color: white;
                background: rgba(0, 0, 0, 0.7);
                padding: 5px;
                margin-top: 10px;
                border-radius: 3px;
                text-align: center;
                display: none;
            `;
            this.shopPanel.appendChild(messageDisplay);
        }

        // Add event listeners to buy buttons
        this.shopItemsContainer.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const itemId = event.target.dataset.itemId;
                const itemPrice = parseFloat(event.target.dataset.itemPrice);
                const success = this.gameState.economySystem.buyItem(itemId, itemPrice);
                if (success) {
                    this.showMessage(`Bought ${this.getItemDisplayName(itemId)}!`, 'green');
                } else {
                    this.showMessage(`Not enough money for ${this.getItemDisplayName(itemId)}.`, 'red');
                }
                // Re-populate to update any counts or disable buttons if needed
                this.populateShopItems(); 
            });
        });
    }

    populateUpgrades() {
        this.shopUpgradesContainer.innerHTML = ''; // Clear previous upgrades
        this.shopUpgradesContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            max-height: 400px; /* Limit height for scrolling */
            overflow-y: auto;
            padding: 10px;
        `;

        if (this.gameState.economySystem && this.gameState.economySystem.availableUpgradesData) {
            this.gameState.economySystem.availableUpgradesData.forEach(upgrade => {
                const upgradeDiv = document.createElement('div');
                upgradeDiv.className = 'shop-item upgrade-item'; // Use shop-item styling + upgrade-item specific
                const purchased = this.gameState.economySystem.upgrades[upgrade.id]?.level > 0; // Check if any level is purchased
                const canAfford = this.gameState.money >= upgrade.cost;
                const isDisabled = purchased || !canAfford || (upgrade.prerequisite && this.gameState.economySystem.upgrades[upgrade.prerequisite]?.level === 0);

                upgradeDiv.innerHTML = `
                    <h3>${upgrade.name}</h3>
                    <p>${upgrade.description}</p>
                    <p>Cost: $${upgrade.cost.toFixed(2)}</p>
                    <button class="buy-upgrade-button" data-upgrade-id="${upgrade.id}" data-upgrade-cost="${upgrade.cost}" ${isDisabled ? 'disabled' : ''}>
                        ${purchased ? 'Purchased' : 'Buy'}
                    </button>
                `;
                this.shopUpgradesContainer.appendChild(upgradeDiv);
            });
        }

        this.shopUpgradesContainer.querySelectorAll('.buy-upgrade-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const upgradeId = event.target.dataset.upgradeId;
                const upgradeCost = parseFloat(event.target.dataset.upgradeCost);
                const success = this.gameState.economySystem.buyUpgrade(upgradeId, upgradeCost);
                if (success) {
                    this.showMessage(`Upgraded ${this.getItemDisplayName(upgradeId)}!`, 'green');
                } else {
                    this.showMessage(`Cannot afford ${this.getItemDisplayName(upgradeId)}.`, 'red');
                }
                this.updateView(); // Refresh view after purchase
            });
        });
    }

    showMessage(message, color = 'white') {
        const messageDisplay = document.getElementById('shop-message');
        if (messageDisplay) {
            messageDisplay.textContent = message;
            messageDisplay.style.color = color;
            messageDisplay.style.display = 'block';
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                messageDisplay.style.display = 'none';
            }, 3000); // Hide after 3 seconds
        }
    }

    getItemDisplayName(itemId) {
        // Helper to get display name from seedsData or for hardcoded items
        const seed = this.gameState.plantSystem.seedsData.find(s => s.id === itemId);
        if (seed) return seed.displayName;
        if (itemId === 'fertilizer') return 'Fertilizer';
        if (itemId === 'water_can') return 'Water Can';
        return itemId;
    }

    show() {
        // Refresh items and upgrades when showing
        this.updateView(); 
        this.shopPanel.style.display = 'flex';
        this.gameState.interactionSystem.hideInteractionPrompt(); // Hide interaction prompt
    }

    hide() {
        this.shopPanel.style.display = 'none';
        this.gameState.interactionSystem.showInteractionPrompt(); // Show interaction prompt
    }
}
