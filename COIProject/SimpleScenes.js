/**
 * SimpleScenes.js
 * Concrete scenes 0–3: Home screen and three placeholder colour scenes.
 */

// ─── Scene 0 – Home ──────────────────────────────────────────────────────────
class HomeScene extends Scene {
  constructor() { super("Home"); }

  draw() {
    background(220);
    fill(0); noStroke(); textAlign(CENTER, CENTER); textSize(18);
    text("Press 1, 2, 3, or 4 to switch scenes", width / 2, height / 2);
  }
}

// ─── Scene 1 – Black ─────────────────────────────────────────────────────────
class BlackScene extends Scene {
  constructor() { super("Black"); }
  draw() { background(0); }
}

// ─── Scene 2 – Grey ──────────────────────────────────────────────────────────
class GreyScene extends Scene {
  constructor() { super("Grey"); }
  draw() { background(100); }
}

// ─── Scene 3 – White ─────────────────────────────────────────────────────────
class WhiteScene extends Scene {
  constructor() { super("White"); }
  draw() { background(255); }
}