class ClaireFilter extends Scene {
  constructor() {
    super("ClaireFilter");

    this.cam           = null;
    this.currentFilter = 0;

    this.filterNames = [
      "Normal",
      "Grayscale",
      "Sepia",
      "Comic / Cartoon",
      "Invert / Negative",
      "Warm (Orange Boost)",
      "Cool (Blue Boost)",
      "Pixelate",
      "Edge Detection",
      "Sketch",
      "Vintage Photobooth",
    ];
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  enter() {
    resizeCanvas(displayWidth, displayHeight);
    pixelDensity(1);
    textFont("monospace");

    this.cam = createCapture(VIDEO);
    this.cam.size(640, 480);
    this.cam.hide();
  }

  exit() {
    if (this.cam) {
      this.cam.remove();
      this.cam = null;
    }
    resizeCanvas(800, 600);
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  keyPressed() {
    const n = this.filterNames.length;

    if (key === " " || keyCode === RIGHT_ARROW) {
      this.currentFilter = (this.currentFilter + 1) % n;
    }
    if (keyCode === LEFT_ARROW) {
      this.currentFilter = (this.currentFilter - 1 + n) % n;
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw() {
    if (!this.cam || this.cam.width === 0) return;

    // Mirrored camera feed
    push();
    translate(width, 0);
    scale(-1, 1);
    image(this.cam, 0, 0, width, height);
    pop();

    // Apply pixel filter
    loadPixels();
    this.applyFilter(this.currentFilter);
    updatePixels();

    // HUD overlay
    this.drawOverlay(this.filterNames[this.currentFilter]);
  }

  // ── Filter Dispatcher ───────────────────────────────────────────────────────

  applyFilter(idx) {
    switch (idx) {
      case 0:  break;
      case 1:  this.filterGrayscale(); break;
      case 2:  this.filterSepia(); break;
      case 3:  this.filterComic(); break;
      case 4:  this.filterInvert(); break;
      case 5:  this.filterWarm(); break;
      case 6:  this.filterCool(); break;
      case 7:  this.filterPixelate(15); break;
      case 8:  this.filterEdge(); break;
      case 9:  this.filterSketch(); break;
      case 10: this.filterVintagePhotobooth(); break;
    }
  }

  // ── Pixel Helpers ───────────────────────────────────────────────────────────

  getR(x, y) { return pixels[(y * width + x) * 4];     }
  getG(x, y) { return pixels[(y * width + x) * 4 + 1]; }
  getB(x, y) { return pixels[(y * width + x) * 4 + 2]; }

  setRGB(x, y, r, g, b) {
    const i = (y * width + x) * 4;
    pixels[i]     = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }

  getLuma(x, y) {
    return this.getR(x, y) * 0.299 +
           this.getG(x, y) * 0.587 +
           this.getB(x, y) * 0.114;
  

  // ── Filters 
      
  }

  filterGrayscale() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const g = this.getLuma(x, y);
        this.setRGB(x, y, g, g, g);
      }
  }

  filterSepia() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const r = this.getR(x, y), g = this.getG(x, y), b = this.getB(x, y);
        this.setRGB(x, y,
          constrain(r * 0.393 + g * 0.769 + b * 0.189, 0, 255),
          constrain(r * 0.349 + g * 0.686 + b * 0.168, 0, 255),
          constrain(r * 0.272 + g * 0.534 + b * 0.131, 0, 255));
      }
  }

