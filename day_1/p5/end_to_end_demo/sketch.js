// Define the canvas
const HEIGHT = 700;
const WIDTH = 900;
const TITLE_HEIGHT = 100;
const DRAWING_HEIGHT = HEIGHT - TITLE_HEIGHT;
const intervals = 11;
const intervalWidth = WIDTH / intervals;
const intervalHeight = DRAWING_HEIGHT / intervals;

// Global constants for layout
const MATRIX = "matrix";
const LINE = "line";
const MAP = "map";
const layoutModes = [MATRIX, LINE, MAP];

// Global constants for sorting
const DATE = "date";
const IMAGE_WIDTH = "imageWidth";
const IMAGE_HEIGHT = "imageHeight";
const ALTITUDE = "alt";
const COLOR = "currentColor";
const sortByModes = [DATE, IMAGE_WIDTH, IMAGE_HEIGHT, ALTITUDE, COLOR];

// Global variables
let canvas;
let countries = [];
let table;
let glyphSystem;

// Interactions that change display and sort
function changeShapeMode() {
  glyphSystem.rectangleMode = !glyphSystem.rectangleMode;
}

function keyPressed() {
  // Changes sort order
  if (keyCode === 32) {
    glyphSystem.advanceSortByMode();
  }
  // Changes which of the top 10 colors per image is shown
  if (key === "c") {
    glyphSystem.advanceColor();
  }
  // Changes the layout from grid to linear
  if (key === "m") {
    glyphSystem.advanceLayoutMode();
  }
}

// Load a GeoJSON (the p5js.org web editor only supports JSON)
function loadWorldData(worldData) {
  for (let feature of worldData["features"]) {
    let country = [];
    for (let point of feature.geometry.coordinates[0]) {
      let x = map(point[0], -180, 180, 0, WIDTH);
      let y = map(point[1], -90, 90, HEIGHT, TITLE_HEIGHT);
      country.push([x, y]);
    }
    countries.push(country);
  }
}

// Draw the world
function drawWorld() {
  for (let country of countries) {
    noStroke();
    fill(240);
    beginShape();
    for (let point of country) {
      vertex(point[0], point[1]);
    }
    endShape(CLOSE);
  }
}

// Our overall system of glyphs
class GlyphSystem {
  constructor(table) {
    this.table = table;

    this.glyphs = [];
    this.colorIndex = 0;
    this.rectangleMode = true;
    this.sortByMode = DATE;
    this.layoutMode = MATRIX;
    this.minAlt = 0;
    this.maxAlt = 0;
    this.minImageWidth = 0;
    this.maxImageWidth = 0;
    this.minImageHeight = 0;
    this.maxImageHeight = 0;

    this.addGlyphs(this.table);
  }

  advanceSortByMode() {
    let currentIndex = sortByModes.indexOf(this.sortByMode);
    this.sortByMode = sortByModes[(currentIndex + 1) % sortByModes.length];
  }

  advanceColor() {
    this.colorIndex = (this.colorIndex + 1) % 10;
  }

  advanceLayoutMode() {
    let currentIndex = layoutModes.indexOf(this.layoutMode);
    this.layoutMode = layoutModes[(currentIndex + 1) % layoutModes.length];

    if (this.layoutMode === LINE) {
      this.sortByMode = DATE;
    } else {
      this.sortByMode = ALTITUDE;
    }
  }

