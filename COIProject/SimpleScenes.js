
class HomeScene extends Scene {
  constructor() { super("Home"); }

  draw() {
    background(220);
    fill(0); 
      noStroke(); 
      textAlign(CENTER, CENTER); 
      textSize(18);
    text("Press 1, 2, 3, or 4 to switch scenes", width / 2, height / 2);
  }
}

class BlackScene extends Scene {
  constructor() { super("Black"); }
  draw() { background(0); }
}


class GreyScene extends Scene {
  constructor() { super("Grey"); }
  draw() { background(100); }
}

class WhiteScene extends Scene {
  constructor() { super("White"); }
  draw() { background(255); }
}