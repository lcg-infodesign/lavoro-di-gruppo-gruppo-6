class GestoreCella {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.easing = 0.1;
    }

    aggiornaSovraffollamento(valore, size) {
        if (valore > 100) {
            let spostamento = map(valore, 100, 200, 0, size * 0.5);
            this.targetX = spostamento * cos(2 * PI / 3);
            this.targetY = -spostamento * sin(2 * PI / 3);
        } else {
            this.targetX = 0;
            this.targetY = 0;
        }
    }

    aggiorna() {
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        this.x += dx * this.easing;
        this.y += dy * this.easing;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}
