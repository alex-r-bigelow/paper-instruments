/*globals $, console, config, DEBUG, currentSlide:true, INTERACTIONS, createOption, editSlide */

var currentAction = {
        button : null,
        index : 0,
        toString : function () {
            "use strict";
            return currentAction.button + " " + String(currentAction.index);
        }
    };

// HotSpot class
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

HotSpot.logId = function (event) {
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

HotSpot.prototype.select = function () {
    "use strict";
    var self = this;
    if (HotSpot.SELECTED_HASH !== null) {
		document.getElementById("hotSpot_" + HotSpot.SELECTED_HASH).removeAttribute("class");
	}
	HotSpot.SELECTED_HASH = self.hash;
	document.getElementById("hotSpot_" + self.hash).setAttribute("class", "selected");
	document.getElementById("handles").innerHTML = self.generateHandles();
	document.getElementById("hotSpotId").removeAttribute("disabled");
    document.getElementById("hotSpotId").value = self.configElement.id;
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

// General functions

function switchAction(newAction) {
    "use strict";
    var slide = config.slides[currentSlide],
        actionSelect = document.getElementById("actionSelect"),
        actionButtonSelect = document.getElementById("actionButtonSelect"),
        actionSourceSelect = document.getElementById("actionSourceSelect"),
        actionTargetSelect = document.getElementById("actionTargetSelect"),
        destinationSlideSelect = document.getElementById("destinationSlideSelect"),
        temp;
    
    if (typeof newAction === 'string') {
        temp = newAction.split(" ");
        currentAction.index = Number(temp.pop());
        currentAction.button = temp.join(" ");
    }
    
    if (newAction !== null) {
        document.getElementById("deleteActionButton").removeAttribute("disabled");
        document.getElementById("actionButtonSelect").removeAttribute("disabled");
        document.getElementById("actionSourceSelect").removeAttribute("disabled");
        document.getElementById("actionTargetSelect").removeAttribute("disabled");
        document.getElementById("destinationSlideSelect").removeAttribute("disabled");
        
        actionButtonSelect.removeAttribute("onchange");
        actionSourceSelect.removeAttribute("onchange");
        actionSourceSelect.options.length = 0;
        actionTargetSelect.removeAttribute("onchange");
        actionTargetSelect.options.length = 0;
        destinationSlideSelect.removeAttribute("onchange");
        
        createOption("actionSourceSelect", "(Empty Space)");
        createOption("actionTargetSelect", "(Same as source)");
        createOption("actionTargetSelect", "(Empty Space)");
        slide.hotSpots.forEach(function (h) {
            createOption("actionSourceSelect", h.id);
            createOption("actionTargetSelect", h.id);
        });
        actionButtonSelect.value = currentAction.button;
        actionSourceSelect.value = slide[currentAction.button][currentAction.index].source;
        if (slide[currentAction.button][currentAction.index].hasOwnProperty("target")) {
            actionTargetSelect.value = slide[currentAction.button][currentAction.index].target;
        } else {
            actionTargetSelect.selectedIndex = 0;
        }
        destinationSlideSelect.value = slide[currentAction.button][currentAction.index].destination;

        actionButtonSelect.setAttribute("onchange", "changeButton(event);");
        actionSourceSelect.setAttribute("onchange", "changeSource(event);");
        actionTargetSelect.setAttribute("onchange", "changeTarget(event);");
        destinationSlideSelect.setAttribute("onchange", "changeDestination(event);");
    } else {
        currentAction.index = 0;
        currentAction.button = null;
        
        document.getElementById("deleteActionButton").setAttribute("disabled", "true");
        document.getElementById("actionButtonSelect").setAttribute("disabled", "true");
        document.getElementById("actionSourceSelect").setAttribute("disabled", "true");
        document.getElementById("actionTargetSelect").setAttribute("disabled", "true");
        document.getElementById("destinationSlideSelect").setAttribute("disabled", "true");
    }
}

function editSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
        slideSelect = document.getElementById("slideSelect"),
        destinationSlideSelect = document.getElementById("destinationSlideSelect"),
        otherSlide,
		hotSpotAreas = "<svg>",
		hotSpot,
        i,
        j,
        foundIndex = false,
        index = 0,
        actionSelect = document.getElementById("actionSelect"),
        newSelection;
	
    // slides
    document.getElementById("image").setAttribute("src", "data/" + slide.image);
	document.getElementById("slideName").value = slideName;
	document.getElementById("slideName").removeAttribute("class");
	document.getElementById("slideImage").value = slide.image;
    
    slideSelect.removeAttribute("onchange");
    destinationSlideSelect.removeAttribute("onchange");
    slideSelect.options.length = 0;
    destinationSlideSelect.options.length = 0;
    for (otherSlide in config.slides) {
		if (config.slides.hasOwnProperty(otherSlide)) {
			createOption("slideSelect", otherSlide);
			createOption("destinationSlideSelect", otherSlide);
		}
	}
    slideSelect.value = slideName;
    slideSelect.setAttribute("onchange", "editSlide(event.target.value);");
    destinationSlideSelect.setAttribute("onchange", "changeDestination(event);");
    
    // hotspots
    if (slideName !== currentSlide || HotSpot.SELECTED_HASH === null) {
        HotSpot.SELECTED_HASH = null;
        document.getElementById("hotSpotId").setAttribute("disabled", "true");
        document.getElementById("deleteHotSpotButton").setAttribute("disabled", "true");
    }
    
    slide.hotSpots.forEach(function (a) {
		hotSpot = new HotSpot(a);
		hotSpotAreas += "<path id='hotSpot_" + hotSpot.hash + "' " +
			"d='" + a.path + "' " +
			"onmousedown='HotSpot.ALL[\"" + hotSpot.hash + "\"]" +
			".startDragging(event);'></path>";
        if (HotSpot.SELECTED_HASH !== null && hotSpot.configElement.id === HotSpot.ALL[HotSpot.SELECTED_HASH].configElement.id) {
            newSelection = hotSpot;
        }
	});
	hotSpotAreas += "<g id='handles'></g>";
	document.getElementById("areas").innerHTML = hotSpotAreas;
	
    if (newSelection !== undefined) {
        HotSpot.SELECTED_HASH = null;
        newSelection.select();
    }
    
    // actions
    if (slideName !== currentSlide) {
        currentAction = {
            button : null,
            index : 0
        };
    }
    actionSelect.removeAttribute("onchange");
    actionSelect.options.length = 0;
    
    for (i in INTERACTIONS) {
        if (INTERACTIONS.hasOwnProperty(i) && config.slides[slideName].hasOwnProperty(i)) {
            for (j = 0; j < config.slides[slideName][i].length; j += 1) {
                if (j === currentAction.index && (currentAction.button === null || currentAction.button === i)) {
                    foundIndex = true;
                    if (currentAction.button === null) {
                        currentAction.button = i;
                    }
                }
                if (foundIndex === false) {
                    index += 1;
                }
                createOption("actionSelect", i + " " + String(j));
            }
        }
    }
        
    // finalize
	currentSlide = slideName;
	localStorage.setItem("slide", slideName);
    
    if (foundIndex === false) {
        switchAction(null);
    } else {
        actionSelect.selectedIndex = index;
        switchAction(currentAction);
    }
    actionSelect.setAttribute("onchange", "switchAction(event.target.value);");
}

function changeButton(event) {
    "use strict";
    var newButton = event.target.value,
        action = config.slides[currentSlide][currentAction.button].splice(currentAction.index, 1)[0];
    if (config.slides[currentSlide][currentAction.button].length === 0) {
        delete config.slides[currentSlide][currentAction.button];
    }
    if (config.slides[currentSlide].hasOwnProperty(newButton) === false) {
        config.slides[currentSlide][newButton] = [];
    }
    currentAction.index = config.slides[currentSlide][newButton].length;
    config.slides[currentSlide][newButton].push(action);
    currentAction.button = newButton;
    editSlide(String(currentSlide));
}

function changeSource(event) {
    "use strict";
    config.slides[currentSlide][currentAction.button][currentAction.index].source = event.target.value;
}

function changeTarget(event) {
    "use strict";
    if (event.target.selectedIndex === 0) {
        delete config.slides[currentSlide][currentAction.button][currentAction.index].target;
    } else {
        config.slides[currentSlide][currentAction.button][currentAction.index].target = event.target.value;
    }
}

function changeDestination(event) {
    "use strict";
    config.slides[currentSlide][currentAction.button][currentAction.index].destination = event.target.value;
}

function addSlide() {
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
		"hotSpots" : []
	};
	createOption("slideSelect", slideName);
	createOption("destinationSlideSelect", slideName);
	
	editSlide(slideName);
}