  filterInvert() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        this.setRGB(x, y,
          255 - this.getR(x, y),
          255 - this.getG(x, y),
          255 - this.getB(x, y));
  }

  filterWarm() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        this.setRGB(x, y,
          constrain(this.getR(x, y) * 1.3, 0, 255),
          this.getG(x, y),
          constrain(this.getB(x, y) * 0.8, 0, 255));
  }

  filterCool() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        this.setRGB(x, y,
          constrain(this.getR(x, y) * 0.8, 0, 255),
          this.getG(x, y),
          constrain(this.getB(x, y) * 1.4, 0, 255));
  }

  filterPixelate(size) {
    for (let y = 0; y < height; y += size)
      for (let x = 0; x < width; x += size) {
        const sx = constrain(x + Math.floor(size / 2), 0, width - 1);
        const sy = constrain(y + Math.floor(size / 2), 0, height - 1);
        const r = this.getR(sx, sy), g = this.getG(sx, sy), b = this.getB(sx, sy);
        for (let dy = 0; dy < size && y + dy < height; dy++)
          for (let dx = 0; dx < size && x + dx < width; dx++)
            this.setRGB(x + dx, y + dy, r, g, b);
      }
  }

  filterEdge() {
    const luma = new Float32Array(width * height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        luma[y * width + x] = this.getLuma(x, y);

    for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++) {
        const gx =
          -luma[(y-1)*width+(x-1)] - 2*luma[y*width+(x-1)] - luma[(y+1)*width+(x-1)]
          +luma[(y-1)*width+(x+1)] + 2*luma[y*width+(x+1)] + luma[(y+1)*width+(x+1)];
        const gy =
          -luma[(y-1)*width+(x-1)] - 2*luma[(y-1)*width+x] - luma[(y-1)*width+(x+1)]
          +luma[(y+1)*width+(x-1)] + 2*luma[(y+1)*width+x] + luma[(y+1)*width+(x+1)];
        const mag = constrain(Math.sqrt(gx * gx + gy * gy), 0, 255);
        this.setRGB(x, y, mag, mag, mag);
      }
  }

  filterSketch() {
    const luma = new Float32Array(width * height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        luma[y * width + x] = this.getLuma(x, y);

    const inv = new Float32Array(width * height);
    for (let i = 0; i < inv.length; i++) inv[i] = 255 - luma[i];

    const blurred = this.gaussianBlur1D(inv, width, height, 10);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const g = luma[y * width + x];
        const b = 255 - blurred[y * width + x];
        const val = (b === 0) ? 255 : constrain(g / b * 256, 0, 255);
        this.setRGB(x, y, val, val, val);
      }
  }

  filterComic() {
    const origR = new Uint8Array(width * height);
    const origG = new Uint8Array(width * height);
    const origB = new Uint8Array(width * height);
    const luma  = new Float32Array(width * height);

    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        origR[i] = this.getR(x, y);
        origG[i] = this.getG(x, y);
        origB[i] = this.getB(x, y);
        luma[i]  = this.getLuma(x, y);
      }

    const step = 255 / 4;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const r = Math.round(origR[i] / step) * step;
        const g = Math.round(origG[i] / step) * step;
        const b = Math.round(origB[i] / step) * step;
        const edgeX = x < width - 1  ? Math.abs(luma[i] - luma[i + 1])       : 0;
        const edgeY = y < height - 1 ? Math.abs(luma[i] - luma[i + width])    : 0;
        if ((edgeX + edgeY) > 30) this.setRGB(x, y, 0, 0, 0);
        else this.setRGB(x, y, constrain(r, 0, 255), constrain(g, 0, 255), constrain(b, 0, 255));
      }
  }

  filterVintagePhotobooth() {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        let luma = this.getLuma(x, y);
        luma = constrain((luma - 128) * 1.6 + 128, 0, 255);
        const grain = random(-30, 30);
        this.setRGB(x, y,
          constrain(luma * 1.04 + grain + 15, 0, 255),
          constrain(luma * 0.97 + grain + 10, 0, 255),
          constrain(luma * 0.90 + grain + 10, 0, 255));
      }
  }

  // ── Gaussian Blur ───────────────────────────────────────────────────────────

  gaussianBlur1D(src, w, h, radius) {
    const kernel = this.makeGaussianKernel(radius);
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);

    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0, wsum = 0;
        for (let k = -radius; k <= radius; k++) {
          const nx = constrain(x + k, 0, w - 1);
          const weight = kernel[k + radius];
          sum += src[y * w + nx] * weight;
          wsum += weight;
        }
        tmp[y * w + x] = sum / wsum;
      }

    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let sum = 0, wsum = 0;
        for (let k = -radius; k <= radius; k++) {
          const ny = constrain(y + k, 0, h - 1);
          const weight = kernel[k + radius];
          sum += tmp[ny * w + x] * weight;
          wsum += weight;
        }
        out[y * w + x] = sum / wsum;
      }

    return out;
  }

  makeGaussianKernel(radius) {
    const sigma = radius / 2;
    const kernel = [];
    for (let i = -radius; i <= radius; i++)
      kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
    return kernel;
  }



  drawOverlay(filterName) {
    noStroke();
    fill(0, 140);
    rect(0, 0, width, 44);
    fill(255);
    textSize(14);
    textAlign(LEFT, CENTER);
    text("Filter: " + filterName, 12, 22);
    textAlign(RIGHT, CENTER);
    fill(180);
    textSize(12);
    text((this.currentFilter + 1) + " / " + this.filterNames.length, width - 12, 22);
    fill(200);
    textSize(11);
    textAlign(LEFT, BOTTOM);
    text("← → or SPACE to cycle filters", 14, height - 10);
  }
}