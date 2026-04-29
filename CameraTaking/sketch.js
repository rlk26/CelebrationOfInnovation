let capture;
let button;

function setup() {
  createCanvas(400, 400);
  // Access live webcam
  capture = createCapture(VIDEO);
  capture.hide(); // Hide the raw HTML video element
  
  // Create a button to take the photo
  button = createButton('Snap Photo');
  button.mousePressed(takeSnap);
}

function draw() {
  background(220);
  // Display the live video on canvas
  image(capture, 0, 0, width, height);
}

function takeSnap() {
  // Saves the current canvas as a JPG
  saveCanvas('myPhoto', 'jpg');
}
