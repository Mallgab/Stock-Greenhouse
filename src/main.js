import * as THREE from 'three/build/three.module.js';
import { GreenhouseScene } from './scene/GreenhouseScene.js';
import { Player } from './player/Player.js';
import { CameraSystem } from './systems/CameraSystem.js';
import { TimeSystem } from './systems/TimeSystem.js';
import { PlantSystem } from './systems/PlantSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { InteractionSystem } from './systems/InteractionSystem.js';
import { HUD } from './ui/HUD.js';
import { ShopUI } from './ui/ShopUI.js';
import { PlantInspectorUI } from './ui/PlantInspectorUI.js';
import { QuestUI } from './ui/QuestUI.js';
import { QuestSystem } from './systems/QuestSystem.js'; // Import QuestSystem

// Game state
const gameState = {
    money: 101,
    day: 1,
    hour: 0,
    player: null,
    greenhouseScene: null,
    cameraSystem: null,
    timeSystem: null,
    plantSystem: null,
    economySystem: null,
    interactionSystem: null,
    hud: null,
    shopUI: null, // Add shopUI to game state
    plantInspectorUI: null, // Add plantInspectorUI to game state
    questUI: null, // Add questUI to game state
    questSystem: null, // Add questSystem to game state
};

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('game-canvas') });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb); // Light blue sky color

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7).normalize();
scene.add(directionalLight);

// Initialize game components
async function initializeGame() {
    gameState.greenhouseScene = new GreenhouseScene(scene);
    gameState.player = new Player(scene);
    gameState.cameraSystem = new CameraSystem(camera, gameState.player.getPlayerMesh());
    gameState.timeSystem = new TimeSystem(gameState);
    gameState.plantSystem = new PlantSystem(scene, gameState); // Pass gameState to PlantSystem
    gameState.economySystem = new EconomySystem(gameState);
    gameState.interactionSystem = new InteractionSystem(camera, renderer.domElement, gameState);
    gameState.hud = new HUD(gameState);
    gameState.shopUI = new ShopUI(gameState);
    gameState.plantInspectorUI = new PlantInspectorUI(gameState); // Initialize PlantInspectorUI
    gameState.questUI = new QuestUI(gameState); // Initialize QuestUI
    gameState.questSystem = new QuestSystem(gameState); // Initialize QuestSystem

    // gameState.questUI.show(); // Removed: Quest UI will now pop up based on quest events

    await gameState.plantSystem.loadSeedsData(); // Ensure seeds data is loaded
    await gameState.economySystem.loadUpgradesData(); // Ensure upgrades data is loaded

    // Temporary: Plant an Apple seed in the center plot for MVP testing
    // gameState.plantSystem.plantSeed(gameState.greenhouseScene.plots[0], 'AAPL'); // Removed initial plant

    animate(); // Start the animation loop after initialization
}

initializeGame();

// Game loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta(); // Get delta time since last frame

    // Update systems
    gameState.player.update(deltaTime);
    gameState.cameraSystem.update(deltaTime);
    const dayEnded = gameState.timeSystem.update(deltaTime);
    if (dayEnded) {
        gameState.plantSystem.handleDayEnd(gameState.day - 1); // Pass the ended day
    }
    gameState.plantSystem.updateBillboardsToCamera(camera.position); // Update billboards to face camera
    gameState.greenhouseScene.updateShopSignToCamera(camera.position); // Update shop sign to face camera
    gameState.hud.update();
    gameState.interactionSystem.update(deltaTime);
    gameState.questSystem.update(deltaTime); // Update QuestSystem

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
