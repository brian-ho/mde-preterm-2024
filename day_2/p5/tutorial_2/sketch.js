const WIDTH = 400;
const HEIGHT = 400;
const LINE_HEIGHT = HEIGHT / 2;
let showFace = false;

// What to do if a mouse is clicked
function mouseClicked() {
  print("CLICKED - SHOWING FACE");
  showFace = !showFace;
}

// What to do if a key is pressed
function keyPressed() {
  // Changes sort order
  // Changes which of the top 10 colors per image is shown
  if (keyCode === 32) {
    print("PRESSSED SPACE - SAVING FRAME");
    saveFrames("frame", "png", 1, 5);
  }
  // Changes the layout from grid to linear
  if (key === "s") {
    print("PRESSED S - SAVING GIF");
    saveGif("mySketch", 5);
  }
}

function preload() {
  happy_robot = loadImage("data/happy_robot.png");
  stressed_robot = loadImage("data/stressed_robot.png");
  mad_robot = loadImage("data/mad_robot.png");
}

function setup() {
  createCanvas(WIDTH, HEIGHT);
}

function draw() {
  background(220);

  // Draw the trace
  noFill();
  stroke(255);
  strokeWeight(5);
  line(0, LINE_HEIGHT, WIDTH, LINE_HEIGHT);

  // Draw a marker
  let currentPosX = frameCount % WIDTH;

  noStroke();
  fill(255, 0, 0);
  imageMode(CENTER);

  let robot_image;

  if (showFace) {
    // Pick a face
    if (currentPosX < WIDTH / 3) {
      robot_image = stressed_robot;
    } else if (currentPosX < (WIDTH * 2) / 3) {
      robot_image = mad_robot;
    } else {
      robot_image = happy_robot;
    }
    image(robot_image, currentPosX, LINE_HEIGHT, 50, 50);
  } else {
    circle(currentPosX, LINE_HEIGHT, 20);
  }
}
