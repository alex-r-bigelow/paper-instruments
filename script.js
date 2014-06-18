/*globals $, console, tangelo*/

var currentStream = null,
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

// Helper classes for editor
function HotSpot(configElement) {
	"use strict";
	var self = this;
	
	self.hash = String(HotSpot.HASH);
	HotSpot.ALL[self.hash] = self;
	HotSpot.HASH += 1;
	
	self.configElement = configElement;
	self.segments = HotSpot.extractSegments(self.configElement.path);
}
HotSpot.HASH = 0;
HotSpot.ALL = {};

HotSpot.SELECTED_HASH = null;

HotSpot.LEFT = "LEFT";
HotSpot.RIGHT = "RIGHT";
HotSpot.DRAG_START = "DRAG_START";
HotSpot.DRAG_STOP = "DRAG_STOP";

HotSpot.extractSegments = function (path) {
	"use strict";
	var numbers = path.replace(new RegExp("[a-zA-Z]", "g"), ",").split(","),
		letterString = path.replace(new RegExp("[0-9]", "g"), ""),
		letters = letterString.split(","),
		lowerLetters = letterString.toLowerCase().split(","),
		segments = [],
		splicedNumbers,
		l;
	
	// There's an empty entry at the beginning
	numbers.splice(0, 1);
	
	for (l = 0; l < letters.length; l += 1) {
		if (lowerLetters[l] === "z") {
			segments.push({
				segType : letters[l],
				points : []
			});
		} else if (lowerLetters[l] === "m" || lowerLetters[l] === "l" || lowerLetters[l] === "t") {
			splicedNumbers = numbers.splice(0, 2);
			segments.push({
				segType : letters[l],
				points : [
					{
						X : splicedNumbers[0],
						Y : splicedNumbers[1]
					}
				]
			});
		} else if (lowerLetters[l] === "s" || lowerLetters[l] === "q") {
			splicedNumbers = numbers.splice(0, 4);
			segments.push({
				segType : letters[l],
				points : [
					{
						X : splicedNumbers[0],
						Y : splicedNumbers[1]
					},
					{
						X : splicedNumbers[2],
						Y : splicedNumbers[3]
					}
				]
			});
		}
	}
	return segments;
};

HotSpot.prototype.generateHandles = function () {
	"use strict";
	var self = this,
		result = "",
		s,
		h,
		p;
	for (s = 0; s < self.segments.length; s += 1) {
		for (p = 0; p < self.segments[s].points.length; p += 1) {
			h = self.segments[s].points[p];
			result += "<circle cx='" + h.X + "' cy='" + h.Y + "' r='5' " +
				"id='handle_" + s + "_" + p + "' " +
				"onmousedown='HotSpot.ALL[\"" + self.hash + "\"]" +
				".dragHandle(event, \"" + s + "\", \"" + p + "\");'></circle>";
		}
	}
	return result;
};

HotSpot.prototype.changeType = function (event) {
	"use strict";
	var self = this,
        newType = event.target.value;
	
	if (newType === HotSpot.LEFT) {
		
	} else if (newType === HotSpot.RIGHT) {
		
	} else if (newType === HotSpot.DRAG_START) {
		
	} else if (newType === HotSpot.DRAG_STOP) {
		
	}
    self.configElement.spotType = newType;
};

