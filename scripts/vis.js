/*globals $, console, tangelo, userid, currentSlide, DEBUG */

var currentStream = null,
	streamsToKill = [],
	canvas,
	visContext;

function initStream() {
    "use strict";
    if (currentStream !== null) {
		streamsToKill.splice(0, 0, currentStream);
	}
	$.ajax({
		url: "serverSide?operation=countStream",
		data: {
			userid : userid,
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
			
			tangelo.stream.start("serverSide?operation=pollStream&userid=" + userid, function (key) {
				console.log(key);
                tangelo.stream.run(key, function (p) {
					if (streamsToKill.indexOf(key) !== -1) {
						streamsToKill.remove(key);
						return false;
					}
                    console.log(p);
                    p = JSON.parse(p);
					visContext.fillRect(p.x - 1, p.y - 1, 2, 2);
				}, 10);
			});
		},
		error: function (o, message, e) {
			if (DEBUG) {
				console.warn("error getting tracking data: " + message);
			}
		}
	});
}

function initVis() {
	"use strict";
    
    visContext = document.getElementById('heatmap');
	if (visContext !== null) {
		visContext = visContext.getContext('2d');
	}
    
    initStream();
}
initVis();