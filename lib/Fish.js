let fishData = {}

function initFish() {
  fishData = {
    pixelPos: new cv.Point(0, 0),
    pos: new cv.Point(0, 0), // in cm
    log: [],
    averagePos: new cv.Point(0, 0),
    minuteAveragePoses: [],
    speed: 0,
    averageSpeed: 0,
    dirChanges: 0,
  }
}

function updateFish() {
  // position in pixels
  fishData.pixelPos.x = trackWindow.x + trackWindow.width / 2;
  fishData.pixelPos.y = trackWindow.y + trackWindow.height / 2;

  // draw the tank
  let tank = Arena.findTank();
  if (tank) {
    let log = fishData.log;
    // mapped from top left of tank (0, 0) to bottom right of tank (1, 1)
    fishData.pos.x = (fishData.pixelPos.x - tank.bound1.x) / (tank.bound2.x - tank.bound1.x);
    fishData.pos.y = (fishData.pixelPos.y - tank.bound1.y) / (tank.bound2.y - tank.bound1.y);
    log.push({
      time: video.currentTime,
      pos: new cv.Point(fishData.pos.x, fishData.pos.y)
    });
    if (log.length >= 2) {
      fishData.speed = Math.sqrt(
        (log[log.length - 2].pos.x - log[log.length - 1].pos.x) ** 2 +
        (log[log.length - 2].pos.y - log[log.length - 1].pos.y) ** 2
      );
      if (log.length >= 3) {
        if (!inOrder(log[log.length - 3].pos.x, log[log.length - 2].pos.x, log[log.length - 1].pos.x)) {
          this.dirChanges ++;
        }
      }
    }
    log[log.length - 1].speed = fishData.speed;

    $('#position').text(`${Math.floor(fishData.pos.x * 100)}%, ${Math.floor(fishData.pos.y * 100)}%`);
    $('#average-position').text(`${Math.floor(fishData.averagePos.x * 100)}%, ${Math.floor(fishData.averagePos.y * 100)}%`);
    $('#speed').text(`${fishData.speed.toFixed(4)} %/sec`);
  }

}
