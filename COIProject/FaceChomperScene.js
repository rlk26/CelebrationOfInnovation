// FaceChomperScene.js
class FaceChomperScene extends Scene {
  constructor() {
    super('FaceChomperScene');

    this.W = 800;
    this.H = 600;

    // Face detection
    this.capture = null;
    this.detector = null;
    this.faceDetected = false;
    this.lastDetectTime = 0;
    this.mouthOpen = false;
    this.mouthCenterX = 0;
    this.mouthCenterY = 0;
    this.mouthWidth = 0;
    this.mouthHeight = 0;

    // Game state
    this.gameActive = false;
    this.gameOverShown = false;
    this.score = 0;
    this.lives = 3;
    this.shapes = [];
    this.particles = [];
    this.frameCounter = 0;
    this.eatFlash = 0;
    this.deathFlash = 0;

    // UI elements
    this.overlay = null;
    this.startBtn = null;

    // Landmark indices
    this.UPPER_LIP_IDX = 13;
    this.LOWER_LIP_IDX = 14;
    this.LEFT_CORNER_IDX = 61;
    this.RIGHT_CORNER_IDX = 291;
    this.MOUTH_OPEN_THRESHOLD = 0.12;
  }

  // ── Difficulty helpers ──────────────────────────────────────────────────────
  getSpeedMin()      { return 2 + Math.min(this.score / 50, 1) * 2; }
  getSpeedMax()      { return 5 + Math.min(this.score / 50, 1) * 5; }
  getSpawnInterval() { return Math.max(40, 90 - this.score * 1); }
  getSquareChance()  { return Math.min(0.55, 0.35 + this.score * 0.007); }
  getDifficultyLabel() {
    if (this.score < 5)  return { text: 'EASY',    r: 100, g: 220, b: 100 };
    if (this.score < 15) return { text: 'MEDIUM',  r: 255, g: 200, b: 60  };
    if (this.score < 30) return { text: 'HARD',    r: 255, g: 130, b: 40  };
    if (this.score < 50) return { text: 'INTENSE', r: 255, g: 60,  b: 60  };
    return                      { text: 'INSANE',  r: 220, g: 40,  b: 220 };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  enter() {
    this.buildOverlay();

    this.capture = createCapture(VIDEO, () => {
      this.capture.hide();
      this.loadModel();
    });
    this.capture.size(this.W, this.H);
    this.capture.hide();
  }

  exit() {
    this.gameActive = false;

    if (this.capture) {
      this.capture.stop();
      this.capture.remove();
      this.capture = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.startBtn = null;
    }
    this.detector = null;
    this.shapes = [];
    this.particles = [];
  }

  // ── HTML overlay (replaces the old status-overlay div) ─────────────────────
  buildOverlay() {
    // Remove any leftover overlay from a previous visit
    const old = document.getElementById('fcc-overlay');
    if (old) old.remove();

    const ov = document.createElement('div');
    ov.id = 'fcc-overlay';
    Object.assign(ov.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      background: 'rgba(0,0,0,0.75)', color: '#fff',
      fontSize: '22px', textAlign: 'center',
      zIndex: 9999, fontFamily: 'sans-serif',
    });

    ov.innerHTML = `
      <div id="fcc-title"  style="font-size:32px;font-weight:bold;margin-bottom:12px">Face Chomper</div>
      <div id="fcc-msg"   >Loading face detection model…</div>
      <div id="fcc-sub"   style="font-size:16px;color:#aaa;margin-top:8px">Please allow camera access when prompted</div>
      <button id="fcc-btn" style="display:none;margin-top:20px;padding:12px 32px;font-size:18px;
        border:none;background:#4CAF50;color:#fff;border-radius:8px;cursor:pointer">
        Start Game
      </button>`;

    document.body.appendChild(ov);
    this.overlay = ov;

    this.startBtn = document.getElementById('fcc-btn');
    this.startBtn.addEventListener('click', () => this.startGame());
  }

  setOverlayMsg(title, msg, sub, showBtn, btnText = 'Start Game') {
    document.getElementById('fcc-title').textContent = title;
    document.getElementById('fcc-msg').textContent   = msg;
    document.getElementById('fcc-sub').textContent   = sub;
    this.startBtn.textContent    = btnText;
    this.startBtn.style.display  = showBtn ? 'block' : 'none';
  }

  hideOverlay() {
    if (this.overlay) this.overlay.style.display = 'none';
  }

  showOverlay() {
    if (this.overlay) this.overlay.style.display = 'flex';
  }

