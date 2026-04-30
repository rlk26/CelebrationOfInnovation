// FaceTrackingScene.js
class FaceTrackingScene extends Scene {
  constructor() {
    super('FaceTrackingScene');
    this.capture = null;
    this.tracker = null;
    this.ec = null;
    this.w = 640;
    this.h = 480;
    this.showPoints = false;
    this.showVideo = false;
    this.showShapes = true;
    this.joyimage = null;
    this.pickleimage = null;
  }

  enter() {
    this.joyimage = loadImage("joy.png");
    this.pickleimage = loadImage("pickle.png");

    this.capture = createCapture({
      audio: false,
      video: { width: this.w, height: this.h }
    });
    this.capture.elt.setAttribute('playsinline', '');
    this.capture.size(this.w, this.h);
    this.capture.hide();

    this.tracker = new clm.tracker();
    this.tracker.init();
    this.tracker.start(this.capture.elt);

    this.initializeEmotion();
  }

  exit() {
    if (this.capture) {
      this.capture.stop();
      this.capture.remove();
      this.capture = null;
    }
    if (this.tracker) {
      this.tracker.stop();
      this.tracker = null;
    }
    this.ec = null;
  }

  initializeEmotion() {
    let model = Object.assign({}, emotionModel);
    delete model.disgusted;
    delete model.fear;
    this.ec = new emotionClassifier();
    this.ec.init(model);
  }

  draw() {
    if (!this.showVideo) background(255);
    if (this.showVideo) image(this.capture, 0, 0, this.w, this.h);

    this.drawText();

    let positions = this.tracker.getCurrentPosition();
    if (!positions) return;

    if (this.showPoints) this.drawAllPoints(positions);
    if (this.showShapes) this.drawShapes(positions);
    if (!this.ec) return;

    let cp = this.tracker.getCurrentParameters();
    let emotionArray = this.ec.meanPredict(cp);
    if (!emotionArray) return;

    let maxEmotion = "";
    let maxValue = 0;
    for (let i = 0; i < emotionArray.length; i++) {
      if (emotionArray[i].value > maxValue) {
        maxEmotion = emotionArray[i].emotion;
        maxValue = emotionArray[i].value;
      }
    }

    this.drawEmotionUI(emotionArray);

    if (maxEmotion === "happy") {
      this.drawHappyCircles(maxValue);
    } else if (maxEmotion === "surprised") {
      this.drawPickles(maxValue);
    }
  }

  drawHappyCircles(strength) {
    noStroke();
    let count = max(4, floor(strength * 15));
    for (let i = 0; i < count; i++) {
      let x = random(0, this.w - 80);
      let y = random(0, this.h - 80);
      image(this.joyimage, x, y);
    }
  }

  drawPickles(strength) {
    noStroke();
    let count = max(4, floor(strength * 15));
    for (let i = 0; i < count; i++) {
      let x = random(0, this.w - 80);
      let y = random(0, this.h - 80);
      image(this.pickleimage, x, y);
    }
  }

  drawEmotionUI(emotionArray) {
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

  drawAllPoints(positions) {
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

  drawPoly(positions, start, end) {
    beginShape();
    for (let i = start; i < end; i++) {
      vertex(positions[i][0], positions[i][1]);
    }
    endShape(CLOSE);
  }

  drawShapes(positions) {
    fill(0, 255, 0);
    stroke(0, 255, 0);
    this.drawPoly(positions, 19, 23);
    this.drawPoly(positions, 15, 19);
    stroke(0, 0, 255);
    strokeWeight(3);
    this.drawPoly(positions, 23, 27);
    this.drawPoly(positions, 28, 32);
    noStroke();
    fill(255, 0, 0);
    ellipse(positions[62][0], positions[62][1], 50, 50);
    fill(0, 255, 0);
    stroke(0, 0, 255);
    strokeWeight(3);
    this.drawPoly(positions, 44, 56);
  }

  drawText() {
    fill(230);
    noStroke();
    rect(0, 0, 160, 100);
    fill(0);
    text("s: show shapes", 15, 25);
    text("p: show points", 15, 50);
    text("v: show video", 15, 75);
  }

  keyPressed() {
    if (key === 'p') this.showPoints = !this.showPoints;
    if (key === 'v') this.showVideo = !this.showVideo;
    if (key === 's') this.showShapes = !this.showShapes;
  }
}