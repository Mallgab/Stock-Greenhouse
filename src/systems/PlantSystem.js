import * as THREE from 'three';

// Helper to create a billboarded text label
function createTextCanvas(text, textColor, backgroundColor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = "Bold 40px Arial";

    context.font = font;
    const metrics = context.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 40; // Approx height for 40px font

    canvas.width = textWidth + 20; // Add some padding
    canvas.height = textHeight + 20;

    context.font = font;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = textColor;
    context.strokeRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 5); // +5 for minor adjustment

    return canvas;
}

class Plant {
    constructor(scene, plot, seedData, gameState) {
        this.scene = scene;
        this.plot = plot;
        this.seedData = seedData;
        this.gameState = gameState; // <--- This line was crucial and already added in the previous fix!

        this.currentPrice = seedData.basePrice;
        this.priceHistory = [seedData.basePrice]; // For mini-graph
        this.growthStage = 0;
        this.growthBuffs = { water: 0, fertilizer: 0 }; // Temporary buffs

        this.mesh = null;
        this.billboard = null; // For floating UI

        this.initVisuals();
        this.updateVisuals();
        this.updateBillboard();
    }

    initVisuals() {
        // Placeholder plant model (cylinder with leaves)
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 8);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25; // On the soil

        const leavesGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 0.7; // Above the stem

        this.mesh = new THREE.Group();
        this.mesh.add(stem);
        this.mesh.add(leaves);
        this.mesh.position.copy(this.plot.mesh.position);
        this.mesh.position.y += 0.2; // Adjust to sit on top of the soil plot

        this.scene.add(this.mesh);

        // Create billboard container
        this.billboard = new THREE.Group();
        this.billboard.position.copy(this.mesh.position);
        this.billboard.position.y += 2; // Position above the plant
        this.scene.add(this.billboard);

