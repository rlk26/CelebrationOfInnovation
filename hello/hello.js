

function preload(){
  img = loadimage()
}


function setup() {

  input = createInput();
  input.position(windowWidth/2.5, windowHeight/4);
  input.size(300);

  button = createButton('enter');
  button.position(input.x + input.width, windowHeight/4);

  createCanvas(windowWidth,windowHeight);

  //when button is pressed
  button.mousePressed(formula);
}

let x = 50;

function draw() {

  background(255);
  
 

  textSize(32);
  textAlign(CENTER,CENTER + 2*input.height);
  text(words, width/2, height/3);
  
}

let prompt = "";
let words;
let numb = 0;

function formula(){
  //refresh background
  
   //connect variable to the prompt
  prompt = input.value();
  input.value('');
  words = split(prompt, ' ');
  for(let i = 0; i < words.length; i+=1){
  numb=i; 
  }
  words=numb;

 

  
  

 
  
}

