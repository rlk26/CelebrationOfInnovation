let cam;
let currentFilter = 0;

const filterNames = [
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
  "Vintage Photobooth"
];

function setup() {
  pixelDensity(1);
  createCanvas(640, 480);
  cam = createCapture(VIDEO);
  cam.size(640, 480);
  cam.hide();
  textFont('monospace');
}

function draw() {
  if (cam.width === 0) return;

  // Draw camera mirrored
  push();
  translate(width, 0);
  scale(-1, 1);
  image(cam, 0, 0, 640, 480);
  pop();

  // Apply filter
  loadPixels();
  applyFilter(currentFilter);
  updatePixels();

  // Draw overlay (not mirrored)
  drawOverlay(filterNames[currentFilter]);
}

function keyPressed() {
  if (key === ' ') {
    currentFilter = (currentFilter + 1) % filterNames.length;
  }
  if (keyCode === RIGHT_ARROW) {
    currentFilter = (currentFilter + 1) % filterNames.length;
  }
  if (keyCode === LEFT_ARROW) {
    currentFilter = (currentFilter - 1 + filterNames.length) % filterNames.length;
  }
  if (key === ' ') {
    currentFilter = (currentFilter + 1) % filterNames.length;
  }
}

// ─── Filter dispatcher ────────────────────────────────────────────────────────

function applyFilter(idx) {
  switch (idx) {
    case 0:  break;
    case 1:  filterGrayscale(); break;
    case 2:  filterSepia(); break;
    case 3:  filterComic(); break;
    case 4:  filterInvert(); break;
    case 5:  filterWarm(); break;
    case 6:  filterCool(); break;
    case 7:  filterPixelate(15); break;
    case 8:  filterEdge(); break;
    case 9:  filterSketch(); break;
    case 10: filterVintagePhotobooth(); break;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getR(x, y) { return pixels[(y * width + x) * 4];     }
function getG(x, y) { return pixels[(y * width + x) * 4 + 1]; }
function getB(x, y) { return pixels[(y * width + x) * 4 + 2]; }

function setRGB(x, y, r, g, b) {
  let i = (y * width + x) * 4;
  pixels[i]     = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
}

function getLuma(x, y) {
  return getR(x,y) * 0.299 + getG(x,y) * 0.587 + getB(x,y) * 0.114;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

function filterGrayscale() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let g = getLuma(x, y);
      setRGB(x, y, g, g, g);
    }
}

function filterSepia() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let r = getR(x,y), g = getG(x,y), b = getB(x,y);
      setRGB(x, y,
        constrain(r*0.393+g*0.769+b*0.189, 0, 255),
        constrain(r*0.349+g*0.686+b*0.168, 0, 255),
        constrain(r*0.272+g*0.534+b*0.131, 0, 255));
    }
}

function filterInvert() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      setRGB(x, y, 255-getR(x,y), 255-getG(x,y), 255-getB(x,y));
}

function filterWarm() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      setRGB(x, y,
        constrain(getR(x,y)*1.3, 0, 255),
        getG(x,y),
        constrain(getB(x,y)*0.8, 0, 255));
}

function filterCool() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      setRGB(x, y,
        constrain(getR(x,y)*0.8, 0, 255),
        getG(x,y),
        constrain(getB(x,y)*1.4, 0, 255));
}

function filterPixelate(size) {
  for (let y = 0; y < height; y += size)
    for (let x = 0; x < width; x += size) {
      let sx = constrain(x + Math.floor(size/2), 0, width-1);
      let sy = constrain(y + Math.floor(size/2), 0, height-1);
      let r = getR(sx,sy), g = getG(sx,sy), b = getB(sx,sy);
      for (let dy = 0; dy < size && y+dy < height; dy++)
        for (let dx = 0; dx < size && x+dx < width; dx++)
          setRGB(x+dx, y+dy, r, g, b);
    }
}

