let current
function setup() {
    createCanvas(800, 600);
    current = 0;
}

function draw() {
    background(220);
    if (current == 1) {
        drawScene1();
    } else if (current == 2) {
        drawScene2();
    } else if(current == 3){
        drawScene3();
    }
}

function keyPressed(){
    if(key == '1'){
        current = 1;
    } else if (key == '2'){
        current = 2;
    } else if (key == '3'){
        current = 3;
    }
}

function drawScene1() {
    background(0);
}

function drawScene2() {
    background(100);
}

function drawScene3() {
    background(255);
}
