let hand_results;
let cam = null;

let x, y, w, h;
let particles = [];

let gestureBuffer = [];
let GESTURE_FRAMES = 14;

const BTN = { x: 0.48, y: 0.43, w: 0.38, h: 0.16 };

function preload() {
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    for (let i = 0; i < 200; i++) {
        particles.push(new Particle());
    }

    gotHands = function (results) {
        hand_results = results;
    };

    if (window.setCameraStreamToMediaPipe) {
        cam = createCapture(VIDEO);
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
    drawApp();
}

function drawApp() {
    background(255);

    if (cam) {
        let a = max(width / cam.width, height / cam.height);
        w = cam.width * a;
        h = cam.height * a;
        x = (width - w) / 2;
        y = (height - h) / 2;

        push();
        translate(width, 0);
        scale(-1, 1);
        image(cam, x, y, w, h);
        pop();
    }

    if (hand_results && hand_results.landmarks.length > 0) {
        for (let p of particles) {
            p.display();
            p.update(width - hand_results.landmarks[0][8].x * w + x, hand_results.landmarks[0][8].y * h + y);
        }
        drawHand(hand_results.landmarks[0]);
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

    stroke(255);
    strokeWeight(2);

    for (const [i, j] of CONNECTIONS) {
        line(
            width - landmarks[i].x * w + x,
            landmarks[i].y * h + y,
            width - landmarks[j].x * w + x,
            landmarks[j].y * h + y
        );
    }

    noStroke();

    for (let lm of landmarks) {
        circle(width - lm.x * w + x, lm.y * h + y, 7);
    }
}

function touchMoved() {
    return false;
}

function mouseWheel(event) {
    return false;
}