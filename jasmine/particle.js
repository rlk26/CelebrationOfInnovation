class Particle {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.vx = random(-5, 5);
        this.vy = random(-5, 5);
        this.r = 4;
        this.f = random(0.001, 0.007);
    }

    update(mx, my) {
        let dx = (mx - this.x);
        let dy = (my - this.y)

        let d = sqrt(dx * dx + dy * dy);

        this.force = constrain(this.f * d, 0, 2);

        let fx = dx / d * this.force;
        let fy = dy / d * this.force;

        this.vx = constrain(this.vx + fx, -10, 10);
        this.vy = constrain(this.vy + fy, -10, 10);
        
        this.x += this.vx;
        this.y += this.vy;
    }

    display() {
        noStroke();
        fill(255);
        ellipse(this.x, this.y, this.r, this.r);
    }
}