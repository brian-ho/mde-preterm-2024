const WIDTH = 600;
const HEIGHT = 600;

let table;
let coords = [];

// Load the CSV
// Calculations to help scale data to the display
function loadTableData(table) {
  let timeCol = float(table.getColumn("elapsed_time_seconds"));
  let elevationCol = float(table.getColumn("elevation"));

  minTime = min(timeCol);
  maxTime = max(timeCol);

  minElevation = min(elevationCol);
  maxElevation = max(elevationCol);

  for (let i = 0; i < table.getRowCount(); i++) {
    let r = table.getRow(i);
    let x = map(
      r.getNum("elapsed_time_seconds"),
      minTime,
      maxTime,
      50,
      WIDTH - 50
    );
    let y = map(
      r.getNum("elevation"),
      minElevation,
      maxElevation,
      HEIGHT - 150,
      150
    );
    let coord = createVector(x, y);
    console.log(coord.x, coord.y);
    coords.push(coord);
  }
}

function preload() {
  table = loadTable("data/trace.csv", "csv", "header", loadTableData);
  img = loadImage("data/robot.png");
}

function setup() {
  createCanvas(WIDTH, HEIGHT);
  console.log("Loaded " + coords.length + " coordinates");
}

function draw() {
  background(220);

  // Trace the elevation path
  noFill();
  stroke(255);
  strokeWeight(4);

  beginShape();
  for (let i = 0; i < coords.length; i++) {
    let coord = coords[i];
    vertex(coord.x, coord.y);
  }
  endShape();

  // Get the data matching the current frame
  let current = frameCount % coords.length;
  let currentPosition = coords[current];

  // Marker
  fill(255, 0, 0);
  imageMode(CENTER);
  circle(currentPosition.x, currentPosition.y, 20);
  image(img, currentPosition.x, currentPosition.y - 50, 64, 64);

  // Label
  noStroke();
  textAlign(CENTER);
  text(table.getNum(current, "elevation") + " meters", currentPosition.x, 550);

  // Vertical line
  stroke(255, 0, 0);
  strokeWeight(1);
  line(currentPosition.x, 530, currentPosition.x, currentPosition.y);
}
