let hand_results;
let cam = null;
let drawingLayer;
let penDown = false;
let prevPos = null;
let lastGestureTime = 0;

let appState = "splash";
let splashImg, legend;

let colors = [
    [255, 80, 180],
    [80, 150, 255],
    [80, 220, 150],
    [255, 80, 80],
    [255, 210, 50],
];
let colorIndex = 0;
let brushSize = 10;

let gestureBuffer = [];
let GESTURE_FRAMES = 14;

const BTN = { x: 0.48, y: 0.43, w: 0.38, h: 0.16 };

function preload() {
    splashImg = loadImage("FingerpaintCV.png");
    legend = loadImage("legend.png");
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);

    splashImg.resize(width, height);

    drawingLayer = createGraphics(width, height);
    drawingLayer.clear();

    gotHands = function (results) {
        hand_results = results;
    };

    if (window.setCameraStreamToMediaPipe) {
        cam = createCapture(VIDEO);
        cam.size(width, height);
        cam.hide();
        cam.elt.onloadedmetadata = function () {
            window.setCameraStreamToMediaPipe(cam.elt);
        };
    }
}

function getStableGesture() {
    let counts = {};
    for (let g of gestureBuffer) counts[g] = (counts[g] || 0) + 1;
    let top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return (top && top[1] >= GESTURE_FRAMES * 0.6) ? top[0] : "none";
}

function draw() {
    if (appState === "splash") {
        drawSplash();
    } else {
        drawApp();
    }
}

function mousePressed() {
    if (appState === "splash") {
        let bx = BTN.x * width;
        let by = BTN.y * height;
        let bw = BTN.w * width;
        let bh = BTN.h * height;
        if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
            appState = "drawing";
        }
    }
}

function touchMoved() {
    return false;
}

function mouseWheel(event) {
    return false;
}

// -- Splash --
function drawSplash() {
    background(255);
    image(splashImg, 0, 0, width, height);

    let bx = BTN.x * width;
    let by = BTN.y * height;
    let bw = BTN.w * width;
    let bh = BTN.h * height;

    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
        noStroke();
        fill(255, 255, 255, 60);
        rect(bx, by, bw, bh, 30);
        cursor(HAND);
    } else {
        cursor(ARROW);
    }
}

// -- Drawing App --
function drawApp() {
    background(255);

    if (cam) {
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, 110);
        image(cam, 0, 0, width, height);
        noTint();
        pop();
    }

    image(drawingLayer, 0, 0);

    // Legend
    imageMode(CENTER);
    image(legend, width/2+width/4, height/20, width/1.5, height/1.5);
    imageMode(CORNER);

    if (hand_results && hand_results.landmarks) {
        for (const landmarks of hand_results.landmarks) {
            drawHand(landmarks);
            let gesture = getGesture(landmarks);

            gestureBuffer.push(gesture);
            if (gestureBuffer.length > GESTURE_FRAMES) gestureBuffer.shift();

            let stableGesture = getStableGesture();

            if (stableGesture === "draw") {
                let x = width - landmarks[8].x * width;
                let y = landmarks[8].y * height;

                let c = colors[colorIndex];

                // Glow cursor
                noStroke();
                for (let r = brushSize + 18; r > brushSize; r -= 4) {
                    fill(c[0], c[1], c[2], map(r, brushSize, brushSize + 18, 80, 4));
                    circle(x, y, r * 2);
                }

                fill(c[0], c[1], c[2], 220);
                circle(x, y, brushSize * 2);

                fill(255, 255, 255, 140);
                circle(x - 3, y - 3, 5);

                if (!penDown) {
                    penDown = true;
                    prevPos = createVector(x, y);
                } else {
                    let newPos = createVector(
                        lerp(prevPos.x, x, 0.5),
                        lerp(prevPos.y, y, 0.5)
                    );

                    if (dist(prevPos.x, prevPos.y, newPos.x, newPos.y) > 2) {
                        drawingLayer.stroke(c[0], c[1], c[2]);
                        drawingLayer.strokeWeight(brushSize);
                        drawingLayer.strokeCap(ROUND);
                        drawingLayer.line(prevPos.x, prevPos.y, newPos.x, newPos.y);
                        prevPos = newPos;
                    }
                }
            } else {
                penDown = false;

                if (stableGesture === "palm" && millis() - lastGestureTime > 800) {
                    drawingLayer.clear();
                    lastGestureTime = millis();
                }

                if (stableGesture === "peace" && millis() - lastGestureTime > 800) {
                    colorIndex = (colorIndex + 1) % colors.length;
                    lastGestureTime = millis();
                }
            }
        }
    }

    // Color palette
    for (let i = 0; i < colors.length; i++) {
        let x = 50 + i * 70;
        let c = colors[i];

        fill(c[0], c[1], c[2]);

        if (i === colorIndex) {
            stroke(0);
            strokeWeight(4);
        } else {
            noStroke();
        }

        circle(x, 50, 50);
        noStroke();
    }
}

function getGesture(lm) {
    let threshold = 0.04;

    let indexUp  = lm[8].y  < lm[6].y  - threshold;
    let middleUp = lm[12].y < lm[10].y - threshold;
    let ringUp   = lm[16].y < lm[14].y - threshold;
    let pinkyUp  = lm[20].y < lm[18].y - threshold;

    let count = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    if (count === 1 && indexUp) return "draw";
    if (count === 2 && indexUp && middleUp) return "peace";
    if (count === 4) return "palm";
    if (count === 0) return "fist";

    return "none";
}

function drawHand(landmarks) {
    const CONNECTIONS = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
        [5,9],[9,13],[13,17]
    ];

    let c = colors[colorIndex];

    stroke(c[0], c[1], c[2]);
    strokeWeight(2);

    for (const [i, j] of CONNECTIONS) {
        line(
            width - landmarks[i].x * width,
            landmarks[i].y * height,
            width - landmarks[j].x * width,
            landmarks[j].y * height
        );
    }

    fill(c[0], c[1], c[2]);
    noStroke();

    for (let lm of landmarks) {
        circle(width - lm.x * width, lm.y * height, 10);
    }
}