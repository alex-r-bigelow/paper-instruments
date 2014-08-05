/*globals $, console, config, currentSlide, DEBUG, INTERACTIONS, interactWithSlide, initInteraction */

var slideHistory = [],
    dragStart = null;

// store the last slide, load the next
function updateHistory(prevSlide, nextSlide) {
    "use strict";
    if (slideHistory.length > 0 && nextSlide === slideHistory[slideHistory.length - 1]) {
        slideHistory.pop();
    } else {
        slideHistory.push(prevSlide);
    }
    if (slideHistory.length > 0) {
        document.getElementById("goBack").removeAttribute("disabled");
    } else {
        document.getElementById("goBack").setAttribute("disabled", "true");
    }
}

function goStart(event) {
    "use strict";
    interactWithSlide(config.startingSlide);
    slideHistory = [];
    document.getElementById("goBack").setAttribute("disabled", "true");
}

function goBack(event) {
    "use strict";
    var prevSlide;
    if (slideHistory.length > 0) {
        prevSlide = slideHistory[slideHistory.length - 1];
    } else {
        prevSlide = config.startingSlide;
    }
    interactWithSlide(prevSlide);
}

initInteraction(updateHistory);