        this.plot.occupied = true;
        this.plot.plant = this;
    }

    updateVisuals() {
        // Scale plant based on growth stage
        const scale = 0.5 + this.growthStage * 0.25; // Stages 0-4, scale from 0.5 to 1.5
        this.mesh.scale.set(scale, scale, scale);
    }

    updateBillboard() {
        // Clear previous billboard content
        while (this.billboard.children.length > 0) {
            this.billboard.remove(this.billboard.children[0]);
        }

        const percentageChange = ((this.currentPrice - this.seedData.basePrice) / this.seedData.basePrice) * 100;
        const changeColor = percentageChange >= 0 ? '#00FF00' : '#FF0000'; // Green or Red

        const priceText = `${this.seedData.displayName}: $${this.currentPrice.toFixed(2)} (${percentageChange.toFixed(2)}%)`;

        // Text billboard
        const textCanvas = createTextCanvas(priceText, 'white', 'rgba(0,0,0,0.7)');
        const textTexture = new THREE.CanvasTexture(textCanvas);
        const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
        const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(textCanvas.width / 100, textCanvas.height / 100),
            textMaterial
        );
        textPlane.position.y = 1.0; // Adjusted to be higher above the mini graph
        this.billboard.add(textPlane);

        // Mini stock graph (simple bar chart using thin boxes)
        const graphHeightScale = 0.01; // Scale factor for graph bars
        const graphWidth = 0.1;
        const graphSpacing = 0.15;
        const maxGraphPoints = 10;

        const displayHistory = this.priceHistory.slice(-maxGraphPoints); // Get last N points
        const minPrice = Math.min(...displayHistory);
        const maxPrice = Math.max(...displayHistory);
        const priceRange = maxPrice - minPrice;

        displayHistory.forEach((price, index) => {
            const normalizedPrice = priceRange > 0 ? (price - minPrice) / priceRange : 0.5; // Normalize price 0-1
            const barHeight = 0.1 + normalizedPrice * 0.8; // Min height + scaled height
            const barColor = index > 0 && price >= displayHistory[index - 1] ? 0x00FF00 : 0xFF0000; // Green/Red

            const barGeometry = new THREE.BoxGeometry(graphWidth, barHeight, 0.05);
            const barMaterial = new THREE.MeshBasicMaterial({ color: barColor });
            const bar = new THREE.Mesh(barGeometry, barMaterial);

            bar.position.x = (index - (displayHistory.length - 1) / 2) * graphSpacing; // Center the graph
            bar.position.y = barHeight / 2; // Position from base
            bar.position.z = 0;
            this.billboard.add(bar);
        });

        // Ensure billboard always faces the camera
        this.billboard.lookAt(new THREE.Vector3(0, 0, 0)); // Will be updated by CameraSystem or main loop to face actual camera
    }

    updateDaily(deltaTime) {
        // Price logic suggestion:
        // Introduce a larger random swing
        const randomFactorMagnitude = 10.0; // Can be adjusted: 10.0 means +/- 10% of current price as random daily change
        let randomDailyChange = (Math.random() * 2 - 1) * randomFactorMagnitude; // Random value between -randomFactorMagnitude and +randomFactorMagnitude

        // Combine base growth, random change, and buffs
        let dailyDelta = this.seedData.baseGrowthRate + randomDailyChange; // Base growth + random change

        // Apply fertilizer quality upgrade effect
        const fertilizerQualityUpgrade = this.gameState.economySystem.upgrades['fertilizer_quality_1'];
        if (fertilizerQualityUpgrade && fertilizerQualityUpgrade.level > 0) {
            dailyDelta += this.growthBuffs.fertilizer * 5.0 * (1 + fertilizerQualityUpgrade.effect.value * fertilizerQualityUpgrade.level);
        } else {
            dailyDelta += this.growthBuffs.fertilizer * 5.0; // Base fertilizer bonus
        }

        dailyDelta += this.growthBuffs.water * 2.0; // Increased water bonus impact

        this.currentPrice = this.currentPrice * (1 + dailyDelta / 100); // Apply percentage change
        this.currentPrice = Math.max(this.seedData.minPrice, Math.min(this.seedData.maxPrice, this.currentPrice));

        this.priceHistory.push(this.currentPrice);
        if (this.priceHistory.length > 20) {
            this.priceHistory.shift(); // Keep history to last 20 points
        }

        // Update growth stage based on price
        const normalizedPrice = (this.currentPrice - this.seedData.minPrice) / (this.seedData.maxPrice - this.seedData.minPrice);
        this.growthStage = Math.floor(normalizedPrice * 5); // 5 stages (0-4)
        if (this.growthStage > 4) this.growthStage = 4;

        this.updateVisuals();
        this.updateBillboard();

        // Decay buffs (simplified for now)
        const waterDecayUpgrade = this.gameState.economySystem.upgrades['water_can_upgrade_1'];
        let waterDecayRate = 1;
        if (waterDecayUpgrade && waterDecayUpgrade.level > 0) {
            waterDecayRate -= waterDecayUpgrade.effect.value * waterDecayUpgrade.level; // Reduce decay
            if (waterDecayRate < 0) waterDecayRate = 0; // Don't go below 0 decay
        }

        if (this.growthBuffs.water > 0) {
            this.growthBuffs.water = Math.max(0, this.growthBuffs.water - waterDecayRate);
        }
        if (this.growthBuffs.fertilizer > 0) {
            this.growthBuffs.fertilizer--;
        }
    }
}

export class PlantSystem {
    constructor(scene, gameState) { // Added gameState to constructor
        this.scene = scene;
        this.gameState = gameState; // Store gameState
        this.plants = [];
        this.seedsData = {};

        this.loadSeedsData();
    }

    async loadSeedsData() {
        try {
            const response = await fetch('/src/data/seeds.json');
            this.seedsData = await response.json();
        } catch (error) {
            console.error("Error loading seeds data:", error);
        }
    }

    plantSeed(plot, seedId) {
        const seedInfo = this.seedsData.find(seed => seed.id === seedId);
        if (plot && !plot.occupied && seedInfo) {
            const newPlant = new Plant(this.scene, plot, seedInfo, this.gameState); // Pass gameState
            this.plants.push(newPlant);
            return newPlant;
        }
        return null;
    }

    update(deltaTime) {
        // This method will be called in the main game loop
        // Individual plant daily updates are handled by TimeSystem callbacks

        // Make billboards face the camera (main camera will be passed here or accessed globally)
        // For now, assume a global camera access or pass it during update
        // We will need to pass the camera from main.js to update billboards correctly
    }

    updateBillboardsToCamera(cameraPosition) {
        this.plants.forEach(plant => {
            if (plant.billboard) {
                plant.billboard.lookAt(cameraPosition);
            }
        });
    }

    handleDayEnd(day) {
        this.plants.forEach(plant => {
            plant.updateDaily(day);
        });
    }
}
