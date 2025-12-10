export class EconomySystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.inventory = { // Initial inventory
            'AAPL': 0,
            'TSLA': 0,
            'fertilizer': 0,
            'water_can': 0 // Player starts without a water can
        };
        this.totalMoneyEarned = 0; // Initialize total money earned
        this.upgrades = {}; // Store purchased upgrades and their current levels/values
        this.availableUpgradesData = []; // To store data from upgrades.json
        this.loadUpgradesData(); // Load upgrade data
        console.log("Economy System initialized.");
    }

    async loadUpgradesData() {
        try {
            const response = await fetch('/src/data/upgrades.json');
            this.availableUpgradesData = await response.json();
            console.log("Upgrades data loaded:", this.availableUpgradesData);
            // Initialize upgrades to their base state or level 0
            this.availableUpgradesData.forEach(upgrade => {
                this.upgrades[upgrade.id] = { level: 0, ...upgrade }; // Store initial state
            });
        } catch (error) {
            console.error("Error loading upgrades data:", error);
        }
    }

    buyItem(itemId, price) {
        if (this.gameState.money >= price) {
            this.gameState.money -= price;
            this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
            console.log(`Bought ${itemId} for $${price}. Money: $${this.gameState.money}`);
            this.gameState.hud.update(); // Update HUD after transaction
            return true;
        }
        console.log(`Not enough money to buy ${itemId}. Need $${price}, have $${this.gameState.money}`);
        return false;
    }

    buyUpgrade(upgradeId, cost) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) {
            console.error(`Upgrade ${upgradeId} not found.`);
            return false;
        }

        if (this.gameState.money >= cost) {
            // Check prerequisites
            if (upgrade.prerequisite && this.upgrades[upgrade.prerequisite]?.level === 0) {
                console.log(`Prerequisite for ${upgrade.name} not met.`);
                return false;
            }

            this.gameState.money -= cost;
            upgrade.level++; // Increment level for this upgrade
            console.log(`Bought upgrade: ${upgrade.name}. New level: ${upgrade.level}. Money: $${this.gameState.money}`);
            this.gameState.hud.update(); // Update HUD

            // Apply upgrade effect
            if (upgrade.effect) {
                switch (upgrade.effect.type) {
                    case 'increase_max_plots':
                        this.gameState.greenhouseScene.setMaxPlots(this.gameState.greenhouseScene.maxPlots + upgrade.effect.value);
                        break;
                    case 'increase_fertilizer_quality':
                        // This will be read by PlantSystem
                        break;
                    case 'reduce_water_decay':
                        // This will be read by PlantSystem
                        break;
                    // Add other upgrade effects here
                }
            }
            return true;
        }
        console.log(`Not enough money to buy ${upgrade.name}. Need $${cost}, have $${this.gameState.money}`);
        return false;
    }

    sellPlant(plant) {
        const value = plant.currentPrice; // Get current plant value
        this.gameState.money += value;
        this.totalMoneyEarned += value; // Track total money earned
        console.log(`Sold ${plant.seedData.displayName} for $${value.toFixed(2)}. Money: $${this.gameState.money}`);
        this.gameState.hud.update(); // Update HUD after transaction
        
        // Remove plant from scene and plot
        plant.scene.remove(plant.mesh);
        plant.scene.remove(plant.billboard);
        plant.plot.occupied = false;
        plant.plot.plant = null;

        // Remove from plant system's active plants array
        const index = this.gameState.plantSystem.plants.indexOf(plant);
        if (index > -1) {
            this.gameState.plantSystem.plants.splice(index, 1);
        }
    }

    hasItem(itemId) {
        return (this.inventory[itemId] || 0) > 0;
    }

    useItem(itemId) {
        if (this.hasItem(itemId)) {
            this.inventory[itemId]--;
            console.log(`Used ${itemId}. Remaining: ${this.inventory[itemId]}`);
            return true;
        }
        console.log(`No ${itemId} in inventory.`);
        return false;
    }

    addItem(itemId, amount = 1) {
        this.inventory[itemId] = (this.inventory[itemId] || 0) + amount;
        console.log(`Added ${amount} ${itemId}. New total: ${this.inventory[itemId]}`);
        // No HUD update here, as inventory changes are displayed in ShopUI
    }

    addMoney(amount) {
        this.gameState.money += amount;
        this.totalMoneyEarned += amount; // Also track for quests
        console.log(`Added $${amount}. New total money: $${this.gameState.money}`);
        this.gameState.hud.update(); // Update HUD
    }
}
