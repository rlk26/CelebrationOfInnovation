/**
 * Scene.js
 * Abstract base class / interface for all scenes.
 * Every scene must extend this and implement: enter, exit, draw, keyPressed.
 */
class Scene {
  constructor(name) {
    this.name = name;
  }

  /** Called once when this scene becomes active. */
  enter() {}

  /** Called once when this scene is deactivated. */
  exit() {}

  /** Called every frame while this scene is active. */
  draw() {}

  /** Called on keyPressed while this scene is active. */
  keyPressed() {}

  /** Optional: called on mouseMoved while this scene is active. */
  mouseMoved() {}
}