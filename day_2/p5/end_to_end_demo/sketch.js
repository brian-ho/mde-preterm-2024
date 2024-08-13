// Global constants to layout our sketch
// Canvas dimensions
const WIDTH = 600;
const HEIGHT = 700;

const MARGIN = 50;
const GRAPH_HEIGHT = 100;

const X_MAX = WIDTH - MARGIN;
const X_MIN = MARGIN;
const DISPLAY_WIDTH = X_MAX - X_MIN;

const GRAPH_Y_MIN = HEIGHT - (GRAPH_HEIGHT + MARGIN);
const GRAPH_Y_MAX = HEIGHT - MARGIN;

const MAP_Y_MAX = HEIGHT - (GRAPH_HEIGHT + MARGIN * 2);
const MAP_Y_MIN = MARGIN;
const MAP_HEIGHT = MAP_Y_MAX - MAP_Y_MIN;

// Global variables
let table;

let maxLat;
let minLat;
let maxLng;
let minLng;
let minEle;
let maxEle;

let previousMapX;
let previousMapY;
let previousEle;
let previousGraphX;

let bldgs = [];

// Load the CSV
function loadTableData(table) {
  // Calculations to help scale data to the display
  let latCol = float(table.getColumn("latitude"));
  let lngCol = float(table.getColumn("longitude"));
  let eleCol = float(table.getColumn("elevation"));

  minLat = min(latCol);
  maxLat = max(latCol);

  minLng = min(lngCol);
  maxLng = max(lngCol);

  minEle = min(eleCol);
  maxEle = max(eleCol);
}

// Load a GeoJSON (the p5js.org web editor only supports JSON)
function loadBldgData(bldgData) {
  for (let feature of bldgData["features"]) {
    let bldg = [];
    for (let point of feature.geometry.coordinates[0]) {
      let x = map(point[0], minLng, maxLng, X_MIN, X_MAX);
      let y = map(point[1], minLat, maxLat, MAP_Y_MAX, MAP_Y_MIN);
      bldg.push([x, y]);
    }
    bldgs.push(bldg);
  }
}

// Draw the buildings
function drawBldgs() {
  noStroke();
  fill(255);

  for (let bldg of bldgs) {
    beginShape();
    for (let point of bldg) {
      vertex(point[0], point[1]);
    }
    endShape(CLOSE);
  }
}

// Load in data from files before setup
function preload() {
  table = loadTable("data/trace.csv", "csv", "header", loadTableData);
  loadJSON("data/nearby_buildings.json", loadBldgData);
}

// Create the canvas
function setup() {
  createCanvas(WIDTH, HEIGHT);
  console.log("Loaded table with " + table.getRowCount() + " rows");
  console.log("Loaded GeoJSON with " + bldgs.length + " features");
}

// Draw each frame
function draw() {
  background(255);

  // Styling for the bounds
  noStroke();
  fill(10);

  // Map bounds
  rect(X_MIN, MAP_Y_MIN, DISPLAY_WIDTH, MAP_HEIGHT);

  // Elevation graph bounds
  rect(X_MIN, GRAPH_Y_MIN, DISPLAY_WIDTH, GRAPH_HEIGHT);

  // Draw the buildings
  drawBldgs();

  // Keep track of the previous map and elevation graph points
  previousMapX = X_MAX;
  previousMapY = MAP_Y_MAX;
  previousEle = 0;
  previousGraphX = X_MAX;

  // Start a closed shape for the elevation profile
  beginShape();
  vertex(X_MAX, GRAPH_Y_MAX);

  // Loop over each trace point in the table
  for (let i = 0; i < table.getRowCount(); i++) {
    r = table.getRow(i);

    // Scale the position information to fit the map
    let mapX = map(r.getNum("longitude"), minLng, maxLng, X_MIN, X_MAX);
    let mapY = map(r.getNum("latitude"), minLat, maxLat, MAP_Y_MAX, MAP_Y_MIN);

    // Scale the elevation information to fit the graph
    let ele = map(r.getNum("elevation"), minEle, maxEle, 0, GRAPH_HEIGHT);
    let graphX = map(i, 0, table.getRowCount(), X_MAX, X_MIN);

    // Styling for the map path
    noFill();
    stroke(255);

    // Plot the map path
    line(previousMapX, previousMapY, mapX, mapY);

    let index = frameCount % table.getRowCount();
    let previousTraceCount = 50;

    // Trace for the map path
    if ((i > index - previousTraceCount) & (i <= index)) {
      let opacity = map(i, index - previousTraceCount, index, 0, 255);
      noStroke();
      fill(255, 0, 0, opacity);
      circle(mapX, mapY, ele);
    }

    // Marker for elevation graph
    if (i === index) {
      fill(255, 0, 0);
      text(r.getNum("elevation") + " meters", graphX, GRAPH_Y_MIN - 10);

      stroke(255, 0, 0);
      textAlign(CENTER);
      line(graphX, GRAPH_Y_MIN, graphX, GRAPH_Y_MAX);
    }

    // Add a vertex for the elevation graph
    vertex(graphX, GRAPH_Y_MAX - ele);

    // Update the prior positions
    previousMapX = mapX;
    previousMapY = mapY;

    previousEle = ele;
    previousGraphX = graphX;
  }
  fill(255);
  endShape(CLOSE);
}