  addGlyphs(table) {
    let altCol = float(table.getColumn("altitude"));
    this.minAlt = min(altCol);
    this.maxAlt = max(altCol);

    let imageWidthCol = float(table.getColumn("image_width"));
    this.minImageWidth = min(imageWidthCol);
    this.maxImageWidth = max(imageWidthCol);

    let imageHeightCol = float(table.getColumn("image_height"));
    this.minImageHeight = min(imageHeightCol);
    this.maxImageHeight = max(imageHeightCol);

    for (let i = 0; i < table.getRowCount(); i++) {
      let row = table.getRow(i);

      let lat = row.getNum("latitude");
      let lng = row.getNum("longitude");
      let alt = row.getNum("altitude");
      let date = new Date(row.get("date"));
      let image_name = row.get("image_name");
      let image_width = row.getNum("image_width");
      let image_height = row.getNum("image_height");
      let red = JSON.parse(row.get("red"));
      let green = JSON.parse(row.get("green"));
      let blue = JSON.parse(row.get("blue"));
      let colorCount = JSON.parse(row.get("color_count"));

      this.glyphs.push(
        new Glyph(
          lat,
          lng,
          alt,
          date,
          image_name,
          image_width,
          image_height,
          red,
          green,
          blue,
          colorCount,
          this
        )
      );
    }
    console.log("Added " + this.glyphs.length + " glyphs ...");
  }
  run() {
    if (this.sortByMode === COLOR) {
      this.glyphs.sort((a, b) => hue(a.currentColor) - hue(b.currentColor));
    } else {
      this.glyphs.sort((a, b) => a[this.sortByMode] - b[this.sortByMode]);
    }
    for (let i = this.glyphs.length - 1; i >= 0; i -= 1) {
      let glyph = this.glyphs[i];
      glyph.display(i);
    }
  }
}

// Each individual glyph
class Glyph {
  constructor(
    lat,
    lng,
    alt,
    date,
    image_name,
    image_width,
    image_height,
    red,
    green,
    blue,
    colorCount,
    glyphSystem
  ) {
    this.lat = lat;
    this.lng = lng;
    this.alt = alt;
    this.date = date;
    this.imageName = image_name;
    this.imageWidth = image_width;
    this.imageHeight = image_height;
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.colorCount = colorCount;
    this.totalColorCount = colorCount.reduce((a, b) => a + b);
    this.glyphSystem = glyphSystem;

    this.velocity = createVector(0, 0);
    this.pos = createVector(WIDTH / 2, DRAWING_HEIGHT / 2 + TITLE_HEIGHT);
    this.dest = this.pos;

    this.radius;
    this.calcRadius();

    this.currentColor;
    this.updateCurrentColor();
  }

  updatePos(index, layoutMode) {
    // Update the destination
    let x;
    let y;

    // Matrix mode is based on sort order
    if (layoutMode === MATRIX) {
      x = intervalWidth * ((index % intervals) + 0.5);
      y = TITLE_HEIGHT + intervalHeight * (floor(index / intervals) + 0.5);
    }

    // Line mode is based on sort oder
    else if (layoutMode === LINE) {
      x =
        index * ((WIDTH - intervalWidth) / this.glyphSystem.glyphs.length) +
        intervalWidth / 2;
      y = TITLE_HEIGHT + DRAWING_HEIGHT / 2;
    }

    // Map mode is based on location
    else if (layoutMode === MAP) {
      x = map(this.lng, -180, 180, 0, WIDTH);
      y = map(this.lat, -90, 90, HEIGHT, TITLE_HEIGHT);
    }

    // Calculate destination, velocity and position
    this.dest = createVector(x, y);
    this.velocity = this.dest.sub(this.pos);

    if (abs(this.velocity.mag()) > 10) {
      this.velocity.setMag(10);
    }

    this.pos = this.pos.add(this.velocity);
  }

  updateCurrentColor() {
    let i = this.glyphSystem.colorIndex;
    this.currentColor = color(this.red[i], this.green[i], this.blue[i]);
  }

  calcRadius() {
    this.radius = map(
      this.alt,
      this.glyphSystem.minAlt,
      this.glyphSystem.maxAlt,
      3,
      30
    );
  }

  rendering(glyphWidth, glyphHeight, rectangleMode, layoutMode) {
    // Render as a circle
    if (!rectangleMode) {
      circle(
        this.pos.x,
        this.pos.y - (layoutMode === MAP ? 0 : 10),
        this.radius * 2
      );
    } else {
      let x0 = this.pos.x - glyphWidth / 2;
      let y0 = this.pos.y - glyphHeight;
      let glyphRunningHeight = 0;

      for (let i = 0; i < this.colorCount.length; i += 1) {
        let colorHeight = map(
          this.colorCount[i],
          0,
          this.totalColorCount,
          1,
          glyphHeight
        );

        fill(this.red[i], this.green[i], this.blue[i]);
        rect(x0, y0 + glyphRunningHeight, glyphWidth, colorHeight);

        glyphRunningHeight += colorHeight;
      }
    }
  }

