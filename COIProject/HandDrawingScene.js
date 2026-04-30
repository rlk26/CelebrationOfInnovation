class HandDrawingScene extends Scene {
    constructor(sceneManager, splashImg, legend) {
    super("HandDrawingScene");
    this.sm = sceneManager;

    // Assets passed in from preload
    this.splashImg = splashImg;
    this.legend = legend;

    // Scene state
    this.appState = "splash";
    this.drawingLayer = null;
    this.cam = null;
    this._handResults = null;

    this.colors = [
        [255, 80, 180],
        [80, 150, 255],
        [80, 220, 150],
        [255, 80, 80],
        [255, 210, 50],
    ];
    this.colorIndex = 0;
    this.brushSize = 10;

    this.penDown = false;
    this.prevPos = null;
    this.lastGestureTime = 0;
    this.gestureBuffer = [];
    this.GESTURE_FRAMES = 14;

    this.BTN = { x: 0.48, y: 0.43, w: 0.38, h: 0.16 };
}

enter() {
    // Re-init drawing layer each time scene is entered
    this.drawingLayer = createGraphics(width, height);
    this.drawingLayer.clear();

    // Reset state
    this.appState = "splash";
    this.penDown = false;
    this.prevPos = null;
    this.gestureBuffer = [];
    this.lastGestureTime = 0;

    // Hook MediaPipe
    window.gotHands = (results) => {
        this._handResults = results;
    };

    // Start camera
    if (window.setCameraStreamToMediaPipe) {
        this.cam = createCapture(VIDEO);
        this.cam.size(width, height);
        this.cam.hide();
        this.cam.elt.onloadedmetadata = () => {
            window.setCameraStreamToMediaPipe(this.cam.elt);
        };
    }
}

    exit() {
        // Stop camera and clear MediaPipe hook
        if (this.cam) {
            this.cam.remove();
            this.cam = null;
        }
        window.gotHands = null;
        this.appState = "splash"; // reset for re-entry
    }

    draw() {
        if (this.appState === "splash") {
            this._drawSplash();
        } else {
            this._drawApp();
        }
    }

    mouseMoved() {
        // Cursor handled inside _drawSplash via draw loop — nothing extra needed
    }

    mousePressed() {
        if (this.appState === "splash") {
            const { x, y, w, h } = this.BTN;
            let bx = x * width, by = y * height;
            let bw = w * width, bh = h * height;
            if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
                this.appState = "drawing";
            }
        }
    }

    // ─── Private ────────────────────────────────────────────────────────────────

    _drawSplash() {
        background(255);
        if (this.splashImg) image(this.splashImg, 0, 0, width, height);

        const { x, y, w, h } = this.BTN;
        let bx = x * width, by = y * height;
        let bw = w * width, bh = h * height;

        if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
            noStroke();
            fill(255, 255, 255, 60);
            rect(bx, by, bw, bh, 30);
            cursor(HAND);
        } else {
            cursor(ARROW);
        }
    }

    _drawApp() {
        background(255);

        if (this.cam) {
            push();
            translate(width, 0);
            scale(-1, 1);
            tint(255, 110);
            image(this.cam, 0, 0, width, height);
            noTint();
            pop();
        }

        image(this.drawingLayer, 0, 0);

        imageMode(CENTER);
        if (this.legend) image(this.legend, width / 2 + width / 4, height / 20, width / 1.5, height / 1.5);
        imageMode(CORNER);

        if (this._handResults && this._handResults.landmarks) {
            for (const landmarks of this._handResults.landmarks) {
                this._drawHand(landmarks);
                const gesture = this._getGesture(landmarks);

                this.gestureBuffer.push(gesture);
                if (this.gestureBuffer.length > this.GESTURE_FRAMES) this.gestureBuffer.shift();

                const stable = this._getStableGesture();

                if (stable === "draw") {
                    this._handleDraw(landmarks);
                } else {
                    this.penDown = false;

                    if (stable === "palm" && millis() - this.lastGestureTime > 800) {
                        this.drawingLayer.clear();
                        this.lastGestureTime = millis();
                    }
                    if (stable === "peace" && millis() - this.lastGestureTime > 800) {
                        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
                        this.lastGestureTime = millis();
                    }
                }
            }
        }

        this._drawPalette();
    }

    _handleDraw(landmarks) {
        let x = width - landmarks[8].x * width;
        let y = landmarks[8].y * height;
        let c = this.colors[this.colorIndex];

        // Glow cursor
        noStroke();
        for (let r = this.brushSize + 18; r > this.brushSize; r -= 4) {
            fill(c[0], c[1], c[2], map(r, this.brushSize, this.brushSize + 18, 80, 4));
            circle(x, y, r * 2);
        }
        fill(c[0], c[1], c[2], 220);
        circle(x, y, this.brushSize * 2);
        fill(255, 255, 255, 140);
        circle(x - 3, y - 3, 5);

        if (!this.penDown) {
            this.penDown = true;
            this.prevPos = createVector(x, y);
        } else {
            let newPos = createVector(
                lerp(this.prevPos.x, x, 0.5),
                lerp(this.prevPos.y, y, 0.5)
            );
            if (dist(this.prevPos.x, this.prevPos.y, newPos.x, newPos.y) > 2) {
                this.drawingLayer.stroke(c[0], c[1], c[2]);
                this.drawingLayer.strokeWeight(this.brushSize);
                this.drawingLayer.strokeCap(ROUND);
                this.drawingLayer.line(this.prevPos.x, this.prevPos.y, newPos.x, newPos.y);
                this.prevPos = newPos;
            }
        }
    }

    _drawPalette() {
        for (let i = 0; i < this.colors.length; i++) {
            let c = this.colors[i];
            fill(c[0], c[1], c[2]);
            if (i === this.colorIndex) { stroke(0); strokeWeight(4); }
            else noStroke();
            circle(50 + i * 70, 50, 50);
            noStroke();
        }
    }

    _getStableGesture() {
        let counts = {};
        for (let g of this.gestureBuffer) counts[g] = (counts[g] || 0) + 1;
        let top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return (top && top[1] >= this.GESTURE_FRAMES * 0.6) ? top[0] : "none";
    }

    _getGesture(lm) {
        const threshold = 0.04;
        const indexUp  = lm[8].y  < lm[6].y  - threshold;
        const middleUp = lm[12].y < lm[10].y - threshold;
        const ringUp   = lm[16].y < lm[14].y - threshold;
        const pinkyUp  = lm[20].y < lm[18].y - threshold;
        const count = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

        if (count === 1 && indexUp)              return "draw";
        if (count === 2 && indexUp && middleUp)  return "peace";
        if (count === 4)                         return "palm";
        if (count === 0)                         return "fist";
        return "none";
    }

    _drawHand(landmarks) {
        const CONNECTIONS = [
            [0,1],[1,2],[2,3],[3,4],
            [0,5],[5,6],[6,7],[7,8],
            [0,9],[9,10],[10,11],[11,12],
            [0,13],[13,14],[14,15],[15,16],
            [0,17],[17,18],[18,19],[19,20],
            [5,9],[9,13],[13,17]
        ];
        let c = this.colors[this.colorIndex];
        stroke(c[0], c[1], c[2]);
        strokeWeight(2);
        for (const [i, j] of CONNECTIONS) {
            line(
                width - landmarks[i].x * width, landmarks[i].y * height,
                width - landmarks[j].x * width, landmarks[j].y * height
            );
        }
        fill(c[0], c[1], c[2]);
        noStroke();
        for (let lm of landmarks) {
            circle(width - lm.x * width, lm.y * height, 10);
        }
    }
}