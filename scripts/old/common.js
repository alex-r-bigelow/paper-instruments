/*globals $, console, interact, tangelo*/

var DEBUG = true,
	config,
	userid = localStorage.getItem("id"),
	currentStates = localStorage.getItem("states"),
    connectedToServer,
    SUPPORTED_EVENTS = [
        "mousedown",
        "mouseup",
        "mousewheel",
        "mousemove"
    ],
    INTERACTIONS = {
        RIGHT_MOUSE : null,
        LEFT_MOUSE : null,
        CENTER_MOUSE : null
    },
    HOTSPOT_DELAY = 4000,
    hotspot_timeout,
    transitionCallback;

// HotSpot class
function HotSpot(tree, state, id, path) {
	"use strict";
	var self = this,
        hotSpots = document.getElementById("hotSpots");
	
    if (HotSpot.ALL.hasOwnProperty(id)) {
        if (DEBUG) {
            console.warn("created duplicate HotSpot id!");
        }
    }
    self.id = id;
	HotSpot.ALL[self.id] = self;
	
	self.path = path;
	self.segments = HotSpot.extractSegments(self.path);
    
    self.tree = tree;
    self.state = state;
    
    self.domElement = document.createElement("path");
    self.domElement.setAttribute('id', 'hotSpot_' + self.id);
    self.domElement.setAttribute('d', self.path);
    self.domElement.setAttribute('class', 'hidden');
    hotSpots.appendChild(self.domElement);
}
HotSpot.ALL = {};
HotSpot.SELECTED_ID = null;

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

/*HotSpot.logId = function (event) {
    "use strict";
    event.target.oldValue = event.target.value;
};

HotSpot.replaceId = function (event) {
    "use strict";
    var newId = event.target.value,
        oldId = event.target.oldValue,
        a,
        i,
        helper = function (action) {
            if (action.source === oldId) {
                action.source = newId;
            }
            if (action.hasOwnProperty('target') && action.target === oldId) {
                action.target = newId;
            }
        };
    if (newId.indexOf(" ") !== -1 || newId === "(Same as source)" || newId === "(Empty Space)") {
        event.target.value = oldId;
        event.target.setAttribute("class", "error");
        return;
    }
    for (i = 0; i < config.slides[currentSlide].hotSpots.length; i += 1) {
        a = config.slides[currentSlide].hotSpots[i].id;
        if (newId === a) {
            event.target.value = oldId;
            event.target.setAttribute("class", "error");
            return;
        } else if (oldId === a) {
            config.slides[currentSlide].hotSpots[i].id = newId;
        }
    }
    event.target.removeAttribute("class");
    for (a in INTERACTIONS) {
        if (INTERACTIONS.hasOwnProperty(a) && config.slides[currentSlide].hasOwnProperty(a)) {
            config.slides[currentSlide][a].forEach(helper);
        }
    }
    editSlide(currentSlide);
};*/

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

