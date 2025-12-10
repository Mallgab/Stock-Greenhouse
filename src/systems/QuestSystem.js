export class QuestSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.quests = [];
        this.questNotificationTimeout = null; // To manage auto-hide timeout
        this.initQuests();
    }

    initQuests() {
        this.quests = [
            {
                id: 'buy_first_seed',
                description: 'Buy your first seed, fertilizer, and a water can from the shop.',
                condition: () => (this.gameState.economySystem.inventory['AAPL'] > 0 || this.gameState.economySystem.inventory['TSLA'] > 0) && this.gameState.economySystem.inventory['fertilizer'] > 0 && this.gameState.economySystem.inventory['water_can'] > 0,
                reward: { type: 'money', amount: 50 },
                completed: false,
                active: true, // This quest is active from the start
                unlockedPlotId: 'plot_1', // Unlock plot_1 upon completion
            },
            {
                id: 'plant_first_seed',
                description: 'Plant a seed in the greenhouse.',
                condition: () => this.gameState.plantSystem.plants.length > 0,
                reward: { type: 'fertilizer', amount: 1 },
                completed: false,
                active: false,
                unlockedPlotId: null,
            },
            {
                id: 'grow_plant_value_100',
                description: 'Grow a plant to value $100.',
                condition: () => this.gameState.plantSystem.plants.some(plant => plant.currentPrice >= 100),
                reward: { type: 'money', amount: 100 },
                completed: false,
                active: false,
                unlockedPlotId: 'plot_2', // Unlock a specific plot
            },
            {
                id: 'earn_500_total',
                description: 'Earn $500 total.',
                condition: () => this.gameState.economySystem.totalMoneyEarned >= 500,
                reward: { type: 'fertilizer', amount: 2 },
                completed: false,
                active: false,
                unlockedPlotId: 'plot_3', // Unlock another specific plot
            },
        ];
        // Make the first quest active
        this.quests[0].active = true;
    }

    update(deltaTime) {
        let questActivity = false; // Flag to indicate if any quest was completed or activated

        this.quests.forEach(quest => {
            if (!quest.completed && quest.active) {
                if (quest.condition()) {
                    this.completeQuest(quest);
                    questActivity = true;
                }
            } else if (!quest.completed && !quest.active) {
                // Check if a previously inactive quest becomes active (e.g. initial quest)
                const previousActiveState = quest.active; // Store original state
                // Re-evaluate condition for quests that might become active without explicit unlock
                // For now, new quests only become active via sequential unlock, so this is minimal.
                // If we had other conditions for activation, they would go here.
                // For the first quest, it's active from the start, so it won't trigger here.
                if (quest.id === 'buy_first_seed' && quest.active && !previousActiveState) {
                    questActivity = true;
                }
            }
        });

        // If there was any quest activity, show the UI, and then set a timeout to hide it
        if (questActivity) {
            this.gameState.questUI.show();
            if (this.questNotificationTimeout) {
                clearTimeout(this.questNotificationTimeout);
            }
            this.questNotificationTimeout = setTimeout(() => {
                this.gameState.questUI.hide();
            }, 5000); // Hide after 5 seconds
        }

        // Update QuestUI to reflect current quest status (always do this to keep content fresh)
        this.gameState.questUI.updateQuestList(this.quests);
    }

    completeQuest(quest) {
        quest.completed = true;
        console.log(`Quest Completed: ${quest.description}`);

        // Apply reward
        if (quest.reward) {
            if (quest.reward.type === 'money') {
                this.gameState.economySystem.addMoney(quest.reward.amount);
                console.log(`Rewarded $${quest.reward.amount}`);
            } else if (quest.reward.type === 'fertilizer') {
                this.gameState.economySystem.addItem('fertilizer', quest.reward.amount);
                console.log(`Rewarded ${quest.reward.amount} fertilizer`);
            }
        }

        // Unlock next quest (simple sequential unlock for now)
        const currentIndex = this.quests.indexOf(quest);
        if (currentIndex < this.quests.length - 1) {
            this.quests[currentIndex + 1].active = true; // Activate next quest
            // No need to show UI explicitly here, update method handles it via questActivity flag.
        }

        // Unlock plot if specified
        if (quest.unlockedPlotId) {
            this.gameState.greenhouseScene.unlockPlot(quest.unlockedPlotId);
        }
    }

    getQuests() {
        return this.quests;
    }
}
