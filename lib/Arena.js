// whether three numbers are in numerical order. could be increasing or decreasing.
class Arena {

  static arenas = [];
  static tank;

  static findTank() {
    if (this.tank && this.tank.label == "Tank") {
      return this.tank;
    }
    this.tank = this.arenas.find(arena => arena.label === "Tank") || null;
    return this.tank;
  }

  static drawAll() {
    this.arenas.forEach((arena, index) => {
      arena.draw(index + 1);
    });
  }

  constructor (x1, y1, x2, y2, label) {
    this.bound1 = new cv.Point(Math.min(x1, x2), Math.min(y1, y2));
    this.bound2 = new cv.Point(Math.max(x1, x2), Math.max(y1, y2));
    this.timeIn = 0;
    this.label = label;
    $("#arena-table").append(`<tr><td></td><td></td></tr>`);

  }

  draw(tableRow) {
    // semitransparent blue when fish is not in Arena
    let color = [0, 0, 255, 64];
    if (
      inOrder(this.bound1.x, fishData.pixelPos.x, this.bound2.x) &&
      inOrder(this.bound1.y, fishData.pixelPos.y, this.bound2.y)
    ) {
      // make Arena fully visible when fish is in Arena
      color[3] = 255;
      this.timeIn += timeDelta;
    }

    cv.rectangle(frame, this.bound1, this.bound2, color, 1);
    let row = $("#arena-table").children()[tableRow];
    let labelD = row.children[0];
    let timeInD = row.children[1];
    if (labelD.innerText != this.label || timeInD.innerText != this.timeIn.toFixed(2).toString()) {
      labelD.innerText = this.label;
      timeInD.innerText = this.timeIn.toFixed(2).toString();
    }
  }
}
