import * as THREE from 'three';

// Helper to create a billboarded text label (copied from PlantSystem.js for now)
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

export class GreenhouseScene {
    constructor(scene) {
        this.scene = scene;
        this.plots = []; // Array to hold plot objects
        this.buildGreenhouse();
        this.createPlots();
    }

    buildGreenhouse() {
        // Floor
        const floorGeometry = new THREE.BoxGeometry(20, 0.5, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Warm brown
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.25;
        this.scene.add(floor);

        // Walls (simple colored planes for now)
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.6 }); // Light blue glass

        // Back wall
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 0.2), wallMaterial);
        backWall.position.set(0, 2.5, -10);
        this.scene.add(backWall);

        // Front wall (invisible for camera)
        const frontWall = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 0.2), wallMaterial);
        frontWall.position.set(0, 2.5, 10);
        // this.scene.add(frontWall); // Don't add to scene for now to allow viewing inside

        // Left wall
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 20), wallMaterial);
        leftWall.position.set(-10, 2.5, 0);
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 20), wallMaterial);
        rightWall.position.set(10, 2.5, 0);
        this.scene.add(rightWall);

        // Roof (simple plane)
        const roofGeometry = new THREE.BoxGeometry(20, 0.2, 20);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.6 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 5;
        this.scene.add(roof);

        // Shop counter
        const counterGeometry = new THREE.BoxGeometry(2, 1, 1);
        const counterMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Light wood-like color
        this.shopCounter = new THREE.Mesh(counterGeometry, counterMaterial);
        this.shopCounter.position.set(0, 0.5, -8); // Position at the back of the greenhouse
        this.scene.add(this.shopCounter);

        // Create SHOP sign billboard
        const signCanvas = createTextCanvas("SHOP", 'white', 'rgba(0,0,0,0.7)');
        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true, side: THREE.DoubleSide });
        const signPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(signCanvas.width / 100, signCanvas.height / 100),
            signMaterial
        );
        signPlane.position.set(0, 1.8, -8); // Position above the counter
        this.shopSign = signPlane; // Store sign for potential updates (e.g., always face camera)
        this.scene.add(this.shopSign);

        console.log("Greenhouse built.");
    }

    updateShopSignToCamera(cameraPosition) {
        if (this.shopSign) {
            this.shopSign.lookAt(cameraPosition);
        }
    }

    // Added maxPlots property and setMaxPlots method
    maxPlots = 1; // Start with 1 accessible plot, others are locked.

    setMaxPlots(count) {
        this.maxPlots = count;
        this.updatePlotInteractivity();
        console.log(`Max plots set to: ${this.maxPlots}`);
    }

    updatePlotInteractivity() {
        this.plots.forEach((plot, index) => {
            if (index < this.maxPlots) {
                // Only unlock if it's currently locked (not the initial plot_1)
                if (plot.locked) {
                    plot.locked = false;
                    plot.interactive = true;
                    plot.mesh.material.color.set(0x5C4033); // Change to unlocked color
                    console.log(`Plot ${plot.id} unlocked.`);
                }
            } else {
                // Ensure plots beyond maxPlots are locked
                plot.locked = true;
                plot.interactive = false;
                plot.mesh.material.color.set(0x808080); // Gray
            }
        });
    }

    createPlots() {
        // Reset plots array for dynamic creation
        this.plots = [];

        const plotSize = 1.5;
        const plotSpacing = 2.0;

        const soilGeometry = new THREE.BoxGeometry(plotSize, 0.2, plotSize);
        const soilMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4033 }); // Dark brown soil
        const lockedSoilMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 }); // Gray

        // Define all possible plot positions and their IDs (e.g., a 3x3 grid)
        const allPlotPositions = [
            { x: 0, z: 0, id: 'plot_1' }, // Center plot (initially unlocked)
            { x: -plotSpacing, z: 0, id: 'plot_2' },
            { x: plotSpacing, z: 0, id: 'plot_3' },
            { x: 0, z: -plotSpacing, id: 'plot_4' },
            { x: 0, z: plotSpacing, id: 'plot_5' },
            { x: -plotSpacing, z: -plotSpacing, id: 'plot_6' },
            { x: -plotSpacing, z: plotSpacing, id: 'plot_7' },
            { x: plotSpacing, z: -plotSpacing, id: 'plot_8' },
            { x: plotSpacing, z: plotSpacing, id: 'plot_9' },
        ];

        allPlotPositions.forEach((pos, index) => {
            const isInitialUnlocked = false; // ALL plots start locked
            const material = isInitialUnlocked ? soilMaterial : lockedSoilMaterial;
            const plotMesh = new THREE.Mesh(soilGeometry, material);
            plotMesh.position.set(pos.x, 0.1, pos.z);
            this.scene.add(plotMesh);

            const isLocked = true; // All plots are initially locked
            const isInteractive = false; // All plots are initially non-interactive

            this.plots.push({ id: pos.id, mesh: plotMesh, occupied: false, plant: null, interactive: isInteractive, locked: isLocked });
        });

        // Ensure initial maxPlots setting correctly updates interactivity
        // This will effectively do nothing at start, as maxPlots is 1 and all plots are locked.
        // The unlocking will be handled by quests.
        this.setMaxPlots(this.maxPlots); 

        console.log("Plots created.");
    }

    // Removed the old unlockPlot as updatePlotInteractivity handles it based on maxPlots
    // However, the QuestSystem explicitly calls unlockPlot(plotId) so we need to retain it
    unlockPlot(plotId) {
        const plot = this.plots.find(p => p.id === plotId);
        if (plot && plot.locked) {
            plot.locked = false;
            plot.interactive = true;
            plot.mesh.material.color.set(0x5C4033); // Change to unlocked color
            console.log(`Plot ${plotId} unlocked.`);
            this.updatePlotInteractivity(); // Re-evaluate all plots
            return true;
        }
        return false;
    }
}
