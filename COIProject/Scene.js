
class Scene {
  constructor(name) {
    this.name = name;
  }

  enter() {}

  exit() {}

  draw() {}

  keyPressed() {}

  
  mouseMoved() {}
    mousePressed() {}
    
    takeSnap() {
    const timestamp = year() + nf(month(),2) + nf(day(),2) +
                      '_' + nf(hour(),2) + nf(minute(),2) + nf(second(),2);
    saveCanvas(`${this.name}_${timestamp}`, 'jpg');
  }
}