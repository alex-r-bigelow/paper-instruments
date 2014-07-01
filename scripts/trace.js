/*globals $, console, tangelo, userid, currentSlide:true, DEBUG, config, createOption */

var currentStream = null,
	streamsToKill = [],
    RADIUS = 5,
    BUTTON_COLORS = {
        "NNN" : "#999",
        "YNN" : "#e41a1c",
        "NYN" : "#4daf4a",
        "NNY" : "#377eb8"
    };

function startTrace() {
    "use strict";
    var image = document.getElementById("image"),
        canvas = document.getElementById("overlay"),
        visContext = canvas.getContext('2d');
    
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
            image.setAttribute("src", "data/" + config.slides[currentSlide].image);
            canvas.setAttribute("width", $(window).width());
            canvas.setAttribute("height", $(window).height());
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
                    visContext.beginPath();
					visContext.arc(p.x, p.y, RADIUS, 0, 2 * Math.PI);
                    visContext.fill();
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

function traceSlide(slideName) {
    "use strict";
    
    currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
    
    if (currentStream !== null) {
		streamsToKill.splice(0, 0, currentStream);
        // small delay to let the old stream die out
        setTimeout(startTrace, 200);
	} else {
        startTrace();
    }
}

function initTrace() {
    "use strict";
    var s;
    
    for (s in config.slides) {
        if (config.slides.hasOwnProperty(s)) {
            createOption("slideSelect", s);
        }
    }
    
    traceSlide(currentSlide);
}

initTrace();