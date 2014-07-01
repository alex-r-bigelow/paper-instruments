/*globals $, console, tangelo, userid, currentSlide:true, DEBUG, config */

var currentStream = null,
	streamsToKill = [],
    RADIUS = 10,
    BUTTON_COLORS = {
        "NNN" : "#999",
        "YNN" : "#e41a1c",
        "NYN" : "#4daf4a",
        "NNY" : "#377eb8"
    };

function traceSlide(slideName) {
    "use strict";
	var slide = config.slides[slideName],
        image = $("#image"),
        canvas = document.getElementById("overlay"),
        visContext;
    
    image.attr("src", "data/" + slide.image);
    canvas.setAttribute("width", $(window).width());
    canvas.setAttribute("height", $(window).height());
    visContext = canvas.getContext('2d');
    
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
    
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
			if (numResults === "COULDN'T GET DATA") {
				if (DEBUG) {
					console.warn("error getting tracking data: " + numResults);
				}
				return;
			}
			visContext.globalAlpha = 1 / Math.log(numResults);
			
			tangelo.stream.start("serverSide?operation=pollStream&userid=" + userid, function (key) {
                tangelo.stream.run(key, function (p) {
                    var i = streamsToKill.indexOf(key);
					if (i !== -1 || p === undefined) {
                        if (i !== -1) {
						    streamsToKill.splice(streamsToKill.indexOf(key), 1);
                        }
						return false;
					}
                    p = JSON.parse(p);
                    visContext.fillStyle = BUTTON_COLORS[p.b];
					visContext.fillRect(p.x - RADIUS, p.y - RADIUS, 2 * RADIUS, 2 * RADIUS);
				}, 1);
			});
		},
		error: function (o, message, e) {
			if (DEBUG) {
				console.warn("error getting tracking data: " + message);
			}
		}
	});
}

traceSlide(currentSlide);