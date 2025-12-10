export class PlantInspectorUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.inspectorPanel = document.getElementById('plant-inspector-ui');
        this.plantDetailsContainer = document.getElementById('plant-details');
        this.inspectorPanel.style.display = 'none'; // Hidden by default

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hide();
            }
        });
    }

    show(plant) {
        this.updatePlantDetails(plant);
        this.inspectorPanel.style.display = 'flex';
    }

    hide() {
        this.inspectorPanel.style.display = 'none';
    }

    updatePlantDetails(plant) {
        if (!plant) {
            this.plantDetailsContainer.innerHTML = '<p>Select a plant to inspect.</p>';
            return;
        }

        const percentageChange = ((plant.currentPrice - plant.seedData.basePrice) / plant.seedData.basePrice) * 100;
        const changeColor = percentageChange >= 0 ? 'green' : 'red';

        // Determine button states
        const hasWaterCan = this.gameState.economySystem.hasItem('water_can');
        const canWater = hasWaterCan && plant.growthBuffs.water < 3;
        const hasFertilizer = this.gameState.economySystem.hasItem('fertilizer');
        const canFertilize = hasFertilizer && plant.growthBuffs.fertilizer < 3;
        const canSell = plant.growthStage >= 2; // Can sell if grown a bit

        // Basic details
        let detailsHtml = `
            <h2>${plant.seedData.displayName}</h2>
            <div class="plant-stats">
                <p>Current Price: $<span style="color: ${changeColor};">${plant.currentPrice.toFixed(2)}</span></p>
                <p>% Change: <span style="color: ${changeColor};">${percentageChange.toFixed(2)}%</span></p>
                <p>Growth Stage: <span>${plant.growthStage + 1} / 5</span></p>
                <p>Water Buff: <span class="buff-value">${plant.growthBuffs.water}</span></p>
                <p>Fertilizer Buff: <span class="buff-value">${plant.growthBuffs.fertilizer}</span></p>
            </div>
        `;

        // Action buttons
        detailsHtml += `
            <div class="plant-actions">
                <button id="water-plant-button" ${!canWater ? 'disabled' : ''}>Water ${!hasWaterCan ? '(Need can)' : canWater ? '' : '(Max buff)'}</button>
                <button id="fertilize-plant-button" ${!canFertilize ? 'disabled' : ''}>Fertilize ${!hasFertilizer ? '(Need fertilizer)' : canFertilize ? '' : '(Max buff)'}</button>
                <button id="sell-plant-button" ${!canSell ? 'disabled' : ''}>Sell ($${plant.currentPrice.toFixed(2)})</button>
            </div>
        `;

        // Mini graph for inspector (larger version)
        detailsHtml += '<div class="plant-inspector-graph-container"><h4>Price History:</h4><canvas id="plant-inspector-chart" width="300" height="150"></canvas></div>';

        this.plantDetailsContainer.innerHTML = detailsHtml;

        // Add event listeners for action buttons
        document.getElementById('water-plant-button')?.addEventListener('click', () => {
            this.gameState.interactionSystem.waterPlant(plant);
            this.updatePlantDetails(plant); // Refresh details
        });

        document.getElementById('fertilize-plant-button')?.addEventListener('click', () => {
            this.gameState.interactionSystem.applyFertilizer(plant);
            this.updatePlantDetails(plant); // Refresh details
        });

        document.getElementById('sell-plant-button')?.addEventListener('click', () => {
            this.gameState.economySystem.sellPlant(plant);
            this.hide(); // Close inspector after selling
        });

        // Render chart using canvas element
        const chartCanvas = document.getElementById('plant-inspector-chart');
        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            this.renderChart(ctx, plant.priceHistory);
        }
    }

    renderChart(ctx, history) {
        // Simple line chart rendering
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (history.length < 2) {
            ctx.fillText("Not enough data", ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const padding = 20;
        const chartWidth = ctx.canvas.width - padding * 2;
        const chartHeight = ctx.canvas.height - padding * 2;

        const minVal = Math.min(...history);
        const maxVal = Math.max(...history);
        const range = maxVal - minVal;

        ctx.beginPath();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        // Draw X-axis
        ctx.moveTo(padding, ctx.canvas.height - padding);
        ctx.lineTo(ctx.canvas.width - padding, ctx.canvas.height - padding);
        // Draw Y-axis
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, ctx.canvas.height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        history.forEach((val, index) => {
            const x = padding + (index / (history.length - 1)) * chartWidth;
            const y = ctx.canvas.height - padding - ((val - minVal) / range) * chartHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.strokeStyle = history[history.length - 1] >= history[0] ? 'green' : 'red';
        ctx.stroke();
    }
}
