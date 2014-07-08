/*globals $, console, interact, tangelo*/

var DEBUG = true,
	config,
	userid = localStorage.getItem("id"),
	currentSlide = localStorage.getItem("slide"),
    connectedToServer,
    INTERACTIONS = {
        RIGHT_MOUSE : null,
        LEFT_MOUSE : null,
        CENTER_MOUSE : null
    },
    HOTSPOT_DELAY = 5000,
    hotspot_timeout,
    transitionCallback;

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
					currentSlide = config.startingSlide;
					localStorage.setItem("slide", currentSlide);
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
			success: function (lastSlide) {
				if (lastSlide === "NO DB CONNECTION" || lastSlide === "DB ERROR") {
					if (DEBUG === true && console !== undefined) {
						console.warn(lastSlide);
					}
				} else if (lastSlide === "ID DOESN'T EXIST") {
					if (DEBUG === true && console !== undefined) {
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

loadConfig();
connectedToServer = connectToServer();

// Interaction functions for preview.html and track.html
function interactWithSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg id='hotSpotAreas' class='hidden'>",
        i,
        h;
	
    if (transitionCallback !== undefined) {
        if (currentSlide !== slideName) {
            transitionCallback(currentSlide, slideName);
        }
    }
    for (i = 0; i < slide.hotSpots.length; i += 1) {
        h = slide.hotSpots[i];
        
        areas += "<path d='" + h.path + "' id='hotSpot_" + i + "'></path>";
	}
    areas += "</svg>";
    
	document.getElementById("image").setAttribute("src", "data/" + slide.image);
	document.getElementById("areas").innerHTML = areas;
    document.getElementById("hotSpotAreas").addEventListener('mousedown', interact);
    document.getElementById("hotSpotAreas").addEventListener('mousemove', interact);
    document.getElementById("hotSpotAreas").addEventListener('mouseup', interact);
    document.getElementById("hotSpotAreas").addEventListener('mousewheel', interact);
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
    if (hotspot_timeout !== undefined) {
        window.clearTimeout(hotspot_timeout);
    }
    hotspot_timeout = window.setTimeout(function () {
        document.getElementById('hotSpotAreas').setAttribute('class', 'showing');
    }, HOTSPOT_DELAY);
}

function interact(event) {
    "use strict";
    var index,
        id,
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
    if (event.target.getAttribute('id') === 'hotSpotAreas') {
        id = "(Empty Space)";
    } else {
        index = event.target.getAttribute('id');
        if (index === null || index.substring(0, 8) !== 'hotSpot_') {
            return;
        } else {
            index = Number(index.substr(8));
            id = config.slides[currentSlide].hotSpots[index].id;
        }
    }
    
    if (INTERACTIONS[button] === null && (event.type === "mousedown" || event.type === "mousewheel")) {
        INTERACTIONS[button] = id;
    } else if (INTERACTIONS[button] !== null && (event.type === "mouseup" || event.type === "mousewheel")) {
        if (config.slides[currentSlide].hasOwnProperty(button)) {
            actions = config.slides[currentSlide][button];
            for (i = 0; i < actions.length; i += 1) {
                if (actions[i].source === INTERACTIONS[button]) {
                    if ((actions[i].hasOwnProperty('target') === false &&
                            actions[i].source === id) ||
                            actions[i].target === id) {
                        interactWithSlide(actions[i].destination);
                        break;
                    }
                }
            }
        }
        INTERACTIONS[button] = null;
    } else if (INTERACTIONS.CENTER_MOUSE !== null && event.type === "mousemove") {
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