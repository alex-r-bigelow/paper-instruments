/*globals $, console, tangelo*/

var currentStream = null,
	streamsToKill = [],
	canvas,
	visContext;

function initVis() {
	"use strict";
    /*
    
    visContext = document.getElementById('heatmap');
	if (visContext !== null) {
		visContext = visContext.getContext('2d');
	}
    
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
initVis();