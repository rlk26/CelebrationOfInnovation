let current = 0;

function setup() {
    createCanvas(800, 600);
}

function draw() {
    background(220);
    if      (current === 1) drawScene1();
    else if (current === 2) drawScene2();
    else if (current === 3) drawScene3();
    else if (current === 4) drawScene4();
    else                    drawHome();
}

function keyPressed() {
    if      (key === '1') { exitScene4(); current = 1; }
    else if (key === '2') { exitScene4(); current = 2; }
    else if (key === '3') { exitScene4(); current = 3; }
    else if (key === '4') { enterScene4(); current = 4; }
    else if (key === '0') { exitScene4(); current = 0; }
}

// ─── Scenes 1-3 ──────────────────────────────────────────────────────────────
function drawHome() {
    background(220);
    fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18);
    text("Press 1, 2, 3, or 4 to switch scenes", width / 2, height / 2);
}

function drawScene1() { background(0); }
function drawScene2() { background(100); }
function drawScene3() { background(255); }

// ─── Scene 4 – Hand-drawing camera project ───────────────────────────────────
let hand_results;
let cam = null;
let drawingLayer;
let penDown = false;
let prevPos = null;
let colorIndex = 0;
let brushSize = 8;
let lastGestureTime = 0;
let scene4Ready = false;

const handColors = [
    [255, 0, 255],
    [0, 100, 255],
    [0, 255, 0],
    [255, 0, 0],
    [255, 255, 0]
];

const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17]
];

function enterScene4() {
    if (scene4Ready) return;
    scene4Ready = true;

    // Resize canvas to full display for the camera scene
    resizeCanvas(displayWidth, displayHeight);
    drawingLayer = createGraphics(width, height);
    drawingLayer.clear();

    // Hook into MediaPipe hand results
    gotHands = function (results) {
        hand_results = results;
    };

    // Start webcam and pipe it to MediaPipe
    if (window.setCameraStreamToMediaPipe) {
        cam = createCapture(VIDEO);
        cam.size(displayWidth, displayHeight);
        cam.hide();
        cam.elt.onloadedmetadata = function () {
            window.setCameraStreamToMediaPipe(cam.elt);
        };
    }
}

function exitScene4() {
    if (current !== 4) return;
    // Stop the webcam stream
    if (cam) {
        cam.remove();
        cam = null;
    }
    scene4Ready = false;
    hand_results = null;
    penDown = false;
    prevPos = null;
    drawingLayer = null;
    resizeCanvas(800, 600);
}

function drawScene4() {
    if (!scene4Ready) return;

    background(255);

    // Mirrored camera feed
    if (cam) {
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, 120);
        image(cam, 0, 0, width, height);
        pop();
    }

    // Drawing layer
    if (drawingLayer) image(drawingLayer, 0, 0);

    // Hand tracking + drawing logic
    if (hand_results && hand_results.landmarks) {
        for (const landmarks of hand_results.landmarks) {
            drawHandSkeleton(landmarks);
            let gesture = getGesture(landmarks);

            if (gesture === "draw") {
                let x = width - landmarks[8].x * width;
                let y = landmarks[8].y * height;

                if (!penDown) {
                    penDown = true;
                    prevPos = createVector(x, y);
                } else {
                    let newPos = createVector(lerp(prevPos.x, x, 0.5), lerp(prevPos.y, y, 0.5));
                    if (dist(prevPos.x, prevPos.y, newPos.x, newPos.y) > 3) {
                        drawingLayer.stroke(...handColors[colorIndex]);
                        drawingLayer.strokeWeight(brushSize);
                        drawingLayer.strokeCap(ROUND);
                        drawingLayer.line(prevPos.x, prevPos.y, newPos.x, newPos.y);
                        prevPos = newPos;
                    }
                }
            } else {
                penDown = false;

                if (gesture === "fist" && millis() - lastGestureTime > 500) {
                    drawingLayer.clear();
                    lastGestureTime = millis();
                }
                if (gesture === "peace" && millis() - lastGestureTime > 500) {
                    colorIndex = (colorIndex + 1) % handColors.length;
                    lastGestureTime = millis();
                }
            }
        }
    }

    // Color palette HUD
    for (let i = 0; i < handColors.length; i++) {
        let x = 50 + i * 100;
        fill(...handColors[i]);
        if (i === colorIndex) { stroke(0); strokeWeight(4); }
        else                  { noStroke(); }
        circle(x, 50, 50);
    }
    noStroke();

    // Instructions overlay
    fill(0, 0, 0, 160); noStroke();
    rect(0, height - 40, width, 40);
    fill(255); textAlign(LEFT, CENTER); textSize(13);
    text("☝ Draw  ✌ Next colour  ✊ Clear  |  Press 0-3 to switch scene", 10, height - 20);
}

// ─── Hand helpers ─────────────────────────────────────────────────────────────
function getGesture(lm) {
    let indexUp  = lm[8].y  < lm[6].y;
    let middleUp = lm[12].y < lm[10].y;
    let ringUp   = lm[16].y < lm[14].y;
    let pinkyUp  = lm[20].y < lm[18].y;
    let fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    if (fingersUp === 1 && indexUp)              return "draw";
    if (fingersUp === 2 && indexUp && middleUp)  return "peace";
    if (fingersUp === 0)                          return "fist";
    return "none";
}

function drawHandSkeleton(landmarks) {
    stroke(0, 255, 0); strokeWeight(2);
    for (const [i, j] of HAND_CONNECTIONS) {
        line(
            width - landmarks[i].x * width, landmarks[i].y * height,
            width - landmarks[j].x * width, landmarks[j].y * height
        );
    }
    fill(255, 0, 0); noStroke();
    for (let lm of landmarks) {
        circle(width - lm.x * width, lm.y * height, 10);
    }
}
