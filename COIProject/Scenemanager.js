class SceneManager {
  constructor() {
    /** @type {Scene[]} */
    this.scenes = [];
    /** @type {Scene|null} */
    this.current = null;
    this.currentIndex = -1;
  }

  /**
   * Register scenes in order. Index 0 = key '0', index 1 = key '1', etc.
   * @param {...Scene} scenes
   */
  addScenes(...scenes) {
    for (const s of scenes) this.scenes.push(s);
  }

  /**
   * Switch to the scene at `index`. Calls exit() on the old scene
   * and enter() on the new one.
   * @param {number} index
   */
  switchTo(index) {
    if (index < 0 || index >= this.scenes.length) return;
    if (this.current) this.current.exit();
    this.currentIndex = index;
    this.current = this.scenes[index];
    this.current.enter();
  }

  /** Forward the p5 draw() call to the active scene. */
  draw() {
    if (this.current) this.current.draw();
  }

  /** Forward keyPressed. If a digit key matches a scene index, switch to it. */
  keyPressed() {
    const n = parseInt(key);
    if (!isNaN(n) && n >= 0 && n < this.scenes.length) {
      this.switchTo(n);
    } else if (this.current) {
      this.current.keyPressed();
    }
  }

  /** Forward mouseMoved. */
  mouseMoved() {
    if (this.current) this.current.mouseMoved();
  }
}