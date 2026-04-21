//
// Face Tracking + Emotion Circles (WORKING)
//

let capture;
let tracker;
let w = 640;
let h = 480;

let showPoints = false;
let showVideo = false;
let showShapes = true;


let ec;
function preload() {
  joyimage = loadImage("joy.png");
  pickleimage = loadImage("pickle.png");
}

function setup() {
  createCanvas(w, h);

  capture = createCapture({
    audio: false,
    video: { width: w, height: h }
  });
  capture.elt.setAttribute('playsinline', '');
  capture.size(w, h);
  capture.hide();

  tracker = new clm.tracker();
  tracker.init();
  tracker.start(capture.elt);
 

  initializeEmotion();
}

function initializeEmotion() {
  delete emotionModel.disgusted;
  delete emotionModel.fear;

  ec = new emotionClassifier();
  ec.init(emotionModel);
}

function draw() {
  if (!showVideo) background(255);
  if (showVideo) image(capture, 0, 0, w, h);

  drawText();

  let positions = tracker.getCurrentPosition();
  if (!positions) return;

  if (showPoints) drawAllPoints(positions);
  if (showShapes) drawShapes(positions);

  if (!ec) return;

  let cp = tracker.getCurrentParameters();
  let emotionArray = ec.meanPredict(cp);
  if (!emotionArray) return;

  let maxEmotion = "";
  let maxValue = 0;

  for (let i = 0; i < emotionArray.length; i++) {
    if (emotionArray[i].value > maxValue) {
      maxEmotion = emotionArray[i].emotion;
      maxValue = emotionArray[i].value;
    }
  }

  drawEmotionUI(emotionArray);

  if (maxEmotion === "happy") {
    drawHappyCircles(maxValue);
  }
  else if(maxEmotion == "surprised"){
      drawPickles(maxValue);
    }
  else if(maxEmotion == "disgusted"){{
      //

  }}}
  



function drawHappyCircles(strength) {
  noStroke();
  fill(255, 200, 0);

  let count = max(4, floor(strength * 15));
  for (let i = 0; i < count; i++) {
    let r = random(30, 80);
    image(joyimage, r, r);
  }
}
function drawPickles(strength) {
  noStroke();
  fill(255, 200, 0);

  let count = max(4, floor(strength * 15));
  for (let i = 0; i < count; i++) {
    let r = random(30, 80);
    image(pickleimage, r, r);
  }
}

function drawEmotionUI(emotionArray) {
  fill(240);
  noStroke();
  rect(width - 150, 0, 150, 140);

  fill(0);
  let x = width - 135;
  let y = 25;

  for (let i = 0; i < emotionArray.length; i++) {
    let e = emotionArray[i];
    text(e.emotion + ": " + e.value.toFixed(2), x, y);
    y += 22;
  }
}

function drawAllPoints(positions) {
  colorMode(HSB);
  noFill();
  stroke(255);
  beginShape();
  for (let i = 0; i < positions.length; i++) {
    vertex(positions[i][0], positions[i][1]);
  }
  endShape();

  noStroke();
  for (let i = 0; i < positions.length; i++) {
    fill(map(i, 0, positions.length, 0, 360), 50, 100);
    ellipse(positions[i][0], positions[i][1], 4, 4);
  }
  colorMode(RGB);
}

function drawPoly(positions, start, end) {
  beginShape();
  for (let i = start; i < end; i++) {
    vertex(positions[i][0], positions[i][1]);
  }
  endShape(CLOSE);
}

function drawShapes(positions) {
  fill(0, 255, 0);
  stroke(0, 255, 0);
  drawPoly(positions, 19, 23);
  drawPoly(positions, 15, 19);

  stroke(0, 0, 255);
  strokeWeight(3);
  drawPoly(positions, 23, 27);
  drawPoly(positions, 28, 32);

  noStroke();
  fill(255, 0, 0);
  ellipse(positions[62][0], positions[62][1], 50, 50);

  fill(0, 255, 0);
  stroke(0, 0, 255);
  strokeWeight(3);
  drawPoly(positions, 44, 56);
}

function drawText() {
  fill(230);
  noStroke();
  rect(0, 0, 160, 100);

  fill(0);
  text("s: show shapes", 15, 25);
  text("p: show points", 15, 50);
  text("v: show video", 15, 75);
}

function keyPressed() {
  if (key === 'p') showPoints = !showPoints;
  if (key === 'v') showVideo = !showVideo;
  if (key === 's') showShapes = !showShapes;
}
