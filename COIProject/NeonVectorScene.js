class NeonVectorScene extends Scene {
  constructor() {
    super('NeonVectorScene');
    this.vid = null;
    this.scl = 10;
  }

  enter() {
    this.vid = createCapture(VIDEO);
    this.vid.size(width / this.scl, height / this.scl);
    this.vid.hide();
  }

  exit() {
    if (this.vid) {
      this.vid.stop();
      this.vid.remove();
      this.vid = null;
    }
  }

  draw() {
    background(0, 10, 20, 80);

    this.vid.loadPixels();

    for (let y = 0; y < this.vid.height; y++) {
      for (let x = 0; x < this.vid.width; x++) {
        let index = (x + y * this.vid.width) * 4;
        let r = this.vid.pixels[index + 0];
        let g = this.vid.pixels[index + 1];
        let b = this.vid.pixels[index + 2];

        let bright = (r + g + b) / 3;

        if (bright > 40) {
          push();
          translate(x * this.scl, y * this.scl);

          let angle = map(bright, 0, 255, 0, TWO_PI);
          rotate(angle + frameCount * 0.05);

          stroke(0, 255, 255, map(bright, 0, 255, 50, 255));
          strokeWeight(2);

          let len = map(bright, 0, 255, 2, this.scl * 1.5);
          line(0, 0, len, 0);

          if (bright > 150) {
            stroke(255, 255, 255, 200);
            point(len, 0);
          }

          pop();
        }
      }
    }
  }
}