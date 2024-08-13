function setup() {
  // Size our canvas
  createCanvas(400, 400);
}

function draw() {
  // Set the background color
  background(0);

  // Draw a rectangle! Processing is a "left-hand" coordinate system
  // The top-left corner is (0, 0)
  // Positive x goes right, positive y goes down\
  rect(0, 0, 100, 100);

  // Draw a circle! Change the fill first
  noStroke();
  fill(255, 0, 0);
  circle(350, 350, 75);

  // Animate some text!
  noStroke();
  fill(255);
  let pos_x = (frameCount * 2) % width;
  textStyle(BOLD);
  textSize(16);
  text("Hello there", pos_x, 350);

  // Isolate a style group
  push();
  // Translate and rotate
  translate(200, 200);
  rotate(radians(frameCount % 360));

  // Some styling
  strokeWeight(4);
  stroke(0, 255, 255);
  fill(0, 255, 255, 100);

  // Draw a shape!
  beginShape();
  vertex(-50, -50);
  vertex(50, 50);
  vertex(-50, 150);
  endShape();
  pop();
}