HotSpot.prototype.select = function () {
    "use strict";
    var self = this;
    if (HotSpot.SELECTED_ID !== null) {
		document.getElementById("hotSpot_" + HotSpot.SELECTED_ID).removeAttribute("class");
	}
	HotSpot.SELECTED_ID = self.id;
	document.getElementById("hotSpot_" + self.id).setAttribute("class", "selected");
	document.getElementById("handles").innerHTML = self.generateHandles();
	document.getElementById("hotSpotId").removeAttribute("disabled");
    document.getElementById("hotSpotId").value = self.id;
    document.getElementById("deleteHotSpotButton").removeAttribute("disabled");
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
	self.select();
    
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

// Functions to call in all cases:
function loadConfig() {
    "use strict";
    var startValid = true,
        images = document.getElementById("images"),
        imageElement,
        tree,
        state,
        id,
        dummy;
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
    if (currentStates !== null) {
        currentStates = config.startingStates;
        localStorage.setItem("states", currentStates);
    }
    for (tree in config.stateTrees) {
        if (config.stateTrees.hasOwnProperty(tree)) {
            imageElement = document.createElement("img");
            imageElement.setAttribute("src", currentStates[tree]);
            imageElement.setAttribute("z-index", config.stateTrees[tree]["z-index"]);
            images.appendChild(imageElement);
            
            for (state in config.stateTrees[tree]) {
                if (config.stateTrees[tree].hasOwnProperty(state)) {
                    for (id in config.stateTrees[tree][state].hotSpots) {
                        if (config.stateTrees[tree][state].hotSpots.hasOwnProperty(id)) {
                            dummy = new HotSpot(tree, state, id, config.stateTrees[tree][state].hotSpots[id]);
                        }
                    }
                }
            }
        }
    }
}

// Helper functions
function createOption(selectId, slideName) {
	"use strict";
	var op = document.createElement("option");
	op.value = slideName;
	op.textContent = slideName;
	op.id = selectId + slideName;
	document.getElementById(selectId).appendChild(op);
}

function connectToServer() {
	// Start / resume recording mouse actions for this user
	"use strict";
	var successful = false;
    
	if (userid === null) {
		$.ajax({
			url: "serverSide?operation=start",
			success: function (newId) {
				if (newId === "NO DB CONNECTION" || newId === "CAN'T CREATE ID") {
					if (DEBUG === true && console !== undefined) {
						console.warn(newId);
					}
				} else {
					userid = newId;
					localStorage.setItem("id", newId);
					currentStates = config.startingStates;
					localStorage.setItem("states", currentStates);
					successful = true;
                    if (DEBUG === true && console !== undefined) {
					    console.log("Starting new session with id: " + newId);
                    }
				}
			},
			error: function () {
				if (DEBUG === true && console !== undefined) {
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
			success: function (lastStates) {
				if (lastStates === "NO DB CONNECTION" || lastStates === "DB ERROR") {
					if (DEBUG === true && console !== undefined) {
						console.warn(lastStates);
					}
				} else if (lastStates === "ID DOESN'T EXIST") {
					if (DEBUG === true && console !== undefined) {
						console.warn(lastStates + "; resetting localStorage and refreshing...");
					}
					localStorage.removeItem("id");
					localStorage.removeItem("states");
					location.reload();
				} else {
                    if (lastStates === "NO HISTORY") {
                        currentStates = config.startingStates;
                    } else {
					    currentStates = lastStates;
                    }
					localStorage.setItem("states", currentStates);
					if (DEBUG === true && console !== undefined) {
					    console.log("Resuming session with id: " + userid);
                    }
                    successful = true;
				}
			},
			error: function () {
				if (DEBUG === true && console !== undefined) {
					console.warn("TANGELO CONNECTION ERROR");
				}
			},
			async: false
		});
	}
	
    return successful;
}

// Interaction functions for preview.html and track.html
function performTransitions(transitions) {
	"use strict";
	var hotSpots = document.getElementById("hotSpots"),
        transitionHappened = false,
        tree,
        id;
	
    if (transitionCallback !== undefined) {
        for (tree in transitions) {
            if (transitions.hasOwnProperty(tree) && currentStates[tree] !== transitions[tree]) {
                transitionHappened = true;
                currentStates[tree] = transitions[tree];
                if (config.stateTrees[tree][currentStates[tree]].hasOwnProperty("image")) {
                    document.getElementById(tree).setAttribute("src", config.stateTrees[tree][currentStates[tree]].image);
                } else {
                    document.getElementById(tree).removeAttribute("src");
                }
            }
        }
        localStorage.setItem("state", currentStates);
        if (transitionHappened === true) {
            transitionCallback(transitions);
        }
    }
    for (id in HotSpot.ALL) {
        if (currentStates[HotSpot.ALL[id].tree] === HotSpot.ALL[id].state) {
            HotSpot.ALL[id].domElement.setAttribute("class", "showing");
        } else {
            HotSpot.ALL[id].domElement.setAttribute("class", "hidden");
        }
	}
    SUPPORTED_EVENTS.forEach(function (eventType) {
        hotSpots.addEventListener(eventType, interact);
    });
    hotSpots.setAttribute('class', 'hidden');
    if (hotspot_timeout !== undefined) {
        window.clearTimeout(hotspot_timeout);
    }
    hotspot_timeout = window.setTimeout(function () {
        hotSpots.setAttribute('class', 'showing');
    }, HOTSPOT_DELAY);
}

function interact(event) {
    "use strict";
    var id,
        button,
        actions,
        i;
    if ((event.type === "mousedown" || event.type === "mouseup") && event.button === 0) {
        button = 'LEFT_MOUSE';
    } else if (event.button === 1) {
        button = 'CENTER_MOUSE';
    } else if (event.button === 2) {
        button = 'RIGHT_MOUSE';
    } else if (event.hasOwnProperty('wheelDelta') && event.wheelDelta !== 0) {
        button = 'CENTER_MOUSE';
    }/* 
    Firefox only... but it messes with Chrome, so I'll just keep Chrome
    else if (event.hasOwnProperty('detail') && event.detail !== 0) {
        button = 'CENTER_MOUSE';
    }*/
    if (event.target.getAttribute('id') === 'hotSpots') {
        id = "(Empty Space)";
    } else {
        id = event.target.getAttribute('id');
        if (id === null || id.substring(0, 8) !== 'hotSpot_') {
            // Don't do anything if we clicked a hotSpot that doesn't do anything;
            // it isn't empty space
            return;
        } else {
            id = index.substr(8);
        }
    }
    
    if (INTERACTIONS[button] === null && event.type === "mousedown" || event.type === "mousewheel") {
        INTERACTIONS[button] = id;
    }
    
    for (tree in config.stateTrees) {
        if (config.stateTrees.hasOwnProperty(tree) &&
                config.stateTrees[tree][currentStates[tree]].hasOwnProperty(button)) {
            actions = config.stateTrees[tree][currentStates[tree]][button];
            for (i = 0; i < actions.length; i += 1) {
                if (actions[i].targets.indexOf(id) !== -1 && actions[i].types.indexOf(event.type) !== -1) {
                    if (actions[i].hasOwnProperty('sources') && actions[i].sources.indexOf(INTERACTIONS[button]) === -1) {
                        continue;
                    }
                    if (actions[i].hasOwnProperty('validWhen')) {
                        isValid = true;
                        for (tree2 in actions[i].validWhen) {
                            if (actions[i].validWhen.hasOwnProperty(tree2) &&
                                   actions[i].validWhen[tree2] !== currentStates[tree2]) {
                                isValid = false;
                                break;
                            }
                        }
                        if (isValid !== true) {
                            continue;
                        }
                    }
                    performTransitions(actions[i].transitions);
                    break;
                }
            }
        }
    }
    
    if (INTERACTIONS[button] !== null && event.type === "mouseup") {
        INTERACTIONS[button] = null;
    }
    
    if (INTERACTIONS.CENTER_MOUSE !== null && event.type === "mousemove") {
        // there's no mouseup equivalent for mousewheel, so just reset it next time the
        // mouse moves
        INTERACTIONS.CENTER_MOUSE = null;
    }
}

function initInteraction(callback) {
	"use strict";
    transitionCallback = callback;
    
	// Always suppress the default browser right-click behavior
	document.addEventListener('contextmenu', function (e) {
		e.preventDefault();
		return false;
	}, false);
	// Also suppress selection cursor when dragging
	document.addEventListener('mousedown', function (e) {
		e.preventDefault();
	}, false);
    // Also suppress the default mouse wheel behavior
    document.addEventListener('mousewheel', function (e) {
        e.preventDefault();
    });
	
	interactWithSlide(currentSlide);
}

loadConfig();
connectedToServer = connectToServer();