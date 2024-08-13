let table;
function preload() {
  table = loadTable("data/example_data.csv", "csv", "header");
}

function setup() {
  createCanvas(800, 400);
  background(0);

  console.log("Table has " + table.rows.length + " rows.");

  for (let i = 0; i < table.getRowCount(); i++) {
    let r = table.getRow(i);
    let date = new Date(r.get("date"));
    let alt = r.getNum("altitude");
    let first_color = r.get("color_1");

    noStroke();
    fill(first_color);

    let x = 60 * i + 100;
    let y = 350;
    let rectWidth = 20;
    let rectHeight = map(alt, 0, 1500, 0, 300);
    let displayDate = date.getFullYear() + "-" + date.getMonth();

    rect(x - rectWidth / 2, y - rectHeight, rectWidth, rectHeight);

    textAlign(CENTER);
    textSize(14);
    text(displayDate, x, y + 20);
  }
}

function draw() {}
