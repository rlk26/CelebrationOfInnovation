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