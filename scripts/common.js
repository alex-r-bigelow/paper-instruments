/*globals $, console, alert, tangelo*/

var DEBUG = true,
	config,
	userid = localStorage.getItem("id"),
	currentSlide = localStorage.getItem("slide"),
    connectedToServer,
    isSupported = false,
    supportedBrowsers = [
        "Chrome"
    ],
    INTERACTIONS = {
        RIGHT_MOUSE : null,
        LEFT_MOUSE : null,
        CENTER_MOUSE : null
    },
    transitionCallback;

// Functions to call in all cases:
function checkBrowser() {
    "use strict";
    supportedBrowsers.forEach(function (b) {
        if (navigator.userAgent.indexOf(b) !== -1) {
            isSupported = true;
        }
    });
    if (isSupported === false) {
        alert('This page wasn\'t designed for your current browser (Chrome is ideal); use at your own risk.');
    }
}

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

checkBrowser();
loadConfig();
connectedToServer = connectToServer();

// Interaction functions for preview.html and track.html
function interactWithSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg id='hotSpotAreas' onmousedown='interact(event)'" +
            " onmousemove='interact(event)' onmouseup='interact(event)'>",
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
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
}

function interact(event) {
    "use strict";
    var index,
        id,
        button,
        actions,
        i;
    
    if (event.button === 0) {
        button = 'LEFT_MOUSE';
    } else if (event.button === 1) {
        button = 'CENTER_MOUSE';
    } else if (event.button === 2) {
        button = 'RIGHT_MOUSE';
    }
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
    
    if (INTERACTIONS[button] === null && event.type === "mousedown") {
        INTERACTIONS[button] = id;
    } else if (INTERACTIONS[button] !== null && event.type === "mouseup") {
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
    }
}

function initInteraction(callback) {
	"use strict";
    //transitionCallback = callback;
    
	// Always suppress the default browser right-click behavior
	document.addEventListener('contextmenu', function (e) {
		e.preventDefault();
		return false;
	}, false);
	// Also suppress selection cursor when dragging
	document.addEventListener('mousedown', function (e) {
		e.preventDefault();
	}, false);
    
    //document.addEventListener('mousemove', interact, false);
    //document.addEventListener('mousedown', interact, false);
    //document.addEventListener('mouseup', interact, false);
    //document.body.addEventListener('touchstart', interact, false);
    //document.body.addEventListener('touchend', interact, false);
	
	interactWithSlide(currentSlide);
}