function deleteSlide() {
    "use strict";
    var slideList = Object.keys(config.slides),
        temp = currentSlide;
    
    if (slideList.length <= 1) {
        addSlide();
        delete config.slides[temp];
        editSlide(currentSlide);
    } else {
        delete config.slides[currentSlide];
        temp = slideList[0];
        if (temp === currentSlide) {
            temp = slideList[1];
        }
        editSlide(temp);
    }
}

function addHotSpot() {
    "use strict";
    var configElement = {
            id : String(HotSpot.HASH),
            path : "M20,20L40,20L40,40L20,40Z"
        },
        hash;
    
    config.slides[currentSlide].hotSpots.push(configElement);
    editSlide(currentSlide);
    for (hash in HotSpot.ALL) {
        if (HotSpot.ALL.hasOwnProperty(hash) && HotSpot.ALL[hash].configElement === configElement) {
            HotSpot.ALL[hash].select();
            break;
        }
    }
}

function deleteHotSpot() {
    "use strict";
    var element,
        index;
    if (HotSpot.SELECTED_HASH === null) {
        return;
    }
    element = HotSpot.ALL[HotSpot.SELECTED_HASH].configElement;
    index = config.slides[currentSlide].hotSpots.indexOf(element);
    config.slides[currentSlide].hotSpots.splice(index, 1);
    editSlide(currentSlide);
}