  // Displays the glyph
  display(i) {
    let sortByMode = this.glyphSystem.sortByMode;
    let layoutMode = this.glyphSystem.layoutMode;
    let rectangleMode = this.glyphSystem.rectangleMode;
    let colorIndex = this.glyphSystem.colorIndex;

    noStroke();
    textAlign(CENTER);

    this.updateCurrentColor();
    this.updatePos(i, layoutMode);

    fill(this.currentColor);

    // Text caption
    let caption = "";
    if ((sortByMode === IMAGE_WIDTH) | (sortByMode === IMAGE_HEIGHT)) {
      caption = str(this.imageWidth + "x" + this.imageHeight);
    } else if (sortByMode === DATE) {
      caption = str(this.date.getFullYear() + "-" + this.date.getMonth());
    } else if (sortByMode === ALTITUDE) {
      caption = str(round(this.alt)) + "m";
    } else if (sortByMode === COLOR) {
      caption = round(hue(this.currentColor));
    }

    // Default display width and height
    let glyphWidth = 5;
    let glyphHeight = map(
      this.imageHeight,
      this.glyphSystem.minImageHeight,
      this.glyphSystem.maxImageHeight,
      10,
      intervalHeight - 30
    );

    // Matrix mode
    if (layoutMode === MATRIX) {
      glyphWidth = map(
        this.imageWidth,
        this.glyphSystem.minImageWidth,
        this.glyphSystem.maxImageWidth,
        10,
        intervalWidth - 10
      );
      this.rendering(glyphWidth, glyphHeight, rectangleMode, layoutMode);

      // Show a caption for each glyph
      noStroke(0);
      fill(0);
      text(caption, this.pos.x, this.pos.y + 20);
    }
    // Line mode
    else if (layoutMode === LINE) {
      let glyphHeight = map(
        this.alt,
        this.glyphSystem.minAlt,
        this.glyphSystem.maxAlt,
        10,
        100
      );
      this.rendering(glyphWidth, glyphHeight, rectangleMode, layoutMode);
      if ((i % 20 === 0) | (i === table.getRowCount() - 1)) {
        noStroke(0);
        fill(0);
        text(caption, this.pos.x, this.pos.y + 30);
      }
    } else if (layoutMode === MAP) {
      let glyphHeight = map(
        this.alt,
        this.glyphSystem.minAlt,
        this.glyphSystem.maxAlt,
        10,
        100
      );
      this.rendering(glyphWidth, glyphHeight, rectangleMode, layoutMode);
    }
  }
}

function preload() {
  table = loadTable("data/data.csv", "csv", "header");
  loadJSON("data/world.json", loadWorldData);
}

function setup() {
  canvas = createCanvas(WIDTH, HEIGHT);
  canvas.mouseClicked(changeShapeMode);
  glyphSystem = new GlyphSystem(table);
}

function draw() {
  background(255);

  // Draw the titleblock
  let layoutTitle = "";
  if (glyphSystem.layoutMode === MAP) {
    drawWorld();
    layoutTitle = "Places";
  } else if (glyphSystem.layoutMode === MATRIX) {
    layoutTitle = "Images";
  } else if (glyphSystem.layoutMode === LINE) {
    layoutTitle = "Order";
  }

  let sortTitle = "";
  if (glyphSystem.sortByMode === DATE) {
    sortTitle = "Date";
  } else if (glyphSystem.sortByMode === COLOR) {
    sortTitle = "Hue";
  } else if (glyphSystem.sortByMode === IMAGE_WIDTH) {
    sortTitle = "Image Width";
  } else if (glyphSystem.sortByMode === IMAGE_HEIGHT) {
    sortTitle = "Image Height";
  } else if (glyphSystem.sortByMode === ALTITUDE) {
    sortTitle = "Altitude";
  }

  push();
  textAlign(CENTER);
  fill(0);

  textSize(24);
  textStyle(BOLD);
  text("A Decade In " + layoutTitle, WIDTH / 2, TITLE_HEIGHT / 2);

  textSize(18);
  textStyle(NORMAL);
  text("Sorted By " + sortTitle, WIDTH / 2, TITLE_HEIGHT - 25);
  pop();

  glyphSystem.run();
}
