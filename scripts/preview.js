/*globals $, console, tangelo, config, HotSpot, currentSlide:true, userid, DEBUG, connectedToServer */

var history = [],
    dragStartId = null;

// store the last slide, load the next
function nextSlide(slideName) {
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
    history.push(currentSlide);
    if (history.length > 1) {
        document.getElementById("goBack").removeAttribute("disabled");
    }
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
}

function leftClick(event, targetSlide) {
	"use strict";
	if (event.button === 0) {
		nextSlide(targetSlide);
	}
}

function rightClick(event, targetSlide) {
	"use strict";
	if (event.button === 2) {
		nextSlide(targetSlide);
	}
}

function dragStart(event, id) {
	"use strict";
	dragStartId = id;
}

function dragTarget(event, targetSlide, sourceIds) {
	"use strict";
	if (sourceIds.indexOf(dragStartId) !== -1) {
		nextSlide(targetSlide);
	}
}

function goStart(event) {
    "use strict";
    nextSlide(config.startingSlide);
}

function goBack(event) {
    "use strict";
    var lastSlide;
    if (history.length > 1) {
        currentSlide = history.pop();
        if (history.length <= 1) {
            document.getElementById("goBack").setAttribute("disabled", "true");
        }
    }
}

function initPreview() {
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
	
	nextSlide(currentSlide);
}
initPreview();