function addAction() {
    "use strict";
    if (config.slides[currentSlide].hasOwnProperty("LEFT_MOUSE") === false) {
        config.slides[currentSlide].LEFT_MOUSE = [];
    }
    currentAction.button = "LEFT_MOUSE";
    currentAction.index = config.slides[currentSlide].LEFT_MOUSE.length;
    config.slides[currentSlide].LEFT_MOUSE.push({
        source : null,
        destination : currentSlide
    });
    
    editSlide(currentSlide);
}

function deleteAction() {
    "use strict";
    if (currentAction.button === null) {
        return;
    }
    if (config.slides[currentSlide][currentAction.button].length === 1) {
        delete config.slides[currentSlide][currentAction.button];
    } else {
        config.slides[currentSlide][currentAction.button].splice(currentAction.index, 1);
    }
    currentAction.button = null;
    currentAction.index = 0;
    editSlide(currentSlide);
}

function updateSlideName(event) {
	"use strict";
	var newSlide = event.target.value,
		temp,
        s,
        a;
	if (config.slides.hasOwnProperty(newSlide)) {
		event.target.value = currentSlide;
		event.target.setAttribute("class", "error");
		return;
	} else {
		event.target.removeAttribute("class");
	}
	
	config.slides[newSlide] = config.slides[currentSlide];
	delete config.slides[currentSlide];
    
    if (config.startingSlide === currentSlide) {
        config.startingSlide = newSlide;
    }
    for (s in config.slides) {
        if (config.slides.hasOwnProperty(s)) {
            for (a in INTERACTIONS) {
                if (INTERACTIONS.hasOwnProperty(a) && config.slides[s].hasOwnProperty(a)) {
                    if (config.slides[s][a].destination === currentSlide) {
                        config.slides[s][a].destination = newSlide;
                    }
                }
            }
        }
    }
	
	temp = document.getElementById("slideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "slideSelect" + newSlide;
	
	temp = document.getElementById("destinationSlideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "destinationSlideSelect" + newSlide;
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

editSlide(currentSlide);