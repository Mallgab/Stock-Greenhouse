export class TimeSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.secondsPerGameHour = 0.5; // 1 real second = 2 game hours for faster testing
        this.elapsedTime = 0; // Tracks real time elapsed since last game hour update

        console.log(`Day ${this.gameState.day}, Hour ${this.gameState.hour}:00`);
    }

    update(deltaTime = 1 / 60) { // deltaTime is typically fixed at 1/60 for 60 FPS
        let dayEnded = false;
        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= this.secondsPerGameHour) {
            this.gameState.hour++;
            this.elapsedTime -= this.secondsPerGameHour;

            if (this.gameState.hour >= 24) {
                this.gameState.hour = 0;
                this.gameState.day++;
                this.onDayEnd();
                dayEnded = true;
            }
            // console.log(`Day ${this.gameState.day}, Hour ${this.gameState.hour}:00`);
        }
        return dayEnded;
    }

    onDayEnd() {
        // Instead of callbacks, other systems will react to gameState.day change
        // The main loop will call update on other systems after this.
    }

    getCurrentDay() {
        return this.gameState.day;
    }
}
