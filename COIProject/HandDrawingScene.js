class HandDrawingScene extends Scene {
  constructor() {
    super("HandDrawing");

    this._cam          = null;
    this._drawingLayer = null;
    this._penDown      = false;
    this._prevPos      = null;
    this._colorIndex   = 0;
    this._brushSize    = 8;
    this._lastGesture  = 0;
    this._handResults  = null;

    this._colors = [
      [255, 0,   255],
      [0,   100, 255],
      [0,   255, 0  ],
      [255, 0,   0  ],
      [255, 255, 0  ],
    ];

    this._CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  enter() {
    resizeCanvas(displayWidth, displayHeight);

    this._drawingLayer = createGraphics(width, height);
    this._drawingLayer.clear();

    // Bind MediaPipe callback to this instance
    const self = this;
    gotHands = function (results) {
      self._handResults = results;
    };

    if (window.setCameraStreamToMediaPipe) {
      this._cam = createCapture(VIDEO);
      this._cam.size(displayWidth, displayHeight);
      this._cam.hide();
      this._cam.elt.onloadedmetadata = function () {
        window.setCameraStreamToMediaPipe(self._cam.elt);
      };
    }
  }

  exit() {
    if (this._cam) {
      this._cam.remove();
      this._cam = null;
    }
    this._drawingLayer = null;
    this._handResults  = null;
    this._penDown      = false;
    this._prevPos      = null;
    resizeCanvas(800, 600);
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    background(255);

    // Mirrored camera feed
    if (this._cam) {
      push();
      translate(width, 0);
      scale(-1, 1);
      tint(255, 120);
      image(this._cam, 0, 0, width, height);
      pop();
    }

    // Drawing layer
    if (this._drawingLayer) image(this._drawingLayer, 0, 0);

    // Hand tracking + drawing logic
    if (this._handResults && this._handResults.landmarks) {
      for (const landmarks of this._handResults.landmarks) {
        this._drawHandSkeleton(landmarks);
        const gesture = this._getGesture(landmarks);
        this._handleGesture(gesture, landmarks);
      }
    }

    this._drawHUD();
  }

  // ── Gesture Handling ────────────────────────────────────────────────────────

  _handleGesture(gesture, landmarks) {
    if (gesture === "draw") {
      const x = width - landmarks[8].x * width;
      const y = landmarks[8].y * height;

      if (!this._penDown) {
        this._penDown = true;
        this._prevPos = createVector(x, y);
      } else {
        const nx = lerp(this._prevPos.x, x, 0.5);
        const ny = lerp(this._prevPos.y, y, 0.5);
        const newPos = createVector(nx, ny);

        if (dist(this._prevPos.x, this._prevPos.y, nx, ny) > 3) {
          this._drawingLayer.stroke(...this._colors[this._colorIndex]);
          this._drawingLayer.strokeWeight(this._brushSize);
          this._drawingLayer.strokeCap(ROUND);
          this._drawingLayer.line(
            this._prevPos.x, this._prevPos.y, newPos.x, newPos.y
          );
          this._prevPos = newPos;
        }
      }
    } else {
      this._penDown = false;
      const cooldown = millis() - this._lastGesture > 500;

      if (gesture === "fist" && cooldown) {
        this._drawingLayer.clear();
        this._lastGesture = millis();
      }
      if (gesture === "peace" && cooldown) {
        this._colorIndex = (this._colorIndex + 1) % this._colors.length;
        this._lastGesture = millis();
      }
    }
  }

  _getGesture(lm) {
    const indexUp  = lm[8].y  < lm[6].y;
    const middleUp = lm[12].y < lm[10].y;
    const ringUp   = lm[16].y < lm[14].y;
    const pinkyUp  = lm[20].y < lm[18].y;
    const up = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    if (up === 1 && indexUp)             return "draw";
    if (up === 2 && indexUp && middleUp) return "peace";
    if (up === 0)                        return "fist";
    return "none";
  }

  // ── Rendering Helpers ───────────────────────────────────────────────────────

  _drawHandSkeleton(landmarks) {
    stroke(0, 255, 0); strokeWeight(2);
    for (const [i, j] of this._CONNECTIONS) {
      line(
        width - landmarks[i].x * width, landmarks[i].y * height,
        width - landmarks[j].x * width, landmarks[j].y * height
      );
    }
    fill(255, 0, 0); noStroke();
    for (const lm of landmarks) {
      circle(width - lm.x * width, lm.y * height, 10);
    }
  }

  _drawHUD() {
    // Color palette
    for (let i = 0; i < this._colors.length; i++) {
      fill(...this._colors[i]);
      if (i === this._colorIndex) { stroke(0); strokeWeight(4); }
      else                        { noStroke(); }
      circle(50 + i * 100, 50, 50);
    }
    noStroke();

    // Instructions bar
    fill(0, 0, 0, 160);
    rect(0, height - 40, width, 40);
    fill(255); textAlign(LEFT, CENTER); textSize(13);
    text(
      "☝ Draw  ✌ Next colour  ✊ Clear  |  Press 0-3 to switch scene",
      10, height - 20
    );
  }
}