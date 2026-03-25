/**
 * sketch.js
 * Entry point. Creates a SceneManager, registers all scenes,
 * and delegates p5 lifecycle hooks to it.
 *
 * Load order in index.html must be:
 *   1. p5.js
 *   2. Scene.js
 *   3. SceneManager.js
 *   4. SimpleScenes.js
 *   5. HandDrawingScene.js
 *   6. sketch.js          ← this file
 */

let sceneManager;

function setup() {
  createCanvas(800, 600);

  sceneManager = new SceneManager();

  // Register scenes – array index matches the key you press (0 = Home, etc.)
  sceneManager.addScenes(
    new HomeScene(),        // key 0
    new BlackScene(),       // key 1
    new GreyScene(),        // key 2
    new WhiteScene(),       // key 3
    new HandDrawingScene(), // key 4
  );

  // Start on the home screen
  sceneManager.switchTo(0);
}

function draw() {
  sceneManager.draw();
    
    //image filtering here
}

function keyPressed() {
  sceneManager.keyPressed();
}

function mouseMoved() {
  sceneManager.mouseMoved();
}