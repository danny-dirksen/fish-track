let handlers = {
  track: function() {
    if (vidReady && cvReady && state === "ready") {
      setStatus("Tracking.");
      state = "tracking";
    }
  },
  pause: function() {
    if (state === "tracking") {
      setStatus("Ready.");
      state = "ready";
    }
  },
  restart: function() {
    if (vidReady && cvReady && state === "ready") {
      video.currentTime = 0.01;
      setStatus("Ready.");
      state = "ready";
    }
  },
  selectFish: function() {
    state = "placing-fish";
  },
  newArena: function() {
    state = "placing-arena";
    Arena.arenas.push(new Arena(0, 0, 1, 1, $("#arena-label").val()));
  },
  mouseMove: function(evt) {
    var rect = output.getBoundingClientRect();
    mouseX = (evt.clientX - rect.left) / (rect.right - rect.left) * output.width;
    mouseY = (evt.clientY - rect.top) / (rect.bottom - rect.top) * output.height;
  },
  mouseDown: function() {
    mousePressed = true;
  },
  mouseUp: function() {
    mousePressed = false;
  },
  mouseOut: function() {
    mousePressed = false;
  }
}

setStatus("Ready for video.");

$("#file-upload").change(function(evt) {
  vidReady = false;
  processing = false;
  tracking = false;
  video.src = URL.createObjectURL(evt.target.files[0]);
});

function onOpenCvReady() {
  setStatus("OpenCV has been loaded.");
  cv.onRuntimeInitialized = function() {
    cvReady = true;
    if (vidReady && cvReady && state == "initial") {
      state = "preparing";
      setTimeout(setupTracking, 100);
    }
  };
}

video.oncanplaythrough = function() {
  setStatus("Frame loaded.");
  vidReady = true;
  video.width = video.videoWidth / scaleDown;
  video.height = video.videoHeight / scaleDown;
  if (vidReady && cvReady && state == "initial") {
    state = "preparing";
    setTimeout(setupTracking, 100);
  }
}

document.onvisibilitychange = function() {
  handlers.pause();
}

function setupTracking() {
  setStatus("Setting up video for tracking.");
  initFish();
  cap = new cv.VideoCapture(video);
  frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  cap.read(frame);
  //cv.normalize(frame, frame, 0, 255, cv.NORM_MINMAX);

  trackWindow = new cv.Rect(1465 / scaleDown, 820 / scaleDown, 60 / scaleDown, 60 / scaleDown);
  mask = new cv.Mat();
  lowScalar = new cv.Scalar(0, 63, 6);
  highScalar = new cv.Scalar(106, 248, 149);

  // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
  termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);

  hsv = new cv.Mat();
  setStatus("Ready to track.");
  state = "ready";
  video.currentTime = 0.01;
  tickTimeout = setTimeout(tick, 100);
  video.onseeked = function() {
    clearTimeout(tickTimeout);
    tick();
  }
}



function tick() {
  timeDelta = 0;
  $("#state").text(state);
  switch (state) {
    case "stopped":
      // clean and stop.
      frame.delete(); hsv.delete(); mask.delete();
      state = "stopped";
      console.log("Finished.");
      return;
    case "ready":
      break;
    case "placing-fish":
      if (mousePressed) {
        state = "dragging-fish";
      } else {
        trackWindow.x = mouseX;
        trackWindow.y = mouseY;
      }
      break;
    case "dragging-fish":
      if (!mousePressed) {
        state = "ready";
      } else {
        trackWindow.width = mouseX - trackWindow.x;
        trackWindow.height = mouseY - trackWindow.y;
      }
      break;
    case "placing-arena":
      if (mousePressed) {
        state = "dragging-arena";
      } else {
        let arena = Arena.arenas[Arena.arenas.length - 1];
        arena.bound1.x = mouseX;
        arena.bound1.y = mouseY;
        arena.bound2.x = mouseX + 1;
        arena.bound2.y = mouseY + 1;
      }
      break;
    case "dragging-arena":
      if (!mousePressed) {
        $("#arena-label").val(`Arena ${Arena.arenas.length}`);
        state = "ready";
      } else {
        let arena = Arena.arenas[Arena.arenas.length - 1];
        arena.bound2.x = mouseX;
        arena.bound2.y = mouseY;
      }
      break;
    case "tracking":
      if (video.currentTime < video.duration) {
        // Apply meanshift to get the new location
        // and it also returns number of iterations meanShift took to converge,
        // which is useless in this demo.
        timeDelta = 1 / sampleRate;
        video.currentTime += timeDelta;
        [, trackWindow] = cv.meanShift(mask, trackWindow, termCrit);
      } else {
        state = "stopped";
        break;
      }
      break;
  }
  updateFish();
  // read the frame all the time
  cap.read(frame);
  cv.normalize(frame, frame, 0, 255, cv.NORM_MINMAX);
  cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  lowScalar[0] = parseInt($("#low-hue")[0].value);
  lowScalar[1] = parseInt($("#low-sat")[0].value);
  lowScalar[2] = parseInt($("#low-val")[0].value);
  highScalar[0] = parseInt($("#high-hue")[0].value);
  highScalar[1] = parseInt($("#high-sat")[0].value);
  highScalar[2] = parseInt($("#high-val")[0].value);

  low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lowScalar);
  high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), highScalar);
  cv.inRange(hsv, low, high, mask);
  low.delete();
  high.delete();



  // draw fish
  let [x, y, w, h] = [trackWindow.x, trackWindow.y, trackWindow.width, trackWindow.height];
  cv.rectangle(frame, new cv.Point(x, y), new cv.Point(x+w, y+h), [0, 255, 0, 255], 2);

  // draw arenas, including tank
  Arena.drawAll(fishData.pos);

  cv.imshow('output', frame);
  cv.imshow('mask-output', mask);

  tickTimeout = setTimeout(tick, 100);
};
