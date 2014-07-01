/*globals $, console, currentSlide, userid, DEBUG, connectedToServer, INTERACTIONS, initInteraction */

var RECORD_THRESHOLD = 200,
	mouseHistory = [];

function logTransition(prevSlide, nextSlide) {
    "use strict";
    var date = new Date();
    $.ajax({
        url: "serverSide?operation=addTransition",
        data: {
            motion: JSON.stringify({
                u: userid,
                t: date.getTime(),
                p: prevSlide,
                n: nextSlide
            })
        },
        success: function (message) {
            if (DEBUG) {
                if (message !== "SUCCESS") {
                    console.warn("error logging transition: " + message);
                } else {
                    console.log('logged transition');
                }
            }
        },
        error: function (o, message, e) {
            if (DEBUG) {
                console.warn("error logging transition: " + message);
            }
        }
    });
}

function logMouse(e) {
	"use strict";
	// Capturing general mouse actions
	var date = new Date(),
        buttons = "";
    if (INTERACTIONS.LEFT_MOUSE !== null) {
        buttons += "Y";
    } else {
        buttons += "N";
    }
    if (INTERACTIONS.CENTER_MOUSE !== null) {
        buttons += "Y";
    } else {
        buttons += "N";
    }
    if (INTERACTIONS.RIGHT_MOUSE !== null) {
        buttons += "Y";
    } else {
        buttons += "N";
    }
	mouseHistory.push({
		u: userid,
		t: date.getTime(),
		x: e.clientX,
		y: e.clientY,
		b: buttons,
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

function startTrackingSession() {
    "use strict";
	if (connectedToServer === true) {
		if (DEBUG) {
			console.log('successfully established logging connection');
		}
		document.addEventListener('mousemove', logMouse, false);
	} else {
		if (DEBUG) {
			console.warn('could not establish logging connection');
		}
	}
}

function stopTrackingSession() {
	"use strict";
	document.removeEventListener('mousemove', logMouse);
}

initInteraction(logTransition);
startTrackingSession();