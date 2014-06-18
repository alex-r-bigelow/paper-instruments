/*globals $, console, tangelo*/

var DEBUG = true,
	config,
	userid = localStorage.getItem("id"),
	currentSlide = localStorage.getItem("slide"),
    connectedToServer;

// Functions to call in all cases:
function loadConfig() {
    "use strict";
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
}

// Helper function
function connectToServer() {
	// Start / resume recording mouse actions for this user
	"use strict";
	var successful = false;
    
	if (userid === null) {
		$.ajax({
			url: "serverSide?operation=start",
			success: function (newId) {
				if (newId === "NO DB CONNECTION" || newId === "CAN'T CREATE ID") {
					if (DEBUG) {
						console.warn(newId);
					}
				} else {
					userid = newId;
					localStorage.setItem("id", newId);
					currentSlide = config.startingSlide;
					localStorage.setItem("slide", currentSlide);
					successful = true;
					console.log("Starting new session with id: " + newId);
				}
			},
			error: function () {
				if (DEBUG) {
					console.warn("TANGELO CONNECTION ERROR");
				}
			},
			async: false
		});
	} else {
		$.ajax({
			url: "serverSide?operation=resume",
			data: {
				userid: userid
			},
			success: function (lastSlide) {
				if (lastSlide === "NO DB CONNECTION" || lastSlide === "DB ERROR") {
					if (DEBUG) {
						console.warn(lastSlide);
					}
				} else if (lastSlide === "ID DOESN'T EXIST") {
					if (DEBUG) {
						console.warn(lastSlide + "; resetting localStorage and refreshing...");
					}
					localStorage.removeItem("id");
					localStorage.removeItem("slide");
					location.reload();
				} else {
                    if (lastSlide === "NO HISTORY") {
                        currentSlide = config.startingSlide;
                    } else {
					    currentSlide = lastSlide;
                    }
					localStorage.setItem("slide", currentSlide);
					if (DEBUG) {
					    console.log("Resuming session with id: " + userid);
                    }
                    successful = true;
				}
			},
			error: function () {
				if (DEBUG) {
					console.warn("TANGELO CONNECTION ERROR");
				}
			},
			async: false
		});
	}
	
    return successful;
}

loadConfig();
connectedToServer = connectToServer();

// HotSpot helper class
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