// globals
let cvReady = false;
let vidReady = false;
let state = "initial";
let trackWindow, cap, frame, hsv, hsvVec, dst, termCrit, low, high, mask, lowScalar, highScalar;
let video = $("#upload-preview")[0];
let scaleDown = 2;
let mouseX = mouseY = 0;
let mousePressed = false;
let output = $("#output")[0];
let sampleRate = 20; // in frames per second. How many fps is the video sampled at?
let timedelta; // determined each tick
let tickTimeout;

function inOrder(a, b, c) {
  let ab = b > a ? 1 : -1;
  let bc = c > b ? 1 : -1;
  return ab === bc;
}

function setStatus(newStat) {
  $("#status").text(newStat);
}
