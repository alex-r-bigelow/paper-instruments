/*globals $, console, tangelo, config, HotSpot, currentSlide:true */

// Edit a slide
function editSlide(slideName) {
	"use strict";
	var slide = config.slides[slideName],
		areas = "<svg>",
		hotSpot;
	
	HotSpot.SELECTED_HASH = null;
	
    slide.hotSpots.forEach(function (a) {
		hotSpot = new HotSpot(a);
		areas += "<path id='hotSpot_" + hotSpot.hash + "' " +
			"d='" + a.path + "' " +
			"onmousedown='HotSpot.ALL[\"" + hotSpot.hash + "\"]" +
			".startDragging(event);'></path>";
	});
	
	areas += "<g id='handles'></g>";
	
	document.getElementById("image").setAttribute("src", "data/" + slide.image);
	document.getElementById("areas").innerHTML = areas;
	
	currentSlide = slideName;
	localStorage.setItem("slide", currentSlide);
	document.getElementById("slideSelect").value = currentSlide;
	document.getElementById("slideName").value = currentSlide;
	document.getElementById("slideName").removeAttribute("class");
	document.getElementById("slideImage").value = slide.image;
	document.getElementById("hotSpotType").removeAttribute("onchange");
    document.getElementById("hotSpotConfig").setAttribute("hidden", "true");
}

function createSlideOption(selectId, slideName) {
	"use strict";
	var op = document.createElement("option");
	op.value = slideName;
	op.textContent = slideName;
	op.id = selectId + slideName;
	document.getElementById(selectId).appendChild(op);
}

function addNewSlide() {
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
	createSlideOption("slideSelect", slideName);
	createSlideOption("targetSlideSelect", slideName);
	
	editSlide(slideName);
}

function addHotSpot() {
    "use strict";
    var configElement = {
            spotType : HotSpot.LEFT,
            path : "M20,20L40,20L40,40L20,40Z",
            targetSlide : currentSlide
        };
    
    config.slides[currentSlide].hotSpots.push(configElement);
    editSlide(currentSlide);
}

function deleteHotSpot() {
    "use strict";
    if (HotSpot.SELECTED_HASH === null) {
        return;
    }
    config.slides[currentSlide].hotSpots.pop(HotSpot.ALL[HotSpot.SELECTED_HASH].configElement);
    editSlide(currentSlide);
}

function updateSlideName(event) {
	"use strict";
	var newSlide = event.target.value,
		temp;
	if (config.slides.hasOwnProperty(newSlide)) {
		event.target.value = currentSlide;
		event.target.setAttribute("class", "error");
		return;
	} else {
		event.target.removeAttribute("class");
	}
	
	config.slides[newSlide] = config.slides[currentSlide];
	delete config.slides[currentSlide];
	
	temp = document.getElementById("slideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "slideSelect" + newSlide;
	
	temp = document.getElementById("targetSlideSelect" + currentSlide);
	temp.value = newSlide;
	temp.textContent = newSlide;
	temp.id = "targetSlideSelect" + newSlide;
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

function initEditor() {
	"use strict";
	var slideName,
		slideSelect = document.getElementById("slideSelect"),
		op;
	
	for (slideName in config.slides) {
		if (config.slides.hasOwnProperty(slideName)) {
			createSlideOption("slideSelect", slideName);
			createSlideOption("targetSlideSelect", slideName);
		}
	}
	slideSelect.addEventListener("change", function (event) {
		editSlide(slideSelect.value);
	});
	
	editSlide(currentSlide);
}
initEditor();