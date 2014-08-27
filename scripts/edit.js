/* globals jQuery, editHotSpots:true, getCSSRule, updatePreview */
"use strict";

// Handle collapsing / expanding the config panel
jQuery("#collapseBar").on("click", function (event) {
    var panel = jQuery("#configPanel"),
        collapsed = panel.attr('class');
    if (typeof collapsed !== typeof undefined && collapsed !== false) {
        panel.removeAttr('class');
        jQuery("#collapseBar img").attr("src", "images/collapse.png");
    } else {
        panel.attr("class", "collapsed");
        jQuery("#collapseBar img").attr("src", "images/expand.png");
    }
});

jQuery("#enableEdits").on("change", function (event) {
    if (event.target.checked === true) {
	Shape.SELECTED = -1;
    } else {
	Handle.clearAll();
	Shape.SELECTED = null;
	jQuery("#pathString").val('');
    }
    updatePreview();
});

jQuery("#pathString").on("change", function (event) {
    var s,
	domShape,
	classes;
    if (Shape.SELECTED !== null && Shape.SELECTED !== -1) {
	s = Shape.ALL[Shape.SELECTED];
	s.d = event.target.value;
	s.setD(s.extractSegments());
	s.initHandles();
	domShape = jQuery("#HotSpot" + s.hash);
	jQueryRemoveSvgClass(domShape, "selected");
	domShape.attr({
	    "d" : event.target.value
	});
    }
})

updatePreview();
getCSSRule('svg#hotSpots path').style['fill-opacity'] = 0.3;