HotSpot.prototype.startDragging = function (event) {
	"use strict";
	var self = this,
		origins = {},
		newPos,
		target,
		s,
		p,
		move = function (event) {
			event.preventDefault();
			
			for (s = 0; s < self.segments.length; s += 1) {
				for (p = 0; p < self.segments[s].points.length; p += 1) {
					newPos = {
						X : event.clientX - origins[s][p].X,
						Y : event.clientY - origins[s][p].Y
					};
					self.segments[s].points[p] = newPos;
					target = document.getElementById("handle_" + s + "_" + p);
					target.setAttribute("cx", newPos.X);
					target.setAttribute("cy", newPos.Y);
				}
			}
			
			self.update();
			
			return true;
		},
		up = function (event) {
			document.removeEventListener("mousemove", move);
			document.removeEventListener("mouseup", up);
			
			return move(event);
		};
	
	// change the selected HotSpot
	
	if (HotSpot.SELECTED_HASH !== null) {
		document.getElementById("hotSpot_" + HotSpot.SELECTED_HASH).removeAttribute("class");
	}
	HotSpot.SELECTED_HASH = self.hash;
	document.getElementById("hotSpot_" + self.hash).setAttribute("class", "selected");
	document.getElementById("handles").innerHTML = self.generateHandles();
	$("#hotSpotConfig input").removeAttr('disabled');
	$("#hotSpotConfig select").removeAttr('disabled');
	document.getElementById("hotSpotType").setAttribute("onchange", "HotSpot.ALL['" + self.hash + "'].changeType(event);");
	
	// Now handle dragging the whole shape
	
	event.preventDefault();
	
	for (s = 0; s < self.segments.length; s += 1) {
		origins[s] = {};
		for (p = 0; p < self.segments[s].points.length; p += 1) {
			origins[s][p] = {
				X : event.clientX - self.segments[s].points[p].X,
				Y : event.clientY - self.segments[s].points[p].Y
			};
		}
	}
	
	document.addEventListener("mousemove", move);
	document.addEventListener("mouseup", up);
	
	return true;
};

HotSpot.prototype.update = function () {
	"use strict";
	var self = this,
		d = "",
		s,
		p,
		pt;
	
	for (s = 0; s < self.segments.length; s += 1) {
		d += self.segments[s].segType;
		for (p = 0; p < self.segments[s].points.length; p += 1) {
			pt = self.segments[s].points[p];
			d += pt.X + "," + pt.Y;
		}
	}
	
	self.configElement.path = d;
	document.getElementById("hotSpot_" + self.hash).setAttribute("d", d);
};

HotSpot.prototype.dragHandle = function (event, segmentNo, pointNo) {
	"use strict";
	var self = this,
		previousPosition = self.segments[segmentNo].points[pointNo],
		origin = {
			X : event.clientX - previousPosition.X,
			Y : event.clientY - previousPosition.Y
		},
		target = event.target,
		newPos,
		move = function (event) {
			event.preventDefault();
			
			newPos = {
				X : event.clientX - origin.X,
				Y : event.clientY - origin.Y
			};
			self.segments[segmentNo].points[pointNo] = newPos;
			target.setAttribute("cx", newPos.X);
			target.setAttribute("cy", newPos.Y);
			
			self.update();
			
			return true;
		},
		up = function (event) {
			document.removeEventListener("mousemove", move);
			document.removeEventListener("mouseup", up);
			
			return move(event);
		};
	
	event.preventDefault();
	
	document.addEventListener("mousemove", move);
	document.addEventListener("mouseup", up);
	
	return true;
};

function initVis() {
	"use strict";
    /*
	if (currentStream !== null) {
		streamsToKill.splice(0, 0, currentStream);
	}
	$.ajax({
		url: "serverSide?operation=countStream",
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
			
			tangelo.stream.start("../serverSide?operation=pollStream&userid=" + id, function (key) {
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
	});*/
}

