/*globals $, console, tangelo*/

var PREFIX,
	showVis = false,
	currentStream = null,
	streamsToKill = [],
	canvas,
	visContext,
	DEBUG = true,
	RECORD_THRESHOLD = 200,
	config,
	id = localStorage.getItem("id"),
	currentSlide = localStorage.getItem("slide"),
	dragStartId = null,
	currentButton = -1,
	mouseHistory = [];

function loadHeatmap() {
	"use strict";
	if (currentStream !== null) {
		streamsToKill.splice(0, 0, currentStream);
	}
	$.ajax({
		url: "serverSide?operation=startStream",
		data: {
			userid : id,
			currentSlide : currentSlide
		},
		success: function (numResults) {
			visContext.clearRect(0, 0, $("heatmap").width(), $("heatmap").height());
			
			if (numResults === "COULDN'T GET DATA") {
				if (DEBUG) {
					console.warn("error getting tracking data: " + numResults);
				}
				return;
			}
			console.log(numResults);
			
			tangelo.stream.start("serverSide?operation=pollStream&userid=" + id, function (key) {
				tangelo.stream.run(key, function (p) {
					if (streamsToKill.indexOf(key) !== -1) {
						streamsToKill.remove(key);
						return false;
					}
					visContext.fillRect(p.x - 5, p.y - 5, 10, 10);
				}, 100);
			});
		},
		error: function (o, message, e) {
			if (DEBUG) {
				console.warn("error getting tracking data: " + message);
			}
		}
	});
}

function logMouse(e) {
	"use strict";
	// Capturing general mouse actions
	var date = new Date();
	mouseHistory.push({
		u: id,
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

function startTracking() {
	// Start / resume recording mouse actions for this user
	"use strict";
	var recordActions = true;
	
	if (id === null) {
		$.ajax({
			url: "serverSide?operation=start",
			success: function (newId) {
				if (newId === "NO DB CONNECTION" || newId === "CAN'T CREATE ID") {
					if (DEBUG) {
						console.warn(newId);
					}
					recordActions = false;
				} else {
					id = newId;
					localStorage.setItem("id", newId);
					currentSlide = config.startingSlide;
					localStorage.setItem("slide", currentSlide);
					recordActions = true;
					console.log("Starting new recording session with id: " + newId);
				}
			},
			error: function () {
				if (DEBUG) {
					console.warn("TANGELO CONNECTION ERROR");
				}
				recordActions = false;
			},
			async: false
		});
	} else {
		$.ajax({
			url: "serverSide?operation=resume",
			data: {
				userid: id
			},
			success: function (lastSlide) {
				if (lastSlide === "NO DB CONNECTION" || lastSlide === "DB ERROR") {
					if (DEBUG) {
						console.warn(lastSlide);
					}
					recordActions = false;
				} else if (lastSlide === "ID DOESN'T EXIST") {
					if (DEBUG) {
						console.warn(lastSlide + "; resetting localStorage and refreshing...");
					}
					recordActions = false;
					localStorage.removeItem("id");
					localStorage.removeItem("slide");
					location.reload();
				} else if (lastSlide === "NO HISTORY") {
					currentSlide = config.startingSlide;
					localStorage.setItem("slide", currentSlide);
					console.log("Resuming recording session with id: " + id);
				} else {
					currentSlide = lastSlide;
					localStorage.setItem("slide", currentSlide);
					console.log("Resuming recording session with id: " + id);
				}
			},
			error: function () {
				if (DEBUG) {
					console.warn("TANGELO CONNECTION ERROR");
				}
				recordActions = false;
			},
			async: false
		});
	}
	
	if (recordActions === true) {
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

function stopTracking() {
	"use strict";
	document.removeEventListener('mousemove', logMouse);
	document.removeEventListener('mousedown', setButton);
	document.removeEventListener('mouseup', unsetButton);
}

// Load the current slide
function loadSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg>";
	
	slide.leftClickAreas.forEach(function (a) {
		areas += "<path d='" + a.path +
			"' onclick='leftClick(event, \"" + a.targetSlide + "\")'></path>";
	});
	slide.rightClickAreas.forEach(function (a) {
		areas += "<path d='" + a.path +
			"' oncontextmenu='rightClick(event, \"" + a.targetSlide + "\")'></path>";
	});
	slide.dragStartAreas.forEach(function (a) {
		areas += "<path d='" + a.path +
			"' onmousedown='dragStart(event, \"" + a.id + "\")'></path>";
	});
	slide.dragTargetAreas.forEach(function (a) {
		var sourceIds = '["' + a.sourceIds.join('","') + '"]';
		areas += "<path d='" + a.path +
			"' onmouseup='dragTarget(event, \"" + a.targetSlide + "\", " + sourceIds + ")'></path>";
	});

	document.getElementById("image").setAttribute("src", PREFIX + config.slides[slideName].image);
	document.getElementById("areas").innerHTML = areas;
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
	
	if (showVis === true) {
		loadHeatmap();
	}
}

// Helper functions for changing slides
function leftClick(event, targetSlide) {
	"use strict";
	if (event.button === 0) {
		loadSlide(targetSlide);
	}
}

function rightClick(event, targetSlide) {
	"use strict";
	if (event.button === 2) {
		loadSlide(targetSlide);
	}
}

function dragStart(event, id) {
	"use strict";
	dragStartId = id;
}

function dragTarget(event, targetSlide, sourceIds) {
	"use strict";
	if (sourceIds.indexOf(dragStartId) !== -1) {
		loadSlide(targetSlide);
	}
}

function initSession(prefix) {
	"use strict";
	PREFIX = prefix;
	visContext = document.getElementById('heatmap');
	if (visContext !== null) {
		visContext = visContext.getContext('2d');
	}
	
	// Always suppress the default browser right-click behavior
	document.addEventListener('contextmenu', function (e) {
		e.preventDefault();
		return false;
	}, false);
	// Also suppress selection cursor when dragging
	document.addEventListener('mousedown', function (e) {
		e.preventDefault();
	}, false);
	
	// Load the slide configuration file
	$.ajax({
		url: PREFIX + "config.json",
		success: function (c) {
			config = c;
		},
		error: function (o, e1, e2) {
			throw e2;
		},
		dataType: "json",
		async: false
	});
	if (currentSlide === null) {
		currentSlide = config.startingSlide;
		localStorage.setItem("slide", currentSlide);
	}
	
	loadSlide(currentSlide);
}