  // ── Model loading ───────────────────────────────────────────────────────────
  async loadModel() {
    try {
      this.setOverlayMsg('Face Chomper', 'Loading TensorFlow.js…', '', false);
      await tf.ready();

      this.setOverlayMsg('Face Chomper', 'Loading face landmark model…', '', false);
      this.detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', refineLandmarks: false, maxFaces: 1 }
      );

      this.setOverlayMsg(
        'Face Chomper',
        '',
        'Open your mouth to eat circles. Avoid squares!',
        true,
        'Start Game'
      );
    } catch (err) {
      this.setOverlayMsg('Face Chomper', 'Error loading model: ' + err.message, '', false);
      console.error(err);
    }
  }

  // ── Game control ────────────────────────────────────────────────────────────
  startGame() {
    this.score = 0;
    this.lives = 3;
    this.shapes = [];
    this.particles = [];
    this.frameCounter = 0;
    this.eatFlash = 0;
    this.deathFlash = 0;
    this.gameOverShown = false;
    this.gameActive = true;
    this.hideOverlay();
  }

  endGame() {
    this.gameActive = false;
    this.gameOverShown = true;
    this.showOverlay();
    this.setOverlayMsg(
      'Game Over!',
      'Final Score: ' + this.score,
      'You ate too many squares!',
      true,
      'Play Again'
    );
  }

  // ── Face detection ──────────────────────────────────────────────────────────
  async runDetection() {
    if (!this.detector || !this.capture || !this.gameActive) return;
    const now = Date.now();
    if (now - this.lastDetectTime < 60) return;
    this.lastDetectTime = now;

    try {
      const vid = this.capture.elt;
      if (vid.readyState < 2) return;

      const faces = await this.detector.estimateFaces(vid);
      if (faces.length === 0) { this.faceDetected = false; return; }

      this.faceDetected = true;
      const kp = faces[0].keypoints;

      const upper = kp[this.UPPER_LIP_IDX];
      const lower = kp[this.LOWER_LIP_IDX];
      const left  = kp[this.LEFT_CORNER_IDX];
      const right = kp[this.RIGHT_CORNER_IDX];

      const mH = Math.abs(lower.y - upper.y);
      const mW = Math.abs(right.x - left.x);

      this.mouthCenterX = (left.x + right.x) / 2;
      this.mouthCenterY = (upper.y + lower.y) / 2;
      this.mouthWidth   = mW;
      this.mouthHeight  = mH;
      this.mouthOpen    = (mH / (mW || 1)) > this.MOUTH_OPEN_THRESHOLD;
    } catch (e) { /* silent */ }
  }

  // ── Spawning ────────────────────────────────────────────────────────────────
  spawnShape() {
    const type  = Math.random() < (1 - this.getSquareChance()) ? 'circle' : 'square';
    const size  = random(18, 34);
    const speed = random(this.getSpeedMin(), this.getSpeedMax());
    const edge  = floor(random(4));
    let x, y, vx, vy;

    if      (edge === 0) { x = -size;         y = random(80, this.H-80); vx =  speed; vy = random(-1,1); }
    else if (edge === 1) { x = this.W + size; y = random(80, this.H-80); vx = -speed; vy = random(-1,1); }
    else if (edge === 2) { x = random(80, this.W-80); y = -size;         vx = random(-1,1); vy =  speed; }
    else                 { x = random(80, this.W-80); y = this.H + size; vx = random(-1,1); vy = -speed; }

    const color = type === 'circle'
      ? [[100,220,120],[80,180,255],[255,220,60],[200,120,255],[60,230,220]][floor(random(5))]
      : [180, 60, 60];

    this.shapes.push({ type, x, y, vx, vy, size, color });
  }

  spawnParticles(x, y, hex, count) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    for (let i = 0; i < count; i++) {
      const angle = random(TWO_PI);
      const spd   = random(2, 7);
      this.particles.push({
        x, y,
        vx: cos(angle)*spd,
        vy: sin(angle)*spd - 2,
        r, g, b,
        life: random(60, 100),
        size: random(6, 14)
      });
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  draw() {
    // Mirrored camera feed
    push();
    translate(this.W, 0);
    scale(-1, 1);
    image(this.capture, 0, 0, this.W, this.H);
    pop();

    if (!this.gameActive) return;

    this.frameCounter++;

    if (frameCount % 3 === 0) this.runDetection();

    if (this.frameCounter % floor(this.getSpawnInterval()) === 0) {
      this.spawnShape();
      if (this.score >= 20 && Math.random() < (this.score - 20) / 80) this.spawnShape();
    }

    // Update & draw shapes
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const s = this.shapes[i];
      s.x += s.vx;
      s.y += s.vy;

      if (s.x < -80 || s.x > this.W+80 || s.y < -80 || s.y > this.H+80) {
        this.shapes.splice(i, 1); continue;
      }

      if (this.mouthOpen && this.faceDetected) {
        const mx   = this.W - this.mouthCenterX;
        const my   = this.mouthCenterY;
        const d    = dist(mx, my, s.x, s.y);
        const eatR = (this.mouthWidth * 0.5) + s.size * 0.5;

        if (d < eatR) {
          if (s.type === 'circle') {
            this.score++;
            this.eatFlash = 15;
            this.spawnParticles(s.x, s.y, '#4CAF50', 12);
          } else {
            this.lives--;
            this.deathFlash = 20;
            this.spawnParticles(s.x, s.y, '#f44336', 16);
            if (this.lives <= 0) this.endGame();
          }
          this.shapes.splice(i, 1); continue;
        }
      }

      push();
      noStroke();
      if (s.type === 'circle') {
        fill(s.color[0], s.color[1], s.color[2], 220);
        ellipse(s.x, s.y, s.size*2, s.size*2);
        fill(255, 255, 255, 80);
        ellipse(s.x - s.size*0.25, s.y - s.size*0.25, s.size*0.6, s.size*0.6);
      } else {
        fill(s.color[0], s.color[1], s.color[2], 220);
        rect(s.x - s.size, s.y - s.size, s.size*2, s.size*2, 4);
        stroke(255, 80, 80, 180);
        strokeWeight(2);
        line(s.x - s.size*0.5, s.y - s.size*0.5, s.x + s.size*0.5, s.y + s.size*0.5);
        line(s.x + s.size*0.5, s.y - s.size*0.5, s.x - s.size*0.5, s.y + s.size*0.5);
      }
      pop();
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x  += pt.vx;
      pt.y  += pt.vy;
      pt.life -= 3;
      pt.vy   += 0.15;
      if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
      noStroke();
      fill(pt.r, pt.g, pt.b, map(pt.life, 0, 100, 0, 220));
      ellipse(pt.x, pt.y, pt.size * (pt.life / 100));
    }

    // Mouth indicator
    if (this.faceDetected) {
      const mx = this.W - this.mouthCenterX;
      const my = this.mouthCenterY;
      noFill();
      if (this.mouthOpen) { stroke(100,255,100,180); strokeWeight(3); }
      else                { stroke(255,255,100,120); strokeWeight(2); }
      ellipse(mx, my, this.mouthWidth*1.1, this.mouthHeight*1.8);
    }

    // Screen flashes
    if (this.eatFlash > 0) {
      noStroke(); fill(100,255,100, this.eatFlash*8);
      rect(0,0,this.W,this.H); this.eatFlash--;
    }
    if (this.deathFlash > 0) {
      noStroke(); fill(255,50,50, this.deathFlash*9);
      rect(0,0,this.W,this.H); this.deathFlash--;
    }

    this.drawHUD();

    if (!this.faceDetected) {
      fill(255,200,50,200); noStroke();
      textSize(15); textAlign(CENTER);
      text('No face detected — center your face in camera', this.W/2, this.H-20);
    }
  }

  drawHUD() {
    const panelW=160, panelH=100;
    const px = this.W - panelW - 16, py = 12;

    noStroke(); fill(0,0,0,160);
    rect(px, py, panelW, panelH, 8);

    textAlign(LEFT);
    fill(200); textSize(13); text('SCORE', px+12, py+22);
    fill(255); textSize(22); text(this.score, px+12, py+46);

    fill(200); textSize(13); text('LIVES', px+90, py+22);
    for (let i=0; i<3; i++) {
      fill(i < this.lives ? color(255,80,80) : color(80,80,80));
      noStroke();
      this.drawHeart(px+98+i*22, py+38, 8);
    }

    const diff = this.getDifficultyLabel();
    fill(diff.r, diff.g, diff.b);
    textSize(12); textAlign(LEFT);
    text('DIFFICULTY: ' + diff.text, px+12, py+88);

    noStroke(); fill(0,0,0,140);
    rect(12, 12, 130, 32, 6);
    if (this.mouthOpen) { fill(80,255,80);  textSize(14); textAlign(LEFT); text('MOUTH OPEN!', 22, 33); }
    else                { fill(180,180,180); textSize(14); textAlign(LEFT); text('mouth closed', 22, 33); }
  }

  drawHeart(x, y, size) {
    beginShape();
    vertex(x, y + size*0.4);
    bezierVertex(x, y, x-size, y, x-size, y+size*0.4);
    bezierVertex(x-size, y+size*0.8, x, y+size*1.2, x, y+size*1.5);
    bezierVertex(x, y+size*1.2, x+size, y+size*0.8, x+size, y+size*0.4);
    bezierVertex(x+size, y, x, y, x, y+size*0.4);
    endShape(CLOSE);
  }
}