// load and track a user's interaction with a slide
function trackSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg>";
	
    slide.hotSpots.forEach(function (a) {
        var sourceIds;
        if (a.type === HotSpot.LEFT) {
            areas += "<path d='" + a.path +
                "' onclick='leftClick(event, \"" + a.targetSlide + "\")'></path>";
        } else if (a.type === HotSpot.RIGHT) {
            areas += "<path d='" + a.path +
                "' oncontextmenu='rightClick(event, \"" + a.targetSlide + "\")'></path>";
        } else if (a.type === HotSpot.DRAG_START) {
            areas += "<path d='" + a.path +
                "' onmousedown='dragStart(event, \"" + a.id + "\")'></path>";
        } else if (a.type === HotSpot.DRAG_STOP) {
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

function stopTrackingSession() {
	"use strict";
	document.removeEventListener('mousemove', logMouse);
	document.removeEventListener('mousedown', setButton);
	document.removeEventListener('mouseup', unsetButton);
}

function initTracking() {
	"use strict";
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
		url: "data/config.json",
		success: function (c) {
			config = c;
		},
		error: function (o, e1, e2) {
			throw e2;
		},
		dataType: "json",
		async: false
	});
	if (currentSlide === null || config.slides.hasOwnProperty(currentSlide) === false) {
		currentSlide = config.startingSlide;
		localStorage.setItem("slide", currentSlide);
	}
	
	trackSlide(currentSlide);
    startTrackingSession();
}

// Edit a slide
function editSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg>",
		hotSpot;
	
	HotSpot.SELECTED_HASH = null;
	
    slide.hotSpots.forEach(function (a) {
		hotSpot = new HotSpot(a);
		areas += "<path id='hotSpot_" + hotSpot.hash + "' " +
			"d='" + a.path + "' " +
			"onmousedown='HotSpot.ALL[\"" + hotSpot.hash + "\"]" +
			".startDragging(event);'></path>";
	});
	
	areas += "<g id='handles'></g>";
	
	document.getElementById("image").setAttribute("src", "data/" + slide.image);
	document.getElementById("areas").innerHTML = areas;
	
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
	document.getElementById("slideSelect").value = currentSlide;
	document.getElementById("slideName").value = currentSlide;
	document.getElementById("slideName").removeAttribute("class");
	document.getElementById("slideImage").value = slide.image;
	document.getElementById("hotSpotType").removeAttribute("onchange");
	$("#hotSpotConfig input").attr('disabled', true);
	$("#hotSpotConfig select").attr('disabled', true);
}

function createSlideOption(selectId, slideName) {
	"use strict";
	var op = document.createElement("option");
	op.value = slideName;
	op.textContent = slideName;
	op.id = selectId + slideName;
	document.getElementById(selectId).appendChild(op);
}

function addNewSlide() {
	"use strict";
	var slideName = "New Slide",
		count = 1,
		op,
		slideSelect = document.getElementById("slideSelect");
	
	while (config.slides.hasOwnProperty(slideName)) {
		slideName = "New Slide " + count;
		count += 1;
	}
	
	config.slides[slideName] = {
		"image" : config.slides[currentSlide].image,
		"leftClickAreas" : [],
		"rightClickAreas" : [],
		"dragStartAreas" : [],
		"dragTargetAreas" : []
	};
	createSlideOption("slideSelect", slideName);
	createSlideOption("targetSlideSelect", slideName);
	
	editSlide(slideName);
}

function updateSlideName(event) {
	"use strict";
	var newSlide = event.target.value,
		temp;
	if (config.slides.hasOwnProperty(newSlide)) {
		event.target.value = currentSlide;
		event.target.setAttribute("class", "error");
		return;
	} else {
		event.target.removeAttribute("class");
	}
	
	config.slides[newSlide] = config.slides[currentSlide];
	delete config.slides[currentSlide];
	
	temp = document.getElementById("slideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "slideSelect" + newSlide;
	
	temp = document.getElementById("targetSlideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "targetSlideSelect" + newSlide;
	currentSlide = newSlide;
}

function updateSlideImage(event) {
	"use strict";
	var newImage = event.target.value,
		temp;
	
	config.slides[currentSlide].image = newImage;
	document.getElementById("image").setAttribute("src", "data/" + newImage);
}

function downloadConfig() {
	"use strict";
	var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(config)));
    pom.setAttribute('download', 'config.json');
    pom.click();
}

function initEditor() {
	"use strict";
	var slideName,
		slideSelect = document.getElementById("slideSelect"),
		op;
	// Load the slide configuration file
	$.ajax({
		url: "data/config.json",
		success: function (c) {
			config = c;
		},
		error: function (o, e1, e2) {
			throw e2;
		},
		dataType: "json",
		async: false
	});
	if (currentSlide === null || config.slides.hasOwnProperty(currentSlide) === false) {
		currentSlide = config.startingSlide;
		localStorage.setItem("slide", currentSlide);
	}
	
	for (slideName in config.slides) {
		if (config.slides.hasOwnProperty(slideName)) {
			createSlideOption("slideSelect", slideName);
			createSlideOption("targetSlideSelect", slideName);
		}
	}
	slideSelect.addEventListener("change", function (event) {
		editSlide(slideSelect.value);
	});
	
	editSlide(currentSlide);
}