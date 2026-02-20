let hand_results;
let cam = null;
let drawingLayer;
let currentStroke = [];
let penDown = false;
let prevPos = null;

// Settings
let colors = [
    [255, 0, 255],
    [0, 100, 255],
    [0, 255, 0],
    [255, 0, 0],
    [255, 255, 0]
];
let colorIndex = 0;
let brushSize = 8;
let lastGestureTime = 0;

function setup() {
    createCanvas(displayWidth, displayHeight);
    drawingLayer = createGraphics(width, height);
    drawingLayer.clear();

    gotHands = function (results) {
        hand_results = results;
    };

    if (window.setCameraStreamToMediaPipe) {
        cam = createCapture(VIDEO);
        cam.size(displayWidth, displayHeight);
        cam.hide();
        cam.elt.onloadedmetadata = function () {
            window.setCameraStreamToMediaPipe(cam.elt);
        };
    }
}

function draw() {
    background(255);

    // Draw camera (mirrored)
    if (cam) {
        push();
        translate(width, 0);
        scale(-1, 1);
        tint(255, 120);
        image(cam, 0, 0, width, height);
        pop();
    }

    // Draw the drawing layer
    image(drawingLayer, 0, 0);

    if (hand_results && hand_results.landmarks) {
        for (const landmarks of hand_results.landmarks) {
            // Draw hand skeleton
            drawHand(landmarks);

            let gesture = getGesture(landmarks);

            // DRAW - index finger only
            if (gesture === "draw") {
                let x = width - landmarks[8].x * width;
                let y = landmarks[8].y * height;

                if (!penDown) {
                    penDown = true;
                    prevPos = createVector(x, y);
                } else {
                    let newPos = createVector(lerp(prevPos.x, x, 0.5), lerp(prevPos.y, y, 0.5));

                    if (dist(prevPos.x, prevPos.y, newPos.x, newPos.y) > 3) {
                        drawingLayer.stroke(...colors[colorIndex]);
                        drawingLayer.strokeWeight(brushSize);
                        drawingLayer.strokeCap(ROUND);
                        drawingLayer.line(prevPos.x, prevPos.y, newPos.x, newPos.y);
                        prevPos = newPos;
                    }
                }
            } else {
                penDown = false;

                // ERASE - fist
                if (gesture === "fist" && millis() - lastGestureTime > 500) {
                    drawingLayer.clear();
                    lastGestureTime = millis();
                }

                // CHANGE COLOR - peace sign
                if (gesture === "peace" && millis() - lastGestureTime > 500) {
                    colorIndex = (colorIndex + 1) % colors.length;
                    lastGestureTime = millis();
                }
            }
        }
    }
    //make this a loop
    //x position depends on the index
    //i + 100
    //if the color index from above matches with the number index we are on, highlight that circle (that is the color the finger is currently using)
    for (let i = 0; i < colors.length; i++) {
        let x = 50 + i * 100;
        fill(colors[i]);
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
    let indexUp = lm[8].y < lm[6].y;
    let middleUp = lm[12].y < lm[10].y;
    let ringUp = lm[16].y < lm[14].y;
    let pinkyUp = lm[20].y < lm[18].y;

    let fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    if (fingersUp === 1 && indexUp) return "draw";
    if (fingersUp === 2 && indexUp && middleUp) return "peace";
    if (fingersUp === 0) return "fist";

    return "none";
}

function drawHand(landmarks) {
    const HAND_CONNECTIONS = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],
        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],
        [5, 9],
        [9, 13],
        [13, 17]
    ];

    stroke(0, 255, 0);
    strokeWeight(2);
    for (const [i, j] of HAND_CONNECTIONS) {
        line(
            width - landmarks[i].x * width,
            landmarks[i].y * height,
            width - landmarks[j].x * width,
            landmarks[j].y * height
        );
    }

    fill(255, 0, 0);
    noStroke();
    for (let lm of landmarks) {
        circle(width - lm.x * width, lm.y * height, 10);
    }
}