function filterEdge() {
  let luma = new Float32Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      luma[y*width+x] = getLuma(x, y);
  for (let y = 1; y < height-1; y++)
    for (let x = 1; x < width-1; x++) {
      let gx =
        -luma[(y-1)*width+(x-1)] - 2*luma[y*width+(x-1)] - luma[(y+1)*width+(x-1)]
        +luma[(y-1)*width+(x+1)] + 2*luma[y*width+(x+1)] + luma[(y+1)*width+(x+1)];
      let gy =
        -luma[(y-1)*width+(x-1)] - 2*luma[(y-1)*width+x] - luma[(y-1)*width+(x+1)]
        +luma[(y+1)*width+(x-1)] + 2*luma[(y+1)*width+x] + luma[(y+1)*width+(x+1)];
      let mag = constrain(Math.sqrt(gx*gx + gy*gy), 0, 255);
      setRGB(x, y, mag, mag, mag);
    }
}

function filterSketch() {
  let luma = new Float32Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      luma[y*width+x] = getLuma(x, y);
  let inv = new Float32Array(width * height);
  for (let i = 0; i < inv.length; i++) inv[i] = 255 - luma[i];
  let blurred = gaussianBlur1D(inv, width, height, 10);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let g = luma[y*width+x];
      let b = 255 - blurred[y*width+x];
      let val = (b === 0) ? 255 : constrain(g/b*256, 0, 255);
      setRGB(x, y, val, val, val);
    }
}

function filterComic() {
  let origR = new Uint8Array(width*height);
  let origG = new Uint8Array(width*height);
  let origB = new Uint8Array(width*height);
  let luma  = new Float32Array(width*height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let i = y*width+x;
      origR[i]=getR(x,y); origG[i]=getG(x,y); origB[i]=getB(x,y);
      luma[i]=getLuma(x,y);
    }
  let step = 255/4;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let i = y*width+x;
      let r = Math.round(origR[i]/step)*step;
      let g = Math.round(origG[i]/step)*step;
      let b = Math.round(origB[i]/step)*step;
      let edgeX = x<width-1  ? Math.abs(luma[i]-luma[i+1])     : 0;
      let edgeY = y<height-1 ? Math.abs(luma[i]-luma[i+width]) : 0;
      if ((edgeX+edgeY) > 30) setRGB(x, y, 0, 0, 0);
      else setRGB(x, y, constrain(r,0,255), constrain(g,0,255), constrain(b,0,255));
    }
}

function filterVintagePhotobooth() {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let luma = getLuma(x, y);
      luma = constrain((luma - 128) * 1.6 + 128, 0, 255);
      let r = constrain(luma * 1.04, 0, 255);
      let g = constrain(luma * 0.97, 0, 255);
      let b = constrain(luma * 0.90, 0, 255);
      let grain = random(-30, 30);
      r = constrain(r + grain + 15, 0, 255);
      g = constrain(g + grain + 10, 0, 255);
      b = constrain(b + grain + 10, 0, 255);
      setRGB(x, y, r, g, b);
    }
}

// ─── Gaussian blur ────────────────────────────────────────────────────────────

function gaussianBlur1D(src, w, h, radius) {
  let kernel = makeGaussianKernel(radius);
  let tmp = new Float32Array(w*h);
  let out = new Float32Array(w*h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum=0, wsum=0;
      for (let k=-radius; k<=radius; k++) {
        let nx=constrain(x+k,0,w-1), weight=kernel[k+radius];
        sum+=src[y*w+nx]*weight; wsum+=weight;
      }
      tmp[y*w+x]=sum/wsum;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum=0, wsum=0;
      for (let k=-radius; k<=radius; k++) {
        let ny=constrain(y+k,0,h-1), weight=kernel[k+radius];
        sum+=tmp[ny*w+x]*weight; wsum+=weight;
      }
      out[y*w+x]=sum/wsum;
    }
  return out;
}

function makeGaussianKernel(radius) {
  let sigma = radius/2, kernel = [];
  for (let i=-radius; i<=radius; i++)
    kernel.push(Math.exp(-(i*i)/(2*sigma*sigma)));
  return kernel;
}

// ─── UI overlay ───────────────────────────────────────────────────────────────

function drawOverlay(filterName) {
  noStroke();
  fill(0, 140);
  rect(0, 0, width, 44);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text('Filter: ' + filterName, 12, 22);
  textAlign(RIGHT, CENTER);
  fill(180);
  textSize(12);
  text((currentFilter+1) + ' / ' + filterNames.length, width-12, 22);
  fill(200);
  textSize(11);
  textAlign(LEFT, BOTTOM);
  text('use arrows to move between filters', 14, height - 10);
}