import * as THREE from 'three/build/three.module.js';

export class CameraSystem {
    constructor(camera, playerMesh) {
        this.camera = camera;
        this.playerMesh = playerMesh;

        // Isometric camera offset and look-at point relative to player
        this.offset = new THREE.Vector3(10, 8, 10); // Adjust for desired isometric angle and distance
        this.lookAtOffset = new THREE.Vector3(0, 1, 0); // Look slightly above the player's base

        this.smoothingFactor = 0.05; // Controls how quickly camera follows player

        this.setInitialCameraPosition();
    }

    setInitialCameraPosition() {
        this.camera.position.copy(this.playerMesh.position).add(this.offset);
        this.camera.lookAt(this.playerMesh.position.clone().add(this.lookAtOffset));
    }

    update(deltaTime) {
        // Calculate target camera position
        const targetPosition = this.playerMesh.position.clone().add(this.offset);

        // Smoothly interpolate camera position towards target
        this.camera.position.lerp(targetPosition, this.smoothingFactor);

        // Always look at the player with the defined offset
        this.camera.lookAt(this.playerMesh.position.clone().add(this.lookAtOffset));
    }
}
