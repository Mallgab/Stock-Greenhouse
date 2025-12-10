import * as THREE from 'three/build/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.speed = 0.1;
        this.mesh = this.createPlayerMesh();
        this.shadow = this.createShadow();
        this.scene.add(this.mesh);
        this.scene.add(this.shadow);

        this.keys = {
            w: false, a: false, s: false, d: false,
            arrowup: false, arrowleft: false, arrowdown: false, arrowright: false
        };

        this.setupInput();

        // Collision bounds (assuming greenhouse is 20x20 centered at 0,0)
        this.minX = -9; // Approx inner bounds
        this.maxX = 9;
        this.minZ = -9;
        this.maxZ = 9;

        this.animationTimer = 0;
        this.bobbingSpeed = 0.05;
        this.bobbingHeight = 0.05;
    }

    createPlayerMesh() {
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 }); // Green body
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75; // Stand on the ground

        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Yellow head
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8; // On top of body

        const playerGroup = new THREE.Group();
        playerGroup.add(body);
        playerGroup.add(head);

        playerGroup.position.set(0, 0, 0);
        return playerGroup;
    }

    createShadow() {
        const shadowGeometry = new THREE.CircleGeometry(0.5, 32);
        const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01; // Slightly above the floor to avoid z-fighting
        return shadow;
    }

    setupInput() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });
    }

    update(deltaTime) {
        let moveX = 0;
        let moveZ = 0;

        // Isometric movement logic (adjust these vectors based on desired camera angle)
        // Assuming camera looks from top-right towards bottom-left
        // W: towards upper-left of world
        // A: towards bottom-left of world
        // S: towards bottom-right of world
        // D: towards upper-right of world

        // These vectors might need tweaking once CameraSystem is finalized
        const forwardIso = new THREE.Vector3(-1, 0, -1).normalize(); // Roughly upper-left
        const backwardIso = new THREE.Vector3(1, 0, 1).normalize();   // Roughly bottom-right
        const leftIso = new THREE.Vector3(-1, 0, 1).normalize();      // Roughly bottom-left
        const rightIso = new THREE.Vector3(1, 0, -1).normalize();     // Roughly upper-right

        let isMoving = false;

        if (this.keys.w || this.keys.arrowup) {
            moveX += forwardIso.x;
            moveZ += forwardIso.z;
            isMoving = true;
        }
        if (this.keys.s || this.keys.arrowdown) {
            moveX += backwardIso.x;
            moveZ += backwardIso.z;
            isMoving = true;
        }
        if (this.keys.a || this.keys.arrowleft) {
            moveX += leftIso.x;
            moveZ += leftIso.z;
            isMoving = true;
        }
        if (this.keys.d || this.keys.arrowright) {
            moveX += rightIso.x;
            moveZ += rightIso.z;
            isMoving = true;
        }

        if (isMoving) {
            // Normalize combined movement vector
            const moveVector = new THREE.Vector3(moveX, 0, moveZ).normalize();
            this.mesh.position.x += moveVector.x * this.speed;
            this.mesh.position.z += moveVector.z * this.speed;

            // Simple bobbing animation
            this.animationTimer += this.bobbingSpeed;
            this.mesh.position.y = Math.sin(this.animationTimer) * this.bobbingHeight + 0.75;

            // Update player rotation to face movement direction (optional, but good for visual feedback)
            const angle = Math.atan2(moveVector.x, moveVector.z);
            this.mesh.rotation.y = angle;

        } else {
            // Reset to idle position if not moving
            this.mesh.position.y = 0.75;
            this.animationTimer = 0; // Reset timer for smoother start next time
        }

        // Collision detection
        this.mesh.position.x = Math.max(this.minX, Math.min(this.maxX, this.mesh.position.x));
        this.mesh.position.z = Math.max(this.minZ, Math.min(this.maxZ, this.mesh.position.z));

        // Update shadow position
        this.shadow.position.x = this.mesh.position.x;
        this.shadow.position.z = this.mesh.position.z;
    }

    getPlayerMesh() {
        return this.mesh;
    }
}
