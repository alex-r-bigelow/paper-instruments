/*globals $, console, tangelo, config, HotSpot, currentSlide:true, userid, DEBUG, connectedToServer */

var RECORD_THRESHOLD = 200,
	dragStartId = null,
	currentButton = -1,
	mouseHistory = [];

// load and track a user's interaction with a slide
function trackSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg>";
	
    slide.hotSpots.forEach(function (a) {
        var sourceIds;
        if (a.spotType === HotSpot.LEFT) {
            areas += "<path d='" + a.path +
                "' onclick='leftClick(event, \"" + a.targetSlide + "\")'></path>";
        } else if (a.spotType === HotSpot.RIGHT) {
            areas += "<path d='" + a.path +
                "' oncontextmenu='rightClick(event, \"" + a.targetSlide + "\")'></path>";
        } else if (a.spotType === HotSpot.DRAG_START) {
            areas += "<path d='" + a.path +
                "' onmousedown='dragStart(event, \"" + a.id + "\")'></path>";
        } else if (a.spotType === HotSpot.DRAG_STOP) {
            sourceIds = '["' + a.sourceIds.join('","') + '"]';
            areas += "<path d='" + a.path +
                "' onmouseup='dragTarget(event, \"" + a.targetSlide + "\", " + sourceIds + ")'></path>";
        }
	});

	document.getElementById("image").setAttribute("src", "data/" + slide.image);
	document.getElementById("areas").innerHTML = areas;
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
}

// Helper functions for tracking and changing slides
function logMouse(e) {
	"use strict";
	// Capturing general mouse actions
	var date = new Date();
	mouseHistory.push({
		u: userid,
		t: date.getTime(),
		x: e.clientX,
		y: e.clientY,
		b: currentButton,
		s: currentSlide
	});
	if (mouseHistory.length > RECORD_THRESHOLD) {
		$.ajax({
			url: "serverSide?operation=addMouseData",
			data: {
				history: JSON.stringify(mouseHistory)
			},
			success: function (message) {
				if (DEBUG) {
					if (message !== "SUCCESS") {
						console.warn("error logging last " + RECORD_THRESHOLD + " mouse states: " + message);
					} else {
						console.log('logged ' + RECORD_THRESHOLD + ' mouse states');
					}
				}
			},
			error: function (o, message, e) {
				if (DEBUG) {
					console.warn("error logging last " + RECORD_THRESHOLD + " mouse states: " + message);
				}
			}
		});
		mouseHistory = [];
	}
}

function setButton(e) {
	"use strict";
	currentButton = e.button;
	logMouse(e);
}

function unsetButton(e) {
	"use strict";
	dragStartId = null;
	currentButton = -1;
	logMouse(e);
}

function leftClick(event, targetSlide) {
	"use strict";
	if (event.button === 0) {
		trackSlide(targetSlide);
	}
}

function rightClick(event, targetSlide) {
	"use strict";
	if (event.button === 2) {
		trackSlide(targetSlide);
	}
}

function dragStart(event, id) {
	"use strict";
	dragStartId = id;
}

function dragTarget(event, targetSlide, sourceIds) {
	"use strict";
	if (sourceIds.indexOf(dragStartId) !== -1) {
		trackSlide(targetSlide);
	}
}

function startTrackingSession() {
    "use strict";
	if (connectedToServer === true) {
		if (DEBUG) {
			console.log('successfully established logging connection');
		}
		document.addEventListener('mousemove', logMouse, false);
		document.addEventListener('mousedown', setButton, false);
		document.addEventListener('mouseup', unsetButton, false);
	} else {
		if (DEBUG) {
			console.warn('could not establish logging connection');
		}
	}
}

function stopTrackingSession() {
	"use strict";
	document.removeEventListener('mousemove', logMouse);
	document.removeEventListener('mousedown', setButton);
	document.removeEventListener('mouseup', unsetButton);
}

function initTracking() {
	"use strict";
	// Always suppress the default browser right-click behavior
	document.addEventListener('contextmenu', function (e) {
		e.preventDefault();
		return false;
	}, false);
	// Also suppress selection cursor when dragging
	document.addEventListener('mousedown', function (e) {
		e.preventDefault();
	}, false);
	
	trackSlide(currentSlide);
    startTrackingSession();
}
initTracking();