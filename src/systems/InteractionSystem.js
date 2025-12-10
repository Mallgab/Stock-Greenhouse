import * as THREE from 'three/build/three.module.js';

export class InteractionSystem {
    constructor(camera, domElement, gameState) {
        this.camera = camera;
        this.domElement = domElement;
        this.gameState = gameState;
        this.raycaster = new THREE.Raycaster();
        this.player = gameState.player;
        this.greenhouseScene = gameState.greenhouseScene;
        this.plantSystem = gameState.plantSystem;
        this.economySystem = gameState.economySystem;

        this.interactionRadius = 2.0; // How close player needs to be to interact
        this.interactiveObject = null; // Currently highlighted interactive object
        this.interactionPrompt = document.createElement('div');
        this.interactionPrompt.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            display: none;
            pointer-events: none;
            font-size: 0.9em;
            transform: translate(-50%, -100%);
        `;
        document.body.appendChild(this.interactionPrompt);

        this.setupInput();

        console.log("Interaction System initialized.");
    }

    setupInput() {
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'e') { // 'E' key for interaction
                this.performInteraction();
            }
        });
    }

    findInteractiveObject() {
        let closestObject = null;
        let minDistance = this.interactionRadius;

        // Check plots
        this.greenhouseScene.plots.forEach(plot => {
            if (plot.interactive) {
                const distance = this.player.getPlayerMesh().position.distanceTo(plot.mesh.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestObject = { type: 'plot', object: plot };
                }
            }
        });

        // Check plants (if any)
        this.plantSystem.plants.forEach(plant => {
            const distance = this.player.getPlayerMesh().position.distanceTo(plant.mesh.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestObject = { type: 'plant', object: plant };
            }
        });

        // Check shop counter
        if (this.greenhouseScene.shopCounter) {
            const distance = this.player.getPlayerMesh().position.distanceTo(this.greenhouseScene.shopCounter.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestObject = { type: 'shop', object: this.greenhouseScene.shopCounter };
            }
        }

        this.interactiveObject = closestObject;
        this.updatePrompt();
    }

    updatePrompt() {
        if (this.interactiveObject) {
            let promptText = "";
            const obj = this.interactiveObject.object;
            const type = this.interactiveObject.type;

            if (type === 'plot') {
                if (obj.plant) {
                    promptText = "[E] Interact with plant";
                } else if (!obj.locked) {
                    if (this.economySystem.hasItem('AAPL')) {
                        promptText = "[E] Plant Apple Seed";
                    } else {
                        promptText = "Empty Plot (Need seeds)";
                    }
                } else {
                    promptText = "Locked Plot";
                }
            } else if (type === 'plant') {
                promptText = "[E] Inspect / Interact"; // More generic prompt
            } else if (type === 'shop') {
                promptText = "[E] Open Shop";
            }

            // Position prompt above the interactive object
            const objectPosition = new THREE.Vector3();
            // Use obj.getWorldPosition() directly if it's a THREE.Mesh, otherwise obj.mesh.getWorldPosition()
            if (obj.getWorldPosition) {
                obj.getWorldPosition(objectPosition);
            } else if (obj.mesh && obj.mesh.getWorldPosition) {
                obj.mesh.getWorldPosition(objectPosition);
            } else {
                console.warn("Interactive object has no valid mesh for position calculation:", obj);
                return; // Skip updating prompt if position can't be found
            }

            const screenPosition = objectPosition.project(this.camera);

            const x = (screenPosition.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPosition.y * 0.5 + 0.5) * window.innerHeight;

            this.interactionPrompt.style.left = `${x}px`;
            this.interactionPrompt.style.top = `${y}px`;
            this.interactionPrompt.textContent = promptText;
            this.interactionPrompt.style.display = 'block';
        } else {
            this.interactionPrompt.style.display = 'none';
        }
    }

    performInteraction() {
        if (!this.interactiveObject) return;

        const obj = this.interactiveObject.object;
        const type = this.interactiveObject.type;

        if (type === 'plot') {
            if (obj.plant) {
                // Interact with existing plant (for now, let's just water it)
                this.waterPlant(obj.plant);
            } else if (!obj.locked) {
                // Plant a seed
                if (this.economySystem.hasItem('AAPL')) {
                    this.economySystem.useItem('AAPL');
                    this.plantSystem.plantSeed(obj, 'AAPL');
                    this.updatePrompt(); // Update prompt after planting
                } else {
                    console.log("No Apple seeds in inventory.");
                }
            }
        } else if (type === 'plant') {
            console.log("Interacting with plant...");
            const plant = obj;
            this.gameState.plantInspectorUI.show(plant); // Always open inspector for plant interaction
            this.updatePrompt(); // Update prompt after opening inspector
        } else if (type === 'shop') {
            this.gameState.shopUI.show();
        }
    }

    waterPlant(plant) {
        if (this.economySystem.hasItem('water_can')) {
            if (plant.growthBuffs.water < 3) { // Max 3 waters for buff
                plant.growthBuffs.water++;
                console.log(`Watered ${plant.seedData.displayName}. Water buff: ${plant.growthBuffs.water}`);
            } else {
                console.log(`${plant.seedData.displayName} is already well-watered.`);
            }
        } else {
            console.log("Need a water can to water plants!");
        }
    }

    applyFertilizer(plant) {
        if (this.economySystem.hasItem('fertilizer')) {
            if (plant.growthBuffs.fertilizer < 3) { // Max 3 fertilizers for buff
                this.economySystem.useItem('fertilizer');
                plant.growthBuffs.fertilizer++;
                console.log(`Applied fertilizer to ${plant.seedData.displayName}. Fertilizer buff: ${plant.growthBuffs.fertilizer}`);
            } else {
                console.log(`${plant.seedData.displayName} is already well-fertilized.`);
            }
        } else {
            console.log("Need fertilizer to apply!");
        }
    }

    update(deltaTime) {
        if (!this.gameState.shopUI.shopPanel.style.display || this.gameState.shopUI.shopPanel.style.display === 'none') {
            this.findInteractiveObject();
        } else {
            this.hideInteractionPrompt(); // Ensure prompt is hidden if shop is open
        }
    }

    hideInteractionPrompt() {
        this.interactionPrompt.style.display = 'none';
    }

    showInteractionPrompt() {
        // This will be called by shopUI when it closes
        this.updatePrompt(); 
    }
}
